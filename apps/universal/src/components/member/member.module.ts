import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberResolver } from './member.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import GuestSchema from '../../schemas/Guest.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Guest', schema: GuestSchema }]),
    AuthModule,
  ],
  providers: [MemberService, MemberResolver],
  exports: [MemberService],
})
export class MemberModule {}
