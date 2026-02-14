const errorHandler = (err, req, res, next) => {
  res.status(res.statusCode || 500).json({
    message: err.message || "Server Error"
  });
};

module.exports = errorHandler;
    