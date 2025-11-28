import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ReservationService } from './reservation.service';
import { ReservationInfo } from '../../libs/dto/reservationInfo/reservationInfo';
import { ReservationInfoInput } from '../../libs/dto/reservationInfo/reservationInfo.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class ReservationResolver {
  constructor(private readonly reservationService: ReservationService) {}

  @Mutation(() => ReservationInfo)
  public async addReservationInfo(
    @Args('input') input: ReservationInfoInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<ReservationInfo> {
    console.log('Mutation addReservationInfo');
    return await this.reservationService.addReservationInfo(input);
  }
}
