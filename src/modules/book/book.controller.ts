import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create.book.dto';
import { UpdateBookDto } from './dto/update.book.dto';
import { GetBooksQueryDto } from './dto/get.books.query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { sendResponse } from 'src/common/helpers';
import { SUCCESS_MESSAGES } from 'src/common/constants';
import { DeleteBookImagesDto } from './dto/delete.book.image.dto';

@ApiTags('Book')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // ─── Create Book (Authenticated User Only) ───────────────────────────
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnailUrl', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  @ApiOperation({
    summary: 'Create a new book',
  })
  @ApiCreatedResponse({
    description: 'Book created successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookName: {
          type: 'string',
        },
        authorName: {
          type: 'string',
        },
        bookCategoryId: {
          type: 'string',
          format: 'uuid',
        },
        condition: {
          type: 'string',
          enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
        },
        isFree: {
          type: 'boolean',
        },
        price: {
          type: 'number',
        },
        description: {
          type: 'string',
        },
        location: {
          type: 'string',
        },
        latitude: {
          type: 'number',
        },
        longitude: {
          type: 'number',
        },
        thumbnailUrl: {
          type: 'string',
          format: 'binary',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['bookName', 'authorName', 'bookCategoryId', 'condition'],
    },
  })
  async createBook(
    @Body() dto: CreateBookDto,
    @GetCurrentUser() user: any,
    @UploadedFiles()
    files?: {
      thumbnailUrl?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const result = await this.bookService.createBook(dto, user.userId, files);

    return sendResponse(
      HttpStatus.CREATED,
      SUCCESS_MESSAGES.BOOK.BOOK_CREATED,
      result,
    );
  }

  // @Post('create')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'thumbnailUrl', maxCount: 1 },
  //     { name: 'images', maxCount: 10 },
  //   ]),
  // )
  // @ApiOperation({ summary: 'Create a new book (Authenticated User)' })
  // @ApiCreatedResponse({ description: 'Book created successfully' })
  // @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // async createBook(
  //   @Body() dto: CreateBookDto,
  //   @GetCurrentUser() user: any,
  //   @UploadedFiles()
  //   files?: {
  //     thumbnailUrl?: Express.Multer.File[];
  //     images?: Express.Multer.File[];
  //   },
  // ) {
  //   const result = await this.bookService.createBook(dto, user.userId, files);
  //   return sendResponse(
  //     HttpStatus.CREATED,
  //     SUCCESS_MESSAGES.BOOK.BOOK_CREATED,
  //     result,
  //   );
  // }

  // ─── Get All Books (Public — with search, filter, pagination) ─────────
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all books (with search, filter, pagination)' })
  @ApiOkResponse({ description: 'Books fetched successfully' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by book name or author',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
  })
  @ApiQuery({
    name: 'isFree',
    required: false,
    type: Boolean,
    description: 'Filter free or paid',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
  })
  async getAllBooks(@Query() query: GetBooksQueryDto) {
    const result = await this.bookService.getAllBooks(query);
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.BOOKS_FETCHED,
      result.data,
      result.meta,
    );
  }

  // ─── Get My Books (Authenticated User) ────────────────────────────────
  @Get('my-books')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all books of the authenticated user' })
  @ApiOkResponse({ description: 'User books fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by book name or author',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
  })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
  })
  async getMyBooks(
    @GetCurrentUser() user: any,
    @Query() query: GetBooksQueryDto,
  ) {
    const result = await this.bookService.getUserBooks(user.userId, query);
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.BOOKS_FETCHED,
      result.data,
      result.meta,
    );
  }

  // ─── Get User Books by User ID (Public) ───────────────────────────────
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all books by a specific user' })
  @ApiOkResponse({ description: 'User books fetched successfully' })
  @ApiParam({ name: 'userId', description: 'User ID to fetch books for' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
  })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
  })
  async getUserBooks(
    @Param('userId') userId: string,
    @Query() query: GetBooksQueryDto,
  ) {
    const result = await this.bookService.getUserBooks(userId, query);
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.BOOKS_FETCHED,
      result.data,
      result.meta,
    );
  }

  // ─── Toggle Favourites ────────────────────────────────────────────────
  @Patch('favourites/:bookId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle book in favourites' })
  @ApiOkResponse({ description: 'Book added to or removed from favourites' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiParam({ name: 'bookId', description: 'Book ID to toggle' })
  async toggleFavourite(
    @Param('bookId') bookId: string,
    @GetCurrentUser() user: any,
  ) {
    const result = await this.bookService.toggleFavourite(bookId, user.userId);
    const message = result.isAdded
      ? SUCCESS_MESSAGES.BOOK.ADDED_TO_FAVOURITES
      : SUCCESS_MESSAGES.BOOK.REMOVED_FROM_FAVOURITES;
    return sendResponse(HttpStatus.OK, message, result.data);
  }

  // ─── Get All Favourite Books ──────────────────────────────────────────
  @Get('favourites')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all favourite books of the authenticated user',
  })
  @ApiOkResponse({ description: 'Favourite books fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getFavouriteBooks(
    @GetCurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.bookService.getFavouriteBooks(
      user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.FAVOURITES_FETCHED,
      result.data,
      result.meta,
    );
  }

  // ─── Get Single Book ──────────────────────────────────────────────────
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single book by ID' })
  @ApiOkResponse({ description: 'Book fetched successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  async getSingleBook(@Param('id') id: string) {
    const result = await this.bookService.getSingleBook(id);
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.BOOK_FETCHED,
      result,
    );
  }

  // ─── Update Book (Only Uploaded User) ─────────────────────────────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnailUrl', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  @ApiOperation({ summary: 'Update book (append images, replace thumbnail)' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiOkResponse({ description: 'Book updated successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookName: { type: 'string' },
        authorName: { type: 'string' },
        bookCategoryId: { type: 'string' },
        condition: {
          type: 'string',
          enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
        },
        status: {
          type: 'string',
          enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
        },
        isFree: { type: 'boolean' },
        price: { type: 'number' },
        description: { type: 'string' },
        location: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        thumbnailUrl: { type: 'string', format: 'binary' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @GetCurrentUser() user: any,
    @UploadedFiles()
    files?: {
      thumbnailUrl?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const result = await this.bookService.updateBook(
      id,
      dto,
      user.userId,
      files,
    );

    return sendResponse(HttpStatus.OK, 'Book updated successfully', result);
  }

  // @Patch(':id')
  // @HttpCode(HttpStatus.OK)
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'thumbnailUrl', maxCount: 1 },
  //     { name: 'images', maxCount: 10 },
  //   ]),
  // )
  // @ApiOperation({ summary: 'Update a book (Only the user who uploaded it)' })
  // @ApiOkResponse({ description: 'Book updated successfully' })
  // @ApiNotFoundResponse({ description: 'Book not found' })
  // @ApiForbiddenResponse({ description: 'Not authorized to update this book' })
  // @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @ApiParam({ name: 'id', description: 'Book ID' })
  // async updateBook(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateBookDto,
  //   @GetCurrentUser() user: any,
  //   @UploadedFiles()
  //   files?: {
  //     thumbnailUrl?: Express.Multer.File[];
  //     images?: Express.Multer.File[];
  //   },
  // ) {
  //   const result = await this.bookService.updateBook(id, dto, user.userId, files);
  //   return sendResponse(
  //     HttpStatus.OK,
  //     SUCCESS_MESSAGES.BOOK.BOOK_UPDATED,
  //     result,
  //   );
  // }

  // Delete book images
  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete one or multiple book images',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
  })
  @ApiOkResponse({
    description: 'Images deleted successfully',
  })
  @ApiForbiddenResponse({
    description: 'Not authorized',
  })
  @ApiNotFoundResponse({
    description: 'Book not found',
  })
  async deleteBookImages(
    @Param('id') bookId: string,
    @Body() dto: DeleteBookImagesDto,
    @GetCurrentUser() user: any,
  ) {
    const result = await this.bookService.deleteBookImages(
      bookId,
      dto,
      user.userId,
    );

    return sendResponse(
      HttpStatus.OK,
      'Book images deleted successfully',
      result,
    );
  }

  // ─── Delete Book (Only Uploaded User or Admin) ────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a book (Only uploader or Admin)' })
  @ApiOkResponse({ description: 'Book deleted successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiForbiddenResponse({ description: 'Not authorized to delete this book' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  async deleteBook(@Param('id') id: string, @GetCurrentUser() user: any) {
    const result = await this.bookService.deleteBook(
      id,
      user.userId,
      user.role,
    );
    return sendResponse(
      HttpStatus.OK,
      SUCCESS_MESSAGES.BOOK.BOOK_DELETED,
      result,
    );
  }
}
