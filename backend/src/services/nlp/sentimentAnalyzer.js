/**
 * Sentiment Analyzer
 * Analyzes emotional tone of website content using HuggingFace API
 * Model: distilbert-base-uncased-finetuned-sst-2-english
 */

const fetch = require('node-fetch');

const HF_API_BASE = 'https://router.huggingface.co';
const MODEL = 'distilbert-base-uncased-finetuned-sst-2-english';

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} { label, score, confidence }
 */
async function analyzeSentiment(text) {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        console.warn('[Sentiment] No HF_API_KEY, using rule-based fallback');
        return ruleBasedSentiment(text);
    }

    try {
        // Truncate to model max (~512 tokens ≈ 2000 chars)
        const truncated = text.slice(0, 2000);

        const response = await fetch(`${HF_API_BASE}/models/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: truncated,
                options: { wait_for_model: true },
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`HF API ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();

        // Result format: [[{label: "POSITIVE", score: 0.99}, {label: "NEGATIVE", score: 0.01}]]
        const scores = Array.isArray(result[0]) ? result[0] : result;
        const top = scores.reduce((a, b) => (a.score > b.score ? a : b));

        return {
            label: top.label.toUpperCase(),
            score: Math.round(top.score * 100) / 100,
            confidence: Math.round(top.score * 100),
        };
    } catch (error) {
        console.warn('[Sentiment] HF API failed, using fallback:', error.message);
        return ruleBasedSentiment(text);
    }
}

/**
 * Rule-based sentiment fallback
 */
function ruleBasedSentiment(text) {
    const positiveWords = [
        'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'perfect',
        'fantastic', 'awesome', 'good', 'happy', 'beautiful', 'brilliant',
        'outstanding', 'superb', 'enjoy', 'recommend', 'impressive', 'success',
        'innovative', 'powerful', 'reliable', 'efficient', 'premium', 'trusted',
    ];
    const negativeWords = [
        'bad', 'terrible', 'awful', 'worst', 'hate', 'poor', 'horrible',
        'disappointing', 'ugly', 'fail', 'broken', 'error', 'problem',
        'slow', 'expensive', 'difficult', 'confusing', 'frustrating', 'annoying',
        'warning', 'risk', 'danger', 'scam', 'fake', 'spam',
    ];

    const words = text.toLowerCase().split(/\W+/);
    let posCount = 0;
    let negCount = 0;

    for (const w of words) {
        if (positiveWords.includes(w)) posCount++;
        if (negativeWords.includes(w)) negCount++;
    }

    const total = posCount + negCount || 1;
    const posRatio = posCount / total;

    if (posRatio > 0.6) return { label: 'POSITIVE', score: 0.6 + posRatio * 0.3, confidence: Math.round((0.6 + posRatio * 0.3) * 100) };
    if (posRatio < 0.4) return { label: 'NEGATIVE', score: 0.6 + (1 - posRatio) * 0.3, confidence: Math.round((0.6 + (1 - posRatio) * 0.3) * 100) };
    return { label: 'NEUTRAL', score: 0.55, confidence: 55 };
}

module.exports = { analyzeSentiment };
