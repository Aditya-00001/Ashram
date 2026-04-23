import express from 'express';
import { sendNewsletter } from '../controllers/newsletterController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected Admin route
router.post('/send', protect, authorizeRoles('admin', 'superadmin'), sendNewsletter);

export default router;