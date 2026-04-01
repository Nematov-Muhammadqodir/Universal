import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Attraction } from '../attraction/attraction';

@ObjectType()
export class AttractionReservation {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  guestId: ObjectId;

  @Field(() => String)
  attractionId: ObjectId;

  @Field(() => String)
  guestName: string;

  @Field(() => String, { nullable: true })
  guestLastName?: string;

  @Field(() => String)
  guestEmail: string;

  @Field(() => String, { nullable: true })
  guestPhoneNumber?: string;

  @Field(() => Int)
  ticketCount: number;

  @Field(() => String)
  selectedDate: string;

  @Field(() => String)
  selectedTime: string;

  @Field(() => String, { nullable: true })
  stripePaymentIntentId?: string;

  @Field(() => String, { nullable: true })
  paymentStatus?: string;

  @Field(() => Int)
  paymentAmount: number;

  @Field(() => Attraction, { nullable: true })
  attractionData?: Attraction;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
