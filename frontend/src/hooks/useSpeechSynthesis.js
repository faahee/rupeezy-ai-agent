import { useState, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:8000')
const BACKEND_TTS_URL = `${API_BASE}/tts/speak`

// ── Fallback: browser Web Speech API ─────────────────────────────────────────
const PREFERRED_VOICE_NAMES = [
  'Google हिन्दी',
  'Microsoft Hemant - Hindi (India)',
  'Microsoft Kalpana - Hindi (India)',
  'hi-IN',
]

function getBrowserVoice(language) {
  const voices = window.speechSynthesis.getVoices()
  if (language === 'hindi') {
    for (const name of PREFERRED_VOICE_NAMES) {
      const v = voices.find((v) => v.name.includes(name) || v.lang === 'hi-IN')
      if (v) return v
    }
  }
  return voices.find((v) => v.lang === 'en-IN') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0] ||
    null
}

function speakBrowser(text, language, onEnd, setIsSpeaking) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 1.0
  const voice = getBrowserVoice(language)
  if (voice) utterance.voice = voice
  utterance.onstart = () => setIsSpeaking(true)
  utterance.onend = () => { setIsSpeaking(false); onEnd?.() }
  utterance.onerror = () => { setIsSpeaking(false); onEnd?.() }
  window.speechSynthesis.speak(utterance)
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioCtxRef   = useRef(null)
  const sourceNodeRef = useRef(null)
  // Generation counter: incremented by stop() so any in-flight speak() fetch
  // continuation can detect it was superseded and bail out before creating audio.
  const genRef = useRef(0)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    genRef.current += 1               // invalidate any in-flight speak() async chain
    const src = sourceNodeRef.current
    sourceNodeRef.current = null      // clear ref first so onended skips the callback
    if (src) {
      try { src.stop() } catch (_) {}
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    if (isSupported) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    async (text, language = 'hinglish', onEnd = null) => {
      if (!text) return

      stop()                          // increments genRef, clears any active source
      const gen = genRef.current      // capture generation for this invocation

      setIsSpeaking(true)

      try {
        const response = await fetch(BACKEND_TTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
        })

        // stop() or a newer speak() fired while we were fetching — abort silently
        if (genRef.current !== gen) return

        if (!response.ok) throw new Error(`TTS backend ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        if (genRef.current !== gen) return   // cancelled during arrayBuffer read

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioCtxRef.current = audioCtx

        const decoded = await audioCtx.decodeAudioData(arrayBuffer)
        if (genRef.current !== gen) {        // cancelled during decode
          audioCtx.close().catch(() => {})
          return
        }

        const source = audioCtx.createBufferSource()
        source.buffer = decoded
        source.connect(audioCtx.destination)

        source.onended = () => {
          if (sourceNodeRef.current !== source) return  // force-stopped
          sourceNodeRef.current = null
          audioCtx.close().catch(() => {})
          audioCtxRef.current = null
          setIsSpeaking(false)
          onEnd?.()
        }

        sourceNodeRef.current = source
        source.start(0)
      } catch {
        if (genRef.current !== gen) return   // cancelled — don't fall back
        if (isSupported) {
          speakBrowser(text, language, onEnd, setIsSpeaking)
        } else {
          setIsSpeaking(false)
          onEnd?.()
        }
      }
    },
    [isSupported, stop]
  )

  return { speak, stop, isSpeaking, isSupported }
}
