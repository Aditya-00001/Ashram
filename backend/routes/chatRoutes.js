import express from 'express';
import { sendMessage, getConversations, getMessages, createGroupChat, addGroupMembers, removeGroupMember } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../utils/cloudinary.js'; // --- NEW IMPORT ---

const router = express.Router();

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.post('/group', protect, createGroupChat);
router.put('/group/add', protect, addGroupMembers);
router.put('/group/remove', protect, removeGroupMember);

// --- NEW ROUTE: HANDLE FILE UPLOADS ---
// 'upload.single('file')' tells Multer to intercept the file named 'file' in the form data
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file type blocked.' });
    }

    // Determine what category the file falls into for our frontend UI
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) fileType = 'image';
    if (req.file.mimetype.startsWith('video/')) fileType = 'video';

    // Send the safe Cloudinary URL and metadata back to the frontend
    res.status(200).json({
      url: req.file.path,
      fileType: fileType,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

export default router;