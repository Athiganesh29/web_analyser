/**
 * Batch Analyzer
 * Analyzes 3 competitor websites in parallel
 */

const { runAnalysisJob } = require('../jobRunner');

/**
 * Analyze 3 competitors in parallel
 * @param {Array<string>} competitorUrls - Array of competitor URLs
 * @returns {Promise<Array>} Array of analysis reports
 */
async function analyze3Competitors(competitorUrls) {
  console.log('[BatchAnalyzer] Starting parallel analysis of 3 competitors...');
  
  const startTime = Date.now();
  
  // Normalize URLs - ensure they have https:// protocol
  const normalizedUrls = competitorUrls.slice(0, 3).map(url => {
    if (typeof url === 'string') {
      return url.startsWith('http') ? url : `https://${url}`;
    }
    return url;
  });
  
  console.log('[BatchAnalyzer] Normalized URLs:', normalizedUrls);
  
  // Run analyses in parallel with Promise.allSettled (handles failures gracefully)
  const analyses = await Promise.allSettled(
    normalizedUrls.map(url => 
      runAnalysisJob(url, { 
        isCompetitor: true,
        skipScreenshots: true,  // Save storage
        skipHTML: true,         // Save storage
        skipLighthouse: true    // Faster analysis
      })
    )
  );
  
  // Extract successful analyses
  const successfulAnalyses = analyses
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
  
  const failedCount = analyses.length - successfulAnalyses.length;
  
  if (failedCount > 0) {
    console.warn(`[BatchAnalyzer] ${failedCount} competitor(s) failed to analyze`);
  }
  
  // Need at least 2 competitors for meaningful comparison
  if (successfulAnalyses.length < 2) {
    throw new Error(`Failed to analyze enough competitors (only ${successfulAnalyses.length} succeeded)`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[BatchAnalyzer] Completed ${successfulAnalyses.length} analyses in ${duration}s`);
  
  return successfulAnalyses.slice(0, 3);
}

module.exports = {
  analyze3Competitors
};
