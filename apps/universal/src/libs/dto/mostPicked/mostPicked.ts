import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MostPickedItem {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  itemType: string; // 'PROPERTY' or 'ATTRACTION'

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => Int, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int, { nullable: true })
  totalReviews?: number;

  @Field(() => Int, { nullable: true })
  views?: number;

  @Field(() => Int, { nullable: true })
  likes?: number;

  @Field(() => String, { nullable: true })
  propertyType?: string;

  @Field(() => String, { nullable: true })
  attractionType?: string;
}
