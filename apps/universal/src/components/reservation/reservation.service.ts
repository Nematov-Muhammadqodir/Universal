import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  ReservationInfo,
  RevenueDataPoint,
  StripePaymentIntent,
} from '../../libs/dto/reservationInfo/reservationInfo';
import { UpdateReservationStatusInput } from '../../libs/dto/reservationInfo/reservationInfo.update';
import { NotificationService } from '../notification/notification.service';
import {
  CreatePaymentIntentInput,
  ReservationInfoInput,
} from '../../libs/dto/reservationInfo/reservationInfo.input';
import { AttractionReservation } from '../../libs/dto/attractionReservation/attractionReservation';
import {
  AttractionReservationInput,
  CreateAttractionPaymentIntentInput,
} from '../../libs/dto/attractionReservation/attractionReservation.input';
import { Message } from '../../libs/enums/common.enum';
import { PartnerService } from '../partner/partner/partner.service';
import { PartnerPropertyRoom } from '../../libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { OrdinaryInquery } from '../../libs/dto/partner/partnerProperty/partnerProperty.input';
import { PartnerProperties } from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { T } from '../../libs/types/common';
import { lookupVisitForReservation } from '../../libs/config';
import Stripe from 'stripe';
import { Types } from 'mongoose';

@Injectable()
export class ReservationService {
  private stripe: Stripe;

  constructor(
    @InjectModel('ReservationInfoSchema')
    private readonly reservationModel: Model<ReservationInfo>,
    @InjectModel('PartnerPropertyRoomSchema')
    private readonly partnerPropertyRoomModel: Model<PartnerPropertyRoom>,
    @InjectModel('AttractionReservation')
    private readonly attractionReservationModel: Model<AttractionReservation>,
    private partnerService: PartnerService,
    private notificationService: NotificationService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  public async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<StripePaymentIntent> {
    const { amount, roomId, propertyId } = input;
    console.log('input', input);

    // Verify room exists
    const exists = await this.partnerPropertyRoomModel
      .findOne({ _id: new Types.ObjectId(roomId), propertyId: new Types.ObjectId(propertyId) })
      .lean();
    if (!exists) {
      throw new BadRequestException(Message.ROOM_NOT_EXIST);
    }

    console.log('Room exists, creating Stripe payment intent...');
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'krw',
      payment_method_types: ['card'],
      metadata: {
        roomId,
        propertyId,
      },
    });
    console.log('Payment intent created:', paymentIntent.id);
    console.log('client_secret value:', paymentIntent.client_secret);

    return { clientSecret: paymentIntent.client_secret };
  }

  public async addReservationInfo(
    input: ReservationInfoInput,
  ): Promise<ReservationInfo> {
    try {
      const { roomId, propertyId, startDate, endDate } = input;
      const exists = await this.partnerPropertyRoomModel
        .findOne({ _id: new Types.ObjectId(roomId), propertyId: new Types.ObjectId(propertyId) })
        .lean();
      const bookedRoom = await this.reservationModel.findOne({
        roomId,
        propertyId,
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
          },
          {
            startDate: { $lte: startDate },
            endDate: { $gte: startDate },
          },
          {
            startDate: { $lte: endDate },
            endDate: { $gte: endDate },
          },
        ],
      });
      if (!exists) {
        throw new BadRequestException(Message.ROOM_NOT_EXIST);
      } else if (bookedRoom) {
        throw new BadRequestException(Message.ROOM_ALREADY_BOOKED);
      } else {
        const result: ReservationInfo = await this.reservationModel.create({
          ...input,
          paymentStatus: 'succeeded',
        });

        // Update room's reservedDates array
        await this.partnerPropertyRoomModel.findByIdAndUpdate(roomId, {
          $push: {
            reservedDates: {
              userId: new Types.ObjectId(input.guestId),
              from: new Date(startDate),
              until: new Date(endDate),
            },
          },
        });

        return result;
      }
    } catch (err) {
      console.log('Error, addReservationInfo', err.message);
      throw new BadRequestException(err.message);
    }
  }

  public async getReservedRooms(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<PartnerProperties> {
    const { page, limit } = input;

    const match: T = { guestId: memberId.toString() };

    const data = await this.reservationModel.aggregate([
      { $match: match },
      { $sort: { updatedAt: -1 } },

      {
        $addFields: {
          propertyIdObj: { $toObjectId: '$propertyId' },
          roomIdObj: { $toObjectId: '$roomId' },
        },
      },

      {
        $lookup: {
          from: 'partnerPropertyRooms',
          localField: 'roomIdObj',
          foreignField: '_id',
          as: 'roomData',
        },
      },
      {
        $unwind: {
          path: '$roomData',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'partnersProperties',
          localField: 'propertyIdObj',
          foreignField: '_id',
          as: 'reservedProperty',
        },
      },
      { $unwind: '$reservedProperty' },

      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            lookupVisitForReservation,
            { $unwind: '$reservedProperty.memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    console.log('Aggregation raw result count:', data[0]?.list?.length);
    console.log('MetaCounter:', data[0]?.metaCounter);
    if (data[0]?.list?.length > 0) {
      console.log('First item keys:', Object.keys(data[0].list[0]));
      console.log('Has reservedProperty:', !!data[0].list[0].reservedProperty);
      console.log('Has roomData:', !!data[0].list[0].roomData);
    }

    const result: PartnerProperties = {
      list: data[0].list.map((ele) => ({
        ...ele.reservedProperty,
        roomData: ele.roomData ?? null,
        reservationData: {
          _id: ele._id,
          guestId: ele.guestId,
          guestName: ele.guestName,
          guestLastName: ele.guestLastName,
          guestEmail: ele.guestEmail,
          guestPhoneNumber: ele.guestPhoneNumber,
          travelForWork: ele.travelForWork,
          stripePaymentIntentId: ele.stripePaymentIntentId,
          paymentStatus: ele.paymentStatus,
          paymentAmount: ele.paymentAmount,
          propertyId: ele.propertyId,
          roomId: ele.roomId,
          startDate: ele.startDate,
          endDate: ele.endDate,
          ageConfirmation: ele.ageConfirmation,
          createdAt: ele.createdAt,
          updatedAt: ele.updatedAt,
        },
      })),
      metaCounter: data[0].metaCounter,
    };

    return result;
  }

  public async createAttractionPaymentIntent(
    input: CreateAttractionPaymentIntentInput,
  ): Promise<StripePaymentIntent> {
    const { amount, attractionId } = input;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'krw',
      payment_method_types: ['card'],
      metadata: { attractionId },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  public async getAttractionReservations(
    memberId: ObjectId,
  ): Promise<AttractionReservation[]> {
    return await this.attractionReservationModel
      .aggregate([
        { $match: { guestId: new Types.ObjectId(memberId.toString()) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'attractions',
            localField: 'attractionId',
            foreignField: '_id',
            as: 'attractionData',
          },
        },
        { $unwind: { path: '$attractionData', preserveNullAndEmptyArrays: true } },
      ])
      .exec();
  }

  public async getOwnerAttractionReservations(
    partnerId: ObjectId,
  ): Promise<AttractionReservation[]> {
    return await this.attractionReservationModel
      .aggregate([
        {
          $lookup: {
            from: 'attractions',
            localField: 'attractionId',
            foreignField: '_id',
            as: 'attractionData',
          },
        },
        { $unwind: { path: '$attractionData', preserveNullAndEmptyArrays: true } },
        { $match: { 'attractionData.partnerId': new Types.ObjectId(partnerId.toString()) } },
        { $sort: { createdAt: -1 } },
      ])
      .exec();
  }

  public async addAttractionReservation(
    input: AttractionReservationInput,
  ): Promise<AttractionReservation> {
    try {
      const result = await this.attractionReservationModel.create(input);
      return result;
    } catch (err) {
      console.log('Error, addAttractionReservation:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  // ==================== STATUS MANAGEMENT ====================

  public async updateReservationStatus(
    input: UpdateReservationStatusInput,
  ): Promise<ReservationInfo> {
    const result = await this.reservationModel
      .findByIdAndUpdate(
        input.reservationId,
        { $set: { reservationStatus: input.reservationStatus } },
        { new: true },
      )
      .exec();
    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);

    // Send notification to guest
    const statusMap: Record<string, string> = {
      CONFIRMED: 'RESERVATION_CONFIRMED',
      CANCELLED: 'RESERVATION_CANCELLED',
    };
    const titleMap: Record<string, string> = {
      CONFIRMED: 'Reservation Confirmed',
      CANCELLED: 'Reservation Cancelled',
    };
    const messageMap: Record<string, string> = {
      CONFIRMED: `Your hotel reservation for ${result.startDate} has been confirmed.`,
      CANCELLED: `Your hotel reservation for ${result.startDate} has been cancelled by the property owner.`,
    };

    if (statusMap[input.reservationStatus]) {
      await this.notificationService.createNotification({
        receiverId: result.guestId,
        notificationType: statusMap[input.reservationStatus],
        notificationTitle: titleMap[input.reservationStatus],
        notificationMessage: messageMap[input.reservationStatus],
        notificationRefId: result._id as any,
      });
    }

    return result;
  }

  public async updateAttractionReservationStatus(
    input: UpdateReservationStatusInput,
  ): Promise<AttractionReservation> {
    const result = await this.attractionReservationModel
      .findByIdAndUpdate(
        input.reservationId,
        { $set: { reservationStatus: input.reservationStatus } },
        { new: true },
      )
      .exec();
    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);

    const statusMap: Record<string, string> = {
      CONFIRMED: 'RESERVATION_CONFIRMED',
      CANCELLED: 'RESERVATION_CANCELLED',
    };
    const titleMap: Record<string, string> = {
      CONFIRMED: 'Booking Confirmed',
      CANCELLED: 'Booking Cancelled',
    };
    const messageMap: Record<string, string> = {
      CONFIRMED: `Your attraction booking for ${(result as any).selectedDate} at ${(result as any).selectedTime} has been confirmed.`,
      CANCELLED: `Your attraction booking for ${(result as any).selectedDate} has been cancelled by the attraction owner.`,
    };

    if (statusMap[input.reservationStatus]) {
      await this.notificationService.createNotification({
        receiverId: (result as any).guestId,
        notificationType: statusMap[input.reservationStatus],
        notificationTitle: titleMap[input.reservationStatus],
        notificationMessage: messageMap[input.reservationStatus],
        notificationRefId: result._id as any,
      });
    }

    return result;
  }

  // ==================== REFUND ====================

  public async refundReservation(reservationId: string): Promise<ReservationInfo> {
    const reservation = await this.reservationModel.findById(reservationId).exec();
    if (!reservation) throw new BadRequestException(Message.NO_DATA_FOUND);

    if (!reservation.stripePaymentIntentId) {
      throw new BadRequestException('No payment to refund');
    }

    try {
      await this.stripe.refunds.create({
        payment_intent: reservation.stripePaymentIntentId,
      });
    } catch (err) {
      console.log('Stripe refund error:', err.message);
      throw new BadRequestException('Refund failed: ' + err.message);
    }

    const result = await this.reservationModel
      .findByIdAndUpdate(
        reservationId,
        { $set: { reservationStatus: 'REFUNDED', paymentStatus: 'refunded' } },
        { new: true },
      )
      .exec();

    await this.notificationService.createNotification({
      receiverId: result.guestId,
      notificationType: 'RESERVATION_REFUNDED',
      notificationTitle: 'Refund Processed',
      notificationMessage: `Your hotel reservation payment of ${result.paymentAmount} KRW has been refunded.`,
      notificationRefId: result._id as any,
    });

    return result;
  }

  public async refundAttractionReservation(reservationId: string): Promise<AttractionReservation> {
    const reservation = await this.attractionReservationModel.findById(reservationId).exec();
    if (!reservation) throw new BadRequestException(Message.NO_DATA_FOUND);

    if (!reservation.stripePaymentIntentId) {
      throw new BadRequestException('No payment to refund');
    }

    try {
      await this.stripe.refunds.create({
        payment_intent: reservation.stripePaymentIntentId,
      });
    } catch (err) {
      console.log('Stripe refund error:', err.message);
      throw new BadRequestException('Refund failed: ' + err.message);
    }

    const result = await this.attractionReservationModel
      .findByIdAndUpdate(
        reservationId,
        { $set: { reservationStatus: 'REFUNDED', paymentStatus: 'refunded' } },
        { new: true },
      )
      .exec();

    await this.notificationService.createNotification({
      receiverId: (result as any).guestId,
      notificationType: 'RESERVATION_REFUNDED',
      notificationTitle: 'Refund Processed',
      notificationMessage: `Your attraction booking payment of ${(result as any).paymentAmount} KRW has been refunded.`,
      notificationRefId: result._id as any,
    });

    return result;
  }

  // ==================== REVENUE ANALYTICS ====================

  public async getRevenueAnalytics(partnerId: ObjectId): Promise<RevenueDataPoint[]> {
    // Hotel revenue
    const hotelRevenue = await this.reservationModel.aggregate([
      { $match: { paymentStatus: 'succeeded', reservationStatus: { $ne: 'REFUNDED' } } },
      {
        $lookup: {
          from: 'partnersProperties',
          let: { propId: { $toObjectId: '$propertyId' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$propId'] } } }],
          as: 'property',
        },
      },
      { $unwind: '$property' },
      { $match: { 'property.partnerId': new Types.ObjectId(partnerId.toString()) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$paymentAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Attraction revenue
    const attractionRevenue = await this.attractionReservationModel.aggregate([
      { $match: { paymentStatus: 'succeeded', reservationStatus: { $ne: 'REFUNDED' } } },
      {
        $lookup: {
          from: 'attractions',
          localField: 'attractionId',
          foreignField: '_id',
          as: 'attraction',
        },
      },
      { $unwind: '$attraction' },
      { $match: { 'attraction.partnerId': new Types.ObjectId(partnerId.toString()) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$paymentAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge both
    const revenueMap = new Map<string, number>();
    for (const item of [...hotelRevenue, ...attractionRevenue]) {
      revenueMap.set(item._id, (revenueMap.get(item._id) || 0) + item.revenue);
    }

    return Array.from(revenueMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, revenue]) => ({ month, revenue }));
  }
}
