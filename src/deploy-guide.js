/**
 * TrustMate Deployment Code Generator & Placement Architect
 * Generates copy-paste, production-grade deployment snippets for GTM, WordPress MU-Plugins, and PDP templates.
 */

export async function generateDeployGuide(client, accountId) {
  const accounts = await client.getAccounts();
  const account = accountId
    ? accounts.find(a => String(a.id || a.Id || a.ID) === String(accountId))
    : accounts[0];

  if (!account) {
    throw new Error(`Account ${accountId || ''} not found.`);
  }

  const rawWidgets = await client.getWidgets(account.id || account.Id || account.ID);
  const widgets = (rawWidgets || []).map(w => ({
    id: w.id || w.WidgetId || w.Id,
    name: w.name || w.Name,
    type: (w.type || w.Type || '').toLowerCase(),
    token: w.token || w.Token,
    embedSnippet: w.embedSnippet || w.EmbedSnippet
  }));

  const widgetMap = {};
  for (const w of widgets) {
    if (w.type) {
      widgetMap[w.type.toLowerCase()] = w;
      widgetMap[w.type] = w;
    }
  }

  // Find key widgets
  const alpaca = widgetMap['alpaca'] || widgets[0];
  const muskrat = widgetMap['muskrat2'] || widgetMap['muskrat'] || widgets[1];
  const bee = widgetMap['bee'] || widgets[2];
  const ferret = widgetMap['ferret2'] || widgetMap['ferret'] || widgets[3];
  const badger = widgetMap['badger2'] || widgetMap['badger'] || widgets[4];
  const productFerret = widgetMap['productferret2'] || widgetMap['productferret'] || widgetMap['productFerret2'] || widgets[5];
  const jellyfish = widgetMap['jellyfish'] || widgets[6];

  const domain = account.sanitizedUrl || account.domain || account.Domain || 'yourstore.com';

  const gtmSnippet = `<!-- TrustMate GTM Custom HTML Tag for ${domain} -->
<!-- Trigger: All Pages (with Exclusion Rule: Page URL does NOT contain /checkout/ or /cart/) -->
<script>
(function() {
  // Conversion Protection Gate: Strictly exclude checkout, cart, order confirmation, and payment gateways
  var path = window.location.pathname.toLowerCase();
  var search = window.location.search.toLowerCase();
  var fullUrl = path + search;

  var excludedPatterns = [
    '/checkout',
    '/cart',
    '/order-received',
    '/order-pay',
    '/thank-you',
    '/receipt',
    'surecart_checkout',
    'wcf-checkout',
    'cartflows_step',
    'wc-ajax',
    'wc-api'
  ];

  for (var i = 0; i < excludedPatterns.length; i++) {
    if (fullUrl.indexOf(excludedPatterns[i]) !== -1) {
      return;
    }
  }

  // 1. Inject Floating Edge Trust Badge (${muskrat.type})
  var edgeContainer = document.createElement('div');
  edgeContainer.id = '${muskrat.token}';
  document.body.appendChild(edgeContainer);

  var edgeScript = document.createElement('script');
  edgeScript.defer = true;
  edgeScript.src = 'https://trustmate.io/widget/api/${muskrat.token}/script';
  document.body.appendChild(edgeScript);

  // 2. Inject Social Proof Popup (${alpaca.type})
  var popupContainer = document.createElement('div');
  popupContainer.id = '${alpaca.token}';
  document.body.appendChild(popupContainer);

  var popupScript = document.createElement('script');
  popupScript.defer = true;
  popupScript.src = 'https://trustmate.io/widget/api/${alpaca.token}/script';
  document.body.appendChild(popupScript);
})();
</script>`;

  const muPluginPhp = `<?php
/**
 * Plugin Name: TrustMate Reviews & Conversion Protection Integration (${domain})
 * Description: Production integration for TrustMate.io review badges and social proof widgets with strict checkout exclusion gates.
 * Version: 1.0.0
 * Author: World Inspire Lab
 */

if (!defined('ABSPATH')) exit;

if (!function_exists('is_trustmate_excluded_page')) {
    function is_trustmate_excluded_page() {
        if (is_admin()) return true;

        // WooCommerce checkout and cart conditionals
        if (function_exists('is_checkout') && is_checkout()) return true;
        if (function_exists('is_cart') && is_cart()) return true;
        if (function_exists('is_order_received_page') && is_order_received_page()) return true;

        // CartFlows / Funnel checkout steps
        if (function_exists('wcf_is_checkout_step') && wcf_is_checkout_step()) return true;

        // URI patterns for WooCommerce, SureCart, and payment gateways
        $uri = isset($_SERVER['REQUEST_URI']) ? strtolower((string)$_SERVER['REQUEST_URI']) : '';
        $excluded_patterns = [
            '/checkout',
            '/cart',
            '/order-received',
            '/order-pay',
            '/thank-you',
            '/receipt',
            'surecart_checkout',
            'wcf-checkout',
            'cartflows_step',
            'wc-api',
            'wc-ajax',
        ];

        foreach ($excluded_patterns as $pattern) {
            if (strpos($uri, $pattern) !== false) {
                return true;
            }
        }

        return false;
    }
}

add_action('wp_footer', function() {
    // Conversion Protection Gate: Never render floating badges on checkout/cart/order steps
    if (is_trustmate_excluded_page()) return;

    ?>
    <!-- TrustMate Floating Badge & Social Proof (${domain}) -->
    <div id="${muskrat.token}"></div>
    <script defer src="https://trustmate.io/widget/api/${muskrat.token}/script"></script>

    <div id="${alpaca.token}"></div>
    <script defer src="https://trustmate.io/widget/api/${alpaca.token}/script"></script>
    <?php
}, 99);
`;

  const pdpSnippet = `<!-- TrustMate Product Detail Page (PDP) Snippets for Single Product -->
<!-- Place 1: Next to Product Price / Add to Cart Button (Product Rating Badge) -->
<div id="${badger.token}"></div>
<script defer src="https://trustmate.io/widget/api/${badger.token}/script"></script>

<!-- Place 2: Bottom of Product Page (Product Reviews Carousel) -->
<div id="${productFerret.token}"></div>
<script defer src="https://trustmate.io/widget/api/${productFerret.token}/script"></script>

<!-- Place 3: Inside <head> or Top of Page (Google Rich Snippets SEO Schema) -->
<div id="${jellyfish.token}"></div>
<script defer src="https://trustmate.io/widget/api/${jellyfish.token}/script"></script>`;

  const headerBarSnippet = `<!-- TrustMate Top Announcement Bar (Bee Widget) -->
<div id="${bee.token}"></div>
<script defer src="https://trustmate.io/widget/api/${bee.token}/script"></script>`;

  const homepageCarouselSnippet = `<!-- TrustMate Homepage Company Reviews Carousel (Ferret Widget) -->
<div id="${ferret.token}"></div>
<script defer src="https://trustmate.io/widget/api/${ferret.token}/script"></script>`;

  return {
    accountId: account.id || account.Id || account.ID,
    domain,
    placementPlan: [
      { location: 'Global Floating Badge', widget: muskrat.name, type: muskrat.type, token: muskrat.token },
      { location: 'Global Social Proof Popup', widget: alpaca.name, type: alpaca.type, token: alpaca.token },
      { location: 'Site Header Bar', widget: bee.name, type: bee.type, token: bee.token },
      { location: 'Homepage Carousel', widget: ferret.name, type: ferret.type, token: ferret.token },
      { location: 'Product Page Rating Badge', widget: badger.name, type: badger.type, token: badger.token },
      { location: 'Product Page Reviews List', widget: productFerret.name, type: productFerret.type, token: productFerret.token },
      { location: 'SEO Rich Results (Google SERP)', widget: jellyfish.name, type: jellyfish.type, token: jellyfish.token }
    ],
    snippets: {
      gtmTag: gtmSnippet,
      muPluginPhp,
      pdp: pdpSnippet,
      headerBar: headerBarSnippet,
      homepageCarousel: homepageCarouselSnippet
    }
  };
}
