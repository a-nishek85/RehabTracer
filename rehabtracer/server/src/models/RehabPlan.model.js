import mongoose, { Schema } from 'mongoose';

const medicationSchema = new Schema({
  name:      { type: String, required: true },
  dose:      String,
  frequency: String,
  duration:  String,
}, { _id: false });

const recoveryNoteSchema = new Schema({
  note:    { type: String, required: true },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
});

const attachmentSchema = new Schema({
  url:  { type: String, required: true },
  name: String,
  type: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const rehabPlanSchema = new Schema(
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
    title: {
      type: String,
      required: [true, 'Plan title is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate:  { type: Date },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    exercises: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
    prescription: {
      medications: [medicationSchema],
      notes: String,
    },
    recoveryNotes: [recoveryNoteSchema],
    attachments:   [attachmentSchema],
    targetRecoveryPct: { type: Number, default: 100, min: 0, max: 100 },
    currentRecoveryPct:{ type: Number, default: 0,   min: 0, max: 100 },
    goals: [String],
  },
  { timestamps: true }
);

rehabPlanSchema.index({ patient: 1, status: 1 });
rehabPlanSchema.index({ doctor: 1 });

const RehabPlan = mongoose.model('RehabPlan', rehabPlanSchema);
export default RehabPlan;