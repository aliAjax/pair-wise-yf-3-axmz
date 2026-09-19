export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SmellType = 'woody' | 'floral' | 'fruity' | 'earthy' | 'spicy' | 'sweet' | 'musty' | 'fresh' | 'burnt' | 'other';
export type Emotion = 'warm' | 'nostalgic' | 'peaceful' | 'melancholy' | 'joyful' | 'uncomfortable' | 'surprising';

/** 封存状态：已封存 / 待复核（复核不一致退回） */
export type MemoryStatus = 'sealed' | 'pending_review';

/** 复嗅退回原因码 */
export type ReviewReason = 'location_mismatch' | 'type_mismatch' | 'humidity_gap' | 'empty_conclusion';
export type ReviewOutcome = 'pass' | 'fail';

export interface ReviewRecord {
  id: string;
  reviewed_at: string;
  /** 复嗅地点 */
  review_location: string;
  /** 复嗅气味类型 */
  review_smell_type: SmellType;
  /** 复嗅湿度档（1-10） */
  review_humidity: number;
  /** 复嗅结论 */
  conclusion: string;
  /** 与原档案是否一致（一致才可重新封存） */
  outcome: ReviewOutcome;
  /** 退回原因留档；通过时为空数组 */
  reasons: ReviewReason[];
  /** 与原档案的湿度档差 */
  humidity_diff: number;
}

export interface SmellMemory {
  id: string;
  location: string;
  source_guess: string;
  intensity: number;
  humidity: number;
  season: Season;
  smell_type: SmellType;
  memory_text: string;
  color_association: string;
  emotion: Emotion;
  want_again: boolean;
  created_at: string;
  updated_at: string;
  /** 当前封存状态 */
  status?: MemoryStatus;
  /** 历次复嗅记录（含退回留档与一致重新封存记录） */
  reviews?: ReviewRecord[];
  /** 最近一次被撤销封存的时间；重新封存后清空 */
  unsealed_at?: string | null;
}

export const SEASONS: { value: Season; label: string; emoji: string }[] = [
  { value: 'spring', label: '春', emoji: '🌸' },
  { value: 'summer', label: '夏', emoji: '☀️' },
  { value: 'autumn', label: '秋', emoji: '🍂' },
  { value: 'winter', label: '冬', emoji: '❄️' },
];

export const SMELL_TYPES: { value: SmellType; label: string; emoji: string; color: string }[] = [
  { value: 'woody', label: '木质', emoji: '🪵', color: '#8B5A2B' },
  { value: 'floral', label: '花香', emoji: '🌺', color: '#C06C84' },
  { value: 'fruity', label: '果香', emoji: '🍑', color: '#F67280' },
  { value: 'earthy', label: '泥土', emoji: '🌱', color: '#6B8E23' },
  { value: 'spicy', label: '辛香', emoji: '🌶️', color: '#CD5C5C' },
  { value: 'sweet', label: '甜香', emoji: '🍯', color: '#D4A574' },
  { value: 'musty', label: '霉味', emoji: '🍄', color: '#8B7355' },
  { value: 'fresh', label: '清新', emoji: '🍃', color: '#7DA08C' },
  { value: 'burnt', label: '焦味', emoji: '🔥', color: '#4A3728' },
  { value: 'other', label: '其他', emoji: '✨', color: '#9B8AA6' },
];

export const EMOTIONS: { value: Emotion; label: string; emoji: string; bg: string; text: string }[] = [
  { value: 'warm', label: '温暖', emoji: '🤗', bg: 'bg-ochre-100', text: 'text-ochre-600' },
  { value: 'nostalgic', label: '怀旧', emoji: '📜', bg: 'bg-lavender-300/40', text: 'text-lavender-600' },
  { value: 'peaceful', label: '宁静', emoji: '🌊', bg: 'bg-moss-100', text: 'text-moss-600' },
  { value: 'melancholy', label: '忧郁', emoji: '🌧️', bg: 'bg-paper-300', text: 'text-ink-700' },
  { value: 'joyful', label: '愉悦', emoji: '🎉', bg: 'bg-paper-200', text: 'text-brick-500' },
  { value: 'uncomfortable', label: '不适', emoji: '😣', bg: 'bg-brick-400/20', text: 'text-brick-600' },
  { value: 'surprising', label: '惊喜', emoji: '✨', bg: 'bg-lavender-300/40', text: 'text-lavender-600' },
];

export const HUMIDITY_LABELS: Record<number, string> = {
  1: '极干',
  3: '偏干',
  5: '适中',
  7: '偏湿',
  10: '极湿',
};

export function getSeasonInfo(s: Season) {
  return SEASONS.find(x => x.value === s)!;
}
export function getSmellTypeInfo(t: SmellType) {
  return SMELL_TYPES.find(x => x.value === t)!;
}
export function getEmotionInfo(e: Emotion) {
  return EMOTIONS.find(x => x.value === e)!;
}

/** 湿度允许的最大档差：超过两档即退回待复核 */
export const HUMIDITY_TOLERANCE = 2;

export const REVIEW_REASON_INFO: Record<ReviewReason, { label: string; desc: string }> = {
  location_mismatch: { label: '地点不同', desc: '复嗅地点与原封存地点不一致' },
  type_mismatch: { label: '类型不同', desc: '复嗅气味类型与原档案不一致' },
  humidity_gap: { label: '湿差超两档', desc: '复嗅湿度与原档案相差超过两档' },
  empty_conclusion: { label: '结论为空', desc: '复嗅结论未填写' },
};

export function humidityLevelLabel(h: number): string {
  if (h <= 2) return '极干';
  if (h <= 4) return '偏干';
  if (h <= 6) return '适中';
  if (h <= 8) return '偏湿';
  return '极湿';
}

/** 1-10 湿度对应的五档序号（每两档为一档，差超过两档即跨档） */
export function humidityBucket(h: number): number {
  if (h <= 2) return 1;
  if (h <= 4) return 2;
  if (h <= 6) return 3;
  if (h <= 8) return 4;
  return 5;
}
