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
import { PartnerPropertyInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.input';
import { PartnerProperty } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty';
import { StatisticModifier, T } from 'apps/universal/src/libs/types/common';
import { PropertyStatus } from 'apps/universal/src/libs/enums/property.enum';
import { ViewService } from '../../view/view.service';
import { ViewGroup } from 'apps/universal/src/libs/enums/view.enum';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';
import { PartnerPropertyRoom } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom';
import { PartnerPropertyRoomInput } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.input';
import { PartnerPropertyUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerProperty.update';
import { PartnerPropertyRoomUpdate } from 'apps/universal/src/libs/dto/partner/partnerProperty/partnerPropertyRoom/partnerPropertyRoom.update';

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
    const targetProperty: PartnerProperty = await this.partnerPropertyModel
      .findOne(search)
      .lean()
      .exec();
    if (!targetProperty)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput = {
        memberId: memberId,
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

      // const likeInput = {
      //   memberId: memberId,
      //   likeRefId: propertyId,
      //   likeGroup: LikeGroup.MEMBER,
      // };

      // targetProperty.meLiked =
      //   await this.likeService.checkLikeExistance(likeInput);
      //Like logic
    }

    targetProperty.memberData = await this.getPartner(targetProperty.partnerId);
    return targetProperty;
  }

  public async getPartnerPropertyByHotelOwner(
    memberId: ObjectId,
    partnerId: ObjectId,
  ): Promise<PartnerProperty> {
    const targetProperty: PartnerProperty = await this.partnerPropertyModel
      .findOne({ partnerId: partnerId })
      .lean()
      .exec();
    if (!targetProperty)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

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
