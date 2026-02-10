/**
 * Entity Extractor
 * Extracts named entities (PER, ORG, LOC, MISC) using HuggingFace NER model
 * Model: dbmdz/bert-large-cased-finetuned-conll03-english
 */

const fetch = require('node-fetch');

const HF_API_BASE = 'https://router.huggingface.co';
const MODEL = 'dbmdz/bert-large-cased-finetuned-conll03-english';

/**
 * Extract named entities from text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object[]>} Array of { text, type, score }
 */
async function extractEntities(text) {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        console.warn('[NER] No HF_API_KEY, using rule-based fallback');
        return ruleBasedNER(text);
    }

    try {
        // Truncate to ~5000 chars (model token limit)
        const truncated = text.slice(0, 5000);

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

        // Merge consecutive sub-word tokens (B-/I- BIO tags)
        const entities = [];
        let current = null;

        for (const item of result) {
            const tag = item.entity_group || item.entity || '';
            const word = (item.word || '').replace(/^##/, '');

            if (tag.startsWith('B-') || (!tag.startsWith('I-') && tag !== 'O')) {
                if (current) entities.push(current);
                current = {
                    text: word,
                    type: tag.replace(/^[BI]-/, ''),
                    score: Math.round(item.score * 100) / 100,
                };
            } else if (tag.startsWith('I-') && current) {
                // continuation — append
                current.text += word.startsWith('##') ? word.slice(2) : ` ${word}`;
                current.score = Math.round(((current.score + item.score) / 2) * 100) / 100;
            }
        }
        if (current) entities.push(current);

        // Deduplicate by text (keep highest score)
        const seen = new Map();
        for (const e of entities) {
            const key = `${e.text.toLowerCase()}_${e.type}`;
            if (!seen.has(key) || seen.get(key).score < e.score) {
                seen.set(key, e);
            }
        }

        return Array.from(seen.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);
    } catch (error) {
        console.warn('[NER] HF API failed, using fallback:', error.message);
        return ruleBasedNER(text);
    }
}

/**
 * Rule-based NER fallback (very basic — finds capitalized multi-word sequences)
 */
function ruleBasedNER(text) {
    const entities = [];
    // Match capitalized sequences (2+ words)
    const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let match;
    const seen = new Set();

    while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        if (!seen.has(name.toLowerCase()) && name.length > 3) {
            seen.add(name.toLowerCase());
            entities.push({ text: name, type: 'MISC', score: 0.5 });
        }
        if (entities.length >= 15) break;
    }

    return entities;
}

module.exports = { extractEntities };
