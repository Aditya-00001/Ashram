import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Puja from '../models/Puja.js';

// @desc    Get high-level statistics & Recharts data for Admin/Trustee Dashboard
// @route   GET /api/analytics
// @access  Private (Admin & Trustee)
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Core Summary Widgets
    const totalDonationsAgg = await Donation.aggregate([
      { $match: { status: 'Successful' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonations = totalDonationsAgg.length > 0 ? totalDonationsAgg[0].total : 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyDonationsAgg = await Donation.aggregate([
      { $match: { status: 'Successful', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyCollection = monthlyDonationsAgg.length > 0 ? monthlyDonationsAgg[0].total : 0;

    const pendingPaymentsAgg = await Donation.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const pendingAmount = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].totalAmount : 0;
    const pendingCount = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].count : 0;

    const totalMembers = await User.countDocuments({ isVerified: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingPujas = await Puja.countDocuments({ date: { $gte: today }, status: 'Scheduled' });

    // 2. RECHARTS: Distribution Data (Pie Chart)
    const statusCounts = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Map backend statuses to the UI distribution format
    let successfulCount = 0, pendingDistCount = 0, failedCount = 0;
    statusCounts.forEach(stat => {
      if (stat._id === 'Successful' || stat._id === 'successful') successfulCount += stat.count;
      else if (stat._id === 'Pending' || stat._id === 'pending') pendingDistCount += stat.count;
      else failedCount += stat.count;
    });

    const distributionData = [
      { name: 'Successful', value: successfulCount },
      { name: 'Pending', value: pendingDistCount },
      { name: 'Failed', value: failedCount }
    ];

    // 3. RECHARTS: Trend Data (Line Chart - Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Donation.aggregate([
      { $match: { status: 'Successful', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = monthlyTrends.map(item => ({
      month: monthNames[item._id.month - 1],
      Donations: item.totalAmount
    }));

    // Send it all back
    res.status(200).json({
      totalDonations,
      monthlyCollection,
      pendingAmount,
      pendingCount,
      totalMembers,
      upcomingPujas,
      distributionData, // Used by PieChart
      trendData         // Used by LineChart
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
  }
};