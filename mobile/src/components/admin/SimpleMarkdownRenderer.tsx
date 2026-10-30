import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface SimpleMarkdownRendererProps {
  content: string;
}

/**
 * Moteur de rendu de texte stylisé ultra-léger (0 KB de dépendance externe).
 * Interprète le gras (** ou <strong>), l'italique (* ou <em>), les titres (##),
 * les citations (>) et les listes à puces sans aucun impact sur le poids de l'application.
 */
export default function SimpleMarkdownRenderer({ content }: SimpleMarkdownRendererProps) {
  if (!content || !content.trim()) {
    return (
      <Text style={styles.emptyText}>
        Commencez à saisir du texte pour voir l’aperçu du rendu lecteur...
      </Text>
    );
  }

  // Nettoyage préalable des balises de paragraphe HTML simples
  const cleanContent = content
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');

  const blocks = cleanContent.split('\n');

  return (
    <View style={styles.container}>
      {blocks.map((line, blockIndex) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={blockIndex} style={styles.spacer} />;
        }

        // 1. Titre de niveau 2 ou 3 (## Titre)
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <Text key={blockIndex} style={styles.heading}>
              {headingText}
            </Text>
          );
        }

        // 2. Citation en exergue (> Citation)
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s+/, '');
          return (
            <View key={blockIndex} style={styles.quoteBox}>
              <View style={styles.quoteBar} />
              <Text style={styles.quoteText}>{renderInlineFormatting(quoteText)}</Text>
            </View>
          );
        }

        // 3. Liste à puces (- élément ou • élément)
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <View key={blockIndex} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{renderInlineFormatting(bulletText)}</Text>
            </View>
          );
        }

        // 4. Paragraphe standard avec formatage inline (Gras, Italique)
        return (
          <Text key={blockIndex} style={styles.paragraph}>
            {renderInlineFormatting(line)}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Découpe une ligne en segments formatés (gras, italique, etc.)
 */
function renderInlineFormatting(rawText: string): React.ReactNode {
  // Remplacement uniforme des balises HTML en syntaxe markdown
  const text = rawText
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // Regex pour capturer **gras** ou *italique*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <Text key={i} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  emptyText: {
    fontFamily: FONTS.montserrat,
    fontSize: 14,
    color: '#8A928C',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  spacer: {
    height: 10,
  },
  heading: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 18,
    color: COLORS.vert,
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 24,
  },
  paragraph: {
    fontFamily: FONTS.montserrat,
    fontSize: 15,
    color: '#242C26',
    lineHeight: 23,
    marginBottom: 6,
  },
  bold: {
    fontFamily: FONTS.montserratSemiBold,
    fontWeight: '700',
    color: COLORS.noir,
  },
  italic: {
    fontFamily: FONTS.montserrat,
    fontStyle: 'italic',
    color: '#344138',
  },
  quoteBox: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.or,
  },
  quoteBar: {
    width: 0,
  },
  quoteText: {
    fontFamily: FONTS.montserrat,
    fontStyle: 'italic',
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 21,
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.or,
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    fontFamily: FONTS.montserrat,
    fontSize: 15,
    color: '#242C26',
    lineHeight: 22,
    flex: 1,
  },
});

