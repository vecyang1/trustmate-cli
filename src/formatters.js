/**
 * Clean terminal formatters with zero external dependencies
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

  if (data.length === 0) return 'No records found (0 items)';

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
