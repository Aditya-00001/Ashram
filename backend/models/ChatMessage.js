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
  // --- NEW: INITIALIZATION VECTOR FOR E2EE ---
  iv: {
    type: [Number], // Stores the 12-byte IV array needed for decryption
    default: []
  },
  // --- NEW: ATTACHMENT FIELDS ---
  attachment: {
    url: { type: String },
    fileType: { type: String, enum: ['image', 'video', 'document'] },
    fileName: { type: String }
  },
  // --- NEW: POLL FIELDS ---
  messageType: { 
    type: String, 
    enum: ['text', 'poll'], 
    default: 'text' 
  },
  pollData: {
    question: { type: String },
    options: [{
      optionText: { type: String },
      // Store an array of User IDs who voted for this specific option
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
    }]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  envelopes: {
  type: Map,
  of: new mongoose.Schema({
    encryptedKey: [Number],
    iv: [Number]
  }, { _id: false }),
  default: null
},
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);