"""
ScamShield Simulator & Adaptive Bandit Router
Handles:
- POST /start: Initializes drill session using Thompson Sampling
- POST /turn: Evaluates user reply, checks resistance behaviors, advances drill
- GET /profile: Fetches Scam Resistance Score, skill posteriors, and achievement badges
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..agent.bandit import BanditEngine
from ..agent.persona import SimulatorEngine, SCENARIOS

router = APIRouter(prefix="/sim", tags=["simulator"])

bandit = BanditEngine()
sim_engine = SimulatorEngine()

class StartDrillRequest(BaseModel):
    scenario_id: Optional[str] = None
    difficulty: Optional[str] = None

class TurnRequest(BaseModel):
    scenario_id: str
    user_reply: str
    turn_number: int

@router.post("/start")
def start_drill(req: StartDrillRequest):
    if req.scenario_id:
        scenario = sim_engine.scenarios.get(req.scenario_id, SCENARIOS[0])
    else:
        # Thompson sampling adaptive pick
        scenario = bandit.select_next_scenario(difficulty_override=req.difficulty)

    return {
        "status": "ready",
        "scenario": scenario,
        "current_resistance_score": bandit.profile["resistance_score"]
    }

@router.post("/turn")
def submit_turn(req: TurnRequest):
    eval_res = sim_engine.evaluate_turn(req.scenario_id, req.user_reply, req.turn_number)
    
    scenario = sim_engine.scenarios.get(req.scenario_id, SCENARIOS[0])
    scam_type = scenario.get("scam_type", "kyc_block")

    # If completed or failed, update bandit posteriors
    if eval_res["status"] in ["passed", "failed"]:
        bandit.update_outcome(
            scenario_id=req.scenario_id,
            scam_type=scam_type,
            passed=eval_res["passed"],
            score_delta=eval_res["score_delta"],
            skills_affected=eval_res["skills_affected"]
        )

    return {
        **eval_res,
        "new_resistance_score": bandit.profile["resistance_score"],
        "turn_number": req.turn_number
    }

@router.get("/profile")
def get_user_profile():
    return bandit.get_profile()

@router.get("/scenarios")
def list_all_scenarios():
    return {"scenarios": SCENARIOS}

