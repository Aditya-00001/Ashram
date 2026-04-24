import express from 'express';
import { getPublicFaqs, getAllFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faqController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for the website
router.get('/public', getPublicFaqs);

// Admin routes
router.get('/', protect, authorizeRoles('admin', 'superadmin', 'trustee'), getAllFaqs);
router.post('/', protect, authorizeRoles('admin', 'superadmin'), createFaq);
router.put('/:id', protect, authorizeRoles('admin', 'superadmin'), updateFaq);
router.delete('/:id', protect, authorizeRoles('admin', 'superadmin'), deleteFaq);

export default router;