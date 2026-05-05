import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-40 border-b border-[#162d50]/60 bg-[#030b17]/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        {/* Logo mark */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00b4ff] to-[#0055cc] flex items-center justify-center shadow-lg shadow-[#00b4ff]/25 group-hover:shadow-[#00b4ff]/40 transition-shadow">
          <span className="text-white font-bold text-sm tracking-tight">R</span>
        </div>
        {/* Brand name */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-white font-bold text-xl tracking-tight">Rupeezy</span>
          <span className="text-[#00b4ff] font-bold text-xl tracking-tight">AI</span>
        </div>
        {/* Divider + tag */}
        <div className="hidden sm:flex items-center gap-2 border-l border-[#1e3a5f] pl-3 ml-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Voice Agent</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {/* Live pill */}
        <div className="flex items-center gap-2 bg-[#00e676]/8 border border-[#00e676]/20 rounded-full px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
          </span>
          <span className="text-[11px] font-semibold text-[#00e676] tracking-wider">LIVE</span>
        </div>

        {location.pathname !== '/' && (
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#00b4ff] text-sm font-medium transition-colors duration-200 border border-transparent hover:border-[#00b4ff]/30 rounded-lg px-3 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  )
}
