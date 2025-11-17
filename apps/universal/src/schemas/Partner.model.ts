import { Schema } from 'mongoose';
import { GuestStatus, UserRole } from '../libs/enums/user.enum';

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
    userRole: {
      type: String,
      enum: UserRole,
      default: UserRole.HOTEL_OWNER,
      required: true,
    },
    memberStatus: {
      type: String,
      enum: GuestStatus,
      default: GuestStatus.ACTIVE,
    },
  },
  { timestamps: true, collection: 'partners' },
);

export default PartnerSchema;
