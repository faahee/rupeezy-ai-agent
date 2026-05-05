import { useEffect, useRef } from 'react'

export default function Transcript({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <div className="text-3xl opacity-30">💬</div>
        <p className="text-slate-600 text-sm">Conversation will appear here...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-2 overflow-y-auto h-full">
      {messages.map((msg, idx) => {
        const isBot = msg.role === 'assistant'
        return (
          <div key={idx} className={`flex flex-col gap-1 fade-in-up ${isBot ? 'items-start' : 'items-end'}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${isBot ? 'text-[#00b4ff]' : 'text-[#00e676]'}`}>
              {isBot ? 'Ana · Agent' : 'Lead'}
            </span>
            <div
              className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isBot
                  ? 'bg-[#0d1f3a] border border-[#162d50] text-slate-200 rounded-tl-sm'
                  : 'bg-[#00b4ff]/10 border border-[#00b4ff]/20 text-slate-200 rounded-tr-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.objection_detected && msg.objection_detected !== 'none' && (
              <span className="text-[10px] bg-amber-950/60 border border-amber-700/50 text-amber-300 px-2.5 py-0.5 rounded-full font-medium">
                ⚡ {msg.objection_detected.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
