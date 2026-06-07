import mongoose, { Schema } from 'mongoose';

const patientSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age must be under 120'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    medicalCondition: {
      type: String,
      required: [true, 'Medical condition is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    emergencyContact: {
      name:     { type: String, trim: true },
      phone:    { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    connectedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    connectionStatus: {
      type: String,
      enum: ['none', 'pending', 'connected'],
      default: 'none',
    },
    address: {
      street: String,
      city:   String,
      state:  String,
      zip:    String,
    },
    allergies:    [String],
    medications:  [String],
    admissionDate:{ type: Date },
  },
  { timestamps: true }
);

patientSchema.index({ connectedDoctor: 1 });
patientSchema.index({ user: 1 });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;