import { Module } from '@nestjs/common';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import ReservationInfoSchema from '../../schemas/ReservationInfo.model';
import AttractionReservationSchema from '../../schemas/AttractionReservation.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PartnerModule } from '../partner/partner/partner.module';
import PartnerPropertyRoomSchema from '../../schemas/PartnerPropertyRoom';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ReservationInfoSchema', schema: ReservationInfoSchema },
      { name: 'PartnerPropertyRoomSchema', schema: PartnerPropertyRoomSchema },
      { name: 'AttractionReservation', schema: AttractionReservationSchema },
    ]),
    AuthModule,
    PartnerModule,
  ],
  providers: [ReservationResolver, ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
