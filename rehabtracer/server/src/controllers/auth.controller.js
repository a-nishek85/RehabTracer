import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import User from '../models/User.model.js';
import { sendEmail } from '../services/email.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, ...profileData } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, 'Name, email, password, and role are required');
  }

  if (!['patient', 'doctor'].includes(role)) {
    throw new ApiError(400, 'Role must be patient or doctor');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password, role });

  if (role === 'doctor') {
    const { specialization, hospital, experience, doctorId, licenseNumber } = profileData;
    if (!specialization || !hospital || !experience || !doctorId || !licenseNumber) {
      await User.findByIdAndDelete(user._id);
      throw new ApiError(400, 'All doctor fields are required');
    }
    const dupe = await Doctor.findOne({ $or: [{ doctorId }, { licenseNumber }] });
    if (dupe) {
      await User.findByIdAndDelete(user._id);
      throw new ApiError(409, 'Doctor ID or License number already exists');
    }
    await Doctor.create({ user: user._id, specialization, hospital, experience, doctorId, licenseNumber });
  }

  if (role === 'patient') {
    const { age, gender, medicalCondition, contactNumber } = profileData;
    if (!age || !gender || !medicalCondition) {
      await User.findByIdAndDelete(user._id);
      throw new ApiError(400, 'Age, gender, and medical condition are required');
    }
    await Patient.create({ user: user._id, age, gender, medicalCondition, contactNumber });
  }

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, { ...cookieOptions })
    .json(new ApiResponse(201, { user, accessToken }, 'Registration successful'));
});

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated. Contact support.');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid email or password');

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  const userObj = user.toJSON();

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user: userObj, accessToken }, 'Login successful'));
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  return res
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

// POST /auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, 'Refresh token missing');

  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken  = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

// GET /auth/me
export const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'doctor') {
    profile = await Doctor.findOne({ user: req.user._id });
  } else if (req.user.role === 'patient') {
    profile = await Patient.findOne({ user: req.user._id }).populate('connectedDoctor');
  }
  return res.json(new ApiResponse(200, { user: req.user, profile }, 'Profile fetched'));
});

// POST /auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'No account with that email');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'RehabTracer — Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`,
  });

  return res.json(new ApiResponse(200, {}, 'Password reset email sent'));
});

// POST /auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) throw new ApiError(400, 'New password is required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return res.json(new ApiResponse(200, {}, 'Password reset successful'));
});