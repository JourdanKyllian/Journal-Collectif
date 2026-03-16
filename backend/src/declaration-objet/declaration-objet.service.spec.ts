import { Test, TestingModule } from '@nestjs/testing';
import { DeclarationObjetService } from './declaration-objet.service';

describe('DeclarationObjetService', () => {
  let service: DeclarationObjetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeclarationObjetService],
    }).compile();

    service = module.get<DeclarationObjetService>(DeclarationObjetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
