const Task = require('../models/Task');

const createTask = async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            owner: req.user._id,
            sharedWith: req.body.sharedWith || [],
            recurrence: req.body.recurrence || 'none', // קליטת סוג החזרה
            dueDate: req.body.dueDate || Date.now()
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            $or: [{ owner: req.user._id }, { sharedWith: req.user._id }]
        }).populate('owner', 'username'); 
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            $or: [{ owner: req.user._id }, { sharedWith: req.user._id }] 
        });
        
        if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });

        const oldStatus = task.status;
        
        // עדכון השדות שהתקבלו
        task.status = req.body.status || task.status;
        task.title = req.body.title || task.title;
        task.recurrence = req.body.recurrence || task.recurrence;

        if (oldStatus !== 'completed' && task.status === 'completed' && task.recurrence !== 'none') {
            const nextDate = new Date();
            
            if (task.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            if (task.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (task.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

            // יצירת העותק החדש
            const nextTask = new Task({
                title: task.title,
                owner: task.owner,
                sharedWith: task.sharedWith,
                recurrence: task.recurrence,
                dueDate: nextDate
            });
            await nextTask.save();
        }

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
// מחיקת משימה (רק הבעלים המקורי יכול למחוק)
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ error: 'Task not found or permission denied' });
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {createTask, getTasks, updateTask, deleteTask};