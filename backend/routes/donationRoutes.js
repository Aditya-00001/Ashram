import express from 'express';
import { getMyDonations } from '../controllers/donationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route specifically for the user's personal dashboard
router.route('/my-donations').get(protect, getMyDonations);

export default router;