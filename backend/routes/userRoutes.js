import express from 'express';
import { updateUserProfile, updateUserPassword, getUsers, updateUserRole } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/', protect, authorizeRoles('admin', 'superadmin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin', 'superadmin'), updateUserRole);

export default router;