const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed'], 
        default: 'pending' 
    },

    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    sharedWith: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],

    recurrence: { 
        type: String, 
        enum: ['none', 'daily', 'weekly', 'monthly'], 
        default: 'none' 
    },
    dueDate: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Task', taskSchema);