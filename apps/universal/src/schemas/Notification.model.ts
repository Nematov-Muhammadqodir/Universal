import { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    receiverId: { type: Schema.Types.ObjectId, required: true },
    notificationType: {
      type: String,
      enum: ['RESERVATION_CONFIRMED', 'RESERVATION_CANCELLED', 'RESERVATION_REFUNDED', 'NEW_REVIEW', 'GENERAL'],
      required: true,
    },
    notificationTitle: { type: String, required: true },
    notificationMessage: { type: String, required: true },
    notificationRefId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'notifications' },
);

export default NotificationSchema;
