import Box from '@mui/material/Box';
import ShieldIcon from '@mui/icons-material/Shield';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionIconButton } from '@/app/components/ui/GameActionButton';
import { getCreature } from '@/game/data';
import type { CombatChromeModel } from '@/app/types/combat-presentation';
import { CombatRosterButtonView } from
  '@/app/components/battle/CombatRosterButtonView';

export interface CombatChromeViewProps {
  readonly model: CombatChromeModel;
  readonly initiativeBarAria: string;
}

function SiegeStatus({
  siege,
}: {
  readonly siege: NonNullable<CombatChromeModel['siege']>;
}) {
  return (
    <Box className="siege-status">
      {siege.heading}
      <small>{siege.hint}</small>
    </Box>
  );
}

export function CombatChromeView({
  model,
  initiativeBarAria,
}: CombatChromeViewProps) {
  let siegeBlock = null;
  if (model.siege) {
    siegeBlock = <SiegeStatus siege={model.siege} />;
  }

  return (
    <Box className="combat-chrome" id="combat-chrome">
      <Box className="combat-heading">
        <span className="eyebrow">
          {model.eyebrow}
          {' '}
          · TOUR
          {model.round}
        </span>
        <h1>{model.title}</h1>
      </Box>
      <Box className="hero-banner ally-hero">
        <ShieldIcon sx={{ fontSize: 28 }} />
        <span>
          {model.allyTitle}
          <small>{model.allySubtitle}</small>
        </span>
      </Box>
      <Box className="hero-banner enemy-hero">
        <SportsMmaIcon sx={{ fontSize: 28 }} />
        <span>
          {model.enemyLabel}
          <small>{model.enemyCount}</small>
        </span>
      </Box>
      <Box aria-label={initiativeBarAria} className="initiative-bar">
        <span>INITIATIVE</span>
        {model.initiative.map((unit) => {
          const creature = getCreature(unit.creatureId);
          const className = `initiative-unit ${unit.side} ${unit.buttonClass}`;
          return (
            <GameActionIconButton
              key={unit.id}
              actionId={unit.id}
              aria-label={unit.ariaLabel}
              className={className}
              gameAction="select-fighter"
              title={unit.title}
            >
              <CreaturePortrait creature={creature} />
              <b>{unit.count}</b>
            </GameActionIconButton>
          );
        })}
        <small>{model.turnLabel}</small>
      </Box>
      {siegeBlock}
      <Box className="combat-roster-strip">
        {model.roster.map((unit) => (
          <CombatRosterButtonView key={unit.id} unit={unit} />
        ))}
      </Box>
      <Box aria-live="polite" className="combat-event" role="status">
        <SportsMmaIcon fontSize="small" />
        {model.latestLog}
      </Box>
    </Box>
  );
}
