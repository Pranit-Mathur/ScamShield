"""
ScamShield Deterministic Rule Engine
Evaluates structural patterns, known scam indicators, urgency language,
credential harvesting, impersonation, and returns explainable spans with weights.
"""
import re
import unicodedata
from typing import List, Dict, Any

RULES_CONFIG = [
    {
        "id": "credential_ask",
        "category": "Credential Harvesting",
        "label": "Requests Secret Credentials (OTP/PIN/CVV/Password)",
        "weight": 0.35,
        "patterns": [
            r"\b(?:share|enter|send|provide|verify|input|submit)\s+(?:your\s+)?(?:o\s*t\s*p|one\s+time\s+password|p\s*i\s*n|mpin|cvv|password|passcode|secret\s+code)\b",
            r"\b(?:o\s*t\s*p|p\s*i\s*n|mpin|cvv|password)\s+(?:is\s+required|needed|verification)\b",
            r"\bdo\s+not\s+share\s+otp\s+with\s+anyone\b.*?(?:call|send|share)",
            r"\benter\s+(?:upi\s+)?pin\s+to\s+receive\b"
        ]
    },
    {
        "id": "urgency_threat",
        "category": "High Urgency / Coercive Deadline",
        "label": "Artificial Urgency & Threat of Disconnection/Block",
        "weight": 0.25,
        "patterns": [
            r"\b(?:within\s+(?:24|12|2|1|48)\s*(?:hours|hrs|mins|minutes)|immediately|urgent(?:ly)?|without\s+delay|at\s+once)\b",
            r"\b(?:account|card|sim|connection|pan|services?)\s+(?:will\s+be|has\s+been|is)\s+(?:blocked|suspended|deactivated|terminated|closed|frozen)\b",
            r"\b(?:electricity|power)\s+(?:power\s+)?(?:will\s+be\s+disconnected|cutoff|disconnected)\b",
            r"\b(?:power\s+cutoff|disconnected)\s+tonight\b",
            r"\blast\s+(?:reminder|chance|notice|warning)\b",
            r"\b(?:previous\s+month\s+)?bill\s+(?:was\s+)?not\s+updated\b"
        ]
    },
    {
        "id": "authority_impersonation",
        "category": "Brand / Authority Impersonation",
        "label": "Posing as Official Institution or Law Enforcement",
        "weight": 0.22,
        "patterns": [
            r"\b(?:rbi|reserve\s+bank|sbi|hdfc|icici|axis|kotak|pnb|paytm|phonepe|gpay|bank)\s+(?:alert|officer|manager|security|compliance|desk|account|consumer)\b",
            r"\b(?:mha|cbi|trai|customs|cyber\s+crime|police|enforcement\s+directorate|income\s+tax\s+department)\b",
            r"\bdigital\s+arrest\b",
            r"\b(?:your\s+)?kyc\s+(?:is\s+pending|expired|verification\s+failed|incomplete|update|suspended)\b",
            r"\b(?:electricity|bank)\s+officer\b"
        ]
    },
    {
        "id": "money_in_disguise",
        "category": "Payment Inversion / Collect Request",
        "label": "Deceptive Inflow: 'Scan to Receive Money' / Collect Trap",
        "weight": 0.30,
        "patterns": [
            r"\bscan\s+(?:this\s+)?(?:qr|qr\s*code)\s+to\s+receive\s+(?:money|payment|cashback|refund)\b",
            r"\b(?:approve|accept)\s+(?:collect|payment)\s+request\s+to\s+(?:credit|get|claim)\b",
            r"\b(?:approved\s+)?refund\s+(?:of\s+)?(?:₹|rs\.?|inr)?\s*[\d,]+.*?(?:pending|claim|verify|receive)\b",
            r"\bupi\s+ref(?:und)?\s+approval\b"
        ]
    },
    {
        "id": "lottery_task_lure",
        "category": "Unrealistic Financial Incentive",
        "label": "Lottery / Task Scam / Easy Earnings",
        "weight": 0.28,
        "patterns": [
            r"\b(?:congratulations|winner|lucky\s+draw|won\s+(?:₹|rs\.?|inr|cash|lottery|prize|25\s*lakh))\b",
            r"\b(?:part-time|work\s+from\s+home|daily\s+income|earn\s+daily)\s*(?:of\s*)?(?:₹|rs\.?|inr)?\s*[\d,]+\s*(?:to|-)\s*(?:₹|rs\.?|inr)?\s*[\d,]+\b",
            r"\blike\s+(?:youtube\s+)?videos\s+and\s+earn\b",
            r"\btelegram\s+(?:task|channel|group|merchant)\b",
            r"\bjoin\s+telegram\b"
        ]
    },
    {
        "id": "remote_access_malware",
        "category": "Remote Access / Dangerous Tool",
        "label": "Instructs Installation of Screen-Share or Unknown APK",
        "weight": 0.38,
        "patterns": [
            r"\b(?:install|download|run)\s+(?:anydesk|teamviewer|rustdesk|quicksupport|screen\s*share|airdroid)\b",
            r"\bdownload\s+(?:app|file|apk)\s+from\s+(?:link|below|http|www)\b",
            r"\b\.apk\b"
        ]
    },
    {
        "id": "unverified_links_shorteners",
        "category": "Suspicious Link / Channel",
        "label": "Shortened or Suspicious TLD / Contact Mechanism",
        "weight": 0.20,
        "patterns": [
            r"\b(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy|goo\.gl)/[a-zA-Z0-9_\-]+",
            r"https?://[a-zA-Z0-9.-]+\.(?:xyz|top|tk|club|work|click|live|icu|cfd|online|link|cam)(?:/[^\s]*)?",
            r"https?://(?:\d{1,3}\.){3}\d{1,3}(?:/[^\s]*)?",
            r"\b(?:whatsapp|contact|call|reach)\s+(?:us\s+at\s+|on\s+)?\+?[0-9]{10,12}\b"
        ]
    }
]

class RuleEngine:
    def __init__(self):
        self.rules = RULES_CONFIG

    def _make_aligned_text(self, text: str) -> str:
        """
        Creates a string of exact identical length to original text by
        de-obfuscating leetspeak only within words that contain letters.
        Maintains 1-to-1 character index mapping with original text.
        """
        leet_map = {'@': 'a', '4': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't'}
        out = []
        for segment in re.split(r'(\s+)', text):
            if not segment.strip():
                out.append(segment)
                continue
            has_letters = bool(re.search(r'[a-zA-Z@$]', segment))
            if not has_letters:
                out.append(segment)
                continue
            out.append(''.join(leet_map.get(c, c) for c in segment))
        return ''.join(out)

    def evaluate(self, text: str, normalized_text: str = None) -> Dict[str, Any]:
        """
        Runs all rules over text and aligned text.
        Calculates matched rules, total rule score (bounded 0..1), and exact character spans in original text.
        """
        matched_signals = []
        raw_score = 0.0
        aligned_text = self._make_aligned_text(text)

        for rule in self.rules:
            spans = []
            for pat in rule["patterns"]:
                # 1. Search in original raw text
                for m in re.finditer(pat, text, re.IGNORECASE):
                    if 0 <= m.start() < m.end() <= len(text):
                        spans.append([m.start(), m.end()])

                # 2. Search in aligned text (same exact length, de-leeted)
                for m in re.finditer(pat, aligned_text, re.IGNORECASE):
                    if 0 <= m.start() < m.end() <= len(text):
                        spans.append([m.start(), m.end()])

            if spans:
                merged_spans = self._merge_spans(spans)
                weight = rule["weight"]
                raw_score += weight
                matched_signals.append({
                    "id": rule["id"],
                    "category": rule["category"],
                    "label": rule["label"],
                    "weight": weight,
                    "spans": merged_spans
                })

        # Cap rule score at 1.0 with sigmoid dampening
        rule_score = min(1.0, raw_score * 0.85)

        has_credential_ask = any(s["id"] == "credential_ask" for s in matched_signals)
        has_urgency = any(s["id"] == "urgency_threat" for s in matched_signals)

        return {
            "signals": matched_signals,
            "rule_score": round(rule_score, 4),
            "raw_sum": round(raw_score, 4),
            "has_credential_ask": 1.0 if has_credential_ask else 0.0,
            "has_urgency": 1.0 if has_urgency else 0.0
        }

    def _merge_spans(self, spans: List[List[int]]) -> List[List[int]]:
        if not spans:
            return []
        sorted_spans = sorted(spans, key=lambda x: (x[0], x[1]))
        merged = [sorted_spans[0][:]]
        for curr in sorted_spans[1:]:
            prev = merged[-1]
            if curr[0] <= prev[1]:
                prev[1] = max(prev[1], curr[1])
            else:
                merged.append(curr[:])
        return merged


