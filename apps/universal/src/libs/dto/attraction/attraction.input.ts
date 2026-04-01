import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { AttractionStatus, AttractionType } from '../../enums/attraction.enum';

@InputType()
export class FaqItemInput {
  @IsNotEmpty()
  @Field(() => String)
  question: string;

  @IsNotEmpty()
  @Field(() => String)
  answer: string;
}

@InputType()
export class AttractionInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  partnerId?: ObjectId;

  @IsNotEmpty()
  @Field(() => AttractionType)
  attractionType: AttractionType;

  @IsNotEmpty()
  @Field(() => String)
  attractionName: string;

  @IsNotEmpty()
  @Field(() => String)
  attractionDescription: string;

  @IsNotEmpty()
  @Field(() => String)
  attractionCountry: string;

  @IsNotEmpty()
  @Field(() => String)
  attractionRegion: string;

  @IsNotEmpty()
  @Field(() => String)
  attractionCity: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionImages?: string[];

  @IsNotEmpty()
  @Field(() => Int)
  attractionAdultPrice: number;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  attractionChildPrice?: number;

  @IsNotEmpty()
  @Field(() => String)
  attractionDuration: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionHighlights?: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionIncludes?: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionExcludes?: string[];

  @IsOptional()
  @Field(() => [FaqItemInput], { nullable: true })
  faqItems?: FaqItemInput[];

  @IsOptional()
  @Field(() => Int, { nullable: true })
  maxParticipants?: number;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  freeCancellation?: boolean;
}

@InputType()
export class AttractionUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Field(() => AttractionType, { nullable: true })
  attractionType?: AttractionType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionDescription?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionCountry?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionRegion?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionCity?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionImages?: string[];

  @IsOptional()
  @Field(() => Int, { nullable: true })
  attractionAdultPrice?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  attractionChildPrice?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionDuration?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionHighlights?: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionIncludes?: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  attractionExcludes?: string[];

  @IsOptional()
  @Field(() => [FaqItemInput], { nullable: true })
  faqItems?: FaqItemInput[];

  @IsOptional()
  @Field(() => Int, { nullable: true })
  maxParticipants?: number;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  freeCancellation?: boolean;

  @IsOptional()
  @Field(() => AttractionStatus, { nullable: true })
  attractionStatus?: AttractionStatus;
}

@InputType()
export class AttractionsInquiry {
  @IsNotEmpty()
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => AttractionType, { nullable: true })
  attractionType?: AttractionType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionCity?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionCountry?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;
}
