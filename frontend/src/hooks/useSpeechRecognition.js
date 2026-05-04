import { useState, useRef, useCallback, useEffect } from 'react'

const LANG_MAP = {
  hindi:    'hi-IN',
  hinglish: 'en-IN', // en-IN keeps Hinglish in Roman script — LLM handles it better
  english:  'en-IN',
  tamil:    'ta-IN',
  kannada:  'kn-IN',
  telugu:   'te-IN',
  malayalam:'ml-IN',
  bengali:  'bn-IN',
  marathi:  'mr-IN',
  gujarati: 'gu-IN',
  urdu:     'ur-IN',
  punjabi:  'pa-IN',
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export function useSpeechRecognition(language = 'hinglish') {
  const [transcript, setTranscript]   = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError]             = useState(null)

  const recognitionRef = useRef(null)
  const activeRef      = useRef(false)
  const callbackRef    = useRef(null)

  const isSupported = !!SpeechRecognitionAPI

  const _destroy = useCallback(() => {
    activeRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (_) {}
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => () => _destroy(), [_destroy])

  const stopListening = useCallback(() => {
    _destroy()
    setIsListening(false)
  }, [_destroy])

  const startListening = useCallback((onSilenceCallback) => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported — use Chrome or Edge')
      return
    }

    _destroy()
    callbackRef.current = onSilenceCallback || null

    const recognition = new SpeechRecognitionAPI()
    recognition.lang             = LANG_MAP[language] || 'hi-IN'
    recognition.continuous       = true
    recognition.interimResults   = true
    recognition.maxAlternatives  = 1
    recognitionRef.current = recognition
    activeRef.current      = true

    let finalFired = false

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setError(null)
    }

    recognition.onresult = (event) => {
      if (!activeRef.current) return

      let interim = ''
      let final   = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final   += r[0].transcript
        else           interim += r[0].transcript
      }

      if (interim) setTranscript('🎤 ' + interim)

      if (final && !finalFired) {
        finalFired = true
        const text = final.trim()
        setTranscript(text)
        try { recognition.stop() } catch (_) {}
        callbackRef.current?.(text)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setTranscript('⚠️ Could not hear, speak again')
        setTimeout(() => { if (activeRef.current) setTranscript('') }, 2500)
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError('Microphone permission denied — allow mic access and retry')
      } else if (event.error === 'network') {
        setError('Network error — check your connection')
      } else {
        console.warn('SpeechRecognition error:', event.error)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (e) {
      setError('Could not start microphone: ' + e.message)
      setIsListening(false)
    }
  }, [language, _destroy])

  const resetTranscript = useCallback(() => setTranscript(''), [])

  return { transcript, isListening, startListening, stopListening, resetTranscript, error, isSupported }
}
