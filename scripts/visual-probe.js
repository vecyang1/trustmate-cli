/**
 * scripts/visual-probe.js
 * 
 * Automated Visual Panel Probe & Endpoint Mapper for TrustMate.io
 * Milestone M6 (Visual Panel Probe & Capability Map)
 * 
 * Execution:
 *   ego-browser nodejs < scripts/visual-probe.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuration & Target Roster
// ---------------------------------------------------------------------------

const TARGET_ACCOUNT_ID = process.env.TRUSTMATE_ACCOUNT_ID || '27487'; // default account
const BASE_ORIGIN = 'https://trustmate.io';
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const SCREENSHOT_DIR = path.join(REPO_ROOT, 'evidence/screenshots');
const NETWORK_DIR = path.join(REPO_ROOT, 'evidence/network');

const SENSITIVE_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'authorization',
  'proxy-authorization',
  'x-csrf-token',
  'csrf-token'
]);

// Master 41-View Target Matrix covering all 13 left-nav sections and sub-tabs
export const PROBE_VIEWS = [
  { id: '01_home', section: 'Home', subTab: 'Dashboard', path: '/en/panel', name: 'Dashboard Home' },
  { id: '02_collecting_reviews', section: 'Collecting reviews', subTab: 'Config List', path: '/en/panel/collecting-reviews', name: 'Collecting Reviews Configurations' },
  { id: '03_invitations_automatic', section: 'Invitations', subTab: 'Automatic', path: '/en/panel/invitations/automatic', name: 'Invitations - Automatic Triggers' },
  { id: '04_invitations_manual', section: 'Invitations', subTab: 'Manual', path: '/en/panel/invitations/manual', name: 'Invitations - Manual Dispatch' },
  { id: '05_invitations_grid', section: 'Invitations', subTab: 'Grid', path: '/en/panel/invitations/sent', name: 'Invitations - Sent Grid Ledger' },
  { id: '06_invitations_splitter', section: 'Invitations', subTab: 'Splitter', path: '/en/panel/invitations/invitation-splitter/settings', name: 'Invitations - Review Splitter' },
  { id: '07_invitations_blocked', section: 'Invitations', subTab: 'Blocked Emails', path: '/en/panel/invitations/blocked-customer-emails', name: 'Invitations - Blocked Customer Emails' },
  { id: '08_reviews_company', section: 'Reviews', subTab: 'Company Reviews', path: '/en/panel/reviews/company', name: 'Reviews - Company Reviews' },
  { id: '09_reviews_product', section: 'Reviews', subTab: 'Product Reviews', path: '/en/panel/reviews/product', name: 'Reviews - Product Reviews' },
  { id: '10_reviews_prompter', section: 'Reviews', subTab: 'Comment Prompter', path: '/en/panel/reviews/comment-prompter/account-list', name: 'Reviews - Comment Prompter' },
  { id: '11_reviews_media', section: 'Reviews', subTab: 'UGC Media', path: '/en/panel/reviews/company-media', name: 'Reviews - UGC Photo & Video Media' },
  { id: '12_reviews_tags', section: 'Reviews', subTab: 'Tags', path: '/en/panel/reviews/tags/company', name: 'Reviews - Categorization Tags' },
  { id: '13_mediations_list', section: 'Mediations', subTab: 'Dispute List', path: '/en/panel/mediations/list', name: 'Mediations - Dispute List' },
  { id: '14_mediations_settings', section: 'Mediations', subTab: 'Settings', path: '/en/panel/mediations/settings', name: 'Mediations - Settings & Auto-Rules' },
  { id: '15_products_list', section: 'Products', subTab: 'Catalog List', path: '/en/panel/products/product-list', name: 'Products - Catalog List' },
  { id: '16_products_categories', section: 'Products', subTab: 'Categories', path: '/en/panel/products/categories', name: 'Products - Categories' },
  { id: '17_products_traits', section: 'Products', subTab: 'Traits', path: '/en/panel/products/product-traits', name: 'Products - Rating Traits & Attributes' },
  { id: '18_products_questions', section: 'Products', subTab: 'Product Q&A', path: '/en/panel/products/questions', name: 'Products - Pre-Purchase Q&A' },
  { id: '19_feedback_user_features', section: 'Premium feedback', subTab: 'User Features', path: '/en/panel/feedback/user-features', name: 'Premium Feedback - Questionnaire Attributes' },
  { id: '20_feedback_company_hints', section: 'Premium feedback', subTab: 'Company Hints', path: '/en/panel/feedback/company-hints', name: 'Premium Feedback - Dynamic Writing Hints' },
  { id: '21_gmb_dashboard', section: 'GMB', subTab: 'Dashboard', path: '/en/panel/gmb/dashboard', name: 'GMB Masters - Google Business Profile' },
  { id: '22_stats_reviews', section: 'Statistics', subTab: 'Reviews Metrics', path: '/en/panel/stats/reviews', name: 'Statistics - Reviews Metrics & Ratings' },
  { id: '23_stats_invitations', section: 'Statistics', subTab: 'Invitations Funnel', path: '/en/panel/stats/invitations', name: 'Statistics - Invitations Conversion Funnel' },
  { id: '24_stats_products', section: 'Statistics', subTab: 'Product Reviews', path: '/en/panel/stats/product-reviews', name: 'Statistics - Product Reviews Trends' },
  { id: '25_stats_nps', section: 'Statistics', subTab: 'NPS', path: '/en/panel/stats/nps', name: 'Statistics - Net Promoter Score (NPS)' },
  { id: '26_integration_widgets', section: 'Integrations', subTab: 'Display Widgets', path: '/en/panel/integration/widgets', name: 'Integrations - Display Widgets Catalog' },
  { id: '27_integration_platforms', section: 'Integrations', subTab: 'E-Commerce Platforms', path: '/en/panel/integration/platforms', name: 'Integrations - E-Commerce Platforms & Keys' },
  { id: '28_integration_custom', section: 'Integrations', subTab: 'Custom API', path: '/en/panel/integration/custom', name: 'Integrations - Custom API Script' },
  { id: '29_integration_feed', section: 'Integrations', subTab: 'Product Feed', path: '/en/panel/integration/feed', name: 'Integrations - Product Feed XML Sync' },
  { id: '30_integration_sources', section: 'Integrations', subTab: 'External Sources', path: '/en/panel/integration/review-sources', name: 'Integrations - External Review Sources' },
  { id: '31_integration_smart', section: 'Integrations', subTab: 'Smart Popups', path: '/en/panel/integration/smart', name: 'Integrations - Smart Popups & Banners' },
  { id: '32_downloads_billing', section: 'Downloads', subTab: 'Billing & Invoices', path: '/en/panel/downloads/billing', name: 'Downloads - Billing & Invoices' },
  { id: '33_downloads_legal', section: 'Downloads', subTab: 'Legal Documents', path: '/en/panel/downloads/legal', name: 'Downloads - Legal GDPR DPA' },
  { id: '34_downloads_marketing', section: 'Downloads', subTab: 'Marketing Materials', path: '/en/panel/downloads/marketing-materials', name: 'Downloads - Marketing Trustmarks & Badges' },
  { id: '35_expert_reviews_pending', section: 'Expert reviews', subTab: 'Pending Submissions', path: '/en/panel/expert-reviews/pending', name: 'Expert Reviews - Pending Submissions' },
  { id: '36_settings_profile', section: 'Settings', subTab: 'Store Profile', path: '/en/panel/settings/profile', name: 'Settings - Store Public Profile' },
  { id: '37_settings_notifications', section: 'Settings', subTab: 'Notifications', path: '/en/panel/settings/notifications', name: 'Settings - Alert Notifications' },
  { id: '38_settings_reviews', section: 'Settings', subTab: 'Review Automation', path: '/en/panel/settings/reviews', name: 'Settings - Review Automation & Instant Reviews' },
  { id: '39_users', section: 'Settings', subTab: 'Users & Roles', path: '/en/panel/users', name: 'Settings - Users & Roles' },
  { id: '40_user_profile', section: 'Your profile', subTab: 'Operator Profile', path: '/en/panel/user-profile', name: 'Your Profile - Operator Account' },
  { id: '41_subscription', section: 'Settings', subTab: 'Subscription & AppSumo', path: '/en/panel/payments/subscription', name: 'Subscription - AppSumo LTD Quota & Codes' }
];

// In-memory sensitive values store (strictly never saved to disk)
const sensitiveTokens = new Set();

// ---------------------------------------------------------------------------
// Security & Redaction Engine
// ---------------------------------------------------------------------------

function registerSensitiveToken(val) {
  if (typeof val === 'string' && val.length >= 8) {
    sensitiveTokens.add(val);
  }
}

function sanitizeHeaders(headers = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(k.toLowerCase())) {
      clean[k] = '<redacted>';
    } else {
      clean[k] = typeof v === 'string' ? redactString(v) : v;
    }
  }
  return clean;
}

function redactString(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  for (const token of sensitiveTokens) {
    if (token && token.length >= 8 && out.includes(token)) {
      out = out.split(token).join('<redacted>');
    }
  }
  // Redact any email matching operator identity
  out = out.replace(/123hxsmyxh@gmail\.com/gi, '<operator-email>');
  return out;
}

function redactDeep(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return redactString(val);
  }
  if (Array.isArray(val)) {
    return val.map(redactDeep);
  }
  if (typeof val === 'object') {
    const copy = {};
    for (const [k, v] of Object.entries(val)) {
      const lowerKey = k.toLowerCase();
      if (
        lowerKey.includes('cookie') ||
        lowerKey.includes('csrf') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password')
      ) {
        copy[k] = '<redacted>';
      } else {
        copy[k] = redactDeep(v);
      }
    }
    return copy;
  }
  return val;
}

function assertZeroSensitiveLeaks(contentStr) {
  for (const token of sensitiveTokens) {
    if (token && token.length >= 8 && contentStr.includes(token)) {
      throw new Error(`CRITICAL SECURITY GATE FAILURE: Sensitive token detected in content intended for disk.`);
    }
  }
}

function inferJsonShape(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'array(empty)';
    return `array(${inferJsonShape(val[0])})`;
  }
  if (typeof val === 'object') {
    const shape = {};
    for (const key of Object.keys(val).slice(0, 15)) {
      shape[key] = inferJsonShape(val[key]);
    }
    return shape;
  }
  return typeof val;
}

function normalizeEndpointPattern(pathname) {
  return pathname
    .replace(/\/account\/\d+/, '/account/:accountId')
    .replace(/\/invitation_config\/\d+/, '/invitation_config/:configId')
    .replace(/\/widget\/\d+/, '/widget/:widgetId')
    .replace(/\/product\/\d+/, '/product/:productId')
    .replace(/\/reviews?\/\d+/, (m) => m.includes('reviews') ? '/reviews/:reviewId' : '/review/:reviewId')
    .replace(/\/mediation\/\d+/, '/mediation/:mediationId');
}

// ---------------------------------------------------------------------------
// Auth Resolver (Zero-Disk Invariant)
// ---------------------------------------------------------------------------

async function getAuthCookies() {
  // Query status to find active extension context
  const statusRes = await fetch('http://localhost:19825/status', {
    headers: { 'X-OpenCLI': '1' }
  });
  if (!statusRes.ok) {
    throw new Error(`OpenCLI daemon status error (HTTP ${statusRes.status}). Verify port 19825.`);
  }
  const statusData = await statusRes.json();
  const contextId = statusData.contextId || (statusData.profiles && statusData.profiles[0]?.contextId);

  const daemonRes = await fetch('http://localhost:19825/command', {
    method: 'POST',
    headers: {
      'X-OpenCLI': '1',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 'probe_session_auth',
      action: 'cookies',
      session: 'default',
      url: 'https://trustmate.io',
      ...(contextId ? { contextId } : {})
    })
  });

  if (!daemonRes.ok) {
    throw new Error(`OpenCLI daemon cookie error (HTTP ${daemonRes.status}).`);
  }

  const payload = await daemonRes.json();
  const cookies = payload.data || [];

  const trps = cookies.find(c => c.name === 'TRPSSID');
  const rem = cookies.find(c => c.name === 'TM_REMEMBER_ME');
  if (!trps || !rem) {
    throw new Error('Could not find authenticated session cookies in Chrome Profile 2.');
  }

  // Register in memory sensitive token store for zero-leak audit
  for (const c of cookies) {
    if (['TRPSSID', 'TM_REMEMBER_ME', 'csrf-token'].includes(c.name)) {
      registerSensitiveToken(c.value);
    }
  }

  return cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain || '.trustmate.io',
    path: c.path || '/',
    secure: c.secure !== false,
    httpOnly: Boolean(c.httpOnly)
  }));
}

// ---------------------------------------------------------------------------
// Stabilization Guard
// ---------------------------------------------------------------------------

async function waitForSpaStable(page, expectedPath = null, timeoutMs = 15000) {
  const start = Date.now();
  let stableTicks = 0;

  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate((expected) => {
      const currentPath = window.location.pathname;
      const pathMatched = !expected || currentPath === expected || currentPath.startsWith(expected);
      const loading = Boolean(document.querySelector('[data-testid="loading-screen"]'));
      const spinners = document.querySelectorAll('.spinner, .loading, .v-loading, [role=progressbar], .ant-spin, .loader').length;
      const textLen = document.body ? document.body.innerText.trim().length : 0;
      return { pathMatched, currentPath, loading, spinners, textLen };
    }, expectedPath);

    if (state.pathMatched && !state.loading && state.spinners === 0 && state.textLen > 50) {
      stableTicks++;
      if (stableTicks >= 2) {
        await page.waitForTimeout(800);
        return true;
      }
    } else {
      stableTicks = 0;
    }

    await page.waitForTimeout(400);
  }

  return false;
}

// ---------------------------------------------------------------------------
// CLI Argument Parser
// ---------------------------------------------------------------------------

async function parseCliArgs() {
  const args = process.argv.slice(2);
  let selectedViews = null;
  let blankCheckOnly = false;
  let accountId = TARGET_ACCOUNT_ID;

  // Check optional config file for ego-browser stdin mode
  const configPath = path.join(REPO_ROOT, 'scripts/.probe_targets.json');
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.views) && parsed.views.length > 0) {
      selectedViews = new Set(parsed.views);
    }
    if (parsed.blankCheckOnly) {
      blankCheckOnly = Boolean(parsed.blankCheckOnly);
    }
    if (parsed.accountId) {
      accountId = String(parsed.accountId);
    }
  } catch (_) {
    // Config not present; fall back to args / defaults
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--views' && args[i + 1]) {
      const val = args[++i];
      selectedViews = val === 'all' ? null : new Set(val.split(',').map(s => s.trim()));
    } else if (arg.startsWith('--views=')) {
      const val = arg.slice('--views='.length);
      selectedViews = val === 'all' ? null : new Set(val.split(',').map(s => s.trim()));
    } else if (arg === '--blank-check') {
      blankCheckOnly = true;
    } else if (arg === '--account' && args[i + 1]) {
      accountId = args[++i];
    } else if (arg.startsWith('--account=')) {
      accountId = arg.slice('--account='.length);
    }
  }

  return { selectedViews, blankCheckOnly, accountId };
}

// ---------------------------------------------------------------------------
// Main Probe Execution
// ---------------------------------------------------------------------------

export async function runVisualProbe() {
  const { selectedViews, blankCheckOnly, accountId } = await parseCliArgs();
  const effectiveAccountId = accountId || TARGET_ACCOUNT_ID;
  const targetViews = selectedViews
    ? PROBE_VIEWS.filter(v => selectedViews.has(v.id))
    : PROBE_VIEWS;

  console.log(`=== Starting TrustMate Panel Visual Probe (Milestone M6) ===`);
  console.log(`[MODE] Mode: ${blankCheckOnly ? 'BLANK-CHECK AUDIT ONLY' : 'FULL VISUAL PROBE'}`);
  console.log(`[TARGET] Target Account: ${effectiveAccountId}, Views: ${targetViews.length} of ${PROBE_VIEWS.length}`);

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await fs.mkdir(NETWORK_DIR, { recursive: true });

  // 1. Resolve Auth (Process Memory Only)
  console.log('[AUTH] Resolving authenticated session cookies from OpenCLI daemon...');
  const cdpCookies = await getAuthCookies();
  console.log(`[AUTH] Successfully loaded ${cdpCookies.length} cookies in volatile memory.`);

  const userCookieName = process.env.TRUSTMATE_USER_COOKIE_NAME || ('https%3A%2F%2F' + (process.env.TARGET_DOMAIN || 'example.com') + '%2F-logged-in-user');
  cdpCookies.push({
    name: userCookieName,
    value: effectiveAccountId,
    domain: 'trustmate.io',
    path: '/',
    secure: true,
    httpOnly: false
  });

  // 2. Initialize ego-browser TaskSpace
  const task = await taskSpace('trustmate-probe');
  const page = task.page('p1');
  console.log(`[BROWSER] Attached to TaskSpace #${task.spaceId}, page: ${page.label}`);

  const allCapturedEndpoints = new Map();
  const gateAuditSummary = [];

  try {
    await page.cdp('Network.setCookies', { cookies: cdpCookies });
    await page.cdp('Network.enable');

    // Set standard Retina/Desktop viewport
    try {
      await page.cdp('Emulation.setDeviceMetricsOverride', {
        width: 1728,
        height: 1117,
        deviceScaleFactor: 2,
        mobile: false
      });
    } catch (_) {
      // Fallback
      await page.evaluate(() => window.resizeTo(1728, 1117));
    }

    console.log(`[ROSTER] Commencing probe across ${targetViews.length} panel views...`);

    for (let i = 0; i < targetViews.length; i++) {
      const view = targetViews[i];
      const targetUrl = `${BASE_ORIGIN}${view.path}?accountId=${effectiveAccountId}`;
      const screenshotFilename = `${view.id}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFilename);
      const networkLogPath = path.join(NETWORK_DIR, `${view.id}.network.json`);

      console.log(`\n[${i + 1}/${targetViews.length}] Probing: ${view.name} (${view.path})...`);

      // Drain buffer before navigation
      await page.events();

      // Navigate
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 35000 });

      // Wait for SPA stabilization and path verification
      const isStable = await waitForSpaStable(page, view.path, 15000);
      if (!isStable) {
        console.warn(`  [WARN] View did not settle completely within timeout; proceeding.`);
      }

      // Allow visual settle delay for micro-animations and data rendering
      await page.waitForTimeout(2000);

      // Blank-Screenshot Gate & Render-Settle Assertion
      let mainText = '';
      let renderState = 'RENDERED';
      let contentCheckPassed = false;
      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const evalResult = await page.evaluate(() => {
          let mainEl = document.querySelector('[class*="bmwJVJ"]') || document.querySelector('main');
          if (!mainEl) {
            const wrapper = document.querySelector('#root-panel > div > div');
            if (wrapper && wrapper.children.length >= 3) {
              mainEl = wrapper.children[2];
            }
          }
          const text = mainEl ? mainEl.innerText.trim() : '';
          const isGated = text.includes('Feature not available in your subscription') ||
                          text.includes('not available in your package') ||
                          (text.includes('Feature not available') && text.includes('upgrade'));
          const isZeroState = text.includes('No invitations found') ||
                              text.includes('No data to display') ||
                              text.includes('No reviews found') ||
                              text.includes('No products found') ||
                              text.includes('No configurations found') ||
                              text.includes('No questions found') ||
                              text.includes('No expert reviews found');
          return {
            text,
            isGated,
            isZeroState
          };
        });

        mainText = evalResult.text;
        if (evalResult.isGated) {
          renderState = 'FEATURE_GATED';
          contentCheckPassed = true;
          break;
        } else if (evalResult.isZeroState) {
          renderState = 'ZERO_STATE';
          contentCheckPassed = true;
          break;
        } else if (mainText.length > 40) {
          renderState = 'RENDERED';
          contentCheckPassed = true;
          break;
        }

        if (attempt < maxRetries) {
          console.log(`  [SETTLE WAIT] Main content innerText (${mainText.length} chars) <= 40, retrying settle (${attempt + 1}/${maxRetries})...`);
          await page.waitForTimeout(2000);
        }
      }

      if (!contentCheckPassed) {
        renderState = 'EMPTY_OR_GATED';
        console.warn(`  [GATE WARNING] View main content area has ${mainText.length} chars (<= 40)! Marked as EMPTY_OR_GATED.`);
      } else {
        console.log(`  [GATE PASSED] Main content: ${mainText.length} chars, state: ${renderState}`);
      }

      gateAuditSummary.push({
        id: view.id,
        name: view.name,
        path: view.path,
        charCount: mainText.length,
        renderState
      });

      // Capture screenshot
      await page.screenshot({ path: screenshotPath });
      console.log(`  [SCREENSHOT] Saved: ${screenshotFilename}`);

      if (blankCheckOnly) {
        try {
          const rawTrace = await fs.readFile(networkLogPath, 'utf8');
          const traceObj = JSON.parse(rawTrace);
          traceObj.renderState = renderState;
          traceObj.mainContentLength = mainText.length;
          if (traceObj.stats) {
            traceObj.stats.renderState = renderState;
            traceObj.stats.mainContentLength = mainText.length;
          }
          await fs.writeFile(networkLogPath, JSON.stringify(traceObj, null, 2), 'utf8');
        } catch (_) {}
        continue;
      }

      // Harvest CDP events
      const rawEvents = await page.events();
      const requestsMap = new Map();
      rawEvents
        .filter(e => e.method === 'Network.requestWillBeSent')
        .forEach(e => requestsMap.set(e.params.requestId, e.params.request));

      const apiResponses = rawEvents.filter(
        e => e.method === 'Network.responseReceived' && e.params.response.url.includes('/panel/api/')
      );

      const viewEndpoints = [];

      for (const resEvent of apiResponses) {
        const reqId = resEvent.params.requestId;
        const resInfo = resEvent.params.response;
        const reqInfo = requestsMap.get(reqId) || { method: 'GET', url: resInfo.url, headers: {} };
        const parsedUrl = new URL(resInfo.url);

        let responseBody = null;
        let responseSchema = null;

        try {
          const bodyData = await page.cdp('Network.getResponseBody', { requestId: reqId });
          if (bodyData && bodyData.body) {
            responseBody = JSON.parse(bodyData.body);
            responseSchema = inferJsonShape(responseBody);
          }
        } catch (_) {
          // Body retrieval might fail on redirected or canceled sub-requests
        }

        // Sanitize payloads
        const sanitizedResponseBody = redactDeep(responseBody);
        const sanitizedRequestBody = reqInfo.postData ? redactDeep(reqInfo.postData) : null;

        const endpointRecord = {
          requestId: reqId,
          method: reqInfo.method,
          url: redactString(resInfo.url),
          pathname: parsedUrl.pathname,
          normalizedPath: normalizeEndpointPattern(parsedUrl.pathname),
          responseStatus: resInfo.status,
          responseStatusText: resInfo.statusText,
          queryParams: Object.fromEntries(
            Array.from(parsedUrl.searchParams.entries()).map(([k, v]) => [k, redactString(v)])
          ),
          requestHeaders: sanitizeHeaders(reqInfo.headers),
          responseHeaders: sanitizeHeaders(resInfo.headers),
          requestBody: sanitizedRequestBody,
          responseBody: sanitizedResponseBody,
          responseSchema: responseSchema || { type: 'unknown' }
        };

        viewEndpoints.push(endpointRecord);

        // Record into global endpoint map
        const epKey = `${endpointRecord.method} ${endpointRecord.normalizedPath}`;
        if (!allCapturedEndpoints.has(epKey)) {
          allCapturedEndpoints.set(epKey, endpointRecord);
        }
      }

      // Write per-view network report
      const networkTraceDoc = {
        $schema: 'https://trustmate.io/schemas/network-trace-v1.json',
        targetId: view.id,
        targetName: view.name,
        panelSection: view.section,
        subTab: view.subTab,
        panelUrl: view.path,
        screenshotFile: screenshotFilename,
        capturedAt: new Date().toISOString(),
        targetAccountId: Number(effectiveAccountId),
        renderState,
        mainContentLength: mainText.length,
        stats: {
          totalNetworkRequests: rawEvents.length,
          apiRequestsCount: viewEndpoints.length,
          failedRequestsCount: viewEndpoints.filter(e => e.responseStatus >= 400).length,
          renderState,
          mainContentLength: mainText.length
        },
        endpoints: viewEndpoints
      };

      const serializedTrace = JSON.stringify(networkTraceDoc, null, 2);
      assertZeroSensitiveLeaks(serializedTrace);
      await fs.writeFile(networkLogPath, serializedTrace, 'utf8');

      console.log(`  [NETWORK] Captured ${viewEndpoints.length} API calls -> ${view.id}.network.json`);
    }

    console.log(`\n=================== BLANK-SCREENSHOT GATE AUDIT SUMMARY ===================`);
    console.log(`Total views processed: ${gateAuditSummary.length}`);
    for (const item of gateAuditSummary) {
      const mark = item.renderState === 'EMPTY_OR_GATED' ? '❌' : (item.renderState === 'FEATURE_GATED' ? '🔒' : (item.renderState === 'ZERO_STATE' ? '⚪' : '✅'));
      console.log(`  ${mark} [${item.id}] chars: ${String(item.charCount).padStart(5)} | state: ${item.renderState.padEnd(14)} | ${item.name}`);
    }
    const failedGate = gateAuditSummary.filter(item => item.renderState === 'EMPTY_OR_GATED');
    if (failedGate.length > 0) {
      console.warn(`\n[GATE SUMMARY ALERT] ${failedGate.length} view(s) failed the content gate (chars <= 40).`);
    } else {
      console.log(`\n[GATE SUCCESS] 100% of tested views passed the blank-screenshot gate!`);
    }

    console.log(`\n[SYNTHESIS] Visual probe loop completed successfully.`);
    if (!blankCheckOnly) {
      console.log(`  Total unique endpoints captured: ${allCapturedEndpoints.size}`);
    }

  } finally {
    // Zero-Orphan Space Hygiene Cleanup
    console.log('[CLEANUP] Closing browser space and releasing TaskSpace windows...');
    await task.finish({ keep: [] });
    console.log('[CLEANUP] Space closed cleanly. Zero orphan windows.');
  }

  console.log('\n=== Visual Probe Finished ===');
}

// Auto-run if executed in ego-browser nodejs
runVisualProbe().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
