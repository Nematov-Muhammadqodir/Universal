import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class Review {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  reviewRefId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => Int)
  staffRating: number;

  @Field(() => Int)
  facilitiesRating: number;

  @Field(() => Int)
  cleanlessRating: number;

  @Field(() => Int)
  comfortRating: number;

  @Field(() => Int)
  valueOfMoneyRating: number;

  @Field(() => Int)
  locationRating: number;

  @Field(() => Int)
  freeWiFiRating: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => String, { nullable: true })
  responseForComment?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
