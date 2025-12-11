const Task = require('../models/Task');
const WeeklyTask = require('../models/WeeklyTask'); // Required for Scheduling
const WeeklyException = require('../models/WeeklyException'); // Required for Scheduling

// --- EXISTING CRUD FUNCTIONS ---

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    const deadline = req.body.deadline === '' ? null : req.body.deadline;
    const task = new Task({
      user: req.user.id,
      title: req.body.title,
      priority: req.body.priority,
      duration: req.body.duration,
      interest: req.body.interest,
      taskType: req.body.taskType,
      suitableTime: req.body.suitableTime,
      deadline: deadline 
    });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (req.body.deadline === "") req.body.deadline = null;
    Object.assign(task, req.body);
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Status
exports.updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) return res.status(404).json({ message: 'Task not found' });
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
    if (!task || task.user.toString() !== req.user.id) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    const completedTasks = await Task.countDocuments({ user: req.user.id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ user: req.user.id, status: 'Pending' });
    const highPriority = await Task.countDocuments({ user: req.user.id, priority: 'High' });
    const mediumPriority = await Task.countDocuments({ user: req.user.id, priority: 'Medium' });
    const lowPriority = await Task.countDocuments({ user: req.user.id, priority: 'Low' });

    res.json({
      totalTasks, completedTasks, pendingTasks,
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


// --- NEW AI & SCHEDULING LOGIC ---

// 1. NLP Task Entry (Simple Parser)
exports.nlpTask = async (req, res) => {
  try {
    const { text } = req.body;
    // Basic Keyword Extraction
    let duration = 30;
    if (text.includes('hour')) duration = 60;
    if (text.includes('15 min')) duration = 15;
    
    let priority = 'Medium';
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('important')) priority = 'Urgent';

    const task = new Task({
      user: req.user.id,
      title: text, // Use the raw text as title for now
      duration,
      priority,
      status: 'Pending',
      taskType: 'General'
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. AUTO SCHEDULE (The "Brain")
exports.autoSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // A. FETCH EVERYTHING
    // 1. Tasks that need scheduling (Pending OR Delayed)
    const tasksToSchedule = await Task.find({
      user: userId,
      status: { $in: ['Pending', 'Delay'] }
    });

    // 2. Constraints (Weekly Tasks & Exceptions)
    const weeklyTasks = await WeeklyTask.find({ user: userId });
    const exceptions = await WeeklyException.find({ user: userId });
    
    // 3. Already Scheduled Normal Tasks (We don't want to overlap these)
    const alreadyScheduled = await Task.find({
      user: userId,
      status: 'Scheduled',
      startTime: { $gt: new Date() } // Only future tasks
    });

    // B. SORT TASKS (CRITICAL FIX FOR DELAYED TASKS)
    // We give points to prioritize: Delay > Urgent > High > Medium
    const getScore = (t) => {
      if (t.status === 'Delay') return 1000; // HIGHEST PRIORITY
      if (t.priority === 'Urgent') return 500;
      if (t.priority === 'High') return 300;
      if (t.priority === 'Medium') return 100;
      return 0;
    };
    
    tasksToSchedule.sort((a, b) => getScore(b) - getScore(a));

    // C. FIND SLOTS (Next 5 Days)
    let currentDate = new Date();
    // Round up to next 30 min slot
    currentDate.setMinutes(Math.ceil(currentDate.getMinutes() / 30) * 30, 0, 0);

    const scheduleLimit = new Date();
    scheduleLimit.setDate(scheduleLimit.getDate() + 5); // Plan 5 days ahead

    // Helper: Check if a time range overlaps with anything fixed
    const isBusy = (start, end) => {
      const startMs = start.getTime();
      const endMs = end.getTime();

      // 1. Check Weekly Tasks
      const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = start.toISOString().split('T')[0]; // YYYY-MM-DD
      
      for (let wt of weeklyTasks) {
        if (wt.day === dayName) {
           // Check if this instance is cancelled/rescheduled
           const isExcepted = exceptions.find(ex => 
             ex.weeklyTaskId.toString() === wt._id.toString() && ex.originalDate === dateStr
           );
           if (isExcepted) continue; // It's cancelled, so slot is free

           // Calculate Weekly Task Time for this specific date
           const [h, m] = wt.time.split(':');
           const wtStart = new Date(start);
           wtStart.setHours(h, m, 0, 0);
           const wtEnd = new Date(wtStart.getTime() + wt.duration * 60000);

           // Overlap Check
           if (startMs < wtEnd.getTime() && endMs > wtStart.getTime()) return true;
        }
      }

      // 2. Check Already Scheduled Normal Tasks
      for (let st of alreadyScheduled) {
        if (startMs < new Date(st.endTime).getTime() && endMs > new Date(st.startTime).getTime()) return true;
      }

      return false;
    };

    // D. ASSIGN SLOTS
    for (let task of tasksToSchedule) {
       let allocated = false;
       // Clone current scanner so each task searches from "Now" onwards
       let scanner = new Date(currentDate); 

       // Scan for next 5 days
       while (scanner < scheduleLimit) {
         // Respect "Sleeping Hours" (e.g., skip 11 PM to 7 AM)
         const hour = scanner.getHours();
         if (hour < 7 || hour >= 23) {
            scanner.setHours(7, 0, 0, 0); // Jump to next morning
            if (scanner < new Date()) scanner.setDate(scanner.getDate() + 1); // Ensure it's forward
            continue;
         }

         const potentialEnd = new Date(scanner.getTime() + task.duration * 60000);
         
         if (!isBusy(scanner, potentialEnd)) {
             // FOUND A SLOT!
             task.startTime = new Date(scanner);
             task.endTime = potentialEnd;
             task.status = 'Scheduled'; // Update status
             await task.save();
             
             // Add to 'alreadyScheduled' so next task doesn't take this spot
             alreadyScheduled.push(task); 
             allocated = true;
             break; // Stop looking for this task
         }

         // Move scanner by 30 mins
         scanner.setMinutes(scanner.getMinutes() + 30);
       }
       
       if (!allocated) {
         console.log(`Could not schedule: ${task.title}`);
       }
    }

    res.json({ message: 'Schedule Updated' });

  } catch (error) {
    console.error("Auto Schedule Error:", error);
    res.status(500).json({ message: error.message });
  }
};