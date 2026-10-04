import { TrustMateDirectClient } from './direct-client.js';
import { TrustMateOpenCLIClient } from './opencli-client.js';
import { diagnoseSite } from './diagnose.js';
import { generateDeployGuide } from './deploy-guide.js';
import { getReviewTemplates } from './review-templates.js';

/**
 * Unified TrustMate Client
 * Automatically picks Direct REST API (if cookie provided) or OpenCLI Bridge.
 */
export class TrustMateClient {
  /**
   * @param {Object} [options]
   * @param {'auto'|'direct'|'opencli'} [options.mode='auto']
   * @param {string} [options.cookie]
   * @param {string} [options.baseUrl]
   * @param {string} [options.opencliPath]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'auto';
    this.cookie = options.cookie || process.env.TRUSTMATE_COOKIE || '';
    this.directClient = new TrustMateDirectClient(options);
    this.opencliClient = new TrustMateOpenCLIClient(options);
  }

  get activeClient() {
    if (this.mode === 'direct') return this.directClient;
    if (this.mode === 'opencli') return this.opencliClient;
    // Auto mode: prefer Direct if cookie is present, otherwise fallback to OpenCLI
    return this.cookie ? this.directClient : this.opencliClient;
  }

  async getAccounts() {
    return await this.activeClient.getAccounts();
  }

  async getQuota(accountId) {
    return await this.activeClient.getQuota(accountId);
  }

  async getWidgets(accountId) {
    return await this.activeClient.getWidgets(accountId);
  }

  async getPlatformKeys(accountId) {
    return await this.activeClient.getPlatformKeys(accountId);
  }

  async getReviews(accountId, options) {
    return await this.activeClient.getReviews(accountId, options);
  }

  async queueInvitation(params) {
    if (this.activeClient === this.directClient) {
      const configId = params.configId;
      if (!configId) {
        throw new Error('configId is required when using direct client');
      }
      return await this.directClient.queueInvitation(configId, params);
    }
    return await this.opencliClient.queueInvitation(params);
  }

  async diagnose(options = {}) {
    return await diagnoseSite(this.activeClient, options);
  }

  async getDeployGuide(accountId) {
    return await generateDeployGuide(this.activeClient, accountId);
  }

  getReviewTemplates() {
    return getReviewTemplates();
  }
}

export { TrustMateDirectClient, TrustMateOpenCLIClient };
export { diagnoseSite, generateDeployGuide, getReviewTemplates };
export { formatOutput } from './formatters.js';
