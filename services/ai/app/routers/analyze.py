"""
ScamShield Core Analyzer Router
Handles:
- POST /analyze: Main multi-stage detection pipeline
- POST /analyze/agent: Autonomous LLM agent investigation with 'How I Decided' panel
- POST /feedback: Active learning and dynamic vector index addition
"""
import time
from fastapi import APIRouter, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..pipeline.normalizer import Normalizer
from ..pipeline.rules import RuleEngine
from ..pipeline.fusion import FusionEngine
from ..models.text_clf import TextClassifier
from ..models.embed import SimilarityEngine
from ..models.url_model import UrlUpiAnalyzer
from ..rag.retriever import RAGRetriever
from ..agent.runner import AgentRunner

router = APIRouter(prefix="", tags=["analyze"])

# Initialize pipeline singletons
normalizer = Normalizer()
rule_engine = RuleEngine()
text_clf = TextClassifier()
sim_engine = SimilarityEngine()
url_upi_analyzer = UrlUpiAnalyzer()
rag_retriever = RAGRetriever()
fusion_engine = FusionEngine()
agent_runner = AgentRunner()

# Feedback store
user_feedbacks = []

class AnalyzeRequest(BaseModel):
    text: str
    ocr_source: Optional[str] = None

class FeedbackRequest(BaseModel):
    text: str
    label: str  # 'scam' or 'benign'
    scam_type: Optional[str] = "unknown"
    comment: Optional[str] = ""

@router.post("/analyze")
def analyze_content(req: AnalyzeRequest):
    start_time = time.time()
    raw_text = req.text or ""

    # 1. Normalizer & Entity Extraction
    norm_res = normalizer.normalize_text(raw_text)
    display_text = norm_res["display_text"]
    normalized_text = norm_res["normalized_text"]
    entities = norm_res["entities"]

    # 2. Rule Engine
    rule_res = rule_engine.evaluate(display_text, normalized_text)
    signals = rule_res["signals"]
    rule_score = rule_res["rule_score"]
    has_credential_ask = rule_res["has_credential_ask"]
    has_urgency = rule_res["has_urgency"]

    # 3. Dual Text Classifier
    clf_res = text_clf.predict(normalized_text)
    p_scam = clf_res["p_scam"]
    p_scam_lr = clf_res["p_scam_lr"]
    scam_types = clf_res["scam_types"]
    top_tokens = clf_res["top_tokens"]

    # 4. Semantic Vector Similarity Search
    similar_scams = sim_engine.search_similar(raw_text, top_k=3)
    max_sim = float(similar_scams[0]["sim"]) if similar_scams else 0.0

    # 5. URL & UPI Analyzer
    url_score = 0.0
    url_findings = []
    for u in entities.get("urls", [])[:2]:
        u_res = url_upi_analyzer.analyze_url(u)
        url_score = max(url_score, u_res["score"])
        url_findings.extend(u_res["risk_factors"])

    for vpa in entities.get("upi_ids", [])[:2]:
        v_res = url_upi_analyzer.analyze_upi_id(vpa)
        url_score = max(url_score, v_res["score"])
        url_findings.extend(v_res["risk_factors"])

    # 6. Calibrated Stacker Fusion
    fusion = fusion_engine.fuse(
        p_scam=p_scam,
        p_scam_lr=p_scam_lr,
        max_sim=max_sim,
        rule_score=rule_score,
        url_score=url_score,
        has_credential_ask=has_credential_ask,
        has_urgency=has_urgency
    )

    risk = fusion["risk"]
    band = fusion["band"]
    confidence = fusion["confidence"]
    contributions = fusion["contributions"]

    # 7. RAG Authoritative Safe Steps & Summary
    primary_type = scam_types[0]["type"] if scam_types else "kyc_block"
    safe_steps = rag_retriever.retrieve_safe_steps(scam_type=primary_type, risk=risk)
    summary = rag_retriever.generate_summary(
        risk=risk,
        band=band,
        scam_types=scam_types,
        signals=signals,
        entities=entities
    )

    latency_ms = int((time.time() - start_time) * 1000)

    # Response strictly conforms to plan schema
    return {
        "risk": risk,
        "band": band,
        "confidence": confidence,
        "scam_types": scam_types,
        "signals": signals,
        "entities": entities,
        "similar_known_scams": similar_scams,
        "summary": summary,
        "safe_steps": safe_steps,
        "contributions": contributions,
        "top_tokens": top_tokens,
        "latency_ms": latency_ms
    }

@router.post("/analyze/agent")
def analyze_with_agent(req: AnalyzeRequest):
    """Executes multi-step LLM Agent reasoning loop with detailed tool logs."""
    # First get the baseline ML evaluation
    ml_res = analyze_content(req)
    agent_res = agent_runner.run_investigation(req.text, ml_res)

    return {
        **ml_res,
        "risk": agent_res["agent_risk"],
        "band": agent_res["agent_band"],
        "agent_trace": agent_res["trace"],
        "agent_findings": agent_res["findings"],
        "agent_latency_ms": agent_res["latency_ms"]
    }

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """User marks result right/wrong; feeds confirmed scams into FAISS/Vector index."""
    user_feedbacks.append({
        "text": req.text,
        "label": req.label,
        "scam_type": req.scam_type,
        "comment": req.comment,
        "timestamp": time.time()
    })

    added_id = None
    if req.label == "scam" and len(req.text.strip()) > 15:
        added_id = sim_engine.add_sample(req.text, req.scam_type or "user_reported", "scam")

    return {
        "status": "success",
        "message": "Feedback recorded. Item indexed for active learning.",
        "indexed_id": added_id,
        "total_feedback_count": len(user_feedbacks)
    }

