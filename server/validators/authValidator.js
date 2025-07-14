// server/middleware/validators.js
import { body } from 'express-validator';

const TEMP_EMAIL_DOMAINS = [
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com',
  'fakeinbox.com', 'dispostable.com', 'maildrop.cc', 'yopmail.com'
];

const isTempEmail = (email) => {
  const domain = email.split('@')[1];
  return TEMP_EMAIL_DOMAINS.includes(domain);
};

export const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name too long')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Invalid characters in name'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .custom((value) => {
      if (isTempEmail(value)) {
        throw new Error('Temporary email addresses are not allowed.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('contact').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('memberType')
    .optional()
    .isIn(['Junior', 'Ordinary', 'Corporate'])
    .withMessage('Invalid member type')
];

export const validateLogin = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .custom((value) => {
      if (isTempEmail(value)) {
        throw new Error('Temporary email addresses are not allowed.');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
  body('otp')
    .optional()
    .matches(/^\d{4,6}$/).withMessage('OTP must be 4–6 digits')
];

export const validateResetRequest = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .custom((value) => {
      if (isTempEmail(value)) {
        throw new Error('Temporary email addresses are not allowed.');
      }
      return true;
    })
];

export const validateNewPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];
