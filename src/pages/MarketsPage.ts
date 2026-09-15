import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';

export type MarketCategory = 'Favorites' | 'All' | 'Top Gainers' | 'Top Losers' | 'Top Volume';

/**
 * /markets - the public spot-market overview. This is the "Spot trading
 * section" referenced by the challenge brief: it lists every tradable pair,
 * groups them into categories via tabs, and each row carries the pair's
 * key data fields (price, 24h/7d change, market cap, circulating supply).
 */
export class MarketsPage extends BasePage {
  static readonly path = '/markets';
  static readonly expectedColumns = [
    'Coin',
    'Price',
    '24h %',
    '7d %',
    'Market Cap',
    'Circulating Supply',
  ] as const;

  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly tabList: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly tableHeaderCells: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', { name: 'Trending Assets' });
    this.tabList = page.getByRole('tablist');
    this.table = page.locator('table');
    this.rows = page.locator('table tbody tr');
    this.tableHeaderCells = page.locator('table thead th');
  }

  async goto(): Promise<void> {
    await super.goto(MarketsPage.path);
  }

  tab(name: MarketCategory): Locator {
    return this.page.getByRole('tab', { name, exact: true });
  }

  async selectCategory(name: MarketCategory): Promise<void> {
    await this.tab(name).click();
    await expect(this.tab(name)).toHaveAttribute('aria-selected', 'true');
  }

  async rowCount(): Promise<number> {
    return this.rows.count();
  }

  row(index: number): Locator {
    return this.rows.nth(index);
  }

  async columnHeaderTexts(): Promise<string[]> {
    return (await this.tableHeaderCells.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** Extracts the visible data fields for a given row, by position. */
  async rowFields(index: number): Promise<{ coin: string; symbol: string; price: string }> {
    const row = this.row(index);
    const cells = row.locator('td');
    const coinCell = cells.nth(1);
    const coin = (await coinCell.locator('label').first().innerText()).trim();
    const symbol = (await coinCell.locator('label').nth(1).innerText()).trim();
    const price = (await cells.nth(2).innerText()).trim();
    return { coin, symbol, price };
  }
}
