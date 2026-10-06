# Les Royaumes de Pompon — 1.4

Jeu de stratégie solo pour navigateur, en TypeScript et Three.js, avec pnpm, ESLint et Vitest. L’interface est adaptée au téléphone. La ville, ses bâtiments, les créatures et les objets de la carte sont des modèles 3D : il n’existe plus de mode de ville 2D.

Cette mini-campagne s’inspire de Heroes III et reprend des textures et musiques de la copie du jeu fournie. Elle possède deux lignées et huit formes de créatures, des héros ennemis actifs sur la carte et des sièges. Elle ne reproduit pas l’intégralité du moteur, des factions, des règles ou des campagnes originales.

## Jouer

Ouvrez `JOUER.html` dans un navigateur récent disposant de WebGL 2. Tous les éléments sont embarqués : le fichier fonctionne sans CDN, compte ni serveur de jeu. La musique démarre après une première interaction.

Sur téléphone, un aperçu HTML dans l’application Fichiers peut ne pas exécuter JavaScript. Utilisez alors l’URL du jeu hébergé ou le serveur de développement.

Pour développer : Node.js 24 et pnpm 11.19.0, version indiquée dans `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
```

`pnpm check` exécute ESLint, les tests Vitest, TypeScript strict puis le build Vite. `pnpm build` produit `dist/index.html`, un fichier autonome. Après modification, recopiez-le sur `JOUER.html` pour actualiser cette version.

## Netlify

Deux options sont préparées :

- **Dépôt Git** : placez le contenu du dossier du projet à la racine du dépôt et connectez-le à Netlify. `netlify.toml` fixe la commande `pnpm build`, le dossier publié `dist`, Node 24 et l’installation avec le verrou pnpm. Si le projet est dans un sous-dossier d’un dépôt, choisissez ce sous-dossier comme **Base directory** dans Netlify.
- **Déploiement manuel** : décompressez `royaumes-de-pompon-netlify-v1.4.zip` et glissez son dossier `dist` dans Netlify Drop. Ce dossier contient le jeu déjà compilé ; aucune installation n’est nécessaire.

La configuration suit la [documentation officielle des dépendances Netlify](https://docs.netlify.com/build/configure-builds/manage-dependencies/) et de [`netlify.toml`](https://docs.netlify.com/build/configure-builds/file-based-configuration/). La compilation locale est vérifiée ; aucun déploiement sur un compte Netlify n’a été effectué.

## Exploration et ville

Touchez une case révélée ou un objet, puis confirmez **Se déplacer**. Les bâtiments et le héros sélectionnent leur propre case, même si leur silhouette dépasse sur une case voisine. Glissez pour déplacer la carte ; les boutons +/− zooment et le bouton cible recentre la vue sur le héros. La mine donne de l’or et le jardin des cristaux. L’eau et les montagnes sont infranchissables.

Le **Château des biscuits** possède des remparts de caramel et des couronnes de donuts. La **Maison du grand donut** gère les constructions. La **Cabane de Barbe-Mousse** et la **Pâtisserie de l’Aurore** reprennent la morphologie des deux peluches : corps rond, yeux, nez, barbe végétale et houppe dorée. L’auberge possède un toit en pain au chocolat ; la guilde est une tour de macarons. Toutes ces formes sont des volumes 3D cliquables.

Une nouvelle partie commence avec le château, la maison, la cabane et l’auberge. Les autres parcelles montrent un chantier. Dans la citadelle de départ :

1. Construisez la pâtisserie : **450 or, 2 cristaux**, après la cabane.
2. Construisez la guilde : **600 or, 3 cristaux**, après la pâtisserie.
3. Construisez l’atelier : **750 or, 4 cristaux**, après la guilde.

**Un bâtiment ou une amélioration par jour.** Les boutons affichent les prérequis et les ressources manquantes. Les fortifications passent aux niveaux 2 et 3 ; le dernier niveau requiert l’atelier. Les améliorations donnent +50 or/jour, +1 déplacement et +2 mana maximum.

Le recrutement se fait par lots de trois et puise dans le stock disponible. La cabane commence avec 12 recrues ; construire la pâtisserie débloque 9 recrues solaires. Les stocks s’accumulent aux jours **8, 15, 22…** : croissance de base de 6 gardiens et 4 solaires, augmentée par les fortifications. Les nouvelles recrues adoptent la forme entraînée de leur troupe. Terminer un jour rapporte les revenus, restaure les déplacements et quatre mana.

## Batailles

L’écran de combat possède un plateau de **17 × 11 cases hexagonales décalées**, une file d’initiative, les troupes, leurs PV, les dégâts prévus et les commandes tactiques. Cliquer une créature sélectionne son modèle ; cliquer le terrain sélectionne la case. La grille de déplacement et les portraits offrent une alternative au pointage 3D.

- La vitesse détermine l’initiative et la portée de marche. Une attaque de mêlée peut inclure un déplacement jusqu’au contact.
- Chaque troupe riposte une fois par round. **Attendre** la fait rejouer en fin de round ; **Défendre** réduit les dégâts.
- Les tireurs ont **12 munitions**. Ils peuvent viser sur le plateau, mais infligent moitié moins de dégâts à plus de huit cases ou au corps à corps. Un ennemi adjacent bloque leurs tirs à distance.
- Le héros lance **un sort par round**, pour quatre mana, sans consommer le tour de sa troupe. Éclair frappe un ennemi ; Souffle de vie soigne une troupe encore vivante.
- Les obstacles bloquent la marche. En siège, les murs bloquent la colonne M. La catapulte inflige 70 dégâts et termine le tour de la troupe ; trois tirs détruisent les 180 PV des murs.

Les marches, charges, tirs, sorts, ripostes, pertes et tirs de catapulte sont animés. Les actions sont bloquées pendant leur résolution. La réduction des animations du système est respectée. L’IA suit les mêmes règles du moteur.

Les gardes fixes interceptent le héros sur la carte. **Après Terminer le jour, les deux héros adverses jouent automatiquement** : chacun avance de deux cases sur un chemin praticable, capture les ressources et peut attaquer le héros ou assiéger une ville alliée. Les ressources capturées cessent de produire pour vous. Les armées adverses reçoivent des renforts au début de semaine. Une bataille suspend le tour adverse ; cliquer Continuer le reprend pour les héros encore en attente.

Un siège défensif place vos troupes derrière les murs et la catapulte adverse les détruit. Si votre héros est ailleurs, vous contrôlez la garnison et son armée reste intacte à sa position ; il ne peut pas lancer de sorts à distance. Une défaite ou un abandon donne la ville à l’adversaire, mais vous pouvez la reconquérir. Vaincre la garnison d’un château puis cliquer **Continuer** le conquiert et ajoute des revenus. La retraite ramène le héros à un château allié ou à une case sûre si tous ses châteaux sont perdus. Après victoire, défaite ou entraînement, la scène de combat est détruite et la carte réapparaît avec une caméra centrée sur le héros.

Le bouton **Combat d’entraînement** permet d’essayer immédiatement les commandes. Sa sortie restaure la campagne sans consommer ses ressources. Pour gagner la mini-campagne, libérez les deux camps, faites évoluer vos troupes, puis vainquez la Forteresse du Crépuscule.

## Évolutions

```text
Barbemousse → Gardien des bois ou Druide émeraude → Ancêtre de Sylve
Pompon solaire → Crête de braise ou Oracle étoilé → Phénix d’aurore
```

L’expérience et les coûts concernent toute la troupe. Les modèles 3D, statistiques et capacités changent avec la variante. Les survivants retrouvent leur santé au combat suivant ; les pertes doivent être recrutées.

## Son et sauvegardes

Trois musiques accompagnent la carte, la ville et les batailles. Des bruitages sont joués lors des actions. Le bouton ♫ ouvre les réglages séparés de musique et d’effets ; le son se suspend lorsque l’onglet est masqué.

Les parties et préférences sont conservées localement dans le navigateur. Les paramètres permettent un export/import JSON. Les sauvegardes sont propres à l’origine du site : pour passer du serveur local à Netlify, exportez puis importez votre partie. Les anciennes sauvegardes conservent leurs bâtiments existants.

**`?preview=1` est un aperçu sans sauvegarde** : recharger cette URL recommence une partie isolée. Jouez sans ce paramètre pour conserver la progression.

## Validation et limites

85 tests Vitest couvrent la campagne gagnable, les conquêtes, le combat, le pointage des 187 cases, les constructions, les stocks hebdomadaires, les tours adverses automatiques, les défenses de garnisons et les sauvegardes. ESLint, TypeScript strict et le build passent. Les transitions de scènes, le son, les constructions et les commandes mobiles ont aussi été vérifiés dans le navigateur.

Le projet reste une campagne fixe, avec un héros et deux troupes de lignées. Les stocks et constructions sont gérés pour le royaume, pas indépendamment pour chaque château. Les cinq emplacements supplémentaires dessinés dans l’interface ne permettent pas de recruter cinq autres factions. Il n’existe pas de multijoueur ni d’éditeur de cartes.

## Sources et fichiers

`src/game/` contient le moteur et les tests ; `src/render/` les scènes et modèles 3D ; `src/main.ts`, `src/battle-ui.ts` et `src/style.css` l’interface ; `src/audio.ts` le son. `MODIFICATIONS.md` donne les chemins sur le PC et le détail des modifications.

[VCMI](https://github.com/vcmi/vcmi) est une réimplémentation publique consultée pour les formats et références du jeu ; ce n’est pas le code source original de Heroes III. Aucun code de son moteur n’a été incorporé. Le convertisseur indépendant `tools/import-h3.py` extrait uniquement les surfaces utilisées par notre scène 3D depuis les archives LOD du CD, sans exécuter le jeu original. Il requiert Python et Pillow.

Les origines des visuels, le prompt des textures et les musiques sont détaillés dans `ASSETS.md`. Le code est sous licence MIT ; les graphismes et sons commerciaux importés de Heroes III en sont exclus. Voir `THIRD_PARTY_NOTICES.md`.
