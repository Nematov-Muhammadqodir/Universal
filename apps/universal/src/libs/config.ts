import { ObjectId } from 'bson';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const getSerialForImage = (filename: string) => {
  // console.log('filename', filename);
  const ext = path.parse(filename).ext;
  // console.log('ext', ext);
  return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
  console.log('target id', target);
  console.log('target id type', typeof target);
  return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupVisit = {
  $lookup: {
    from: 'partners',
    localField: 'visitedProperty.memberId',
    foreignField: '_id',
    as: 'visitedProperty.memberData',
  },
};
