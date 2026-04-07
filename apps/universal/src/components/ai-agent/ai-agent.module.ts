import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAgentService } from './ai-agent.service';
import { PartnerAiAgentService } from './partner-ai-agent.service';
import { AdminAiAgentService } from './admin-ai-agent.service';
import { AiAgentResolver } from './ai-agent.resolver';
import { AuthModule } from '../auth/auth.module';
import PartnerPropertySchema from '../../schemas/PartnerProperty';
import PartnerPropertyRoomSchema from '../../schemas/PartnerPropertyRoom';
import AttractionSchema from '../../schemas/Attraction.model';
import ReservationInfoSchema from '../../schemas/ReservationInfo.model';
import AttractionReservationSchema from '../../schemas/AttractionReservation.model';
import CommentSchema from '../../schemas/Comment.model';
import GuestSchema from '../../schemas/Guest.model';
import PartnerSchema from '../../schemas/Partner.model';
import NotificationSchema from '../../schemas/Notification.model';
import MessageSchema from '../../schemas/Message.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PartnerPropertySchema', schema: PartnerPropertySchema },
      { name: 'PartnerPropertyRoomSchema', schema: PartnerPropertyRoomSchema },
      { name: 'AttractionSchema', schema: AttractionSchema },
      { name: 'ReservationInfoSchema', schema: ReservationInfoSchema },
      { name: 'AttractionReservation', schema: AttractionReservationSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Guest', schema: GuestSchema },
      { name: 'Partner', schema: PartnerSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
    AuthModule,
  ],
  providers: [AiAgentService, PartnerAiAgentService, AdminAiAgentService, AiAgentResolver],
})
export class AiAgentModule {}
