import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Globe, Zap, Search, Smartphone, FileText,
    TrendingUp, Shield, ChevronRight, Clock, Activity,
    Server, Tag, Layout, Image, Eye, Type, Gauge,
    AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';
import { getReport, type Report } from '../services/api';
import './AnalyzerDashboard.css';

// ─── Grade Table ───
const GRADE_TABLE = [
    { grade: 'A+', range: '90 – 100', color: '#10B981', desc: 'Excellent website health. Fully optimized across SEO, Performance, UX, Accessibility, and Content.' },
    { grade: 'A', range: '80 – 89', color: '#34D399', desc: 'Strong website quality. Minor improvements needed.' },
    { grade: 'B', range: '70 – 79', color: '#FBBF24', desc: 'Good, but noticeable issues exist in some areas.' },
    { grade: 'C', range: '60 – 69', color: '#F59E0B', desc: 'Below average. Multiple issues affecting user experience and visibility.' },
    { grade: 'D', range: '45 – 59', color: '#F97316', desc: 'Poor performance and SEO. Major errors impacting conversions.' },
    { grade: 'E', range: '30 – 44', color: '#EF4444', desc: 'Critical issues. Website likely difficult to use and poorly optimized.' },
    { grade: 'F', range: '0 – 29', color: '#DC2626', desc: 'Severely broken or unusable. Immediate overhaul recommended.' },
];

function getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    if (score >= 30) return 'E';
    return 'F';
}

function getStatusColor(value: number, good: number, bad: number) {
    if (value <= good) return '#10B981';
    if (value >= bad) return '#EF4444';
    return '#F59E0B';
}

function formatMetric(value: number | null | undefined, unit: string, decimals = 2): string {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(decimals)}${unit}`;
}

// Severity badge helper
function SeverityBadge({ severity }: { severity: string }) {
    const map: Record<string, { bg: string; color: string; icon: any }> = {
        critical: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', icon: XCircle },
        high: { bg: 'rgba(249,115,22,0.12)', color: '#F97316', icon: AlertTriangle },
        medium: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', icon: AlertTriangle },
        low: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', icon: Info },
    };
    const s = map[severity] || map.low;
    const Icon = s.icon;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const }}>
            <Icon size={11} /> {severity}
        </span>
    );
}

export function AnalyzerDashboard() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId) { setLoading(false); return; }
        (async () => {
            try {
                const data = await getReport(reportId);
                setReport(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch report');
            } finally {
                setLoading(false);
            }
        })();
    }, [reportId]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading report...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="loading-container">
                <XCircle size={48} style={{ color: '#EF4444' }} />
                <p style={{ color: '#EF4444' }}>{error || 'Report not found'}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const agg = report.aggregator;
    const perf = report.modules?.performance;
    const seo = report.modules?.seo;
    const ux = report.modules?.ux;
    const content = report.modules?.content;

    const overallScore = agg?.website_health_score ?? 0;
    const overallGrade = getGrade(overallScore);
    const overallMeta = GRADE_TABLE.find((row) => row.grade === overallGrade);

    const MODULE_ICONS: Record<string, React.ReactNode> = {
        Performance: <Zap size={18} />,
        SEO: <Search size={18} />,
        UX: <Smartphone size={18} />,
        Content: <FileText size={18} />,
    };

    const MODULE_COLORS: Record<string, string> = {
        Performance: '#00C49F',
        SEO: '#6366F1',
        UX: '#F59E0B',
        Content: '#EC4899',
    };

    const moduleScores = [
        { name: 'Performance', value: agg?.module_scores?.performance ?? perf?.score ?? 0 },
        { name: 'SEO', value: agg?.module_scores?.seo ?? seo?.score ?? 0 },
        { name: 'UX', value: agg?.module_scores?.ux ?? ux?.score ?? 0 },
        { name: 'Content', value: agg?.module_scores?.content ?? content?.score ?? 0 },
    ];

    // Collect all issues from all modules
    const allIssues = [
        ...(perf?.issues || []).map((i: any) => ({ ...i, module: 'Performance' })),
        ...(seo?.issues || []).map((i: any) => ({ ...i, module: 'SEO' })),
        ...(ux?.issues || []).map((i: any) => ({ ...i, module: 'UX' })),
        ...(content?.issues || []).map((i: any) => ({ ...i, module: 'Content' })),
    ];

    // Collect all fixes
    const allFixes = [
        ...(perf?.fixes || []).map((f: any) => ({ ...f, module: 'Performance' })),
        ...(seo?.fixes || []).map((f: any) => ({ ...f, module: 'SEO' })),
        ...(ux?.fixes || []).map((f: any) => ({ ...f, module: 'UX' })),
        ...(content?.fixes || []).map((f: any) => ({ ...f, module: 'Content' })),
    ];
    allFixes.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    return (
        <div className="dashboard">
            <div className="container dashboard-container">
                {/* ── Header ── */}
                <div className="dashboard-header">
                    <div className="dashboard-header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>
                        <div className="dashboard-header-info">
                            <h1 className="dashboard-title">
                                <Shield size={22} className="title-icon" />
                                Website Audit Report
                            </h1>
                            <p className="dashboard-url">
                                <Globe size={14} />
                                <span>{report.final_url || report.url}</span>
                            </p>
                        </div>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-outline" onClick={() => navigate('/')}>New Scan</button>
                    </div>
                </div>

                {/* ── Grade Hero ── */}
                <div className="grade-hero">
                    <div className="grade-hero-ring-wrap">
                        <div className="grade-hero-glow" style={{ background: `radial-gradient(circle, ${overallMeta?.color}25 0%, transparent 70%)` }} />
                        <div className="grade-hero-ring" style={{ borderColor: overallMeta?.color }}>
                            <span className="grade-hero-letter" style={{ color: overallMeta?.color }}>
                                {overallGrade}
                            </span>
                        </div>
                    </div>
                    <div className="grade-hero-details">
                        <span className="grade-hero-eyebrow">Overall Health Score</span>
                        <div className="grade-hero-score-row">
                            <span className="grade-hero-score">{overallScore}</span>
                            <span className="grade-hero-max">/ 100</span>
                            <span className="grade-hero-tag" style={{ backgroundColor: `${overallMeta?.color}18`, color: overallMeta?.color, borderColor: `${overallMeta?.color}40` }}>
                                <TrendingUp size={12} />
                                {overallGrade === 'A+' || overallGrade === 'A' ? 'Excellent' : overallGrade === 'B' ? 'Good' : overallGrade === 'C' ? 'Average' : 'Needs Work'}
                            </span>
                        </div>
                        <p className="grade-hero-desc">{overallMeta?.desc}</p>
                    </div>
                </div>

                {/* ── Module Score Cards ── */}
                <div className="dash-section-header">
                    <span className="dash-section-label">Audit Results</span>
                    <h2 className="dash-section-title">Module <span className="accent">Breakdown</span></h2>
                    <p className="dash-section-subtitle">Individual scores across all audit categories</p>
                </div>
                <div className="grade-modules">
                    {moduleScores.map((module) => {
                        const grade = getGrade(module.value);
                        const meta = GRADE_TABLE.find((row) => row.grade === grade);
                        const modColor = MODULE_COLORS[module.name] || '#aee92b';
                        return (
                            <div key={module.name} className="grade-module-card">
                                <div className="module-card-top">
                                    <div className="module-icon" style={{ backgroundColor: `${modColor}15`, color: modColor }}>
                                        {MODULE_ICONS[module.name]}
                                    </div>
                                    <span className="grade-badge" style={{ backgroundColor: `${meta?.color}18`, color: meta?.color, borderColor: `${meta?.color}40` }}>
                                        {grade}
                                    </span>
                                </div>
                                <p className="grade-module-name">{module.name}</p>
                                <div className="module-progress-wrap">
                                    <div className="module-progress-bar">
                                        <div className="module-progress-fill" style={{ width: `${module.value}%`, backgroundColor: modColor }} />
                                    </div>
                                    <span className="module-progress-num" style={{ color: modColor }}>{module.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── PERFORMANCE: Core Web Vitals ── */}
                {perf && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">Performance</span>
                            <h2 className="dash-section-title">Core Web <span className="accent">Vitals</span></h2>
                            <p className="dash-section-subtitle">LCP, FID/TBT, CLS, TTFB — real metrics from your page</p>
                        </div>
                        <div className="metrics-grid">
                            <MetricCard
                                icon={<Clock size={20} />}
                                label="LCP"
                                sublabel="Largest Contentful Paint"
                                value={formatMetric(perf.metrics?.lcp_s, 's')}
                                color={getStatusColor(perf.metrics?.lcp_s ?? 0, 2.5, 4.0)}
                            />
                            <MetricCard
                                icon={<Activity size={20} />}
                                label="TBT"
                                sublabel="Total Blocking Time (≈ FID)"
                                value={formatMetric(perf.metrics?.tbt_ms, 'ms', 0)}
                                color={getStatusColor(perf.metrics?.tbt_ms ?? 0, 200, 600)}
                            />
                            <MetricCard
                                icon={<Gauge size={20} />}
                                label="CLS"
                                sublabel="Cumulative Layout Shift"
                                value={formatMetric(perf.metrics?.cls, '', 3)}
                                color={getStatusColor(perf.metrics?.cls ?? 0, 0.1, 0.25)}
                            />
                            <MetricCard
                                icon={<Server size={20} />}
                                label="TTFB"
                                sublabel="Time to First Byte"
                                value={formatMetric(perf.metrics?.ttfb_s, 's')}
                                color={getStatusColor(perf.metrics?.ttfb_s ?? 0, 0.8, 1.8)}
                            />
                            <MetricCard
                                icon={<Zap size={20} />}
                                label="FCP"
                                sublabel="First Contentful Paint"
                                value={formatMetric(perf.metrics?.fcp_s, 's')}
                                color={getStatusColor(perf.metrics?.fcp_s ?? 0, 1.8, 3.0)}
                            />
                            <MetricCard
                                icon={<Tag size={20} />}
                                label="JS Size"
                                sublabel="Total JavaScript"
                                value={formatMetric(perf.metrics?.total_js_kb, ' KB', 0)}
                                color={getStatusColor(perf.metrics?.total_js_kb ?? 0, 200, 500)}
                            />
                            <MetricCard
                                icon={<Layout size={20} />}
                                label="CSS Size"
                                sublabel="Total CSS"
                                value={formatMetric(perf.metrics?.total_css_kb, ' KB', 0)}
                                color={getStatusColor(perf.metrics?.total_css_kb ?? 0, 50, 150)}
                            />
                            <MetricCard
                                icon={<Image size={20} />}
                                label="Images"
                                sublabel="Total Image Size"
                                value={formatMetric(perf.metrics?.total_images_kb, ' KB', 0)}
                                color={getStatusColor(perf.metrics?.total_images_kb ?? 0, 500, 2000)}
                            />
                        </div>
                    </>
                )}

                {/* ── SEO: Meta, Headings, Schema, OG ── */}
                {seo && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">SEO</span>
                            <h2 className="dash-section-title">Search Engine <span className="accent">Optimization</span></h2>
                            <p className="dash-section-subtitle">Meta tags, heading structure, schema markup, and Open Graph data</p>
                        </div>
                        <div className="detail-cards-grid">
                            <DetailCard title="Meta Tags" icon={<Tag size={18} />} color="#6366F1" items={[
                                { label: 'Title Length', value: `${seo.title_length ?? 'N/A'} chars`, status: seo.title_length >= 30 && seo.title_length <= 60 ? 'good' : 'bad' },
                                { label: 'Meta Description', value: `${seo.meta_description_length ?? 'N/A'} chars`, status: seo.meta_description_length >= 120 && seo.meta_description_length <= 160 ? 'good' : 'bad' },
                                { label: 'Indexability', value: seo.indexability_status || 'N/A', status: seo.indexability_status === 'good' ? 'good' : 'bad' },
                            ]} />
                            <DetailCard title="Headings" icon={<Type size={18} />} color="#6366F1" items={[
                                { label: 'H1 Count', value: `${seo.h1_count ?? 'N/A'}`, status: seo.h1_count === 1 ? 'good' : 'bad' },
                                { label: 'Images Missing Alt', value: `${seo.images_missing_alt_count ?? 0}`, status: (seo.images_missing_alt_count ?? 0) === 0 ? 'good' : 'warn' },
                            ]} />
                            <DetailCard title="Schema & Structured Data" icon={<Layout size={18} />} color="#6366F1" items={[
                                { label: 'Crawl Health', value: seo.crawl_health_indicator || 'N/A', status: seo.crawl_health_indicator === 'low' ? 'good' : 'bad' },
                                { label: 'SEO Risks', value: seo.primary_seo_risks?.length ? seo.primary_seo_risks.join(', ') : 'None', status: (seo.primary_seo_risks?.length ?? 0) === 0 ? 'good' : 'warn' },
                            ]} />
                            <DetailCard title="Links" icon={<Globe size={18} />} color="#6366F1" items={[
                                { label: 'Internal Links', value: `${seo.internal_links_count ?? 'N/A'}`, status: (seo.internal_links_count ?? 0) >= 5 ? 'good' : 'warn' },
                                { label: 'External Links', value: `${seo.external_links_count ?? 'N/A'}`, status: 'neutral' },
                            ]} />
                        </div>
                    </>
                )}

                {/* ── UX: Viewport, Touch, A11y, Layout ── */}
                {ux && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">UX & Accessibility</span>
                            <h2 className="dash-section-title">User <span className="accent">Experience</span></h2>
                            <p className="dash-section-subtitle">Mobile viewport, touch targets, accessibility, and layout analysis</p>
                        </div>
                        <div className="detail-cards-grid">
                            <DetailCard title="Mobile / Viewport" icon={<Smartphone size={18} />} color="#F59E0B" items={[
                                { label: 'Viewport Meta', value: ux.viewport_meta_present !== undefined ? (ux.viewport_meta_present ? 'Present' : 'Missing') : 'N/A', status: ux.viewport_meta_present ? 'good' : 'bad' },
                                { label: 'CTAs Above Fold', value: `${ux.ctas_above_fold ?? 'N/A'}`, status: (ux.ctas_above_fold ?? 0) >= 1 ? 'good' : 'warn' },
                            ]} />
                            <DetailCard title="Touch & CTAs" icon={<Eye size={18} />} color="#F59E0B" items={[
                                { label: 'Total CTAs', value: `${ux.ctas_count ?? 'N/A'}`, status: 'neutral' },
                                { label: 'Friction Sources', value: ux.primary_friction_sources?.length ? ux.primary_friction_sources.join(', ') : 'None', status: (ux.primary_friction_sources?.length ?? 0) === 0 ? 'good' : 'warn' },
                            ]} />
                            <DetailCard title="Accessibility (A11y)" icon={<Shield size={18} />} color="#F59E0B" items={[
                                { label: 'A11y Risk Level', value: ux.accessibility_risk_level || 'N/A', status: ux.accessibility_risk_level === 'low' ? 'good' : ux.accessibility_risk_level === 'medium' ? 'warn' : 'bad' },
                                { label: 'Total Violations', value: `${ux.violations_count ?? 0}`, status: (ux.violations_count ?? 0) === 0 ? 'good' : 'bad' },
                                { label: 'Critical', value: `${ux.violations_by_impact?.critical ?? 0}`, status: (ux.violations_by_impact?.critical ?? 0) === 0 ? 'good' : 'bad' },
                                { label: 'Serious', value: `${ux.violations_by_impact?.serious ?? 0}`, status: (ux.violations_by_impact?.serious ?? 0) === 0 ? 'good' : 'warn' },
                            ]} />
                            <DetailCard title="Layout & Trust" icon={<Layout size={18} />} color="#F59E0B" items={[
                                { label: 'Trust Impact', value: ux.trust_impact_indicator || 'N/A', status: ux.trust_impact_indicator === 'low' ? 'good' : 'warn' },
                                { label: 'Recommendation', value: ux.recommendation_flag?.replace(/_/g, ' ') || 'N/A', status: 'neutral' },
                            ]} />
                        </div>
                    </>
                )}

                {/* ── Content: Readability, Depth, Quality, Structure ── */}
                {content && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">Content</span>
                            <h2 className="dash-section-title">Content <span className="accent">Quality</span></h2>
                            <p className="dash-section-subtitle">Readability, depth, keyword diversity, and content structure</p>
                        </div>
                        <div className="detail-cards-grid">
                            <DetailCard title="Readability" icon={<FileText size={18} />} color="#EC4899" items={[
                                { label: 'Flesch Reading Ease', value: content.flesch_reading_ease != null ? content.flesch_reading_ease.toFixed(1) : 'N/A', status: (content.flesch_reading_ease ?? 0) >= 60 ? 'good' : (content.flesch_reading_ease ?? 0) >= 40 ? 'warn' : 'bad' },
                                { label: 'Grade Level', value: content.flesch_kincaid_grade != null ? content.flesch_kincaid_grade.toFixed(1) : 'N/A', status: 'neutral' },
                            ]} />
                            <DetailCard title="Depth" icon={<Layout size={18} />} color="#EC4899" items={[
                                { label: 'Word Count', value: `${content.word_count ?? 'N/A'}`, status: (content.word_count ?? 0) >= 300 ? 'good' : 'bad' },
                                { label: 'Content Depth', value: content.content_depth_status?.replace(/_/g, ' ') || 'N/A', status: content.content_depth_status === 'comprehensive' ? 'good' : content.content_depth_status === 'adequate' ? 'warn' : 'bad' },
                            ]} />
                            <DetailCard title="Keywords & Quality" icon={<Tag size={18} />} color="#EC4899" items={[
                                { label: 'Keywords Found', value: `${content.keywords?.length ?? 0}`, status: (content.keywords?.length ?? 0) >= 5 ? 'good' : 'warn' },
                                { label: 'Top Keywords', value: content.keywords?.slice(0, 5).map((k: any) => typeof k === 'string' ? k : k.word || k.term || k).join(', ') || 'None', status: 'neutral' },
                            ]} />
                            <DetailCard title="Structure" icon={<Type size={18} />} color="#EC4899" items={[
                                { label: 'Intent Match', value: content.intent_match_level?.replace(/_/g, ' ') || 'N/A', status: content.intent_match_level === 'high' ? 'good' : content.intent_match_level === 'medium' ? 'warn' : 'bad' },
                                { label: 'Content Gaps', value: content.primary_content_gaps?.length ? content.primary_content_gaps.join(', ') : 'None', status: (content.primary_content_gaps?.length ?? 0) === 0 ? 'good' : 'warn' },
                            ]} />
                        </div>
                    </>
                )}

                {/* ── Issues & Fixes ── */}
                {allIssues.length > 0 && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">Issues Found</span>
                            <h2 className="dash-section-title">Detected <span className="accent">Issues</span></h2>
                            <p className="dash-section-subtitle">{allIssues.length} issues detected across all modules</p>
                        </div>
                        <div className="issues-table-wrapper">
                            <table className="grade-table">
                                <thead>
                                    <tr>
                                        <th>Severity</th>
                                        <th>Module</th>
                                        <th className="th-desc">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allIssues.slice(0, 15).map((issue: any, idx: number) => (
                                        <tr key={idx}>
                                            <td><SeverityBadge severity={issue.severity} /></td>
                                            <td style={{ color: MODULE_COLORS[issue.module] || '#aee92b', fontWeight: 600, fontSize: '0.82rem' }}>{issue.module}</td>
                                            <td className="grade-desc">{issue.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Priority Fixes ── */}
                {allFixes.length > 0 && (
                    <>
                        <div className="dash-section-header">
                            <span className="dash-section-label">Action Plan</span>
                            <h2 className="dash-section-title">Priority <span className="accent">Fixes</span></h2>
                            <p className="dash-section-subtitle">Top recommended fixes sorted by impact</p>
                        </div>
                        <div className="issues-table-wrapper">
                            <table className="grade-table">
                                <thead>
                                    <tr>
                                        <th>Priority</th>
                                        <th>Module</th>
                                        <th>Fix</th>
                                        <th className="th-desc">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allFixes.slice(0, 10).map((fix: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>
                                                <span className="grade-badge" style={{
                                                    backgroundColor: fix.priority === 1 ? 'rgba(239,68,68,0.12)' : fix.priority === 2 ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)',
                                                    color: fix.priority === 1 ? '#EF4444' : fix.priority === 2 ? '#F97316' : '#F59E0B',
                                                    borderColor: fix.priority === 1 ? '#EF444440' : fix.priority === 2 ? '#F9731640' : '#F59E0B40',
                                                }}>
                                                    P{fix.priority}
                                                </span>
                                            </td>
                                            <td style={{ color: MODULE_COLORS[fix.module] || '#aee92b', fontWeight: 600, fontSize: '0.82rem' }}>{fix.module}</td>
                                            <td style={{ color: '#e0e0ea', fontWeight: 600, fontSize: '0.84rem' }}>{fix.title}</td>
                                            <td className="grade-desc">{fix.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Grade Scale Table ── */}
                <div className="dash-section-header">
                    <span className="dash-section-label">Reference</span>
                    <h2 className="dash-section-title">Grading <span className="accent">Scale</span></h2>
                    <p className="dash-section-subtitle">How we evaluate your website's overall health</p>
                </div>
                <div className="grade-table-wrapper">
                    <table className="grade-table">
                        <thead>
                            <tr>
                                <th>Grade</th>
                                <th>Score Range</th>
                                <th className="th-desc">Meaning / Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {GRADE_TABLE.map((row) => {
                                const isCurrent = row.grade === overallGrade;
                                return (
                                    <tr key={row.grade} className={isCurrent ? 'grade-row--active' : ''}>
                                        <td>
                                            <span className="grade-badge grade-badge--lg" style={{ backgroundColor: `${row.color}18`, color: row.color, borderColor: `${row.color}40` }}>
                                                {row.grade}
                                            </span>
                                        </td>
                                        <td className="grade-range">{row.range}</td>
                                        <td className="grade-desc">
                                            {row.desc}
                                            {isCurrent && (
                                                <span className="current-indicator">
                                                    <ChevronRight size={12} />
                                                    Your score
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Report Metadata ── */}
                <div className="report-meta-bar">
                    <span>Report ID: <code>{report._id}</code></span>
                    <span>Status: <strong>{report.status}</strong></span>
                    <span>Created: {new Date(report.created_at).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Metric Card Component ───
function MetricCard({ icon, label, sublabel, value, color }: { icon: React.ReactNode; label: string; sublabel: string; value: string; color: string }) {
    return (
        <div className="metric-card">
            <div className="metric-card-icon" style={{ color }}>{icon}</div>
            <div className="metric-card-body">
                <span className="metric-card-label">{label}</span>
                <span className="metric-card-sublabel">{sublabel}</span>
            </div>
            <span className="metric-card-value" style={{ color }}>{value}</span>
        </div>
    );
}

// ─── Detail Card Component ───
function DetailCard({ title, icon, color, items }: { title: string; icon: React.ReactNode; color: string; items: { label: string; value: string; status: string }[] }) {
    return (
        <div className="detail-card">
            <div className="detail-card-header" style={{ color }}>
                {icon} <span>{title}</span>
            </div>
            <div className="detail-card-items">
                {items.map((item, idx) => (
                    <div key={idx} className="detail-card-item">
                        <span className="detail-item-label">{item.label}</span>
                        <span className="detail-item-value">
                            {item.status === 'good' && <CheckCircle size={13} style={{ color: '#10B981' }} />}
                            {item.status === 'bad' && <XCircle size={13} style={{ color: '#EF4444' }} />}
                            {item.status === 'warn' && <AlertTriangle size={13} style={{ color: '#F59E0B' }} />}
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AnalyzerDashboard;
