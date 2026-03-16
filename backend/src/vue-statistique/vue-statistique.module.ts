import { Module } from '@nestjs/common';
import { VueStatistiqueService } from './vue-statistique.service';
import { VueStatistiqueController } from './vue-statistique.controller';

@Module({
  controllers: [VueStatistiqueController],
  providers: [VueStatistiqueService],
})
export class VueStatistiqueModule {}
