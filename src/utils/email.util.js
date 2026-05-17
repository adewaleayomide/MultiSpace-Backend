import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body (optional)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Test mode domain
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send a notification email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email body
 */
export const sendNotificationEmail = async (to, subject, text) => {
  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};