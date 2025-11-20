import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import {
  HotelStaffLanguages,
  PropertyFacilities,
  PropertyType,
} from '../../../enums/property.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class PartnerPropertyUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @Field(() => [String])
  propertyImages: string[];
}
