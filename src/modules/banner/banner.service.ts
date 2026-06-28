import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetBannersQueryDto } from './dto/get-banners.dto';
import { Prisma } from '@prisma/client';
import { uploadImageToCloudinary } from 'src/common/helpers/cloudinary.helper';

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  async createBanner(
    file: Express.Multer.File,
    title?: string,
    description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Banner image file is required');
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadImageToCloudinary(file.buffer, 'banners');
    } catch (error) {
      throw new BadRequestException('Banner image upload failed');
    }

    const banner = await this.prisma.banner.create({
      data: {
        imageUrl,
        title: title?.trim() || null,
        description: description?.trim() || null,
      },
    });

    return banner;
  }

  async getAllBanners(query: GetBannersQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BannerWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [banners, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.banner.count({
        where,
      }),
    ]);

    return {
      data: banners,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSingleBanner(id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: {
        bannerId: id,
        isDeleted: false,
      },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found or deleted');
    }

    return banner;
  }

  async updateBanner(
    id: string,
    file?: Express.Multer.File,
    title?: string,
    description?: string,
  ) {
    const existingBanner = await this.prisma.banner.findFirst({
      where: {
        bannerId: id,
        isDeleted: false,
      },
    });

    if (!existingBanner) {
      throw new NotFoundException('Banner not found or deleted');
    }

    let imageUrl = existingBanner.imageUrl;
    if (file) {
      try {
        imageUrl = await uploadImageToCloudinary(file.buffer, 'banners');
      } catch (error) {
        throw new BadRequestException('Banner image upload failed');
      }
    }

    const updatedBanner = await this.prisma.banner.update({
      where: {
        bannerId: id,
      },
      data: {
        imageUrl,
        title: title !== undefined ? title.trim() || null : existingBanner.title,
        description: description !== undefined ? description.trim() || null : existingBanner.description,
      },
    });

    return updatedBanner;
  }

  async deleteBanner(id: string) {
    const existingBanner = await this.prisma.banner.findFirst({
      where: {
        bannerId: id,
        isDeleted: false,
      },
    });

    if (!existingBanner) {
      throw new NotFoundException('Banner not found or deleted');
    }

    const deletedBanner = await this.prisma.banner.update({
      where: {
        bannerId: id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedBanner;
  }
}
