import { iconMarkup } from '@/ui';
import { reactSvgFromIconMarkup } from '@/app/lib/svg-markup';

export interface GameIconProps {
  readonly name: string;
  readonly size?: number;
  readonly className?: string;
}

export function GameIcon({ name, size = 20, className }: GameIconProps) {
  const inner = iconMarkup(name);
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
      width={size}
    >
      {reactSvgFromIconMarkup(inner)}
    </svg>
  );
}
