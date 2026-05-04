import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://rupeezy-ai-agent-production.up.railway.app',
  headers: { 'Content-Type': 'application/json' },
})

export const getLeads = (filter = null) => {
  const params = filter && filter !== 'All' ? { classification: filter } : {}
  return api.get('/leads', { params })
}

export const getLead = (leadId) => api.get(`/leads/${leadId}`)

export const createLead = (data) => api.post('/leads', data)

export const updateLeadStatus = (leadId, data) => api.put(`/leads/${leadId}/status`, data)

export const startConversation = (leadId) => api.post(`/conversation/start/${leadId}`)

export const sendMessage = (leadId, message) =>
  api.post(`/conversation/message/${leadId}`, { message })

export const endConversation = (leadId) => api.post(`/conversation/end/${leadId}`)

export const getConversationHistory = (leadId) => api.get(`/conversation/history/${leadId}`)

export const getCallSummary = (leadId) => api.get(`/conversation/summary/${leadId}`)

export const getAnalyticsFunnel = () => api.get('/analytics/funnel')

export const getAnalyticsSummary = () => api.get('/analytics/summary')

export const getRecentLeads = () => api.get('/analytics/leads/recent')

export default api
