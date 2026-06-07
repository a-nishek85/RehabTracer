import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const verifyToken = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers?.authorization?.replace('Bearer ', '');

  if (!token) throw new ApiError(401, 'Unauthorized: No token provided');

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded._id).select('-password -refreshToken');

  if (!user) throw new ApiError(401, 'Unauthorized: User not found');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  req.user = user;
  next();
});

export const checkRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw new ApiError(403, `Access denied: Requires role ${roles.join(' or ')}`);
  }
  next();
};

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers?.authorization?.replace('Bearer ', '');

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select('-password -refreshToken');
    if (user && user.isActive) req.user = user;
  } catch (_) {}

  next();
});