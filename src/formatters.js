/**
 * Clean terminal formatters with zero external dependencies.
 * Formats outputs as table, json, yaml, or csv.
 */

export function formatOutput(data, format = 'table') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
    case 'yml':
      return toYaml(data);
    case 'csv':
      return toCsv(data);
    case 'table':
    default:
      return toTable(data);
  }
}

function toYaml(data, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (data === null || data === undefined) return `${spaces}null\n`;
  if (typeof data !== 'object') {
    return `${spaces}${typeof data === 'string' && data.includes('\n') ? `|\n${data.split('\n').map(l => `${spaces}  ${l}`).join('\n')}` : data}\n`;
  }

  let out = '';
  if (Array.isArray(data)) {
    if (data.length === 0) return `${spaces}[]\n`;
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        out += `${spaces}-\n${toYaml(item, indent + 1)}`;
      } else {
        out += `${spaces}- ${item}\n`;
      }
    }
  } else {
    const keys = Object.keys(data);
    if (keys.length === 0) return `${spaces}{}\n`;
    for (const key of keys) {
      const val = data[key];
      if (typeof val === 'object' && val !== null) {
        out += `${spaces}${key}:\n${toYaml(val, indent + 1)}`;
      } else {
        out += `${spaces}${key}: ${val}\n`;
      }
    }
  }
  return out;
}

function toCsv(data) {
  if (!Array.isArray(data) || data.length === 0) {
    if (typeof data === 'object' && data !== null) {
      data = [data];
    } else {
      return String(data);
    }
  }

  const sample = data[0] || {};
  const headers = Object.keys(sample);
  const rows = [headers.join(',')];

  for (const item of data) {
    const row = headers.map(h => {
      let val = item[h] === undefined || item[h] === null ? '' : String(item[h]);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

function toTable(data) {
  if (!data) return 'No data';

  // Specialized formatting for Dry-Run Diff & Re-Read Verifications
  if (data.mode === 'DRY_RUN' || data.reReadVerified !== undefined) {
    return formatDiffTable(data);
  }

  // Specialized formatting for User Profile
  if (data.email && data.roles && Array.isArray(data.roles)) {
    return formatProfileTable(data);
  }

  // Specialized formatting for AppSumo details
  if (data.tier !== undefined || (data.accountLimit !== undefined && data.codes !== undefined)) {
    return formatAppSumoTable(data);
  }

  // Standard object key-value summary
  if (!Array.isArray(data)) {
    if (typeof data === 'object') {
      const lines = [];
      const keys = Object.keys(data);
      const maxKeyLen = Math.max(...keys.map(k => k.length), 10);
      for (const k of keys) {
        const val = typeof data[k] === 'object' ? JSON.stringify(data[k]) : String(data[k]);
        lines.push(`${k.padEnd(maxKeyLen)} : ${val}`);
      }
      return lines.join('\n');
    }
    return String(data);
  }

  // Handle empty array
  if (data.length === 0) return 'No records found (0 items)';

  // Standard tabular array formatting
  const headers = Object.keys(data[0]);
  const colWidths = {};
  for (const h of headers) {
    colWidths[h] = h.length;
  }

  for (const row of data) {
    for (const h of headers) {
      const valStr = row[h] === undefined || row[h] === null ? '' : String(row[h]);
      colWidths[h] = Math.max(colWidths[h], Math.min(valStr.length, 60));
    }
  }

  const headerLine = headers.map(h => h.padEnd(colWidths[h])).join('  ');
  const dividerLine = headers.map(h => '-'.repeat(colWidths[h])).join('  ');

  const rowLines = data.map(row => {
    return headers.map(h => {
      let valStr = row[h] === undefined || row[h] === null ? '' : String(row[h]);
      if (valStr.length > 60) {
        valStr = valStr.substring(0, 57) + '...';
      }
      return valStr.padEnd(colWidths[h]);
    }).join('  ');
  });

  return [headerLine, dividerLine, ...rowLines].join('\n');
}

/**
 * Human-aligned card display for authenticated operator profile
 */
function formatProfileTable(user) {
  const name = (typeof user.name === 'object' && user.name !== null) ? (user.name.first || user.name.name || '') : String(user.name || '');
  const surname = (typeof user.surname === 'object' && user.surname !== null) ? (user.surname.last || user.surname.surname || '') : String(user.surname || '');
  const fullName = `${name} ${surname}`.trim() || 'N/A';

  const rows = [
    ['User ID', String(user.id || 'N/A')],
    ['Email', String(user.email || 'N/A')],
    ['Full Name', fullName],
    ['Account Active', user.enabled ? 'YES (Active)' : 'NO (Disabled)'],
    ['Assigned Roles', Array.isArray(user.roles) ? user.roles.join(', ') : String(user.roles || 'N/A')],
    ['Profile Type', (user.profile && user.profile.type) || 'Operator']
  ];

  const maxKey = 16;
  const lines = [
    '======================================================================',
    'AUTHENTICATED OPERATOR PROFILE',
    '======================================================================'
  ];

  for (const [k, v] of rows) {
    lines.push(`${k.padEnd(maxKey)} : ${v}`);
  }
  lines.push('======================================================================');
  return lines.join('\n');
}

/**
 * Formats AppSumo tier capacity and activated codes table
 */
function formatAppSumoTable(data) {
  const tier = data.tier || data;
  const codes = data.codes || (Array.isArray(data) ? data : []);

  const lines = [
    '======================================================================',
    'APPSUMO LIFETIME LICENSE & TIER ENTITLEMENTS',
    '======================================================================'
  ];

  if (tier && tier.accountLimit !== undefined) {
    lines.push(`Tier ID         : ${tier.id || 'LTD'}`);
    lines.push(`Store Limit     : ${tier.accountLimit} connected stores`);
    lines.push(`Monthly Quota   : 1,000 automated invitations / store`);
    lines.push('----------------------------------------------------------------------');
  }

  lines.push('ACTIVATED LICENSE CODES:');
  if (Array.isArray(codes) && codes.length > 0) {
    const headers = ['Code ID', 'Activated Code', 'Created Date'];
    const colWidths = [10, 32, 24];
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
    const divLine = colWidths.map(w => '-'.repeat(w)).join('  ');
    lines.push(headerLine, divLine);

    for (const c of codes) {
      const codeStr = String(c.code || c.id || '');
      const masked = codeStr.length > 8 ? `${codeStr.substring(0, 4)}...${codeStr.slice(-4)}` : codeStr;
      const row = [
        String(c.id || '').padEnd(10),
        masked.padEnd(32),
        String(c.createdAt || c.created_at || 'Active').padEnd(24)
      ];
      lines.push(row.join('  '));
    }
  } else {
    lines.push('  No additional AppSumo codes returned for this account.');
  }

  lines.push('======================================================================');
  return lines.join('\n');
}

/**
 * Formats Diff Plan for --dry-run or Authoritative Re-read confirmation
 */
function formatDiffTable(data) {
  const isDryRun = data.mode === 'DRY_RUN';
  const title = isDryRun
    ? '[DRY RUN] PREVIEW OF PLANNED MUTATION (ZERO HTTP WRITES)'
    : '[MUTATION VERIFIED] AUTHORITATIVE RE-READ CONFIRMATION';

  const lines = [
    '======================================================================',
    title,
    '======================================================================'
  ];

  if (data.target) {
    lines.push(`Target Account : ${data.target.accountId}`);
    if (data.target.configId) lines.push(`Configuration  : #${data.target.configId}`);
  }
  if (data.endpoint) {
    lines.push(`Endpoint       : ${data.endpoint.method} ${data.endpoint.path}`);
  }

  lines.push('----------------------------------------------------------------------');
  lines.push('Field           Baseline / Current       Mutated / Desired        Status');
  lines.push('--------------  -----------------------  -----------------------  ----------');

  const changes = data.changes || [];
  for (const ch of changes) {
    const f = String(ch.field).padEnd(14);
    const curr = String(ch.currentValue !== undefined ? ch.currentValue : ch.previousValue).padEnd(23);
    const plan = String(ch.plannedValue !== undefined ? ch.plannedValue : ch.verifiedValue).padEnd(23);
    const stat = String(ch.status || (ch.match ? 'VERIFIED' : 'PENDING')).padEnd(10);
    lines.push(`${f}  ${curr}  ${plan}  ${stat}`);
  }

  lines.push('----------------------------------------------------------------------');
  if (isDryRun && data.revertCommand) {
    lines.push(`Revert Command : ${data.revertCommand}`);
  } else if (!isDryRun && data.revertInstructions) {
    lines.push(`Revert Command : ${data.revertInstructions}`);
  }
  lines.push('======================================================================');
  return lines.join('\n');
}
