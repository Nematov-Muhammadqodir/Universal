import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateReservationStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  reservationId: string;

  @IsNotEmpty()
  @Field(() => String)
  reservationStatus: string;
}
