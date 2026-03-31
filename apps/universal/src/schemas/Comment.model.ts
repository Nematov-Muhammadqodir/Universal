import { Schema } from 'mongoose';
import { CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
  {
    commentStatus: {
      type: String,
      enum: CommentStatus,
      default: CommentStatus.ACTIVE,
    },
    commentRefId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },
    commentContent: {
      type: String,
      required: true,
    },
    commentScore: {
      type: Number,
      default: 0,
    },
    commentLikes: {
      type: Number,
      default: 0,
    },
    commentDislikes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    dislikedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true, collection: 'comments' },
);
export default CommentSchema;
