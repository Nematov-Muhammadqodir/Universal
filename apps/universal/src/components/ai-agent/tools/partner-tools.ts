import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model, Types } from 'mongoose';
import { safeParseJson, toErrorResult, toTextResult } from './utils';

export interface PartnerModels {
  propertyModel: Model<any>;
  roomModel: Model<any>;
  attractionModel: Model<any>;
  reservationModel: Model<any>;
  attractionReservationModel: Model<any>;
  commentModel: Model<any>;
}

export function partnerTools(models: PartnerModels, partnerId: string) {
  const pid = new Types.ObjectId(partnerId);

  return [
    tool(
      'query_my_properties',
      'Query THIS partner\'s own properties only (auto-scoped by partnerId). Fields: propertyName, propertyType, propertyCity, propertyRegion, propertyCountry, propertyStars, propertyViews, propertyLikes, propertyStatus, totalReviews, staffRating, facilitiesRating, cleanlessRating, comfortRating.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.partnerId = pid;
          const results = await models.propertyModel
            .find(filter)
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
      'query_my_rooms',
      'Query rooms belonging to THIS partner\'s properties. Fields: roomType, roomName, roomPricePerNight, numberOfGuestsCanStay, roomFacilities, propertyId.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const myProps = await models.propertyModel.find({ partnerId: pid }).select('_id').lean();
          const propIds = myProps.map((p: any) => p._id);
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.propertyId = { $in: propIds };
          const results = await models.roomModel
            .find(filter)
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
      'query_my_attractions',
      'Query THIS partner\'s own attractions (auto-scoped). Fields: attractionName, attractionType, attractionCity, attractionCountry, attractionAdultPrice, attractionChildPrice, attractionDuration, attractionViews, attractionLikes, totalReviews, averageRating, attractionStatus.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.partnerId = pid;
          const results = await models.attractionModel
            .find(filter)
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
      'query_my_hotel_reservations',
      'Query hotel reservations for THIS partner\'s properties. Fields: guestName, guestEmail, startDate, endDate, paymentStatus, paymentAmount, reservationStatus, roomId, propertyId.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const props = await models.propertyModel.find({ partnerId: pid }).select('_id').lean();
          const propIdStrs = props.map((p: any) => p._id.toString());
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.propertyId = { $in: propIdStrs };
          const results = await models.reservationModel
            .find(filter)
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
      'query_my_attraction_reservations',
      'Query attraction ticket reservations for THIS partner\'s attractions. Fields: guestName, guestEmail, ticketCount, selectedDate, paymentStatus, paymentAmount, reservationStatus, attractionId.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const attrs = await models.attractionModel.find({ partnerId: pid }).select('_id').lean();
          const attrIds = attrs.map((a: any) => a._id);
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.attractionId = { $in: attrIds };
          const results = await models.attractionReservationModel
            .find(filter)
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
      'query_my_reviews',
      'Query guest reviews on THIS partner\'s properties or attractions. Fields: commentContent, commentScore, commentLikes, commentDislikes, memberId, commentRefId.',
      {
        filter: z.string().optional(),
        sort: z.string().optional(),
        limit: z.number().optional(),
      },
      async (args) => {
        try {
          const [myProps, myAttrs] = await Promise.all([
            models.propertyModel.find({ partnerId: pid }).select('_id').lean(),
            models.attractionModel.find({ partnerId: pid }).select('_id').lean(),
          ]);
          const refIds = [
            ...myProps.map((p: any) => p._id),
            ...myAttrs.map((a: any) => a._id),
          ];
          const filter: Record<string, any> = safeParseJson(args.filter, {});
          filter.commentRefId = { $in: refIds };
          const results = await models.commentModel
            .find(filter)
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
      'get_my_dashboard_stats',
      'Get dashboard stats for THIS partner: property count, room count, attraction count, total views, likes, reservation counts, revenue.',
      {},
      async () => {
        try {
          const [properties, attractions] = await Promise.all([
            models.propertyModel.find({ partnerId: pid }).lean(),
            models.attractionModel.find({ partnerId: pid }).lean(),
          ]);
          const propIds = properties.map((p: any) => p._id);
          const propIdStrs = propIds.map((id: any) => id.toString());
          const attrIds = attractions.map((a: any) => a._id);

          const rooms = await models.roomModel.find({ propertyId: { $in: propIds } }).lean();
          const [hotelRevenue, attrRevenue] = await Promise.all([
            models.reservationModel.aggregate([
              {
                $match: {
                  propertyId: { $in: propIdStrs },
                  paymentStatus: 'succeeded',
                  reservationStatus: { $ne: 'REFUNDED' },
                },
              },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
            models.attractionReservationModel.aggregate([
              {
                $match: {
                  attractionId: { $in: attrIds },
                  paymentStatus: 'succeeded',
                  reservationStatus: { $ne: 'REFUNDED' },
                },
              },
              { $group: { _id: null, total: { $sum: '$paymentAmount' }, count: { $sum: 1 } } },
            ]),
          ]);

          return toTextResult({
            totalProperties: properties.length,
            totalRooms: rooms.length,
            totalAttractions: attractions.length,
            totalViews:
              properties.reduce((s: number, p: any) => s + (p.propertyViews || 0), 0) +
              attractions.reduce((s: number, a: any) => s + (a.attractionViews || 0), 0),
            totalLikes:
              properties.reduce((s: number, p: any) => s + (p.propertyLikes || 0), 0) +
              attractions.reduce((s: number, a: any) => s + (a.attractionLikes || 0), 0),
            hotelReservations: hotelRevenue[0]?.count || 0,
            hotelRevenue: hotelRevenue[0]?.total || 0,
            attractionReservations: attrRevenue[0]?.count || 0,
            attractionRevenue: attrRevenue[0]?.total || 0,
            totalRevenue: (hotelRevenue[0]?.total || 0) + (attrRevenue[0]?.total || 0),
          });
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),

    tool(
      'get_revenue_breakdown',
      'Monthly revenue breakdown for THIS partner from hotel + attraction reservations.',
      {
        months: z.number().optional().describe('Number of months to look back (default 6)'),
      },
      async (args) => {
        try {
          const months = args.months ?? 6;
          const since = new Date();
          since.setMonth(since.getMonth() - months);
          const [props, attrs] = await Promise.all([
            models.propertyModel.find({ partnerId: pid }).select('_id').lean(),
            models.attractionModel.find({ partnerId: pid }).select('_id').lean(),
          ]);
          const propIds = props.map((p: any) => p._id.toString());
          const attrIds = attrs.map((a: any) => a._id);

          const [hotel, attr] = await Promise.all([
            models.reservationModel.aggregate([
              {
                $match: {
                  propertyId: { $in: propIds },
                  paymentStatus: 'succeeded',
                  createdAt: { $gte: since },
                },
              },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                  revenue: { $sum: '$paymentAmount' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]),
            models.attractionReservationModel.aggregate([
              {
                $match: {
                  attractionId: { $in: attrIds },
                  paymentStatus: 'succeeded',
                  createdAt: { $gte: since },
                },
              },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                  revenue: { $sum: '$paymentAmount' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]),
          ]);
          return toTextResult({ hotelRevenue: hotel, attractionRevenue: attr });
        } catch (err) {
          return toErrorResult(err);
        }
      },
    ),
  ];
}
