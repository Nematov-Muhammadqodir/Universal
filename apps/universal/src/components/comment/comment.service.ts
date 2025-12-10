import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
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
    private readonly memberService: MemberService,
    private readonly partnerService: PartnerService,
  ) {}

  public async createComment(
    memberId: ObjectId,
    input: CommentInput,
  ): Promise<Comment> {
    input.memberId = memberId;

    let result = null;
    try {
      result = await this.commentModel.create(input);
    } catch (err) {
      console.log('CommentService=>createComment Error:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
    console.log('cooment result:', result);
    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
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
}
