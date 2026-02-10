/**
 * Chat Service
 * Orchestrates the chatbot pipeline: intent → context → Gemini
 * Supports 3 modes: RAG (report), Hybrid (concepts), Open LLM (general)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { detectIntent } = require('./intentRouter');
const { buildReportContext, buildReportSummary } = require('./contextBuilder');
const { RAG_MODE_PROMPT, HYBRID_MODE_PROMPT, OPEN_MODE_PROMPT } = require('./prompts');

// ── Initialize Gemini ──
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Main chat function
 * @param {string} reportId - MongoDB report ID (optional)
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous messages [{role, text}]
 * @returns {Promise<{reply: string, intent: string, sources: string[]}>}
 */
async function chat(reportId, userMessage, chatHistory = []) {
    if (!process.env.GEMINI_API_KEY) {
        return {
            reply: 'Chat is unavailable. Please configure GEMINI_API_KEY in the backend .env file. You can get a free API key from https://aistudio.google.com/app/apikey',
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

    const reply = await callGemini(systemInstruction, userPrompt, chatHistory);
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

    return callGemini(systemInstruction, userPrompt, chatHistory);
}

/**
 * Handle GENERAL_INTENT — Open LLM mode
 */
async function handleGeneralIntent(userMessage, chatHistory) {
    const systemInstruction = OPEN_MODE_PROMPT;
    const userPrompt = `User Question: ${userMessage}`;

    return callGemini(systemInstruction, userPrompt, chatHistory);
}

/**
 * Call Gemini API
 */
async function callGemini(systemInstruction, userPrompt, chatHistory = []) {
    // Note: older versions of genAI SDK might not support systemInstruction in getGenerativeModel
    // If it fails, we fall back to prepending it.
    // However, 2.0 models usually support it.

    // We will attempt to use systemInstruction if the SDK supports it, otherwise prepend.
    // For safety with unknown SDK version, we'll PREPEND it to the history as the first "user" message 
    // or as a distinct "model" instruction if possible.

    // Simplest robust method: Prepend to the first turn if no history, or add as context.

    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: { parts: [{ text: systemInstruction }] } });

    const contents = [];

    // Add previous messages as history
    for (const msg of chatHistory.slice(-10)) {
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        });
    }

    // Add current prompt
    contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
    });

    try {
        const result = await model.generateContent({ contents });
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('[ChatService] Gemini API error:', error);

        if (error.message?.includes('API_KEY')) {
            return 'Chat is unavailable. The Gemini API key appears to be invalid. Please check your GEMINI_API_KEY configuration.';
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
