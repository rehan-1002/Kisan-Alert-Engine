async function runTest() {
  const geminiKey = "AIzaSyB6tU4ZZ43-uDLWZagm0piYlmZTUCLcX60";
  const modelName = "gemini-2.5-flash";

  console.log(`--- Testing with model ${modelName} ---`);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello! Say: 'System is online!' in Marathi." }] }]
      })
    });
    console.log("Status:", response.status);
    const body = await response.text();
    console.log("Response Body:", body);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

runTest();
