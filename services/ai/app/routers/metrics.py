"""
ScamShield Evaluation Metrics Router
Exposes scientific evaluation benchmarks, ablation results, confusion matrix,
adversarial retraining stats, and data disclosures.
"""
from fastapi import APIRouter
from ..models.metrics_eval import get_full_evaluation_report

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("")
@router.get("/")
def get_metrics():
    return get_full_evaluation_report()

