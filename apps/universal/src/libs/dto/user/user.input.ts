import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import {
  GuestAuthType,
  GuestGender,
  GuestType,
  UserRole,
} from '../../enums/user.enum';

@InputType()
export class GuestInput {
  @IsNotEmpty()
  @Length(3, 12)
  @Field(() => String)
  guestName: string;

  @IsNotEmpty()
  @Field(() => String)
  guestEmail: string;

  @IsNotEmpty()
  @Field(() => String)
  guestPhone: string;

  @IsNotEmpty()
  @Length(6, 12)
  @Field(() => String)
  guestPassword: string;

  @IsNotEmpty()
  @Field(() => GuestGender)
  guestGender: GuestGender;

  @IsNotEmpty()
  @Field(() => GuestType)
  guestType: GuestType;

  @IsNotEmpty()
  @Field(() => String)
  guestCountry: string;

  @IsNotEmpty()
  @Field(() => String)
  guestRegion: string;

  @IsOptional()
  @Field(() => GuestAuthType, { nullable: true })
  guestAuthType?: GuestAuthType;

  @IsOptional()
  @Field(() => UserRole, { nullable: true })
  userRole?: UserRole;
}

@InputType()
export class GuestLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  guestEmail: string;

  @IsNotEmpty()
  @Length(6, 12)
  @Field(() => String)
  guestPassword: string;
}
