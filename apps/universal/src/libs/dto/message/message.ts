import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class Message {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  conversationId: ObjectId;

  @Field(() => String)
  senderId: ObjectId;

  @Field(() => String)
  senderRole: string;

  @Field(() => String)
  messageContent: string;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Conversation {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => [String])
  participantIds: ObjectId[];

  @Field(() => [String], { nullable: true })
  participantRoles?: string[];

  @Field(() => String, { nullable: true })
  lastMessage?: string;

  @Field(() => Date, { nullable: true })
  lastMessageAt?: Date;

  @Field(() => String, { nullable: true })
  propertyId?: ObjectId;

  @Field(() => String, { nullable: true })
  attractionId?: ObjectId;

  @Field(() => Int, { nullable: true })
  unreadCount?: number;

  @Field(() => String, { nullable: true })
  otherParticipantName?: string;

  @Field(() => String, { nullable: true })
  otherParticipantImage?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
