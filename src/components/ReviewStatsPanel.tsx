import { Archive, Hourglass, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';
import { REVIEW_REASON_INFO } from '../utils/constants';
import type { ReviewStats } from '../utils/review';

interface Props {
  stats: ReviewStats;
}

export default function ReviewStatsPanel({ stats }: Props) {
  const cards = [
    {
      icon: <Archive className="w-5 h-5" />,
      label: '已封存',
      value: stats.sealed,
      sub: `共 ${stats.total} 段记忆`,
      cls: 'bg-moss-100/70 border-moss-200 text-moss-600',
    },
    {
      icon: <Hourglass className="w-5 h-5" />,
      label: '待复核',
      value: stats.pending,
      sub: stats.pending > 0 ? '封存已撤销，待补登记' : '暂无退回记录',
      cls: 'bg-brick-500/10 border-brick-400/40 text-brick-600',
    },
    {
      icon: <ClipboardCheck className="w-5 h-5" />,
      label: '复嗅登记',
      value: stats.reviewTimes,
      sub: `通过 ${stats.passedTimes} · 退回 ${stats.failedTimes}`,
      cls: 'bg-ochre-100/70 border-ochre-200 text-ochre-600',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: '一致通过率',
      value: stats.reviewTimes
        ? `${Math.round((stats.passedTimes / stats.reviewTimes) * 100)}%`
        : '—',
      sub: `${stats.passedTimes}/${stats.reviewTimes || 0} 次`,
      cls: 'bg-lavender-300/20 border-lavender-300/50 text-lavender-600',
    },
  ];

  return (
    <section className="container max-w-6xl mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-4 shadow-paper ${c.cls}`}
          >
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              {c.icon}
              {c.label}
            </div>
            <div className="mt-2 font-serif text-3xl font-bold leading-none">
              {c.value}
            </div>
            <div className="mt-1.5 text-xs opacity-75">{c.sub}</div>
          </div>
        ))}
      </div>

      {stats.reasonCounts.length > 0 && (
        <div className="mt-3 rounded-2xl border border-paper-300 bg-paper-50/70 backdrop-blur p-4 shadow-paper">
          <div className="flex items-center gap-2 mb-2.5">
            <XCircle className="w-4 h-4 text-brick-500" />
            <span className="font-hand text-lg text-brick-600">退回原因留档统计</span>
          </div>
          <div className="space-y-2">
            {stats.reasonCounts.map(({ reason, count }) => {
              const max = stats.reasonCounts[0]?.count || 1;
              const info = REVIEW_REASON_INFO[reason];
              return (
                <div key={reason} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-ink-700/80">
                    {info.label}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-paper-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brick-500/70 flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max(14, (count / max) * 100)}%` }}
                    >
                      <span className="text-[10px] text-paper-50 font-semibold">{count}</span>
                    </div>
                  </div>
                  <span className="w-40 shrink-0 hidden md:block text-[11px] text-ink-700/50">
                    {info.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
