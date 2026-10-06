import Box from '@mui/material/Box';
import CastleIcon from '@mui/icons-material/Castle';
import { getCreature } from '@/game/data';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import type { AdventureSidebarViewModel } from '@/app/types/adventure-sidebar';
import { LocationCardView } from '@/app/components/sidebar/LocationCardView';

export interface AdventureSidebarViewProps {
  readonly model: AdventureSidebarViewModel;
}

export function AdventureSidebarView({ model }: AdventureSidebarViewProps) {
  const heroCreature = getCreature(model.heroCreatureId);

  return (
    <>
      <Box aria-label={model.minimapAria} className="adventure-minimap">
        {model.minimapCells.map((cell) => (
          <GameActionButton
            key={`${cell.hexQ},${cell.hexR}`}
            actionQ={cell.hexQ}
            actionR={cell.hexR}
            aria-label={`${cell.label} ${cell.hexQ},${cell.hexR}`}
            className="minimap-cell"
            gameAction="minimap"
            style={{ background: cell.background }}
            title={cell.label}
            variant="text"
          >
            {cell.inner}
          </GameActionButton>
        ))}
      </Box>
      <Box className="adventure-hero">
        <Box className="hero-medallion">
          <CreaturePortrait creature={heroCreature} />
        </Box>
        <div>
          <strong>{model.heroTitle}</strong>
          <small>{model.movementLine}</small>
        </div>
        <GameActionButton
          aria-label={model.citadelAria}
          className="button sidebar-citadel-btn"
          gameAction="castle"
          startIcon={<CastleIcon />}
          title={model.citadelAria}
          variant="gold"
        >
          {model.citadelShort}
        </GameActionButton>
      </Box>
      <Box aria-label={model.armyAria} className="army-slots">
        {model.armySlots.map((slot) => {
          if (slot.kind === 'empty') {
            return <span key={slot.slot} className="empty-slot" />;
          }
          const creature = getCreature(slot.creatureId!);
          return (
            <GameActionButton
              key={slot.unitId}
              actionId={slot.unitId}
              aria-label={slot.ariaLabel}
              gameAction="creature"
              variant="text"
            >
              <CreaturePortrait creature={creature} />
              <b>{slot.count}</b>
            </GameActionButton>
          );
        })}
      </Box>
      <LocationCardView model={model.locationCard} />
      <Box className="adventure-calendar">
        <strong>{model.dayLabel}</strong>
        <span>{model.weekLabel}</span>
        <small>{model.incomeLabel}</small>
      </Box>
      <Box className="journal">
        <p>{model.logHead}</p>
        <small>{model.journalEnemies}</small>
        <p>{model.logTail}</p>
      </Box>
    </>
  );
}
