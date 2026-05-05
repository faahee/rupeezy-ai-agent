import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeadCard from '../components/LeadCard'
import FunnelChart from '../components/FunnelChart'
import { getLeads, getAnalyticsFunnel, getAnalyticsSummary, createLead } from '../services/api'
import useStore from '../store/useStore'

const FILTERS = ['All', 'Hot', 'Warm', 'Cold']

const STAT_CONFIG = [
  { key: 'total_leads',     label: 'Total Leads',  icon: '👥', color: 'text-white',        border: 'border-l-slate-500' },
  { key: 'hot_leads',       label: 'Hot Leads',    icon: '🔥', color: 'text-red-400',      border: 'border-l-red-500' },
  { key: 'warm_leads',      label: 'Warm Leads',   icon: '☀️', color: 'text-amber-400',    border: 'border-l-amber-500' },
  { key: 'cold_leads',      label: 'Cold Leads',   icon: '❄️', color: 'text-slate-400',    border: 'border-l-slate-600' },
  { key: 'average_score',   label: 'Avg Score',    icon: '📊', color: 'text-[#00b4ff]',   border: 'border-l-[#00b4ff]' },
  { key: 'conversion_rate', label: 'Conversion',   icon: '✅', color: 'text-[#00e676]',   border: 'border-l-[#00e676]', suffix: '%' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { leads, setLeads, setAnalyticsData, analyticsData } = useStore()
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', language_hint: 'hinglish', source: 'Manual' })
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    try {
      const [leadsRes, funnelRes, summaryRes] = await Promise.all([
        getLeads(filter === 'All' ? null : filter),
        getAnalyticsFunnel(),
        getAnalyticsSummary(),
      ])
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : [])
      setFunnel(funnelRes.data && typeof funnelRes.data === 'object' ? funnelRes.data : null)
      setAnalyticsData(summaryRes.data && typeof summaryRes.data === 'object' ? summaryRes.data : {})
    } catch (e) {
      console.error('Failed to fetch dashboard data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const handleCreateLead = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await createLead(newLead)
      setShowNewLead(false)
      setNewLead({ name: '', phone: '', language_hint: 'hinglish', source: 'Manual' })
      await fetchData()
      navigate(`/call/${res.data.id}`)
    } catch (err) {
      alert('Failed to create lead: ' + (err.response?.data?.detail || err.message))
    } finally {
      setCreating(false)
    }
  }

  const stats = analyticsData

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Partner Lead Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered lead qualification &amp; RM handoff</p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Start New Call
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STAT_CONFIG.map((s) => {
          const raw = stats?.[s.key]
          const val = raw !== undefined && raw !== null ? `${raw}${s.suffix || ''}` : '—'
          return (
            <div key={s.label} className={`stat-card border-l-2 ${s.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base leading-none">{s.icon}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{s.label}</span>
              </div>
              <span className={`text-2xl font-bold ${s.color}`}>{val}</span>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Lead List ── */}
        <div className="lg:col-span-2">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === f
                    ? 'bg-gradient-to-r from-[#00b4ff] to-[#0088dd] text-[#030b17] shadow-lg shadow-[#00b4ff]/20'
                    : 'bg-[#080f1e] border border-[#162d50] text-slate-400 hover:text-white hover:border-[#00b4ff]/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card shimmer h-24 opacity-40" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 font-medium">No leads found</p>
              <p className="text-slate-600 text-sm mt-1">Start a new call to add leads.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="flex flex-col gap-4">
          <FunnelChart data={funnel} />

          <div className="card">
            <h3 className="section-label mb-4">Lead Sources</h3>
            {leads.length > 0 ? (
              <div className="flex flex-col gap-3">
                {Object.entries(
                  leads.reduce((acc, l) => {
                    acc[l.source] = (acc[l.source] || 0) + 1
                    return acc
                  }, {})
                ).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{source}</span>
                    <span className="text-[#00b4ff] font-semibold text-sm tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── New Lead Modal ── */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#080f1e] border border-[#162d50] rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">New Lead Call</h2>
                <p className="text-slate-500 text-xs mt-0.5">Ana will call immediately after you submit</p>
              </div>
              <button
                onClick={() => setShowNewLead(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Name *</label>
                <input
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="input"
                  placeholder="Lead full name"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Phone *</label>
                <input
                  required
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="input"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Language</label>
                <select
                  value={newLead.language_hint}
                  onChange={(e) => setNewLead({ ...newLead, language_hint: e.target.value })}
                  className="input"
                >
                  <option value="hinglish">Hinglish (Hindi + English)</option>
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                  <option value="tamil">Tamil</option>
                  <option value="telugu">Telugu</option>
                  <option value="kannada">Kannada</option>
                  <option value="malayalam">Malayalam</option>
                  <option value="bengali">Bengali</option>
                  <option value="marathi">Marathi</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="urdu">Urdu</option>
                  <option value="punjabi">Punjabi</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Source</label>
                <input
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="input"
                  placeholder="e.g. Instagram Campaign"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewLead(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? 'Starting...' : '📞 Start Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

