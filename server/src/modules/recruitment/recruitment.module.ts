import { Module } from '@nestjs/common';
import { RecruitmentController } from './controllers/recruitment.controller';
import { RecruitmentService } from './services/recruitment.service';

@Module({
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
