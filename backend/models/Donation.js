import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  // ADD THIS LINE: This creates the interlink between models!
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  
  donorName: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  purpose: { type: String, default: 'General Seva' },
  
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Successful', 'Failed'], 
    default: 'Pending' 
  }
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);