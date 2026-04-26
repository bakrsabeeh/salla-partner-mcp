import { describe, it, expect } from 'vitest';
import {
  askQuestion, getGuide, listWebhookEvents, getEventSchema,
  getCodeExample, getOAuthGuide, getPublishingChecklist, getSubscriptionPlanTypes,
} from '../../src/knowledge/tools.js';

describe('Knowledge tools', () => {
  it('getGuide returns steps for setup_oauth', () => {
    const result = getGuide('setup_oauth');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.steps.length).toBeGreaterThan(0);
      expect(result.data.steps.some(s => s.includes('offline_access'))).toBe(true);
    }
  });

  it('getGuide returns error for unknown topic', () => {
    const result = getGuide('unknown_topic');
    expect(result.ok).toBe(false);
  });

  it('listWebhookEvents returns all events without filter', () => {
    const result = listWebhookEvents();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.length).toBeGreaterThan(10);
  });

  it('listWebhookEvents filters by category', () => {
    const result = listWebhookEvents('order');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.every(e => e.startsWith('order.'))).toBe(true);
  });

  it('getEventSchema returns fields for app.installed', () => {
    const result = getEventSchema('app.installed');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fields).toContain('app_name');
      expect(result.data.fields).toContain('installation_date');
    }
  });

  it('getEventSchema returns error for unknown event', () => {
    expect(getEventSchema('nonexistent.event').ok).toBe(false);
  });

  it('getCodeExample returns typescript code for verify_webhook', () => {
    const result = getCodeExample('verify_webhook');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.language).toBe('typescript');
      expect(result.data.code).toContain('timingSafeEqual');
    }
  });

  it('getOAuthGuide explains both modes', () => {
    const result = getOAuthGuide();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toContain('Easy Mode');
      expect(result.data).toContain('Custom Mode');
    }
  });

  it('getPublishingChecklist returns 6 steps', () => {
    const result = getPublishingChecklist();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.length).toBe(6);
  });

  it('getSubscriptionPlanTypes returns 6 plan types', () => {
    const result = getSubscriptionPlanTypes();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.length).toBe(6);
  });

  it('askQuestion returns a non-empty answer', () => {
    const result = askQuestion('How do I set up OAuth?');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.answer.length).toBeGreaterThan(0);
  });
});
