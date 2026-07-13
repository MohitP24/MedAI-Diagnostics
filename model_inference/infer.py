#!/usr/bin/env python3
"""
Breast Cancer Ultrasound Classification Inference Script
Loads Keras models, performs inference, and generates Grad-CAM visualizations.
"""

import os
import sys
import json
import argparse
import numpy as np
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import time

# Import Grad-CAM utilities
from utils_gradcam import (
    get_last_conv_layer,
    compute_gradcam,
    generate_overlay,
    save_heatmaps
)

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Class labels mapping
CLASS_LABELS = ['benign', 'malignant', 'normal']

# Model configurations
MODEL_CONFIGS = {
    'resnet101': {
        'path': 'models/resnet101_breast_ultrasound.keras',
        'input_size': (224, 224),
        'preprocess': 'imagenet'
    },
    'inceptionv3': {
        'path': 'models/inceptionv3_breast_ultrasound.keras',
        'input_size': (224, 224),  # FIXED: Actual model uses 224x224, not 299x299
        'preprocess': 'imagenet'
    },
    'efficientnetb0': {
        'path': 'models/efficientnetb0_breast_ultrasound.keras',
        'input_size': (224, 224),
        'preprocess': 'imagenet'
    }
}

# Cache for loaded models
LOADED_MODELS = {}


def load_model(model_name, base_dir='.'):
    """
    Load a Keras model with caching to avoid reloading.
    
    Args:
        model_name: Name of the model
        base_dir: Base directory for model files
    
    Returns:
        Loaded Keras model
    """
    if model_name in LOADED_MODELS:
        return LOADED_MODELS[model_name]
    
    config = MODEL_CONFIGS[model_name]
    model_path = os.path.join(base_dir, config['path'])
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    print(f"Loading model: {model_name}...", file=sys.stderr)
    model = keras.models.load_model(model_path)
    LOADED_MODELS[model_name] = model
    print(f"Model {model_name} loaded successfully.", file=sys.stderr)
    
    return model


def preprocess_image(image_path, target_size, preprocess_mode='imagenet'):
    """
    Preprocess image for model inference.
    
    Args:
        image_path: Path to the image file
        target_size: Tuple of (width, height)
        preprocess_mode: Preprocessing mode ('imagenet' or 'simple')
    
    Returns:
        Preprocessed image array with batch dimension
    """
    # Load image
    img = Image.open(image_path).convert('RGB')
    
    # Resize to model input size
    img = img.resize(target_size, Image.LANCZOS)
    
    # Convert to array
    img_array = np.array(img, dtype=np.float32)
    
    # Apply preprocessing
    # CRITICAL FIX: Use simple 0-1 normalization to match model training
    # Models were trained with img/255.0, NOT ImageNet normalization
    img_array = img_array / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def run_inference(model, img_array):
    """
    Run model inference and get predictions.
    
    Args:
        model: Loaded Keras model
        img_array: Preprocessed image array
    
    Returns:
        dict: Prediction results with probabilities and top class
    """
    # Get predictions
    predictions = model.predict(img_array, verbose=0)
    probs = predictions[0]
    
    # NOTE: All models have softmax activation built-in, so probs should already sum to 1
    # If you trained models without softmax, uncomment the lines below:
    # if not np.isclose(np.sum(probs), 1.0, atol=0.01):
    #     probs = tf.nn.softmax(probs).numpy()
    
    # Ensure probs are valid (clip to avoid numerical errors)
    probs = np.clip(probs, 1e-7, 1.0)
    probs = probs / np.sum(probs)  # Normalize to ensure sum = 1
    
    # Create probability dictionary
    prob_dict = {CLASS_LABELS[i]: float(probs[i]) for i in range(len(CLASS_LABELS))}
    
    # Get top prediction
    top_index = np.argmax(probs)
    top_class = CLASS_LABELS[top_index]
    confidence = float(probs[top_index])
    
    return {
        'probs': prob_dict,
        'top_class': top_class,
        'confidence': confidence,
        'top_index': int(top_index)
    }


def process_model(model_name, image_path, output_dir, request_id, base_dir='.'):
    """
    Process a single model: load, infer, generate Grad-CAM.
    
    Args:
        model_name: Name of the model
        image_path: Path to the input image
        output_dir: Directory to save heatmaps
        request_id: Unique request identifier
        base_dir: Base directory for models
    
    Returns:
        dict: Complete results for this model
    """
    # Load model
    model = load_model(model_name, base_dir)
    config = MODEL_CONFIGS[model_name]
    
    # Preprocess image
    img_array = preprocess_image(
        image_path,
        config['input_size'],
        config['preprocess']
    )
    
    # Run inference
    result = run_inference(model, img_array)
    
    # Generate Grad-CAM
    try:
        # Get last convolutional layer
        last_conv_layer_name = get_last_conv_layer(model, model_name)
        
        if last_conv_layer_name is None:
            print(f"Warning: No convolutional layer found for {model_name}", file=sys.stderr)
            result['gradcam_url'] = None
            return result
        
        print(f"Using layer '{last_conv_layer_name}' for Grad-CAM", file=sys.stderr)
        
        # Compute Grad-CAM heatmap
        heatmap = compute_gradcam(
            model,
            img_array,
            last_conv_layer_name,
            result['top_index']
        )
        
        # Generate overlay
        heatmap_colored, overlay = generate_overlay(heatmap, image_path, alpha=0.4)
        
        # Save heatmaps
        paths = save_heatmaps(heatmap_colored, overlay, output_dir, model_name, request_id)
        
        # Add URL to result (use relative path, backend will serve it)
        result['gradcam_url'] = f"/heatmaps/{model_name}_{request_id}.png"
        
    except Exception as e:
        print(f"Error generating Grad-CAM for {model_name}: {str(e)}", file=sys.stderr)
        result['gradcam_url'] = None
    
    return result


def determine_combined_result(model_results):
    """
    Determine combined prediction using voting and confidence.
    
    Args:
        model_results: Dictionary of model results
    
    Returns:
        dict: Combined result with voting outcome
    """
    # Count votes for each class
    votes = {}
    confidences = {}
    
    for model_name, result in model_results.items():
        top_class = result['top_class']
        confidence = result['confidence']
        
        if top_class not in votes:
            votes[top_class] = 0
            confidences[top_class] = []
        
        votes[top_class] += 1
        confidences[top_class].append(confidence)
    
    # Determine winner by votes, then by average confidence
    max_votes = max(votes.values())
    candidates = [cls for cls, v in votes.items() if v == max_votes]
    
    if len(candidates) == 1:
        winning_class = candidates[0]
    else:
        # Break tie by average confidence
        avg_confidences = {cls: np.mean(confidences[cls]) for cls in candidates}
        winning_class = max(avg_confidences, key=avg_confidences.get)
    
    # Generate notes
    agreeing_models = [m for m, r in model_results.items() if r['top_class'] == winning_class]
    notes = f"{len(agreeing_models)}/{len(model_results)} models predict {winning_class}"
    
    return {
        'voting': winning_class,
        'notes': notes,
        'vote_count': votes,
        'avg_confidence': np.mean(confidences[winning_class])
    }


def main():
    parser = argparse.ArgumentParser(description='Breast Cancer Classification Inference')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--models', default='all', help='Comma-separated model names or "all"')
    parser.add_argument('--output-dir', required=True, help='Directory to save heatmaps')
    parser.add_argument('--request-id', required=True, help='Unique request identifier')
    parser.add_argument('--base-dir', default='.', help='Base directory for models')
    
    args = parser.parse_args()
    
    # Determine which models to run
    if args.models.lower() == 'all':
        models_to_run = list(MODEL_CONFIGS.keys())
    else:
        models_to_run = [m.strip() for m in args.models.split(',')]
    
    # Validate model names
    for model_name in models_to_run:
        if model_name not in MODEL_CONFIGS:
            print(f"Error: Unknown model '{model_name}'", file=sys.stderr)
            sys.exit(1)
    
    # Check if image exists
    if not os.path.exists(args.image):
        print(f"Error: Image not found: {args.image}", file=sys.stderr)
        sys.exit(1)
    
    # Process each model
    results = {}
    for model_name in models_to_run:
        print(f"Processing {model_name}...", file=sys.stderr)
        try:
            result = process_model(
                model_name,
                args.image,
                args.output_dir,
                args.request_id,
                args.base_dir
            )
            results[model_name] = result
        except Exception as e:
            print(f"Error processing {model_name}: {str(e)}", file=sys.stderr)
            results[model_name] = {
                'error': str(e),
                'probs': None,
                'top_class': None,
                'confidence': None,
                'gradcam_url': None
            }
    
    # Determine combined result
    valid_results = {k: v for k, v in results.items() if 'error' not in v}
    if valid_results:
        combined = determine_combined_result(valid_results)
    else:
        combined = {
            'voting': None,
            'notes': 'All models failed',
            'vote_count': {},
            'avg_confidence': 0.0
        }
    
    # Prepare output JSON
    output = {
        'status': 'done',
        'models': results,
        'combined': combined,
        'request_id': args.request_id
    }
    
    # Output JSON to stdout
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
