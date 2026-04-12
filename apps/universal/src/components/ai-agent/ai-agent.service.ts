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
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private genAI: GoogleGenerativeAI;

  private readonly geminiTools: GeminiTool[] = [
    {
      functionDeclarations: [
        {
          name: 'query_properties',
          description:
            'Query the hotel/property collection. Use this to find properties by type, location, stars, price range, facilities, etc. ' +
            'Fields: propertyName, propertyType (Hotel, Guest House, Bed and Breakfast, Homestay, Hostel, Aparthotel, Capsule Hotel, Resort, Motel, Inn, Lodge, etc.), ' +
            'propertyCountry, propertyRegion, propertyCity, propertyPostCode, propertyStars (1-5), ' +
            'propertyViews, propertyLikes, propertyComments, propertyStatus (ACTIVE, INACTIVE, DELETE), ' +
            'propertyFacilities (array of strings), breakfastIncluded (boolean), parkingIncluded (boolean), ' +
            'allowChildren (boolean), allowPets (boolean), propertyImages (array), ' +
            'totalReviews, staffRating, facilitiesRating, cleanlessRating, comfortRating, valueOfMoneyRating, locationRating, freeWiFiRating, ' +
            'partnerId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query (e.g. {"propertyCity": "Busan"} or {"propertyStars": {"$gte": 4}})',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort (e.g. {"propertyViews": -1} for most viewed, {"propertyStars": -1} for highest rated)',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max number of results to return (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include (e.g. {"propertyName": 1, "propertyCity": 1, "propertyStars": 1})',
              },
            },
          },
        },
        {
          name: 'query_rooms',
          description:
            'Query hotel rooms. Use this to find rooms by price, type, capacity, facilities, etc. ' +
            'Fields: propertyId, roomType (Single, Double, Twin, Suite, Deluxe, Family, etc.), roomName, ' +
            'roomPricePerNight (stored as string but represents a number in KRW — sort with {"roomPricePerNight": 1} for cheapest), numberOfGuestsCanStay (number), ' +
            'roomFacilities (array), availableBathroomFacilities (array), ' +
            'isBathroomPrivate (boolean), isSmokingAllowed (boolean), ' +
            'availableBeds (object: single, double, king, superKing), ' +
            'reservedDates (array of {userId, from, until}), createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query (e.g. {"roomPricePerNight": {"$lte": 100000}})',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort (e.g. {"roomPricePerNight": 1} for cheapest first)',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include',
              },
            },
          },
        },
        {
          name: 'query_attractions',
          description:
            'Query attractions (tours, museums, theme parks, shows, etc.). ' +
            'Fields: attractionName, attractionType (Tour, Museum, Theme Park, Show, Activity, Landmark, Water Park, Zoo), ' +
            'attractionDescription, attractionCountry, attractionRegion, attractionCity, ' +
            'attractionAdultPrice (number), attractionChildPrice (number), attractionDuration (string), ' +
            'attractionHighlights (array), attractionIncludes (array), attractionExcludes (array), ' +
            'maxParticipants (number), freeCancellation (boolean), ' +
            'attractionStatus (ACTIVE, INACTIVE, DELETE), attractionViews, attractionLikes, ' +
            'totalReviews, averageRating, valueRating, facilitiesRating, qualityRating, accessRating, ' +
            'attractionImages (array), partnerId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include',
              },
            },
          },
        },
        {
          name: 'query_reservations',
          description:
            'Query hotel reservations. ' +
            'Fields: guestId, guestName, guestLastName, guestEmail, guestPhoneNumber, ' +
            'roomId, propertyId, startDate, endDate, paymentStatus, paymentAmount, ' +
            'reservationStatus (PENDING, CONFIRMED, CANCELLED, REFUNDED), stripePaymentIntentId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'JSON string of MongoDB filter' },
              sort: { type: SchemaType.STRING, description: 'JSON string of MongoDB sort' },
              limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' },
            },
          },
        },
        {
          name: 'query_attraction_reservations',
          description:
            'Query attraction ticket reservations. ' +
            'Fields: guestId, attractionId, guestName, guestLastName, guestEmail, ' +
            'ticketCount, selectedDate, selectedTime, paymentStatus, paymentAmount, ' +
            'reservationStatus (PENDING, CONFIRMED, CANCELLED, REFUNDED), createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'JSON string of MongoDB filter' },
              sort: { type: SchemaType.STRING, description: 'JSON string of MongoDB sort' },
              limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' },
            },
          },
        },
        {
          name: 'query_reviews',
          description:
            'Query guest reviews/comments on properties and attractions. ' +
            'Fields: commentContent, commentRefId (property or attraction ID), memberId, ' +
            'commentScore (number), commentLikes, commentDislikes, commentStatus (ACTIVE, DELETE), createdAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: { type: SchemaType.STRING, description: 'JSON string of MongoDB filter' },
              sort: { type: SchemaType.STRING, description: 'JSON string of MongoDB sort' },
              limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' },
            },
          },
        },
        {
          name: 'count_documents',
          description: 'Count documents in any collection. Useful for "how many hotels in Busan?" or "total attractions?".',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: {
                type: SchemaType.STRING,
                description: 'Collection name: properties, rooms, attractions, reservations, attractionReservations, reviews, guests',
              },
              filter: { type: SchemaType.STRING, description: 'JSON string of MongoDB filter' },
            },
            required: ['collection'],
          },
        },
        {
          name: 'aggregate_data',
          description:
            'Run MongoDB aggregation pipeline on any collection. Use for analytics like average prices, top rated, revenue stats, etc.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: {
                type: SchemaType.STRING,
                description: 'Collection: properties, rooms, attractions, reservations, attractionReservations',
              },
              pipeline: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB aggregation pipeline stages array',
              },
            },
            required: ['collection', 'pipeline'],
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
    @InjectModel('Guest') private readonly guestModel: Model<any>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  private getModelForCollection(collection: string): Model<any> {
    const map: Record<string, Model<any>> = {
      properties: this.propertyModel,
      rooms: this.roomModel,
      attractions: this.attractionModel,
      reservations: this.reservationModel,
      attractionReservations: this.attractionReservationModel,
      reviews: this.commentModel,
      guests: this.guestModel,
    };
    return map[collection];
  }

  private safeParseJson(value: any, fallback: any = {}): any {
    if (typeof value === 'object' && value !== null) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return fallback;
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const filter = this.safeParseJson(args.filter, {});
    const sort = this.safeParseJson(args.sort, {});
    const limit = args.limit ?? 10;
    const projection = this.safeParseJson(args.projection, {});
    const pipeline = this.safeParseJson(args.pipeline, []);
    const collection = args.collection;

    try {
      switch (name) {
        case 'query_properties':
          return await this.propertyModel.find(filter, projection).sort(sort).limit(limit).lean();
        case 'query_rooms': {
          // roomPricePerNight is stored as String — use aggregation to sort numerically
          const hasPriceSort = Object.keys(sort).includes('roomPricePerNight');
          if (hasPriceSort) {
            const priceDir = sort['roomPricePerNight'];
            const otherSort = { ...sort };
            delete otherSort['roomPricePerNight'];
            const pipeline: any[] = [
              { $match: filter },
              { $addFields: { _numericPrice: { $toDouble: '$roomPricePerNight' } } },
              { $sort: { _numericPrice: priceDir, ...otherSort } },
              { $limit: limit },
              { $unset: '_numericPrice' },
            ];
            return await this.roomModel.aggregate(pipeline);
          }
          return await this.roomModel.find(filter, projection).sort(sort).limit(limit).lean();
        }
        case 'query_attractions':
          return await this.attractionModel.find(filter, projection).sort(sort).limit(limit).lean();
        case 'query_reservations':
          return await this.reservationModel.find(filter).sort(sort).limit(limit).lean();
        case 'query_attraction_reservations':
          return await this.attractionReservationModel.find(filter).sort(sort).limit(limit).lean();
        case 'query_reviews':
          return await this.commentModel.find(filter).sort(sort).limit(limit).lean();
        case 'count_documents': {
          const model = this.getModelForCollection(collection);
          if (!model) return { error: `Unknown collection: ${collection}` };
          const count = await model.countDocuments(filter);
          return { collection, filter, count };
        }
        case 'aggregate_data': {
          const model = this.getModelForCollection(collection);
          if (!model) return { error: `Unknown collection: ${collection}` };
          return await model.aggregate(pipeline);
        }
        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Tool execution error [${name}]:`, error);
      return { error: error.message };
    }
  }

  async askAgent(question: string): Promise<string> {
    const systemPrompt = `You are a helpful AI travel assistant for LankaStay — a hotel and attraction booking platform.
You have access to tools that let you query the MongoDB database to answer user questions about hotels, attractions, rooms, reservations, and reviews.

Key information about the platform:
- Hotels/Properties have types: Hotel, Guest House, Bed and Breakfast, Homestay, Hostel, Resort, Motel, Lodge, etc.
- Properties have ratings (1-10 scale): staffRating, facilitiesRating, cleanlessRating, comfortRating, valueOfMoneyRating, locationRating, freeWiFiRating
- Room prices are stored in roomPricePerNight (in KRW - Korean Won). To find the cheapest room, use query_rooms with sort {"roomPricePerNight": 1} and limit 1. To find the most expensive, sort {"roomPricePerNight": -1}.
- Attraction types: Tour, Museum, Theme Park, Show, Activity, Landmark, Water Park, Zoo
- Attraction prices: attractionAdultPrice, attractionChildPrice (in KRW)
- Attractions have ratings (1-5 scale): averageRating, valueRating, facilitiesRating, qualityRating, accessRating
- Reservation statuses: PENDING, CONFIRMED, CANCELLED, REFUNDED

When answering:
- Use the appropriate tools to fetch real data from the database
- Be specific and include names, prices, locations, ratings from the actual results
- Format prices nicely with KRW and commas (e.g. KRW 150,000)
- If no results found, say so clearly and suggest alternatives
- Answer in the same language the user asked in
- Be friendly and helpful, like a travel concierge
- Keep responses concise but informative`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools: this.geminiTools,
    });

    if (!process.env.GEMINI_API_KEY) {
      this.logger.error('GEMINI_API_KEY is not set in environment');
      return 'AI assistant is not configured. Administrator: set GEMINI_API_KEY.';
    }

    let chat;
    let response;
    try {
      chat = model.startChat();
      response = await chat.sendMessage(question);
    } catch (error: any) {
      this.logger.error('Gemini sendMessage error', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        errorDetails: error?.errorDetails,
      });
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        return 'AI 어시스턴트의 일일 사용 한도에 도달했습니다. 이는 AI 제공업체의 일시적인 제한이며 곧 초기화됩니다. 잠시 후 다시 시도해 주세요.\n\nOur AI assistant has reached its daily usage limit. This is a temporary restriction from our AI provider and will reset shortly. Please try again in a few minutes.\n\nНаш AI-ассистент достиг дневного лимита использования. Это временное ограничение от провайдера AI, которое скоро сбросится. Пожалуйста, повторите попытку через несколько минут.\n\nAI yordamchimiz kunlik foydalanish chegarasiga yetdi. Bu AI provayderimizdagi vaqtinchalik cheklov bo\'lib, tez orada qayta tiklanadi. Iltimos, bir necha daqiqadan so\'ng qayta urinib ko\'ring.';
      }
      throw error;
    }

    // Agentic loop: keep processing function calls until Gemini gives a text response
    const MAX_TOOL_ROUNDS = 5;
    let round = 0;
    while (round < MAX_TOOL_ROUNDS) {
      round++;
      const candidate = response.response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = candidate.content.parts.filter((part) => part.functionCall);
      if (functionCalls.length === 0) break;

      const functionResponses: Content = {
        role: 'function' as const,
        parts: [],
      };

      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        this.logger.log(`Calling tool: ${name} with args: ${JSON.stringify(args)}`);

        const result = await this.executeTool(name, args);
        functionResponses.parts.push({
          functionResponse: { name, response: { result } },
        });
      }

      try {
        response = await chat.sendMessage(functionResponses.parts);
      } catch (error: any) {
        this.logger.error('Gemini tool-round sendMessage error', {
          message: error?.message,
          status: error?.status,
          statusText: error?.statusText,
          errorDetails: error?.errorDetails,
        });
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
          return 'AI 어시스턴트의 일일 사용 한도에 도달했습니다. 이는 AI 제공업체의 일시적인 제한이며 곧 초기화됩니다. 잠시 후 다시 시도해 주세요.\n\nOur AI assistant has reached its daily usage limit. This is a temporary restriction from our AI provider and will reset shortly. Please try again in a few minutes.\n\nНаш AI-ассистент достиг дневного лимита использования. Это временное ограничение от провайдера AI, которое скоро сбросится. Пожалуйста, повторите попытку через несколько минут.\n\nAI yordamchimiz kunlik foydalanish chegarasiga yetdi. Bu AI provayderimizdagi vaqtinchalik cheklov bo\'lib, tez orada qayta tiklanadi. Iltimos, bir necha daqiqadan so\'ng qayta urinib ko\'ring.';
        }
        throw error;
      }
    }

    return response.response.text();
  }
}
