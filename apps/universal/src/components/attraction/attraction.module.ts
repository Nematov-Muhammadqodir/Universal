import { Module } from '@nestjs/common';
import { AttractionResolver } from './attraction.resolver';
import { AttractionService } from './attraction.service';
import { MongooseModule } from '@nestjs/mongoose';
import AttractionSchema from 'apps/universal/src/schemas/Attraction.model';
import PartnerSchema from 'apps/universal/src/schemas/Partner.model';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AttractionSchema', schema: AttractionSchema },
      { name: 'Partner', schema: PartnerSchema },
    ]),
    AuthModule,
    LikeModule,
  ],
  providers: [AttractionResolver, AttractionService],
  exports: [AttractionService],
})
export class AttractionModule {}
