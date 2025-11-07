import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { GuestAuthType, GuestStatus, GuestType } from '../../enums/user.enum';

@ObjectType()
export class User {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => GuestType)
  guestType: GuestType;

  @Field(() => GuestStatus)
  guestStatus: GuestStatus;

  @Field(() => GuestAuthType)
  guestAuthType: GuestAuthType;

  @Field(() => String)
  guestPhone: string;

  @Field(() => String)
  guestName: string;

  guestPassword: string;

  @Field(() => String, { nullable: true })
  guestFullName?: string;

  @Field(() => String, { nullable: true })
  guestImage?: string;

  @Field(() => String)
  guestCountry: string;

  @Field(() => String)
  guestRegion: string;

  @Field(() => Int)
  guestPoints: number;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  accessToken?: string;
}

@ObjectType()
export class TotalCounter {
  @Field(() => Int, { nullable: true })
  total?: number;
}

@ObjectType()
export class Users {
  @Field(() => [User])
  list: User[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
