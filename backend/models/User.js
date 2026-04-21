import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'trustee', 'admin'], default: 'member' },
  
  // --- NEW FIELDS FOR AUTHENTICATION ---
  isVerified: { type: Boolean, default: false }, // Tracks if email is verified
  verificationCode: { type: String }, // Stores the 6-digit code during signup
  
  resetPasswordToken: { type: String }, // Stores the token for forgot password
  resetPasswordExpire: { type: Date } // Expiration time for the reset token
}, { 
  timestamps: true 
});

export default mongoose.model('User', userSchema);