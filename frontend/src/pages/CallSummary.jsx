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
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e3a5f" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  )
}

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
          <p className="text-slate-400 font-mono">Generating summary...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error || 'No summary found'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{summary.lead_name}</h1>
          <p className="text-slate-400 font-mono mt-1">{summary.lead_phone}</p>
          <p className="text-slate-500 text-sm mt-1">
            {new Date(summary.timestamp).toLocaleString('en-IN')}
          </p>
        </div>
        <ScoreBadge classification={summary.classification} size="lg" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Duration', value: `${summary.call_duration_minutes} min` },
          { label: 'Language', value: summary.language_used },
          { label: 'Objections', value: summary.objections_raised?.length || 0 },
          { label: 'Resolved', value: summary.objections_resolved?.length || 0 },
        ].map((m) => (
          <div key={m.label} className="stat-card">
            <span className="text-xl font-bold font-mono text-[#00b4ff] capitalize">{m.value}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {/* Score Circle */}
          <div className="card flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-slate-400 font-mono uppercase tracking-wider">Interest Score</p>
            <CircleProgress score={summary.interest_score} />
            <ScoreBadge classification={summary.classification} />
          </div>

          {/* Recommended Action */}
          <div className="card">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
              Recommended Action
            </p>
            <p className="text-sm text-slate-200 mb-4">{summary.recommended_action}</p>
            {summary.classification === 'Hot' && (
              <button className="btn-primary w-full text-sm py-2.5">
                📞 Transfer to RM
              </button>
            )}
            {summary.classification === 'Warm' && (
              <button onClick={handleWhatsApp} className="bg-[#00e676] text-[#050d1a] font-semibold w-full text-sm py-2.5 rounded-lg hover:bg-[#00c96a] transition-colors">
                💬 Send WhatsApp
              </button>
            )}
            {summary.classification === 'Cold' && (
              <button className="btn-ghost w-full text-sm py-2.5">
                🗓 Log for Later
              </button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* RM Handoff */}
          <div className="card">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
              RM Handoff Context
            </p>
            <p className="text-slate-200 text-sm leading-relaxed">{summary.rm_handoff_context}</p>
          </div>

          {/* Discussion Points */}
          {summary.key_discussion_points?.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
                Key Discussion Points
              </p>
              <ul className="flex flex-col gap-2">
                {summary.key_discussion_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-[#00b4ff] mt-0.5">›</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Objections */}
          {summary.objections_raised?.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
                Objections Handled
              </p>
              <div className="flex flex-col gap-2">
                {summary.objections_raised.map((obj, i) => {
                  const resolved = summary.objections_resolved?.includes(obj)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{obj.replace(/_/g, ' ')}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          resolved
                            ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30'
                            : 'bg-red-900/30 text-red-400 border border-red-800'
                        }`}
                      >
                        {resolved ? '✓ Resolved' : '✗ Unresolved'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WhatsApp Message Preview */}
          {summary.classification === 'Warm' && summary.whatsapp_message && (
            <div className="card">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
                WhatsApp Message Preview
              </p>
              <pre className="text-slate-300 text-sm whitespace-pre-wrap font-ui leading-relaxed bg-[#0f2040] rounded-lg p-3">
                {summary.whatsapp_message}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-center">
        <button onClick={() => navigate('/')} className="btn-ghost px-8">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
