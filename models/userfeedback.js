const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true },
    feedback: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema);

module.exports = UserFeedback;
