import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  Archive,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  X,
} from 'lucide-react';
import { useMemoryStore } from '@/store/memoryStore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ReviewModal from '@/components/ReviewModal';
import {
  SMELL_TYPES,
  REVIEW_REASON_LABELS,
  getReviewStatus,
  getReviewRecords,
  humidityLabel,
  type SmellMemory,
  type ReviewReasonCode,
  type ReviewRecord,
} from '@/utils/constants';
import { formatDate } from '@/utils/helpers';

interface ReviewFilters {
  status: '' | 'sealed' | 'pending';
  smellType: string;
  keyword: string;
}

const defaultFilters: ReviewFilters = { status: '', smellType: '', keyword: '' };

interface Toast {
  kind: 'reseal' | 'confirm' | 'reject';
  reasons: ReviewReasonCode[];
  location: string;
}

function actionLabel(r: ReviewRecord) {
  if (r.action === 'reseal') return { text: '补齐一致 · 重新封存', cls: 'bg-moss-100 text-moss-600' };
  if (r.action === 'confirm') return { text: '复嗅一致', cls: 'bg-moss-50 text-moss-500' };
  return { text: '退回待复核 · 撤销封存', cls: 'bg-brick-500/10 text-brick-600' };
}

export default function ReviewStation() {
  const { memories, initIfEmpty } = useMemoryStore();
  const [filters, setFilters] = useLocalStorage<ReviewFilters>('scent-review-filters', defaultFilters);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMemoryId, setModalMemoryId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    initIfEmpty();
  }, [initIfEmpty]);

  // ?memory=xxx 时直接打开该记忆的登记弹窗
  useEffect(() => {
    const id = searchParams.get('memory');
    if (id && memories.some((m) => m.id === id)) {
      setModalMemoryId(id);
      setModalOpen(true);
      setExpandedId(id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, memories, setSearchParams]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const total = memories.length;
    const pending = memories.filter((m) => getReviewStatus(m) === 'pending').length;
    const reviewed = memories.filter((m) => getReviewRecords(m).length > 0).length;
    const totalRecords = memories.reduce((acc, m) => acc + getReviewRecords(m).length, 0);
    const lastRecords = memories
      .map((m) => getReviewRecords(m).at(-1))
      .filter((r): r is ReviewRecord => !!r);
    const passed = lastRecords.filter((r) => r.consistent).length;
    const passRate = lastRecords.length ? Math.round((passed / lastRecords.length) * 100) : 0;
    return { total, pending, reviewed, totalRecords, passRate };
  }, [memories]);

  const filtered = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return memories.filter((m) => {
      if (filters.status && getReviewStatus(m) !== filters.status) return false;
      if (filters.smellType && m.smell_type !== filters.smellType) return false;
      if (kw) {
        const hay = `${m.location} ${m.source_guess} ${m.memory_text}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    }).sort((a, b) => {
      const sa = getReviewStatus(a) === 'pending' ? 0 : 1;
      const sb = getReviewStatus(b) === 'pending' ? 0 : 1;
      return sa - sb || b.updated_at.localeCompare(a.updated_at);
    });
  }, [memories, filters]);

  const hasFilter = filters.status || filters.smellType || filters.keyword.trim();
  const patchFilter = (patch: Partial<ReviewFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const openModal = (id?: string) => {
    setModalMemoryId(id ?? null);
    setModalOpen(true);
  };

  const handleSubmitted = (
    memory: SmellMemory,
    consistent: boolean,
    reasons: ReviewReasonCode[],
    resealed: boolean,
  ) => {
    setToast({
      kind: resealed ? 'reseal' : consistent ? 'confirm' : 'reject',
      reasons,
      location: memory.location,
    });
    setExpandedId(memory.id);
  };

  const statCards = [
    { icon: Archive, label: '档案总数', value: stats.total, tint: 'text-ochre-600 bg-ochre-100' },
    { icon: AlertCircle, label: '待复核', value: stats.pending, tint: 'text-brick-600 bg-brick-500/10' },
    { icon: RefreshCcw, label: '已复嗅（次/条）', value: `${stats.totalRecords}/${stats.reviewed}`, tint: 'text-lavender-600 bg-lavender-300/30' },
    { icon: CheckCircle2, label: '末次一致率', value: `${stats.passRate}%`, tint: 'text-moss-600 bg-moss-100' },
  ];

  return (
    <div className="min-h-screen">
      <header className="pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="container max-w-6xl">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-ink-800 flex items-center gap-3">
            <FlaskConical className="w-8 h-8 md:w-11 md:h-11 text-ochre-500" />
            复嗅复核台
          </h1>
          <p className="mt-3 font-hand text-lg md:text-xl text-ink-700/70">
            重新闻一闻旧档案：地点、类型、湿度与结论逐项核对，一致才可重新封存
          </p>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((c) => (
              <div
                key={c.label}
                className="bg-paper-50/80 backdrop-blur rounded-2xl border border-paper-300 p-4 shadow-paper flex items-center gap-3"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.tint}`}>
                  <c.icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-serif text-2xl font-bold text-ink-800 leading-tight">{c.value}</div>
                  <div className="text-xs text-ink-700/60 truncate">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container max-w-6xl pb-20">
        {/* 筛选 */}
        <section className="mb-6">
          <div className="bg-paper-50/70 backdrop-blur rounded-2xl border border-paper-300 p-4 md:p-5 shadow-paper">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 md:w-32 shrink-0">
                <span className="font-hand text-xl text-ochre-600">筛选</span>
                <span className="text-xs text-ink-700/50">· {filtered.length} 条匹配</span>
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl border border-paper-300 overflow-hidden">
                  {([
                    { v: '', label: '全部' },
                    { v: 'pending', label: '待复核' },
                    { v: 'sealed', label: '已封存' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => patchFilter({ status: opt.v })}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        filters.status === opt.v
                          ? 'bg-ochre-500 text-paper-50'
                          : 'bg-paper-50 text-ink-700 hover:bg-paper-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <select
                  value={filters.smellType}
                  onChange={(e) => patchFilter({ smellType: e.target.value })}
                  className="scent-select bg-paper-50 border border-paper-300 rounded-xl px-4 py-2 text-sm font-medium text-ink-800"
                >
                  <option value="">全部气味类型</option>
                  {SMELL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => patchFilter({ keyword: e.target.value })}
                  placeholder="搜索地点 / 来源 / 回忆…"
                  className="scent-input flex-1 min-w-[180px] !py-2"
                />
              </div>

              <button
                onClick={() => setFilters(defaultFilters)}
                disabled={!hasFilter}
                className={`btn-secondary !py-2 ${!hasFilter ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                重置
              </button>
            </div>
          </div>
        </section>

        {/* 列表 */}
        {filtered.length === 0 ? (
          <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-20 text-center">
            <div className="text-6xl mb-4 select-none">🔍</div>
            <h3 className="font-serif text-2xl text-ink-800 mb-2">
              {hasFilter ? '没有匹配的复核记录' : '还没有气味档案'}
            </h3>
            <p className="text-ink-700/60 max-w-md mx-auto mb-6">
              {hasFilter
                ? '换一组筛选条件，待复核的气味会优先排在前面。'
                : '先去气味档案封存一缕味道，再回来做复嗅复核。'}
            </p>
            {hasFilter && (
              <button onClick={() => setFilters(defaultFilters)} className="btn-secondary">
                清除筛选条件
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m, idx) => {
              const status = getReviewStatus(m);
              const pending = status === 'pending';
              const records = getReviewRecords(m);
              const latest = records.at(-1);
              const expanded = expandedId === m.id;
              const stype = SMELL_TYPES.find((t) => t.value === m.smell_type)!;

              return (
                <article
                  key={m.id}
                  className={`bg-paper-50 rounded-2xl border shadow-paper overflow-hidden animate-fadeInUp ${
                    pending ? 'border-brick-400/50 ring-1 ring-brick-400/20' : 'border-paper-300'
                  }`}
                  style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif text-xl font-semibold text-ink-800 leading-tight">
                            {m.location}
                          </h3>
                          <span
                            className={`scent-tag ${
                              pending
                                ? 'bg-brick-500/10 text-brick-600'
                                : 'bg-moss-100 text-moss-600'
                            }`}
                          >
                            {pending ? <AlertCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                            {pending ? '待复核 · 封存已撤销' : '已封存'}
                          </span>
                          <span className="scent-tag text-paper-50" style={{ backgroundColor: stype.color }}>
                            {stype.emoji} {stype.label}
                          </span>
                        </div>
                        <p className="text-sm text-ink-700/70 mt-1">
                          {m.source_guess} · 原湿度 {m.humidity} 档（{humidityLabel(m.humidity)}）
                        </p>

                        {pending && latest && (
                          <div className="mt-2.5 rounded-lg bg-brick-500/5 border border-brick-400/30 px-3 py-2 text-xs text-brick-600">
                            <span className="font-semibold">
                              {formatDate(latest.reviewed_at)} 撤销封存：
                            </span>
                            {latest.reasons.map((r) => REVIEW_REASON_LABELS[r]).join('；')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openModal(m.id)}
                          className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
                        >
                          <FlaskConical className="w-4 h-4" />
                          {pending ? '补齐复嗅' : '登记复嗅'}
                        </button>
                        {records.length > 0 && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : m.id)}
                            className="btn-ghost !py-2 !px-3 text-sm inline-flex items-center gap-1"
                          >
                            <ClipboardList className="w-4 h-4" />
                            记录 ({records.length})
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {expanded && records.length > 0 && (
                    <div className="px-4 md:px-5 pb-4 md:pb-5 animate-expand">
                      <div className="rounded-xl border border-paper-200 divide-y divide-paper-200 overflow-hidden">
                        {[...records].reverse().map((r) => {
                          const act = actionLabel(r);
                          const rType = SMELL_TYPES.find((t) => t.value === r.review_smell_type)!;
                          return (
                            <div key={r.id} className="bg-paper-100/50 p-3.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                                <span className="text-xs text-ink-700/60 font-medium">
                                  {formatDate(r.reviewed_at)}
                                </span>
                                <span className={`scent-tag ${act.cls}`}>{act.text}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-[13px] text-ink-800">
                                <span>
                                  <b className="text-ink-700/60 font-normal">地点：</b>
                                  {r.review_location}
                                  {r.reasons.includes('location_diff') && (
                                    <span className="ml-1 text-brick-600 text-xs">不一致</span>
                                  )}
                                </span>
                                <span>
                                  <b className="text-ink-700/60 font-normal">类型：</b>
                                  {rType.emoji} {rType.label}
                                  {r.reasons.includes('type_diff') && (
                                    <span className="ml-1 text-brick-600 text-xs">不一致</span>
                                  )}
                                </span>
                                <span>
                                  <b className="text-ink-700/60 font-normal">湿度：</b>
                                  {r.review_humidity} 档（{humidityLabel(r.review_humidity)}）
                                  {r.reasons.includes('humidity_diff') && (
                                    <span className="ml-1 text-brick-600 text-xs">差超两档</span>
                                  )}
                                </span>
                              </div>
                              <p className="text-[13px] text-ink-800 mt-1.5">
                                <b className="text-ink-700/60 font-normal">结论：</b>
                                {r.conclusion || <span className="text-brick-600">（结论为空）</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <ReviewModal
        isOpen={modalOpen}
        memories={memories}
        initialMemoryId={modalMemoryId}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
      />

      {/* 提交结果提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fadeInUp">
          <div
            className={`flex items-start gap-2.5 pl-4 pr-3 py-3 rounded-2xl shadow-paper-hover border max-w-md ${
              toast.kind === 'reject'
                ? 'bg-paper-50 border-brick-400/50 text-brick-600'
                : 'bg-paper-50 border-moss-200 text-moss-600'
            }`}
          >
            {toast.kind === 'reject' ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <div className="font-semibold">
                {toast.kind === 'reseal'
                  ? `「${toast.location}」已补齐一致结果，重新封存`
                  : toast.kind === 'confirm'
                    ? `「${toast.location}」复嗅一致，封存有效`
                    : `「${toast.location}」已退回待复核，封存撤销`}
              </div>
              {toast.kind === 'reject' && (
                <div className="text-xs mt-0.5 text-brick-600/80">
                  原因留档：{toast.reasons.map((r) => REVIEW_REASON_LABELS[r]).join('；')}
                </div>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
