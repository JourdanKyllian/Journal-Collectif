import { Controller } from '@nestjs/common';
import { DeclarationObjetService } from './declaration-objet.service';

@Controller('declaration-objet')
export class DeclarationObjetController {
  constructor(
    private readonly declarationObjetService: DeclarationObjetService,
  ) {}
}
