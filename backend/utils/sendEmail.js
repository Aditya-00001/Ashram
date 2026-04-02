import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Create a transporter (the "mail truck")
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"Achyuta Ashram" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text version
    html: options.html,    // HTML version (optional but looks nicer!)
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;