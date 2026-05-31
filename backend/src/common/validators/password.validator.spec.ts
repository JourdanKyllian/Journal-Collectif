import { describe, it, expect } from '@jest/globals';
import { isValidPassword } from './password.validator';

describe('isValidPassword', () => {
  it('devrait retourner false quand le mot de passe fait moins de 12 caractères', () => {
    const input = 'TropCourt1!';
    const expected: string[] = ['faire au moins 12 caractères'];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
  it('devrait retourner false quand le mot de passe ne contient pas de majuscule', () => {
    const input = 'motdepasse12!';
    const expected: string[] = ['contenir au moins une majuscule'];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
  it('devrait retourner false quand le mot de passe ne contient pas de minuscule', () => {
    const input = 'MOTDEPASSE12!';
    const expected: string[] = ['contenir au moins une minuscule'];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
  it('devrait retourner false quand le mot de passe ne contient pas de chiffre', () => {
    const input = 'MotDePasseDeux!';
    const expected: string[] = ['contenir au moins un chiffre'];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
  it('devrait retourner false quand le mot de passe ne contient pas de caractères speciaux', () => {
    const input = 'MotDePasse12';
    const expected: string[] = ['contenir au moins un caractère spécial'];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
  it('devrait retourner true quand le mot de passe est valide', () => {
    const input = 'MotDePasse12!';
    const expected: string[] = [];

    const result = isValidPassword(input);
    expect(result).toEqual(expected);
  });
});
