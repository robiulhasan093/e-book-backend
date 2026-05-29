import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookCategoryDto } from './dto/create.category.dto';
import { UpdateCategoryDto } from './dto/update.category.dto';

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
  async getAllCategories() {
    const categories = await this.prisma.bookCategory.findMany();

    return categories;
  }

  //get single categories
  async getSingleCategory(id: string) {
    const category = await this.prisma.bookCategory.findUnique({
      where: {
        bookCategoryId: id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  //update category
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.bookCategory.findUnique({
      where: {
        bookCategoryId: id,
      },
    });
    if (!existingCategory) {
      throw new NotFoundException('Category not found');
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
}
