export function getAI(app) {
  if (!app) {
    throw new Error("getAI requires a valid Firebase App instance.");
  }
  return {
    apiKey: app.options.apiKey,
    app
  };
}

let currentKeyIndex = 0;

function mapPromptParts(promptParts, provider) {
  let textContent = "";
  let imageParts = [];
  let hasAudio = false;

  for (const part of promptParts) {
    if (!part) continue;
    if (typeof part === 'string') {
      textContent += (textContent ? "\n" : "") + part;
    } else if (part.text) {
      textContent += (textContent ? "\n" : "") + part.text;
    } else if (part.inlineData) {
      const mime = part.inlineData.mimeType || "";
      if (mime.startsWith("image/")) {
        imageParts.push({
          mimeType: mime,
          data: part.inlineData.data
        });
      } else if (mime.startsWith("audio/")) {
        hasAudio = true;
      }
    }
  }

  if (provider === "mistral" || provider === "openrouter") {
    let content = [];
    if (hasAudio) {
      textContent += "\n\n[Note: The user uploaded an audio query, but since we had to use a fallback model, the audio could not be processed. Please respond based on the text/images provided and kindly inform the user about the audio limitation if they asked something in it.]";
    }
    content.push({ type: "text", text: textContent });
    for (const img of imageParts) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType};base64,${img.data}`
        }
      });
    }
    return content;
  } else if (provider === "cohere") {
    if (hasAudio || imageParts.length > 0) {
      textContent += `\n\n[Note: The user uploaded an image and/or audio query, but since we had to use a text-only fallback model, the media could not be processed. Please respond based on the text query and kindly inform the user about the media limitation.]`;
    }
    return textContent;
  }

  return textContent;
}

async function callProvider(provider, modelName, key, promptParts, isStream, onChunk) {
  let url = "";
  let headers = {
    "Content-Type": "application/json"
  };
  let bodyPayload = {};

  if (provider === "gemini") {
    const geminiEndpoint = isStream ? "streamGenerateContent?alt=sse" : "generateContent";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${geminiEndpoint}${geminiEndpoint.includes('?') ? '&' : '?'}key=${key}`;
    bodyPayload = {
      contents: [{ parts: promptParts }]
    };
  } else if (provider === "mistral") {
    url = "https://api.mistral.ai/v1/chat/completions";
    headers["Authorization"] = `Bearer ${key}`;
    bodyPayload = {
      model: "pixtral-12b",
      messages: [{ role: "user", content: mapPromptParts(promptParts, "mistral") }],
      max_tokens: 1000,
      stream: isStream
    };
  } else if (provider === "openrouter") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers["Authorization"] = `Bearer ${key}`;
    headers["HTTP-Referer"] = "https://kisan-alert.example.com";
    headers["X-Title"] = "Kisan Alert Web";
    bodyPayload = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: mapPromptParts(promptParts, "openrouter") }],
      max_tokens: 1000,
      stream: isStream
    };
  } else if (provider === "cohere") {
    url = "https://api.cohere.com/v2/chat";
    headers["Authorization"] = `Bearer ${key}`;
    bodyPayload = {
      model: "command-a-03-2025",
      messages: [{ role: "user", content: mapPromptParts(promptParts, "cohere") }],
      max_tokens: 1000,
      stream: isStream
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[${provider}] Status ${response.status}: ${errorText}`);
  }

  if (isStream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); 

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "data: [DONE]") {
          return fullText;
        }
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.substring(6);
          try {
            const parsed = JSON.parse(jsonStr);
            let chunkText = "";

            if (provider === "gemini") {
              if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
                chunkText = parsed.candidates[0].content.parts[0].text;
              }
            } else if (provider === "mistral" || provider === "openrouter") {
              if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                chunkText = parsed.choices[0].delta.content;
              }
            } else if (provider === "cohere") {
              if (parsed.type === "content-delta" && parsed.delta && parsed.delta.message && parsed.delta.message.content) {
                chunkText = parsed.delta.message.content.text;
              }
            }

            if (chunkText) {
              fullText += chunkText;
              if (onChunk) {
                onChunk(chunkText);
              }
            }
          } catch (e) {
            console.error(`Failed to parse SSE JSON line for ${provider}:`, e, jsonStr);
          }
        }
      }
    }

    if (buffer) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        const jsonStr = trimmed.substring(6);
        try {
          const parsed = JSON.parse(jsonStr);
          let chunkText = "";
          if (provider === "gemini") {
            if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
              chunkText = parsed.candidates[0].content.parts[0].text;
            }
          } else if (provider === "mistral" || provider === "openrouter") {
            if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              chunkText = parsed.choices[0].delta.content;
            }
          } else if (provider === "cohere") {
            if (parsed.type === "content-delta" && parsed.delta && parsed.delta.message && parsed.delta.message.content) {
              chunkText = parsed.delta.message.content.text;
            }
          }
          if (chunkText) {
            fullText += chunkText;
            if (onChunk) {
              onChunk(chunkText);
            }
          }
        } catch (e) {
          
        }
      }
    }

    return fullText;
  } else {
    const json = await response.json();
    let textResult = "";

    if (provider === "gemini") {
      if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
        textResult = json.candidates[0].content.parts[0].text;
      } else {
        textResult = "Warning: The model did not return text content.";
      }
    } else if (provider === "mistral" || provider === "openrouter") {
      if (json.choices && json.choices[0].message && json.choices[0].message.content) {
        textResult = json.choices[0].message.content;
      } else {
        textResult = "Warning: The model did not return text content.";
      }
    } else if (provider === "cohere") {
      if (json.message && json.message.content && json.message.content[0] && json.message.content[0].text) {
        textResult = json.message.content[0].text;
      } else {
        textResult = "Warning: The model did not return text content.";
      }
    }
    return textResult;
  }
}

export function getGenerativeModel(ai, options) {
  const modelName = options.model || 'gemini-2.5-flash';
  return {
    modelName,
    ai,
    async generateContent(contents) {
      let promptParts = [];

      if (typeof contents === 'string') {
        promptParts = [{ text: contents }];
      } else if (Array.isArray(contents)) {
        promptParts = contents.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents && contents.contents && Array.isArray(contents.contents)) {
        promptParts = contents.contents[0].parts.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents && contents.parts && Array.isArray(contents.parts)) {
        promptParts = contents.parts.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents) {
        promptParts = [contents];
      }

      let geminiKeys = [];
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEYS) {
          geminiKeys = import.meta.env.VITE_GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean);
        } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          geminiKeys = [import.meta.env.VITE_GEMINI_API_KEY.trim()];
        } else if (typeof process !== 'undefined' && process.env) {
          if (process.env.VITE_GEMINI_API_KEYS) {
            geminiKeys = process.env.VITE_GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean);
          } else if (process.env.VITE_GEMINI_API_KEY) {
            geminiKeys = [process.env.VITE_GEMINI_API_KEY.trim()];
          }
        }
      } catch (e) {
        
      }

      if (geminiKeys.length === 0) {
        geminiKeys = [];
      }
      if (ai.apiKey && !geminiKeys.includes(ai.apiKey)) {
        geminiKeys.push(ai.apiKey);
      }

      let mistralKey = "";
      let openrouterKey = "";
      let cohereKey = "";
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          mistralKey = (import.meta.env.VITE_MISTRAL_API_KEY || "").trim();
          openrouterKey = (import.meta.env.VITE_OPENROUTER_API_KEY || "").trim();
          cohereKey = (import.meta.env.VITE_COHERE_API_KEY || "").trim();
        } else if (typeof process !== 'undefined' && process.env) {
          mistralKey = (process.env.VITE_MISTRAL_API_KEY || "").trim();
          openrouterKey = (process.env.VITE_OPENROUTER_API_KEY || "").trim();
          cohereKey = (process.env.VITE_COHERE_API_KEY || "").trim();
        }
      } catch (e) {}

      const steps = [];

      for (let i = 0; i < geminiKeys.length; i++) {
        const keyIndex = (currentKeyIndex + i) % geminiKeys.length;
        steps.push({
          provider: "gemini",
          key: geminiKeys[keyIndex],
          keyIndex: keyIndex
        });
      }

      if (mistralKey) {
        steps.push({
          provider: "mistral",
          key: mistralKey
        });
      }

      if (openrouterKey) {
        steps.push({
          provider: "openrouter",
          key: openrouterKey
        });
      }

      if (cohereKey) {
        steps.push({
          provider: "cohere",
          key: cohereKey
        });
      }

      let lastError = null;
      for (const step of steps) {
        try {
          const text = await callProvider(step.provider, modelName, step.key, promptParts, false, null);

          if (step.provider === "gemini") {
            currentKeyIndex = step.keyIndex;
          }

          return {
            response: {
              text: () => text
            }
          };
        } catch (err) {
          console.error(`Attempt with provider ${step.provider} failed:`, err.message);
          lastError = err;
          if (step.provider === "gemini") {
            if (err.message.includes("Status 429")) {
              currentKeyIndex = (step.keyIndex + 1) % geminiKeys.length;
            }
          }
        }
      }

      throw new Error(`All Gemini and fallback API keys exhausted. Last error: ${lastError ? lastError.message : "Unknown error"}`);
    },

    async generateContentStream(contents, onChunk) {
      let promptParts = [];

      if (typeof contents === 'string') {
        promptParts = [{ text: contents }];
      } else if (Array.isArray(contents)) {
        promptParts = contents.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents && contents.contents && Array.isArray(contents.contents)) {
        promptParts = contents.contents[0].parts.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents && contents.parts && Array.isArray(contents.parts)) {
        promptParts = contents.parts.map(part => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
      } else if (contents) {
        promptParts = [contents];
      }

      let geminiKeys = [];
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEYS) {
          geminiKeys = import.meta.env.VITE_GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean);
        } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          geminiKeys = [import.meta.env.VITE_GEMINI_API_KEY.trim()];
        } else if (typeof process !== 'undefined' && process.env) {
          if (process.env.VITE_GEMINI_API_KEYS) {
            geminiKeys = process.env.VITE_GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean);
          } else if (process.env.VITE_GEMINI_API_KEY) {
            geminiKeys = [process.env.VITE_GEMINI_API_KEY.trim()];
          }
        }
      } catch (e) {
        
      }

      if (geminiKeys.length === 0) {
        geminiKeys = [];
      }
      if (ai.apiKey && !geminiKeys.includes(ai.apiKey)) {
        geminiKeys.push(ai.apiKey);
      }

      let mistralKey = "";
      let openrouterKey = "";
      let cohereKey = "";
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          mistralKey = (import.meta.env.VITE_MISTRAL_API_KEY || "").trim();
          openrouterKey = (import.meta.env.VITE_OPENROUTER_API_KEY || "").trim();
          cohereKey = (import.meta.env.VITE_COHERE_API_KEY || "").trim();
        } else if (typeof process !== 'undefined' && process.env) {
          mistralKey = (process.env.VITE_MISTRAL_API_KEY || "").trim();
          openrouterKey = (process.env.VITE_OPENROUTER_API_KEY || "").trim();
          cohereKey = (process.env.VITE_COHERE_API_KEY || "").trim();
        }
      } catch (e) {}

      const steps = [];

      for (let i = 0; i < geminiKeys.length; i++) {
        const keyIndex = (currentKeyIndex + i) % geminiKeys.length;
        steps.push({
          provider: "gemini",
          key: geminiKeys[keyIndex],
          keyIndex: keyIndex
        });
      }

      if (mistralKey) {
        steps.push({
          provider: "mistral",
          key: mistralKey
        });
      }

      if (openrouterKey) {
        steps.push({
          provider: "openrouter",
          key: openrouterKey
        });
      }

      if (cohereKey) {
        steps.push({
          provider: "cohere",
          key: cohereKey
        });
      }

      let lastError = null;
      for (const step of steps) {
        try {
          const text = await callProvider(step.provider, modelName, step.key, promptParts, true, onChunk);

          if (step.provider === "gemini") {
            currentKeyIndex = step.keyIndex;
          }

          return {
            response: {
              text: () => text
            }
          };
        } catch (err) {
          console.error(`Stream attempt with provider ${step.provider} failed:`, err.message);
          lastError = err;
          if (step.provider === "gemini") {
            if (err.message.includes("Status 429")) {
              currentKeyIndex = (step.keyIndex + 1) % geminiKeys.length;
            }
          }
        }
      }

      throw new Error(`All Gemini and fallback API keys exhausted in stream. Last error: ${lastError ? lastError.message : "Unknown error"}`);
    }
  };
}