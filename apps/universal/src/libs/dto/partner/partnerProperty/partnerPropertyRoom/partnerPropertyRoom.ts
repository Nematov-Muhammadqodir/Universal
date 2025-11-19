import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  BathroomFacilities,
  RoomFacilities,
  RoomNames,
  RoomTypes,
} from 'apps/universal/src/libs/enums/propertyRoom.enum';

@ObjectType()
export class AvailableBeds {
  @Field(() => Int)
  single: number;

  @Field(() => Int)
  double: number;

  @Field(() => Int)
  king: number;

  @Field(() => Int)
  superKing: number;
}

@ObjectType()
export class PartnerPropertyRoom {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  propertyId: string;

  @Field(() => RoomTypes)
  roomType: RoomTypes;

  @Field(() => Int)
  currentRoomTypeAmount: number;

  @Field(() => AvailableBeds)
  availableBeds: AvailableBeds;

  @Field(() => Int)
  numberOfGuestsCanStay: number;

  @Field(() => Boolean)
  isSmokingAllowed: boolean;

  @Field(() => Boolean)
  isBathroomPrivate: boolean;

  @Field(() => [BathroomFacilities])
  availableBathroomFacilities: BathroomFacilities[];

  @Field(() => [RoomFacilities])
  roomFacilities: RoomFacilities[];

  @Field(() => RoomNames)
  roomName: RoomNames;

  @Field(() => String)
  roomPricePerNight: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
