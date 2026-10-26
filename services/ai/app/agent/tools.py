"""
ScamShield Agent Tools Definition
Provides callable investigation tools for the LLM agent:
1. check_url(url)
2. check_upi_id(vpa)
3. search_similar(text)
4. score_transaction(txn)
5. retrieve_advice(scam_type)
"""
from typing import Dict, Any, List
from ..models.url_model import UrlUpiAnalyzer
from ..models.embed import SimilarityEngine
from ..models.txn_model import TransactionModel
from ..rag.retriever import RAGRetriever

url_analyzer = UrlUpiAnalyzer()
sim_engine = SimilarityEngine()
txn_model = TransactionModel()
rag_retriever = RAGRetriever()

def check_url(url: str) -> Dict[str, Any]:
    """Analyzes a URL for brand typosquatting, shorteners, high-risk TLDs, and entropy."""
    return url_analyzer.analyze_url(url)

def check_upi_id(vpa: str) -> Dict[str, Any]:
    """Inspects a UPI Virtual Payment Address (VPA) for fake customer care or refund lookalikes."""
    return url_analyzer.analyze_upi_id(vpa)

def search_similar(text: str) -> List[Dict[str, Any]]:
    """Searches vector index of confirmed scam complaints for cosine matches."""
    return sim_engine.search_similar(text, top_k=3)

def score_transaction(txn: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluates PaySim banking transaction risk with GBDT and SHAP attribution."""
    return txn_model.score(txn)

def retrieve_advice(scam_type: str) -> List[Dict[str, str]]:
    """Fetches official regulatory and cybercrime safe steps for the given scam type."""
    return rag_retriever.retrieve_safe_steps(scam_type=scam_type, risk=85)

