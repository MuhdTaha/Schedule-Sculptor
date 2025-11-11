import { GoogleGenerativeAI } from "@google/generative-ai";
import { dummyDegreeAudit } from "./dummyData.js";
import dotenv from "dotenv";
dotenv.config();

// initialize
let model = null;
let genAI = null;
if (process.env.GOOGLE_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  } catch (e) {
    console.warn("Could not initialize GoogleGenerativeAI client:", e.message || e);
    genAI = null;
  }
}

// finding the model
async function findSupportedModel() {
  if (!genAI) return false;

  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5",
    "gemini-1.5-pro",
    "gemini-1.0",
    "text-bison@001",
    "models/text-bison-001",
  ];

  for (const name of candidates) {
    try {
      const candidateModel = genAI.getGenerativeModel({ model: name });
      // calling the model 
      try {
        await candidateModel.generateContent("Testing model availability: respond with 'ok'.");
        model = candidateModel;
        if (process.env.DEBUG_AI === "true") console.log("Using generative model:", name);
        return true;
      } catch (e) {
        if (process.env.DEBUG_AI === "true") console.warn(`Model ${name} probe failed:`, e?.message || e);
      }
    } catch (e) {
      if (process.env.DEBUG_AI === "true") console.warn(`Could not init candidate model ${name}:`, e?.message || e);
    }
  }

  return false;
}

// fallback 
function localRespond(userQuery) {
  const audit = dummyDegreeAudit;
  const q = userQuery.toLowerCase();

  // credits
  if (q.includes("credits") || q.includes("credit")) {
    const remaining = Math.max((audit.student.creditsRequired || 0) - (audit.student.creditsCompleted || 0), 0);
    return `Student ${audit.student.name} has completed ${audit.student.creditsCompleted} credits and requires ${audit.student.creditsRequired} total. Credits remaining: ${remaining}.`;
  }

  // lists
  if (q.includes("remaining courses") || q.includes("remaining") || q.includes("what's left") || q.includes("what is left")) {
    return `Remaining courses for ${audit.student.major}:\n- ${audit.courses.remaining.join('\n- ')}`;
  }

  if (q.includes("completed") || q.includes("courses completed") || q.includes("taken")) {
    return `Completed courses:\n- ${audit.courses.completed.join('\n- ')}`;
  }

  if (q.includes("in progress") || q.includes("in-progress")) {
    return `Courses currently in progress:\n- ${audit.courses.inProgress.join('\n- ')}`;
  }

  // general reply
  return "I can only answer questions that can be determined from the provided degree audit. Please ask about completed courses, in-progress courses, remaining courses, or credits.";
}

export async function sophosChat(userQuery) {
  if (process.env.LOCAL_AI_ONLY === "true") {
    if (process.env.DEBUG_AI === "true") console.log("LOCAL_AI_ONLY=true -> using local responder");
    return localRespond(userQuery);
  }

  if (!model) {
    const found = await findSupportedModel();
    if (!found) {
      if (process.env.LOCAL_AI_ONLY === "true") {
        return localRespond(userQuery);
      }
      const msg = genAI
        ? 'No supported generative model found for your API key / client. Set DEBUG_AI=true to see probe logs.'
        : 'GOOGLE_API_KEY not set or GenAI client failed to initialize.';
      throw new Error(msg);
    }
  }

  const degreeInfo = JSON.stringify(dummyDegreeAudit, null, 2);

  const prompt = `System: You are Sophos AI, a helpful UIC course-planning assistant.\n` +
    `Important: ONLY use the student's degree audit data provided below to answer the question. Do NOT hallucinate or invent any information. If the answer cannot be determined from the audit, respond: \"I don't know based on the provided audit.\"\n\n` +
    `Degree audit:\n${degreeInfo}\n\nUser: ${userQuery}\n\nProvide a concise, helpful answer. Use bullet points when helpful.`;

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (apiErr) {
    if (process.env.DEBUG_AI === "true") {
      console.error('Generative model error, falling back to local responder:', apiErr?.message || apiErr);
    } else {
      console.warn('AI model unavailable; using local fallback.');
    }
    return localRespond(userQuery);
  }

  if (result?.response?.text) return result.response.text;
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result);
  } catch (e) {
    return String(result);
  }
}
