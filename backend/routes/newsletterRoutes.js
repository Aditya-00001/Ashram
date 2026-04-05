import express from 'express';
import { sendNewsletter } from '../controllers/newsletterController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected Admin route
router.post('/send', protect, admin, sendNewsletter);

export default router;