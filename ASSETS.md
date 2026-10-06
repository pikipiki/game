# Origine des éléments visuels et sonores — 1.4

## Modèles 3D créés pour le jeu

Les créatures et leurs huit variantes sont des assemblages volumétriques Three.js, inspirés des deux photos fournies. Aucune photo personnelle n’est incorporée au jeu ni au ZIP. Les portraits et icônes sont des SVG procéduraux.

Les bâtiments, cabanes en forme de créatures, donuts, pains au chocolat, macarons, chantier, fortifications, décors et objets de la carte sont des maillages 3D construits dans `src/render/`. Les textures ne remplacent pas les volumes par un panorama. La ville ne possède pas de bascule 2D/3D.

## Surfaces du CD Heroes III

Source lue sans modification : `/Volumes/Crucial X10/heroes-3/Heroes3/heroes3/_SETUP/DATA1.CAB`.

Les archives `h3sprite.lod` et `H3BITMAP.LOD` ont été extraites localement dans le dossier de travail. Le convertisseur indépendant `tools/import-h3.py` traite les formats LOD, DEF et PCX sans lancer d’exécutable du jeu. Les [formats documentés par VCMI](https://vcmi.eu/modders/File_Formats/) et sa [configuration du Château](https://github.com/vcmi/vcmi/blob/develop/config/factions/castle.json) ont servi de références de format et de composition. Aucun code du moteur VCMI n’est incorporé.

Les 43 images PNG conservées sont :

- `grastl.def`, frames 49–64 : herbe pleine ;
- `sandtl.def`, frames 0–11 : sable plein ;
- `watrtl.def`, frames 21–32 : eau pleine ;
- `CMBKGRTR.PCX` et `CMBKGRMT.PCX` : fonds des champs de bataille ;
- `TBCSCAS3.DEF`, première frame : une petite zone de maçonnerie est utilisée comme matériau répété sur les murs 3D, pas comme silhouette du bâtiment.

Les panoramas et sprites de bâtiments de la précédente expérience de vue 2D ont été retirés du paquet actif.

## Musique et bruitages

Les fichiers du CD fournis par l’utilisateur ont été copiés/conversés en assets locaux :

| Asset du projet | Source |
| --- | --- |
| `src/assets/audio/adventure.mp3` | `GRASS.MP3` |
| `src/assets/audio/town.mp3` | `CstleTown.mp3` |
| `src/assets/audio/battle.mp3` | `COMBAT01.MP3` |
| `click.wav` | `BUTTON` dans `Heroes3.snd` |
| `attack.wav` | `AAGLATTK` |
| `move.wav` | `AAGLMOVE` |
| `spell.wav` | `LIGHTBLT` |
| `catapult.wav` | Impact réutilisant `AAGLATTK` |

Ces éléments commerciaux restent exclus de la licence MIT du code. Leur notice figure dans `THIRD_PARTY_NOTICES.md`.

## Atlas de matériaux généré

Mode : **génération intégrée avec la compétence imagegen**. Un atlas carré original de pierre, ardoise, bois et herbe a été généré puis copié dans `src/assets/material-atlas.png`. Les quadrants sont appliqués comme matériaux aux maillages ; l’architecture reste du code 3D.

Sortie originale de l’outil :
`/Users/sevenone./.codex/generated_images/01a10d81-5a8f-7751-9b16-5eafd50b63c2/exec-2c279025-13db-4c04-a305-4d5c8e7edb56.png`.

Prompt exact :

> Use case: stylized-concept. Asset type: seamless material atlas for an actual Three.js medieval fantasy strategy game inspired by Heroes of Might and Magic III's 1999 pre-rendered look. Create a square 1536x1536 image divided into exactly FOUR equal 768x768 quadrants with NO gutters, labels or text. Top left: warm aged limestone masonry, small irregular rectangular blocks, subtle carved edges, rough tactile cracks and mortar, neutral evenly lit repeatable stone pattern. Top right: aged blue-grey slate roof shingles, overlapping small rectangular tiles, sharp chipped edges, mottled weathering, evenly lit repeatable roofing pattern. Bottom left: dark medieval oak wooden planks with grain knots and forged nail heads, repeatable wood pattern. Bottom right: detailed mossy meadow ground viewed straight down, fine grass, small earth gaps, subtle tiny yellow wildflowers, textured green olive earth, repeatable ground pattern. All quadrants are flat orthographic textures without perspective, buildings, cast shadows or objects. Rich photorealistic pre-rendered late-1990s strategy-game surfaces, subdued jewel and earth colours, detailed natural grain, no cartoon, no low-poly, no modern UI. This is a new original texture set, not copied from the original game's images.
