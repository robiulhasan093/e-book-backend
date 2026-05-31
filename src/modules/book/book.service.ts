import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { uploadImageToCloudinary } from 'src/common/helpers/cloudinary.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookDto } from './dto/create.book.dto';
import { UpdateBookDto } from './dto/update.book.dto';
import { GetBooksQueryDto } from './dto/get.books.query.dto';
import { ERROR_MESSAGES } from 'src/common/constants';
import { Prisma } from '@prisma/client';
import { DeleteBookImagesDto } from './dto/delete.book.image.dto';

@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create Book (Authenticated User) ─────────────────────────────────
  async createBook(
    dto: CreateBookDto,
    userId: string,
    files?: {
      thumbnailUrl?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    // Verify category exists
    const category = await this.prisma.bookCategory.findUnique({
      where: { bookCategoryId: dto.bookCategoryId, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.BOOK.CATEGORY_NOT_FOUND);
    }

    // Pricing constraint: if not free, price must be greater than 0
    const isFree = dto.isFree ?? false;
    if (!isFree) {
      if (dto.price === undefined || dto.price === null || dto.price <= 0) {
        throw new BadRequestException(
          'Price must be greater than 0 when the book is not free',
        );
      }
    }

    let thumbnailUrl: string | null = null;
    if (files?.thumbnailUrl?.[0]) {
      try {
        thumbnailUrl = await uploadImageToCloudinary(
          files.thumbnailUrl[0].buffer,
          'books',
        );
      } catch (error) {
        throw new BadRequestException('Thumbnail upload failed');
      }
    }

    let imageLinks: { imageUrl: string }[] = [];
    if (files?.images) {
      for (const image of files.images) {
        try {
          const imageUrl = await uploadImageToCloudinary(image.buffer, 'books');
          imageLinks.push({ imageUrl });
        } catch (error) {
          throw new BadRequestException('Images upload failed');
        }
      }
    }

    const book = await this.prisma.book.create({
      data: {
        bookName: dto.bookName.trim(),
        authorName: dto.authorName.trim(),
        bookCategoryId: dto.bookCategoryId,
        condition: dto.condition as any,
        isFree,
        price: isFree ? 0 : (dto.price ?? 0),
        description: dto.description?.trim(),
        location: dto.location?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        thumbnailUrl,
        copyOwner: userId,
        images: {
          create: imageLinks,
        },
      },
      include: {
        category: true,
        owner: {
          select: {
            userId: true,
            userName: true,
            email: true,
            profilePhotoUrl: true,
          },
        },
        images: true,
      },
    });

    return book;
  }

  // ─── Get All Books (with search, filter, pagination) ──────────────────
  async getAllBooks(query: GetBooksQueryDto) {
    const {
      page,
      limit,
      search,
      categoryId,
      condition,
      status,
      isFree,
      sortBy,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { bookName: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { bookCategoryId: categoryId }),
      ...(condition && { condition: condition as any }),
      ...(status && { status: status as any }),
      ...(isFree !== undefined && { isFree }),
    };

    // Sort order
    let orderBy: Prisma.BookOrderByWithRelationInput;
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
        break;
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          owner: {
            select: {
              userId: true,
              userName: true,
              email: true,
              profilePhotoUrl: true,
            },
          },
          images: true,
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Get Single Book ──────────────────────────────────────────────────
  async getSingleBook(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { bookId, isDeleted: false },
      include: {
        category: true,
        owner: {
          select: {
            userId: true,
            userName: true,
            email: true,
            profilePhotoUrl: true,
          },
        },
        images: true,
      },
    });

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.BOOK.BOOK_NOT_FOUND);
    }

    return book;
  }

  // ─── Get Single User's Books ──────────────────────────────────────────
  async getUserBooks(userId: string, query: GetBooksQueryDto) {
    const {
      page,
      limit,
      search,
      categoryId,
      condition,
      status,
      isFree,
      sortBy,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      copyOwner: userId,
      isDeleted: false,
      ...(search && {
        OR: [
          { bookName: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { bookCategoryId: categoryId }),
      ...(condition && { condition: condition as any }),
      ...(status && { status: status as any }),
      ...(isFree !== undefined && { isFree }),
    };

    let orderBy: Prisma.BookOrderByWithRelationInput;
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
        break;
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: true,
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Update Book (Only Uploaded User) ─────────────────────────────────

  async updateBook(
    bookId: string,
    dto: UpdateBookDto,
    userId: string,
    files?: {
      thumbnailUrl?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const book = await this.prisma.book.findUnique({
      where: {
        bookId,
        isDeleted: false,
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.copyOwner !== userId) {
      throw new ForbiddenException('Not authorized to update this book');
    }

    // category validation
    if (dto.bookCategoryId) {
      const category = await this.prisma.bookCategory.findUnique({
        where: {
          bookCategoryId: dto.bookCategoryId,
          isDeleted: false,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // isFree + price logic
    const isFree = dto.isFree ?? book.isFree;

    if (!isFree) {
      if (dto.price === undefined || dto.price === null) {
        throw new BadRequestException('Price required');
      }
    }

    const price = isFree ? 0 : (dto.price ?? book.price);

    // thumbnail upload (replace)
    let thumbnailUrl: string | undefined;

    if (files?.thumbnailUrl?.[0]) {
      thumbnailUrl = await uploadImageToCloudinary(
        files.thumbnailUrl[0].buffer,
        'books',
      );
    }

    // images upload (APPEND ONLY)
    let imageLinks: { imageUrl: string }[] = [];

    if (files?.images?.length) {
      for (const image of files.images) {
        const imageUrl = await uploadImageToCloudinary(image.buffer, 'books');

        imageLinks.push({ imageUrl });
      }
    }

    const updatedBook = await this.prisma.book.update({
      where: { bookId },

      data: {
        ...(dto.bookName && {
          bookName: dto.bookName.trim(),
        }),

        ...(dto.authorName && {
          authorName: dto.authorName.trim(),
        }),

        ...(dto.bookCategoryId && {
          bookCategoryId: dto.bookCategoryId,
        }),

        ...(dto.condition && {
          condition: dto.condition,
        }),

        ...(dto.status && {
          status: dto.status,
        }),

        ...(dto.description !== undefined && {
          description: dto.description?.trim(),
        }),

        ...(dto.location !== undefined && {
          location: dto.location?.trim(),
        }),

        ...(dto.latitude !== undefined && {
          latitude: dto.latitude,
        }),

        ...(dto.longitude !== undefined && {
          longitude: dto.longitude,
        }),

        ...(thumbnailUrl && {
          thumbnailUrl,
        }),

        isFree,
        price,

        // APPEND images (NO delete)
        ...(imageLinks.length > 0 && {
          images: {
            create: imageLinks,
          },
        }),
      },

      include: {
        category: true,
        owner: {
          select: {
            userId: true,
            userName: true,
            email: true,
            profilePhotoUrl: true,
          },
        },
        images: true,
      },
    });

    return updatedBook;
  }

  // Delete book images
  async deleteBookImages(
    bookId: string,
    dto: DeleteBookImagesDto,
    userId: string,
  ) {
    const book = await this.prisma.book.findUnique({
      where: {
        bookId,
        isDeleted: false,
      },
    });

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.BOOK.BOOK_NOT_FOUND);
    }

    if (book.copyOwner !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.BOOK.UNAUTHORIZED_UPDATE);
    }

    const images = await this.prisma.bookImage.findMany({
      where: {
        previewId: {
          in: dto.imageIds,
        },
        bookId,
      },
    });

    if (!images.length) {
      throw new NotFoundException('No matching images found');
    }

    await this.prisma.bookImage.deleteMany({
      where: {
        previewId: {
          in: dto.imageIds,
        },
        bookId,
      },
    });

    return {
      deletedCount: images.length,
      deletedImageIds: images.map((image) => image.previewId),
    };
  }

  // ─── Delete Book (Only Uploaded User or Admin) ────────────────────────
  async deleteBook(bookId: string, userId: string, userRole: string) {
    const book = await this.prisma.book.findUnique({
      where: { bookId, isDeleted: false },
    });

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.BOOK.BOOK_NOT_FOUND);
    }

    // Only the book owner or an admin can delete
    if (book.copyOwner !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(ERROR_MESSAGES.BOOK.UNAUTHORIZED_DELETE);
    }

    const deletedBook = await this.prisma.book.update({
      where: { bookId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedBook;
  }

  // ─── Toggle Favourite ──────────────────────────────────────────────────
  async toggleFavourite(bookId: string, userId: string) {
    // Verify book exists
    const book = await this.prisma.book.findUnique({
      where: { bookId, isDeleted: false },
    });

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.BOOK.BOOK_NOT_FOUND);
    }

    // Check if already in favourites
    const existingFavourite = await this.prisma.userFavourite.findUnique({
      where: {
        userId_bookId: { userId, bookId },
      },
    });

    if (existingFavourite) {
      await this.prisma.userFavourite.delete({
        where: {
          userId_bookId: { userId, bookId },
        },
      });
      return { isAdded: false, data: null };
    }

    const favourite = await this.prisma.userFavourite.create({
      data: {
        userId,
        bookId,
      },
      include: {
        book: {
          include: {
            category: true,
            owner: {
              select: {
                userId: true,
                userName: true,
                email: true,
                profilePhotoUrl: true,
              },
            },
            images: true,
          },
        },
      },
    });

    return { isAdded: true, data: favourite };
  }

  // ─── Get All Favourite Books ──────────────────────────────────────────
  async getFavouriteBooks(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserFavouriteWhereInput = {
      userId,
      book: {
        isDeleted: false,
      },
    };

    const [favourites, total] = await Promise.all([
      this.prisma.userFavourite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          book: {
            include: {
              category: true,
              owner: {
                select: {
                  userId: true,
                  userName: true,
                  email: true,
                  profilePhotoUrl: true,
                },
              },
              images: true,
            },
          },
        },
      }),
      this.prisma.userFavourite.count({ where }),
    ]);

    return {
      data: favourites,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
