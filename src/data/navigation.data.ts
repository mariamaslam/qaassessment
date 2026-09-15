/**
 * Data-driven definition of the public header navigation on trade.mb.io.
 *
 * `requiresAuth: true` items are real destinations that the app gates behind
 * login. For those, "the correct destination" for an anonymous visitor is a
 * redirect to /login that preserves the originally requested path in the
 * `next` query param - that redirect behaviour is exactly what the test
 * asserts, rather than the gated page's content (see README > Assumptions).
 */
export interface NavItem {
  name: string;
  href: string;
  requiresAuth: boolean;
}

export const headerNavItems: NavItem[] = [
  { name: 'Home', href: '/', requiresAuth: true },
  { name: 'Markets', href: '/markets', requiresAuth: false },
];

export interface TradeMenuItem {
  label: string;
  href: string;
  requiresAuth: boolean;
}

export const tradeMenuItems: TradeMenuItem[] = [
  { label: 'Spot', href: '/trade/BTC_USD', requiresAuth: true },
  { label: 'Instant Buy', href: '/markets', requiresAuth: false },
  { label: 'Panic Sell', href: '/markets', requiresAuth: false },
];

export const authEntryPoints = [
  { name: 'Log In', href: '/login' },
  { name: 'Sign Up', href: '/register' },
] as const;
