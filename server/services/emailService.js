import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Load template
const loadTemplate = (filename) =>
  fs.readFileSync(path.join(__dirname, '..', 'templates', filename), 'utf-8');

// Send activation email
export const sendActivationEmail = async (to, token, name = '', type = 'activation') => {
    try {
        const subject = type === 'reactivation' ? 'Activate Your IRC Account Again' : 'Activate Your IRC Account';
        const templateFile = type === 'reactivation' ? 'reactivation.html' : 'activation.html';
        const html = loadTemplate(templateFile)
            .replace('{{name}}', name || 'User')
            .replace('{{activationLink}}', `http://localhost:5173/activate?token=${token}`);


        await transporter.sendMail({
            from: `"IRC Admin" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html
        });
  } catch (err) {
        console.error('[EMAIL ERROR]', err); // Log once
        throw new Error('Failed to send activation email');
  }
};

// Send OTP code
export const sendOtpEmail = async (to, otp, name = '') => {
  const html = loadTemplate('otp.html')
    .replace('{{name}}', name || 'User')
    .replace('{{otp}}', otp);

  await transporter.sendMail({
    from: `"IRC Admin" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your IRC OTP Code',
    html
  });
};

// Send reset password link
export const sendResetPasswordEmail = async (to, token, name = '') => {
  const html = loadTemplate('reset-password.html')
    .replace('{{name}}', name || 'User')
    .replace('{{resetLink}}', `http://localhost:5173/resetpassword?token=${token}`);

  await transporter.sendMail({
    from: `"IRC Admin" <${process.env.MAIL_USER}>`,
    to,
    subject: 'IRC Password Reset',
    html
  });
};
