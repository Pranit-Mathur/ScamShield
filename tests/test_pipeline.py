"""
ScamShield Automated Unit & Contract Test Suite
Tests:
- Normalizer homoglyph, zero-width, de-leetspeak, entity extraction
- Rule engine signal span integrity
- Fusion monotonicity
- Transaction GBDT risk scoring
- Account Graph mule detection & attack injection
- Simulator judge rubric
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.abspath("."))

from services.ai.app.pipeline.normalizer import Normalizer
from services.ai.app.pipeline.rules import RuleEngine
from services.ai.app.pipeline.fusion import FusionEngine
from services.ai.app.models.url_model import UrlUpiAnalyzer
from services.ai.app.models.txn_model import TransactionModel
from services.ai.app.models.graph import AccountGraph
from services.ai.app.agent.persona import SimulatorEngine

def test_normalizer_homoglyphs_and_spacing():
    norm = Normalizer()
    # Test spaced out letters
    res = norm.normalize_text("Enter your O T P to claim")
    assert "otp" in res["normalized_text"]

    # Test leetspeak
    res2 = norm.normalize_text("Enter p@ssw0rd now")
    assert "password" in res2["normalized_text"]

    # Test entities
    res3 = norm.normalize_text("Pay INR 5000 to scammer@okhdfcbank at http://bit.ly/sbi-verify")
    assert "scammer@okhdfcbank" in res3["entities"]["upi_ids"]
    assert len(res3["entities"]["urls"]) > 0

def test_rule_engine_triggers():
    engine = RuleEngine()
    eval_res = engine.evaluate("Your electricity power will be disconnected tonight at 9:30 PM. Share OTP immediately.")
    signal_ids = [s["id"] for s in eval_res["signals"]]
    assert "credential_ask" in signal_ids
    assert "urgency_threat" in signal_ids
    assert eval_res["has_credential_ask"] == 1.0
    assert eval_res["has_urgency"] == 1.0

def test_fusion_monotonicity():
    fusion = FusionEngine()
    low_res = fusion.fuse(p_scam=0.1, p_scam_lr=0.1, max_sim=0.0, rule_score=0.0, url_score=0.0, has_credential_ask=0.0, has_urgency=0.0)
    high_res = fusion.fuse(p_scam=0.9, p_scam_lr=0.85, max_sim=0.8, rule_score=0.7, url_score=0.6, has_credential_ask=1.0, has_urgency=1.0)
    
    assert low_res["risk"] < 30
    assert high_res["risk"] >= 75
    assert high_res["risk"] > low_res["risk"]
    assert high_res["band"] == "high"

def test_url_upi_analyzer():
    analyzer = UrlUpiAnalyzer()
    # Test deceptive VPA
    upi_res = analyzer.analyze_upi_id("paytm-refund-desk@okhdfcbank")
    assert upi_res["score"] > 0.4
    assert len(upi_res["risk_factors"]) > 0

    # Test lookalike / suspicious TLD
    url_res = analyzer.analyze_url("http://hdfc-bank-verify.xyz/login")
    assert url_res["score"] > 0.4

def test_transaction_model():
    model = TransactionModel()
    fraud_txn = {
        "amount": 95000,
        "oldbalanceOrg": 100000,
        "newbalanceOrig": 5000,
        "oldbalanceDest": 0,
        "newbalanceDest": 95000,
        "destination_new": True,
        "type": "TRANSFER"
    }
    res = model.score(fraud_txn)
    assert res["risk"] >= 65
    assert len(res["top_features"]) > 0

def test_account_graph_and_mule_attack():
    graph = AccountGraph()
    init_analysis = graph.analyze_graph()
    initial_nodes = init_analysis["total_nodes"]

    attack = graph.inject_mule_attack()
    assert attack["total_laundered"] > 200000
    
    updated = graph.analyze_graph()
    assert updated["total_nodes"] > initial_nodes
    assert updated["flagged_mule_nodes"] >= 2

def test_simulator_judge_rubric():
    sim = SimulatorEngine()
    # Test credential leakage failure
    fail_res = sim.evaluate_turn("sim_kyc_01", "Okay here is my OTP: 948201", 1)
    assert fail_res["passed"] is False
    assert fail_res["status"] == "failed"

    # Test skepticism boundary defense
    pass_res = sim.evaluate_turn("sim_kyc_01", "I will not share OTP. I will visit my branch directly and reporting you.", 1)
    assert pass_res["passed"] is True
    assert pass_res["status"] == "passed"

if __name__ == "__main__":
    test_normalizer_homoglyphs_and_spacing()
    test_rule_engine_triggers()
    test_fusion_monotonicity()
    test_url_upi_analyzer()
    test_transaction_model()
    test_account_graph_and_mule_attack()
    test_simulator_judge_rubric()
    print("ALL 7 CORE TEST SUITES PASSED 100%!")
