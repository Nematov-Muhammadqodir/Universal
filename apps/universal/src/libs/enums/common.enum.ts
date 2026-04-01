import { registerEnumType } from '@nestjs/graphql';
import { register } from 'module';

export enum Message {
  SOMETHING_WENT_WRONG = 'Something went wrong!',
  NO_DATA_FOUND = 'No data is found!',
  CREATE_FAILED = 'Create is failed!',
  UPDATE_FAILED = 'Update is failed!',
  REMOVE_FAILED = 'Remove failed!',
  UPLOAD_FAILED = 'Upload is failed!',
  BAD_REQUEST = 'Bad Request',

  USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
  NO_MEMBER_NICK = 'No member with that member nick!',
  USED_NICK_PHONE = 'You are inserting already used nick or phone!',
  WRONG_PASSWORD = 'Wrong password, please try again!',
  NOT_AUTHENTICATED = 'You are not authenticated, Please log in first!',
  TOKEN_NOT_EXIST = 'Bearer Token is not provided',
  ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
  NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
  PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
  SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
  BLOCKED_USER = 'You have been blocked, contact restaurant!',
  TOKEN_CRAETION_FAILED = 'Token creation error!',
  PLEASE_ENTER_VALID_CREDENTIALS = 'Your email or phone number is not valid, please enter valid credentials!',
  WE_DO_NOT_HAVE_THIS_PROPERTY = "We don't have this type of Property!",
  ROOM_ALREADY_BOOKED = 'The room is already booked for the selected dates! Please select other dates.',
  ROOM_NOT_EXIST = 'The room does not exist for the selected property!',
  ALREADY_REVIEWED = 'You have already submitted a review for this property!',
}

export enum Direction {
  ASC = 1,
  DESC = -1,
}
registerEnumType(Direction, { name: 'Direction' });

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
registerEnumType(ReservationStatus, { name: 'ReservationStatus' });
