const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// YOUR KEY
const genAI = new GoogleGenerativeAI("AIzaSyBemW_uy0ycRtqDTYtd-ZUyAF4LzyAlZQY");

// CRITICAL FIX: Using 2.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const userSessions = new Map();

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const tasks = await Task.find({ user: userId, status: { $ne: 'Completed' } });
    
    const taskList = tasks.map(t => `- "${t.title}" (Priority: ${t.priority}, Time: ${t.startTime ? new Date(t.startTime).toLocaleTimeString() : 'Not set'})`).join('\n');
    const userMemories = user.preferences && user.preferences.length > 0 
      ? user.preferences.join('\n') 
      : "No learned preferences yet.";

    if (userSessions.has(userId)) {
      const session = userSessions.get(userId);
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('yes') || lowerMsg.includes('sure') || lowerMsg.includes('do it')) {
        let successMsg = "";
        if (session.intent === 'DELETE') {
          await Task.findByIdAndDelete(session.taskId);
          successMsg = `🗑️ Deleted "${session.taskTitle}".`;
        }
        if (session.intent === 'COMPLETE') {
          await Task.findByIdAndUpdate(session.taskId, { status: 'Completed' });
          successMsg = `✅ Marked "${session.taskTitle}" as done.`;
        }
        userSessions.delete(userId);
        return res.json({ reply: successMsg });
      } else if (lowerMsg.includes('no') || lowerMsg.includes('cancel')) {
        userSessions.delete(userId);
        return res.json({ reply: "Okay, cancelled." });
      }
    }

    const prompt = `
      You are an intelligent, adaptive personal assistant.
      [USER MEMORY] ${userMemories}
      [PENDING TASKS] ${taskList || "No pending tasks."}
      [TIME] ${new Date().toString()}
      [INPUT] "${message}"

      Understand intent (Add, Delete, Update, Query, Learn).
      Check for preferences to learn.
      
      RESPONSE JSON:
      {
        "intent": "ADD" | "DELETE" | "COMPLETE" | "UPDATE" | "QUERY" | "LEARN",
        "taskTitle": "Extracted title",
        "newTitle": "New title",
        "date": "ISO Date string",
        "priority": "High" | "Medium" | "Low",
        "learned_fact": "New preference string",
        "reply": "Conversational response"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let aiData;
    try { aiData = JSON.parse(cleanJson); } catch (e) { return res.json({ reply: responseText }); }

    if (aiData.learned_fact) {
      if (!user.preferences.includes(aiData.learned_fact)) {
        user.preferences.push(aiData.learned_fact);
        await user.save();
      }
      if (aiData.intent === 'LEARN') return res.json({ reply: aiData.reply });
    }

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

    let targetTask = null;
    if (['DELETE', 'COMPLETE', 'UPDATE'].includes(aiData.intent)) {
      targetTask = tasks.find(t => t.title.toLowerCase().includes(aiData.taskTitle?.toLowerCase()));
      if (!targetTask) return res.json({ reply: `I couldn't find a task named "${aiData.taskTitle}".` });
    }

    if (aiData.intent === 'UPDATE' && targetTask) {
      if (aiData.date) { targetTask.deadline = aiData.date; targetTask.startTime = aiData.date; }
      if (aiData.priority) targetTask.priority = aiData.priority;
      if (aiData.newTitle) targetTask.title = aiData.newTitle;
      await targetTask.save();
      return res.json({ reply: aiData.reply });
    }

    if (aiData.intent === 'DELETE' && targetTask) {
      userSessions.set(userId, { intent: 'DELETE', taskId: targetTask._id, taskTitle: targetTask.title });
      return res.json({ reply: `⚠️ Are you sure you want to delete "${targetTask.title}"?` });
    }

    if (aiData.intent === 'COMPLETE' && targetTask) {
      userSessions.set(userId, { intent: 'COMPLETE', taskId: targetTask._id, taskTitle: targetTask.title });
      return res.json({ reply: `Did you finish "${targetTask.title}"?` });
    }

    return res.json({ reply: aiData.reply });

  } catch (error) {
    console.error("AI Error:", error);
    res.json({ reply: "I'm having a bit of trouble connecting to my memory." });
  }
};

// Final AI Fix Force Update