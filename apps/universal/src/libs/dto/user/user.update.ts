import { InputType } from '@nestjs/graphql';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import {
  GuestAuthType,
  GuestGender,
  GuestStatus,
  GuestType,
  UserRole,
} from '../../enums/user.enum';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class GuestUpdateInput {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Field(() => GuestType, { nullable: true })
  guestType?: GuestType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestPhone?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestFullName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestImage?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestCountry?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  guestRegion?: string;
}
