import { Module } from '@nestjs/common';
import { PartnerResolver } from './partner.resolver';
import { PartnerService } from './partner.service';
import { MongooseModule } from '@nestjs/mongoose';
import PartnerSchema from 'apps/universal/src/schemas/Partner.model';
import { AuthModule } from '../../auth/auth.module';
import PartnerPropertySchema from 'apps/universal/src/schemas/PartnerProperty';
import { ViewModule } from '../../view/view.module';
import PartnerPropertyRoomSchema from 'apps/universal/src/schemas/PartnerPropertyRoom';
import { LikeModule } from '../../like/like.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Partner', schema: PartnerSchema },
      { name: 'PartnerPropertySchema', schema: PartnerPropertySchema },
      { name: 'PartnerPropertyRoomSchema', schema: PartnerPropertyRoomSchema },
    ]),
    AuthModule,
    ViewModule,
    PartnerModule,
    LikeModule,
  ],
  providers: [PartnerResolver, PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
