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
    console.log('getReservedRooms input', input);
    const match: T = { guestId: String(memberId) };
    console.log('match', match);

    const data = await this.reservationModel.aggregate([
      { $match: match },
      { $sort: { updatedAt: -1 } },
      {
        $addFields: {
          propertyIdObj: { $toObjectId: '$propertyId' },
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
    console.log('data', data);
    const result: PartnerProperties = {
      list: [],
      metaCounter: data[0].metaCounter,
    };
    result.list = data[0].list.map((ele) => ele.reservedProperty);
    console.log('result', result);

    return result;
  }
}
