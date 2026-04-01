import { Schema } from 'mongoose';

const ConversationSchema = new Schema(
  {
    participantIds: [{ type: Schema.Types.ObjectId, required: true }],
    participantRoles: [{ type: String }], // 'GUEST' or 'PARTNER'
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    propertyId: { type: Schema.Types.ObjectId },
    attractionId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true, collection: 'conversations' },
);

ConversationSchema.index({ participantIds: 1 });

export default ConversationSchema;
