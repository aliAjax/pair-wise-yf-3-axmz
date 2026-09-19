import type { SmellMemory, ReviewReasonCode } from './constants';
import { HUMIDITY_TOLERANCE } from './constants';

export interface ReviewInput {
  review_location: string;
  review_smell_type: SmellMemory['smell_type'];
  review_humidity: number;
  conclusion: string;
}

export interface ReviewVerdict {
  consistent: boolean;
  reasons: ReviewReasonCode[];
}

/**
 * 复嗅一致性判定：
 * - 复嗅地点或气味类型不同 → 不一致
 * - 湿度差超过两档（|差| > 2）→ 不一致
 * - 结论为空 → 不一致
 */
export function evaluateReview(memory: SmellMemory, input: ReviewInput): ReviewVerdict {
  const reasons: ReviewReasonCode[] = [];

  if (input.review_location.trim() !== memory.location.trim()) {
    reasons.push('location_diff');
  }
  if (input.review_smell_type !== memory.smell_type) {
    reasons.push('type_diff');
  }
  if (Math.abs(input.review_humidity - memory.humidity) > HUMIDITY_TOLERANCE) {
    reasons.push('humidity_diff');
  }
  if (!input.conclusion.trim()) {
    reasons.push('empty_conclusion');
  }

  return { consistent: reasons.length === 0, reasons };
}
