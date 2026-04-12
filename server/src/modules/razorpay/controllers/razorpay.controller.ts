import { Body, Controller, Post } from '@nestjs/common';
import { RazorpayService } from '../services/razorpay.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('payout')
  payout(@Body() payload: Record<string, unknown>) {
    return this.razorpayService.createPayout(payload);
  }
}
