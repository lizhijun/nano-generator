#!/bin/bash
# 运行所有数据准备脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Step 1: Generate training data from prompts"
echo "=========================================="
python3 generate_training_data.py

echo ""
echo "=========================================="
echo "Step 2: Augment data with variants"
echo "=========================================="
python3 augment_data.py

echo ""
echo "=========================================="
echo "Step 3: Prepare final dataset"
echo "=========================================="
python3 prepare_dataset.py

echo ""
echo "=========================================="
echo "Done! Check data/processed/ for output files"
echo "=========================================="
