import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Puja from '../models/Puja.js';

// @desc    Get high-level statistics for Admin/Trustee Dashboard
// @route   GET /api/analytics
// @access  Private (Admin & Trustee)
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Donations (Sum of all 'Successful' donations)
    const totalDonationsAgg = await Donation.aggregate([
      { $match: { status: 'Successful' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonations = totalDonationsAgg.length > 0 ? totalDonationsAgg[0].total : 0;

    // 2. Monthly Collection (Sum of 'Successful' donations this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyDonationsAgg = await Donation.aggregate([
      { $match: { status: 'Successful', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyCollection = monthlyDonationsAgg.length > 0 ? monthlyDonationsAgg[0].total : 0;

    // 3. Pending Payments (Count & Sum)
    const pendingPaymentsAgg = await Donation.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const pendingAmount = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].totalAmount : 0;
    const pendingCount = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].count : 0;

    // 4. Total Verified Members
    const totalMembers = await User.countDocuments({ isVerified: true });

    // 5. Upcoming Scheduled Pujas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingPujas = await Puja.countDocuments({ date: { $gte: today }, status: 'Scheduled' });

    // Send it all back in one neat package
    res.status(200).json({
      totalDonations,
      monthlyCollection,
      pendingAmount,
      pendingCount,
      totalMembers,
      upcomingPujas
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
  }
};