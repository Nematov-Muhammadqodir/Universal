import { registerEnumType } from '@nestjs/graphql';

export enum RoomTypes {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  FAMILY = 'Family',
  TWIN = 'Twin',
  TWIN_DOUBLE = 'Twin Double',
  TRIPLE = 'Triple',
  QUADRUPLE = 'Quadruple',
  SUITE = 'Suite',
  STUDIO = 'Studio',
  APARTMENT = 'Apartment',
  DORMITORY_ROOM = 'Dormitory Room',
  BED_IN_DORMITORY = 'Bed in Dormitory',
}
registerEnumType(RoomTypes, { name: 'RoomTypes' });

export enum BathroomFacilities {
  TOILET_PAPER = 'Toilet Paper',
  SHOWER = 'Shower',
  TOILET = 'Toilet',
  HAIR_DRYER = 'Hair Dryer',
  BATH = 'Bath',
  FREE_TOILETRIES = 'Free Toiletries',
  BIDET = 'Bidet',
  SLIPPERS = 'Slippers',
  BATHROBE = 'Bathrobe',
  SPA_BATH = 'Spa Bath',
}
registerEnumType(BathroomFacilities, { name: 'BathroomFacilities' });

export enum RoomFacilities {
  CLOTHES_RACK = 'Clothes Rack',
  FLAT_SCREEN_TV = 'Flat-screen TV',
  AIR_CONDITIONING = 'Air Conditioning',
  LINEN = 'Linen',
  DESK = 'Desk',
  WAKE_UP_SERVICE = 'Wake-up Service',
  TOWELS = 'Towels',
  WARDROBE_OR_CLOSET = 'Wardrobe or Closet',
  HEATING = 'Heating',
  FAN = 'Fan',
  SAFETY_DEPOSIT_BOX = 'Safety Deposit Box',
  TOWELS_SHEETS = 'Towels/Sheets',
  ENTIRE_UNIT_ON_GROUND_FLOOR = 'Entire Unit on Ground Floor',
  BALCONY = 'Balcony',
  TERRACE = 'Terrace',
  VIEW = 'View',
  ELECTRIC_KETTLE = 'Electric Kettle',
  TEA_COFFEE_MAKER = 'Tea/Coffee Maker',
  DINING_AREA = 'Dining Area',
  DINING_TABLE = 'Dining Table',
  MICROWAVE = 'Microwave',
}
registerEnumType(RoomFacilities, { name: 'RoomFacilities' });

export enum RoomNames {
  BUDGET_DOUBLE_ROOM = 'Budget Double Room',
  BUSINESS_DOUBLE_ROOM_WITH_GYM_ACCESS = 'Business Double Room with Gym Access',
  DELUXE_DOUBLE_ROOM = 'Deluxe Double Room',
  DELUXE_DOUBLE_ROOM_WITH_BALCONY = 'Deluxe Double Room with Balcony',
  DELUXE_KING_ROOM = 'Deluxe King Room',
  DELUXE_QUEEN_ROOM = 'Deluxe Queen Room',
  DELUXE_ROOM = 'Deluxe Room',
  STANDARD_SINGLE_ROOM = 'Standard Single Room',
  STANDARD_DOUBLE_ROOM = 'Standard Double Room',
  STANDARD_QUEEN_ROOM = 'Standard Queen Room',
  STANDARD_KING_ROOM = 'Standard King Room',
}
registerEnumType(RoomNames, { name: 'RoomNames' });
