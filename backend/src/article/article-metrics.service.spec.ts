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
    const texteCourt =
      'Voici un petit test pour vérifier le temps de lecture de notre journal collectif.';
    expect(service.calculateReadingTime(texteCourt)).toBe(1);
  });

  it('devrait retourner 2 minutes pour un texte de 400 mots', () => {
    const texteLong = 'mot '.repeat(400);
    expect(service.calculateReadingTime(texteLong)).toBe(2);
  });

  it('devrait retourner 0 pour un texte vide', () => {
    expect(service.calculateReadingTime('')).toBe(0);
  });
});

describe('ArticleMetricsService - Répartition des contributions', () => {
  let service: ArticleMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleMetricsService],
    }).compile();

    service = module.get<ArticleMetricsService>(ArticleMetricsService);
  });

  it('devrait calculer une répartition égale 50/50', () => {
    const contributions = [
      { userId: 1, text: 'Un deux trois quatre cinq.' }, // 5 mots
      { userId: 2, text: 'Six sept huit neuf dix.' }, // 5 mots
    ];

    // On test pour que l'utilisateur 1 ait 50% et l'utilisateur 2 ait 50%
    expect(service.calculateContributionsDistribution(contributions)).toEqual({
      1: 50,
      2: 50,
    });
  });

  it('devrait calculer une répartition inégale 75/25', () => {
    const contributions = [
      { userId: 1, text: 'mot '.repeat(75) },
      { userId: 2, text: 'mot '.repeat(25) },
    ];

    expect(service.calculateContributionsDistribution(contributions)).toEqual({
      1: 75,
      2: 25,
    });
  });

  it('devrait retourner un objet vide si le tableau est vide', () => {
    expect(service.calculateContributionsDistribution([])).toEqual({});
  });
});

describe('ArticleMetricsService - Score de fraîcheur', () => {
  let service: ArticleMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleMetricsService],
    }).compile();

    service = module.get<ArticleMetricsService>(ArticleMetricsService);
  });

  it("devrait retourner 100 pour un article mis à jour aujourd'hui (0 jour)", () => {
    expect(service.calculateContentDecay(0)).toBe(100);
  });

  it('devrait diminuer le score de 0.5 point par jour (ex: 10 jours = 95)', () => {
    expect(service.calculateContentDecay(10)).toBe(95);
  });

  it('ne devrait jamais descendre en dessous de 0 (ex: 300 jours = 0)', () => {
    // 300 jours * 0.5 = 150 points en moins. 100 - 150 = -50.
    // La fonction doit bloquer à 0.
    expect(service.calculateContentDecay(300)).toBe(0);
  });
});
