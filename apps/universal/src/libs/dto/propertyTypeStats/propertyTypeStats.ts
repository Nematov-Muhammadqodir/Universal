import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PropertyTypeStats {
  @Field(() => String)
  propertyType: string;

  @Field(() => Int)
  count: number;

  @Field(() => String, { nullable: true })
  image?: string;
}
