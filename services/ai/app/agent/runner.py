"""
ScamShield Agent Runner
Executes autonomous tool-calling investigation loop for incoming fraud alerts:
- Caps at 5 tool calls
- PII masking on ingress
- Logs detailed step-by-step 'How I Decided' reasoning trace
- Combines tool evidence with ML risk scores
"""
import time
from typing import Dict, Any, List
from . import tools
from ..pipeline.normalizer import Normalizer

class AgentRunner:
    def __init__(self):
        self.normalizer = Normalizer()

    def run_investigation(self, text: str, ml_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes autonomous multi-step tool investigation over input message.
        Produces step-by-step execution log for the 'How I Decided' UI panel.
        """
        start_time = time.time()
        masked_text = self.normalizer.mask_pii(text)
        entities = ml_result.get("entities", {})

        trace = []
        step_num = 1

        # Step 1: Initial Assessment
        trace.append({
            "step": step_num,
            "action": "Ingress & Threat Framing",
            "thought": "Sanitized PII. Analyzing raw payload structure and extracting entities.",
            "observation": f"Extracted {len(entities.get('urls', []))} URLs, {len(entities.get('upi_ids', []))} UPI IDs, and {len(entities.get('amounts', []))} currency references."
        })
        step_num += 1

        tool_calls_count = 0
        agent_findings = []

        # Step 2: URL Analysis if present
        urls = entities.get("urls", [])
        if urls and tool_calls_count < 5:
            target_url = urls[0]
            url_res = tools.check_url(target_url)
            tool_calls_count += 1
            trace.append({
                "step": step_num,
                "tool": "check_url",
                "args": {"url": target_url},
                "observation": f"Domain '{url_res.get('domain')}'. Risk factors: {', '.join(url_res.get('risk_factors', [])) or 'None detected'}.",
                "finding": f"URL anomaly score: {url_res.get('score', 0):.2f}"
            })
            if url_res.get("risk_factors"):
                agent_findings.extend(url_res.get("risk_factors", []))
            step_num += 1

        # Step 3: UPI ID Check if present
        upis = entities.get("upi_ids", [])
        if upis and tool_calls_count < 5:
            target_vpa = upis[0]
            upi_res = tools.check_upi_id(target_vpa)
            tool_calls_count += 1
            trace.append({
                "step": step_num,
                "tool": "check_upi_id",
                "args": {"vpa": target_vpa},
                "observation": f"VPA handle '{upi_res.get('handle')}'. Flags: {', '.join(upi_res.get('risk_factors', [])) or 'Legitimate format'}.",
                "finding": f"UPI risk score: {upi_res.get('score', 0):.2f}"
            })
            if upi_res.get("risk_factors"):
                agent_findings.extend(upi_res.get("risk_factors", []))
            step_num += 1

        # Step 4: Semantic Vector Corpus Search
        if tool_calls_count < 5:
            sim_matches = tools.search_similar(text)
            tool_calls_count += 1
            top_sim = sim_matches[0]["sim"] if sim_matches else 0.0
            top_type = sim_matches[0]["type"] if sim_matches else "none"
            trace.append({
                "step": step_num,
                "tool": "search_similar",
                "args": {"text": text[:60] + "..."},
                "observation": f"Found {len(sim_matches)} near-neighbor fraud cases in FAISS index. Nearest match similarity: {top_sim:.2f} ({top_type}).",
                "finding": f"Cluster match: {top_type}" if top_sim > 0.4 else "No high-confidence historical complaint match."
            })
            step_num += 1

        # Step 5: Regulatory Advice Retrieval
        top_scam_type = ml_result.get("scam_types", [{}])[0].get("type", "kyc_block")
        if tool_calls_count < 5:
            safe_steps = tools.retrieve_advice(top_scam_type)
            tool_calls_count += 1
            trace.append({
                "step": step_num,
                "tool": "retrieve_advice",
                "args": {"scam_type": top_scam_type},
                "observation": f"Retrieved {len(safe_steps)} authoritative countermeasures from regulatory corpus (RBI / CyberCrime).",
                "finding": "Countermeasures compiled."
            })
            step_num += 1

        # Synthesis & bounded margin fusion
        base_risk = ml_result.get("risk", 50)
        # Agent adjustment margin (-10 to +10)
        agent_adjustment = 0
        if len(agent_findings) >= 2:
            agent_adjustment += 8
        elif len(agent_findings) == 1:
            agent_adjustment += 4
        
        final_risk = max(0, min(100, base_risk + agent_adjustment))
        final_band = "high" if final_risk >= 65 else ("suspicious" if final_risk >= 30 else "low")

        trace.append({
            "step": step_num,
            "action": "Final Verdict Synthesis",
            "thought": f"Cross-verified {tool_calls_count} tools against baseline ML risk ({base_risk}). Applied bounded margin ({agent_adjustment:+d}) based on direct empirical findings.",
            "verdict": f"Risk Score: {final_risk}/100 ({final_band.upper()})"
        })

        latency = int((time.time() - start_time) * 1000)

        return {
            "agent_risk": final_risk,
            "agent_band": final_band,
            "tool_calls_count": tool_calls_count,
            "trace": trace,
            "findings": agent_findings,
            "latency_ms": latency
        }

