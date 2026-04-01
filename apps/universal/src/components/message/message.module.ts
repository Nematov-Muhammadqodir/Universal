import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import ConversationSchema from '../../schemas/Conversation.model';
import GuestSchema from '../../schemas/Guest.model';
import PartnerSchema from '../../schemas/Partner.model';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'Guest', schema: GuestSchema },
      { name: 'Partner', schema: PartnerSchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [MessageResolver, MessageService],
  exports: [MessageService],
})
export class MessageModule {}
