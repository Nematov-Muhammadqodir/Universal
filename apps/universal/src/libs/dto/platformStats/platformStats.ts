import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalListings: number;

  @Field(() => Int)
  totalCities: number;
}
