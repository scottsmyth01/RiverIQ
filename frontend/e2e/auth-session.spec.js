import { expect, test } from '@playwright/test';
import path from 'node:path';

const email = 'e2e@riveriq.test';
const password = 'Password123';
const fixturePath = path.resolve(
  '../backend/src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt',
);

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('RiverIQ E2E smoke flows', () => {
  test('redirects logged-out dashboard visitors to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('logs in and logs out with the seeded verified user', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: /e2ehero/i })).toBeVisible();

    await page.getByRole('button', { name: /e2ehero/i }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('uploads a PokerStars session and updates sessions plus bankroll', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/sessions/new');
    await page.getByLabel('Session Title').fill('E2E PokerStars Upload');
    await page.locator('#hand-history-file').setInputFiles(fixturePath);
    await page.getByRole('button', { name: 'Save Session' }).click();

    await expect(page).toHaveURL(/\/dashboard\/sessions$/);
    await expect(page.getByRole('button', { name: 'View details for E2E PokerStars Upload' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '+$262.50' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Dashboard navigation' }).getByText('$262.50')).toBeVisible();
  });
});
