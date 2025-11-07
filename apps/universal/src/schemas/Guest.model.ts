import { Schema } from 'mongoose';
import {
  GuestAuthType,
  GuestGender,
  GuestStatus,
  GuestType,
} from '../libs/enums/user.enum';

const GuestSchema = new Schema(
  {
    guestType: { type: String, enum: GuestType, default: GuestType.SINGLE },
    guestStatus: {
      type: String,
      enum: GuestStatus,
      default: GuestStatus.ACTIVE,
    },
    guestAuthType: {
      type: String,
      enum: GuestAuthType,
      default: GuestAuthType.PHONE,
    },
    guestPhone: {
      type: String,
      index: { unique: true, sparse: true },
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestPassword: {
      type: String,
      select: false,
      required: true,
    },
    guestGender: {
      type: String,
      required: true,
      enum: GuestGender,
    },
    guestFullName: {
      type: String,
    },
    guestImage: {
      type: String,
      default: '',
    },
    guestCountry: {
      type: String,
      required: true,
      default: '',
    },
    guestRegion: {
      type: String,
      required: true,
      default: '',
    },
    guestPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: 'guests' },
);

export default GuestSchema;
