import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="border-b border-[#1e3a5f] bg-[#0a1628] px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00b4ff] flex items-center justify-center">
            <span className="text-[#050d1a] font-bold text-sm font-mono">R</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg font-ui tracking-tight">Rupeezy</span>
            <span className="text-[#00b4ff] font-bold text-lg font-ui tracking-tight">AI</span>
          </div>
        </div>
        <div className="hidden sm:block border-l border-[#1e3a5f] pl-3">
          <span className="text-slate-400 text-sm font-mono">Voice Agent</span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs text-slate-300 font-mono">LIVE</span>
        </div>

        {location.pathname !== '/' && (
          <Link
            to="/"
            className="text-slate-400 hover:text-[#00b4ff] text-sm transition-colors"
          >
            ← Dashboard
          </Link>
        )}
      </div>
    </nav>
  )
}
