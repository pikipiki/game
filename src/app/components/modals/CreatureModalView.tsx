import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GameState } from '@/game/engine';
import { CreatureStatsGridView } from
  '@/app/components/creature/CreatureStatsGridView';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { GameIcon } from '@/app/components/ui/GameIcon';
import {
  combatKindLabel,
  creatureLineageEyebrow,
  displayCreature,
} from '@/app/lib/creature-ui-copy';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface CreatureModalViewProps {
  readonly state: GameState;
  readonly detail: string;
}

export function CreatureModalView({ state, detail }: CreatureModalViewProps) {
  const { t } = useTranslation();
  const unit =
    state.army.find((armyUnit) => armyUnit.id === detail) ?? state.army[0]!;
  const creature = displayCreature(unit.creature, t);
  const lineage = creatureLineageEyebrow(creature, t);

  return (
    <Box>
      <Box
        className="creature-hero"
        style={{ '--creature-color': creature.color } as object}
      >
        <CreaturePortrait creature={creature} />
        <div>
          <div className="eyebrow">
            {lineage}
            {' '}
            ·
            {t('modals.creature.level')}
            {creature.tier}
          </div>
          <h2>{creature.name}</h2>
          <p>{creature.description}</p>
          <span className="badge">
            {t('modals.creature.badge', {
              count: unit.count,
              xp: unit.xp,
            })}
          </span>
        </div>
      </Box>
      <CreatureStatsGridView
        attackLabel={t('creature.statAttack')}
        combatKindLabel={t('creature.statCombat')}
        combatLabel={combatKindLabel(creature, t)}
        creature={creature}
        defenseLabel={t('creature.statDefense')}
        hpLabel={t('creature.statHp')}
      />
      <Box className="section-label">
        <span>{t('modals.creature.chooseEvolution')}</span>
        <span>{t('modals.creature.xpAcquired', { xp: unit.xp })}</span>
      </Box>
      {creature.evolves.length === 0 && (
        <Box className="notice">{t('modals.creature.ultimate')}</Box>
      )}
      {creature.evolves.length > 0 && (
        <>
          {creature.evolves.map((evolutionId) => {
            const next = displayCreature(evolutionId, t);
            const allowed =
              unit.xp >= next.xp &&
              state.gold >= next.gold &&
              state.crystals >= next.crystals &&
              !state.battle;
            return (
              <Box key={evolutionId} className="evolution-card">
                <CreaturePortrait creature={next} />
                <div>
                  <h3>{next.name}</h3>
                  <p>{next.description}</p>
                  <small>
                    {t('modals.creature.evolveCost', {
                      xp: next.xp,
                      gold: next.gold,
                      crystals: next.crystals,
                    })}
                  </small>
                </div>
                <GameActionButton
                  actionCreature={evolutionId}
                  actionId={unit.id}
                  disabled={!allowed}
                  gameAction="evolve"
                  variant="crystal"
                >
                  <GameIcon name="spark" size={16} />
                  {t('modals.creature.evolveBtn')}
                </GameActionButton>
              </Box>
            );
          })}
        </>
      )}
      <Typography className="fine-print" component="p" variant="caption">
        {t('modals.creature.finePrint')}
      </Typography>
    </Box>
  );
}
