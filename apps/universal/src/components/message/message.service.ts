import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, Conversation } from '../../libs/dto/message/message';
import { SendMessageInput } from '../../libs/dto/message/message.input';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('Conversation') private readonly conversationModel: Model<Conversation>,
    @InjectModel('Guest') private readonly guestModel: Model<any>,
    @InjectModel('Partner') private readonly partnerModel: Model<any>,
    private readonly notificationService: NotificationService,
  ) {}

  public async sendMessage(
    senderId: string,
    senderRole: string,
    input: SendMessageInput,
  ): Promise<Message> {
    const { receiverId, messageContent, propertyId, attractionId } = input;

    // Find or create conversation
    let conversation = await this.conversationModel.findOne({
      participantIds: { $all: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)] },
    });

    if (!conversation) {
      const receiverRole = senderRole === 'GUEST' ? 'PARTNER' : 'GUEST';
      conversation = await this.conversationModel.create({
        participantIds: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)],
        participantRoles: [senderRole, receiverRole],
        lastMessage: messageContent,
        lastMessageAt: new Date(),
        ...(propertyId && { propertyId: new Types.ObjectId(propertyId) }),
        ...(attractionId && { attractionId: new Types.ObjectId(attractionId) }),
      });
    } else {
      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        $set: { lastMessage: messageContent, lastMessageAt: new Date() },
      });
    }

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      senderRole,
      messageContent,
    });

    // Send notification to receiver
    let senderName = 'Someone';
    if (senderRole === 'GUEST') {
      const guest: any = await this.guestModel.findById(senderId).lean();
      senderName = guest?.guestName || 'A guest';
    } else {
      const partner: any = await this.partnerModel.findById(senderId).lean();
      senderName = partner ? `${partner.partnerFirstName} ${partner.partnerLastName}` : 'Property owner';
    }

    await this.notificationService.createNotification({
      receiverId,
      notificationType: 'GENERAL',
      notificationTitle: `New message from ${senderName}`,
      notificationMessage: messageContent.length > 80 ? messageContent.slice(0, 80) + '...' : messageContent,
      notificationRefId: conversation._id as any,
    });

    return message;
  }

  public async getConversationMessages(
    conversationId: string,
    memberId: string,
  ): Promise<Message[]> {
    // Mark messages as read for the viewer
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(memberId) },
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    return await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  public async getMyConversations(
    memberId: string,
    role: string,
  ): Promise<Conversation[]> {
    const conversations = await this.conversationModel
      .find({ participantIds: new Types.ObjectId(memberId) })
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec();

    // Enrich with other participant info and unread count
    const enriched = [];
    for (const conv of conversations) {
      const otherParticipantId = (conv.participantIds as any[]).find(
        (id: any) => id.toString() !== memberId,
      );

      let otherParticipantName = 'Unknown';
      let otherParticipantImage = '';

      // Try guest first, then partner
      const guest: any = await this.guestModel.findById(otherParticipantId).lean();
      if (guest) {
        otherParticipantName = guest.guestFullName || guest.guestName || 'Guest';
        otherParticipantImage = guest.guestImage || '';
      } else {
        const partner: any = await this.partnerModel.findById(otherParticipantId).lean();
        if (partner) {
          otherParticipantName = `${partner.partnerFirstName} ${partner.partnerLastName}`;
          otherParticipantImage = '';
        }
      }

      const unreadCount = await this.messageModel.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: new Types.ObjectId(memberId) },
        isRead: false,
      });

      enriched.push({
        ...conv,
        otherParticipantName,
        otherParticipantImage,
        unreadCount,
      });
    }

    return enriched as any;
  }

  public async getOrCreateConversation(
    senderId: string,
    receiverId: string,
    senderRole: string,
    propertyId?: string,
    attractionId?: string,
  ): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({
      participantIds: { $all: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)] },
    });

    if (!conversation) {
      const receiverRole = senderRole === 'GUEST' ? 'PARTNER' : 'GUEST';
      conversation = await this.conversationModel.create({
        participantIds: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)],
        participantRoles: [senderRole, receiverRole],
        ...(propertyId && { propertyId: new Types.ObjectId(propertyId) }),
        ...(attractionId && { attractionId: new Types.ObjectId(attractionId) }),
      });
    }

    return conversation;
  }
}
