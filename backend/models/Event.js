import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // e.g., "April 2, 2026"
  time: { type: String, required: true }, // e.g., "6:00 PM - 8:30 PM"
  type: { 
    type: String, 
    required: true,
    enum: ['Special Event', 'Lunar Day', 'Karma Yoga', 'Other']
  },
  description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);