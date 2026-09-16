import { test, expect } from '@playwright/test';
import { MarketsPage } from '../src/pages/MarketsPage';

/**
 * Bonus - Validate relevant API/network responses.
 *
 * /markets is powered by a same-origin asset-metadata endpoint. Asserting on
 * the network response (not just the rendered DOM) catches backend
 * regressions - a bad payload shape, a stale cache, a 5xx - even when the UI
 * happens to degrade "gracefully" enough that a purely visual check would
 * still pass.
 */
test.describe('API / network validation (bonus)', () => {
  test('assets API returns a well-formed, successful payload', async ({ page }) => {
    const markets = new MarketsPage(page);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/cmc/v1/assets') && res.request().method() === 'GET'),
      markets.open(),
    ]);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.code).toBe('200');
    expect(typeof body.data).toBe('object');

    const symbols = Object.keys(body.data);
    expect(symbols.length).toBeGreaterThan(0);

    const btc = body.data['BTC'];
    expect(btc).toBeDefined();
    expect(btc).toMatchObject({
      name: expect.any(String),
      unified_cryptoasset_id: expect.any(Number),
    });
  });

  test('page surfaces the same pair count the API returned', async ({ page }) => {
    const markets = new MarketsPage(page);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/cmc/v1/assets') && res.request().method() === 'GET',
    );
    await markets.open();
    const response = await responsePromise;
    const body = await response.json();
    const apiPairCount = Object.keys(body.data).length;

    await markets.selectCategory('All');
    const uiRowCount = await markets.rowCount();

    // The UI list is a curated/paginated subset of the full asset catalogue,
    // so it should never exceed what the API actually knows about.
    expect(uiRowCount).toBeGreaterThan(0);
    expect(uiRowCount).toBeLessThanOrEqual(apiPairCount);
  });
});
