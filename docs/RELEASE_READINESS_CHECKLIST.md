# Release Readiness Checklist

Written for the Task 2 scenario: a fintech mobile trading app (iOS + Android), first public release, real user funds involved. Every item needs an explicit yes before a release candidate ships — "probably fine" is a no.

## Functional
- [ ] Deposit, trade placement/execution, and withdrawal all verified end-to-end on a sandboxed ledger, on both iOS and Android.
- [ ] Balance shown in the app matches the backend ledger after every tested operation (no drift).
- [ ] Order/trade idempotency confirmed: double-tap submit, retry-after-timeout, and app-killed-mid-request do not create duplicate orders or double-move funds.
- [ ] KYC/onboarding gate behaves correctly for approved, pending, and rejected states.
- [ ] All Sev1 and Sev2 defects from the tracker are closed or explicitly accepted-with-sign-off by product/eng leadership.

## Security
- [ ] Auth tokens and session data are stored in platform-secure storage (Keychain / Keystore), never plain preferences.
- [ ] Sessions expire correctly; expired-session mid-trade is handled without corrupting an in-flight order.
- [ ] No sensitive data (tokens, balances, PII) appears in device logs or crash reports.
- [ ] API traffic is TLS-enforced (and certificate-pinned if that's the team's standard).
- [ ] Biometric/PIN lock behaves correctly on both platforms, including after backgrounding.

## Platform parity
- [ ] Every launch-gating flow has been manually verified on both iOS and Android, not assumed symmetric.
- [ ] Tested on at least one older and one current OS version per platform.
- [ ] Tested on at least one physical device per platform (not simulator/emulator only).

## Resilience
- [ ] App handles network loss and flaky connectivity mid-transaction without leaving the user in an ambiguous state ("did it go through?").
- [ ] App backgrounded/killed during a pending trade or withdrawal is handled safely on relaunch (no duplicate action, no silent loss).
- [ ] A closed-market / price-slippage scenario produces a clear error, not a silent failure or a stale confirmation.

## Operational readiness
- [ ] Crash reporting (e.g. Crashlytics/Sentry) is wired up and alerting to an on-call channel.
- [ ] A kill-switch/feature-flag exists to disable trading or withdrawals remotely without an app-store resubmission.
- [ ] Rollback plan is documented and has been rehearsed at least once (not just written down).
- [ ] Dashboards for crash-free rate, API error rate on money-movement endpoints, and support-ticket volume are live and being watched for the first 48 hours post-release.
- [ ] Support/on-call knows the top 3 known risk areas going into launch and has an escalation path for a money-correctness incident specifically.

## Compliance
- [ ] Legal/compliance has signed off on KYC/AML flows and data-residency requirements for every region the app is releasing into.
- [ ] Terms of service, risk disclosures, and any regulator-mandated in-app disclaimers are present and reviewed by legal, not just QA.

## Sign-off
- [ ] QA sign-off recorded against this checklist, with the build number and date.
- [ ] Engineering lead sign-off.
- [ ] Product/business sign-off, explicitly acknowledging any open item accepted as a known risk.
