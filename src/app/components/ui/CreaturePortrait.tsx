import type { Creature } from '@/game/data';

export interface CreaturePortraitProps {
  readonly creature: Creature;
  readonly className?: string;
}

function portraitNoseColor(sylveFamily: boolean): string {
  if (sylveFamily) return '#a77cd8';
  return '#e091d3';
}

function PortraitHeadwear({
  creature,
  sylveFamily,
}: {
  readonly creature: Creature;
  readonly sylveFamily: boolean;
}) {
  if (sylveFamily) {
    return (
      <>
        <path d="m46 82 4 30 6-8 4 13 7-14 6 10 3-31" fill={creature.accent} />
        <path
          d="m50 91 5 15m8-16 1 18m6-18 1 13"
          opacity={0.23}
          stroke="#ffffff"
        />
      </>
    );
  }
  return (
    <path d="m48 28 2-18 7 10L58 3l7 17 7-11-1 21" fill={creature.accent} />
  );
}

function PortraitTierMarks({ creature }: { readonly creature: Creature }) {
  if (creature.tier >= 2) {
    let tier3 = null;
    if (creature.tier === 3) {
      tier3 = (
        <path
          d="m34 32-6-19 12 8-1-13m48 24 6-19-12 8 1-13"
          fill="none"
          stroke={creature.accent}
          strokeWidth={5}
        />
      );
    }
    return (
      <>
        <path
          d="m24 63 18-7-5 17-15 2m76-12-18-7 5 17 15 2"
          fill={creature.accent}
          opacity={0.9}
        />
        {tier3}
      </>
    );
  }
  return null;
}

export function CreaturePortrait({
  creature,
  className = '',
}: CreaturePortraitProps) {
  const sylveFamily = creature.family === 'sylve';
  const noseColor = portraitNoseColor(sylveFamily);
  let portraitClass = 'portrait';
  if (className) portraitClass = `${portraitClass} ${className}`;

  return (
    <svg
      aria-label={creature.name}
      className={portraitClass}
      role="img"
      viewBox="0 0 120 120"
    >
      <ellipse cx="60" cy="110" fill="#000" opacity={0.14} rx="36" ry="5" />
      <path
        d="M29 69Q8 58 9 79Q10 93 24 88M90 69Q112 57 111 78Q110 88 100 88"
        fill={creature.color}
      />
      <path
        d={
          'M24 85C18 49 36 26 61 25C90 23 105 61 96 90' +
          'Q89 107 60 106Q28 108 24 85'
        }
        fill={creature.color}
      />
      <ellipse cx="60" cy="79" fill="#fff" opacity={0.07} rx="31" ry="26" />
      <ellipse cx="38" cy="104" fill={creature.color} rx="16" ry="8" />
      <ellipse cx="81" cy="104" fill={creature.color} rx="16" ry="8" />
      <PortraitHeadwear creature={creature} sylveFamily={sylveFamily} />
      <PortraitTierMarks creature={creature} />
      <ellipse cx="45" cy="48" fill="#fff7e8" rx="10" ry="12" />
      <ellipse cx="77" cy="48" fill="#fff7e8" rx="10" ry="12" />
      <ellipse cx="47" cy="51" fill="#252036" rx="6" ry="8" />
      <ellipse cx="75" cy="51" fill="#252036" rx="6" ry="8" />
      <circle cx="45" cy="48" fill="white" r="2" />
      <circle cx="73" cy="48" fill="white" r="2" />
      <ellipse cx="60" cy="73" fill={noseColor} rx="13" ry="19" />
      <ellipse cx="56" cy="67" fill="#fff" opacity={0.1} rx="4" ry="8" />
    </svg>
  );
}
