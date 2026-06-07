import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import corsMiddleware from "./config/cors.js";

import routes from "./routes/index.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ================= SECURITY MIDDLEWARE =================
app.use(helmet());

// ================= CORS =================
app.use(corsMiddleware);

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= COOKIE PARSER =================
app.use(cookieParser());

// ================= COMPRESSION =================
app.use(compression());

// ================= LOGGER =================
app.use(morgan("dev"));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RehabTracer API Running Successfully",
  });
});

// ================= API ROUTES =================
app.use("/api", routes);

// ================= 404 ROUTE =================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use(errorHandler);

export default app;