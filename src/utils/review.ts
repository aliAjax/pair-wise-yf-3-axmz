import {
  HUMIDITY_TOLERANCE,
  type ReviewReason,
  type ReviewRecord,
  type SmellMemory,
  type SmellType,
} from './constants';
import { generateId } from './helpers';

export interface ReviewInput {
  /** 复嗅地点 */
  review_location: string;
  /** 复嗅气味类型 */
  review_smell_type: SmellType;
  /** 复嗅湿度档 */
  review_humidity: number;
  /** 复嗅结论 */
  conclusion: string;
}

/**
 * 复嗅复核判定：
 * - 复嗅地点与原封存地点不同
 * - 气味类型不同
 * - 湿度差超过两档（> HUMIDITY_TOLERANCE）
 * - 结论为空
 * 任一命中即视为不一致，该条退回待复核；
 * 全部一致（含湿度差 ≤ 两档、结论非空）才可重新封存。
 */
export function evaluateReview(
  memory: Pick<SmellMemory, 'location' | 'smell_type' | 'humidity'>,
  input: ReviewInput,
): { outcome: 'pass' | 'fail'; reasons: ReviewReason[]; humidityDiff: number } {
  const reasons: ReviewReason[] = [];

  if (input.review_location.trim() !== memory.location.trim()) {
    reasons.push('location_mismatch');
  }
  if (input.review_smell_type !== memory.smell_type) {
    reasons.push('type_mismatch');
  }

  const humidityDiff = Math.abs(input.review_humidity - memory.humidity);
  if (humidityDiff > HUMIDITY_TOLERANCE) {
    reasons.push('humidity_gap');
  }
  if (!input.conclusion.trim()) {
    reasons.push('empty_conclusion');
  }

  return {
    outcome: reasons.length === 0 ? 'pass' : 'fail',
    reasons,
    humidityDiff,
  };
}

export function buildReviewRecord(
  memory: SmellMemory,
  input: ReviewInput,
): ReviewRecord {
  const result = evaluateReview(memory, input);
  return {
    id: generateId(),
    reviewed_at: new Date().toISOString(),
    review_location: input.review_location.trim(),
    review_smell_type: input.review_smell_type,
    review_humidity: input.review_humidity,
    conclusion: input.conclusion.trim(),
    outcome: result.outcome,
    reasons: result.reasons,
    humidity_diff: result.humidityDiff,
  };
}

/** 最近一次复嗅记录 */
export function latestReview(memory: SmellMemory): ReviewRecord | undefined {
  return memory.reviews?.[memory.reviews.length - 1];
}

export interface ReviewStats {
  total: number;
  sealed: number;
  pending: number;
  reviewTimes: number;
  passedTimes: number;
  failedTimes: number;
  /** 各退回原因出现次数（留档统计） */
  reasonCounts: { reason: ReviewReason; count: number }[];
}

export function getReviewStats(memories: SmellMemory[]): ReviewStats {
  const countMap = new Map<ReviewReason, number>();
  let reviewTimes = 0;
  let passedTimes = 0;
  let failedTimes = 0;

  for (const m of memories) {
    for (const r of m.reviews ?? []) {
      reviewTimes += 1;
      if (r.outcome === 'pass') passedTimes += 1;
      else failedTimes += 1;
      for (const reason of r.reasons) {
        countMap.set(reason, (countMap.get(reason) ?? 0) + 1);
      }
    }
  }

  return {
    total: memories.length,
    sealed: memories.filter((m) => (m.status ?? 'sealed') === 'sealed').length,
    pending: memories.filter((m) => m.status === 'pending_review').length,
    reviewTimes,
    passedTimes,
    failedTimes,
    reasonCounts: [...countMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}
