const userFeedbackSchema = new mongoose.Schema({
    feedbackId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // other fields...
  });
  
  const UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema);
  