import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBannerDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'New banner image file',
  })
  file?: any;

  @ApiPropertyOptional({ example: 'Winter Collection' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'New arrivals for the winter' })
  @IsOptional()
  @IsString()
  description?: string;
}
