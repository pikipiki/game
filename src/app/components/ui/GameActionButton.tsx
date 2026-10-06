import Button, { type ButtonProps } from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';

export interface GameActionButtonProps extends ButtonProps {
  readonly gameAction: string;
  readonly actionId?: string;
  readonly actionQ?: number;
  readonly actionR?: number;
  readonly actionCreature?: string;
}

/** Bouton de jeu : conserve `data-action` pour le routeur d’actions. */
export function GameActionButton({
  gameAction,
  actionId,
  actionQ,
  actionR,
  actionCreature,
  children,
  ...rest
}: GameActionButtonProps) {
  return (
    <Button
      data-action={gameAction}
      data-creature={actionCreature}
      data-id={actionId}
      data-q={actionQ}
      data-r={actionR}
      {...rest}
    >
      {children}
    </Button>
  );
}

export interface GameActionIconButtonProps {
  readonly gameAction: string;
  readonly actionId?: string;
  readonly 'aria-label': string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly title?: string;
}

export function GameActionIconButton({
  gameAction,
  actionId,
  children,
  className,
  disabled,
  title,
  'aria-label': ariaLabel,
}: GameActionIconButtonProps) {
  return (
    <IconButton
      aria-label={ariaLabel}
      className={className}
      data-action={gameAction}
      data-id={actionId}
      disabled={disabled}
      size="small"
      title={title}
    >
      {children}
    </IconButton>
  );
}
