import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'firatcelik@aol.com';
const password = process.env.E2E_PASSWORD || '147741_a';
const functionsBase = process.env.E2E_FUNCTIONS_URL || 'https://oshwjmdmtzcikvwhjvxh.functions.supabase.co';

test.describe('Portal smoke', () => {
  test('login, verify portal, send job, check feed token', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('ornek@emlakcrm.com')).toBeVisible();

    await page.getByPlaceholder('ornek@emlakcrm.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    await expect(page).toHaveURL(/\/$/);

    await page.goto('/portal-settings');

    const feedToken = page.locator('input[readonly]');
    if (!(await feedToken.inputValue())) {
      await page.getByRole('button', { name: 'Üret' }).click();
    }
    await expect(feedToken).toHaveValue(/.+/);

    await page.getByText('Sahibinden', { exact: true }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Doğrula' }).first().click();

    await expect(page.getByText(/Doğrulama/i)).toBeVisible();

    const tokenValue = await feedToken.inputValue();

    await page.goto('/portal-jobs');
    await page.getByRole('button', { name: 'Şimdi Gönder' }).click();

    await expect(page.getByText(/İşler işlendi|Kuyruk boş|İşler çalıştırılamadı/i)).toBeVisible();
    const userRaw = await page.evaluate(() => localStorage.getItem('emlakcrm_user'));
    const user = userRaw ? JSON.parse(userRaw) : null;
    const slug = user?.tenant_slug;
    expect(slug).toBeTruthy();

    const feedUrl = `${functionsBase}/portal-feed/${slug}/sahibinden/feed.json?token=${tokenValue}`;
    const feedResponse = await page.request.get(feedUrl);
    expect(feedResponse.ok()).toBeTruthy();
  });
});
