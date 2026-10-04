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
    widgetMap[w.type] = w;
  }

  // Find key widgets
  const alpaca = widgetMap['alpaca'] || widgets[0];
  const muskrat = widgetMap['muskrat2'] || widgetMap['muskrat'] || widgets[1];
  const bee = widgetMap['bee'] || widgets[2];
  const ferret = widgetMap['ferret2'] || widgetMap['ferret'] || widgets[3];
  const badger = widgetMap['badger2'] || widgetMap['badger'] || widgets[4];
  const productFerret = widgetMap['productFerret2'] || widgetMap['productFerret'] || widgets[5];
  const jellyfish = widgetMap['jellyfish'] || widgets[6];

  const domain = account.sanitizedUrl || account.domain || 'yourstore.com';

  const gtmSnippet = `<!-- TrustMate GTM Custom HTML Tag for ${domain} -->
<!-- Trigger: All Pages (with Exclusion Rule: Page URL does NOT contain /checkout/ or /cart/) -->
<script>
(function() {
  // Conversion Protection Gate: Never display floating popups or distractions on checkout/cart
  var path = window.location.pathname.toLowerCase();
  if (path.indexOf('/checkout') !== -1 || path.indexOf('/cart') !== -1 || path.indexOf('/receipt') !== -1) {
    return;
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
 * Plugin Name: GlintMuse TrustMate Reviews & Widgets Integration
 * Description: Production integration for TrustMate.io review badges and social proof widgets.
 * Version: 1.0.0
 * Author: World Inspire Lab
 */

if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    // Conversion Protection: Exclude on cart, checkout, and thank-you endpoints
    if (function_exists('is_checkout') && is_checkout()) return;
    if (function_exists('is_cart') && is_cart()) return;
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, 'checkout') !== false || strpos($uri, 'cart') !== false) return;

    ?>
    <!-- TrustMate Floating Badge & Social Proof -->
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
    accountId: account.id,
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
