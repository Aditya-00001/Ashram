import Gallery from '../models/Gallery.js';
import { v2 as cloudinary } from 'cloudinary'; // We need this to delete images

// @desc    Upload a new image to the gallery
// @route   POST /api/gallery
// @access  Private/Admin
// @desc    Upload MULTIPLE images to the gallery
export const uploadImages = async (req, res) => {
  try {
    // Check for multiple files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const { type, eventId, caption } = req.body;
    const uploadedImages = [];

    // Loop through every file Multer processed
    for (const file of req.files) {
      const newImage = await Gallery.create({
        imageUrl: file.path,
        cloudinaryId: file.filename,
        type: type,
        eventId: type === 'Event' ? eventId : undefined,
        caption: caption || ''
      });
      uploadedImages.push(newImage);
    }

    res.status(201).json(uploadedImages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
};

// @desc    Get gallery images (with Pagination & Filtering)
// @route   GET /api/gallery?page=1&limit=20&type=Archive
// @access  Public
export const getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build a filter based on URL queries
    let filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.eventId) filter.eventId = req.query.eventId;

    const total = await Gallery.countDocuments(filter);
    
    // .populate() automatically fetches the Event title so the frontend can display it!
    const images = await Gallery.find(filter)
      .populate('eventId', 'title date') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      images,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalImages: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch images', error: error.message });
  }
};

// @desc    Delete an image
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
export const deleteImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // 1. Delete the physical file from Cloudinary's servers
    await cloudinary.uploader.destroy(image.cloudinaryId);

    // 2. Delete the record from our MongoDB database
    await Gallery.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};