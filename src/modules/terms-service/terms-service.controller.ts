import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { sendResponse } from 'src/common/helpers';
import { TermsServiceService } from './terms-service.service';
import { CreateTermsServiceDto } from './dto/create-terms-service.dto';
import { UpdateTermsServiceDto } from './dto/update-terms-service.dto';
import { GetTermsServiceQueryDto } from './dto/get-terms-service.dto';

@ApiTags('Terms & Service')
@Controller('terms-service')
export class TermsServiceController {
  constructor(private readonly termsServiceService: TermsServiceService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create Terms & Service (Admin Only)',
  })
  @ApiCreatedResponse({
    description: 'Terms & Service created successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can create Terms & Service',
  })
  async createTermsService(@Body() dto: CreateTermsServiceDto) {
    const result = await this.termsServiceService.createTermsService(
      dto.title,
      dto.description,
    );

    return sendResponse(
      HttpStatus.CREATED,
      'Terms & Service Created Successfully',
      result,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Terms & Services',
  })
  async getAllTermsServices(@Query() query: GetTermsServiceQueryDto) {
    const result = await this.termsServiceService.getAllTermsServices(query);
    return sendResponse(
      HttpStatus.OK,
      'Terms & Services retrieved successfully',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single Terms & Service',
  })
  async getSingleTermsService(@Param('id') id: string) {
    const result = await this.termsServiceService.getSingleTermsService(id);
    return sendResponse(
      HttpStatus.OK,
      'Terms & Service retrieved successfully',
      result,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update Terms & Service (Admin Only)',
  })
  @ApiOkResponse({
    description: 'Terms & Service updated successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can update Terms & Service',
  })
  async updateTermsService(
    @Param('id') id: string,
    @Body() dto: UpdateTermsServiceDto,
  ) {
    const result = await this.termsServiceService.updateTermsService(
      id,
      dto.title,
      dto.description,
    );
    return sendResponse(
      HttpStatus.OK,
      'Terms & Service Updated Successfully',
      result,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete Terms & Service (Admin Only)',
  })
  @ApiOkResponse({
    description: 'Terms & Service deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN can delete Terms & Service',
  })
  async deleteTermsService(@Param('id') id: string) {
    const result = await this.termsServiceService.deleteTermsService(id);
    return sendResponse(
      HttpStatus.OK,
      'Terms & Service Deleted Successfully',
      result,
    );
  }
}
