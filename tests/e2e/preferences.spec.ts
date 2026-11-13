import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const password = readFileSync('.env', 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)![1];
async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('Пароль доступа').fill(password);
  await page.getByRole('button', { name: 'Войти в кабинет' }).click();
  await expect(page.getByRole('heading', { name: /Проверьте ТЗ/ })).toBeVisible();
}
async function navigate(page: Page, ru: string, en: string) {
  const english = (await page.locator('html').getAttribute('lang')) === 'en';
  if ((page.viewportSize()?.width ?? 1280) <= 720) {
    await page.getByRole('button', { name: english ? 'Menu' : 'Меню', exact: true }).click();
  }
  await page.getByRole('button', { name: english ? en : ru, exact: true }).click();
}
async function settings(page: Page) {
  await navigate(page, 'Настройки', 'Settings');
}
async function workspace(page: Page) {
  await navigate(page, 'Проверка документа', 'Document review');
}

test('customization is in Settings, persists after reload and keeps the selected document', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('.preference-controls')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Тёмная тема', exact: true })).toHaveCount(0);
  await login(page);
  await page.getByRole('button', { name: 'Настроить интерфейс', exact: true }).click();
  await page.getByRole('button', { name: 'Тёмная', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Large 115%', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveCSS('font-size', '18.4px');
  const digits = page.locator('.text-scale-value').filter({ hasText: '115%' });
  const sizes = await digits.evaluate((el) => ({
    digits: getComputedStyle(el).fontSize,
    label: getComputedStyle(el.parentElement!).fontSize,
  }));
  expect(sizes.digits).toBe(sizes.label);
  await expect(page.locator('body')).toHaveCSS('font-variant-numeric', 'lining-nums tabular-nums');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Review your specs.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('complementary', { name: 'Workspace customization tip' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Equipment procurement/ }).click();
  await settings(page);
  await expect(page.locator('.model-card')).not.toContainText(/LLM_|PostgreSQL|\.env/);
  await expect(page.locator('.model-guide-link')).toHaveAttribute('href', /docs\/MODEL\.md$/);
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.getByRole('button', { name: 'Очень крупный 130%', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '20.8px');
  await workspace(page);
  await expect(page.getByText('Equipment procurement.txt', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать проверку' })).toBeEnabled();
});

test('system theme follows the OS until an explicit theme is selected', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await login(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await settings(page);
  await expect(page.getByRole('button', { name: 'Системная', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Тёмная', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('English interface keeps source evidence intact and exports English report labels', async ({
  page,
}) => {
  await login(page);
  await settings(page);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await workspace(page);
  await page.getByRole('button', { name: /Equipment procurement/ }).click();
  await page.getByRole('button', { name: 'Start review' }).click();
  await expect(page.getByRole('heading', { name: 'Review results' })).toBeVisible();
  await expect(page.getByText('Разные значения: грузоподъёмность')).toBeVisible();
  await expect(
    page.locator('.finding .category').filter({ hasText: /^Contradictions$/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Accept', exact: true }).first().click();
  await expect(page.getByText('Accepted for action')).toBeVisible();
  await page.locator('.quote').first().click();
  await expect(page.locator('.document-block.selected small')).toHaveText('Line 5');
  await expect(page.locator('.document-block.selected p')).toContainText('Грузоподъемность 800 кг');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report' }).click();
  const path = await (await downloaded).path();
  const report = readFileSync(path!, 'utf8');
  expect(report).toContain('# Review report:');
  expect(report).toContain('Category: Contradictions');
  expect(report).toContain('Status: Accepted for action');
  expect(report).toContain('Грузоподъемность 800 кг');
  await page.getByRole('button', { name: 'Reference sources', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Rosstandart — national standards catalog' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'How document review works' })).toBeVisible();
  await page.getByRole('button', { name: 'Review history', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Equipment procurement.txt', exact: true }).click();
});

test('dark theme and maximum text size remain readable on desktop and mobile with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await login(page);
  await settings(page);
  await page.getByRole('button', { name: 'Тёмная', exact: true }).click();
  await page.getByRole('button', { name: 'Очень крупный 130%', exact: true }).click();
  await workspace(page);
  await expect(page.locator('.view-transition')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.art-document')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 17, 29)');
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/dark-large-desktop.png',
    fullPage: true,
  });
  for (const language of ['ru', 'en']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await settings(page);
    await page
      .getByRole('button', { name: language === 'en' ? 'English' : 'Русский', exact: true })
      .click();
    await expect(
      page.getByRole('heading', {
        name: language === 'en' ? 'Workspace preferences' : 'Настройки интерфейса',
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      animations: 'disabled',
      path: `.local/screens/dark-large-mobile-${language}.png`,
      fullPage: true,
    });
    await workspace(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      animations: 'disabled',
      path: `.local/screens/dark-large-main-${language}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await settings(page);
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.getByRole('button', { name: 'Обычный 100%', exact: true }).click();
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/settings-final.png',
    fullPage: true,
  });
  await workspace(page);
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/workspace-dark-final.png',
    fullPage: true,
  });
});

test('the quiet first-use tip can be dismissed and does not return after reload', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByRole('complementary', { name: 'Подсказка о настройках' })).toBeVisible();
  await page.getByRole('button', { name: 'Не показывать подсказку', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Подсказка о настройках' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Проверьте ТЗ/ })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Подсказка о настройках' })).toHaveCount(0);
});
