#!/usr/bin/env bash
# render_build.sh  –  Render.com build command for the Python Inference Service.
# This script runs ONCE at deployment time.
set -e

echo ">>> Installing Python dependencies..."
pip install -r model_inference/requirements.txt

echo ">>> Reassembling model files from chunks..."
python model_inference/split_models.py join

echo ">>> Build complete!"
