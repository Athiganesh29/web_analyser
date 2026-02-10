/**
 * Comparative Analyzer
 * Generates AI-powered comparison between user site and 3 competitors
 */

const llmService = require('../ai/llmService');

/**
 * Generate 1 vs 3 comparison
 * @param {Object} userReport - User's analysis report
 * @param {Array<Object>} competitorReports - Array of competitor reports
 * @returns {Promise<Object>} Comparison insights
 */
async function generateComparison(userReport, competitorReports) {
  console.log('[ComparativeAnalyzer] Generating 1 vs 3 comparison...');
  
  try {
    // Build comparison prompt
    const prompt = buildComparisonPrompt(userReport, competitorReports);
    
    // Get AI analysis
    const aiResponse = await llmService.generateCompletion(prompt);
    
    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const comparison = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!comparison.overall_ranking || !comparison.your_competitive_position) {
      throw new Error('Invalid comparison structure');
    }
    
    console.log('[ComparativeAnalyzer] Comparison generated successfully');
    return comparison;
    
  } catch (error) {
    console.error('[ComparativeAnalyzer] Failed:', error.message);
    return generateFallbackComparison(userReport, competitorReports);
  }
}

/**
 * Build AI comparison prompt
 */
function buildComparisonPrompt(userReport, competitorReports) {
  const userScore = userReport.aggregator?.website_health_score || 0;
  const userPerf = userReport.modules?.performance?.score || 0;
  const userSEO = userReport.modules?.seo?.score || 0;
  const userUX = userReport.modules?.ux?.score || 0;
  const userContent = userReport.modules?.content?.score || 0;
  
  let competitorData = '';
  competitorReports.forEach((comp, idx) => {
    const compScore = comp.aggregator?.website_health_score || 0;
    const compPerf = comp.modules?.performance?.score || 0;
    const compSEO = comp.modules?.seo?.score || 0;
    const compUX = comp.modules?.ux?.score || 0;
    const compContent = comp.modules?.content?.score || 0;
    
    competitorData += `
COMPETITOR ${idx + 1}: ${comp.url}
Health Score: ${compScore}/100
Performance: ${compPerf}/100
SEO: ${compSEO}/100
UX: ${compUX}/100
Content: ${compContent}/100
`;
  });
  
  return `
You are a competitive intelligence analyst. Compare this website against ${competitorReports.length} competitors.

YOUR WEBSITE: ${userReport.url}
Health Score: ${userScore}/100
Performance: ${userPerf}/100
SEO: ${userSEO}/100
UX: ${userUX}/100
Content: ${userContent}/100

${competitorData}

Provide strategic analysis in JSON:
{
  "overall_ranking": [
    {"position": 1, "domain": "site.com", "score": 85}
  ],
  "your_competitive_position": {
    "rank": 2,
    "score": ${userScore},
    "percentile": "Top 50%",
    "summary": "Brief summary"
  },
  "category_comparison": {
    "performance": {"your_score": ${userPerf}, "competitor_avg": 70, "status": "winning", "advantage": "+5 points"},
    "seo": {"your_score": ${userSEO}, "competitor_avg": 75, "status": "losing", "gap": "-10 points"},
    "ux": {"your_score": ${userUX}, "competitor_avg": 72, "status": "neutral", "advantage": "+3 points"},
    "content": {"your_score": ${userContent}, "competitor_avg": 68, "status": "winning", "advantage": "+7 points"}
  },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "quick_wins": ["quick win 1", "quick win 2"],
  "strategic_gaps": [
    {"area": "SEO", "current": ${userSEO}, "competitor_best": 85, "gap": 20, "action": "action", "priority": "high"}
  ],
  "competitive_opportunities": [
    {"opportunity": "title", "insight": "insight", "recommendation": "recommendation", "impact": "high"}
  ]
}
`;
}

/**
 * Generate fallback comparison (rule-based)
 */
function generateFallbackComparison(userReport, competitorReports) {
  console.log('[ComparativeAnalyzer] Using fallback comparison');
  
  const userScore = userReport.aggregator?.website_health_score || 0;
  const allScores = [
    { domain: userReport.url, score: userScore, isUser: true },
    ...competitorReports.map(c => ({
      domain: c.url,
      score: c.aggregator?.website_health_score || 0,
      isUser: false
    }))
  ];
  
  // Sort by score
  allScores.sort((a, b) => b.score - a.score);
  const userRank = allScores.findIndex(s => s.isUser) + 1;
  
  return {
    overall_ranking: allScores.map((s, idx) => ({
      position: idx + 1,
      domain: s.domain,
      score: s.score
    })),
    your_competitive_position: {
      rank: userRank,
      score: userScore,
      percentile: `Top ${Math.round((userRank / allScores.length) * 100)}%`,
      summary: `You rank ${userRank} out of ${allScores.length} websites analyzed`
    },
    category_comparison: {},
    strengths: ['Analysis completed'],
    weaknesses: ['Detailed AI analysis unavailable'],
    quick_wins: ['Review competitor reports for insights'],
    strategic_gaps: [],
    competitive_opportunities: []
  };
}

module.exports = {
  generateComparison
};
