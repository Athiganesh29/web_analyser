/**
 * Topic Classifier
 * Zero-shot topic classification using HuggingFace BART-MNLI
 * Model: facebook/bart-large-mnli
 */

const fetch = require('node-fetch');

const HF_API_BASE = 'https://router.huggingface.co';
const MODEL = 'facebook/bart-large-mnli';

// Default candidate labels for website content
const DEFAULT_TOPICS = [
    'E-commerce / Product',
    'Blog / Article',
    'Corporate / Business',
    'Technology / Software',
    'News / Media',
    'Education / Learning',
    'Healthcare / Medical',
    'Finance / Banking',
    'Travel / Tourism',
    'Entertainment / Media',
    'Food / Restaurant',
    'Portfolio / Personal',
    'Government / Public Service',
    'Non-profit / Charity',
];

/**
 * Classify text into topic categories
 * @param {string} text - Text to classify
 * @param {string[]} candidateLabels - Optional custom labels
 * @returns {Promise<Object[]>} Array of { label, score } sorted by score desc
 */
async function classifyTopics(text, candidateLabels = DEFAULT_TOPICS) {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        console.warn('[TopicClassifier] No HF_API_KEY, using keyword-based fallback');
        return keywordBasedFallback(text);
    }

    try {
        // Truncate — MNLI accepts ~1024 tokens
        const truncated = text.slice(0, 3000);

        const response = await fetch(`${HF_API_BASE}/models/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: truncated,
                parameters: {
                    candidate_labels: candidateLabels,
                    multi_label: true,
                },
                options: { wait_for_model: true },
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error(`HF API ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();

        // result: { labels: [...], scores: [...], sequence: "..." }
        if (!result.labels || !result.scores) {
            return keywordBasedFallback(text);
        }

        return result.labels.map((label, i) => ({
            label,
            score: Math.round(result.scores[i] * 100) / 100,
        })).filter(t => t.score > 0.1) // Only topics with >10% confidence
            .slice(0, 5);
    } catch (error) {
        console.warn('[TopicClassifier] HF API failed, using fallback:', error.message);
        return keywordBasedFallback(text);
    }
}

/**
 * Keyword-based topic classification fallback
 */
function keywordBasedFallback(text) {
    const lower = text.toLowerCase();
    const topics = [];

    const patterns = {
        'E-commerce / Product': ['buy', 'price', 'cart', 'shop', 'product', 'order', 'shipping', 'discount'],
        'Blog / Article': ['blog', 'article', 'post', 'author', 'published', 'read more', 'comment'],
        'Corporate / Business': ['company', 'business', 'enterprise', 'corporate', 'services', 'solutions', 'team'],
        'Technology / Software': ['software', 'developer', 'api', 'code', 'platform', 'cloud', 'app', 'digital'],
        'News / Media': ['news', 'breaking', 'report', 'latest', 'update', 'headline', 'press'],
        'Education / Learning': ['learn', 'course', 'education', 'student', 'university', 'training', 'tutorial'],
        'Healthcare / Medical': ['health', 'medical', 'doctor', 'patient', 'treatment', 'hospital', 'care'],
        'Finance / Banking': ['finance', 'bank', 'invest', 'loan', 'credit', 'insurance', 'fund'],
    };

    for (const [topic, keywords] of Object.entries(patterns)) {
        let hits = 0;
        for (const kw of keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) hits += matches.length;
        }
        if (hits > 0) {
            topics.push({ label: topic, score: Math.min(0.9, 0.2 + hits * 0.08) });
        }
    }

    topics.sort((a, b) => b.score - a.score);
    return topics.slice(0, 5);
}

module.exports = { classifyTopics };
