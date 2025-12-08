import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Review } from '../../libs/dto/review/review';
import { PartnerProperty } from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { AuthService } from '../auth/auth.service';
import { ReviewInput } from '../../libs/dto/review/review.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('ReviewSchema') private readonly reviewModel: Model<Review>,
    @InjectModel('PartnerPropertySchema')
    private readonly partnerPropertyModel: Model<PartnerProperty>,
    private authService: AuthService,
  ) {}

  public async submitReview(
    input: ReviewInput,
    memberId: ObjectId,
  ): Promise<Review> {
    const alreadeyReviewed = await this.reviewModel.findOne({
      memberId: memberId,
      reviewRefId: input.reviewRefId,
    });
    if (alreadeyReviewed) {
      throw new BadRequestException(Message.ALREADY_REVIEWED);
    }
    input.memberId = memberId;
    console.log('Service - submitReview', input);
    try {
      return await this.reviewModel.create(input);
    } catch (err) {
      console.log('Error, partnerSignup', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }
}
