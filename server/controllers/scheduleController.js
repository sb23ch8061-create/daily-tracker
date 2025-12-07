const Task = require('../models/Task');

exports.generateSchedule = async (req, res) => {
  try {
    // 1. Fetch all pending tasks for user
    const tasks = await Task.find({ user: req.user.id, status: 'Pending' });

    if (tasks.length === 0) {
      return res.status(400).json({ message: 'No pending tasks to schedule' });
    }

    // 2. Sort Logic: High Priority first, then shortest duration
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };

    tasks.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.duration - b.duration; // Tie-breaker: shorter tasks first
    });

    // 3. Assign Times (Starting at 9:00 AM Today)
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9:00 AM

    // If 9 AM is passed, start 30 mins from now
    if (new Date() > currentTime) {
      currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    const updatedTasks = [];

    for (const task of tasks) {
      const start = new Date(currentTime);
      const end = new Date(currentTime.getTime() + task.duration * 60000);

      task.startTime = start;
      task.endTime = end;
      task.status = 'Scheduled';

      await task.save();
      updatedTasks.push(task);

      // Update currentTime for next task + 10 min break
      currentTime = new Date(end.getTime() + 10 * 60000); 
    }

    res.json({ message: 'Schedule Generated', tasks: updatedTasks });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};