import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { PartnerModule } from './partner/partner/partner.module';

@Module({
  imports: [AuthModule, MemberModule, PartnerModule],
})
export class ComponentsModule {}
