import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReservationInfo } from '../../libs/dto/reservationInfo/reservationInfo';
import { ReservationInfoInput } from '../../libs/dto/reservationInfo/reservationInfo.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('ReservationInfoSchema')
    private readonly reservationModel: Model<ReservationInfo>,
  ) {}

  public async addReservationInfo(
    input: ReservationInfoInput,
  ): Promise<ReservationInfo> {
    try {
      const result: ReservationInfo = await this.reservationModel.create(input);

      return result;
    } catch (err) {
      console.log('Error, addReservationInfo', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }
}
