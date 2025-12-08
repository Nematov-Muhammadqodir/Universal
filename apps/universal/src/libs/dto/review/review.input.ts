import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class ReviewInput {
  @IsNotEmpty()
  @Field(() => String)
  reviewRefId: ObjectId;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: ObjectId;

  @IsNotEmpty()
  @Field(() => Number)
  staffRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  facilitiesRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  cleanlessRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  comfortRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  valueOfMoneyRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  locationRating: number;

  @IsNotEmpty()
  @Field(() => Number)
  freeWiFiRating: number;
}
