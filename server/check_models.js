const { GoogleGenerativeAI } = require("@google/generative-ai");

// YOUR KEY
const genAI = new GoogleGenerativeAI("AIzaSyBemW_uy0ycRtqDTYtd-ZUyAF4LzyAlZQY");

async function listModels() {
  try {
    console.log("Checking available models...");
    // We cannot list models directly with the helper, so we test the most likely ones.
    
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.0-pro"];
    
    for (const modelName of modelsToTest) {
      console.log(`Testing: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ SUCCESS! Model '${modelName}' works!`);
        return; // Stop after finding one that works
      } catch (error) {
        console.log(`❌ Failed: ${modelName} (${error.message.split('[')[1]?.split(']')[0] || 'Error'})`);
      }
    }
  } catch (error) {
    console.error("Critical Error:", error);
  }
}

listModels();