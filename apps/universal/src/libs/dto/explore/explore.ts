import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExploreRegion {
  @Field(() => String)
  region: string;

  @Field(() => String)
  country: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => Int)
  propertyCount: number;

  @Field(() => Int)
  attractionCount: number;

  @Field(() => Int)
  totalListings: number;
}
