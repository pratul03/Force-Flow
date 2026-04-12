import { Module } from '@nestjs/common';
import { RazorpayController } from './controllers/razorpay.controller';
import { RazorpayService } from './services/razorpay.service';

@Module({
  controllers: [RazorpayController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
