import { TrustMateDirectClient, SecurityGateError, SecurityRouteDeniedError } from './direct-client.js';
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
    this.directClient = options.directClient || new TrustMateDirectClient(options);
    this.opencliClient = options.opencliClient || new TrustMateOpenCLIClient(options);
  }

  get activeClient() {
    if (this.mode === 'direct') return this.directClient;
    if (this.mode === 'opencli') return this.opencliClient;
    // Auto mode: prefer Direct if cookie is present, otherwise fallback to OpenCLI
    return this.cookie ? this.directClient : this.opencliClient;
  }

  _resolveClient(methodName) {
    if (this.mode === 'direct') {
      return this.directClient;
    }
    if (this.mode === 'opencli') {
      if (this.opencliClient && typeof this.opencliClient[methodName] === 'function') {
        return this.opencliClient;
      }
      throw new Error(`OpenCLI client does not implement method '${methodName}'`);
    }

    // Auto mode session invariant
    if (this.cookie) {
      return this.directClient;
    }
    if (this.opencliClient && typeof this.opencliClient[methodName] === 'function') {
      return this.opencliClient;
    }
    throw new Error('Authentication required: set TRUSTMATE_COOKIE or open trustmate.io in OpenCLI browser');
  }

  // --- Profile & Authentication ---
  async getCurrentUser() {
    return await this._resolveClient('getCurrentUser').getCurrentUser();
  }

  async getUserProfile() {
    return await this._resolveClient('getUserProfile').getUserProfile();
  }

  async getAccounts() {
    return await this._resolveClient('getAccounts').getAccounts();
  }

  async getAppSumoCodes(accountId) {
    return await this._resolveClient('getAppSumoCodes').getAppSumoCodes(accountId);
  }

  async getAppSumoTier(accountId) {
    return await this._resolveClient('getAppSumoTier').getAppSumoTier(accountId);
  }

  async getAccountUsers(accountId) {
    return await this._resolveClient('getAccountUsers').getAccountUsers(accountId);
  }

  // --- Invitations & Quotas ---
  async getQuota(accountId) {
    return await this._resolveClient('getQuota').getQuota(accountId);
  }

  async getInvitationConfigs(accountId) {
    return await this._resolveClient('getInvitationConfigs').getInvitationConfigs(accountId);
  }

  async getSentInvitations(accountId, options) {
    return await this._resolveClient('getSentInvitations').getSentInvitations(accountId, options);
  }

  async getInvitationsLog(accountId, options) {
    return await this._resolveClient('getInvitationsLog').getInvitationsLog(accountId, options);
  }

  async getSplitters(accountId) {
    return await this._resolveClient('getSplitters').getSplitters(accountId);
  }

  async getSplitterConfig(accountId) {
    return await this._resolveClient('getSplitterConfig').getSplitterConfig(accountId);
  }

  async getBlockedRecipients(accountId) {
    return await this._resolveClient('getBlockedRecipients').getBlockedRecipients(accountId);
  }

  async getInvitationCreationStats(accountId) {
    return await this._resolveClient('getInvitationCreationStats').getInvitationCreationStats(accountId);
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

  async updateInvitationConfig(arg1, arg2, arg3) {
    return await this._resolveClient('updateInvitationConfig').updateInvitationConfig(arg1, arg2, arg3);
  }

  // --- Mediations ---
  async getMediations(accountId, options) {
    return await this._resolveClient('getMediations').getMediations(accountId, options);
  }

  async getMediationSettings(accountId) {
    return await this._resolveClient('getMediationSettings').getMediationSettings(accountId);
  }

  async getMediationStats(accountId) {
    return await this._resolveClient('getMediationStats').getMediationStats(accountId);
  }

  // --- Products & Catalog ---
  async getProducts(accountId, options) {
    return await this._resolveClient('getProducts').getProducts(accountId, options);
  }

  async getProductCategories(accountId, options) {
    return await this._resolveClient('getProductCategories').getProductCategories(accountId, options);
  }

  async getProductTraits(accountId) {
    return await this._resolveClient('getProductTraits').getProductTraits(accountId);
  }

  async getProductQuestions(accountId) {
    return await this._resolveClient('getProductQuestions').getProductQuestions(accountId);
  }

  async getProductReviewStats(accountId, options) {
    return await this._resolveClient('getProductReviewStats').getProductReviewStats(accountId, options);
  }

  // --- Reviews & UGC ---
  async getReviews(accountId, options) {
    return await this._resolveClient('getReviews').getReviews(accountId, options);
  }

  async getCompanyFeedback(accountId, options) {
    return await this._resolveClient('getCompanyFeedback').getCompanyFeedback(accountId, options);
  }

  async getProductFeedback(accountId, options) {
    return await this._resolveClient('getProductFeedback').getProductFeedback(accountId, options);
  }

  async replyReview(reviewId, data) {
    return await this._resolveClient('replyReview').replyReview(reviewId, data);
  }

  async getReviewMedia(accountId, options) {
    return await this._resolveClient('getReviewMedia').getReviewMedia(accountId, options);
  }

  async getReviewTags(accountId) {
    return await this._resolveClient('getReviewTags').getReviewTags(accountId);
  }

  // --- Statistics ---
  async getReviewStats(accountId, options) {
    return await this._resolveClient('getReviewStats').getReviewStats(accountId, options);
  }

  async getTimeSeriesStats(accountId, options) {
    return await this._resolveClient('getTimeSeriesStats').getTimeSeriesStats(accountId, options);
  }

  async getNpsStats(accountId) {
    return await this._resolveClient('getNpsStats').getNpsStats(accountId);
  }

  // --- Downloads, Legal & Compliance ---
  async getDownloads(accountId) {
    return await this._resolveClient('getDownloads').getDownloads(accountId);
  }

  async getLegalDocs(accountId) {
    return await this._resolveClient('getLegalDocs').getLegalDocs(accountId);
  }

  // --- Settings & Notifications ---
  async getSettings(accountId) {
    return await this._resolveClient('getSettings').getSettings(accountId);
  }

  async getNotificationsConfig(accountId) {
    return await this._resolveClient('getNotificationsConfig').getNotificationsConfig(accountId);
  }

  async updateSettings(accountId, data) {
    return await this._resolveClient('updateSettings').updateSettings(accountId, data);
  }

  async updateNotificationsConfig(accountId, data) {
    return await this._resolveClient('updateNotificationsConfig').updateNotificationsConfig(accountId, data);
  }

  async getSubscription(accountId) {
    return await this._resolveClient('getSubscription').getSubscription(accountId);
  }

  // --- Widgets, Integrations & Platforms ---
  async getWidgets(accountId) {
    return await this._resolveClient('getWidgets').getWidgets(accountId);
  }

  async getPlatformKeys(accountId) {
    return await this._resolveClient('getPlatformKeys').getPlatformKeys(accountId);
  }

  async getPartnerships(accountId) {
    return await this._resolveClient('getPartnerships').getPartnerships(accountId);
  }

  async getApiKeys(accountId) {
    return await this._resolveClient('getApiKeys').getApiKeys(accountId);
  }

  async getSmartConfig(accountId) {
    return await this._resolveClient('getSmartConfig').getSmartConfig(accountId);
  }

  async getSurveyQuestions(accountId) {
    return await this._resolveClient('getSurveyQuestions').getSurveyQuestions(accountId);
  }

  async getExpertReviews(accountId) {
    return await this._resolveClient('getExpertReviews').getExpertReviews(accountId);
  }

  // --- Tools & Diagnostics ---
  async diagnose(options = {}) {
    return await diagnoseSite(this.activeClient, options);
  }

  async getDeployGuide(accountId) {
    return await generateDeployGuide(this.activeClient, accountId);
  }

  getReviewTemplates(category) {
    return getReviewTemplates(category);
  }
}

export { TrustMateDirectClient, TrustMateOpenCLIClient, TrustMateOpenCLIClient as TrustMateOpenCliClient, SecurityGateError, SecurityRouteDeniedError };
export { diagnoseSite, generateDeployGuide, getReviewTemplates };
export { formatOutput } from './formatters.js';
