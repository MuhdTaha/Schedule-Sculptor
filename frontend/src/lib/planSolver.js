/**
 * planSolver.js: Updated to use backend API for rationale generation
 */

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

// --- RATIONALE GENERATOR ---
export async function generateRationale(planResult, preferences, parsedAudit) {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080"; 
  try {
    const response = await fetch(`${API_URL}/generate-rationale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planResult,
        preferences,
        parsedAudit
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.rationale;
    } else {
      throw new Error(data.error || 'Failed to generate rationale');
    }
    
  } catch (error) {
    console.error("Error generating rationale:", error);
    return "# Why Were These Courses Chosen?\n\nWe couldn't generate a personalized explanation at this moment, but these courses were selected to maximize your progress toward your degree requirements while adhering to your credit limit.";
  }
}