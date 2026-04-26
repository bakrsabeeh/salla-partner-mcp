export interface Guide {
  topic: string;
  title: string;
  steps: string[];
  notes?: string[];
}

export interface EventSchema {
  name: string;
  trigger: string;
  fields: string[];
  envelope: string;
}

export interface CodeExample {
  feature: string;
  language: string;
  code: string;
}

export const GUIDES: Record<string, Guide> = {
  create_app: {
    topic: 'create_app',
    title: 'Create Your First Salla App',
    steps: [
      '1. Go to portal.salla.partners and sign in with your verified Partners account.',
      '2. Click "Create App" and choose type: Public (listed in App Store) or Private (for a specific merchant). Note: Shipping apps must be Public.',
      '3. Fill in Basic Information: Icon (min 250×250px, 1:1 ratio), Name in English AND Arabic, Category (Shipping / General / Communication), Description (max 50 chars), Website URL, Support Email.',
      '4. After creation, open App Details. Under "App Keys" copy your Client ID and Client Secret. Choose OAuth mode: Easy Mode (recommended) or Custom Mode.',
      '5. Under "App Scope" select the permissions your app needs.',
      '6. Under "Webhooks & Notifications" add your webhook URL, generate a secret key, and enable the App Events and Store Events you need.',
      '7. Optionally configure: Trusted IPs, App Snippets, App Settings form, Custom Plans, DNS.',
      '8. Test your app using the demo store environment.',
      '9. Click "Start Publishing your App" and complete the 6-step submission: Basic Info → App Configurations → App Features → Pricing → Contact Info → Service Trial.',
    ],
    notes: [
      'App names must be provided in both English and Arabic — Arabic is required.',
      'The 50-character description limit is strict.',
      'Shipping apps cannot be Private.',
    ],
  },
  setup_oauth: {
    topic: 'setup_oauth',
    title: 'Set Up OAuth 2.0 for Your App',
    steps: [
      '1. Choose your OAuth mode in the Partners Portal under App Keys: Easy Mode or Custom Mode.',
      '2. EASY MODE: Listen for the app.store.authorize webhook event. When a merchant installs your app, Salla automatically generates the access token and sends it in this event payload (access_token, refresh_token, expires, scope, token_type). No manual code exchange needed.',
      '3. CUSTOM MODE: Direct the merchant to: https://accounts.salla.sa/oauth2/auth?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPES&state=RANDOM_STATE',
      '4. CUSTOM MODE: After merchant authorizes, they are redirected to your redirect_uri with ?code=AUTH_CODE. Exchange the code: POST https://accounts.salla.sa/oauth2/token with body: grant_type=authorization_code, client_id, client_secret, redirect_uri, code.',
      '5. Store the access_token (valid 2 weeks) and refresh_token (valid ~1 month). Include offline_access in scope to receive a refresh token.',
      '6. When the access token expires, call POST https://accounts.salla.sa/oauth2/token with grant_type=refresh_token, client_id, client_secret, refresh_token.',
      '7. CRITICAL: Never call refresh in parallel. Refresh tokens are single-use. Concurrent refresh requests trigger a security lockout that revokes ALL tokens — the merchant must reinstall your app.',
    ],
    notes: [
      'Use offline_access scope to get a refresh token.',
      'Access tokens expire after 2 weeks (unix timestamp in "expires" field).',
      'Refresh tokens expire after ~1 month and are invalidated on use.',
    ],
  },
  configure_webhooks: {
    topic: 'configure_webhooks',
    title: 'Configure Webhooks for Your App',
    steps: [
      '1. In Partners Portal → App Details → Webhooks & Notifications, add your webhook URL.',
      '2. Generate a Webhook Secret Key (can be regenerated if compromised).',
      '3. Choose which App Events to receive (install, update, trial, subscription, feedback, settings).',
      '4. Choose which Store Events to receive (orders, products, customers, categories, brands, stores, misc).',
      '5. Choose a security strategy: signature (SHA256 of body using secret, in X-Salla-Signature header) or token (static token in Authorization header) or none.',
      '6. Verify incoming webhooks by computing HMAC-SHA256 of the raw request body with your secret, then compare with X-Salla-Signature using a timing-safe comparison.',
      '7. Salla retries failed webhooks 3 times with ~5-minute intervals. Your endpoint must respond within 30 seconds.',
      '8. Use webhook.site to test your endpoint before going live.',
    ],
    notes: [
      'The security strategy and secret are set per webhook.',
      'Check the Partners Portal webhook logs to debug failed deliveries.',
    ],
  },
  submit_app: {
    topic: 'submit_app',
    title: 'Submit Your App for Publishing',
    steps: [
      '1. Click "Start Publishing your App" in the Partners Portal.',
      '2. Step 1 — Basic Information: Confirm icon (250×250px min), names (EN + AR), category, 50-char description, website, support email.',
      '3. Step 2 — App Configurations: Review OAuth mode, scopes, webhook URLs.',
      '4. Step 3 — App Features: Describe what your app does for merchants.',
      '5. Step 4 — Pricing: Set your plan (Free, Monthly, Yearly, One-Time, Pay-As-You-Go) or leave free.',
      '6. Step 5 — Contact Information: Confirm developer contact details.',
      '7. Step 6 — Service Trial: Configure if you offer a trial period.',
      '8. Submit. Once approved, your app is listed in the Salla Apps Store for 60,000+ merchants.',
    ],
  },
  manage_subscriptions: {
    topic: 'manage_subscriptions',
    title: 'Manage App Subscriptions',
    steps: [
      '1. Listen to subscription webhook events: app.subscription.started, app.subscription.expired, app.subscription.canceled, app.subscription.renewed.',
      '2. Call GET /apps/{app_id}/subscriptions to check current subscription state for a merchant.',
      '3. The subscription object includes: plan_type (free/once/recurring/on_demand), item_type (plan/addon), price, tax, total, coupon, features, subscription_balance.',
      '4. Handle subscription_balance — the amount the merchant owes for your service.',
      '5. For trial management, listen to app.trial.started, app.trial.expired, app.trial.canceled.',
    ],
  },
  trusted_ips: {
    topic: 'trusted_ips',
    title: 'Configure Trusted IPs',
    steps: [
      '1. In Partners Portal → App Details → Trusted IPs, add the IP addresses your app server uses.',
      '2. Only requests from trusted IPs are accepted by the Salla API for certain operations.',
      '3. Add all IPs that may make outbound API calls (production servers, CI servers, developer machines).',
      '4. Trusted IPs can be updated at any time without resubmitting your app.',
    ],
  },
  snippets: {
    topic: 'snippets',
    title: 'Use App Snippets',
    steps: [
      '1. In Partners Portal → App Details → App Snippets, you can add custom code snippets.',
      '2. Snippets let your app inject custom HTML/JS into the merchant storefront.',
      '3. Snippets are reviewed as part of the app publishing process.',
    ],
  },
  custom_plans: {
    topic: 'custom_plans',
    title: 'Set Up Custom Pricing Plans',
    steps: [
      '1. In Partners Portal → App Details → Custom Plans, create your pricing tiers.',
      '2. Available plan types: Free, Monthly (recurring), Yearly (recurring), One-Time (once), Pay-As-You-Go (on_demand).',
      '3. You can also create Addons — optional paid features on top of a base plan.',
      '4. For each plan set: name, price, features (key + quantity pairs), trial period (optional).',
      '5. Plans appear in the Salla App Store on your app listing.',
    ],
  },
  dns: {
    topic: 'dns',
    title: 'Configure DNS for Your App',
    steps: [
      '1. In Partners Portal → App Details → DNS Management, link your domain to your app.',
      '2. DNS configuration connects store domains to your app server IP addresses.',
      '3. Required if your app serves content under a merchant subdomain.',
    ],
  },
  testing: {
    topic: 'testing',
    title: 'Test Your App with a Demo Store',
    steps: [
      '1. In Partners Portal → App Details → App Testing, access the demo store environment.',
      '2. Install your app on the demo store to trigger real webhook events (app.installed, app.store.authorize).',
      '3. Test the full OAuth flow using the demo store.',
      '4. Verify webhooks are delivered using the Partners Portal webhook logs.',
      '5. Use webhook.site to inspect raw payloads before connecting your real server.',
    ],
  },
  publishing: {
    topic: 'publishing',
    title: 'App Publishing Process',
    steps: [
      '1. Ensure your app passes all requirements (see app_requirements guide).',
      '2. Click "Start Publishing your App" in the Partners Portal.',
      '3. Complete all 6 sections: Basic Info, App Configurations, App Features, Pricing, Contact Info, Service Trial.',
      '4. Submit for review. The Salla team reviews your app before it goes live.',
      '5. Once approved, your app is listed in the Salla Apps Store.',
    ],
  },
  app_requirements: {
    topic: 'app_requirements',
    title: 'App Requirements Checklist',
    steps: [
      '✅ App icon: minimum 250×250px, 1:1 aspect ratio',
      '✅ App name in English (required)',
      '✅ App name in Arabic (required)',
      '✅ Description: max 50 characters',
      '✅ Category selected: Shipping Apps, General App, or Communication App',
      '✅ Website URL provided',
      '✅ Support email provided',
      '✅ OAuth mode chosen (Easy or Custom)',
      '✅ At least one scope selected',
      '✅ Webhook URL configured (if using events)',
      '✅ Shipping apps must be Public type (cannot be Private)',
    ],
  },
};

export const EVENT_SCHEMAS: Record<string, EventSchema> = {
  'app.store.authorize': {
    name: 'app.store.authorize',
    trigger: 'Triggered whenever an App scope is authorized by the store.',
    fields: ['access_token', 'expires', 'refresh_token', 'scope', 'token_type'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.installed': {
    name: 'app.installed',
    trigger: 'Triggered whenever an app is installed on a merchant store.',
    fields: ['id', 'app_name', 'app_type', 'app_scopes', 'installation_date', 'store_type'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.updated': {
    name: 'app.updated',
    trigger: 'Triggered whenever an app is updated.',
    fields: ['id', 'app_name', 'app_scopes', 'update_date', 'categories', 'store_type'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.uninstalled': {
    name: 'app.uninstalled',
    trigger: 'Triggered whenever an app is uninstalled from a merchant store.',
    fields: ['id', 'app_name', 'installation_date', 'uninstallation_date', 'refunded', 'store_type'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.trial.started': {
    name: 'app.trial.started',
    trigger: "Triggered whenever an app's trial starts in a merchant's store.",
    fields: ['id', 'plan_name', 'plan_type', 'start_date', 'end_date', 'features'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.trial.expired': {
    name: 'app.trial.expired',
    trigger: "Triggered whenever an app's trial subscription expires.",
    fields: ['id', 'plan_name', 'start_date', 'end_date', 'store_type'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.trial.canceled': {
    name: 'app.trial.canceled',
    trigger: "Triggered whenever an app's trial subscription is cancelled.",
    fields: ['id', 'plan_type', 'start_date', 'end_date', 'subscription_at'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.subscription.started': {
    name: 'app.subscription.started',
    trigger: "Triggered whenever a subscription starts on the merchant's store for an app or addon.",
    fields: ['subscription_id', 'item_type', 'item_slug', 'price', 'tax', 'tax_value', 'total', 'coupon', 'features'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.subscription.expired': {
    name: 'app.subscription.expired',
    trigger: "Triggered whenever a subscription ends on the merchant's store.",
    fields: ['subscription_id', 'item_type', 'start_date', 'end_date', 'plan_period'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.subscription.canceled': {
    name: 'app.subscription.canceled',
    trigger: "Triggered whenever a subscription is canceled on the merchant's store.",
    fields: ['subscription_id', 'item_type', 'start_date', 'end_date', 'price', 'total'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.subscription.renewed': {
    name: 'app.subscription.renewed',
    trigger: "Triggered whenever a subscription is renewed on the merchant's store.",
    fields: ['subscription_id', 'renew_date', 'item_type', 'plan_period', 'features'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.feedback.created': {
    name: 'app.feedback.created',
    trigger: 'Triggered whenever an App feedback is created by a merchant.',
    fields: ['id', 'rating', 'rated_by', 'comment'],
    envelope: '{ event, merchant, created_at, data }',
  },
  'app.settings.updated': {
    name: 'app.settings.updated',
    trigger: "Triggered whenever a merchant activates and/or updates an app's settings.",
    fields: ['id', 'app_name', 'settings'],
    envelope: '{ event, merchant, created_at, data }',
  },
};

export const WEBHOOK_EVENT_CATEGORIES: Record<string, string[]> = {
  app: Object.keys(EVENT_SCHEMAS),
  order: [
    'order.created', 'order.updated', 'order.status.updated', 'order.cancelled',
    'order.refunded', 'order.deleted', 'order.payment.updated', 'order.coupon.updated',
    'order.price.updated', 'order.address.updated', 'order.shipment.created',
    'order.shipment.updated', 'order.shipment.cancelled',
  ],
  product: [
    'product.created', 'product.updated', 'product.deleted', 'product.quantity.low',
    'product.price.updated', 'product.status.updated', 'product.image.updated',
    'product.category.updated', 'product.brand.updated', 'product.tag.updated',
  ],
  customer: ['customer.created', 'customer.updated', 'customer.login', 'customer.otp.request'],
  shipping: [
    'shipping.company.created', 'shipping.company.updated',
    'shipping.zone.created', 'shipping.zone.updated', 'shipment.status.updated',
  ],
  store: ['store.branch.created', 'store.branch.updated', 'store.tax.updated'],
  misc: [
    'category.created', 'category.updated', 'brand.created', 'brand.updated',
    'cart.abandoned', 'coupon.applied', 'invoice.created', 'review.added', 'special_offer.created',
  ],
};

export const CODE_EXAMPLES: Record<string, CodeExample> = {
  oauth_easy_mode: {
    feature: 'oauth_easy_mode',
    language: 'typescript',
    code: `// Easy Mode OAuth — listen for app.store.authorize webhook event.
// Salla sends the access token automatically when a merchant installs your app.
import crypto from 'crypto';
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-salla-signature'] as string;
  const expected = crypto
    .createHmac('sha256', process.env.SALLA_WEBHOOK_SECRET!)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body.toString());
  if (payload.event === 'app.store.authorize') {
    const { access_token, refresh_token, expires } = payload.data;
    // Store these tokens associated with payload.merchant
    console.log('Got token for merchant', payload.merchant, { access_token, refresh_token, expires });
  }
  res.sendStatus(200);
});`,
  },
  oauth_custom_mode: {
    feature: 'oauth_custom_mode',
    language: 'typescript',
    code: `// Custom Mode OAuth — manual authorization code flow.
import axios from 'axios';

const OAUTH_BASE = 'https://accounts.salla.sa/oauth2';

export function getAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'offline_access',
    state,
  });
  return \`\${OAUTH_BASE}/auth?\${params}\`;
}

export async function exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await axios.post(\`\${OAUTH_BASE}/token\`, {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
  return response.data; // { access_token, refresh_token, expires, token_type, scope }
}`,
  },
  verify_webhook: {
    feature: 'verify_webhook',
    language: 'typescript',
    code: `// Verify a Salla webhook using signature strategy.
import crypto from 'crypto';

export function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyWebhookToken(authHeader: string, expectedToken: string): boolean {
  const token = authHeader.replace('Bearer ', '');
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  } catch {
    return false;
  }
}`,
  },
  refresh_token: {
    feature: 'refresh_token',
    language: 'typescript',
    code: `// Refresh an expired access token.
// CRITICAL: Never call this concurrently. Refresh tokens are single-use.
import axios from 'axios';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

export async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  return mutex.runExclusive(async () => {
    const response = await axios.post('https://accounts.salla.sa/oauth2/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    return response.data; // { access_token, refresh_token (new!), expires }
    // The old refresh_token is now invalid — store the new one immediately.
  });
}`,
  },
  api_request: {
    feature: 'api_request',
    language: 'typescript',
    code: `// Make an authenticated request to the Salla Partner API.
import axios from 'axios';

const API_BASE = 'https://api.salla.dev/admin/v2';

export async function sallaRequest<T>(method: 'GET' | 'POST' | 'DELETE', path: string, accessToken: string, body?: unknown): Promise<T> {
  const response = await axios.request<T>({
    method,
    url: \`\${API_BASE}\${path}\`,
    data: body,
    headers: { Authorization: \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
  });
  return response.data;
}

// Example: Get app settings
const settings = await sallaRequest('GET', '/apps/513499943/settings', accessToken);
// Example: Get subscription details
const subs = await sallaRequest('GET', '/apps/513499943/subscriptions', accessToken);`,
  },
};

export const PUBLISHING_CHECKLIST = [
  { step: 1, name: 'Basic Information', requirements: ['App icon (min 250×250px, 1:1 ratio)', 'App name in English', 'App name in Arabic', 'Description (max 50 characters)', 'Category selected', 'Website URL', 'Support email'] },
  { step: 2, name: 'App Configurations', requirements: ['OAuth mode selected (Easy or Custom)', 'At least one scope configured', 'Webhook URL set (if using events)'] },
  { step: 3, name: 'App Features', requirements: ['App feature description written', 'Screenshots or demo ready'] },
  { step: 4, name: 'Pricing', requirements: ['Pricing plan configured (or Free selected)'] },
  { step: 5, name: 'Contact Information', requirements: ['Developer contact confirmed'] },
  { step: 6, name: 'Service Trial', requirements: ['Trial configuration set (or marked as no trial)'] },
];

export const SUBSCRIPTION_PLAN_TYPES = [
  { type: 'free', label: 'Free', description: 'No charge. App is free for all merchants.', fields: ['features[]'] },
  { type: 'once', label: 'One-Time', description: 'Single payment, lifetime access.', fields: ['price', 'initialization_cost', 'features[]'] },
  { type: 'recurring', label: 'Monthly / Yearly', description: 'Repeating subscription. plan_period is 1 (monthly) or 12 (yearly) months.', fields: ['price', 'plan_period', 'start_date', 'end_date', 'features[]'] },
  { type: 'on_demand', label: 'Pay-As-You-Go', description: 'Charged based on usage.', fields: ['price', 'quantity', 'features[]'] },
  { type: 'addon', label: 'Addon', description: 'Optional paid feature on top of a base plan. item_type will be "addon".', fields: ['item_slug', 'price', 'quantity', 'features[]'] },
  { type: 'trial', label: 'Trial', description: 'Time-limited free access before a paid plan.', fields: ['plan_name', 'start_date', 'end_date'] },
];
