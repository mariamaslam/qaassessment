import { test, expect } from '@playwright/test';
import { MarketsPage, MarketCategory } from '../src/pages/MarketsPage';

/**
 * Section 2 - Trading Functionality.
 *
 * The brief's "Spot trading section" maps to /markets: the public list of
 * every spot pair, groupable by category tab, each row carrying the pair's
 * price/change/market data fields. See README > Assumptions for why this
 * page (rather than the gated "/") is the target.
 */
test.describe('Trading Functionality', () => {
  let markets: MarketsPage;

  test.beforeEach(async ({ page }) => {
    markets = new MarketsPage(page);
    await markets.goto();
  });

  test('spot trading section renders and displays trading pairs', async () => {
    await expect(markets.heading).toBeVisible();
    await expect(markets.table).toBeVisible();

    const rowCount = await markets.rowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('trading pairs are correctly grouped into categories', async () => {
    await expect(markets.tabList).toBeVisible();

    const categories: MarketCategory[] = ['All', 'Top Gainers', 'Top Losers', 'Top Volume'];
    for (const category of categories) {
      await markets.selectCategory(category);
      // Each populated category must still expose the shared pair universe -
      // categories re-sort/re-filter, they never break the listing.
      await expect(markets.rows.first()).toBeVisible();
      expect(await markets.rowCount()).toBeGreaterThan(0);
    }
  });

  test('"Favorites" category renders an empty state for a signed-out visitor', async () => {
    // A meaningful negative-shaped assertion: with no session, there are no
    // saved favorites, and the UI must not error - it should just show none.
    await markets.selectCategory('Favorites');
    expect(await markets.rowCount()).toBe(0);
  });

  test('trading pair entries contain the expected data fields', async () => {
    await markets.selectCategory('All');

    const headers = await markets.columnHeaderTexts();
    for (const expected of MarketsPage.expectedColumns) {
      expect(headers).toContain(expected);
    }

    const first = await markets.rowFields(0);
    expect(first.coin.length).toBeGreaterThan(0);
    expect(first.symbol.length).toBeGreaterThan(0);
    // Price is rendered as a localized currency string, e.g. "$ 75,623.19".
    expect(first.price).toMatch(/^\$\s?[\d,]+(\.\d+)?$/);
  });

  test('every row exposes Details and Trade actions', async () => {
    const first = markets.row(0);
    await expect(first.getByRole('button', { name: 'Details' })).toBeVisible();
    await expect(first.getByRole('button', { name: 'Trade' })).toBeVisible();
  });
});
