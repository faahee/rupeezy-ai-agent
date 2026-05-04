import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

const COLORS = ['#00b4ff', '#38bdf8', '#00e676', '#f59e0b']

export default function FunnelChart({ data }) {
  if (!data) return null

  const chartData = [
    { stage: 'Contacted', count: data.contacted || 0 },
    { stage: 'Qualified', count: data.qualified || 0 },
    { stage: 'Hot', count: data.hot || 0 },
    { stage: 'Warm', count: data.warm || 0 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f2040] border border-[#1e3a5f] px-3 py-2 rounded-lg text-sm">
          <p className="text-[#00b4ff] font-mono">{label}</p>
          <p className="text-white">{payload[0].value} leads</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card h-64">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 font-mono uppercase tracking-wider">
        Conversion Funnel
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="stage"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#1e3a5f' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,180,255,0.05)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#94a3b8', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
