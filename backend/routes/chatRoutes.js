import express from 'express';
import { sendMessage, getConversations, getMessages, createGroupChat } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendMessage);
router.post('/group', protect, createGroupChat);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);

export default router;