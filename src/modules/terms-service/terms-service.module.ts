import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TermsServiceController } from './terms-service.controller';
import { TermsServiceService } from './terms-service.service';

@Module({
  imports: [PrismaModule],
  controllers: [TermsServiceController],
  providers: [TermsServiceService],
  exports: [TermsServiceService],
})
export class TermsServiceModule {}
