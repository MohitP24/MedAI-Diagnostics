#!/usr/bin/env python3
"""
split_models.py  –  Split large .keras model files into 49-MB chunks for GitHub.
Run this once locally before pushing to GitHub:

    python split_models.py split

To reassemble (Render does this automatically via render_build.sh):

    python split_models.py join
"""

import os
import sys
import glob
from pathlib import Path

CHUNK_SIZE = 49 * 1024 * 1024   # 49 MB per chunk (GitHub limit is 100 MB)
MODELS_DIR = Path(__file__).parent.parent / 'models'


def split_all():
    keras_files = list(MODELS_DIR.glob('*.keras'))
    if not keras_files:
        print("[WARN] No .keras files found in models/")
        return
    for model_path in keras_files:
        print(f"[INFO] Splitting {model_path.name} ...")
        with open(model_path, 'rb') as f:
            chunk_index = 0
            while True:
                chunk = f.read(CHUNK_SIZE)
                if not chunk:
                    break
                chunk_path = model_path.with_suffix(f'.part{chunk_index:03d}')
                with open(chunk_path, 'wb') as cf:
                    cf.write(chunk)
                print(f"  -> {chunk_path.name}  ({len(chunk) / 1024 / 1024:.1f} MB)")
                chunk_index += 1
        print(f"[OK]  Split into {chunk_index} chunks.\n")


def join_all():
    part_files = sorted(MODELS_DIR.glob('*.part*'))
    # Group by base name (e.g. resnet101_breast_ultrasound)
    groups: dict = {}
    for pf in part_files:
        # e.g. resnet101_breast_ultrasound.part000  -> base = resnet101_breast_ultrasound.keras
        base_name = pf.stem  # strip .partNNN extension
        # stem is like 'resnet101_breast_ultrasound' because Path.stem strips only the LAST extension
        groups.setdefault(base_name, []).append(pf)

    for base_name, parts in groups.items():
        parts_sorted = sorted(parts)
        output_path = MODELS_DIR / f'{base_name}.keras'
        if output_path.exists():
            print(f"[SKIP] {output_path.name} already exists.")
            continue
        print(f"[INFO] Joining {len(parts_sorted)} parts into {output_path.name} ...")
        with open(output_path, 'wb') as out:
            for part in parts_sorted:
                with open(part, 'rb') as pf:
                    out.write(pf.read())
        size_mb = output_path.stat().st_size / 1024 / 1024
        print(f"[OK]  {output_path.name}  ({size_mb:.1f} MB)\n")


if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'split'
    if action == 'split':
        split_all()
    elif action == 'join':
        join_all()
    else:
        print(f"Unknown action: {action}. Use 'split' or 'join'.")
