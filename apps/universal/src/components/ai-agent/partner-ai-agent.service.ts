import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { buildPartnerMcpServer } from './tools/server';
import { runClaudeAgent } from './tools/run-agent';

@Injectable()
export class PartnerAiAgentService {
  private readonly logger = new Logger(PartnerAiAgentService.name);

  constructor(
    @InjectModel('PartnerPropertySchema') private readonly propertyModel: Model<any>,
    @InjectModel('PartnerPropertyRoomSchema') private readonly roomModel: Model<any>,
    @InjectModel('AttractionSchema') private readonly attractionModel: Model<any>,
    @InjectModel('ReservationInfoSchema') private readonly reservationModel: Model<any>,
    @InjectModel('AttractionReservation') private readonly attractionReservationModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
  ) {}

  async askPartnerAgent(question: string, partnerId: string, partnerName: string): Promise<string> {
    this.logger.log(`Partner AI Agent query from ${partnerId} (${partnerName}): ${question.slice(0, 100)}`);

    const systemPrompt = `You are an AI business assistant for ${partnerName} on LankaStay — a hotel and attraction booking platform.
You help this partner manage their business by querying ONLY their own data (properties, rooms, attractions, reservations, reviews).

All queries are automatically scoped to this partner's data — you cannot see other partners' data.

Key information:
- Room prices are in KRW (Korean Won), stored in roomPricePerNight.
- Attraction prices: attractionAdultPrice, attractionChildPrice (KRW).
- Reservation statuses: PENDING, CONFIRMED, CANCELLED, REFUNDED.
- Property ratings are 1-10 scale, attraction ratings are 1-5 scale.

When answering:
- Use tools to fetch real data before answering.
- Be specific: include names, dates, amounts.
- Format currency nicely (KRW with commas).
- Provide actionable business insights when relevant.
- If a query returns no results, say so clearly.
- Answer in the same language the user asked in.`;

    const mcpServer = buildPartnerMcpServer(
      {
        propertyModel: this.propertyModel,
        roomModel: this.roomModel,
        attractionModel: this.attractionModel,
        reservationModel: this.reservationModel,
        attractionReservationModel: this.attractionReservationModel,
        commentModel: this.commentModel,
      },
      partnerId,
    );

    return runClaudeAgent({
      question,
      systemPrompt,
      mcpServer,
      mcpServerName: 'lankastay-partner-agent',
      maxTurns: 6,
      logger: this.logger,
      logLabel: 'Partner',
    });
  }
}
