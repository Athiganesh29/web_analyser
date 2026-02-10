const fetch = require('node-fetch');

class LLMService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile'; // Groq production model
  }

  async generateCompletion(prompt, systemPrompt = 'You are an expert web analysis AI assistant.') {
    // 1. Try Groq (Preferred)
    if (this.apiKey) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('[LLMService] Groq API request failed:', error);
      }
    }

    // 2. Try HuggingFace (Fallback/Alternative)
    if (process.env.HF_API_KEY) {
      try {
        console.log('[LLMService] Using HuggingFace Adapter...');
        const combinedPrompt = `${systemPrompt}\n\nTask: ${prompt}\n\nResponse:`;
        const hfModel = 'mistralai/Mistral-7B-Instruct-v0.1';

        const hfResp = await fetch(`https://router.huggingface.co/models/${hfModel}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: combinedPrompt,
            parameters: { max_new_tokens: 800, temperature: 0.7, return_full_text: false }
          })
        });

        if (!hfResp.ok) throw new Error(`HF API error: ${hfResp.status}`);
        const hfData = await hfResp.json();
        const generatedText = Array.isArray(hfData) ? hfData[0].generated_text : hfData.generated_text;
        return generatedText;
      } catch (hfError) {
        console.error('[LLMService] HuggingFace request failed:', hfError);
      }
    }

    // 3. Mock Fallback
    console.warn('[LLMService] No working AI provider found. Returning mock data.');
    return this._getMockResponse(prompt);
  }

  // --- Specific Recommendation Generators ---

  async generateOverallRecommendations(data) {
    const prompt = `Analyze this website data and provide an executive summary, top 3 priorities, and quick wins. Data: ${JSON.stringify(data).substring(0, 2000)}`;
    return this.generateCompletion(prompt, 'You are a senior web strategist. Provide concise, high-impact recommendations.');
  }

  async generateSEORecommendations(seoData) {
    const prompt = `Analyze these SEO metrics and suggest 3 key improvements. Data: ${JSON.stringify(seoData).substring(0, 1500)}`;
    return this.generateCompletion(prompt, 'You are an SEO expert. Focus on actionable technical and content improvements.');
  }

  async generatePerformanceRecommendations(perfData) {
    const prompt = `Analyze these performance metrics (LCP, CLS, etc.) and suggest 3 code/infrastructure optimizations. Data: ${JSON.stringify(perfData).substring(0, 1500)}`;
    return this.generateCompletion(prompt, 'You are a web performance engineer. Focus on Core Web Vitals.');
  }

  async generateUXRecommendations(uxData) {
    const prompt = `Analyze these UX/accessibility issues and suggest improvements. Data: ${JSON.stringify(uxData).substring(0, 1500)}`;
    return this.generateCompletion(prompt, 'You are a UX/UI designer and accessibility specialist.');
  }

  async generateContentRecommendations(contentData) {
    const prompt = `Analyze this content structure and quality metrics. Suggest improvements for engagement and readability. Data: ${JSON.stringify(contentData).substring(0, 1500)}`;
    return this.generateCompletion(prompt, 'You are a content strategist and copywriter.');
  }

  // --- Mock Fallback ---

  _getMockResponse(prompt) {
    return "AI insights unavailable (Check GROQ_API_KEY). Here is a generic recommendation: Focus on improving Core Web Vitals and ensuring high-quality, unique content.";
  }
}

module.exports = new LLMService();
