import mongoose, { Schema } from 'mongoose';

const availabilitySlotSchema = new Schema({
  day: {
    type: String,
    enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
  },
  startTime: String,
  endTime:   String,
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const doctorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    hospital: {
      type: String,
      required: [true, 'Hospital/Clinic name is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    patients: [{ type: Schema.Types.ObjectId, ref: 'Patient' }],
    pendingRequests: [{ type: Schema.Types.ObjectId, ref: 'Request' }],
    availability: [availabilitySlotSchema],
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:{ type: Number, default: 0 },
    isApproved:  { type: Boolean, default: false },
    bio:         { type: String, maxlength: 500 },
    qualifications: [String],
    consultationFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isApproved: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;