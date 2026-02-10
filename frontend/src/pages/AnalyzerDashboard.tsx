import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Globe, Zap, Search, Smartphone, FileText,
    TrendingUp, Shield, ChevronRight, Clock, Activity,
    Server, Tag, Layout, Image, Eye, Type, Gauge,
    AlertTriangle, CheckCircle, XCircle, Info, ArrowDown,
    Brain, Target, Compass
} from 'lucide-react';
import { getReport, type Report } from '../services/api';
import Chatbot from '../components/Chatbot';
import Loader from '../components/Loader';
import logo from '../assets/logo.png';
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
    const [activeModule, setActiveModule] = useState<string>('Performance');
    const viewBtnRef = useRef<HTMLDivElement>(null);

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

    // Auto-scroll to View Report button after 10 seconds
    useEffect(() => {
        if (!report) return;
        const timer = setTimeout(() => {
            viewBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 10000);
        return () => clearTimeout(timer);
    }, [report]);

    if (loading) {
        return <Loader />;
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

    // Key metrics preview per module (shown as chips inside each card)
    const modulePreviewData: Record<string, { label: string; value: string }[]> = {
        Performance: [
            { label: 'LCP', value: perf?.metrics?.lcp_s != null ? `${Number(perf.metrics.lcp_s).toFixed(2)}s` : '—' },
            { label: 'CLS', value: perf?.metrics?.cls != null ? Number(perf.metrics.cls).toFixed(3) : '—' },
            { label: 'JS', value: perf?.metrics?.total_js_kb != null ? `${Math.round(perf.metrics.total_js_kb)} KB` : '—' },
        ],
        SEO: [
            { label: 'Title', value: seo?.title_length != null ? `${seo.title_length} ch` : '—' },
            { label: 'H1s', value: seo?.h1_count != null ? `${seo.h1_count}` : '—' },
            { label: 'No-alt', value: seo?.images_missing_alt_count != null ? `${seo.images_missing_alt_count}` : '—' },
        ],
        UX: [
            { label: 'Violations', value: ux?.violations_count != null ? `${ux.violations_count}` : '—' },
            { label: 'CTAs', value: ux?.ctas_count != null ? `${ux.ctas_count}` : '—' },
            { label: 'Viewport', value: ux?.viewport_meta_present != null ? (ux.viewport_meta_present ? '✓' : '✗') : '—' },
        ],
        Content: [
            { label: 'Words', value: content?.word_count != null ? `${content.word_count}` : '—' },
            { label: 'Flesch', value: content?.flesch_reading_ease != null ? `${Number(content.flesch_reading_ease).toFixed(0)}` : '—' },
            { label: 'Keywords', value: content?.keywords?.length != null ? `${content.keywords.length}` : '—' },
        ],
    };

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
            {/* ═══════ NAVBAR ═══════ */}
            <nav className="analyzer-navbar">
                <div className="analyzer-navbar-container">
                    {/* Logo */}
                    <Link to="/" className="analyzer-nav-logo">
                        <img src={logo} alt="Web Analyzer" className="analyzer-nav-logo-img" />
                    </Link>

                    {/* Center - URL Info */}
                    <div className="analyzer-nav-center">
                        <div className="analyzer-nav-url-badge">
                            <Globe size={14} />
                            <span>{report.final_url || report.url}</span>
                        </div>
                    </div>

                    {/* Right - Actions */}
                    <div className="analyzer-nav-actions">
                        <button className="analyzer-nav-btn analyzer-nav-btn-outline" onClick={() => navigate('/')}>
                            <ArrowLeft size={16} />
                            <span>New Scan</span>
                        </button>
                        <button className="analyzer-nav-btn analyzer-nav-btn-primary" onClick={() => window.print()}>
                            <Shield size={16} />
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>
            </nav>



            <div className="container dashboard-container">


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
                            <span className="grade-hero-score" style={{ color: '#aee92b' }}>{overallScore}</span>
                            <span className="grade-hero-max">/ 100</span>
                            <span className="grade-hero-tag" style={{ backgroundColor: `${overallMeta?.color}18`, color: overallMeta?.color, borderColor: `${overallMeta?.color}40` }}>
                                <TrendingUp size={12} />
                                {overallGrade === 'A+' || overallGrade === 'A' ? 'Excellent' : overallGrade === 'B' ? 'Good' : overallGrade === 'C' ? 'Average' : 'Needs Work'}
                            </span>
                        </div>
                        <p className="grade-hero-desc">{overallMeta?.desc}</p>
                    </div>
                </div>

                {/* ── AI Strategic Analysis ── */}
                {report.ai_insights && (
                    <div className="ai-insights-section">
                        <div className="dash-section-header">
                            <h2 className="dash-section-title">Strategic <span className="accent">Analysis</span></h2>
                            <p className="dash-section-subtitle">AI-generated roadmap for maximum impact and ROI</p>
                        </div>

                        {/* Executive Summary — full width */}
                        <div className="ai-card ai-card--summary">
                            <div className="ai-card-header">
                                <div className="ai-card-icon"><Brain size={18} /></div>
                                <h3>Executive Summary</h3>
                            </div>
                            <p className="ai-text">{report.ai_insights.executiveSummary}</p>
                        </div>

                        {/* Top Priorities */}
                        {report.ai_insights.topPriorities?.length > 0 && (
                            <div className="ai-card ai-card--priorities">
                                <div className="ai-card-header">
                                    <div className="ai-card-icon"><Target size={18} /></div>
                                    <h3>Top Priorities</h3>
                                    <span className="ai-card-count">{report.ai_insights.topPriorities.length}</span>
                                </div>
                                <div className="ai-priority-list">
                                    {report.ai_insights.topPriorities.map((p, i) => (
                                        <div key={i} className="ai-priority-item">
                                            <span className="ai-priority-num">{String(i + 1).padStart(2, '0')}</span>
                                            <div className="ai-priority-body">
                                                <div className="ai-priority-top">
                                                    <span className="ai-priority-title">{p.title}</span>
                                                    <div className="ai-badges">
                                                        <span className={`ai-badge ai-badge--${p.impact.toLowerCase()}`}>{p.impact}</span>
                                                        <span className="ai-badge ai-badge--roi">{p.estimatedROI}</span>
                                                    </div>
                                                </div>
                                                <p className="ai-priority-desc">{p.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Wins & Long Term — side by side */}
                        <div className="ai-dual">
                            {report.ai_insights.quickWins?.length > 0 && (
                                <div className="ai-card ai-card--half">
                                    <div className="ai-card-header">
                                        <div className="ai-card-icon ai-card-icon--green"><Zap size={18} /></div>
                                        <h3>Quick Wins</h3>
                                    </div>
                                    <ul className="ai-list">
                                        {report.ai_insights.quickWins.map((w, i) => (
                                            <li key={i}><span className="ai-list-dot" />{w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {report.ai_insights.longTermGoals?.length > 0 && (
                                <div className="ai-card ai-card--half">
                                    <div className="ai-card-header">
                                        <div className="ai-card-icon ai-card-icon--blue"><Compass size={18} /></div>
                                        <h3>Long-Term Goals</h3>
                                    </div>
                                    <ul className="ai-list">
                                        {report.ai_insights.longTermGoals.map((g, i) => (
                                            <li key={i}><span className="ai-list-dot ai-list-dot--blue" />{g}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                        const isActive = activeModule === module.name;
                        return (
                            <div
                                key={module.name}
                                className={`grade-module-card ${isActive ? 'module-active' : ''}`}
                                style={{
                                    '--mod-color': modColor,
                                    ...(isActive ? { borderColor: modColor, boxShadow: `0 0 24px ${modColor}18` } : {}),
                                    animationDelay: `${0.15 + moduleScores.indexOf(module) * 0.08}s`,
                                } as React.CSSProperties}
                                onClick={() => setActiveModule(module.name)}
                            >
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
                                {/* Key scraped data chips */}
                                <div className="module-data-chips">
                                    {(modulePreviewData[module.name] || []).map((chip, i) => (
                                        <span key={i} className="module-chip" style={{ borderColor: `${modColor}30`, color: modColor }}>
                                            <span className="module-chip-label">{chip.label}</span>
                                            <span className="module-chip-value">{chip.value}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Module Detail Panel (tabbed) ── */}
                <div className="module-detail-panel">
                    {activeModule === 'Performance' && perf && (
                        <>
                            <div className="dash-section-header">
                                <span className="dash-section-label" style={{ color: '#00C49F', borderColor: '#00C49F40', backgroundColor: '#00C49F12' }}>Performance</span>
                                <h2 className="dash-section-title">Core Web <span className="accent">Vitals</span></h2>
                                <p className="dash-section-subtitle">LCP, FID/TBT, CLS, TTFB — real metrics from your page</p>
                                {/* Lighthouse & score source badges */}
                                <div className="perf-badges">
                                    {perf.source === 'hybrid' && (
                                        <span className="perf-badge perf-badge-lighthouse">
                                            <CheckCircle size={12} /> Verified by Lighthouse
                                        </span>
                                    )}
                                    {perf.source === 'slm' && (
                                        <span className="perf-badge perf-badge-slm">
                                            <Gauge size={12} /> SLM Estimator
                                        </span>
                                    )}
                                    {perf.lighthouse_score != null && (
                                        <span className="perf-badge perf-badge-score">
                                            LH: {perf.lighthouse_score} · SLM: {perf.slm_score}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="metrics-grid">
                                <MetricCard icon={<Clock size={20} />} label="LCP" sublabel="Largest Contentful Paint" value={formatMetric(perf.metrics?.lcp_s, 's')} color={getStatusColor(perf.metrics?.lcp_s ?? 0, 2.5, 4.0)} />
                                <MetricCard icon={<Activity size={20} />} label="TBT" sublabel="Total Blocking Time (≈ FID)" value={formatMetric(perf.metrics?.tbt_ms, 'ms', 0)} color={getStatusColor(perf.metrics?.tbt_ms ?? 0, 200, 600)} />
                                <MetricCard icon={<Gauge size={20} />} label="CLS" sublabel="Cumulative Layout Shift" value={formatMetric(perf.metrics?.cls, '', 3)} color={getStatusColor(perf.metrics?.cls ?? 0, 0.1, 0.25)} />
                                <MetricCard icon={<Server size={20} />} label="TTFB" sublabel="Time to First Byte" value={formatMetric(perf.metrics?.ttfb_s, 's')} color={getStatusColor(perf.metrics?.ttfb_s ?? 0, 0.8, 1.8)} />
                                <MetricCard icon={<Zap size={20} />} label="FCP" sublabel="First Contentful Paint" value={formatMetric(perf.metrics?.fcp_s, 's')} color={getStatusColor(perf.metrics?.fcp_s ?? 0, 1.8, 3.0)} />
                                <MetricCard icon={<Tag size={20} />} label="JS Size" sublabel="Total JavaScript" value={formatMetric(perf.metrics?.total_js_kb, ' KB', 0)} color={getStatusColor(perf.metrics?.total_js_kb ?? 0, 200, 500)} />
                                <MetricCard icon={<Layout size={20} />} label="CSS Size" sublabel="Total CSS" value={formatMetric(perf.metrics?.total_css_kb, ' KB', 0)} color={getStatusColor(perf.metrics?.total_css_kb ?? 0, 50, 150)} />
                                <MetricCard icon={<Image size={20} />} label="Images" sublabel="Total Image Size" value={formatMetric(perf.metrics?.total_images_kb, ' KB', 0)} color={getStatusColor(perf.metrics?.total_images_kb ?? 0, 500, 2000)} />
                            </div>
                        </>
                    )}

                    {activeModule === 'SEO' && seo && (
                        <>
                            <div className="dash-section-header">
                                <span className="dash-section-label" style={{ color: '#6366F1', borderColor: '#6366F140', backgroundColor: '#6366F112' }}>SEO</span>
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

                    {activeModule === 'UX' && ux && (
                        <>
                            <div className="dash-section-header">
                                <span className="dash-section-label" style={{ color: '#F59E0B', borderColor: '#F59E0B40', backgroundColor: '#F59E0B12' }}>UX & Accessibility</span>
                                <h2 className="dash-section-title">User <span className="accent">Experience</span></h2>
                                <p className="dash-section-subtitle">Mobile viewport, touch targets, accessibility, and layout analysis</p>
                                {/* Mobile scan badge */}
                                {ux.scan_mode === 'mobile' && (
                                    <div className="perf-badges">
                                        <span className="perf-badge perf-badge-mobile">
                                            <Smartphone size={12} /> Mobile Axe Scan
                                        </span>
                                        {ux.touch_targets_too_small != null && (
                                            <span className="perf-badge perf-badge-score">
                                                Touch issues: {ux.touch_targets_too_small}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="detail-cards-grid">
                                <DetailCard title="Mobile / Viewport" icon={<Smartphone size={18} />} color="#F59E0B" items={[
                                    { label: 'Scan Mode', value: ux.scan_mode === 'mobile' ? 'Mobile' : 'Desktop', status: 'neutral' },
                                    { label: 'Viewport Meta', value: ux.viewport_meta_present !== undefined ? (ux.viewport_meta_present ? 'Present' : 'Missing') : 'N/A', status: ux.viewport_meta_present ? 'good' : 'bad' },
                                    { label: 'CTAs Above Fold', value: `${ux.ctas_above_fold ?? 'N/A'}`, status: (ux.ctas_above_fold ?? 0) >= 1 ? 'good' : 'warn' },
                                    ...(ux.touch_targets_too_small != null ? [{ label: 'Touch Targets < 48px', value: `${ux.touch_targets_too_small}`, status: ux.touch_targets_too_small === 0 ? 'good' as const : 'bad' as const }] : []),
                                    ...(ux.text_too_small_count != null ? [{ label: 'Text Too Small', value: `${ux.text_too_small_count}`, status: ux.text_too_small_count === 0 ? 'good' as const : 'warn' as const }] : []),
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

                    {activeModule === 'Content' && content && (
                        <>
                            <div className="dash-section-header">
                                <span className="dash-section-label" style={{ color: '#EC4899', borderColor: '#EC489940', backgroundColor: '#EC489912' }}>Content</span>
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

                            {/* ── NLP Analysis Section ── */}
                            {content.nlp_analysis && (
                                <>
                                    <div className="dash-section-header" style={{ marginTop: '2rem' }}>
                                        <span className="dash-section-label" style={{ color: '#a78bfa', borderColor: '#a78bfa40', backgroundColor: '#a78bfa12' }}>
                                            <Brain size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />NLP
                                        </span>
                                        <h2 className="dash-section-title">NLP <span className="accent" style={{ color: '#a78bfa' }}>Analysis</span></h2>
                                        <p className="dash-section-subtitle">Sentiment, entities, topics, and advanced readability powered by AI models</p>
                                    </div>

                                    {/* Sentiment + Summary Row */}
                                    <div className="nlp-top-row">
                                        {/* Sentiment Indicator */}
                                        {content.nlp_analysis.sentiment && (
                                            <div className="nlp-sentiment-card">
                                                <div className="nlp-card-title"><Activity size={15} /> Sentiment</div>
                                                <div className="nlp-sentiment-body">
                                                    <span className={`nlp-sentiment-badge nlp-sentiment--${content.nlp_analysis.sentiment.label?.toLowerCase()}`}>
                                                        {content.nlp_analysis.sentiment.label === 'POSITIVE' ? '😊' : content.nlp_analysis.sentiment.label === 'NEGATIVE' ? '😟' : '😐'}
                                                        {' '}{content.nlp_analysis.sentiment.label}
                                                    </span>
                                                    <div className="nlp-sentiment-bar-track">
                                                        <div className="nlp-sentiment-bar-fill" style={{
                                                            width: `${content.nlp_analysis.sentiment.confidence ?? 50}%`,
                                                            background: content.nlp_analysis.sentiment.label === 'POSITIVE' ? '#10B981' : content.nlp_analysis.sentiment.label === 'NEGATIVE' ? '#EF4444' : '#F59E0B',
                                                        }} />
                                                    </div>
                                                    <span className="nlp-sentiment-conf">{content.nlp_analysis.sentiment.confidence ?? '—'}% confidence</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {content.nlp_analysis.summary && (
                                            <div className="nlp-summary-card">
                                                <div className="nlp-card-title"><Compass size={15} /> AI Summary</div>
                                                <p className="nlp-summary-text">{content.nlp_analysis.summary}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Topics */}
                                    {content.nlp_analysis.topics?.length > 0 && (
                                        <div className="nlp-block">
                                            <div className="nlp-card-title"><Target size={15} /> Detected Topics</div>
                                            <div className="nlp-chips">
                                                {content.nlp_analysis.topics.map((t: any, i: number) => (
                                                    <span key={i} className="nlp-topic-chip" style={{ '--topic-opacity': Math.max(0.35, t.score || 0.5) } as React.CSSProperties}>
                                                        {t.label} <span className="nlp-chip-score">{Math.round((t.score || 0) * 100)}%</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Entities */}
                                    {content.nlp_analysis.entities?.length > 0 && (
                                        <div className="nlp-block">
                                            <div className="nlp-card-title"><Tag size={15} /> Named Entities</div>
                                            <div className="nlp-chips">
                                                {content.nlp_analysis.entities.map((e: any, i: number) => (
                                                    <span key={i} className={`nlp-entity-chip nlp-entity--${(e.type || 'misc').toLowerCase()}`}>
                                                        {e.text}
                                                        <span className="nlp-entity-type">{e.type}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Keywords + Phrases table */}
                                    {(content.nlp_analysis.keywords?.length > 0 || content.nlp_analysis.phrases?.length > 0) && (
                                        <div className="nlp-block">
                                            <div className="nlp-card-title"><Search size={15} /> Keywords & Phrases</div>
                                            <div className="nlp-kw-grid">
                                                {content.nlp_analysis.keywords?.length > 0 && (
                                                    <div className="nlp-kw-section">
                                                        <span className="nlp-kw-heading">Top Keywords</span>
                                                        <div className="nlp-kw-list">
                                                            {content.nlp_analysis.keywords.slice(0, 10).map((k: any, i: number) => (
                                                                <div key={i} className="nlp-kw-row">
                                                                    <span className="nlp-kw-word">{k.word || k}</span>
                                                                    <div className="nlp-kw-bar-track">
                                                                        <div className="nlp-kw-bar-fill" style={{ width: `${Math.min(100, (k.relevance || k.score || 0.5) * 100)}%` }} />
                                                                    </div>
                                                                    <span className="nlp-kw-score">{((k.relevance || k.score || 0) * 100).toFixed(0)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {content.nlp_analysis.phrases?.length > 0 && (
                                                    <div className="nlp-kw-section">
                                                        <span className="nlp-kw-heading">Key Phrases</span>
                                                        <div className="nlp-chips" style={{ marginTop: '0.5rem' }}>
                                                            {content.nlp_analysis.phrases.slice(0, 8).map((p: any, i: number) => (
                                                                <span key={i} className="nlp-phrase-chip">{p.phrase || p}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Advanced Readability */}
                                    {content.nlp_analysis.advanced_readability && (
                                        <div className="nlp-block">
                                            <div className="nlp-card-title"><Gauge size={15} /> Advanced Readability</div>
                                            <div className="nlp-read-grid">
                                                {[
                                                    { label: 'Avg Sentence Length', value: `${content.nlp_analysis.advanced_readability.avg_sentence_length ?? '—'} words`, good: (content.nlp_analysis.advanced_readability.avg_sentence_length ?? 20) <= 20 },
                                                    { label: 'Complex Word Ratio', value: `${((content.nlp_analysis.advanced_readability.complex_word_ratio ?? 0) * 100).toFixed(1)}%`, good: (content.nlp_analysis.advanced_readability.complex_word_ratio ?? 0) < 0.15 },
                                                    { label: 'Passive Voice', value: `${((content.nlp_analysis.advanced_readability.passive_voice_ratio ?? 0) * 100).toFixed(1)}%`, good: (content.nlp_analysis.advanced_readability.passive_voice_ratio ?? 0) < 0.2 },
                                                    { label: 'Jargon Density', value: `${((content.nlp_analysis.advanced_readability.jargon_density ?? 0) * 100).toFixed(1)}%`, good: (content.nlp_analysis.advanced_readability.jargon_density ?? 0) < 0.1 },
                                                    { label: 'Questions', value: `${content.nlp_analysis.advanced_readability.question_count ?? 0}`, good: true },
                                                    { label: 'Paragraphs', value: `${content.nlp_analysis.advanced_readability.paragraph_count ?? 0}`, good: (content.nlp_analysis.advanced_readability.paragraph_count ?? 0) >= 3 },
                                                ].map((m, i) => (
                                                    <div key={i} className="nlp-read-item">
                                                        <span className="nlp-read-label">{m.label}</span>
                                                        <span className={`nlp-read-value ${m.good ? 'nlp-read--good' : 'nlp-read--warn'}`}>{m.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── AI Content Insights ── */}
                            {content.ai_content_insights && (
                                <>
                                    <div className="dash-section-header" style={{ marginTop: '2rem' }}>
                                        <span className="dash-section-label" style={{ color: '#f472b6', borderColor: '#f472b640', backgroundColor: '#f472b612' }}>
                                            <Brain size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />AI Insights
                                        </span>
                                        <h2 className="dash-section-title">AI Content <span className="accent" style={{ color: '#f472b6' }}>Insights</span></h2>
                                        <p className="dash-section-subtitle">Quality assessment, engagement analysis, and SEO optimization from Groq AI</p>
                                    </div>

                                    {/* Quality + Engagement Scores */}
                                    <div className="nlp-top-row">
                                        <div className="nlp-sentiment-card">
                                            <div className="nlp-card-title"><TrendingUp size={15} /> Quality & Engagement</div>
                                            <div className="aci-scores-row">
                                                {content.ai_content_insights.quality_score != null && (
                                                    <div className="aci-score-circle">
                                                        <svg viewBox="0 0 60 60" className="aci-ring-svg">
                                                            <circle cx="30" cy="30" r="26" fill="none" stroke="#1e1e2a" strokeWidth="5" />
                                                            <circle cx="30" cy="30" r="26" fill="none" stroke="#EC4899" strokeWidth="5" strokeDasharray={`${(content.ai_content_insights.quality_score / 100) * 163.4} 163.4`} strokeLinecap="round" transform="rotate(-90 30 30)" />
                                                        </svg>
                                                        <span className="aci-score-num">{content.ai_content_insights.quality_score}</span>
                                                        <span className="aci-score-lbl">Quality</span>
                                                    </div>
                                                )}
                                                {content.ai_content_insights.engagement_score != null && (
                                                    <div className="aci-score-circle">
                                                        <svg viewBox="0 0 60 60" className="aci-ring-svg">
                                                            <circle cx="30" cy="30" r="26" fill="none" stroke="#1e1e2a" strokeWidth="5" />
                                                            <circle cx="30" cy="30" r="26" fill="none" stroke="#a78bfa" strokeWidth="5" strokeDasharray={`${(content.ai_content_insights.engagement_score / 100) * 163.4} 163.4`} strokeLinecap="round" transform="rotate(-90 30 30)" />
                                                        </svg>
                                                        <span className="aci-score-num">{content.ai_content_insights.engagement_score}</span>
                                                        <span className="aci-score-lbl">Engagement</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Tone + Audience badges */}
                                            <div className="aci-meta-row">
                                                {content.ai_content_insights.tone && (
                                                    <span className="aci-meta-badge" style={{ borderColor: '#EC489940', color: '#EC4899', background: '#EC489912' }}>
                                                        {content.ai_content_insights.tone}
                                                    </span>
                                                )}
                                                {content.ai_content_insights.target_audience && (
                                                    <span className="aci-meta-badge" style={{ borderColor: '#a78bfa40', color: '#a78bfa', background: '#a78bfa12' }}>
                                                        {content.ai_content_insights.target_audience}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Engagement Factors */}
                                        {content.ai_content_insights.engagement_factors && (
                                            <div className="nlp-summary-card">
                                                <div className="nlp-card-title"><Activity size={15} /> Engagement Factors</div>
                                                <div className="aci-factors">
                                                    {Object.entries(content.ai_content_insights.engagement_factors).map(([key, val]: [string, any]) => (
                                                        <div key={key} className="aci-factor-row">
                                                            <span className="aci-factor-label">{key.replace(/_/g, ' ')}</span>
                                                            <div className="nlp-kw-bar-track">
                                                                <div className="nlp-kw-bar-fill" style={{ width: `${val}%`, background: val >= 70 ? '#10B981' : val >= 40 ? '#F59E0B' : '#EF4444' }} />
                                                            </div>
                                                            <span className="aci-factor-val">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Strengths & Weaknesses */}
                                    {(content.ai_content_insights.strengths?.length > 0 || content.ai_content_insights.weaknesses?.length > 0) && (
                                        <div className="nlp-top-row" style={{ marginTop: '0.75rem' }}>
                                            {content.ai_content_insights.strengths?.length > 0 && (
                                                <div className="nlp-block" style={{ flex: 1 }}>
                                                    <div className="nlp-card-title"><CheckCircle size={15} style={{ color: '#10B981' }} /> Strengths</div>
                                                    <ul className="aci-list aci-list--good">
                                                        {content.ai_content_insights.strengths.map((s: string, i: number) => (
                                                            <li key={i}>{s}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {content.ai_content_insights.weaknesses?.length > 0 && (
                                                <div className="nlp-block" style={{ flex: 1 }}>
                                                    <div className="nlp-card-title"><XCircle size={15} style={{ color: '#EF4444' }} /> Weaknesses</div>
                                                    <ul className="aci-list aci-list--bad">
                                                        {content.ai_content_insights.weaknesses.map((w: string, i: number) => (
                                                            <li key={i}>{w}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* SEO Recommendations */}
                                    {content.ai_content_insights.seo_recommendations && (
                                        <div className="nlp-block" style={{ marginTop: '0.75rem' }}>
                                            <div className="nlp-card-title"><Search size={15} /> SEO Recommendations</div>
                                            <div className="aci-seo-grid">
                                                {content.ai_content_insights.seo_recommendations.keyword_density_issues && (
                                                    <span className={`aci-meta-badge ${content.ai_content_insights.seo_recommendations.keyword_density_issues === 'optimal' ? 'aci-meta--good' : 'aci-meta--warn'}`}>
                                                        Keyword Density: {content.ai_content_insights.seo_recommendations.keyword_density_issues}
                                                    </span>
                                                )}
                                                {content.ai_content_insights.seo_recommendations.missing_keywords?.length > 0 && (
                                                    <div className="aci-seo-item">
                                                        <span className="aci-seo-label">Missing Keywords:</span>
                                                        <div className="nlp-chips" style={{ marginTop: '0.25rem' }}>
                                                            {content.ai_content_insights.seo_recommendations.missing_keywords.map((k: string, i: number) => (
                                                                <span key={i} className="nlp-phrase-chip">{k}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {content.ai_content_insights.seo_recommendations.content_gaps?.length > 0 && (
                                                    <div className="aci-seo-item">
                                                        <span className="aci-seo-label">Content Gaps:</span>
                                                        <ul className="aci-list aci-list--bad">
                                                            {content.ai_content_insights.seo_recommendations.content_gaps.map((g: string, i: number) => (
                                                                <li key={i}>{g}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Improvement Suggestions */}
                                    {content.ai_content_insights.improvement_suggestions?.length > 0 && (
                                        <div className="nlp-block" style={{ marginTop: '0.75rem' }}>
                                            <div className="nlp-card-title"><Compass size={15} /> Improvement Suggestions</div>
                                            <table className="grade-table">
                                                <thead><tr><th>Priority</th><th>Area</th><th className="th-desc">Suggestion</th></tr></thead>
                                                <tbody>
                                                    {content.ai_content_insights.improvement_suggestions.map((s: any, i: number) => (
                                                        <tr key={i}>
                                                            <td>
                                                                <span className="grade-badge" style={{
                                                                    backgroundColor: s.priority === 'high' ? 'rgba(239,68,68,0.12)' : s.priority === 'medium' ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)',
                                                                    color: s.priority === 'high' ? '#EF4444' : s.priority === 'medium' ? '#F97316' : '#F59E0B',
                                                                    borderColor: s.priority === 'high' ? '#EF444440' : s.priority === 'medium' ? '#F9731640' : '#F59E0B40',
                                                                }}>{s.priority}</span>
                                                            </td>
                                                            <td style={{ color: '#e0e0ea', fontWeight: 600, fontSize: '0.84rem', textTransform: 'capitalize' }}>{s.area?.replace(/_/g, ' ')}</td>
                                                            <td className="grade-desc">{s.suggestion}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Module-specific issues & fixes */}
                    {(() => {
                        const modIssues = allIssues.filter((i: any) => i.module === activeModule);
                        const modFixes = allFixes.filter((f: any) => f.module === activeModule);
                        const modColor = MODULE_COLORS[activeModule] || '#aee92b';
                        return (
                            <>
                                {modIssues.length > 0 && (
                                    <div className="issues-section">
                                        <div className="issues-section-header">
                                            <div className="issues-section-icon" style={{ backgroundColor: `${modColor}12`, color: modColor }}>
                                                <AlertTriangle size={16} />
                                            </div>
                                            <h3 className="issues-section-title">{activeModule} Issues</h3>
                                            <span className="issue-count">{modIssues.length}</span>
                                        </div>
                                        <div className="issues-table-wrapper">
                                            <table className="grade-table issues-table">
                                                <thead><tr><th>Severity</th><th>Description</th></tr></thead>
                                                <tbody>
                                                    {modIssues.map((issue: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td><SeverityBadge severity={issue.severity} /></td>
                                                            <td className="grade-desc">
                                                                {issue.ai && <span className="ai-tag">AI</span>}
                                                                {issue.description}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                {modFixes.length > 0 && (
                                    <div className="issues-section">
                                        <div className="issues-section-header">
                                            <div className="issues-section-icon" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                                                <CheckCircle size={16} />
                                            </div>
                                            <h3 className="issues-section-title">Recommended Fixes</h3>
                                            <span className="fix-count">{modFixes.length}</span>
                                        </div>
                                        <div className="issues-table-wrapper">
                                            <table className="grade-table fixes-table">
                                                <thead><tr><th>Priority</th><th>Fix</th><th>Details</th></tr></thead>
                                                <tbody>
                                                    {modFixes.map((fix: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <span className="grade-badge" style={{
                                                                    backgroundColor: fix.priority === 1 ? 'rgba(239,68,68,0.12)' : fix.priority === 2 ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)',
                                                                    color: fix.priority === 1 ? '#EF4444' : fix.priority === 2 ? '#F97316' : '#F59E0B',
                                                                    borderColor: fix.priority === 1 ? '#EF444440' : fix.priority === 2 ? '#F9731640' : '#F59E0B40',
                                                                }}>P{fix.priority}</span>
                                                            </td>
                                                            <td className="fix-title-cell">
                                                                {fix.ai && <span className="ai-tag">AI</span>}
                                                                {fix.title}
                                                            </td>
                                                            <td className="grade-desc">{fix.description}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

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



                {/* ── View Report Button ── */}
                <div className="view-report-cta" ref={viewBtnRef}>
                    <div className="view-report-glow" />
                    <p className="view-report-label">Want a printable summary of this audit?</p>
                    <button className="view-report-btn" onClick={() => navigate(`/report/${reportId}`)}>
                        <span>View Report</span>
                        <ArrowDown size={20} />
                    </button>
                </div>
            </div>
            {/* Chatbot - Fixed Position */}
            <Chatbot reportId={reportId} report={report} />
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
