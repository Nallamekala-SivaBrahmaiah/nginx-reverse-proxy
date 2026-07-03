import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const sendEmail = async (options) => {
  const isSMTPConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_HOST.includes('placeholder') &&
    !process.env.SMTP_USER.includes('placeholder');

  if (!isSMTPConfigured) {
    logger.info(`[Email Simulated Log]
To: ${options.email}
Subject: ${options.subject}
Message: ${options.message}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Flipkart Clone'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@flipkartclone.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
