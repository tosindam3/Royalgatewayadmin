import axios from 'axios';
import type { BriefingResponse, TrendsResponse, ChatMessage } from '../types/ai';

const base = '/api/v1/ai';

export const aiAdvisorApi = {
  getBriefing: async (): Promise<BriefingResponse> => {
    const { data } = await axios.get(`${base}/briefing`);
    return data.data;
  },

  getTrends: async (): Promise<TrendsResponse> => {
    const { data } = await axios.get(`${base}/trends`);
    return data.data;
  },

  chat: async (message: string, history: ChatMessage[]): Promise<string> => {
    const { data } = await axios.post(`${base}/chat`, { message, history });
    return data.data.reply;
  },
};
