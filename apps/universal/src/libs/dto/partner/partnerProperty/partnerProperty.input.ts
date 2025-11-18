import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import {
  HotelStaffLanguages,
  PropertyFacilities,
  PropertyType,
} from '../../../enums/property.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class PartnerPropertyInput {
  partnerId: ObjectId;

  @IsNotEmpty()
  @Field(() => PropertyType)
  propertyType: PropertyType;

  @IsNotEmpty()
  @Field(() => String)
  propertyCountry: string;

  @IsNotEmpty()
  @Field(() => String)
  propertyRegion: string;

  @IsNotEmpty()
  @Field(() => String)
  propertyCity: string;

  @IsNotEmpty()
  @Length(1, 5)
  @Field(() => String)
  propertyPostCode: string;

  @IsNotEmpty()
  @Field(() => String)
  propertyName: string;

  @IsNotEmpty()
  @Field(() => Number)
  propertyStars: number;

  @IsNotEmpty()
  @Field(() => [PropertyFacilities])
  propertyFacilities: PropertyFacilities[];

  @IsNotEmpty()
  @Field(() => Boolean)
  breakfastIncluded: boolean;

  @IsNotEmpty()
  @Field(() => Boolean)
  parkingIncluded: boolean;

  @IsNotEmpty()
  @Field(() => [HotelStaffLanguages])
  hotelStaffLanguages: HotelStaffLanguages[];

  @IsNotEmpty()
  @Field(() => String)
  checkInTimeFrom: string;

  @IsNotEmpty()
  @Field(() => String)
  checkInTimeUntill: string;

  @IsNotEmpty()
  @Field(() => String)
  checkOutTimeFrom: string;

  @IsNotEmpty()
  @Field(() => String)
  checkOutTimeUntill: string;

  @IsNotEmpty()
  @Field(() => Boolean)
  allowChildren: boolean;

  @IsNotEmpty()
  @Field(() => Boolean)
  allowPets: boolean;
}
