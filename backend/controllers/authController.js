import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js'; // Import our new utility!
import crypto from 'crypto';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. UPDATED: Register User (Now sends a 6-digit code)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationCode, // Save code to database
    });

    if (user) {
      // Send the email
      const message = `Hari Om ${name},\n\nYour verification code is: ${verificationCode}\n\nPlease enter this code on the website to verify your account.`;
      
      try {
        await sendEmail({ email: user.email, subject: 'Ashram Account Verification', message });
        res.status(201).json({ success: true, message: 'Verification email sent' });
      } catch (err) {
        // If email fails, we shouldn't keep the unverified user stuck in the DB
        await User.findByIdAndDelete(user._id);
        res.status(500).json({ message: 'Email could not be sent. Please try again.' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. NEW: Verify Email Route
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });
    if (user.verificationCode !== code) return res.status(400).json({ message: 'Invalid verification code' });

    // Success! Mark as verified and clear the code
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Now give them their login token!
    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. EXISTING: Login (Update to block unverified users)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Prevent login if they haven't verified their email
      if (!user.isVerified) {
        return res.status(403).json({ message: 'Please verify your email first', emailUnverified: true });
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. NEW: Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'There is no user with that email' });

    // Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash it and save to database (security best practice)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
    await user.save();

    // Send email
    // NOTE: In production, change localhost:5173 to your real domain!
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}`;

    try {
      await sendEmail({ email: user.email, subject: 'Password Reset Token', message });
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. NEW: Reset Password
export const resetPassword = async (req, res) => {
  try {
    // Hash the token from the URL to compare with the one in the DB
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure token hasn't expired
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    // Clear the reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};