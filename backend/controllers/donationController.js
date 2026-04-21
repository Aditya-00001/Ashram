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

// getALLDonations (for admin) here too!

// @desc    Get all donations with Pagination (Admin)
// @route   GET /api/donations?page=1&limit=10
// @access  Private/Admin
export const getDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const query = search ? {
      $or: [
        { donorName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await Donation.countDocuments(query);
    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ donations, currentPage: page, totalPages: Math.ceil(total / limit), totalDonations: total });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};


// @desc    Handle Razorpay Webhooks (Asynchronous updates)
// @route   POST /api/donations/webhook
// @access  Public (But secured via crypto signature)
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // 1. Generate the expected signature using our secret and the raw request body
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const expectedSignature = shasum.digest('hex');

    // 2. Compare it to the signature Razorpay sent in the headers
    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (expectedSignature === razorpaySignature) {
      // ✅ Signature is Valid! We can trust this data.
      
      const event = req.body.event;
      const paymentEntity = req.body.payload.payment.entity;
      
      // Razorpay attaches the order_id to the payment entity
      const razorpayOrderId = paymentEntity.order_id; 

      // 3. Update the Database based on the event type
      if (event === 'payment.captured') {
        // Payment was successful! Find the matching donation and update it.
        await Donation.findOneAndUpdate(
          { razorpayOrderId: razorpayOrderId }, 
          { status: 'Successful', paymentId: paymentEntity.id }
        );
        console.log(`Webhook: Payment captured for Order ${razorpayOrderId}`);
        
      } else if (event === 'payment.failed') {
        // Payment failed
        await Donation.findOneAndUpdate(
          { razorpayOrderId: razorpayOrderId }, 
          { status: 'Failed' }
        );
        console.log(`Webhook: Payment failed for Order ${razorpayOrderId}`);
      }

      // 4. Always return a 200 OK so Razorpay knows we received it
      return res.status(200).json({ status: 'ok' });

    } else {
      // ❌ Signature is Invalid! Someone is trying to hack the endpoint.
      console.warn("Webhook signature mismatch!");
      return res.status(400).json({ status: 'invalid signature' });
    }

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    return res.status(500).json({ message: 'Server error during webhook' });
  }
};