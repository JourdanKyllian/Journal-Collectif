import { Injectable } from '@nestjs/common';

@Injectable()
export class ArticleMetricsService {
  /**
   * Calcule le temps de lecture estimé d'un texte.
   * Basé sur une moyenne de 225 mots lus par minute.
   */
  calculateReadingTime(content: string): number {
    // Si le texte est vide ou indéfini, on retourne 0
    if (!content || content.trim().length === 0) {
      return 0;
    }

    // Compte le nombre de mots
    const wordCount = content.trim().split(/\s+/).length;

    // Divise le nombre de mots par la moyenne de mots lus par minute
    return Math.ceil(wordCount / 225);
  }

  /**
   * Calcule la répartition des contributions en pourcentage par utilisateur.
   * Basé sur le nombre de mots rédigés.
   */
  calculateContributionsDistribution(
    contributions: { userId: number; text: string }[],
  ): Record<number, number> {
    // Si le tableau est vide
    if (!contributions || contributions.length === 0) {
      return {};
    }

    const wordCounts: Record<number, number> = {};
    let totalWords = 0;

    // Compte le nombre de mots pour chaque utilisateur
    for (const contribution of contributions) {
      const text = contribution.text || '';
      // Gestion des textes vides pour éviter de compter 1 mot pour des espaces
      const count = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

      if (!wordCounts[contribution.userId]) {
        wordCounts[contribution.userId] = 0;
      }

      wordCounts[contribution.userId] += count;
      totalWords += count;
    }

    // Si aucun texte n'a été écrit (éviter la division par zéro)
    if (totalWords === 0) {
      return {};
    }

    // Calcule le pourcentage pour chaque utilisateur
    const distribution: Record<number, number> = {};
    for (const userId in wordCounts) {
      distribution[userId] = Math.round(
        (wordCounts[userId] / totalWords) * 100,
      );
    }

    return distribution;
  }

  /**
   * Calcule le score de fraîcheur (Content Decay) d'une publication.
   * Le score part de 100 et diminue de 0.5 point par jour.
   * Il ne peut pas être inférieur à 0.
   * * @param daysSinceUpdate Nombre de jours depuis la dernière mise à jour
   */
  calculateContentDecay(daysSinceUpdate: number): number {
    // Si le nombre de jours est négatif (erreur temporelle)
    if (daysSinceUpdate < 0) {
      return 100;
    }

    // Calcul du score avec le facteur de dégradation (0.5 point / jour)
    const rawScore = 100 - daysSinceUpdate * 0.5;

    // Empêche le score de descendre en dessous de 0
    return Math.max(0, rawScore);
  }
}
