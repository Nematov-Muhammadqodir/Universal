import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { buildGeneralMcpServer } from './tools/server';
import { runClaudeAgent } from './tools/run-agent';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    @InjectModel('PartnerPropertySchema') private readonly propertyModel: Model<any>,
    @InjectModel('PartnerPropertyRoomSchema') private readonly roomModel: Model<any>,
    @InjectModel('AttractionSchema') private readonly attractionModel: Model<any>,
    @InjectModel('ReservationInfoSchema') private readonly reservationModel: Model<any>,
    @InjectModel('AttractionReservation') private readonly attractionReservationModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
    @InjectModel('Guest') private readonly guestModel: Model<any>,
  ) {}

  private readonly systemPrompt = `You are a helpful AI travel assistant for LankaStay — a hotel and attraction booking platform.
You have access to tools that query the MongoDB database to answer user questions about hotels, attractions, rooms, reservations, and reviews.

Key information about the platform:
- Hotels/Properties have types: Hotel, Guest House, Bed and Breakfast, Homestay, Hostel, Resort, Motel, Lodge.
- Properties have ratings (1-10 scale): staffRating, facilitiesRating, cleanlessRating, comfortRating, valueOfMoneyRating, locationRating, freeWiFiRating.
- Room prices are stored in roomPricePerNight (KRW - Korean Won). For cheapest room use query_rooms with sort {"roomPricePerNight": 1} and limit 1. For most expensive sort {"roomPricePerNight": -1}.
- Attraction types: Tour, Museum, Theme Park, Show, Activity, Landmark, Water Park, Zoo.
- Attraction prices: attractionAdultPrice, attractionChildPrice (in KRW).
- Attractions have ratings (1-5 scale): averageRating, valueRating, facilitiesRating, qualityRating, accessRating.
- Reservation statuses: PENDING, CONFIRMED, CANCELLED, REFUNDED.

When answering:
- Use tools to fetch real data before responding — do not make up numbers.
- Be specific: include names, prices, locations, ratings from actual results.
- Format prices nicely with KRW and commas (e.g. KRW 150,000).
- If no results found, say so clearly and suggest alternatives.
- Answer in the same language the user asked in.
- Be friendly and concise, like a travel concierge.`;

  async askAgent(question: string): Promise<string> {
    this.logger.log(`General AI Agent query: ${question.slice(0, 100)}`);

    const mcpServer = buildGeneralMcpServer({
      propertyModel: this.propertyModel,
      roomModel: this.roomModel,
      attractionModel: this.attractionModel,
      reservationModel: this.reservationModel,
      attractionReservationModel: this.attractionReservationModel,
      commentModel: this.commentModel,
      guestModel: this.guestModel,
    });

    return runClaudeAgent({
      question,
      systemPrompt: this.systemPrompt,
      mcpServer,
      mcpServerName: 'lankastay-general-agent',
      maxTurns: 6,
      logger: this.logger,
      logLabel: 'General',
    });
  }
}
