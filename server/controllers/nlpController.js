const Task = require('../models/Task');
const chrono = require('chrono-node');

exports.parseTaskString = async (req, res) => {
  const { text } = req.body;

  try {
    let title = text;
    let duration = 30; 
    let priority = 'Medium';

    // 1. NLP Date Parsing (The Magic Part)
    // chrono.parseDate returns a JS Date object automatically
    const parsedDate = chrono.parseDate(text); 

    // Default to end of today (23:59) if no time mentioned, 
    // OR use the parsed date if one was found.
    let deadline = parsedDate || new Date();
    if (!parsedDate) {
        deadline.setHours(23, 59, 0, 0);
    }

    // 2. Detect Duration (Simple Regex)
    const durationMatch = text.match(/for (\d+) (hour|hr|min|minute)/i);
    if (durationMatch) {
      const val = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      duration = unit.startsWith('h') ? val * 60 : val;
    }

    // 3. Detect Priority
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('important')) {
      priority = 'High';
    }

    // 4. Cleanup Title 
    // (Remove the date string found by chrono to clean up the title)
    const results = chrono.parse(text);
    if (results.length > 0) {
        title = title.replace(results[0].text, '');
    }

    // Remove keywords
    title = title.replace(/urgent|important|for \d+ (hour|hr|min|minute)s?/gi, '').trim();
    title = title.replace(/\s+/g, ' ').trim();

    // Create Task
    const task = new Task({
      user: req.user.id,
      title: title || 'New Task', // Fallback title
      duration,
      priority,
      deadline,
      status: 'Pending'
    });

    await task.save();
    res.status(201).json({ message: 'Task parsed successfully', task });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to parse task' });
  }
};