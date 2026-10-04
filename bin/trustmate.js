#!/usr/bin/env node

import { TrustMateClient } from '../src/index.js';
import { formatOutput } from '../src/formatters.js';

const VERSION = '1.1.0';

function printHelp() {
  console.log(`
TrustMate CLI - v${VERSION}
Programmatic & agentic client for TrustMate.io reviews, widgets, quotas & automation.

USAGE:
  trustmate <command> [options]

COMMANDS:
  accounts                 List all connected store accounts and AppSumo allocations
  quota [account-id]       View monthly invitation quota and usage
  widgets [account-id]     List all review widgets and HTML embed code snippets
  keys [account-id]        Get WooCommerce / Shopify installation UUID and Secret key
  reviews [account-id]     Fetch customer reviews (--type company|product)
  invite [account-id]      Queue an automated review invite email (--email, --name)
  diagnose [account-id]    Reconcile live storefront HTML with TrustMate panel config (--site <url>)
  deploy-guide [acct-id]   Generate copy-paste deployment snippets for GTM, WordPress, and PDP
  review-templates         Get high-converting verified buyer review templates & image prompts

GLOBAL OPTIONS:
  -a, --account <id>       Target store account ID
  -s, --site <url>         Live store URL to diagnose/audit
  -f, --format <fmt>       Output format: table (default), json, yaml, csv
  -c, --cookie <str>       Session cookie for direct REST mode (or env TRUSTMATE_COOKIE)
  -m, --mode <mode>        Client mode: auto (default), direct, opencli
  -h, --help               Show this help message
  -v, --version            Show version

EXAMPLES:
  # 1. Run live storefront diagnostic reconciliation
  trustmate diagnose 12345 --site https://store.example.com

  # 2. Output diagnostic in JSON format
  trustmate diagnose 12345 --site https://store.example.com -f json

  # 3. Generate copy-paste deployment snippets for GTM and WordPress
  trustmate deploy-guide 12345

  # 4. Get luxury jewelry review templates and photo prompts
  trustmate review-templates -f json
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
    } else if (arg.startsWith('--')) {
      // Ignore unknown option
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
        result = client.getReviewTemplates();
        break;
      }
      default: {
        console.error(`Unknown command: '${command}'. Run 'trustmate --help' for usage.`);
        process.exit(1);
      }
    }

    console.log(formatOutput(result, flags.format));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
