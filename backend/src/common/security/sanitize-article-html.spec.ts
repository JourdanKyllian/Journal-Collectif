import { describe, it, expect } from '@jest/globals';
import { sanitizeArticleHtml } from './sanitize-article-html';

describe('sanitizeArticleHtml', () => {
  it('conserve la mise en forme produite par Tiptap', () => {
    const html =
      "<h2>Titre</h2><p>Du <strong>gras</strong>, de l'<em>italique</em>.</p><ul><li>un</li></ul><blockquote>cité</blockquote>";
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it.each([
    ['balise script', '<p>a</p><script>alert(1)</script>', '<p>a</p>'],
    [
      'gestionnaire onerror',
      '<img src="/uploads/x.jpg" onerror="alert(1)">',
      '<img src="/uploads/x.jpg">',
    ],
    ['iframe', '<iframe src="https://evil.tld"></iframe>', ''],
    ['svg onload', '<svg onload="alert(1)"></svg>', ''],
    ['style', '<style>body{display:none}</style><p>x</p>', '<p>x</p>'],
  ])('supprime : %s', (_label, input, expected) => {
    expect(sanitizeArticleHtml(input)).toBe(expected);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'jav&#x61;script:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    '//evil.tld/x',
  ])('neutralise le lien dangereux %s', (href) => {
    const out = sanitizeArticleHtml(`<a href="${href}">clic</a>`);
    expect(out).not.toMatch(/javascript|data:|evil/i);
  });

  it('refuse une image data: ou javascript:', () => {
    expect(
      sanitizeArticleHtml('<img src="data:image/svg+xml;base64,AAAA">'),
    ).not.toContain('data:');
    expect(
      sanitizeArticleHtml('<img src="javascript:alert(1)">'),
    ).not.toContain('javascript');
  });

  it('conserve le souligné, les titres h5/h6 et les liens mailto', () => {
    const html = '<h5>a</h5><h6>b</h6><p><u>souligné</u></p>';
    expect(sanitizeArticleHtml(html)).toBe(html);
    expect(
      sanitizeArticleHtml('<a href="mailto:contact@exemple.fr">écrire</a>'),
    ).toContain('href="mailto:contact@exemple.fr"');
  });

  it("n'accepte pas mailto: comme source d'image", () => {
    expect(sanitizeArticleHtml('<img src="mailto:x@y.fr">')).not.toContain(
      'mailto',
    );
  });

  it('autorise les liens http(s) et force rel/target', () => {
    const out = sanitizeArticleHtml(
      '<a href="https://exemple.fr/a?b=1&c=2">lien</a>',
    );
    expect(out).toContain('href="https://exemple.fr/a?b=1&c=2"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('ne se laisse pas piéger par les balises imbriquées', () => {
    const out = sanitizeArticleHtml(
      '<scr<script>ipt>alert(1)</scr</script>ipt>',
    );
    expect(out).not.toMatch(/<script/i);
  });
});
