#!/usr/bin/env node

import { TrustMateClient } from '../src/index.js';
import { formatOutput } from '../src/formatters.js';

const VERSION = '1.0.0';

function printHelp() {
  console.log(`
TrustMate CLI - v${VERSION}
Programmatic and agentic client for TrustMate.io reviews, widgets, quotas & automation.

USAGE:
  trustmate <command> [options]

COMMANDS:
  accounts             List all connected store accounts and AppSumo allocations
  quota [account-id]   View monthly invitation quota and usage
  widgets [account-id] List all review widgets and HTML embed code snippets
  keys [account-id]    Get WooCommerce / Shopify installation UUID and Secret key
  reviews [account-id] Fetch customer reviews (--type company|product)
  invite [account-id]  Queue an automated review invite email (--email, --name)

GLOBAL OPTIONS:
  -a, --account <id>   Target store account ID
  -f, --format <fmt>   Output format: table (default), json, yaml, csv
  -c, --cookie <str>   Session cookie for direct REST mode (or env TRUSTMATE_COOKIE)
  -m, --mode <mode>    Client mode: auto (default), direct, opencli
  -h, --help           Show this help message
  -v, --version        Show version

EXAMPLES:
  # List accounts using active Chrome session via OpenCLI
  trustmate accounts

  # Output in JSON format
  trustmate accounts -f json

  # Check quota using direct REST cookie
  TRUSTMATE_COOKIE="user_session=..." trustmate quota 12345

  # List embed widgets for account
  trustmate widgets 12345

  # Retrieve WooCommerce platform keys
  trustmate keys 12345

  # Queue customer review invitation
  trustmate invite 12345 --email user@example.com --name "John Doe" --delay 3
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
