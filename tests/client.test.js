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
    // Ensure calm tone: no exclamation hype
    assert.ok(!item.headline.includes('!'), `Headline contains '!': ${item.headline}`);
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
  }
});
