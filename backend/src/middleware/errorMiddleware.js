export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 400 : err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file is too large'
      : isProduction && statusCode === 500
        ? 'Server error'
        : err.message || 'Server error';

  return res.status(statusCode).json({
    message,
    ...(!isProduction && { stack: err.stack }),
  });
};
