import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppToastView } from '@/app/components/feedback/AppToastView';

describe('AppToastView', () => {
  it('expose une région de statut accessible', () => {
    render(
      <AppToastView message="Salut Pompon" onClose={() => {}} open />,
    );
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Salut Pompon')).toBeInTheDocument();
  });
});
