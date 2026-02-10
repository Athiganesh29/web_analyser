import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Zap, Globe, Smartphone, FileText,
    ArrowRight, Brain, BarChart3, Shield,
    Clock, Tag, Layout, Eye, Type, Image,
    Gauge, Activity, Server, Sparkles, CheckCircle2, Loader2,
    ChevronRight, MessageSquareCode, Lightbulb, Workflow
} from 'lucide-react';
import PixelBlast from '../components/PixelBlast';
import Chatbot from '../components/Chatbot';
import './LandingPage.css';

export function LandingPage() {
    const [url, setUrl] = useState('');
    const [urlBottom, setUrlBottom] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingBottom, setLoadingBottom] = useState(false);
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate(`/analyze?url=${encodeURIComponent(url)}&mode=${deviceMode}`);
        }, 1500);
    };

    const handleSubmitBottom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlBottom) return;
        setLoadingBottom(true);
        setTimeout(() => {
            setLoadingBottom(false);
            navigate(`/analyze?url=${encodeURIComponent(urlBottom)}&mode=${deviceMode}`);
        }, 1500);
    };

    const features = [
        { icon: Zap, label: "Performance", desc: "Core Web Vitals & load speed", color: "#ff6b6b", checks: 12, details: ["LCP", "FID", "CLS", "TTFB"] },
        { icon: Search, label: "SEO", desc: "Meta tags, structure & rankings", color: "#4ecdc4", checks: 15, details: ["Meta tags", "Headings", "Schema", "OG data"] },
        { icon: Smartphone, label: "UX / Mobile", desc: "Responsive design & usability", color: "#a78bfa", checks: 10, details: ["Viewport", "Touch", "A11y", "Layout"] },
        { icon: FileText, label: "Content", desc: "Quality, readability & structure", color: "#f59e0b", checks: 8, details: ["Readability", "Depth", "Dupes", "Structure"] },
    ];

    const steps = [
        {
            num: "01",
            icon: Globe,
            title: "Paste your URL",
            desc: "Enter any website address — we handle the rest. No sign-up required.",
        },
        {
            num: "02",
            icon: Brain,
            title: "AI analyzes everything",
            desc: "Our engine scrapes, audits, and runs your site through 50+ checks across 4 modules.",
        },
        {
            num: "03",
            icon: BarChart3,
            title: "Get your report",
            desc: "Receive a scored breakdown with prioritized fixes and AI-generated recommendations.",
        },
    ];

    const modules = [
        {
            icon: Gauge,
            color: "#ff6b6b",
            title: "Performance",
            subtitle: "Speed & Core Web Vitals",
            score: 87,
            checks: [
                { icon: Clock, label: "Largest Contentful Paint (LCP)" },
                { icon: Activity, label: "First Input Delay (FID)" },
                { icon: Zap, label: "Cumulative Layout Shift (CLS)" },
                { icon: Server, label: "Time to First Byte (TTFB)" },
            ],
            desc: "We measure real-world loading speed using Lighthouse metrics and flag the bottlenecks killing your user experience.",
        },
        {
            icon: Search,
            color: "#4ecdc4",
            title: "SEO",
            subtitle: "Search Engine Optimization",
            score: 92,
            checks: [
                { icon: Tag, label: "Meta titles & descriptions" },
                { icon: Layout, label: "Heading hierarchy (H1–H6)" },
                { icon: Image, label: "Image alt text & optimization" },
                { icon: Globe, label: "Open Graph & structured data" },
            ],
            desc: "From meta tags to schema markup — we audit everything search engines care about and score your discoverability.",
        },
        {
            icon: Smartphone,
            color: "#a78bfa",
            title: "UX & Mobile",
            subtitle: "Usability & Responsiveness",
            score: 78,
            checks: [
                { icon: Smartphone, label: "Mobile-friendly viewport" },
                { icon: Eye, label: "Tap target sizing" },
                { icon: Layout, label: "Responsive breakpoints" },
                { icon: Shield, label: "Accessibility (WCAG 2.1)" },
            ],
            desc: "We simulate real devices to check responsive layouts, touch targets, and WCAG accessibility compliance.",
        },
        {
            icon: FileText,
            color: "#f59e0b",
            title: "Content",
            subtitle: "Quality & Readability",
            score: 85,
            checks: [
                { icon: Type, label: "Flesch readability score" },
                { icon: FileText, label: "Word count & depth" },
                { icon: Eye, label: "Duplicate content detection" },
                { icon: Layout, label: "Content structure analysis" },
            ],
            desc: "We evaluate your copy for readability, keyword density, thin pages, and content structure that keeps visitors engaged.",
        },
    ];

    const sampleScores = [
        { label: "Performance", score: 87, color: "#ff6b6b" },
        { label: "SEO", score: 92, color: "#4ecdc4" },
        { label: "UX / Mobile", score: 78, color: "#a78bfa" },
        { label: "Content", score: 85, color: "#f59e0b" },
    ];

    const sampleIssues = [
        { severity: "critical", text: "LCP exceeds 4.0s — optimize hero image" },
        { severity: "warning", text: "3 images missing alt attributes" },
        { severity: "info", text: "Consider adding Open Graph meta tags" },
    ];

    return (
        <div className="landing-page">
            {/* ─── HERO ─── */}
            <section className="hero-section">
                {/* PixelBlast WebGL background — hero only */}
                <div className="pixel-blast-bg">
                    <PixelBlast
                        variant="square"
                        pixelSize={5}
                        color="#aee92b"
                        patternScale={2.5}
                        patternDensity={0.3}
                        pixelSizeJitter={0}
                        enableRipples
                        rippleSpeed={0.4}
                        rippleThickness={0.12}
                        rippleIntensityScale={1.5}
                        liquid={false}
                        liquidStrength={0.12}
                        liquidRadius={1.2}
                        liquidWobbleSpeed={5}
                        speed={0.4}
                        edgeFade={0.15}
                        centerFade={0.6}
                        transparent
                    />
                </div>
                <div className="hero-content">
                    <div className="badge">
                        <span className="badge-dot"></span>
                        AI-Powered · Free · Instant Results
                    </div>
                    <h1 className="hero-title">
                        Analyze any website<br />in <span className="highlight">seconds</span>
                    </h1>
                    <p className="hero-subtitle">
                        Deep-dive into Performance, SEO, UX &amp; Content — powered by AI that thinks like a senior engineer.
                    </p>

                    <form onSubmit={handleSubmit} className="url-form">
                        <input
                            type="url"
                            placeholder="Enter your website URL (https://...)"
                            className="url-input"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Scanning...' : (
                                <>Analyze <Search className="btn-icon" /></>
                            )}
                        </button>
                    </form>


                    <p className="hero-trust">
                        <Shield size={14} />
                        No sign-up required · Results in under 30 seconds
                    </p>
                </div>
            </section>

            {/* ─── FEATURES STRIP ─── */}
            <FeaturesAudit features={features} />

            {/* ─── HOW IT WORKS ─── */}
            <HowItWorks steps={steps} />

            {/* ─── DEEP DIVE MODULES ─── */}
            <DeepDiveSection modules={modules} />

            {/* ─── AI INSIGHTS ─── */}
            <AIInsightsSection />

            {/* ─── SAMPLE REPORT PREVIEW ─── */}
            <section className="report-section">
                <div className="container">
                    <div className="section-label">Sample Report</div>
                    <h2 className="section-title">See what you'll get</h2>
                    <p className="section-subtitle">
                        A full scored breakdown with prioritized issues and AI recommendations.
                    </p>

                    <div className="report-preview">
                        <div className="report-header-bar">
                            <div className="report-url">
                                <Globe size={14} />
                                <span>https://example.com</span>
                            </div>
                            <div className="report-overall">
                                <span className="report-overall-label">Overall Score</span>
                                <span className="report-overall-score">86</span>
                            </div>
                        </div>

                        <div className="report-scores">
                            {sampleScores.map((s, i) => (
                                <div key={i} className="report-score-item">
                                    <div className="report-score-bar-bg">
                                        <div
                                            className="report-score-bar-fill"
                                            style={{ width: `${s.score}%`, backgroundColor: s.color }}
                                        />
                                    </div>
                                    <div className="report-score-info">
                                        <span className="report-score-label">{s.label}</span>
                                        <span className="report-score-value" style={{ color: s.color }}>{s.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="report-issues">
                            <h4 className="report-issues-title">Top Issues Found</h4>
                            {sampleIssues.map((issue, i) => (
                                <div key={i} className={`report-issue report-issue-${issue.severity}`}>
                                    <span className="report-issue-dot" />
                                    <span>{issue.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── BOTTOM CTA ─── */}
            <section className="cta-section">
                <div className="container">
                    <h2 className="cta-title">
                        Ready to improve your website?
                    </h2>
                    <p className="cta-subtitle">
                        Paste your URL below and get a full AI-powered audit — free, instant, no sign-up.
                    </p>
                    <form onSubmit={handleSubmitBottom} className="url-form cta-form">
                        <input
                            type="url"
                            placeholder="https://yoursite.com"
                            className="url-input"
                            value={urlBottom}
                            onChange={(e) => setUrlBottom(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loadingBottom}>
                            {loadingBottom ? 'Scanning...' : (
                                <>Analyze Now <ArrowRight className="btn-icon" /></>
                            )}
                        </button>
                    </form>
                </div>
            </section>
            <Chatbot />
        </div>
    );
}

/* ─── FEATURES AUDIT COMPONENT ─── */
interface FeatureItem {
    icon: React.ElementType;
    label: string;
    desc: string;
    color: string;
    checks: number;
    details: string[];
}

function FeaturesAudit({ features }: { features: FeatureItem[] }) {
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [counts, setCounts] = useState(features.map(() => 0));
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // Animate counters when visible
    useEffect(() => {
        if (!isVisible) return;
        const targets = features.map(f => f.checks);
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts(targets.map(t => Math.round(t * eased)));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, features]);

    return (
        <section className={`features-section ${isVisible ? 'features-visible' : ''}`} ref={sectionRef}>
            <div className="container">
                <div className="section-label">What We Check</div>
                <h2 className="section-title">Everything we audit</h2>
                <p className="section-subtitle">One URL. Four critical dimensions. Actionable insights in seconds.</p>

                <div className="features-grid">
                    {features.map((item, i) => {
                        const Icon = item.icon;
                        const isHovered = hoveredIdx === i;
                        return (
                            <div
                                key={i}
                                className={`feat-card ${isHovered ? 'feat-card--hover' : ''}`}
                                style={{
                                    '--feat-color': item.color,
                                    '--feat-color-alpha': `${item.color}15`,
                                    animationDelay: `${i * 0.1}s`,
                                } as React.CSSProperties}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                {/* Top accent bar */}
                                <div className="feat-accent" />

                                {/* Icon + count row */}
                                <div className="feat-top">
                                    <div className="feat-icon-wrap">
                                        <Icon size={22} />
                                    </div>
                                    <div className="feat-counter">
                                        <span className="feat-counter-num">{counts[i]}+</span>
                                        <span className="feat-counter-label">checks</span>
                                    </div>
                                </div>

                                <h3 className="feat-label">{item.label}</h3>
                                <p className="feat-desc">{item.desc}</p>

                                {/* Reveal detail chips on hover */}
                                <div className="feat-details">
                                    {item.details.map((d, j) => (
                                        <span key={j} className="feat-chip" style={{ animationDelay: `${j * 0.05}s` }}>{d}</span>
                                    ))}
                                </div>

                                {/* Bottom arrow */}
                                <div className="feat-explore">
                                    <span>Explore</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Total checks badge */}
                <div className="features-total">
                    <span className="features-total-num">45+</span>
                    <span className="features-total-text">individual checks across all modules</span>
                </div>
            </div>
        </section>
    );
}

/* ─── INTERACTIVE AI-INSIGHTS COMPONENT ─── */
const aiRecommendations = [
    {
        title: 'Optimize hero image delivery',
        text: 'Your LCP is 4.2s, primarily caused by an uncompressed 2.4 MB hero image. Convert to WebP format and add loading="eager" with a <link rel="preload"> tag.',
        impact: '~1.8s faster LCP',
        tags: [{ label: 'Performance', color: '#ff6b6b' }, { label: 'SEO Impact', color: '#4ecdc4' }],
        severity: 'critical' as const,
    },
    {
        title: 'Add missing alt attributes',
        text: '3 images on your homepage lack descriptive alt text. This hurts accessibility scores and means screen readers skip important visuals.',
        impact: '+12 accessibility points',
        tags: [{ label: 'SEO', color: '#4ecdc4' }, { label: 'Accessibility', color: '#a78bfa' }],
        severity: 'warning' as const,
    },
    {
        title: 'Implement structured data',
        text: 'Your site has no JSON-LD schema markup. Adding Organization and WebPage schemas will improve rich snippet eligibility in Google results.',
        impact: 'Better SERP visibility',
        tags: [{ label: 'SEO', color: '#4ecdc4' }, { label: 'Content', color: '#f59e0b' }],
        severity: 'info' as const,
    },
];

function AIInsightsSection() {
    const [activeCard, setActiveCard] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [typedText, setTypedText] = useState('');
    const sectionRef = useRef<HTMLElement>(null);
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // Auto-cycle cards
    useEffect(() => {
        if (!isVisible) return;
        autoRef.current = setInterval(() => {
            setActiveCard(prev => (prev + 1) % aiRecommendations.length);
        }, 5000);
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, [isVisible]);

    // Typing effect for the active card's text
    useEffect(() => {
        const rec = aiRecommendations[activeCard];
        setTypedText('');
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setTypedText(rec.text.slice(0, i));
            if (i >= rec.text.length) clearInterval(interval);
        }, 12);
        return () => clearInterval(interval);
    }, [activeCard]);

    const handleCardClick = (i: number) => {
        setActiveCard(i);
        if (autoRef.current) clearInterval(autoRef.current);
        autoRef.current = setInterval(() => {
            setActiveCard(prev => (prev + 1) % aiRecommendations.length);
        }, 5000);
    };

    const rec = aiRecommendations[activeCard];

    return (
        <section className={`ai-section ${isVisible ? 'ai-visible' : ''}`} ref={sectionRef}>
            <div className="container">
                <div className="section-label">AI-Powered Engine</div>
                <h2 className="section-title">Not just scores — <span className="highlight">intelligent recommendations</span></h2>
                <p className="section-subtitle">
                    We feed every audit result into an LLM that understands web development context.
                </p>

                <div className="ai-layout">
                    {/* Left: feature highlights */}
                    <div className="ai-features-col">
                        <div className="ai-feature-pill">
                            <div className="ai-pill-icon"><Sparkles size={18} /></div>
                            <div>
                                <h4 className="ai-pill-title">Priority Ranking</h4>
                                <p className="ai-pill-desc">Fix what matters first — issues ranked by real-world impact on your users.</p>
                            </div>
                        </div>
                        <div className="ai-feature-pill">
                            <div className="ai-pill-icon"><MessageSquareCode size={18} /></div>
                            <div>
                                <h4 className="ai-pill-title">Plain-English Fixes</h4>
                                <p className="ai-pill-desc">No cryptic error codes — get actionable explanations a junior dev can follow.</p>
                            </div>
                        </div>
                        <div className="ai-feature-pill">
                            <div className="ai-pill-icon"><Workflow size={18} /></div>
                            <div>
                                <h4 className="ai-pill-title">Cross-Module Insights</h4>
                                <p className="ai-pill-desc">See how Performance bottlenecks affect SEO, and UX issues impact Content reach.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: interactive AI card */}
                    <div className="ai-card-col">
                        {/* Card selector dots */}
                        <div className="ai-card-dots">
                            {aiRecommendations.map((_, i) => (
                                <button
                                    key={i}
                                    className={`ai-dot ${i === activeCard ? 'ai-dot--active' : ''}`}
                                    onClick={() => handleCardClick(i)}
                                />
                            ))}
                        </div>

                        <div className="ai-terminal" key={activeCard}>
                            <div className="ai-terminal-bar">
                                <span className="demo-dot demo-dot--red" />
                                <span className="demo-dot demo-dot--yellow" />
                                <span className="demo-dot demo-dot--green" />
                                <div className="ai-terminal-title">
                                    <Brain size={14} />
                                    <span>AI Recommendation</span>
                                </div>
                            </div>
                            <div className="ai-terminal-body">
                                <div className="ai-terminal-severity">
                                    <span className={`ai-severity-dot ai-severity-dot--${rec.severity}`} />
                                    <span className="ai-severity-label">{rec.severity === 'critical' ? 'Critical' : rec.severity === 'warning' ? 'Warning' : 'Suggestion'}</span>
                                </div>
                                <h4 className="ai-terminal-heading">{rec.title}</h4>
                                <p className="ai-terminal-text">
                                    {typedText}<span className="ai-terminal-cursor" />
                                </p>
                                <div className="ai-terminal-impact">
                                    <Lightbulb size={14} />
                                    <span>Expected: <strong>{rec.impact}</strong></span>
                                </div>
                                <div className="ai-terminal-tags">
                                    {rec.tags.map((t, i) => (
                                        <span key={i} className="ai-terminal-tag" style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                                            {t.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── INTERACTIVE DEEP-DIVE COMPONENT ─── */
interface ModuleData {
    icon: React.ElementType;
    color: string;
    title: string;
    subtitle: string;
    score: number;
    checks: { icon: React.ElementType; label: string }[];
    desc: string;
}

function DeepDiveSection({ modules }: { modules: ModuleData[] }) {
    const [activeTab, setActiveTab] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const mod = modules[activeTab];
    const ModIcon = mod.icon;
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (mod.score / 100) * circumference;

    return (
        <section className={`modules-section ${isVisible ? 'modules-visible' : ''}`} ref={sectionRef}>
            <div className="container">
                <div className="section-label">Deep Dive</div>
                <h2 className="section-title">Four pillars of website health</h2>
                <p className="section-subtitle">
                    Each module runs specialized checks and generates AI-powered recommendations.
                </p>

                {/* Tab bar */}
                <div className="module-tabs">
                    {modules.map((m, i) => {
                        const TabIcon = m.icon;
                        return (
                            <button
                                key={i}
                                className={`module-tab ${i === activeTab ? 'module-tab--active' : ''}`}
                                onClick={() => setActiveTab(i)}
                                style={{
                                    '--tab-color': m.color,
                                    '--tab-color-alpha': `${m.color}20`,
                                } as React.CSSProperties}
                            >
                                <TabIcon size={18} />
                                <span>{m.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active module detail */}
                <div
                    className="module-detail"
                    key={activeTab}
                    style={{ '--mod-color': mod.color, '--mod-color-alpha': `${mod.color}15` } as React.CSSProperties}
                >
                    <div className="module-detail-left">
                        <div className="module-detail-header">
                            <div className="module-detail-icon" style={{ backgroundColor: `${mod.color}18`, color: mod.color }}>
                                <ModIcon size={28} />
                            </div>
                            <div>
                                <h3 className="module-detail-title">{mod.title}</h3>
                                <span className="module-detail-subtitle">{mod.subtitle}</span>
                            </div>
                        </div>
                        <p className="module-detail-desc">{mod.desc}</p>
                        <ul className="module-checks-animated">
                            {mod.checks.map((check, j) => {
                                const CheckIcon = check.icon;
                                return (
                                    <li key={`${activeTab}-${j}`} className="module-check-item" style={{ animationDelay: `${j * 0.1}s` }}>
                                        <span className="module-check-icon" style={{ color: mod.color }}>
                                            <CheckIcon size={15} />
                                        </span>
                                        <span className="module-check-label">{check.label}</span>
                                        <ChevronRight size={14} className="module-check-arrow" />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="module-detail-right">
                        <div className="module-score-ring">
                            <svg viewBox="0 0 88 88">
                                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                                <circle
                                    cx="44" cy="44" r="38" fill="none"
                                    stroke={mod.color} strokeWidth="5"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className="module-score-arc"
                                />
                            </svg>
                            <div className="module-score-inner">
                                <span className="module-score-value" style={{ color: mod.color }}>{mod.score}</span>
                                <span className="module-score-label">Score</span>
                            </div>
                        </div>
                        <div className="module-score-badge" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                            {mod.score >= 90 ? 'Excellent' : mod.score >= 80 ? 'Good' : mod.score >= 70 ? 'Needs Work' : 'Poor'}
                        </div>
                        <p className="module-score-hint">Sample score from a real audit</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── INTERACTIVE HOW-IT-WORKS COMPONENT ─── */
function HowItWorks({ steps }: { steps: { num: string; icon: React.ElementType; title: string; desc: string }[] }) {
    const [activeStep, setActiveStep] = useState(0);
    const [demoPhase, setDemoPhase] = useState<'idle' | 'typing' | 'scanning' | 'done'>('idle');
    const [typedUrl, setTypedUrl] = useState('');
    const [scanProgress, setScanProgress] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const demoUrl = 'https://mysite.com';

    // Intersection observer for entrance animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // Auto-cycle through steps
    useEffect(() => {
        if (!isVisible) return;
        autoPlayRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % 3);
        }, 4000);
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [isVisible]);

    // Sync demo animation with active step
    useEffect(() => {
        if (activeStep === 0) {
            setDemoPhase('typing');
            setTypedUrl('');
            setScanProgress(0);
            let i = 0;
            const interval = setInterval(() => {
                i++;
                setTypedUrl(demoUrl.slice(0, i));
                if (i >= demoUrl.length) clearInterval(interval);
            }, 80);
            return () => clearInterval(interval);
        } else if (activeStep === 1) {
            setDemoPhase('scanning');
            setScanProgress(0);
            let p = 0;
            const interval = setInterval(() => {
                p += 3;
                setScanProgress(Math.min(p, 100));
                if (p >= 100) clearInterval(interval);
            }, 60);
            return () => clearInterval(interval);
        } else {
            setDemoPhase('done');
            setScanProgress(100);
        }
    }, [activeStep]);

    const handleStepClick = (i: number) => {
        setActiveStep(i);
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % 3);
        }, 4000);
    };

    return (
        <section className={`how-section ${isVisible ? 'how-visible' : ''}`} ref={sectionRef}>
            <div className="container">
                <div className="section-label">How It Works</div>
                <h2 className="section-title">Three steps to a healthier website</h2>
                <p className="section-subtitle">
                    No installs, no config, no waiting. Just paste and go.
                </p>

                {/* Interactive steps */}
                <div className="steps-interactive">
                    {/* Connector line */}
                    <div className="steps-connector">
                        <div className="steps-connector-fill" style={{ width: `${activeStep * 50}%` }} />
                    </div>

                    <div className="steps-row">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            const state = i < activeStep ? 'completed' : i === activeStep ? 'active' : 'upcoming';
                            return (
                                <div
                                    key={i}
                                    className={`step-card step-card--${state}`}
                                    onClick={() => handleStepClick(i)}
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                >
                                    <div className="step-beacon">
                                        {state === 'completed' ? (
                                            <CheckCircle2 size={20} />
                                        ) : (
                                            <span className="step-num-circle">{step.num}</span>
                                        )}
                                    </div>
                                    <div className={`step-icon-wrapper step-icon-wrapper--${state}`}>
                                        <Icon size={28} />
                                    </div>
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-desc">{step.desc}</p>
                                    {i < steps.length - 1 && (
                                        <ArrowRight className="step-arrow" size={20} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Live mini-demo */}
                <div className="how-demo">
                    <div className="how-demo-window">
                        <div className="how-demo-titlebar">
                            <span className="demo-dot demo-dot--red" />
                            <span className="demo-dot demo-dot--yellow" />
                            <span className="demo-dot demo-dot--green" />
                            <span className="demo-titlebar-text">AI Web Analyser</span>
                        </div>
                        <div className="how-demo-body">
                            {demoPhase === 'typing' || demoPhase === 'idle' ? (
                                <div className="demo-step-typing">
                                    <div className="demo-url-bar">
                                        <Globe size={14} className="demo-url-icon" />
                                        <span className="demo-url-text">{typedUrl}<span className="demo-cursor" /></span>
                                    </div>
                                    <p className="demo-hint">Paste any URL to start...</p>
                                </div>
                            ) : demoPhase === 'scanning' ? (
                                <div className="demo-step-scanning">
                                    <div className="demo-url-bar demo-url-bar--locked">
                                        <Globe size={14} className="demo-url-icon" />
                                        <span className="demo-url-text">{demoUrl}</span>
                                    </div>
                                    <div className="demo-progress-area">
                                        <Loader2 size={18} className="demo-spinner" />
                                        <span className="demo-scan-text">Analyzing {scanProgress > 50 ? 'SEO & Content' : 'Performance'}...</span>
                                    </div>
                                    <div className="demo-progress-bar">
                                        <div className="demo-progress-fill" style={{ width: `${scanProgress}%` }} />
                                    </div>
                                    <span className="demo-progress-pct">{scanProgress}%</span>
                                </div>
                            ) : (
                                <div className="demo-step-done">
                                    <div className="demo-score-ring">
                                        <svg viewBox="0 0 80 80">
                                            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                                            <circle cx="40" cy="40" r="34" fill="none" stroke="#aee92b" strokeWidth="6"
                                                strokeDasharray={`${86 * 2.136} ${214 - 86 * 2.136}`}
                                                strokeDashoffset="53.4" strokeLinecap="round"
                                                className="demo-score-arc" />
                                        </svg>
                                        <span className="demo-score-num">86</span>
                                    </div>
                                    <div className="demo-results">
                                        <div className="demo-result-row"><span>Performance</span><span style={{ color: '#ff6b6b' }}>87</span></div>
                                        <div className="demo-result-row"><span>SEO</span><span style={{ color: '#4ecdc4' }}>92</span></div>
                                        <div className="demo-result-row"><span>UX / Mobile</span><span style={{ color: '#a78bfa' }}>78</span></div>
                                        <div className="demo-result-row"><span>Content</span><span style={{ color: '#f59e0b' }}>85</span></div>
                                    </div>
                                    <CheckCircle2 size={16} className="demo-check" />
                                    <span className="demo-done-text">Analysis complete!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
