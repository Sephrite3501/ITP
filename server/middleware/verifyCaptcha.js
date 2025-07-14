// server/middleware/verifyCaptcha.js
import axios from 'axios';

export const verifyCaptcha = async (req, res, next) => {
  const traceId = `CAPTCHA-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const token = req.body.recaptchaToken;

  if (!token) {
    return res.status(400).json({
      message: `CAPTCHA token missing. (Ref: ${traceId})`
    });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      })
    );

    if (!response.data.success) {
      return res.status(400).json({
        message: `CAPTCHA verification failed. (Ref: ${traceId})`
      });
    }

    next();
  } catch (err) {
    console.error(`[verifyCaptcha] ${traceId} Verification error:`, err.message);
    return res.status(500).json({
      message: `Internal CAPTCHA verification error. (Ref: ${traceId})`
    });
  }
};
