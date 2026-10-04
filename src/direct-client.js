/**
 * TrustMate Direct REST API Client
 * Interacts directly with TrustMate.io internal panel REST endpoints.
 */

export class TrustMateDirectClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseUrl='https://trustmate.io']
   * @param {string} [options.cookie] - Session cookie string (or process.env.TRUSTMATE_COOKIE)
   * @param {string} [options.csrfToken] - Optional CSRF token
   * @param {typeof fetch} [options.fetch=globalThis.fetch]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.TRUSTMATE_BASE_URL || 'https://trustmate.io').replace(/\/+$/, '');
    this.cookie = options.cookie || process.env.TRUSTMATE_COOKIE || '';
    this.csrfToken = options.csrfToken || process.env.TRUSTMATE_CSRF_TOKEN || '';
    this.fetch = options.fetch || globalThis.fetch;
  }

  /**
   * Internal request helper
   * @param {string} path
   * @param {RequestInit} [init]
   * @returns {Promise<any>}
   */
  async request(path, init = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': 'TrustMate-CLI/1.0.0',
      ...(this.cookie ? { 'Cookie': this.cookie } : {}),
      ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
      ...(init.headers || {})
    };

    const response = await this.fetch(url, {
      ...init,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      const errorMsg = typeof body === 'object' && body !== null ? JSON.stringify(body) : String(body);
      throw new Error(`TrustMate API error (${response.status} ${response.statusText}): ${errorMsg}`);
    }

    return body;
  }

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser() {
    return await this.request('/panel/api/user/current');
  }

  /**
   * List all store accounts linked to the user
   */
  async getAccounts() {
    const data = await this.request('/panel/api/account');
    return data.items || [];
  }

  /**
   * Get AppSumo codes activated for an account
   * @param {number|string} accountId
   */
  async getAppSumoCodes(accountId) {
    return await this.request(`/panel/api/account/${accountId}/appsumo/codes`);
  }

  /**
   * Get AppSumo tier info for an account
   * @param {number|string} accountId
   */
  async getAppSumoTier(accountId) {
    return await this.request(`/panel/api/account/${accountId}/appsumo/tier`);
  }

  /**
   * Get monthly invitation quota and usage for an account
   * @param {number|string} accountId
   */
  async getQuota(accountId) {
    return await this.request(`/panel/api/account/${accountId}/invitations/quota`);
  }

  /**
   * List all display widgets available for an account
   * @param {number|string} accountId
   */
  async getWidgets(accountId) {
    const data = await this.request(`/panel/api/account/${accountId}/widget`);
    return (data.items || []).map(w => ({
      id: w.id,
      name: w.name,
      type: w.type,
      token: w.token,
      microdata: Boolean(w.microdata),
      embedSnippet: `<div id="${w.token}"></div>\n<script defer src="https://trustmate.io/widget/api/${w.token}/script"></script>`
    }));
  }

  /**
   * Get e-commerce platform installation keys (WooCommerce / Shopify)
   * @param {number|string} accountId
   */
  async getPlatformKeys(accountId) {
    const data = await this.request(`/panel/api/account/${accountId}/platforms/installation_key`);
    return data.configuration || {};
  }

  /**
   * Get company or product reviews
   * @param {number|string} accountId
   * @param {Object} [options]
   * @param {'company'|'product'} [options.type='company']
   */
  async getReviews(accountId, { type = 'company' } = {}) {
    const endpoint = type === 'product'
      ? `/panel/api/account/${accountId}/product/review`
      : `/panel/api/account/${accountId}/reviews`;
    const data = await this.request(endpoint);
    return data.items || [];
  }

  /**
   * List invitation email configurations
   * @param {number|string} accountId
   */
  async getInvitationConfigs(accountId) {
    const data = await this.request(`/panel/api/account/${accountId}/invitation_config`);
    return data.items || [];
  }

  /**
   * Queue an automated customer review invitation
   * @param {number|string} configId
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.name
   * @param {number|null} [params.delay=0]
   */
  async queueInvitation(configId, { email, name, delay = 0 }) {
    if (!email) throw new Error('Email is required to queue an invitation');
    if (!name) throw new Error('Recipient name is required to queue an invitation');

    const payload = {
      invitations: [
        {
          sendTo: email,
          name: name
        }
      ],
      delay: delay === null ? null : Number(delay)
    };

    return await this.request(`/panel/api/invitation_config/${configId}/queue_invitations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}
