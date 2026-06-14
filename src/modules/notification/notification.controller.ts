import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { NotificationService } from './notification.service';
import { sendResponse } from 'src/common/helpers';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  /**
   * GET /api/v1/notifications?page=1&limit=20
   * Returns paginated notifications for the authenticated user.
   */
  @Get()
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotifications(
    @GetCurrentUser('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const { meta, data } = await this.notificationService.getNotifications(userId, page, limit);
    return sendResponse(HttpStatus.OK, "Notifications fetched successfully", data, meta);
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Returns the count of unread notifications.
   */
  @Get('unread-count')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@GetCurrentUser('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return sendResponse(HttpStatus.OK, "Unread notification count fetched successfully", { count });
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read.
   */
  @Patch('read-all')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@GetCurrentUser('userId') userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return sendResponse(HttpStatus.OK, "All notifications marked as read");
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'UUID of the notification' })
  async markAsRead(
    @GetCurrentUser('userId') userId: string,
    @Param('id') notificationId: string,
  ) {
    await this.notificationService.markAsRead(notificationId, userId);
    return sendResponse(HttpStatus.OK, "Notification marked as read");
  }
}
