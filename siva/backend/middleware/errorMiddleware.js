import logger from '../utils/logger.js';

const sendErrorDev = (err, req, res) => {
  logger.error(`Dev Error: ${err.message}`, { stack: err.stack });
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    logger.warn(`Operational Warn: ${err.message}`);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  logger.error(`Programming Error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
      error.message = `Invalid path: ${err.path} (${err.value}).`;
      error.statusCode = 400;
      error.isOperational = true;
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
      const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : '';
      error.message = `Duplicate field value: ${value}. Please use another value!`;
      error.statusCode = 400;
      error.isOperational = true;
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((el) => el.message);
      error.message = `Invalid input data. ${errors.join('. ')}`;
      error.statusCode = 400;
      error.isOperational = true;
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
      error.message = 'Invalid token. Please log in again.';
      error.statusCode = 401;
      error.isOperational = true;
    }

    if (err.name === 'TokenExpiredError') {
      error.message = 'Your session has expired. Please log in again.';
      error.statusCode = 401;
      error.isOperational = true;
    }

    sendErrorProd(error, req, res);
  }
};
