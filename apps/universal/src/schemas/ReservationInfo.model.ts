import { Schema, Document } from 'mongoose';

export interface IReservationInfo extends Document {
  guestId: string;
  guestName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhoneNumber: string;
  travelForWork: boolean;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvs: string;
  roomId: string;
  ageConfirmation: boolean;
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
    cardholderName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvs: { type: String, required: true },
    roomId: { type: String, required: true },
    ageConfirmation: { type: Boolean, required: true },
  },
  { timestamps: true },
);

export default ReservationInfoSchema;
