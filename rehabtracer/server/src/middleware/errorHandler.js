const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error("ERROR:", err);

  let statusCode = err.statusCode || 500;

  let message =
    err.message || "Internal Server Error";

  // ================= MONGODB INVALID OBJECT ID =================
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ================= DUPLICATE KEY ERROR =================
  if (err.code === 11000) {
    statusCode = 400;

    const field = Object.keys(err.keyValue)[0];

    message = `${field} already exists`;
  }

  // ================= VALIDATION ERROR =================
  if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // ================= JWT INVALID =================
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // ================= JWT EXPIRED =================
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // ================= MULTER FILE ERROR =================
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds limit";
  }

  // ================= RESPONSE =================
  res.status(statusCode).json({
    success: false,
    message,

    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : null,
  });
};

export default errorHandler;