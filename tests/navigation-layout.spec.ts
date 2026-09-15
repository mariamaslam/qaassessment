import { test, expect } from '@playwright/test';
import { MarketsPage } from '../src/pages/MarketsPage';
import { headerNavItems, tradeMenuItems } from '../src/data/navigation.data';

/**
 * Section 1 - Navigation & Layout.
 *
 * The header is exercised from /markets: it is the one page on trade.mb.io
 * that renders the full public header without requiring authentication (see
 * README > Assumptions & Adaptations for why "/" itself is out of scope).
 */
test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    const markets = new MarketsPage(page);
    await markets.goto();
  });

  test('top navigation renders with all expected items visible', async ({ page }) => {
    const markets = new MarketsPage(page);

    await expect(markets.header.root).toBeVisible();
    for (const item of headerNavItems) {
      await expect(page.getByRole('link', { name: item.name, exact: true }).first()).toBeVisible();
    }
    await expect(markets.header.tradeMenuTrigger).toBeVisible();
    await expect(markets.header.loginButton).toBeVisible();
    await expect(markets.header.signUpButton).toBeVisible();
  });

  for (const item of headerNavItems) {
    test(`"${item.name}" nav item resolves to the correct destination`, async ({ page }) => {
      const link = page.getByRole('link', { name: item.name, exact: true }).first();
      await link.click();

      if (item.requiresAuth) {
        // Anonymous users must be bounced to login, with the intended
        // destination preserved so they land back on it post-login.
        await expect(page).toHaveURL(/\/login\?next=/);
      } else {
        await expect(page).toHaveURL(new RegExp(item.href.replace('/', '\\/') + '$'));
      }
    });
  }

  test('"Trade" menu exposes Spot, Instant Buy and Panic Sell, each resolving correctly', async ({ page }) => {
    const markets = new MarketsPage(page);
    await markets.header.openTradeMenu();

    for (const item of tradeMenuItems) {
      const link = markets.header.tradeMenuItem(item.label);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
    }
  });

  test('"Log In" and "Sign Up" open their respective auth pages', async ({ page }) => {
    const markets = new MarketsPage(page);

    await markets.header.signUpButton.click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();

    await page.goBack();
    await markets.header.loginButton.click();
    await expect(page).toHaveURL(/\/login/);
    // Note: unlike /register's "Create account", the login card's "Log In"
    // title is not marked up as a heading - asserting on the email field
    // instead, which is an unambiguous, resilient signal that the form rendered.
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
  });

  test.describe('desktop viewport sizes', () => {
    for (const size of [
      { width: 1280, height: 800, label: '1280x800 (small laptop)' },
      { width: 1440, height: 900, label: '1440x900 (standard laptop)' },
      { width: 1920, height: 1080, label: '1920x1080 (full HD)' },
    ]) {
      test(`nav stays fully expanded at ${size.label}`, async ({ page }) => {
        const markets = new MarketsPage(page);
        await markets.setViewport(size.width, size.height);

        await expect(markets.header.homeLink).toBeVisible();
        await expect(markets.header.marketsLink).toBeVisible();
        await expect(markets.header.tradeMenuTrigger).toBeVisible();
        // The hamburger toggle is a mobile/tablet-only affordance.
        await expect(markets.header.mobileMenuToggle).toBeHidden();
      });
    }
  });
});
