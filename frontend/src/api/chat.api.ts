import axiosClient from './axiosClient';

export interface ChatMessage {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
  };
  text: string;
  createdAt: string;
}

export const getMessages = async () => {
  const response = await axiosClient.get<ChatMessage[]>('/chat');
  return response.data;
};

export const postMessage = async (text: string) => {
  const response = await axiosClient.post<ChatMessage>('/chat', { text });
  return response.data;
};

export const postBotMessage = async (message: string, history: { text: string; isBot: boolean }[] = []) => {
  const response = await axiosClient.post<{ reply: string }>('/chat/bot', { message, history });
  return response.data;
};