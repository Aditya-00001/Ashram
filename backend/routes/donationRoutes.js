import express from 'express';
import { 
  getMyDonations, 
  getDonations, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../controllers/donationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payment Gateways
router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify-payment').post(protect, verifyRazorpayPayment);

// Data Retrieval
router.route('/my-donations').get(protect, getMyDonations);
router.route('/').get(protect, admin, getDonations);

export default router;