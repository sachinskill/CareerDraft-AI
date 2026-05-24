"""
ATS Python Microservice
Deterministic resume parsing + semantic scoring.

Performance design:
  - SentenceTransformer model loaded at module import (embedder.py)
  - Warmup called at startup via lifespan event
  - Text capped at 5000 chars before any processing
  - In-memory embedding cache avoids re-encoding identical texts
  - All endpoints respond in < 5s after warmup
"""
import logging
import os
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from embedder import warmup as model_warmup
from parser import extract_text_from_pdf, extract_text_from_docx
from scorer import compute_ats_score, _MAX_RESUME_CHARS, _MAX_JD_CHARS

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Startup / shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run model warmup before accepting requests."""
    logger.info("Starting ATS Python service — running model warmup…")
    t0 = time.perf_counter()
    warmup_time = model_warmup()
    logger.info("Service ready. Warmup: %.3fs, total startup: %.3fs",
                warmup_time, time.perf_counter() - t0)
    yield
    logger.info("ATS Python service shutting down")


app = FastAPI(
    title="ATS Scoring Service",
    version="2.0.0",
    description="Deterministic 6-dimensional ATS resume scoring",
    lifespan=lifespan,
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    allow_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allow_origins = ["http://localhost:8081", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str


class ScoreRequest(BaseModel):
    resume_text: str
    job_description: str


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ats-python-service",
        "version": "2.0.0",
    }


# ── Warmup ────────────────────────────────────────────────────────────────────

@app.get("/warmup")
def warmup_endpoint():
    """
    Trigger a dummy embedding to ensure the model is fully warm.
    Call this once after startup before sending real requests.
    """
    t0 = time.perf_counter()
    elapsed = model_warmup()
    return {
        "status": "warm",
        "warmup_ms": round(elapsed * 1000),
        "total_ms": round((time.perf_counter() - t0) * 1000),
    }


# ── Parse uploaded file → plain text ─────────────────────────────────────────

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    t0 = time.perf_counter()
    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in file")

    # Cap before returning — downstream scoring will also cap, but this reduces payload size
    text = text[:_MAX_RESUME_CHARS]
    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    logger.info("Parsed %s: %d chars in %dms", filename, len(text), elapsed_ms)

    return {
        "text": text,
        "char_count": len(text),
        "filename": filename,
        "parsing_ms": elapsed_ms,
    }


# ── Semantic similarity only ──────────────────────────────────────────────────

@app.post("/compute-embedding")
def compute_embedding(req: MatchRequest):
    from embedder import compute_similarity
    t0 = time.perf_counter()
    similarity = compute_similarity(req.resume_text, req.job_description)
    return {
        "similarity": round(similarity, 4),
        "similarity_pct": round(similarity * 100, 1),
        "embedding_ms": round((time.perf_counter() - t0) * 1000),
    }


# ── Full deterministic ATS score ──────────────────────────────────────────────

@app.post("/match-score")
def match_score(req: ScoreRequest):
    t0 = time.perf_counter()
    result = compute_ats_score(req.resume_text, req.job_description)
    total_ms = round((time.perf_counter() - t0) * 1000)
    result["totalProcessingMs"] = total_ms
    logger.info("/match-score completed in %dms (score=%d)", total_ms, result.get("overallScore", 0))
    return result


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # reload=True re-loads model on every file change — keep False in prod
        log_level="info",
    )
