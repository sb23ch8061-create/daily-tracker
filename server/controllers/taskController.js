const Task = require('../models/Task');

// Get all tasks for the logged-in user
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  const { title, description, priority, deadline, duration, category } = req.body;
  try {
    const task = new Task({
      user: req.user.id,
      title,
      description,
      priority,
      deadline,
      duration,
      category
    });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Task Statistics
exports.getAnalytics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    const completedTasks = await Task.countDocuments({ user: req.user.id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ user: req.user.id, status: 'Pending' });

    // Group by Priority
    const highPriority = await Task.countDocuments({ user: req.user.id, priority: 'High' });
    const mediumPriority = await Task.countDocuments({ user: req.user.id, priority: 'Medium' });
    const lowPriority = await Task.countDocuments({ user: req.user.id, priority: 'Low' });

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      priorityDistribution: [
        { name: 'High', value: highPriority },
        { name: 'Medium', value: mediumPriority },
        { name: 'Low', value: lowPriority },
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task Status (e.g., Pending -> Completed)
exports.updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = req.body.status;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit Task Details
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update fields if provided, otherwise keep old value
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.duration = req.body.duration || task.duration;
    task.deadline = req.body.deadline || task.deadline;
    task.category = req.body.category || task.category;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};