import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/modules/chat/chat.service';
import { NotificationService } from 'src/modules/notification/notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /**
   * In-memory presence map: userId → Set of socketIds
   * Works correctly for single-process NestJS apps.
   */
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private extractUserId(client: Socket): string | null {
    try {
      const raw =
        (client.handshake.auth as any)?.token ||
        client.handshake.headers?.authorization ||
        '';
      const token = raw.replace(/^Bearer\s+/i, '').trim();
      if (!token) return null;
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload?.sub ?? payload?.userId ?? null;
    } catch {
      return null;
    }
  }

  private markOnline(userId: string, socketId: string) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  private markOffline(userId: string, socketId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      return true; // truly offline now
    }
    return false;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);

    if (!userId) {
      console.warn(`[Socket] Rejected unauthenticated connection: ${client.id}`);
      client.emit('error', { message: 'Unauthorized: invalid or missing token' });
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;

    // Join personal room (roomId = userId)
    client.join(userId);

    this.markOnline(userId, client.id);

    console.log(`[Socket] Connected: userId=${userId} socketId=${client.id}`);

    // Inform everyone that this user is online
    this.server.emit('user_online', { userId });

    // Send the connecting user the current online list
    client.emit('online_users', { userIds: this.getOnlineUserIds() });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    const wentOffline = this.markOffline(userId, client.id);

    console.log(
      `[Socket] Disconnected: userId=${userId} socketId=${client.id} wentOffline=${wentOffline}`,
    );

    if (wentOffline) {
      this.server.emit('user_offline', { userId });
    }
  }

  // ─── Events ──────────────────────────────────────────────────────────────────

  /**
   * Legacy join — now a no-op since auth happens on connect.
   * Kept for backward compat with older frontend code.
   */
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      client.join(userId);
      client.emit('joined', { userId, room: userId });
    }
  }

  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    client.emit('online_users', { userIds: this.getOnlineUserIds() });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        client.emit('error', { message: 'Invalid JSON payload' });
        return;
      }
    }

    const senderId = client.data?.userId;
    const receiverId = body.receiverId?.trim();
    const message = body.message?.trim();

    if (!senderId || !receiverId || !message) {
      client.emit('error', { message: 'senderId, receiverId, and message are required' });
      return;
    }

    const chat = await this.chatService.create({ senderId, receiverId, message });

    // Deliver message to receiver's room (and sender for multi-device)
    this.server.to(receiverId).to(senderId).emit('receive_message', chat);

    // Create + deliver notification only to receiver
    const notification = await this.notificationService.createNotification(
      receiverId,
      'New Message',
      message,
      senderId,
    );

    this.server.to(receiverId).emit('new_notification', notification);

    // Emit unread count update to receiver
    const unreadCount = await this.notificationService.getUnreadCount(receiverId);
    this.server.to(receiverId).emit('notification_count', { count: unreadCount });
  }

  @SubscribeMessage('message_seen')
  async handleMessageSeen(
    @MessageBody() body: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!body?.chatId) return;

    const chat = await this.chatService.seen(body.chatId);

    // Notify the original sender that their message was seen
    this.server.to(chat.senderId).emit('message_seen', chat);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() body: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    const receiverId = body?.receiverId?.trim();
    if (!senderId || !receiverId) return;

    this.server.to(receiverId).emit('typing', { senderId });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() body: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    const receiverId = body?.receiverId?.trim();
    if (!senderId || !receiverId) return;

    this.server.to(receiverId).emit('stop_typing', { senderId });
  }
}
