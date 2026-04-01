import { Field, Int, ObjectType, Float } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { TotalCounter } from '../user/user';
import { Partner } from '../partner/partner';
import { MeLiked } from '../like/like';
import { AttractionStatus, AttractionType } from '../../enums/attraction.enum';

@ObjectType()
export class FaqItem {
  @Field(() => String, { nullable: true })
  question?: string;

  @Field(() => String, { nullable: true })
  answer?: string;
}

@ObjectType()
export class Attraction {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  partnerId: ObjectId;

  @Field(() => AttractionType)
  attractionType: AttractionType;

  @Field(() => String)
  attractionName: string;

  @Field(() => String)
  attractionDescription: string;

  @Field(() => String)
  attractionCountry: string;

  @Field(() => String)
  attractionRegion: string;

  @Field(() => String)
  attractionCity: string;

  @Field(() => [String])
  attractionImages: string[];

  @Field(() => Int)
  attractionAdultPrice: number;

  @Field(() => Int)
  attractionChildPrice: number;

  @Field(() => String)
  attractionDuration: string;

  @Field(() => [String])
  attractionHighlights: string[];

  @Field(() => [String])
  attractionIncludes: string[];

  @Field(() => [String])
  attractionExcludes: string[];

  @Field(() => [FaqItem], { nullable: true })
  faqItems?: FaqItem[];

  @Field(() => Int)
  maxParticipants: number;

  @Field(() => Boolean)
  freeCancellation: boolean;

  @Field(() => AttractionStatus)
  attractionStatus: AttractionStatus;

  @Field(() => Int)
  attractionViews: number;

  @Field(() => Int)
  attractionLikes: number;

  @Field(() => Int)
  totalReviews: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Partner, { nullable: true })
  memberData?: Partner;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];
}

@ObjectType()
export class Attractions {
  @Field(() => [Attraction])
  list: Attraction[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
