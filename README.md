# **Schedule-Sculptor**

Schedule Sculptor is a web app that helps UIC students upload their degree audits, explore remaining courses and prerequisites, and generate personalized course recommendations. It aims to simplify academic planning by turning confusing audits into clear, interactive roadmaps connected to the course catalog.

Figma wireframe and storyboard -> https://www.figma.com/design/1kNoUHS0ckP68bqpu9k5it/ScheduleSculptor?node-id=1-2&t=sxGvd81CoaOlgXXl-1

Deployed website -> https://muhdtaha.github.io/Schedule-Sculptor/

---

### **Key Features**
* **Automated Audit Parsing:** Users upload their PDF degree audit, and our backend (powered by Google Gemini 2.5) securely extracts student data, completed courses, and remaining requirements.

* **Visual Progress Dashboard:** A clean, easy-to-understand dashboard visualizes the student's progress toward graduation with dynamic progress bars and interactive course lists.

* **Sculpt Your Semester:** An intelligent planning engine that generates semester schedules based on user constraints (credit load, difficulty preference, and remaining requirements).

* **AI Assistant:** A RAG-powered (Retrieval-Augmented Generation) conversational AI that uses key words that the user enters to suggest relevant courses from the UIC course catalog.

* **Verification & Trust**: Includes a "Verification" modal post-upload to ensure data accuracy and build user trust and a "Why Were These Courses Chosen" modal to provide context and detailed information about the generated semester plans.

---

### **Tech Stack**
* **Frontend:** React (Vite), Tailwind CSS, React Router
  
* **Backend:** Python (Flask), Google Cloud Run, HTML5 Local Storage

* **AI & Data:**
    * **LLM:** Google Gemini 2.5 Flash
    * **RAG:** FAISS (Vector Database), sentence-transformers
    * **Parsing:** pypdf2

* **Deployment:**
    * **Frontend:** GitHub Pages (Static Hosting)
    * **Backend:** Google Cloud Run (Docker Containerized Service)
---

### **Progress so Far**

This project has evolved into a secure, full-stack web application.

1. **Secure Backend Architecture:** We migrated away from client-side processing to a robust **Flask (Python)** backend hosted on **Google Cloud Run**. This shift was critical for:

    - **Security**: API keys and logic are now isolated on the server, preventing exposure in the frontend code.
      
    - **Scalability**: The backend is containerized, allowing it to handle concurrent parsing requests efficiently.

2. **Intelligent Degree Audit Parsing:** We implemented a sophisticated parsing engine that transforms unstructured PDF data into actionable insights:

   - **PDF Extraction**: Uses pypdf to strip raw text from user-uploaded degree audits.
     
   - **LLM Processing**: Leverages Google Gemini 2.5 Flash with a structured JSON schema to accurately identify:
       - Student Metadata (Name, UIN, Major, Degree Program, etc).
       - Credit Hours Progress (total, completed, in-progress, remaining)
       - Completed Courses (with grades and terms).
       - Remaining Requirements (categorized by type, e.g., "Gen Ed" vs. "Tech Elective").  
   
3. **RAG-Powered Course Catalog (Retrieval-Augmented Generation):** To move beyond simple keyword matching, we built a semantic search engine for the university course catalog:

    - **Vector Database**: We indexed the entire UIC course catalog using FAISS and sentence-transformers.

    - **Semantic Querying**: The backend can now understand natural language queries (e.g., "Find me a challenging AI course") and retrieve relevant courses based on conceptual similarity, not just title matching.

4. **The "Sculpt" Engine (Constraint Satisfaction):** We developed a custom algorithm (planSolver.js) that acts as a personal academic advisor:

    - **Input**: Takes user constraints (Desired Credit Load, Difficulty Preference, Specific Requirements).
 
    - **Processing**: Filters the RAG-enhanced catalog against the user's remaining audit requirements.
 
    - **Output**: Generates valid, conflict-free semester schedules that optimize for the user's specific goals (e.g., "Maximize Tech Electives" or "Balance Workload").

5. **"Academic Calm" Design System:** Based on user study feedback regarding registration anxiety, we overhauled the UI/UX:

    - **Visual Language**: Adopted a "Cream & Royal Purple" palette (#FAF8F5, #4C3B6F) with custom typography and GUI elements to evoke prestige and calmness.
    
    - **Layered Information Architecture**:
        - Status Layer: High-level progress bars for quick checks.
        - Context Layer: Interactive "Course Cards" that reveal courses based on categories.
        - Trust Layer: A "Verification Modal" that appears post-upload to confirm data accuracy before the user proceeds.

---

### **Contributors**

- [Muhammad Taha](https://github.com/MuhdTaha)
- [Bader Rezek](https://github.com/BaderRezek)
- [Ayush Patel](https://github.com/Ayushpat02)
- [Sanjana Balamurugan](https://github.com/sanjanab003)

---
