import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['member', 'admin'], 
    default: 'member' 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt dates
});

export default mongoose.model('User', userSchema);