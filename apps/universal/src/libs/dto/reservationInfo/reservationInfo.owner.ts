import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../user/user';

@ObjectType()
export class OwnerReservation {
  @Field(() => String)
  _id: string;

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

  @Field(() => String, { nullable: true })
  roomType?: string;

  @Field(() => String, { nullable: true })
  roomName?: string;

  @Field(() => String, { nullable: true })
  roomPricePerNight?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class OwnerReservations {
  @Field(() => [OwnerReservation])
  list: OwnerReservation[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
