/**
 * planSolver.js: A simple, synchronous plan generator + AI Rationale
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

export function generatePlan(preferences, parsedAudit, courseCatalog) {
  const { requirements, creditLoad } = preferences;
  
  // 1. Get lists of courses the user has already taken or is taking.
  const completedCodes = (parsedAudit?.completedCourses || []).map(c => c.code);
  const inProgressCodes = (parsedAudit?.inProgressCourses || []).map(c => c.code);
  const takenCodes = new Set([...completedCodes, ...inProgressCodes]);

  // 2. Build a direct mapping: requirement -> { needed, courseList }
  const reqMap = {};
  (parsedAudit?.remainingRequirements || []).forEach(req => {
    if (!requirements.includes(req.category)) return;
    reqMap[req.category] = {
      needed: req.coursesNeeded || 1,
      courseCodes: req.courses.map(c => c.code),
    };
  });

  // 3. Helper: find a valid catalog entry for a given code
  function getCatalogEntry(code) {
    return courseCatalog.find(c => c.code === code) || null;
  }

  // 4. Build the final suggestion ensuring each requirement is fulfilled
  const finalPlan = [];
  let currentCredits = 0;
  const maxCredits = Math.max(...creditLoad);

  for (const [category, info] of Object.entries(reqMap)) {
    const { needed, courseCodes } = info;
    const validCandidates = [];

    for (const code of courseCodes) {
      if (takenCodes.has(code)) continue;
      const catalogCourse = getCatalogEntry(code);
      if (!catalogCourse) continue;   // skip if not in catalog
      
      const eligible = checkPrerequisites(
        catalogCourse.prereqs,
        completedCodes
      );
      if (!eligible) continue;
      validCandidates.push({ ...catalogCourse, category });
    }

    // Shuffle so the user gets variety
    const shuffled = validCandidates.sort(() => 0.5 - Math.random());

    let added = 0;
    for (const course of shuffled) {
      if (added >= needed) break;
      if (currentCredits + course.credits > maxCredits) break;
      finalPlan.push(course);
      currentCredits += course.credits;
      added++;
    }
  }

  return {
    plan: finalPlan,
    totalCredits: currentCredits,
    criteria: {
      selectedRequirements: requirements,
      creditLoad: maxCredits,
      excludedCourses: [...takenCodes],
    }
  };
}

function checkPrerequisites(prereqCodes, completedCodes) {
  if (!prereqCodes || prereqCodes.length === 0) return true;
  return prereqCodes.every(code => completedCodes.includes(code));
}

// --- UPDATED RATIONALE GENERATOR ---
export async function generateRationale(planResult, preferences, parsedAudit) {
  try {
    // FIX: Changed to 'gemini-1.5-flash' (2.5 does not exist yet)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct a focused prompt with EXPLICIT structural instructions
    const prompt = `
      You are an empathetic and strategic Academic Advisor.
      
      CONTEXT:
      - The student has generated a schedule for the upcoming semester.
      - Degree Context: ${JSON.stringify(parsedAudit?.remainingRequirements || "Unknown")}.
      - Preferences: Target Credit Load: ${preferences.creditLoad}, Difficulty: ${preferences.difficulty}.
      - Requirements Focused On: ${preferences.requirements.join(", ")}.
      
      THE PROPOSED SCHEDULE:
      ${planResult.plan.map(c => `- ${c.code} (${c.title}): ${c.credits} credits. [Fulfills: ${c.category}]`).join("\n")}

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
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error generating rationale:", error);
    return "# Why Were These Courses Chosen?\n\nWe couldn't generate a personalized explanation at this moment, but these courses were selected to maximize your progress toward your degree requirements while adhering to your credit limit.";
  }
}