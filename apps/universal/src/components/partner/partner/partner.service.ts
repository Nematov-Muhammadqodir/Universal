import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Partner } from 'apps/universal/src/libs/dto/partner/partner';
import { Model, ObjectId } from 'mongoose';
import { AuthService } from '../../auth/auth.service';
import {
  PartnerInput,
  PartnerLoginInput,
} from 'apps/universal/src/libs/dto/partner/partner.input';
import { Message } from 'apps/universal/src/libs/enums/common.enum';
import { GuestStatus } from 'apps/universal/src/libs/enums/user.enum';
import {
  AllPropertiesSearchInput,
  AvailablePropertiesSearchInput,
  OrdinaryInquery,
  PartnerPropertyInput,
} from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.input';
import {
  PartnerProperties,
  PartnerProperty,
} from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty';
import { StatisticModifier, T } from 'apps/universal/src/libs/types/common';
import { PropertyStatus } from 'apps/universal/src/libs/enums/property.enum';
import { ViewService } from '../../view/view.service';
import { ViewGroup } from 'apps/universal/src/libs/enums/view.enum';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';
import { PartnerPropertyRoom } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { PartnerPropertyRoomInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.input';
import { PartnerPropertyUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.update';
import { PartnerPropertyRoomUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.update';
import { LikeInput } from 'apps/universal/src/libs/dto/like/like.input';
import { LikeGroup } from 'apps/universal/src/libs/enums/like.enum';
import { LikeService } from '../../like/like.service';

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel('Partner') private readonly partnerModel: Model<Partner>,
    @InjectModel('PartnerPropertyRoomSchema')
    private readonly partnerPropertyRoomModel: Model<PartnerPropertyRoom>,
    @InjectModel('PartnerPropertySchema')
    private readonly partnerPropertyModel: Model<PartnerProperty>,
    private authService: AuthService,
    private viewService: ViewService,
    private likeService: LikeService,
  ) {}

  public async partnerSignup(input: PartnerInput): Promise<Partner> {
    input.partnerPassword = await this.authService.hashPassword(
      input.partnerPassword,
    );

    const isSameEmail = await this.partnerModel
      .findOne({ partnerEmail: input.partnerEmail })
      .exec();

    const isSamePhone = await this.partnerModel
      .findOne({ guestPhone: input.partnerPhoneNumber })
      .exec();

    if (isSameEmail || isSamePhone) {
      throw new BadRequestException(Message.PLEASE_ENTER_VALID_CREDENTIALS);
    }

    console.log('partnerSignup signup', input);

    try {
      const result: Partner = await this.partnerModel.create(input);
      //TODO: Authentication with tokens
      result.accessToken = await this.authService.createToken(result);

      return result;
    } catch (err) {
      console.log('Error, partnerSignup', err.message);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async partnerLogin(input: PartnerLoginInput): Promise<Partner> {
    console.log('partnerLogin input', input);
    const { partnerEmail, partnerPassword } = input;
    const response: Partner = await this.partnerModel
      .findOne({ partnerEmail: partnerEmail })
      .select('+partnerPassword')
      .exec();

    console.log('partnerLogin response', response);
    if (!response || response.memberStatus === GuestStatus.DELETE) {
      throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
    } else if (response.memberStatus === GuestStatus.BLOCK) {
      throw new InternalServerErrorException(Message.BLOCKED_USER);
    }

    const isMatch = await this.authService.comparePassword(
      partnerPassword,
      response.partnerPassword,
    );
    if (!isMatch)
      throw new InternalServerErrorException(Message.WRONG_PASSWORD);
    response.accessToken = await this.authService.createToken(response);
    return response;
  }

  public async getPartner(partnerId: string): Promise<Partner> {
    const targetId = shapeIntoMongoObjectId(partnerId);
    const search: T = {
      _id: targetId,
      memberStatus: { $in: [GuestStatus.ACTIVE, GuestStatus.BLOCK] },
    };
    const targetMember = await this.partnerModel.findOne(search).lean().exec();
    if (!targetMember)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return targetMember;
  }

  public async createPartnerProperty(
    input: PartnerPropertyInput,
  ): Promise<PartnerProperty> {
    try {
      const result = await this.partnerPropertyModel.create(input);
      return result;
    } catch (err) {
      console.log('Error, Service.model', err.message);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async updatePartnerProperty(
    input: PartnerPropertyUpdate,
    memberId: ObjectId,
  ): Promise<PartnerProperty> {
    try {
      const result = await this.partnerPropertyModel.findByIdAndUpdate(
        { _id: input._id, partnerId: memberId },
        { propertyImages: input.propertyImages },
        { new: true },
      );
      return result;
    } catch (err) {
      console.log('Error, Service.model', err.message);
      throw new BadRequestException(Message.UPDATE_FAILED);
    }
  }

  public async getPartnerProperty(
    memberId: ObjectId,
    propertyId: ObjectId,
  ): Promise<PartnerProperty> {
    const search: T = {
      _id: propertyId,
      propertyStatus: PropertyStatus.ACTIVE,
    };

    const targetProperty: any = await this.partnerPropertyModel
      .findOne(search)
      .lean()
      .exec();

    if (!targetProperty)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    /** ------------------------------------------
     *  🔹 Attach REAL Rooms
     * ------------------------------------------ */
    const rooms = await this.partnerPropertyRoomModel
      .find({ propertyId })
      .lean()
      .exec();

    targetProperty.propertyRooms = rooms.map((room) => ({
      roomId: room._id.toString(),
      roomType: room.roomType,
      roomPricePerNight: room.roomPricePerNight,
      numberOfGuestsCanStay: room.numberOfGuestsCanStay,
      availableBeds: room.availableBeds,
      reservedDates: room.reservedDates || [],
      roomFacilities: room.roomFacilities,
      availableBathroomFacilities: room.availableBathroomFacilities,
      isBathroomPrivate: room.isBathroomPrivate,
      isSmokingAllowed: room.isSmokingAllowed,
      roomName: room.roomName,
    }));

    /** ------------------------------------------
     *  🔹 Add view count (if logged in)
     * ------------------------------------------ */
    if (memberId) {
      const viewInput = {
        memberId,
        viewRefId: propertyId,
        viewGroup: ViewGroup.PROPERTY,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.propertyStatsEditor({
          _id: propertyId,
          targetKey: 'propertyViews',
          modifier: 1,
        });
        targetProperty.propertyViews++;
      }
    }

    /** ------------------------------------------
     *  🔹 Attach Partner Info
     * ------------------------------------------ */
    targetProperty.memberData = await this.getPartner(targetProperty.partnerId);

    /** ------------------------------------------
     *  🔹 ⭐ ADD meLiked INFORMATION
     * ------------------------------------------ */

    if (memberId) {
      targetProperty.meLiked = await this.likeService.checkLikeExistance({
        memberId: memberId,
        likeRefId: propertyId,
        likeGroup: LikeGroup.PROPERTY,
      });
    }

    return targetProperty;
  }

  public async getAllAvailableProperties(
    input: AvailablePropertiesSearchInput,
  ): Promise<PartnerProperty[]> {
    const {
      propertyRegion,
      propertyCity,
      propertyType,
      propertyStars,
      breakfastIncluded,
      parkingIncluded,
      allowChildren,
      allowPets,
      from,
      until,
      adults,
      children,
      page,
      limit,
    } = input;

    // ✅ If any property-level filter exists, query partnerPropertyModel
    const isPropertyLevelFilter =
      (propertyType?.length ?? 0) > 0 ||
      !!propertyCity ||
      propertyStars !== undefined ||
      breakfastIncluded !== undefined ||
      parkingIncluded !== undefined ||
      allowChildren !== undefined ||
      allowPets !== undefined;

    console.log('isPropertyLevelFilter', isPropertyLevelFilter);

    if (isPropertyLevelFilter) {
      const match: any = { propertyStatus: PropertyStatus.ACTIVE };

      if (propertyType && propertyType.length > 0) {
        match.propertyType = { $in: propertyType };
      }
      if (propertyCity) match.propertyCity = propertyCity;
      if (propertyStars !== undefined)
        match.propertyStars = { $gte: propertyStars };
      if (breakfastIncluded !== undefined)
        match.breakfastIncluded = breakfastIncluded;
      if (parkingIncluded !== undefined)
        match.parkingIncluded = parkingIncluded;
      if (allowChildren !== undefined) match.allowChildren = allowChildren;
      if (allowPets !== undefined) match.allowPets = allowPets;
      if (propertyRegion)
        match.propertyRegion = { $regex: new RegExp(propertyRegion, 'i') };

      const result = await this.partnerPropertyModel.aggregate([
        { $match: match },
        {
          $facet: {
            list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ]);

      if (!result.length) return [];
      return result[0].list;
    }

    // ✅ Otherwise, use room-level aggregation (region, dates, guests)
    const matchConditions: any = {};

    if (propertyRegion) {
      matchConditions.roomPropertyLocation = {
        $regex: new RegExp(propertyRegion, 'i'),
      };
    }

    if (adults !== undefined || children !== undefined) {
      const totalGuests = (adults || 0) + (children || 0);
      if (totalGuests > 0)
        matchConditions.numberOfGuestsCanStay = { $gte: totalGuests };
    }

    if (from && until) {
      const fromDate = new Date(from);
      const untilDate = new Date(until);

      matchConditions.reservedDates = {
        $not: {
          $elemMatch: {
            from: { $lte: untilDate },
            until: { $gte: fromDate },
          },
        },
      };
    }

    // Aggregate rooms
    const availableRooms = await this.partnerPropertyRoomModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'partnersProperties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'property',
        },
      },
      { $unwind: '$property' },
      {
        $match: {
          'property.propertyStatus': PropertyStatus.ACTIVE,
          ...(propertyStars !== undefined && {
            'property.propertyStars': { $gte: propertyStars },
          }),
          ...(breakfastIncluded !== undefined && {
            'property.breakfastIncluded': breakfastIncluded,
          }),
          ...(parkingIncluded !== undefined && {
            'property.parkingIncluded': parkingIncluded,
          }),
          ...(allowChildren !== undefined && {
            'property.allowChildren': allowChildren,
          }),
          ...(allowPets !== undefined && { 'property.allowPets': allowPets }),
        },
      },
    ]);

    // Merge rooms by property
    const propertiesMap: Record<string, any> = {};

    availableRooms.forEach((room) => {
      const propId = room.property._id.toString();
      if (!propertiesMap[propId]) {
        propertiesMap[propId] = { ...room.property, propertyRooms: [] };
      }

      propertiesMap[propId].propertyRooms.push({
        roomId: room._id,
        roomType: room.roomType,
        roomPricePerNight: room.roomPricePerNight,
        numberOfGuestsCanStay: room.numberOfGuestsCanStay,
        availableBeds: room.availableBeds,
        reservedDates: room.reservedDates,
        roomFacilities: room.roomFacilities,
        availableBathroomFacilities: room.availableBathroomFacilities,
        isBathroomPrivate: room.isBathroomPrivate,
        isSmokingAllowed: room.isSmokingAllowed,
        roomName: room.roomName,
      });
    });

    const allProperties = Object.values(propertiesMap);

    // Pagination
    const skip = (page - 1) * limit;
    return allProperties.slice(skip, skip + limit);
  }

  public async getAllProperties(
    input: AllPropertiesSearchInput,
  ): Promise<PartnerProperties> {
    const { propertyType, propertyCity, page, limit } = input;

    const match: T = { propertyStatus: PropertyStatus.ACTIVE };

    if (propertyType) {
      match.propertyType = propertyType;
    }
    if (propertyCity) {
      match.propertyCity = propertyCity;
    }

    const result = await this.partnerPropertyModel.aggregate([
      { $match: match },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    console.log('RESULT', result[0]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getPartnerPropertyByHotelOwner(
    memberId: ObjectId,
    partnerId: ObjectId,
  ): Promise<PartnerProperty> {
    const targetProperty: any = await this.partnerPropertyModel
      .findOne({ partnerId: partnerId })
      .lean()
      .exec();
    if (!targetProperty)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    // ✅ Fetch actual rooms for this property
    const rooms = await this.partnerPropertyRoomModel
      .find({
        propertyId: targetProperty._id,
      })
      .lean()
      .exec();

    // ✅ Transform rooms to match PropertyRoom type
    targetProperty.propertyRooms = rooms.map((room) => ({
      roomId: room._id.toString(),
      roomType: room.roomType,
      roomPricePerNight: room.roomPricePerNight,
      numberOfGuestsCanStay: room.numberOfGuestsCanStay,
      availableBeds: room.availableBeds,
      reservedDates: room.reservedDates || [],
      roomFacilities: room.roomFacilities,
      availableBathroomFacilities: room.availableBathroomFacilities,
      isBathroomPrivate: room.isBathroomPrivate,
      isSmokingAllowed: room.isSmokingAllowed,
      roomName: room.roomName,
    }));

    targetProperty.memberData = await this.getPartner(targetProperty.partnerId);
    return targetProperty;
  }

  public async createPartnerPropertyRoom(
    input: PartnerPropertyRoomInput,
  ): Promise<PartnerPropertyRoom> {
    try {
      const exists = await this.partnerPropertyModel.findById(input.propertyId);
      if (!exists) {
        throw new BadRequestException(Message.WE_DO_NOT_HAVE_THIS_PROPERTY);
      } else {
        input.roomPropertyLocation = exists.propertyRegion;
      }

      const result = await this.partnerPropertyRoomModel.create(input);
      return result;
    } catch (err) {
      console.log('Error, Service.model', err.message);
      throw new BadRequestException(Message.WE_DO_NOT_HAVE_THIS_PROPERTY);
    }
  }

  public async getPartnerPropertyRoom(
    propertyId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    const targetPropertyRoom: any = await this.partnerPropertyRoomModel
      .findOne({ _id: propertyId })
      .lean()
      .exec();

    console.log('targetPropertyRoom', targetPropertyRoom);

    if (!targetPropertyRoom)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return targetPropertyRoom;
  }

  public async updatePartnerPropertyRoom(
    input: PartnerPropertyRoomUpdate,
    memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    try {
      const room = await this.partnerPropertyRoomModel.findById(input._id);
      if (!room) throw new BadRequestException('Room not found');

      const existingReservedDates = room.reservedDates || [];

      const newReservedDates = input.reservedDates?.map((date) => ({
        ...date,
        userId: memberId.toString(),
      }));

      if (!newReservedDates || newReservedDates.length === 0)
        throw new BadRequestException('No new reservations provided');

      for (const newDate of newReservedDates) {
        const overlap = existingReservedDates.some(
          (reserved) =>
            reserved.from <= newDate.until && reserved.until >= newDate.from,
        );
        if (overlap) {
          throw new BadRequestException(
            `Room is not available from ${newDate.from.toISOString()} to ${newDate.until.toISOString()}`,
          );
        }
      }

      const result = await this.partnerPropertyRoomModel.findByIdAndUpdate(
        input._id,
        {
          $push: { reservedDates: { $each: newReservedDates } },
        },
        { new: true },
      );

      return result;
    } catch (err) {
      console.log('Error, Service.model', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async getVisitedProperties(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<PartnerProperties> {
    console.log('memberId', memberId);
    return await this.viewService.getVisitedProperties(memberId, input);
  }

  public async getLikedProperties(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<PartnerProperties> {
    console.log('memberId', memberId);
    return await this.likeService.getFavoriteProperties(memberId, input);
  }

  public async likeTargetProperty(
    memberId: ObjectId,
    likeRefId: ObjectId,
  ): Promise<PartnerProperty> {
    console.log('Service: likeTargetProperty');

    const target: PartnerProperty = await this.partnerPropertyModel
      .findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })
      .exec();
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input: LikeInput = {
      memberId: memberId,
      likeRefId: likeRefId,
      likeGroup: LikeGroup.PROPERTY,
    };

    // Like Toggle
    const modifier: number = await this.likeService.toggleLike(input);

    const result = await this.propertyStatsEditor({
      _id: likeRefId,
      targetKey: 'propertyLikes',
      modifier: modifier,
    });

    if (!result)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
    return result;
  }

  public async propertyStatsEditor(
    input: StatisticModifier,
  ): Promise<PartnerProperty> {
    console.log('Service: propertyStatsEditor');
    const { _id, targetKey, modifier } = input;

    return await this.partnerPropertyModel
      .findByIdAndUpdate(
        _id,
        { $inc: { [targetKey]: modifier } },
        { new: true },
      )
      .exec();
  }
}
