import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCallSummary } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'

function CircleProgress({ score }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#f87171' : score >= 40 ? '#fbbf24' : '#64748b'

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#162d50" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-xs text-slate-500">/100</span>
      </div>
    </div>
  )
}

const METRIC_CONFIG = [
  { key: 'call_duration_minutes', label: 'Duration',   icon: '⏱',  format: (v) => `${v} min`, color: 'text-[#00b4ff]' },
  { key: 'language_used',         label: 'Language',   icon: '🌐',  format: (v) => v,          color: 'text-white' },
  { key: 'objections_raised',     label: 'Objections', icon: '⚡',  format: (v) => v?.length ?? 0, color: 'text-amber-400' },
  { key: 'objections_resolved',   label: 'Resolved',   icon: '✅',  format: (v) => v?.length ?? 0, color: 'text-[#00e676]' },
]

export default function CallSummary() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await getCallSummary(leadId)
        setSummary(res.data)
      } catch (e) {
        setError('Summary not available. The call may still be processing.')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [leadId])

  const handleWhatsApp = () => {
    if (!summary) return
    const phone = summary.lead_phone.replace(/\D/g, '')
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`
    const msg = encodeURIComponent(summary.whatsapp_message || '')
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00b4ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Generating summary...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error || 'No summary found'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3a6e] to-[#0d1f3a] border border-[#1e3a5f] flex items-center justify-center">
              <span className="text-[#00b4ff] font-bold">{summary.lead_name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{summary.lead_name}</h1>
              <p className="text-slate-500 text-sm">{summary.lead_phone}</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs mt-2 pl-0.5">
            {new Date(summary.timestamp).toLocaleString('en-IN')}
          </p>
        </div>
        <ScoreBadge classification={summary.classification} size="lg" />
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {METRIC_CONFIG.map((m) => (
          <div key={m.label} className="stat-card border-t border-[#1e3a5f]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{m.icon}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{m.label}</span>
            </div>
            <span className={`text-xl font-bold capitalize ${m.color}`}>
              {m.format(summary[m.key])}
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left ── */}
        <div className="flex flex-col gap-4">
          {/* Score circle */}
          <div className="card flex flex-col items-center gap-3 py-6">
            <span className="section-label">Interest Score</span>
            <CircleProgress score={summary.interest_score} />
            <ScoreBadge classification={summary.classification} />
          </div>

          {/* Action */}
          <div className="card">
            <span className="section-label block mb-3">Recommended Action</span>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{summary.recommended_action}</p>
            {summary.classification === 'Hot' && (
              <button className="btn-primary w-full text-sm py-2.5">📞 Transfer to RM</button>
            )}
            {summary.classification === 'Warm' && (
              <button onClick={handleWhatsApp} className="btn-green w-full text-sm py-2.5">
                💬 Send WhatsApp
              </button>
            )}
            {summary.classification === 'Cold' && (
              <button className="btn-ghost w-full text-sm py-2.5">🗓 Log for Later</button>
            )}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* RM Handoff Context */}
          <div className="card">
            <span className="section-label block mb-3">RM Handoff Context</span>
            <p className="text-slate-300 text-sm leading-relaxed">{summary.rm_handoff_context}</p>
          </div>

          {/* Key Discussion Points */}
          {summary.key_discussion_points?.length > 0 && (
            <div className="card">
              <span className="section-label block mb-3">Key Discussion Points</span>
              <ul className="flex flex-col gap-2">
                {summary.key_discussion_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-[#00b4ff] mt-0.5 flex-shrink-0">›</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Objections */}
          {summary.objections_raised?.length > 0 && (
            <div className="card">
              <span className="section-label block mb-3">Objections Handled</span>
              <div className="flex flex-col gap-2.5">
                {summary.objections_raised.map((obj, i) => {
                  const resolved = summary.objections_resolved?.includes(obj)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{obj.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        resolved
                          ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/25'
                          : 'bg-red-950/60 text-red-400 border border-red-800/60'
                      }`}>
                        {resolved ? '✓ Resolved' : '✗ Unresolved'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WhatsApp Preview */}
          {summary.classification === 'Warm' && summary.whatsapp_message && (
            <div className="card">
              <span className="section-label block mb-3">WhatsApp Preview</span>
              <div className="bg-[#0d1f3a] rounded-xl p-3 border border-[#162d50]">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {summary.whatsapp_message}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-8 flex justify-center">
        <button onClick={() => navigate('/')} className="btn-ghost px-8">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}

