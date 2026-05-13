import express from 'express';
import { updateUserProfile, updateUserPassword, getUsers, updateUserRole, getUserDirectory, updatePublicKey } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/', protect, authorizeRoles('admin', 'superadmin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin', 'superadmin'), updateUserRole);
// --- NEW: Open directory for the Chat UI ---
router.get('/directory', protect, getUserDirectory);
// --- NEW: Route to save user's E2EE Public Key ---
router.put('/public-key', protect, updatePublicKey);

// Route to save push subscription to user profile
router.post('/subscribe', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.pushSubscription = req.body; // req.body contains the subscription object from the browser
    await user.save();
    res.status(200).json({ message: 'Push subscription saved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save subscription'+error.message });
  }
});

export default router;