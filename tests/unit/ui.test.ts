import { describe, expect, it } from 'vitest';
import { getCreature } from '@/game/data';
import { escape, icon, portrait } from '@/ui';

describe('Icônes et portraits', () => {
  it('échappe le HTML et fournit une icône de secours', () => {
    expect(escape(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
    expect(icon('unknown-icon')).toContain('viewBox="0 0 24 24"');
    expect(icon('map', 32)).toContain('width="32"');
  });
  it('refuse une créature inconnue', () => {
    expect(() => getCreature('peluche-inconnue')).toThrow(
      /Créature inconnue/,
    );
  });
  it('dessine les variantes Sylve, Aurore et les paliers d’évolution', () => {
    const ancient = getCreature('sylve-ancient');
    expect(portrait(getCreature('sylve'))).toContain(
      'aria-label="Barbemousse"',
    );
    expect(portrait(getCreature('sol'))).toContain(
      'aria-label="Pompon solaire"',
    );
    expect(portrait(ancient)).toContain(ancient.accent);
    expect(portrait(getCreature('sol-phoenix'))).toContain('stroke-width="5"');
  });
});
