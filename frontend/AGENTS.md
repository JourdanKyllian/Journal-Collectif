# Contexte pour les Agents IA

## Vision du Projet
Application "Collectif Chalonnais 06" : Un journal municipal premium et interactif pour la ville de Chalon. Design luxueux (Vert foncé, Or, Champagne).

## État Actuel du Front-end
- [x] Structure de base & Layout (Navbar/Footer)
- [x] Page d'Accueil avec Grille d'Articles
- [x] Page Catégories
- [x] Page Objets Perdus (avec filtres dynamiques)
- [x] Modale d'Authentification (Connexion/Inscription)
- [x] Dashboard Admin complet (Stats, Articles, Lost Objects, Alerts)
- [x] Page Profil Utilisateur

## Points de vigilance pour l'IA
1. **Layout Stability :** Toujours utiliser `flex flex-col` sur les conteneurs de modales et de pages pour éviter les bugs d'affichage sur les composants Radix.
2. **Design Tokens :** Respecter strictement la palette : 
   - Vert : `#0B1C10`
   - Or : `#D4AF37`
   - Noir : `#1A1A1A`
   - Champagne : `#8E8671`
   - Blanc : `#FEF9F1`
3. **Responsive :** Le Dashboard utilise une sidebar fixe sur desktop qui doit devenir mobile via un menu burger.