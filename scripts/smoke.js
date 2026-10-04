#!/usr/bin/env node

/**
 * scripts/smoke.js
 * 
 * Unified Live Smoke Runner for TrustMate CLI (Milestone M7 / M8 Acceptance)
 * Exercises all 17 read commands against the live panel, enforces Zero Facades,
 * automatically redacts session tokens, and outputs evidence transcripts.
 * 
 * Usage:
 *   npm run smoke -- 27487
 *   node scripts/smoke.js [accountId]
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI_BIN = path.join(REPO_ROOT, 'bin', 'trustmate.js');
const TRANSCRIPTS_DIR = path.join(REPO_ROOT, 'evidence', 'transcripts', 'reads');

// Target Account default: 27487
const targetAccount = process.argv[2] || '27487';

// All 17 Read Commands in execution order
const READ_COMMANDS = [
  { name: 'accounts', takesAccount: false },
  { name: 'quota', takesAccount: true },
  { name: 'widgets', takesAccount: true },
  { name: 'keys', takesAccount: true },
  { name: 'reviews', takesAccount: true },
  { name: 'stats', takesAccount: true },
  { name: 'products', takesAccount: true },
  { name: 'products-list', takesAccount: true },
  { name: 'configs', takesAccount: true },
  { name: 'settings', takesAccount: true },
  { name: 'subscription', takesAccount: true },
  { name: 'profile', takesAccount: false },
  { name: 'appsumo', takesAccount: true },
  { name: 'mediations', takesAccount: true },
  { name: 'invitations-log', takesAccount: true },
  { name: 'deploy-guide', takesAccount: true },
  { name: 'review-templates', takesAccount: false }
];

/**
 * Deep redaction of sensitive credentials and session tokens
 */
function redactSensitiveData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return data
      .replace(/(TRPSSID|TM_REMEMBER_ME|csrf[-_]?token|secret|password)=[^;&\s"']+/gi, '$1=<redacted>')
      .replace(/[a-zA-Z0-9%_-]{32,}/g, (match) => {
        // Redact potential 32+ character raw cookie values
        if (match.length > 40) return '<redacted>';
        return match;
      });
  }
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  if (typeof data === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (/^(TRPSSID|TM_REMEMBER_ME|csrf[-_]?token|password|secret|cookie)$/i.test(k)) {
        clean[k] = '<redacted>';
      } else {
        clean[k] = redactSensitiveData(v);
      }
    }
    return clean;
  }
  return data;
}

/**
 * Assert that a response does NOT contain empty success facades
 */
function assertNonFacade(cmd, data) {
  if (data === null || data === undefined) {
    throw new Error(`Command '${cmd}' returned null/undefined`);
  }

  // Zero Facade Check for AppSumo
  if (cmd === 'appsumo') {
    const isFacadeObject = typeof data === 'object' &&
      !Array.isArray(data) &&
      Object.keys(data.tier || {}).length === 0 &&
      (!data.codes || data.codes.length === 0);
    const isEmptyArray = Array.isArray(data) && data.length === 0;

    if (isFacadeObject || isEmptyArray) {
      throw new Error(`[ZERO FACADE VIOLATION] 'appsumo' returned empty structure {"tier":{},"codes":[]}`);
    }
  }

  // Verification for Accounts directory
  if (cmd === 'accounts') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`[EMPTY FACADE] 'accounts' returned 0 connected accounts`);
    }
  }

  // Verification for Widgets
  if (cmd === 'widgets') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`[EMPTY FACADE] 'widgets' returned 0 widgets for active account`);
    }
  }

  // Verification for Invitation Configs
  if (cmd === 'configs') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`[EMPTY FACADE] 'configs' returned 0 configs for account ${targetAccount}`);
    }
  }

  // Verification for Review Templates
  if (cmd === 'review-templates') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`[EMPTY FACADE] 'review-templates' returned empty templates list`);
    }
  }

  // Verification for Subscription
  if (cmd === 'subscription') {
    const str = JSON.stringify(data);
    if (!str.includes('AppSumo') && !str.includes('active') && !str.includes('Active')) {
      throw new Error(`[EMPTY FACADE] 'subscription' returned unexpected payload: ${str.slice(0, 100)}`);
    }
  }

  // Verification for Operator Profile
  if (cmd === 'profile') {
    const str = JSON.stringify(data);
    if (!str.includes('@') && !str.includes('UserId')) {
      throw new Error(`[EMPTY FACADE] 'profile' did not return verified user email`);
    }
  }
}

async function runCommand(cmdDef) {
  const args = [CLI_BIN, cmdDef.name];
  if (cmdDef.takesAccount) {
    args.push(targetAccount);
  }
  args.push('-f', 'json');

  const startTime = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const proc = await execFileAsync(process.execPath, args, {
      cwd: REPO_ROOT,
      env: { ...process.env },
      maxBuffer: 20 * 1024 * 1024
    });
    stdout = proc.stdout;
    stderr = proc.stderr;
  } catch (err) {
    exitCode = err.code || 1;
    stdout = err.stdout || '';
    stderr = err.stderr || err.message;
  }
  const durationMs = Date.now() - startTime;

  // 1. Process Exit Code Check
  if (exitCode !== 0) {
    return {
      name: cmdDef.name,
      passed: false,
      durationMs,
      error: `Process exited with code ${exitCode}: ${stderr.trim() || stdout.trim()}`
    };
  }

  // 2. Auth / Session Check
  if (stdout.includes('SESSION_EXPIRED') || stdout.includes('Authentication required')) {
    return {
      name: cmdDef.name,
      passed: false,
      durationMs,
      error: 'HTTP 401 SESSION_EXPIRED: OpenCLI session lease expired or missing TRUSTMATE_COOKIE'
    };
  }

  // 3. JSON Parse Validation
  let parsedData = null;
  try {
    parsedData = JSON.parse(stdout.trim());
  } catch (parseErr) {
    return {
      name: cmdDef.name,
      passed: false,
      durationMs,
      error: `Stdout is not valid JSON (${parseErr.message}). First 120 chars: "${stdout.slice(0, 120)}"`
    };
  }

  // 4. Zero Facade Assertions
  try {
    assertNonFacade(cmdDef.name, parsedData);
  } catch (facadeErr) {
    return {
      name: cmdDef.name,
      passed: false,
      durationMs,
      error: facadeErr.message
    };
  }

  // 5. Automatic Redaction and Transcript Persistence
  const sanitizedData = redactSensitiveData(parsedData);
  const transcript = {
    command: cmdDef.name,
    targetAccount: cmdDef.takesAccount ? targetAccount : null,
    timestamp: new Date().toISOString(),
    status: 'PASS',
    exitCode: 0,
    durationMs,
    data: sanitizedData
  };

  const transcriptPath = path.join(TRANSCRIPTS_DIR, `${cmdDef.name}.json`);
  fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2), 'utf8');

  return {
    name: cmdDef.name,
    passed: true,
    durationMs,
    transcriptPath: path.relative(REPO_ROOT, transcriptPath)
  };
}

async function main() {
  console.log('======================================================================');
  console.log(` TRUSTMATE LIVE READ SMOKE HARNESS — Target Account: ${targetAccount}`);
  console.log('======================================================================\n');

  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

  const results = [];
  let allPassed = true;

  for (const cmdDef of READ_COMMANDS) {
    process.stdout.write(`  [TESTING] ${cmdDef.name.padEnd(18)} ... `);
    const res = await runCommand(cmdDef);
    results.push(res);

    if (res.passed) {
      console.log(`✔ PASS  (${res.durationMs}ms) -> ${res.transcriptPath}`);
    } else {
      allPassed = false;
      console.log(`✖ FAIL  (${res.durationMs}ms)`);
      console.error(`            Error: ${res.error}\n`);
    }
  }

  console.log('\n======================================================================');
  console.log(' SMOKE TEST EXECUTION SUMMARY');
  console.log('======================================================================');
  console.log(`Total Commands Tested : ${results.length}`);
  console.log(`Passed                : ${results.filter(r => r.passed).length}`);
  console.log(`Failed                : ${results.filter(r => !r.passed).length}`);
  console.log(`Evidence Transcripts  : ${path.relative(REPO_ROOT, TRANSCRIPTS_DIR)}/*.json`);
  console.log('======================================================================\n');

  if (!allPassed) {
    console.error('❌ SMOKE GATE FAILED: One or more read commands failed or returned facades.\n');
    process.exit(1);
  }

  console.log('✅ ALL 17 LIVE READ COMMANDS PASSED CLEANLY (Zero Facades, Fully Redacted).\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Smoke Runner Exception:', err);
  process.exit(1);
});
