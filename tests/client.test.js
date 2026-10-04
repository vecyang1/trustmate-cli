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
