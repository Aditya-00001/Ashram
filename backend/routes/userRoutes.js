import express from 'express';
import { updateUserProfile, updateUserPassword, getUsers, updateUserRole, getUserDirectory, updatePublicKey } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/', protect, authorizeRoles('admin', 'superadmin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin', 'superadmin'), updateUserRole);
// --- NEW: Open directory for the Chat UI ---
router.get('/directory', protect, getUserDirectory);
// --- NEW: Route to save user's E2EE Public Key ---
router.put('/public-key', protect, updatePublicKey);
export default router;