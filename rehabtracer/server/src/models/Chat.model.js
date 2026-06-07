import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content:{ type: String, required: true, trim: true },
    type:   { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl:String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const chatSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages:    [messageSchema],
    lastMessage: {
      content:   String,
      sender:    { type: Schema.Types.ObjectId, ref: 'User' },
      sentAt:    Date,
    },
    isActive: { type: Boolean, default: true },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;