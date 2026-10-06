import Box from '@mui/material/Box';
import MapIcon from '@mui/icons-material/Map';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { getCreature } from '@/game/data';
import type { FighterPanelModel } from '@/app/types/combat-presentation';
import { CombatRosterButtonView } from
  '@/app/components/battle/CombatRosterButtonView';

function DamageForecastLine({ text }: { readonly text: string | null }) {
  if (text === null) return null;
  return (
    <Box className="damage-forecast">
      <SportsMmaIcon fontSize="small" />
      {text}
    </Box>
  );
}

export interface FighterPanelViewProps {
  readonly model: FighterPanelModel;
}

export function FighterPanelView({ model }: FighterPanelViewProps) {
  const creature = getCreature(model.creatureId);

  return (
    <>
      <Box className="fighter-detail">
        <Box className="eyebrow">{model.eyebrow}</Box>
        <Box className="active-creature">
          <CreaturePortrait creature={creature} />
          <div>
            <h2>{model.name}</h2>
            <p>{model.tierLine}</p>
          </div>
        </Box>
        <Box className="fighter-health">
          <span>
            {model.hp}
            {' '}
            /
            {model.maxHp}
            {' '}
            {model.hpUnitLabel}
          </span>
          <i className="health-track">
            <i style={{ width: `${model.healthPercent}%` }} />
          </i>
        </Box>
        <Box className="fighter-stats">
          <span>
            {model.statAttackLabel}
            <b>{model.attack}</b>
          </span>
          <span>
            {model.statDefenseLabel}
            <b>{model.defense}</b>
          </span>
          <span>
            {model.statRangedLabel}
            <b>{model.ranged}</b>
          </span>
          <span>
            {model.statSpeedLabel}
            <b>{model.speed}</b>
          </span>
        </Box>
        <p>{model.description}</p>
        <p className="fine-print">{model.finePrint}</p>
        <DamageForecastLine text={model.damageForecast} />
      </Box>
      <Box className="combat-roster-heading">{model.rosterHeading}</Box>
      <Box className="combat-sidebar-roster">
        {model.roster.map((unit) => (
          <CombatRosterButtonView key={unit.id} unit={unit} />
        ))}
      </Box>
      <GameActionButton
        fullWidth
        gameAction="tactical-moves"
        startIcon={<MapIcon />}
        variant="subtle"
      >
        {model.tacticalMovesLabel}
      </GameActionButton>
      <Box className="combat-history">
        <span className="eyebrow">{model.journalEyebrow}</span>
        {model.logLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Box>
    </>
  );
}
