import { Router } from 'express';
import { login, me, register, requestRegistrationOtp, savePushToken, verifyRegistrationOtp } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { validateLogin, validateOtpRequest, validateOtpVerification, validateRegister } from '../validators/authValidators.js';

const router = Router();

router.post('/request-otp', validate(validateOtpRequest), requestRegistrationOtp);
router.post('/verify-otp', validate(validateOtpVerification), verifyRegistrationOtp);
router.post('/register', validate(validateRegister), register);
router.post('/login', validate(validateLogin), login);
router.get('/me', protect, me);
router.post('/push-token', protect, savePushToken);

export default router;
