import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AiAgentService } from './ai-agent.service';
import { PartnerAiAgentService } from './partner-ai-agent.service';
import { AdminAiAgentService } from './admin-ai-agent.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()
export class AiAgentResolver {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly partnerAiAgentService: PartnerAiAgentService,
    private readonly adminAiAgentService: AdminAiAgentService,
  ) {}

  @Query(() => String)
  async askAiAgent(@Args('question') question: string): Promise<string> {
    return await this.aiAgentService.askAgent(question);
  }

  @UseGuards(WithoutGuard)
  @Mutation(() => String)
  async askPartnerAiAgent(
    @Args('question') question: string,
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('partnerFirstName') firstName: string,
    @AuthMember('partnerLastName') lastName: string,
  ): Promise<string> {
    const partnerName =
      `${firstName || ''} ${lastName || ''}`.trim() || 'Partner';
    return await this.partnerAiAgentService.askPartnerAgent(
      question,
      memberId.toString(),
      partnerName,
    );
  }

  @UseGuards(WithoutGuard)
  @Mutation(() => String)
  async askAdminAiAgent(@Args('question') question: string): Promise<string> {
    return await this.adminAiAgentService.askAdminAgent(question);
  }
}
