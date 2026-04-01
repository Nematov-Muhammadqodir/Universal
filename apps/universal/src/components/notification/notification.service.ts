import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification } from '../../libs/dto/notification/notification';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
  ) {}

  public async createNotification(data: {
    receiverId: ObjectId | string;
    notificationType: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationRefId?: ObjectId | string;
  }): Promise<Notification> {
    return await this.notificationModel.create(data);
  }

  public async getMyNotifications(
    memberId: ObjectId,
  ): Promise<Notification[]> {
    return await this.notificationModel
      .find({ receiverId: memberId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();
  }

  public async getUnreadCount(memberId: ObjectId): Promise<number> {
    return await this.notificationModel
      .countDocuments({ receiverId: memberId, isRead: false })
      .exec();
  }

  public async markAsRead(
    notificationId: string,
    memberId: ObjectId,
  ): Promise<Notification> {
    return await this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, receiverId: memberId },
        { $set: { isRead: true } },
        { new: true },
      )
      .exec();
  }

  public async markAllAsRead(memberId: ObjectId): Promise<boolean> {
    await this.notificationModel
      .updateMany(
        { receiverId: memberId, isRead: false },
        { $set: { isRead: true } },
      )
      .exec();
    return true;
  }
}
