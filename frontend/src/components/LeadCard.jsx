import { useNavigate } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'
import useStore from '../store/useStore'

export default function LeadCard({ lead }) {
  const navigate = useNavigate()
  const setCurrentLead = useStore((s) => s.setCurrentLead)

  const handleStartCall = () => {
    setCurrentLead(lead)
    navigate(`/call/${lead.id}`)
  }

  const handleViewCall = () => {
    navigate(`/summary/${lead.id}`)
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never'
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="card hover:border-[#00b4ff]/50 transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-base">{lead.name}</h3>
          <p className="text-slate-400 text-sm font-mono mt-0.5">{lead.phone}</p>
        </div>
        <ScoreBadge classification={lead.classification} />
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="bg-[#152a52] text-[#00b4ff] border border-[#1e3a5f] text-xs px-2 py-0.5 rounded-full font-mono">
          {lead.source}
        </span>
        <span className="text-slate-500 text-xs font-mono">{lead.language_hint}</span>
        <span className="text-slate-500 text-xs">
          {timeAgo(lead.updated_at)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-[#152a52] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                lead.score >= 70
                  ? 'bg-red-400'
                  : lead.score >= 40
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
              style={{ width: `${lead.score}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400">{lead.score}</span>
        </div>

        <div className="flex gap-2">
          {lead.status === 'completed' && (
            <button
              onClick={handleViewCall}
              className="btn-ghost text-xs py-1 px-3"
            >
              View Summary
            </button>
          )}
          <button
            onClick={handleStartCall}
            className="btn-primary text-xs py-1 px-3"
          >
            {lead.status === 'new' ? 'Start Call' : 'Call Again'}
          </button>
        </div>
      </div>
    </div>
  )
}
