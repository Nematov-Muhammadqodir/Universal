import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { Attraction } from '../../libs/dto/attraction/attraction';
import { PartnerService } from '../partner/partner/partner.service';
import { MemberService } from '../member/member.service';
import {
  CommentInput,
  CommentsInquiry,
} from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { CommentStatus } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import {
  lookupMember,
  lookupReservation,
  unwindReservation,
} from '../../libs/config';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('AttractionSchema') private readonly attractionModel: Model<Attraction>,
    private readonly memberService: MemberService,
    private readonly partnerService: PartnerService,
  ) {}

  public async createComment(
    memberId: ObjectId,
    input: CommentInput,
  ): Promise<Comment> {
    input.memberId = memberId;

    const { valueRating, facilitiesRating, qualityRating, accessRating, ...commentData } = input as any;

    // Calculate commentScore from individual ratings if provided
    const ratingValues = [valueRating, facilitiesRating, qualityRating, accessRating].filter(
      (r) => r != null && r > 0,
    );
    if (ratingValues.length > 0 && !commentData.commentScore) {
      commentData.commentScore = Math.round(
        ratingValues.reduce((sum: number, val: number) => sum + val, 0) / ratingValues.length,
      );
    }
    commentData.memberId = memberId;

    let result = null;
    try {
      result = await this.commentModel.create(commentData);
    } catch (err) {
      console.log('CommentService=>createComment Error:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);

    // Update attraction ratings if individual ratings are provided
    if (ratingValues.length > 0) {
      try {
        const attraction = await this.attractionModel.findById(input.commentRefId).exec();
        if (attraction) {
          const allComments = await this.commentModel
            .find({ commentRefId: input.commentRefId })
            .lean()
            .exec();

          const totalReviews = allComments.length;
          const avgScore =
            allComments.reduce((sum, c: any) => sum + (c.commentScore ?? 0), 0) / totalReviews;

          const update: any = {
            totalReviews,
            averageRating: parseFloat(avgScore.toFixed(1)),
          };

          // Recalculate individual ratings using incremental average
          if (valueRating) {
            update.valueRating = parseFloat(
              (((attraction.valueRating || 0) * (totalReviews - 1) + valueRating) / totalReviews).toFixed(1),
            );
          }
          if (facilitiesRating) {
            update.facilitiesRating = parseFloat(
              (((attraction.facilitiesRating || 0) * (totalReviews - 1) + facilitiesRating) / totalReviews).toFixed(1),
            );
          }
          if (qualityRating) {
            update.qualityRating = parseFloat(
              (((attraction.qualityRating || 0) * (totalReviews - 1) + qualityRating) / totalReviews).toFixed(1),
            );
          }
          if (accessRating) {
            update.accessRating = parseFloat(
              (((attraction.accessRating || 0) * (totalReviews - 1) + accessRating) / totalReviews).toFixed(1),
            );
          }

          await this.attractionModel.findByIdAndUpdate(input.commentRefId, { $set: update }).exec();
        }
      } catch (err) {
        console.log('Rating update error:', err.message);
      }
    }

    return result;
  }

  public async updateComment(
    memberId: ObjectId,
    input: CommentUpdate,
  ): Promise<Comment> {
    const { _id } = input;

    const result = await this.commentModel
      .findOneAndUpdate(
        {
          _id: _id,
          memberId: memberId,
          commentStatus: CommentStatus.ACTIVE,
        },
        input,
        { new: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async getComments(
    memberId: ObjectId,
    input: CommentsInquiry,
  ): Promise<Comments> {
    console.log('Query: getComments Service');
    const { commentRefId } = input.search;

    const match: T = {
      commentRefId: commentRefId,
      commentStatus: CommentStatus.ACTIVE,
    };

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    console.log('getComments sort', sort);

    const lookupProperty = {
      $lookup: {
        from: 'partnersProperties',
        let: { propertyIdFromReservation: '$reservationData.propertyId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: '$_id' }, '$$propertyIdFromReservation'],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'propertyData',
      },
    };

    const unwindProperty = {
      $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true },
    };

    const lookupRoom = {
      $lookup: {
        from: 'partnerPropertyRooms',
        let: { roomIdFromReservation: '$reservationData.roomId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: '$_id' }, '$$roomIdFromReservation'],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'roomData',
      },
    };

    const unwindRoom = {
      $unwind: { path: '$roomData', preserveNullAndEmptyArrays: true },
    };

    // Build pipeline; filter(Boolean) protects against accidental null stages
    const listPipeline = [
      { $skip: (input.page - 1) * input.limit },
      { $limit: input.limit },
      lookupMember,
      { $unwind: '$memberData' },
      lookupReservation,
      unwindReservation,
      lookupProperty,
      unwindProperty,
      lookupRoom,
      unwindRoom,
    ].filter(Boolean);

    const result: Comments[] = await this.commentModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: listPipeline,
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const comments = result[0].list;
    const metaCounter = result[0].metaCounter;

    console.log('getComments result', {
      listLength: comments.length,
      metaCounter,
    });

    return {
      list: comments,
      metaCounter,
    };
  }

  public async getMyComments(
    memberId: ObjectId,
    input: { page: number; limit: number },
  ): Promise<Comments> {
    const { page, limit } = input;

    const result = await this.commentModel
      .aggregate([
        { $match: { memberId: memberId, commentStatus: CommentStatus.ACTIVE } },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              // Lookup property data
              {
                $lookup: {
                  from: 'partnersProperties',
                  let: { refId: '$commentRefId' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$refId'] } } },
                    { $limit: 1 },
                  ],
                  as: 'propertyData',
                },
              },
              {
                $unwind: {
                  path: '$propertyData',
                  preserveNullAndEmptyArrays: true,
                },
              },
              // Lookup attraction data
              {
                $lookup: {
                  from: 'attractions',
                  let: { refId: '$commentRefId' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$refId'] } } },
                    { $limit: 1 },
                  ],
                  as: 'attractionData',
                },
              },
              {
                $unwind: {
                  path: '$attractionData',
                  preserveNullAndEmptyArrays: true,
                },
              },
              lookupMember,
              {
                $unwind: {
                  path: '$memberData',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async likeComment(
    memberId: ObjectId,
    commentId: ObjectId,
  ): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new BadRequestException(Message.NO_DATA_FOUND);

    const memberIdStr = memberId.toString();
    const alreadyLiked = comment.likedBy?.map(String).includes(memberIdStr);
    const alreadyDisliked = comment.dislikedBy
      ?.map(String)
      .includes(memberIdStr);

    const update: any = {};

    if (alreadyLiked) {
      // Remove like (toggle off)
      update.$pull = { likedBy: new Types.ObjectId(memberIdStr) };
      update.$inc = { commentLikes: -1, commentScore: -1 };
    } else {
      // Add like
      update.$addToSet = { likedBy: new Types.ObjectId(memberIdStr) };
      update.$inc = { commentLikes: 1, commentScore: 1 };

      // If was disliked, remove dislike too
      if (alreadyDisliked) {
        update.$pull = { dislikedBy: new Types.ObjectId(memberIdStr) };
        update.$inc.commentDislikes = -1;
        update.$inc.commentScore += 1;
      }
    }

    // $addToSet and $pull can't both be in the same update on the same field,
    // but they target different fields here, so it's safe.
    // However if both $pull and $addToSet exist, we need two operations.
    if (alreadyDisliked && !alreadyLiked) {
      await this.commentModel.findByIdAndUpdate(commentId, {
        $pull: { dislikedBy: new Types.ObjectId(memberIdStr) },
        $inc: { commentDislikes: -1 },
      });
      const result = await this.commentModel.findByIdAndUpdate(
        commentId,
        {
          $addToSet: { likedBy: new Types.ObjectId(memberIdStr) },
          $inc: { commentLikes: 1, commentScore: 2 },
        },
        { new: true },
      );
      return result;
    }

    const result = await this.commentModel.findByIdAndUpdate(
      commentId,
      update,
      { new: true },
    );
    return result;
  }

  public async dislikeComment(
    memberId: ObjectId,
    commentId: ObjectId,
  ): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new BadRequestException(Message.NO_DATA_FOUND);

    const memberIdStr = memberId.toString();
    const alreadyLiked = comment.likedBy?.map(String).includes(memberIdStr);
    const alreadyDisliked = comment.dislikedBy
      ?.map(String)
      .includes(memberIdStr);

    if (alreadyDisliked) {
      // Remove dislike (toggle off)
      const result = await this.commentModel.findByIdAndUpdate(
        commentId,
        {
          $pull: { dislikedBy: new Types.ObjectId(memberIdStr) },
          $inc: { commentDislikes: -1, commentScore: 1 },
        },
        { new: true },
      );
      return result;
    }

    // If was liked, remove like first
    if (alreadyLiked) {
      await this.commentModel.findByIdAndUpdate(commentId, {
        $pull: { likedBy: new Types.ObjectId(memberIdStr) },
        $inc: { commentLikes: -1 },
      });
      const result = await this.commentModel.findByIdAndUpdate(
        commentId,
        {
          $addToSet: { dislikedBy: new Types.ObjectId(memberIdStr) },
          $inc: { commentDislikes: 1, commentScore: -2 },
        },
        { new: true },
      );
      return result;
    }

    // Fresh dislike
    const result = await this.commentModel.findByIdAndUpdate(
      commentId,
      {
        $addToSet: { dislikedBy: new Types.ObjectId(memberIdStr) },
        $inc: { commentDislikes: 1, commentScore: -1 },
      },
      { new: true },
    );
    return result;
  }
}
