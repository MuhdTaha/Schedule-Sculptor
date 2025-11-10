print("[query] v2 interactive with freeform re-query")
import argparse, json, textwrap, re
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# ----------------------------
# Query expansion (lightweight)
# ----------------------------
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

# ----------------------------
# Index loading / retrieval
# ----------------------------
def load_index(index_dir: Path):
    idx_path = index_dir / "faiss.index"
    tbl_path = index_dir / "chunks.csv"   # stored by build_index.py
    cfg_path = index_dir / "config.json"
    if not idx_path.exists() or not tbl_path.exists() or not cfg_path.exists():
        raise FileNotFoundError(f"Missing index files in {index_dir}")
    index = faiss.read_index(str(idx_path))
    df = pd.read_csv(tbl_path)
    cfg = json.loads(cfg_path.read_text())
    model = SentenceTransformer(cfg["model"])
    print(f"[query] loaded index/table from {index_dir} ({len(df):,} chunks)")
    return index, df, model, cfg

def retrieve_chunks(query: str, k: int, index, df: pd.DataFrame, model: SentenceTransformer):
    # Expand query to be friendlier for broad interests (across all majors)
    q_expanded = expand_query(query)
    q_emb = model.encode([q_expanded], normalize_embeddings=True).astype("float32")
    scores, idxs = index.search(q_emb, k)
    idxs = idxs[0].tolist(); scores = scores[0].tolist()
    res = df.iloc[idxs].copy()
    res.insert(0, "score", scores)  # kept internally; we won't print it
    return res

# ----------------------------
# Grouping / presentation
# ----------------------------
def _safe_series(df: pd.DataFrame, col: str, default: str = "") -> pd.Series:
    if col in df.columns:
        return df[col].astype(str).fillna("")
    return pd.Series([default] * len(df), index=df.index, dtype="object")

def group_by_course(chunks_df: pd.DataFrame, top_courses: int):
    """Collapse many chunks into distinct courses via parent_id; preview = best chunk."""
    if "metadata.parent_id" not in chunks_df.columns:
        chunks_df = chunks_df.copy()
        chunks_df["metadata.parent_id"] = chunks_df["id"]

    best = (
        chunks_df
        .sort_values("score", ascending=False)
        .drop_duplicates(subset=["metadata.parent_id"], keep="first")
        .copy()
    )
    top = best.head(top_courses).copy()

    code_s  = _safe_series(top, "metadata.course_code")
    name_s  = _safe_series(top, "metadata.class_name")
    subj_s  = _safe_series(top, "metadata.subject")
    subj2_s = _safe_series(top, "metadata.subject_code")
    subject_s = subj_s.mask(subj_s.eq(""), subj2_s)

    def short_snippet(t: str, n=260):
        s = (t or "").replace("\n", " ").strip()
        return s  # no truncation

    top["course_code"] = code_s
    top["class_name"]  = name_s
    top["subject"]     = subject_s
    top["snippet"]     = top["text"].astype(str).apply(lambda x: short_snippet(x, 260))
    return top

def print_menu(query: str, courses_df: pd.DataFrame):
    print(f"\nYou asked: {query}\n")
    if courses_df.empty:
        print("I couldn’t find matches. Try something simpler, like: “electives with no prerequisites” or “natural language processing”.")
        return
    print("You can choose from:")
    for i, (_, r) in enumerate(courses_df.iterrows(), start=1):
        code  = r.get("course_code", "") or ""
        name  = r.get("class_name", "") or ""
        subj  = r.get("subject", "") or ""
        head  = f"{code} — {name}" if (code or name) else "(Untitled course)"
        print(f"{i:>2}. {head}  [{subj}]")
        print("    " + textwrap.fill(r.get("snippet",""), subsequent_indent="    "))
    print("\nTip: in interactive mode you can type:  more N  |  list  |  help  |  or just ask a new question.\n")

def print_course_details(chunks_df: pd.DataFrame, parent_id: str):
    rows = chunks_df[chunks_df.get("metadata.parent_id", chunks_df["id"]) == parent_id] \
                .sort_values("score", ascending=False)
    if rows.empty:
        print("No details for that selection.")
        return
    top = rows.iloc[0]
    code  = top.get("metadata.course_code", "")
    name  = top.get("metadata.class_name", "")
    subj  = top.get("metadata.subject", "") or top.get("metadata.subject_code","")
    url   = top.get("metadata.source_url", "")
    print(f"\n{code} — {name} [{subj}]")
    if url: print(f"Source: {url}")
    text = str(top.get("text","")).strip()
    print("\n" + textwrap.fill(text, width=100))

def interactive_loop(query: str, chunks_df: pd.DataFrame, menu_df: pd.DataFrame, index, df, model, k, top_courses):
    # mapping for the initial menu
    idx_to_parent = {i: r["metadata.parent_id"] for i, (_, r) in enumerate(menu_df.iterrows(), start=1)}
    print_menu(query, menu_df)
    print("Interactive mode. Commands:\n"
          "  more N  → show full details for option N\n"
          "  list    → reprint the current menu\n"
          "  help    → show this help\n"
          "  quit    → exit\n"
          "Or type any new question to search again.\n")

    # Keep current state so `list` works after a requery
    current_query = query
    current_chunks = chunks_df
    current_menu = menu_df
    current_map = idx_to_parent

    while True:
        try:
            raw = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            return

        if not raw:
            continue

        cmd_lower = raw.lower().strip()
        if cmd_lower in ("q", "quit", "exit"):
            print("Bye.")
            return
        if cmd_lower in ("h", "help"):
            print("Commands:\n"
                  "  more N  → show full details for option N\n"
                  "  list    → reprint the current menu\n"
                  "  help    → show this help\n"
                  "  quit    → exit\n"
                  "Or type any new question to search again.")
            continue
        if cmd_lower in ("l", "list"):
            print_menu(current_query, current_menu)
            continue

        parts = raw.split()
        if len(parts) == 2 and parts[0].lower() == "more" and parts[1].isdigit():
            num = int(parts[1])
            if num not in current_map:
                print("Pick a valid number from the menu.")
                continue
            parent_id = current_map[num]
            print_course_details(current_chunks, parent_id)
            continue

        # ---------------
        # New free-form query
        # ---------------
        new_query = raw
        print("Got it — you’re asking something new. Let’s look that up…")
        chunk_k = max(k, top_courses * 5)
        new_chunks = retrieve_chunks(new_query, chunk_k, index, df, model)
        new_menu = group_by_course(new_chunks, top_courses=top_courses)
        current_query = new_query
        current_chunks = new_chunks
        current_menu = new_menu
        current_map = {i: r["metadata.parent_id"] for i, (_, r) in enumerate(new_menu.iterrows(), start=1)}
        print_menu(new_query, new_menu)

# ----------------------------
# Main
# ----------------------------
def main(index_dir: str, k: int, query: str, top_courses: int, interactive: bool):
    index, df, model, cfg = load_index(Path(index_dir).resolve())
    # Pull more chunks than courses so multiple classes can surface
    chunk_k = max(k, top_courses * 5)
    chunks = retrieve_chunks(query, chunk_k, index, df, model)
    courses = group_by_course(chunks, top_courses=top_courses)
    if interactive:
        print("[query] interactive: freeform follow-ups enabled")
        interactive_loop(query, chunks, courses, index, df, model, k, top_courses)
    else:
        print_menu(query, courses)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--index-dir", default=str(Path(__file__).resolve().parents[1] / "data" / "processed" / "index"))
    ap.add_argument("--query", required=True)
    ap.add_argument("-k", type=int, default=50, help="top chunks to retrieve (used internally)")
    ap.add_argument("--top-courses", type=int, default=8, help="show this many distinct courses")
    ap.add_argument("--interactive", action="store_true", help="enable simple REPL to drill into options")
    args = ap.parse_args()
    main(args.index_dir, args.k, args.query, args.top_courses, args.interactive)