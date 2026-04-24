import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['General', 'Donations', 'Pujas & Events', 'Technical'],
    default: 'General'
  },
  // Allows admins to draft FAQs or hide them temporarily
  isActive: {
    type: Boolean,
    default: true 
  }
}, { timestamps: true });

export default mongoose.model('Faq', faqSchema);