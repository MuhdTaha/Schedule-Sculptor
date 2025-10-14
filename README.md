# **Schedule-Sculptor**
Schedule Sculptor is a web app that helps UIC students upload their degree audits, see remaining courses and prerequisites, and explore personalized class recommendations. It aims to simplify academic planning by turning confusing audits into clear, interactive roadmaps connected to the course catalog.

Figma wireframe and storyboard can be found at this link -> https://www.figma.com/design/1kNoUHS0ckP68bqpu9k5it/ScheduleSculptor?node-id=1-2&t=sxGvd81CoaOlgXXl-1

---

### **Key Features**
* **Automated Audit Parsing:** Users can upload their PDF degree audit, and our application uses a Large Language Model (LLM) to automatically extract their completed courses and remaining requirements.

* **Visual Progress Dashboard:** A clean, easy-to-understand dashboard visualizes the student's progress toward graduation with a dynamic progress bar.

* **Interactive Planner:** A timeline view to drag-and-drop courses and build potential semester plans.

* **AI Assistant:** A conversational AI to provide personalized course recommendations based on the user's unique academic path.

---

### **Tech Stack**
* **Frontend:** React (with Vite)

* **Backend:** HTML5 Local Storage
* **Styling:** Tailwind CSS
* **Routing:** React Router
* **AI & Parsing:** Google Gemini API (planned)

---

### **Progress so Far**

This project has been successfully set up as a multi-page React application. Here's what has been implemented:

- **Multi-Page Routing:** Uses react-router-dom to navigate between a welcome page, the audit upload page, and the main dashboard.

- **Component Structure:** Components for the page layout (Layout.jsx), welcome screen (App.jsx), audit upload page (Audit.jsx), and the dashboard (Dashboard.jsx).

- **Dashboard Mockup:** Static version of the "Dashboard" page to visualize the design of the progress bar and other key elements.

- **"Upload Audit:"** Feature handles file selection and provides UI feedback for success and error states.
---

### **Getting Started: Local Development Setup**

**1. Clone the Repository:**
    Clone the project repository to your local machine.

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

**2. Navigate to the Frontend Directory:** The React application lives inside the frontend folder. All subsequent commands should be run from this directory.

```bash
cd frontend
```

**3. Install Dependencies:** Install all the necessary libraries for the project, including React, React Router and Vite.

```bash
npm install
npm install react-router-dom
```

**4. Run the Dev Server:** 
```bash
npm run dev
```

---