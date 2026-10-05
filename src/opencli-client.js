import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * TrustMate OpenCLI Bridge Client
 * Leverages the OpenCLI browser bridge when the user is logged into TrustMate.io in Chrome.
 */
export class TrustMateOpenCLIClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.opencliPath='opencli']
   * @param {string} [options.session='trustmate']
   * @param {Function} [options.execFile]
   */
  constructor(options = {}) {
    this.opencliPath = options.opencliPath || 'opencli';
    this.session = options.session || 'trustmate';
    this.execFile = options.execFile || execFileAsync;
  }

  /**
   * Run an opencli trustmate subcommand and parse JSON output
   * @param {string} subcommand
   * @param {string[]} [args=[]]
   * @returns {Promise<any>}
   */
  async runCommand(subcommand, args = []) {
    const fullArgs = ['trustmate', subcommand, ...args, '-f', 'json'];
    try {
      const { stdout } = await this.execFile(this.opencliPath, fullArgs, {
        maxBuffer: 10 * 1024 * 1024
      });
      return JSON.parse(stdout.trim());
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`OpenCLI binary '${this.opencliPath}' not found in PATH.`);
      }
      throw new Error(`OpenCLI execution failed: ${err.stderr || err.message}`);
    }
  }

  /**
   * Centralized Request Chokepoint executing fetch inside browser page context via OpenCLI eval
   * @param {string} endpoint
   * @param {Object} [options={}]
   * @returns {Promise<any>}
   */
  async _evalPanelApi(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    let query = '';
    if (options.params) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null) sp.append(k, String(v));
      }
      const qs = sp.toString();
      if (qs) query = (endpoint.includes('?') ? '&' : '?') + qs;
    }
    const fullPath = `${endpoint}${query}`;

    const script = `(async () => {
      try {
        const fullUrl = ${JSON.stringify(fullPath)}.startsWith('http')
          ? ${JSON.stringify(fullPath)}
          : window.location.origin.includes('trustmate.io')
            ? ${JSON.stringify(fullPath)}
            : 'https://trustmate.io' + (${JSON.stringify(fullPath)}.startsWith('/') ? ${JSON.stringify(fullPath)} : '/' + ${JSON.stringify(fullPath)});
        const res = await fetch(fullUrl, {
          method: ${JSON.stringify(method)},
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            ...(${JSON.stringify(options.headers || {})})
          },
          ${options.body ? `body: ${JSON.stringify(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))},` : ''}
        });
        const contentType = res.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
        }
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        return { ok: false, status: 0, error: err.message };
      }
    })()`;

    try {
      const { stdout } = await this.execFile(this.opencliPath, ['browser', this.session, 'eval', script], {
        maxBuffer: 10 * 1024 * 1024
      });
      const result = JSON.parse(stdout.trim());
      if (!result.ok) {
        const errDetail = typeof result.data === 'object' && result.data !== null
          ? JSON.stringify(result.data)
          : (result.data || result.error || `HTTP ${result.status}`);
        if (result.status === 401 || String(errDetail).includes('SESSION_EXPIRED')) {
          throw new Error('Authentication required: set TRUSTMATE_COOKIE or open trustmate.io in OpenCLI browser');
        }
        throw new Error(`TrustMate OpenCLI API error (${result.status}): ${errDetail}`);
      }
      return result.data;
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`OpenCLI binary '${this.opencliPath}' not found in PATH.`);
      }
      if (err.message && (err.message.includes('not connected') || err.message.includes('ECONNREFUSED') || err.message.includes('Daemon not running') || err.message.includes('No target') || err.message.includes('session not found'))) {
        throw new Error('Authentication required: set TRUSTMATE_COOKIE or open trustmate.io in OpenCLI browser');
      }
      throw err;
    }
  }

  // --- Profile & Authentication ---
  async getCurrentUser() {
    return await this._evalPanelApi('/panel/api/user/current');
  }

  async getUserProfile() {
    return await this.getCurrentUser();
  }

  async getAccounts() {
    return await this.runCommand('accounts');
  }

  async getAppSumo(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('appsumo', args);
  }

  async getAppSumoCodes(accountId) {
    if (!accountId) throw new Error('accountId is required to get AppSumo codes');
    const data = await this._evalPanelApi(`/panel/api/account/${accountId}/appsumo/codes`);
    return Array.isArray(data) ? data : (data?.items || []);
  }

  async getAppSumoTier(accountId) {
    if (!accountId) throw new Error('accountId is required to get AppSumo tier');
    try {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/appsumo/tier`);
    } catch {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/appsumo`);
    }
  }

  async getAccountUsers(accountId) {
    if (!accountId) throw new Error('accountId is required to get account users');
    const data = await this._evalPanelApi(`/panel/api/account/${accountId}/user`);
    return data?.items || (Array.isArray(data) ? data : []);
  }

  // --- Invitations, Splitters & Consent ---
  async getQuota(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('quota', args);
  }

  async getWidgets(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('widgets', args);
  }

  async getPlatformKeys(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('keys', args);
  }

  async getReviews(accountId, { type = 'company' } = {}) {
    const args = [];
    if (accountId) args.push('--account', String(accountId));
    if (type) args.push('--type', type);
    return await this.runCommand('reviews', args);
  }

  async queueInvitation({ accountId, configId, email, name, delay = 0 }) {
    const args = ['--email', email, '--name', name];
    if (accountId) args.push('--account', String(accountId));
    if (configId) args.push('--config', String(configId));
    if (delay !== undefined && delay !== null) args.push('--delay', String(delay));
    return await this.runCommand('invite', args);
  }

  async getInvitationConfigs(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('configs', args);
  }

  async getSentInvitations(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get sent invitations');
    const params = {
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || 'sentAt',
      order: options.order || 'DESC',
      status: options.status || 'sent',
      ...(options.sentAfter ? { sentAfter: options.sentAfter } : {}),
      ...(options.sentBefore ? { sentBefore: options.sentBefore } : {})
    };
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitations`, { params });
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitation`, { params });
      return data?.items || (Array.isArray(data) ? data : []);
    }
  }

  async getInvitationsLog(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get invitations log');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = options.startDate || past.toISOString().split('T')[0];
    const endDate = options.endDate || now.toISOString().split('T')[0];
    const params = {
      ...(options.limit ? { limit: String(options.limit) } : {}),
      ...(options.offset ? { offset: String(options.offset) } : {}),
      ...(options.status ? { status: options.status } : {})
    };
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitations`, { params });
      return (data && data.items) || (Array.isArray(data) ? data : []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitation/sending_stats`, {
        params: { ...params, startDate, endDate }
      });
      return (data && data.items) || (Array.isArray(data) ? data : []);
    }
  }

  async getSplitters(accountId) {
    if (!accountId) throw new Error('accountId is required to get splitters');
    const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitation_splitter`);
    return data?.items || (Array.isArray(data) ? data : []);
  }

  async getSplitterConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get splitter config');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/invitation-consent-config`);
  }

  async getBlockedRecipients(accountId) {
    if (!accountId) throw new Error('accountId is required to get blocked recipients');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitations/blocked-customer-emails`);
      return Array.isArray(data) ? data : (data?.items || []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/invitation_blocked_recipient`);
      return Array.isArray(data) ? data : (data?.items || []);
    }
  }

  async getInvitationCreationStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get invitation creation stats');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/invitation/creation_stats`);
  }

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
        const match = val.match(/\d+/);
        return match ? parseInt(match[0], 10) : undefined;
      }
      return undefined;
    };

    let baselineSendAfter = undefined;
    let baselineRemindAfter = undefined;
    if (accountId) {
      try {
        const configs = await this.getInvitationConfigs(accountId);
        const current = Array.isArray(configs) ? configs.find(c => String(c.id || c.ConfigId || c.configId) === String(configId)) : null;
        if (current) {
          baselineSendAfter = parseDays(current.sendAfter) ?? parseDays(current.SendAfter) ?? parseDays(current.send_after) ?? parseDays(current.delay);
          baselineRemindAfter = parseDays(current.remindAfter) ?? parseDays(current.RemindAfter) ?? parseDays(current.remind_after);
        }
      } catch {}
    }

    const changes = [
      ...(data.sendAfter !== undefined ? [{
        field: 'sendAfter',
        currentValue: baselineSendAfter,
        plannedValue: Number(data.sendAfter),
        previousValue: baselineSendAfter,
        status: 'MODIFIED'
      }] : []),
      ...(data.remindAfter !== undefined ? [{
        field: 'remindAfter',
        currentValue: baselineRemindAfter,
        plannedValue: Number(data.remindAfter),
        previousValue: baselineRemindAfter,
        status: 'MODIFIED'
      }] : [])
    ];

    const revertCommand = (accountId && baselineSendAfter !== undefined)
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
        target: { accountId: accountId ? Number(accountId) : null, configId: Number(configId) },
        endpoint: { method: 'PUT', path: `/panel/api/invitation_config/${configId}` },
        changes,
        safetyVerdict: 'SAFE_REVERSIBLE_WRITE',
        revertCommand
      };
    }

    const sendAfterVal = data.sendAfter !== undefined ? Number(data.sendAfter) : undefined;
    const remindAfterVal = data.remindAfter !== undefined ? Number(data.remindAfter) : undefined;

    if (sendAfterVal !== undefined || remindAfterVal !== undefined) {
      try {
        const updateScript = `(async () => {
          const configId = ${JSON.stringify(configId)};
          const accountId = ${JSON.stringify(accountId)};
          const sendAfter = ${JSON.stringify(sendAfterVal)};
          const remindAfter = ${JSON.stringify(remindAfterVal)};

          // Extract CSRF token from cookie
          const cookieMatch = document.cookie.match(/csrf-token=([^;]+)/);
          const csrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

          // 1. Fetch current config details
          let currentConfig = null;
          try {
            const getRes = await fetch('/panel/api/account/' + accountId + '/invitation_config/' + configId);
            if (getRes.ok) {
              currentConfig = await getRes.json();
            }
          } catch {}

          if (!currentConfig) {
            return { ok: false, error: 'Could not fetch current config' };
          }

          // 2. Prepare mutated config payload filtering out read-only/metadata fields
          const allowedKeys = [
            'name', 'remindAfter', 'remindersCount', 'sendAfter', 'senderName',
            'emailMaxProducts', 'title', 'lead', 'barImageEnabled', 'primaryColor',
            'fontColor', 'emailThemeName', 'secondaryColor', 'backgroundColor',
            'backgroundImageEnabled', 'topText', 'bottomText', 'signature',
            'footer', 'reminder1Title', 'reminder2Title', 'smsBody1', 'survey',
            'ctaImage', 'ctaLabel', 'emailFont', 'invitationProductsPriorityMode',
            'formConfig', 'steps'
          ];

          const updatedConfig = {};
          for (const k of allowedKeys) {
            if (currentConfig[k] !== undefined) updatedConfig[k] = currentConfig[k];
          }
          if (sendAfter !== undefined && sendAfter !== null) updatedConfig.sendAfter = sendAfter;
          if (remindAfter !== undefined && remindAfter !== null) updatedConfig.remindAfter = remindAfter;
          if (csrfToken) updatedConfig._token = csrfToken;

          // 3. Dispatch POST with FormData
          const fd = new FormData();
          if (csrfToken) fd.append('_token', csrfToken);
          fd.append('config', JSON.stringify(updatedConfig));

          const postRes = await fetch('/panel/api/account/' + accountId + '/invitation_config/' + configId, {
            method: 'POST',
            body: fd
          });

          const postData = await postRes.json();
          return { ok: postRes.ok, status: postRes.status, data: postData };
        })()`;

        const res = await this.execFile(this.opencliPath, ['browser', this.session, 'eval', updateScript]);
        const parsed = JSON.parse(res.stdout.trim());
        if (!parsed.ok) {
          // If direct API returned error, also attempt clicking save button on config page if present
          const clickSaveScript = `(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(b => b.innerText.trim() === 'SAVE');
            if (saveBtn) { saveBtn.click(); return true; }
            return false;
          })()`;
          await this.execFile(this.opencliPath, ['browser', this.session, 'eval', clickSaveScript]);
          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (err) {
        // Fallback error handling
      }
    }

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
        }
      }

      const match = verifiedVal !== undefined
        ? Number(verifiedVal) === Number(ch.plannedValue)
        : false;

      return {
        field: ch.field,
        previousValue: ch.previousValue,
        plannedValue: ch.plannedValue,
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
      revertInstructions: revertCommand
    };
  }

  // --- Mediations ---
  async getMediations(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get mediations');
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const params = {
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || 'updatedAt',
      order: options.order || 'DESC',
      createdAfter: options.createdAfter || past.toISOString().split('T')[0],
      createdBefore: options.createdBefore || now.toISOString().split('T')[0],
      ...(options.type ? { type: options.type } : {})
    };
    const data = await this._evalPanelApi(`/panel/api/account/${accountId}/mediation`, { params });
    return (data && data.items) || (Array.isArray(data) ? data : []);
  }

  async getMediationSettings(accountId) {
    if (!accountId) throw new Error('accountId is required to get mediation settings');
    try {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/mediation/settings`);
    } catch {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/mediation_stats`);
    }
  }

  async getMediationStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get mediation stats');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/mediation_stats`);
  }

  // --- Products & Catalog ---
  async getProducts(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('products', args);
  }

  async getProductCategories(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get product categories');
    const params = {
      limit: String(options.limit || 50),
      ...(options.offset ? { offset: String(options.offset) } : {}),
      ...(options.order ? { order: options.order } : {})
    };
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/product/category`, { params });
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/product_category`, { params });
      return data?.items || (Array.isArray(data) ? data : []);
    }
  }

  async getProductTraits(accountId) {
    if (!accountId) throw new Error('accountId is required to get product traits');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/products/traits`);
      return Array.isArray(data) ? data : (data?.items || []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/product_trait`);
      return Array.isArray(data) ? data : (data?.items || []);
    }
  }

  async getProductQuestions(accountId) {
    if (!accountId) throw new Error('accountId is required to get product questions');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/product/question`);
      return Array.isArray(data) ? data : (data?.items || []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/product_question`);
      return Array.isArray(data) ? data : (data?.items || []);
    }
  }

  async getProductReviewStats(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get product review stats');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/product_review_count`, { params: options });
  }

  // --- Reviews & UGC ---
  async getCompanyFeedback(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get company feedback');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/feedback/company`, { params: options });
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      return await this.getReviews(accountId, { ...options, type: 'company' });
    }
  }

  async getProductFeedback(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get product feedback');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/feedback/product`, { params: options });
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      return await this.getReviews(accountId, { ...options, type: 'product' });
    }
  }

  async replyReview(reviewId, data = {}) {
    if (!reviewId) throw new Error('reviewId is required to reply to review');
    const message = data.message || data.body;
    if (data.dryRun) {
      return {
        dryRun: true,
        mode: 'DRY_RUN',
        action: 'REPLY_REVIEW',
        reviewId: Number(reviewId),
        message: message || '',
        simulated: true,
        mutationsBlocked: true,
        safetyVerdict: 'CUSTOMER_VISIBLE_MUTATION_RESTRICTED',
        endpoint: { method: 'POST', path: `/panel/api/review/${reviewId}/reply` }
      };
    }
    return await this._evalPanelApi(`/panel/api/review/${reviewId}/reply`, {
      method: 'POST',
      body: data
    });
  }

  async getReviewMedia(accountId, options = {}) {
    if (!accountId) throw new Error('accountId is required to get review media');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/review_media`, { params: options });
  }

  async getReviewTags(accountId) {
    if (!accountId) throw new Error('accountId is required to get review tags');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/review_tag`);
  }

  // --- Statistics ---
  async getReviewStats(accountId, options = {}) {
    const args = [];
    if (accountId) args.push('--account', String(accountId));
    if (options.startDate) args.push('--start', options.startDate);
    if (options.endDate) args.push('--end', options.endDate);
    return await this.runCommand('stats', args);
  }

  async getTimeSeriesStats(accountId, options = {}) {
    const args = ['--series'];
    if (accountId) args.push('--account', String(accountId));
    if (options.startDate) args.push('--start', options.startDate);
    if (options.endDate) args.push('--end', options.endDate);
    return await this.runCommand('stats', args);
  }

  async getNpsStats(accountId) {
    if (!accountId) throw new Error('accountId is required to get NPS stats');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/nps_stats`);
  }

  // --- Downloads, Legal & Compliance ---
  async getDownloads(accountId) {
    if (!accountId) throw new Error('accountId is required to get downloads');
    try {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/download`);
    } catch {
      const sub = await this.getSubscription(accountId).catch(() => ({}));
      let reviewCount = null;
      try {
        reviewCount = await this._evalPanelApi(`/panel/api/account/${accountId}/product_review_count`);
      } catch {}
      return {
        subscription: sub,
        productReviewCount: reviewCount ? reviewCount.productReviewCount : 0
      };
    }
  }

  async getLegalDocs(accountId) {
    if (!accountId) throw new Error('accountId is required to get legal documents');
    try {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/downloads/legal`);
      return Array.isArray(data) ? data : (data?.items || []);
    } catch {
      const data = await this._evalPanelApi(`/panel/api/account/${accountId}/legal_doc`);
      return Array.isArray(data) ? data : (data?.items || []);
    }
  }

  // --- Settings & Notifications ---
  async getSettings(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('settings', args);
  }

  async getNotificationsConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get notifications config');
    try {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/settings/notifications`);
    } catch {
      return await this._evalPanelApi(`/panel/api/account/${accountId}/settings`);
    }
  }

  async updateNotificationsConfig(accountId, data, options = {}) {
    return await this.updateSettings(accountId, data);
  }

  async updateSettings(accountId, data = {}) {
    if (!accountId) throw new Error('accountId is required to update settings');
    if (data.dryRun) {
      let baselineInstant = undefined;
      try {
        const settings = await this.getSettings(accountId);
        const extractInstantReviews = (s) => {
          if (!s) return undefined;
          const item = Array.isArray(s) ? s[0] : s;
          if (!item) return undefined;
          const raw = item.instantReviewActive ?? item.instantReviews ?? item.instant_reviews;
          if (raw !== undefined) return Boolean(raw);
          if (item.InstantReviews !== undefined) {
            if (typeof item.InstantReviews === 'string') {
              return item.InstantReviews.toLowerCase() === 'enabled' || item.InstantReviews.toLowerCase() === 'true';
            }
            return Boolean(item.InstantReviews);
          }
          return undefined;
        };
        baselineInstant = extractInstantReviews(settings);
      } catch {}
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
        changes: data.instantReviews !== undefined ? [{
          field: 'instantReviews',
          currentValue: baselineInstant,
          plannedValue: Boolean(data.instantReviews),
          status: 'MODIFIED'
        }] : [],
        safetyVerdict: 'SAFE_REVERSIBLE_WRITE',
        revertCommand: baselineInstant !== undefined
          ? `trustmate settings-set ${accountId} --instant-reviews ${baselineInstant}`
          : undefined
      };
    }
    return await this._evalPanelApi(`/panel/api/account/${accountId}/settings`, {
      method: 'PUT',
      body: data
    });
  }

  async getSubscription(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('subscription', args);
  }

  // --- Widgets, Integrations & Platforms ---
  async getPartnerships(accountId) {
    if (!accountId) throw new Error('accountId is required to get partnerships');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/partnerships`);
  }

  async getApiKeys(accountId) {
    if (!accountId) throw new Error('accountId is required to get api keys');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/api_keys`);
  }

  async getSmartConfig(accountId) {
    if (!accountId) throw new Error('accountId is required to get smart config');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/smart_config`);
  }

  async getSurveyQuestions(accountId) {
    if (!accountId) throw new Error('accountId is required to get survey questions');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/survey_question`);
  }

  async getExpertReviews(accountId) {
    if (!accountId) throw new Error('accountId is required to get expert reviews');
    return await this._evalPanelApi(`/panel/api/account/${accountId}/expert_reviews`);
  }
}

export { TrustMateOpenCLIClient as TrustMateOpenCliClient };
