const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer.
 * Fallbacks to console logging if SMTP settings are not configured.
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text message
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  const isSmtpConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_PORT && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  if (!isSmtpConfigured) {
    console.log('\n==================================================');
    console.log('📬 [EMAIL SIMULATION / FALLBACK MODE]');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--------------------------------------------------');
    console.log(options.message);
    console.log('==================================================\n');
    return { simulated: true };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 8000, // 8 seconds timeout
    greetingTimeout: 8000,
    socketTimeout: 8000,
    // Force IPv4 DNS resolution for Render compatibility
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });

  // Define email options
  const mailOptions = {
    from: `"NexTask Project Hub" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
