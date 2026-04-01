import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CommentStatus } from '../../enums/comment.enum';
import { Guest, TotalCounter } from '../user/user';
import { ReservationInfo } from '../reservationInfo/reservationInfo';
import { PartnerProperty } from '../partner/partnerProperty/partnerProperty';
import { PartnerPropertyRoom } from '../partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { Attraction } from '../attraction/attraction';

@ObjectType()
export class Comment {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => CommentStatus)
  commentStatus: CommentStatus;

  @Field(() => String)
  commentContent: string;

  @Field(() => String)
  commentRefId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => Int)
  commentScore: number;

  @Field(() => Int)
  commentLikes: number;

  @Field(() => Int)
  commentDislikes: number;

  @Field(() => [String], { nullable: true })
  likedBy?: string[];

  @Field(() => [String], { nullable: true })
  dislikedBy?: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  /** from aggregation **/

  @Field(() => Guest, { nullable: true })
  memberData?: Guest;

  @Field(() => ReservationInfo, { nullable: true })
  reservationData?: ReservationInfo;

  @Field(() => PartnerProperty, { nullable: true })
  propertyData?: PartnerProperty;

  @Field(() => Attraction, { nullable: true })
  attractionData?: Attraction;

  @Field(() => PartnerPropertyRoom, { nullable: true })
  roomData?: PartnerPropertyRoom;
}

@ObjectType()
export class Comments {
  @Field(() => [Comment])
  list: Comment[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
