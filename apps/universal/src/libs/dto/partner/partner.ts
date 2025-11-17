import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { TotalCounter } from '../user/user';
import { GuestStatus } from '../../enums/user.enum';

@ObjectType()
export class Partner {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  partnerEmail: string;

  @Field(() => String)
  partnerFirstName: string;

  @Field(() => String)
  partnerLastName: string;

  @Field(() => String)
  partnerPhoneNumber: string;

  @Field(() => String)
  partnerPassword: string;

  @Field(() => String)
  userRole: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => GuestStatus)
  memberStatus: GuestStatus;
}

@ObjectType()
export class Partners {
  @Field(() => [Partner])
  list: Partner[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
