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
   */
  constructor(options = {}) {
    this.opencliPath = options.opencliPath || 'opencli';
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
      const { stdout } = await execFileAsync(this.opencliPath, fullArgs, {
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

  async getAccounts() {
    return await this.runCommand('accounts');
  }

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

  async getProducts(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('products', args);
  }

  async getSettings(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('settings', args);
  }

  async getSubscription(accountId) {
    const args = accountId ? ['--account', String(accountId)] : [];
    return await this.runCommand('subscription', args);
  }

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
}
