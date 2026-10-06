import {
  CombatToolbarContainer,
} from '@/app/containers/CombatToolbarContainer';
import { GameFooterContainer } from '@/app/containers/GameFooterContainer';
import { GameHeaderContainer } from '@/app/containers/GameHeaderContainer';
import { ModalContainer } from '@/app/containers/ModalContainer';
import { SidebarContainer } from '@/app/containers/SidebarContainer';
import { ToastContainer } from '@/app/containers/ToastContainer';
import { TownContainer } from '@/app/containers/TownContainer';
import { WorldViewContainer } from '@/app/containers/WorldViewContainer';
import { useAppShellEffects } from '@/app/hooks/useAppShellEffects';
import { useEnemyScheduler } from '@/app/hooks/useEnemyScheduler';
import { useGameActions } from '@/app/hooks/useGameActions';
import { useTranslation } from '@/app/hooks/useTranslation';

/** Page : composition des conteneurs + effets globaux (pas de JSX métier). */
export function GamePage() {
  const { t } = useTranslation();
  useGameActions();
  useAppShellEffects();
  useEnemyScheduler();

  return (
    <>
      <a className="skip-link" href="#sidebar">
        {t('skipLink')}
      </a>
      <GameHeaderContainer />
      <main className="layout">
        <WorldViewContainer />
        <SidebarContainer />
      </main>
      <CombatToolbarContainer />
      <GameFooterContainer />
      <TownContainer />
      <ModalContainer />
      <ToastContainer />
      <input
        accept="application/json,.json"
        hidden
        id="import"
        type="file"
      />
    </>
  );
}
