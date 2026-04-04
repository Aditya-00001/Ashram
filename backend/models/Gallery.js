import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  cloudinaryId: { type: String, required: true }, // Required to delete the image from Cloudinary later
  type: { type: String, enum: ['Event', 'Archive'], required: true },
  
  // If it's an Event photo, this links it directly to the specific Event
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: false 
  },
  
  caption: { type: String, default: '' }
}, { 
  timestamps: true 
});

export default mongoose.model('Gallery', gallerySchema);