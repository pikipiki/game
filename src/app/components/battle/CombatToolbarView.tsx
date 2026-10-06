import Box from '@mui/material/Box';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { getCreature } from '@/game/data';
import type { CombatToolbarModel } from '@/app/types/combat-presentation';

export interface CombatToolbarViewProps {
  readonly model: CombatToolbarModel;
}

export function CombatToolbarView({ model }: CombatToolbarViewProps) {
  if (model.kind === 'summary') {
    return (
      <Box className="combat-summary">
        <strong>{model.summaryHeading}</strong>
        <span>{model.summaryText}</span>
        <GameActionButton
          endIcon={<ArrowForwardIcon />}
          gameAction="finish-battle"
          variant="gold"
        >
          {model.continueLabel}
        </GameActionButton>
      </Box>
    );
  }
  const creature = getCreature(model.activeCreatureId!);

  return (
    <>
      <Box className="combat-active">
        <CreaturePortrait creature={creature} />
        <span>
          <small>{model.roleLabel}</small>
          <strong>{model.activeName}</strong>
          <b>{model.activeSubtitle}</b>
        </span>
      </Box>
      <Box className="combat-command-area">
        <Box className="combat-instruction">{model.hint}</Box>
        <Box className="combat-commands">
          {model.commands!.map((cmd) => {
            let className = 'combat-command';
            if (cmd.className) className += ` ${cmd.className}`;
            return (
              <GameActionButton
                key={cmd.gameAction}
                aria-label={cmd.ariaLabel}
                aria-pressed={cmd.ariaPressed}
                className={className}
                disabled={cmd.disabled}
                gameAction={cmd.gameAction}
                variant="text"
              >
                {cmd.label}
              </GameActionButton>
            );
          })}
          {model.castSpell === true && (
            <GameActionButton
              className="cast-button"
              disabled={model.castSpellEnabled !== true}
              gameAction="confirm-spell"
              variant="gold"
            >
              {model.castSpellLabel}
            </GameActionButton>
          )}
        </Box>
      </Box>
    </>
  );
}
