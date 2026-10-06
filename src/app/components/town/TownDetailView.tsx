import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CastleIcon from '@mui/icons-material/Castle';
import FlagIcon from '@mui/icons-material/Flag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BoltIcon from '@mui/icons-material/Bolt';
import type { ReactNode } from 'react';
import type { GameState } from '@/game/engine';
import type { TownDetailBody, TownDetailModel } from '@/app/types/town-detail';
import { ArmyUnitCardView } from '@/app/components/creature/ArmyUnitCardView';
import { CreatureStatsGridView } from
  '@/app/components/creature/CreatureStatsGridView';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import {
  GameActionButton,
  GameActionIconButton,
} from '@/app/components/ui/GameActionButton';
import type { ArmyUnitCardLabels } from '@/app/lib/army-unit-card-copy';
import type { CreatureStatLabels } from '@/app/lib/creature-stat-labels';
import { getCreature } from '@/game/data';

const crestCenterSx = { textAlign: 'center' as const };
const TOWN_CREST_CLASS = 'town-crest';
const crestIconSx = { color: 'primary.main' };

function TownCrestBox({ children }: { readonly children: ReactNode }) {
  return (
    <Box className={TOWN_CREST_CLASS} sx={crestCenterSx}>
      {children}
    </Box>
  );
}

function townProjectClassName(built: boolean): string {
  if (built) return 'town-project built';
  return 'town-project';
}

export interface TownDetailViewProps {
  readonly model: TownDetailModel;
  readonly state: GameState;
  readonly armyUnitLabels: Record<string, ArmyUnitCardLabels>;
  readonly statLabels: CreatureStatLabels;
}

function TownStatRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <Box className="town-stat">
      <span>{label}</span>
      <b>{value}</b>
    </Box>
  );
}

function ArmyCardList({
  state,
  unitIds,
  armyUnitLabels,
}: {
  readonly state: GameState;
  readonly unitIds: readonly string[];
  readonly armyUnitLabels: Record<string, ArmyUnitCardLabels>;
}) {
  return (
    <Stack spacing={1}>
      {unitIds.map((unitId) => {
        const labels = armyUnitLabels[unitId];
        if (!labels) return null;
        return (
          <ArmyUnitCardView
            key={unitId}
            labels={labels}
            state={state}
            unitId={unitId}
          />
        );
      })}
    </Stack>
  );
}

function TownDetailBodyView({
  body,
  state,
  armyUnitLabels,
  statLabels,
}: {
  readonly body: TownDetailBody;
  readonly state: GameState;
  readonly armyUnitLabels: Record<string, ArmyUnitCardLabels>;
  readonly statLabels: CreatureStatLabels;
}) {
  if (body.kind === 'keep') {
    return (
      <Stack spacing={2}>
        <TownCrestBox>
          <CastleIcon sx={{ fontSize: 72, ...crestIconSx }} />
        </TownCrestBox>
        <Typography component="h3" variant="h6">
          {body.title}
        </Typography>
        <Typography component="p" variant="body2">
          {body.lead}
        </Typography>
        <TownStatRow label={body.fortLabel} value={body.levelLine} />
        <TownStatRow label={body.incomeLabel} value={body.incomeLine} />
        <Typography component="p" variant="body2">
          {body.conquerText}
        </Typography>
        <GameActionButton
          actionId="hall"
          fullWidth
          gameAction="town-building"
          variant="gold"
        >
          {body.buildCitadelLabel}
        </GameActionButton>
      </Stack>
    );
  }
  if (body.kind === 'hall') {
    return (
      <Stack spacing={2}>
        <Typography component="h3" variant="h6">
          {body.projectsTitle}
        </Typography>
        <Typography component="p" variant="body2">
          {body.projectsLead}
        </Typography>
        <Alert className="notice" severity="info" variant="outlined">
          {body.dayNotice}
        </Alert>
        <Box className="town-projects">
          {body.projects.map((project) => (
            <Box
              key={project.id}
              className={townProjectClassName(project.built)}
              component="article"
            >
              <Typography component="h3" variant="subtitle1">
                {project.name}
              </Typography>
              <Typography component="p" variant="body2">
                {project.subtitle}
              </Typography>
              <Typography component="small" variant="caption">
                {project.costLine}
              </Typography>
              {!project.built && project.reasonText !== null && (
                <>
                  <Typography className="fine-print" variant="caption">
                    {project.reasonText}
                  </Typography>
                  <GameActionButton
                    actionId={project.id}
                    disabled={project.buildDisabled}
                    fullWidth
                    gameAction="build"
                    variant="gold"
                  >
                    {project.buildLabel}
                  </GameActionButton>
                </>
              )}
            </Box>
          ))}
        </Box>
        <Typography component="h3" variant="h6">
          {body.fortTitle}
        </Typography>
        <Typography component="p" variant="body2">
          {body.fortBonus}
        </Typography>
        <Box className="town-cost">{body.upgradeCost}</Box>
        <GameActionButton
          disabled={body.upgradeDisabled}
          fullWidth
          gameAction="upgrade"
          variant="gold"
        >
          {body.upgradeLabel}
        </GameActionButton>
        {body.homeNote !== null && (
          <Typography component="p" variant="body2">
            {body.homeNote}
          </Typography>
        )}
      </Stack>
    );
  }
  if (body.kind === 'recruit') {
    const creature = getCreature(body.family);
    return (
      <Stack spacing={2}>
        <Box className="town-creature">
          <CreaturePortrait creature={creature} />
        </Box>
        <Typography component="h3" variant="h6">
          {body.creatureName}
        </Typography>
        <Typography component="p" variant="body2">
          {body.description}
        </Typography>
        <CreatureStatsGridView
          attackLabel={statLabels.attack}
          combatKindLabel={statLabels.combatKind}
          combatLabel={body.combatKindValue}
          creature={creature}
          defenseLabel={statLabels.defense}
          hpLabel={statLabels.hp}
        />
        <TownStatRow
          label={body.perPurchaseLabel}
          value={body.perPurchaseCount}
        />
        <TownStatRow
          label={body.stockLabel}
          value={String(body.stock)}
        />
        <Box className="town-cost">{body.costLine}</Box>
        <GameActionButton
          actionId={body.family}
          disabled={body.recruitDisabled}
          fullWidth
          gameAction="recruit"
          variant="gold"
        >
          {body.recruitLabel}
        </GameActionButton>
        <Typography className="fine-print" variant="caption">
          {body.growthFine}
        </Typography>
      </Stack>
    );
  }
  if (body.kind === 'guild') {
    return (
      <Stack spacing={2}>
        <TownCrestBox>
          <AutoStoriesIcon sx={{ fontSize: 64, ...crestIconSx }} />
        </TownCrestBox>
        <Typography component="h3" variant="h6">
          {body.title}
        </Typography>
        <Typography component="p" variant="body2">
          {body.manaLine}
        </Typography>
        <Box className="town-spell" component="article">
          <BoltIcon color="primary" />
          <div>
            <Typography component="h3" variant="subtitle1">
              {body.boltTitle}
            </Typography>
            <Typography component="p" variant="body2">
              {body.boltDesc}
            </Typography>
          </div>
        </Box>
        <Box className="town-spell" component="article">
          <FavoriteIcon color="primary" />
          <div>
            <Typography component="h3" variant="subtitle1">
              {body.healTitle}
            </Typography>
            <Typography component="p" variant="body2">
              {body.healDesc}
            </Typography>
          </div>
        </Box>
        <Typography component="p" variant="body2">
          {body.manaRestore}
        </Typography>
      </Stack>
    );
  }
  if (body.kind === 'forge') {
    return (
      <Stack spacing={2}>
        <TownCrestBox>
          <BoltIcon sx={{ fontSize: 64, ...crestIconSx }} />
        </TownCrestBox>
        <Typography component="h3" variant="h6">
          {body.title}
        </Typography>
        <Typography component="p" variant="body2">
          {body.lead}
        </Typography>
        <ArmyCardList
          armyUnitLabels={armyUnitLabels}
          state={state}
          unitIds={body.unitIds}
        />
        <GameActionButton fullWidth gameAction="codex" variant="subtle">
          {body.codexLabel}
        </GameActionButton>
      </Stack>
    );
  }
  if (body.kind === 'heroHall') {
    return (
      <Stack spacing={2}>
        <TownCrestBox>
          <FlagIcon sx={{ fontSize: 64, ...crestIconSx }} />
        </TownCrestBox>
        <Typography component="h3" variant="h6">
          {body.title}
        </Typography>
        <Typography component="p" variant="body2">
          {body.lead}
        </Typography>
        <ArmyCardList
          armyUnitLabels={armyUnitLabels}
          state={state}
          unitIds={body.unitIds}
        />
        <Alert className="notice" severity="info" variant="outlined">
          {body.logHead}
        </Alert>
      </Stack>
    );
  }
  return (
    <Stack spacing={2}>
      <TownCrestBox>
        <CastleIcon sx={{ fontSize: 64, ...crestIconSx }} />
      </TownCrestBox>
      <Typography component="h3" variant="h6">
        {body.title}
      </Typography>
      <Typography component="p" variant="body2">
        {body.lead}
      </Typography>
      <Box className="town-cost">{body.costLine}</Box>
      <Alert className="notice" severity="info" variant="outlined">
        {body.reasonText}
      </Alert>
      <GameActionButton
        actionId={body.buildBuildingId}
        disabled={body.buildDisabled}
        fullWidth
        gameAction="build"
        variant="gold"
      >
        {body.buildLabel}
      </GameActionButton>
    </Stack>
  );
}

export function TownDetailView({
  model,
  state,
  armyUnitLabels,
  statLabels,
}: TownDetailViewProps) {
  const { heading } = model;
  return (
    <>
      <Box className="town-detail-heading">
        <GameActionIconButton
          aria-label={heading.closeAria}
          className="icon-btn town-panel-close"
          gameAction="town-close-panel"
        >
          <CloseIcon fontSize="small" />
        </GameActionIconButton>
        <Typography className="eyebrow" component="span" variant="overline">
          {heading.subtitle}
        </Typography>
        <Typography component="h2" variant="h5">
          {heading.title}
        </Typography>
      </Box>
      <Box className="town-detail-content">
        {model.travelNotice !== null && (
          <Alert className="notice" severity="warning" variant="outlined">
            {model.travelNotice}
          </Alert>
        )}
        <TownDetailBodyView
          armyUnitLabels={armyUnitLabels}
          body={model.body}
          state={state}
          statLabels={statLabels}
        />
      </Box>
    </>
  );
}
