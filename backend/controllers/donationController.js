import Donation from '../models/Donation.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// 1. Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay Order and initialize a Pending Donation
// @route   POST /api/donations/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, purpose } = req.body;

    // Razorpay strictly expects the amount in the smallest currency subunit (paise)
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    // 1. Tell Razorpay to create an order
    const order = await razorpayInstance.orders.create(options);

    // 2. Create a "Pending" donation record in your database instantly
    const newDonation = new Donation({
      user: req.user._id,
      donorName: req.user.name,
      email: req.user.email,
      amount: amount,
      purpose: purpose || 'General Seva',
      razorpayOrderId: order.id,
      status: 'Pending'
    });

    const savedDonation = await newDonation.save();

    // 3. Send the order details to React
    res.status(200).json({
      success: true,
      order,
      donationId: savedDonation._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
  }
};

// @desc    Verify the Razorpay Signature and mark Donation as Successful
// @route   POST /api/donations/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;

    // 1. Create the HMAC hex digest using your secret key
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // 2. Compare the signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 3. Update the database!
      await Donation.findByIdAndUpdate(donationId, {
        razorpayPaymentId: razorpay_payment_id,
        status: 'Successful'
      }, { returnDocument: 'after' });

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      // If it fails, mark it as failed to track fraud attempts
      await Donation.findByIdAndUpdate(donationId, { status: 'Failed' });
      res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
};

// ... (keep your existing getMyDonations and getDonations functions here) ...


// @desc    Get logged in user's donations
// @route   GET /api/donations/my-donations
// @access  Private (Regular Users)
export const getMyDonations = async (req, res) => {
  try {
    // req.user._id comes from our protect middleware!
    const donations = await Donation.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};

// You will eventually add createDonation and getALLDonations (for admin) here too!

// @desc    Get all donations (Admin)
// @route   GET /api/donations
// @access  Private/Admin
export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};