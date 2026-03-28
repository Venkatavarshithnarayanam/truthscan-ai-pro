# TruthScan AI Pro

Production-grade AI image detection system that detects whether an uploaded image is AI-generated or real.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m backend.app
```

The backend starts on `http://localhost:8001`. On first run, it will:
1. Auto-download the CIFAKE dataset (~500MB)
2. Train EfficientNet-B3 (5 epochs on CPU, ~30 min)
3. Save model to `backend/models/ai_detector.pth`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` with API proxy to backend.

### Environment Variables
```bash
# Optional: Mistral LLM for detailed explanations (fallback: rule-based)
export OPENROUTER_API_KEY=your_key_here
```

## Docker Deployment
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001`

## Architecture

**Multi-Model Ensemble Pipeline:**
1. **EfficientNet-B3** — Primary AI vs Real classifier (trained on CIFAKE)
2. **YOLOv8** — Object detection and scene tagging
3. **OpenCV Forensics** — Noise, blur, edge, texture, color analysis
4. **Face Detection** — OpenCV DNN face detector + manipulation analysis
5. **Ensemble Fusion** — Weighted combination of all signals
6. **LLM Explainer** — Mistral via OpenRouter (with rule-based fallback)

## API

### POST /analyze
Upload an image for analysis. Returns AI probability, breakdown, tags, and explanation.

### GET /health
Health check with model status.
