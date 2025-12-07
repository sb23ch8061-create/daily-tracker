const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// YOUR KEY (Hardcoded for safety)
const genAI = new GoogleGenerativeAI("AIzaSyBemW_uy0ycRtqDTYtd-ZUyAF4LzyAlZQY");

// THE FIX: Using 'gemini-2.5-flash' which is required for your key
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const userSessions = new Map();

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const tasks = await Task.find({ user: userId, status: { $ne: 'Completed' } });
    
    // Create Context
    const taskList = tasks.map(t => `- "${t.title}" (Priority: ${t.priority})`).join('\n');
    const userMemories = user.preferences && user.preferences.length > 0 
      ? user.preferences.join('\n') 
      : "No learned preferences yet.";

    // 1. Check Confirmations
    if (userSessions.has(userId)) {
      const session = userSessions.get(userId);
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('yes') || lowerMsg.includes('sure') || lowerMsg.includes('do it')) {
        if (session.intent === 'DELETE') {
          await Task.findByIdAndDelete(session.taskId);
          userSessions.delete(userId);
          return res.json({ reply: `🗑️ Deleted "${session.taskTitle}".` });
        }
        if (session.intent === 'COMPLETE') {
          await Task.findByIdAndUpdate(session.taskId, { status: 'Completed' });
          userSessions.delete(userId);
          return res.json({ reply: `✅ Marked "${session.taskTitle}" as done.` });
        }
      } else if (lowerMsg.includes('no') || lowerMsg.includes('cancel')) {
        userSessions.delete(userId);
        return res.json({ reply: "Action cancelled." });
      }
    }

    // 2. Ask AI
    const prompt = `
      You are a smart task assistant.
      [USER MEMORY] ${userMemories}
      [TASKS] ${taskList || "None"}
      [INPUT] "${message}"
      
      Reply JSON ONLY:
      {
        "intent": "ADD" | "DELETE" | "COMPLETE" | "UPDATE" | "QUERY" | "LEARN",
        "taskTitle": "extracted title",
        "date": "ISO date string",
        "priority": "Medium",
        "learned_fact": "new preference",
        "reply": "friendly response"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let aiData;
    try { aiData = JSON.parse(cleanJson); } catch (e) { return res.json({ reply: responseText }); }

    // 3. Save Learning
    if (aiData.learned_fact) {
      if (!user.preferences.includes(aiData.learned_fact)) {
        user.preferences.push(aiData.learned_fact);
        await user.save();
      }
      if (aiData.intent === 'LEARN') return res.json({ reply: aiData.reply });
    }

    // 4. ADD Task
    if (aiData.intent === 'ADD') {
      const newTask = new Task({
        user: userId,
        title: aiData.taskTitle || 'New Task',
        priority: aiData.priority || 'Medium',
        deadline: aiData.date || new Date(),
        startTime: aiData.date || new Date(),
        duration: 30,
        status: 'Pending'
      });
      await newTask.save();
      return res.json({ reply: aiData.reply });
    }

    // 5. Handle Other Actions (Delete/Complete/Update)
    let targetTask = null;
    if (['DELETE', 'COMPLETE', 'UPDATE'].includes(aiData.intent)) {
      targetTask = tasks.find(t => t.title.toLowerCase().includes(aiData.taskTitle?.toLowerCase()));
      if (!targetTask) return res.json({ reply: `I couldn't find a task named "${aiData.taskTitle}".` });
    }

    if (aiData.intent === 'DELETE') {
      userSessions.set(userId, { intent: 'DELETE', taskId: targetTask._id, taskTitle: targetTask.title });
      return res.json({ reply: `⚠️ Delete "${targetTask.title}"?` });
    }

    if (aiData.intent === 'COMPLETE') {
      userSessions.set(userId, { intent: 'COMPLETE', taskId: targetTask._id, taskTitle: targetTask.title });
      return res.json({ reply: `Did you finish "${targetTask.title}"?` });
    }

    if (aiData.intent === 'UPDATE') {
       if(aiData.date) targetTask.deadline = aiData.date;
       if(aiData.priority) targetTask.priority = aiData.priority;
       await targetTask.save();
       return res.json({ reply: aiData.reply });
    }

    return res.json({ reply: aiData.reply });

  } catch (error) {
    console.error("AI Error:", error);
    res.json({ reply: "I'm having trouble connecting right now. Try again!" });
  }
};