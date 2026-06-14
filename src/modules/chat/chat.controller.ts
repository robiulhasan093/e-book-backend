import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
    NotFoundException,
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
import { ChatService } from './chat.service';
import { sendResponse } from 'src/common/helpers';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * GET /api/v1/chat/conversations
     * Returns the list of users the authenticated user has chatted with,
     * along with the last message and unread count per conversation.
     */
    @Get('conversations')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all conversations for the current user' })
    async getConversations(@GetCurrentUser('userId') userId: string) {
        const data = await this.chatService.getConversations(userId);
        return sendResponse(HttpStatus.OK, "Conversations fetched successfully", data);
    }

    /**
     * GET /api/v1/chat/messages/:otherUserId?page=1&limit=30
     * Paginated message history between authenticated user and another user.
     * Also marks all unread messages from the other user as seen.
     */
    @Get('messages/:otherUserId')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get paginated messages with a specific user' })
    @ApiParam({ name: 'otherUserId', description: 'UUID of the other user' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Messages per page (default: 30)' })
    async getMessages(
        @GetCurrentUser('userId') userId: string,
        @Param('otherUserId') otherUserId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    ) {
        // Auto mark messages from otherUser as seen when opening the chat
        await this.chatService.markAllSeen(otherUserId, userId);

        const { data, meta } = await this.chatService.getMessages(userId, otherUserId, page, limit);
        return sendResponse(HttpStatus.OK, "Messages fetched successfully", data, meta);
    }

    /**
     * GET /api/v1/chat/message/:chatId
     * Fetch a single message by its ID.
     */
    @Get('message/:chatId')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a single message by ID' })
    @ApiParam({ name: 'chatId', description: 'UUID of the chat message' })
    async getMessage(@Param('chatId') chatId: string) {
        const message = await this.chatService.getMessage(chatId);
        if (!message) {
            throw new NotFoundException(`Message ${chatId} not found`);
        }
        return sendResponse(HttpStatus.OK, "Message fetched successfully", message);
    }
}
