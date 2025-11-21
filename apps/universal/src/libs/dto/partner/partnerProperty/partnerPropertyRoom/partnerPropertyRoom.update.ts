import { ObjectId } from 'mongoose';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class AvailableBedsInput {
  @Field(() => Int)
  single: number;

  @Field(() => Int)
  double: number;

  @Field(() => Int)
  king: number;

  @Field(() => Int)
  superKing: number;
}

@InputType()
export class ReservedDateInput {
  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => Date)
  from: Date;

  @Field(() => Date)
  until: Date;
}
@InputType()
export class PartnerPropertyRoomUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @Field(() => [ReservedDateInput], { nullable: true })
  reservedDates?: ReservedDateInput[];
}
