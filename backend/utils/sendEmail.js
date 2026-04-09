import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,           // Using the secure port
    secure: true,        // MUST be true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,           // Force IPv4
    tls: {
      rejectUnauthorized: false // Bypasses overly strict local certificate checks
    }
  });

  const mailOptions = {
    from: `"Achyuta Ashram" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;