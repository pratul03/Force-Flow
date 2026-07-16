import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { AssetsService } from '../services/assets.service';
import { AssetQueryDto } from '../dto/asset-query.dto';
import { AssignAssetDto } from '../dto/assign-asset.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { RunDepreciationDto } from '../dto/run-depreciation.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('status')
  status(@Req() req: { user: { organizationId: string } }) {
    return this.assetsService.getStatus(req.user.organizationId);
  }

  @Get()
  listAssets(@Query() query: AssetQueryDto, @Req() req: { user: { organizationId: string } }) {
    return this.assetsService.listAssets({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  createAsset(@Body() dto: CreateAssetDto, @Req() req: { user: { organizationId: string } }) {
    return this.assetsService.createAsset({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  assignAsset(@Param('id') id: string, @Body() dto: AssignAssetDto) {
    return this.assetsService.assignAsset(id, dto);
  }

  @Post('depreciation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  depreciation(
    @Body() dto: RunDepreciationDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.assetsService.runDepreciation({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }
}
