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
import { CommentInput } from '../../libs/dto/comment/comment.input';
import { Message } from '../../libs/enums/common.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { CommentStatus } from '../../libs/enums/comment.enum';

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
}
