import { describe, it, expect } from '@jest/globals';
import { validerEmail } from './email.validator';

describe('validerEmail', () => {
  it('devrait retourner un tableau vide quand l\'email est parfait', () => {
    const input = 'user@example.com';
    const expected = [];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner un tableau vide avec un email contenant un +', () => {
    const input = 'user.name+tag@domain.co';
    const expected = [];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner les erreurs quand il manque le @', () => {
    const input = 'invalid';
    const expected = ['contenir un symbole @', 'respecter le format standard (ex: nom@domaine.fr)'];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner les erreurs quand il manque le préfixe', () => {
    const input = '@domain.com';
    const expected = [
      'contenir un identifiant avant le @', 
      'respecter le format standard (ex: nom@domaine.fr)'
    ];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner les erreurs quand il manque le domaine', () => {
    const input = 'user@';
    const expected = [
      'contenir un domaine après le @', 
      'respecter le format standard (ex: nom@domaine.fr)'
    ];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner une erreur de format si l\'extension est trop courte', () => {
    const input = 'user@domain.c'; // .c au lieu de .co
    const expected = [
      'respecter le format standard (ex: nom@domaine.fr)'
    ];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner une erreur si l\'email est vide', () => {
    const input = '';
    const expected = ['être renseignée'];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });

  it('devrait retourner une erreur si l\'email est null', () => {
    const input = null;
    const expected = ['être renseignée'];
    
    const result = validerEmail(input);
    expect(result).toEqual(expected);
  });
});