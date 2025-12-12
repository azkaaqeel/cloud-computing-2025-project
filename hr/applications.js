// HR Applications View Logic
document.addEventListener('DOMContentLoaded', async function() {
    // Get jobId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');

    if (!jobId) {
        document.getElementById('error').textContent = 'Invalid job ID.';
        document.getElementById('error').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    // Load job details and applications
    try {
        const [job, applications] = await Promise.all([
            JobsAPI.getJobById(jobId),
            ApplicationsAPI.getApplicationsByJob(jobId)
        ]);

        document.getElementById('pageTitle').textContent = `Applications - ${job.title}`;
        document.getElementById('loading').style.display = 'none';

        if (!applications || applications.length === 0) {
            document.getElementById('noApplications').style.display = 'block';
            return;
        }

        // Render applications
        const applicationsListDiv = document.getElementById('applicationsList');
        applicationsListDiv.innerHTML = applications.map(app => `
            <div class="application-card">
                <div class="application-header">
                    <h3>${escapeHtml(app.applicantName)}</h3>
                    <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                </div>
                <div class="application-details">
                    <p><strong>Email:</strong> ${escapeHtml(app.applicantEmail)}</p>
                    <p><strong>Application ID:</strong> <code>${app.applicationId}</code></p>
                    <p><strong>Applied:</strong> ${formatDate(app.appliedAt)}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading applications:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').textContent = 'Failed to load applications. Please try again.';
        document.getElementById('error').style.display = 'block';
    }
});

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

