import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, RotateCcw, Search } from 'lucide-react';
import Header from '../components/Header';
import ReviewStatsPanel from '../components/ReviewStatsPanel';
import ReviewRow from '../components/ReviewRow';
import ReviewModal from '../components/ReviewModal';
import { useMemoryStore } from '../store/memoryStore';
import { usePersistentState } from '../hooks/usePersistentState';
import { SMELL_TYPES } from '../utils/constants';
import type { SmellMemory } from '../utils/constants';
import { getReviewStats, latestReview } from '../utils/review';

interface ReviewFilters {
  status: '' | 'sealed' | 'pending_review';
  smellType: string;
  outcome: '' | 'never' | 'pass' | 'fail';
  keyword: string;
}

const defaultFilters: ReviewFilters = {
  status: '',
  smellType: '',
  outcome: '',
  keyword: '',
};

export default function ReviewStation() {
  const { memories, initIfEmpty, submitReview } = useMemoryStore();
  // 筛选条件与浏览器存储同步，刷新后保留
  const [filters, setFilters] = usePersistentState<ReviewFilters>(
    'scent-review-filters',
    defaultFilters,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [initialMemoryId, setInitialMemoryId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    initIfEmpty();
  }, [initIfEmpty]);

  // 从档案页带来的 ?memory=xxx：自动打开登记弹窗
  useEffect(() => {
    const id = searchParams.get('memory');
    if (id && memories.some((m) => m.id === id)) {
      setInitialMemoryId(id);
      setModalOpen(true);
      searchParams.delete('memory');
      setSearchParams(searchParams, { replace: true });
    }
    // 仅在记忆首次加载后执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memories.length]);

  const stats = useMemo(() => getReviewStats(memories), [memories]);

  const filteredMemories = useMemo(() => {    const kw = filters.keyword.trim().toLowerCase();
    return memories.filter((m) => {
      if (filters.status && (m.status ?? 'sealed') !== filters.status) return false;
      if (filters.smellType && m.smell_type !== filters.smellType) return false;

      if (filters.outcome) {
        const latest = latestReview(m);
        if (filters.outcome === 'never' && latest) return false;
        if ((filters.outcome === 'pass' || filters.outcome === 'fail') &&
            latest?.outcome !== filters.outcome) return false;
      }

      if (kw) {
        const haystack = [
          m.location,
          m.source_guess,
          m.memory_text,
          ...(m.reviews ?? []).flatMap((r) => [
            r.review_location,
            r.conclusion,
          ]),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [memories, filters]);

  const handleFilterChange = <K extends keyof ReviewFilters>(
    key: K,
    value: ReviewFilters[K],
  ) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const resetFilters = () => setFilters(defaultFilters);

  const openReview = (id: string | null) => {
    setInitialMemoryId(id);
    setModalOpen(true);
  };

  const hasFilter =
    filters.status || filters.smellType || filters.outcome || filters.keyword.trim();

  return (
    <div className="min-h-screen">
      <Header
        onAdd={() => undefined}
        memoryCount={memories.length}
        activeNav="review"
        pendingCount={stats.pending}
      />

      <main className="container max-w-6xl pb-20">
        <div className="mb-6 rounded-2xl border border-paper-300 bg-paper-50/70 backdrop-blur p-5 shadow-paper">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-hand text-2xl text-ochre-600 flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                复嗅复核台
              </h2>
              <p className="text-sm text-ink-700/60 mt-1">
                再闻一次并登记地点、气味类型、湿度档与结论——与原档案一致方可重新封存，
                不一致则退回待复核并留档原因。
              </p>
            </div>
            <button onClick={() => openReview(null)} className="btn-primary shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4" />
                登记复嗅
              </span>
            </button>
          </div>
        </div>

        <ReviewStatsPanel stats={stats} />

        {/* 筛选栏 */}
        <section className="mb-6">
          <div className="bg-paper-50/70 backdrop-blur rounded-2xl border border-paper-300 p-4 md:p-5 shadow-paper">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2 lg:w-32 shrink-0">
                <span className="font-hand text-xl text-ochre-600">筛选</span>
                <span className="text-xs text-ink-700/50">
                  · {filteredMemories.length} 条
                </span>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-2.5">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    handleFilterChange(
                      'status',
                      e.target.value as ReviewFilters['status'],
                    )
                  }
                  className="scent-select bg-paper-50 border border-paper-300 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400"
                >
                  <option value="">全部状态</option>
                  <option value="sealed">🔒 已封存</option>
                  <option value="pending_review">⏳ 待复核</option>
                </select>

                <select
                  value={filters.smellType}
                  onChange={(e) => handleFilterChange('smellType', e.target.value)}
                  className="scent-select bg-paper-50 border border-paper-300 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400"
                >
                  <option value="">全部气味类型</option>
                  {SMELL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.outcome}
                  onChange={(e) =>
                    handleFilterChange(
                      'outcome',
                      e.target.value as ReviewFilters['outcome'],
                    )
                  }
                  className="scent-select bg-paper-50 border border-paper-300 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400"
                >
                  <option value="">全部复核结果</option>
                  <option value="never">从未复嗅</option>
                  <option value="pass">最近一致·已封存</option>
                  <option value="fail">最近退回·待复核</option>
                </select>

                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-700/40" />
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    placeholder="搜索地点 / 来源 / 复嗅结论…"
                    className="scent-input !pl-9"
                  />
                </div>
              </div>

              <button
                onClick={resetFilters}
                disabled={!hasFilter}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  hasFilter
                    ? 'bg-brick-500 hover:bg-brick-600 text-paper-50 shadow-paper hover:-translate-y-0.5'
                    : 'bg-paper-200/50 text-ink-700/40 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
            </div>
          </div>
        </section>

        {/* 列表 */}
        <section className="space-y-3">
          {filteredMemories.length === 0 ? (
            <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-16 text-center">
              <div className="text-5xl mb-3 select-none">🔍</div>
              <h3 className="font-serif text-xl text-ink-800 mb-2">
                {hasFilter ? '没有匹配的复核记录' : '还没有可复核的气味'}
              </h3>
              <p className="text-ink-700/60 text-sm max-w-md mx-auto mb-5">
                {hasFilter
                  ? '换一组筛选条件，或重置后查看全部记忆'
                  : '先去封存一段气味，之后再来做复嗅复核'}
              </p>
              {hasFilter && (
                <button onClick={resetFilters} className="btn-secondary">
                  清除筛选条件
                </button>
              )}
            </div>
          ) : (
            filteredMemories.map((m: SmellMemory) => (
              <ReviewRow key={m.id} memory={m} onReview={(id) => openReview(id)} />
            ))
          )}
        </section>
      </main>

      <footer className="pb-10 pt-4 text-center text-xs text-ink-700/40 font-hand text-lg">
        <p>愿每一缕气味，都是打开旧时光的钥匙 · Scent Archive</p>
      </footer>

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        memories={memories}
        initialMemoryId={initialMemoryId}
        onSubmit={submitReview}
      />
    </div>
  );
}
