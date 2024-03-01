const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        required: true,
        // enum: ['HIGH', 'MODERATE', 'LOW'], // Restrict priority values to specific options
    },
    checklist: {
        type: [String],
        required: true,
    },
    cb: {
        type: [String], // Renamed from 'vp' to 'responsiblePersons' for clarity
    },
    dueDate: {
        type: Date,
    },
    createdDate: {
        type: Date,
        default: Date.now, // Renamed from 'currentDate' to 'createdDate' for clarity
    },
    completed: {
        type: String, // Changed type to Boolean for clarity
        default: 'true', // Changed default value to false
    },
    status: {
        type: String,
        enum: ['To do', 'Done', 'Backlog', 'In progress'],
        default: 'To do', // Change the default value to 'in progress'
    },
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
