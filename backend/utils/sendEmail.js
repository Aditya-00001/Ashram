// We don't even need nodemailer anymore! We are using standard HTTPS.
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('Missing Brevo API Key');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { 
        name: 'Achyuta Ananta Ashram', 
        email: process.env.EMAIL_USER // Your verified Ashram Gmail
      },
      to: [{ email: options.email }],
      subject: options.subject,
      // If you pass html, use it. Otherwise, wrap the text message in paragraph tags.
      htmlContent: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>` 
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Brevo API Error:', errorData);
    throw new Error('Failed to send email via Brevo API');
  }
};

export default sendEmail;