const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Postgres duplicate key
  if (err.code === '23505') {
    const match = err.detail?.match(/Key \((.+)\)=\((.+)\) already exists/);
    const field = match ? match[1] : 'Field';
    error = { statusCode: 400, message: `${field} already exists` };
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    error = { statusCode: 400, message: 'Referenced record not found' };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid token' };
  }
  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 401, message: 'Token expired' };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
