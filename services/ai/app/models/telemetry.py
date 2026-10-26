"""
ScamShield Live Telemetry Tracker
Tracks real inference latency via a rolling window of API call durations.
Thread-safe, zero external dependencies.
"""
import time
import threading
from collections import deque
from typing import Dict, Any

# Rolling window — stores last 200 request durations (ms)
_lock = threading.Lock()
_latency_window: deque = deque(maxlen=200)

def record_latency(duration_ms: float) -> None:
    """Called after every /analyze or /payment request to record real latency."""
    with _lock:
        _latency_window.append(duration_ms)

def get_latency_stats() -> Dict[str, Any]:
    """
    Returns real p50 and p95 latency from the rolling window.
    Falls back to bootstrap estimates if fewer than 5 samples exist.
    """
    with _lock:
        samples = list(_latency_window)

    n = len(samples)
    if n < 5:
        # Not enough real data yet — return honest bootstrap values
        return {
            "p50_latency_ms": 28,
            "p95_latency_ms": 94,
            "sample_count": n,
            "is_live": False
        }

    sorted_samples = sorted(samples)
    p50_idx = int(n * 0.50)
    p95_idx = int(n * 0.95)

    return {
        "p50_latency_ms": round(sorted_samples[min(p50_idx, n - 1)], 1),
        "p95_latency_ms": round(sorted_samples[min(p95_idx, n - 1)], 1),
        "sample_count": n,
        "is_live": True
    }

