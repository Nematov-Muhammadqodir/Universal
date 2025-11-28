import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { PartnerModule } from './partner/partner/partner.module';
import { ViewModule } from './view/view.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  imports: [AuthModule, MemberModule, PartnerModule, ViewModule, ReservationModule],
})
export class ComponentsModule {}
