import { registerEnumType } from '@nestjs/graphql';

export enum PropertyType {
  HOTEL = 'Hotel',
  GUEST_HOUSE = 'Guest House',
  BED_AND_BREAKFAST = 'Bed and Breakfast',
  HOMESTAY = 'Homestay',
  HOSTEL = 'Hostel',
  APARTHOTEL = 'Aparthotel',
  CAPSULE_HOTEL = 'Capsule Hotel',
  COUNTRY_HOUSE = 'Country House',
  FARM_STAY = 'Farm Stay',
  INN = 'Inn',
  LOVE_HOTEL = 'Love Hotel',
  MOTEL = 'Motel',
  RESORT = 'Resort',
  RIAD = 'Riad',
  RYOKAN = 'Ryokan',
  LODGE = 'Lodge',
}
registerEnumType(PropertyType, { name: 'PropertyType' });

export enum PropertyFacilities {
  RESTAURANT = 'Restaurant',
  ROOM_SERVICE = 'Room Service',
  BAR = 'Bar',
  FRONT_DESK = 'Front Desk',
  SAUNA = 'Sauna',
  FITNESS_CENTER = 'Fitness Center',
  GARDEN = 'Garden',
  TERRACE = 'Terrace',
  NON_SMOKING_ROOMS = 'Non-smoking Rooms',
  AIRPORT_SHUTTLE = 'Airport Shuttle',
  FAMILY_ROOMS = 'Family Rooms',
  SPA_AND_WELLNESS_CENTER = 'Spa and Wellness Center',
  HOT_TUB_JAZZ = 'Hot Tub/Jacuzzi',
  FREE_WI_FI = 'Free Wi-Fi',
  AIR_CONDITIONING = 'Air Conditioning',
  WATER_PARK = 'Water Park',
  ELECTRIC_VEHICLE_CHARGING_STATION = 'Electric Vehicle Charging Station',
  SWIMMING_POOL = 'Swimming Pool',
  BEACHFRONT = 'Beachfront',
}
registerEnumType(PropertyFacilities, { name: 'PropertyFacilities' });

export enum HotelStaffLanguages {
  ENGLISH = 'English',
  FRENCH = 'French',
  ITALIAN = 'Italian',
  KOREAN = 'Korean',
  UZBEK = 'Uzbek',
  RUSSIAN = 'Russian',
  SPANISH = 'Spanish',
}
registerEnumType(HotelStaffLanguages, { name: 'HotelStaffLanguages' });

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  DELETE = 'DELETE',
}
registerEnumType(PropertyStatus, {
  name: 'PropertyStatus',
});
