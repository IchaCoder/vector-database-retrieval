import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { ANSWERING_MODEL } from "./constants.js";

/** Ensure the Gemini API key is available and correctly configured */
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Gemini API key is missing or invalid.");
}

/** Gemini config */
export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateResponse(prompt) {
  const response = await genAI.models.generateContentStream({
    model: ANSWERING_MODEL,
    contents: prompt,
  });

  return response;
}
// main();

/** Supabase config */
const supabasePrivateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabasePrivateKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing or invalid");
}

const url = process.env.SUPABASE_URL;

if (!url) {
  throw new Error("SUPABASE_URL is missing or invalid");
}

export const supabase = createClient(url, supabasePrivateKey);
