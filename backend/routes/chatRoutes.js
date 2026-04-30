import express from 'express';
import { sendMessage, getConversations, getMessages, createGroupChat, addGroupMembers } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendMessage);
router.post('/group', protect, createGroupChat);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
// --- NEW ROUTE ---
router.put('/group/add', protect, addGroupMembers);

export default router;