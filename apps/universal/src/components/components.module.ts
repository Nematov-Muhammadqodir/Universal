import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [AuthModule, MemberModule],
})
export class ComponentsModule {}
