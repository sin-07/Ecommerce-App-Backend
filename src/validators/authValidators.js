const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());

export const validateOtpRequest = (req) => {
  const errors = [];
  if (!req.body.email || !isEmail(req.body.email)) {
    errors.push('A valid business email address is required');
  }
  return errors;
};

export const validateOtpVerification = (req) => {
  const errors = validateOtpRequest(req);
  if (!/^\d{6}$/.test(String(req.body.otp || '').trim())) {
    errors.push('A 6-digit verification code is required');
  }
  return errors;
};

export const validateRegister = (req) => {
  const errors = [];
  const { name, email, password, otp, phone, companyName } = req.body;

  if (!name || String(name).trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  if (!companyName || String(companyName).trim().length < 2) {
    errors.push('Company / Store name is required');
  }
  if (!email || !isEmail(email)) {
    errors.push('A valid business email address is required');
  }
  if (!phone || !/^[+0-9\s\-()]{7,20}$/.test(String(phone).trim())) {
    errors.push('A valid contact phone number is required');
  }
  if (!password || String(password).length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
    errors.push('A valid 6-digit verification code is required');
  }

  return errors;
};

export const validateLogin = (req) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || !isEmail(email)) {
    errors.push('A valid email address is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  return errors;
};
