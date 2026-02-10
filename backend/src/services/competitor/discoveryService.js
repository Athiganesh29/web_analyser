/**
 * Competitor Discovery Service
 * Finds top 3 competitors for a given website using AI
 */

const llmService = require('../ai/llmService');

// Fallback competitors by industry
const FALLBACK_COMPETITORS = {
  'ecommerce': ['amazon.com', 'flipkart.com', 'myntra.com'],
  'food-delivery': ['swiggy.com', 'zomato.com', 'ubereats.com'],
  'furniture': ['urbanladder.com', 'pepperfry.com', 'ikea.com'],
  'saas': ['salesforce.com', 'hubspot.com', 'zendesk.com'],
  'default': ['example1.com', 'example2.com', 'example3.com']
};

/**
 * Discover top 3 competitors using AI
 * @param {string} userDomain - User's website domain
 * @param {Object} userReport - User's analysis report
 * @returns {Promise<Array>} Array of 3 competitor objects
 */
async function discoverTop3Competitors(userDomain, userReport) {
  try {
    console.log(`[DiscoveryService] Finding competitors for: ${userDomain}`);
    
    // Extract context from user's report
    const userKeywords = userReport.modules?.content?.keywords || [];
    const userTitle = userReport.raw_artifacts?.seo_raw?.title || '';
    const userDescription = userReport.raw_artifacts?.seo_raw?.meta_description || '';
    
    // AI Prompt
    const prompt = `
Analyze this website and identify exactly 3 direct competitors:

Domain: ${userDomain}
Title: ${userTitle}
Description: ${userDescription}
Keywords: ${userKeywords.slice(0, 10).map(k => k.word || k).join(', ')}

Return ONLY valid JSON with exactly 3 competitors:
{
  "industry": "specific industry name",
  "competitors": [
    {"domain": "competitor1.com", "reason": "why they compete"},
    {"domain": "competitor2.com", "reason": "why they compete"},
    {"domain": "competitor3.com", "reason": "why they compete"}
  ]
}
`;

    const aiResponse = await llmService.generateCompletion(prompt);
    
    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    const competitors = parsed.competitors || [];
    
    if (competitors.length >= 2) {
      console.log(`[DiscoveryService] Found ${competitors.length} competitors via AI`);
      return competitors.slice(0, 3);
    } else {
      throw new Error('Not enough competitors found');
    }
    
  } catch (error) {
    console.error('[DiscoveryService] AI discovery failed:', error.message);
    return useFallbackCompetitors(userDomain);
  }
}

/**
 * Use fallback competitor list
 * @param {string} userDomain - User's domain
 * @returns {Array} Fallback competitors
 */
function useFallbackCompetitors(userDomain) {
  console.log('[DiscoveryService] Using fallback competitors');
  
  // Try to guess industry from domain
  let industry = 'default';
  if (userDomain.includes('food') || userDomain.includes('restaurant')) {
    industry = 'food-delivery';
  } else if (userDomain.includes('shop') || userDomain.includes('store')) {
    industry = 'ecommerce';
  } else if (userDomain.includes('furniture') || userDomain.includes('home')) {
    industry = 'furniture';
  }
  
  const fallbackDomains = FALLBACK_COMPETITORS[industry] || FALLBACK_COMPETITORS.default;
  
  return fallbackDomains.map(domain => ({
    domain,
    reason: 'Fallback competitor (AI discovery unavailable)'
  }));
}

module.exports = {
  discoverTop3Competitors
};
