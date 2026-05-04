import { useState, useRef, useCallback, useEffect } from 'react'

// Maps app language → Whisper language code.
// 'hinglish' and unknown values map to '' so Whisper auto-detects.
const LANG_WHISPER = {
  hindi:    'hi',
  english:  'en',
  hinglish: '',   // auto-detect — speaker may switch between Hindi & English
  tamil:    'ta',
  kannada:  'kn',
  telugu:   'te',
  malayalam:'ml',
  bengali:  'bn',
  marathi:  'mr',
  gujarati: 'gu',
  urdu:     'ur',
  punjabi:  'pa',
}

const API_BASE      = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:8000')
const STT_URL       = `${API_BASE}/stt/transcribe`
const RMS_THRESHOLD = 0.010   // RMS above this = speech
const SILENCE_MS    = 2500    // ms of quiet after speech → send to Whisper
const MIN_SPEECH_MS = 400     // discard clips shorter than this
const WARMUP_MS     = 800     // after mic opens, ignore VAD (kills residual echo)

export function useSpeechRecognition(language = 'hinglish') {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError]  = useState(null)

  // Incremented each startListening() — stale async callbacks self-discard
  const sessionRef      = useRef(0)
  const streamRef       = useRef(null)
  const recorderRef     = useRef(null)
  const audioCtxRef     = useRef(null)
  const analyserRef     = useRef(null)
  const chunksRef       = useRef([])
  const onSilenceRef    = useRef(null)   // always kept — never nulled out during a session
  const processingRef   = useRef(false)  // true while a Whisper request is in-flight
  const silenceTimerRef = useRef(null)
  const speechStartRef  = useRef(null)
  const rafRef          = useRef(null)
  const activeRef       = useRef(false)
  const warmupDoneRef   = useRef(false)  // true once we've restarted recorder after warmup

  const isSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // ── Full teardown ──────────────────────────────────────────────────────────
  const _cleanup = useCallback(() => {
    activeRef.current = false
    if (rafRef.current)          { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop() } catch (_) {}
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch (_) {}
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    recorderRef.current    = null
    analyserRef.current    = null
    chunksRef.current      = []
    onSilenceRef.current   = null
    processingRef.current  = false
    speechStartRef.current = null
    warmupDoneRef.current  = false
  }, [])

  useEffect(() => () => _cleanup(), [_cleanup])

  // ── stopListening ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    _cleanup()
    setIsListening(false)
  }, [_cleanup])

  // ── startListening ─────────────────────────────────────────────────────────
  const startListening = useCallback(async (onSilenceCallback) => {
    _cleanup()
    const session = ++sessionRef.current

    try {
      // getUserMedia with full hardware AEC — OS echo canceller runs on this mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:  true,
        },
      })

      if (sessionRef.current !== session) { stream.getTracks().forEach(t => t.stop()); return }

      streamRef.current = stream

      // Web Audio for VAD
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      // AudioContext starts suspended on Chrome until explicitly resumed
      if (audioCtx.state === 'suspended') await audioCtx.resume()
      const source  = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      analyserRef.current = analyser

      // MediaRecorder captures the AEC-processed audio for Whisper
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
      recorder.start(100)

      onSilenceRef.current  = onSilenceCallback || null
      processingRef.current = false
      activeRef.current     = true
      setTranscript('')
      setIsListening(true)
      setError(null)

      const warmupEnd = Date.now() + WARMUP_MS
      const buf = new Float32Array(analyser.fftSize)
      let inSpeech = false

      // ── VAD loop ────────────────────────────────────────────────────────────
      const tick = () => {
        if (!activeRef.current || sessionRef.current !== session) return

        analyser.getFloatTimeDomainData(buf)
        const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length)
        const now = Date.now()

        if (now < warmupEnd) {
          // Still in warmup — don't process speech, just keep looping
          rafRef.current = requestAnimationFrame(tick)
          return
        }

        // First tick after warmup: restart the recorder so chunks begin with a
        // fresh EBML header. Without this, warmup audio is discarded but the
        // header chunk is also gone, making every subsequent blob invalid WebM.
        if (!warmupDoneRef.current) {
          warmupDoneRef.current = true
          try {
            if (recorderRef.current && recorderRef.current.state !== 'inactive') {
              // Detach handler first so the final ondataavailable doesn't pollute
              // the fresh chunk buffer we're about to create.
              recorderRef.current.ondataavailable = null
              recorderRef.current.stop()
            }
          } catch (_) {}
          chunksRef.current = []
          const freshRecorder = new MediaRecorder(stream, { mimeType: mime })
          freshRecorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
          freshRecorder.start(100)
          recorderRef.current = freshRecorder
        }

        if (rms > RMS_THRESHOLD) {
          if (!inSpeech) {
            inSpeech = true
            speechStartRef.current = Date.now()
            setTranscript('🎤')
          }
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

          silenceTimerRef.current = setTimeout(async () => {
            if (!activeRef.current || sessionRef.current !== session) return
            if (processingRef.current) {
              // Whisper is still processing — just reset speech tracking.
              // Chunks keep accumulating; recorder restart below will give them
              // a fresh header so they form a valid blob next time.
              inSpeech = false
              speechStartRef.current = null
              return
            }

            const speechDuration = speechStartRef.current ? Date.now() - speechStartRef.current : 0
            inSpeech = false
            speechStartRef.current = null

            if (speechDuration < MIN_SPEECH_MS || chunksRef.current.length === 0) {
              chunksRef.current = []
              return
            }

            const blob = new Blob([...chunksRef.current], { type: mime })
            chunksRef.current = []
            processingRef.current = true

            // Restart the recorder NOW so the next speech segment immediately
            // gets a fresh EBML header. Without this, chunks captured while
            // Whisper is in-flight have no header and are invalid WebM.
            if (recorderRef.current && recorderRef.current.state !== 'inactive') {
              try {
                recorderRef.current.ondataavailable = null
                recorderRef.current.stop()
              } catch (_) {}
            }
            const nextRecorder = new MediaRecorder(stream, { mimeType: mime })
            nextRecorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
            nextRecorder.start(100)
            recorderRef.current = nextRecorder

            try {
              // Pick the right file extension so Whisper can identify the format.
              // Safari/iOS records audio/mp4, Chrome records audio/webm — wrong
              // extension causes Groq to reject the file silently.
              const ext = mime.includes('mp4') ? 'm4a'
                        : mime.includes('ogg') ? 'ogg'
                        : 'webm'
              const form = new FormData()
              form.append('audio', blob, `audio.${ext}`)
              // Empty string → backend lets Whisper auto-detect the language
              form.append('language', LANG_WHISPER[language] ?? '')
              const res = await fetch(STT_URL, { method: 'POST', body: form })
              if (!res.ok) {
                const errText = await res.text().catch(() => '')
                throw new Error(`STT ${res.status}: ${errText}`)
              }
              if (sessionRef.current !== session) return
              const { text } = await res.json()
              if (text?.trim()) {
                setTranscript(text.trim())
                // Call the callback — it stays registered for subsequent turns
                onSilenceRef.current?.(text.trim())
              } else {
                // Whisper returned empty — audio too short or too quiet, just reset
                setTranscript('')
              }
            } catch (e) {
              console.error('STT failed:', e)
              // Only show the error briefly — don't block the next listen attempt
              setTranscript('⚠️ Could not hear, speak again')
              setTimeout(() => setTranscript(''), 2500)
            } finally {
              processingRef.current = false
            }
          }, SILENCE_MS)
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)

    } catch (e) {
      let msg = 'Microphone access denied or unavailable'
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        msg = 'Microphone permission denied — please allow mic access and retry'
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        msg = 'No microphone found — please connect a mic and retry'
      } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
        msg = 'Microphone is in use by another app — close it and retry'
      }
      setError(msg)
      setIsListening(false)
    }
  }, [language, _cleanup])

  const resetTranscript = useCallback(() => setTranscript(''), [])

  return { transcript, isListening, startListening, stopListening, resetTranscript, error, isSupported }
}
