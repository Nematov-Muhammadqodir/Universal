import { Schema } from 'mongoose';
import {
  HotelStaffLanguages,
  PropertyFacilities,
  PropertyType,
} from '../libs/enums/property.enum';

const PartnerPropertySchema = new Schema(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'partners', required: true },
    propertyType: {
      type: String,
      enum: PropertyType,
      default: PropertyType.HOTEL,
      required: true,
    },
    propertyCountry: { type: String, required: true },
    propertyRegion: { type: String, required: true },
    propertyCity: { type: String, required: true },
    propertyPostCode: { type: String, required: true },
    propertyName: {
      type: String,
      index: { unique: true, sparse: true },
      required: true,
    },
    propertyStars: { type: Number, required: true },
    propertyFacilities: {
      type: [String],
      enum: Object.values(PropertyFacilities),
      required: true,
      default: [],
    },
    breakfastIncluded: { type: Boolean, default: false, required: true },
    parkingIncluded: { type: Boolean, default: false, required: true },
    hotelStaffLanguages: {
      type: String,
      enum: HotelStaffLanguages,
      default: HotelStaffLanguages.ENGLISH,
      required: true,
    },
    checkInTimeFrom: { type: String, required: true },
    checkInTimeUntill: { type: String, required: true },
    checkOutTimeFrom: { type: String, required: true },
    checkOutTimeUntill: { type: String, required: true },
    allowChildren: { type: Boolean, default: false, required: true },
    allowPets: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, collection: 'partnersProperties' },
);

export default PartnerPropertySchema;
