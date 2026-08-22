export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);
  const errorMessage = err.message || 'Request failed';

  if (statusCode >= 500) {
    console.error('[Unhandled server error]', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: errorMessage
  });
};
