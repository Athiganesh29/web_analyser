import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const chatApi = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s for AI responses
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    intent?: string;
    sources?: string[];
}

export interface ChatResponse {
    success: boolean;
    reply: string;
    intent: string;
    sources: string[];
}

/**
 * Send a chat message to the WebAudit AI chatbot
 */
export async function sendChatMessage(
    reportId: string | undefined,
    message: string,
    history: ChatMessage[]
): Promise<ChatResponse> {
    const response = await chatApi.post('/api/chat', {
        reportId,
        message,
        history: history.map(m => ({ role: m.role, text: m.text }))
    });
    return response.data;
}
