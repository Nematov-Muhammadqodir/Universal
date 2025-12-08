import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { ReviewInput } from '../../libs/dto/review/review.input';
import { Review } from '../../libs/dto/review/review';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums/user.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Roles(UserRole.GUEST)
  @UseGuards(RolesGuard)
  @Mutation(() => Review)
  public async submitReview(
    @Args('input') input: ReviewInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Review> {
    console.log('Resolver - submitReview', input);
    input.reviewRefId = shapeIntoMongoObjectId(input.reviewRefId);
    return await this.reviewService.submitReview(input, memberId);
  }
}
