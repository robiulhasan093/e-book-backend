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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { sendResponse } from 'src/common/helpers';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { GetBannersQueryDto } from './dto/get-banners.dto';

@ApiTags('Banner')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Create Banner (Admin Only)',
  })
  @ApiCreatedResponse({
    description: 'Banner created successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can create banner',
  })
  async createBanner(
    @Body() dto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.bannerService.createBanner(
      file,
      dto.title,
      dto.description,
    );

    return sendResponse(
      HttpStatus.CREATED,
      'Banner Created Successfully',
      result,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all banners',
  })
  async getAllBanners(@Query() query: GetBannersQueryDto) {
    const result = await this.bannerService.getAllBanners(query);
    return sendResponse(
      HttpStatus.OK,
      'Banners retrieved successfully',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single banner',
  })
  async getSingleBanner(@Param('id') id: string) {
    const result = await this.bannerService.getSingleBanner(id);
    return sendResponse(
      HttpStatus.OK,
      'Banner retrieved successfully',
      result,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Update Banner (Admin Only)',
  })
  @ApiOkResponse({
    description: 'Banner updated successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can update banner',
  })
  async updateBanner(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.bannerService.updateBanner(
      id,
      file,
      dto.title,
      dto.description,
    );
    return sendResponse(
      HttpStatus.OK,
      'Banner Updated Successfully',
      result,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete Banner (Admin Only)',
  })
  @ApiOkResponse({
    description: 'Banner deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can delete banner',
  })
  async deleteBanner(@Param('id') id: string) {
    const result = await this.bannerService.deleteBanner(id);
    return sendResponse(
      HttpStatus.OK,
      'Banner Deleted Successfully',
      result,
    );
  }
}
