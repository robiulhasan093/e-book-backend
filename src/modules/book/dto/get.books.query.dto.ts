import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetBooksQueryDto {
  @ApiPropertyOptional({
    description: 'Search by book name or author name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
    description: 'Filter by book condition',
  })
  @IsOptional()
  @IsEnum(['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'])
  condition?: string;

  @ApiPropertyOptional({
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
    description: 'Filter by book status',
  })
  @IsOptional()
  @IsEnum(['AVAILABLE', 'RESERVED', 'SOLD'])
  status?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by free or paid books',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
    default: 'newest',
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'oldest'])
  sortBy?: string;
}
