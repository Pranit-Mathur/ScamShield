"""
ScamShield URL and UPI-ID Lexical & Lookalike Analyzer (Enhanced)
Deep inspection of UPI Virtual Payment Addresses (VPAs) and URLs:
- Checks deceptive prefixes (refund, support, kyc, prize, care)
- Detects brand impersonation in username (e.g., 'paytm-support', 'sbi-update')
- Checks brand impersonation even when using official bank handles (e.g. paytm-refund@paytm)
- Provides real-time suggestions and advice
"""
import math
import re
from typing import Dict, Any, List
import tldextract
from rapidfuzz import fuzz

TOP_BRANDS = [
    "sbi", "hdfc", "hdfcbank", "icici", "icicibank", "axis", "axisbank", 
    "kotak", "pnb", "punjabbank", "paytm", "phonepe", "gpay", "google", 
    "amazon", "flipkart", "incometax", "cybercrime", "indiapost", "bescom", 
    "tatapower", "airtel", "jio"
]

OFFICIAL_UPI_HANDLES = [
    "okhdfcbank", "okicici", "oksbi", "okaxis", "paytm", "ybl", "ibl",
    "axl", "barodampay", "upi", "aubank", "federal", "pnb", "indus"
]

SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "club", "work", "click", "live", "icu", "cfd",
    "online", "link", "cam", "rest", "buzz", "gq", "ml", "ga", "cf"
}

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "goo.gl",
    "ow.ly", "buff.ly", "tiny.cc", "shorte.st"
}

DECEPTIVE_UPI_KEYWORDS = [
    "refund", "support", "helpdesk", "nodal", "customercare", "care", "help",
    "kyc", "verification", "police", "cyber", "rbi", "claim", "reward", "lottery",
    "officer", "dispute", "cancel", "settlement", "cashback", "reversal",
    "helpline", "executive", "billing", "service", "desk", "agent", "official"
]

def calculate_entropy(s: str) -> float:
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
    return -sum(p * math.log2(p) for p in prob)

class UrlUpiAnalyzer:
    def __init__(self):
        self.extractor = tldextract.TLDExtract(cache_dir=None)

    def analyze_url(self, url: str) -> Dict[str, Any]:
        if not url:
            return {"score": 0.0, "risk_factors": []}

        clean_url = url.strip()
        if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
            clean_url = "http://" + clean_url

        ext = self.extractor(clean_url)
        subdomain = ext.subdomain.lower()
        domain = ext.domain.lower()
        suffix = ext.suffix.lower()
        full_host = f"{domain}.{suffix}" if suffix else domain

        risk_factors = []
        score = 0.0

        if full_host in SHORTENER_DOMAINS or f"{subdomain}.{full_host}" in SHORTENER_DOMAINS:
            risk_factors.append("URL shortener hides true destination domain")
            score += 0.45

        if suffix in SUSPICIOUS_TLDS:
            risk_factors.append(f"High-risk top-level domain (.{suffix}) frequently used in phishing")
            score += 0.40

        if re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', domain):
            risk_factors.append("Raw IP address used instead of reputable domain name")
            score += 0.60

        for brand in TOP_BRANDS:
            if (brand in domain and brand != domain) or (brand in subdomain and brand != domain):
                risk_factors.append(f"Brand '{brand}' spoofed inside domain or subdomain '{full_host}'")
                score += 0.50
                break
            sim = fuzz.ratio(domain, brand)
            if 70 <= sim < 100:
                risk_factors.append(f"Lookalike domain '{domain}' mimics trusted brand '{brand}' ({sim}% match)")
                score += 0.50
                break

        entropy = calculate_entropy(domain)
        if entropy > 3.8 and len(domain) > 10:
            risk_factors.append(f"High lexical randomness (entropy {entropy:.2f})")
            score += 0.25

        return {
            "url": url,
            "domain": full_host,
            "score": round(min(1.0, score), 4),
            "risk_factors": risk_factors
        }

    def analyze_upi_id(self, vpa: str) -> Dict[str, Any]:
        """
        Deep analysis of UPI VPAs with real-time suggestions and suggestions for manual entries.
        """
        if not vpa or '@' not in vpa:
            return {
                "vpa": vpa, 
                "score": 0.0, 
                "risk_factors": [], 
                "suggestions": ["Enter a complete UPI ID (e.g., name@bank or merchant@bank)."]
            }

        username, _, handle = vpa.strip().lower().partition('@')
        risk_factors = []
        suggestions = []
        score = 0.0

        # Clean username tokens
        clean_user_tokens = re.split(r'[-_.]', username)

        # 1. Deceptive keyword checks (e.g. 'refund', 'cashback', 'kyc', 'support')
        matched_deceptive = [kw for kw in DECEPTIVE_UPI_KEYWORDS if kw in username]
        if matched_deceptive:
            risk_factors.append(f"Deceptive keywords in VPA username: '{', '.join(matched_deceptive)}'")
            score += 0.55
            suggestions.append(f"Warning: Legitimate companies never process refunds or customer service through personal UPI handles containing '{matched_deceptive[0]}'.")

        # 2. Impersonation of major brand in username (e.g. 'paytm-care', 'phonepe_refund', 'sbi_desk')
        matched_brands = [b for b in TOP_BRANDS if b in clean_user_tokens or (b in username and len(username) > len(b))]
        if matched_brands:
            brand_name = matched_brands[0]
            # If username is NOT identical to official merchant username
            if username != brand_name:
                risk_factors.append(f"Impersonates company '{brand_name.upper()}' in private handle '{vpa}'")
                score += 0.50
                suggestions.append(f"Security Alert: '{brand_name.upper()}' will NEVER ask customers to send funds to '{vpa}'. Official corporate accounts are verified merchant entities, not individual transfer handles.")

        # 3. Exact official merchant check (e.g. bare 'paytm' or 'swiggy')
        if username in ["paytm", "phonepe", "gpay", "googlepay"] and handle in OFFICIAL_UPI_HANDLES:
            # If someone tries to pay bare paytm@paytm or paytm@icici
            risk_factors.append(f"Attempting direct transfer to corporate brand '{username}'. Verify if this is an authorized billing gateway.")
            score += 0.35
            suggestions.append("Verify merchant credentials before transferring directly to brand handles.")

        # 4. Bank handle mismatch (e.g. 'sbi-care@okhdfcbank' -> claims SBI but uses HDFC)
        for b in ["sbi", "hdfc", "icici", "axis", "kotak", "pnb"]:
            if b in username and b not in handle:
                risk_factors.append(f"Mismatched institution: Claims '{b.upper()}' in username, but uses bank handle '@{handle}'")
                score += 0.45
                suggestions.append(f"Mismatch Detected: Username mentions '{b.upper()}', but bank handle belongs to '@{handle}'. Fraudsters use mismatched handles to deceive victims.")

        # 5. Trailing digits check (burner/disposable mule handle: e.g. 'refund849204928@...')
        if re.search(r'\d{5,}$', username):
            risk_factors.append("Disposable burner VPA pattern (long random trailing digits)")
            score += 0.25
            suggestions.append("Account handle contains disposable trailing digits frequently seen in mule accounts.")

        # If clean
        if not risk_factors:
            suggestions.append("Format matches standard consumer UPI address. Always ensure you know the recipient personally.")

        final_score = min(1.0, score)

        return {
            "vpa": vpa,
            "username": username,
            "handle": handle,
            "score": round(final_score, 4),
            "risk_factors": risk_factors,
            "suggestions": suggestions
        }
