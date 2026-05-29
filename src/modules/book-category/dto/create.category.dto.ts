import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookCategoryDto {
  @ApiProperty({
    example: 'Science',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Science related books',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
