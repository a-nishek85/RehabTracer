import mongoose, { Schema } from 'mongoose';

const progressSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    rehabPlan: {
      type: Schema.Types.ObjectId,
      ref: 'RehabPlan',
      required: true,
    },
    loggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    painLevel: {
      type: Number,
      required: [true, 'Pain level is required'],
      min: 0,
      max: 10,
    },
    mobilityScore:     { type: Number, min: 0, max: 100 },
    exercisesCompleted:{ type: Number, default: 0 },
    totalExercises:    { type: Number, default: 0 },
    recoveryPct:       { type: Number, min: 0, max: 100, default: 0 },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'poor', 'terrible'],
    },
    notes: { type: String, trim: true },
    attachments: [{ url: String, name: String }],
    vitals: {
      heartRate:   Number,
      bloodPressure: String,
      weight:      Number,
      temperature: Number,
    },
  },
  { timestamps: true }
);

progressSchema.index({ patient: 1, date: -1 });
progressSchema.index({ rehabPlan: 1, date: -1 });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;