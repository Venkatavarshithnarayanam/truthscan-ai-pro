"""
Preprocessing module for TruthScan AI Pro.
Handles image transforms for training and inference.
"""

import io
import numpy as np
from PIL import Image
import torch
from torchvision import transforms


# ImageNet normalization constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224


def get_inference_transform():
    """Get the standard inference transform pipeline."""
    return transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_training_transform():
    """Get the training transform pipeline with augmentations."""
    return transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1, hue=0.05),
        transforms.RandomApply([
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0))
        ], p=0.3),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        transforms.RandomErasing(p=0.1, scale=(0.02, 0.1)),
    ])


def get_validation_transform():
    """Get the validation transform pipeline (no augmentation)."""
    return get_inference_transform()


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes."""
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def preprocess_for_inference(image: Image.Image, device: str = "cpu") -> torch.Tensor:
    """Preprocess a PIL Image for model inference.

    Args:
        image: PIL Image in RGB mode.
        device: torch device string.

    Returns:
        Tensor of shape (1, 3, 224, 224) on the specified device.
    """
    transform = get_inference_transform()
    tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return tensor.to(device)


def preprocess_for_opencv(image: Image.Image) -> np.ndarray:
    """Convert PIL Image to OpenCV BGR numpy array."""
    rgb_array = np.array(image)
    bgr_array = rgb_array[:, :, ::-1].copy()
    return bgr_array
