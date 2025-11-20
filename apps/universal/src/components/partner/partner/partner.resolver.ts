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
import { PartnerProperty } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty';
import { PartnerPropertyInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.input';
import { AuthMember } from '../../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';
import { PartnerPropertyRoomInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.input';
import { PartnerPropertyRoom } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';

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
}
