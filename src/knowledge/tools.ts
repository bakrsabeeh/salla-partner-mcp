import {
  GUIDES, EVENT_SCHEMAS, WEBHOOK_EVENT_CATEGORIES, CODE_EXAMPLES,
  PUBLISHING_CHECKLIST, SUBSCRIPTION_PLAN_TYPES,
  type Guide, type EventSchema, type CodeExample,
} from './content.js';
import { ok, err, type ToolResult } from '../types.js';

export function askQuestion(query: string): ToolResult<{ answer: string; relatedGuides: string[] }> {
  const q = query.toLowerCase();
  const topicMatches: Array<[string, string[]]> = [
    ['create_app', ['create', 'first app', 'new app', 'start']],
    ['setup_oauth', ['oauth', 'token', 'authorize', 'authentication', 'easy mode', 'custom mode']],
    ['configure_webhooks', ['webhook', 'event', 'notification', 'signature', 'verify']],
    ['submit_app', ['submit', 'publish', 'review', 'app store']],
    ['manage_subscriptions', ['subscription', 'plan', 'billing', 'trial', 'payment']],
    ['app_requirements', ['requirement', 'icon', 'arabic', '250', 'checklist']],
    ['trusted_ips', ['trusted ip', 'ip address', 'whitelist']],
    ['custom_plans', ['pricing', 'monthly', 'yearly', 'pay-as-you-go']],
    ['testing', ['test', 'demo store', 'debug']],
    ['publishing', ['publishing', 'approval', 'marketplace']],
  ];

  let bestTopic = 'create_app';
  let bestScore = 0;
  for (const [topic, keywords] of topicMatches) {
    const score = keywords.filter(kw => q.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestTopic = topic; }
  }

  const guide = GUIDES[bestTopic];
  const answer = [
    `**${guide.title}**`, '',
    guide.steps.join('\n'),
    ...(guide.notes ? ['', '**Notes:**', ...guide.notes.map(n => `- ${n}`)] : []),
  ].join('\n');

  const relatedGuides = topicMatches.map(([t]) => t).filter(t => t !== bestTopic).slice(0, 3);
  return ok({ answer, relatedGuides });
}

export function getGuide(topic: string): ToolResult<Guide> {
  const guide = GUIDES[topic];
  if (!guide) {
    return err('not_found', `No guide found for topic "${topic}".`, `Available topics: ${Object.keys(GUIDES).join(', ')}`);
  }
  return ok(guide);
}

export function listWebhookEvents(filter?: string): ToolResult<string[]> {
  if (!filter) return ok(Object.values(WEBHOOK_EVENT_CATEGORIES).flat());
  const events = WEBHOOK_EVENT_CATEGORIES[filter];
  if (!events) {
    return err('not_found', `No category "${filter}".`, `Available: ${Object.keys(WEBHOOK_EVENT_CATEGORIES).join(', ')}`);
  }
  return ok(events);
}

export function getEventSchema(eventName: string): ToolResult<EventSchema> {
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema) {
    return err('not_found', `No schema for event "${eventName}".`, `Known app events: ${Object.keys(EVENT_SCHEMAS).join(', ')}`);
  }
  return ok(schema);
}

export function getCodeExample(feature: string): ToolResult<CodeExample> {
  const example = CODE_EXAMPLES[feature];
  if (!example) {
    return err('not_found', `No code example for "${feature}".`, `Available: ${Object.keys(CODE_EXAMPLES).join(', ')}`);
  }
  return ok(example);
}

export function getOAuthGuide(mode?: 'easy' | 'custom'): ToolResult<string> {
  const guide = GUIDES['setup_oauth'];
  if (mode === 'easy') {
    const steps = guide.steps.filter(s => s.includes('EASY') || s.includes('app.store.authorize'));
    return ok(`**Easy Mode OAuth**\n\n${steps.join('\n')}`);
  }
  if (mode === 'custom') {
    const steps = guide.steps.filter(s => s.includes('CUSTOM') || s.includes('redirect'));
    return ok(`**Custom Mode OAuth**\n\n${steps.join('\n')}`);
  }
  return ok([
    '**Easy Mode** (recommended): Salla handles the authorization code automatically. Listen for `app.store.authorize` — the access token arrives in the payload.',
    '',
    '**Custom Mode**: You manually redirect the merchant to the Salla auth URL, receive the code in your redirect URI, then exchange it for tokens.',
    '',
    guide.steps.join('\n'),
    '',
    '**OAuth Endpoints:**',
    '- Auth: https://accounts.salla.sa/oauth2/auth',
    '- Token: https://accounts.salla.sa/oauth2/token',
    '- User Info: https://accounts.salla.sa/oauth2/user/info',
  ].join('\n'));
}

export function getPublishingChecklist(): ToolResult<typeof PUBLISHING_CHECKLIST> {
  return ok(PUBLISHING_CHECKLIST);
}

export function getSubscriptionPlanTypes(): ToolResult<typeof SUBSCRIPTION_PLAN_TYPES> {
  return ok(SUBSCRIPTION_PLAN_TYPES);
}
