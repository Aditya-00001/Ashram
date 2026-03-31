import Donation from '../models/Donation.js';

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