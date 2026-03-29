"""
Inference module for TruthScan AI Pro.
Loads trained EfficientNet-B3 and runs single-image prediction.
"""

import os
import logging
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image

try:
    import timm
except ImportError:
    raise ImportError("timm is required. Run: pip install timm")

from utils.preprocessing import preprocess_for_inference

logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "models" / "ai_detector.pth"

# Auto device detection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Cached model
_model = None
_model_loaded = False


def _build_model() -> nn.Module:
    """Build EfficientNet-B3 architecture (no weights loaded)."""
    model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=1)
    return model


AUTO_TRAIN = False

def load_model(model_path: str = None) -> nn.Module:
    """Load trained model weights.

    Args:
        model_path: Path to model weights file.

    Returns:
        Loaded model in eval mode.
    """
    global _model, _model_loaded

    if _model_loaded and _model is not None:
        return _model

    if model_path is None:
        model_path = str(MODEL_PATH)

    if not os.path.exists(model_path):
        raise Exception("Model not found. Please run training manually.")

    logger.info(f"Loading model from {model_path} on {DEVICE}...")
    model = _build_model()

    checkpoint = torch.load(model_path, map_location=DEVICE, weights_only=False)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
        logger.info(
            f"Model loaded (epoch {checkpoint.get('epoch', '?')}, "
            f"val_f1={checkpoint.get('val_f1', '?')}, "
            f"trained_on={checkpoint.get('device_trained_on', '?')})"
        )
    else:
        # Direct state dict
        model.load_state_dict(checkpoint)
        logger.info("Model loaded (direct state dict)")

    model = model.to(DEVICE)
    model.eval()

    # Complete gradient disable for max inference speed
    for param in model.parameters():
        param.requires_grad = False

    _model = model
    _model_loaded = True
    return model


def predict(image: Image.Image) -> float:
    """Run AI detection inference on a single image.

    Args:
        image: PIL Image in RGB mode.

    Returns:
        AI probability (0.0 = definitely real, 1.0 = definitely AI).
    """
    model = load_model()

    # Preprocess
    tensor = preprocess_for_inference(image, device=DEVICE)

    # Inference
    with torch.no_grad():
        logit = model(tensor).squeeze()
        probability = torch.sigmoid(logit).item()

    return float(probability)


def is_model_ready() -> bool:
    """Check if the model file exists."""
    return MODEL_PATH.exists()


def get_model_info() -> dict:
    """Get information about the loaded model."""
    if not MODEL_PATH.exists():
        return {"status": "not_found", "path": str(MODEL_PATH)}

    try:
        checkpoint = torch.load(str(MODEL_PATH), map_location="cpu", weights_only=False)
        if isinstance(checkpoint, dict):
            return {
                "status": "ready",
                "path": str(MODEL_PATH),
                "epoch": checkpoint.get("epoch", "unknown"),
                "val_f1": checkpoint.get("val_f1", "unknown"),
                "val_acc": checkpoint.get("val_acc", "unknown"),
                "device_trained_on": checkpoint.get("device_trained_on", "unknown"),
            }
    except Exception:
        pass

    return {"status": "ready", "path": str(MODEL_PATH)}
