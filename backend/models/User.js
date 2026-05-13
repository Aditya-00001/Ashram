import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    // --- UPDATED: Add 'superadmin' to the list ---
    enum: ['member', 'trustee', 'admin', 'superadmin'], 
    default: 'member',
  },
  
  // --- NEW FIELDS FOR AUTHENTICATION ---
  isVerified: { type: Boolean, default: false }, // Tracks if email is verified
  verificationCode: { type: String }, // Stores the 6-digit code during signup
  
  resetPasswordToken: { type: String }, // Stores the token for forgot password
  resetPasswordExpire: { type: Date }, // Expiration time for the reset token
  // --- NEW: E2EE PUBLIC KEY ---
  publicKey: { type: Object, default: null },

  // --- NEW: PWA PUSH SUBSCRIPTION ---
  // We store this as an Object because it contains the endpoint, expirationTime, and keys (p256dh, auth)
  pushSubscription: { type: Object, default: null }

}, { 
  timestamps: true 
});

export default mongoose.model('User', userSchema);