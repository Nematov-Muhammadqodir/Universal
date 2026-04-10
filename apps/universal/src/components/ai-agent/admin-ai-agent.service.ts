import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GoogleGenerativeAI,
  SchemaType,
  Tool as GeminiTool,
  Content,
} from '@google/generative-ai';

@Injectable()
export class AdminAiAgentService {
  private readonly logger = new Logger(AdminAiAgentService.name);
  private genAI: GoogleGenerativeAI;

  private readonly geminiTools: GeminiTool[] = [
    {
      functionDeclarations: [
        {
          name: 'query_collection',
          description:
            'Query any collection in the database. Collections: properties (partnersProperties), rooms (partnerPropertyRooms), ' +
            'attractions, reservations (reservationinfos), attractionReservations, comments, guests, partners, notifications, messages, conversations. ' +
            'Property fields: propertyName, propertyType, propertyCity, propertyRegion, propertyCountry, propertyStars, propertyViews, propertyLikes, propertyStatus, partnerId, totalReviews, staffRating, etc. ' +
            'Room fields: roomType, roomName, roomPricePerNight, numberOfGuestsCanStay, propertyId. ' +
            'Attraction fields: attractionName, attractionType, attractionCity, attractionAdultPrice, attractionViews, attractionLikes, totalReviews, averageRating, partnerId. ' +
            'Reservation fields: guestId, guestName, guestEmail, roomId, propertyId, startDate, endDate, paymentAmount, paymentStatus, reservationStatus. ' +
            'Guest fields: guestName, guestEmail, guestPhone, guestCountry, guestRegion, guestPoints, userRole, guestStatus. ' +
            'Partner fields: partnerEmail, partnerFirstName, partnerLastName, partnerPhoneNumber, partnerType, userRole, memberStatus.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: {
                type: SchemaType.STRING,
                description: 'Collection: properties, rooms, attractions, reservations, attractionReservations, comments, guests, partners, notifications, messages',
              },
              filter: { type: SchemaType.STRING, description: 'MongoDB filter JSON' },
              sort: { type: SchemaType.STRING, description: 'MongoDB sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' },
              projection: { type: SchemaType.STRING, description: 'Fields to include JSON' },
            },
            required: ['collection'],
          },
        },
        {
          name: 'count_collection',
          description: 'Count documents in any collection with optional filter.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: { type: SchemaType.STRING, description: 'Collection name' },
              filter: { type: SchemaType.STRING, description: 'MongoDB filter JSON' },
            },
            required: ['collection'],
          },
        },
        {
          name: 'aggregate_collection',
          description: 'Run MongoDB aggregation on any collection. Use for analytics, grouping, averages, sums, trends.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: { type: SchemaType.STRING, description: 'Collection name' },
              pipeline: { type: SchemaType.STRING, description: 'Aggregation pipeline JSON array' },
            },
            required: ['collection', 'pipeline'],
          },
        },
        {
          name: 'get_platform_overview',
          description: 'Get comprehensive platform statistics: total users, partners, properties, attractions, reservations, revenue, etc.',
          parameters: { type: SchemaType.OBJECT, properties: {} },
        },
      ],
    },
  ];

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
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  private getModel(collection: string): Model<any> | null {
    const map: Record<string, Model<any>> = {
      properties: this.propertyModel,
      rooms: this.roomModel,
      attractions: this.attractionModel,
      reservations: this.reservationModel,
      attractionReservations: this.attractionReservationModel,
      comments: this.commentModel,
      guests: this.guestModel,
      partners: this.partnerModel,
      notifications: this.notificationModel,
      messages: this.messageModel,
    };
    return map[collection] || null;
  }

  private safeJson(value: any, fallback: any = {}): any {
    if (typeof value === 'object' && value !== null) return value;
    if (typeof value === 'string') { try { return JSON.parse(value); } catch { return fallback; } }
    return fallback;
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    try {
      switch (name) {
        case 'query_collection': {
          const model = this.getModel(args.collection);
          if (!model) return { error: `Unknown collection: ${args.collection}` };
          const filter = this.safeJson(args.filter, {});
          const sort = this.safeJson(args.sort, {});
          const projection = this.safeJson(args.projection, {});
          return await model.find(filter, projection).sort(sort).limit(args.limit ?? 10).lean();
        }
        case 'count_collection': {
          const model = this.getModel(args.collection);
          if (!model) return { error: `Unknown collection` };
          return { collection: args.collection, count: await model.countDocuments(this.safeJson(args.filter, {})) };
        }
        case 'aggregate_collection': {
          const model = this.getModel(args.collection);
          if (!model) return { error: `Unknown collection` };
          return await model.aggregate(this.safeJson(args.pipeline, []));
        }
        case 'get_platform_overview': {
          const [guests, partners, properties, attractions, hotelRes, attrRes] = await Promise.all([
            this.guestModel.countDocuments(),
            this.partnerModel.countDocuments(),
            this.propertyModel.countDocuments({ propertyStatus: 'ACTIVE' }),
            this.attractionModel.countDocuments({ attractionStatus: 'ACTIVE' }),
            this.reservationModel.aggregate([
              { $match: { paymentStatus: 'succeeded' } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
            this.attractionReservationModel.aggregate([
              { $match: { paymentStatus: 'succeeded' } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
          ]);
          return {
            totalGuests: guests, totalPartners: partners,
            activeProperties: properties, activeAttractions: attractions,
            hotelReservations: hotelRes[0]?.count || 0, hotelRevenue: hotelRes[0]?.total || 0,
            attractionReservations: attrRes[0]?.count || 0, attractionRevenue: attrRes[0]?.total || 0,
            totalRevenue: (hotelRes[0]?.total || 0) + (attrRes[0]?.total || 0),
          };
        }
        default: return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Admin tool error [${name}]:`, error);
      return { error: error.message };
    }
  }

  async askAdminAgent(question: string): Promise<string> {
    const systemPrompt = `You are an AI admin assistant for LankaStay — a hotel and attraction booking platform.
You have FULL access to ALL data in the platform database. You can query any collection, count documents, and run aggregations.

Available collections: properties, rooms, attractions, reservations, attractionReservations, comments, guests, partners, notifications, messages.

You help the admin with:
- Platform analytics (revenue, user growth, booking trends)
- Finding specific users, partners, properties, or reservations
- Identifying issues (low ratings, cancelled reservations, blocked users)
- Business insights (top performing properties, popular cities, revenue by month)

Format prices in KRW with commas. Be precise with data. Answer in the user's language.`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools: this.geminiTools,
    });

    const chat = model.startChat();
    let response = await chat.sendMessage(question);

    while (true) {
      const candidate = response.response.candidates?.[0];
      if (!candidate) break;
      const functionCalls = candidate.content.parts.filter((part) => part.functionCall);
      if (functionCalls.length === 0) break;

      const functionResponses: Content = { role: 'function' as const, parts: [] };
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        this.logger.log(`Admin tool: ${name} args: ${JSON.stringify(args)}`);
        const result = await this.executeTool(name, args);
        functionResponses.parts.push({ functionResponse: { name, response: { result } } });
      }
      response = await chat.sendMessage(functionResponses.parts);
    }

    return response.response.text();
  }
}
