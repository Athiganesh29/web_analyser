/**
 * Chat Service
 * Orchestrates the chatbot pipeline: intent → context → Groq LLM
 * Supports 3 modes: RAG (report), Hybrid (concepts), Open LLM (general)
 */

const Groq = require('groq-sdk');
const { detectIntent } = require('./intentRouter');
const { buildReportContext, buildReportSummary } = require('./contextBuilder');
const { RAG_MODE_PROMPT, HYBRID_MODE_PROMPT, OPEN_MODE_PROMPT } = require('./prompts');

// ── Initialize Groq ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const MODEL_NAME = 'llama-3.3-70b-versatile'; // Fast, high-quality model

/**
 * Main chat function
 * @param {string} reportId - MongoDB report ID (optional)
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous messages [{role, text}]
 * @returns {Promise<{reply: string, intent: string, sources: string[]}>}
 */
async function chat(reportId, userMessage, chatHistory = []) {
    if (!process.env.GROQ_API_KEY) {
        return {
            reply: 'Chat is unavailable. Please configure GROQ_API_KEY in the backend .env file. You can get a free API key from https://console.groq.com',
            intent: 'ERROR',
            sources: []
        };
    }

    // ── Step 1: Detect intent ──
    const { intent, confidence } = detectIntent(userMessage, !!reportId);
    console.log(`[ChatService] Intent: ${intent} (confidence: ${confidence})`);

    // ── Step 2: Route to appropriate handler ──
    let reply, sources = [];

    try {
        if (intent === 'REPORT_INTENT') {
            if (!reportId) {
                return {
                    reply: "I'd love to help with your website analysis, but I don't have a report loaded. Please run a website scan first, then ask me questions from the dashboard.",
                    intent,
                    sources: []
                };
            }
            const result = await handleReportIntent(reportId, userMessage, chatHistory);
            reply = result.reply;
            sources = result.sources;

        } else if (intent === 'WEBSITE_CONCEPT_INTENT') {
            reply = await handleConceptIntent(reportId, userMessage, chatHistory);

        } else {
            reply = await handleGeneralIntent(userMessage, chatHistory);
        }
    } catch (error) {
        console.error('[ChatService] Error processing chat request:', error);
        reply = "I'm sorry, I encountered an error. Please try asking again in a slightly different way.";
    }

    return { reply, intent, sources };
}

/**
 * Handle REPORT_INTENT — RAG mode
 */
async function handleReportIntent(reportId, userMessage, chatHistory) {
    const { fullContext, url } = await buildReportContext(reportId);

    // Detect which modules the user is asking about
    const sources = detectSources(userMessage);

    const systemInstruction = RAG_MODE_PROMPT;
    const userPrompt = `
═══ WEBSITE AUDIT REPORT DATA ═══
${fullContext}
═══ END OF REPORT DATA ═══
User Question: ${userMessage}`;

    const reply = await callGroq(systemInstruction, userPrompt, chatHistory);
    return { reply, sources };
}

/**
 * Handle WEBSITE_CONCEPT_INTENT — Hybrid mode
 */
async function handleConceptIntent(reportId, userMessage, chatHistory) {
    let contextNote = '';

    if (reportId) {
        const summary = await buildReportSummary(reportId);
        if (summary) {
            contextNote = `\n\n═══ USER'S REPORT SUMMARY (reference if relevant) ═══\n${summary}\n═══ END ═══\n`;
        }
    }

    const systemInstruction = HYBRID_MODE_PROMPT;
    const userPrompt = `${contextNote}\nUser Question: ${userMessage}`;

    return callGroq(systemInstruction, userPrompt, chatHistory);
}

/**
 * Handle GENERAL_INTENT — Open LLM mode
 */
async function handleGeneralIntent(userMessage, chatHistory) {
    const systemInstruction = OPEN_MODE_PROMPT;
    const userPrompt = `User Question: ${userMessage}`;

    return callGroq(systemInstruction, userPrompt, chatHistory);
}

/**
 * Call Groq API
 */
async function callGroq(systemInstruction, userPrompt, chatHistory = []) {
    const messages = [];

    // Add system instruction
    messages.push({
        role: 'system',
        content: systemInstruction
    });

    // Add previous messages as history (last 10 only)
    for (const msg of chatHistory.slice(-10)) {
        messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.text
        });
    }

    // Add current prompt
    messages.push({
        role: 'user',
        content: userPrompt
    });

    try {
        const completion = await groq.chat.completions.create({
            model: MODEL_NAME,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: false
        });

        return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('[ChatService] Groq API error:', error);

        if (error.message?.includes('API_KEY') || error.message?.includes('401')) {
            return 'Chat is unavailable. The Groq API key appears to be invalid. Please check your GROQ_API_KEY configuration.';
        }

        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
            return 'I\'m experiencing high demand right now. Please wait a moment and try again.';
        }

        throw error;
    }
}

/**
 * Detect which report modules the question is about
 */
function detectSources(message) {
    const text = message.toLowerCase();
    const sources = [];

    if (/\b(performance|lcp|cls|fcp|ttfb|tbt|fid|speed|slow|fast|load|js|css|image size|request|web vital)\b/.test(text)) {
        sources.push('performance');
    }
    if (/\b(seo|search engine|meta|title|description|h1|heading|alt text|sitemap|canonical|index|crawl|link|backlink)\b/.test(text)) {
        sources.push('seo');
    }
    if (/\b(ux|accessibility|a11y|violation|cta|friction|mobile|viewport|touch|aria|screen reader|wcag)\b/.test(text)) {
        sources.push('ux');
    }
    if (/\b(content|readability|word count|flesch|keyword|intent|depth|quality|text|copy)\b/.test(text)) {
        sources.push('content');
    }

    // If no specific module detected, report all
    if (sources.length === 0) {
        sources.push('overview');
    }

    return sources;
}

module.exports = { chat };
