export default function Waveform({ isActive }) {
  const bars = Array.from({ length: 20 }, (_, i) => i)

  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {bars.map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-[#00b4ff] transition-all duration-300 ${
            isActive ? 'wave-bar' : 'h-1 opacity-40'
          }`}
          style={
            isActive
              ? {
                  animationDelay: `${(i * 50) % 500}ms`,
                  height: `${Math.random() * 100 + 20}%`,
                  minHeight: '4px',
                  maxHeight: '100%',
                }
              : {}
          }
        />
      ))}
    </div>
  )
}
