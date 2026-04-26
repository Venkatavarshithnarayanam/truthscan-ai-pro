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


def simulate_jpeg_compression(image: Image.Image) -> Image.Image:
    """Simulate WhatsApp/Instagram JPEG compression artifacts."""
    import io
    import random
    quality = random.randint(30, 80)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    return Image.open(buffer).convert("RGB")

def add_noise(image: torch.Tensor) -> torch.Tensor:
    """Add slight random noise to simulate low-light mobile sensors."""
    noise = torch.randn_like(image) * 0.05
    return torch.clamp(image + noise, 0.0, 1.0)

def get_training_transform():
    """Get the training transform pipeline with strong augmentations."""
    return transforms.Compose([
        transforms.Resize((INPUT_SIZE + 32, INPUT_SIZE + 32)), # Resize larger for cropping
        transforms.RandomCrop((INPUT_SIZE, INPUT_SIZE)),       # Simulates framing variations
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        # Strong color jitter for lighting variation
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
        # Simulate motion blur and out-of-focus blur
        transforms.RandomApply([
            transforms.GaussianBlur(kernel_size=5, sigma=(0.5, 3.0))
        ], p=0.4),
        # Simulate mobile compression
        transforms.RandomApply([
            transforms.Lambda(simulate_jpeg_compression)
        ], p=0.4),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        # Inject sensor noise
        transforms.RandomApply([
            transforms.Lambda(add_noise)
        ], p=0.2),
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
