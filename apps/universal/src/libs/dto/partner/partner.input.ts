import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { UserRole } from '../../enums/user.enum';

@InputType()
export class PartnerInput {
  @IsNotEmpty()
  @Length(3, 50)
  @Field(() => String)
  partnerEmail: string;

  @IsNotEmpty()
  @Length(3, 50)
  @Field(() => String)
  partnerFirstName: string;

  @IsNotEmpty()
  @Length(3, 50)
  @Field(() => String)
  partnerLastName: string;

  @IsNotEmpty()
  @Field(() => String)
  partnerPhoneNumber: string;

  @IsNotEmpty()
  @Field(() => String)
  partnerPassword: string;

  @IsOptional()
  @Field(() => UserRole, { nullable: true })
  userRole?: UserRole;
}

@InputType()
export class PartnerLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  partnerEmail: string;

  @IsNotEmpty()
  @Length(6, 12)
  @Field(() => String)
  partnerPassword: string;
}
