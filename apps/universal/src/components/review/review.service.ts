import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Review } from '../../libs/dto/review/review';
import { PartnerProperty } from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { AuthService } from '../auth/auth.service';
import { ReviewInput } from '../../libs/dto/review/review.input';

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
    input.memberId = memberId;
    console.log('Service - submitReview', input);
    return await this.reviewModel.create(input);
  }
}
