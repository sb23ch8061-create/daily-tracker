const { GoogleGenAI } = require('@google/genai');
const Task = require('../models/Task'); // Assuming Task model might be needed

// Initialize the GoogleGenAI client (reads GEMINI_API_KEY from process.env)
const ai = new GoogleGenAI({});

// Helper function to convert buffer to base64 for API
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

exports.analyzeScheduleFile = async (fileBuffer, mimeType, userId) => {
  if (!fileBuffer) return [];

  // 1. Prepare the multimodal input
  const imagePart = fileToGenerativePart(fileBuffer, mimeType);
  
  // 2. Define the extraction prompt
  const prompt = `
    Analyze the provided image/document which contains a weekly schedule, routine, or list of tasks. 
    Your goal is to accurately extract the tasks and structure them into a simple JSON array.
    
    The array should contain objects with the following keys, inferred from the image:
    - title (string): The name of the task.
    - day (string): The day of the week (e.g., Monday, Tuesday, Saturday).
    - time (string): The start time (24h format, e.g., 08:30).
    - duration (number): The duration in minutes (e.g., 60, 90).
    - taskType (string): Category (e.g., Work, Academic, Fitness).

    Only return the JSON array. Do not include any introductory or explanatory text.
    If no information is found, return an empty array: [].
  `;
  
  // 3. Call the Gemini API
  const model = "gemini-2.5-flash"; // Suitable for fast multimodal tasks
  
  const response = await ai.models.generateContent({
    model,
    contents: [imagePart, prompt],
  });

  try {
    // 4. Parse the JSON output
    const jsonString = response.text.trim().replace(/```json/g, '').replace(/```/g, '');
    const tasks = JSON.parse(jsonString);
    return tasks;

  } catch (e) {
    console.error("Gemini Parsing Error:", e);
    // Fallback: return a clear error or a simple task
    return [{ title: "AI Error: Could not parse document format.", day: "Monday", time: "09:00", duration: 60, taskType: "Error" }];
  }
};