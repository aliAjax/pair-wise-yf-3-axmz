import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Hourglass,
  MapPin,
  Sprout,
  Droplets,
  ScrollText,
  CheckCircle2,
  XCircle,
  FlaskConical,
} from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import {
  getSmellTypeInfo,
  REVIEW_REASON_INFO,
  humidityLevelLabel,
} from '../utils/constants';
import { formatDate } from '../utils/helpers';
import { latestReview } from '../utils/review';

interface Props {
  memory: SmellMemory;
  onReview: (id: string) => void;
}

export default function ReviewRow({ memory, onReview }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pending = memory.status === 'pending_review';
  const stype = getSmellTypeInfo(memory.smell_type);
  const latest = latestReview(memory);
  const reviews = memory.reviews ?? [];

  return (
    <article
      className={`bg-paper-50 rounded-2xl border shadow-card overflow-hidden transition-all duration-300 animate-fadeInUp ${
        pending ? 'border-brick-400/60' : 'border-paper-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-ink-800 leading-tight">
                {memory.location}
              </h3>
              {pending ? (
                <span className="scent-tag bg-brick-500/15 text-brick-600 border border-brick-400/40">
                  <Hourglass className="w-3 h-3" /> 待复核
                </span>
              ) : (
                <span className="scent-tag bg-moss-100 text-moss-600 border border-moss-200">
                  <Lock className="w-3 h-3" /> 已封存
                </span>
              )}
            </div>
            <p className="text-sm text-ink-700/70 mt-1">
              <span className="mr-1" style={{ color: stype.color }}>{stype.emoji}</span>
              {stype.label}
              {' · '}
              原湿度 {memory.humidity} 档（{humidityLevelLabel(memory.humidity)}）
              {' · '}
              复嗅 {reviews.length} 次
            </p>

            {pending && latest && (
              <div className="mt-2 rounded-xl bg-brick-500/8 border border-brick-400/30 p-2.5">
                <div className="text-xs font-medium text-brick-600 mb-1">
                  封存已于 {formatDate(latest.reviewed_at)} 撤销，退回原因：
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {latest.reasons.map((r) => (
                    <span
                      key={r}
                      className="inline-flex px-2 py-0.5 rounded-full bg-brick-500/12 text-brick-600 text-[11px] font-medium"
                      title={REVIEW_REASON_INFO[r].desc}
                    >
                      {REVIEW_REASON_INFO[r].label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              onClick={() => onReview(memory.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pending
                  ? 'bg-brick-500 hover:bg-brick-600 text-paper-50 shadow-paper hover:-translate-y-0.5'
                  : 'bg-moss-500 hover:bg-moss-600 text-paper-50 shadow-paper hover:-translate-y-0.5'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              {pending ? '补齐复嗅' : '复嗅登记'}
            </button>
            {reviews.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-ochre-600 hover:text-ochre-700 font-medium"
              >
                {expanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> 收起留档</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> 查看 {reviews.length} 条留档</>
                )}
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-paper-200/80 space-y-2 animate-expand">
            {[...reviews].reverse().map((r) => {
              const rt = getSmellTypeInfo(r.review_smell_type);
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border p-3 ${
                    r.outcome === 'pass'
                      ? 'bg-moss-50 border-moss-200'
                      : 'bg-brick-500/5 border-brick-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                      r.outcome === 'pass' ? 'text-moss-600' : 'text-brick-600'
                    }`}>
                      {r.outcome === 'pass' ? (
                        <><CheckCircle2 className="w-4 h-4" /> 一致 · 重新封存</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> 不一致 · 退回待复核</>
                      )}
                    </span>
                    <span className="text-[11px] text-ink-700/50">
                      {formatDate(r.reviewed_at)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-ink-700/80">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.review_location || '（未填写）'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 shrink-0" style={{ color: rt.color }} />
                      {rt.label}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 shrink-0" />
                      {r.review_humidity} 档 · 相差 {r.humidity_diff} 档
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-700/70 inline-flex items-start gap-1">
                    <ScrollText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="break-words">{r.conclusion || '（结论为空）'}</span>
                  </p>
                  {r.outcome === 'fail' && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="inline-flex px-2 py-0.5 rounded-full bg-brick-500/12 text-brick-600 text-[10px] font-medium"
                        >
                          {REVIEW_REASON_INFO[reason].label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
