"""
Semantic similarity using sentence-transformers.

Model is loaded ONCE at module import time (not on first request).
This eliminates the cold-start latency that caused 30s timeouts.
"""
import hashlib
import logging
import time
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# ── Model loaded at import time — zero cold-start on first request ────────────
_MODEL_NAME = "all-MiniLM-L6-v2"

logger.info("Loading SentenceTransformer model '%s'…", _MODEL_NAME)
_t0 = time.perf_counter()
_model = SentenceTransformer(_MODEL_NAME)
logger.info("Model loaded in %.2fs", time.perf_counter() - _t0)

# ── In-memory embedding cache (keyed by SHA-256 of text) ─────────────────────
# Avoids re-encoding the same resume/JD text on repeated requests.
_embedding_cache: dict[str, np.ndarray] = {}
_CACHE_MAX = 256  # evict oldest when full


def _get_embedding(text: str) -> np.ndarray:
    """Return cached embedding or compute and cache it."""
    key = hashlib.sha256(text.encode()).hexdigest()
    if key not in _embedding_cache:
        if len(_embedding_cache) >= _CACHE_MAX:
            # Simple FIFO eviction — remove first inserted key
            oldest = next(iter(_embedding_cache))
            del _embedding_cache[oldest]
        _embedding_cache[key] = _model.encode(text)
    return _embedding_cache[key]


def compute_similarity(text_a: str, text_b: str) -> float:
    """
    Returns cosine similarity [0.0, 1.0] between two texts.
    Texts are capped at 3000 chars to keep encoding fast (<200ms).
    """
    t0 = time.perf_counter()
    a = _get_embedding(text_a[:3000])
    b = _get_embedding(text_b[:3000])
    sim = cosine_similarity([a], [b])[0][0]
    logger.debug("Embedding similarity computed in %.3fs", time.perf_counter() - t0)
    return float(np.clip(sim, 0.0, 1.0))


def warmup() -> float:
    """
    Run a dummy encode to ensure the model is fully JIT-compiled.
    Returns the warmup time in seconds.
    """
    t0 = time.perf_counter()
    _model.encode(["warmup sentence for ATS scoring service"])
    elapsed = time.perf_counter() - t0
    logger.info("Model warmup complete in %.3fs", elapsed)
    return elapsed
