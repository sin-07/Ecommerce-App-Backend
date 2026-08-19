export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const safeMessage = statusCode >= 500 ? 'Something went wrong. Please try again.' : err.message || 'Request failed';

  if (statusCode >= 500) {
    console.error('[Unhandled error]', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: safeMessage
  });
};
