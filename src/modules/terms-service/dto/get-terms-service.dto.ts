import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class GetTermsServiceQueryDto {
  @ApiPropertyOptional({
    description: 'Search by title or description.',
    example: 'privacy',
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string.' })
  @MaxLength(100, { message: 'Search cannot exceed 100 characters.' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number.',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer.' })
  @Min(1, { message: 'Page must be greater than 0.' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page.',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  limit: number = 10;
}