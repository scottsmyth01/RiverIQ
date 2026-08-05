export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const uploadErrorMessages = {
    LIMIT_FILE_SIZE: 'Uploaded file is too large',
    LIMIT_UNEXPECTED_FILE: 'Please upload no more than 25 hand history files at once',
  };
  const statusCode = uploadErrorMessages[err.code] ? 400 : err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    uploadErrorMessages[err.code]
      ? uploadErrorMessages[err.code]
      : isProduction && statusCode === 500
        ? 'Server error'
        : err.message || 'Server error';

  return res.status(statusCode).json({
    message,
    ...(err.code && statusCode < 500 ? { code: err.code } : {}),
    ...(Array.isArray(err.details) && statusCode < 500 ? { details: err.details } : {}),
    ...(!isProduction && { stack: err.stack }),
  });
};
