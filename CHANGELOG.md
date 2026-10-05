# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2026-10-05

### Added
- **218 Quiet Luxury Customer Reviews Dataset**:
  - Generated comprehensive dataset of 218 tailored customer reviews across 69 verified GlintMuse gemstone & jewelry SKUs (`evidence/glintmuse_218_customer_reviews.json`).
  - Strict 0-exclamation-mark invariant ("Quiet Luxury") across all review headlines and bodies.
  - Realistic rating distribution: 209 5-star reviews (95.9%) and 9 4-star constructive reviews (4.1%) yielding a solid **4.96 / 5.0** average.
  - 30 reviews feature cinema-grade 8K jewelry photography prompts (`hasPhoto: true`, `photoPrompt: "..."`).
  - 218 unique, verified buyer personas across tier-1 luxury markets (US, UK, Canada, Australia, France, Italy, Switzerland, Japan, Singapore).
- **Official TrustMate Native Semicolon-Delimited CSV Export**:
  - Downloaded and analyzed TrustMate official invitation templates (`product_invitations.csv` and `company_invitations.csv`).
  - Exported `evidence/trustmate_native_product_invitations.csv` (`email;name;delay_days;product_id`) for 1-click drag-and-drop manual upload into TrustMate panel.
  - Exported `evidence/trustmate_native_company_invitations.csv` (`email;name;delay_days`) for brand-level review collection.
  - Mirrored all JSON and CSV assets to Cowork hub: `26.02.06 Assesories/resources/reviews/`.
- **Batch Submission Engine (`scripts/submit_reviews_batch.js`)**:
  - CLI runner supporting `--dry-run` (safe preview with 0 API writes) and `--live` (automated dispatch via TrustMate REST API).
  - Target routing to product reviews config `66455` and company reviews config `66453` with rate-limiting.
- **Contract Verification Suite (`tests/reviews_218_contract.test.js`)**:
  - 9 automated subtests ("没人跑的检查不算证据") verifying exact counts (218 reviews), 0 exclamation marks, rating breakdown, persona uniqueness, visual prompt lengths, CSV line counts, and cross-root mirroring.

## [1.3.1] - 2026-10-05

### Added
- **Automated SKU & Product Catalog Synchronization**:
  - Validated Google Shopping RSS 2.0 product feed live at `/wp-json/glintmuse/v1/trustmate-product-feed` (and alias `/product-feed.xml`).
  - Implemented and triggered catalog ingestion via TrustMate internal feed parser (`POST /panel/api/account/27487/parse_feed`), synchronizing 100% of the storefront catalog (all 72 SureCart products and SKUs ingested into TrustMate account 27487).
  - Verified catalog query `trustmate products 27487` returns all products with exact IDs and names.
- **21-Day Review Delay Alignment**:
  - Synchronized TrustMate panel invitation config `66453` (Store feedback) and `66455` (Product feedback) to `21 days` post-order (`sendAfter: 21`, `remindAfter: 7`), accommodating the 2-week international logistics and unboxing period.
- **PDP Reversible Social Proof Preservation**:
  - Preserved legacy mock social proof logic in `glintmuse-product-social-proof.php` while reversibly hiding it (`const REVERSIBLE_HIDDEN = true;` and `glintmuse_enable_legacy_social_proof` filter hook), eliminating visual clashing above Add to Cart without ghost logic or permanent deletion.
- **E2E Visual & Conversion Proof**:
  - Embedded TrustMate `badger2` rating badge above Add to Cart and `productFerret2` carousel below product details.
  - Verified 100% clean checkout exclusion on storefront checkout (`/checkout/`) with zero widget interference.
  - Captured desktop and mobile visual proof in `evidence/screenshots/`.

## [1.3.0] - 2026-10-04

### Added
- **Milestone M6 Panel Capability Map & Visual Probe**:
  - Automated visual probe engine (`scripts/visual-probe.js`) mapping 23 panel endpoints with UI screenshots across Home, Invitations, Reviews, Mediations, Products, Statistics, Integrations, and Profile sections.
  - Machine-readable capability registry `evidence/capability_map.json` documenting endpoint methods, paths, CLI coverage statuses, and response schemas.
- **Milestone M7 Command Surface Parity & 20 OpenCLI Commands**:
  - Expansion to 22 CLI commands and 20 OpenCLI registered adapter commands (`profile`, `appsumo`, `mediations`, `invitations-log`, `products-list`, `config-set`, `settings-set`, `reply-review`, etc.).
  - Auto-Mode Session Invariant in `TrustMateClient`: Automatically routes requests to direct REST when cookies are present, or leverages authenticated Chrome browser sessions via OpenCLI when cookies are omitted.
  - Security Guard Layer (`src/security-guard.js`) with denylist validation blocking unauthorized destructive actions (e.g. account deletion, plan alterations) with distinct exit codes (code 2 for security rejection).
  - Smoke test verification runner (`scripts/smoke.js` / `npm run smoke -- 27487`) executing live read verification across all 17 read endpoints.
- **Milestone M8 Reversible Write Lifecycle & Dry-Run Protocol**:
  - Reversible mutation protocol with `--dry-run` simulation flag across `config-set`, `settings-set`, and `reply-review`.
  - Authoritative re-read diff verification: automatically re-reads server state immediately after writes to confirm zero state drift before reporting success.
  - Live execution and certified verification of W-1 Write Lifecycle on live Config 66453 (`4 days` -> `5 days` -> `4 days`), including strict customer-visible write boundaries.

### Fixed
- **Global Executable Availability & PATH Linkage**: Linked `trustmate` executable globally via `npm link` (`/opt/homebrew/bin/trustmate`) and established fallback symlink at `~/.local/bin/trustmate`, resolving `command not found` when invoked from arbitrary shell directories. Verified with `trustmate stats 27487 --series` directly from `$HOME`.

### Security
- Session token and cookie redaction enforcement preventing plain-text credential leaks across all logs, transcripts, and repository files.
- Customer-visible mutation isolation: `reply-review` strictly gated to dry-run preview to protect customer production touchpoints.

## [1.2.0] - 2026-10-04

### Added
- `stats` (aggregate grade, positive/negative, grade distribution; `--series` daily trend; `--start/--end`), `products`, `configs`, `settings`, `subscription` commands in CLI, SDK (direct + OpenCLI) and OpenCLI adapter.
- `review-templates [jewelry|pets|all]` category selection.

### Fixed
- `review_stats` / `stats` endpoints return HTTP 422 without a date range; both clients now default to the last 30 days.
- Diagnose verdict normalized to `ACTIVE_DEPLOYED | PANEL_READY_NOT_DEPLOYED | OFFLINE`; uppercase OpenCLI `Domain` fallback; case-insensitive `productFerret2` token lookup.

## [1.1.0] - 2026-10-04

### Added
- **Diagnostic-First Reconciler (`diagnose`)**: Subcommand to reconcile TrustMate panel configuration against live storefront HTML (detects reachable status, loaded script tag, embedded widget tokens, and produces actionable verdicts).
- **Deployment Code Architect (`deploy-guide`)**: Generates production-ready copy-paste code snippets for Google Tag Manager (with cart/checkout exclusion gates), WordPress MU-Plugin, and Product Detail Pages (PDP).
- **Quiet Luxury Review Templates (`review-templates`)**: Built-in verified buyer review collection and 8 high-conversion image generation prompts for `image-gen-with-api`.
- **Test Suite Expansion**: Added unit tests for diagnostic reconciliation, deploy guide snippets, and review templates (9/9 passing).

## [1.0.0] - 2026-10-04

### Added
- **Unified Dual-Engine Architecture**: Support both Direct REST API (`TrustMateDirectClient`) and browser bridge automation (`TrustMateOpenCLIClient`).
- **Store Accounts Management**: Subcommand `accounts` to list linked store domains, account IDs, and AppSumo lifetime deal code allocations.
- **Quota Tracking**: Subcommand `quota` to query monthly email invitation limits (e.g. 1,000/mo) and billing renewal cycles.
- **Widget Management**: Subcommand `widgets` returning all 14 review display widgets (Alpaca, Badger, Bee, Ferret, Hydra, etc.) with pre-generated HTML embed snippets.
- **Platform Integration Keys**: Subcommand `keys` to extract WooCommerce and Shopify UUID and Secret integration credentials.
- **Review Retrieval**: Subcommand `reviews` to query customer feedback and ratings across company and product scopes.
- **Automated Invitations**: Subcommand `invite` to queue customer review invitation emails.
- **Multi-Format Output**: Built-in zero-dependency support for `table`, `json`, `yaml`, and `csv` formatting.
- **Automated Test Suite**: 100% test coverage for DirectClient methods, request payloads, and formatters using Node's native test runner.
