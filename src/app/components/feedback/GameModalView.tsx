import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';
import { GameActionIconButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

function modalMaxWidth(wide: boolean): 'md' | 'sm' {
  if (wide) return 'md';
  return 'sm';
}

export interface GameModalViewProps {
  readonly title: string;
  readonly wide: boolean;
  readonly intro: boolean;
  readonly open: boolean;
  readonly children: ReactNode;
}

export function GameModalView({
  title,
  wide,
  intro,
  open,
  children,
}: GameModalViewProps) {
  const { t } = useTranslation();
  let paperClass = 'modal';
  if (wide) paperClass += ' wide';
  if (intro) paperClass += ' intro-modal';

  return (
    <Dialog
      aria-labelledby="modal-title"
      className="modal-backdrop"
      data-action="backdrop"
      fullWidth
      maxWidth={modalMaxWidth(wide)}
      open={open}
      slotProps={{
        paper: {
          className: paperClass,
          component: 'section',
          role: 'dialog',
          tabIndex: -1,
        },
      }}
    >
      <Box data-action="backdrop" id="modal-root" sx={{ width: '100%' }}>
        <DialogTitle className="modal-header" component="div">
          <Box component="h2" id="modal-title">
            {title}
          </Box>
          <GameActionIconButton
            gameAction="close"
            aria-label={t('modals.closeAria')}
          >
            <CloseIcon />
          </GameActionIconButton>
        </DialogTitle>
        <DialogContent className="modal-body">{children}</DialogContent>
      </Box>
    </Dialog>
  );
}
