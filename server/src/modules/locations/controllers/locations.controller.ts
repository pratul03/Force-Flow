import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from '../services/locations.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() dto: CreateLocationDto, @Req() req: { user: { organizationId: string } }) {
    return this.locationsService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Req() req: { user: { organizationId: string } }) {
    return this.locationsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.locationsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.locationsService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.locationsService.remove(id, req.user.organizationId);
  }
}
