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
  },
  { timestamps: true, collection: 'comments' },
);
export default CommentSchema;
