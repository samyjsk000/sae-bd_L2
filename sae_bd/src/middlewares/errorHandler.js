export const notFound = (req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "InternalServerError" : "RequestError",
    message,
  });
};
