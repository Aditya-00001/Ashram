import express from 'express';
import { 
  getMyDonations, 
  getDonations, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  razorpayWebhook 
} from '../controllers/donationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payment Gateways
router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify-payment').post(protect, verifyRazorpayPayment);

// Data Retrieval
router.route('/my-donations').get(protect, getMyDonations);
router.route('/').get(protect, authorizeRoles('admin', 'superadmin'), getDonations);

// 2. Add the completely public Webhook Route
router.post('/webhook', razorpayWebhook);

export default router;