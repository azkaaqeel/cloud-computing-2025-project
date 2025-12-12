// HR Dashboard Logic
document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardStats();
});

async function loadDashboardStats() {
    const loadingDiv = document.getElementById('loading');
    const statsDiv = document.getElementById('stats');
    const jobsStatsDiv = document.getElementById('jobsStats');

    try {
        loadingDiv.style.display = 'block';

        // Load statistics
        const stats = await ApplicationsAPI.getStatistics();
        const jobs = await JobsAPI.getAllJobs();

        loadingDiv.style.display = 'none';

        // Display summary statistics
        if (stats.summary) {
            statsDiv.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.summary.total || 0}</div>
                    <div class="stat-label">Total Applications</div>
                </div>
                <div class="stat-card stat-pending">
                    <div class="stat-value">${stats.summary.pending || 0}</div>
                    <div class="stat-label">Pending Review</div>
                </div>
                <div class="stat-card stat-approved">
                    <div class="stat-value">${stats.summary.approved || 0}</div>
                    <div class="stat-label">Approved</div>
                </div>
                <div class="stat-card stat-rejected">
                    <div class="stat-value">${stats.summary.rejected || 0}</div>
                    <div class="stat-label">Rejected</div>
                </div>
            `;
        }

        // Display applications per job
        if (stats.byJob && stats.byJob.length > 0) {
            jobsStatsDiv.innerHTML = `
                <h3>Applications by Job</h3>
                <div class="jobs-stats-list">
                    ${stats.byJob.map(job => `
                        <div class="job-stat-card">
                            <div class="job-stat-header">
                                <h4>${escapeHtml(job.jobTitle)}</h4>
                                <a href="applications.html?jobId=${job.jobId}" class="btn btn-sm btn-secondary">View</a>
                            </div>
                            <div class="job-stat-details">
                                <div class="stat-item">
                                    <span class="stat-label">Total:</span>
                                    <span class="stat-value">${job.totalApplications}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Pending:</span>
                                    <span class="stat-value stat-pending-value">${job.pending}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Approved:</span>
                                    <span class="stat-value stat-approved-value">${job.approved}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Rejected:</span>
                                    <span class="stat-value stat-rejected-value">${job.rejected}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            jobsStatsDiv.innerHTML = '<p>No applications yet. Applications will appear here once candidates start applying.</p>';
        }

        // Display active jobs count
        const activeJobs = jobs.filter(job => job.isActive).length;
        const totalJobs = jobs.length;
        
        const jobsSummaryDiv = document.getElementById('jobsSummary');
        if (jobsSummaryDiv) {
            jobsSummaryDiv.innerHTML = `
                <div class="summary-card">
                    <h3>Jobs Overview</h3>
                    <div class="summary-stats">
                        <div class="summary-item">
                            <span class="summary-value">${totalJobs}</span>
                            <span class="summary-label">Total Jobs</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${activeJobs}</span>
                            <span class="summary-label">Active Jobs</span>
                        </div>
                    </div>
                    <a href="jobs.html" class="btn btn-primary">Manage Jobs</a>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        loadingDiv.style.display = 'none';
        statsDiv.innerHTML = '<p class="error">Failed to load statistics. Please try again.</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
