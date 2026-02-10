/**
 * Competitor Comparison Model
 * Stores 3:1 competitor analysis results
 */

const mongoose = require('mongoose');

const CompetitorComparisonSchema = new mongoose.Schema({
  // User's report reference
  user_report_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true
  },
  
  user_domain: {
    type: String,
    required: true
  },
  
  // 3:1 Ratio identifier
  analysis_ratio: {
    type: String,
    default: '3:1'
  },
  
  // Competitor reports
  competitors: [{
    domain: String,
    report_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    },
    discovery_method: {
      type: String,
      enum: ['ai', 'manual', 'fallback'],
      default: 'ai'
    },
    rank: Number,
    reason: String
  }],
  
  // AI-Generated Comparison
  comparison: {
    overall_ranking: [mongoose.Schema.Types.Mixed],
    your_competitive_position: mongoose.Schema.Types.Mixed,
    category_comparison: mongoose.Schema.Types.Mixed,
    strengths: [String],
    weaknesses: [String],
    quick_wins: [String],
    strategic_gaps: [mongoose.Schema.Types.Mixed],
    competitive_opportunities: [mongoose.Schema.Types.Mixed]
  },
  
  // Metadata
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expires_at: {
    type: Date,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for efficient querying
CompetitorComparisonSchema.index({ user_report_id: 1, created_at: -1 });
CompetitorComparisonSchema.index({ user_domain: 1, created_at: -1 });

// Method to check if comparison is stale
CompetitorComparisonSchema.methods.isStale = function() {
  return Date.now() > this.expires_at;
};

const CompetitorComparison = mongoose.model('CompetitorComparison', CompetitorComparisonSchema);

module.exports = CompetitorComparison;
