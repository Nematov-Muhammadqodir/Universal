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
import { AttractionReservation } from '../../libs/dto/attractionReservation/attractionReservation';
import {
  AttractionReservationInput,
  CreateAttractionPaymentIntentInput,
} from '../../libs/dto/attractionReservation/attractionReservation.input';
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
  @Mutation(() => String)
  public async createPaymentIntent(
    @Args('input') input: CreatePaymentIntentInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<string> {
    console.log('Mutation createPaymentIntent');
    const result = await this.reservationService.createPaymentIntent(input);
    console.log('Resolver result:', result);
    return result.clientSecret;
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

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async createAttractionPaymentIntent(
    @Args('input') input: CreateAttractionPaymentIntentInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<string> {
    console.log('Mutation createAttractionPaymentIntent');
    const result = await this.reservationService.createAttractionPaymentIntent(input);
    return result.clientSecret;
  }

  @UseGuards(AuthGuard)
  @Query(() => [AttractionReservation])
  public async getAttractionReservations(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<AttractionReservation[]> {
    console.log('Query: getAttractionReservations');
    return await this.reservationService.getAttractionReservations(memberId);
  }

  @UseGuards(AuthGuard)
  @Query(() => [AttractionReservation])
  public async getOwnerAttractionReservations(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<AttractionReservation[]> {
    console.log('Query: getOwnerAttractionReservations');
    return await this.reservationService.getOwnerAttractionReservations(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => AttractionReservation)
  public async addAttractionReservation(
    @Args('input') input: AttractionReservationInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<AttractionReservation> {
    console.log('Mutation addAttractionReservation');
    return await this.reservationService.addAttractionReservation(input);
  }
}
