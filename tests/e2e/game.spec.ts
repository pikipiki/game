import { expect, test, type Page } from '@playwright/test';

async function dismissIntro(page: Page): Promise<void> {
  const enter = page.locator(
    '[data-testid="intro-enter"], ' +
      'section.intro-modal button[data-action="close"]',
  );
  await enter.first().waitFor({ state: 'visible', timeout: 20_000 });
  await enter.first().click();
}

test.describe('Les Royaumes de Pompon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?preview', { waitUntil: 'domcontentloaded' });
  });

  test(
    'affiche la campagne après l’intro et expose la navigation accessible',
    async ({ page }) => {
    await expect(page).toHaveTitle(/Royaumes de Pompon/i);
    await dismissIntro(page);
    await expect(
      page.getByRole('heading', { name: /Citadelle de Pompon/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: /Navigation principale/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Explorer/i }),
    ).toBeVisible();
  });

  test(
    'ouvre le combat d’entraînement avec la barre de commandes tactiques',
    async ({ page }) => {
    await dismissIntro(page);
    await page.getByRole('button', { name: /Combat d’entraînement/i }).click();
    await expect(page.locator('#app')).toHaveClass(/in-battle/);
    await expect(
      page.getByRole('region', { name: /Commandes de bataille/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Attaquer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Défendre/i })).toBeVisible();
  });
});
