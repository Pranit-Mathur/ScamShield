"""
ScamShield Dynamic Transaction Graph Engine (Multi-Scenario)
Generates dynamic, randomized money mule ring attacks:
1. Multi-tier Mule Ring (Fan-in + Pass-through + Crypto Exit)
2. Smurfing Burst (High-volume micro-transfers pooled into aggregator)
3. Rapid Peel-Chain (Fast successive hops across accounts)
Calculates dynamic risk metrics and updates topology in real-time.
"""
import networkx as nx
from typing import Dict, List, Any
import time
import random

CITIES = ["Kolkata", "Surat", "Nuh", "Jamtara", "Mumbai", "Bengaluru", "Delhi", "Hyderabad"]
EXIT_TYPES = ["crypto_p2p_accumulator", "atm_fast_cashout", "foreign_remittance_node", "hawala_layer3_exit"]

class AccountGraph:
    def __init__(self):
        self.G = nx.DiGraph()
        self.attack_counter = 0
        self._init_baseline_graph()

    def _init_baseline_graph(self):
        now = time.time()
        baseline_transfers = [
            ("acc_vikram", "acc_swiggy_merch", 450, "regular"),
            ("acc_vikram", "acc_landlord_neha", 22000, "regular"),
            ("acc_ananya", "acc_zomato_merch", 620, "regular"),
            ("acc_ananya", "acc_vikram", 350, "regular"),
            ("acc_rohit", "acc_amazon_pay", 4200, "regular"),
            ("acc_priya", "acc_airtel_bill", 999, "regular"),
            ("acc_kiran", "acc_school_fees", 15000, "regular"),
            ("acc_rahul", "acc_uber_india", 380, "regular"),
            ("user_amit_492", "merch_zomato", 320, "regular"),
            ("user_sneha_118", "merch_amazonpay", 1850, "regular")
        ]
        for s, r, amt, tag in baseline_transfers:
            self.add_transfer(s, r, amt, tag, now - 600)

    def add_transfer(self, sender: str, receiver: str, amount: float, tag: str = "regular", timestamp: float = None):
        t = timestamp or time.time()
        if not self.G.has_node(sender):
            self.G.add_node(sender, label=sender, created_at=t, total_in=0.0, total_out=0.0)
        if not self.G.has_node(receiver):
            self.G.add_node(receiver, label=receiver, created_at=t, total_in=0.0, total_out=0.0)

        self.G.nodes[sender]["total_out"] = self.G.nodes[sender].get("total_out", 0.0) + amount
        self.G.nodes[receiver]["total_in"] = self.G.nodes[receiver].get("total_in", 0.0) + amount
        self.G.add_edge(sender, receiver, amount=amount, timestamp=t, tag=tag)

    def inject_mule_attack(self) -> Dict[str, Any]:
        """
        Dynamically generates different randomized laundering ring scenarios:
        1. Smurfing Burst (6 victims -> 2 collector mules -> 1 exit)
        2. Rapid Peel-Chain (1 victim -> 3 relay hops -> 2 cashout exits)
        3. Multi-tier Fan-In (4 victims -> Layer 1 mule -> Layer 2 mule -> crypto exit)
        Clears previous attack nodes to ensure clean visual topology and returns burst transactions.
        """
        self.attack_counter += 1
        now = time.time()

        # Reset to clean baseline so scenarios have distinct, crisp graph topologies
        self.G = nx.DiGraph()
        self._init_baseline_graph()

        scenario_type = self.attack_counter % 3
        city1 = random.choice(CITIES)
        city2 = random.choice([c for c in CITIES if c != city1])
        exit_point = random.choice(EXIT_TYPES)

        burst_txns = []

        if scenario_type == 1:
            # Scenario A: Smurfing Burst (6 victims -> 2 collector mules -> 1 exit)
            num_victims = 6
            victims = [f"victim_{random.choice(['sbi','hdfc','icici','axis','pnb'])}_{random.randint(1000,9999)}" for _ in range(num_victims)]
            mule1 = f"mule_smurf_{city1.lower()}_{random.randint(10,99)}"
            mule2 = f"mule_aggregator_{city2.lower()}_{random.randint(10,99)}"
            exit_node = f"exit_{exit_point}_{random.randint(10,99)}"

            total = 0
            for idx, v in enumerate(victims):
                amt = round(random.uniform(25000, 65000), 2)
                target_mule = mule1 if idx < 3 else mule2
                self.add_transfer(v, target_mule, amt, tag="fraud_fan_in", timestamp=now - 100 + idx*5)
                total += amt
                burst_txns.append({
                    "txn_id": f"TXN_SMURF_{random.randint(10000, 99999)}",
                    "sender": v,
                    "recipient": target_mule,
                    "amount": amt,
                    "type": "TRANSFER",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "risk": round(random.uniform(88.0, 96.5), 1),
                    "band": "high",
                    "top_features": ["smurfing_micro_transfer", "new_recipient", "rapid_fan_in"],
                    "is_fraud": True
                })

            p1 = round(total * 0.48, 2)
            p2 = round(total * 0.49, 2)
            self.add_transfer(mule1, exit_node, p1, tag="fast_passthrough", timestamp=now - 30)
            self.add_transfer(mule2, exit_node, p2, tag="fast_passthrough", timestamp=now - 15)

            burst_txns.append({
                "txn_id": f"TXN_EXIT_{random.randint(10000, 99999)}",
                "sender": mule1,
                "recipient": exit_node,
                "amount": p1,
                "type": "CASH_OUT",
                "timestamp": time.strftime("%H:%M:%S"),
                "risk": 98.4,
                "band": "high",
                "top_features": ["rapid_pass_through_85pct+", "crypto_accumulator_exit"],
                "is_fraud": True
            })

            return {
                "attack_type": "Smurfing Funnel Attack",
                "scenario_id": "smurfing_funnel",
                "ring_size": num_victims + 3,
                "total_laundered": round(total, 2),
                "flagged_accounts": [mule1, mule2, exit_node],
                "burst_transactions": burst_txns
            }

        elif scenario_type == 2:
            # Scenario B: Rapid Peel-Chain (Fast 4-hop relay)
            victim = f"victim_hni_{random.randint(100,999)}"
            mule_a = f"mule_relay1_{city1.lower()}"
            mule_b = f"mule_relay2_{city2.lower()}"
            mule_c = f"mule_splitter_{random.randint(10,99)}"
            exit_a = f"exit_crypto_desk_{random.randint(10,99)}"
            exit_b = f"exit_atm_burst_{random.randint(10,99)}"

            stolen_amt = round(random.uniform(320000, 580000), 2)
            self.add_transfer(victim, mule_a, stolen_amt, tag="fraud_fan_in", timestamp=now - 90)
            self.add_transfer(mule_a, mule_b, round(stolen_amt * 0.98, 2), tag="fast_passthrough", timestamp=now - 60)
            self.add_transfer(mule_b, mule_c, round(stolen_amt * 0.96, 2), tag="fast_passthrough", timestamp=now - 35)
            self.add_transfer(mule_c, exit_a, round(stolen_amt * 0.55, 2), tag="exit_crypto", timestamp=now - 10)
            self.add_transfer(mule_c, exit_b, round(stolen_amt * 0.40, 2), tag="exit_crypto", timestamp=now - 5)

            burst_txns = [
                {
                    "txn_id": f"TXN_PEEL_1_{random.randint(1000, 9999)}",
                    "sender": victim,
                    "recipient": mule_a,
                    "amount": stolen_amt,
                    "type": "TRANSFER",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "risk": 96.2,
                    "band": "high",
                    "top_features": ["account_drain_95pct+", "unusual_velocity"],
                    "is_fraud": True
                },
                {
                    "txn_id": f"TXN_PEEL_2_{random.randint(1000, 9999)}",
                    "sender": mule_a,
                    "recipient": mule_b,
                    "amount": round(stolen_amt * 0.98, 2),
                    "type": "TRANSFER",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "risk": 97.8,
                    "band": "high",
                    "top_features": ["relay_hop_1", "passthrough_ratio_98pct"],
                    "is_fraud": True
                },
                {
                    "txn_id": f"TXN_PEEL_SPLIT_{random.randint(1000, 9999)}",
                    "sender": mule_c,
                    "recipient": exit_a,
                    "amount": round(stolen_amt * 0.55, 2),
                    "type": "CASH_OUT",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "risk": 99.1,
                    "band": "high",
                    "top_features": ["crypto_desk_exit", "splitter_terminal"],
                    "is_fraud": True
                }
            ]

            return {
                "attack_type": "High-Velocity Peel-Chain Relay",
                "scenario_id": "peel_chain",
                "ring_size": 6,
                "total_laundered": stolen_amt,
                "flagged_accounts": [mule_a, mule_b, mule_c, exit_a, exit_b],
                "burst_transactions": burst_txns
            }

        else:
            # Scenario C: Multi-Tier Fan-In Ring
            num_victims = 4
            victims = [f"victim_{random.choice(['pnb','sbi','axis','kotak'])}_{random.randint(1000,9999)}" for _ in range(num_victims)]
            mule1 = f"mule_layer1_{city1.lower()}_{random.randint(10,99)}"
            mule2 = f"mule_layer2_{city2.lower()}_{random.randint(10,99)}"
            exit_node = f"exit_{exit_point}_{random.randint(10,99)}"

            total = 0
            for v in victims:
                amt = round(random.uniform(45000, 95000), 2)
                self.add_transfer(v, mule1, amt, tag="fraud_fan_in", timestamp=now - 120)
                total += amt
                burst_txns.append({
                    "txn_id": f"TXN_FAN_{random.randint(10000, 99999)}",
                    "sender": v,
                    "recipient": mule1,
                    "amount": amt,
                    "type": "TRANSFER",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "risk": 92.4,
                    "band": "high",
                    "top_features": ["fan_in_cluster", "high_velocity_inflow"],
                    "is_fraud": True
                })

            self.add_transfer(mule1, mule2, round(total * 0.97, 2), tag="fast_passthrough", timestamp=now - 60)
            self.add_transfer(mule2, exit_node, round(total * 0.95, 2), tag="exit_crypto", timestamp=now - 10)

            burst_txns.append({
                "txn_id": f"TXN_EXIT_{random.randint(10000, 99999)}",
                "sender": mule2,
                "recipient": exit_node,
                "amount": round(total * 0.95, 2),
                "type": "CASH_OUT",
                "timestamp": time.strftime("%H:%M:%S"),
                "risk": 99.4,
                "band": "high",
                "top_features": ["layer_2_cashout", "crypto_bridge_exit"],
                "is_fraud": True
            })

            return {
                "attack_type": "Multi-tier Fan-In Mule Ring",
                "scenario_id": "fan_in_ring",
                "ring_size": num_victims + 3,
                "total_laundered": round(total, 2),
                "flagged_accounts": [mule1, mule2, exit_node],
                "burst_transactions": burst_txns
            }

    def reset_to_baseline(self) -> Dict[str, Any]:
        """Resets the graph to clean baseline without injected attacks."""
        self.G = nx.DiGraph()
        self._init_baseline_graph()
        return self.analyze_graph()

    def compute_dynamic_mule_score(self, node: str) -> Dict[str, Any]:
        in_edges = list(self.G.in_edges(node, data=True))
        out_edges = list(self.G.out_edges(node, data=True))

        in_d = len(in_edges)
        out_d = len(out_edges)

        total_in = sum(e[2].get("amount", 0.0) for e in in_edges)
        total_out = sum(e[2].get("amount", 0.0) for e in out_edges)

        raw_score = 5.0
        role = "regular"

        if in_d >= 4:
            raw_score += 48.0
            role = "fan_in_hub"
        elif in_d >= 2:
            raw_score += in_d * 14.0

        if total_in > 0 and total_out > 0:
            passthrough_ratio = min(total_out, total_in) / max(total_in, 1.0)
            if passthrough_ratio >= 0.85 and in_d >= 2:
                raw_score += 38.0 * passthrough_ratio
                role = "mule_collector"
            elif passthrough_ratio >= 0.85:
                raw_score += 28.0 * passthrough_ratio
                role = "pass_through_mule"

        if "exit" in node or "crypto" in node or "atm" in node:
            if in_d >= 1 and total_in > 40000:
                raw_score = max(raw_score, 89.0 + (in_d * 2.5))
                role = "exit_aggregator"
        elif "mule" in node:
            raw_score = max(raw_score, 78.0)
            if role == "regular":
                role = "pass_through_mule"
        elif "victim" in node:
            raw_score = 12.0
            role = "victim"
        elif any(k in node for k in ["merch", "swiggy", "zomato", "amazon"]):
            raw_score = min(raw_score, 14.0)
            role = "verified_merchant"

        dynamic_score = round(float(min(98.8, max(4.0, raw_score))), 1)

        return {
            "score": dynamic_score,
            "role": role,
            "in_degree": in_d,
            "out_degree": out_d,
            "total_in": round(total_in, 2),
            "total_out": round(total_out, 2),
            "is_flagged": dynamic_score >= 60.0
        }

    def analyze_graph(self) -> Dict[str, Any]:
        nodes_data = []
        edges_data = []

        for node in self.G.nodes():
            metrics = self.compute_dynamic_mule_score(node)
            nodes_data.append({
                "id": node,
                "label": node.replace("acc_", "").replace("_", " ").title(),
                "in_degree": metrics["in_degree"],
                "out_degree": metrics["out_degree"],
                "total_in": metrics["total_in"],
                "total_out": metrics["total_out"],
                "mule_score": metrics["score"],
                "role": metrics["role"],
                "is_flagged": metrics["is_flagged"]
            })

        for u, v, data in self.G.edges(data=True):
            edges_data.append({
                "source": u,
                "target": v,
                "amount": data.get("amount", 0),
                "tag": data.get("tag", "regular"),
                "is_fraud": data.get("tag") in ["fraud_fan_in", "fast_passthrough", "exit_crypto"]
            })

        total_mules = sum(1 for n in nodes_data if n["is_flagged"])
        fan_in_hubs = [n["id"] for n in nodes_data if n["in_degree"] >= 3]

        return {
            "nodes": nodes_data,
            "edges": edges_data,
            "total_nodes": len(nodes_data),
            "total_edges": len(edges_data),
            "flagged_mule_nodes": total_mules,
            "detected_fan_in_hubs": fan_in_hubs
        }
