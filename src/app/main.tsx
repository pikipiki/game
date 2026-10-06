import { createRoot, type Root } from 'react-dom/client';
import '@/styles/index.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { App } from '@/app/App';
import { GameProvider } from '@/app/providers/GameProvider';

const previewSandbox = new URLSearchParams(location.search).has('preview');

let reactRoot: Root | null = null;

/**
 * Monte l’application React (équivalent createRoot + App).
 * Retourne un désabonnement pour les tests.
 */
export function mountKingdomApp(mount: HTMLDivElement): () => void {
  return createKingdomApp(mount);
}

export function createKingdomApp(mount: HTMLDivElement): () => void {
  const mountRef = { current: mount };
  reactRoot = createRoot(mount);
  reactRoot.render(
    <AppProviders>
      <GameProvider mountRef={mountRef} previewSandbox={previewSandbox}>
        <App />
      </GameProvider>
    </AppProviders>,
  );
  return () => {
    reactRoot?.unmount();
    reactRoot = null;
    mount.innerHTML = '';
  };
}

/** @deprecated Utiliser `createKingdomApp`. */
export function initApp(mount: HTMLDivElement): void {
  createKingdomApp(mount);
}

export function bootstrapKingdomApp(): void {
  const mount = document.querySelector<HTMLDivElement>('#app');
  if (!mount) throw new Error('Élément #app introuvable');
  createKingdomApp(mount);
}
