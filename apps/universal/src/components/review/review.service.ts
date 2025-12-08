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
    // Check if user already reviewed this property
    const alreadyReviewed = await this.reviewModel.findOne({
      memberId: memberId,
      reviewRefId: input.reviewRefId,
    });

    if (alreadyReviewed) {
      throw new BadRequestException(Message.ALREADY_REVIEWED);
    }

    // Set correct memberId
    input.memberId = memberId;

    console.log('Service - submitReview', input);

    let createdReview: Review;

    try {
      // 1. Create review
      createdReview = await this.reviewModel.create(input);
    } catch (err) {
      console.log('Error submitReview:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }

    // 2. Update Property Rating Aggregations
    const property = await this.partnerPropertyModel.findById(
      input.reviewRefId,
    );

    if (!property) {
      throw new BadRequestException('Property not found');
    }

    const totalReviews = property.totalReviews ?? 0;
    const newTotalReviews = totalReviews + 1;

    // Helper to calculate new average
    const calcNewAvg = (oldValue: number, newValue: number) => {
      return (oldValue * totalReviews + newValue) / newTotalReviews;
    };

    // Update all rating categories
    property.staffRating = calcNewAvg(property.staffRating, input.staffRating);

    property.facilitiesRating = calcNewAvg(
      property.facilitiesRating,
      input.facilitiesRating,
    );

    property.cleanlessRating = calcNewAvg(
      property.cleanlessRating,
      input.cleanlessRating,
    );

    property.comfortRating = calcNewAvg(
      property.comfortRating,
      input.comfortRating,
    );

    property.valueOfMoneyRating = calcNewAvg(
      property.valueOfMoneyRating,
      input.valueOfMoneyRating,
    );

    property.locationRating = calcNewAvg(
      property.locationRating,
      input.locationRating,
    );

    property.freeWiFiRating = calcNewAvg(
      property.freeWiFiRating,
      input.freeWiFiRating,
    );

    // Update total reviews count
    property.totalReviews = newTotalReviews;

    // Save updated property
    await property.save();

    return createdReview;
  }
}
