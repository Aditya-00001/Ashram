import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to send a message, Admin route to view them all
router.route('/')
  .post(sendMessage)
  .get(protect, admin, getMessages);

// Admin route to update the status to 'read'
router.route('/:id/read')
  .put(protect, admin, markAsRead);

export default router;