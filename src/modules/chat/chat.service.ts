import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // ─── Room helpers ───────────────────────────────────────────────────────────

    private async findOrCreateRoom(senderId: string, receiverId: string) {
        const senderRooms = await this.prisma.chatRoom.findMany({
            where: {
                members: { some: { userId: senderId } },
            },
            include: { members: true },
        });

        const existingRoom = senderRooms.find((room) => {
            const ids = room.members.map((m) => m.userId);
            return ids.includes(senderId) && ids.includes(receiverId);
        });

        if (existingRoom) return existingRoom;

        return this.prisma.chatRoom.create({
            data: {
                createdBy: senderId,
                members: {
                    create: [{ userId: senderId }, { userId: receiverId }],
                },
            },
        });
    }

    // ─── Core CRUD ──────────────────────────────────────────────────────────────

    async create(dto: SendMessageDto) {
        const room = await this.findOrCreateRoom(dto.senderId, dto.receiverId);

        return this.prisma.chat.create({
            data: {
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                roomId: room.roomId,
                message: dto.message,
            },
            include: {
                sender: {
                    select: {
                        userId: true,
                        userName: true,
                        profilePhotoUrl: true,
                    },
                },
                receiver: {
                    select: {
                        userId: true,
                        userName: true,
                        profilePhotoUrl: true,
                    },
                },
            },
        });
    }

    async seen(chatId: string) {
        return this.prisma.chat.update({
            where: { chatId },
            data: {
                isSeen: true,
                readAt: new Date(),
            },
        });
    }

    async markAllSeen(senderId: string, receiverId: string) {
        return this.prisma.chat.updateMany({
            where: {
                senderId,
                receiverId,
                isSeen: false,
            },
            data: {
                isSeen: true,
                readAt: new Date(),
            },
        });
    }

    // ─── Queries ────────────────────────────────────────────────────────────────

    /**
     * Returns a list of unique conversation partners for the given user,
     * each with the last message, unread message count, and partner profile.
     */
    async getConversations(userId: string) {
        // Get all rooms this user is a member of
        const rooms = await this.prisma.chatRoom.findMany({
            where: {
                members: { some: { userId } },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                userName: true,
                                profilePhotoUrl: true,
                                email: true,
                            },
                        },
                    },
                },
                chats: {
                    orderBy: { sentAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updated_at: 'desc' },
        });

        const conversations = await Promise.all(
            rooms.map(async (room) => {
                const partner = room.members.find((m) => m.userId !== userId);
                if (!partner) return null;

                const unreadCount = await this.prisma.chat.count({
                    where: {
                        roomId: room.roomId,
                        receiverId: userId,
                        isSeen: false,
                    },
                });

                const lastMessage = room.chats[0] ?? null;

                return {
                    roomId: room.roomId,
                    partner: partner.user,
                    lastMessage: lastMessage
                        ? {
                            chatId: lastMessage.chatId,
                            message: lastMessage.message,
                            sentAt: lastMessage.sentAt,
                            isSeen: lastMessage.isSeen,
                            senderId: lastMessage.senderId,
                        }
                        : null,
                    unreadCount,
                };
            }),
        );

        return conversations.filter(Boolean);
    }

    /**
     * Paginated messages between two users (ordered oldest → newest).
     */
    async getMessages(
        userId: string,
        otherUserId: string,
        page = 1,
        limit = 30,
    ) {
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.chat.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId },
                    ],
                },
                orderBy: { sentAt: 'asc' },
                skip,
                take: limit,
                include: {
                    sender: {
                        select: {
                            userId: true,
                            userName: true,
                            profilePhotoUrl: true,
                        },
                    },
                },
            }),
            this.prisma.chat.count({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId },
                    ],
                },
            }),
        ]);

        return {
            data: messages,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Single message by ID.
     */
    async getMessage(chatId: string) {
        return this.prisma.chat.findUnique({
            where: { chatId },
            include: {
                sender: {
                    select: {
                        userId: true,
                        userName: true,
                        profilePhotoUrl: true,
                    },
                },
                receiver: {
                    select: {
                        userId: true,
                        userName: true,
                        profilePhotoUrl: true,
                    },
                },
            },
        });
    }
}
