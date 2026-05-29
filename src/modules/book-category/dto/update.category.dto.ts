import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'Science',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Science related books',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
