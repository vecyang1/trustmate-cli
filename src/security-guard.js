/**
 * TrustMate Security Route Denylist & Operation Guard
 * Enforces Milestone M7 Security Governance Contract.
 * Blocks destructive actions and billing mutations before socket creation.
 */

export class SecurityRouteDeniedError extends Error {
  /**
   * @param {string} action - HTTP Method or CLI action
   * @param {string} route - URI path or command target
   * @param {string} category - Category classification
   * @param {string} reason - Justification for denial
   */
  constructor(action, route, category, reason) {
    super(`[SECURITY REJECTION] Action '${action}' on '${route}' is blocked by Security Route Denylist (${category}): ${reason}`);
    this.name = 'SecurityRouteDeniedError';
    this.action = action;
    this.method = action;
    this.route = route;
    this.category = category;
    this.reason = reason;
    this.statusCode = 403;
  }
}

export class SecurityGateError extends SecurityRouteDeniedError {
  /**
   * Backward-compatible alias for SecurityRouteDeniedError
   * @param {string} message
   * @param {string} route
   * @param {string} method
   * @param {string} [category='DESTRUCTIVE_OR_BILLING']
   */
  constructor(message, route, method, category = 'DESTRUCTIVE_OR_BILLING') {
    super(method || 'UNKNOWN', route, category, message);
    this.name = 'SecurityGateError';
  }
}

export const SECURITY_ROUTE_DENYLIST = [
  {
    category: 'DESTRUCTIVE_OUT_OF_SCOPE',
    pattern: /^\/panel\/api\/account\/\d+$/i,
    methods: ['DELETE'],
    reason: 'Account deletion permanently purges customer reviews and reputation.'
  },
  {
    category: 'DESTRUCTIVE_OUT_OF_SCOPE',
    pattern: /\/panel\/api\/(account\/[^/]+\/)?delete(\/.*)?$/i,
    methods: ['DELETE', 'POST', 'PUT'],
    reason: 'Store account deletion is permanently forbidden at runtime.'
  },
  {
    category: 'DESTRUCTIVE_OUT_OF_SCOPE',
    pattern: /\/panel\/api\/(account\/[^/]+\/)?detach(\/.*)?$/i,
    methods: ['POST', 'DELETE', 'PUT', 'PATCH'],
    reason: 'Account detachment breaks active multi-store management.'
  },
  {
    category: 'BILLING_OUT_OF_SCOPE',
    pattern: /\/panel\/api\/(account\/[^/]+\/)?appsumo\/redeem(\/.*)?$/i,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    reason: 'License code mutations are financial billing actions.'
  },
  {
    category: 'BILLING_OUT_OF_SCOPE',
    pattern: /\/panel\/api\/(account\/[^/]+\/)?billing(\/.*)?$/i,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    reason: 'Billing operations are financial mutations.'
  },
  {
    category: 'BILLING_OUT_OF_SCOPE',
    pattern: /\/panel\/api\/(account\/[^/]+\/)?subscription(\/.*)?$/i,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    reason: 'Subscription plan mutations are financial billing actions.'
  }
];

/**
 * Evaluates an outgoing HTTP request against the security denylist
 * @param {string} method
 * @param {string} path
 * @throws {SecurityRouteDeniedError} if request is forbidden
 */
export function assertSafeRoute(method, path) {
  const normMethod = (method || 'GET').toUpperCase();
  const cleanPath = path.split('?')[0].replace(/^https?:\/\/[^/]+/, '');

  for (const rule of SECURITY_ROUTE_DENYLIST) {
    if (rule.methods.includes(normMethod) && rule.pattern.test(cleanPath)) {
      throw new SecurityRouteDeniedError(normMethod, cleanPath, rule.category, rule.reason);
    }
  }
}

/**
 * Checks if a CLI command name or flags represent a forbidden destructive action
 * @param {string} command
 * @param {Object} [flags={}]
 * @throws {SecurityRouteDeniedError}
 */
export function assertSafeCliAction(command, flags = {}) {
  const cmd = (command || '').toLowerCase();
  const forbiddenCommands = [
    'delete-account',
    'account-delete',
    'detach',
    'account-detach',
    'redeem',
    'appsumo-redeem',
    'upgrade',
    'subscription-upgrade'
  ];

  if (forbiddenCommands.includes(cmd)) {
    throw new SecurityRouteDeniedError('CLI_COMMAND', cmd, 'DESTRUCTIVE_OR_BILLING', 'Forbidden by Milestone M7 Security Governance Contract.');
  }

  if (flags.delete || flags.detach || flags.redeem || flags.upgrade) {
    throw new SecurityRouteDeniedError('CLI_FLAG', cmd, 'DESTRUCTIVE_OR_BILLING', 'Destructive or billing flags are strictly forbidden at runtime.');
  }
}
