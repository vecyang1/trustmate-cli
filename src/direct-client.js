/**
 * TrustMate Direct REST API Client
 * Interacts directly with TrustMate.io internal panel REST endpoints.
 */

import { assertSafeRoute, SecurityRouteDeniedError, SecurityGateError } from './security-guard.js';
import { VERSION } from './version.js';

export { SecurityRouteDeniedError, SecurityGateError };

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
   * Centralized Single Request Chokepoint (Anti-Fragmentation)
   * All API methods MUST route through this method.
   * @param {string} path
   * @param {RequestInit} [init]
   * @returns {Promise<any>}
   */
  async _request(path, init = {}) {
    const method = (init.method || 'GET').toUpperCase();
    const cleanPath = path.startsWith('http') ? new URL(path).pathname : path.split('?')[0];

    // Enforce Security Denylist Gate before opening socket
    assertSafeRoute(method, cleanPath);

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': `TrustMate-CLI/${VERSION}`,
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
   * Backward-compatible delegation to centralized chokepoint
   * @param {string} path
   * @param {RequestInit} [init]
   */
  async request(path, init = {}) {
    return await this._request(path, init);
  }

  // --- Latent & Profile Methods ---

  async getCurrentUser() {
    return await this._request('/panel/api/user/current');
  }

  async getUserProfile() {
    return await this.getCurrentUser();
  }

  async getAccounts() {
    const data = await this._request('/panel/api/account');
    return data.items || [];
  }

  async getAppSumoCodes(accountId) {
    if (!accountId) throw new Error('accountId is required to get AppSumo codes');
    const data = await this._request(`/panel/api/account/${accountId}/appsumo/codes`);
    return Array.isArray(data) ? data : (data.items || []);
  }

  async getAppSumoTier(accountId) {
    if (!accountId) throw new Error('accountId is required to get AppSumo tier');
    const data = await this._request(`/panel/api/account/${accountId}/appsumo/tier`);
    if (!data || typeof data !== 'object') {
      throw new Error(`Failed to retrieve AppSumo tier for account #${accountId}`);
    }
    return data;
  }

  async getAccountUsers(accountId) {
    if (!accountId) throw new Error('accountId is required to get account users');
    const data = await this._request(`/panel/api/account/${accountId}/user`);
    return data.items || [];
  }

  // --- Invitations, Splitters & Consent ---

  async getQuota(accountId) {
    if (!accountId) throw new Error('accountId is required to get quota');
    return await this._request(`/panel/api/account/${accountId}/invitations/quota`);
  }

  async getInvitationConfigs(accountId) {
    if (!accountId) throw new Error('accountId is required to get invitation configs');
    const data = await this._request(`/panel/api/account/${accountId}/invitation_config`);
    return (data && data.items) || (Array.isArray(data) ? data : []);
  }

  async getSentInvitations(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get sent invitations');
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || 'sentAt',
      order: options.order || 'DESC',
      status: options.status || 'sent',
      ...(options.sentAfter ? { sentAfter: options.sentAfter } : {}),
      ...(options.sentBefore ? { sentBefore: options.sentBefore } : {})
    });
    try {
      const data = await this._request(`/panel/api/account/${accountId}/invitations?${params.toString()}`);
      return data.items || [];
    } catch {
      const data = await this._request(`/panel/api/account/${accountId}/invitation?${params.toString()}`);
      return data.items || [];
    }
  }

  async getInvitationsLog(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get invitations log');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = options.startDate || past.toISOString().split('T')[0];
    const endDate = options.endDate || now.toISOString().split('T')[0];
    const params = new URLSearchParams({
      ...(options.limit ? { limit: String(options.limit) } : {}),
      ...(options.offset ? { offset: String(options.offset) } : {}),
      ...(options.status ? { status: options.status } : {})
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    try {
      const data = await this._request(`/panel/api/account/${accountId}/invitations${query}`);
      return (data && data.items) || (Array.isArray(data) ? data : []);
    } catch {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      const data = await this._request(`/panel/api/account/${accountId}/invitation/sending_stats?${params.toString()}`);
      return (data && data.items) || (Array.isArray(data) ? data : []);
    }
  }

  async getSplitters(accountId) {
    if (!accountId) throw new Error('accountId is required to get splitters');
    const data = await this._request(`/panel/api/account/${accountId}/invitation_splitter`);
    return data.items || [];
  }

  async getSplitterConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get splitter config');
    return await this._request(`/panel/api/account/${accountId}/invitation-consent-config`);
  }

  async getBlockedRecipients(accountId) {
    if (!accountId) throw new Error('accountId is required to get blocked recipients');
    const data = await this._request(`/panel/api/account/${accountId}/invitations/blocked-customer-emails`);
    return Array.isArray(data) ? data : (data.items || []);
  }

  async getInvitationCreationStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get invitation creation stats');
    return await this._request(`/panel/api/account/${accountId}/invitation/creation_stats`);
  }

  async queueInvitation(configId, { email, name, delay = 0 }) {
    if (!email) throw new Error('Email is required to queue an invitation');
    if (!name) throw new Error('Recipient name is required to queue an invitation');

    const payload = {
      invitations: [
        { sendTo: email, name: name }
      ],
      delay: delay === null ? null : Number(delay)
    };

    return await this._request(`/panel/api/invitation_config/${configId}/queue_invitations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Polymorphic update invitation config method.
   * Supports both:
   *   updateInvitationConfig(configId, data)
   *   updateInvitationConfig(accountId, configId, data)
   */
  async updateInvitationConfig(arg1, arg2, arg3) {
    let accountId = null;
    let configId = null;
    let data = {};

    if (arg3 !== undefined) {
      accountId = arg1;
      configId = arg2;
      data = arg3 || {};
    } else if (typeof arg2 === 'object' && arg2 !== null) {
      configId = arg1;
      data = arg2;
      accountId = data.accountId || null;
    } else {
      accountId = arg1;
      configId = arg2;
      data = {};
    }

    if (!configId) throw new Error('configId is required to update invitation config');

    const parseDays = (val) => {
      if (typeof val === 'number') return isNaN(val) ? undefined : val;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    // If accountId is provided, perform full authoritative pre-read & post-read verification
    if (accountId) {
      let configs;
      try {
        configs = await this.getInvitationConfigs(accountId);
      } catch (err) {
        throw new Error(`Failed to fetch baseline invitation configuration for account #${accountId}: ${err.message}`);
      }

      const current = Array.isArray(configs)
        ? configs.find(c => String(c.id ?? c.ConfigId ?? c.configId) === String(configId))
        : null;

      if (!current) {
        throw new Error(`Invitation config #${configId} not found for account #${accountId}`);
      }

      const baselineSendAfter = parseDays(current.sendAfter ?? current.send_after ?? current.SendAfter ?? current.delay);
      const baselineRemindAfter = parseDays(current.remindAfter ?? current.remind_after ?? current.RemindAfter);
      const rawAuto = current.automatic ?? current.Automatic;
      const baselineAutomatic = typeof rawAuto === 'boolean'
        ? rawAuto
        : (typeof rawAuto === 'string' ? (rawAuto.toLowerCase() === 'yes' || rawAuto === 'true') : undefined);

      const changes = [];
      const payload = {};

      if (data.sendAfter !== undefined) {
        const val = Number(data.sendAfter);
        payload.sendAfter = val;
        changes.push({
          field: 'sendAfter',
          currentValue: baselineSendAfter,
          plannedValue: val,
          previousValue: baselineSendAfter,
          status: 'MODIFIED'
        });
      }

      if (data.remindAfter !== undefined) {
        const val = Number(data.remindAfter);
        payload.remindAfter = val;
        changes.push({
          field: 'remindAfter',
          currentValue: baselineRemindAfter,
          plannedValue: val,
          previousValue: baselineRemindAfter,
          status: 'MODIFIED'
        });
      }

      if (data.automatic !== undefined) {
        payload.automatic = Boolean(data.automatic);
        changes.push({
          field: 'automatic',
          currentValue: baselineAutomatic,
          plannedValue: payload.automatic,
          previousValue: baselineAutomatic,
          status: 'MODIFIED'
        });
      }

      const revertCommand = baselineSendAfter !== undefined
        ? `trustmate config-set ${accountId} ${configId} --send-after ${baselineSendAfter}`
        : undefined;

      if (data.dryRun) {
        return {
          mode: 'DRY_RUN',
          dryRun: true,
          simulated: true,
          mutationsBlocked: true,
          action: 'UPDATE_INVITATION_CONFIG',
          resource: 'invitation_config',
          target: { accountId: Number(accountId), configId: Number(configId) },
          endpoint: { method: 'PUT', path: `/panel/api/invitation_config/${configId}` },
          changes,
          safetyVerdict: 'SAFE_REVERSIBLE_WRITE',
          revertCommand
        };
      }

      // Execute write mutation
      const res = await this._request(`/panel/api/invitation_config/${configId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Post-flight authoritative re-read
      let postConfigs;
      try {
        postConfigs = await this.getInvitationConfigs(accountId);
      } catch (err) {
        throw new Error(`Failed to re-read invitation configuration after mutation for account #${accountId}: ${err.message}`);
      }

      const verified = Array.isArray(postConfigs)
        ? postConfigs.find(c => String(c.id ?? c.ConfigId ?? c.configId) === String(configId))
        : null;

      const verifiedChanges = changes.map(ch => {
        let verifiedVal;
        if (verified) {
          if (ch.field === 'sendAfter') {
            verifiedVal = parseDays(verified.sendAfter ?? verified.send_after ?? verified.SendAfter ?? verified.delay);
          } else if (ch.field === 'remindAfter') {
            verifiedVal = parseDays(verified.remindAfter ?? verified.remind_after ?? verified.RemindAfter);
          } else if (ch.field === 'automatic') {
            const raw = verified.automatic ?? verified.Automatic;
            verifiedVal = typeof raw === 'boolean' ? raw : (typeof raw === 'string' ? (raw.toLowerCase() === 'yes' || raw === 'true') : undefined);
          } else {
            verifiedVal = verified[ch.field];
          }
        }

        const match = verifiedVal !== undefined
          ? (typeof ch.plannedValue === 'number' ? Number(verifiedVal) === Number(ch.plannedValue) : verifiedVal === ch.plannedValue)
          : false;

        return {
          field: ch.field,
          previousValue: ch.previousValue,
          verifiedValue: verifiedVal !== undefined ? verifiedVal : ch.plannedValue,
          match,
          status: match ? 'VERIFIED' : 'STATE_DRIFT'
        };
      });

      const allMatched = verifiedChanges.every(ch => ch.match);

      return {
        success: allMatched,
        status: allMatched ? 'VERIFIED_SUCCESS' : 'STATE_DRIFT_DETECTED',
        reReadVerified: allMatched,
        target: { accountId: Number(accountId), configId: Number(configId) },
        endpoint: { method: 'PUT', path: `/panel/api/invitation_config/${configId}` },
        changes: verifiedChanges,
        revertInstructions: revertCommand,
        result: res
      };
    }

    // Direct invocation without accountId
    if (data.dryRun) {
      return {
        dryRun: true,
        mode: 'DRY_RUN',
        action: 'UPDATE_INVITATION_CONFIG',
        configId: Number(configId),
        plannedMutation: {
          sendAfter: data.sendAfter !== undefined ? Number(data.sendAfter) : undefined,
          remindAfter: data.remindAfter !== undefined ? Number(data.remindAfter) : undefined,
          automatic: data.automatic !== undefined ? Boolean(data.automatic) : undefined
        }
      };
    }

    const payload = {
      ...(data.sendAfter !== undefined ? { sendAfter: Number(data.sendAfter) } : {}),
      ...(data.remindAfter !== undefined ? { remindAfter: Number(data.remindAfter) } : {}),
      ...(data.automatic !== undefined ? { automatic: Boolean(data.automatic) } : {})
    };

    const res = await this._request(`/panel/api/invitation_config/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    return { success: true, configId: Number(configId), result: res };
  }

  // --- Mediations ---

  async getMediations(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get mediations');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || 'updatedAt',
      order: options.order || 'DESC',
      createdAfter: options.createdAfter || past.toISOString().split('T')[0],
      createdBefore: options.createdBefore || now.toISOString().split('T')[0],
      ...(options.type ? { type: options.type } : {})
    });
    const data = await this._request(`/panel/api/account/${accountId}/mediation?${params.toString()}`);
    return (data && data.items) || (Array.isArray(data) ? data : []);
  }

  async getMediationSettings(accountId) {
    if (!accountId) throw new Error('accountId is required to get mediation settings');
    return await this._request(`/panel/api/account/${accountId}/mediation/settings`);
  }

  async getMediationStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get mediation stats');
    return await this._request(`/panel/api/account/${accountId}/mediation_stats`);
  }

  // --- Products, Traits & Catalog ---

  async getProducts(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get products');
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      order: options.order || 'ASC',
      ...(options.category ? { category: options.category } : {})
    });
    const data = await this._request(`/panel/api/account/${accountId}/product?${params.toString()}`);
    return Array.isArray(data) ? data : ((data && data.items) || []);
  }

  async getProductCategories(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get product categories');
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      ...(options.offset ? { offset: String(options.offset) } : {}),
      ...(options.order ? { order: options.order } : {})
    });
    const data = await this._request(`/panel/api/account/${accountId}/product/category?${params.toString()}`);
    return data.items || [];
  }

  async getProductTraits(accountId) {
    if (!accountId) throw new Error('accountId is required to get product traits');
    const data = await this._request(`/panel/api/account/${accountId}/products/traits`);
    return Array.isArray(data) ? data : (data.items || []);
  }

  async getProductQuestions(accountId) {
    if (!accountId) throw new Error('accountId is required to get product questions');
    const data = await this._request(`/panel/api/account/${accountId}/product/question`);
    return Array.isArray(data) ? data : (data.items || []);
  }

  // --- Reviews, UGC & Moderation ---

  async getReviews(accountId, { type = 'company', ...options } = {}) {
    if (!accountId) throw new Error('accountId is required to get reviews');
    const endpoint = type === 'product'
      ? `/panel/api/account/${accountId}/product/review`
      : `/panel/api/account/${accountId}/reviews`;
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || 'updatedAt',
      order: options.order || 'DESC'
    });
    const data = await this._request(`${endpoint}?${params.toString()}`);
    return data.items || [];
  }

  async getCompanyFeedback(accountId, options = {}) {
    return await this.getReviews(accountId, { ...options, type: 'company' });
  }

  async getProductFeedback(accountId, options = {}) {
    return await this.getReviews(accountId, { ...options, type: 'product' });
  }

  async replyReview(reviewId, { message, dryRun = false } = {}) {
    if (!reviewId) throw new Error('reviewId is required to reply to a review');
    if (!message) throw new Error('message is required to reply to a review');

    if (dryRun) {
      return {
        dryRun: true,
        mode: 'DRY_RUN',
        action: 'REPLY_REVIEW',
        reviewId: Number(reviewId),
        message,
        simulated: true,
        mutationsBlocked: true,
        endpoint: { method: 'POST', path: `/panel/api/review/${reviewId}/reply` }
      };
    }

    const res = await this._request(`/panel/api/review/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });

    return { success: true, reviewId: Number(reviewId), message, result: res };
  }

  async getReviewMedia(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get review media');
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      order: options.order || 'DESC'
    });
    const data = await this._request(`/panel/api/account/${accountId}/account_review_media?${params.toString()}`);
    return data.items || [];
  }

  async getReviewTags(accountId) {
    if (!accountId) throw new Error('accountId is required to get review tags');
    const data = await this._request(`/panel/api/account/${accountId}/account_review_tag`);
    return data.items || [];
  }

  // --- Statistics & Metrics ---

  async getReviewStats(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get review stats');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = options.startDate || past.toISOString().split('T')[0];
    const end = options.endDate || now.toISOString().split('T')[0];

    const cleanStart = String(start).includes(' ') ? start : `${start} 00:00:00`;
    const cleanEnd = String(end).includes(' ') ? end : `${end} 23:59:59`;

    const params = new URLSearchParams({
      startDate: cleanStart,
      endDate: cleanEnd
    });
    return await this._request(`/panel/api/account/${accountId}/review_stats?${params.toString()}`);
  }

  async getTimeSeriesStats(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get time-series stats');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = options.startDate || past.toISOString().split('T')[0];
    const end = options.endDate || now.toISOString().split('T')[0];

    const cleanStart = String(start).includes(' ') ? start : `${start} 00:00:00`;
    const cleanEnd = String(end).includes(' ') ? end : `${end} 23:59:59`;

    const params = new URLSearchParams({
      start_date: cleanStart,
      end_date: cleanEnd
    });
    return await this._request(`/panel/api/account/${accountId}/stats?${params.toString()}`);
  }

  async getProductReviewStats(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get product review stats');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = options.startDate || past.toISOString().split('T')[0];
    const end = options.endDate || now.toISOString().split('T')[0];

    const params = new URLSearchParams({
      start_date: String(start).includes(' ') ? start : `${start} 00:00:00`,
      end_date: String(end).includes(' ') ? end : `${end} 23:59:59`
    });
    return await this._request(`/panel/api/account/${accountId}/product_review_stats?${params.toString()}`);
  }

  async getNpsStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get NPS stats');
    return await this._request(`/panel/api/account/${accountId}/features_stats`);
  }

  // --- Downloads, Legal & Compliance ---

  async getDownloads(accountId) {
    if (!accountId) throw new Error('accountId is required to get downloads');
    const sub = await this.getSubscription(accountId);
    let reviewCount = null;
    try {
      reviewCount = await this._request(`/panel/api/account/${accountId}/product_review_count`);
    } catch {}
    return {
      subscription: sub,
      productReviewCount: reviewCount ? reviewCount.productReviewCount : 0
    };
  }

  async getLegalDocs(accountId) {
    if (!accountId) throw new Error('accountId is required to get legal documents');
    const data = await this._request(`/panel/api/account/${accountId}/downloads/legal`);
    return Array.isArray(data) ? data : (data.items || []);
  }

  // --- Settings, Notifications & Configuration ---

  async getSettings(accountId) {
    if (!accountId) throw new Error('accountId is required to get settings');
    return await this._request(`/panel/api/account/${accountId}/settings`);
  }

  async getNotificationsConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get notifications config');
    return await this._request(`/panel/api/account/${accountId}/settings/notifications`);
  }

  async updateSettings(accountId, data = {}) {
    if (!accountId) throw new Error('accountId is required to update settings');

    let preSettings;
    try {
      preSettings = await this.getSettings(accountId);
    } catch (err) {
      throw new Error(`Failed to fetch baseline settings for account #${accountId}: ${err.message}`);
    }

    const extractInstantReviews = (settings) => {
      if (!settings) return undefined;
      const s = Array.isArray(settings) ? settings[0] : settings;
      if (!s) return undefined;
      const raw = s.instantReviewActive ?? s.instantReviews ?? s.instant_reviews;
      if (raw !== undefined) return Boolean(raw);
      if (s.InstantReviews !== undefined) {
        if (typeof s.InstantReviews === 'string') {
          return s.InstantReviews.toLowerCase() === 'enabled' || s.InstantReviews.toLowerCase() === 'true';
        }
        return Boolean(s.InstantReviews);
      }
      return undefined;
    };

    const baselineInstant = extractInstantReviews(preSettings);

    const changes = [];
    if (data.instantReviews !== undefined) {
      changes.push({
        field: 'instantReviews',
        currentValue: baselineInstant,
        plannedValue: Boolean(data.instantReviews),
        status: 'MODIFIED'
      });
    }

    const revertCommand = baselineInstant !== undefined
      ? `trustmate settings-set ${accountId} --instant-reviews ${baselineInstant}`
      : undefined;

    if (data.dryRun) {
      return {
        mode: 'DRY_RUN',
        dryRun: true,
        simulated: true,
        mutationsBlocked: true,
        action: 'UPDATE_SETTINGS',
        resource: 'account_settings',
        target: { accountId: Number(accountId) },
        endpoint: { method: 'PUT', path: `/panel/api/account/${accountId}/settings` },
        plannedMutation: { ...data },
        changes,
        safetyVerdict: 'SAFE_REVERSIBLE_WRITE',
        revertCommand
      };
    }

    const payload = {};
    if (data.instantReviews !== undefined) payload.instantReviews = Boolean(data.instantReviews);
    if (data.notificationEmail !== undefined) payload.notificationEmail = data.notificationEmail;
    for (const [k, v] of Object.entries(data)) {
      if (k !== 'dryRun' && !(k in payload)) {
        payload[k] = v;
      }
    }

    const res = await this._request(`/panel/api/account/${accountId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    let postSettings;
    try {
      postSettings = await this.getSettings(accountId);
    } catch (err) {
      throw new Error(`Failed to re-read settings after mutation for account #${accountId}: ${err.message}`);
    }

    const verifiedInstant = extractInstantReviews(postSettings);
    const instantMatched = verifiedInstant !== undefined && verifiedInstant === Boolean(data.instantReviews);

    return {
      success: instantMatched,
      status: instantMatched ? 'VERIFIED_SUCCESS' : 'STATE_DRIFT_DETECTED',
      reReadVerified: instantMatched,
      target: { accountId: Number(accountId) },
      endpoint: { method: 'PUT', path: `/panel/api/account/${accountId}/settings` },
      changes: [
        {
          field: 'instantReviews',
          previousValue: baselineInstant,
          verifiedValue: verifiedInstant !== undefined ? verifiedInstant : data.instantReviews,
          match: instantMatched,
          status: instantMatched ? 'VERIFIED' : 'STATE_DRIFT'
        }
      ],
      revertInstructions: revertCommand,
      result: res
    };
  }

  async updateNotificationsConfig(accountId, data = {}) {
    return await this.updateSettings(accountId, data);
  }

  async getSubscription(accountId) {
    if (!accountId) throw new Error('accountId is required to get subscription');
    const data = await this._request(`/panel/api/account/${accountId}/subscription`);
    return (data && Array.isArray(data.items) && data.items[0]) || data || {};
  }

  // --- Widgets, Integrations & Platforms ---

  async getWidgets(accountId) {
    if (!accountId) throw new Error('accountId is required to get widgets');
    const data = await this._request(`/panel/api/account/${accountId}/widget`);
    return (data.items || []).map(w => ({
      id: w.id,
      name: w.name,
      type: w.type,
      token: w.token,
      microdata: Boolean(w.microdata),
      embedSnippet: `<div id="${w.token}"></div>\n<script defer src="https://trustmate.io/widget/api/${w.token}/script"></script>`
    }));
  }

  async getPlatformKeys(accountId) {
    if (!accountId) throw new Error('accountId is required to get platform keys');
    const data = await this._request(`/panel/api/account/${accountId}/platforms/installation_key`);
    return data.configuration || {};
  }

  async getPartnerships(accountId) {
    if (!accountId) throw new Error('accountId is required to get partnerships');
    return await this._request(`/panel/api/account/${accountId}/account_partnership`);
  }

  async getApiKeys(accountId) {
    if (!accountId) throw new Error('accountId is required to get API keys');
    const data = await this._request(`/panel/api/account/${accountId}/api_key`);
    return data.items || [];
  }

  async getSmartConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get smart config');
    return await this._request(`/panel/api/account/${accountId}/smart_config`);
  }

  async getSurveyQuestions(accountId) {
    if (!accountId) throw new Error('accountId is required to get survey questions');
    const data = await this._request(`/panel/api/account/${accountId}/customer-attribute-questions`);
    return data.items || [];
  }

  async getExpertReviews(accountId) {
    if (!accountId) throw new Error('accountId is required to get expert reviews');
    const data = await this._request(`/panel/api/account/${accountId}/expert_reviews/pending`);
    return data.items || [];
  }
}
