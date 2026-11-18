import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  async sendMessage(content: string, sessionId?: string, images?: { data: string, mimeType: string }[]) {
    const response = await api.post('/chat/send', { content, sessionId, images });
    return response.data;
  },

  async getHistory(sessionId: string) {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  },

  async deleteSession(sessionId: string) {
    const response = await api.delete(`/chat/session/${sessionId}`);
    return response.data;
  },
};

export default api;
