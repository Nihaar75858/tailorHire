// ============================================
// src/services/api.js
// ============================================
import { API_BASE_URL } from "../utils/constants";

export class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem("accessToken");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("accessToken", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("accessToken");
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Data:', data);
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async logout() {
    this.clearToken();
  }

  // Jobs endpoints
  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobs/${queryString ? `?${queryString}` : ""}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}/`);
  }

  // Saved Jobs endpoints
  async saveJob(jobId) {
    return this.request('/saved-jobs/', {
      method: 'POST',
      body: JSON.stringify({ job: jobId }),
    });
  }

  async getSavedJobs() {
    return this.request('/saved-jobs/');
  }

  async removeSavedJob(jobId) {
    return this.request('/saved-jobs/remove/', {
      method: 'DELETE',
      body: JSON.stringify({ job: jobId }),
    });
  }
}

export default new ApiService();
