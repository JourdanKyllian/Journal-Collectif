import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { BonPlanService } from './bon-plan.service';
import { CreateBonPlanDto } from './dto/create-bon-plan.dto';
import { UpdateBonPlanDto } from './dto/update-bon-plan.dto';
import { ParticiperConcoursDto } from './dto/participer-concours.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('bon-plan')
export class BonPlanController {
  constructor(private readonly bonPlanService: BonPlanService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    const includeAll = all === 'true' || all === '1';
    return this.bonPlanService.findAll(includeAll);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bonPlanService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  create(@Body() dto: CreateBonPlanDto) {
    return this.bonPlanService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBonPlanDto) {
    return this.bonPlanService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  toggleStatut(@Param('id', ParseIntPipe) id: number) {
    return this.bonPlanService.toggleStatut(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bonPlanService.remove(id);
  }

  // --- PARTICIPATION AUX JEUX CONCOURS ---

  @Post(':id/participer')
  participer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ParticiperConcoursDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req?.user?.userId;
    return this.bonPlanService.participer(id, dto, userId);
  }

  @Get(':id/participations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  getParticipations(@Param('id', ParseIntPipe) id: number) {
    return this.bonPlanService.getParticipations(id);
  }

  @Post(':id/tirage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  tirerGagnants(
    @Param('id', ParseIntPipe) id: number,
    @Body('nombre', new ParseIntPipe({ optional: true })) nombre = 1,
  ) {
    return this.bonPlanService.tirerGagnants(id, nombre);
  }
}
