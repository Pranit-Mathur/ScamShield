"""
ScamShield RAG Retriever & Safe Steps Generator
Retrieves authoritative consumer protection advisories matching detected scam patterns
and generates verified, citation-backed recovery and prevention steps.
"""
from typing import List, Dict, Any
from .loader import KnowledgeBaseLoader

class RAGRetriever:
    def __init__(self):
        self.docs = KnowledgeBaseLoader.load_documents()

    def retrieve_safe_steps(self, scam_type: str = None, risk: int = 50) -> List[Dict[str, str]]:
        """
        Retrieves top-3 relevant safe actions with source citations.
        """
        if risk < 30:
            return [
                {
                    "text": "This message matches standard legitimate patterns. Always verify sender identity before sharing any sensitive details.",
                    "source": "https://rbi.org.in"
                },
                {
                    "text": "Never approve unexpected remote-access requests or share OTPs over phone or chat.",
                    "source": "https://cybercrime.gov.in"
                }
            ]

        # Prioritize documents matching the predicted scam type
        matched_chunks = []
        fallback_chunks = []

        for doc in self.docs:
            is_type_match = scam_type and (scam_type in doc["scam_types"])
            for ch in doc["chunks"]:
                # Prefer bullet points or numbered advice steps
                if any(kw in ch.lower() for kw in ["never", "do not", "call 1930", "report", "freeze", "verify"]):
                    item = {
                        "text": ch.replace("\n", " ").strip(),
                        "source": doc["source_url"],
                        "title": doc["title"]
                    }
                    if is_type_match:
                        matched_chunks.append(item)
                    else:
                        fallback_chunks.append(item)

        results = matched_chunks if matched_chunks else fallback_chunks

        # Deduplicate and return top 3 cleanly formatted steps
        seen = set()
        clean_steps = []
        for r in results:
            summary_snippet = r["text"]
            # If paragraph is long, take first 2 sentences
            sentences = [s.strip() for s in summary_snippet.split(".") if len(s.strip()) > 10]
            if sentences:
                display_txt = ". ".join(sentences[:2]) + "."
                if display_txt not in seen:
                    seen.add(display_txt)
                    clean_steps.append({
                        "text": display_txt,
                        "source": r["source"]
                    })
            if len(clean_steps) >= 3:
                break

        # Fallback if no specific doc matched
        if not clean_steps:
            clean_steps = [
                {
                    "text": "Immediately dial 1930 (National Cyber Crime Helpline) or lodge an incident at cybercrime.gov.in.",
                    "source": "https://cybercrime.gov.in"
                },
                {
                    "text": "Never click unsolicited links, download APK files, or enter your UPI PIN to claim money.",
                    "source": "https://npci.org.in"
                },
                {
                    "text": "Contact your bank's official helpline to block UPI and freeze digital access immediately.",
                    "source": "https://rbi.org.in"
                }
            ]

        return clean_steps

    def generate_summary(
        self,
        risk: int,
        band: str,
        scam_types: List[Dict[str, Any]],
        signals: List[Dict[str, Any]],
        entities: Dict[str, Any]
    ) -> str:
        """
        Synthesizes a plain-language explanation (reading level around grade 8)
        strictly grounded on verified signals (Section 6.10).
        """
        if risk < 30:
            return "This content appears benign. No high-risk pressure tactics, credential asks, or malicious link indicators were detected."

        type_name = scam_types[0]["display_name"] if scam_types else "Suspicious Message"
        reasons = []

        for s in signals:
            reasons.append(s["label"].lower())

        if entities.get("upi_ids"):
            reasons.append(f"mentions UPI ID ({entities['upi_ids'][0]})")
        if entities.get("urls"):
            reasons.append(f"includes external link ({entities['urls'][0]})")

        reasons_text = "; ".join(reasons[:3]) if reasons else "suspicious wording and urgency cues"

        if band == "high":
            return f"CRITICAL FRAUD WARNING: This message exhibits high-confidence characteristics of a {type_name}. Key red flags identified include: {reasons_text}. Do not click links, share OTPs, or transfer any funds."
        else:
            return f"POTENTIAL FRAUD: This message shows signs of a {type_name} due to {reasons_text}. Exercise extreme caution and verify directly through official channels."

