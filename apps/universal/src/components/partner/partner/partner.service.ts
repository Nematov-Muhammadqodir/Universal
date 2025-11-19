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

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel('Partner') private readonly partnerModel: Model<Partner>,
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
