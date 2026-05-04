import { create } from 'zustand'

const useStore = create((set, get) => ({
  leads: [],
  currentLead: null,
  currentConversation: [],
  analyticsData: {},
  conversationId: null,
  currentScore: 0,
  currentLanguage: 'hinglish',
  callStage: 'opening',

  setLeads: (leads) => set({ leads }),

  setCurrentLead: (lead) => set({ currentLead: lead, currentConversation: [], currentScore: 0 }),

  addMessage: (message) =>
    set((state) => ({
      currentConversation: [...state.currentConversation, message],
    })),

  setAnalyticsData: (data) => set({ analyticsData: data }),

  setConversationId: (id) => set({ conversationId: id }),

  setCurrentScore: (score) => set({ currentScore: score }),

  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),

  setCallStage: (stage) => set({ callStage: stage }),

  clearConversation: () =>
    set({
      currentConversation: [],
      currentScore: 0,
      conversationId: null,
      callStage: 'opening',
      currentLanguage: 'hinglish',
    }),
}))

export default useStore
