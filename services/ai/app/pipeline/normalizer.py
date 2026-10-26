"""
ScamShield Input Normalizer & Entity Extractor
Implements Unicode NFKC normalization, homoglyph replacement,
de-leetspeak, spaced-out token collapsing, and entity extraction.
"""
import re
import unicodedata
from typing import Dict, List, Tuple, Any

# Cyrillic and Greek homoglyphs to Latin equivalents
HOMOGLYPH_MAP = {
    'а': 'a', 'А': 'A', 'с': 'c', 'С': 'C', 'е': 'e', 'Е': 'E',
    'о': 'o', 'О': 'O', 'р': 'p', 'Р': 'P', 'х': 'x', 'Х': 'X',
    'у': 'y', 'У': 'Y', 'і': 'i', 'І': 'I', 'ј': 'j', 'Ј': 'J',
    'ѕ': 's', 'Ѕ': 'S', 'ԁ': 'd', 'Ԃ': 'D', 'ԛ': 'q', 'Ԝ': 'w',
    'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x',
    'α': 'a', 'β': 'b', 'γ': 'y', 'κ': 'k', 'η': 'n',
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's'
}

# Common leetspeak translations
LEET_DICT = {
    '@': 'a', '4': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i',
    '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', '9': 'g',
    '¥': 'y', '₹': 'rs'
}

ZERO_WIDTH_CHARS = re.compile(r'[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u200E\u200F]')

# Spaced out pattern e.g. "O T P" or "P I N" or "B A N K"
SPACED_PATTERN = re.compile(r'\b([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])(?:\s+([A-Za-z]))?\b')

# UPI handle pattern e.g. user@okhdfcbank, refund98@paytm, secure@icici
UPI_PATTERN = re.compile(r'\b[a-zA-Z0-9.\-_]{2,64}@(?!gmail|yahoo|outlook|hotmail|icloud|proton)[a-zA-Z]{2,32}\b', re.IGNORECASE)

# URL pattern
URL_PATTERN = re.compile(r'(https?://[^\s<>"]+|www\.[^\s<>"]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"]*)?)', re.IGNORECASE)

# Currency amounts (e.g. ₹5,000, Rs. 10000, 50,000 INR)
AMOUNT_PATTERN = re.compile(r'(?:(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr))', re.IGNORECASE)

# Phone numbers (Indian 10-digit formats with optional +91)
PHONE_PATTERN = re.compile(r'(?:\+?91[\s-]?)?[6-9]\d{9}\b')

# Known targeted brands
BRAND_KEYWORDS = [
    "sbi", "state bank", "hdfc", "icici", "axis", "kotak", "pnb",
    "paytm", "phonepe", "gpay", "google pay", "bhim",
    "india post", "electricity", "bescom", "tata power", "bses",
    "income tax", "cbi", "trai", "mha", "police", "customs",
    "amazon", "flipkart", "bluedart", "delhivery"
]


class Normalizer:
    @staticmethod
    def normalize_text(raw_text: str) -> Dict[str, Any]:
        """
        Normalizes input text while tracking character offsets.
        Returns:
            normalized_text: cleaned, homoglyph-mapped, space-collapsed lower text
            display_text: original text cleaned of zero-width control chars
            entities: extracted urls, upi_ids, amounts, phones, brands
        """
        if not raw_text:
            return {
                "raw_text": "",
                "display_text": "",
                "normalized_text": "",
                "entities": {"urls": [], "upi_ids": [], "amounts": [], "phones": [], "brands": []}
            }

        # 1. Strip zero-width and invisible control characters
        clean_text = ZERO_WIDTH_CHARS.sub('', raw_text)

        # 2. Extract Entities from the original text before deep transformation
        entities = Normalizer.extract_entities(clean_text)

        # 3. Unicode NFKC normalization
        nfkc_text = unicodedata.normalize('NFKC', clean_text)

        # 4. Collapse spaced-out letters (e.g., "O T P" -> "OTP")
        def collapse_spaces(match):
            parts = [p for p in match.groups() if p]
            return "".join(parts)

        collapsed_text = SPACED_PATTERN.sub(collapse_spaces, nfkc_text)

        # 5. Homoglyph mapping
        homoglyph_free = []
        for ch in collapsed_text:
            homoglyph_free.append(HOMOGLYPH_MAP.get(ch, ch))
        de_homoglyph_str = "".join(homoglyph_free)

        # 6. De-leetspeak on words
        normalized_tokens = []
        for word in de_homoglyph_str.split():
            # If word is a URL or UPI, preserve it
            if '@' in word or '.' in word:
                normalized_tokens.append(word.lower())
                continue
            
            # Map leet characters
            clean_word = "".join(LEET_DICT.get(c, c) for c in word.lower())
            normalized_tokens.append(clean_word)

        normalized_text = " ".join(normalized_tokens)

        return {
            "raw_text": raw_text,
            "display_text": clean_text,
            "normalized_text": normalized_text,
            "entities": entities
        }

    @staticmethod
    def extract_entities(text: str) -> Dict[str, List[Any]]:
        # URLs
        raw_urls = URL_PATTERN.findall(text)
        urls = []
        for u in raw_urls:
            clean_u = u.rstrip('.,;)]}>"\'')
            if len(clean_u) > 4 and ('.' in clean_u):
                urls.append(clean_u)
        urls = list(dict.fromkeys(urls))

        # UPI IDs
        upi_ids = list(dict.fromkeys(UPI_PATTERN.findall(text)))

        # Amounts
        amounts = []
        for match in AMOUNT_PATTERN.findall(text):
            amt = match[0] or match[1]
            if amt:
                amounts.append(amt.replace(',', ''))
        amounts = list(dict.fromkeys(amounts))

        # Phone numbers
        phones = list(dict.fromkeys(PHONE_PATTERN.findall(text)))

        # Brands
        low_text = text.lower()
        found_brands = [b for b in BRAND_KEYWORDS if re.search(r'\b' + re.escape(b) + r'\b', low_text)]

        return {
            "urls": urls,
            "upi_ids": upi_ids,
            "amounts": amounts,
            "phones": phones,
            "brands": found_brands
        }

    @staticmethod
    def mask_pii(text: str) -> str:
        """Masks sensitive phones, account numbers, card numbers for privacy/logging."""
        masked = PHONE_PATTERN.sub(lambda m: m.group(0)[:3] + "XXXX" + m.group(0)[-3:], text)
        # Mask 12-16 digit card or bank account patterns
        masked = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}(?:[-\s]?\d{4})?\b', '[REDACTED_ACCOUNT]', masked)
        return masked

