import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Banner image file',
  })
  file: any;

  @ApiPropertyOptional({ example: 'Summer Deal' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Get 20% off on all books' })
  @IsOptional()
  @IsString()
  description?: string;
}
