import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';
import { safeParseJson, toErrorResult, toTextResult } from './utils';

export interface GeneralModels {
  propertyModel: Model<any>;
  roomModel: Model<any>;
  attractionModel: Model<any>;
  reservationModel: Model<any>;
  attractionReservationModel: Model<any>;
  commentModel: Model<any>;
  guestModel: Model<any>;
}

export function generalTools(models: GeneralModels) {
  const modelMap: Record<string, Model<any>> = {
    properties: models.propertyModel,
    rooms: models.roomModel,
    attractions: models.attractionModel,
    reservations: models.reservationModel,
    attractionReservations: models.attractionReservationModel,
    reviews: models.commentModel,
    guests: models.guestModel,
  };

  return [
    tool(
      'query_properties',
      'Query hotels/properties. Fields: propertyName, propertyType (Hotel, Guest House, Resort, Motel, Lodge, Hostel, etc.), propertyCountry, propertyRegion, propertyCity, propertyStars (1-5), propertyViews, propertyLikes, propertyStatus (ACTIVE, INACTIVE, DELETE), propertyFacilities (array), breakfastIncluded, parkingIncluded, allowChildren, allowPets, totalReviews, staffRating, facilitiesRating, cleanlessRating, comfortRating, valueOfMoneyRating, locationRating, freeWiFiRating.',
      {
        filter: z.string().optional().describe('JSON MongoDB filter'),
        sort: z.string().optional().describe('JSON MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
        projection: z.string().optional().describe('JSON projection'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, {});
          const projection = safeParseJson(args.projection, {});
          const results = await models.propertyModel
            .find(filter, projection)
            .sort(sort)
            .limit(args.limit ?? 10)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'query_rooms',
      'Query hotel rooms. Fields: propertyId, roomType (Single, Double, Twin, Suite, Deluxe, Family), roomName, roomPricePerNight (KRW, stored as string), numberOfGuestsCanStay, roomFacilities, isBathroomPrivate, isSmokingAllowed. Sort by price uses numeric conversion automatically.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
        projection: z.string().optional(),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson<Record<string, any>>(args.sort, {});
          const projection = safeParseJson(args.projection, {});
          const limit = args.limit ?? 10;
          if ('roomPricePerNight' in sort) {
            const priceDir = sort.roomPricePerNight;
            const otherSort = { ...sort };
            delete otherSort.roomPricePerNight;
            const pipeline: any[] = [
              { $match: filter },
              { $addFields: { _numericPrice: { $toDouble: '$roomPricePerNight' } } },
              { $sort: { _numericPrice: priceDir, ...otherSort } },
              { $limit: limit },
              { $unset: '_numericPrice' },
            ];
            return toTextResult(await models.roomModel.aggregate(pipeline));
          }
          const results = await models.roomModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'query_attractions',
      'Query attractions (tours, museums, theme parks, shows). Fields: attractionName, attractionType (Tour, Museum, Theme Park, Show, Activity, Landmark, Water Park, Zoo), attractionCountry, attractionRegion, attractionCity, attractionAdultPrice (KRW), attractionChildPrice, attractionDuration, maxParticipants, freeCancellation, attractionStatus, attractionViews, attractionLikes, totalReviews, averageRating, valueRating, facilitiesRating, qualityRating, accessRating.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
        projection: z.string().optional(),
      },
      async (args) => {
        try {
          const results = await models.attractionModel
            .find(safeParseJson(args.filter, {}), safeParseJson(args.projection, {}))
            .sort(safeParseJson(args.sort, {}))
            .limit(args.limit ?? 10)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'query_reservations',
      'Query hotel reservations. Fields: guestId, guestName, guestLastName, guestEmail, roomId, propertyId, startDate, endDate, paymentStatus, paymentAmount, reservationStatus (PENDING, CONFIRMED, CANCELLED, REFUNDED).',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const results = await models.reservationModel
            .find(safeParseJson(args.filter, {}))
            .sort(safeParseJson(args.sort, {}))
            .limit(args.limit ?? 10)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'query_attraction_reservations',
      'Query attraction ticket reservations. Fields: guestId, attractionId, guestName, guestEmail, ticketCount, selectedDate, selectedTime, paymentStatus, paymentAmount, reservationStatus.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const results = await models.attractionReservationModel
            .find(safeParseJson(args.filter, {}))
            .sort(safeParseJson(args.sort, {}))
            .limit(args.limit ?? 10)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'query_reviews',
      'Query guest reviews/comments. Fields: commentContent, commentRefId, memberId, commentScore, commentLikes, commentDislikes, commentStatus.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const results = await models.commentModel
            .find(safeParseJson(args.filter, {}))
            .sort(safeParseJson(args.sort, {}))
            .limit(args.limit ?? 10)
            .lean();
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'count_documents',
      'Count documents in a collection: properties, rooms, attractions, reservations, attractionReservations, reviews, guests.',
      {
        collection: z.string().describe('Collection name'),
        filter: z.string().optional().describe('JSON filter'),
      },
      async (args) => {
        try {
          const model = modelMap[args.collection];
          if (!model) return toErrorResult(`Unknown collection: ${args.collection}`);
          const count = await model.countDocuments(safeParseJson(args.filter, {}));
          return toTextResult({ collection: args.collection, count });
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'aggregate_data',
      'Run MongoDB aggregation pipeline on a collection (analytics, averages, grouping).',
      {
        collection: z.string(),
        pipeline: z.string().describe('JSON aggregation pipeline array'),
      },
      async (args) => {
        try {
          const model = modelMap[args.collection];
          if (!model) return toErrorResult(`Unknown collection: ${args.collection}`);
          const results = await model.aggregate(safeParseJson(args.pipeline, []));
          return toTextResult(results);
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),
  ];
}
