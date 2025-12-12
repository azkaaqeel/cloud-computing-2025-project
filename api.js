// API Integration Layer for HireHive Labs
// Base API URL - update this to match your backend
// Use full URL when backend runs on different port, or relative when same origin
const API_BASE_URL = window.API_BASE_URL || (window.location.port === '3000' ? '/api' : 'http://localhost:3000/api');

/**
 * Generate UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * API Helper - Handle fetch requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add auth token if available
    const token = localStorage.getItem('hr_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Jobs API
 */
const JobsAPI = {
    /**
     * Get all active jobs
     */
    async getActiveJobs() {
        try {
            return await apiRequest('/jobs');
        } catch (error) {
            // Mock data for development if API is not available
            console.warn('API not available, using mock data:', error);
            return [
                {
                    jobId: '550e8400-e29b-41d4-a716-446655440000',
                    title: 'Senior Software Engineer',
                    description: 'We are looking for an experienced software engineer to join our team.',
                    isActive: true
                },
                {
                    jobId: '550e8400-e29b-41d4-a716-446655440001',
                    title: 'Product Designer',
                    description: 'Join our design team to create beautiful and functional products.',
                    isActive: true
                }
            ];
        }
    },

    /**
     * Get all jobs (active + inactive) - for HR
     */
    async getAllJobs() {
        try {
            return await apiRequest('/jobs/all');
        } catch (error) {
            console.warn('API not available, using mock data:', error);
            return [
                {
                    jobId: '550e8400-e29b-41d4-a716-446655440000',
                    title: 'Senior Software Engineer',
                    description: 'We are looking for an experienced software engineer to join our team.',
                    isActive: true
                },
                {
                    jobId: '550e8400-e29b-41d4-a716-446655440001',
                    title: 'Product Designer',
                    description: 'Join our design team to create beautiful and functional products.',
                    isActive: true
                },
                {
                    jobId: '550e8400-e29b-41d4-a716-446655440002',
                    title: 'Marketing Manager',
                    description: 'Lead our marketing efforts.',
                    isActive: false
                }
            ];
        }
    },

    /**
     * Get job by ID
     */
    async getJobById(jobId) {
        try {
            return await apiRequest(`/jobs/${jobId}`);
        } catch (error) {
            console.warn('API not available, using mock data:', error);
            // Return mock job
            return {
                jobId: jobId,
                title: 'Sample Job Position',
                description: 'This is a sample job description.',
                isActive: true
            };
        }
    },

    /**
     * Create a new job
     */
    async createJob(jobData) {
        return await apiRequest('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    },

    /**
     * Create a new job
     */
    async createJob(jobData) {
        return await apiRequest('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    },

    /**
     * Update a job
     */
    async updateJob(jobId, jobData) {
        return await apiRequest(`/jobs/${jobId}`, {
            method: 'PUT',
            body: JSON.stringify(jobData),
        });
    },

    /**
     * Delete a job
     */
    async deleteJob(jobId) {
        return await apiRequest(`/jobs/${jobId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Toggle job active status (activate/deactivate)
     */
    async toggleJobStatus(jobId, isActive) {
        return await apiRequest(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        });
    },

    /**
     * Deactivate a job (convenience method)
     */
    async deactivateJob(jobId) {
        return await this.toggleJobStatus(jobId, false);
    },

    /**
     * Activate a job (convenience method)
     */
    async activateJob(jobId) {
        return await this.toggleJobStatus(jobId, true);
    }
};

/**
 * Applications API
 */
const ApplicationsAPI = {
    /**
     * Get applications for a job
     */
    async getApplicationsByJob(jobId) {
        try {
            return await apiRequest(`/applications/job/${jobId}`);
        } catch (error) {
            console.warn('API not available, using mock data:', error);
            return [
                {
                    applicationId: '660e8400-e29b-41d4-a716-446655440000',
                    jobId: jobId,
                    applicantName: 'John Doe',
                    applicantEmail: 'john@example.com',
                    status: 'Pending',
                    appliedAt: '2025-12-11T10:00:00Z'
                },
                {
                    applicationId: '660e8400-e29b-41d4-a716-446655440001',
                    jobId: jobId,
                    applicantName: 'Jane Smith',
                    applicantEmail: 'jane@example.com',
                    status: 'Approved',
                    appliedAt: '2025-12-10T15:30:00Z'
                }
            ];
        }
    },

    /**
     * Submit application (creates application record)
     */
    async submitApplication(applicationData) {
        try {
            return await apiRequest('/applications', {
                method: 'POST',
                body: JSON.stringify(applicationData),
            });
        } catch (error) {
            console.warn('API not available, application submission skipped:', error);
            // Return mock success
            return { success: true, applicationId: applicationData.applicationId };
        }
    },

    /**
     * Update application status (Approve/Reject)
     */
    async updateApplicationStatus(applicationId, status) {
        try {
            return await apiRequest(`/applications/${applicationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status
                }),
            });
        } catch (error) {
            console.warn('API not available, using mock response:', error);
            // Return mock success
            return { success: true, message: `Application ${status.toLowerCase()} successfully` };
        }
    },

    /**
     * Get application statistics
     */
    async getStatistics() {
        try {
            return await apiRequest('/applications/stats/summary');
        } catch (error) {
            console.warn('API not available:', error);
            return {
                summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
                byJob: []
            };
        }
    },

    /**
     * Filter applications
     */
    async filterApplications(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.jobId) params.append('jobId', filters.jobId);
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            
            const queryString = params.toString();
            return await apiRequest(`/applications/filter${queryString ? '?' + queryString : ''}`);
        } catch (error) {
            console.warn('API not available:', error);
            return [];
        }
    }
};

/**
 * Auth API
 */
const AuthAPI = {
    /**
     * HR Login
     */
    async login(email, password) {
        try {
            const response = await apiRequest('/hr/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            
            // Store token
            if (response.token) {
                localStorage.setItem('hr_token', response.token);
                localStorage.setItem('hr_email', email);
            }
            
            return response;
        } catch (error) {
            // Mock login for development
            console.warn('API not available, using mock login:', error);
            if (email && password) {
                localStorage.setItem('hr_token', 'mock_token_' + Date.now());
                localStorage.setItem('hr_email', email);
                return { success: true, token: 'mock_token' };
            }
            throw new Error('Invalid credentials');
        }
    },

    /**
     * Check if HR is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('hr_token');
    },

    /**
     * Logout
     */
    logout() {
        localStorage.removeItem('hr_token');
        localStorage.removeItem('hr_email');
        window.location.href = '/hr/login.html';
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JobsAPI, ApplicationsAPI, AuthAPI, generateUUID };
}

