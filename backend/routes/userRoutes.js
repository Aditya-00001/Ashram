import express from 'express';
import { updateUserProfile, updateUserPassword, getUsers, updateUserRole } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);

export default router;