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

}