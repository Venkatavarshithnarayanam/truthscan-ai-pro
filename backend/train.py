"""
Training pipeline for TruthScan AI Pro.
Trains EfficientNet-B3 for binary AI vs Real image classification.
Uses CIFAKE dataset (auto-downloaded via kagglehub).
"""

import os
import sys
import time
import logging
import argparse
import datetime
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
from sklearn.metrics import f1_score, accuracy_score

try:
    import timm
except ImportError:
    print("timm not installed. Run: pip install timm")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "ai_detector.pth"

# Auto device detection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class CIFAKEDataset(Dataset):
    """CIFAKE dataset loader. Expects directory structure:
    dataset_dir/
      REAL/
        *.png / *.jpg
      FAKE/
        *.png / *.jpg
    """

    def __init__(self, root_dir: str, transform=None, max_per_class: int=None):
        self.transform = transform
        self.samples = []

        real_dir = os.path.join(root_dir, "REAL")
        fake_dir = os.path.join(root_dir, "FAKE")

        def load_category(directory_path, label):
            if not os.path.isdir(directory_path):
                return []
            all_files = [f for f in os.listdir(directory_path) if self._is_image(f)]
            if max_per_class is not None:
                all_files = all_files[:max_per_class]
            return [(os.path.join(directory_path, f), label) for f in all_files]

        # Load REAL images (label=0)
        self.samples.extend(load_category(real_dir, 0))

        # Load FAKE / AI images (label=1)
        self.samples.extend(load_category(fake_dir, 1))

        # Shuffle internally to mix classes
        import random
        random.shuffle(self.samples)

        logger.info(f"Loaded {len(self.samples)} samples from {root_dir}")
        real_count = sum(1 for _, l in self.samples if l == 0)
        fake_count = sum(1 for _, l in self.samples if l == 1)
        logger.info(f"  REAL: {real_count}, FAKE/AI: {fake_count}")

    @staticmethod
    def _is_image(filename: str) -> bool:
        return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.webp'))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            image = Image.open(path).convert("RGB")
        except Exception:
            # Return a black image if file is corrupted
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            image = self.transform(image)

        return image, torch.tensor(label, dtype=torch.float32)


def download_cifake_dataset() -> str:
    """Download CIFAKE dataset using kagglehub.

    Returns:
        Path to the downloaded dataset root directory.
    """
    try:
        import kagglehub
        logger.info("Downloading CIFAKE dataset via kagglehub...")
        path = kagglehub.dataset_download("birdy654/cifake-real-and-ai-generated-synthetic-images")
        logger.info(f"CIFAKE dataset downloaded to: {path}")
        return path
    except ImportError:
        logger.error("kagglehub not installed. Run: pip install kagglehub")
        raise
    except Exception as e:
        logger.error(f"Failed to download CIFAKE dataset: {e}")
        raise


def find_dataset_dirs(base_path: str) -> tuple:
    """Find train and test directories in the CIFAKE dataset.

    Returns:
        (train_dir, test_dir) paths.
    """
    base = Path(base_path)

    # CIFAKE structure: base/train/{REAL,FAKE}, base/test/{REAL,FAKE}
    possible_structures = [
        (base / "train", base / "test"),
        (base / "Train", base / "Test"),
        # Sometimes nested deeper
    ]

    for train_dir, test_dir in possible_structures:
        if train_dir.is_dir() and test_dir.is_dir():
            return str(train_dir), str(test_dir)

    # Search recursively for train/test dirs
    for d in base.rglob("*"):
        if d.is_dir() and d.name.lower() == "train":
            parent = d.parent
            test_d = parent / "test"
            if not test_d.is_dir():
                test_d = parent / "Test"
            if test_d.is_dir():
                return str(d), str(test_d)

    raise FileNotFoundError(f"Could not find train/test directories in {base_path}")


def build_model(num_classes: int = 1, pretrained: bool = True) -> nn.Module:
    """Build EfficientNet-B3 model for binary classification.

    Args:
        num_classes: 1 for binary with BCEWithLogitsLoss.
        pretrained: Whether to use ImageNet pretrained weights.

    Returns:
        EfficientNet-B3 model.
    """
    model = timm.create_model("efficientnet_b3", pretrained=pretrained, num_classes=num_classes)
    logger.info(f"Built EfficientNet-B3 (pretrained={pretrained}), device={DEVICE}")
    return model.to(DEVICE)


def get_transforms():
    """Get training and validation transforms."""
    from backend.utils.preprocessing import get_training_transform, get_validation_transform
    return get_training_transform(), get_validation_transform()


def get_transforms_standalone():
    """Get transforms when running as standalone script."""
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1, hue=0.05),
        transforms.RandomApply([
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0))
        ], p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return train_transform, val_transform


def train_model(
    train_dir: str,
    val_dir: str,
    epochs: int = 10,
    batch_size: int = 16,
    learning_rate: float = 1e-4,
    save_path: str = None,
):
    """Train EfficientNet-B3 on CIFAKE dataset.

    Args:
        train_dir: Path to training data directory.
        val_dir: Path to validation data directory.
        epochs: Number of training epochs.
        batch_size: Batch size.
        learning_rate: Initial learning rate.
        save_path: Path to save best model weights.
    """
    if save_path is None:
        save_path = str(MODEL_PATH)

    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    logger.info(f"Device: {DEVICE}")
    logger.info(f"Epochs: {epochs}, Batch size: {batch_size}, LR: {learning_rate}")

    # Get transforms
    try:
        train_transform, val_transform = get_transforms()
    except ImportError:
        train_transform, val_transform = get_transforms_standalone()

    # Create datasets (Max 10k per class for training, 2k for val)
    train_dataset = CIFAKEDataset(train_dir, transform=train_transform, max_per_class=10000)
    val_dataset = CIFAKEDataset(val_dir, transform=val_transform, max_per_class=2000)

    if len(train_dataset) == 0:
        raise ValueError(f"No training images found in {train_dir}")
    if len(val_dataset) == 0:
        raise ValueError(f"No validation images found in {val_dir}")

    # Create data loaders
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=2, pin_memory=(DEVICE == "cuda"),
    )
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False,
        num_workers=2, pin_memory=(DEVICE == "cuda"),
    )

    # Build model
    model = build_model(num_classes=1, pretrained=True)

    # Freeze all EfficientNet layers except classifier for balanced training
    logger.info("Freezing all layers except classifier for balanced training")
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False
            
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    logger.info(f"Trainable params: {trainable:,} / {total:,} ({trainable/total:.1%})")

    # Loss, optimizer, scheduler
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=2,
    )

    best_f1 = 0.0
    best_val_loss = float('inf')
    best_epoch = -1
    patience_limit = 1
    patience_counter = 0

    for epoch in range(epochs):
        epoch_start = time.time()

        # ----- Training -----
        model.train()
        train_loss = 0.0
        train_preds = []
        train_labels = []

        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(images).squeeze(1)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            preds = (torch.sigmoid(outputs) > 0.5).float()
            train_preds.extend(preds.cpu().numpy())
            train_labels.extend(labels.cpu().numpy())

            if (batch_idx + 1) % 100 == 0:
                elapsed = time.time() - epoch_start
                avg_time = elapsed / (batch_idx + 1)
                rem_batches = len(train_loader) - (batch_idx + 1)
                eta_sec = avg_time * rem_batches
                eta_str = str(datetime.timedelta(seconds=int(eta_sec)))
                
                logger.info(
                    f"  Epoch {epoch+1}/{epochs} - Batch {batch_idx+1}/{len(train_loader)} - "
                    f"Loss: {loss.item():.4f} | ETA: {eta_str}"
                )

        train_loss /= len(train_dataset)
        train_acc = accuracy_score(train_labels, train_preds)
        train_f1 = f1_score(train_labels, train_preds, zero_division=0)

        # ----- Validation -----
        model.eval()
        val_loss = 0.0
        val_preds = []
        val_labels = []

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)

                outputs = model(images).squeeze(1)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                preds = (torch.sigmoid(outputs) > 0.5).float()
                val_preds.extend(preds.cpu().numpy())
                val_labels.extend(labels.cpu().numpy())

        val_loss /= len(val_dataset)
        val_acc = accuracy_score(val_labels, val_preds)
        val_f1 = f1_score(val_labels, val_preds, zero_division=0)

        elapsed = time.time() - epoch_start
        scheduler.step(val_loss)

        logger.info(
            f"Epoch {epoch+1}/{epochs} ({elapsed:.1f}s) — "
            f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}, F1: {train_f1:.4f} | "
            f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}, F1: {val_f1:.4f}"
        )

        # Save best model
        if val_f1 > best_f1:
            best_f1 = val_f1
            best_epoch = epoch + 1
            torch.save({
                "model_state_dict": model.state_dict(),
                "epoch": epoch + 1,
                "val_f1": val_f1,
                "val_acc": val_acc,
                "device_trained_on": DEVICE,
            }, save_path)
            logger.info(f"  ★ Best model saved (F1: {val_f1:.4f})")
            
        # Early Stopping Logic based on validation loss
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            logger.info(f"  Validation loss improved to {val_loss:.4f}.")
        else:
            patience_counter += 1
            logger.info(f"  Validation loss did not improve. Patience {patience_counter}/{patience_limit}.")
            if patience_counter >= patience_limit:
                logger.info(f"  Early stopping triggered after {epoch+1} epochs.")
                break

    logger.info(f"\nTraining complete! Best F1: {best_f1:.4f} at epoch {best_epoch}")
    logger.info(f"Model saved to: {save_path}")
    return save_path


def auto_train_if_needed():
    """Auto-training system: download dataset and train if model not found."""
    if MODEL_PATH.exists():
        logger.info(f"Model found at {MODEL_PATH}. Skipping training.")
        return str(MODEL_PATH)

    logger.info("No trained model found. Starting auto-training pipeline...")

    # Step 1: Download dataset
    dataset_path = download_cifake_dataset()

    # Step 2: Find train/test directories
    train_dir, test_dir = find_dataset_dirs(dataset_path)

    # Step 3: Train balancing speed and quality
    epochs = 2
    batch_size = 16

    logger.info(f"Auto-training with {epochs} epochs, batch_size={batch_size} on {DEVICE}")

    return train_model(
        train_dir=train_dir,
        val_dir=test_dir,
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=1e-4,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TruthScan AI Pro - Model Training")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--auto", action="store_true", help="Auto-download dataset and train")
    parser.add_argument("--train-dir", type=str, default=None, help="Training data directory")
    parser.add_argument("--val-dir", type=str, default=None, help="Validation data directory")
    args = parser.parse_args()

    if args.auto or (args.train_dir is None):
        auto_train_if_needed()
    else:
        if args.train_dir is None or args.val_dir is None:
            print("Provide --train-dir and --val-dir, or use --auto")
            sys.exit(1)
        train_model(
            train_dir=args.train_dir,
            val_dir=args.val_dir,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
        )
