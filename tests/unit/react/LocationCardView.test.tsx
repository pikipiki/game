import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocationCardView } from '@/app/components/sidebar/LocationCardView';
import { buildLocationCardModel } from '@/app/view-models/location-card';
import { newGame } from '@/game/engine';
import { createTranslator } from '@/i18n/translate';

describe('LocationCardView', () => {
  it('affiche la citadelle sur la case du héros', () => {
    const state = newGame();
    const model = buildLocationCardModel(
      state,
      state.hero,
      createTranslator('fr'),
    );
    render(<LocationCardView model={model} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /Citadelle de Pompon/i,
    );
  });
});
