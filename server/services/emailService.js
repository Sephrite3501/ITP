import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const loadTemplate = (filename) =>
  fs.readFileSync(path.join(__dirname, '..', 'templates', filename), 'utf-8');

// Send activation email
export const sendActivationEmail = async (to, token, name = '', type = 'activation') => {
  const traceId = `EMAIL-ACTIVATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  try {
    const subject = type === 'reactivation' ? 'Activate Your IRC Account Again' : 'Activate Your IRC Account';
    const templateFile = type === 'reactivation' ? 'reactivation.html' : 'activation.html';
    const html = loadTemplate(templateFile)
      .replace('{{name}}', name || 'User')
      .replace('{{activationLink}}', `${BASE_URL}/activate?token=${encodeURIComponent(token)}`);

    await transporter.sendMail({
      from: `"IRC Admin" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`[${traceId}] Failed to send activation email:`, err);
    throw new Error('Failed to send activation email');
  }
};

// Send OTP code
export const sendOtpEmail = async (to, otp, name = '') => {
  const traceId = `EMAIL-OTP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  try {
    const subject = 'Your IRC OTP Code';
    const html = loadTemplate('otp.html')
      .replace('{{name}}', name || 'User')
      .replace('{{otp}}', otp);

    await transporter.sendMail({
      from: `"IRC Admin" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`[${traceId}] Failed to send OTP email:`, err);
    throw new Error('Failed to send OTP email');
  }
};

// Send reset password link
export const sendResetPasswordEmail = async (to, token, name = '') => {
  const traceId = `EMAIL-RESET-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  try {
    const subject = 'IRC Password Reset';
    const html = loadTemplate('reset-password.html')
      .replace('{{name}}', name || 'User')
      .replace('{{resetLink}}', `${BASE_URL}/resetpassword?token=${encodeURIComponent(token)}`);

    await transporter.sendMail({
      from: `"IRC Admin" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`[${traceId}] Failed to send reset password email:`, err);
    throw new Error('Failed to send reset password email');
  }
};
