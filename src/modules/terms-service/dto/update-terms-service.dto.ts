import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTermsServiceDto {
  @ApiPropertyOptional({ example: 'Updated Terms of Service' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'By using this app, you agree to these updated terms...' })
  @IsOptional()
  @IsString()
  description?: string;
}
