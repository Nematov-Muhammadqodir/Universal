import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAgentService } from './ai-agent.service';
import { AiAgentResolver } from './ai-agent.resolver';
import PartnerPropertySchema from '../../schemas/PartnerProperty';
import PartnerPropertyRoomSchema from '../../schemas/PartnerPropertyRoom';
import AttractionSchema from '../../schemas/Attraction.model';
import ReservationInfoSchema from '../../schemas/ReservationInfo.model';
import AttractionReservationSchema from '../../schemas/AttractionReservation.model';
import CommentSchema from '../../schemas/Comment.model';
import GuestSchema from '../../schemas/Guest.model';

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
    ]),
  ],
  providers: [AiAgentService, AiAgentResolver],
})
export class AiAgentModule {}
