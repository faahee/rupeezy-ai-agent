import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLead, startConversation, sendMessage, endConversation } from '../services/api'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import Waveform from '../components/Waveform'
import Transcript from '../components/Transcript'
import ScoreBadge from '../components/ScoreBadge'
import useStore from '../store/useStore'

const STAGE_COLORS = {
  opening: 'text-[#00b4ff]',
  pitching: 'text-[#00e676]',
  objection: 'text-amber-400',
  closing: 'text-purple-400',
}

export default function VoiceCall() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const { currentConversation, addMessage, setCurrentScore, setCurrentLanguage, currentScore, currentLanguage } = useStore()

  const [lead, setLead] = useState(null)
  const [callState, setCallState] = useState('initializing') // initializing | bot_speaking | listening | thinking | ended
  const [callStage, setCallStage] = useState('opening')
  const [sttLanguage, setSttLanguage] = useState('hinglish') // user's spoken language → Whisper hint
  const [callDuration, setCallDuration] = useState(0)
  const [objectionAlert, setObjectionAlert] = useState(null)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [classification, setClassification] = useState('Unqualified')
  const [liveTranscript, setLiveTranscript] = useState('')

  const callStartRef = useRef(Date.now())
  const timerRef = useRef(null)
  const isEndingRef = useRef(false)
  const isBotSpeakingRef = useRef(false)   // ref so callbacks always see current value
  const lastUserMessageRef = useRef('')
  const lastBotMsgRef = useRef('')          // ref — never stale in callbacks
  // Barge-in VAD refs
  const bargeStreamRef = useRef(null)
  const bargeAudioCtxRef = useRef(null)
  const bargeAnalyserRef = useRef(null)
  const bargeRafRef = useRef(null)
  const bargeSpeechStartRef = useRef(null)

  const { speak, stop: stopTTS, isSpeaking } = useSpeechSynthesis()

  // ── Barge-in VAD ────────────────────────────────────────────────────────────
  // Run a lightweight RMS loop on the mic while the bot is speaking.
  // If the user sustains speech above threshold for 350 ms, interrupt the bot.
  const BARGE_RMS   = 0.018   // slightly higher than normal VAD to avoid speaker echo
  const BARGE_MS    = 350     // ms of sustained speech needed to trigger barge-in

  const stopBargeVAD = useCallback(() => {
    if (bargeRafRef.current)    { cancelAnimationFrame(bargeRafRef.current); bargeRafRef.current = null }
    if (bargeAudioCtxRef.current) { bargeAudioCtxRef.current.close().catch(() => {}); bargeAudioCtxRef.current = null }
    if (bargeStreamRef.current) { bargeStreamRef.current.getTracks().forEach(t => t.stop()); bargeStreamRef.current = null }
    bargeAnalyserRef.current = null
    bargeSpeechStartRef.current = null
  }, [])

  const startBargeVAD = useCallback(async (onBarge) => {
    stopBargeVAD()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      bargeStreamRef.current = stream
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      bargeAudioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      bargeAnalyserRef.current = analyser
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Float32Array(analyser.fftSize)
      const tick = () => {
        if (!bargeAnalyserRef.current) return
        analyser.getFloatTimeDomainData(buf)
        let rms = 0
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
        rms = Math.sqrt(rms / buf.length)
        if (rms > BARGE_RMS) {
          if (!bargeSpeechStartRef.current) bargeSpeechStartRef.current = Date.now()
          else if (Date.now() - bargeSpeechStartRef.current > BARGE_MS) {
            stopBargeVAD()
            onBarge()
            return
          }
        } else {
          bargeSpeechStartRef.current = null
        }
        bargeRafRef.current = requestAnimationFrame(tick)
      }
      bargeRafRef.current = requestAnimationFrame(tick)
    } catch (_) {
      // mic permission already held by STT hook — that's fine, barge-in won't work
      // but button-based interrupt still will
    }
  }, [stopBargeVAD])
  const { transcript, isListening, startListening, stopListening, resetTranscript, error: micError, isSupported } =
    useSpeechRecognition(sttLanguage)

  // Track live transcript
  useEffect(() => {
    if (transcript) setLiveTranscript(transcript)
  }, [transcript])

  // Surface mic errors: if the hook signals an error while we expect to be listening,
  // update callState so the user gets feedback and a retry option.
  useEffect(() => {
    if (micError && callState === 'listening') {
      setCallState('mic_error')
    }
  }, [micError, callState])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Interrupt the bot mid-speech and immediately start listening
  const handleBargeIn = useCallback(() => {
    if (!isBotSpeakingRef.current || isEndingRef.current) return
    stopBargeVAD()
    stopTTS()
    isBotSpeakingRef.current = false
    // Brief pause so the speaker echo dies before mic opens
    setTimeout(() => {
      if (!isEndingRef.current) handleListenForUser()
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopBargeVAD, stopTTS])

  const handleBotSpeak = useCallback(
    (text, language, onDone) => {
      // Stop mic & mark bot as speaking so no stale callback can fire
      stopListening()
      isBotSpeakingRef.current = true
      setCallState('bot_speaking')
      // Start barge-in VAD so the user can interrupt with voice
      startBargeVAD(() => {
        if (!isBotSpeakingRef.current || isEndingRef.current) return
        stopTTS()
        isBotSpeakingRef.current = false
        setTimeout(() => {
          if (!isEndingRef.current) handleListenForUser()
        }, 400)
      })
      speak(text, language, () => {
        stopBargeVAD()   // bot finished naturally — VAD no longer needed
        if (!isEndingRef.current) {
          // Extra delay after TTS ends so room echo fully dies before mic opens
          setTimeout(() => {
            isBotSpeakingRef.current = false
            onDone?.()
          }, 1800)
        } else {
          isBotSpeakingRef.current = false
        }
      })
    },
    [speak, stopListening, startBargeVAD, stopBargeVAD, stopTTS]
  )

  const handleListenForUser = useCallback(() => {
    if (isEndingRef.current) return
    setCallState('listening')
    resetTranscript()
    setLiveTranscript('')
    startListening(async (userText) => {
      // Ignore if bot is still speaking — use ref, not state (avoids stale closure)
      if (isEndingRef.current || isBotSpeakingRef.current) return
      if (!userText) return

      // Echo filter: catch true speaker echo, but not genuine questions about the pitch.
      // Strategy: only flag as echo if the user text is suspiciously *similar* to the bot
      // message — i.e. it's mostly a subset of bot words with no new content.
      // We use two conditions that both must be true:
      //   1. High overlap ratio (>65% of user words found in bot message)
      //   2. The user adds fewer than 3 "new" words not in the bot message
      // This lets through questions like "How can I get 100% brokerage share?"
      // while still blocking pure mic-echo repeats of the bot's sentence.
      const botLower = lastBotMsgRef.current.toLowerCase()
      const userWords = userText.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2)
      if (userWords.length >= 2) {
        const matchCount = userWords.filter(w => botLower.includes(w)).length
        const newWordCount = userWords.length - matchCount
        if (matchCount / userWords.length > 0.65 && newWordCount < 3) return
      }
      // Single word echo: only block if the utterance is exactly one word (no context)
      if (userWords.length === 1 && botLower.includes(userWords[0])) return
      lastUserMessageRef.current = userText
      stopListening()
      setLiveTranscript('')

      const userMsg = { role: 'user', content: userText, timestamp: new Date().toISOString() }
      setMessages((prev) => [...prev, userMsg])
      addMessage(userMsg)

      setCallState('thinking')
      try {
        const res = await sendMessage(leadId, userText)
        const data = res.data

        if (data.objection_detected && data.objection_detected !== 'none') {
          setObjectionAlert(data.objection_detected.replace(/_/g, ' '))
          setTimeout(() => setObjectionAlert(null), 5000)
        }

        if (data.current_score !== undefined) {
          setCurrentScore(data.current_score)
        }
        if (data.detected_language) {
          setCurrentLanguage(data.detected_language)  // bot's TTS language
        }
        if (data.user_language) {
          setSttLanguage(data.user_language)           // user's spoken language for STT
        }
        if (data.call_stage) {
          setCallStage(data.call_stage)
        }
        const newClassification =
          data.current_score >= 70 ? 'Hot' : data.current_score >= 40 ? 'Warm' : 'Cold'
        setClassification(newClassification)

        const botMsg = {
          role: 'assistant',
          content: data.response_text,
          timestamp: new Date().toISOString(),
          objection_detected: data.objection_detected,
          call_stage: data.call_stage,
        }
        setMessages((prev) => [...prev, botMsg])
        addMessage(botMsg)
        lastBotMsgRef.current = data.response_text

        if (data.end_call) {
          handleEndCall(true)
          return
        }

        handleBotSpeak(data.response_text, data.detected_language, handleListenForUser)
      } catch (e) {
        setError('Failed to get response. Check backend connection.')
        setCallState('listening')
      }
    })
  }, [leadId, stopListening, startListening, resetTranscript, addMessage, setCurrentScore, setCurrentLanguage, handleBotSpeak])

  // Initialize call
  useEffect(() => {
    async function initCall() {
      try {
        const leadRes = await getLead(leadId)
        setLead(leadRes.data)

        const convRes = await startConversation(leadId)
        const opening = convRes.data.opening_message

        const botMsg = {
          role: 'assistant',
          content: opening.response_text,
          timestamp: new Date().toISOString(),
          call_stage: 'opening',
        }
        setMessages([botMsg])
        addMessage(botMsg)
        setCurrentLanguage(opening.detected_language)
        lastBotMsgRef.current = opening.response_text
        callStartRef.current = Date.now()

        handleBotSpeak(opening.response_text, opening.detected_language, handleListenForUser)
      } catch (e) {
        setError('Failed to start conversation. Is the backend running?')
      }
    }
    initCall()

    return () => {
      stopBargeVAD()
      stopTTS()
      stopListening()
    }
  }, [leadId])

  const handleEndCall = async (auto = false) => {
    if (isEndingRef.current) return
    isEndingRef.current = true
    stopBargeVAD()
    stopTTS()
    stopListening()
    clearInterval(timerRef.current)
    setCallState('ended')

    try {
      await endConversation(leadId)
    } catch (e) {
      console.error('End conversation error', e)
    }

    navigate(`/summary/${leadId}`)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-ghost">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col gap-4">
      {/* Lead Info Bar */}
      <div className="flex items-center justify-between card py-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-bold text-white text-lg">{lead?.name || 'Loading...'}</h2>
            <p className="text-slate-400 text-sm font-mono">{lead?.phone}</p>
          </div>
          <ScoreBadge classification={classification} />
          <span
            className={`text-xs font-mono uppercase tracking-wider ${STAGE_COLORS[callStage] || 'text-slate-400'}`}
          >
            {callStage}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[#00b4ff] font-mono text-xl font-bold">{formatTime(callDuration)}</div>
            <div className="text-slate-500 text-xs">Duration</div>
          </div>
          <button
            onClick={() => handleEndCall(false)}
            className="btn-danger px-5 py-2 text-sm"
          >
            End Call
          </button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-5 gap-4 min-h-0">
        {/* Left: Bot Visual */}
        <div className="lg:col-span-2 card flex flex-col items-center justify-center gap-6">
          {/* Avatar with pulse */}
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#00b4ff] to-[#0066ff] flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-[#00b4ff]/20 ${
                isSpeaking ? 'ring-4 ring-[#00b4ff]/40' : ''
              }`}
            >
              P
            </div>
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#00b4ff]/20 pulse-ring" />
                <div
                  className="absolute inset-0 rounded-full bg-[#00b4ff]/10 pulse-ring"
                  style={{ animationDelay: '0.5s' }}
                />
              </>
            )}
          </div>

          <div className="text-center">
            <p className="text-white font-semibold">Priya</p>
            <p className="text-slate-400 text-sm">AI Sales Agent · Rupeezy</p>
          </div>

          {/* Waveform */}
          <Waveform isActive={isSpeaking} />

          {/* State indicator */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  callState === 'bot_speaking'
                    ? 'bg-[#00b4ff] animate-pulse'
                    : callState === 'listening'
                    ? 'bg-[#00e676] animate-pulse'
                    : callState === 'thinking'
                    ? 'bg-amber-400 animate-pulse'
                    : callState === 'mic_error'
                    ? 'bg-red-500'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-mono text-slate-400 capitalize">
                {callState === 'bot_speaking'
                  ? 'Agent speaking...'
                  : callState === 'listening'
                  ? 'Listening...'
                  : callState === 'thinking'
                  ? 'Thinking...'
                  : callState === 'mic_error'
                  ? 'Mic error'
                  : callState}
              </span>
            </div>
            {/* Barge-in button — visible while bot is speaking */}
            {callState === 'bot_speaking' && (
              <button
                onClick={handleBargeIn}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold
                           bg-amber-500/20 border border-amber-500/50 text-amber-300
                           hover:bg-amber-500/40 active:scale-95 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Interrupt / Speak
              </button>
            )}
          </div>

          {/* Score */}
          <div className="w-full bg-[#0f2040] rounded-xl p-3 border border-[#1e3a5f]">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-slate-400 font-mono">Interest Score</span>
              <span className="text-xs font-mono text-[#00b4ff] font-bold">{currentScore}/100</span>
            </div>
            <div className="h-2 bg-[#152a52] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentScore >= 70
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : currentScore >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-slate-600 to-slate-500'
                }`}
                style={{ width: `${currentScore}%` }}
              />
            </div>
          </div>

          {/* Language + Objection */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Language</span>
              <span className="bg-[#0f2040] border border-[#1e3a5f] text-[#00b4ff] px-2 py-0.5 rounded-full font-mono capitalize">
                {currentLanguage}
              </span>
            </div>
            {!isSupported && (
              <p className="text-xs text-amber-400 text-center">
                ⚠️ Use Chrome for voice input
              </p>
            )}
            {micError && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-red-400 text-center">⛔ {micError}</p>
                <button
                  onClick={() => handleListenForUser()}
                  className="text-xs text-[#00b4ff] underline"
                >
                  Retry mic
                </button>
              </div>
            )}
            {objectionAlert && (
              <div className="bg-amber-900/40 border border-amber-700 rounded-lg p-2 text-xs text-amber-300 text-center animate-pulse">
                ⚡ Objection: {objectionAlert}
              </div>
            )}
          </div>
        </div>

        {/* Right: Transcript */}
        <div className="lg:col-span-3 card flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Live Transcript
            </h3>
            <span className="text-xs text-slate-500 font-mono">{messages.length} messages</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <Transcript messages={messages} />
          </div>

          {/* Live STT */}
          {isListening && liveTranscript && (
            <div className="mt-2 flex-shrink-0 bg-[#00e676]/10 border border-[#00e676]/30 rounded-lg p-2 text-sm text-[#00e676] font-mono">
              🎤 {liveTranscript}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
