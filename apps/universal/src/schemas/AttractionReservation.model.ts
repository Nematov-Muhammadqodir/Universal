import { Schema } from 'mongoose';

const AttractionReservationSchema = new Schema(
  {
    guestId: { type: Schema.Types.ObjectId, required: true },
    attractionId: { type: Schema.Types.ObjectId, ref: 'attractions', required: true },
    guestName: { type: String, required: true },
    guestLastName: { type: String },
    guestEmail: { type: String, required: true },
    guestPhoneNumber: { type: String },
    ticketCount: { type: Number, required: true },
    selectedDate: { type: String, required: true },
    selectedTime: { type: String, required: true },
    stripePaymentIntentId: { type: String },
    paymentStatus: { type: String, default: 'pending' },
    paymentAmount: { type: Number, required: true },
    reservationStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'], default: 'CONFIRMED' },
  },
  { timestamps: true, collection: 'attractionReservations' },
);

export default AttractionReservationSchema;
