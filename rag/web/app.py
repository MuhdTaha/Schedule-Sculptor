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
import time
import threading

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import os

from dotenv import load_dotenv

from PyPDF2 import PdfReader
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

load_dotenv() # Load environment variables from .env file

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("\nWARNING: GOOGLE_API_KEY not set. Audit parsing will fail.\n")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# Global variables for index and model
index = None
chunks_df = None
model = None
config = None
index_loaded = False
loading_in_progress = False

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

def extract_text_from_pdf_stream(file_stream) -> str:
    """
    Extracts text from a PDF file stream using pypdf.
    """
    try:
        text = ""
        reader = PdfReader(file_stream)
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def call_gemini(prompt: str, model_name: str = "gemini-2.5-flash") -> str:
    """
    Calls the Google Gemini API to generate content based on a prompt.
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel(model_name)
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Clean up the response text, removing markdown formatting
        if response.parts:
            return response.text.strip().replace("```cypher", "").replace("```json", "").replace("```", "").strip()
        else:
            print("Warning: Gemini API returned an empty response.")
            return ""
    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        return ""

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
    """Load FAISS index, chunks CSV, and embedding model."""
    global index, chunks_df, model, config, index_loaded, loading_in_progress
    
    if loading_in_progress:
        return
    
    loading_in_progress = True
    
    try:
        print("🚀 Starting index loading...")
        
        # Determine index directory path (relative to this file)
        base_path = Path(__file__).resolve().parent.parent
        index_dir = base_path / "data" / "processed" / "index"
        
        print(f"📁 Looking for data in: {index_dir}")
        print(f"📁 Absolute path: {index_dir.resolve()}")
        print(f"📁 Directory exists: {index_dir.exists()}")
        
        # Debug: List contents of data directory
        data_dir = base_path / "data"
        if data_dir.exists():
            print(f"📁 Contents of data directory:")
            for item in data_dir.rglob("*"):
                rel_path = item.relative_to(base_path)
                print(f"   - {rel_path} ({'dir' if item.is_dir() else 'file'})")
        
        idx_path = index_dir / "faiss.index"
        tbl_path = index_dir / "chunks.csv"
        cfg_path = index_dir / "config.json"
        
        print(f"📄 faiss.index exists: {idx_path.exists()}")
        print(f"📄 chunks.csv exists: {tbl_path.exists()}")
        print(f"📄 config.json exists: {cfg_path.exists()}")
        
        if not idx_path.exists() or not tbl_path.exists() or not cfg_path.exists():
            print(f"❌ Missing index files in {index_dir}")
            # List what's actually in the index directory
            if index_dir.exists():
                print(f"📁 Contents of {index_dir}:")
                for item in index_dir.iterdir():
                    print(f"   - {item.name} ({'dir' if item.is_dir() else 'file'})")
            raise FileNotFoundError(f"Missing index files in {index_dir}")
        
        print(f"[app] Loading index from {index_dir}...")
        index = faiss.read_index(str(idx_path))
        chunks_df = pd.read_csv(tbl_path)
        config = json.loads(cfg_path.read_text())
        model = SentenceTransformer(config["model"])
        index_loaded = True
        print(f"✅ Loaded index with {len(chunks_df):,} chunks")
        print(f"✅ Model: {config['model']}")
        
    except Exception as e:
        print(f"❌ Failed to load index: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        index_loaded = False
    finally:
        loading_in_progress = False

def retrieve_and_group(query: str, top_courses: int = 8):
    """Retrieve top courses based on query using RAG."""
    
    if not index_loaded or index is None or model is None:
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

# --- ROUTES ---

@app.route("/")
def home():
    """Health check endpoint."""
    return jsonify({
        "status": "ok", 
        "message": "Schedule Sculptor RAG API is running",
        "index_loaded": index_loaded
    })

@app.route("/health")
def health():
    """Detailed health check."""
    return jsonify({
        "status": "ok" if index_loaded else "loading",
        "index_loaded": index_loaded,
        "model_loaded": model is not None,
        "loading_in_progress": loading_in_progress,
        "timestamp": time.time()
    })

@app.route("/test")
def test():
    """Simple test endpoint."""
    return jsonify({"status": "ok", "message": "Test endpoint working"})

@app.route("/load-index", methods=["POST"])
def load_index_endpoint():
    """Manually trigger index loading."""
    if loading_in_progress:
        return jsonify({"status": "loading", "message": "Index loading in progress"})
    
    load_index()
    return jsonify({"status": "done", "index_loaded": index_loaded})

@app.route("/query", methods=["POST"])
def query():
    """
    Query endpoint that accepts a question and returns relevant courses.
    """
    if not index_loaded:
        return jsonify({"error": "Index not loaded. Please wait or trigger loading via /load-index", "index_loaded": False}), 503
    
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
    
@app.route("/parse-audit", methods=["POST"])
def parse_audit():
    """
    Endpoint to parse a degree audit PDF.
    Expects a file upload with key 'file'.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # 1. Extract text
        audit_text = extract_text_from_pdf_stream(file.stream)
        if not audit_text:
            return jsonify({"error": "Could not extract text from PDF"}), 400

        # 2. Prepare Prompt (Schema Structure)
        schema_structure = {
            "studentInfo": {
                "name": "string",
                "uin": "string",
                "degreeProgram": "string",
                "major": "string",
                "minor": "string"  # should be "None" if not present
            },

            "progress": {
                "totalCreditsRequired": "number",
                "creditsCompleted": "number",
                "creditsInProgress": "number",
                "creditsRemaining": "number"
            },

            "categories": [
                {
                    "name": "string",               # e.g., "University Writing Requirement"
                    "hoursRequired": "number or null", 
                    "hoursEarned": "number",
                    "note": "string or null",
                    "completed": "boolean",
                    "courses": [
                        {
                            "semester": "string",   # FA22, WS23, etc.
                            "code": "string",       # ENGL 160, MATH 180
                            "title": "string",
                            "credits": "number",
                            "grade": "string"       # A, B, C, D, F, S, CR, IP
                        }
                    ]
                }
            ],

            "completedCourses": [
                {
                    "category": "string",
                    "semester": "string",
                    "code": "string",
                    "title": "string",
                    "credits": "number",
                    "grade": "string"
                }
            ],

            "inProgressCourses": [
                {
                    "category": "string",
                    "semester": "string",
                    "code": "string",
                    "title": "string",
                    "credits": "number"
                }
            ],

            "remainingRequirements": [
                {
                    "category": "string",
                    "coursesNeeded": "number",
                    "courses": [
                        {
                            "code": "string",
                            "title": "string",
                            "credits": "number"
                        }
                    ]
                }
            ]
        }

        prompt = f"""
        You are an expert university registrar's assistant. Your task is to parse a raw text dump
        from a degree audit PDF and convert it into a structured JSON object.

        Strictly adhere to the following JSON schema structure:
        {json.dumps(schema_structure, indent=2)}

        RULES:
        1.  **studentInfo**: 
            - Extract the Name, UIN, and the full Program string for 'degreeProgram'.
            - From the 'degreeProgram' string, extract the 'major' (e.g., "Computer Science") and 'minor' (e.g., "Finance"). 
            - If no minor is listed, set 'minor' to "None".

        2.  **progress**: 
            - Find the "Total Degree Hours" section.
            - Extract "_____ hours required" for 'totalCreditsRequired'.
            - Extract "EARNED" for 'creditsCompleted'.
            - Extract "In-Prog" for 'creditsInProgress'.
            - Calculate 'creditsRemaining' (required - completed - inProgress).

        3.  **categories**: 
        - For EACH requirement section in the degree audit (e.g., "University Writing Requirement", "Math Requirement - CS Major", "Analyzing the Natural World", "Free Electives - CS Major", etc.), create a category object.
        - Extract the category 'name' exactly as it appears in the audit.
        - Extract 'hoursRequired' from text like "Six hours required" or "11 hours required".
        - Extract 'hoursEarned' from text like "EARNED: 6.00 HOURS" or "EARNED: 12.00 HOURS".
        - Set 'completed' to **true** if the audit explicitly marks the category as complete (e.g., a green checkmark, "Requirement Complete", or "OK") **or** if hoursEarned ≥ hoursRequired.
        
        - ⚠️ **Special case — Conditional credit hours:**
        - If the section uses wording such as **“may be needed to reach 128 Degree Hours”**, do **not** treat the number (e.g., 9) as a fixed 'hoursRequired' value.
        - Instead, set:
            "hoursRequired": null
            "note": "Conditional hours may be required to reach total degree hours."
        - In this case, mark "completed": true if all other program requirements are satisfied, even if this category alone shows fewer earned hours.
        
        - List ALL courses under this category in the 'courses' array, including:
            - 'semester' (e.g., FA21, WS22, FA22, SP23)
            - 'code' (e.g., ENGL 160, MATH 180)
            - 'title' (e.g., Composition I, Calculus I)
            - 'credits' (as a number)
            - 'grade' (A, B, C, D, F, S, CR, or IP for in-progress)

        4.  **completedCourses**: 
            - Find all courses that have a letter grade (A, B, C, D, F) or a status (S, CR). 
            - Each course object MUST include 'category', 'semester', 'code', 'title', 'credits' (as a number), and 'grade'.
            - The 'category' should match the requirement section name (e.g., "University Writing Requirement").
            - Do NOT include courses with grade 'U' or 'IP' or 'W'.

        5.  **inProgressCourses**: 
            - Find all courses marked with "IP" (In Progress).
            - Each course object MUST include 'category', 'semester', 'code', 'title', and 'credits' (as a number).

        6.  6. **remainingRequirements**:
            - Identify all requirement sections that are NOT complete 
            (hoursEarned < hoursRequired, or marked incomplete).

            - For each requirement, extract:
                • "category": the exact requirement name
                • "coursesNeeded": number of courses/hours still required (if shown)
                • "courses": list of acceptable courses for fulfilling the requirement

            - Requirements may list acceptable courses in **two different formats**:
            
            ------------------------------------------------------------
            (A) Full course data present:
                Example: "MATH 210 — Calculus III (3 cr)"

                When the audit provides course titles AND/OR credit hours:
                    • Extract all fields normally:
                        code: "MATH 210"
                        title: "Calculus III"
                        credits: 3

            ------------------------------------------------------------
            (B) Code-only lists:
                Example: "CS 378,398,407,411,..."

                When NO title or credit information is shown:
                    • You MUST still include each course code
                    • Use:
                        code: "CS 378"
                        title: null
                        credits: null
                    • Do NOT invent title or credit information.

            ------------------------------------------------------------
            Detection Rule:
                • If the audit text next to a course contains a title or "(X cr)"
                → treat it as Format (A)
                • If the audit text is ONLY codes with commas/spaces
                → treat it as Format (B)

            - Always split multi-code lists correctly, preserving department prefixes.
            Example:
                "CS 378,398,407" → "CS 378", "CS 398", "CS 407"
            
            - Do not omit or remove course titles when they exist in the audit.
            - Do not remove credit hours when they exist in the audit.

        7.  Return ONLY the raw JSON object. Do not include "\`\`\`json" or any other text.

        8. You MUST respond with ONLY valid JSON. No comments, no explanation, no backticks.

        Degree Audit Text:
        ---
        {audit_text}
        ---
        """

        # 3. Call Gemini
        json_string = call_gemini(prompt)
        
        if not json_string:
            return jsonify({"error": "Failed to generate response from AI"}), 500

        # 4. Return the parsed JSON
        return jsonify(json.loads(json_string))

    except Exception as e:
        print(f"Error processing audit: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/generate-rationale", methods=["POST"])
def generate_rationale():
    """
    Generate AI rationale for a course plan using Gemini.
    """
    if not GOOGLE_API_KEY:
        return jsonify({"error": "Google API key not configured"}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        plan_result = data.get("planResult", {})
        preferences = data.get("preferences", {})
        parsed_audit = data.get("parsedAudit", {})
        
        if not plan_result or not preferences:
            return jsonify({"error": "Missing required fields: planResult and preferences"}), 400
        
        prompt = f"""
        You are an empathetic and strategic Academic Advisor.
        
        CONTEXT:
        - The student has generated a schedule for the upcoming semester.
        - Degree Context: {json.dumps(parsed_audit.get('remainingRequirements', 'Unknown'))}.
        - Preferences: Target Credit Load: {preferences.get('creditLoad', 'Unknown')}, Difficulty: {preferences.get('difficulty', 'Unknown')}.
        - Requirements Focused On: {', '.join(preferences.get('requirements', []))}.
        
        THE PROPOSED SCHEDULE:
        {chr(10).join([f"- {c['code']} ({c['title']}): {c['credits']} credits. [Fulfills: {c.get('category', 'General')}]" for c in plan_result.get('plan', [])])}

        TASK:
        Generate a rationale for this schedule using the STRICT MARKDOWN TEMPLATE below. 
        Do not include any text outside of this structure.

        STRICT OUTPUT STRUCTURE:
        
        # Why Were These Courses Chosen?
        
        [Paragraph: Write a 1-2 sentence overview based on their degree audit context and progress.]
        
        [Unordered List:
        - **Course Code**: A short explanation of strategic value and how it fits their preferences.
        - **Course Code**: A short explanation of strategic value and how it fits their preferences.
        ]
        
        [Paragraph: A concluding sentence about the workload balance (e.g., "This mix allows you to focus on...")]
        
        TONE: Professional, encouraging, and clear.
        """

        # Call Gemini
        rationale = call_gemini(prompt)
        
        if not rationale:
            return jsonify({"error": "Failed to generate rationale"}), 500

        return jsonify({
            "rationale": rationale,
            "success": True
        })
        
    except Exception as e:
        print(f"[app] Error generating rationale: {e}")
        return jsonify({"error": str(e)}), 500

# Initialize the app when it starts
def initialize_app():
    """Load the index when the app starts in a separate thread."""
    print("🚀 Initializing application...")
    load_index()

if __name__ == "__main__":
    # Start index loading in background
    initialize_app()
    
    # Get port from environment (Cloud Run sets PORT=8080)
    port = int(os.environ.get("PORT", 8080))
    # Use 0.0.0.0 for Cloud Run compatibility
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Flask server on {host}:{port}")
    print(f"📊 Index loaded: {index_loaded}")
    
    app.run(host=host, port=port)
else:
    # If using Gunicorn with preload, load index at startup
    if os.environ.get("GUNICORN_PRELOAD", "false") == "true":
        initialize_app()