import express from 'express';
import { getMyDonations, getDonations } from '../controllers/donationController.js'; // <-- Added getDonations
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route specifically for the user's personal dashboard
router.route('/my-donations').get(protect, getMyDonations);
// ADDED: The Admin route to get all donations
router.route('/').get(protect, admin, getDonations);

export default router;