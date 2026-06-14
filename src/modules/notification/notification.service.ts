import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

// Prisma enum is generated as string union in the client
const DEFAULT_NOTIF_TYPE: NotificationType = NotificationType.MESSAGE;

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // ─── Create ─────────────────────────────────────────────────────────────────

  async createNotification(
    receiverId: string,
    title: string,
    body: string,
    senderId?: string,
    type: NotificationType = NotificationType.MESSAGE,
  ) {
    return this.prisma.notification.create({
      data: {
        receiverId,
        title,
        body,
        type,
      },
    });
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Paginated list of all notifications for the given user (newest first).
   */
  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { receiverId: userId },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount: await this.getUnreadCount(userId),
      },
    };
  }

  /**
   * Count of unread notifications for the user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  /**
   * Mark a single notification as read (only if it belongs to the user).
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { notificationId },
    });

    if (!notification || notification.receiverId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for the user.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }
}
