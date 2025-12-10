import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CommentStatus } from '../../enums/comment.enum';
import { Guest, TotalCounter } from '../user/user';

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

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  /** from aggregation **/

  @Field(() => Guest, { nullable: true })
  memberData?: Guest;
}

@ObjectType()
export class Comments {
  @Field(() => [Comment])
  list: Comment[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
