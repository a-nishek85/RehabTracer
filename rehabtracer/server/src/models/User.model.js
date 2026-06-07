import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: [true, 'Role is required'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    resetPasswordToken:  { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.emailVerificationToken;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;