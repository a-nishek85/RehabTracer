import mongoose, { Schema } from 'mongoose';

const activityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action:     { type: String, required: true },
    description:{ type: String },
    ipAddress:  String,
    userAgent:  String,
    metadata:   { type: Schema.Types.Mixed },
    status:     { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;