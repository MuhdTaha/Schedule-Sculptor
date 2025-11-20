"""
Flask API for Schedule Sculptor RAG system.
Provides a /query endpoint that accepts course-related questions
and returns relevant course recommendations using the FAISS index.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import json
import re

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables for index and model
index = None
chunks_df = None
model = None
config = None

# Query expansion dictionary (same as query.py)
TOPIC_SYNONYMS = {
    r"\bnlp\b": [
        "natural language processing", "computational linguistics",
        "text mining", "language modeling", "transformers", "sequence models"
    ],
    r"\bml\b|\bmachine learning\b": [
        "supervised learning", "unsupervised learning", "classification",
        "regression", "neural networks", "support vector machines", "clustering"
    ],
    r"\bai\b": [
        "artificial intelligence", "knowledge representation", "search algorithms",
        "planning", "intelligent agents"
    ],
    r"\bdata viz\b|\bvisuali[sz]ation\b|\btableau\b": [
        "data visualization", "tableau", "plotting", "dashboards", "visual analytics"
    ],
    r"\bstats?\b|\bstatistics\b": [
        "statistical inference", "probability", "hypothesis testing",
        "regression analysis", "experimental design"
    ],
    r"\boptimization\b|\boperations research\b|\bor\b": [
        "linear programming", "integer programming", "stochastic optimization",
        "operations research"
    ],
    r"\bcomputational biology\b|\bbioinformatics\b": [
        "genomics", "sequence analysis", "biostatistics", "systems biology"
    ],
    r"\bsecurity\b|\bcybersecurity\b": [
        "cryptography", "network security", "secure systems", "access control"
    ],
    r"\bdatabases?\b": [
        "relational databases", "sql", "transaction processing", "query optimization"
    ],
    r"\beconomics?\b|\becon\b": [
        "microeconomics", "macroeconomics", "econometrics"
    ],
    r"\bpsychology\b|\bcognitive\b": [
        "cognitive science", "perception", "human factors", "behavioral science"
    ],
}

def expand_query(q: str) -> str:
    """Add synonyms/related phrases to the query while keeping the original text."""
    q_low = q.lower()
    expansions = []
    for pattern, syns in TOPIC_SYNONYMS.items():
        if re.search(pattern, q_low):
            expansions.extend(syns)
    if expansions:
        return q + " | " + " ; ".join(dict.fromkeys(expansions))
    return q

def load_index():
    """Load FAISS index, chunks CSV, and embedding model on startup."""
    global index, chunks_df, model, config
    
    # Determine index directory path (relative to this file)
    base_path = Path(__file__).resolve().parent
    index_dir = base_path / "data" / "processed" / "index"
    
    idx_path = index_dir / "faiss.index"
    tbl_path = index_dir / "chunks.csv"
    cfg_path = index_dir / "config.json"
    
    if not idx_path.exists() or not tbl_path.exists() or not cfg_path.exists():
        print(f"[app] Missing index files in {index_dir}")
        raise FileNotFoundError(f"Missing index files in {index_dir}")
    
    print(f"[app] Loading index from {index_dir}...")
    index = faiss.read_index(str(idx_path))
    chunks_df = pd.read_csv(tbl_path)
    config = json.loads(cfg_path.read_text())
    model = SentenceTransformer(config["model"])
    print(f"[app] Loaded index with {len(chunks_df):,} chunks")

def retrieve_and_group(query: str, top_courses: int = 8):
    """Retrieve top courses based on query using RAG."""
    
    if index is None or model is None:
        return []
    
    # Expand query
    q_expanded = expand_query(query)
    
    # Encode and search
    q_emb = model.encode([q_expanded], normalize_embeddings=True).astype("float32")
    chunk_k = max(50, top_courses * 5)
    scores, idxs = index.search(q_emb, chunk_k)
    idxs = idxs[0].tolist()
    scores = scores[0].tolist()
    
    # Get matching chunks
    res_df = chunks_df.iloc[idxs].copy()
    res_df.insert(0, "score", scores)
    
    # Group by course (parent_id) and get best chunk per course
    if "metadata.parent_id" not in res_df.columns:
        res_df["metadata.parent_id"] = res_df["id"]
    
    best = (
        res_df
        .sort_values("score", ascending=False)
        .drop_duplicates(subset=["metadata.parent_id"], keep="first")
        .copy()
    )
    
    top = best.head(top_courses).copy()
    
    # Extract fields safely
    def safe_get(row, col, default=""):
        val = row.get(col, default)
        return str(val) if pd.notna(val) else default
    
    results = []
    for _, row in top.iterrows():
        course_code = safe_get(row, "metadata.course_code")
        class_name = safe_get(row, "metadata.class_name")
        subject = safe_get(row, "metadata.subject") or safe_get(row, "metadata.subject_code")
        text = safe_get(row, "text")
        score = float(row["score"]) if "score" in row else 0.0
        
        results.append({
            "course_code": course_code,
            "class_name": class_name,
            "subject": subject,
            "description": text,
            "score": score
        })
    
    return results

@app.route("/")
def home():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Schedule Sculptor RAG API is running"})

@app.route("/query", methods=["POST"])
def query():
    """
    Query endpoint that accepts a question and returns relevant courses.
    
    Expected JSON body:
    {
        "query": "courses about machine learning",
        "top_courses": 8  // optional, default 8
    }
    
    Returns:
    {
        "query": "...",
        "results": [
            {
                "course_code": "CS 412",
                "class_name": "Introduction to Machine Learning",
                "subject": "Computer Science",
                "description": "...",
                "score": 0.85
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or "query" not in data:
            return jsonify({"error": "Missing 'query' field in request"}), 400
        
        user_query = data["query"]
        top_courses = data.get("top_courses", 8)
        
        if not user_query.strip():
            return jsonify({"error": "Query cannot be empty"}), 400
        
        # Retrieve courses
        results = retrieve_and_group(user_query, top_courses)
        
        return jsonify({
            "query": user_query,
            "results": results,
            "count": len(results)
        })
    
    except Exception as e:
        print(f"[app] Error processing query: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    try:
        load_index()
    except Exception as e:
        print(f"[app] Failed to load index: {e}")
        index = chunks_df = model = config = None

    # Read port from environment so frontend and backend can be started on the same port.
    # Default to 5001 to avoid common macOS services on 5000.
    port_env = os.environ.get("RAG_API_PORT") or os.environ.get("PORT") or os.environ.get("RAG_PORT")
    try:
        port = int(port_env) if port_env else 5001
    except ValueError:
        port = 5001

    host = os.environ.get("RAG_API_HOST", "127.0.0.1")
    print(f"[app] Starting Flask server on http://{host}:{port}")
    # Bind to host and port from environment
    app.run(debug=True, host=host, port=port)
