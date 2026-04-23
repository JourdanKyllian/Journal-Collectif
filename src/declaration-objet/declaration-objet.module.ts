import { Module } from '@nestjs/common';
import { DeclarationObjetService } from './declaration-objet.service';
import { DeclarationObjetController } from './declaration-objet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeclarationObjet } from './entities/declaration-objet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeclarationObjet])],
  controllers: [DeclarationObjetController],
  providers: [DeclarationObjetService],
})
export class DeclarationObjetModule {}
