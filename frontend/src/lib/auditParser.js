// frontend/src/lib/auditParser.js

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";
import { GoogleGenAI } from "@google/genai";

// use Vite to load environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// set the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


/**
    * Calls the Gemini API with the extracted text and a master prompt.
    * @param {string} auditText - The raw text extracted from the PDF.
    * @returns {Promise<object>} - A promise that resolves to the parsed JSON object.
    */
async function callGeminiApi(auditText) {
    // this is the data model schema for the parsed audit that we want Gemini to fill in
    const schema = {
        studentInfo: {
            name: "string",
            uin: "string",
            degreeProgram: "string",
            major: "string",
            minor: "string", // should be "None" if not present
        },

        "progress": {
            "totalCreditsRequired": "number",
            "creditsCompleted": "number",
            "creditsInProgress": "number",
            "creditsRemaining": "number",
        },

        categories: [
            {
                name: "string", // e.g., "University Writing Requirement", "Math Requirement", "Technical Electives", etc.
                hoursRequired: "number or null", // null if conditional
                hoursEarned: "number",
                note: "string or null", // e.g., "Conditional hours may be required to reach total degree hours."
                completed: "boolean", // true if requirement is met
                courses: [
                    {
                        semester: "string", // FA22, WS23, SP23, etc.
                        code: "string", // ENGL 160, MATH 180, etc.
                        title: "string", // Composition I, Calculus I, etc.
                        credits: "number",
                        grade: "string" // A, B, C, D, F, S, CR, IP (for in-progress)
                    }
                ]
            }
        ],

        "completedCourses": [
            {   "category": "string", // Which requirement category this course fulfills
                "semester": "string",
                "code": "string", 
                "title": "string",
                "credits": "number", 
                "grade": "string" }
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
                "coursesNeeded": "string or number", // e.g., "Two courses" or 2
                "courses": [{ "code": "string", "title": "string", "credits": "number" }]
            }
        ]
    }

    // --- Master Prompt ---
    const prompt = `
    You are an expert university registrar's assistant. Your task is to parse a raw text dump
    from a degree audit PDF and convert it into a structured JSON object.

    Strictly adhere to the following JSON schema:
    ${JSON.stringify(schema, null, 2)}

    RULES:
    1.  **studentInfo**: 
        - Extract the Name, UIN, and the full Program string for 'degreeProgram'.
        - From the 'degreeProgram' string, extract the 'major' (e.g., "Computer Science") and 'minor' (e.g., "Finance"). 
        - If no minor is listed, set 'minor' to "None".

    2.  **progress**: 
        - Find the "Total Degree Hours" section.
        - Extract "required" for 'totalCreditsRequired'.
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

    6.  **remainingRequirements**: 
        - Find all requirement sections that are NOT yet met (hoursEarned < hoursRequired or explicitly stated as not complete). 
        - For each, extract its 'category' (title), 'coursesNeeded' (e.g., "Two courses" or 2), and the list of available 'courses' that can fulfill this requirement (with 'code', 'title', and 'credits').
        - If a list of acceptable courses is provided (e.g., "Any of the following math and science courses apply..."), include those in the 'courses' array.

    7.  Return ONLY the raw JSON object. Do not include "\`\`\`json" or any other text.


    Here is the degree audit text:
    ---
    ${auditText}
    ---
    `;

    // --- Gemini API Call ---
    try {
        // Check if API key is available
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set.");
        }

        // Initialize Google GenAI client
        const ai = new GoogleGenAI({ 
            vertexai: false,
            apiKey: GEMINI_API_KEY 
        });

        // Make the call to the Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.1  // Lower temperature for consistent parsing
            }
        });

        // Parse the structured JSON from the response
        let resultText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text || response.text;

        // Do error handling for invalid JSON
        if (!resultText) {
            throw new Error("No structured text returned from Gemini API.");
        }

        // clean up th e result text to ensure it's valid JSON
        resultText = resultText.trim();
        if (resultText.startsWith("```json")) {
            resultText = resultText.slice(7); // remove ```json
        } else if (resultText.startsWith("```")) {
            resultText = resultText.slice(3); // remove ```
        }

        if (resultText.endsWith('```')) {
            resultText = resultText.slice(0, -3); // remove trailing ```
        }

        resultText = resultText.trim();

        // return the JSON object if parsing is successful
        return JSON.parse(resultText);
    } catch (error) {
        // handle errors from the Gemini API call or JSON parsing
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to parse audit text with Gemini API.");
    }
}


/**
    * Extracts text from an uploaded PDF file.
    * @param {File} file - The PDF file.
    * @returns {Promise<string>} - A promise resolving to the full text of the PDF.
    */
export async function extractTextFromPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    console.log(`Extracting ${pdf.numPages} pages...`);

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        console.log(`Page ${i} text length:`, pageText.length);
        fullText += pageText + "\n";
    }

    return fullText;
}

/**
    * Orchestrates the entire parsing pipeline.
    * @param {File} file - The uploaded PDF file.
    * @returns {Promise<object>} - The structured JSON result.
    */
export async function parseAuditPDF(file) {
    try {
        // Step 1: extract text from the PDF file
        const auditText = await extractTextFromPdf(file);
        if (!auditText || auditText.trim() === "") {
            throw new Error("No text extracted from PDF.");
        }

        // Step 2: call the Gemini API to parse the extracted text into structured JSON
        const parsedJson = await callGeminiApi(auditText);
        if (!parsedJson) {
            throw new Error("Received no data from Gemini API.");
        }

        // return the structured JSON result
        return parsedJson;
    } catch (error) {
        // handle any errors in the parsing pipeline
        console.error("Error parsing audit PDF:", error);
        throw error;
    }
}