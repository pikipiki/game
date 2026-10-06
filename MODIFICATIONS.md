# Où sont les modifications sur le PC ?

## Projet actif

**Tous les fichiers du jeu modifiés ou créés sont dans :**

`/Users/sevenone./Documents/Codex/2026-10-05/cre/outputs/royaumes-des-peluches/`

| Chemin dans ce dossier | Modification |
| --- | --- |
| `src/main.ts` | Interface, constructions, sons, commandes, bascule carte/combat, retour du héros |
| `src/style.css` | Interface bois/laiton, redimensionnement portrait/paysage, menus défilants et encoches mobiles |
| `src/battle-ui.ts` | Interface tactique, attente, munitions et état des ripostes |
| `src/audio.ts` | Musiques de carte/ville/combat, bruitages et réglages |
| `src/game/data.ts` | Arène 17 × 11, voisinage des cases et chemins |
| `src/game/engine.ts` | Combat, IA, riposte, tirs, attente, sorts, constructions, stocks hebdomadaires et équipe adverse automatique |
| `src/game/opponent.ts` et `opponent.test.ts` | Héros adverses mobiles, objectifs stratégiques, captures, attaques, sièges et tests |
| `src/game/buildings.ts` | Noms, coûts, prérequis et limite d’un chantier par jour |
| `src/game/battle-controls.ts` | Commandes disponibles, déplacement vers une cible et ordre des tours |
| `src/game/battle-animation.ts` | Déplacements combinés aux attaques et plans d’animation |
| `src/game/*.test.ts` | Régressions de combat, constructions, économie, sauvegardes et campagne |
| `src/render/gestures.ts` et `gestures.test.ts` | Pincement à deux doigts, clic après zoom bloqué, annulation à la rotation et nettoyage des contacts |
| `src/render/adventure.ts` | Carte continue, objets et héros 3D, recentrage, sélection des objets et cases |
| `src/render/scene.ts` | Créatures/combats 3D, correction des coordonnées et suppression du vieux canvas en sortie |
| `src/render/battle-space.ts` | Géométrie et pointage précis des 187 cases |
| `src/render/town.ts` | Ville 3D, donuts, cabanes, pains au chocolat, macarons, parcelles et construction visible |
| `src/render/kingdom-models.ts` | Château 3D et remparts de biscuits, partagés avec la carte |
| `src/render/material-textures.ts` | Matériaux texturés appliqués aux maillages |
| `src/render/h3-assets.ts` et `.test.ts` | Surfaces originales embarquées et vérification de leur présence |
| `src/assets/h3/` | Surfaces de terrain, fonds et matériau de maçonnerie du CD |
| `src/assets/audio/` | Trois musiques et cinq bruitages |
| `src/assets/material-atlas.png` | Atlas original de textures généré |
| `src/vite-env.d.ts` | Types des imports d’assets Vite |
| `tools/import-h3.py` | Convertisseur des surfaces LOD/DEF/PCX du CD |
| `netlify.toml` et `.node-version` | Compilation et publication Netlify, Node 24 |
| `public/_redirects` et `public/_headers` | Règles Netlify incluses dans le build pour le déploiement manuel |
| `package.json` | Version 1.5.0 et outils pnpm/TypeScript/ESLint/Vitest |
| `README.md`, `ASSETS.md`, `THIRD_PARTY_NOTICES.md`, `LICENSE` | Instructions, provenance et licences |
| `dist/index.html` et `JOUER.html` | Jeu recompilé, autonome et à jour |

`src/render/classic-town.ts`, qui proposait l’ancienne ville à partir d’un panorama 2D, a été supprimé du projet actif. Ses images inutilisées ont été déplacées dans le dossier de travail, hors du jeu livré.

## Livrables

Dans `/Users/sevenone./Documents/Codex/2026-10-05/cre/outputs/` :

- `royaumes-de-pompon-v1.5.zip` : jeu complet, sources et build autonome ;
- `royaumes-de-pompon-netlify-v1.5.zip` : uniquement le dossier `dist` prêt au déploiement manuel ;
- `ville-portrait-v1.5.png`, `ville-paysage-v1.5.png`, `combat-portrait-v1.5.png`, `combat-paysage-v1.5.png` : captures de vérification du changement d’orientation.

Les anciennes archives v1.1/v1.2/v1.4 restent disponibles et ne correspondent pas à la version actuelle.

## Fichiers de travail

Les scripts intermédiaires, références téléchargées, extraction du CD, comparaison des textures et outil Unshield compilé sont dans :

`/Users/sevenone./Documents/Codex/2026-10-05/cre/work/`

Ils ne sont pas nécessaires pour jouer et ne sont pas inclus dans le ZIP. L’atlas original créé par l’outil d’image existe aussi dans le cache de génération indiqué dans `ASSETS.md` ; sa copie utilisée par le jeu est bien dans le projet actif. Les dépendances installées sont dans son `node_modules/`, également exclu du ZIP.

Le dossier externe `/Volumes/Crucial X10/heroes-3/Heroes3/heroes3` a été lu sans modification. Les deux photos personnelles et le dossier `outputs/royaumes-des-peluches 2` n’ont pas été modifiés.
