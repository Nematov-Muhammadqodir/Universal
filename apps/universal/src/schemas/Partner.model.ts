import { Schema } from 'mongoose';
import { UserRole } from '../libs/enums/user.enum';

const PartnerSchema = new Schema(
  {
    partnerEmail: {
      type: String,
      required: true,
      index: { unique: true, sparse: true },
    },
    partnerFirstName: {
      type: String,
      required: true,
    },
    partnerLastName: {
      type: String,
      required: true,
    },
    partnerPhoneNumber: {
      type: String,
      required: true,
    },
    partnerPassword: {
      type: String,
      required: true,
    },
    partnerType: {
      type: String,
      enum: UserRole,
      default: UserRole.HOTEL_OWNER,
      required: true,
    },
  },
  { timestamps: true, collection: 'partners' },
);

export default PartnerSchema;
