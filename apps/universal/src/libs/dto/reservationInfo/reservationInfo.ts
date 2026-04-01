import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class ReservationInfo {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  guestId: string;

  @Field(() => String)
  guestName: string;

  @Field(() => String, { nullable: true })
  guestLastName?: string;

  @Field(() => String)
  guestEmail: string;

  @Field(() => String)
  guestPhoneNumber: string;

  @Field(() => Boolean)
  travelForWork: boolean;

  @Field(() => String, { nullable: true })
  stripePaymentIntentId?: string;

  @Field(() => String, { nullable: true })
  paymentStatus?: string;

  @Field(() => Int, { nullable: true })
  paymentAmount?: number;

  @Field(() => String)
  roomId: string;

  @Field(() => String)
  propertyId: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;

  @Field(() => Boolean)
  ageConfirmation: boolean;

  @Field(() => String, { nullable: true })
  reservationStatus?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class RevenueDataPoint {
  @Field(() => String)
  month: string;

  @Field(() => Int)
  revenue: number;
}

@ObjectType()
export class StripePaymentIntent {
  @Field(() => String)
  clientSecret: string;
}
