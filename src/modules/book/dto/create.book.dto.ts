// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import {
//   IsBoolean,
//   IsEnum,
//   IsNotEmpty,
//   IsNumber,
//   IsOptional,
//   IsString,
//   IsUUID,
//   MaxLength,
//   Min,
//   ValidateIf,
// } from 'class-validator';
// import { Type, Transform } from 'class-transformer';

// export class CreateBookDto {
//   @ApiProperty({
//     example: 'The Great Gatsby',
//     description: 'Name of the book',
//   })
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(255)
//   bookName: string;

//   @ApiProperty({
//     example: 'F. Scott Fitzgerald',
//     description: 'Author of the book',
//   })
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(255)
//   authorName: string;

//   @ApiProperty({
//     example: '550e8400-e29b-41d4-a716-446655440000',
//     description: 'Book category ID',
//   })
//   @IsUUID()
//   @IsNotEmpty()
//   bookCategoryId: string;

//   @ApiProperty({
//     enum: ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'],
//     example: 'NEW',
//     description: 'Condition of the book',
//   })
//   @IsEnum(['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED'])
//   @IsNotEmpty()
//   condition: string;

//   @ApiPropertyOptional({
//     example: false,
//     default: false,
//     description: 'Whether the book is free or paid',
//   })
//   @IsOptional()
//   @IsBoolean()
//   @Transform(({ value }) => {
//     if (value === 'true') return true;
//     if (value === 'false') return false;
//     return value;
//   })
//   isFree?: boolean;

//   @ApiPropertyOptional({
//     example: 19.99,
//     default: 0,
//     description: 'Price of the book (ignored if isFree is true)',
//   })
//   @ValidateIf(o => o.isFree === false || o.isFree === undefined)
//   @IsNotEmpty({ message: 'Price is required when the book is not free' })
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @Min(0.01, { message: 'Price must be greater than 0 when the book is not free' })
//   @Type(() => Number)
//   price?: number;

//   @ApiPropertyOptional({
//     example: 'A classic novel set in the Jazz Age.',
//     description: 'Description of the book',
//   })
//   @IsOptional()
//   @IsString()
//   description?: string;

//   @ApiPropertyOptional({
//     example: 'Dhaka, Bangladesh',
//     description: 'Location of the book',
//   })
//   @IsOptional()
//   @IsString()
//   location?: string;

//   @ApiPropertyOptional({
//     example: 23.8103,
//     description: 'Latitude coordinate',
//   })
//   @IsOptional()
//   @IsNumber({ maxDecimalPlaces: 8 })
//   @Type(() => Number)
//   latitude?: number;

//   @ApiPropertyOptional({
//     example: 90.4125,
//     description: 'Longitude coordinate',
//   })
//   @IsOptional()
//   @IsNumber({ maxDecimalPlaces: 8 })
//   @Type(() => Number)
//   longitude?: number;

//   @ApiPropertyOptional({
//     example: 'https://example.com/thumbnail.jpg',
//     description: 'Thumbnail URL of the book',
//   })
//   @IsOptional()
//   @IsString()
//   thumbnailUrl?: string;
// }

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
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

export class CreateBookDto {
  @ApiProperty({
    example: 'The Great Gatsby',
    description: 'Name of the book',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bookName: string;

  @ApiProperty({
    example: 'F. Scott Fitzgerald',
    description: 'Author of the book',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  authorName: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Book category ID',
  })
  @IsUUID()
  @IsNotEmpty()
  bookCategoryId: string;

  @ApiProperty({
    enum: BookCondition,
    example: BookCondition.NEW,
    description: 'Condition of the book',
  })
  @IsEnum(BookCondition)
  condition: BookCondition;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Whether the book is free or paid',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 19.99,
    description: 'Price of the book',
  })
  @ValidateIf((o) => o.isFree === false || o.isFree === undefined)
  @IsNotEmpty({
    message: 'Price is required when the book is not free',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, {
    message: 'Price must be greater than 0 when the book is not free',
  })
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({
    example: 'A classic novel set in the Jazz Age.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Dhaka, Bangladesh',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 23.8103,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    example: 90.4125,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Type(() => Number)
  longitude?: number;
}
