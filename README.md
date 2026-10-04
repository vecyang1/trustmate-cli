# TrustMate CLI

> **Agentic CLI & Programmatic Client for TrustMate.io**  
> Manage customer reviews, display widgets, invitation quotas, and WooCommerce/Shopify platform keys programmatically or via AI agent workflows.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/vecyang1/trustmate-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Pass-brightgreen?style=for-the-badge)](tests/)

---

> [!IMPORTANT]
> **AI-Native Engineering Provenance / 人工智能原生工程溯源**  
> This project was architected, reverse-engineered, implemented, and verified using **Antigravity**. It eliminates manual browser clicking by reverse-engineering TrustMate's internal SPA endpoints into a production-grade dual-engine CLI and programmatic JavaScript SDK.

---

## ⚡ Overview & Problem Solved

TrustMate.io is a popular customer review and reputation management platform. However:
1. **Public API Gate**: The official Integration and Display APIs are locked behind high-tier enterprise plans on lifetime and AppSumo deals.
2. **Repetitive Browser Operations**: Managing multiple stores, checking 1,000 monthly invitation allowances, retrieving widget embed codes, and extracting WooCommerce platform keys typically requires manual panel clicking.

**TrustMate CLI** bridges this gap by providing:
- **Dual-Engine Operation**:
  - **Direct REST Engine**: Seamlessly communicates directly with `/panel/api/*` using session cookies or tokens for serverless and headless CI/CD environments.
  - **OpenCLI Browser Bridge**: Automatically connects to your existing authenticated Chrome session via OpenCLI with zero credential extraction needed.
- **Agent-Ready Output**: Supports `--format json`, `yaml`, `csv`, and formatted terminal tables out of the box with zero external dependencies.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │   TrustMate CLI / SDK     │
                                  └─────────────┬─────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │    Direct REST Client     │                     │   OpenCLI Browser Bridge  │
          │   (src/direct-client.js)  │                     │   (src/opencli-client.js) │
          └─────────────┬─────────────┘                     └─────────────┬─────────────┘
                        │                                                 │
                        │ HTTP (Cookie/CSRF)                              │ Chrome Extension Lease
                        ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │   TrustMate Panel APIs    │                     │   Active Browser Session  │
          │     /panel/api/*          │                     │   (trustmate.io/en/panel) │
          └───────────────────────────┘                     └───────────────────────────┘
```

---

## 📁 Project Structure

```text
.
├── .env.example              # Environment variables template
├── .gitignore                # Production ignore rules
├── CHANGELOG.md              # Semantic versioning ledger
├── LICENSE                   # MIT License
├── README.md                 # Documentation & showcase
├── bin/
│   └── trustmate.js          # Executable CLI binary
├── package.json              # Package manifest
├── src/
│   ├── direct-client.js      # Direct HTTP REST client for /panel/api/*
│   ├── formatters.js         # Zero-dependency table/json/yaml/csv formatters
│   ├── index.js              # Unified client export
│   └── opencli-client.js     # OpenCLI browser-bridge client adapter
└── tests/
    └── client.test.js        # Automated unit tests using node:test
```

---

## 🚀 Quick Start (<= 3 Commands)

```bash
# 1. Clone repository
git clone https://github.com/vecyang1/trustmate-cli.git && cd trustmate-cli

# 2. Test installation & view help
node bin/trustmate.js --help

# 3. Run automated tests
npm test
```

---

## 💻 CLI Usage & Commands

### 1. Store Accounts & AppSumo Code Allocation
List all connected store domains, account IDs, and subscription code allocations:
```bash
# Formatted table
node bin/trustmate.js accounts

# Machine-readable JSON
node bin/trustmate.js accounts -f json
```

### 2. Monthly Invitation Quotas
View monthly customer invitation allowances and billing period renewal dates:
```bash
node bin/trustmate.js quota <account-id>
```

### 3. Review Display Widgets & Embed Snippets
Extract all 14 review widgets (Alpaca, Badger, Bee, Ferret, Hydra, etc.) complete with tokens and ready-to-paste HTML embed scripts:
```bash
node bin/trustmate.js widgets <account-id> -f table
```

### 4. E-commerce Integration Keys
Retrieve WooCommerce or Shopify installation UUID and Secret key:
```bash
node bin/trustmate.js keys <account-id>
```

### 5. Fetch Reviews
Query customer reviews across company or product scopes:
```bash
# Company reviews
node bin/trustmate.js reviews <account-id> --type company

# Product reviews
node bin/trustmate.js reviews <account-id> --type product
```

### 6. Queue Review Invitations
Queue automated customer review email requests:
```bash
node bin/trustmate.js invite <account-id> \
  --email customer@example.com \
  --name "Jane Doe" \
  --delay 3
```

---

## 📦 Programmatic SDK Usage

```javascript
import { TrustMateClient } from 'trustmate-cli';

// Initialize with session cookie or let it auto-detect OpenCLI browser session
const client = new TrustMateClient({
  cookie: process.env.TRUSTMATE_COOKIE
});

// 1. Fetch store accounts
const accounts = await client.getAccounts();
console.log('Stores:', accounts);

// 2. Fetch widgets for store
const widgets = await client.getWidgets(accounts[0].id);
console.log('Widgets:', widgets);

// 3. Queue review invitation
await client.queueInvitation({
  configId: 101,
  email: 'customer@example.com',
  name: 'Jane Doe',
  delay: 2
});
```

---

## 🧪 Testing & Verification

The suite runs on Node's native test runner (`node:test`) with zero external dependencies:

```bash
npm test
```

Test coverage includes:
- Direct HTTP REST request routing and headers
- Payload serialization and validation
- Widget token parsing and HTML script tag generation
- Table, YAML, JSON, and CSV formatter compliance

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2026 Vec Yang `<vecyang1@users.noreply.github.com>`.
