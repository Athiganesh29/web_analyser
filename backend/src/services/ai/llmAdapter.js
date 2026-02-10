/**
 * HuggingFace API Adapter
 * Provides unified interface for LLM calls, embeddings, summarization, and NER
 */

const fetch = require('node-fetch');

const HF_API_BASE = 'https://router.huggingface.co';
const HF_API_KEY = process.env.HF_API_KEY;

// Model configurations
const MODELS = {
  summarization: 'sshleifer/distilbart-cnn-12-6',
  embeddings: 'sentence-transformers/all-MiniLM-L6-v2',
  ner: 'dbmdz/bert-large-cased-finetuned-conll03-english',
  textGeneration: 'mistralai/Mistral-7B-Instruct-v0.1'
};

/**
 * Call HuggingFace Inference API
 * @param {string} model - Model ID
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} API response
 */
async function callHF(model, payload) {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY not configured in environment');
  }

  const response = await fetch(`${HF_API_BASE}/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate text summary
 * @param {string} text - Text to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summary text
 */
async function summarize(text, options = {}) {
  try {
    const maxLength = options.maxLength || 150;
    const minLength = options.minLength || 50;

    // Truncate input if too long (model limit ~1024 tokens)
    const truncatedText = text.slice(0, 10000);

    const result = await callHF(MODELS.summarization, {
      inputs: truncatedText,
      parameters: {
        max_length: maxLength,
        min_length: minLength,
        do_sample: false
      }
    });

    return Array.isArray(result) ? result[0].summary_text : result.summary_text;
  } catch (error) {
    console.error('Summarization failed:', error.message);
    // Fallback: return first N words
    return text.split(/\s+/).slice(0, 50).join(' ') + '...';
  }
}

/**
 * Generate text embeddings
 * @param {string|string[]} text - Text or array of texts to embed
 * @returns {Promise<number[]|number[][]>} Embedding vector(s)
 */
async function embed(text) {
  try {
    const inputs = Array.isArray(text) ? text : [text];
    
    const result = await callHF(MODELS.embeddings, {
      inputs: inputs,
      options: { wait_for_model: true }
    });

    return Array.isArray(text) ? result : result[0];
  } catch (error) {
    console.error('Embedding failed:', error.message);
    return null;
  }
}

/**
 * Named Entity Recognition
 * @param {string} text - Text to analyze
 * @returns {Promise<Object[]>} Array of entities with type and score
 */
async function extractEntities(text) {
  try {
    // Truncate to avoid token limits
    const truncatedText = text.slice(0, 5000);

    const result = await callHF(MODELS.ner, {
      inputs: truncatedText
    });

    // Group consecutive entities of same type
    const entities = [];
    let currentEntity = null;

    for (const item of result) {
      if (item.entity.startsWith('B-')) {
        // Beginning of new entity
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          text: item.word.replace('##', ''),
          type: item.entity.slice(2), // Remove B- prefix
          score: item.score
        };
      } else if (item.entity.startsWith('I-') && currentEntity) {
        // Inside entity - append
        currentEntity.text += item.word.replace('##', '');
        currentEntity.score = (currentEntity.score + item.score) / 2;
      }
    }

    if (currentEntity) {
      entities.push(currentEntity);
    }

    return entities;
  } catch (error) {
    console.error('NER failed:', error.message);
    return [];
  }
}

/**
 * Generate module recommendations using LLM
 * @param {string} moduleName - Module name (performance, ux, seo, content)
 * @param {Object} inputData - Module-specific input data
 * @returns {Promise<Object>} Structured recommendations
 */
async function generateRecommendations(moduleName, inputData) {
  try {
    const prompt = constructPrompt(moduleName, inputData);
    
    const result = await callHF(MODELS.textGeneration, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3,
        return_full_text: false
      }
    });

    const generatedText = Array.isArray(result) ? result[0].generated_text : result.generated_text;
    
    // Try to parse JSON from response
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse LLM JSON response');
    }

    // Fallback to rule-based
    return ruleBasedFallback(moduleName, inputData);
  } catch (error) {
    console.error('LLM generation failed:', error.message);
    return ruleBasedFallback(moduleName, inputData);
  }
}

/**
 * Construct prompt for module analysis
 * @param {string} moduleName - Module name
 * @param {Object} inputData - Input data
 * @returns {string} Formatted prompt
 */
function constructPrompt(moduleName, inputData) {
  const prompts = {
    performance: `You are a Performance Intelligence Module. Analyze the following metrics and return ONLY valid JSON.

Input metrics:
${JSON.stringify(inputData, null, 2)}

Return JSON with this exact structure:
{
  "predicted_performance_score": <number 0-100>,
  "dominant_negative_factors": [{"factor": "LCP", "value": <number>}],
  "confidence_level": "low|medium|high",
  "recommendation_flag": "skip_lighthouse|run_lighthouse|use_as_final"
}`,

    ux: `You are a UX & Accessibility Module. Analyze the following data and return ONLY valid JSON.

Input data:
${JSON.stringify(inputData, null, 2)}

Return JSON with this exact structure:
{
  "ux_score": <number 0-100>,
  "accessibility_risk_level": "low|medium|high",
  "primary_friction_sources": [<string>],
  "trust_impact_indicator": "low|medium|high",
  "ux_recommendation_flag": "minor_fixes|priority_fixes|critical_fixes"
}`,

    seo: `You are an SEO Module. Analyze the following SEO data and return ONLY valid JSON.

Input data:
${JSON.stringify(inputData, null, 2)}

Return JSON with this exact structure:
{
  "seo_score": <number 0-100>,
  "indexability_status": "good|partial|blocked",
  "primary_seo_risks": [<string>],
  "crawl_health_indicator": "low|medium|high",
  "seo_recommendation_flag": "minor_optimizations|priority_fixes|critical_seo_fixes"
}`,

    content: `You are a Content Module. Analyze the following content data and return ONLY valid JSON.

Input data:
${JSON.stringify(inputData, null, 2)}

Return JSON with this exact structure:
{
  "content_score": <number 0-100>,
  "intent_match_level": "high|medium|low",
  "content_depth_status": "thin|adequate|comprehensive",
  "primary_content_gaps": [<string>],
  "content_recommendation_flag": "minor_improvements|content_expansion_needed|critical_content_revision"
}`
  };

  return prompts[moduleName] || '';
}

/**
 * Rule-based fallback when LLM fails
 * @param {string} moduleName - Module name
 * @param {Object} inputData - Input data
 * @returns {Object} Basic recommendations
 */
function ruleBasedFallback(moduleName, inputData) {
  const fallbacks = {
    performance: {
      predicted_performance_score: 50,
      dominant_negative_factors: [{ factor: 'Unknown', value: 0 }],
      confidence_level: 'low',
      recommendation_flag: 'run_lighthouse'
    },
    ux: {
      ux_score: 50,
      accessibility_risk_level: 'medium',
      primary_friction_sources: ['Unable to analyze - using fallback'],
      trust_impact_indicator: 'medium',
      ux_recommendation_flag: 'priority_fixes'
    },
    seo: {
      seo_score: 50,
      indexability_status: 'partial',
      primary_seo_risks: ['Unable to analyze - using fallback'],
      crawl_health_indicator: 'medium',
      seo_recommendation_flag: 'priority_fixes'
    },
    content: {
      content_score: 50,
      intent_match_level: 'medium',
      content_depth_status: 'adequate',
      primary_content_gaps: ['Unable to analyze - using fallback'],
      content_recommendation_flag: 'minor_improvements'
    }
  };

  return fallbacks[moduleName] || {};
}

/**
 * Compute cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

module.exports = {
  summarize,
  embed,
  extractEntities,
  generateRecommendations,
  cosineSimilarity,
  MODELS
};
