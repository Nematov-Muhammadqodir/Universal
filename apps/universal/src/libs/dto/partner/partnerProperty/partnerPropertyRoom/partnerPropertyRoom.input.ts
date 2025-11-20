import { ObjectId } from 'mongoose';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import {
  BathroomFacilities,
  RoomFacilities,
  RoomNames,
  RoomTypes,
} from 'apps/universal/src/libs/enums/propertyRoom.enum';

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
export class PartnerPropertyRoomInput {
  @IsNotEmpty()
  @Field(() => String)
  propertyId: string;

  @IsNotEmpty()
  @Field(() => RoomTypes)
  roomType: RoomTypes;

  @IsNotEmpty()
  @Field(() => Int)
  currentRoomTypeAmount: number;

  @IsNotEmpty()
  @Field(() => AvailableBedsInput)
  availableBeds: AvailableBedsInput;

  @IsNotEmpty()
  @Field(() => Int)
  numberOfGuestsCanStay: number;

  @IsNotEmpty()
  @Field(() => Boolean)
  isSmokingAllowed: boolean;

  @IsNotEmpty()
  @Field(() => Boolean)
  isBathroomPrivate: boolean;

  @IsNotEmpty()
  @Field(() => [BathroomFacilities])
  availableBathroomFacilities: BathroomFacilities[];

  @IsNotEmpty()
  @Field(() => [RoomFacilities])
  roomFacilities: RoomFacilities[];

  @IsNotEmpty()
  @Field(() => RoomNames)
  roomName: RoomNames;

  @IsNotEmpty()
  @Field(() => String)
  roomPricePerNight: string;
}
