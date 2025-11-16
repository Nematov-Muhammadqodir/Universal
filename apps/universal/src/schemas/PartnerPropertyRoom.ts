import { Schema } from 'mongoose';
import {
  BathroomFacilities,
  RoomFacilities,
  RoomNames,
  RoomTypes,
} from '../libs/enums/propertyRoom.enum';

const PartnerPropertyRoomSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'partnersProperties',
      required: true,
    },
    roomType: { type: String, enum: RoomTypes, required: true },
    currentRoomTypeAmount: { type: Number, default: 1, required: true },
    availableBeds: {
      type: {
        single: { type: Number, default: 0, min: 0 },
        double: { type: Number, default: 0, min: 0 },
        king: { type: Number, default: 0, min: 0 },
        superKing: { type: Number, default: 0, min: 0 },
      },
      required: true,
      default: { single: 0, double: 0, king: 0, superKing: 0 },
    },
    numberOfGuestsCanStay: { type: Number, default: 1, required: true },
    isSmokingAllowed: { type: Boolean, default: false, required: true },
    isBathroomPrivate: { type: Boolean, default: false, required: true },
    availableBathroomFacilities: {
      type: [String],
      enum: Object.values(BathroomFacilities),
      default: [],
      required: true,
    },
    roomFacilities: {
      type: [String],
      enum: Object.values(RoomFacilities),
      default: [],
      required: true,
    },
    roomName: { type: String, enum: RoomNames, default: '', required: true },
    roomPricePerNight: { type: String, required: true },
  },
  { timestamps: true, collection: 'partnerPropertyRooms' },
);

export default PartnerPropertyRoomSchema;
