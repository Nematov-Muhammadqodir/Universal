import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import {
  CommentInput,
  CommentsInquiry,
} from '../../libs/dto/comment/comment.input';
import { OrdinaryInquery } from '../../libs/dto/partner/partnerProperty/partnerProperty.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()
export class CommentResolver {
  constructor(private commentService: CommentService) {}

  @UseGuards(AuthGuard)
  @Mutation((returns) => Comment)
  public async createComment(
    @Args('input') input: CommentInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comment> {
    console.log('Mutation: createComment');
    return await this.commentService.createComment(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation((returns) => Comment)
  public async updateComment(
    @Args('input') input: CommentUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comment> {
    console.log('Mutation: updateComment');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.commentService.updateComment(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation((returns) => Comment)
  public async likeComment(
    @Args('commentId') commentId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comment> {
    console.log('Mutation: likeComment');
    return await this.commentService.likeComment(
      memberId,
      shapeIntoMongoObjectId(commentId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation((returns) => Comment)
  public async dislikeComment(
    @Args('commentId') commentId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comment> {
    console.log('Mutation: dislikeComment');
    return await this.commentService.dislikeComment(
      memberId,
      shapeIntoMongoObjectId(commentId),
    );
  }

  @UseGuards(AuthGuard)
  @Query((returns) => Comments)
  public async getMyComments(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comments> {
    console.log('Query: getMyComments');
    return await this.commentService.getMyComments(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => Comments)
  public async getComments(
    @Args('input') input: CommentsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comments> {
    console.log('Query: getComments');
    input.search.commentRefId = shapeIntoMongoObjectId(
      input.search.commentRefId,
    );
    return await this.commentService.getComments(memberId, input);
  }
}
