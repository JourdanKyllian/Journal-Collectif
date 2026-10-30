import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JournalListQueryDto } from './dto/journal-list-query.dto';
import {
  ProvisionJournalDto,
  UpdateJournalStatutDto,
} from './dto/provision-journal.dto';
import { JournalService, toPublicJournal } from './journal.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { SkipTenantGate } from './skip-tenant-gate.decorator';

@ApiTags('Journaux')
@Controller('journals')
export class JournalController {
  constructor(private readonly journals: JournalService) {}

  /** Annuaire public des journaux actifs, filtrable par commune, code postal ou texte. */
  @Get()
  @SkipTenantGate()
  directory(@Query() query: JournalListQueryDto) {
    return this.journals.directory(query);
  }

  /** Le journal ciblé par la requête (`X-Journal`), s'il est visible pour l'appelant. */
  @Get('current')
  async current() {
    return toPublicJournal(await this.journals.current());
  }

  /** Crée un journal en configuration avec son super admin initial (plateforme). */
  @Post('provision')
  @SkipTenantGate()
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  provision(@Body() dto: ProvisionJournalDto) {
    return this.journals.provision(dto);
  }

  /** Passe un journal en maintenance, ou l'ouvre sans attendre son super admin (plateforme). */
  @Patch(':slug/statut')
  @SkipTenantGate()
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  setStatut(@Param('slug') slug: string, @Body() dto: UpdateJournalStatutDto) {
    return this.journals.setStatut(slug, dto.statut);
  }
}
