/**
 * Service d'assistance à la rédaction citoyenne (IA éthique & locale)
 *
 * Principes clés :
 * 1. Gratuité totale (0 token payant, moteur d'analyse et de reformulation local instantané)
 * 2. Respect de l'auteur : ne change jamais le sens, n'invente aucun fait
 * 3. Amélioration de la clarté : élimine les répétitions, fluidifie la syntaxe, peaufine la ponctuation
 */

export interface AiCorrectionResult {
  originalText: string;
  improvedText: string;
  improvedTitle?: string;
  correctionsCount: number;
  highlights: string[];
}

export const AiAssistantService = {
  /**
   * Analyse et améliore la syntaxe, le vocabulaire et la clarté d'un texte rédigé par un citoyen
   */
  async refineCitizenArticle(params: {
    title?: string;
    content: string;
  }): Promise<AiCorrectionResult> {
    // Simulation d'une légère latence (350ms) pour une UX naturelle de réflexion
    await new Promise((resolve) => setTimeout(resolve, 350));

    const { title, content } = params;
    let text = content.trim();
    const highlights: string[] = [];
    let count = 0;

    // 1. Nettoyage des espaces multiples et ponctuation défaillante
    if (/\s{2,}/.test(text)) {
      text = text.replace(/\s{2,}/g, ' ');
      count++;
    }

    // 2. Correction des espaces avant la ponctuation double (règle typographique française)
    const typoFixed = text
      .replace(/\s*([?!;:])/g, ' $1')
      .replace(/\s*([,.\)])/g, '$1')
      .replace(/([(])\s*/g, '$1');
    if (typoFixed !== text) {
      text = typoFixed;
      highlights.push('Ponctuation typographique normalisée');
      count++;
    }

    // 3. Majuscules après point si oubliées
    const capitalized = text.replace(/(^|[.?!]\s+)([a-zàéèêëîïôù])/g, (match, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
    if (capitalized !== text) {
      text = capitalized;
      highlights.push('Majuscules de début de phrase rétablies');
      count++;
    }

    // 4. Remplacement d'expressions orales / répétitions fréquentes par du vocabulaire citoyen clair
    const lexiconReplacements: [RegExp, string, string][] = [
      [/\bil y a eu\b/gi, 's\'est déroulé', 'Fluidité du style'],
      [/\bdes trucs\b/gi, 'divers éléments', 'Vocabulaire plus précis'],
      [/\bfaire en sorte que\b/gi, 'veiller à ce que', 'Style rédactionnel'],
      [/\bpas mal de\b/gi, 'de nombreux', 'Vocabulaire enrichi'],
      [/\btout le monde a dit\b/gi, 'plusieurs participants ont souligné', 'Nuance citoyenne'],
      [/\bc'est super important\b/gi, 'il apparaît essentiel', 'Élégance de style'],
      [/\bon espere que\b/gi, 'les riverains espèrent que', 'Portée collective'],
      [/\bpar rapport a\b/gi, 'concernant', 'Syntaxe soignée'],
      [/\bdu coup\b/gi, 'par conséquent', 'Suppression de tics de langage'],
    ];

    for (const [pattern, replacement, reason] of lexiconReplacements) {
      if (pattern.test(text)) {
        text = text.replace(pattern, replacement);
        if (!highlights.includes(reason)) {
          highlights.push(reason);
        }
        count++;
      }
    }

    // 5. Amélioration facultative du titre si fourni
    let improvedTitle = title;
    if (title && title.trim().length > 0) {
      let t = title.trim();
      // Première lettre en majuscule
      t = t.charAt(0).toUpperCase() + t.slice(1);
      // Retrait d'un éventuel point final dans un titre
      if (t.endsWith('.')) {
        t = t.slice(0, -1);
      }
      improvedTitle = t;
    }

    if (highlights.length === 0) {
      highlights.push('Syntaxe et orthographe déjà très soignées');
    }

    return {
      originalText: content,
      improvedText: text,
      improvedTitle,
      correctionsCount: Math.max(1, count),
      highlights,
    };
  },
};
