import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
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

@InputType()
export class OrdinaryInquery {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;
}

@InputType()
export class AvailablePropertiesSearchInput {
  @Field(() => String)
  propertyRegion: string;

  @Field(() => Date)
  from: Date;

  @Field(() => Date)
  until: Date;

  @Field(() => Int)
  adults: number;

  @Field(() => Int)
  children: number;

  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 6 })
  limit: number;
}
