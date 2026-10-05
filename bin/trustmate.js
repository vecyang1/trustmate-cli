#!/usr/bin/env node

import { TrustMateClient } from '../src/index.js';
import { formatOutput } from '../src/formatters.js';
import { assertSafeCliAction, SecurityRouteDeniedError } from '../src/security-guard.js';
import { VERSION } from '../src/version.js';

function printHelp() {
  console.log(`
TrustMate CLI - v${VERSION}
Programmatic & agentic client for TrustMate.io reviews, widgets, quotas & automation.

USAGE:
  trustmate <command> [options]

COMMANDS:
  accounts                     List all connected store accounts and AppSumo allocations
  quota [account-id]           View monthly invitation quota and usage
  widgets [account-id]         List all review widgets and HTML embed code snippets
  keys [account-id]            Get WooCommerce / Shopify installation UUID and Secret key
  reviews [account-id]         Fetch customer reviews (--type company|product)
  stats [account-id]           View review metrics, ratings distribution, and NPS (--series for trend)
  products [account-id]        List store products tracked in TrustMate (alias: products-list)
  products-list [account-id]   List store catalog products tracked in TrustMate
  configs [account-id]         List invitation configurations (email & instant)
  settings [account-id]        View store configuration and alert recipients
  subscription [acct-id]       View subscription plan, status, and expiration
  profile                      Display authenticated operator user profile and roles
  appsumo [account-id]         Display AppSumo tier limit, license codes, and capacity
  mediations [account-id]      Display customer dispute / mediation tickets (--settings, --stats)
  invitations-log [account-id] Display customer invitation dispatch ledger and delivery history
  config-set <acct> <cfg-id>   Update invitation schedule/timing (--send-after, --dry-run)
  settings-set <acct>          Update store settings (--instant-reviews, --dry-run)
  reply-review <review-id>     Post public reply to review (--message, --dry-run)
  invite [account-id]          Queue an automated review invite email (--email, --name)
  diagnose [account-id]        Reconcile live storefront HTML with TrustMate panel config (--site <url>)
  deploy-guide [acct-id]       Generate copy-paste deployment snippets for GTM, WordPress, and PDP
  review-templates [cat]       Get verified review templates & photo prompts (jewelry|pets)

GLOBAL OPTIONS:
  -a, --account <id>           Target store account ID
  -s, --site <url>             Live store URL to diagnose/audit
  -f, --format <fmt>           Output format: table (default), json, yaml, csv
  -c, --cookie <str>           Session cookie for direct REST mode (or env TRUSTMATE_COOKIE)
  -m, --mode <mode>            Client mode: auto (default), direct, opencli
  -h, --help                   Show this help message
  -v, --version                Show version

WRITE & REVERSIBILITY OPTIONS:
  --dry-run                    Simulate mutation & preview planned diff without executing writes
  --send-after <days>          Set invitation delay in days after order completion
  --remind-after <days>        Set reminder interval in days
  --instant-reviews <bool>     Enable/disable thank-you page instant reviews (true|false)
  --notification-email <email> Set email recipient for store alert notifications
  --message <text>             Reply text for customer review reply

EXAMPLES:
  # 1. View operator profile
  trustmate profile

  # 2. Inspect AppSumo license codes and store limits
  trustmate appsumo 27487

  # 3. Simulate invitation delay change (Dry-run)
  trustmate config-set 27487 66453 --send-after 5 --dry-run

  # 4. Execute invitation delay change with authoritative re-read diff
  trustmate config-set 27487 66453 --send-after 5

  # 5. Revert invitation delay change
  trustmate config-set 27487 66453 --send-after 4
`);
}

function parseCliArgs(args) {
  const result = {
    command: null,
    positionals: [],
    flags: {
      format: 'table',
      mode: 'auto'
    }
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      result.flags.help = true;
    } else if (arg === '-v' || arg === '--version') {
      result.flags.version = true;
    } else if (arg === '-f' || arg === '--format') {
      result.flags.format = args[++i] || 'table';
    } else if (arg === '--json') {
      result.flags.format = 'json';
    } else if (arg === '--yaml') {
      result.flags.format = 'yaml';
    } else if (arg === '--csv') {
      result.flags.format = 'csv';
    } else if (arg === '-c' || arg === '--cookie') {
      result.flags.cookie = args[++i] || '';
    } else if (arg === '-a' || arg === '--account') {
      result.flags.account = args[++i] || '';
    } else if (arg === '-s' || arg === '--site') {
      result.flags.site = args[++i] || '';
    } else if (arg === '-m' || arg === '--mode') {
      result.flags.mode = args[++i] || 'auto';
    } else if (arg === '--email') {
      result.flags.email = args[++i] || '';
    } else if (arg === '--name') {
      result.flags.name = args[++i] || '';
    } else if (arg === '--delay') {
      result.flags.delay = args[++i] || '0';
    } else if (arg === '--config') {
      result.flags.config = args[++i] || '';
    } else if (arg === '--type') {
      result.flags.type = args[++i] || 'company';
    } else if (arg === '--start') {
      result.flags.start = args[++i] || '';
    } else if (arg === '--end') {
      result.flags.end = args[++i] || '';
    } else if (arg === '--series') {
      result.flags.series = true;
    } else if (arg === '--category') {
      result.flags.category = args[++i] || '';
    } else if (arg === '--dry-run') {
      result.flags.dryRun = true;
    } else if (arg === '--send-after') {
      result.flags.sendAfter = args[++i];
    } else if (arg === '--remind-after') {
      result.flags.remindAfter = args[++i];
    } else if (arg === '--instant-reviews') {
      result.flags.instantReviews = args[++i];
    } else if (arg === '--notification-email') {
      result.flags.notificationEmail = args[++i];
    } else if (arg === '--message') {
      result.flags.message = args[++i];
    } else if (arg === '--tier') {
      result.flags.tier = true;
    } else if (arg === '--codes') {
      result.flags.codes = true;
    } else if (arg === '--settings') {
      result.flags.settings = true;
    } else if (arg === '--stats') {
      result.flags.stats = true;
    } else if (arg === '--limit') {
      result.flags.limit = args[++i];
    } else if (arg.startsWith('--')) {
      // Unknown option flag ignored
    } else if (!result.command) {
      result.command = arg;
    } else {
      result.positionals.push(arg);
    }
    i++;
  }

  return result;
}

async function main() {
  const { command, positionals, flags } = parseCliArgs(process.argv.slice(2));

  if (flags.version) {
    console.log(`trustmate v${VERSION}`);
    process.exit(0);
  }

  if (flags.help || !command) {
    printHelp();
    process.exit(0);
  }

  // Security Gate 1: Assert CLI action does not invoke destructive/billing routes
  try {
    assertSafeCliAction(command, flags);
  } catch (secErr) {
    console.error(`\n======================================================================`);
    console.error(`[SECURITY REJECTION] Action blocked by Security Route Denylist`);
    console.error(`======================================================================`);
    console.error(`Category : ${secErr.category}`);
    console.error(`Action   : ${secErr.action}`);
    console.error(`Reason   : ${secErr.reason}`);
    console.error(`======================================================================\n`);
    process.exit(2);
  }

  const client = new TrustMateClient({
    mode: flags.mode,
    cookie: flags.cookie
  });

  const targetAccount = flags.account || positionals[0] || null;

  try {
    let result;
    switch (command.toLowerCase()) {
      case 'accounts': {
        result = await client.getAccounts();
        break;
      }
      case 'quota': {
        result = await client.getQuota(targetAccount);
        break;
      }
      case 'widgets': {
        result = await client.getWidgets(targetAccount);
        break;
      }
      case 'keys': {
        result = await client.getPlatformKeys(targetAccount);
        break;
      }
      case 'reviews': {
        result = await client.getReviews(targetAccount, { type: flags.type });
        break;
      }
      case 'stats': {
        if (flags.series) {
          result = await client.getTimeSeriesStats(targetAccount, {
            startDate: flags.start,
            endDate: flags.end
          });
        } else {
          result = await client.getReviewStats(targetAccount, {
            startDate: flags.start,
            endDate: flags.end
          });
        }
        break;
      }
      case 'products':
      case 'products-list': {
        result = await client.getProducts(targetAccount, {
          category: flags.category,
          limit: flags.limit ? Number(flags.limit) : undefined
        });
        break;
      }
      case 'configs': {
        result = await client.getInvitationConfigs(targetAccount);
        break;
      }
      case 'settings': {
        result = await client.getSettings(targetAccount);
        break;
      }
      case 'subscription': {
        result = await client.getSubscription(targetAccount);
        break;
      }
      case 'profile': {
        result = await client.getCurrentUser();
        break;
      }
      case 'appsumo': {
        if (flags.tier && !flags.codes) {
          result = await client.getAppSumoTier(targetAccount);
        } else if (flags.codes && !flags.tier) {
          result = await client.getAppSumoCodes(targetAccount);
        } else {
          const [tier, codes] = await Promise.all([
            client.getAppSumoTier(targetAccount),
            client.getAppSumoCodes(targetAccount)
          ]);
          result = { tier, codes };
        }
        break;
      }
      case 'mediations': {
        if (flags.settings) {
          result = await client.getMediationSettings(targetAccount);
        } else if (flags.stats) {
          result = await client.getMediationStats(targetAccount);
        } else {
          result = await client.getMediations(targetAccount);
        }
        break;
      }
      case 'invitations-log': {
        result = await client.getInvitationsLog(targetAccount, {
          limit: flags.limit ? Number(flags.limit) : undefined
        });
        break;
      }
      case 'config-set': {
        let accountId = flags.account || positionals[0] || null;
        let configId = positionals[1] || flags.config || null;

        // Support: trustmate config-set <configId> --account <accountId>
        if (!configId && positionals[0] && flags.account) {
          configId = positionals[0];
          accountId = flags.account;
        }

        if (!accountId) {
          console.error('Error: <accountId> is required for config-set. Usage: trustmate config-set <accountId> <configId> [options]');
          process.exit(1);
        }
        if (!configId) {
          console.error('Error: <configId> is required for config-set. Usage: trustmate config-set <accountId> <configId> [options]');
          process.exit(1);
        }

        const mutationData = {};
        if (flags.sendAfter !== undefined) mutationData.sendAfter = Number(flags.sendAfter);
        if (flags.remindAfter !== undefined) mutationData.remindAfter = Number(flags.remindAfter);
        if (Object.keys(mutationData).length === 0 && !flags.dryRun) {
          console.error('Error: specify at least one option to update (e.g. --send-after <days>)');
          process.exit(1);
        }

        result = await client.updateInvitationConfig(accountId, configId, {
          ...mutationData,
          dryRun: Boolean(flags.dryRun)
        });
        break;
      }
      case 'settings-set': {
        if (!targetAccount) {
          console.error('Error: <accountId> is required for settings-set. Usage: trustmate settings-set <accountId> [options]');
          process.exit(1);
        }

        const settingsData = {};
        if (flags.instantReviews !== undefined) {
          settingsData.instantReviews = flags.instantReviews === 'true' || flags.instantReviews === true;
        }
        if (flags.notificationEmail) {
          settingsData.notificationEmail = flags.notificationEmail;
        }
        if (Object.keys(settingsData).length === 0 && !flags.dryRun) {
          console.error('Error: specify at least one setting to update (e.g. --instant-reviews true)');
          process.exit(1);
        }

        result = await client.updateSettings(targetAccount, {
          ...settingsData,
          dryRun: Boolean(flags.dryRun)
        });
        break;
      }
      case 'reply':
      case 'reply-review': {
        const reviewId = positionals[0];
        if (!reviewId) {
          console.error('Error: <reviewId> is required. Usage: trustmate reply-review <reviewId> --message <text>');
          process.exit(1);
        }
        if (!flags.message) {
          console.error('Error: --message is required to reply to a review');
          process.exit(1);
        }

        result = await client.replyReview(reviewId, {
          message: flags.message,
          dryRun: Boolean(flags.dryRun)
        });
        break;
      }
      case 'invite': {
        if (!flags.email) {
          console.error('Error: --email is required to queue an invitation');
          process.exit(1);
        }
        if (!flags.name) {
          console.error('Error: --name is required to queue an invitation');
          process.exit(1);
        }
        result = await client.queueInvitation({
          accountId: targetAccount,
          configId: flags.config,
          email: flags.email,
          name: flags.name,
          delay: flags.delay ? Number(flags.delay) : 0
        });
        break;
      }
      case 'diagnose': {
        result = await client.diagnose({
          accountId: targetAccount,
          siteUrl: flags.site
        });
        break;
      }
      case 'deploy-guide': {
        result = await client.getDeployGuide(targetAccount);
        break;
      }
      case 'review-templates': {
        result = client.getReviewTemplates(targetAccount || flags.category);
        break;
      }
      default: {
        console.error(`Unknown command: '${command}'. Run 'trustmate --help' for usage.`);
        process.exit(1);
      }
    }

    console.log(formatOutput(result, flags.format));
  } catch (error) {
    if (error instanceof SecurityRouteDeniedError || error.name === 'SecurityRouteDeniedError') {
      console.error(`\n======================================================================`);
      console.error(`[SECURITY REJECTION] ${error.message}`);
      console.error(`Category : ${error.category}`);
      console.error(`Route    : ${error.route}`);
      console.error(`Reason   : ${error.reason}`);
      console.error(`======================================================================\n`);
      process.exit(2);
    }
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
