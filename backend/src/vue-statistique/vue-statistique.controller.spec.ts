import { Test, TestingModule } from '@nestjs/testing';
import { VueStatistiqueController } from './vue-statistique.controller';
import { VueStatistiqueService } from './vue-statistique.service';

describe('VueStatistiqueController', () => {
  let controller: VueStatistiqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VueStatistiqueController],
      providers: [VueStatistiqueService],
    }).compile();

    controller = module.get<VueStatistiqueController>(VueStatistiqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
