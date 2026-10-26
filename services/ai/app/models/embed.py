"""
ScamShield Semantic Embedding & Similarity Engine (Pure NumPy)
Builds subword char-wb & word TF-IDF vectors, computes cosine similarity,
and maintains an in-memory index of verified scam samples.
"""
import json
import os
import math
import re
from typing import List, Dict, Any
import numpy as np

DATA_PATH = os.path.join(os.path.dirname(__file__), "../../../../ml/data/curated_scams.json")

def extract_ngrams(text: str, n_min=1, n_max=3) -> Dict[str, int]:
    clean = re.sub(r'[^\w\s]', ' ', text.lower())
    words = clean.split()
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
        for n in range(3, min(6, len(w) + 1)):
            for i in range(len(w) - n + 1):
                sub = f"#{w[i:i+n]}#"
                counts[sub] = counts.get(sub, 0) + 1
    return counts

class SimilarityEngine:
    def __init__(self):
        self.samples = []
        self.vocab = {}
        self.idf = {}
        self.doc_vectors = []
        self._load_and_fit()

    def _load_and_fit(self):
        norm_path = os.path.abspath(DATA_PATH)
        if os.path.exists(norm_path):
            with open(norm_path, "r", encoding="utf-8") as f:
                self.samples = json.load(f)
        else:
            self.samples = []

        if not self.samples:
            return

        # Build vocabulary & document frequencies
        doc_counts = []
        df = {}
        for s in self.samples:
            counts = extract_ngrams(s["text"])
            doc_counts.append(counts)
            for k in counts.keys():
                df[k] = df.get(k, 0) + 1

        n_docs = len(self.samples)
        # Filter top vocabulary items
        sorted_vocab = sorted([k for k, v in df.items() if v >= 1], key=lambda x: df[x], reverse=True)[:1500]
        self.vocab = {k: idx for idx, k in enumerate(sorted_vocab)}
        self.idf = {k: math.log((1 + n_docs) / (1 + df[k])) + 1.0 for k in self.vocab}

        # Vectorize all documents
        self.doc_vectors = []
        for counts in doc_counts:
            vec = self._vectorize(counts)
            self.doc_vectors.append(vec)

    def _vectorize(self, counts: Dict[str, int]) -> np.ndarray:
        vec = np.zeros(len(self.vocab), dtype=np.float32)
        for term, c in counts.items():
            if term in self.vocab:
                idx = self.vocab[term]
                tf = 1.0 + math.log(c) if c > 0 else 0
                vec[idx] = tf * self.idf[term]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def search_similar(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.samples or not self.vocab or not query.strip():
            return []

        q_counts = extract_ngrams(query)
        q_vec = self._vectorize(q_counts)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        sims = []
        for idx, doc_vec in enumerate(self.doc_vectors):
            dot = float(np.dot(q_vec, doc_vec))
            sims.append((idx, dot))

        sims.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in sims[:top_k]:
            sample = self.samples[idx]
            results.append({
                "id": sample.get("id", f"sample_{idx}"),
                "text": sample.get("text", ""),
                "sim": round(max(0.0, min(1.0, float(score))), 3),
                "type": sample.get("scam_type", "unknown"),
                "label": sample.get("label", "scam")
            })

        return results

    def add_sample(self, text: str, scam_type: str, label: str = "scam") -> str:
        new_id = f"custom_{len(self.samples) + 1}"
        new_sample = {
            "id": new_id,
            "text": text,
            "label": label,
            "scam_type": scam_type,
            "lang": "en"
        }
        self.samples.append(new_sample)
        self._load_and_fit()
        return new_id

