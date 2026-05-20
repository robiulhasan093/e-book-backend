import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserSignUpDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiProperty({ example: '12345678' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
