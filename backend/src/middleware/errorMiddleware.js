export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    message: isProduction && statusCode === 500 ? 'Server error' : err.message || 'Server error',
    ...(!isProduction && { stack: err.stack }),
  });
};
