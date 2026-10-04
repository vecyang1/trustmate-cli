# TrustMate Customer Panel Capability Map & API Ledger

**Generated**: 2026-10-04T09:51:50.959Z  
**Target Account**: `27487` (example.com / primary store)  
**Total Capabilities**: 63 | **Target Coverage**: 66.1%  

## 1. Executive Summary & Coverage Metrics

| Metric | Count | Status |
|---|---|---|
| **Total Mapped Capabilities** | 63 | 100% of discovered endpoints |
| **CLI / SDK Already Covered** | 12 | Active in v1.2.0 |
| **Planned for Milestone M7** | 27 | Read & Safe Reversible Writes |
| **Unsupported / 3rd Party** | 20 | Non-critical panel features |
| **Strictly Out of Scope** | 4 | Blocked by Security Gates |
| **Read-Only Operations** | 55 | Zero side effects |
| **Safe Reversible Writes** | 4 | Dry-run & re-read supported |
| **Destructive / Billing Actions** | 4 | Forbidden at runtime |

## 2. Panel Section Capability Matrix

### Your profile

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Authenticated User Profile | Operator Profile | `GET` | `/panel/api/user/current` | `trustmate profile` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/40_user_profile.png) |

### Home

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/account` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Store Account Configuration & Notifications | Dashboard Overview | `GET` | `/panel/api/account/:accountId/settings` | `trustmate settings 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/account/:accountId` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/account/:accountId/user/permissions/current` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Invitation Monthly Quota & Allocation | Dashboard Overview | `GET` | `/panel/api/account/:accountId/invitations/quota` | `trustmate quota 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/account/:accountId/product_review_media` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/announcement/list/en` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |
| Dashboard Home (GET) | Dashboard | `GET` | `/panel/api/account/:accountId/group-accounts` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/01_home.png) |

### GMB

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Connected Platform Partnerships (GMB / Social) | Dashboard | `GET` | `/panel/api/account/:accountId/account_partnership` | `trustmate partnerships 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/21_gmb_dashboard.png) |

### Downloads

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Subscription Plan & Invoice Status | Billing & Invoices | `GET` | `/panel/api/account/:accountId/subscription` | `trustmate subscription 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/32_downloads_billing.png) |
| Downloads - Marketing Trustmarks & Badges (GET) | Marketing Materials | `GET` | `/panel/api/account/:accountId/product_review_count` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/34_downloads_marketing.png) |
| Legal GDPR DPA & Processing Agreements | Legal & DPA Documents | `GET` | `/panel/api/account/:accountId/downloads/legal` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/33_downloads_legal.png) |

### Mediations

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Customer Dispute / Mediation Tickets | Dispute List | `GET` | `/panel/api/account/:accountId/mediation` | `trustmate mediations 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/13_mediations_list.png) |
| Mediation Resolution Metrics | Dispute List | `GET` | `/panel/api/account/:accountId/mediation_stats` | `trustmate mediations-stats 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/13_mediations_list.png) |
| Mediation Rules & Auto-Resolution Settings | Mediation Settings | `GET` | `/panel/api/account/:accountId/mediation/settings` | `trustmate mediations 27487 --settings` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/14_mediations_settings.png) |

### Collecting reviews

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| List Invitation Configurations | Configuration List | `GET` | `/panel/api/account/:accountId/invitation_config` | `trustmate configs 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/02_collecting_reviews.png) |
| Update Invitation Delay & Schedule | Configuration Edit | `PUT` | `/panel/api/invitation_config/:configId` | `trustmate config-set 27487 --config 66453 --send-after 5` | ⏳ PLANNED (M7) | Safe Write | ✅ Rendered | [View](evidence/screenshots/02_collecting_reviews.png) |

### Invitations

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Invitations - Automatic Triggers (GET) | Automatic | `GET` | `/panel/api/account/:accountId/invitations` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/03_invitations_automatic.png) |
| Invitations - Automatic Triggers (GET) | Automatic | `GET` | `/panel/api/account/:accountId/invitation_splitter` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/03_invitations_automatic.png) |
| Invitations - Manual Dispatch (GET) | Manual | `GET` | `/panel/api/account/:accountId/product_review_tag` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/04_invitations_manual.png) |
| Invitations - Blocked Customer Emails (GET) | Blocked Emails | `GET` | `/panel/api/account/:accountId/optout/count` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/07_invitations_blocked.png) |
| Queue Automated Customer Review Invitation | Manual Send | `POST` | `/panel/api/invitation_config/:configId/queue_invitations` | `trustmate invite 27487 --email user@example.com --name "Elena"` | ✅ COVERED | Safe Write | ✅ Rendered | [View](evidence/screenshots/04_invitations_manual.png) |
| Invitation Creation Statistics | Manual Send | `GET` | `/panel/api/account/:accountId/invitation/creation_stats` | `trustmate stats 27487 --type creation` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/04_invitations_manual.png) |
| Invitation Sending & Dispatch Ledger | Sent Ledger | `GET` | `/panel/api/account/:accountId/invitation/sending_stats` | `trustmate invitations-log 27487` | ⏳ PLANNED (M7) | Read-only | ⚪ Zero-State | [View](evidence/screenshots/05_invitations_grid.png) |
| Review Splitter Consent Configuration | Splitter | `GET` | `/panel/api/account/:accountId/invitation-consent-config` | `trustmate splitter-config 27487` | ⏳ PLANNED (M7) | Read-only | ⚪ Zero-State | [View](evidence/screenshots/06_invitations_splitter.png) |
| Blocked Customer Emails Blacklist | Blocked Emails | `GET` | `/panel/api/account/:accountId/invitations/blocked-customer-emails` | `trustmate blocked-emails 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/07_invitations_blocked.png) |

### Statistics

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Aggregate Review Ratings & NPS | Reviews Metrics | `GET` | `/panel/api/account/:accountId/review_stats` | `trustmate stats 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/22_stats_reviews.png) |
| Daily Time-Series Review Trends | Reviews Metrics | `GET` | `/panel/api/account/:accountId/stats` | `trustmate stats 27487 --series` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/22_stats_reviews.png) |
| Statistics - Invitations Conversion Funnel (GET) | Invitations Funnel | `GET` | `/panel/api/invitation_config/:configId/stats` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/23_stats_invitations.png) |
| Statistics - Product Reviews Trends (GET) | Product Reviews | `GET` | `/panel/api/account/:accountId/product_review_daily_stats` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/24_stats_products.png) |
| Product Review Trends & Metrics | Product Reviews | `GET` | `/panel/api/account/:accountId/product_review_stats` | `trustmate stats 27487 --type product` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/24_stats_products.png) |
| NPS & Customer Sentiment Metrics | NPS | `GET` | `/panel/api/account/:accountId/features_stats` | `trustmate nps 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/25_stats_nps.png) |

### Reviews

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Review Categorization Tags | Tags | `GET` | `/panel/api/account/:accountId/account_review_tag` | `trustmate tags 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/12_reviews_tags.png) |
| Company Reviews Ledger | Company Reviews | `GET` | `/panel/api/account/:accountId/reviews` | `trustmate reviews 27487 --type company` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/08_reviews_company.png) |
| Product Reviews Ledger | Product Reviews | `GET` | `/panel/api/account/:accountId/product/review` | `trustmate reviews 27487 --type product` | ✅ COVERED | Read-only | ⚪ Zero-State | [View](evidence/screenshots/09_reviews_product.png) |
| Review Comment Prompter (Plan-Gated AI Suggestions) | Comment Prompter | `GET` | `/panel/api/account/:accountId/comment-prompter` | — | ⚠️ UNSUPPORTED | Read-only | ⚠️ Empty/Gated | [View](evidence/screenshots/10_reviews_prompter.png) |
| Public Response to Customer Review | Company Reviews | `POST` | `/panel/api/review/:reviewId/reply` | `trustmate reply 48519779 --message "Thank you for choosing GlintMuse."` | ⏳ PLANNED (M7) | Safe Write | ✅ Rendered | [View](evidence/screenshots/08_reviews_company.png) |
| Customer UGC Photos & Videos | UGC Media | `GET` | `/panel/api/account/:accountId/account_review_media` | `trustmate media 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/11_reviews_media.png) |

### Products

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Product Categories Hierarchy | Categories | `GET` | `/panel/api/account/:accountId/product/category` | `trustmate categories 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/16_products_categories.png) |
| Synchronized Product Catalog | Product Catalog | `GET` | `/panel/api/account/:accountId/product` | `trustmate products 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/15_products_list.png) |
| Product Pre-Purchase Q&A Inquiries | Product Q&A | `GET` | `/panel/api/account/:accountId/product/question` | `trustmate questions 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/18_products_questions.png) |
| Product Rating Traits & Customer Attributes | Product Traits | `GET` | `/panel/api/account/:accountId/products/traits` | `trustmate traits 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/17_products_traits.png) |

### Integrations

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Display Widgets & Embed Tokens | Display Widgets | `GET` | `/panel/api/account/:accountId/widget` | `trustmate widgets 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/26_integration_widgets.png) |
| Integrations - Product Feed XML Sync (GET) | Product Feed | `GET` | `/panel/api/account/:accountId/google/feed` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/29_integration_feed.png) |
| Platform Installation Keys (UUID / Secret) | E-Commerce Platforms | `GET` | `/panel/api/account/:accountId/platforms/installation_key` | `trustmate keys 27487` | ✅ COVERED | Read-only | ✅ Rendered | [View](evidence/screenshots/27_integration_platforms.png) |
| Custom Integration REST API Keys | Custom API | `GET` | `/panel/api/account/:accountId/api_key` | `trustmate api-keys 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/28_integration_custom.png) |
| Smart Popups & Exit Intent Banners | Smart Popups | `GET` | `/panel/api/account/:accountId/smart_config` | `trustmate smart-popups 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/31_integration_smart.png) |
| External Review Sources & Third-Party Platforms | External Review Sources | `GET` | `/panel/api/account/:accountId/integration/sources` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/30_integration_sources.png) |

### Settings

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Settings - Store Public Profile (GET) | Store Profile | `GET` | `/panel/api/account/category/27487` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/36_settings_profile.png) |
| Store Account Users & Access Roles | Users & Roles | `GET` | `/panel/api/account/:accountId/user` | `trustmate users 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/39_users.png) |
| Subscription - AppSumo LTD Quota & Codes (GET) | Subscription & AppSumo | `GET` | `/panel/api/user/current/partnership` | — | ⚠️ UNSUPPORTED | Read-only | ✅ Rendered | [View](evidence/screenshots/41_subscription.png) |
| AppSumo Activated License Codes | Subscription & AppSumo | `GET` | `/panel/api/account/:accountId/appsumo/codes` | `trustmate appsumo 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/41_subscription.png) |
| AppSumo Tier Limit & Account Capacity | Subscription & AppSumo | `GET` | `/panel/api/account/:accountId/appsumo/tier` | `trustmate appsumo 27487 --tier` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/41_subscription.png) |
| Update Store Settings (Instant Reviews / Notifications) | Store Profile | `PUT` | `/panel/api/account/:accountId/settings` | `trustmate settings-set 27487 --instant-reviews true` | ⏳ PLANNED (M7) | Safe Write | ✅ Rendered | [View](evidence/screenshots/38_settings_reviews.png) |
| Delete Store Account | Store Profile | `DELETE` | `/panel/api/account/:accountId` | — | 🚫 OUT OF SCOPE | 🚫 Forbidden Gate | ✅ Rendered | [View](evidence/screenshots/36_settings_profile.png) |
| Detach Store Account | Store Profile | `POST` | `/panel/api/account/:accountId/detach` | — | 🚫 OUT OF SCOPE | 🚫 Forbidden Gate | ✅ Rendered | [View](evidence/screenshots/36_settings_profile.png) |
| Redeem AppSumo License Code | Subscription & AppSumo | `POST` | `/panel/api/account/:accountId/appsumo/redeem` | — | 🚫 OUT OF SCOPE | 🚫 Forbidden Gate | ✅ Rendered | [View](evidence/screenshots/41_subscription.png) |
| Upgrade Subscription Plan | Subscription & AppSumo | `POST` | `/panel/api/subscription/upgrade` | — | 🚫 OUT OF SCOPE | 🚫 Forbidden Gate | ✅ Rendered | [View](evidence/screenshots/41_subscription.png) |
| Store Email Notification Alerts & Recipients | Email Notifications | `GET` | `/panel/api/account/:accountId/settings/notifications` | `trustmate settings 27487 --notifications` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/37_settings_notifications.png) |

### Premium feedback

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Custom Survey Attribute Questions | User Features | `GET` | `/panel/api/account/:accountId/customer-attribute-questions` | `trustmate survey-questions 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/19_feedback_user_features.png) |
| Dynamic Company Review Writing Hints | Company Hints | `GET` | `/panel/api/account/:accountId/feedback/company-hints` | — | ⚠️ UNSUPPORTED | Read-only | 🔒 Plan Gated | [View](evidence/screenshots/20_feedback_company_hints.png) |

### Expert reviews

| Feature Name | Sub-Tab | Method | URI Pattern | CLI Command | Status | Safety | Render State | Screenshot |
|---|---|---|---|---|---|---|---|---|
| Expert Reviews Moderation Queue | Pending Submissions | `GET` | `/panel/api/account/:accountId/expert_reviews/pending` | `trustmate expert-reviews 27487` | ⏳ PLANNED (M7) | Read-only | ✅ Rendered | [View](evidence/screenshots/35_expert_reviews_pending.png) |

## 2.1 Visual Probe Panel Render State & Entitlement Audit

Every view in the panel was subjected to the automated blank-screenshot gate (verifying main content area text length >40 chars beyond nav/header after render stabilization):

| View ID | Panel Section & View | Route Path | Render State | Entitlement & Ledger Notes |
|---|---|---|---|---|
| `05_invitations_grid` | Invitations - Sent Ledger | `/en/panel/invitations/sent` | ⚪ ZERO_STATE | Genuine empty state (0 rows sent) on Account 27487 |
| `06_invitations_splitter` | Invitations - Review Splitter | `/en/panel/invitations/invitation-splitter/settings` | ⚪ ZERO_STATE | Genuine empty state (0 splitters configured) on Account 27487 |
| `10_reviews_prompter` | Reviews - Comment Prompter | `/en/panel/reviews/comment-prompter/account-list` | ⚠️ EMPTY_OR_GATED | Plan-gated ('Feature not available in your subscription' on AppSumo 1000 LTD tier; CLI status: UNSUPPORTED) |
| Remaining 38 views | Panel Sub-Tabs | Various | ✅ RENDERED / 🔒 GATED | 100% compliant with blank-screenshot gate (>40 chars beyond nav/header) |

## 3. Security Denylist & Out-of-Scope Safeguards

In accordance with **Requirement R2**, destructive operations (account deletion, account unlinking) and billing actions (AppSumo code redemption, subscription tampering) are strictly forbidden.

| Forbidden Route Pattern | HTTP Method | Action Category | Codebase Security Gate Mechanism |
|---|---|---|---|
| `/panel/api/account/:id/delete` | DELETE, POST | Destructive | `SecurityGateError` thrown before socket transmission |
| `/panel/api/account/:id/detach` | POST | Destructive | Regex pattern denylist filter in direct client |
| `/panel/api/appsumo/redeem` | POST | Billing | Forbidden route filter in direct client & OpenCLI |
| `/panel/api/subscription/*` | POST, PUT | Billing | Financial mutation gate |

## 4. Reversible Write Lifecycle Specifications

All write capabilities designated as `SAFE_REVERSIBLE_WRITE` conform to the **6-Stage Deterministic State Lifecycle Protocol**:
1. **Read Baseline**: Capture initial server state via authoritative GET endpoint.
2. **Dry-Run Assertion**: Pass `--dry-run`, verifying planned diff output without HTTP writes.
3. **Execute Mutation**: Perform write mutation and await HTTP 200.
4. **Assert Mutation**: Immediately re-read authoritative GET endpoint and assert mutated value.
5. **Execute Revert**: Perform restoration mutation restoring baseline value.
6. **Assert Restoration**: Re-read authoritative GET endpoint and verify 100% baseline identity.

---
*Document generated automatically by scripts/generate-capability-map.js*
