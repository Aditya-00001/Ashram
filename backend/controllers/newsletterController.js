import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Send bulk email to all verified users
// @route   POST /api/newsletter/send
// @access  Private/Admin
export const sendNewsletter = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Please provide both a subject and a message.' });
    }

    // 1. Fetch ALL users who have verified their emails
    const users = await User.find({ isVerified: true }).select('name email');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No verified users found to send emails to.' });
    }

    // 2. Loop through and send emails
    // (We use a standard 'for...of' loop so we don't overwhelm Gmail's servers by sending 100 at the exact same millisecond)
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // Personalize the greeting for every single person!
        const personalizedMessage = `Hari Om ${user.name},\n\n${message}\n\n🙏 The Achyuta Ashram Team`;
        
        await sendEmail({
          email: user.email,
          subject: subject,
          message: personalizedMessage
        });
        
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${user.email}`, err);
        failCount++;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Newsletter sent! Success: ${successCount}. Failed: ${failCount}.` 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during broadcast', error: error.message });
  }
};