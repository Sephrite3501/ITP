// server/middleware/verifyCaptcha.js
import axios from 'axios';

export const verifyCaptcha = async (req, res, next) => {
  try {
    const token = req.body.recaptchaToken;
    console.log('[verifyCaptcha] Token:', token);

    if (!token) {
      return res.status(400).json({ message: 'CAPTCHA token missing.' });
    }

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      })
    );

    console.log('[verifyCaptcha] Response:', response.data);

    if (!response.data.success) {
      return res.status(400).json({ message: 'CAPTCHA verification failed.' });
    }

    next();
  } catch (err) {
    console.error('[verifyCaptcha ERROR]', err);
    return res.status(500).json({ message: 'Internal CAPTCHA verification error.' });
  }
};
