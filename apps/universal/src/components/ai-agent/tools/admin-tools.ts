import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';
import { safeParseJson, toErrorResult, toTextResult } from './utils';

export interface AdminModels {
  propertyModel: Model<any>;
  roomModel: Model<any>;
  attractionModel: Model<any>;
  reservationModel: Model<any>;
  attractionReservationModel: Model<any>;
  commentModel: Model<any>;
  guestModel: Model<any>;
  partnerModel: Model<any>;
  notificationModel: Model<any>;
  messageModel: Model<any>;
}

export function adminTools(models: AdminModels) {
  const modelMap: Record<string, Model<any>> = {
    properties: models.propertyModel,
    rooms: models.roomModel,
    attractions: models.attractionModel,
    reservations: models.reservationModel,
    attractionReservations: models.attractionReservationModel,
    comments: models.commentModel,
    guests: models.guestModel,
    partners: models.partnerModel,
    notifications: models.notificationModel,
    messages: models.messageModel,
  };

  return [
    tool(
      'query_collection',
      'Query ANY collection (admin access). Collections: properties, rooms, attractions, reservations, attractionReservations, comments, guests, partners, notifications, messages.',
      {
        collection: z.string().describe('Collection name'),
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
        projection: z.string().optional(),
      },
      async (args) => {
        try {
          const model = modelMap[args.collection];
          if (!model) return toErrorResult(`Unknown collection: ${args.collection}`);
          const results = await model
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
      'count_collection',
      'Count documents in any collection with optional filter.',
      {
        collection: z.string(),
        filter: z.string().optional(),
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
      'aggregate_collection',
      'Run MongoDB aggregation on any collection. Use for analytics, grouping, sums, trends.',
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

    tool(
      'get_platform_overview',
      'Get comprehensive platform statistics: total guests, partners, active properties, active attractions, reservations, revenue.',
      {},
      async () => {
        try {
          const [guests, partners, properties, attractions, hotelRes, attrRes] = await Promise.all([
            models.guestModel.countDocuments(),
            models.partnerModel.countDocuments(),
            models.propertyModel.countDocuments({ propertyStatus: 'ACTIVE' }),
            models.attractionModel.countDocuments({ attractionStatus: 'ACTIVE' }),
            models.reservationModel.aggregate([
              { $match: { paymentStatus: 'succeeded' } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
            models.attractionReservationModel.aggregate([
              { $match: { paymentStatus: 'succeeded' } },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
          ]);
          return toTextResult({
            totalGuests: guests,
            totalPartners: partners,
            activeProperties: properties,
            activeAttractions: attractions,
            hotelReservations: hotelRes[0]?.count || 0,
            hotelRevenue: hotelRes[0]?.total || 0,
            attractionReservations: attrRes[0]?.count || 0,
            attractionRevenue: attrRes[0]?.total || 0,
            totalRevenue: (hotelRes[0]?.total || 0) + (attrRes[0]?.total || 0),
          });
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),
  ];
}
