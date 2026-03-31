import { registerEnumType } from '@nestjs/graphql';

export enum GuestType {
  SINGLE = 'Single',
  COUPLE = 'Couple',
  FAMILY = 'Family',
  BUSINESS = 'Business',
  FRIENDS = 'Friends',
  OTHER = 'Other',
}
registerEnumType(GuestType, { name: 'GuestType' });

export enum UserRole {
  HOTEL_OWNER = 'Hotel Owner',
  ATTRACTION_OWNER = 'Attraction Owner',
  ADMIN = 'Admin',
  GUEST = 'Guest',
}
registerEnumType(UserRole, { name: 'UserRole' });

export enum GuestStatus {
  ACTIVE = 'Active',
  BLOCK = 'Block',
  DELETE = 'Delete',
}
registerEnumType(GuestStatus, { name: 'GuestStatus' });

export enum GuestAuthType {
  EMAIL = 'Email',
  GOOGLE = 'Google',
  PHONE = 'Phone',
  TELEGRAM = 'Telegram',
}
registerEnumType(GuestAuthType, { name: 'GuestAuthType' });

export enum GuestGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}
registerEnumType(GuestGender, { name: 'GuestGender' });
