import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    // Text is no longer strictly required if they are just sending a file!
    required: function() { return !this.attachment; } 
  },
  // --- NEW: ATTACHMENT FIELDS ---
  attachment: {
    url: { type: String },
    fileType: { type: String, enum: ['image', 'video', 'document'] },
    fileName: { type: String }
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);