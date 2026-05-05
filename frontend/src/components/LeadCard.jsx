import { useNavigate } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'
import useStore from '../store/useStore'

const SCORE_COLOR = (s) =>
  s >= 70 ? ['bg-red-500', 'text-red-400'] :
  s >= 40 ? ['bg-amber-500', 'text-amber-400'] :
             ['bg-slate-500', 'text-slate-400']

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Never'
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function LeadCard({ lead }) {
  const navigate = useNavigate()
  const setCurrentLead = useStore((s) => s.setCurrentLead)

  const [barColor, textColor] = SCORE_COLOR(lead.score)

  return (
    <div className="card hover:border-[#00b4ff]/40 hover:shadow-lg hover:shadow-[#00b4ff]/5 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        {/* Lead info */}
        <div className="flex items-start gap-3">
          {/* Avatar initials */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3a6e] to-[#0d1f3a] border border-[#1e3a5f] flex items-center justify-center flex-shrink-0">
            <span className="text-[#00b4ff] font-bold text-sm">
              {lead.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{lead.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-slate-500 text-xs">{lead.phone}</span>
            </div>
          </div>
        </div>
        <ScoreBadge classification={lead.classification} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="bg-[#0d1f3a] text-[#00b4ff] border border-[#1e3a5f] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
          {lead.source}
        </span>
        <span className="text-[10px] font-medium text-slate-500 bg-[#0d1f3a] border border-[#1a3050]/60 px-2 py-0.5 rounded-full capitalize">
          {lead.language_hint}
        </span>
        <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(lead.updated_at)}</span>
      </div>

      {/* Score + Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#162d50]/60">
        {/* Score bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 bg-[#0d1f3a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${lead.score ?? 0}%` }}
            />
          </div>
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>{lead.score ?? 0}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {lead.status === 'completed' && (
            <button
              onClick={() => navigate(`/summary/${lead.id}`)}
              className="btn-ghost text-xs py-1 px-3"
            >
              Summary
            </button>
          )}
          <button
            onClick={() => { setCurrentLead(lead); navigate(`/call/${lead.id}`) }}
            className="btn-primary text-xs py-1 px-3"
          >
            {lead.status === 'new' ? 'Call' : 'Recall'}
          </button>
        </div>
      </div>
    </div>
  )
}
