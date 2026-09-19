import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { buildReviewRecord, type ReviewInput } from '../utils/review';
import { mockMemories } from '../data/mockData';

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

interface MemoryStore {
  memories: SmellMemory[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  deleteMemory: (id: string) => void;
  /**
   * 登记一次复嗅：
   * - 不一致（地点/类型不同、湿度差超过两档、结论为空）→ 退回待复核，撤销原封存状态，原因留档
   * - 一致 → 重新封存（status 恢复为 sealed）
   */
  submitReview: (id: string, input: ReviewInput) => SmellMemory | undefined;
  initIfEmpty: () => void;
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
          status: 'sealed',
          reviews: [],
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
        if (!target) return undefined;

        const record = buildReviewRecord(target, input);
        const nowIso = new Date().toISOString();
        const passed = record.outcome === 'pass';

        const updated: SmellMemory = {
          ...target,
          reviews: [...(target.reviews ?? []), record],
          // 一致才可重新封存；否则退回待复核、撤销原封存
          status: passed ? 'sealed' : 'pending_review',
          unsealed_at: passed ? null : nowIso,
          updated_at: nowIso,
        };

        set({
          memories: get().memories.map((m) => (m.id === id ? updated : m)),
        });
        return updated;
      },
      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // 旧版本数据补齐复嗅字段：原已封存的记忆默认保持已封存
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as { memories?: SmellMemory[] };
        if (version < 2) {
          return {
            ...state,
            memories: (state.memories ?? []).map((m) => ({
              ...m,
              status: m.status ?? 'sealed',
              reviews: m.reviews ?? [],
              unsealed_at: m.unsealed_at ?? null,
            })),
          };
        }
        return state;
      },
    },
  ),
);
