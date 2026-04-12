import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GoogleGenerativeAI,
  SchemaType,
  Tool as GeminiTool,
  Content,
} from '@google/generative-ai';

@Injectable()
export class PartnerAiAgentService {
  private readonly logger = new Logger(PartnerAiAgentService.name);
  private genAI: GoogleGenerativeAI;

  private readonly geminiTools: GeminiTool[] = [
    {
      functionDeclarations: [
        {
          name: 'query_my_properties',
          description:
            'Query this partner\'s own properties. Automatically filtered to only show properties owned by this partner. ' +
            'Fields: propertyName, propertyType, propertyCity, propertyRegion, propertyCountry, propertyStars, ' +
            'propertyViews, propertyLikes, propertyComments, propertyStatus, breakfastIncluded, parkingIncluded, ' +
            'totalReviews, staffRating, facilitiesRating, cleanlessRating, comfortRating, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional MongoDB filter (partner scope auto-applied)' },
              sort: { type: SchemaType.STRING, description: 'MongoDB sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' },
            },
          },
        },
        {
          name: 'query_my_rooms',
          description:
            'Query rooms belonging to this partner\'s properties. ' +
            'Fields: roomType, roomName, roomPricePerNight, numberOfGuestsCanStay, roomFacilities, ' +
            'isSmokingAllowed, isBathroomPrivate, propertyId, reservedDates, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional filter' },
              sort: { type: SchemaType.STRING, description: 'Sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results' },
            },
          },
        },
        {
          name: 'query_my_attractions',
          description:
            'Query this partner\'s own attractions. Automatically filtered to this partner. ' +
            'Fields: attractionName, attractionType, attractionCity, attractionCountry, ' +
            'attractionAdultPrice, attractionChildPrice, attractionDuration, freeCancellation, ' +
            'attractionViews, attractionLikes, totalReviews, averageRating, attractionStatus, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional filter' },
              sort: { type: SchemaType.STRING, description: 'Sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results' },
            },
          },
        },
        {
          name: 'query_my_hotel_reservations',
          description:
            'Query hotel reservations for this partner\'s properties. ' +
            'Fields: guestName, guestLastName, guestEmail, guestPhoneNumber, startDate, endDate, ' +
            'paymentStatus, paymentAmount, reservationStatus, roomId, propertyId, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional filter' },
              sort: { type: SchemaType.STRING, description: 'Sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results' },
            },
          },
        },
        {
          name: 'query_my_attraction_reservations',
          description:
            'Query attraction ticket reservations for this partner\'s attractions. ' +
            'Fields: guestName, guestEmail, ticketCount, selectedDate, selectedTime, ' +
            'paymentStatus, paymentAmount, reservationStatus, attractionId, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional filter' },
              sort: { type: SchemaType.STRING, description: 'Sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results' },
            },
          },
        },
        {
          name: 'query_my_reviews',
          description:
            'Query guest reviews/comments on this partner\'s properties or attractions. ' +
            'Fields: commentContent, commentScore, commentLikes, commentDislikes, memberId, createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'Additional filter' },
              sort: { type: SchemaType.STRING, description: 'Sort JSON' },
              limit: { type: SchemaType.NUMBER, description: 'Max results' },
            },
          },
        },
        {
          name: 'get_my_dashboard_stats',
          description:
            'Get comprehensive dashboard statistics for this partner: total properties, rooms, attractions, ' +
            'reservations, revenue, average ratings, views, and likes.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {},
          },
        },
        {
          name: 'get_revenue_breakdown',
          description: 'Get monthly revenue breakdown for this partner from both hotel and attraction reservations.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              months: { type: SchemaType.NUMBER, description: 'Number of months to look back (default 6)' },
            },
          },
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
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  private safeParseJson(value: any, fallback: any = {}): any {
    if (typeof value === 'object' && value !== null) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return fallback;
  }

  private async executeTool(name: string, args: Record<string, any>, partnerId: string): Promise<any> {
    const filter = this.safeParseJson(args.filter, {});
    const sort = this.safeParseJson(args.sort, {});
    const limit = args.limit ?? 10;
    const pid = new Types.ObjectId(partnerId);

    try {
      switch (name) {
        case 'query_my_properties':
          return await this.propertyModel.find({ ...filter, partnerId: pid }).sort(sort).limit(limit).lean();

        case 'query_my_rooms': {
          const myProps = await this.propertyModel.find({ partnerId: pid }).select('_id').lean();
          const propIds = myProps.map((p: any) => p._id);
          return await this.roomModel.find({ ...filter, propertyId: { $in: propIds } }).sort(sort).limit(limit).lean();
        }

        case 'query_my_attractions':
          return await this.attractionModel.find({ ...filter, partnerId: pid }).sort(sort).limit(limit).lean();

        case 'query_my_hotel_reservations': {
          const props = await this.propertyModel.find({ partnerId: pid }).select('_id').lean();
          const propIdStrs = props.map((p: any) => p._id.toString());
          return await this.reservationModel.find({ ...filter, propertyId: { $in: propIdStrs } }).sort(sort).limit(limit).lean();
        }

        case 'query_my_attraction_reservations': {
          const attrs = await this.attractionModel.find({ partnerId: pid }).select('_id').lean();
          const attrIds = attrs.map((a: any) => a._id);
          return await this.attractionReservationModel.find({ ...filter, attractionId: { $in: attrIds } }).sort(sort).limit(limit).lean();
        }

        case 'query_my_reviews': {
          const myProps = await this.propertyModel.find({ partnerId: pid }).select('_id').lean();
          const myAttrs = await this.attractionModel.find({ partnerId: pid }).select('_id').lean();
          const refIds = [...myProps.map((p: any) => p._id), ...myAttrs.map((a: any) => a._id)];
          return await this.commentModel.find({ ...filter, commentRefId: { $in: refIds } }).sort(sort).limit(limit).lean();
        }

        case 'get_my_dashboard_stats': {
          const [properties, attractions, rooms] = await Promise.all([
            this.propertyModel.find({ partnerId: pid }).lean(),
            this.attractionModel.find({ partnerId: pid }).lean(),
            (async () => {
              const ps = await this.propertyModel.find({ partnerId: pid }).select('_id').lean();
              return this.roomModel.find({ propertyId: { $in: ps.map((p: any) => p._id) } }).lean();
            })(),
          ]);

          const propIds = properties.map((p: any) => p._id.toString());
          const attrIds = attractions.map((a: any) => a._id);

          const [hotelRevenue, attrRevenue] = await Promise.all([
            this.reservationModel.aggregate([
              { $match: { propertyId: { $in: propIds }, paymentStatus: 'succeeded', reservationStatus: { $ne: 'REFUNDED' } } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
            this.attractionReservationModel.aggregate([
              { $match: { attractionId: { $in: attrIds }, paymentStatus: 'succeeded', reservationStatus: { $ne: 'REFUNDED' } } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
          ]);

          return {
            totalProperties: properties.length,
            totalRooms: rooms.length,
            totalAttractions: attractions.length,
            totalViews: properties.reduce((s: number, p: any) => s + (p.propertyViews || 0), 0)
              + attractions.reduce((s: number, a: any) => s + (a.attractionViews || 0), 0),
            totalLikes: properties.reduce((s: number, p: any) => s + (p.propertyLikes || 0), 0)
              + attractions.reduce((s: number, a: any) => s + (a.attractionLikes || 0), 0),
            hotelReservations: hotelRevenue[0]?.count || 0,
            hotelRevenue: hotelRevenue[0]?.total || 0,
            attractionReservations: attrRevenue[0]?.count || 0,
            attractionRevenue: attrRevenue[0]?.total || 0,
            totalRevenue: (hotelRevenue[0]?.total || 0) + (attrRevenue[0]?.total || 0),
          };
        }

        case 'get_revenue_breakdown': {
          const months = args.months || 6;
          const since = new Date();
          since.setMonth(since.getMonth() - months);

          const propIds = (await this.propertyModel.find({ partnerId: pid }).select('_id').lean()).map((p: any) => p._id.toString());
          const attrIds = (await this.attractionModel.find({ partnerId: pid }).select('_id').lean()).map((a: any) => a._id);

          const [hotel, attr] = await Promise.all([
            this.reservationModel.aggregate([
              { $match: { propertyId: { $in: propIds }, paymentStatus: 'succeeded', createdAt: { $gte: since } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ]),
            this.attractionReservationModel.aggregate([
              { $match: { attractionId: { $in: attrIds }, paymentStatus: 'succeeded', createdAt: { $gte: since } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ]),
          ]);

          return { hotelRevenue: hotel, attractionRevenue: attr };
        }

        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Tool error [${name}]:`, error);
      return { error: error.message };
    }
  }

  async askPartnerAgent(question: string, partnerId: string, partnerName: string): Promise<string> {
    const systemPrompt = `You are an AI business assistant for ${partnerName} on LankaStay — a hotel and attraction booking platform.
You help this partner manage their business by querying ONLY their own data (properties, rooms, attractions, reservations, reviews).

All queries are automatically scoped to this partner's data — you cannot see other partners' data.

Key information:
- Room prices are in KRW (Korean Won), stored in roomPricePerNight
- Attraction prices: attractionAdultPrice, attractionChildPrice (KRW)
- Reservation statuses: PENDING, CONFIRMED, CANCELLED, REFUNDED
- Payment statuses: succeeded, pending, refunded

When answering:
- Use tools to fetch real data — never guess
- Format prices with KRW and commas
- Be specific with names, dates, amounts
- Provide actionable business insights when relevant
- Answer in the user's language`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      tools: this.geminiTools,
    });

    try {
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
          this.logger.log(`Partner tool: ${name} args: ${JSON.stringify(args)}`);
          const result = await this.executeTool(name, args, partnerId);
          functionResponses.parts.push({ functionResponse: { name, response: { result } } });
        }
        response = await chat.sendMessage(functionResponses.parts);
      }

      return response.response.text();
    } catch (error: any) {
      this.logger.error('Partner Gemini error', { message: error?.message, status: error?.status });
      return buildPartnerAiLimitMessage(error);
    }
  }
}

function buildPartnerAiLimitMessage(error: any): string {
  const msg = error?.message || '';
  const status = error?.status;
  const limited = status === 429 || status === 503 || msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('high demand') || msg.includes('Too Many Requests') || msg.includes('Service Unavailable');

  if (limited) {
    return [
      'The AI assistant has reached its usage limit. Please try again in a minute.',
      '',
      'AI 어시스턴트의 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
      '',
      'AI yordamchimiz foydalanish chegarasiga yetdi. Iltimos, bir daqiqadan so\'ng qayta urinib ko\'ring.',
    ].join('\n');
  }

  return [
    'The AI assistant is temporarily unavailable. Please try again later.',
    '',
    'AI 어시스턴트를 일시적으로 사용할 수 없습니다. 나중에 다시 시도해 주세요.',
    '',
    'AI yordamchi vaqtincha mavjud emas. Iltimos, keyinroq qayta urinib ko\'ring.',
  ].join('\n');
}
