import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification } from '../../libs/dto/notification/notification';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Query(() => [Notification])
  public async getMyNotifications(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notification[]> {
    return await this.notificationService.getMyNotifications(memberId);
  }

  @UseGuards(AuthGuard)
  @Query(() => Int)
  public async getUnreadNotificationCount(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<number> {
    return await this.notificationService.getUnreadCount(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  public async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notification> {
    return await this.notificationService.markAsRead(notificationId, memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  public async markAllNotificationsAsRead(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<boolean> {
    return await this.notificationService.markAllAsRead(memberId);
  }
}
