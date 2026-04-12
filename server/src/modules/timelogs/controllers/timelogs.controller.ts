import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TimelogsService } from '../services/timelogs.service';
import { CreateTimelogDto } from '../dto/create-timelog.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';

@Controller('timelogs')
export class TimelogsController {
  constructor(private readonly timelogsService: TimelogsService) {}

  @Post()
  create(@Body() dto: CreateTimelogDto) {
    return this.timelogsService.create(dto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.timelogsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timelogsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimelogDto) {
    return this.timelogsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timelogsService.remove(id);
  }
}
