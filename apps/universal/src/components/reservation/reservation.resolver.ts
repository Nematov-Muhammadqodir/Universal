import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ReservationService } from './reservation.service';
import {
  ReservationInfo,
  StripePaymentIntent,
} from '../../libs/dto/reservationInfo/reservationInfo';
import {
  CreatePaymentIntentInput,
  ReservationInfoInput,
} from '../../libs/dto/reservationInfo/reservationInfo.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { PartnerProperties } from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { OrdinaryInquery } from '../../libs/dto/partner/partnerProperty/partnerProperty.input';

@Resolver()
export class ReservationResolver {
  constructor(private readonly reservationService: ReservationService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => StripePaymentIntent)
  public async createPaymentIntent(
    @Args('input') input: CreatePaymentIntentInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<StripePaymentIntent> {
    console.log('Mutation createPaymentIntent');
    return await this.reservationService.createPaymentIntent(input);
  }

  @Mutation(() => ReservationInfo)
  public async addReservationInfo(
    @Args('input') input: ReservationInfoInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<ReservationInfo> {
    console.log('Mutation addReservationInfo');
    return await this.reservationService.addReservationInfo(input);
  }

  @UseGuards(AuthGuard)
  @Query((returns) => PartnerProperties)
  public async getReservedRooms(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperties> {
    console.log('Query: getReservedRooms');
    return await this.reservationService.getReservedRooms(memberId, input);
  }
}
