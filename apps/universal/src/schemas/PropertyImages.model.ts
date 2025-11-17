import { Schema } from 'mongoose';

const PropertyImages = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'partnersProperties',
      required: true,
    },
    propertyImages: { type: [String], default: [], required: true },
  },
  { timestamps: true, collection: 'guests' },
);

export default PropertyImages;
