import { expect, test, type Page } from '@playwright/test';
import {
  opponentStrikeEndDayFixture,
  SAVE_GAME_KEY,
} from './helpers/opponent-strike-seed';
import { campBattleFixture } from './helpers/retreat-seed';

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
    await expect(
      page.getByRole('navigation', { name: /Navigation principale/i }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: /Combat d’entraînement/i }),
    ).toBeHidden();
  });

  test(
    'fin de journée : alerte, déplacement du chef adverse sur la carte, puis combat',
    async ({ page }) => {
      const { game, leaderHexBefore, leaderHexAfter, strikeToast } =
        opponentStrikeEndDayFixture();
      expect(leaderHexBefore).not.toBe(leaderHexAfter);

      await page.addInitScript(
        ({ key, json }) => {
          localStorage.setItem(key, json);
        },
        { key: SAVE_GAME_KEY, json: JSON.stringify(game) },
      );
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const scene = page.getByTestId('adventure-scene');
      await expect(
        page.getByRole('button', { name: /Terminer le jour/i }),
      ).toBeVisible();
      await expect(scene).toHaveAttribute(
        'data-enemy-leader-hex',
        leaderHexBefore,
      );

      await page.getByRole('button', { name: /Terminer le jour/i }).click();

      await expect(page.locator('#app')).toHaveClass(/opponent-strike-pause/);
      const bubble = page.getByTestId('opponent-strike-bubble');
      await expect(bubble.getByText(strikeToast)).toBeVisible();
      await expect(page.locator('#app')).not.toHaveClass(/in-battle/);
      await expect(
        page.getByRole('region', { name: /Carte du royaume en trois dimensions/i }),
      ).toBeVisible();
      await expect(scene).toHaveAttribute(
        'data-enemy-leader-hex',
        leaderHexAfter,
      );
      await expect(scene).toHaveAttribute('data-enemy-marching', '1');
      await expect
        .poll(
          async () => scene.getAttribute('data-camera-focus-hex'),
          { timeout: 2_500 },
        )
        .toBe(leaderHexAfter);
      await expect(scene).not.toHaveAttribute(
        'data-camera-focus-hex',
        '3,-3',
      );

      await expect(page.locator('#app')).toHaveClass(/in-battle/, {
        timeout: 8_000,
      });
      await expect(
        page.getByRole('region', { name: /Commandes de bataille/i }),
      ).toBeVisible();
    },
  );

  test(
    'retraite : une confirmation ramène le héros sur la carte',
    async ({ page }) => {
      const game = campBattleFixture();
      expect(game.battle).toBeTruthy();

      await page.addInitScript(
        ({ key, json }) => {
          localStorage.setItem(key, json);
        },
        { key: SAVE_GAME_KEY, json: JSON.stringify(game) },
      );
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('#app')).toHaveClass(/in-battle/);
      await page.getByRole('button', { name: /^Retraite$/i }).click();
      await page
        .getByRole('button', { name: /Replier le héros/i })
        .click();

      await expect(page.locator('#app')).not.toHaveClass(/in-battle/, {
        timeout: 5_000,
      });
      await expect(
        page.getByRole('region', { name: /Commandes de bataille/i }),
      ).toBeHidden();
      await expect(
        page.getByRole('navigation', { name: /Navigation principale/i }),
      ).toBeVisible();
      await expect(page.locator('#app')).not.toHaveClass(/in-battle/);
    },
  );
});
