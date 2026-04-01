import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AttractionService } from './attraction.service';
import { Attraction, Attractions } from 'apps/universal/src/libs/dto/attraction/attraction';
import {
  AttractionInput,
  AttractionUpdate,
  AttractionsInquiry,
} from 'apps/universal/src/libs/dto/attraction/attraction.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'apps/universal/src/libs/enums/user.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';
import { LikeService } from '../like/like.service';
import { LikeGroup } from 'apps/universal/src/libs/enums/like.enum';

@Resolver()
export class AttractionResolver {
  constructor(
    private readonly attractionService: AttractionService,
    private readonly likeService: LikeService,
  ) {}

  @Roles(UserRole.ATTRACTION_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => Attraction)
  public async createAttraction(
    @Args('input') input: AttractionInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attraction> {
    console.log('Mutation: createAttraction');
    input.partnerId = memberId;

    return await this.attractionService.createAttraction(input);
  }

  @Roles(UserRole.ATTRACTION_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => Attraction)
  public async updateAttraction(
    @Args('input') input: AttractionUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attraction> {
    console.log('Mutation: updateAttraction');

    return await this.attractionService.updateAttraction(input, memberId);
  }

  @Roles(UserRole.ATTRACTION_OWNER)
  @UseGuards(RolesGuard)
  @Mutation(() => Attraction)
  public async deleteAttraction(
    @Args('attractionId') attractionId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attraction> {
    console.log('Mutation: deleteAttraction');

    return await this.attractionService.deleteAttraction(attractionId, memberId);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => Attraction)
  public async getAttraction(
    @Args('attractionId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attraction> {
    console.log('Query: getAttraction');
    const attractionId = shapeIntoMongoObjectId(input);
    return await this.attractionService.getAttraction(attractionId, memberId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Attractions)
  public async getAllAttractions(
    @Args('input') input: AttractionsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attractions> {
    console.log('Query: getAllAttractions');

    return await this.attractionService.getAllAttractions(input, memberId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [Attraction])
  public async getAttractionsByOwner(
    @Args('partnerId') input: string,
  ): Promise<Attraction[]> {
    console.log('Query: getAttractionsByOwner');
    const partnerId = shapeIntoMongoObjectId(input);
    return await this.attractionService.getAttractionsByOwner(partnerId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Attraction)
  public async likeTargetAttraction(
    @Args('attractionId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Attraction> {
    console.log('Mutation: likeTargetAttraction');
    const likeRefId = shapeIntoMongoObjectId(input);
    const modifier = await this.likeService.toggleLike({
      memberId,
      likeRefId,
      likeGroup: LikeGroup.ATTRACTION,
    });

    const result = await this.attractionService.likeTargetAttraction(
      likeRefId,
      modifier,
    );
    return result;
  }
}
