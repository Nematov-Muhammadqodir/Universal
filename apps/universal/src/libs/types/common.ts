import { ObjectId } from 'mongoose';

export interface T {
  [key: string]: any;
}

export interface StatisticModifier {
  _id: ObjectId;
  targetKey: string;
  modifier: number;
}

export interface IAvailableBeds {
  single: number;
  double: number;
  king: number;
  superKing: number;
}
