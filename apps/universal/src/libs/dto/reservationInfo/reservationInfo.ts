import { Field, ObjectType, ID } from '@nestjs/graphql';
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

  @Field(() => String)
  cardholderName: string;

  @Field(() => String)
  cardNumber: string;

  @Field(() => String)
  expiryDate: string;

  @Field(() => String)
  cvs: string;

  @Field(() => String)
  roomId: string;

  @Field(() => Boolean)
  ageConfirmation: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
