import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeadCard from '../components/LeadCard'
import FunnelChart from '../components/FunnelChart'
import { getLeads, getAnalyticsFunnel, getAnalyticsSummary, createLead } from '../services/api'
import useStore from '../store/useStore'

const FILTERS = ['All', 'Hot', 'Warm', 'Cold']

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
      setLeads(leadsRes.data)
      setFunnel(funnelRes.data)
      setAnalyticsData(summaryRes.data)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-ui">Partner Lead Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered lead qualification and RM handoff</p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Start New Call
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total Leads', value: stats?.total_leads ?? '—', color: 'text-white' },
          { label: 'Hot Leads', value: stats?.hot_leads ?? '—', color: 'text-red-400' },
          { label: 'Warm Leads', value: stats?.warm_leads ?? '—', color: 'text-amber-400' },
          { label: 'Cold Leads', value: stats?.cold_leads ?? '—', color: 'text-slate-400' },
          { label: 'Avg Score', value: stats?.average_score ?? '—', color: 'text-[#00b4ff]' },
          { label: 'Conversion', value: stats?.conversion_rate ? `${stats.conversion_rate}%` : '—', color: 'text-[#00e676]' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <span className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-2">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[#00b4ff] text-[#050d1a]'
                    : 'bg-[#0f2040] border border-[#1e3a5f] text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-mono">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono">
              No leads found. Start a new call to add leads.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          <FunnelChart data={funnel} />

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 font-mono uppercase tracking-wider">
              Lead Sources
            </h3>
            {leads.length > 0 ? (
              <div className="flex flex-col gap-2">
                {Object.entries(
                  leads.reduce((acc, l) => {
                    acc[l.source] = (acc[l.source] || 0) + 1
                    return acc
                  }, {})
                ).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{source}</span>
                    <span className="text-[#00b4ff] font-mono text-sm">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Add New Lead</h2>
            <form onSubmit={handleCreateLead} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-sm block mb-1">Name *</label>
                <input
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00b4ff]"
                  placeholder="Lead name"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1">Phone *</label>
                <input
                  required
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00b4ff]"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1">Language</label>
                <select
                  value={newLead.language_hint}
                  onChange={(e) => setNewLead({ ...newLead, language_hint: e.target.value })}
                  className="w-full bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00b4ff]"
                >
                  <option value="hinglish">Hinglish (Hindi+English)</option>
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
                <label className="text-slate-400 text-sm block mb-1">Source</label>
                <input
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="w-full bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00b4ff]"
                  placeholder="Instagram Campaign"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewLead(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {creating ? 'Starting...' : 'Start Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
