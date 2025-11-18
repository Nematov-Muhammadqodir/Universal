import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class PartnerProperty {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  partnerId: string;

  @Field(() => String)
  propertyType: string;

  @Field(() => String)
  propertyCountry: string;

  @Field(() => String)
  propertyRegion: string;

  @Field(() => String)
  propertyCity: string;

  @Field(() => String)
  propertyPostCode: string;

  @Field(() => String)
  propertyName: string;

  @Field(() => Number)
  propertyStars: number;

  @Field(() => [String])
  propertyFacilities: string[];

  @Field(() => Boolean)
  breakfastIncluded: boolean;

  @Field(() => Boolean)
  parkingIncluded: boolean;

  @Field(() => [String])
  hotelStaffLanguages: string[];

  @Field(() => String)
  checkInTimeFrom: string;

  @Field(() => String)
  checkInTimeUntill: string;

  @Field(() => String)
  checkOutTimeFrom: string;

  @Field(() => String)
  checkOutTimeUntill: string;

  @Field(() => Boolean)
  allowChildren: boolean;

  @Field(() => Boolean)
  allowPets: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
