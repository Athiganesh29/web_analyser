import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Zap, Search, Smartphone, FileText, Loader2 } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../services/chatApi';
import type { Report } from '../services/api';
import './Chatbot.css';

interface ChatbotProps {
    reportId?: string;
    report?: Report | null;
}

const SUGGESTED_QUESTIONS = [
    { text: "Why is my performance score low?", icon: Zap },
    { text: "What SEO issues should I fix first?", icon: Search },
    { text: "How can I improve UX?", icon: Smartphone },
    { text: "Summarize my report", icon: FileText },
];

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
    REPORT_INTENT: { label: 'Report', color: '#10B981' },
    WEBSITE_CONCEPT_INTENT: { label: 'Concept', color: '#6366F1' },
    GENERAL_INTENT: { label: 'General', color: '#8B5CF6' },
};

export default function Chatbot({ reportId, report }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || isLoading) return;

        setHasInteracted(true);
        setInput('');

        // Add user message
        const userMsg: ChatMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await sendChatMessage(reportId, messageText, [...messages, userMsg]);
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                text: response.reply,
                intent: response.intent,
                sources: response.sources,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            console.error('Chatbot Error:', err);
            let errorMessage = 'Sorry, I encountered an error. Please try again.';

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (!err.response) {
                errorMessage = 'Cannot connect to the server. Please ensure the backend is running.';
            }

            const errorMsg: ChatMessage = {
                role: 'assistant',
                text: errorMessage,
                intent: 'ERROR',
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const healthScore = report?.aggregator?.website_health_score ?? 0;
    const siteUrl = report?.final_url || report?.url || '';

    return (
        <>
            {/* ── FAB Button ── */}
            {!isOpen && (
                <button
                    className="chatbot-fab"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Chat"
                >
                    <div className="chatbot-fab-glow" />
                    <MessageSquare size={24} />
                    <span className="chatbot-fab-pulse" />
                </button>
            )}

            {/* ── Chat Panel ── */}
            {isOpen && (
                <div className="chatbot-panel">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-header-icon">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="chatbot-header-title">WebAudit AI</h3>
                                <p className="chatbot-header-subtitle">
                                    {report ? (
                                        <>Score: {healthScore}/100 · {siteUrl.replace(/^https?:\/\//, '').substring(0, 30)}</>
                                    ) : (
                                        <>General Assistant</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {/* Welcome message */}
                        {!hasInteracted && messages.length === 0 && (
                            <div className="chatbot-welcome">
                                <div className="chatbot-welcome-icon">
                                    <Bot size={32} />
                                </div>
                                <h4>Hey! I'm your AI audit assistant.</h4>
                                <p>Ask me anything about your website report, web concepts, or optimization tips.</p>

                                <div className="chatbot-suggestions">
                                    {SUGGESTED_QUESTIONS.map((q, i) => (
                                        <button
                                            key={i}
                                            className="chatbot-suggestion"
                                            onClick={() => handleSend(q.text)}
                                        >
                                            <q.icon size={14} />
                                            <span>{q.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message bubbles */}
                        {messages.map((msg, i) => (
                            <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                                <div className="chatbot-msg-avatar">
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className="chatbot-msg-content">
                                    <div className="chatbot-msg-bubble">
                                        {formatMessageText(msg.text)}
                                    </div>
                                    {msg.role === 'assistant' && msg.intent && msg.intent !== 'ERROR' && (
                                        <div className="chatbot-msg-meta">
                                            <span
                                                className="chatbot-intent-badge"
                                                style={{
                                                    color: INTENT_LABELS[msg.intent]?.color || '#888',
                                                    borderColor: (INTENT_LABELS[msg.intent]?.color || '#888') + '40',
                                                    backgroundColor: (INTENT_LABELS[msg.intent]?.color || '#888') + '12',
                                                }}
                                            >
                                                {INTENT_LABELS[msg.intent]?.label || msg.intent}
                                            </span>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <span className="chatbot-sources">
                                                    {msg.sources.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="chatbot-msg chatbot-msg--assistant">
                                <div className="chatbot-msg-avatar">
                                    <Bot size={14} />
                                </div>
                                <div className="chatbot-msg-content">
                                    <div className="chatbot-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chatbot-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask about your report..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            className="chatbot-send"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? <Loader2 size={18} className="chatbot-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * Format message text: convert markdown-like patterns to JSX
 */
function formatMessageText(text: string) {
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);

    return (
        <div className="chatbot-formatted">
            {paragraphs.map((para, pi) => {
                // Check if it's a bullet list
                const lines = para.split('\n');
                const isBulletList = lines.every(l => /^\s*[-•*]\s/.test(l) || l.trim() === '');

                if (isBulletList && lines.filter(l => l.trim()).length > 0) {
                    return (
                        <ul key={pi} className="chatbot-list">
                            {lines.filter(l => l.trim()).map((line, li) => (
                                <li key={li}>{formatInline(line.replace(/^\s*[-•*]\s*/, ''))}</li>
                            ))}
                        </ul>
                    );
                }

                // Check if it's a numbered list
                const isNumberedList = lines.every(l => /^\s*\d+[.)]\s/.test(l) || l.trim() === '');

                if (isNumberedList && lines.filter(l => l.trim()).length > 0) {
                    return (
                        <ol key={pi} className="chatbot-list">
                            {lines.filter(l => l.trim()).map((line, li) => (
                                <li key={li}>{formatInline(line.replace(/^\s*\d+[.)]\s*/, ''))}</li>
                            ))}
                        </ol>
                    );
                }

                return <p key={pi}>{formatInline(para)}</p>;
            })}
        </div>
    );
}

function formatInline(text: string) {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}
