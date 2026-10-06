import Box from '@mui/material/Box';
import type { LocationCardModel } from '@/app/types/location-card';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { GameIcon } from '@/app/components/ui/GameIcon';

export interface LocationCardViewProps {
  readonly model: LocationCardModel;
}

function LocationCardActions({
  action,
}: {
  action: LocationCardModel['action'];
}) {
  if (action.kind === 'travel') {
    return (
      <>
        <span className="travel-cost">
          <GameIcon name="foot" size={16} />
          {action.steps}
          {' '}
          /
          {action.movement}
          {' '}
          {action.stepsUnitLabel}
        </span>
        <GameActionButton
          className="button location-move-btn"
          disabled={!action.possible}
          gameAction="travel"
          startIcon={<GameIcon name="foot" size={18} />}
          variant="gold"
        >
          {action.moveButtonLabel}
        </GameActionButton>
      </>
    );
  }
  if (action.kind === 'fight-site') {
    return (
      <>
        <span className="travel-cost">{action.statusLabel}</span>
        <GameActionButton
          actionId={action.siteId}
          className="button"
          disabled={!action.cleared && action.locked}
          gameAction="fight"
          variant={action.buttonVariant}
        >
          {action.buttonLabel}
          <GameIcon name="sword" size={16} />
        </GameActionButton>
      </>
    );
  }
  if (action.kind === 'castle') {
    return (
      <>
        <span className="travel-cost">{action.costLine}</span>
        <GameActionButton className="button" gameAction="castle" variant="crystal">
          {action.enterButtonLabel}
          <GameIcon name="arrow" size={16} />
        </GameActionButton>
      </>
    );
  }
  if (action.kind === 'army') {
    return (
      <>
        <span className="travel-cost">{action.banner}</span>
        <GameActionButton className="button" gameAction="army" variant="subtle">
          {action.viewArmyButtonLabel}
          <GameIcon name="shield" size={16} />
        </GameActionButton>
      </>
    );
  }
  const canAct = action.atHero || action.possible;
  return (
    <GameActionButton
      actionId={action.heroId}
      className="button"
      disabled={!canAct}
      fullWidth
      gameAction={action.gameAction}
      variant="danger"
    >
      {action.buttonLabel}
    </GameActionButton>
  );
}

function enemyArmyLine(model: LocationCardModel): string | null {
  if (model.action.kind !== 'enemy-hero') return null;
  return model.action.armyLine;
}

export function LocationCardView({ model }: LocationCardViewProps) {
  const armyLine = enemyArmyLine(model);

  return (
    <Box className="location-card">
      <Box className="eyebrow">
        <GameIcon name={model.locIcon} size={15} />
        {model.eyebrow}
      </Box>
      <h2>{model.title}</h2>
      {armyLine !== null && <p>{armyLine}</p>}
      <p>{model.description}</p>
      <Box className="location-action">
        <LocationCardActions action={model.action} />
      </Box>
    </Box>
  );
}
