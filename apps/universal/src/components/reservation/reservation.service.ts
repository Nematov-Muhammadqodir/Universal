import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ReservationInfo } from '../../libs/dto/reservationInfo/reservationInfo';
import { ReservationInfoInput } from '../../libs/dto/reservationInfo/reservationInfo.input';
import { Message } from '../../libs/enums/common.enum';
import { PartnerService } from '../partner/partner/partner.service';
import { PartnerPropertyRoom } from '../../libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { OrdinaryInquery } from '../../libs/dto/partner/partnerProperty/partnerProperty.input';
import { PartnerProperties } from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { T } from '../../libs/types/common';
import { lookupVisit, lookupVisitForReservation } from '../../libs/config';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('ReservationInfoSchema')
    private readonly reservationModel: Model<ReservationInfo>,
    @InjectModel('PartnerPropertyRoomSchema')
    private readonly partnerPropertyRoomModel: Model<PartnerPropertyRoom>,
    private partnerService: PartnerService,
  ) {}

  public async addReservationInfo(
    input: ReservationInfoInput,
  ): Promise<ReservationInfo> {
    try {
      const { roomId, propertyId, startDate, endDate } = input;
      const exists = await this.partnerPropertyRoomModel
        .findOne({ _id: roomId, propertyId })
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
        const result: ReservationInfo =
          await this.reservationModel.create(input);
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

      // Convert string → ObjectId
      {
        $addFields: {
          propertyIdObj: { $toObjectId: '$propertyId' },
          roomIdObj: { $toObjectId: '$roomId' },
        },
      },

      // Fetch room data
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

      // Fetch property data
      {
        $lookup: {
          from: 'partnersProperties',
          localField: 'propertyIdObj',
          foreignField: '_id',
          as: 'reservedProperty',
        },
      },
      { $unwind: '$reservedProperty' },

      // Add roomId directly to final response
      // {
      //   $addFields: {
      //     roomId: '$roomIdObj', // return ObjectId then convert to string later
      //   },
      // },

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

    const result: PartnerProperties = {
      list: data[0].list.map((ele) => ({
        ...ele.reservedProperty,
        // roomId: ele.roomData?._id?.toString() ?? '', // ✅ RETURNING roomId NOW
        roomData: ele.roomData ?? {}, // never null
      })),
      metaCounter: data[0].metaCounter,
    };

    console.log('RESULT', result);

    return result;
  }
}
