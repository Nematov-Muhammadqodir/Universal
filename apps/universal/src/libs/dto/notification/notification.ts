import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class Notification {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  receiverId: ObjectId;

  @Field(() => String)
  notificationType: string;

  @Field(() => String)
  notificationTitle: string;

  @Field(() => String)
  notificationMessage: string;

  @Field(() => String, { nullable: true })
  notificationRefId?: ObjectId;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
