import { Page } from '@playwright/test';

/**
 * Common behaviour shared by every page object.
 * Concrete pages extend this instead of re-implementing navigation/wait helpers.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  /** Resize the viewport in-place, used by responsive/regression tests. */
  async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }
}
