import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import {
  GuestAuthType,
  GuestGender,
  GuestStatus,
  GuestType,
  UserRole,
} from '../../enums/user.enum';

@ObjectType()
export class Guest {
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

  @Field(() => GuestGender)
  guestGender: GuestGender;

  @Field(() => String)
  guestName: string;

  guestPassword: string;

  @Field(() => String, { nullable: true })
  guestFullName?: string;

  @Field(() => String)
  guestImage: string;

  @Field(() => String)
  guestCountry: string;

  @Field(() => String)
  guestRegion: string;

  @Field(() => Int)
  guestPoints: number;

  @Field(() => UserRole)
  userRole: UserRole;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  accessToken?: string;
  memberStatus: any;
}

@ObjectType()
export class TotalCounter {
  @Field(() => Int, { nullable: true })
  total?: number;
}

@ObjectType()
export class Guests {
  @Field(() => [Guest])
  list: Guest[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
