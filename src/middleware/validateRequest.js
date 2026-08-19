export const validate = (validator) => (req, res, next) => {
  const errors = validator(req);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  return next();
};