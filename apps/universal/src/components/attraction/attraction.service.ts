import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Attraction, Attractions } from 'apps/universal/src/libs/dto/attraction/attraction';
import {
  AttractionInput,
  AttractionUpdate,
  AttractionsInquiry,
} from 'apps/universal/src/libs/dto/attraction/attraction.input';
import { Partner } from 'apps/universal/src/libs/dto/partner/partner';
import { Message } from 'apps/universal/src/libs/enums/common.enum';
import { AttractionStatus } from 'apps/universal/src/libs/enums/attraction.enum';
import { T } from 'apps/universal/src/libs/types/common';
import { shapeIntoMongoObjectId } from 'apps/universal/src/libs/config';

@Injectable()
export class AttractionService {
  constructor(
    @InjectModel('AttractionSchema')
    private readonly attractionModel: Model<Attraction>,
    @InjectModel('Partner')
    private readonly partnerModel: Model<Partner>,
  ) {}

  public async createAttraction(input: AttractionInput): Promise<Attraction> {
    try {
      const result = await this.attractionModel.create(input);
      return result;
    } catch (err) {
      console.log('Error, createAttraction', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateAttraction(
    input: AttractionUpdate,
    memberId: ObjectId,
  ): Promise<Attraction> {
    try {
      const { _id, ...updateData } = input;

      const attraction = await this.attractionModel.findById(_id).lean().exec();
      if (!attraction) throw new BadRequestException(Message.NO_DATA_FOUND);

      if (attraction.partnerId.toString() !== memberId.toString()) {
        throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
      }

      const result = await this.attractionModel.findByIdAndUpdate(
        _id,
        { $set: updateData },
        { new: true },
      );

      if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
      return result;
    } catch (err) {
      console.log('Error, updateAttraction', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async getAttraction(attractionId: ObjectId): Promise<Attraction> {
    const targetAttraction: any = await this.attractionModel
      .findOne({ _id: attractionId, attractionStatus: AttractionStatus.ACTIVE })
      .lean()
      .exec();

    if (!targetAttraction)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    targetAttraction.memberData = await this.partnerModel
      .findOne({ _id: targetAttraction.partnerId })
      .lean()
      .exec();

    return targetAttraction;
  }

  public async getAllAttractions(
    input: AttractionsInquiry,
  ): Promise<Attractions> {
    const { page, limit, attractionType, attractionCity, attractionCountry } = input;

    const match: T = { attractionStatus: AttractionStatus.ACTIVE };

    if (attractionType) {
      match.attractionType = attractionType;
    }
    if (attractionCity) {
      match.attractionCity = attractionCity;
    }
    if (attractionCountry) {
      match.attractionCountry = attractionCountry;
    }

    const result = await this.attractionModel.aggregate([
      { $match: match },
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

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getAttractionsByOwner(
    partnerId: ObjectId,
  ): Promise<Attraction[]> {
    const result = await this.attractionModel
      .find({ partnerId: partnerId })
      .lean()
      .exec();

    return result;
  }

  public async deleteAttraction(
    attractionId: string,
    memberId: ObjectId,
  ): Promise<Attraction> {
    const targetId = shapeIntoMongoObjectId(attractionId);

    const attraction = await this.attractionModel.findById(targetId).lean().exec();
    if (!attraction) throw new BadRequestException(Message.NO_DATA_FOUND);

    if (attraction.partnerId.toString() !== memberId.toString()) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const result = await this.attractionModel.findByIdAndDelete(targetId);
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
  }
}
