import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  ReservationInfo,
  StripePaymentIntent,
} from '../../libs/dto/reservationInfo/reservationInfo';
import {
  CreatePaymentIntentInput,
  ReservationInfoInput,
} from '../../libs/dto/reservationInfo/reservationInfo.input';
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
    private partnerService: PartnerService,
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
}
