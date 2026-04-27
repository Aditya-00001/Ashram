import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // The users involved in this chat (can be 2 for direct, or many for groups)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Storing the ID of the last message makes rendering the "Inbox" list lightning fast
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  
  // --- NEW GROUP CHAT FIELDS ---
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    // Only required if it's actually a group!
    required: function() { return this.isGroup; } 
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true }); 

export default mongoose.model('Conversation', conversationSchema);