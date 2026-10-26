"""
ScamShield RAG Knowledge Base Loader & Chunk Indexer
Parses markdown front-matter and splits advisories into overlapping chunks.
"""
import os
import re
from typing import List, Dict, Any

KB_DIR = os.path.join(os.path.dirname(__file__), "../../../../kb")

class KnowledgeBaseLoader:
    @staticmethod
    def load_documents() -> List[Dict[str, Any]]:
        docs = []
        dir_path = os.path.abspath(KB_DIR)
        if not os.path.exists(dir_path):
            return docs

        for fname in os.listdir(dir_path):
            if not fname.endswith(".md"):
                continue
            fpath = os.path.join(dir_path, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            doc = KnowledgeBaseLoader._parse_md(content, fname)
            docs.append(doc)

        return docs

    @staticmethod
    def _parse_md(content: str, filename: str) -> Dict[str, Any]:
        meta = {
            "title": filename.replace(".md", "").replace("_", " ").title(),
            "source_url": "https://cybercrime.gov.in",
            "scam_types": []
        }
        body = content

        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                front_matter = parts[1]
                body = parts[2].strip()

                for line in front_matter.strip().split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip().lower()
                        v = v.strip().strip('"').strip("'")
                        if k == "title":
                            meta["title"] = v
                        elif k == "source_url":
                            meta["source_url"] = v
                        elif k == "scam_types":
                            # Parse JSON-like list or comma separated
                            types = re.findall(r'[\w\-]+', v)
                            meta["scam_types"] = types

        chunks = KnowledgeBaseLoader._chunk_text(body, chunk_size=300, overlap=50)

        return {
            "filename": filename,
            "title": meta["title"],
            "source_url": meta["source_url"],
            "scam_types": meta["scam_types"],
            "chunks": chunks
        }

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
        # Split text by lines and sentences
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        for p in paragraphs:
            # Clean markdown header symbols
            cleaned = re.sub(r'#+\s*', '', p)
            if len(cleaned) < chunk_size:
                chunks.append(cleaned)
            else:
                words = cleaned.split()
                step = chunk_size - overlap
                for i in range(0, len(words), step):
                    chunk_words = words[i:i + chunk_size]
                    if len(chunk_words) > 10:
                        chunks.append(" ".join(chunk_words))
        return chunks

