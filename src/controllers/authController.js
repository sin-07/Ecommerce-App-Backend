import { createHash, randomInt } from 'node:crypto';
import { User } from '../models/User.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { comparePassword, createToken, hashPassword } from '../services/authService.js';
import { registerUserPushToken } from '../services/pushNotificationService.js';
import { success } from '../utils/apiResponse.js';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

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
  companyName: user.companyName || 'AK Enterprises'
});

const mailTransport = env.smtp.user && env.smtp.pass
  ? nodemailer.createTransport({
      host: env.smtp.host || 'smtp.gmail.com',
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    })
  : null;

export const requestRegistrationOtp = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({ success: false, message: 'This email is already registered. Please log in.' });
  }

  const existingOtp = await OtpVerification.findOne({ email });
  if (existingOtp && Date.now() - existingOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existingOtp.lastSentAt.getTime())) / 1000);
    return res.status(429).json({
      success: false,
      message: `Please wait ${remainingSeconds}s before requesting a new code.`
    });
  }

  if (!mailTransport) {
    console.warn(`[OTP] SMTP not configured. Development mode: OTP for ${email} is logged in console.`);
  }

  const otp = String(randomInt(100000, 1000000));
  const now = new Date();
  await OtpVerification.findOneAndUpdate(
    { email },
    { email, otpHash: hashOtp(otp), expiresAt: new Date(now.getTime() + OTP_TTL_MS), lastSentAt: now, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (mailTransport) {
    try {
      const info = await mailTransport.sendMail({
        from: `"AP Enterprises" <${env.smtp.user}>`,
        to: email,
        subject: `${otp} is your AP Enterprises Verification Code`,
        text: `Welcome to AP Enterprises - B2B Beverage Supply.\n\nYour 6-digit verification code is: ${otp}\nThis code is valid for 10 minutes.\n\nThank you for choosing AP Enterprises.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AP Enterprises Verification</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #334155;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 32px 12px;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);">
                    <tr>
                      <td style="background-color: #0f172a; padding: 28px 30px; text-align: left;">
                        <div style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                          SECURITY VERIFICATION
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900;">AP ENTERPRISES</h1>
                        <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">Premium B2B Beverage Supply</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px 30px; text-align: center;">
                        <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: 900;">Verify Your Email Address</h2>
                        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                          Use the 6-digit verification code below to verify your wholesale account on the AP Enterprises mobile app:
                        </p>
                        <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px 16px; margin: 20px 0; text-align: center;">
                          <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; display: inline-block;">
                            ${otp}
                          </span>
                        </div>
                        <p style="margin: 0 0 6px 0; font-size: 13px; color: #475569; font-weight: 600;">
                          ⏱ This verification code expires in <strong>10 minutes</strong>.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                          Never share this code with anyone. AP Enterprises staff will never ask for your code.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 18px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                          &copy; ${new Date().getFullYear()} AP Enterprises &bull; Wholesale Beverage Ordering & Distribution
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });
      console.log(`[OTP email] accepted for ${email}: ${info.accepted?.length || 0} recipient(s)`);
    } catch (error) {
      console.error('[OTP email] Failed to send via SMTP:', { code: error.code, message: error.message });
      console.log(`[DEV OTP BACKUP] Verification code for ${email} is: ${otp}`);
    }
  } else {
    console.log(`[DEV OTP SIMULATION] Verification code for ${email} is: ${otp}`);
  }

  return success(
    res,
    { email, cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000) },
    'Verification code sent successfully to your email.'
  );
};

export const verifyRegistrationOtp = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const record = await OtpVerification.findOne({ email });

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) await OtpVerification.deleteOne({ _id: record._id });
    return res.status(400).json({ success: false, message: 'The verification code has expired. Please request a new code.' });
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
  }
  if (record.otpHash !== hashOtp(otp)) {
    await OtpVerification.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
  }

  return success(res, null, 'Email verified successfully');
};

export const register = async (req, res) => {
  const { name, email, password, role, companyName, phone, otp } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email address, and password are required' });
  }

  if (!otp) {
    return res.status(400).json({ success: false, message: 'Email verification code is required' });
  }

  if (role && !['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Only buyer accounts can self-register' });
  }

  if (role === 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Seller account creation is restricted. Please contact AP Enterprises administration.'
    });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email is already registered. Please sign in.' });
  }

  const verification = await OtpVerification.findOne({ email });
  if (!verification || verification.expiresAt.getTime() <= Date.now()) {
    if (verification) await OtpVerification.deleteOne({ _id: verification._id });
    return res.status(400).json({ success: false, message: 'The verification code has expired. Please request a new code.' });
  }
  if (verification.attempts >= OTP_MAX_ATTEMPTS || verification.otpHash !== hashOtp(otp)) {
    if (verification.otpHash !== hashOtp(otp)) await OtpVerification.updateOne({ _id: verification._id }, { $inc: { attempts: 1 } });
    return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
  }
  await OtpVerification.deleteOne({ _id: verification._id });

  const hashed = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email,
    password: hashed,
    role: 'buyer',
    companyName: companyName ? companyName.trim() : 'AP Enterprises',
    phone: phone ? phone.trim() : ''
  });

  const token = createToken(user._id, user.role);

  return success(
    res,
    {
      token,
      user: {
        ...toPublicUser(user)
      }
    },
    'Account registered successfully',
    201
  );
};

export const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const matched = await comparePassword(password, user.password);
  if (!matched) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = createToken(user._id, user.role);

  return success(res, {
    token,
    user: {
      ...toPublicUser(user)
    }
  });
};

export const me = async (req, res) => {
  return success(res, toPublicUser(req.user));
};

export const savePushToken = async (req, res) => {
  const { expoPushToken } = req.body;

  if (!expoPushToken) {
    return res.status(400).json({ success: false, message: 'expoPushToken is required' });
  }

  await registerUserPushToken(req.user._id, expoPushToken);
  return success(res, null, 'Push token saved');
};
