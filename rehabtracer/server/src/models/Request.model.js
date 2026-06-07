import mongoose, { Schema } from 'mongoose';

const requestSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      trim: true,
    },
    rejectionReason: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

requestSchema.index({ patient: 1, doctor: 1 }, { unique: true });
requestSchema.index({ doctor: 1, status: 1 });
requestSchema.index({ patient: 1, status: 1 });

const Request = mongoose.model('Request', requestSchema);
export default Request;