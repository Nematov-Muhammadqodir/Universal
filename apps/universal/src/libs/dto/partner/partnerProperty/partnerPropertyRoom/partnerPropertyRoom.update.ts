import { ObjectId } from 'mongoose';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { AvailableBedsInput } from './partnerPropertyRoom.input';

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

  @IsOptional()
  @Field(() => String, { nullable: true })
  roomType?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  roomName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  roomPricePerNight?: string;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  numberOfGuestsCanStay?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  currentRoomTypeAmount?: number;

  @IsOptional()
  @Field(() => AvailableBedsInput, { nullable: true })
  availableBeds?: AvailableBedsInput;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  isSmokingAllowed?: boolean;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  isBathroomPrivate?: boolean;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  roomFacilities?: string[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  availableBathroomFacilities?: string[];

  @IsOptional()
  @Field(() => [ReservedDateInput], { nullable: true })
  reservedDates?: ReservedDateInput[];
}
