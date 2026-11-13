import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const password = readFileSync('.env', 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)![1];
async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('Пароль доступа').fill(password);
  await page.getByRole('button', { name: 'Войти в кабинет' }).click();
  await expect(page.getByRole('heading', { name: /Проверьте ТЗ/ })).toBeVisible();
}
test('preferences work before sign-in and persist without replacing the active document', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
  await page.getByLabel('Язык интерфейса').selectOption('en');
  await page.getByLabel('Text size').selectOption('large');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your workspace', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('font-size', '18.4px');
  await page.getByLabel('Access password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: /Equipment procurement/ }).click();
  await page.getByLabel('Interface language').selectOption('ru');
  await expect(page.getByText('Equipment procurement.txt', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать проверку' })).toBeEnabled();
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Тёмная', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Очень крупный 130%' }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '20.8px');
});

test('system theme follows the operating system until an explicit theme is selected', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('English interface keeps source evidence intact and exports English report labels', async ({
  page,
}) => {
  await login(page);
  await page.getByLabel('Язык интерфейса').selectOption('en');
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
  await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
  await page.getByLabel('Размер текста').selectOption('extra');
  await expect(page.locator('.view-transition')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.art-document')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 17, 29)');
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/dark-large-desktop.png',
    fullPage: true,
  });
  for (const language of ['ru', 'en']) {
    await page.getByLabel('Язык интерфейса').selectOption(language);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const menu = page.getByRole('button', {
      name: language === 'en' ? 'Menu' : 'Меню',
      exact: true,
    });
    await menu.click();
    await page
      .getByRole('button', {
        name: language === 'en' ? 'Document review' : 'Проверка документа',
        exact: true,
      })
      .click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      animations: 'disabled',
      path: `.local/screens/dark-large-main-${language}.png`,
      fullPage: true,
    });
    await menu.click();
    await page
      .getByRole('button', { name: language === 'en' ? 'Settings' : 'Настройки', exact: true })
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
  }
});
