import { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Sprout,
  Droplets,
  ScrollText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Equal,
} from 'lucide-react';
import type { SmellMemory, SmellType } from '../utils/constants';
import {
  SMELL_TYPES,
  HUMIDITY_TOLERANCE,
  REVIEW_REASON_INFO,
  humidityLevelLabel,
  getSmellTypeInfo,
} from '../utils/constants';
import type { ReviewInput } from '../utils/review';
import { evaluateReview, latestReview } from '../utils/review';
import { formatDate } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memories: SmellMemory[];
  initialMemoryId: string | null;
  onSubmit: (id: string, input: ReviewInput) => SmellMemory | undefined;
}

const humidityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildForm(memory: SmellMemory): ReviewInput {
  return {
    // 默认带入原档案值，方便「补齐一致结果」重新封存
    review_location: memory.location,
    review_smell_type: memory.smell_type,
    review_humidity: memory.humidity,
    conclusion: '',
  };
}

export default function ReviewModal({
  isOpen,
  onClose,
  memories,
  initialMemoryId,
  onSubmit,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<ReviewInput | null>(null);
  const [submittedMemory, setSubmittedMemory] = useState<SmellMemory | null>(null);

  const selectableMemories = memories;
  const selectedMemory =
    selectableMemories.find((m) => m.id === selectedId) ?? null;

  // 打开时初始化：优先使用指定记忆（来自卡片按钮），否则需手动选择
  useEffect(() => {
    if (isOpen) {
      setSubmittedMemory(null);
      if (initialMemoryId && memories.some((m) => m.id === initialMemoryId)) {
        const mem = memories.find((m) => m.id === initialMemoryId)!;
        setSelectedId(mem.id);
        setForm(buildForm(mem));
      } else {
        setSelectedId('');
        setForm(null);
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMemoryId, memories]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const update = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const handlePick = (id: string) => {
    const mem = selectableMemories.find((m) => m.id === id);
    if (mem) {
      setSelectedId(id);
      setForm(buildForm(mem));
      setSubmittedMemory(null);
    }
  };

  const fillOriginal = () => {
    if (selectedMemory) {
      setForm(buildForm(selectedMemory));
      setSubmittedMemory(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemory || !form) return;
    const updated = onSubmit(selectedMemory.id, form);
    if (updated) {
      setSubmittedMemory(updated);
      setSelectedId(updated.id);
    }
  };

  if (!isOpen) return null;

  const result = submittedMemory ? latestReview(submittedMemory) : null;
  const evaluation =
    selectedMemory && form
      ? evaluateReview(selectedMemory, form)
      : null;
  const willPass = evaluation?.outcome === 'pass';

  const checkRows = selectedMemory && form && [
    {
      icon: <MapPin className="w-4 h-4" />,
      label: '复嗅地点',
      review: form.review_location.trim() || '（未填写）',
      original: selectedMemory.location,
      ok: form.review_location.trim() === selectedMemory.location.trim(),
      hint: form.review_location.trim() === selectedMemory.location.trim()
        ? '与原封存地点一致'
        : '地点不同',
    },
    {
      icon: <Sprout className="w-4 h-4" />,
      label: '气味类型',
      review: getSmellTypeInfo(form.review_smell_type).label,
      original: getSmellTypeInfo(selectedMemory.smell_type).label,
      ok: form.review_smell_type === selectedMemory.smell_type,
      hint: form.review_smell_type === selectedMemory.smell_type
        ? '与原档案类型一致'
        : '气味类型不同',
    },
    {
      icon: <Droplets className="w-4 h-4" />,
      label: '湿度档',
      review: `${form.review_humidity} 档 · ${humidityLevelLabel(form.review_humidity)}`,
      original: `${selectedMemory.humidity} 档 · ${humidityLevelLabel(selectedMemory.humidity)}`,
      ok: Math.abs(form.review_humidity - selectedMemory.humidity) <= HUMIDITY_TOLERANCE,
      hint: `相差 ${Math.abs(form.review_humidity - selectedMemory.humidity)} 档` +
        (Math.abs(form.review_humidity - selectedMemory.humidity) > HUMIDITY_TOLERANCE
          ? `，超过 ${HUMIDITY_TOLERANCE} 档`
          : `，未超过 ${HUMIDITY_TOLERANCE} 档`),
    },
    {
      icon: <ScrollText className="w-4 h-4" />,
      label: '复嗅结论',
      review: form.conclusion.trim() || '（未填写）',
      original: '必填，不允许为空',
      ok: !!form.conclusion.trim(),
      hint: form.conclusion.trim() ? '结论已填写' : '结论为空',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div className="relative w-full max-w-2xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800">
              复嗅复核台
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              再闻一次，核对它是否与当初封存时一致
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 选择记忆 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700">
              选择要复核的记忆 *
            </label>
            <select
              value={selectedId}
              onChange={(e) => handlePick(e.target.value)}
              className="scent-select"
            >
              <option value="">— 请选择一条已封存的气味记忆 —</option>
              {selectableMemories.map((m) => {
                const t = getSmellTypeInfo(m.smell_type);
                return (
                  <option key={m.id} value={m.id} className="bg-paper-50 text-ink-800">
                    {m.status === 'pending_review' ? '⏳ ' : '🔒 '}
                    {m.location} · {t.emoji}{t.label}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedMemory && form && (
            <>
              {/* 原档案对照条 */}
              <div className="rounded-2xl border border-paper-300 bg-paper-100/70 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-hand text-lg text-ochre-600">原封存档案</span>
                  <span className="text-xs text-ink-700/50">
                    封存于 {formatDate(selectedMemory.created_at)}
                  </span>
                </div>
                <p className="font-serif text-lg font-semibold text-ink-800 leading-snug">
                  {selectedMemory.location}
                </p>
                <p className="text-sm text-ink-700/70 mt-0.5">
                  {getSmellTypeInfo(selectedMemory.smell_type).emoji}{' '}
                  {getSmellTypeInfo(selectedMemory.smell_type).label}
                  {' · '}
                  湿度 {selectedMemory.humidity} 档（{humidityLevelLabel(selectedMemory.humidity)}）
                </p>
              </div>

              {/* 登记表单 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
                  <span className="w-1.5 h-6 bg-moss-500 rounded-full" />
                  <h3 className="font-hand text-xl text-moss-600">本次复嗅登记</h3>
                  <button
                    type="button"
                    onClick={fillOriginal}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-ochre-600 hover:text-ochre-700 px-2 py-1 rounded-lg hover:bg-ochre-100 transition-colors"
                  >
                    <Equal className="w-3.5 h-3.5" />
                    一键带入原档案
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">
                    复嗅地点
                  </label>
                  <input
                    type="text"
                    value={form.review_location}
                    onChange={(e) => update('review_location', e.target.value)}
                    placeholder="这次是在哪里闻到的？"
                    className="scent-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    气味类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SMELL_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => update('review_smell_type', t.value as SmellType)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                          form.review_smell_type === t.value
                            ? 'text-paper-50 shadow-paper scale-[1.03]'
                            : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200'
                        }`}
                        style={form.review_smell_type === t.value ? { backgroundColor: t.color } : {}}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-700">湿度档</label>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-moss-100 text-moss-600 font-semibold text-sm">
                      {form.review_humidity} 档 · {humidityLevelLabel(form.review_humidity)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.review_humidity}
                    onChange={(e) => update('review_humidity', Number(e.target.value))}
                    className="scent-slider"
                    style={{ background: 'linear-gradient(90deg, #E0D1B3 0%, #7DA08C 100%)' }}
                  />
                  <div className="scent-slider-ticks">
                    {humidityTicks.map((v) => (
                      <span key={v} data-value={v} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">
                    复嗅结论
                  </label>
                  <textarea
                    value={form.conclusion}
                    onChange={(e) => update('conclusion', e.target.value)}
                    rows={3}
                    placeholder="这次闻到的和记忆里一样吗？写下复嗅结论（留空将直接退回待复核）..."
                    className="scent-textarea font-serif"
                  />
                </div>
              </div>

              {/* 实时比对 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
                  <span className="w-1.5 h-6 bg-lavender-500 rounded-full" />
                  <h3 className="font-hand text-xl text-lavender-600">实时比对</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {checkRows.map((row) => (
                    <div
                      key={row.label}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                        row.ok
                          ? 'bg-moss-50 border-moss-200'
                          : 'bg-brick-500/5 border-brick-400/40'
                      }`}
                    >
                      <span className={row.ok ? 'text-moss-500 mt-0.5' : 'text-brick-500 mt-0.5'}>
                        {row.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-700/70">
                          {row.icon}
                          {row.label}
                        </div>
                        <div className="text-sm text-ink-800 mt-0.5 break-words">
                          本次：{row.review}
                        </div>
                        <div className="text-[11px] text-ink-700/55 break-words">
                          原档：{row.original}
                        </div>
                        <div className={`text-[11px] mt-0.5 font-medium ${row.ok ? 'text-moss-600' : 'text-brick-600'}`}>
                          {row.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 预判结果条 */}
                <div
                  className={`mt-2 flex items-start gap-2.5 p-3.5 rounded-xl border ${
                    willPass
                      ? 'bg-moss-100/70 border-moss-300 text-moss-600'
                      : 'bg-brick-500/10 border-brick-400/50 text-brick-600'
                  }`}
                >
                  {willPass ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    {willPass ? (
                      <>
                        <b>符合重新封存条件。</b>
                        登记后该记忆将重新封存。
                      </>
                    ) : (
                      <>
                        <b>登记后该条将退回待复核，原封存状态撤销，以下原因将留档：</b>
                        <span className="block mt-1 flex flex-wrap gap-1.5">
                          {evaluation?.reasons.map((r) => (
                            <span
                              key={r}
                              className="inline-flex px-2 py-0.5 rounded-full bg-brick-500/15 text-brick-600 text-xs font-medium"
                            >
                              {REVIEW_REASON_INFO[r].label}
                            </span>
                          ))}
                        </span>
                        <span className="block mt-1 text-xs text-brick-600/80">
                          补齐与原档案一致的地点、类型、湿度（差≤两档）并填写结论后，才可重新封存。
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 提交后的结论反馈 */}
              {result && (
                <div
                  className={`p-4 rounded-2xl border ${
                    result.outcome === 'pass'
                      ? 'bg-moss-100/70 border-moss-300'
                      : 'bg-brick-500/8 border-brick-400/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {result.outcome === 'pass' ? (
                      <CheckCircle2 className="w-5 h-5 text-moss-600" />
                    ) : (
                      <RotateCcw className="w-5 h-5 text-brick-500" />
                    )}
                    <span className={`font-serif text-lg font-semibold ${
                      result.outcome === 'pass' ? 'text-moss-600' : 'text-brick-600'
                    }`}>
                      {result.outcome === 'pass' ? '复核一致，已重新封存' : '已退回待复核'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-700/80">
                    {result.outcome === 'pass'
                      ? `复嗅于 ${formatDate(result.reviewed_at)} 登记，各项与原档案一致（湿度相差 ${result.humidity_diff} 档），封存状态已恢复。`
                      : `复嗅于 ${formatDate(result.reviewed_at)} 登记，原封存状态已撤销，退回原因：${result.reasons
                          .map((r) => REVIEW_REASON_INFO[r].label)
                          .join('、')}。请补齐一致结果后重新封存。`}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
                <button type="button" onClick={onClose} className="btn-secondary">
                  {result ? '关闭' : '取消'}
                </button>
                {!result && (
                  <button
                    type="submit"
                    className={
                      willPass
                        ? 'btn-primary !bg-moss-500 hover:!bg-moss-600'
                        : 'btn-primary !bg-brick-500 hover:!bg-brick-600'
                    }
                  >
                    {willPass ? '登记并重新封存' : '登记复嗅结果'}
                  </button>
                )}
                {result?.outcome === 'fail' && (
                  <button
                    type="button"
                    onClick={fillOriginal}
                    className="btn-primary !bg-moss-500 hover:!bg-moss-600"
                  >
                    补齐一致结果
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
