import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  coverUrl: { type: String, required: true },
  price: { type: String, default: 'Free / Donation' }
}, { timestamps: true });

export default mongoose.model('Book', bookSchema);