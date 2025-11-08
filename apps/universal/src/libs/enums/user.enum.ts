import { registerEnumType } from '@nestjs/graphql';

export enum GuestType {
  SINGLE = 'SINGLE',
  COUPLE = 'COUPLE',
  FAMILY = 'FAMILY',
  BUSINESS = 'BUSINESS',
  FRIENDS = 'FRIENDS',
  OTHER = 'OTHER',
}
registerEnumType(GuestType, { name: 'GuestType' });

export enum UserRole {
  HOTEL_OWNER = 'HOTEL_OWNER',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
}
registerEnumType(UserRole, { name: 'UserRole' });

export enum GuestStatus {
  ACTIVE = 'ACTIVE',
  BLOCK = 'BLOCK',
  DELETE = 'DELETE',
}
registerEnumType(GuestStatus, { name: 'GuestStatus' });

export enum GuestAuthType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  PHONE = 'PHONE',
  TELEGRAM = 'TELEGRAM',
}

registerEnumType(GuestAuthType, { name: 'GuestAuthType' });

export enum GuestGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}
registerEnumType(GuestGender, { name: 'GuestGender' });
