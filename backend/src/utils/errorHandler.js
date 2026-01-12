// Custom error class and async handler
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.isOperational = true;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, asyncHandler };
