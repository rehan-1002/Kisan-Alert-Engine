import { getAI, getGenerativeModel } from "@firebase/ai-logic";
import app from "../config/firebase";

const ai = getAI(app);
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

const langInstructions = {
  "English": "Respond ONLY in English. Adopt a warm, friendly, helpful 1-to-1 advisor tone.",
  "Hindi": "Respond ONLY in Hindi (हिन्दी). Adopt a warm, reassuring 1-to-1 conversational helper style (Kisan Mitra). Address the farmer directly as 'आप' (you) and use simple local terms.",
  "Marathi": "Respond ONLY in Marathi (मराठी). Adopt a warm, reassuring 1-to-1 conversational helper style (Shetkari Mitra). Address the farmer directly as 'तुम्ही' (you) and use simple local Marathi terms.",
  "Tamil": "Respond ONLY in Tamil (தமிழ்). Adopt a warm, reassuring 1-to-1 conversational helper style (Farmer Friend). Address the farmer directly as 'நீங்கள்' (you) and use simple local Tamil terms.",
  "Telugu": "Respond ONLY in Telugu (తెలుగు). Adopt a warm, reassuring 1-to-1 conversational helper style (Farmer Friend). Address the farmer directly as 'మీరు' (you) and use simple local Telugu terms."
};

export async function generateCropAdvisory(soilData, lang = "English") {
  const selectedInstruction = langInstructions[lang] || langInstructions["English"];
  const prompt = `
  You are a friendly, warm agricultural expert speaking 1-to-1 with a farmer.
  Below is the soil and weather telemetry data in JSON format:
  
  ${JSON.stringify(soilData, null, 2)}
  
  Based on this telemetry (soil moisture, soil temperature, and maximum daily temperature), perform the following tasks:
  1. Analyze the soil parameters and weather conditions.
  2. Recommend exactly the top 3 suitable crops for these specific soil/weather conditions and explain why.
  3. Speak directly to the farmer.
  
  Language and Persona Instruction:
  ${selectedInstruction}
  
  Write your output using clear markdown with short, scannable, bolded lines suitable for low-literacy users. Do not output multiple languages or translations. Only output the response in the specified target language.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error in generateCropAdvisory:", error);
    return `### ⚠️ Error / त्रुटि / त्रुटी / பிழை / లోపం
    
Failed to generate advisory due to API issues. Please try again.`;
  }
}

export async function generateCropAdvisoryStream(soilData, lang = "English", onChunk) {
  const selectedInstruction = langInstructions[lang] || langInstructions["English"];
  const prompt = `
  You are a friendly, warm agricultural expert speaking 1-to-1 with a farmer.
  Below is the soil and weather telemetry data in JSON format:
  
  ${JSON.stringify(soilData, null, 2)}
  
  Based on this telemetry (soil moisture, soil temperature, and maximum daily temperature), perform the following tasks:
  1. Analyze the soil parameters and weather conditions.
  2. Recommend exactly the top 3 suitable crops for these specific soil/weather conditions and explain why.
  3. Speak directly to the farmer.
  
  Language and Persona Instruction:
  ${selectedInstruction}
  
  Write your output using clear markdown with short, scannable, bolded lines suitable for low-literacy users. Do not output multiple languages or translations. Only output the response in the specified target language.
  `;

  try {
    const result = await model.generateContentStream(prompt, onChunk);
    return result.response.text();
  } catch (error) {
    console.error("Error in generateCropAdvisoryStream:", error);
    throw error;
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function diagnoseVoiceQuery(audioBlob, imageBase64, imageMimeType, userTextQuery, fallbackLang = "English") {
  try {
    const contents = [];
    
    if (audioBlob) {
      const base64Audio = await blobToBase64(audioBlob);
      contents.push({
        inlineData: {
          mimeType: audioBlob.type || "audio/webm",
          data: base64Audio
        }
      });
    }

    if (imageBase64) {
      let cleanBase64 = imageBase64;
      if (imageBase64.includes(",")) {
        cleanBase64 = imageBase64.split(",")[1];
      }
      contents.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: cleanBase64
        }
      });
    }

    const promptText = `
    You are an expert AI agricultural diagnostician and crop doctor speaking 1-to-1 with a farmer.
    
    ${userTextQuery ? `The farmer has provided the following text query/description of their concern:\n"${userTextQuery}"\n` : ""}
    
    Tasks:
    ${audioBlob ? "1. Listen to the farmer's voice input, auto-detect the language spoken (Hindi, Marathi, Tamil, Telugu, or English)." : ""}
    ${imageBase64 ? "2. Analyze the attached crop snapshot image closely. Identify any plant disease, insect/pest damage, nutritional deficiency, or soil abnormalities visible." : ""}
    3. Respond directly to the farmer with a detailed crop or soil diagnosis.
    4. Provide clear, step-by-step actionable advice and remedies on what the farmer should do to normalize the soil or cure/treat the crop.
    
    Language and Tone Instructions:
    - If voice audio was provided, you MUST respond in the EXACT same language that the user spoke in the microphone (Hindi, Marathi, Tamil, Telugu, or English).
    - If there is no voice audio (e.g., only image and/or text notes), respond in the language of the farmer's text query, or fallback to ${fallbackLang}.
    - Speak like a friendly human expert talking 1-to-1 (e.g. Kisan Mitra / Shetkari Mitra / Farmer Friend). Address the farmer respectfully ("आप" in Hindi, "तुम्ही" in Marathi, "நீங்கள்" in Tamil, "మీరు" in Telugu).
    - Avoid dry databases or writing multiple language translations in the same response. Respond ONLY in the matched language.
    - Write your output using clear markdown with short, scannable, bolded lines.
    `;

    contents.push({ text: promptText });

    const result = await model.generateContent(contents);
    return result.response.text();
  } catch (error) {
    console.error("Error in diagnoseVoiceQuery:", error);
    return `### ⚠️ Error / त्रुटि / त्रुटी / பிழை / లోపం
    
Diagnosis failed. Please check network.`;
  }
}

export async function diagnoseVoiceQueryStream(audioBlob, imageBase64, imageMimeType, userTextQuery, fallbackLang = "English", onChunk) {
  try {
    const contents = [];
    
    if (audioBlob) {
      const base64Audio = await blobToBase64(audioBlob);
      contents.push({
        inlineData: {
          mimeType: audioBlob.type || "audio/webm",
          data: base64Audio
        }
      });
    }

    if (imageBase64) {
      let cleanBase64 = imageBase64;
      if (imageBase64.includes(",")) {
        cleanBase64 = imageBase64.split(",")[1];
      }
      contents.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: cleanBase64
        }
      });
    }

    const promptText = `
    You are an expert AI agricultural diagnostician and crop doctor speaking 1-to-1 with a farmer.
    
    ${userTextQuery ? `The farmer has provided the following text query/description of their concern:\n"${userTextQuery}"\n` : ""}
    
    Tasks:
    ${audioBlob ? "1. Listen to the farmer's voice input, auto-detect the language spoken (Hindi, Marathi, Tamil, Telugu, or English)." : ""}
    ${imageBase64 ? "2. Analyze the attached crop snapshot image closely. Identify any plant disease, insect/pest damage, nutritional deficiency, or soil abnormalities visible." : ""}
    3. Respond directly to the farmer with a detailed crop or soil diagnosis.
    4. Provide clear, step-by-step actionable advice and remedies on what the farmer should do to normalize the soil or cure/treat the crop.
    
    Language and Tone Instructions:
    - If voice audio was provided, you MUST respond in the EXACT same language that the user spoke in the microphone (Hindi, Marathi, Tamil, Telugu, or English).
    - If there is no voice audio (e.g., only image and/or text notes), respond in the language of the farmer's text query, or fallback to ${fallbackLang}.
    - Speak like a friendly human expert talking 1-to-1 (e.g. Kisan Mitra / Shetkari Mitra / Farmer Friend). Address the farmer respectfully ("आप" in Hindi, "तुम्ही" in Marathi, "நீங்கள்" in Tamil, "మీరు" in Telugu).
    - Avoid dry databases or writing multiple language translations in the same response. Respond ONLY in the matched language.
    - Write your output using clear markdown with short, scannable, bolded lines.
    `;

    contents.push({ text: promptText });

    const result = await model.generateContentStream(contents, onChunk);
    return result.response.text();
  } catch (error) {
    console.error("Error in diagnoseVoiceQueryStream:", error);
    throw error;
  }
}
