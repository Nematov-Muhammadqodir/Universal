import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class ComponentsModule {}
