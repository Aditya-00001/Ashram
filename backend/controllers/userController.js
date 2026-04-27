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

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin or Superadmin
export const updateUserRole = async (req, res) => {
  try {
    const { role: newRole } = req.body;
    const currentUserRole = req.user.role; // The person making the request
    
    if (!['member', 'trustee', 'admin', 'superadmin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    const targetUser = await User.findById(req.params.id);

    if (targetUser) {
      // RULE 1: Total Super Admin Protection
      if (targetUser.role === 'superadmin' && currentUserRole !== 'superadmin') {
        return res.status(403).json({ message: 'Access Denied: You cannot modify a Super Admin account.' });
      }

      // RULE 2: Standard Admins cannot mint new Admins
      if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(newRole)) {
        return res.status(403).json({ message: 'Access Denied: Only Super Admins can assign Admin privileges.' });
      }

      // RULE 3: Anti-Lockout (A Super Admin cannot demote themselves)
      if (targetUser._id.toString() === req.user._id.toString() && currentUserRole === 'superadmin' && newRole !== 'superadmin') {
         return res.status(400).json({ message: 'Action Prevented: You cannot demote your own Super Admin account.' });
      }

      targetUser.role = newRole;
      const updatedUser = await targetUser.save();
      
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

// @desc    Get public user directory for Chat
// @route   GET /api/users/directory
// @access  Private (All logged-in members)
export const getUserDirectory = async (req, res) => {
  try {
    // Return all users EXCEPT the currently logged-in user
    // Only send back the _id, name, and role. NEVER send passwords or email here.
    const users = await User.find({ _id: { $ne: req.user._id }, isVerified: true })
                            .select('_id name role');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching directory' });
  }
};