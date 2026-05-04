import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import VoiceCall from './pages/VoiceCall'
import CallSummary from './pages/CallSummary'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050d1a] flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/call/:leadId" element={<VoiceCall />} />
            <Route path="/summary/:leadId" element={<CallSummary />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
