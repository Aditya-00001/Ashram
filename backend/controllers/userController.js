import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Update user profile (Name)
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: req.headers.authorization.split(' ')[1] // Keep their current token active
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
export const updateUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { currentPassword, newPassword } = req.body;

      // 1. Verify the current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      // 2. Hash and save the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      
      await user.save();
      res.status(200).json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users with pagination (for Admin dashboard)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // --- NEW: Search Query Logic ---
    const search = req.query.search || '';
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } }, // 'i' makes it case-insensitive
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await User.countDocuments(query); // Count only matching users
    const users = await User.find(query)            // Find only matching users
      .select('-password')
      .skip(skip)
      .limit(limit);

    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Update user role (Promote to Trustee/Admin or Demote to Member)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Ensure the role being assigned is valid
    if (!['member', 'trustee', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      // Prevent an admin from accidentally demoting themselves and locking themselves out!
      if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
         return res.status(400).json({ message: 'You cannot demote your own admin account.' });
      }

      user.role = role;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating role' });
  }
};