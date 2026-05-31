import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteBookImagesDto {
  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    description: 'Book image IDs to delete',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  imageIds: string[];
}
