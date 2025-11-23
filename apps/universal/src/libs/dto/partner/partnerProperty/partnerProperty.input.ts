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
  @Field(() => String, { nullable: true })
  propertyRegion?: string;

  @Field(() => String, { nullable: true })
  propertyCity?: string;

  @Field(() => String, { nullable: true })
  propertyType?: string;

  @Field(() => Number, { nullable: true })
  propertyStars?: number;

  @Field(() => Boolean, { nullable: true })
  breakfastIncluded?: boolean;

  @Field(() => Boolean, { nullable: true })
  parkingIncluded?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowChildren?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowPets?: boolean;

  @Field(() => Date, { nullable: true })
  from?: Date;

  @Field(() => Date, { nullable: true })
  until?: Date;

  @Field(() => Int, { nullable: true })
  adults?: number;

  @Field(() => Int, { nullable: true })
  children?: number;

  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 6 })
  limit: number;
}

@InputType()
export class AllPropertiesSearchInput {
  @Field(() => PropertyType, { nullable: true })
  propertyType?: PropertyType;

  @Field(() => String, { nullable: true })
  propertyCity?: string;

  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 6 })
  limit: number;
}
