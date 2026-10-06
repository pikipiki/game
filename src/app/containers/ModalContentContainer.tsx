import type { GameState } from '@/game/engine';
import { buildTacticalGridModel } from '@/game/battle/presentation';
import { ArmyModalView } from '@/app/components/modals/ArmyModalView';
import { AudioModalView } from '@/app/components/modals/AudioModalView';
import { CodexModalView } from '@/app/components/modals/CodexModalView';
import { CreatureModalView } from '@/app/components/modals/CreatureModalView';
import {
  DestinationsModalView,
} from '@/app/components/modals/DestinationsModalView';
import { HelpModalView } from '@/app/components/modals/HelpModalView';
import { IntroModalView } from '@/app/components/modals/IntroModalView';
import { RestartModalView } from '@/app/components/modals/RestartModalView';
import { RetreatModalView } from '@/app/components/modals/RetreatModalView';
import { SettingsModalView } from '@/app/components/modals/SettingsModalView';
import {
  TacticalMovesModalView,
} from '@/app/components/modals/TacticalMovesModalView';
import { VictoryModalView } from '@/app/components/modals/VictoryModalView';

export interface ModalContentContainerProps {
  readonly modal: string;
  readonly state: GameState;
  readonly detail: string;
  readonly trainingBackup: GameState | null;
  readonly audioMuted: boolean;
  readonly musicVolume: number;
  readonly effectsVolume: number;
}

export function ModalContentContainer({
  modal,
  state,
  detail,
  trainingBackup,
  audioMuted,
  musicVolume,
  effectsVolume,
}: ModalContentContainerProps) {
  if (modal === 'intro') return <IntroModalView />;
  if (modal === 'settings') return <SettingsModalView state={state} />;
  if (modal === 'army') return <ArmyModalView state={state} />;
  if (modal === 'creature') {
    return <CreatureModalView detail={detail} state={state} />;
  }
  if (modal === 'codex') return <CodexModalView />;
  if (modal === 'help') return <HelpModalView />;
  if (modal === 'destinations') {
    return <DestinationsModalView state={state} />;
  }
  if (modal === 'tactical-moves') {
    const cells = buildTacticalGridModel(state);
    return <TacticalMovesModalView cells={cells} />;
  }
  if (modal === 'audio') {
    return (
      <AudioModalView
        effectsVolume={effectsVolume}
        muted={audioMuted}
        musicVolume={musicVolume}
      />
    );
  }
  if (modal === 'restart') return <RestartModalView />;
  if (modal === 'retreat') {
    return (
      <RetreatModalView state={state} trainingBackup={trainingBackup} />
    );
  }
  if (modal === 'victory') return <VictoryModalView state={state} />;
  return null;
}
