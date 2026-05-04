import { useEffect, useRef } from 'react'

export default function Transcript({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">
        Conversation will appear here...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {messages.map((msg, idx) => {
        const isBot = msg.role === 'assistant'
        return (
          <div
            key={idx}
            className={`flex flex-col gap-1 ${isBot ? 'items-start' : 'items-end'}`}
          >
            <span className={`text-xs font-mono ${isBot ? 'text-[#00b4ff]' : 'text-[#00e676]'}`}>
              {isBot ? '🤖 Priya (Agent)' : '👤 Lead'}
            </span>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                isBot
                  ? 'bg-[#0f2040] border border-[#1e3a5f] text-slate-200'
                  : 'bg-[#00b4ff]/10 border border-[#00b4ff]/30 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
            {msg.objection_detected && msg.objection_detected !== 'none' && (
              <span className="text-xs bg-amber-900/40 border border-amber-700 text-amber-300 px-2 py-0.5 rounded-full">
                ⚡ Objection: {msg.objection_detected.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
