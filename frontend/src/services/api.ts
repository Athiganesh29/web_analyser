import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    timeout: 120000, // 2 minutes for analysis
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface AnalyzeRequest {
    url: string;
    emulateMobile?: boolean;
}

export interface AnalyzeResponse {
    success: boolean;
    jobId: string;
    reportId: string;
    url: string;
    final_url: string;
    duration_ms: number;
    website_health_score: number;
    health_grade: string;
    module_scores: {
        performance: number;
        ux: number;
        seo: number;
        content: number;
    };
    dominant_risk_domains: string[];
    action_recommendation: string;
}

export interface Report {
    _id: string;
    request_id: string;
    url: string;
    final_url: string;
    status: string;
    created_at: string;
    finished_at: string;

    modules: {
        performance: any;
        ux: any;
        seo: any;
        content: any;
    };

    aggregator: {
        website_health_score: number;
        health_grade: string;
        dominant_risk_domains: string[];
        fix_priority_order: any[];
        overall_risk_level: string;
        action_recommendation_flag: string;
        module_scores: {
            performance: number;
            ux: number;
            seo: number;
            content: number;
        };
    };

    ai_insights?: {
        executiveSummary: string;
        topPriorities: Array<{ title: string; impact: string; description: string; estimatedROI: string }>;
        quickWins: string[];
        longTermGoals: string[];
    };
    raw_artifacts?: any;
}

// Analyze a website
export const analyzeWebsite = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const response = await api.post('/api/analyze', data);
    return response.data;
};

// Analyze specific module
export const analyzeModule = async (moduleName: string, data: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const response = await api.post(`/api/analyze/${moduleName.toLowerCase()}`, data);
    return response.data;
};

// Get report by ID
export const getReport = async (reportId: string): Promise<Report> => {
    const response = await api.get(`/api/reports/${reportId}`);
    return response.data;
};

// Get job status
export const getJobStatus = async (jobId: string) => {
    const response = await api.get(`/api/job/${jobId}/status`);
    return response.data;
};

export default api;

