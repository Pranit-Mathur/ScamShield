"""
ScamShield FastAPI AI Core Service
Entry point for all machine learning pipelines, rule evaluation, vector search,
RAG retrievers, PaySim transaction scoring, account graphs, and scam simulators.
"""
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .routers import analyze, payment, txn, simulator, metrics
from .models.telemetry import record_latency

app = FastAPI(
    title="ScamShield AI Engine",
    description="Explainable, AI-driven digital payment fraud awareness and detection engine",
    version="1.0.0"
)

# ── Latency Telemetry Middleware ──────────────────────────────────────────────
class LatencyMiddleware(BaseHTTPMiddleware):
    """Records real p50/p95 latency for every /analyze and /payment API call."""
    async def dispatch(self, request: Request, call_next):
        if any(seg in request.url.path for seg in ("/analyze", "/payment", "/txn")):
            t0 = time.perf_counter()
            response = await call_next(request)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            record_latency(elapsed_ms)
            return response
        return await call_next(request)

# Enable CORS for local Vite development and Gateway proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LatencyMiddleware)

# Include routers under /api and root prefixes for maximum flexibility
app.include_router(analyze.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(txn.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")

# Also include at root
app.include_router(analyze.router)
app.include_router(payment.router)
app.include_router(txn.router)
app.include_router(simulator.router)
app.include_router(metrics.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ScamShield AI Service",
        "version": "1.0.0",
        "models_loaded": True
    }

@app.on_event("startup")
def startup_warmup():
    """Warms up pipelines and caches at service initialization."""
    print("Preloading and warming up ScamShield detection models...")
    try:
        # Warmup test query
        warmup_req = analyze.AnalyzeRequest(text="Dear customer, your bank account KYC is expired. Update at http://test.xyz")
        analyze.analyze_content(warmup_req)
        print("ScamShield AI Models successfully initialized and warmed.")
    except Exception as e:
        print(f"Warmup notice: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

