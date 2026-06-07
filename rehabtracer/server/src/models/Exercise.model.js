import mongoose, { Schema } from 'mongoose';

const completionLogSchema = new Schema({
  completedAt: { type: Date, default: Date.now },
  notes:       String,
  painLevel:   { type: Number, min: 0, max: 10 },
}, { _id: false });

const exerciseSchema = new Schema(
  {
    rehabPlan: {
      type: Schema.Types.ObjectId,
      ref: 'RehabPlan',
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    sets:        { type: Number, min: 1 },
    reps:        { type: Number, min: 1 },
    duration:    { type: Number, min: 1 },
    frequency: {
      type: String,
      enum: ['daily', 'alternate_days', 'weekly', 'twice_daily', 'custom'],
      default: 'daily',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    category: {
      type: String,
      enum: ['strength', 'flexibility', 'balance', 'cardio', 'pain_relief', 'other'],
      default: 'other',
    },
    videoUrl:  String,
    imageUrl:  String,
    instructions: [String],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    completionLog: [completionLogSchema],
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

exerciseSchema.index({ rehabPlan: 1 });
exerciseSchema.index({ patient: 1, isCompleted: 1 });

const Exercise = mongoose.model('Exercise', exerciseSchema);
export default Exercise;