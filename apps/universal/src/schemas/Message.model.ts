import { Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'conversations', required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: { type: String, required: true }, // 'GUEST' or 'PARTNER'
    messageContent: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default MessageSchema;
