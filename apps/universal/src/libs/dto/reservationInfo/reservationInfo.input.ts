import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

@InputType()
export class ReservationInfoInput {
  @IsNotEmpty()
  @Field(() => String)
  guestId: string;

  @IsNotEmpty()
  @Length(1, 50)
  @Field(() => String)
  guestName: string;

  @IsOptional()
  @Length(1, 50)
  @Field(() => String, { nullable: true })
  guestLastName?: string;

  @IsNotEmpty()
  @Field(() => String)
  guestEmail: string;

  @IsNotEmpty()
  @Field(() => String)
  guestPhoneNumber: string;

  @IsNotEmpty()
  @IsBoolean()
  @Field(() => Boolean)
  travelForWork: boolean;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  stripePaymentIntentId: string;

  @IsNotEmpty()
  @IsNumber()
  @Field(() => Int)
  paymentAmount: number;

  @IsNotEmpty()
  @Field(() => String)
  roomId: string;

  @IsNotEmpty()
  @Field(() => String)
  propertyId: string;

  @IsNotEmpty()
  @Field(() => String)
  startDate: string;

  @IsNotEmpty()
  @Field(() => String)
  endDate: string;

  @IsNotEmpty()
  @IsBoolean()
  @Field(() => Boolean)
  ageConfirmation: boolean;
}

@InputType()
export class CreatePaymentIntentInput {
  @IsNotEmpty()
  @IsNumber()
  @Field(() => Int)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  roomId: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  propertyId: string;
}
