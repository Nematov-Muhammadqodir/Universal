import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MessageService } from './message.service';
import { Message, Conversation } from '../../libs/dto/message/message';
import { SendMessageInput } from '../../libs/dto/message/message.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Message)
  public async sendMessage(
    @Args('input') input: SendMessageInput,
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('userRole') userRole: string,
  ): Promise<Message> {
    const senderRole = ['Hotel Owner', 'Attraction Owner'].includes(userRole)
      ? 'PARTNER'
      : 'GUEST';
    return await this.messageService.sendMessage(
      memberId.toString(),
      senderRole,
      input,
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => [Message])
  public async getConversationMessages(
    @Args('conversationId') conversationId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Message[]> {
    return await this.messageService.getConversationMessages(
      conversationId,
      memberId.toString(),
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => [Conversation])
  public async getMyConversations(
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('userRole') userRole: string,
  ): Promise<Conversation[]> {
    const role = ['Hotel Owner', 'Attraction Owner'].includes(userRole)
      ? 'PARTNER'
      : 'GUEST';
    return await this.messageService.getMyConversations(
      memberId.toString(),
      role,
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => Conversation)
  public async getOrCreateConversation(
    @Args('receiverId') receiverId: string,
    @Args('propertyId', { nullable: true }) propertyId: string,
    @Args('attractionId', { nullable: true }) attractionId: string,
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('userRole') userRole: string,
  ): Promise<Conversation> {
    const senderRole = ['Hotel Owner', 'Attraction Owner'].includes(userRole)
      ? 'PARTNER'
      : 'GUEST';
    return await this.messageService.getOrCreateConversation(
      memberId.toString(),
      receiverId,
      senderRole,
      propertyId,
      attractionId,
    );
  }
}
