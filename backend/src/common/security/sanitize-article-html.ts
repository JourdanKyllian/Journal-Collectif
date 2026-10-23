import { escapeAttrValue, FilterXSS, friendlyAttrValue } from 'xss';

/**
 * Liste blanche alignée sur l'éditeur Tiptap du front (StarterKit + Image + Link).
 * Tout le reste (script, iframe, svg, style, attributs on*, URL javascript:/data:) est supprimé.
 */
const WHITE_LIST: Record<string, string[]> = {
  p: [],
  br: [],
  hr: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  s: [],
  u: [],
  code: [],
  pre: [],
  blockquote: [],
  ul: [],
  ol: [],
  li: [],
  a: ['href', 'title'],
  img: ['src', 'alt', 'title'],
};

/** Liens : http(s), mailto, ou chemin du serveur. Images : sans mailto. `//hôte` est toujours refusé. */
const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/))/i;
const SAFE_SRC = /^(https?:\/\/|\/(?!\/))/i;

const filter = new FilterXSS({
  whiteList: WHITE_LIST,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  safeAttrValue(_tag, name, value) {
    if (name === 'href' || name === 'src') {
      // Décode les entités (`jav&#x61;script:`) avant de juger le schéma.
      const decoded = friendlyAttrValue(value).trim();
      const allowed = name === 'href' ? SAFE_HREF : SAFE_SRC;
      return allowed.test(decoded) ? escapeAttrValue(decoded) : '';
    }
    return escapeAttrValue(value);
  },
});

export function sanitizeArticleHtml(html: string): string {
  // Après filtrage, un `<a` ne porte plus que `href`/`title` : on y ajoute les attributs de sécurité.
  return filter
    .process(html)
    .replace(
      /<a(?=[\s>])/g,
      '<a target="_blank" rel="noopener noreferrer nofollow"',
    );
}
