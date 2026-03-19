import { Test, TestingModule } from '@nestjs/testing';
import { DeclarationObjetController } from './declaration-objet.controller';
import { DeclarationObjetService } from './declaration-objet.service';

describe('DeclarationObjetController', () => {
  let controller: DeclarationObjetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeclarationObjetController],
      providers: [DeclarationObjetService],
    }).compile();

    controller = module.get<DeclarationObjetController>(DeclarationObjetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
