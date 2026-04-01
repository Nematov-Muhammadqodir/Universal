import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class AttractionReservationInput {
  @IsNotEmpty()
  @Field(() => String)
  guestId: string;

  @IsNotEmpty()
  @Field(() => String)
  attractionId: string;

  @IsNotEmpty()
  @Field(() => String)
  guestName: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestLastName?: string;

  @IsNotEmpty()
  @Field(() => String)
  guestEmail: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestPhoneNumber?: string;

  @IsNotEmpty()
  @Field(() => Int)
  ticketCount: number;

  @IsNotEmpty()
  @Field(() => String)
  selectedDate: string;

  @IsNotEmpty()
  @Field(() => String)
  selectedTime: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  stripePaymentIntentId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  paymentStatus?: string;

  @IsNotEmpty()
  @Field(() => Int)
  paymentAmount: number;
}

@InputType()
export class CreateAttractionPaymentIntentInput {
  @IsNotEmpty()
  @Field(() => Int)
  amount: number;

  @IsNotEmpty()
  @Field(() => String)
  attractionId: string;
}
