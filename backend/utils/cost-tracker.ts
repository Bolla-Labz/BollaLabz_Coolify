// Last Modified: 2025-11-23 17:30
/**
 * Cost Tracking Utility
 * Tracks all API usage costs across integrations
 */

import { CostEntry } from '../types';

export class CostTracker {
  private costs: CostEntry[] = [];

  /**
   * Record a cost entry
   */
  trackCost(entry: Omit<CostEntry, 'timestamp'>): void {
    const costEntry: CostEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.costs.push(costEntry);

    // In production, this would write to database
    console.log('[Cost Tracker]', costEntry);

    // TODO: Write to call_costs table in database
    // await db.callCosts.create({ data: costEntry });
  }

  /**
   * Get total costs for a specific service
   */
  getTotalCost(service?: CostEntry['service']): number {
    const filtered = service
      ? this.costs.filter((c) => c.service === service)
      : this.costs;

    return filtered.reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get costs within a date range
   */
  getCostsByDateRange(startDate: Date, endDate: Date): CostEntry[] {
    return this.costs.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get cost breakdown by service
   */
  getCostBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {
      twilio: 0,
      vapi: 0,
      elevenlabs: 0,
      anthropic: 0,
    };

    this.costs.forEach((entry) => {
      breakdown[entry.service] += entry.cost;
    });

    return breakdown;
  }

  /**
   * Get all costs (for testing/debugging)
   */
  getAllCosts(): CostEntry[] {
    return [...this.costs];
  }

  /**
   * Clear all tracked costs (for testing)
   */
  clear(): void {
    this.costs = [];
  }
}

// Pricing constants (update these based on actual pricing)
export const PRICING = {
  twilio: {
    sms: {
      outbound: 0.0079, // per message
      inbound: 0.0079,
    },
    voice: {
      outbound: 0.013, // per minute
      inbound: 0.0085,
    },
  },
  vapi: {
    // Vapi pricing per minute
    voice: 0.05,
  },
  elevenlabs: {
    // ElevenLabs pricing per 1000 characters
    tts: 0.18 / 1000,
  },
  anthropic: {
    // Claude Sonnet 4.5 pricing per 1M tokens
    input: 3.0 / 1_000_000,
    output: 15.0 / 1_000_000,
  },
};

export function calculateTwilioSmsCost(direction: 'inbound' | 'outbound'): number {
  return PRICING.twilio.sms[direction];
}

export function calculateTwilioVoiceCost(
  direction: 'inbound' | 'outbound',
  durationSeconds: number
): number {
  const minutes = Math.ceil(durationSeconds / 60);
  return PRICING.twilio.voice[direction] * minutes;
}

export function calculateVapiCost(durationSeconds: number): number {
  const minutes = Math.ceil(durationSeconds / 60);
  return PRICING.vapi.voice * minutes;
}

export function calculateElevenLabsCost(characterCount: number): number {
  return PRICING.elevenlabs.tts * characterCount;
}

export function calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * PRICING.anthropic.input + outputTokens * PRICING.anthropic.output
  );
}

// Singleton instance
export const costTracker = new CostTracker();
