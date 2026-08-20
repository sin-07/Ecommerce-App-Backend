import { createHash, randomInt } from 'node:crypto';
import { User } from '../models/User.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { comparePassword, createToken, hashPassword } from '../services/authService.js';
import { registerUserPushToken } from '../services/pushNotificationService.js';
import { sendRegistrationOtpEmail } from '../services/emailService.js';
import { success } from '../utils/apiResponse.js';

const OTP_COOLDOWN_MS = 45 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (otp) => createHash('sha256').update(String(otp)).digest('hex');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const toPublicUser = (user) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  companyName: user.companyName || ''
});

/**
 * Generates and sends a 6-digit email verification code for new wholesale account registration.
 */
export const requestRegistrationOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid business email address.'
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in.'
      });
    }

    const existingOtp = await OtpVerification.findOne({ email });
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsed = Date.now() - existingOtp.lastSentAt.getTime();
      if (elapsed < OTP_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds}s before requesting a new verification code.`
        });
      }
    }

    const otp = String(randomInt(100000, 1000000));
    const now = new Date();
    await OtpVerification.findOneAndUpdate(
      { email },
      {
        email,
        otpHash: hashOtp(otp),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
        attempts: 0
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send email with detailed logging and error boundary
    try {
      await sendRegistrationOtpEmail({ email, otp, expiryMinutes: 10 });
    } catch (emailError) {
      console.error('[requestRegistrationOtp] Email delivery failed for:', email, {
        message: emailError.message,
        code: emailError.code
      });

      if (process.env.NODE_ENV === 'production' && emailError.code === 'SMTP_NOT_CONFIGURED') {
        return res.status(500).json({
          success: false,
          message: 'Email service configuration error. Please contact system administrator.'
        });
      }

      // If SMTP failed to connect or credentials failed
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          message: 'Unable to deliver verification email. Please verify your email address or try again later.'
        });
      }
    }

    return success(
      res,
      {
        email,
        cooldownSeconds: Math.ceil(OTP_COOLDOWN_MS / 1000)
      },
      'Verification code sent to your email.'
    );
  } catch (error) {
    console.error('[requestRegistrationOtp FATAL ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while generating verification code. Please try again.'
    });
  }
};

/**
 * Validates the 6-digit OTP code against the secure database hash.
 */
export const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email and 6-digit verification code are required.'
      });
    }

    const record = await OtpVerification.findOne({ email });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      if (record) await OtpVerification.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: 'The verification code has expired. Please request a new code.'
      });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.'
      });
    }

    if (record.otpHash !== hashOtp(otp)) {
      await OtpVerification.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({
        success: false,
        message: 'The verification code is incorrect.'
      });
    }

    return success(res, null, 'Email verified successfully.');
  } catch (error) {
    console.error('[verifyRegistrationOtp ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to verify code at this time. Please try again.'
    });
  }
};

/**
 * Registers a new wholesale buyer account after email verification.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName, phone, otp } = req.body;

    const cleanEmail = normalizeEmail(email);
    const cleanName = String(name || '').trim();
    const cleanCompany = String(companyName || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanOtp = String(otp || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
    }
    if (!cleanCompany || cleanCompany.length < 2) {
      return res.status(400).json({ success: false, message: 'Company / Store name is required.' });
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'A valid business email address is required.' });
    }
    if (!cleanPhone || !/^[+0-9\s\-()]{7,20}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'A valid contact phone number is required.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: 'A 6-digit email verification code is required.' });
    }

    if (role && !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Only buyer accounts can self-register.' });
    }

    if (role === 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Seller account creation is restricted. Please contact AP Enterprises administration.'
      });
    }

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email is already registered. Please sign in.' });
    }

    const verification = await OtpVerification.findOne({ email: cleanEmail });
    if (!verification || verification.expiresAt.getTime() <= Date.now()) {
      if (verification) await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'The verification code has expired. Please request a new code.'
      });
    }

    if (verification.attempts >= OTP_MAX_ATTEMPTS || verification.otpHash !== hashOtp(cleanOtp)) {
      if (verification.otpHash !== hashOtp(cleanOtp)) {
        await OtpVerification.updateOne({ _id: verification._id }, { $inc: { attempts: 1 } });
      }
      return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
    }

    // Clean up OTP record once successfully used
    await OtpVerification.deleteOne({ _id: verification._id });

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'buyer',
      companyName: cleanCompany,
      phone: cleanPhone
    });

    const token = createToken(user._id, user.role);

    return success(
      res,
      {
        token,
        user: toPublicUser(user)
      },
      'Wholesale account created successfully.',
      201
    );
  } catch (error) {
    console.error('[register ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during account creation. Please try again.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const matched = await comparePassword(password, user.password);
    if (!matched) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = createToken(user._id, user.role);

    return success(res, {
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('[login ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

export const me = async (req, res) => {
  return success(res, toPublicUser(req.user));
};

export const savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken is required.' });
    }

    await registerUserPushToken(req.user._id, expoPushToken);
    return success(res, null, 'Push token saved successfully.');
  } catch (error) {
    console.error('[savePushToken ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save push notification token.'
    });
  }
};
