"""
ScamShield Adaptive Bandit Engine
Maintains Bayesian Beta posteriors for user failure probability across 8 scam types.
Uses Thompson Sampling to dynamically serve scenarios targeting the user's weakest skills.
Tracks Scam Resistance Score (0..100) and unlocks achievement badges.
"""
import numpy as np
from typing import Dict, Any, List
from .persona import SCENARIOS

DEFAULT_TYPES = [
    "kyc_block",
    "fake_refund",
    "fake_customer_care",
    "lottery_prize",
    "job_task",
    "loan_app",
    "delivery_bill",
    "impersonation_authority"
]

class BanditEngine:
    def __init__(self):
        # User profile stored in memory (or backed by Mongo in prod)
        self.profile = {
            "resistance_score": 68,
            "skills": {
                "credential_hygiene": 74,
                "urgency_resistance": 65,
                "authority_scrutiny": 70,
                "link_skepticism": 62
            },
            # Beta distribution parameters (alpha = failures + 1, beta = successes + 1)
            "posteriors": {
                st: {"alpha": 1.5, "beta": 2.5} for st in DEFAULT_TYPES
            },
            "history": [],
            "badges": [
                {"id": "first_shield", "name": "First Line of Defense", "icon": "Shield", "earned": True, "date": "2026-10-24"},
                {"id": "mule_spotter", "name": "Mule Ring Spotter", "icon": "Eye", "earned": True, "date": "2026-10-24"},
                {"id": "zero_trust", "name": "Zero-Trust Sentinel", "icon": "Lock", "earned": False, "description": "Reach 85+ Resistance Score"},
                {"id": "phish_hunter", "name": "Phishing Nemesis", "icon": "Award", "earned": False, "description": "Successfully counter 5 hard scenarios"}
            ]
        }

    def select_next_scenario(self, difficulty_override: str = None) -> Dict[str, Any]:
        """
        Applies Thompson Sampling:
        Samples theta ~ Beta(alpha, beta) for each scam type.
        Picks the scam type with highest sampled failure probability theta.
        """
        sampled_threats = {}
        for st, params in self.profile["posteriors"].items():
            theta = np.random.beta(params["alpha"], params["beta"])
            sampled_threats[st] = theta

        target_type = max(sampled_threats, key=sampled_threats.get)

        # Match scenario
        candidates = [s for s in SCENARIOS if s["scam_type"] == target_type]
        if not candidates:
            candidates = SCENARIOS

        if difficulty_override:
            diff_match = [s for s in candidates if s["difficulty"] == difficulty_override]
            if diff_match:
                return diff_match[0]

        return candidates[0]

    def update_outcome(self, scenario_id: str, scam_type: str, passed: bool, score_delta: int, skills_affected: Dict[str, int]):
        """Updates Beta posterior and skill metrics upon scenario completion."""
        if scam_type in self.profile["posteriors"]:
            if passed:
                self.profile["posteriors"][scam_type]["beta"] += 1.0
            else:
                self.profile["posteriors"][scam_type]["alpha"] += 1.0

        # Update overall resistance score
        new_res = max(0, min(100, self.profile["resistance_score"] + score_delta))
        self.profile["resistance_score"] = new_res

        # Update affected skills
        for sk, delta in skills_affected.items():
            if sk in self.profile["skills"]:
                cur = self.profile["skills"][sk]
                self.profile["skills"][sk] = max(10, min(100, cur + delta))

        # Check badge unlocks
        if self.profile["resistance_score"] >= 85:
            for b in self.profile["badges"]:
                if b["id"] == "zero_trust":
                    b["earned"] = True

        self.profile["history"].append({
            "scenario_id": scenario_id,
            "scam_type": scam_type,
            "passed": passed,
            "delta": score_delta
        })

    def get_profile(self) -> Dict[str, Any]:
        """Returns comprehensive user learning profile and skill breakdown."""
        # Calculate failure risk percentages
        risk_breakdown = []
        for st, params in self.profile["posteriors"].items():
            mean_fail_prob = params["alpha"] / (params["alpha"] + params["beta"])
            risk_breakdown.append({
                "type": st,
                "vulnerability_rate": round(float(mean_fail_prob * 100), 1),
                "samples_trained": int(params["alpha"] + params["beta"] - 2)
            })

        return {
            "resistance_score": self.profile["resistance_score"],
            "skills": self.profile["skills"],
            "badges": self.profile["badges"],
            "vulnerabilities": risk_breakdown,
            "total_drills_completed": len(self.profile["history"])
        }

