import { Schema } from 'mongoose';

const ReviewSchema = new Schema(
  {
    reviewRefId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    staffRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    facilitiesRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    cleanlessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    comfortRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    valueOfMoneyRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    locationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    freeWiFiRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    comment: {
      type: String,
      default: '',
    },
    responseForComment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, collection: 'reviews' },
);

export default ReviewSchema;
