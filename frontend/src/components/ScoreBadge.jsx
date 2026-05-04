export default function ScoreBadge({ classification, size = 'sm' }) {
  const configs = {
    Hot: {
      cls: 'bg-red-900/60 text-red-300 border border-red-700',
      pulse: true,
      label: '🔥 Hot',
    },
    Warm: {
      cls: 'bg-amber-900/60 text-amber-300 border border-amber-700',
      pulse: false,
      label: '🌤 Warm',
    },
    Cold: {
      cls: 'bg-slate-800 text-slate-400 border border-slate-600',
      pulse: false,
      label: '❄️ Cold',
    },
    Unqualified: {
      cls: 'bg-slate-900 text-slate-500 border border-slate-700',
      pulse: false,
      label: '— New',
    },
  }

  const cfg = configs[classification] || configs.Unqualified
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-base font-bold' : 'px-2 py-0.5 text-xs font-semibold'

  return (
    <span
      className={`${cfg.cls} ${sizeClass} rounded-full inline-flex items-center gap-1 ${cfg.pulse ? 'animate-pulse' : ''}`}
    >
      {cfg.label}
    </span>
  )
}
