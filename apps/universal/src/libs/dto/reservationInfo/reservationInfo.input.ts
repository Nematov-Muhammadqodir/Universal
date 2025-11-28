import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

@InputType()
export class ReservationInfoInput {
  @IsNotEmpty()
  @Field(() => String)
  guestId: string;

  @IsNotEmpty()
  @Length(1, 50)
  @Field(() => String)
  guestName: string;

  @IsOptional()
  @Length(1, 50)
  @Field(() => String, { nullable: true })
  guestLastName?: string;

  @IsNotEmpty()
  @Field(() => String)
  guestEmail: string;

  @IsNotEmpty()
  @Field(() => String)
  guestPhoneNumber: string;

  @IsNotEmpty()
  @IsBoolean()
  @Field(() => Boolean)
  travelForWork: boolean;

  @IsNotEmpty()
  @Length(1, 50)
  @Field(() => String)
  cardholderName: string;

  @IsNotEmpty()
  @Field(() => String)
  cardNumber: string;

  @IsNotEmpty()
  @Field(() => String)
  expiryDate: string;

  @IsNotEmpty()
  @Field(() => String)
  cvs: string;

  @IsNotEmpty()
  @Field(() => String)
  roomId: string;

  @IsNotEmpty()
  @IsBoolean()
  @Field(() => Boolean)
  ageConfirmation: boolean;
}
