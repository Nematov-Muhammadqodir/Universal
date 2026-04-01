import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class SendMessageInput {
  @IsNotEmpty()
  @Field(() => String)
  receiverId: string;

  @IsNotEmpty()
  @Field(() => String)
  receiverRole: string; // 'GUEST' or 'PARTNER'

  @IsNotEmpty()
  @Field(() => String)
  messageContent: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  propertyId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  attractionId?: string;
}
