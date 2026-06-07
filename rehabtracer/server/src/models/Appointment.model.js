import mongoose, { Schema } from 'mongoose';

const appointmentSchema = new Schema(
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
    scheduledAt: {
      type: Date,
      required: [true, 'Appointment date and time is required'],
    },
    duration: {
      type: Number,
      default: 30,
      min: 15,
      max: 180,
    },
    type: {
      type: String,
      enum: ['in-person', 'video', 'phone'],
      default: 'in-person',
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled', 'no-show', 'rescheduled'],
      default: 'upcoming',
    },
    reason:           { type: String, trim: true },
    notes:            { type: String, trim: true },
    videoLink:        String,
    cancellationReason: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt:  Date,
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, scheduledAt: -1 });
appointmentSchema.index({ doctor: 1, scheduledAt: 1, status: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;