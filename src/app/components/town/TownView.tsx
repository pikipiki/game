import type { RefObject } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DiamondIcon from '@mui/icons-material/Diamond';
import { getCreature } from '@/game/data';
import { BUILDINGS } from '@/render/town';
import type { GameState } from '@/game/engine';
import { formatNumber } from '@/app/lib/format';
import { ArmyUnitCardView } from '@/app/components/creature/ArmyUnitCardView';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import {
  GameActionButton,
  GameActionIconButton,
} from '@/app/components/ui/GameActionButton';
import { GameIcon } from '@/app/components/ui/GameIcon';
import type { ArmyUnitCardLabels } from '@/app/lib/army-unit-card-copy';
import type {
  TownScreenLabels,
  WebglErrorCopy,
} from '@/app/lib/game-copy';
import { buildingNavLabel } from '@/app/lib/town-building-copy';
import type { AppLocale } from '@/i18n/translate';
import type { CreatureStatLabels } from '@/app/lib/creature-stat-labels';
import type { TownDetailModel } from '@/app/types/town-detail';
import { TownDetailView } from '@/app/components/town/TownDetailView';
import { SceneWebglOverlay } from '@/app/components/feedback/SceneWebglOverlay';
import { useTranslation } from '@/app/hooks/useTranslation';

function navClassName(selectedId: string, buildingId: string): string {
  if (selectedId === buildingId) return 'selected';
  return '';
}

const LOCALE_FLAG: Record<AppLocale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

function townNavIcon(buildingId: string): string {
  if (buildingId === 'sylve' || buildingId === 'sol') return 'shield';
  if (buildingId === 'guild') return 'book';
  if (buildingId === 'forge') return 'spark';
  return 'castle';
}

export interface TownViewProps {
  readonly state: GameState;
  readonly townName: string;
  readonly townBuilding: string;
  readonly townPanel: boolean;
  readonly detail: TownDetailModel;
  readonly dailyIncome: number;
  readonly endDayDisabled: boolean;
  readonly sceneHostRef: RefObject<HTMLDivElement | null>;
  readonly labels: TownScreenLabels;
  readonly locale: AppLocale;
  readonly localeToggleAria: string;
  readonly armyUnitLabels: Record<string, ArmyUnitCardLabels>;
  readonly statLabels: CreatureStatLabels;
  readonly townWebglError: boolean;
  readonly webglError: WebglErrorCopy;
}

export function TownView({
  state,
  townName,
  townBuilding,
  townPanel,
  detail,
  endDayDisabled,
  sceneHostRef,
  labels,
  locale,
  localeToggleAria,
  armyUnitLabels,
  statLabels,
  townWebglError,
  webglError,
}: TownViewProps) {
  const { t } = useTranslation();
  return (
    <section aria-label={labels.screenAria} className="town-screen">
      <header className="town-header">
        <div>
          <span className="eyebrow">{labels.realmTag}</span>
          <h1 id="town-name">{townName}</h1>
        </div>
        <div className="resources" id="town-resources">
          <Chip
            className="resource gold-text"
            icon={<MonetizationOnIcon fontSize="small" />}
            label={formatNumber(state.gold)}
            size="small"
            title={labels.goldTitle}
            variant="outlined"
          />
          <Chip
            className="resource purple-text"
            icon={<DiamondIcon fontSize="small" />}
            label={formatNumber(state.crystals)}
            size="small"
            title={labels.crystalsTitle}
            variant="outlined"
          />
        </div>
        <GameActionIconButton
          aria-label={labels.audioAria}
          gameAction="audio-settings"
        >
          ♫
        </GameActionIconButton>
        <GameActionIconButton
          aria-label={localeToggleAria}
          className="icon-btn locale-toggle"
          gameAction="toggle-locale"
          title={localeToggleAria}
        >
          <span aria-hidden="true">{LOCALE_FLAG[locale]}</span>
        </GameActionIconButton>
        <GameActionButton
          gameAction="leave-town"
          startIcon={<GameIcon name="arrow" />}
          variant="gold"
        >
          {labels.backToMap}
        </GameActionButton>
      </header>
      <div className="town-body">
        <div className="town-viewport" style={{ position: 'relative' }}>
          <div id="town-scene" ref={sceneHostRef} />
          <SceneWebglOverlay copy={webglError} visible={townWebglError} />
          <div className="town-scene-title">
            {labels.sceneTitle}
            <small>{labels.sceneHint}</small>
          </div>
          <div className="town-camera">
            <GameActionIconButton
              aria-label={labels.zoomInAria}
              gameAction="town-zoom-in"
            >
              <GameIcon name="plus" />
            </GameActionIconButton>
            <GameActionIconButton
              aria-label={labels.zoomOutAria}
              gameAction="town-zoom-out"
            >
              <GameIcon name="minus" />
            </GameActionIconButton>
            <GameActionIconButton
              aria-label={labels.recenterAria}
              gameAction="town-camera"
            >
              <GameIcon name="target" />
            </GameActionIconButton>
          </div>
          <p className="town-view-tip">{labels.viewTip}</p>
        </div>
        <aside
          className="town-detail"
          data-building={townBuilding}
          hidden={!townPanel}
          id="town-detail"
        >
          <Box className="town-detail-inner">
            <TownDetailView
              armyUnitLabels={armyUnitLabels}
              model={detail}
              state={state}
              statLabels={statLabels}
            />
          </Box>
        </aside>
      </div>
      <nav aria-label={labels.navAria} className="town-building-nav">
        {BUILDINGS.map((building) => {
          const navIcon = townNavIcon(building.id);
          return (
            <GameActionButton
              key={building.id}
              actionId={building.id}
              className={navClassName(townBuilding, building.id)}
              gameAction="town-building"
              variant="text"
            >
              <span>
                <GameIcon name={navIcon} size={22} />
              </span>
              <strong>{buildingNavLabel(building.id, t)}</strong>
            </GameActionButton>
          );
        })}
      </nav>
      <Box className="town-mobile-army" id="town-mobile-army">
        <span className="eyebrow">{labels.mobileArmyEyebrow}</span>
        {state.army.map((unit) => {
          const cardLabels = armyUnitLabels[unit.id];
          if (!cardLabels) return null;
          return (
            <ArmyUnitCardView
              key={unit.id}
              labels={cardLabels}
              state={state}
              unitId={unit.id}
            />
          );
        })}
        <p className="fine-print">{labels.mobileArmyTip}</p>
      </Box>
      <footer className="town-garrison" id="town-garrison">
        <div className="town-day">
          <span>{labels.dayLabel}</span>
          <b>{labels.incomeFooter}</b>
        </div>
        <div className="town-troops">
          <span>{labels.garrisonLabel}</span>
          {state.army.map((unit) => {
            const creature = getCreature(unit.creature);
            return (
              <GameActionButton
                key={unit.id}
                actionId={unit.id}
                aria-label={`${unit.count} ${creature.name}`}
                gameAction="creature"
                variant="text"
              >
                <CreaturePortrait creature={creature} />
                <b>{unit.count}</b>
              </GameActionButton>
            );
          })}
        </div>
        <GameActionButton
          className="end-day"
          disabled={endDayDisabled}
          gameAction="end-day"
          startIcon={<GameIcon name="sun" />}
          variant="gold"
        >
          {labels.nextDay}
        </GameActionButton>
      </footer>
    </section>
  );
}
