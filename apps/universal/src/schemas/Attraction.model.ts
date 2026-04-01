import { Schema } from 'mongoose';
import { AttractionStatus, AttractionType } from '../libs/enums/attraction.enum';

const AttractionSchema = new Schema(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'partners', required: true },
    attractionType: { type: String, enum: AttractionType, required: true },
    attractionName: { type: String, required: true },
    attractionDescription: { type: String, required: true },
    attractionCountry: { type: String, required: true },
    attractionRegion: { type: String, required: true },
    attractionCity: { type: String, required: true },
    attractionImages: { type: [String], default: [] },
    attractionAdultPrice: { type: Number, required: true },
    attractionChildPrice: { type: Number, default: 0 },
    attractionDuration: { type: String, required: true },
    attractionHighlights: { type: [String], default: [] },
    attractionIncludes: { type: [String], default: [] },
    attractionExcludes: { type: [String], default: [] },
    faqItems: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    maxParticipants: { type: Number, default: 50 },
    freeCancellation: { type: Boolean, default: true },
    attractionStatus: {
      type: String,
      enum: AttractionStatus,
      default: AttractionStatus.ACTIVE,
    },
    attractionViews: { type: Number, default: 0 },
    attractionLikes: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    valueRating: { type: Number, default: 0 },
    facilitiesRating: { type: Number, default: 0 },
    qualityRating: { type: Number, default: 0 },
    accessRating: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'attractions' },
);

export default AttractionSchema;
