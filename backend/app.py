"""
TruthScan AI Pro — FastAPI Backend Server.
Provides /analyze endpoint for AI image detection.
"""

import os
import io
import logging
import threading
from pathlib import Path
from contextlib import asynccontextmanager

import torch
import hashlib
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Device info
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"TruthScan AI Pro starting on device: {DEVICE}")


MODEL_INITIALIZED = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load model on startup."""
    global MODEL_INITIALIZED
    logger.info("Initializing TruthScan AI Pro (Inference Mode)...")
    try:
        from backend.inference import load_model
        load_model()
        MODEL_INITIALIZED = True
        logger.info("Model loaded successfully. Ready for inference.")
    except Exception as e:
        logger.error(f"FATAL: Model initialization failed: {e}")
        MODEL_INITIALIZED = False
    yield
    logger.info("Shutting down TruthScan AI Pro.")


app = FastAPI(
    title="TruthScan AI Pro",
    description="Production-grade AI image detection system using multi-model ensemble",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    global MODEL_INITIALIZED
    from backend.inference import get_model_info
    return {
        "status": "healthy" if MODEL_INITIALIZED else "degraded",
        "device": DEVICE,
        "cuda_available": torch.cuda.is_available(),
        "model": get_model_info(),
        "model_initialized": MODEL_INITIALIZED
    }


# In-memory cache to save compute on lifetime-free tiers
_ANALYSIS_CACHE = {}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an uploaded image for AI generation detection.

    Accepts image uploads (JPEG, PNG, WebP, BMP) and runs the full
    ensemble pipeline including EfficientNet-B3, OpenCV forensics,
    face detection, YOLOv8, and explanation generation.

    Returns complete analysis with probability, breakdown, tags, and explanation.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"}
    content_type = file.content_type or ""

    if content_type not in allowed_types:
        # Also check by extension
        from pathlib import Path
        ext = Path(file.filename or "").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {content_type}. Supported: JPEG, PNG, WebP, BMP, GIF."
            )

    # Read file and check cache
    try:
        contents = await file.read()
        file_size = len(contents)

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        if file_size > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum 50MB.")
            
        # Fast MD5 cache lookup
        file_hash = hashlib.md5(contents).hexdigest()
        if file_hash in _ANALYSIS_CACHE:
            logger.info(f"Cache hit! Returning instant result for {file_hash[:8]}")
            return JSONResponse(content=_ANALYSIS_CACHE[file_hash])

        image = Image.open(io.BytesIO(contents)).convert("RGB")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Run ensemble analysis
    try:
        from backend.ensemble import analyze
        result = analyze(
            image=image,
            file_size=file_size,
            file_type=content_type or "image/jpeg",
        )
        
        # Save to cache before returning
        _ANALYSIS_CACHE[file_hash] = result
        
        # Keep cache from growing infinitely
        if len(_ANALYSIS_CACHE) > 100:
            _ANALYSIS_CACHE.pop(next(iter(_ANALYSIS_CACHE)))
            
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}. Ensure the model is trained."
        )


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "TruthScan AI Pro",
        "version": "1.0.0",
        "description": "AI-generated image detection API",
        "endpoints": {
            "POST /analyze": "Upload an image for analysis",
            "GET /health": "Health check and model status",
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(
        "backend.app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
