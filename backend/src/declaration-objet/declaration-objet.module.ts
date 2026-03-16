import { Module } from '@nestjs/common';
import { DeclarationObjetService } from './declaration-objet.service';
import { DeclarationObjetController } from './declaration-objet.controller';

@Module({
  controllers: [DeclarationObjetController],
  providers: [DeclarationObjetService],
})
export class DeclarationObjetModule {}
