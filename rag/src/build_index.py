# rag/src/build_index.py
import argparse, json
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
TEXT_COL = "text"
ID_COL = "id"

def load_chunks(csv_path: Path) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(f"Missing file: {csv_path}")
    df = pd.read_csv(csv_path)
    if TEXT_COL not in df.columns or ID_COL not in df.columns:
        raise ValueError(f"Expected columns '{ID_COL}' and '{TEXT_COL}' in {csv_path}")
    print(f"[build] loaded {len(df):,} chunks from {csv_path}")
    return df

def main(data_dir: str, out_dir: str):
    data_dir = Path(data_dir).resolve()
    out_dir  = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    chunks_csv = data_dir / "rag_chunks.csv"
    df = load_chunks(chunks_csv)

    print(f"[build] embedding with {MODEL_NAME} …")
    model = SentenceTransformer(MODEL_NAME)
    texts = df[TEXT_COL].astype(str).tolist()
    embs = model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
    embs = np.asarray(embs, dtype="float32")
    print(f"[build] embeddings shape: {embs.shape}")

    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)  # cosine via inner product on normalized vectors
    index.add(embs)

    # Save artifacts
    faiss.write_index(index, str(out_dir / "faiss.index"))
    df.to_csv(out_dir / "chunks.csv", index=False)  # <- CSV for simplicity
    (out_dir / "config.json").write_text(json.dumps(
        {"model": MODEL_NAME, "dim": dim, "normalize": True}, indent=2
    ))
    print("[build] saved:")
    print("  -", out_dir / "faiss.index")
    print("  -", out_dir / "chunks.csv")
    print("  -", out_dir / "config.json")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", default=str(Path(__file__).resolve().parents[1] / "data" / "processed" / "rag_export"))
    ap.add_argument("--out-dir",  default=str(Path(__file__).resolve().parents[1] / "data" / "processed" / "index"))
    args = ap.parse_args()
    main(args.data_dir, args.out_dir)