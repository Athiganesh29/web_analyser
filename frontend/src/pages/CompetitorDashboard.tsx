import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CompetitorDashboard.css';

interface CompetitorComparison {
    _id: string;
    user_domain: string;
    status: string;
    competitors: Array<{
        domain: string;
        rank: number;
        reason: string;
    }>;
    comparison: {
        overall_ranking: Array<{
            position: number;
            domain: string;
            score: number;
        }>;
        your_competitive_position: {
            rank: number;
            score: number;
            percentile: string;
            summary: string;
        };
        category_comparison: any;
        strengths: string[];
        weaknesses: string[];
        quick_wins: string[];
        strategic_gaps: any[];
        competitive_opportunities: any[];
    };
}

export function CompetitorDashboard() {
    const { comparisonId } = useParams();
    const navigate = useNavigate();
    const [comparison, setComparison] = useState<CompetitorComparison | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        let pollInterval: number | null = null;

        const fetchComparison = async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/competitor/comparison/${comparisonId}`);
                const data = await response.json();
                console.log('[CompetitorDashboard] Fetched data:', data);

                if (!isMounted) return;

                // API returns { comparison: {...} }
                if (data.comparison) {
                    setComparison(data.comparison);
                    setLoading(false);

                    // Stop polling if analysis is complete
                    if (data.comparison.status === 'completed' && pollInterval) {
                        console.log('[CompetitorDashboard] Analysis completed, stopping poll');
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                } else {
                    setError('Invalid response format');
                    setLoading(false);
                }
            } catch (err) {
                console.error('[CompetitorDashboard] Fetch error:', err);
                if (isMounted) {
                    setError('Failed to load comparison');
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchComparison();

        // Set up polling every 3 seconds
        pollInterval = setInterval(() => {
            console.log('[CompetitorDashboard] Polling for updates...');
            fetchComparison();
        }, 3000);

        // Cleanup
        return () => {
            isMounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [comparisonId]);

    if (loading) {
        return (
            <div className="competitor-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>Analyzing Competitors...</h2>
                    <p>This may take 30-60 seconds</p>
                </div>
            </div>
        );
    }

    if (error || !comparison) {
        return (
            <div className="competitor-dashboard">
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error || 'Comparison not found'}</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    if (comparison.status === 'analyzing') {
        return (
            <div className="competitor-dashboard">
                <div className="analyzing-state">
                    <div className="spinner"></div>
                    <h2>🔍 Analyzing Competitors</h2>
                    <p>Discovering and analyzing top 3 competitors...</p>
                    <div className="progress-steps">
                        <div className="step completed">✓ User site analyzed</div>
                        <div className="step active">⏳ Finding competitors</div>
                        <div className="step">Analyzing competitors</div>
                        <div className="step">Generating insights</div>
                    </div>
                </div>
            </div>
        );
    }

    const { overall_ranking, your_competitive_position, category_comparison, strengths, weaknesses, quick_wins } = comparison.comparison;

    return (
        <div className="competitor-dashboard">
            <header className="competitor-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                <div>
                    <h1>🏆 Competitive Analysis</h1>
                    <p className="subtitle">Your Site vs 3 Top Competitors</p>
                </div>
            </header>

            {/* Overall Ranking */}
            <section className="ranking-section">
                <h2>Overall Ranking</h2>
                <div className="ranking-list">
                    {overall_ranking?.map((item: any) => (
                        <div key={item.position} className={`ranking-item ${item.domain === comparison.user_domain ? 'user-site' : ''}`}>
                            <div className="rank-badge">{item.position}</div>
                            <div className="rank-details">
                                <span className="domain">{item.domain}</span>
                                {item.domain === comparison.user_domain && <span className="you-badge">YOU</span>}
                            </div>
                            <div className="score-bar">
                                <div className="score-fill" style={{ width: `${item.score}%` }}></div>
                            </div>
                            <span className="score-value">{item.score}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Your Position */}
            <section className="position-section">
                <h2>Your Competitive Position</h2>
                <div className="position-card">
                    <div className="position-stat">
                        <span className="stat-label">Rank</span>
                        <span className="stat-value">#{your_competitive_position?.rank}</span>
                    </div>
                    <div className="position-stat">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{your_competitive_position?.score}/100</span>
                    </div>
                    <div className="position-stat">
                        <span className="stat-label">Percentile</span>
                        <span className="stat-value">{your_competitive_position?.percentile}</span>
                    </div>
                </div>
                <p className="position-summary">{your_competitive_position?.summary}</p>
            </section>

            {/* Category Comparison */}
            {category_comparison && (
                <section className="category-section">
                    <h2>Category Comparison</h2>
                    <div className="category-grid">
                        {Object.entries(category_comparison).map(([category, data]: [string, any]) => (
                            <div key={category} className={`category-card ${data.status}`}>
                                <h3>{category.toUpperCase()}</h3>
                                <div className="category-scores">
                                    <div className="your-score">
                                        <span className="label">You</span>
                                        <span className="value">{data.your_score}</span>
                                    </div>
                                    <div className="avg-score">
                                        <span className="label">Avg</span>
                                        <span className="value">{data.competitor_avg}</span>
                                    </div>
                                </div>
                                <div className={`status-badge ${data.status}`}>
                                    {data.status === 'winning' ? '✓ Winning' : data.status === 'losing' ? '✗ Behind' : '~ Neutral'}
                                </div>
                                <p className="advantage">{data.advantage || data.gap}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Strengths & Weaknesses */}
            <div className="insights-grid">
                <section className="strengths-section">
                    <h2>💪 Your Strengths</h2>
                    <ul>
                        {strengths?.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                        ))}
                    </ul>
                </section>

                <section className="weaknesses-section">
                    <h2>⚠️ Areas to Improve</h2>
                    <ul>
                        {weaknesses?.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* Quick Wins */}
            <section className="quick-wins-section">
                <h2>🚀 Quick Wins (Beat Competitors)</h2>
                <div className="quick-wins-list">
                    {quick_wins?.map((win, idx) => (
                        <div key={idx} className="quick-win-item">
                            <span className="win-icon">✓</span>
                            <span>{win}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Competitors List */}
            <section className="competitors-list-section">
                <h2>Analyzed Competitors</h2>
                <div className="competitors-grid">
                    {comparison.competitors.map((comp, idx) => (
                        <div key={idx} className="competitor-card">
                            <div className="competitor-rank">#{comp.rank}</div>
                            <h3>{comp.domain}</h3>
                            <p className="competitor-reason">{comp.reason}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default CompetitorDashboard;
