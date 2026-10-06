import type { Creature } from './game/data';

const ICON_PATHS = {
  map:
    '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/>' +
    '<path d="M9 3v15m6-12v15"/>',
  castle:
    '<path d="M3 21V9h5v4h8V9h5v12ZM8 9V3h3v3h2V3h3v6M10 21v-5h4v5"/>',
  book:
    '<path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>' +
    '<path d="M12 5v16"/>',
  shield:
    '<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Z"/>' +
    '<path d="m8 12 3 3 5-6"/>',
  sword:
    '<path d="m5 19 14-14V2h3v3L8 19M3 15l6 6M2 22l4-4"/>',
  sun:
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>' +
    '<path d="M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  coin:
    '<circle cx="12" cy="12" r="9"/>' +
    '<path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>',
  gem:
    '<path d="m3 8 4-5h10l4 5-9 13Z"/>' +
    '<path d="M3 8h18M7 3l5 18 5-18"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  target:
    '<circle cx="12" cy="12" r="7"/>' +
    '<circle cx="12" cy="12" r="2"/>' +
    '<path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  flag: '<path d="M5 22V3h13l-3 4 3 4H5"/>',
  foot:
    '<path d="m8 21 9-3-3-8-4 1-5 7Z"/>' +
    '<circle cx="8" cy="7" r="2"/>' +
    '<circle cx="13" cy="4" r="2"/>',
  help:
    '<circle cx="12" cy="12" r="9"/>' +
    '<path d="M9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 3h.01"/>',
  save:
    '<path d="M4 3h14l3 3v15H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
  heart: '<path d="M20 5c-4-4-8 1-8 1S8 1 4 5s0 9 8 15c8-6 12-11 8-15Z"/>',
  leaf: '<path d="M20 3S2 1 3 13c1 10 15 9 17-10ZM3 21l12-12"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/>' +
    '<circle cx="8" cy="7" r="3"/>' +
    '<circle cx="16" cy="17" r="3"/>',
  download:
    '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload:
    '<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
} satisfies Record<string, string>;

export function iconMarkup(name: string): string {
  if (name in ICON_PATHS) {
    return ICON_PATHS[name as keyof typeof ICON_PATHS];
  }
  return ICON_PATHS.spark;
}

export function icon(name: string, size = 20): string {
  const markup = iconMarkup(name);
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    'fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    `${markup}</svg>`
  );
}

function portraitHeadwear(creature: Creature, sylveFamily: boolean): string {
  if (sylveFamily) {
    return (
      `<path d="m46 82 4 30 6-8 4 13 7-14 6 10 3-31" fill="${creature.accent}"/>` +
      '<path d="m50 91 5 15m8-16 1 18m6-18 1 13" ' +
      'stroke="#ffffff" opacity=".23"/>'
    );
  }
  return `<path d="m48 28 2-18 7 10L58 3l7 17 7-11-1 21" fill="${creature.accent}"/>`;
}

function portraitTierMarks(creature: Creature): string {
  let marks = '';
  if (creature.tier >= 2) {
    marks +=
      `<path d="m24 63 18-7-5 17-15 2m76-12-18-7 5 17 15 2" fill="${creature.accent}" opacity=".9"/>`;
  }
  if (creature.tier === 3) {
    marks +=
      `<path d="m34 32-6-19 12 8-1-13m48 24 6-19-12 8 1-13" stroke="${creature.accent}" stroke-width="5" fill="none"/>`;
  }
  return marks;
}

function portraitNoseColor(sylveFamily: boolean): string {
  if (sylveFamily) {
    return '#a77cd8';
  }
  return '#e091d3';
}

export function portrait(creature: Creature, className = ''): string {
  const sylveFamily = creature.family === 'sylve';
  const noseColor = portraitNoseColor(sylveFamily);
  return `<svg class="portrait ${className}" viewBox="0 0 120 120" role="img" aria-label="${creature.name}">
+    <ellipse cx="60" cy="110" rx="36" ry="5" fill="#000" opacity=".14"/>
+    <path d="M29 69Q8 58 9 79Q10 93 24 88M90 69Q112 57 111 78Q110 88 100 88" fill="${creature.color}"/>
+    <path d="M24 85C18 49 36 26 61 25C90 23 105 61 96 90Q89 107 60 106Q28 108 24 85" fill="${creature.color}"/>
+    <ellipse cx="60" cy="79" rx="31" ry="26" fill="#fff" opacity=".07"/>
+    <ellipse cx="38" cy="104" rx="16" ry="8" fill="${creature.color}"/><ellipse cx="81" cy="104" rx="16" ry="8" fill="${creature.color}"/>
+    ${portraitHeadwear(creature, sylveFamily)}
+    ${portraitTierMarks(creature)}
+    <ellipse cx="45" cy="48" rx="10" ry="12" fill="#fff7e8"/><ellipse cx="77" cy="48" rx="10" ry="12" fill="#fff7e8"/>
+    <ellipse cx="47" cy="51" rx="6" ry="8" fill="#252036"/><ellipse cx="75" cy="51" rx="6" ry="8" fill="#252036"/>
+    <circle cx="45" cy="48" r="2" fill="white"/><circle cx="73" cy="48" r="2" fill="white"/>
+    <ellipse cx="60" cy="73" rx="13" ry="19" fill="${noseColor}"/><ellipse cx="56" cy="67" rx="4" ry="8" fill="#fff" opacity=".1"/>
+  </svg>`.replace(/^\+/gm, '');
}

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function htmlEscapeChar(ch: string): string {
  const escaped = HTML_ESCAPE[ch];
  if (escaped) {
    return escaped;
  }
  return ch;
}

export const escape = (text: string) =>
  text.replace(/[&<>"']/g, htmlEscapeChar);
