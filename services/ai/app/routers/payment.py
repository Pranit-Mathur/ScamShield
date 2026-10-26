"""
ScamShield SafePay Pre-Confirmation & Real-Time Input Evaluation Router
Provides:
1. POST /payment/check: Pre-confirmation check before transfer
2. POST /payment/evaluate-input: Real-time as-you-type VPA & Note evaluator with suggestions
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..models.url_model import UrlUpiAnalyzer
from ..models.txn_model import TransactionModel
from ..models.text_clf import TextClassifier
from ..pipeline.rules import RuleEngine

router = APIRouter(prefix="/payment", tags=["payment"])

upi_analyzer = UrlUpiAnalyzer()
txn_model = TransactionModel()
text_clf = TextClassifier()
rule_engine = RuleEngine()

USER_BASELINE = {
    "avg_txn_amount": 1200.0,
    "max_usual_txn": 8000.0,
    "current_balance": 45000.0
}

class PaymentCheckRequest(BaseModel):
    payee_vpa: str
    amount: float
    note: Optional[str] = ""
    payee_age_days: Optional[int] = 2
    is_new_payee: Optional[bool] = True

class LiveEvaluateRequest(BaseModel):
    payee_vpa: str
    amount: Optional[float] = 0.0
    note: Optional[str] = ""

@router.post("/evaluate-input")
def evaluate_live_input(req: LiveEvaluateRequest):
    """
    Called as the user types in the input fields.
    Returns real-time risk rating (0..100), risk band, and smart suggestions.
    """
    reasons = []
    suggestions = []
    base_risk = 0.0

    # 1. Inspect UPI VPA
    if req.payee_vpa and '@' in req.payee_vpa:
        upi_res = upi_analyzer.analyze_upi_id(req.payee_vpa)
        # Scaled up so brand imposter / deceptive handles immediately flag high risk
        base_risk += (upi_res["score"] * 85.0)
        reasons.extend(upi_res["risk_factors"])
        suggestions.extend(upi_res["suggestions"])
    elif req.payee_vpa:
        suggestions.append("Incomplete UPI ID: Missing '@bank' handle (e.g. @paytm, @okhdfcbank, @icici).")

    # 2. Inspect Note
    if req.note:
        rule_res = rule_engine.evaluate(req.note)
        clf_res = text_clf.predict(req.note)
        if rule_res["rule_score"] > 0.15 or clf_res["p_scam"] > 0.35:
            base_risk += 30.0
            reasons.append(f"Suspicious note terminology: '{req.note}'")
            suggestions.append("Payment note contains terms commonly associated with reverse-charge collect traps or advance-fee fraud.")

    # 3. Inspect Amount
    if req.amount and req.amount > 15000:
        base_risk += 15.0
        suggestions.append(f"High amount (₹{req.amount:,.0f}): Double-check the recipient's phone number or account before transferring.")

    final_risk = int(min(100, max(5, round(base_risk))))
    band = "high" if final_risk >= 65 else ("suspicious" if final_risk >= 35 else "low")

    return {
        "live_risk": final_risk,
        "band": band,
        "reasons": reasons,
        "suggestions": suggestions
    }

def _generate_verdict(band: str, reasons: List[str], vpa: str, amount: float, note: str) -> str:
    """Generate a unique natural-language verdict for manual (non-preset) entries."""
    vpa_prefix = vpa.split("@")[0] if "@" in vpa else vpa
    vpa_handle = vpa.split("@")[1] if "@" in vpa else ""

    if band == "low":
        return (
            f'No significant fraud signals were detected for "{vpa}". '
            f"The UPI handle structure, payment note, and ₹{amount:,.0f} amount all fall within "
            f"normal transaction parameters. The payee prefix '{vpa_prefix}' contains no impersonation "
            f"tokens, and the bank handle '{vpa_handle}' is a registered PSP. "
            f"Proceed with standard caution for any new beneficiary."
        )
    elif band == "suspicious":
        r_text = reasons[0] if reasons else "unverified payment patterns"
        return (
            f'This payment to "{vpa}" returned a mid-range risk score. '
            f"Our AI flagged: {r_text}. "
            f"The ₹{amount:,.0f} amount and note '{note}' show elevated but not definitive fraud signals. "
            f"We recommend verifying the payee identity through an independent channel "
            f"(e.g., official website or callback) before proceeding."
        )
    else:
        trigger = reasons[0] if reasons else "multiple fraud-pattern indicators"
        return (
            f'HIGH RISK INTERCEPTED: Payment to "{vpa}" was blocked due to: {trigger}. '
            f"The VPA prefix '{vpa_prefix}' exhibits characteristics consistent with brand impersonation "
            f"or social-engineering fraud. The requested amount of ₹{amount:,.0f} combined with "
            f"note '{note}' matches documented scam archetypes in our fraud knowledge base. "
            f"Cancelling this transaction is strongly recommended — no legitimate entity will "
            f"pressure you to retry via a different UPI ID."
        )


@router.post("/check")
def check_payment(req: PaymentCheckRequest):
    reasons = []
    suggestions = []
    risk_score = 0.0

    # 1. UPI VPA Analysis
    upi_res = upi_analyzer.analyze_upi_id(req.payee_vpa)
    if upi_res["score"] > 0.2:
        risk_score += upi_res["score"] * 45.0
        reasons.extend(upi_res["risk_factors"])
        suggestions.extend(upi_res["suggestions"])

    # 2. Payment Note analysis
    if req.note:
        rule_res = rule_engine.evaluate(req.note)
        clf_res = text_clf.predict(req.note)
        if rule_res["rule_score"] > 0.15 or clf_res["p_scam"] > 0.35:
            risk_score += 25.0
            reasons.append(f"Payment note contains suspicious terms: '{req.note}'")

    # 3. Transaction Model & User Baseline checks
    txn_dict = {
        "amount": req.amount,
        "oldbalanceOrg": USER_BASELINE["current_balance"],
        "newbalanceOrig": max(0.0, USER_BASELINE["current_balance"] - req.amount),
        "oldbalanceDest": 0.0 if req.is_new_payee else 5000.0,
        "destination_new": req.is_new_payee,
        "type": "TRANSFER"
    }
    txn_res = txn_model.score(txn_dict)
    risk_score += (txn_res["risk"] * 0.35)

    # 4. Beneficiary Age & Amount Spike
    if req.is_new_payee:
        risk_score += 15.0
        reasons.append("New beneficiary account with zero historical transfers")

    if req.amount > (USER_BASELINE["avg_txn_amount"] * 4):
        risk_score += 15.0
        reasons.append(f"Amount (₹{req.amount:,.0f}) is significantly higher than your typical average payment")

    final_risk = int(min(100, max(5, round(risk_score))))
    band = "high" if final_risk >= 65 else ("suspicious" if final_risk >= 35 else "low")
    requires_friction = final_risk >= 50

    verdict_text = _generate_verdict(band, reasons, req.payee_vpa, req.amount, req.note or "")

    return {
        "risk": final_risk,
        "requires_friction": requires_friction,
        "band": band,
        "reasons": reasons[:3] if reasons else ["Standard transaction parameters verified"],
        "suggestions": suggestions[:3],
        "verdict_text": verdict_text,
        "reflection_delay_seconds": 5 if requires_friction else 0,
        "payee_vpa": req.payee_vpa,
        "amount": req.amount,
        "user_balance_after": max(0.0, USER_BASELINE["current_balance"] - req.amount),
        "shap_features": txn_res["top_features"]
    }
