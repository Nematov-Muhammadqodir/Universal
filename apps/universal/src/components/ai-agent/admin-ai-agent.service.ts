import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { buildAdminMcpServer } from './tools/server';
import { runClaudeAgent } from './tools/run-agent';

@Injectable()
export class AdminAiAgentService {
  private readonly logger = new Logger(AdminAiAgentService.name);

  constructor(
    @InjectModel('PartnerPropertySchema') private readonly propertyModel: Model<any>,
    @InjectModel('PartnerPropertyRoomSchema') private readonly roomModel: Model<any>,
    @InjectModel('AttractionSchema') private readonly attractionModel: Model<any>,
    @InjectModel('ReservationInfoSchema') private readonly reservationModel: Model<any>,
    @InjectModel('AttractionReservation') private readonly attractionReservationModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
    @InjectModel('Guest') private readonly guestModel: Model<any>,
    @InjectModel('Partner') private readonly partnerModel: Model<any>,
    @InjectModel('Notification') private readonly notificationModel: Model<any>,
    @InjectModel('Message') private readonly messageModel: Model<any>,
  ) {}

  private readonly systemPrompt = `You are an AI admin assistant for LankaStay — a hotel and attraction booking platform.
You have FULL access to ALL data in the platform database. You can query any collection, count documents, and run aggregations.

Available collections: properties, rooms, attractions, reservations, attractionReservations, comments, guests, partners, notifications, messages.

You help the admin with:
- Platform analytics (revenue, user growth, booking trends).
- Finding specific users, partners, properties, or reservations.
- Identifying issues (low ratings, cancelled reservations, blocked users).
- Business insights (top performing properties, popular cities, revenue by month).

Format prices in KRW with commas. Be precise with data. Use tools to fetch real data before answering. Answer in the user's language.`;

  async askAdminAgent(question: string): Promise<string> {
    this.logger.log(`Admin AI Agent query: ${question.slice(0, 100)}`);

    const mcpServer = buildAdminMcpServer({
      propertyModel: this.propertyModel,
      roomModel: this.roomModel,
      attractionModel: this.attractionModel,
      reservationModel: this.reservationModel,
      attractionReservationModel: this.attractionReservationModel,
      commentModel: this.commentModel,
      guestModel: this.guestModel,
      partnerModel: this.partnerModel,
      notificationModel: this.notificationModel,
      messageModel: this.messageModel,
    });

    return runClaudeAgent({
      question,
      systemPrompt: this.systemPrompt,
      mcpServer,
      mcpServerName: 'lankastay-admin-agent',
      maxTurns: 6,
      logger: this.logger,
      logLabel: 'Admin',
    });
  }
}
