#!/usr/bin/env python3
"""
Sequential Inference Server for MedAI Diagnostics.

Cloud-optimised: loads each model one-at-a-time, runs inference + Grad-CAM,
then releases it from RAM before loading the next one. This keeps peak memory
usage under 600 MB so the server runs comfortably on Render's free 512 MB tier.

On local machines with plenty of RAM the behaviour is identical – results from
every model are collected before any response is sent, so the UI always receives
the full three-model ensemble exactly as before.
"""

import gc
import os
import sys
import uuid
import numpy as np
from io import BytesIO
from pathlib import Path
from PIL import Image

# Suppress TensorFlow verbose output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import tensorflow as tf
from tensorflow import keras
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import Grad-CAM utilities (in the same directory)
sys.path.insert(0, os.path.dirname(__file__))
from utils_gradcam import get_last_conv_layer, compute_gradcam, generate_overlay, save_heatmaps

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_DIR    = Path(__file__).parent.parent   # SE_Project root
MODELS_DIR  = BASE_DIR / 'models'
HEATMAPS_DIR = BASE_DIR / 'backend' / 'public' / 'heatmaps'
PORT        = int(os.environ.get('FLASK_PORT', 5001))
CLASS_LABELS = ['benign', 'malignant', 'normal']

MODEL_CONFIGS = {
    'resnet101': {
        'path': MODELS_DIR / 'resnet101_breast_ultrasound.keras',
        'input_size': (224, 224),
    },
    'inceptionv3': {
        'path': MODELS_DIR / 'inceptionv3_breast_ultrasound.keras',
        'input_size': (224, 224),
    },
    'efficientnetb0': {
        'path': MODELS_DIR / 'efficientnetb0_breast_ultrasound.keras',
        'input_size': (224, 224),
    },
}

# ─── Startup: just validate which models exist on disk ────────────────────────

AVAILABLE_MODELS: list = []

def scan_available_models():
    """Scan disk at startup; do NOT load anything into RAM yet."""
    HEATMAPS_DIR.mkdir(parents=True, exist_ok=True)
    for model_name, config in MODEL_CONFIGS.items():
        if config['path'].exists():
            AVAILABLE_MODELS.append(model_name)
            print(f"[INFO] Model found on disk: {model_name}", flush=True)
        else:
            print(f"[WARN] Model NOT found, will skip: {config['path']}", flush=True)
    print(f"\n[INFO] ✅ Ready. Available models: {AVAILABLE_MODELS}. Listening on port {PORT}.\n", flush=True)

# ─── Inference Helpers ────────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes, target_size: tuple) -> np.ndarray:
    """Decode image bytes, resize, normalise to [0,1]."""
    img = Image.open(BytesIO(image_bytes)).convert('RGB')
    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # (1, H, W, 3)


def run_single_model_sequential(model_name: str, image_bytes: bytes, request_id: str) -> dict:
    """
    Load ONE model → run inference + Grad-CAM → immediately unload from RAM.
    Returns only lightweight Python primitives (strings, floats, dicts).
    """
    config = MODEL_CONFIGS[model_name]
    model_path = str(config['path'])

    print(f"[INFO] Loading {model_name} ...", flush=True)
    model = keras.models.load_model(model_path)
    print(f"[INFO] {model_name} loaded ✓", flush=True)

    try:
        img_array = preprocess_image(image_bytes, config['input_size'])

        # ── Inference ──────────────────────────────────────────────────────────
        predictions = model.predict(img_array, verbose=0)
        probs = np.clip(predictions[0], 1e-7, 1.0)
        probs = probs / np.sum(probs)

        top_index  = int(np.argmax(probs))
        top_class  = CLASS_LABELS[top_index]
        confidence = float(probs[top_index])
        prob_dict  = {CLASS_LABELS[i]: float(probs[i]) for i in range(len(CLASS_LABELS))}

        result = {
            'probs': prob_dict,
            'top_class': top_class,
            'confidence': confidence,
            'top_index': top_index,
            'gradcam_url': None,
        }

        # ── Grad-CAM ───────────────────────────────────────────────────────────
        try:
            last_conv = get_last_conv_layer(model, model_name)
            if last_conv:
                heatmap = compute_gradcam(model, img_array, last_conv, top_index)
                tmp_path = HEATMAPS_DIR / f'tmp_{request_id}.png'
                img_pil = Image.open(BytesIO(image_bytes)).convert('RGB')
                img_pil.save(str(tmp_path))
                heatmap_colored, overlay = generate_overlay(heatmap, str(tmp_path), alpha=0.4)
                save_heatmaps(heatmap_colored, overlay, str(HEATMAPS_DIR), model_name, request_id)
                tmp_path.unlink(missing_ok=True)
                result['gradcam_url'] = f'/heatmaps/{model_name}_{request_id}.png'
        except Exception as e:
            print(f"[WARN] Grad-CAM failed for {model_name}: {e}", flush=True)

    finally:
        # ── Free RAM immediately ───────────────────────────────────────────────
        print(f"[INFO] Unloading {model_name} from RAM ...", flush=True)
        del model
        gc.collect()
        # Clear TF session so Keras releases GPU/CPU memory allocations
        tf.keras.backend.clear_session()
        print(f"[INFO] {model_name} unloaded ✓", flush=True)

    return result


def determine_combined(model_results: dict) -> dict:
    """Majority-vote ensemble combination."""
    votes: dict = {}
    confidences: dict = {}

    for result in model_results.values():
        if 'error' in result:
            continue
        cls = result['top_class']
        votes[cls] = votes.get(cls, 0) + 1
        confidences.setdefault(cls, []).append(result['confidence'])

    if not votes:
        return {'voting': None, 'notes': 'All models failed', 'vote_count': {}, 'avg_confidence': 0.0}

    max_votes  = max(votes.values())
    candidates = [c for c, v in votes.items() if v == max_votes]
    winner     = candidates[0] if len(candidates) == 1 else max(candidates, key=lambda c: np.mean(confidences[c]))

    agreeing = sum(1 for r in model_results.values() if 'error' not in r and r['top_class'] == winner)
    total    = sum(1 for r in model_results.values() if 'error' not in r)

    return {
        'voting': winner,
        'notes': f'{agreeing}/{total} models predict {winner}',
        'vote_count': votes,
        'avg_confidence': float(np.mean(confidences[winner])),
    }

# ─── Flask App ────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# Run scan automatically when app is imported (needed for Gunicorn)
scan_available_models()



@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'available_models': AVAILABLE_MODELS})


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file         = request.files['image']
    models_param = request.form.get('models', 'all')
    request_id   = request.form.get('request_id', str(uuid.uuid4()))
    image_bytes  = file.read()

    # Determine which models to run
    if models_param.lower() == 'all':
        models_to_run = [m for m in MODEL_CONFIGS.keys() if m in AVAILABLE_MODELS]
    else:
        models_to_run = [m.strip() for m in models_param.split(',') if m.strip() in AVAILABLE_MODELS]

    if not models_to_run:
        return jsonify({'error': 'No available models found on disk'}), 503

    # ── Run each model SEQUENTIALLY so we never hold more than 1 in RAM ───────
    results = {}
    for model_name in models_to_run:
        print(f"[INFO] Starting sequential run for {model_name} | request {request_id}", flush=True)
        try:
            results[model_name] = run_single_model_sequential(model_name, image_bytes, request_id)
        except Exception as e:
            print(f"[ERROR] {model_name} failed: {e}", flush=True)
            results[model_name] = {'error': str(e)}

    combined = determine_combined(results)

    return jsonify({
        'status': 'done',
        'models': results,
        'combined': combined,
        'request_id': request_id,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=False)
