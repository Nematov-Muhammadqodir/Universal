import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PartnerService } from './partner.service';
import { Partner } from 'apps/universal/src/libs/dto/partner/partner';
import {
  PartnerInput,
  PartnerLoginInput,
} from 'apps/universal/src/libs/dto/partner/partner.input';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'apps/universal/src/libs/enums/user.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  PartnerProperties,
  PartnerProperty,
} from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty';
import {
  AllPropertiesSearchInput,
  AvailablePropertiesSearchInput,
  OrdinaryInquery,
  PartnerPropertyInput,
} from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.input';
import { AuthMember } from '../../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';
import { PartnerPropertyRoomInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.input';
import { PartnerPropertyRoom } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { PartnerPropertyUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.update';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PartnerPropertyRoomUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.update';
import { OwnerReservations } from 'apps/universal/src/libs/dto/reservationInfo/reservationInfo.owner';
import { MostPickedItem } from 'apps/universal/src/libs/dto/mostPicked/mostPicked';

@Resolver()
export class PartnerResolver {
  constructor(private readonly partnerService: PartnerService) {}

  @Mutation(() => Partner)
  public async partnerSignup(
    @Args('input') input: PartnerInput,
  ): Promise<Partner> {
    console.log('Mutation signup');
    console.log('Input', input);

    return await this.partnerService.partnerSignup(input);
  }

  @Mutation(() => Partner)
  public async partnerLogin(
    @Args('input') input: PartnerLoginInput,
  ): Promise<Partner> {
    console.log('Mutation partnerLogin');
    console.log('Input', input);

    return await this.partnerService.partnerLogin(input);
  }

  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => PartnerProperty)
  public async createPartnerProperty(
    @Args('input') input: PartnerPropertyInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Mutation: PartnerProperty');
    input.partnerId = memberId;

    return await this.partnerService.createPartnerProperty(input);
  }

  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => PartnerProperty)
  public async updatePartnerProperty(
    @Args('input') input: PartnerPropertyUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Mutation: PartnerProperty');

    return await this.partnerService.updatePartnerProperty(input, memberId);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => PartnerProperty)
  public async getPartnerProperty(
    @Args('propertyId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Query: getPartnerProperty');
    console.log('memberId', memberId);
    const propertyId = shapeIntoMongoObjectId(input);
    return await this.partnerService.getPartnerProperty(memberId, propertyId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [PartnerProperty])
  public async getAllAvailableProperties(
    @Args('input') input: AvailablePropertiesSearchInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty[]> {
    console.log('Query: getAllAvailableProperties');

    return await this.partnerService.getAllAvailableProperties(input, memberId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => PartnerProperties)
  public async getAllProperties(
    @Args('input') input: AllPropertiesSearchInput,
  ): Promise<PartnerProperties> {
    console.log('Query: getAllProperties');

    return await this.partnerService.getAllProperties(input);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => PartnerProperty)
  public async getPartnerPropertyByHotelOwner(
    @Args('parnerId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Query: getPartnerProperty');
    console.log('memberId', memberId);
    const partnerId = shapeIntoMongoObjectId(input);
    return await this.partnerService.getPartnerPropertyByHotelOwner(
      memberId,
      partnerId,
    );
  }

  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => PartnerPropertyRoom)
  public async createPartnerPropertyRoom(
    @Args('input') input: PartnerPropertyRoomInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    console.log('Mutation: createPartnerPropertyRoom');

    return await this.partnerService.createPartnerPropertyRoom(input);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => PartnerPropertyRoom)
  public async getPartnerPropertyRoom(
    @Args('roomId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    console.log('Query: getPartnerPropertyRoom');
    console.log('memberId', memberId);
    const propertyId = shapeIntoMongoObjectId(input);
    return await this.partnerService.getPartnerPropertyRoom(propertyId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => PartnerPropertyRoom)
  public async updatePartnerPropertyRoom(
    @Args('input') input: PartnerPropertyRoomUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    console.log('Mutation: updatePartnerPropertyRoom');

    return await this.partnerService.updatePartnerPropertyRoom(input, memberId);
  }

  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => PartnerPropertyRoom)
  public async deletePartnerPropertyRoom(
    @Args('roomId') roomId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    console.log('Mutation: deletePartnerPropertyRoom');
    return await this.partnerService.deletePartnerPropertyRoom(roomId, memberId);
  }

  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(RolesGuard)
  @Query(() => OwnerReservations)
  public async getOwnerReservations(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<OwnerReservations> {
    console.log('Query: getOwnerReservations');
    return await this.partnerService.getOwnerReservations(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query((returns) => PartnerProperties)
  public async getVisitedProperties(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperties> {
    console.log('Query: getVisitedProperties');
    return await this.partnerService.getVisitedProperties(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query((returns) => PartnerProperties)
  public async getLikedProperties(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperties> {
    console.log('Query: getLikedProperties');
    return await this.partnerService.getLikedProperties(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => PartnerProperty)
  public async likeTargetProperty(
    @Args('propertyId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Mutation: likeTargetProperty');
    const likeRefId = shapeIntoMongoObjectId(input);
    return await this.partnerService.likeTargetProperty(memberId, likeRefId);
  }

  @Query(() => [MostPickedItem])
  public async getMostPicked(): Promise<MostPickedItem[]> {
    console.log('Query: getMostPicked');
    return await this.partnerService.getMostPicked();
  }
}
