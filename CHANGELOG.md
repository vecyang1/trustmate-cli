# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
