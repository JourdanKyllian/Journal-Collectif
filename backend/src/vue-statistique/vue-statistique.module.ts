import { Module } from '@nestjs/common';
import { VueStatistiqueService } from './vue-statistique.service';
import { VueStatistiqueController } from './vue-statistique.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VueStatistique } from './entities/vue-statistique.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VueStatistique])],
  controllers: [VueStatistiqueController],
  providers: [VueStatistiqueService],
})
export class VueStatistiqueModule {}
