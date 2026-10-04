/**
 * Diagnostic-First Reconciler for TrustMate
 * Reconciles TrustMate panel configuration with live storefront HTML.
 * SSOT Invariant: "测遍了不会说谎的那一半（API/配置），也要测遍会说谎的那一半（真实页面渲染）"
 */

export async function diagnoseSite(client, { accountId, siteUrl, fetchFn = globalThis.fetch } = {}) {
  // 1. Resolve Account from TrustMate API
  const accounts = await client.getAccounts();
  let targetAccount = null;

  if (accountId) {
    targetAccount = accounts.find(a => String(a.id || a.Id || a.ID) === String(accountId));
  } else if (siteUrl) {
    const domainClean = siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    targetAccount = accounts.find(a => {
      const accDomain = (a.sanitizedUrl || a.Domain || a.domain || a.name || '').toLowerCase();
      return accDomain.includes(domainClean) || domainClean.includes(accDomain);
    });
  }

  if (!targetAccount && accounts.length > 0) {
    targetAccount = accounts[0];
  }

  if (!targetAccount) {
    throw new Error('No TrustMate account found to diagnose.');
  }

  const accId = targetAccount.id || targetAccount.Id || targetAccount.ID;
  const canonicalUrl = siteUrl || targetAccount.url || targetAccount.Url || `https://${targetAccount.sanitizedUrl || targetAccount.Domain || targetAccount.domain}`;

  // 2. Fetch authoritative panel data
  const [quota, widgetsRaw, keys, reviews] = await Promise.all([
    client.getQuota(accId).catch(() => ({ granted: 0, used: 0, remaining: 0 })),
    client.getWidgets(accId).catch(() => []),
    client.getPlatformKeys(accId).catch(() => ({})),
    client.getReviews(accId, { type: 'company' }).catch(() => [])
  ]);

  const widgets = (widgetsRaw || []).map(w => ({
    id: w.id || w.WidgetId || w.Id,
    name: w.name || w.Name,
    type: (w.type || w.Type || '').toLowerCase(),
    token: w.token || w.Token
  }));

  // Normalize quota
  const qObj = Array.isArray(quota) ? (quota[0] || {}) : quota;
  const quotaGranted = qObj.Granted || qObj.granted || qObj.limit || qObj.quota || 1000;
  const quotaUsed = qObj.Used !== undefined ? qObj.Used : (qObj.used !== undefined ? qObj.used : 0);
  const quotaRemaining = qObj.Remaining !== undefined ? qObj.Remaining : (qObj.remaining !== undefined ? qObj.remaining : (quotaGranted - quotaUsed));

  // 3. Probe Live Storefront DOM
  let siteReachable = false;
  let statusCode = null;
  let html = '';
  let scriptDetected = false;
  const installedWidgets = [];
  const missingWidgets = [];

  try {
    const resp = await fetchFn(canonicalUrl, {
      headers: {
        'User-Agent': 'TrustMate-Diagnostic/1.0 (Audit-Reconciler)'
      }
    });
    statusCode = resp.status;
    siteReachable = resp.ok;
    html = await resp.text();

    if (siteReachable) {
      // Check for TrustMate script tag
      scriptDetected = html.includes('trustmate.io/widget/api/') || html.includes('trustmate.io');

      // Check which widget tokens are physically embedded
      for (const w of widgets) {
        if (w.token && html.includes(w.token)) {
          installedWidgets.push({
            name: w.name,
            type: w.type,
            token: w.token
          });
        } else {
          missingWidgets.push({
            name: w.name,
            type: w.type,
            token: w.token
          });
        }
      }
    }
  } catch (err) {
    siteReachable = false;
    statusCode = null;
  }

  // 4. Formulate Reconciliation Verdict (Triad: ACTIVE_DEPLOYED | PANEL_READY_NOT_DEPLOYED | OFFLINE)
  let status = 'OFFLINE';
  let message = '';
  let details = '';
  const recommendations = [];

  if (!siteReachable) {
    status = 'OFFLINE';
    message = `Live store URL (${canonicalUrl}) could not be reached (HTTP ${statusCode ?? 'unreachable'}).`;
    details = `Connection failed or returned non-2xx status (HTTP ${statusCode ?? 'unreachable'})`;
    recommendations.push('Verify DNS, Cloudflare edge proxy, and web server status.');
  } else if (installedWidgets.length > 0) {
    status = 'ACTIVE_DEPLOYED';
    message = `TrustMate is active on ${canonicalUrl}. Detected ${installedWidgets.length} installed widget(s).`;
    details = `${installedWidgets.length} widget container(s) verified in live DOM`;
  } else {
    status = 'PANEL_READY_NOT_DEPLOYED';
    if (scriptDetected) {
      message = `TrustMate base script was detected, but zero active widget containers were found on ${canonicalUrl}.`;
      details = 'Base script detected, but zero widget containers found in DOM';
      recommendations.push('Add `<div id="<WIDGET_TOKEN>"></div>` container elements where review badges should appear.');
      recommendations.push('Run `trustmate deploy-guide ' + accId + '` to inspect widget container placement.');
    } else {
      message = `TrustMate account (${accId}) is active with ${widgets.length} available widgets, but ZERO TrustMate scripts or widget containers were detected on ${canonicalUrl}.`;
      details = 'Zero TrustMate scripts or widget containers detected';
      recommendations.push('Deploy TrustMate script tag and widget containers via Google Tag Manager (GTM) or WordPress MU-Plugin.');
      recommendations.push('Run `trustmate deploy-guide ' + accId + '` to generate copy-paste integration code.');
    }
  }

  if (reviews.length <= 1) {
    recommendations.push(`Account currently has only ${reviews.length} review(s). Seed verified customer feedback using 'trustmate review-templates' to maximize conversion.`);
  }

  return {
    accountId: accId,
    domain: targetAccount.sanitizedUrl || targetAccount.domain || targetAccount.Domain || '',
    siteUrl: canonicalUrl,
    verdict: status,
    message,
    liveStatus: {
      siteReachable,
      statusCode: statusCode !== undefined && statusCode !== null ? statusCode : null,
      scriptDetected,
      installedCount: installedWidgets.length,
      installedWidgets: installedWidgets.map(w => `${w.type} (${w.name})`),
      details
    },
    panelStatus: {
      quotaGranted,
      quotaUsed,
      quotaRemaining,
      totalWidgetsAvailable: widgets.length,
      currentReviewsCount: reviews.length,
      platformKeysConfigured: Boolean(keys.installationUuid || keys.uuid)
    },
    recommendations
  };
}
