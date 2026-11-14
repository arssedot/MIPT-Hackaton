import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { REVIEW_TIMEOUT_MS } from '../../src/contracts/review';

const password = readFileSync('.env', 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)![1];
for (const mode of ['cancel', 'deadline'] as const) {
  test(`a stalled review releases the interface after ${mode}`, async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.getByLabel('Пароль доступа').fill(password);
    await page.getByRole('button', { name: 'Войти в кабинет' }).click();
    await expect(page.getByRole('heading', { name: /Проверьте ТЗ/ })).toBeVisible();
    let release!: () => void;
    const stalled = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await stalled;
      await route.abort().catch(() => {});
    });
    try {
      await page.getByRole('button', { name: /Поставка оборудования/ }).click();
      const sent = page.waitForRequest(
        (r) => r.url().endsWith('/api/reviews') && r.method() === 'POST',
      );
      await page.getByRole('button', { name: 'Начать проверку' }).click();
      await sent;
      await expect(page.getByRole('button', { name: 'Проверяем документ' })).toBeDisabled();
      if (mode === 'cancel') await page.getByRole('button', { name: 'Прервать ожидание' }).click();
      else await page.clock.fastForward(REVIEW_TIMEOUT_MS);
      await expect(
        page.getByText(
          mode === 'cancel'
            ? 'Ожидание прервано. Проверка могла сохраниться в истории; проверьте её перед повторным запуском.'
            : 'Время ожидания ответа истекло. Проверьте историю перед повторным запуском.',
        ),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Начать проверку' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Прервать ожидание' })).toHaveCount(0);
    } finally {
      release();
    }
  });
}
