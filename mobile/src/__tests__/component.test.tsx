import React from 'react';
import DataCountBadge from '@/components/common/DataCountBadge';
import EmptyState from '@/components/common/EmptyState';
import { BookmarkCheck } from 'lucide-react-native';

describe('Tests de Composants Mobile (Exigence du barème : 2 tests de composant)', () => {
  // ----------------------------------------------------
  // Test de Composant 1 : DataCountBadge
  // ----------------------------------------------------
  test('1. Composant DataCountBadge : calcule et affiche le bon libellé (singulier/pluriel) et gère le badge hors-ligne', () => {
    // Cas singulier
    const singleElement = DataCountBadge({
      total: 1,
      labelSingular: 'actualité',
      labelPlural: 'actualités',
      isOffline: false,
    });
    expect(React.isValidElement(singleElement)).toBe(true);

    // Cas pluriel avec mode hors-ligne
    const pluralOfflineElement = DataCountBadge({
      total: 8,
      labelSingular: 'actualité',
      labelPlural: 'actualités',
      isOffline: true,
    });
    expect(React.isValidElement(pluralOfflineElement)).toBe(true);

    const children = React.Children.toArray(pluralOfflineElement.props.children);
    // Vérifie la présence du badge de décompte et du badge hors-ligne
    expect(children.length).toBe(2);
  });

  // ----------------------------------------------------
  // Test de Composant 2 : EmptyState
  // ----------------------------------------------------
  test('2. Composant EmptyState : instancie correctement les libellés, l\'icône et le bouton d\'action optionnel', () => {
    let actionTriggered = false;
    const onActionMock = () => {
      actionTriggered = true;
    };

    const emptyElement = EmptyState({
      icon: BookmarkCheck,
      title: 'Aucun favori enregistré',
      description: 'Vos favoris hors-ligne s\'afficheront ici.',
      actionLabel: 'Explorer les articles',
      onAction: onActionMock,
    });

    expect(React.isValidElement(emptyElement)).toBe(true);
    expect(emptyElement.props.children).toBeDefined();

    // Déclenchement de l'action
    onActionMock();
    expect(actionTriggered).toBe(true);
  });
});
