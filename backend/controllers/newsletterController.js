import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { logAdminAction } from '../utils/logger.js';

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

    // 2. IMMEDIATELY tell the React frontend that the job has started!
    // This prevents the browser from spinning and timing out.
    res.status(200).json({ 
      success: true, 
      message: `Broadcast started in the background for ${users.length} users. You can safely close this page.` 
    });

    // 3. START THE BACKGROUND PROCESS
    // (This anonymous function runs independently of the HTTP response)
    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          // Personalize the greeting
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

        // Add a 1-second pause between emails so Gmail doesn't block you as spam
        await new Promise(resolve => setTimeout(resolve, 1000)); 
      }

      // Log the exact results to MongoDB Audit Trail AFTER it is fully done
      await logAdminAction(
        req.user._id, 
        req.user.name, 
        'SENT_NEWSLETTER', 
        `Background broadcast complete. Subject: "${subject}". Success: ${successCount}, Failed: ${failCount}.`
      );
      
      console.log(`Background broadcast complete! Success: ${successCount}, Failed: ${failCount}`);
    })();

  } catch (error) {
    // Only send a 500 error if the headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error during broadcast setup', error: error.message });
    } else {
      console.error("Critical error in background newsletter task:", error);
    }
  }
};