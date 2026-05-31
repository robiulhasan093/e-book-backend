import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCategoriesQueryDto {
  @ApiPropertyOptional({
    description: 'Search by category name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit = 10;
}
