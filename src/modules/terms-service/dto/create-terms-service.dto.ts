import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTermsServiceDto {
  @ApiProperty({ example: 'Terms of Service' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'By using this app, you agree to these terms...' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
