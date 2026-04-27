import express from 'express';
import { updateUserProfile, updateUserPassword, getUsers, updateUserRole, getUserDirectory } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/', protect, authorizeRoles('admin', 'superadmin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin', 'superadmin'), updateUserRole);
// --- NEW: Open directory for the Chat UI ---
router.get('/directory', protect, getUserDirectory);

export default router;