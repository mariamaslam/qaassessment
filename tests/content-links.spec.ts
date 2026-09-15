import { test, expect } from '@playwright/test';
import { MarketsPage } from '../src/pages/MarketsPage';

/**
 * Section 3 - Content & Links.
 *
 * Two of the brief's three scenarios here (App Store/Google Play badges, and
 * the About Us > Why MultiBank page) live on trade.mb.io's authenticated
 * homepage template today, not on any page an anonymous visitor can reach -
 * confirmed by probing the app's own i18n bundle and routing during
 * exploration (see README > Assumptions & Adaptations for the full trail).
 * Per the brief's explicit "do not log in" constraint, they are marked
 * `fixme` with the reasoning inline rather than faked against guessed
 * selectors. The one real, public app-download touchpoint - the mobile
 * "Open the app" banner - is fully covered below.
 */
test.describe('Content & Links', () => {
  test('marketing banner (mobile app promo) renders in the expected page region', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const markets = new MarketsPage(page);
    await markets.goto();

    // Expected region: inside the header, above the page's primary content.
    const banner = markets.header.root.getByText('The fastest way to buy crypto');
    await expect(banner).toBeVisible();

    const bannerBox = await banner.boundingBox();
    const headingBox = await markets.heading.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(bannerBox!.y).toBeLessThan(headingBox!.y);

    await expect(page.getByRole('button', { name: 'Open' })).toBeEnabled();
  });

  test('marketing banner is not shown at desktop widths (mobile-only placement)', async ({ page }) => {
    const markets = new MarketsPage(page);
    await markets.goto();
    await expect(page.getByText('The fastest way to buy crypto')).toBeHidden();
  });

  test('App Store and Google Play download links resolve correctly', async () => {
    test.fixme(
      true,
      'Direct store badge links live on the authenticated homepage template ' +
        '(confirmed via the app i18n bundle keys "app-store"/"google-play" under ' +
        '"trade-on-the-go"); unreachable without logging in, which the brief ' +
        'disallows. Revisit if/when this section ships on a public route.',
    );
  });

  test('About Us > Why MultiBank page renders all expected components with correct headings and section text', async () => {
    test.fixme(
      true,
      'The "why-multibank" section is part of the gated homepage template ' +
        '(same i18n bundle evidence as above) and has no standalone public ' +
        'route today (/about-us, /why-multibank, /about-us/why-multibank all 404). ' +
        'Unreachable without logging in, which the brief disallows.',
    );
  });
});
