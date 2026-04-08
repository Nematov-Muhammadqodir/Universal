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
import { ReservationInfo } from 'apps/universal/src/libs/dto/reservationInfo/reservationInfo';
import { OwnerReservations } from 'apps/universal/src/libs/dto/reservationInfo/reservationInfo.owner';

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel('Partner') private readonly partnerModel: Model<Partner>,
    @InjectModel('PartnerPropertyRoomSchema')
    private readonly partnerPropertyRoomModel: Model<PartnerPropertyRoom>,
    @InjectModel('PartnerPropertySchema')
    private readonly partnerPropertyModel: Model<PartnerProperty>,
    @InjectModel('ReservationInfoSchema')
    private readonly reservationModel: Model<ReservationInfo>,
    @InjectModel('AttractionSchema')
    private readonly attractionModel: Model<any>,
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
    memberId?: ObjectId,
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
      priceMin,
      priceMax,
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

      const pipeline: any[] = [{ $match: match }];

      // If price filter, join rooms and filter by price
      if (priceMin !== undefined || priceMax !== undefined) {
        pipeline.push({
          $lookup: {
            from: 'partnerPropertyRooms',
            localField: '_id',
            foreignField: 'propertyId',
            as: '_rooms',
          },
        });
        const roomPriceMatch: any = {};
        if (priceMin !== undefined) roomPriceMatch.$gte = priceMin;
        if (priceMax !== undefined) roomPriceMatch.$lte = priceMax;
        pipeline.push({
          $match: { '_rooms.roomPricePerNight': roomPriceMatch },
        });
        pipeline.push({ $project: { _rooms: 0 } });
      }

      pipeline.push({
        $facet: {
          list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          metaCounter: [{ $count: 'total' }],
        },
      });

      const result = await this.partnerPropertyModel.aggregate(pipeline);

      if (!result.length) return [];
      const properties = result[0].list;
      return await this.attachMeLiked(properties, memberId);
    }

    // ✅ Otherwise, use region-based property search with room availability info
    const propertyMatch: any = { propertyStatus: PropertyStatus.ACTIVE };

    if (propertyRegion) {
      propertyMatch.propertyRegion = {
        $regex: new RegExp(propertyRegion, 'i'),
      };
    }
    if (propertyStars !== undefined)
      propertyMatch.propertyStars = { $gte: propertyStars };
    if (breakfastIncluded !== undefined)
      propertyMatch.breakfastIncluded = breakfastIncluded;
    if (parkingIncluded !== undefined)
      propertyMatch.parkingIncluded = parkingIncluded;
    if (allowChildren !== undefined)
      propertyMatch.allowChildren = allowChildren;
    if (allowPets !== undefined) propertyMatch.allowPets = allowPets;

    // Fetch all matching properties
    const properties = await this.partnerPropertyModel
      .find(propertyMatch)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    // Fetch rooms for these properties and attach only available ones
    const propertyIds = properties.map((p) => p._id);
    const allRooms = await this.partnerPropertyRoomModel
      .find({ propertyId: { $in: propertyIds } })
      .lean()
      .exec();

    const totalGuests =
      ((adults || 0) + (children || 0)) > 0
        ? (adults || 0) + (children || 0)
        : 0;
    const fromDate = from ? new Date(from) : null;
    const untilDate = until ? new Date(until) : null;

    const enrichedProperties = properties.map((property: any) => {
      const rooms = allRooms
        .filter((r) => r.propertyId.toString() === property._id.toString())
        .filter((room) => {
          // Filter by guest capacity
          if (totalGuests > 0 && room.numberOfGuestsCanStay < totalGuests)
            return false;

          // Filter by price range
          const roomPrice = Number(room.roomPricePerNight);
          if (priceMin !== undefined && roomPrice < priceMin) return false;
          if (priceMax !== undefined && roomPrice > priceMax) return false;

          // Filter by date availability
          if (fromDate && untilDate && room.reservedDates?.length) {
            const hasConflict = room.reservedDates.some((rd: any) => {
              const rdFrom = new Date(rd.from).getTime();
              const rdUntil = new Date(rd.until).getTime();
              return fromDate.getTime() < rdUntil && untilDate.getTime() > rdFrom;
            });
            if (hasConflict) return false;
          }

          return true;
        });

      property.propertyRooms = rooms.map((room) => ({
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
      }));

      return property;
    });

    // If price filter is active, exclude properties with no matching rooms
    const filtered = (priceMin !== undefined || priceMax !== undefined)
      ? enrichedProperties.filter((p: any) => p.propertyRooms?.length > 0)
      : enrichedProperties;

    return await this.attachMeLiked(filtered, memberId);
  }

  private async attachMeLiked(
    properties: any[],
    memberId?: ObjectId,
  ): Promise<any[]> {
    if (!memberId || !properties.length) return properties;

    const propertyIds = properties.map((p) => p._id);
    const likes = await this.likeService.checkLikesForProperties(
      memberId,
      propertyIds,
    );

    return properties.map((p) => {
      const liked = likes.find(
        (l) => l.likeRefId?.toString() === p._id?.toString(),
      );
      p.meLiked = liked
        ? [{ memberId: memberId.toString(), likeRefId: p._id.toString(), myFavorite: true }]
        : [];
      return p;
    });
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

      const update: any = {};

      // Handle reserved dates (existing booking flow)
      if (input.reservedDates?.length) {
        const existingReservedDates = room.reservedDates || [];
        const newReservedDates = input.reservedDates.map((date) => ({
          ...date,
          userId: memberId.toString(),
        }));

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
        update.$push = { reservedDates: { $each: newReservedDates } };
      }

      // Handle room field updates (dashboard editing)
      const setFields: any = {};
      const editableFields = [
        'roomType', 'roomName', 'roomPricePerNight', 'numberOfGuestsCanStay',
        'currentRoomTypeAmount', 'availableBeds', 'isSmokingAllowed',
        'isBathroomPrivate', 'roomFacilities', 'availableBathroomFacilities',
      ];

      for (const field of editableFields) {
        if (input[field] !== undefined && input[field] !== null) {
          setFields[field] = input[field];
        }
      }

      if (Object.keys(setFields).length > 0) {
        update.$set = setFields;
      }

      if (!update.$push && !update.$set) {
        throw new BadRequestException('No updates provided');
      }

      const result = await this.partnerPropertyRoomModel.findByIdAndUpdate(
        input._id,
        update,
        { new: true },
      );

      return result;
    } catch (err) {
      console.log('Error, Service.model', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async deletePartnerPropertyRoom(
    roomId: string,
    memberId: ObjectId,
  ): Promise<PartnerPropertyRoom> {
    const room = await this.partnerPropertyRoomModel.findById(roomId).lean();
    if (!room) throw new BadRequestException('Room not found');

    // Verify ownership
    const property = await this.partnerPropertyModel
      .findOne({ _id: room.propertyId, partnerId: memberId })
      .lean();
    if (!property) throw new BadRequestException('Unauthorized: not your property');

    const result = await this.partnerPropertyRoomModel.findByIdAndDelete(roomId);
    return result;
  }

  public async getOwnerReservations(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<OwnerReservations> {
    const { page, limit } = input;

    // Find the partner's property
    const property = await this.partnerPropertyModel
      .findOne({ partnerId: memberId })
      .lean();
    if (!property) throw new BadRequestException('No property found');

    const propertyId = property._id.toString();

    const data = await this.reservationModel.aggregate([
      { $match: { propertyId } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          roomIdObj: { $toObjectId: '$roomId' },
        },
      },
      {
        $lookup: {
          from: 'partnerPropertyRooms',
          localField: 'roomIdObj',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },
      {
        $unwind: {
          path: '$roomInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    return {
      list: data[0].list.map((r: any) => ({
        _id: r._id,
        guestId: r.guestId,
        guestName: r.guestName,
        guestLastName: r.guestLastName,
        guestEmail: r.guestEmail,
        guestPhoneNumber: r.guestPhoneNumber,
        paymentStatus: r.paymentStatus,
        paymentAmount: r.paymentAmount,
        roomId: r.roomId,
        propertyId: r.propertyId,
        startDate: r.startDate,
        endDate: r.endDate,
        roomType: r.roomInfo?.roomType,
        roomName: r.roomInfo?.roomName,
        roomPricePerNight: r.roomInfo?.roomPricePerNight,
        reservationStatus: r.reservationStatus || 'CONFIRMED',
        stripePaymentIntentId: r.stripePaymentIntentId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      metaCounter: data[0].metaCounter,
    };
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

  public async getThemeParksAndResorts(): Promise<any[]> {
    const [themeParks, resorts] = await Promise.all([
      this.attractionModel
        .find({
          attractionStatus: 'ACTIVE',
          attractionType: { $in: ['Theme Park', 'Water Park'] },
          attractionImages: { $exists: true, $ne: [] },
        })
        .sort({ attractionViews: -1 })
        .limit(6)
        .lean()
        .exec(),
      this.partnerPropertyModel
        .find({
          propertyStatus: 'ACTIVE',
          propertyType: 'Resort',
          propertyImages: { $exists: true, $ne: [] },
        })
        .sort({ propertyViews: -1 })
        .limit(6)
        .lean()
        .exec(),
    ]);

    const items: any[] = [];

    for (const a of themeParks) {
      items.push({
        _id: a._id.toString(),
        itemType: 'ATTRACTION',
        name: a.attractionName,
        city: a.attractionCity,
        country: a.attractionCountry,
        image: a.attractionImages?.[0] ?? '',
        price: a.attractionAdultPrice ?? 0,
        rating: a.averageRating ?? 0,
        totalReviews: a.totalReviews ?? 0,
        attractionType: a.attractionType,
      });
    }

    for (const p of resorts) {
      const rooms = await this.partnerPropertyRoomModel
        .find({ propertyId: p._id })
        .sort({ roomPricePerNight: 1 })
        .limit(1)
        .lean();

      items.push({
        _id: p._id.toString(),
        itemType: 'PROPERTY',
        name: p.propertyName,
        city: p.propertyCity,
        country: p.propertyCountry,
        image: p.propertyImages?.[0] ?? '',
        price: rooms[0]?.roomPricePerNight ?? 0,
        rating: p.staffRating ?? 0,
        totalReviews: p.totalReviews ?? 0,
        propertyType: 'Resort',
      });
    }

    return items;
  }

  public async getAvailableCities(): Promise<string[]> {
    const [propertyCities, attractionCities] = await Promise.all([
      this.partnerPropertyModel.distinct('propertyCity', { propertyStatus: 'ACTIVE' }),
      this.attractionModel.distinct('attractionCity', { attractionStatus: 'ACTIVE' }),
    ]);
    return [...new Set([...propertyCities, ...attractionCities])].sort();
  }

  public async getPlatformStats(): Promise<any> {
    const [totalUsers, totalProperties, totalAttractions, propertyCities, attractionCities] =
      await Promise.all([
        this.partnerModel.db.collection('guests').countDocuments(),
        this.partnerPropertyModel.countDocuments({ propertyStatus: 'ACTIVE' }),
        this.attractionModel.countDocuments({ attractionStatus: 'ACTIVE' }),
        this.partnerPropertyModel.distinct('propertyCity', { propertyStatus: 'ACTIVE' }),
        this.attractionModel.distinct('attractionCity', { attractionStatus: 'ACTIVE' }),
      ]);

    const uniqueCities = new Set([...propertyCities, ...attractionCities]);

    return {
      totalUsers,
      totalListings: totalProperties + totalAttractions,
      totalCities: uniqueCities.size,
    };
  }

  public async getPopularAttractions(): Promise<any[]> {
    return await this.attractionModel
      .find({
        attractionStatus: 'ACTIVE',
        attractionImages: { $exists: true, $ne: [] },
      })
      .sort({ attractionViews: -1 })
      .limit(8)
      .lean()
      .exec();
  }

  public async getPropertyTypeStats(): Promise<any[]> {
    const result = await this.partnerPropertyModel.aggregate([
      { $match: { propertyStatus: 'ACTIVE' } },
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
          image: { $first: { $arrayElemAt: ['$propertyImages', 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result.map((r: any) => ({
      propertyType: r._id,
      count: r.count,
      image: r.image ?? '',
    }));
  }

  public async getExploreRegions(): Promise<any[]> {
    // Aggregate properties by region
    const propertyRegions = await this.partnerPropertyModel.aggregate([
      { $match: { propertyStatus: 'ACTIVE' } },
      {
        $group: {
          _id: { region: '$propertyRegion', country: '$propertyCountry' },
          count: { $sum: 1 },
          topImage: { $first: { $arrayElemAt: ['$propertyImages', 0] } },
          topViews: { $max: '$propertyViews' },
        },
      },
    ]);

    // Aggregate attractions by region
    const attractionRegions = await this.attractionModel.aggregate([
      { $match: { attractionStatus: 'ACTIVE' } },
      {
        $group: {
          _id: { region: '$attractionRegion', country: '$attractionCountry' },
          count: { $sum: 1 },
          topImage: { $first: { $arrayElemAt: ['$attractionImages', 0] } },
        },
      },
    ]);

    // Merge into a map by region+country
    const regionMap = new Map<string, any>();

    for (const p of propertyRegions) {
      const key = `${p._id.region}::${p._id.country}`;
      regionMap.set(key, {
        region: p._id.region,
        country: p._id.country,
        image: p.topImage || '',
        propertyCount: p.count,
        attractionCount: 0,
        totalListings: p.count,
      });
    }

    for (const a of attractionRegions) {
      const key = `${a._id.region}::${a._id.country}`;
      const existing = regionMap.get(key);
      if (existing) {
        existing.attractionCount = a.count;
        existing.totalListings += a.count;
        if (!existing.image && a.topImage) existing.image = a.topImage;
      } else {
        regionMap.set(key, {
          region: a._id.region,
          country: a._id.country,
          image: a.topImage || '',
          propertyCount: 0,
          attractionCount: a.count,
          totalListings: a.count,
        });
      }
    }

    // Sort by total listings descending
    return Array.from(regionMap.values()).sort(
      (a, b) => b.totalListings - a.totalListings,
    );
  }

  public async getMostPicked(): Promise<any[]> {
    // Get top 3 hotels by views (with at least 1 image)
    const topProperties = await this.partnerPropertyModel
      .find({ propertyStatus: 'ACTIVE', propertyImages: { $exists: true, $ne: [] } })
      .sort({ propertyViews: -1 })
      .limit(3)
      .lean()
      .exec();

    // Get top 3 attractions by views (with at least 1 image)
    const topAttractions = await this.attractionModel
      .find({ attractionStatus: 'ACTIVE', attractionImages: { $exists: true, $ne: [] } })
      .sort({ attractionViews: -1 })
      .limit(3)
      .lean()
      .exec();

    const items: any[] = [];

    // Map properties
    for (const p of topProperties) {
      // Get cheapest room price
      const rooms = await this.partnerPropertyRoomModel
        .find({ propertyId: p._id })
        .sort({ roomPricePerNight: 1 })
        .limit(1)
        .lean();
      const cheapestPrice = rooms[0]?.roomPricePerNight ?? 0;

      items.push({
        _id: p._id.toString(),
        itemType: 'PROPERTY',
        name: p.propertyName,
        city: p.propertyCity,
        country: p.propertyCountry,
        image: p.propertyImages?.[0] ?? '',
        price: cheapestPrice,
        rating: p.staffRating ?? 0,
        totalReviews: p.totalReviews ?? 0,
        views: p.propertyViews ?? 0,
        likes: p.propertyLikes ?? 0,
        propertyType: p.propertyType,
      });
    }

    // Map attractions
    for (const a of topAttractions) {
      items.push({
        _id: a._id.toString(),
        itemType: 'ATTRACTION',
        name: a.attractionName,
        city: a.attractionCity,
        country: a.attractionCountry,
        image: a.attractionImages?.[0] ?? '',
        price: a.attractionAdultPrice ?? 0,
        rating: a.averageRating ?? 0,
        totalReviews: a.totalReviews ?? 0,
        views: a.attractionViews ?? 0,
        likes: a.attractionLikes ?? 0,
        attractionType: a.attractionType,
      });
    }

    // Sort combined by views descending
    items.sort((a, b) => b.views - a.views);

    return items;
  }
}
