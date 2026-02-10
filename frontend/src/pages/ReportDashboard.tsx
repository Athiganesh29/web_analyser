import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Menu, X, Home, Zap, Search, Smartphone, FileText,
    TrendingUp, Globe, AlertTriangle, CheckCircle, XCircle,
    Info, Brain, Target, ArrowLeft, Printer,
    ChevronRight, Shield, BarChart3
} from 'lucide-react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { getReport, type Report } from '../services/api';
import Loader from '../components/Loader';
import './ReportDashboard.css';

/* ─── Grade helpers ─── */
const GRADE_TABLE = [
    { grade: 'A+', range: '90–100', color: '#aee92b', desc: 'Excellent' },
    { grade: 'A', range: '80–89', color: '#aee92b', desc: 'Strong' },
    { grade: 'B', range: '70–79', color: '#4ecdc4', desc: 'Good' },
    { grade: 'C', range: '60–69', color: '#f59e0b', desc: 'Below avg' },
    { grade: 'D', range: '45–59', color: '#f59e0b', desc: 'Poor' },
    { grade: 'E', range: '30–44', color: '#ff6b6b', desc: 'Critical' },
    { grade: 'F', range: '0–29', color: '#ff6b6b', desc: 'Broken' },
];

function getGrade(score: number) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    if (score >= 30) return 'E';
    return 'F';
}
function gradeColor(score: number) {
    return GRADE_TABLE.find(r => r.grade === getGrade(score))?.color || '#aee92b';
}

const MODULE_META: Record<string, { color: string; icon: any; label: string }> = {
    performance: { color: '#ff6b6b', icon: Zap, label: 'Performance' },
    seo: { color: '#4ecdc4', icon: Search, label: 'SEO' },
    ux: { color: '#a78bfa', icon: Smartphone, label: 'UX & A11y' },
    content: { color: '#f59e0b', icon: FileText, label: 'Content' },
};

/* ─── Severity badge ─── */
function SeverityBadge({ severity }: { severity: string }) {
    const map: Record<string, { bg: string; color: string; icon: any }> = {
        critical: { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b', icon: XCircle },
        high: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: AlertTriangle },
        medium: { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', icon: AlertTriangle },
        low: { bg: 'rgba(174,233,43,0.12)', color: '#aee92b', icon: Info },
    };
    const s = map[severity] || map.low;
    const Icon = s.icon;
    return (
        <span className="rd-severity" style={{ background: s.bg, color: s.color }}>
            <Icon size={11} /> {severity}
        </span>
    );
}

/* ─── Donut chart SVG ─── */
function DonutChart({ segments, centerLabel, centerValue }: {
    segments: { value: number; color: string; label: string }[];
    centerLabel: string; centerValue: string;
}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const r = 52; const circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div className="rd-donut-wrap">
            <svg viewBox="0 0 120 120" className="rd-donut-svg">
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
                {segments.map((seg, i) => {
                    const len = (seg.value / total) * circ;
                    const dash = `${len} ${circ - len}`;
                    const o = offset;
                    offset += len;
                    return <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={seg.color}
                        strokeWidth="14" strokeDasharray={dash} strokeDashoffset={-o}
                        strokeLinecap="butt" transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />;
                })}
            </svg>
            <div className="rd-donut-center">
                <span className="rd-donut-value">{centerValue}</span>
                <span className="rd-donut-label">{centerLabel}</span>
            </div>
        </div>
    );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { duration: duration * 1000 });
    const display = useTransform(spring, (latest) => Math.round(latest));

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [isInView, value, spring]);

    return <motion.span ref={ref}>{display}</motion.span>;
}

/* ─── Module Scores Bar Chart ─── */
function ModuleScoresChart({ scores }: { scores: Record<string, number> }) {
    const data = Object.entries(scores).map(([key, value]) => ({
        name: MODULE_META[key]?.label || key,
        score: value,
        fill: MODULE_META[key]?.color || '#aee92b',
    }));

    return (
        <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    domain={[0, 100]}
                />
                <Tooltip
                    contentStyle={{
                        background: '#151a1e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} animationDuration={1500} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ─── Radial Progress Chart ─── */
function RadialProgressChart({ value, max = 100, label, color }: { value: number; max?: number; label: string; color: string }) {
    const percentage = (value / max) * 100;
    const data = [{ name: label, value: percentage, fill: color }];

    return (
        <div className="rd-radial-chart">
            <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                        dataKey="value"
                        cornerRadius={10}
                        animationDuration={1500}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="rd-radial-center">
                <span className="rd-radial-value" style={{ color }}>{value.toFixed(value < 10 ? 2 : 1)}</span>
                <span className="rd-radial-label">{label}</span>
            </div>
        </div>
    );
}

/* ─── Performance Metrics Chart ─── */
function PerformanceMetricsChart({ metrics }: { metrics: any }) {
    const data = [
        { name: 'LCP', value: metrics?.lcp_s || 0, target: 2.5, fill: '#ff6b6b' },
        { name: 'CLS', value: (metrics?.cls || 0) * 100, target: 10, fill: '#f59e0b' },
        { name: 'TBT', value: (metrics?.tbt_ms || 0) / 10, target: 20, fill: '#4ecdc4' },
        { name: 'TTFB', value: (metrics?.ttfb_ms || 0) / 100, target: 8, fill: '#a78bfa' },
    ];

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                    contentStyle={{
                        background: '#151a1e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                />
                <Area type="monotone" dataKey="value" stroke="#ff6b6b" fillOpacity={1} fill="url(#colorPerf)" animationDuration={1500} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/* ─── SEO Breakdown Chart ─── */
function SEOBreakdownChart({ seo }: { seo: any }) {
    const data = [
        {
            name: 'Meta',
            value: (seo.title_length >= 30 && seo.title_length <= 60 ? 50 : 0) +
                (seo.meta_description_length >= 120 && seo.meta_description_length <= 160 ? 50 : 0),
            fill: '#4ecdc4'
        },
        {
            name: 'Structure',
            value: (seo.h1_count === 1 ? 100 : 50),
            fill: '#aee92b'
        },
        {
            name: 'Images',
            value: (seo.images_missing_alt_count === 0 ? 100 : Math.max(0, 100 - seo.images_missing_alt_count * 10)),
            fill: '#f59e0b'
        },
        {
            name: 'Links',
            value: Math.min(100, (seo.internal_links_count || 0) * 5),
            fill: '#a78bfa'
        },
    ];

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                    tick={{ fill: '#9aa0a6', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    domain={[0, 100]}
                />
                <Tooltip
                    contentStyle={{
                        background: '#151a1e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ═══════════════════════  MAIN COMPONENT  ═══════════════════════ */
export function ReportDashboard() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [competitorLoading, setCompetitorLoading] = useState(false);

    useEffect(() => {
        if (!reportId) { setLoading(false); return; }
        (async () => {
            try { setReport(await getReport(reportId)); }
            catch (e: any) { setError(e.message || 'Failed to fetch report'); }
            finally { setLoading(false); }
        })();
    }, [reportId]);

    if (loading) return <Loader />;
    if (error || !report) return <div className="rd-error">{error || 'Report not found'}</div>;

    const agg = report.aggregator;
    const perf = report.modules?.performance;
    const seo = report.modules?.seo;
    const ux = report.modules?.ux;
    const content = report.modules?.content;
    const ai = report.ai_insights;

    const overallScore = agg?.website_health_score ?? 0;
    const overallGrade = getGrade(overallScore);

    const mScores = {
        performance: agg?.module_scores?.performance ?? perf?.score ?? 0,
        seo: agg?.module_scores?.seo ?? seo?.score ?? 0,
        ux: agg?.module_scores?.ux ?? ux?.score ?? 0,
        content: agg?.module_scores?.content ?? content?.score ?? 0,
    };

    const allIssues = [
        ...(perf?.issues || []).map((i: any) => ({ ...i, module: 'performance' })),
        ...(seo?.issues || []).map((i: any) => ({ ...i, module: 'seo' })),
        ...(ux?.issues || []).map((i: any) => ({ ...i, module: 'ux' })),
        ...(content?.issues || []).map((i: any) => ({ ...i, module: 'content' })),
    ];
    const allFixes = [
        ...(perf?.fixes || []).map((f: any) => ({ ...f, module: 'performance' })),
        ...(seo?.fixes || []).map((f: any) => ({ ...f, module: 'seo' })),
        ...(ux?.fixes || []).map((f: any) => ({ ...f, module: 'ux' })),
        ...(content?.fixes || []).map((f: any) => ({ ...f, module: 'content' })),
    ];
    allFixes.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    const NAV_MAIN = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'performance', label: 'Performance', icon: Zap },
        { id: 'seo', label: 'SEO', icon: Search },
        { id: 'ux', label: 'UX & A11y', icon: Smartphone },
        { id: 'content', label: 'Content', icon: FileText },
    ];
    const NAV_SETTINGS = [
        { id: 'ai', label: 'AI Insights', icon: Brain },
        { id: 'issues', label: 'Issues & Fixes', icon: AlertTriangle },
        { id: 'competitor', label: 'Competitor Analysis', icon: Target },
    ];

    const handleNav = (id: string) => { setActiveView(id); setSidebarOpen(false); };

    // Competitor Analysis Handler
    const handleCompetitorAnalysis = async () => {
        if (!reportId) return;
        setCompetitorLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/competitor/analyze-3-1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userReportId: reportId })
            });
            const data = await response.json();
            if (data.comparisonId) {
                navigate(`/competitor/${data.comparisonId}`);
            }
        } catch (error) {
            console.error('Competitor analysis failed:', error);
            alert('Failed to start competitor analysis. Please try again.');
        } finally {
            setCompetitorLoading(false);
        }
    };

    return (
        <div className="rd">
            {/* ═══════ SIDEBAR ═══════ */}
            <aside className={`rd-sidebar ${sidebarOpen ? 'rd-sidebar--open' : ''}`}>
                <div className="rd-sb-top">
                    <div className="rd-sb-brand">
                        <div className="rd-sb-logo"><Globe size={18} /></div>
                        <span className="rd-sb-name">Web Analyzer</span>
                        <button className="rd-sb-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
                    </div>
                    <div className="rd-sb-search">
                        <Search size={14} />
                        <span>Search…</span>
                        <kbd>⌘K</kbd>
                    </div>
                </div>

                <nav className="rd-sb-nav">
                    <p className="rd-sb-section-label">DASHBOARDS</p>
                    {NAV_MAIN.map(n => {
                        const Icon = n.icon;
                        return (
                            <button key={n.id} className={`rd-sb-item ${activeView === n.id ? 'active' : ''}`}
                                onClick={() => handleNav(n.id)}>
                                <Icon size={16} />
                                <span>{n.label}</span>
                                {activeView === n.id && <ChevronRight size={14} className="rd-sb-chevron" />}
                            </button>
                        );
                    })}

                    <p className="rd-sb-section-label">SETTINGS</p>
                    {NAV_SETTINGS.map(n => {
                        const Icon = n.icon;
                        return (
                            <button key={n.id} className={`rd-sb-item ${activeView === n.id ? 'active' : ''}`}
                                onClick={() => handleNav(n.id)}>
                                <Icon size={16} />
                                <span>{n.label}</span>
                            </button>
                        );
                    })}
                    <button className="rd-sb-item" onClick={() => window.print()}>
                        <Printer size={16} /><span>Print Report</span>
                    </button>
                    <button className="rd-sb-item" onClick={() => navigate(`/dashboard/${reportId}`)}>
                        <ArrowLeft size={16} /><span>Back to Dashboard</span>
                    </button>
                </nav>

                <div className="rd-sb-bottom">
                    <div className="rd-sb-user">
                        <div className="rd-sb-avatar">{overallGrade}</div>
                        <span className="rd-sb-site-label">WAN</span>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="rd-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* ═══════ MAIN CONTENT ═══════ */}
            <main className="rd-main">
                {/* Top Bar */}
                <header className="rd-header">
                    <button className="rd-burger" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                    <div className="rd-breadcrumb">
                        <span className="rd-bc-dim">Dashboards</span>
                        <span className="rd-bc-sep">/</span>
                        <span className="rd-bc-active">{NAV_MAIN.find(n => n.id === activeView)?.label || NAV_SETTINGS.find(n => n.id === activeView)?.label || 'Overview'}</span>
                    </div>
                    <div className="rd-header-right">
                        <span className="rd-header-url">{report.url}</span>
                    </div>
                </header>

                {/* Page Title */}
                <div className="rd-page-title-row">
                    <h1 className="rd-page-title">{NAV_MAIN.find(n => n.id === activeView)?.label || NAV_SETTINGS.find(n => n.id === activeView)?.label || 'Overview'}</h1>
                    <span className="rd-today-tag">{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* ═══════ OVERVIEW VIEW ═══════ */}
                {activeView === 'overview' && (
                    <div className="rd-view rd-view--overview">
                        {/* Row 1 — 4 module score cards */}
                        <motion.div
                            className="rd-top-cards"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                        >
                            {Object.entries(mScores).map(([key, score]) => {
                                const m = MODULE_META[key];
                                const Icon = m.icon;
                                const g = getGrade(score);
                                const gc = gradeColor(score);
                                return (
                                    <motion.div
                                        key={key}
                                        className="rd-stat-card"
                                        onClick={() => handleNav(key)}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="rd-stat-card-head">
                                            <span className="rd-stat-label">{m.label}</span>
                                            <div className="rd-stat-icon" style={{ background: `${m.color}15`, color: m.color }}><Icon size={15} /></div>
                                        </div>
                                        <div className="rd-stat-score" style={{ color: m.color }}>
                                            <AnimatedCounter value={score} />
                                        </div>
                                        <div className="rd-stat-foot">
                                            <span className="rd-stat-change" style={{ color: gc }}>
                                                <span className="rd-stat-dot" style={{ background: gc }} /> {g} Grade
                                            </span>
                                            <div className="rd-stat-bar"><div className="rd-stat-bar-fill" style={{ width: `${score}%`, background: m.color }} /></div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Row 2 — Score Overview + Side stack */}
                        <div className="rd-mid-row">
                            <div className="rd-card rd-card--wide">
                                <div className="rd-card-header">
                                    <h3>Score Overview</h3>
                                    <span className="rd-card-badge">Health Score</span>
                                </div>
                                <div className="rd-score-overview">
                                    <DonutChart
                                        segments={Object.entries(mScores).map(([k, v]) => ({
                                            value: v, color: MODULE_META[k].color, label: MODULE_META[k].label,
                                        }))}
                                        centerValue={String(overallScore)}
                                        centerLabel="Overall"
                                    />
                                    <div className="rd-so-right">
                                        <div className="rd-so-total">
                                            <span className="rd-so-total-label">Overall Health</span>
                                            <span className="rd-so-total-val">{overallScore || 0}</span>
                                        </div>
                                        <div className="rd-legend">
                                            {Object.entries(mScores).map(([k, v]) => (
                                                <div key={k} className="rd-legend-item">
                                                    <span className="rd-legend-dot" style={{ background: MODULE_META[k].color }} />
                                                    <span className="rd-legend-name">{MODULE_META[k].label}</span>
                                                    <span className="rd-legend-val">{v}/100</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rd-side-stack">
                                <div className="rd-card rd-minicard">
                                    <div className="rd-minicard-top">
                                        <span className="rd-minicard-label">Total Issues</span>
                                        <div className="rd-minicard-icon rd-minicard-icon--red"><AlertTriangle size={15} /></div>
                                    </div>
                                    <div className="rd-minicard-row">
                                        <span className="rd-minicard-val rd-minicard-val--red">{allIssues.length}</span>
                                        <span className="rd-minicard-change rd-minicard-change--red">
                                            {allIssues.filter((i: any) => i.severity === 'critical' || i.severity === 'high').length} critical/high
                                        </span>
                                    </div>
                                </div>
                                <div className="rd-card rd-minicard">
                                    <div className="rd-minicard-top">
                                        <span className="rd-minicard-label">Total Fixes</span>
                                        <div className="rd-minicard-icon rd-minicard-icon--green"><CheckCircle size={15} /></div>
                                    </div>
                                    <div className="rd-minicard-row">
                                        <span className="rd-minicard-val rd-minicard-val--green">{allFixes.length}</span>
                                        <span className="rd-minicard-change rd-minicard-change--green">
                                            {allFixes.filter((f: any) => f.priority === 1).length} P1 priority
                                        </span>
                                    </div>
                                </div>
                                <div className="rd-card rd-minicard">
                                    <div className="rd-minicard-top">
                                        <span className="rd-minicard-label">Risk Level</span>
                                        <div className="rd-minicard-icon rd-minicard-icon--yellow"><Shield size={15} /></div>
                                    </div>
                                    <div className="rd-minicard-row">
                                        <span className="rd-minicard-val" style={{ color: '#F59E0B', textTransform: 'capitalize' }}>{agg?.overall_risk_level ?? '—'}</span>
                                    </div>
                                    {agg?.dominant_risk_domains?.length > 0 && (
                                        <div className="rd-risk-chips">
                                            {agg.dominant_risk_domains.slice(0, 3).map((d: string, i: number) => (
                                                <span key={i} className="rd-risk-chip">{d}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 2.5 — Module Scores Bar Chart */}
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className="rd-card-header">
                                <h3><BarChart3 size={16} /> Module Scores Comparison</h3>
                                <span className="rd-card-badge">Analytics</span>
                            </div>
                            <ModuleScoresChart scores={mScores} />
                        </motion.div>

                        {/* Row 3 — Issues Table + AI Promo */}
                        <div className="rd-bottom-row">
                            <div className="rd-card rd-card--wide">
                                <div className="rd-card-header">
                                    <h3>Issue List</h3>
                                    <span className="rd-card-count">{allIssues.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead>
                                            <tr><th>Module</th><th>Severity</th><th>Description</th></tr>
                                        </thead>
                                        <tbody>
                                            {allIssues.slice(0, 8).map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className="rd-mod-badge" style={{ borderColor: `${MODULE_META[issue.module]?.color}40` }}>
                                                            <span className="rd-mod-dot" style={{ background: MODULE_META[issue.module]?.color }} />
                                                            {MODULE_META[issue.module]?.label}
                                                        </div>
                                                    </td>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">
                                                        {issue.ai && <span className="rd-ai-pill">AI</span>}
                                                        {issue.description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {allIssues.length > 8 && (
                                    <button className="rd-see-all" onClick={() => handleNav('issues')}>
                                        See all {allIssues.length} issues <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="rd-promo-card">
                                <div className="rd-promo-glow" />
                                <div className="rd-promo-badge"><Brain size={14} /> AI Powered</div>
                                <div className="rd-promo-grade" style={{ color: gradeColor(overallScore) }}>{overallGrade}</div>
                                <p className="rd-promo-tagline">
                                    {ai?.executiveSummary
                                        ? ai.executiveSummary.slice(0, 120) + (ai.executiveSummary.length > 120 ? '…' : '')
                                        : 'Analyze your website, view recommendations and optimize performance.'}
                                </p>
                                {ai?.quickWins && ai.quickWins.length > 0 && (
                                    <div className="rd-promo-wins">
                                        {ai.quickWins.slice(0, 3).map((w, i) => (
                                            <div key={i} className="rd-promo-win"><CheckCircle size={12} /> {w.length > 60 ? w.slice(0, 60) + '…' : w}</div>
                                        ))}
                                    </div>
                                )}
                                <button className="rd-promo-btn" onClick={() => handleNav('ai')}>
                                    View AI Insights <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ MODULE DETAIL VIEWS ═══════ */}
                {activeView === 'performance' && perf && (
                    <div className="rd-view">
                        {/* Module hero */}
                        <motion.div
                            className="rd-mod-hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rd-mod-hero-left">
                                <div className="rd-mod-hero-icon" style={{ background: `${MODULE_META.performance.color}15`, color: MODULE_META.performance.color }}>
                                    <Zap size={22} />
                                </div>
                                <div>
                                    <div className="rd-mod-hero-score" style={{ color: MODULE_META.performance.color }}>
                                        <AnimatedCounter value={mScores.performance} />
                                        <span className="rd-mod-hero-max">/100</span>
                                    </div>
                                    <span className="rd-mod-hero-grade" style={{ background: `${gradeColor(mScores.performance)}18`, color: gradeColor(mScores.performance) }}>
                                        {getGrade(mScores.performance)} Grade
                                    </span>
                                </div>
                            </div>
                            <div className="rd-mod-hero-bar">
                                <div className="rd-mod-hero-fill" style={{ width: `${mScores.performance}%`, background: `linear-gradient(90deg, ${MODULE_META.performance.color}, ${MODULE_META.performance.color}80)` }} />
                            </div>
                        </motion.div>

                        {/* Core Web Vitals - Radial Charts */}
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <div className="rd-card-header">
                                <h3><Zap size={16} style={{ color: MODULE_META.performance.color }} /> Core Web Vitals</h3>
                                <span className="rd-card-badge">Critical Metrics</span>
                            </div>
                            <div className="rd-radial-grid">
                                <RadialProgressChart
                                    value={perf.metrics?.lcp_s || 0}
                                    max={4}
                                    label="LCP (s)"
                                    color={perf.metrics?.lcp_s <= 2.5 ? '#aee92b' : perf.metrics?.lcp_s <= 4 ? '#f59e0b' : '#ff6b6b'}
                                />
                                <RadialProgressChart
                                    value={(perf.metrics?.cls || 0) * 100}
                                    max={25}
                                    label="CLS"
                                    color={perf.metrics?.cls <= 0.1 ? '#aee92b' : perf.metrics?.cls <= 0.25 ? '#f59e0b' : '#ff6b6b'}
                                />
                                <RadialProgressChart
                                    value={perf.metrics?.tbt_ms || 0}
                                    max={600}
                                    label="TBT (ms)"
                                    color={perf.metrics?.tbt_ms <= 200 ? '#aee92b' : perf.metrics?.tbt_ms <= 600 ? '#f59e0b' : '#ff6b6b'}
                                />
                                <RadialProgressChart
                                    value={perf.metrics?.ttfb_ms || 0}
                                    max={1800}
                                    label="TTFB (ms)"
                                    color={perf.metrics?.ttfb_ms <= 800 ? '#aee92b' : perf.metrics?.ttfb_ms <= 1800 ? '#f59e0b' : '#ff6b6b'}
                                />
                            </div>
                        </motion.div>

                        {/* Performance Metrics Chart */}
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <div className="rd-card-header">
                                <h3><TrendingUp size={16} /> Performance Metrics</h3>
                            </div>
                            <PerformanceMetricsChart metrics={perf.metrics} />
                        </motion.div>

                        {/* Additional Metrics Grid */}
                        <motion.div
                            className="rd-metrics-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <MetricTile label="Speed Index" value={perf.metrics?.speed_index} unit="" good={3.4} bad={5.8} desc="Speed Index" />
                            <MetricTile label="JS Size" value={perf.metrics?.total_js_kb} unit=" KB" good={300} bad={700} desc="Total JavaScript" decimals={0} />
                            <MetricTile label="CSS Size" value={perf.metrics?.total_css_kb} unit=" KB" good={100} bad={300} desc="Total CSS" decimals={0} />
                            <MetricTile label="DOM Nodes" value={perf.metrics?.dom_nodes} unit="" good={800} bad={1500} desc="DOM Node Count" decimals={0} />
                        </motion.div>

                        {/* Issues and Fixes */}
                        {perf.issues?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><AlertTriangle size={16} style={{ color: MODULE_META.performance.color }} /> Issues</h3>
                                    <span className="rd-card-count">{perf.issues.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>Severity</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {perf.issues.map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">{issue.ai && <span className="rd-ai-pill">AI</span>}{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {perf.fixes?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><CheckCircle size={16} style={{ color: '#aee92b' }} /> Fixes</h3>
                                    <span className="rd-card-count rd-card-count--green">{perf.fixes.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>P</th><th>Fix</th><th>Details</th></tr></thead>
                                        <tbody>
                                            {perf.fixes.map((fix: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="rd-p-badge" style={{
                                                        background: fix.priority === 1 ? 'rgba(255,107,107,0.12)' : fix.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                                                        color: fix.priority === 1 ? '#ff6b6b' : '#f59e0b'
                                                    }}>P{fix.priority}</span></td>
                                                    <td className="rd-fix-name">{fix.ai && <span className="rd-ai-pill">AI</span>}{fix.title}</td>
                                                    <td className="rd-desc-cell">{fix.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {activeView === 'seo' && seo && (
                    <div className="rd-view">
                        {/* Module hero */}
                        <motion.div
                            className="rd-mod-hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rd-mod-hero-left">
                                <div className="rd-mod-hero-icon" style={{ background: `${MODULE_META.seo.color}15`, color: MODULE_META.seo.color }}>
                                    <Search size={22} />
                                </div>
                                <div>
                                    <div className="rd-mod-hero-score" style={{ color: MODULE_META.seo.color }}>
                                        <AnimatedCounter value={mScores.seo} />
                                        <span className="rd-mod-hero-max">/100</span>
                                    </div>
                                    <span className="rd-mod-hero-grade" style={{ background: `${gradeColor(mScores.seo)}18`, color: gradeColor(mScores.seo) }}>
                                        {getGrade(mScores.seo)} Grade
                                    </span>
                                </div>
                            </div>
                            <div className="rd-mod-hero-bar">
                                <div className="rd-mod-hero-fill" style={{ width: `${mScores.seo}%`, background: `linear-gradient(90deg, ${MODULE_META.seo.color}, ${MODULE_META.seo.color}80)` }} />
                            </div>
                        </motion.div>

                        {/* SEO Breakdown Chart */}
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <div className="rd-card-header">
                                <h3><BarChart3 size={16} style={{ color: MODULE_META.seo.color }} /> SEO Score Breakdown</h3>
                                <span className="rd-card-badge">Analysis</span>
                            </div>
                            <SEOBreakdownChart seo={seo} />
                        </motion.div>

                        {/* SEO Details */}
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <div className="rd-data-grid">
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Title</span>
                                    <span className="rd-data-value">{seo.title || '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Title Length</span>
                                    <span className="rd-data-value" style={{ color: seo.title_length >= 30 && seo.title_length <= 60 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: seo.title_length >= 30 && seo.title_length <= 60 ? '#aee92b' : '#ff6b6b' }} />
                                        {seo.title_length ?? '—'} chars
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Meta Description</span>
                                    <span className="rd-data-value" style={{ color: seo.meta_description_length >= 120 && seo.meta_description_length <= 160 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: seo.meta_description_length >= 120 && seo.meta_description_length <= 160 ? '#aee92b' : '#ff6b6b' }} />
                                        {seo.meta_description_length ?? '—'} chars
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">H1 Count</span>
                                    <span className="rd-data-value" style={{ color: seo.h1_count === 1 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: seo.h1_count === 1 ? '#aee92b' : '#ff6b6b' }} />
                                        {seo.h1_count ?? '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Images Missing Alt</span>
                                    <span className="rd-data-value" style={{ color: (seo.images_missing_alt_count ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: (seo.images_missing_alt_count ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }} />
                                        {seo.images_missing_alt_count ?? 0}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Internal Links</span>
                                    <span className="rd-data-value">{seo.internal_links_count ?? '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">External Links</span>
                                    <span className="rd-data-value">{seo.external_links_count ?? '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Indexability</span>
                                    <span className="rd-data-value" style={{ color: seo.indexability_status === 'good' ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: seo.indexability_status === 'good' ? '#aee92b' : '#ff6b6b' }} />
                                        {seo.indexability_status || '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Crawl Health</span>
                                    <span className="rd-data-value">{seo.crawl_health_indicator || '—'}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Issues and Fixes */}
                        {seo.issues?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><AlertTriangle size={16} style={{ color: MODULE_META.seo.color }} /> Issues</h3>
                                    <span className="rd-card-count">{seo.issues.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>Severity</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {seo.issues.map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">{issue.ai && <span className="rd-ai-pill">AI</span>}{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {seo.fixes?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><CheckCircle size={16} style={{ color: '#aee92b' }} /> Fixes</h3>
                                    <span className="rd-card-count rd-card-count--green">{seo.fixes.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>P</th><th>Fix</th><th>Details</th></tr></thead>
                                        <tbody>
                                            {seo.fixes.map((fix: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="rd-p-badge" style={{
                                                        background: fix.priority === 1 ? 'rgba(255,107,107,0.12)' : fix.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                                                        color: fix.priority === 1 ? '#ff6b6b' : '#f59e0b'
                                                    }}>P{fix.priority}</span></td>
                                                    <td className="rd-fix-name">{fix.ai && <span className="rd-ai-pill">AI</span>}{fix.title}</td>
                                                    <td className="rd-desc-cell">{fix.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {activeView === 'ux' && ux && (
                    <div className="rd-view">
                        <motion.div
                            className="rd-mod-hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rd-mod-hero-left">
                                <div className="rd-mod-hero-icon" style={{ background: `${MODULE_META.ux.color}15`, color: MODULE_META.ux.color }}>
                                    <Smartphone size={22} />
                                </div>
                                <div>
                                    <div className="rd-mod-hero-score" style={{ color: MODULE_META.ux.color }}>
                                        <AnimatedCounter value={mScores.ux} />
                                        <span className="rd-mod-hero-max">/100</span>
                                    </div>
                                    <span className="rd-mod-hero-grade" style={{ background: `${gradeColor(mScores.ux)}18`, color: gradeColor(mScores.ux) }}>
                                        {getGrade(mScores.ux)} Grade
                                    </span>
                                </div>
                            </div>
                            <div className="rd-mod-hero-bar">
                                <div className="rd-mod-hero-fill" style={{ width: `${mScores.ux}%`, background: `linear-gradient(90deg, ${MODULE_META.ux.color}, ${MODULE_META.ux.color}80)` }} />
                            </div>
                        </motion.div>

                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <div className="rd-data-grid">
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Scan Mode</span>
                                    <span className="rd-data-value">{ux.scan_mode === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Viewport Meta</span>
                                    <span className="rd-data-value" style={{ color: ux.viewport_meta_present ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: ux.viewport_meta_present ? '#aee92b' : '#ff6b6b' }} />
                                        {ux.viewport_meta_present ? 'Present' : 'Missing'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Total Violations</span>
                                    <span className="rd-data-value" style={{ color: (ux.violations_count ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: (ux.violations_count ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }} />
                                        {ux.violations_count ?? 0}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Critical Violations</span>
                                    <span className="rd-data-value" style={{ color: (ux.violations_by_impact?.critical ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: (ux.violations_by_impact?.critical ?? 0) === 0 ? '#aee92b' : '#ff6b6b' }} />
                                        {ux.violations_by_impact?.critical ?? 0}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Serious Violations</span>
                                    <span className="rd-data-value" style={{ color: (ux.violations_by_impact?.serious ?? 0) === 0 ? '#aee92b' : '#f59e0b' }}>
                                        <span className="rd-data-dot" style={{ background: (ux.violations_by_impact?.serious ?? 0) === 0 ? '#aee92b' : '#f59e0b' }} />
                                        {ux.violations_by_impact?.serious ?? 0}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">CTAs Found</span>
                                    <span className="rd-data-value">{ux.ctas_count ?? '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">CTAs Above Fold</span>
                                    <span className="rd-data-value" style={{ color: (ux.ctas_above_fold ?? 0) >= 1 ? '#aee92b' : '#f59e0b' }}>
                                        <span className="rd-data-dot" style={{ background: (ux.ctas_above_fold ?? 0) >= 1 ? '#aee92b' : '#f59e0b' }} />
                                        {ux.ctas_above_fold ?? '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">A11y Risk Level</span>
                                    <span className="rd-data-value" style={{ color: ux.accessibility_risk_level === 'low' ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: ux.accessibility_risk_level === 'low' ? '#aee92b' : '#ff6b6b' }} />
                                        {ux.accessibility_risk_level || '—'}
                                    </span>
                                </div>
                                {ux.touch_targets_too_small != null && (
                                    <div className="rd-data-row">
                                        <span className="rd-data-label">Small Touch Targets</span>
                                        <span className="rd-data-value" style={{ color: ux.touch_targets_too_small === 0 ? '#aee92b' : '#ff6b6b' }}>
                                            <span className="rd-data-dot" style={{ background: ux.touch_targets_too_small === 0 ? '#aee92b' : '#ff6b6b' }} />
                                            {ux.touch_targets_too_small}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {ux.issues?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><AlertTriangle size={16} style={{ color: MODULE_META.ux.color }} /> Issues</h3>
                                    <span className="rd-card-count">{ux.issues.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>Severity</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {ux.issues.map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">{issue.ai && <span className="rd-ai-pill">AI</span>}{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {ux.fixes?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><CheckCircle size={16} style={{ color: '#aee92b' }} /> Fixes</h3>
                                    <span className="rd-card-count rd-card-count--green">{ux.fixes.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>P</th><th>Fix</th><th>Details</th></tr></thead>
                                        <tbody>
                                            {ux.fixes.map((fix: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="rd-p-badge" style={{
                                                        background: fix.priority === 1 ? 'rgba(255,107,107,0.12)' : fix.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                                                        color: fix.priority === 1 ? '#ff6b6b' : '#f59e0b'
                                                    }}>P{fix.priority}</span></td>
                                                    <td className="rd-fix-name">{fix.ai && <span className="rd-ai-pill">AI</span>}{fix.title}</td>
                                                    <td className="rd-desc-cell">{fix.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {activeView === 'content' && content && (
                    <div className="rd-view">
                        <motion.div
                            className="rd-mod-hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rd-mod-hero-left">
                                <div className="rd-mod-hero-icon" style={{ background: `${MODULE_META.content.color}15`, color: MODULE_META.content.color }}>
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <div className="rd-mod-hero-score" style={{ color: MODULE_META.content.color }}>
                                        <AnimatedCounter value={mScores.content} />
                                        <span className="rd-mod-hero-max">/100</span>
                                    </div>
                                    <span className="rd-mod-hero-grade" style={{ background: `${gradeColor(mScores.content)}18`, color: gradeColor(mScores.content) }}>
                                        {getGrade(mScores.content)} Grade
                                    </span>
                                </div>
                            </div>
                            <div className="rd-mod-hero-bar">
                                <div className="rd-mod-hero-fill" style={{ width: `${mScores.content}%`, background: `linear-gradient(90deg, ${MODULE_META.content.color}, ${MODULE_META.content.color}80)` }} />
                            </div>
                        </motion.div>

                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <div className="rd-data-grid">
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Word Count</span>
                                    <span className="rd-data-value" style={{ color: (content.word_count ?? 0) >= 300 ? '#aee92b' : '#ff6b6b' }}>
                                        <span className="rd-data-dot" style={{ background: (content.word_count ?? 0) >= 300 ? '#aee92b' : '#ff6b6b' }} />
                                        {content.word_count ?? '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Flesch Reading Ease</span>
                                    <span className="rd-data-value" style={{ color: (content.flesch_reading_ease ?? 0) >= 60 ? '#aee92b' : '#f59e0b' }}>
                                        <span className="rd-data-dot" style={{ background: (content.flesch_reading_ease ?? 0) >= 60 ? '#aee92b' : '#f59e0b' }} />
                                        {content.flesch_reading_ease != null ? content.flesch_reading_ease.toFixed(1) : '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Grade Level</span>
                                    <span className="rd-data-value">{content.flesch_kincaid_grade != null ? content.flesch_kincaid_grade.toFixed(1) : '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Content Depth</span>
                                    <span className="rd-data-value" style={{ color: content.content_depth_status === 'comprehensive' ? '#aee92b' : '#f59e0b' }}>
                                        <span className="rd-data-dot" style={{ background: content.content_depth_status === 'comprehensive' ? '#aee92b' : '#f59e0b' }} />
                                        {content.content_depth_status?.replace(/_/g, ' ') || '—'}
                                    </span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Keyword Diversity</span>
                                    <span className="rd-data-value">{content.keyword_diversity?.replace(/_/g, ' ') || '—'}</span>
                                </div>
                                <div className="rd-data-row">
                                    <span className="rd-data-label">Total Keywords</span>
                                    <span className="rd-data-value">{content.keywords?.length ?? 0}</span>
                                </div>
                            </div>
                        </motion.div>

                        {content.keywords?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <div className="rd-keywords">
                                    <h4 className="rd-sub-title">Top Keywords</h4>
                                    <div className="rd-kw-chips">
                                        {content.keywords.slice(0, 15).map((kw: any, i: number) => (
                                            <span key={i} className="rd-kw-chip">{typeof kw === 'string' ? kw : kw.word || kw.keyword}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {content.issues?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><AlertTriangle size={16} style={{ color: MODULE_META.content.color }} /> Issues</h3>
                                    <span className="rd-card-count">{content.issues.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>Severity</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {content.issues.map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">{issue.ai && <span className="rd-ai-pill">AI</span>}{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {content.fixes?.length > 0 && (
                            <motion.div
                                className="rd-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <div className="rd-card-header">
                                    <h3><CheckCircle size={16} style={{ color: '#aee92b' }} /> Fixes</h3>
                                    <span className="rd-card-count rd-card-count--green">{content.fixes.length}</span>
                                </div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>P</th><th>Fix</th><th>Details</th></tr></thead>
                                        <tbody>
                                            {content.fixes.map((fix: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="rd-p-badge" style={{
                                                        background: fix.priority === 1 ? 'rgba(255,107,107,0.12)' : fix.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                                                        color: fix.priority === 1 ? '#ff6b6b' : '#f59e0b'
                                                    }}>P{fix.priority}</span></td>
                                                    <td className="rd-fix-name">{fix.ai && <span className="rd-ai-pill">AI</span>}{fix.title}</td>
                                                    <td className="rd-desc-cell">{fix.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* ═══════ AI INSIGHTS VIEW ═══════ */}
                {activeView === 'ai' && (
                    <div className="rd-view">
                        <div className="rd-top-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="rd-stat-card">
                                <div className="rd-stat-card-head">
                                    <span className="rd-stat-label">Quick Wins</span>
                                    <div className="rd-stat-icon" style={{ background: 'rgba(174,233,43,0.1)', color: '#aee92b' }}><Zap size={15} /></div>
                                </div>
                                <div className="rd-stat-score" style={{ color: '#aee92b' }}>{ai?.quickWins?.length ?? 0}</div>
                                <span className="rd-stat-change" style={{ color: '#9a9ab0' }}>fast improvements</span>
                            </div>
                            <div className="rd-stat-card">
                                <div className="rd-stat-card-head">
                                    <span className="rd-stat-label">Top Priorities</span>
                                    <div className="rd-stat-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}><Target size={15} /></div>
                                </div>
                                <div className="rd-stat-score" style={{ color: '#a78bfa' }}>{ai?.topPriorities?.length ?? 0}</div>
                                <span className="rd-stat-change" style={{ color: '#9a9ab0' }}>strategic actions</span>
                            </div>
                        </div>

                        {ai?.executiveSummary && (
                            <div className="rd-card rd-ai-summary">
                                <div className="rd-card-header"><h3><Brain size={16} /> Executive Summary</h3></div>
                                <p className="rd-ai-text">{ai.executiveSummary}</p>
                            </div>
                        )}

                        {ai?.topPriorities && ai.topPriorities.length > 0 && (
                            <div className="rd-card">
                                <div className="rd-card-header"><h3><Target size={16} /> Top Priorities</h3></div>
                                <div className="rd-priorities">
                                    {ai.topPriorities.map((p, i) => (
                                        <div key={i} className="rd-priority-row">
                                            <span className="rd-priority-num">{String(i + 1).padStart(2, '0')}</span>
                                            <div className="rd-priority-body">
                                                <div className="rd-priority-head">
                                                    <strong>{p.title}</strong>
                                                    <span className={`rd-badge rd-badge--${p.impact?.toLowerCase()}`}>{p.impact}</span>
                                                    <span className="rd-badge rd-badge--roi">{p.estimatedROI}</span>
                                                </div>
                                                <p>{p.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rd-ai-dual">
                            {ai?.quickWins && ai.quickWins.length > 0 && (
                                <div className="rd-card">
                                    <div className="rd-card-header"><h3><Zap size={16} /> Quick Wins</h3></div>
                                    <ul className="rd-ai-list">
                                        {ai.quickWins.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                            )}
                            {ai?.longTermGoals && ai.longTermGoals.length > 0 && (
                                <div className="rd-card">
                                    <div className="rd-card-header"><h3><TrendingUp size={16} /> Long-Term Goals</h3></div>
                                    <ul className="rd-ai-list">
                                        {ai.longTermGoals.map((g, i) => <li key={i}>{g}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════ ISSUES & FIXES VIEW ═══════ */}
                {activeView === 'issues' && (
                    <div className="rd-view">
                        <div className="rd-top-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="rd-stat-card">
                                <div className="rd-stat-card-head">
                                    <span className="rd-stat-label">All Issues</span>
                                    <div className="rd-stat-icon" style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}><AlertTriangle size={15} /></div>
                                </div>
                                <div className="rd-stat-score" style={{ color: '#ff6b6b' }}>{allIssues.length}</div>
                                <span className="rd-stat-change" style={{ color: '#9a9ab0' }}>across all modules</span>
                            </div>
                            <div className="rd-stat-card">
                                <div className="rd-stat-card-head">
                                    <span className="rd-stat-label">All Fixes</span>
                                    <div className="rd-stat-icon" style={{ background: 'rgba(174,233,43,0.1)', color: '#aee92b' }}><CheckCircle size={15} /></div>
                                </div>
                                <div className="rd-stat-score" style={{ color: '#aee92b' }}>{allFixes.length}</div>
                                <span className="rd-stat-change" style={{ color: '#9a9ab0' }}>recommended actions</span>
                            </div>
                        </div>

                        {allIssues.length > 0 && (
                            <div className="rd-card">
                                <div className="rd-card-header"><h3><AlertTriangle size={16} /> All Issues</h3><span className="rd-card-count">{allIssues.length}</span></div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>Module</th><th>Severity</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {allIssues.map((issue: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><div className="rd-mod-badge" style={{ borderColor: `${MODULE_META[issue.module]?.color}40` }}><span className="rd-mod-dot" style={{ background: MODULE_META[issue.module]?.color }} />{MODULE_META[issue.module]?.label}</div></td>
                                                    <td><SeverityBadge severity={issue.severity} /></td>
                                                    <td className="rd-desc-cell">{issue.ai && <span className="rd-ai-pill">AI</span>}{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {allFixes.length > 0 && (
                            <div className="rd-card">
                                <div className="rd-card-header"><h3><CheckCircle size={16} /> Recommended Fixes</h3><span className="rd-card-count rd-card-count--green">{allFixes.length}</span></div>
                                <div className="rd-table-scroll">
                                    <table className="rd-table">
                                        <thead><tr><th>P</th><th>Module</th><th>Fix</th><th>Details</th></tr></thead>
                                        <tbody>
                                            {allFixes.map((fix: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="rd-p-badge" style={{
                                                        background: fix.priority === 1 ? 'rgba(255,107,107,0.12)' : fix.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                                                        color: fix.priority === 1 ? '#ff6b6b' : '#f59e0b'
                                                    }}>P{fix.priority}</span></td>
                                                    <td><div className="rd-mod-badge" style={{ borderColor: `${MODULE_META[fix.module]?.color}40` }}><span className="rd-mod-dot" style={{ background: MODULE_META[fix.module]?.color }} />{MODULE_META[fix.module]?.label}</div></td>
                                                    <td className="rd-fix-name">{fix.ai && <span className="rd-ai-pill">AI</span>}{fix.title}</td>
                                                    <td className="rd-desc-cell">{fix.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ COMPETITOR ANALYSIS VIEW ═══════ */}
                {activeView === 'competitor' && (
                    <div className="rd-view">
                        <motion.div
                            className="rd-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rd-card-header">
                                <h3><Target size={16} style={{ color: '#a78bfa' }} /> Competitor Analysis (3:1 Ratio)</h3>
                                <span className="rd-card-badge">AI-Powered</span>
                            </div>

                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    background: 'linear-gradient(135deg, #aee92b 0%, #9ad424 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    boxShadow: '0 0 30px rgba(174, 233, 43, 0.4)'
                                }}>
                                    🏆
                                </div>

                                <h2 style={{ marginBottom: '1rem', color: '#fff' }}>
                                    Compare Against 3 Top Competitors
                                </h2>

                                <p style={{
                                    color: '#9aa0a6',
                                    marginBottom: '2rem',
                                    maxWidth: '600px',
                                    margin: '0 auto 2rem',
                                    lineHeight: '1.6'
                                }}>
                                    Our AI will automatically discover your top 3 competitors, analyze their websites in parallel,
                                    and generate a comprehensive comparison report with strategic insights, quick wins, and competitive opportunities.
                                </p>

                                <button
                                    onClick={handleCompetitorAnalysis}
                                    disabled={competitorLoading}
                                    style={{
                                        padding: '1rem 2.5rem',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        background: competitorLoading ? '#555' : 'linear-gradient(135deg, #aee92b 0%, #9ad424 100%)',
                                        color: competitorLoading ? '#fff' : '#0a0a0a',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: competitorLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: competitorLoading ? 'none' : '0 4px 20px rgba(174, 233, 43, 0.5)',
                                        transform: 'scale(1)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!competitorLoading) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 6px 30px rgba(174, 233, 43, 0.7)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = competitorLoading ? 'none' : '0 4px 20px rgba(174, 233, 43, 0.5)';
                                    }}
                                >
                                    {competitorLoading ? '🔄 Analyzing...' : '🚀 Start 3:1 Analysis'}
                                </button>

                                <p style={{
                                    marginTop: '1.5rem',
                                    fontSize: '0.85rem',
                                    color: '#666'
                                }}>
                                    ⏱️ Analysis takes 30-60 seconds
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}

            </main>
        </div>
    );
}

/* ═══════ Metric Tile ═══════ */
function MetricTile({ label, value, unit, good, bad, desc, decimals = 2 }: {
    label: string; value: any; unit: string; good: number; bad: number; desc: string; decimals?: number;
}) {
    const num = value != null ? Number(value) : null;
    const color = num != null ? (num <= good ? '#aee92b' : num >= bad ? '#ff6b6b' : '#f59e0b') : '#5a5a6a';
    return (
        <div className="rd-metric-tile">
            <span className="rd-metric-label">{label}</span>
            <span className="rd-metric-desc">{desc}</span>
            <span className="rd-metric-value" style={{ color }}>
                {num != null ? `${num.toFixed(decimals)}${unit}` : 'N/A'}
            </span>
        </div>
    );
}
