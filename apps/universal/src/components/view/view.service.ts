import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';

import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupAuthMemberLiked, lookupVisit } from '../../libs/config';
import {
  PartnerProperties,
  PartnerProperty,
} from '../../libs/dto/partner/partnerProperty/partnerProperty';
import { OrdinaryInquery } from '../../libs/dto/partner/partnerProperty/partnerProperty.input';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: ViewInput): Promise<View | null> {
    const viewExist = await this.checkViewExistance(input);
    if (!viewExist) {
      console.log('- New View Insert -');

      return await this.viewModel.create(input);
    } else {
      return null;
    }
  }

  private async checkViewExistance(input: ViewInput): Promise<View> {
    const { memberId, viewRefId } = input;

    const search: T = { memberId: memberId, viewRefId: viewRefId };

    return await this.viewModel.findOne(search).exec();
  }

  public async getVisitedProperties(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<PartnerProperties> {
    const { page, limit } = input;
    const match: T = { viewGroup: ViewGroup.PROPERTY, memberId: memberId };
    console.log('match', match);

    const data = await this.viewModel.aggregate([
      { $match: match },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: 'partnersProperties',
          localField: 'viewRefId',
          foreignField: '_id',
          as: 'visitedProperty',
        },
      },
      { $unwind: '$visitedProperty' },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            lookupVisit,
            lookupAuthMemberLiked(memberId),
            { $unwind: '$visitedProperty.memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    const result: PartnerProperties = {
      list: [],
      metaCounter: data[0].metaCounter,
    };
    result.list = data[0].list.map((ele) => ele.visitedProperty);
    console.log('result', result);

    console.log('result', result);

    return result;
  }
}
