import Box from '@mui/material/Box';
import type { BattleSidebarModel } from '@/app/types/battle-sidebar';
import { FighterPanelView } from '@/app/components/battle/FighterPanelView';

export interface BattleSidebarViewProps {
  readonly model: BattleSidebarModel;
}

export function BattleSidebarView({ model }: BattleSidebarViewProps) {
  if (model.kind === 'result') {
    return (
      <Box className="location-card result">
        <Box className="eyebrow">{model.eyebrow}</Box>
        <h2>{model.title}</h2>
        <p>{model.body}</p>
      </Box>
    );
  }
  return <FighterPanelView model={model.panel} />;
}
