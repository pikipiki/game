import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const built = path.join(root, 'dist', 'index.html');
const jouer = path.join(root, 'JOUER.html');

if (!fs.existsSync(built)) {
  console.error('dist/index.html introuvable — lancez pnpm build:single avant.');
  process.exit(1);
}

fs.copyFileSync(built, jouer);
console.log(`JOUER.html mis à jour (${(fs.statSync(jouer).size / 1_048_576).toFixed(2)} Mo).`);
