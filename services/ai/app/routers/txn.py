"""
ScamShield Transaction Stream & Graph Router
Manages:
- Live streaming transactions (PaySim simulation)
- NetworkX account graph inspection
- Attack injection (coordinated mule-ring burst for live demonstration)
"""
import random
import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..models.txn_model import TransactionModel
from ..models.graph import AccountGraph

router = APIRouter(prefix="/txn", tags=["transactions"])

txn_model = TransactionModel()
account_graph = AccountGraph()

PEOPLE_NAMES = ["Amit", "Rohit", "Sneha", "Vikram", "Neha", "Pooja", "Arjun", "Kiran", "Deepak", "Ananya"]
MERCHANTS = ["Swiggy", "Zomato", "Amazon Pay", "Flipkart", "Uber", "BigBasket", "BookMyShow", "Tata Power"]

@router.get("/stream-sample")
def get_stream_sample(count: int = 15):
    """
    Generates a realistic, continuous stream of live transactions across
    low, suspicious, and high risk bands with real-time ML risk scores.
    """
    sample_txns = []
    for _ in range(count):
        roll = random.random()

        if roll < 0.55:
            # Profile 1: Routine Merchant / Retail Payment (Low risk: 5 - 22%)
            sender = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            recipient = f"merch_{random.choice(MERCHANTS).lower().replace(' ', '')}"
            amount = round(random.uniform(120, 3800), 2)
            orig_bal = amount + random.uniform(8000, 60000)
            dest_bal = random.uniform(15000, 95000)
            txn_type = "PAYMENT"
            dest_new = False

        elif roll < 0.78:
            # Profile 2: Standard P2P / Bill Pay to known contact (Low to Moderate: 20 - 38%)
            sender = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            recipient = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            while recipient == sender:
                recipient = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            amount = round(random.uniform(2500, 15000), 2)
            orig_bal = amount + random.uniform(5000, 25000)
            dest_bal = random.uniform(3000, 25000)
            txn_type = "TRANSFER"
            dest_new = False

        elif roll < 0.90:
            # Profile 3: Borderline Suspicious Drain / First-Time Beneficiary (Suspicious: 40 - 64%)
            sender = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            recipient = f"contact_{random.randint(1000, 9999)}"
            amount = round(random.uniform(14000, 48000), 2)
            orig_bal = round(amount / random.uniform(0.55, 0.78), 2)
            dest_bal = round(random.uniform(0, 1500), 2)
            txn_type = "TRANSFER"
            dest_new = random.random() < 0.65

        else:
            # Profile 4: Coordinated Laundering Drain / Cashout (High risk: 72 - 98%)
            sender = f"user_{random.choice(PEOPLE_NAMES).lower()}_{random.randint(100, 999)}"
            recipient = f"mule_acc_{random.randint(1000, 9999)}"
            amount = round(random.uniform(45000, 195000), 2)
            orig_bal = amount + random.uniform(200, 2500)
            dest_bal = 0.0
            txn_type = random.choice(["TRANSFER", "CASH_OUT"])
            dest_new = True

        txn_data = {
            "txn_id": f"TXN{int(time.time()*1000)%10000000}_{random.randint(10, 99)}",
            "sender": sender,
            "recipient": recipient,
            "amount": amount,
            "type": txn_type,
            "timestamp": time.strftime("%H:%M:%S"),
            "oldbalanceOrg": orig_bal,
            "newbalanceOrig": max(0.0, orig_bal - amount),
            "oldbalanceDest": dest_bal,
            "newbalanceDest": dest_bal + amount,
            "destination_new": dest_new
        }

        # Score with ML
        scored = txn_model.score(txn_data)
        txn_data["risk"] = scored["risk"]
        txn_data["band"] = scored["band"]
        txn_data["top_features"] = scored["top_features"]
        sample_txns.append(txn_data)

    return {"transactions": sample_txns}

@router.get("/graph")
def get_account_graph():
    """Returns current account graph topology with detected mule scores and communities."""
    return account_graph.analyze_graph()

@router.post("/inject-attack")
def inject_mule_attack():
    """Injects a coordinated mule ring burst into the graph for live detection."""
    attack_summary = account_graph.inject_mule_attack()
    updated_graph = account_graph.analyze_graph()
    return {
        "status": "success",
        "attack_summary": attack_summary,
        "graph": updated_graph
    }

@router.post("/reset-graph")
def reset_account_graph():
    """Resets the account graph back to the clean baseline topology."""
    clean_graph = account_graph.reset_to_baseline()
    return {
        "status": "success",
        "graph": clean_graph
    }


