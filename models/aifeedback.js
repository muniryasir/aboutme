const mongoose = require('mongoose');

const aifeedbackSchema = new mongoose.Schema({
    uniqueId: String,
    feedback: String,
  });

const AIFeedback = mongoose.model('AIFeedback', aifeedbackSchema);

module.exports = AIFeedback;