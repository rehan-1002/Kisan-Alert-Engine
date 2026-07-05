import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAI, getGenerativeModel } from '../libs/ai-logic/index.js';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  }
}

async function runTests() {
  const mockApp = {
    options: {
      apiKey: "INVALID_BASE_KEY"
    }
  };

  const ai = getAI(mockApp);
  const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });

  // Test 1: Test with INVALID Gemini keys so it MUST fall back to Mistral (first in fallback)
  console.log("--- TEST 1: Fallback from Invalid Gemini keys to Mistral ---");
  process.env.VITE_GEMINI_API_KEYS = "INVALID_KEY_1,INVALID_KEY_2";
  process.env.VITE_GEMINI_API_KEY = "INVALID_KEY_1";
  
  try {
    const response = await model.generateContent("Hello! Say 'Mistral fallback is online' in Marathi.");
    console.log("SUCCESS! Mistral response:\n", response.response.text());
  } catch (err) {
    console.error("TEST 1 failed:", err.message);
  }

  // Test 2: Test streaming with Mistral fallback
  console.log("\n--- TEST 2: Streaming Fallback to Mistral ---");
  try {
    let streamText = "";
    await model.generateContentStream("Hello! Say 'Mistral streaming fallback is online' in Marathi.", (chunk) => {
      process.stdout.write(chunk);
      streamText += chunk;
    });
    console.log("\nSUCCESS! Stream completed.");
  } catch (err) {
    console.error("TEST 2 failed:", err.message);
  }

  // Test 3: Test fallback to OpenRouter (invalidate Gemini and Mistral)
  console.log("\n--- TEST 3: Fallback from Invalid Gemini & Mistral to OpenRouter ---");
  process.env.VITE_MISTRAL_API_KEY = "INVALID_MISTRAL_KEY";
  try {
    const response = await model.generateContent("Hello! Say 'OpenRouter fallback is online' in Marathi.");
    console.log("SUCCESS! OpenRouter response:\n", response.response.text());
  } catch (err) {
    console.error("TEST 3 failed:", err.message);
  }

  // Test 4: Test fallback to Cohere (invalidate Gemini, Mistral, and OpenRouter)
  console.log("\n--- TEST 4: Fallback to Cohere ---");
  process.env.VITE_OPENROUTER_API_KEY = "INVALID_OPENROUTER_KEY";
  try {
    const response = await model.generateContent("Hello! Say 'Cohere fallback is online' in Marathi.");
    console.log("SUCCESS! Cohere response:\n", response.response.text());
  } catch (err) {
    console.error("TEST 4 failed:", err.message);
  }
}

runTests();
