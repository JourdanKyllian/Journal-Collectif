import { Controller } from '@nestjs/common';
import { VueStatistiqueService } from './vue-statistique.service';

@Controller('vue-statistique')
export class VueStatistiqueController {
  constructor(private readonly vueStatistiqueService: VueStatistiqueService) {}
}
