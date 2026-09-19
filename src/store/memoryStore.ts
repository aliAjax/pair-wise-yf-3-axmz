import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion, ReviewRecord } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { mockMemories } from '../data/mockData';
import { evaluateReview, type ReviewInput } from '../utils/review';

export interface MemoryInput {
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
}

export interface ReviewResult {
  consistent: boolean;
  reasons: ReviewRecord['reasons'];
  /** 是否由待复核重新封存（补齐一致结果） */
  resealed: boolean;
}

interface MemoryStore {
  memories: SmellMemory[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  deleteMemory: (id: string) => void;
  submitReview: (id: string, input: ReviewInput) => ReviewResult | null;
  initIfEmpty: () => void;
}

/** 旧数据（没有 review 字段）默认视为已封存 */
function ensureReview(m: SmellMemory): SmellMemory {
  if (m.review) return m;
  return { ...m, review: { status: 'sealed', records: [], unsealed_at: null, resealed_at: null } };
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          created_at: now,
          updated_at: now,
          review: { status: 'sealed', records: [], unsealed_at: null, resealed_at: null },
        };
        set({ memories: [newMem, ...get().memories] });
      },
      updateMemory: (id, input) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? { ...m, ...input, updated_at: new Date().toISOString() }
              : m,
          ),
        });
      },
      deleteMemory: (id) => {
        set({ memories: get().memories.filter((m) => m.id !== id) });
      },
      submitReview: (id, input) => {
        const target = get().memories.find((m) => m.id === id);
        if (!target) return null;

        const memory = ensureReview(target);
        const verdict = evaluateReview(memory, input);
        const now = new Date().toISOString();
        const wasPending = memory.review!.status === 'pending';

        // 不一致（或结论为空）：退回待复核，原封存状态撤销，原因随记录留档
        const nextStatus = verdict.consistent ? 'sealed' : 'pending';
        const action: ReviewRecord['action'] = verdict.consistent
          ? (wasPending ? 'reseal' : 'confirm')
          : 'reject';

        const record: ReviewRecord = {
          id: generateId(),
          reviewed_at: now,
          review_location: input.review_location.trim(),
          review_smell_type: input.review_smell_type,
          review_humidity: input.review_humidity,
          conclusion: input.conclusion.trim(),
          consistent: verdict.consistent,
          reasons: verdict.reasons,
          action,
        };

        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? {
                  ...memory,
                  review: {
                    status: nextStatus,
                    records: [...memory.review!.records, record],
                    unsealed_at: !verdict.consistent ? now : memory.review!.unsealed_at,
                    resealed_at: verdict.consistent && wasPending ? now : memory.review!.resealed_at,
                  },
                }
              : m,
          ),
        });

        return { consistent: verdict.consistent, reasons: verdict.reasons, resealed: verdict.consistent && wasPending };
      },
      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories.map(ensureReview) });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<MemoryStore>) };
        // 兼容旧版本存档：补齐 review 字段
        if (Array.isArray(merged.memories)) {
          merged.memories = merged.memories.map(ensureReview);
        }
        return merged as MemoryStore;
      },
    },
  ),
);
