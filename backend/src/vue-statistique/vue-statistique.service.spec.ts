import { Test, TestingModule } from '@nestjs/testing';
import { VueStatistiqueService } from './vue-statistique.service';

describe('VueStatistiqueService', () => {
  let service: VueStatistiqueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VueStatistiqueService],
    }).compile();

    service = module.get<VueStatistiqueService>(VueStatistiqueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
