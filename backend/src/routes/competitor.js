/**
 * Competitor Analysis Routes
 * API endpoints for 3:1 competitor analysis
 */

const express = require('express');
const router = express.Router();
const { discoverTop3Competitors } = require('../services/competitor/discoveryService');
const { analyze3Competitors } = require('../services/competitor/batchAnalyzer');
const { generateComparison } = require('../services/competitor/comparativeAnalyzer');
const Report = require('../models/Report');
const CompetitorComparison = require('../models/CompetitorComparison');

/**
 * POST /api/competitor/analyze-3-1
 * Main endpoint: Analyze 3 competitors + 1 user (3:1 ratio)
 */
router.post('/analyze-3-1', async (req, res) => {
  try {
    const { userReportId } = req.body;
    
    if (!userReportId) {
      return res.status(400).json({ error: 'userReportId is required' });
    }
    
    console.log(`[Competitor API] Starting 3:1 analysis for report: ${userReportId}`);
    
    // 1. Get user report
    const userReport = await Report.findById(userReportId);
    if (!userReport) {
      return res.status(404).json({ error: 'User report not found' });
    }
    
    // Create comparison record
    const competitorComparison = new CompetitorComparison({
      user_report_id: userReportId,
      user_domain: userReport.url,
      status: 'analyzing'
    });
    await competitorComparison.save();
    
    // Return immediately with comparison ID (analysis runs in background)
    res.json({
      success: true,
      comparisonId: competitorComparison._id,
      status: 'analyzing',
      message: 'Competitor analysis started. Check status at /api/competitor/comparison/:id'
    });
    
    // Run analysis asynchronously
    (async () => {
      try {
        // 2. Discover top 3 competitors
        const competitors = await discoverTop3Competitors(
          userReport.url,
          userReport
        );
        
        console.log(`[Competitor API] Discovered competitors:`, competitors.map(c => c.domain));
        
        // 3. Analyze 3 competitors in parallel
        const competitorReports = await analyze3Competitors(
          competitors.map(c => c.domain)
        );
        
        // 4. Generate 1 vs 3 comparison
        const comparison = await generateComparison(
          userReport,
          competitorReports
        );
        
        // 5. Update comparison record
        competitorComparison.competitors = competitorReports.map((report, idx) => ({
          domain: report.url,
          report_id: report._id,
          discovery_method: competitors[idx]?.reason?.includes('Fallback') ? 'fallback' : 'ai',
          rank: idx + 1,
          reason: competitors[idx]?.reason || 'Competitor analysis'
        }));
        competitorComparison.comparison = comparison;
        competitorComparison.status = 'completed';
        
        await competitorComparison.save();
        
        console.log(`[Competitor API] Analysis completed for: ${competitorComparison._id}`);
        
      } catch (error) {
        console.error('[Competitor API] Analysis failed:', error);
        competitorComparison.status = 'failed';
        await competitorComparison.save();
      }
    })();
    
  } catch (error) {
    console.error('[Competitor API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitor/comparison/:id
 * Get competitor comparison report
 */
router.get('/comparison/:id', async (req, res) => {
  try {
    const comparison = await CompetitorComparison.findById(req.params.id)
      .populate('user_report_id')
      .populate('competitors.report_id');
    
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }
    
    res.json({ comparison });
    
  } catch (error) {
    console.error('[Competitor API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/competitor/by-report/:reportId
 * Get latest comparison for a report
 */
router.get('/by-report/:reportId', async (req, res) => {
  try {
    const comparison = await CompetitorComparison.findOne({
      user_report_id: req.params.reportId
    })
      .sort({ created_at: -1 })
      .populate('user_report_id')
      .populate('competitors.report_id');
    
    if (!comparison) {
      return res.status(404).json({ error: 'No comparison found for this report' });
    }
    
    res.json({ comparison });
    
  } catch (error) {
    console.error('[Competitor API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
