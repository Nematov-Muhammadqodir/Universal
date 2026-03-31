import { registerEnumType } from '@nestjs/graphql';

export enum AttractionType {
  TOUR = 'Tour',
  MUSEUM = 'Museum',
  THEME_PARK = 'Theme Park',
  SHOW = 'Show',
  ACTIVITY = 'Activity',
  LANDMARK = 'Landmark',
  WATER_PARK = 'Water Park',
  ZOO = 'Zoo',
}
registerEnumType(AttractionType, { name: 'AttractionType' });

export enum AttractionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETE = 'DELETE',
}
registerEnumType(AttractionStatus, { name: 'AttractionStatus' });
