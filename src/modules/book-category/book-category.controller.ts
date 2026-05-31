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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BookCategoryService } from './book-category.service';
import { CreateBookCategoryDto } from './dto/create.category.dto';
import { sendResponse } from 'src/common/helpers';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { UpdateCategoryDto } from './dto/update.category.dto';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { GetCategoriesQueryDto } from './dto/get.category.dto';

@ApiTags('Book Category')
@Controller('book-category')
export class BookCategoryController {
  constructor(private readonly bookCategoryService: BookCategoryService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Create Book Category (Admin Only)',
  })
  @ApiCreatedResponse({
    description: 'Book Category Created Successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can create book category',
  })
  async createBookCategory(@Body() dto: CreateBookCategoryDto) {
    const result = await this.bookCategoryService.createCategory(dto);

    return sendResponse(
      HttpStatus.CREATED,
      'Book Category Created Successfully',
      result,
    );
  }

  //get all categories
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all book categories',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  async getAllCategories(@Query() query: GetCategoriesQueryDto) {
    const result = await this.bookCategoryService.getAllCategories(query);
    return sendResponse(
      HttpStatus.OK,
      'Book categories retrieved successfully',
      result,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single book category',
  })
  @ApiBearerAuth('access-token')
  async getSingleCategory(
    @Param('id')
    id: string,
  ) {
    const result = await this.bookCategoryService.getSingleCategory(id);
    return sendResponse(
      HttpStatus.OK,
      'Book category retrieved successfully',
      result,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Update Book Category (Admin Only)',
  })
  @ApiCreatedResponse({
    description: 'Book Category Updated Successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can update book category',
  })
  async updateBookCategory(
    @Param('id')
    id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.bookCategoryService.updateCategory(id, dto);
    return sendResponse(
      HttpStatus.OK,
      'Book Category Updated Successfully',
      result,
    );
  }

  //delete category
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Delete Book Category (Admin Only)',
  })
  @ApiCreatedResponse({
    description: 'Book Category Deleted Successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can delete book category',
  })
  async deleteBookCategory(
    @Param('id')
    id: string,
    @GetCurrentUser() user: any,
  ) {
    const result = await this.bookCategoryService.deleteCategory(
      id,
      user.userId,
    );
    return sendResponse(
      HttpStatus.OK,
      'Book Category Deleted Successfully',
      result,
    );
  }
}
