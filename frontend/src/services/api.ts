import {
  GuidelineDocument,
  ApprovedFact,
  Review,
  ReviewListItem,
  SystemStatus,
  DemoScenario,
  DecisionStatus
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // System & Health
  async getHealth(): Promise<{ status: string; app: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/status`);
    return handleResponse<SystemStatus>(res);
  },

  // Guidelines
  async getGuidelines(): Promise<GuidelineDocument[]> {
    const res = await fetch(`${API_BASE}/guidelines`);
    return handleResponse<GuidelineDocument[]>(res);
  },

  async getGuideline(id: string): Promise<GuidelineDocument> {
    const res = await fetch(`${API_BASE}/guidelines/${id}`);
    return handleResponse<GuidelineDocument>(res);
  },

  async uploadGuidelinePDF(title: string, file: File): Promise<GuidelineDocument> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/guidelines/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<GuidelineDocument>(res);
  },

  async createManualGuideline(data: { title: string; content: string; approved_facts?: string[] }): Promise<GuidelineDocument> {
    const res = await fetch(`${API_BASE}/guidelines/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<GuidelineDocument>(res);
  },

  async deleteGuideline(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/guidelines/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  // Approved Facts
  async getApprovedFacts(): Promise<ApprovedFact[]> {
    const res = await fetch(`${API_BASE}/facts`);
    return handleResponse<ApprovedFact[]>(res);
  },

  async createApprovedFact(data: { fact_text: string; category?: string; source_reference?: string }): Promise<ApprovedFact> {
    const res = await fetch(`${API_BASE}/facts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<ApprovedFact>(res);
  },

  async deleteApprovedFact(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/facts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  // Reviews
  async startReview(data: {
    title: string;
    content_type: string;
    content: string;
    campaign_context?: string;
    analysis_mode?: string;
  }): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Review>(res);
  },

  async getReviews(): Promise<ReviewListItem[]> {
    const res = await fetch(`${API_BASE}/reviews`);
    return handleResponse<ReviewListItem[]>(res);
  },

  async getReview(id: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews/${id}`);
    return handleResponse<Review>(res);
  },

  async updateFindingDecision(
    reviewId: string,
    findingId: string,
    decisionStatus: DecisionStatus,
    customFix?: string
  ): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/findings/${findingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision_status: decisionStatus,
        user_custom_fix: customFix,
      }),
    });
    return handleResponse<Review>(res);
  },

  async updateRevisedContent(reviewId: string, revisedContent: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revised_content: revisedContent }),
    });
    return handleResponse<Review>(res);
  },

  async deleteReview(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  // Demo Scenarios
  async getDemoScenarios(): Promise<DemoScenario[]> {
    const res = await fetch(`${API_BASE}/demo/scenarios`);
    return handleResponse<DemoScenario[]>(res);
  },

  async resetDemoData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
    });
    return handleResponse<{ message: string }>(res);
  },
};
