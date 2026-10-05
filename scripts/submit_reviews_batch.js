#!/usr/bin/env node
/**
 * GlintMuse 218 Customer Reviews Batch Submitter & Importer
 * 
 * Supports:
 *   --dry-run (default): Simulates batch queueing without executing API mutations
 *   --live: Queues invitations via TrustMate REST API / OpenCLI
 *   --limit <n>: Only queue the first N invitations (e.g. for staged rollouts)
 *   --type <product|company|all>: Target specific invitation configuration
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TrustMateDirectClient } from '../src/direct-client.js';
import { TrustMateOpenCliClient } from '../src/opencli-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive || args.includes('--dry-run');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

const limitArg = getArgValue('--limit');
const typeArg = getArgValue('--type') || 'all';
const limit = limitArg ? parseInt(limitArg, 10) : 218;

// Verified GlintMuse Account & Invitation Config IDs
const ACCOUNT_ID = '27487';
const PRODUCT_CONFIG_ID = 66455; // Invitation to review products (Email, 21-day delay)
const COMPANY_CONFIG_ID = 66453; // Invitation to review account (Email, 21-day delay)

async function main() {
  console.log('='.repeat(70));
  console.log('GlintMuse TrustMate 218 Reviews Batch Submitter');
  console.log('='.repeat(70));
  console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Safe Simulation)' : 'LIVE EXECUTION'}`);
  console.log(`Target Limit  : ${limit}`);
  console.log(`Target Type   : ${typeArg}`);
  console.log(`Store Account : ${ACCOUNT_ID} (glintmuse.com)`);
  console.log(`Product Config: ${PRODUCT_CONFIG_ID} (delay: 21 days)`);
  console.log(`Company Config: ${COMPANY_CONFIG_ID} (delay: 21 days)`);
  console.log('-'.repeat(70));

  const jsonPath = path.join(rootDir, 'evidence', 'glintmuse_218_customer_reviews.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Dataset not found at ${jsonPath}`);
    process.exit(1);
  }

  const allReviews = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const selectedReviews = allReviews.slice(0, limit);

  console.log(`Loaded ${allReviews.length} total reviews. Selected ${selectedReviews.length} for dispatch.`);

  // Categorize
  const productReviews = selectedReviews.filter(r => r.productId && r.sku !== 'STORE');
  const companyReviews = selectedReviews.filter(r => !r.productId || r.sku === 'STORE');

  console.log(`- Product reviews : ${productReviews.length}`);
  console.log(`- Company reviews : ${companyReviews.length}`);
  console.log(`- 5-Star reviews  : ${selectedReviews.filter(r => r.rating === 5).length}`);
  console.log(`- 4-Star reviews  : ${selectedReviews.filter(r => r.rating === 4).length}`);
  console.log(`- Photo reviews   : ${selectedReviews.filter(r => r.hasPhoto).length}`);

  if (isDryRun) {
    console.log('\n[DRY RUN PREVIEW]');
    console.log('Sample Batch Payload (First 3 Product Invitations):');
    const samplePayload = productReviews.slice(0, 3).map(r => ({
      sendTo: r.email,
      name: r.author,
      productId: r.productId,
      productName: r.productName,
      delay: 21
    }));
    console.log(JSON.stringify(samplePayload, null, 2));

    console.log('\n[NATIVE CSV UPLOAD ALTERNATIVE]');
    console.log('You can also upload directly in TrustMate Panel:');
    console.log('1. Go to: https://trustmate.io/en/panel/invitations/manual/file');
    console.log('2. Select: "Invitation to review products"');
    console.log('3. Upload: evidence/trustmate_native_product_invitations.csv');
    console.log('4. For company reviews, select "Invitation to review account" and upload: evidence/trustmate_native_company_invitations.csv');

    console.log('\n--> Dry-run completed with zero writes. Pass --live to execute API queueing.');
    return;
  }

  // Live execution
  console.log('\n[LIVE EXECUTION] Initializing Client...');
  const cookie = process.env.TRUSTMATE_COOKIE;
  let client;
  if (cookie) {
    client = new TrustMateDirectClient({ cookie });
  } else {
    client = new TrustMateOpenCliClient({ accountId: ACCOUNT_ID });
  }

  // Check quota first
  try {
    const quota = await client.getQuota(ACCOUNT_ID);
    console.log('Current Quota Status:', quota);
  } catch (err) {
    console.log('Could not fetch quota upfront (proceeding):', err.message);
  }

  let dispatchedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < selectedReviews.length; i++) {
    const r = selectedReviews[i];
    const isProduct = r.productId && r.sku !== 'STORE';
    const configId = isProduct ? PRODUCT_CONFIG_ID : COMPANY_CONFIG_ID;

    if (typeArg === 'product' && !isProduct) continue;
    if (typeArg === 'company' && isProduct) continue;

    process.stdout.write(`[${i + 1}/${selectedReviews.length}] Queueing ${r.author} <${r.email}> to config ${configId}... `);

    try {
      if (typeof client.queueInvitation === 'function') {
        await client.queueInvitation(configId, {
          email: r.email,
          name: r.author,
          delay: 21
        });
        console.log('OK');
        dispatchedCount++;
      } else {
        console.log('SKIPPED (Method not available on client mode)');
      }
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failedCount++;
    }

    // Rate-limiting delay (200ms)
    await new Promise(res => setTimeout(res, 200));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Dispatch Summary: Total ${selectedReviews.length}, Dispatched: ${dispatchedCount}, Failed: ${failedCount}`);
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
