import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const password = readFileSync('.env', 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)![1];
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
test('full review, source anchor, decision, history, export and deletion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await page.getByLabel('Пароль доступа').fill(password);
  await page.getByRole('button', { name: 'Войти в кабинет' }).click();
  await page.getByRole('button', { name: /Поставка оборудования/ }).click();
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/reviews') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Начать проверку' }).click();
  const reviewId = (await (await created).json()).id as string;
  await expect(page.getByRole('heading', { name: 'Результаты проверки' })).toBeVisible();
  await expect(page.getByText('Разные значения: грузоподъёмность')).toBeVisible();
  await page.locator('.quote').first().click();
  await expect(page.locator('.document-block.selected')).toBeVisible();
  await page.getByRole('button', { name: 'Принять', exact: true }).first().click();
  await expect(page.getByText('Принято в работу')).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/review-final.png',
    fullPage: false,
  });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать отчёт' }).click();
  expect((await downloaded).suggestedFilename()).toBe('review-report.md');
  await page.getByRole('button', { name: 'История проверок' }).click();
  await page
    .getByRole('button', { name: /Поставка оборудования.txt/ })
    .first()
    .click();
  await expect(page.getByText('Принято в работу')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'История проверок' }).click();
  page.once('dialog', (d) => d.accept());
  const removed = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/reviews/${reviewId}`) &&
      response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Удалить Поставка оборудования.txt' }).first().click();
  expect((await removed).status()).toBe(200);
  expect((await page.request.get(`/api/reviews/${reviewId}`)).status()).toBe(404);
});
test('rejects unauthenticated and cross-origin requests', async ({ request }) => {
  expect((await request.get('/api/reviews')).status()).toBe(401);
  expect(
    (
      await request.post('/api/reviews', { headers: { origin: 'https://untrusted.invalid' } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/auth', {
        headers: { origin: baseURL },
        data: { password: 'wrong' },
      })
    ).status(),
  ).toBe(401);
});
test('workspace remains usable on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await page.getByLabel('Пароль доступа').fill(password);
  await page.getByRole('button', { name: 'Войти в кабинет' }).click();
  await expect(page.getByRole('heading', { name: /Проверьте ТЗ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать проверку' })).toBeDisabled();
  await page.getByRole('button', { name: 'Не показывать подсказку', exact: true }).click();
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.main-shell')).toHaveCSS('margin-left', '0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    animations: 'disabled',
    path: '.local/screens/mobile.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Меню', exact: true }).click();
  await page.getByRole('button', { name: 'История проверок' }).click();
  await expect(page.getByRole('heading', { name: 'История проверок' })).toBeVisible();
});
