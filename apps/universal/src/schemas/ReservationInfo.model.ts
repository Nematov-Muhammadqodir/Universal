import { Schema, Document } from 'mongoose';

export interface IReservationInfo extends Document {
  guestId: string;
  guestName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhoneNumber: string;
  travelForWork: boolean;
  stripePaymentIntentId: string;
  paymentStatus: string;
  paymentAmount: number;
  roomId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  ageConfirmation: boolean;
  reservationStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReservationInfoSchema = new Schema<IReservationInfo>(
  {
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    guestLastName: { type: String, default: '' },
    guestEmail: { type: String, required: true },
    guestPhoneNumber: { type: String, required: true },
    travelForWork: { type: Boolean, default: false },
    stripePaymentIntentId: { type: String, required: true },
    paymentStatus: { type: String, default: 'succeeded' },
    paymentAmount: { type: Number, required: true },
    roomId: { type: String, required: true },
    propertyId: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    ageConfirmation: { type: Boolean, required: true },
    reservationStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'], default: 'CONFIRMED' },
  },
  { timestamps: true },
);

export default ReservationInfoSchema;
