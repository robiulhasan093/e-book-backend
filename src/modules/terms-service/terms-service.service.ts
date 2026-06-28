import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTermsServiceQueryDto } from './dto/get-terms-service.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TermsServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createTermsService(title: string, description: string) {
    const terms = await this.prisma.termsService.create({
      data: {
        title: title.trim(),
        description: description.trim(),
      },
    });

    return terms;
  }

  async getAllTermsServices(query: GetTermsServiceQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TermsServiceWhereInput = {
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

    const [termsList, total] = await Promise.all([
      this.prisma.termsService.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.termsService.count({
        where,
      }),
    ]);

    return {
      data: termsList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSingleTermsService(id: string) {
    const terms = await this.prisma.termsService.findFirst({
      where: {
        termsServiceId: id,
        isDeleted: false,
      },
    });

    if (!terms) {
      throw new NotFoundException('Terms & Service not found or deleted');
    }

    return terms;
  }

  async updateTermsService(id: string, title?: string, description?: string) {
    const existingTerms = await this.prisma.termsService.findFirst({
      where: {
        termsServiceId: id,
        isDeleted: false,
      },
    });

    if (!existingTerms) {
      throw new NotFoundException('Terms & Service not found or deleted');
    }

    const updatedTerms = await this.prisma.termsService.update({
      where: {
        termsServiceId: id,
      },
      data: {
        title: title !== undefined ? title.trim() : existingTerms.title,
        description: description !== undefined ? description.trim() : existingTerms.description,
      },
    });

    return updatedTerms;
  }

  async deleteTermsService(id: string) {
    const existingTerms = await this.prisma.termsService.findFirst({
      where: {
        termsServiceId: id,
        isDeleted: false,
      },
    });

    if (!existingTerms) {
      throw new NotFoundException('Terms & Service not found or deleted');
    }

    const deletedTerms = await this.prisma.termsService.update({
      where: {
        termsServiceId: id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedTerms;
  }
}
