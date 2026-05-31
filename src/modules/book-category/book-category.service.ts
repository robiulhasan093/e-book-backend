import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookCategoryDto } from './dto/create.category.dto';
import { UpdateCategoryDto } from './dto/update.category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // create book category
  async createCategory(dto: CreateBookCategoryDto) {
    const trimedCategoryName = dto.name.trim();
    const trimedCategoryDescription = dto.description?.trim();

    const existingCategory = await this.prisma.bookCategory.findFirst({
      where: {
        categoryName: {
          equals: trimedCategoryName,
          mode: 'insensitive',
        },
      },
    });
    if (existingCategory) {
      throw new BadRequestException(
        'Category already exists',
        existingCategory.categoryName,
      );
    }
    const category = await this.prisma.bookCategory.create({
      data: {
        categoryName: trimedCategoryName,
        description: trimedCategoryDescription,
      },
    });

    return category;
  }

  // get all categories
  async getAllCategories(query: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.BookCategoryWhereInput = {
      isDeleted: false,
      ...(search && {
        categoryName: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.bookCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.bookCategory.count({
        where,
      }),
    ]);

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //get single categories
  async getSingleCategory(id: string) {
    const category = await this.prisma.bookCategory.findUnique({
      where: {
        bookCategoryId: id,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found or deleted');
    }

    return category;
  }

  //update category
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.bookCategory.findUnique({
      where: {
        bookCategoryId: id,
        isDeleted: false,
      },
    });
    if (!existingCategory) {
      throw new NotFoundException('Category not found or deleted');
    }

    const trimedCategoryName = dto.name?.trim();
    const trimedCategoryDescription = dto.description?.trim();

    const category = await this.prisma.bookCategory.update({
      where: {
        bookCategoryId: id,
      },
      data: {
        categoryName: trimedCategoryName,
        description: trimedCategoryDescription,
      },
    });

    return category;
  }

  //delete category
  async deleteCategory(id: string, userId: string) {
    const existingCategory = await this.prisma.bookCategory.findUnique({
      where: {
        bookCategoryId: id,
        isDeleted: false,
      },
    });
    if (!existingCategory) {
      throw new NotFoundException('Category not found or deleted');
    }

    const category = await this.prisma.bookCategory.update({
      where: {
        bookCategoryId: id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return category;
  }
}
