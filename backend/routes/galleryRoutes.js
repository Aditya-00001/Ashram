import express from 'express';
import { getImages, uploadImage, deleteImage } from '../controllers/galleryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // The Cloudinary engine you built earlier

const router = express.Router();

// Public route to view images
router.get('/', getImages);

// Protected Admin routes to upload and delete
router.post('/', protect, admin, upload.single('image'), uploadImage);
router.delete('/:id', protect, admin, deleteImage);

export default router;