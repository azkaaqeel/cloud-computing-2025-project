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
            <div class="application-card" data-application-id="${app.applicationId}">
                <div class="application-header">
                    <h3>${escapeHtml(app.candidateName || app.applicantName)}</h3>
                    <span class="status-badge status-${(app.status || 'Pending').toLowerCase()}">${app.status || 'Pending'}</span>
                </div>
                <div class="application-details">
                    <p><strong>Email:</strong> ${escapeHtml(app.candidateEmail || app.applicantEmail)}</p>
                    ${app.candidatePhone ? `<p><strong>Phone:</strong> ${escapeHtml(app.candidatePhone)}</p>` : ''}
                    ${app.cgpa ? `<p><strong>CGPA:</strong> ${app.cgpa}</p>` : ''}
                    ${app.university ? `<p><strong>University:</strong> ${escapeHtml(app.university)}</p>` : ''}
                    ${app.experienceYears !== null && app.experienceYears !== undefined ? `<p><strong>Experience:</strong> ${app.experienceYears} years</p>` : ''}
                    <p><strong>Application ID:</strong> <code>${app.applicationId}</code></p>
                    <p><strong>Applied:</strong> ${formatDate(app.submittedAt || app.appliedAt)}</p>
                    ${app.resumeBlobPath ? `<p><strong>Resume:</strong> <a href="#" class="resume-link" data-blob="${escapeHtml(app.resumeBlobPath)}">View Resume</a></p>` : ''}
                </div>
                <div class="application-actions">
                    ${app.status === 'Pending' || !app.status ? `
                        <button class="btn btn-success approve-btn" data-application-id="${app.applicationId}">
                            ✓ Approve
                        </button>
                        <button class="btn btn-danger reject-btn" data-application-id="${app.applicationId}">
                            ✗ Reject
                        </button>
                    ` : `
                        <span class="action-info">Status: ${app.status}</span>
                    `}
                </div>
            </div>
        `).join('');

        // Add event listeners for approve/reject buttons
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const applicationId = e.target.dataset.applicationId;
                await updateApplicationStatus(applicationId, 'Approved');
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const applicationId = e.target.dataset.applicationId;
                await updateApplicationStatus(applicationId, 'Rejected');
            });
        });


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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function updateApplicationStatus(applicationId, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
        return;
    }
    
    try {
        const API_BASE_URL = window.API_BASE_URL || (window.location.port === '3000' ? '/api' : 'http://localhost:3000/api');
        
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: status
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to update status' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        
        // Show success message
        alert(`Application ${status.toLowerCase()} successfully!`);
        
        // Reload applications to show updated status
        window.location.reload();

    } catch (error) {
        console.error('Error updating application status:', error);
        alert(`Failed to update application status: ${error.message}`);
    }
}

