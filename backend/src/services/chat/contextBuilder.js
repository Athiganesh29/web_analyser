/**
 * Context Builder
 * Extracts and formats report data into clean text chunks
 * for the LLM context window. Never sends raw DB objects.
 */

const Report = require('../../models/Report');

/**
 * Build full report context for RAG mode
 * @param {string} reportId - MongoDB report ID
 * @returns {Promise<{ fullContext: string, reportSummary: string, url: string }>}
 */
async function buildReportContext(reportId) {
    const report = await Report.findById(reportId);
    if (!report) {
        throw new Error('Report not found');
    }

    const chunks = [];

    // ── Overview chunk ──
    const agg = report.aggregator || {};
    chunks.push(formatOverview(report, agg));

    // ── Performance chunk ──
    if (report.modules?.performance) {
        chunks.push(formatPerformance(report.modules.performance));
    }

    // ── SEO chunk ──
    if (report.modules?.seo) {
        chunks.push(formatSEO(report.modules.seo));
    }

    // ── UX chunk ──
    if (report.modules?.ux) {
        chunks.push(formatUX(report.modules.ux));
    }

    // ── Content chunk ──
    if (report.modules?.content) {
        chunks.push(formatContent(report.modules.content));
    }

    // ── AI Insights chunk ──
    if (report.ai_insights) {
        chunks.push(formatAIInsights(report.ai_insights));
    }

    const fullContext = chunks.join('\n\n');
    const reportSummary = chunks[0]; // overview is a good summary

    return {
        fullContext,
        reportSummary,
        url: report.final_url || report.url
    };
}

/**
 * Build a brief summary for hybrid mode (concept questions)
 * @param {string} reportId - MongoDB report ID
 * @returns {Promise<string>}
 */
async function buildReportSummary(reportId) {
    if (!reportId) return '';

    try {
        const report = await Report.findById(reportId);
        if (!report) return '';

        const agg = report.aggregator || {};
        const scores = agg.module_scores || {};

        return `[User's website: ${report.final_url || report.url}]
Health Score: ${agg.website_health_score ?? 'N/A'}/100 (Grade: ${agg.health_grade ?? 'N/A'})
Module Scores — Performance: ${scores.performance ?? 'N/A'}, SEO: ${scores.seo ?? 'N/A'}, UX: ${scores.ux ?? 'N/A'}, Content: ${scores.content ?? 'N/A'}
Risk Level: ${agg.overall_risk_level ?? 'N/A'}`;
    } catch (err) {
        console.error('[ContextBuilder] Failed to build summary:', err.message);
        return '';
    }
}


// ─────────────────────────────────
// Formatting helpers
// ─────────────────────────────────

function formatOverview(report, agg) {
    const scores = agg.module_scores || {};
    return `## WEBSITE AUDIT OVERVIEW
URL: ${report.final_url || report.url}
Overall Health Score: ${agg.website_health_score ?? 'N/A'} / 100
Health Grade: ${agg.health_grade ?? 'N/A'}
Overall Risk Level: ${agg.overall_risk_level ?? 'N/A'}
Action Recommendation: ${agg.action_recommendation_flag?.replace(/_/g, ' ') ?? 'N/A'}
Dominant Risk Domains: ${(agg.dominant_risk_domains || []).join(', ') || 'None'}
Module Scores:
  - Performance: ${scores.performance ?? 'N/A'}/100
  - SEO: ${scores.seo ?? 'N/A'}/100
  - UX & Accessibility: ${scores.ux ?? 'N/A'}/100
  - Content Quality: ${scores.content ?? 'N/A'}/100
Analysis Date: ${report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}`;
}

function formatPerformance(perf) {
    const m = perf.metrics || {};
    let text = `## PERFORMANCE MODULE (Score: ${perf.score ?? 'N/A'}/100)
Confidence: ${perf.confidence ?? 'N/A'}
Recommendation: ${perf.recommendation_flag?.replace(/_/g, ' ') ?? 'N/A'}

Key Metrics:
  - LCP (Largest Contentful Paint): ${m.lcp_s != null ? m.lcp_s + 's' : 'N/A'} (good: <2.5s, bad: >4.0s)
  - CLS (Cumulative Layout Shift): ${m.cls != null ? m.cls : 'N/A'} (good: <0.1, bad: >0.25)
  - FCP (First Contentful Paint): ${m.fcp_s != null ? m.fcp_s + 's' : 'N/A'} (good: <1.8s, bad: >3.0s)
  - TTFB (Time to First Byte): ${m.ttfb_s != null ? m.ttfb_s + 's' : 'N/A'} (good: <0.8s, bad: >1.8s)
  - TBT (Total Blocking Time): ${m.tbt_ms != null ? m.tbt_ms + 'ms' : 'N/A'} (good: <200ms, bad: >600ms)
  - Total JS Size: ${m.total_js_kb != null ? m.total_js_kb + ' KB' : 'N/A'}
  - Total CSS Size: ${m.total_css_kb != null ? m.total_css_kb + ' KB' : 'N/A'}
  - Total Image Size: ${m.total_images_kb != null ? m.total_images_kb + ' KB' : 'N/A'}
  - Total Requests: ${m.total_requests ?? 'N/A'}`;

    if (perf.dominant_negative_factors?.length) {
        text += `\n\nDominant Negative Factors:\n${perf.dominant_negative_factors.map(f =>
            `  - ${typeof f === 'string' ? f : f.factor || f.name || JSON.stringify(f)}`
        ).join('\n')}`;
    }

    text += formatIssuesAndFixes(perf);
    return text;
}

function formatSEO(seo) {
    let text = `## SEO MODULE (Score: ${seo.score ?? 'N/A'}/100)
Indexability Status: ${seo.indexability_status ?? 'N/A'}
Crawl Health: ${seo.crawl_health_indicator ?? 'N/A'}
Recommendation: ${seo.recommendation_flag?.replace(/_/g, ' ') ?? 'N/A'}

Key Metrics:
  - Title Length: ${seo.title_length ?? 'N/A'} chars (ideal: 30-60)
  - Meta Description Length: ${seo.meta_description_length ?? 'N/A'} chars (ideal: 120-160)
  - H1 Count: ${seo.h1_count ?? 'N/A'} (ideal: exactly 1)
  - Images Missing Alt Text: ${seo.images_missing_alt_count ?? 'N/A'}
  - Internal Links: ${seo.internal_links_count ?? 'N/A'}
  - External Links: ${seo.external_links_count ?? 'N/A'}`;

    if (seo.primary_seo_risks?.length) {
        text += `\nPrimary SEO Risks: ${seo.primary_seo_risks.join(', ')}`;
    }

    text += formatIssuesAndFixes(seo);
    return text;
}

function formatUX(ux) {
    const byImpact = ux.violations_by_impact || {};
    let text = `## UX & ACCESSIBILITY MODULE (Score: ${ux.score ?? 'N/A'}/100)
Accessibility Risk Level: ${ux.accessibility_risk_level ?? 'N/A'}
Trust Impact: ${ux.trust_impact_indicator ?? 'N/A'}
Recommendation: ${ux.recommendation_flag?.replace(/_/g, ' ') ?? 'N/A'}

Key Metrics:
  - Total Violations: ${ux.violations_count ?? 0}
  - Critical Violations: ${byImpact.critical ?? 0}
  - Serious Violations: ${byImpact.serious ?? 0}
  - Moderate Violations: ${byImpact.moderate ?? 0}
  - Minor Violations: ${byImpact.minor ?? 0}
  - Total CTAs: ${ux.ctas_count ?? 'N/A'}
  - CTAs Above Fold: ${ux.ctas_above_fold ?? 'N/A'}`;

    if (ux.primary_friction_sources?.length) {
        text += `\nFriction Sources: ${ux.primary_friction_sources.join(', ')}`;
    }

    text += formatIssuesAndFixes(ux);
    return text;
}

function formatContent(content) {
    let text = `## CONTENT QUALITY MODULE (Score: ${content.score ?? 'N/A'}/100)
Intent Match Level: ${content.intent_match_level ?? 'N/A'}
Content Depth Status: ${content.content_depth_status ?? 'N/A'}
Recommendation: ${content.recommendation_flag?.replace(/_/g, ' ') ?? 'N/A'}

Key Metrics:
  - Word Count: ${content.word_count ?? 'N/A'} (ideal: >300, good: >800)
  - Flesch Reading Ease: ${content.flesch_reading_ease != null ? content.flesch_reading_ease.toFixed(1) : 'N/A'} (higher = easier to read)
  - Flesch-Kincaid Grade Level: ${content.flesch_kincaid_grade != null ? content.flesch_kincaid_grade.toFixed(1) : 'N/A'}
  - Keywords Found: ${content.keywords?.length ?? 0}`;

    if (content.primary_content_gaps?.length) {
        text += `\nContent Gaps: ${content.primary_content_gaps.join(', ')}`;
    }

    if (content.keywords?.length) {
        const topKw = content.keywords.slice(0, 8).map(k =>
            typeof k === 'string' ? k : k.word || k.term || JSON.stringify(k)
        );
        text += `\nTop Keywords: ${topKw.join(', ')}`;
    }

    text += formatIssuesAndFixes(content);
    return text;
}

function formatAIInsights(insights) {
    let text = `## AI STRATEGIC INSIGHTS`;

    if (insights.executiveSummary) {
        text += `\nExecutive Summary: ${insights.executiveSummary}`;
    }

    if (insights.topPriorities?.length) {
        text += `\n\nTop Priorities:`;
        insights.topPriorities.forEach((p, i) => {
            text += `\n  ${i + 1}. ${p.title || 'Priority'} (Impact: ${p.impact || 'N/A'}, ROI: ${p.estimatedROI || 'N/A'})`;
            if (p.description) text += `\n     ${p.description}`;
        });
    }

    if (insights.quickWins?.length) {
        text += `\n\nQuick Wins:\n${insights.quickWins.map(w => `  - ${w}`).join('\n')}`;
    }

    if (insights.longTermGoals?.length) {
        text += `\n\nLong Term Goals:\n${insights.longTermGoals.map(g => `  - ${g}`).join('\n')}`;
    }

    return text;
}

function formatIssuesAndFixes(moduleData) {
    let text = '';

    if (moduleData.issues?.length) {
        text += `\n\nIssues Found (${moduleData.issues.length}):`;
        moduleData.issues.forEach((issue, i) => {
            const sev = issue.severity || 'info';
            const desc = issue.description || issue.message || JSON.stringify(issue);
            text += `\n  ${i + 1}. [${sev.toUpperCase()}] ${desc}`;
        });
    }

    if (moduleData.fixes?.length) {
        text += `\n\nRecommended Fixes (${moduleData.fixes.length}):`;
        moduleData.fixes.forEach((fix, i) => {
            const title = fix.title || fix.name || 'Fix';
            const desc = fix.description || '';
            const priority = fix.priority ? `P${fix.priority}` : '';
            text += `\n  ${i + 1}. ${priority ? `[${priority}] ` : ''}${title}${desc ? ': ' + desc : ''}`;
        });
    }

    return text;
}

module.exports = {
    buildReportContext,
    buildReportSummary
};
