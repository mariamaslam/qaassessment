import { Locator, Page, expect } from '@playwright/test';

/**
 * The top navigation bar, present on every public page of trade.mb.io.
 * Modelled as a component (not a page) because it is shared chrome, reused
 * by every Page Object rather than owned by any single page.
 */
export class HeaderComponent {
  readonly root: Locator;
  readonly logoLink: Locator;
  readonly homeLink: Locator;
  readonly marketsLink: Locator;
  readonly tradeMenuTrigger: Locator;
  readonly loginButton: Locator;
  readonly signUpButton: Locator;
  readonly mobileMenuToggle: Locator;
  readonly appDownloadBanner: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('header');
    this.logoLink = this.root.getByRole('link').first();
    // .first(): the same label can exist twice in the DOM (desktop nav + off-canvas
    // mobile drawer) with only one actually visible at a given viewport.
    this.homeLink = this.root.getByRole('link', { name: 'Home', exact: true }).first();
    this.marketsLink = this.root.getByRole('link', { name: 'Markets', exact: true }).first();
    // Stable app-assigned id, deliberately preferred over generated CSS module class names.
    this.tradeMenuTrigger = page.locator('#trade-header-option-open-button');
    this.loginButton = page
      .getByRole('link', { name: 'Log In', exact: true })
      .or(page.getByRole('button', { name: 'Log In', exact: true }))
      .first();
    this.signUpButton = page
      .getByRole('link', { name: 'Sign Up', exact: true })
      .or(page.getByRole('button', { name: 'Sign Up', exact: true }))
      .first();
    // Identified by its hamburger icon path rather than DOM position, since
    // the mobile-only "Open app" banner button shifts sibling indices.
    this.mobileMenuToggle = this.root.locator('button:has(path[d="M3 12h18M3 6h18M3 18h18"])');
    this.appDownloadBanner = page.getByText('The fastest way to buy crypto');
  }

  /** Opens the "Trade" mega-menu and returns its visible links, keyed by label. */
  async openTradeMenu(): Promise<void> {
    await this.tradeMenuTrigger.click();
    await expect(this.tradeMenuTrigger).toHaveAttribute('aria-expanded', 'true');
  }

  tradeMenuItem(label: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(label, 'i') });
  }

  async openMobileMenu(): Promise<void> {
    await this.mobileMenuToggle.click();
  }

  /** True when the nav is collapsed behind a hamburger (mobile/tablet layout). */
  async isCollapsed(): Promise<boolean> {
    return !(await this.homeLink.isVisible().catch(() => false));
  }
}
