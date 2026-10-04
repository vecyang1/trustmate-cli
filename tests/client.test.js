import test from 'node:test';
import assert from 'node:assert/strict';
import { TrustMateDirectClient } from '../src/direct-client.js';
import { formatOutput } from '../src/formatters.js';

test('TrustMateDirectClient - constructor options and defaults', () => {
  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com/',
    cookie: 'session=abc123xyz',
    csrfToken: 'csrf_test_token'
  });

  assert.equal(client.baseUrl, 'https://api.example.com');
  assert.equal(client.cookie, 'session=abc123xyz');
  assert.equal(client.csrfToken, 'csrf_test_token');
});

test('TrustMateDirectClient - getAccounts', async () => {
  const mockFetch = async (url, options) => {
    assert.match(url, /\/panel\/api\/account$/);
    assert.equal(options.headers['Cookie'], 'session=mock_cookie');
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          { id: 101, name: 'Store One', domain: 'shop1.example.com' },
          { id: 102, name: 'Store Two', domain: 'shop2.example.com' }
        ]
      })
    };
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    cookie: 'session=mock_cookie',
    fetch: mockFetch
  });

  const accounts = await client.getAccounts();
  assert.equal(accounts.length, 2);
  assert.equal(accounts[0].domain, 'shop1.example.com');
});

test('TrustMateDirectClient - getWidgets transforms embed snippets', async () => {
  const mockFetch = async (url) => {
    assert.match(url, /\/panel\/api\/account\/101\/widget$/);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          { id: 1, name: 'Badge Alpaca', type: 'alpaca', token: 'tok_alpaca_123', microdata: 1 },
          { id: 2, name: 'Carousel Bee', type: 'bee', token: 'tok_bee_456', microdata: 0 }
        ]
      })
    };
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    fetch: mockFetch
  });

  const widgets = await client.getWidgets(101);
  assert.equal(widgets.length, 2);
  assert.equal(widgets[0].token, 'tok_alpaca_123');
  assert.equal(widgets[0].microdata, true);
  assert.match(widgets[0].embedSnippet, /https:\/\/trustmate\.io\/widget\/api\/tok_alpaca_123\/script/);
});

test('TrustMateDirectClient - getQuota', async () => {
  const mockFetch = async (url) => {
    assert.match(url, /\/panel\/api\/account\/101\/invitations\/quota$/);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        quota: 1000,
        used: 24,
        available: 976
      })
    };
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    fetch: mockFetch
  });

  const quota = await client.getQuota(101);
  assert.equal(quota.quota, 1000);
  assert.equal(quota.available, 976);
});

test('TrustMateDirectClient - queueInvitation validation and payload', async () => {
  let capturedBody = null;
  const mockFetch = async (url, options) => {
    assert.match(url, /\/panel\/api\/invitation_config\/555\/queue_invitations$/);
    assert.equal(options.method, 'POST');
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, queued: 1 })
    };
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    fetch: mockFetch
  });

  // Test missing parameters
  await assert.rejects(
    async () => await client.queueInvitation(555, { email: '', name: 'Test' }),
    /Email is required/
  );

  await assert.rejects(
    async () => await client.queueInvitation(555, { email: 'user@example.com', name: '' }),
    /Recipient name is required/
  );

  // Test successful queue
  const res = await client.queueInvitation(555, {
    email: 'user@example.com',
    name: 'Alice Example',
    delay: 2
  });

  assert.equal(res.success, true);
  assert.deepEqual(capturedBody, {
    invitations: [
      { sendTo: 'user@example.com', name: 'Alice Example' }
    ],
    delay: 2
  });
});

test('Formatters - formatOutput across json, yaml, csv, table', () => {
  const sample = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'member' }
  ];

  const jsonOut = formatOutput(sample, 'json');
  assert.match(jsonOut, /"Alice"/);

  const yamlOut = formatOutput(sample, 'yaml');
  assert.match(yamlOut, /name: Alice/);

  const csvOut = formatOutput(sample, 'csv');
  assert.match(csvOut, /id,name,role/);
  assert.match(csvOut, /1,Alice,admin/);

  const tableOut = formatOutput(sample, 'table');
  assert.match(tableOut, /Alice/);
  assert.match(tableOut, /admin/);
});

import { diagnoseSite } from '../src/diagnose.js';
import { generateDeployGuide } from '../src/deploy-guide.js';
import { getReviewTemplates } from '../src/review-templates.js';

test('diagnoseSite - reconciles live storefront with panel', async () => {
  const mockClient = {
    getAccounts: async () => [
      { id: 201, domain: 'shop.example.com', url: 'https://shop.example.com' }
    ],
    getQuota: async () => ({ granted: 1000, used: 5, remaining: 995 }),
    getWidgets: async () => [
      { id: 1, name: 'Edge Badge', type: 'muskrat2', token: 'tok_muskrat_abc' },
      { id: 2, name: 'Popup', type: 'alpaca', token: 'tok_alpaca_def' }
    ],
    getPlatformKeys: async () => ({ uuid: 'mock_uuid_123' }),
    getReviews: async () => [{ id: 1, rating: 5, body: 'Superb piece' }]
  };

  // Test 1: Live site has widgets installed
  const mockFetchInstalled = async () => ({
    ok: true,
    status: 200,
    text: async () => `<html><body><div id="tok_muskrat_abc"></div><script src="https://trustmate.io/widget/api/tok_muskrat_abc/script"></script></body></html>`
  });

  const report1 = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://shop.example.com',
    fetchFn: mockFetchInstalled
  });

  assert.equal(report1.verdict, 'ACTIVE_DEPLOYED');
  assert.equal(report1.liveStatus.scriptDetected, true);
  assert.equal(report1.liveStatus.installedCount, 1);

  // Test 2: Live site has 0 widgets installed
  const mockFetchEmpty = async () => ({
    ok: true,
    status: 200,
    text: async () => `<html><body><h1>Welcome to Shop</h1></body></html>`
  });

  const report2 = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://shop.example.com',
    fetchFn: mockFetchEmpty
  });

  assert.equal(report2.verdict, 'PANEL_READY_NOT_DEPLOYED');
  assert.equal(report2.liveStatus.installedCount, 0);
  assert.ok(report2.recommendations.length > 0);
});

test('generateDeployGuide - generates snippets and placement plan', async () => {
  const mockClient = {
    getAccounts: async () => [
      { id: 201, domain: 'shop.example.com' }
    ],
    getWidgets: async () => [
      { id: 1, name: 'Badge', type: 'muskrat2', token: 'tok_muskrat' },
      { id: 2, name: 'Popup', type: 'alpaca', token: 'tok_alpaca' },
      { id: 3, name: 'Top Bar', type: 'bee', token: 'tok_bee' },
      { id: 4, name: 'Carousel', type: 'ferret2', token: 'tok_ferret' },
      { id: 5, name: 'Product Badge', type: 'badger2', token: 'tok_badger' },
      { id: 6, name: 'Product Carousel', type: 'productFerret2', token: 'tok_prod_ferret' },
      { id: 7, name: 'SEO Rich', type: 'jellyfish', token: 'tok_jelly' }
    ]
  };

  const guide = await generateDeployGuide(mockClient, 201);
  assert.equal(guide.domain, 'shop.example.com');
  assert.equal(guide.placementPlan.length, 7);

  // Assert GTM Tag contains checkout exclusion gate
  assert.match(guide.snippets.gtmTag, /\/checkout/);
  assert.match(guide.snippets.gtmTag, /tok_muskrat/);

  // Assert MU-Plugin contains is_checkout exclusion
  assert.match(guide.snippets.muPluginPhp, /is_checkout/);
  assert.match(guide.snippets.muPluginPhp, /tok_muskrat/);

  // Assert PDP snippets contain product rating badge and carousel
  assert.match(guide.snippets.pdp, /tok_badger/);
  assert.match(guide.snippets.pdp, /tok_prod_ferret/);
});

test('TrustMateDirectClient - getProducts, getSettings, and getSubscription', async () => {
  const mockFetch = async (url) => {
    if (url.includes('/panel/api/account/101/product')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          items: [
            { id: 501, name: 'Raw Amethyst Bracelet', sku: 'GM-BR-01' },
            { id: 502, name: 'Golden Citrine Ring', sku: 'GM-RG-02' }
          ]
        })
      };
    }
    if (url.includes('/panel/api/account/101/settings')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 101,
          email_notifications: true,
          alert_recipients: ['team@example.com']
        })
      };
    }
    if (url.includes('/panel/api/account/101/subscription')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          items: [
            { plan_name: 'AppSumo 1000 LTD', status: 'active', expires_at: null }
          ]
        })
      };
    }
    throw new Error(`Unexpected url: ${url}`);
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    fetch: mockFetch
  });

  // Parameter validation
  await assert.rejects(async () => await client.getProducts(), /accountId is required/);
  await assert.rejects(async () => await client.getSettings(), /accountId is required/);
  await assert.rejects(async () => await client.getSubscription(), /accountId is required/);

  const products = await client.getProducts(101);
  assert.equal(products.length, 2);
  assert.equal(products[0].sku, 'GM-BR-01');

  const settings = await client.getSettings(101);
  assert.equal(settings.email_notifications, true);
  assert.equal(settings.alert_recipients[0], 'team@example.com');

  const sub = await client.getSubscription(101);
  assert.equal(sub.plan_name, 'AppSumo 1000 LTD');
  assert.equal(sub.status, 'active');
});

test('TrustMateDirectClient - getReviewStats and getTimeSeriesStats with date parameters', async () => {
  let statsUrl = null;
  let seriesUrl = null;
  const mockFetch = async (url) => {
    if (url.includes('/review_stats')) {
      statsUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ average_grade: 4.95, reviews_count: 85, positive_ratio: 0.98 })
      };
    }
    if (url.includes('/stats')) {
      seriesUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ dates: ['2026-09-01', '2026-09-02'], ratings: [5, 5] })
      };
    }
    throw new Error(`Unexpected url: ${url}`);
  };

  const client = new TrustMateDirectClient({
    baseUrl: 'https://api.example.com',
    fetch: mockFetch
  });

  // Parameter validation
  await assert.rejects(async () => await client.getReviewStats(), /accountId is required/);
  await assert.rejects(async () => await client.getTimeSeriesStats(), /accountId is required/);

  // Test getReviewStats with explicit date filters
  const stats = await client.getReviewStats(101, {
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert.equal(stats.average_grade, 4.95);
  assert.match(statsUrl, /startDate=2026-09-01/);
  assert.match(statsUrl, /endDate=2026-09-30/);

  // Test getTimeSeriesStats with explicit date filters (snake_case query parameters)
  const series = await client.getTimeSeriesStats(101, {
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert.equal(series.dates.length, 2);
  assert.match(seriesUrl, /start_date=2026-09-01/);
  assert.match(seriesUrl, /end_date=2026-09-30/);
});

test('getReviewTemplates - returns authentic quiet luxury reviews with image prompts', () => {
  const templates = getReviewTemplates();
  assert.ok(templates.length >= 8);
  for (const item of templates) {
    assert.ok(item.author);
    assert.equal(item.rating, 5);
    assert.ok(item.headline);
    assert.ok(item.body);
    assert.ok(item.product);
    assert.ok(item.imagePrompt);
    // Ensure calm tone: no exclamation hype in headline or body
    assert.ok(!item.headline.includes('!'), `Headline contains '!': ${item.headline}`);
    assert.ok(!item.body.includes('!'), `Body contains '!': ${item.body}`);
  }

  // Test pet memorial review templates
  const petTemplates = getReviewTemplates('pets');
  assert.ok(petTemplates.length >= 4);
  for (const item of petTemplates) {
    assert.ok(item.author);
    assert.equal(item.rating, 5);
    assert.ok(item.headline);
    assert.ok(item.body);
    assert.ok(item.product);
    assert.ok(item.imagePrompt);
    assert.ok(!item.headline.includes('!'), `Headline contains '!': ${item.headline}`);
    assert.ok(!item.body.includes('!'), `Body contains '!': ${item.body}`);
  }
});

test('diagnoseSite - verdict normalization triad and network failure handling', async () => {
  const mockClient = {
    getAccounts: async () => [
      { Id: 201, Domain: 'store.example.com', sanitizedUrl: 'store.example.com' }
    ],
    getQuota: async () => ({ granted: 1000, used: 0, remaining: 1000 }),
    getWidgets: async () => [
      { id: 1, name: 'Edge Badge', type: 'muskrat2', token: 'tok_muskrat_abc' },
      { id: 2, name: 'Popup', type: 'alpaca', token: 'tok_alpaca_def' }
    ],
    getPlatformKeys: async () => ({ uuid: 'mock_uuid_123' }),
    getReviews: async () => []
  };

  // Case A: ACTIVE_DEPLOYED (live DOM has scripts & embedded widgets)
  const mockFetchActive = async () => ({
    ok: true,
    status: 200,
    text: async () => `<html><body><div id="tok_muskrat_abc"></div><script src="https://trustmate.io/widget/api/tok_muskrat_abc/script"></script></body></html>`
  });
  const resActive = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://store.example.com',
    fetchFn: mockFetchActive
  });
  assert.equal(resActive.verdict, 'ACTIVE_DEPLOYED');
  assert.equal(resActive.liveStatus.siteReachable, true);
  assert.equal(resActive.liveStatus.installedCount, 1);
  assert.equal(resActive.domain, 'store.example.com');
  assert.match(resActive.liveStatus.details, /verified in live DOM/i);

  // Case B: PANEL_READY_NOT_DEPLOYED (live DOM reachable, but 0 scripts/widgets)
  const mockFetchEmpty = async () => ({
    ok: true,
    status: 200,
    text: async () => `<html><body><h1>Welcome to Store</h1></body></html>`
  });
  const resEmpty = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://store.example.com',
    fetchFn: mockFetchEmpty
  });
  assert.equal(resEmpty.verdict, 'PANEL_READY_NOT_DEPLOYED');
  assert.equal(resEmpty.liveStatus.siteReachable, true);
  assert.equal(resEmpty.liveStatus.installedCount, 0);
  assert.ok(resEmpty.recommendations.some(r => r.includes('deploy-guide')));

  // Case C: PANEL_READY_NOT_DEPLOYED (base script detected, but 0 widgets)
  const mockFetchScriptOnly = async () => ({
    ok: true,
    status: 200,
    text: async () => `<html><head><script src="https://trustmate.io/widget/api/script"></script></head><body>No widgets</body></html>`
  });
  const resScriptOnly = await diagnoseSite(mockClient, {
    accountId: 201,
    fetchFn: mockFetchScriptOnly
  });
  assert.equal(resScriptOnly.verdict, 'PANEL_READY_NOT_DEPLOYED');
  assert.equal(resScriptOnly.liveStatus.scriptDetected, true);
  assert.equal(resScriptOnly.liveStatus.installedCount, 0);
  assert.match(resScriptOnly.liveStatus.details, /Base script detected/i);

  // Case D: OFFLINE on network error (fetch throws exception)
  const mockFetchNetworkError = async () => {
    throw new Error('fetch failed: ECONNREFUSED');
  };
  const resNetworkErr = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://store.example.com',
    fetchFn: mockFetchNetworkError
  });
  assert.equal(resNetworkErr.verdict, 'OFFLINE');
  assert.equal(resNetworkErr.liveStatus.siteReachable, false);
  assert.equal(resNetworkErr.liveStatus.statusCode, null);
  assert.match(resNetworkErr.message, /could not be reached/i);
  assert.match(resNetworkErr.liveStatus.details, /failed/i);

  // Case E: OFFLINE on HTTP 503 / 500 error status
  const mockFetch503 = async () => ({
    ok: false,
    status: 503,
    text: async () => 'Service Unavailable'
  });
  const res503 = await diagnoseSite(mockClient, {
    accountId: 201,
    siteUrl: 'https://store.example.com',
    fetchFn: mockFetch503
  });
  assert.equal(res503.verdict, 'OFFLINE');
  assert.equal(res503.liveStatus.siteReachable, false);
  assert.equal(res503.liveStatus.statusCode, 503);
});

test('diagnoseSite - OpenCLI Domain uppercase fallback', async () => {
  const mockClient = {
    getAccounts: async () => [
      { Id: 301, Domain: 'opencli-shop.example.com' }
    ],
    getQuota: async () => ({ granted: 1000, used: 0, remaining: 1000 }),
    getWidgets: async () => [],
    getPlatformKeys: async () => ({}),
    getReviews: async () => []
  };

  const mockFetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '<html><body>Shop</body></html>'
  });

  const res = await diagnoseSite(mockClient, {
    accountId: 301,
    fetchFn: mockFetch
  });

  assert.equal(res.domain, 'opencli-shop.example.com');
  assert.equal(res.verdict, 'PANEL_READY_NOT_DEPLOYED');
});

test('generateDeployGuide - case-insensitive productFerret2 token resolution without fallback degradation', async () => {
  const mockClient = {
    getAccounts: async () => [
      { id: 201, domain: 'shop.example.com' }
    ],
    getWidgets: async () => [
      { id: 1, name: 'Badge', type: 'muskrat2', token: 'tok_muskrat' },
      { id: 2, name: 'Popup', type: 'alpaca', token: 'tok_alpaca' },
      { id: 3, name: 'Top Bar', type: 'bee', token: 'tok_bee' },
      { id: 4, name: 'Carousel', type: 'ferret2', token: 'tok_ferret_company' },
      { id: 5, name: 'Product Badge', type: 'badger2', token: 'tok_badger' },
      // Index 5 deliberately contains a DIFFERENT widget to catch false fallback
      { id: 99, name: 'Unrelated Widget', type: 'owl2', token: 'tok_wrong_fallback_99' },
      { id: 6, name: 'Product Carousel', type: 'ProductFerret2', token: 'tok_prod_ferret_target' },
      { id: 7, name: 'SEO Rich', type: 'jellyfish', token: 'tok_jelly' }
    ]
  };

  const guide = await generateDeployGuide(mockClient, 201);
  assert.equal(guide.domain, 'shop.example.com');

  // Verify PDP snippet uses the exact productFerret2 token, NOT the index 5 fallback
  assert.match(guide.snippets.pdp, /tok_prod_ferret_target/);
  assert.doesNotMatch(guide.snippets.pdp, /tok_wrong_fallback_99/);

  // Verify placement plan contains all 7 placements with correct tokens
  assert.equal(guide.placementPlan.length, 7);
  const pdpItem = guide.placementPlan.find(p => p.location.includes('Product Page Reviews List'));
  assert.ok(pdpItem, 'Product Page Reviews List placement must exist');
  assert.equal(pdpItem.token, 'tok_prod_ferret_target');

  // Verify comprehensive checkout exclusion gates in GTM and MU-Plugin
  assert.match(guide.snippets.gtmTag, /wcf-checkout/);
  assert.match(guide.snippets.gtmTag, /order-received/);
  assert.match(guide.snippets.gtmTag, /surecart_checkout/);

  assert.match(guide.snippets.muPluginPhp, /is_order_received_page/);
  assert.match(guide.snippets.muPluginPhp, /wcf_is_checkout_step/);
  assert.match(guide.snippets.muPluginPhp, /surecart_checkout/);
});

test('getReviewTemplates - adheres strictly to 0-exclamation-mark constraint across headlines and bodies', () => {
  const categories = ['jewelry', 'pets', 'all'];

  for (const cat of categories) {
    const templates = getReviewTemplates(cat);
    assert.ok(templates.length >= (cat === 'all' ? 12 : cat === 'pets' ? 4 : 8));

    for (const item of templates) {
      assert.ok(item.author, `Template ${item.id} missing author`);
      assert.equal(item.rating, 5, `Template ${item.id} must be 5-star`);
      assert.ok(item.headline, `Template ${item.id} missing headline`);
      assert.ok(item.body, `Template ${item.id} missing body`);
      assert.ok(item.product, `Template ${item.id} missing product`);
      assert.ok(item.imagePrompt, `Template ${item.id} missing imagePrompt`);

      // Strict 0-exclamation-mark constraint across BOTH headline and body
      assert.doesNotMatch(
        item.headline,
        /!/,
        `Template ${item.id} headline contains exclamation mark: "${item.headline}"`
      );
      assert.doesNotMatch(
        item.body,
        /!/,
        `Template ${item.id} body contains exclamation mark: "${item.body}"`
      );

      // Verify 8K editorial image prompt keywords
      assert.match(
        item.imagePrompt,
        /(editorial|photography|lighting|macro|35mm|8k|shot|photo)/i,
        `Template ${item.id} imagePrompt lacks editorial photography keywords: "${item.imagePrompt}"`
      );
    }
  }
});

