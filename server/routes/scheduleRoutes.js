const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const WeeklyTask = require('../models/WeeklyTask');
const WeeklyException = require('../models/WeeklyException');
const { protect } = require('../middleware/authMiddleware');

const getLocalDateString = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

// GET: Merged Schedule
router.get('/', protect, async (req, res) => {
  try {
    const { start, end } = req.query; 
    const startDate = new Date(start);
    const endDate = new Date(end);

    const weeklyDefaults = await WeeklyTask.find({ user: req.user._id });
    const exceptions = await WeeklyException.find({ 
      user: req.user._id,
      originalDate: { $gte: start, $lte: end }
    });
    const dbTasks = await Task.find({ 
      user: req.user._id,
      startTime: { $gte: startDate, $lte: endDate },
      status: { $ne: 'Cancelled' } 
    });

    let finalSchedule = [];

    // Process Weekly Tasks
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDateString(d); 
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayDefaults = weeklyDefaults.filter(w => w.day === dayName);

      dayDefaults.forEach(def => {
        const exception = exceptions.find(ex => 
          ex.weeklyTaskId.toString() === def._id.toString() && 
          ex.originalDate === dateStr
        );

        const [hours, minutes] = def.time.split(':');
        const startT = new Date(d);
        startT.setHours(hours, minutes, 0, 0);
        const endT = new Date(startT.getTime() + def.duration * 60000);

        finalSchedule.push({
            _id: `weekly-${def._id}-${dateStr}`,
            originalId: def._id,
            title: def.title,
            start: startT,
            end: endT,
            type: 'weekly',
            taskType: def.taskType,
            isFixed: true, 
            isCancelled: !!exception, 
            exceptionType: exception ? exception.type : null,
            dateString: dateStr,
            priority: exception ? 'Low' : 'High'
        });
      });
    }

    // Process Normal Tasks
    const mappedDbTasks = dbTasks.map(t => ({
        _id: t._id,
        title: t.title,
        start: new Date(t.startTime),
        end: new Date(t.endTime || t.startTime),
        type: 'normal',
        taskType: t.taskType,
        isFixed: false,
        isCancelled: false,
        priority: t.priority
    }));

    finalSchedule = [...finalSchedule, ...mappedDbTasks];
    res.json(finalSchedule);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create Exception (Cancel/Reschedule)
// UPDATED: Now returns 'newTask' if one was created
router.post('/exception', protect, async (req, res) => {
    const { weeklyTaskId, date, action, newDate, newTime } = req.body;

    try {
        await WeeklyException.create({
            user: req.user._id,
            weeklyTaskId,
            originalDate: date,
            type: action
        });

        let createdTask = null;
        if (action === 'rescheduled' && newDate && newTime) {
            const original = await WeeklyTask.findById(weeklyTaskId);
            const [hours, minutes] = newTime.split(':');
            const startDateTime = new Date(newDate);
            startDateTime.setHours(hours, minutes, 0, 0);
            const endDateTime = new Date(startDateTime.getTime() + original.duration * 60000);

            createdTask = await Task.create({
                user: req.user._id,
                title: `${original.title}`,
                startTime: startDateTime,
                endTime: endDateTime,
                duration: original.duration,
                taskType: original.taskType,
                status: 'Scheduled',
                priority: 'High'
            });
        }
        res.json({ message: 'Success', newTask: createdTask });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// NEW ROUTE: DELETE Exception (For UNDO logic)
router.delete('/exception', protect, async (req, res) => {
    const { weeklyTaskId, date, deleteNewTaskId } = req.body;
    try {
        // 1. Remove the exception
        await WeeklyException.findOneAndDelete({
            user: req.user._id,
            weeklyTaskId,
            originalDate: date
        });

        // 2. If undoing a reschedule, delete the task that was created
        if (deleteNewTaskId) {
            await Task.findByIdAndDelete(deleteNewTaskId);
        }

        res.json({ message: 'Undone' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: Move Normal Task
router.put('/move-task/:id', protect, async (req, res) => {
    const { newStart, newEnd } = req.body;
    try {
        await Task.findByIdAndUpdate(req.params.id, {
            startTime: newStart,
            endTime: newEnd
        });
        res.json({ message: 'Moved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;