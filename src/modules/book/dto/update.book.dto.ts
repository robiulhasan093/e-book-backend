import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum BookCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  USED_GOOD = 'USED_GOOD',
  USED_FAIR = 'USED_FAIR',
  DAMAGED = 'DAMAGED',
}

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

/**
 * Helper: convert "" -> undefined
 */
const emptyToUndefined = ({ value }) => {
  if (value === '') return undefined;
  return value;
};

export class UpdateBookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(emptyToUndefined)
  bookName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(emptyToUndefined)
  authorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  bookCategoryId?: string;

  @ApiPropertyOptional({ enum: BookCondition })
  @IsOptional()
  @IsEnum(BookCondition)
  @Transform(emptyToUndefined)
  condition?: BookCondition;

  @ApiPropertyOptional({ enum: BookStatus })
  @IsOptional()
  @IsEnum(BookStatus)
  @Transform(emptyToUndefined)
  status?: BookStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === '') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFree?: boolean;

  @ValidateIf((o) => o.isFree !== true)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(emptyToUndefined)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(emptyToUndefined)
  longitude?: number;
}
