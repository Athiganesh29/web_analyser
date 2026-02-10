/**
 * Intent Router
 * Keyword-based intent classifier for the chatbot
 * Routes user messages to the appropriate chat mode
 */

// Report-related keywords (triggers RAG mode)
const REPORT_KEYWORDS = [
    'my site', 'my website', 'my page', 'my report',
    'score', 'scores', 'grade', 'rating',
    'performance', 'seo', 'ux', 'accessibility', 'content quality',
    'lcp', 'cls', 'fcp', 'ttfb', 'tbt', 'fid',
    'largest contentful paint', 'cumulative layout shift', 'total blocking time',
    'first contentful paint', 'time to first byte',
    'issue', 'issues', 'fix', 'fixes', 'recommend', 'improve', 'optimize',
    'health score', 'health grade', 'risk', 'priority',
    'meta tag', 'meta description', 'h1', 'heading',
    'violation', 'violations', 'a11y',
    'word count', 'readability', 'flesch',
    'quick win', 'long term', 'executive summary',
    'this report', 'this site', 'this website', 'this page',
    'analyzed', 'audit', 'scanned',
    'why is', 'how can i', 'what should i',
    'image size', 'js size', 'css size', 'request count',
    'broken', 'slow', 'missing alt'
];

// Web concept keywords (triggers hybrid mode)
const CONCEPT_PATTERNS = [
    /^what (?:is|are) /i,
    /^how (?:does|do|is) /i,
    /^explain /i,
    /^define /i,
    /^tell me about /i,
    /^what does .+ mean/i,
    /^why (?:is|are|does|do) (?!my|this)/i
];

const CONCEPT_TERMS = [
    'web vital', 'core web vitals', 'lighthouse',
    'cdn', 'server-side rendering', 'ssr', 'csr',
    'lazy loading', 'code splitting', 'tree shaking',
    'minification', 'compression', 'caching', 'cache',
    'responsive design', 'mobile first',
    'schema markup', 'structured data', 'open graph',
    'sitemap', 'robots.txt', 'canonical',
    'wcag', 'aria', 'screen reader',
    'dns', 'https', 'ssl', 'tls',
    'framework', 'react', 'next.js', 'vue', 'angular',
    'hosting', 'deployment', 'ci/cd'
];

/**
 * Detect the intent of a user message
 * @param {string} message - User message
 * @param {boolean} hasReportId - Whether a reportId is available
 * @returns {{ intent: string, confidence: number }}
 */
function detectIntent(message, hasReportId = false) {
    const text = message.toLowerCase().trim();

    // ── Phase 1: Check for strong report-related signals ──
    let reportScore = 0;

    // Specific ownership words dramatically increase report likelihood
    const hasOwnership = /\b(my|this|our|the)\b/.test(text) && /\b(site|website|page|report|score|audit|grade)\b/.test(text);
    if (hasOwnership) {
        reportScore += 5;
    }

    // Iterate keywords but weight them less if no ownership is implied
    for (const keyword of REPORT_KEYWORDS) {
        if (text.includes(keyword)) {
            reportScore += 1;
        }
    }

    // If they ask about specific metrics, it COULD be report-related, but also concept-related
    // Only boost report score strongly if we ALREADY have a report loaded or ownership implied
    if (/\b(lcp|cls|fcp|ttfb|tbt|fid)\b/i.test(text)) {
        if (hasReportId || hasOwnership) {
            reportScore += 3;
        } else {
            reportScore += 1; // It's a metric, but maybe just a definition question
        }
    }

    // ── Phase 2: Check for concept patterns ──
    let conceptScore = 0;
    for (const pattern of CONCEPT_PATTERNS) {
        if (pattern.test(text)) {
            conceptScore += 3;
        }
    }
    for (const term of CONCEPT_TERMS) {
        if (text.includes(term)) {
            conceptScore += 2;
        }
    }

    // ── Phase 3: Decision logic ──

    // 1. Explicit request for report data (High confidence)
    if (reportScore >= 5) {
        return { intent: 'REPORT_INTENT', confidence: 0.95 };
    }

    // 2. Concept question (definition/explanation) - Prefer over weak report signal
    if (conceptScore >= 3) {
        return { intent: 'WEBSITE_CONCEPT_INTENT', confidence: 0.9 };
    }

    // 3. Mixed/Weak signals check
    if (reportScore >= 2) {
        // If we have a report, we lean towards treating metrics as report questions
        if (hasReportId) {
            return { intent: 'REPORT_INTENT', confidence: 0.7 };
        }
        // If NO report, we prefer concept/general unless it's explicitly about "my site"
        // (which was caught in step 1). So here, likely a general metric question.
        return { intent: 'WEBSITE_CONCEPT_INTENT', confidence: 0.6 };
    }

    // 4. Default to General
    return { intent: 'GENERAL_INTENT', confidence: 0.5 };
}

module.exports = { detectIntent };
