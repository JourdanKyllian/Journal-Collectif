import { Test, TestingModule } from '@nestjs/testing';
import { ArticleMetricsService } from './article-metrics.service';

describe('ArticleMetricsService - Temps de lecture', () => {
  let service: ArticleMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleMetricsService],
    }).compile();

    
    service = module.get<ArticleMetricsService>(ArticleMetricsService);
  });

  it('devrait retourner 1 minute pour un texte court', () => {
    const texteCourt = "Voici un petit test pour vérifier le temps de lecture de notre journal collectif.";
    expect(service.calculateReadingTime(texteCourt)).toBe(1);
  });

  it('devrait retourner 2 minutes pour un texte de 400 mots', () => {
    const texteLong = "mot ".repeat(400); 
    expect(service.calculateReadingTime(texteLong)).toBe(2);
  });

  it('devrait retourner 0 pour un texte vide', () => {
    expect(service.calculateReadingTime("")).toBe(0);
  });
});