export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SmellType = 'woody' | 'floral' | 'fruity' | 'earthy' | 'spicy' | 'sweet' | 'musty' | 'fresh' | 'burnt' | 'other';
export type Emotion = 'warm' | 'nostalgic' | 'peaceful' | 'melancholy' | 'joyful' | 'uncomfortable' | 'surprising';
export type ReviewStatus = 'sealed' | 'pending';
export type ReviewReasonCode = 'location_diff' | 'type_diff' | 'humidity_diff' | 'empty_conclusion';

export interface ReviewRecord {
  id: string;
  reviewed_at: string;
  review_location: string;
  review_smell_type: SmellType;
  review_humidity: number;
  conclusion: string;
  consistent: boolean;
  reasons: ReviewReasonCode[];
  /** confirm：封存态复核一致；reseal：补齐一致结果后重新封存；reject：退回待复核 */
  action: 'confirm' | 'reseal' | 'reject';
}

export interface ReviewState {
  status: ReviewStatus;
  records: ReviewRecord[];
  /** 最近一次撤销封存的时间 */
  unsealed_at: string | null;
  /** 最近一次重新封存的时间 */
  resealed_at: string | null;
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
  review?: ReviewState;
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

/** 复嗅允许的湿度偏差：超过两档（即差值 > 2）判为不一致 */
export const HUMIDITY_TOLERANCE = 2;

export const REVIEW_REASON_LABELS: Record<ReviewReasonCode, string> = {
  location_diff: '复嗅地点不一致',
  type_diff: '气味类型不一致',
  humidity_diff: '湿度相差超过两档',
  empty_conclusion: '复核结论为空',
};

export function humidityLabel(h: number): string {
  if (h <= 2) return '极干';
  if (h <= 4) return '偏干';
  if (h <= 6) return '适中';
  if (h <= 8) return '偏湿';
  return '极湿';
}

export function getReviewStatus(m: Pick<SmellMemory, 'review'>): ReviewStatus {
  return m.review?.status ?? 'sealed';
}

export function getReviewRecords(m: Pick<SmellMemory, 'review'>): ReviewRecord[] {
  return m.review?.records ?? [];
}

export function latestReview(m: Pick<SmellMemory, 'review'>): ReviewRecord | null {
  const records = getReviewRecords(m);
  return records.length ? records[records.length - 1] : null;
}
