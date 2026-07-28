import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// CORRECTION : On retire le 'v1/' car il est géré globalement par ton API
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin') // Sécurisation pour les admins
  @Post()
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get() // Route publique (pour afficher la bannière sur l'accueil)
  findAll() {
    return this.alertsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(+id, updateAlertDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertsService.remove(+id);
  }
}
