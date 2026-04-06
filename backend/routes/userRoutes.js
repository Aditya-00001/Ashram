import express from 'express';
import { updateUserProfile, updateUserPassword } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);

export default router;