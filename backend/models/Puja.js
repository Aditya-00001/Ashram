import mongoose from 'mongoose';

const pujaSchema = new mongoose.Schema({
  pujaName: { 
    type: String, 
    required: true 
  },
  sponsorName: { 
    type: String, 
    required: true 
  },
  // We link the User ID so they can see their booked pujas on their profile later
  sponsorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  }
}, { timestamps: true });

export default mongoose.model('Puja', pujaSchema);