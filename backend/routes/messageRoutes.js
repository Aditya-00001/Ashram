import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to send a message, Admin route to view them all
router.route('/')
  .post(sendMessage)
  .get(protect, authorizeRoles('admin', 'superadmin'), getMessages);

// Admin route to update the status to 'read'
router.route('/:id/read')
  .put(protect, authorizeRoles('admin', 'superadmin'), markAsRead);

export default router;