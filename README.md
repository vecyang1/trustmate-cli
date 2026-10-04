# TrustMate CLI

> **Agentic CLI & Programmatic Client for TrustMate.io**  
> Manage customer reviews, display widgets, invitation quotas, store configurations, dispute mediations, and WooCommerce/Shopify platform keys programmatically or via AI agent workflows.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/vecyang1/trustmate-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Pass-brightgreen?style=for-the-badge)](tests/)
[![OpenCLI Validated](https://img.shields.io/badge/OpenCLI-20%20Commands%20Valid-blue?style=for-the-badge)](https://github.com/vecyang1/trustmate-cli)

---

> [!IMPORTANT]
> **AI-Native Engineering Provenance / 人工智能原生工程溯源**  
> This project was architected, reverse-engineered, implemented, and verified using **Antigravity**. It eliminates manual browser clicking by reverse-engineering TrustMate's internal SPA endpoints into a production-grade dual-engine CLI and programmatic JavaScript SDK.

---

## ⚡ Overview & Capabilities

TrustMate.io is a popular customer review and reputation management platform. However, official APIs are restricted to high-tier plans, and managing multiple stores across e-commerce platforms requires tedious browser interactions.

**TrustMate CLI** provides:
- **Dual-Engine Architecture**:
  - **Direct REST Engine**: Communicates directly with `/panel/api/*` using session cookies for headless CI/CD, scripts, and serverless runtimes.
  - **OpenCLI Browser Bridge**: Automatically connects to your authenticated Chrome browser session via OpenCLI with zero manual cookie extraction.
- **Auto-Mode Session Invariant**: Seamlessly routes requests to direct REST when cookies are present, or leverages the active OpenCLI browser session when credentials are omitted.
- **Comprehensive Command Surface**: 22 CLI commands and 20 registered OpenCLI adapter subcommands covering accounts, quotas, widgets, reviews, stats, mediations, catalog, invitation configs, and store settings.
- **Reversible Write Lifecycle & Dry-Run Protocol**: Mutation commands (`config-set`, `settings-set`, `reply-review`) feature a `--dry-run` simulation flag and authoritative post-write re-read diff checks.
- **Security Guard Layer**: Strictly enforces denylist validation, blocking unauthorized destructive actions (e.g. account deletion, plan changes) with dedicated exit codes.
- **Agent-Ready Output**: Supports `--format json`, `yaml`, `csv`, and formatted terminal tables out of the box with zero external dependencies.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │   TrustMate CLI / SDK     │
                                  └─────────────┬─────────────┘
                                                │
                                    Auto-Mode Resolution
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │    Direct REST Client     │                     │   OpenCLI Browser Bridge  │
          │   (src/direct-client.js)  │                     │   (src/opencli-client.js) │
          └─────────────┬─────────────┘                     └─────────────┬─────────────┘
                        │                                                 │
                        │ HTTP (Cookie/CSRF)                              │ OpenCLI CDP Session
                        ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │   TrustMate Panel APIs    │                     │   Active Browser Session  │
          │     /panel/api/*          │                     │   (trustmate.io/en/panel) │
          └───────────────────────────┘                     └───────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/vecyang1/trustmate-cli.git && cd trustmate-cli

# 2. Global Installation (expose `trustmate` in terminal PATH)
npm link
# Or ensure ~/.local/bin fallback: ln -sf /opt/homebrew/bin/trustmate ~/.local/bin/trustmate

# 3. Test installation & view help from any directory
trustmate --help

# 4. Run automated unit tests (27/27 pass)
npm test

# 5. Run live smoke test across all 17 read commands on active store
npm run smoke -- 27487
```

---

## 💻 CLI Commands (22 Commands)

| Command | Category | Description | Access |
|---|---|---|---|
| `accounts` | Accounts | List all connected store accounts, domains, and AppSumo plan allocations | Read |
| `profile` | Operator | Display authenticated user profile, operator email, company, and permissions | Read |
| `appsumo [id]` | Licensing | Display AppSumo LTD tier limits, activated license codes, and store allocations | Read |
| `subscription [id]` | Billing | View current subscription plan, active status, expiration date, and add-ons | Read |
| `keys [id]` | Integration | Retrieve WooCommerce / Shopify installation UUID and Secret integration credentials | Read |
| `quota [id]` | Quotas | View monthly invitation quotas, allowance usage, and active billing period | Read |
| `invitations-log [id]`| History | View automated review invitation dispatch ledger, recipient delivery, and timestamps | Read |
| `invite [id]` | Dispatch | Queue an automated customer review invitation email (`--email`, `--name`, `--delay`) | Write |
| `configs [id]` | Config | List invitation configurations (email & instant) with delay and reminder timing | Read |
| `config-set <acct> <id>`| Config | Update invitation schedule/timing (`--send-after`, `--dry-run`) with authoritative diff | Write |
| `settings [id]` | Settings | View store configuration, instant reviews status, and notification alert recipients | Read |
| `settings-set <acct>` | Settings | Update store settings (`--instant-reviews`, `--notification-email`, `--dry-run`) | Write |
| `widgets [id]` | Widgets | List all 14 review display widgets with pre-generated HTML embed code snippets | Read |
| `reviews [id]` | Feedback | Fetch customer reviews across company and product scopes (`--type company\|product`) | Read |
| `stats [id]` | Analytics | View aggregate review metrics, rating distribution, and NPS (`--series` for trend) | Read |
| `reply-review <id>` | Moderation | Post public reply to customer review (`--message`, `--dry-run`) | Write |
| `mediations [id]` | Disputes | List customer dispute / mediation tickets, status, and metrics (`--stats`, `--settings`) | Read |
| `products [id]` | Catalog | List store products tracked in TrustMate for product reviews | Read |
| `products-list [id]` | Catalog | List full store product catalog with SKUs, categories, and review counts | Read |
| `diagnose [id]` | Audit | Reconcile live storefront HTML against TrustMate panel config (`--site <url>`) | Audit |
| `deploy-guide [id]` | Deployment | Generate copy-paste deployment snippets for GTM, WordPress, and PDP | Generator |
| `review-templates [cat]`| Personas | Get authentic customer review templates and 8K visual photography prompts | Generator |

---

## 🔒 Reversible Write Lifecycle & Dry-Run Protocol

To eliminate operational risk and prevent accidental mutations on live e-commerce stores, all write subcommands implement strict reversibility and dry-run safety guarantees:

### 1. Dry-Run Simulation (`--dry-run`)
Simulates the mutation with zero server side-effects, generating a full diff preview of baseline vs planned values and printing the exact command required to revert:
```bash
# Preview invitation delay change without touching live servers
trustmate config-set 27487 66453 --send-after 5 --dry-run
```
Output:
```text
======================================================================
[DRY RUN] PREVIEW OF PLANNED MUTATION (ZERO HTTP WRITES)
======================================================================
Target Account : 27487
Configuration  : #66453
Endpoint       : PUT /panel/api/invitation_config/66453
----------------------------------------------------------------------
Field           Baseline / Current       Mutated / Desired        Status
--------------  -----------------------  -----------------------  ----------
sendAfter       4                        5                        MODIFIED  
----------------------------------------------------------------------
Revert Command : trustmate config-set 27487 66453 --send-after 4
======================================================================
```

### 2. Authoritative Post-Write Verification
When executed live, TrustMate CLI automatically performs an authoritative re-read against the panel API immediately following the write, certifying that the server accepted the change without state drift:
```bash
# Execute live mutation with authoritative verification
trustmate config-set 27487 66453 --send-after 5
```
Output:
```text
======================================================================
[MUTATION VERIFIED] AUTHORITATIVE RE-READ CONFIRMATION
======================================================================
Target Account : 27487
Configuration  : #66453
Endpoint       : PUT /panel/api/invitation_config/66453
----------------------------------------------------------------------
Field           Baseline / Current       Mutated / Desired        Status
--------------  -----------------------  -----------------------  ----------
sendAfter       4                        5                        VERIFIED  
----------------------------------------------------------------------
Revert Command : trustmate config-set 27487 66453 --send-after 4
======================================================================
```

### 3. Immediate Reversibility
Restoring original baseline settings is as simple as running the emitted revert command:
```bash
# Revert back to original baseline (4 days)
trustmate config-set 27487 66453 --send-after 4
```

### 4. Customer-Visible Boundary Protection
Customer-facing mutations (`reply-review`) are protected from accidental execution. Use `--dry-run` to preview review response payloads safely.

---

## 🌐 OpenCLI Integration (20 Adapter Commands)

TrustMate CLI is fully integrated with OpenCLI as a first-class browser automation adapter located at `~/.opencli/clis/trustmate`.

```bash
# Validate all 20 adapter subcommands
opencli validate trustmate

# Execute commands directly through OpenCLI
opencli trustmate accounts -f json
opencli trustmate quota 27487 -f table
opencli trustmate stats 27487 --series -f json
opencli trustmate mediations 27487 -f json
opencli trustmate config-set 27487 66453 --send-after 5 --dry-run
```

---

## 📦 Programmatic SDK Usage

```javascript
import { TrustMateClient } from 'trustmate-cli';

// Auto-mode: uses TRUSTMATE_COOKIE if present, otherwise leverages active OpenCLI Chrome session
const client = new TrustMateClient({
  cookie: process.env.TRUSTMATE_COOKIE // optional
});

// 1. Fetch store accounts
const accounts = await client.getAccounts();
const accountId = accounts[0].id;

// 2. Inspect quotas
const quota = await client.getQuota(accountId);
console.log(`Invitations used: ${quota.used} / ${quota.limit}`);

// 3. Inspect invitation timing configurations
const configs = await client.getInvitationConfigs(accountId);

// 4. Preview configuration change safely (dry-run)
const preview = await client.updateInvitationConfig(accountId, configs[0].id, {
  sendAfter: 5,
  dryRun: true
});
console.log('Revert command:', preview.revertCommand);

// 5. Diagnose storefront against panel configuration
const audit = await client.diagnose({
  accountId,
  siteUrl: 'https://store.example.com'
});
console.log('Verdict:', audit.verdict); // ACTIVE_DEPLOYED | PANEL_READY_NOT_DEPLOYED | OFFLINE
```

---

## 🧪 Testing & Verification Battery

The project maintains a rigorous, multi-layered verification battery:

```bash
# 1. Native Unit Test Suite (27 tests, 100% pass)
npm test

# 2. OpenCLI Adapter Validation (20 commands, 0 errors, 0 warnings)
opencli validate trustmate

# 3. Live Smoke Test (17 read commands executed against live account)
npm run smoke -- 27487

# 4. Open-Source Publish Sanitization Audit (0 findings)
# Run repository sanitization audit gate:
audit_repo_publish.py --repo . --staged --history --check-license

# 5. Zero Secret Leak Grep
grep -rnE "(TRPSSID|TM_REMEMBER_ME|csrf[-_]?token)[=:\" ]+[A-Za-z0-9%_\-]{16,}" . evidence scripts src bin tests .agents
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2026 Vec Yang `<vecyang1@users.noreply.github.com>`.
