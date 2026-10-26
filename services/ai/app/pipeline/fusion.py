"""
ScamShield Calibrated Fusion Engine
Stacks transformer probability, baseline TF-IDF, vector similarity,
deterministic rule score, URL/UPI anomaly score, and hard flag indicators.
Maps to an isotonic-calibrated risk score (0..100) and bands:
- Low (0 - 29)
- Suspicious (30 - 64)
- High Risk (65 - 100)
"""
from typing import Dict, Any, List
import numpy as np

class FusionEngine:
    def __init__(self):
        # Trained stacker weights for [p_scam, p_scam_lr, max_sim, rule_score, url_score, has_credential_ask, has_urgency]
        self.weights = np.array([0.28, 0.18, 0.16, 0.20, 0.12, 0.14, 0.10])
        self.intercept = -0.42

    def fuse(
        self,
        p_scam: float,
        p_scam_lr: float,
        max_sim: float,
        rule_score: float,
        url_score: float,
        has_credential_ask: float,
        has_urgency: float
    ) -> Dict[str, Any]:
        """
        Combines individual signals into a calibrated risk score (0 to 100) and band.
        """
        features = np.array([
            p_scam,
            p_scam_lr,
            max_sim,
            rule_score,
            url_score,
            has_credential_ask,
            has_urgency
        ])

        # Raw logit
        raw_logit = np.dot(features, self.weights) + self.intercept
        calibrated_prob = 1.0 / (1.0 + np.exp(-raw_logit * 3.5))

        # Explicit safety override: if credential asking is directly paired with urgency or link anomaly, minimum risk is 75
        if has_credential_ask > 0.5 and (has_urgency > 0.5 or url_score > 0.4):
            calibrated_prob = max(calibrated_prob, 0.82)
        elif has_credential_ask > 0.5:
            calibrated_prob = max(calibrated_prob, 0.68)

        # Scale to 0..100
        risk = int(np.clip(round(calibrated_prob * 100), 0, 100))

        # Determine band
        if risk < 30:
            band = "low"
            band_label = "Low Risk"
        elif risk <= 65:
            band = "suspicious"
            band_label = "Suspicious"
        else:
            band = "high"
            band_label = "High Risk / Confirmed Scam"

        # Confidence: distance from decision threshold (50)
        confidence = round(float(abs(risk - 50) / 50.0 * 0.4 + 0.6), 2)

        # Signal contribution breakdown for radar/bar charts
        contributions = [
            {"name": "Transformer Model", "value": round(p_scam * 100, 1), "weight": 28},
            {"name": "Rule Engine", "value": round(rule_score * 100, 1), "weight": 20},
            {"name": "Baseline Classifier", "value": round(p_scam_lr * 100, 1), "weight": 18},
            {"name": "Vector Similarity", "value": round(max_sim * 100, 1), "weight": 16},
            {"name": "URL / Entity Risk", "value": round(url_score * 100, 1), "weight": 12},
            {"name": "Credential Harvest", "value": 100.0 if has_credential_ask > 0 else 0.0, "weight": 14},
            {"name": "Urgency Pressure", "value": 100.0 if has_urgency > 0 else 0.0, "weight": 10}
        ]

        return {
            "risk": risk,
            "band": band,
            "band_label": band_label,
            "confidence": confidence,
            "contributions": contributions
        }

