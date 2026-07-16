import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { TimelogsService } from '../services/timelogs.service';
import { CreateTimelogDto } from '../dto/create-timelog.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
    organizationId: string;
    role: string;
  };
};

@Controller('timelogs')
@UseGuards(JwtAuthGuard)
export class TimelogsController {
  constructor(private readonly timelogsService: TimelogsService) {}

  @Post()
  create(@Body() dto: CreateTimelogDto, @Req() req: AuthenticatedRequest) {
    return this.timelogsService.create(
      {
        ...dto,
        userId: dto.userId || req.user.sub,
      },
      req.user,
    );
  }

  @Get()
  findAll(@Query('userId') userId: string | undefined, @Req() req: AuthenticatedRequest) {
    return this.timelogsService.findAll(userId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.timelogsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimelogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timelogsService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.timelogsService.remove(id, req.user);
  }
}
