import express from 'express';
import { getImages, uploadImages, deleteImage } from '../controllers/galleryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // The Cloudinary engine you built earlier

const router = express.Router();

// Public route to view images
router.get('/', getImages);

// Protected Admin routes to upload and delete
router.post('/', protect, authorizeRoles('admin', 'superadmin'), upload.array('images', 50), uploadImages);
router.delete('/:id', protect, authorizeRoles('admin', 'superadmin'), deleteImage);

export default router;