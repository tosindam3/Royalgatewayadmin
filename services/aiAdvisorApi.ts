import apiClient from './apiClient';
import type { BriefingResponse, TrendsResponse, ChatMessage } from '../types/ai';

const base = '/ai';

export const aiAdvisorApi = {
  getBriefing: async (): Promise<BriefingResponse> => {
    return apiClient.get(`${base}/briefing`);
  },

  getTrends: async (): Promise<TrendsResponse> => {
    return apiClient.get(`${base}/trends`);
  },

  chat: async (message: string, history: ChatMessage[]): Promise<string> => {
    const data: any = await apiClient.post(`${base}/chat`, { message, history });
    return data.reply;
  },
};
