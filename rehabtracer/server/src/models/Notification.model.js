import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'request_sent', 'request_accepted', 'request_rejected',
        'plan_created', 'plan_updated', 'exercise_reminder',
        'appointment_scheduled', 'appointment_cancelled', 'appointment_reminder',
        'progress_update', 'message_received', 'report_ready',
        'account_approved', 'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body:  { type: String, required: true },
    link:  String,
    isRead:{ type: Boolean, default: false },
    readAt:{ type: Date },
    meta:  { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;