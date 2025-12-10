import { ObjectId } from 'bson';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const getSerialForImage = (filename: string) => {
  // console.log('filename', filename);
  const ext = path.parse(filename).ext;
  // console.log('ext', ext);
  return uuidv4() + ext;
};

export const availableCommentSorts = ['createdAt', 'updatedAt'];

export const shapeIntoMongoObjectId = (target: any) => {
  console.log('target id', target);
  console.log('target id type', typeof target);
  return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupFavorite = {
  $lookup: {
    from: 'partners',
    localField: 'favoriteProperty.partnerId',
    foreignField: '_id',
    as: 'favoriteProperty.memberData',
  },
};

export const lookupVisit = {
  $lookup: {
    from: 'partners',
    localField: 'visitedProperty.partnerId',
    foreignField: '_id',
    as: 'visitedProperty.memberData',
  },
};
export const lookupVisitForReservation = {
  $lookup: {
    from: 'partners',
    localField: 'reservedProperty.partnerId',
    foreignField: '_id',
    as: 'reservedProperty.memberData',
  },
};

export const lookupAuthMemberLiked = (
  memberId: T,
  targetRefId: string = '$visitedProperty._id',
) => {
  return {
    $lookup: {
      from: 'likes',
      let: {
        localMemberId: memberId,
        localLikeRefId: targetRefId,
        localMyFavorite: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$likeRefId', '$$localLikeRefId'] },
                { $eq: ['$memberId', '$$localMemberId'] },
              ],
            },
          },
        },

        {
          $project: {
            _id: 0,
            memberId: 1,
            likeRefId: 1,
            myFavorite: '$$localMyFavorite',
          },
        },
      ],
      as: 'visitedProperty.meLiked',
    },
  };
};

export const lookupMember = {
  $lookup: {
    from: 'guests',
    localField: 'memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};

export const lookupReservation = {
  $lookup: {
    from: 'reservationinfoschemas',
    let: {
      memberId: { $toString: '$memberId' },
      commentRefId: { $toString: '$commentRefId' },
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$guestId', '$$memberId'] },
              { $eq: ['$propertyId', '$$commentRefId'] },
            ],
          },
        },
      },
      { $limit: 1 },
    ],
    as: 'reservationData',
  },
};

export const unwindReservation = {
  $unwind: { path: '$reservationData', preserveNullAndEmptyArrays: true },
};

export const lookupRoom = {
  $lookup: {
    from: 'partnerPropertyRooms',
    localField: 'memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};
