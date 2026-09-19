import { useEffect, useMemo, useState } from 'react';
import { X, Check, AlertTriangle, MapPin, Droplets } from 'lucide-react';
import type { SmellMemory, SmellType } from '../utils/constants';
import {
  SMELL_TYPES,
  HUMIDITY_TOLERANCE,
  humidityLabel,
  getReviewStatus,
  REVIEW_REASON_LABELS,
} from '../utils/constants';
import { useMemoryStore } from '../store/memoryStore';
import type { ReviewInput } from '../utils/review';
import { evaluateReview } from '../utils/review';

interface Props {
  isOpen: boolean;
  memories: SmellMemory[];
  initialMemoryId?: string | null;
  onClose: () => void;
  /** 提交后回调，用于页面级提示 */
  onSubmitted?: (memory: SmellMemory, consistent: boolean, reasons: ReturnType<typeof evaluateReview>['reasons'], resealed: boolean) => void;
}

const humidityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface RowCompareProps {
  ok: boolean;
  okText: string;
  badText: string;
}

function CompareBadge({ ok, okText, badText }: RowCompareProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
        ok ? 'bg-moss-100 text-moss-600' : 'bg-brick-500/10 text-brick-600'
      }`}
    >
      {ok ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {ok ? okText : badText}
    </span>
  );
}

export default function ReviewModal({ isOpen, memories, initialMemoryId, onClose, onSubmitted }: Props) {
  const submitReview = useMemoryStore((s) => s.submitReview);
  const [selectedId, setSelectedId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [smellType, setSmellType] = useState<SmellType>('woody');
  const [humidity, setHumidity] = useState(5);
  const [conclusion, setConclusion] = useState('');

  const selectable = useMemo(
    () => [...memories].sort((a, b) => {
      // 待复核优先排在前面
      const sa = getReviewStatus(a) === 'pending' ? 0 : 1;
      const sb = getReviewStatus(b) === 'pending' ? 0 : 1;
      return sa - sb || b.created_at.localeCompare(a.created_at);
    }),
    [memories],
  );

  const target = useMemo(
    () => selectable.find((m) => m.id === selectedId) ?? null,
    [selectable, selectedId],
  );

  // 打开弹窗时：定位到指定记忆（或默认第一条），并用原档案内容预填
  useEffect(() => {
    if (!isOpen) return;
    const id =
      initialMemoryId && memories.some((m) => m.id === initialMemoryId)
        ? initialMemoryId
        : selectable[0]?.id ?? '';
    const m = memories.find((x) => x.id === id) ?? null;
    setSelectedId(id);
    setLocation(m?.location ?? '');
    setSmellType(m?.smell_type ?? 'woody');
    setHumidity(m?.humidity ?? 5);
    setConclusion('');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMemoryId, memories, selectable]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSwitch = (id: string) => {
    const m = memories.find((x) => x.id === id);
    setSelectedId(id);
    setLocation(m?.location ?? '');
    setSmellType(m?.smell_type ?? 'woody');
    setHumidity(m?.humidity ?? 5);
    setConclusion('');
  };

  const input: ReviewInput = {
    review_location: location,
    review_smell_type: smellType,
    review_humidity: humidity,
    conclusion,
  };

  const verdict = target ? evaluateReview(target, input) : null;
  const consistent = verdict?.consistent ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    const result = submitReview(target.id, input);
    if (result) {
      onSubmitted?.(target, result.consistent, result.reasons, result.resealed);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div
        className="relative w-full max-w-2xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.54 0 0 0 0 0.35 0 0 0 0 0.18 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800">复嗅登记</h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              重新闻一闻，与原档案逐项核对后再封存
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectable.length === 0 ? (
          <div className="p-10 text-center text-ink-700/60 font-hand text-xl">
            气味档案还是空的，先去封存一段气味吧
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 选择记忆 */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">选择要复核的记忆 *</label>
              <select
                value={selectedId}
                onChange={(e) => handleSwitch(e.target.value)}
                className="scent-select w-full"
              >
                {selectable.map((m) => (
                  <option key={m.id} value={m.id} className="bg-paper-50 text-ink-800">
                    {getReviewStatus(m) === 'pending' ? '【待复核】' : '【已封存】'}
                    {m.location} · {SMELL_TYPES.find((t) => t.value === m.smell_type)?.label}
                  </option>
                ))}
              </select>
            </div>

            {target && (
              <>
                {/* 原档案对照 */}
                <div className="rounded-xl bg-paper-100/80 border border-paper-200 p-4">
                  <div className="text-xs text-ink-700/50 mb-2 font-hand text-base">原封存档案</div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-800">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ochre-500" />
                      {target.location}
                    </span>
                    <span>
                      {SMELL_TYPES.find((t) => t.value === target.smell_type)?.emoji}{' '}
                      {SMELL_TYPES.find((t) => t.value === target.smell_type)?.label}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-moss-500" />
                      {target.humidity} 档 · {humidityLabel(target.humidity)}
                    </span>
                    <span
                      className={`scent-tag ${
                        getReviewStatus(target) === 'pending'
                          ? 'bg-brick-500/10 text-brick-600'
                          : 'bg-moss-100 text-moss-600'
                      }`}
                    >
                      {getReviewStatus(target) === 'pending' ? '待复核 · 封存已撤销' : '已封存'}
                    </span>
                  </div>
                </div>

                {/* 复嗅地点 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-ink-700">复嗅地点 *</label>
                    {verdict && (
                      <CompareBadge
                        ok={!verdict.reasons.includes('location_diff')}
                        okText="地点一致"
                        badText="地点不一致"
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="这次是在哪里闻到的？"
                    className="scent-input"
                  />
                </div>

                {/* 气味类型 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-700">气味类型</label>
                    {verdict && (
                      <CompareBadge
                        ok={!verdict.reasons.includes('type_diff')}
                        okText="类型一致"
                        badText="类型不一致"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SMELL_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSmellType(t.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                          smellType === t.value
                            ? 'text-paper-50 shadow-paper scale-[1.03]'
                            : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200'
                        }`}
                        style={smellType === t.value ? { backgroundColor: t.color } : {}}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 湿度档 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-700">
                      湿度档（允许相差 {HUMIDITY_TOLERANCE} 档）
                    </label>
                    {verdict && (
                      <CompareBadge
                        ok={!verdict.reasons.includes('humidity_diff')}
                        okText={`湿度一致 · 差 ${Math.abs(humidity - target.humidity)} 档`}
                        badText={`相差 ${Math.abs(humidity - target.humidity)} 档 · 超两档`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={humidity}
                      onChange={(e) => setHumidity(Number(e.target.value))}
                      className="scent-slider flex-1"
                      style={{ background: 'linear-gradient(90deg, #E0D1B3 0%, #7DA08C 100%)' }}
                    />
                    <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-full bg-moss-100 text-moss-600 font-semibold text-sm">
                      {humidity} · {humidityLabel(humidity)}
                    </span>
                  </div>
                  <div className="scent-slider-ticks">
                    {humidityTicks.map((v) => (
                      <span key={v} data-value={v} />
                    ))}
                  </div>
                </div>

                {/* 结论 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-ink-700">复核结论 *</label>
                    {verdict && (
                      <CompareBadge
                        ok={!verdict.reasons.includes('empty_conclusion')}
                        okText="结论已填写"
                        badText="结论为空"
                      />
                    )}
                  </div>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={3}
                    placeholder="这次闻到的与记忆是否吻合？写下你的复核结论……"
                    className="scent-textarea font-serif"
                  />
                </div>

                {/* 提交前的判定预览 */}
                <div
                  className={`rounded-xl p-3.5 border text-sm flex items-start gap-2.5 ${
                    consistent
                      ? 'bg-moss-50 border-moss-200 text-moss-600'
                      : 'bg-brick-500/5 border-brick-400/40 text-brick-600'
                  }`}
                >
                  {consistent ? (
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {consistent ? (
                      <span>
                        {getReviewStatus(target) === 'pending'
                          ? '四项全部一致，提交后将补齐结果并重新封存。'
                          : '四项全部一致，提交后维持封存状态。'}
                      </span>
                    ) : (
                      <span>
                        存在不一致，提交后该条将
                        <b>退回待复核、撤销封存</b>
                        ，原因会留档：
                        <span className="block mt-1 font-medium">
                          {verdict!.reasons.map((r) => REVIEW_REASON_LABELS[r]).join('；')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
              <button type="button" onClick={onClose} className="btn-secondary">
                取消
              </button>
              <button
                type="submit"
                disabled={!target}
                className={`font-medium rounded-xl px-5 py-2.5 transition-all duration-200 shadow-paper hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                  consistent
                    ? 'bg-moss-500 hover:bg-moss-600 text-paper-50'
                    : 'bg-brick-500 hover:bg-brick-600 text-paper-50'
                }`}
              >
                {consistent
                  ? target && getReviewStatus(target) === 'pending'
                    ? '补齐一致结果并重新封存'
                    : '确认一致并封存'
                  : '提交（退回待复核）'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
