/**
 * Content Summarizer
 * Generates concise summaries using HuggingFace distilbart model
 * Model: sshleifer/distilbart-cnn-12-6
 */

const fetch = require('node-fetch');

const HF_API_BASE = 'https://router.huggingface.co';
const MODEL = 'sshleifer/distilbart-cnn-12-6';

/**
 * Generate a summary of the text
 * @param {string} text - Text to summarize
 * @param {Object} opts - Options
 * @returns {Promise<string>} Summary text
 */
async function summarize(text, opts = {}) {
    const { maxLength = 150, minLength = 40 } = opts;
    const apiKey = process.env.HF_API_KEY;

    // Need at least ~50 words for meaningful summarization
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 50) {
        return text.trim().slice(0, 300);
    }

    if (!apiKey) {
        console.warn('[Summarizer] No HF_API_KEY, using extractive fallback');
        return extractiveFallback(text, 3);
    }

    try {
        // Model accepts up to ~1024 tokens ≈ 4000 chars
        const truncated = text.slice(0, 8000);

        const response = await fetch(`${HF_API_BASE}/models/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: truncated,
                parameters: {
                    max_length: maxLength,
                    min_length: minLength,
                    do_sample: false,
                },
                options: { wait_for_model: true },
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error(`HF API ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        const summary = Array.isArray(result)
            ? result[0].summary_text
            : result.summary_text;

        return summary || extractiveFallback(text, 3);
    } catch (error) {
        console.warn('[Summarizer] HF API failed, using fallback:', error.message);
        return extractiveFallback(text, 3);
    }
}

/**
 * Simple extractive summarization fallback
 * Returns the first N sentences as the summary
 */
function extractiveFallback(text, numSentences = 3) {
    const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

    return sentences.slice(0, numSentences).join('. ') + '.';
}

module.exports = { summarize };
