import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // The users involved in this chat
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Storing the ID of the last message makes rendering the "Inbox" list lightning fast
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }
}, { timestamps: true }); // timestamps give us 'updatedAt', perfect for sorting recent chats!

export default mongoose.model('Conversation', conversationSchema);