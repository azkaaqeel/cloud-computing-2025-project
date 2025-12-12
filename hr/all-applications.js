// All Applications View Logic
let allApplications = [];
let allJobs = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadJobs();
    await loadApplications();
});

async function loadJobs() {
    try {
        allJobs = await JobsAPI.getAllJobs();
        
        const filterJobSelect = document.getElementById('filterJob');
        filterJobSelect.innerHTML = '<option value="">All Jobs</option>';
        
        allJobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.jobId;
            option.textContent = job.title;
            filterJobSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

async function loadApplications() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const noApplicationsDiv = document.getElementById('noApplications');
    const applicationsListDiv = document.getElementById('applicationsList');

    try {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        noApplicationsDiv.style.display = 'none';

        // Get filter values
        const jobId = document.getElementById('filterJob').value;
        const status = document.getElementById('filterStatus').value;
        const search = document.getElementById('searchInput').value.trim();

        const filters = {};
        if (jobId) filters.jobId = jobId;
        if (status) filters.status = status;
        if (search) filters.search = search;

        allApplications = await ApplicationsAPI.filterApplications(filters);
        
        loadingDiv.style.display = 'none';

        if (!allApplications || allApplications.length === 0) {
            noApplicationsDiv.style.display = 'block';
            applicationsListDiv.innerHTML = '';
            return;
        }

        // Render applications
        applicationsListDiv.innerHTML = allApplications.map(app => {
            const job = allJobs.find(j => j.jobId === app.jobId);
            const jobTitle = job ? job.title : (app.jobTitle || 'Unknown Job');
            
            return `
                <div class="application-card" data-application-id="${app.applicationId}">
                    <div class="application-header">
                        <div>
                            <h3>${escapeHtml(app.candidateName || app.applicantName)}</h3>
                            <p class="application-job-title">${escapeHtml(jobTitle)}</p>
                        </div>
                        <span class="status-badge status-${(app.status || 'Pending').toLowerCase()}">${app.status || 'Pending'}</span>
                    </div>
                    <div class="application-details">
                        <div class="detail-row">
                            <p><strong>Email:</strong> ${escapeHtml(app.candidateEmail || app.applicantEmail)}</p>
                            ${app.candidatePhone ? `<p><strong>Phone:</strong> ${escapeHtml(app.candidatePhone)}</p>` : ''}
                        </div>
                        <div class="detail-row">
                            ${app.cgpa ? `<p><strong>CGPA:</strong> ${app.cgpa}</p>` : ''}
                            ${app.university ? `<p><strong>University:</strong> ${escapeHtml(app.university)}</p>` : ''}
                            ${app.experienceYears !== null && app.experienceYears !== undefined ? `<p><strong>Experience:</strong> ${app.experienceYears} years</p>` : ''}
                        </div>
                        <div class="detail-row">
                            <p><strong>Applied:</strong> ${formatDate(app.submittedAt || app.appliedAt)}</p>
                            ${app.resumeBlobPath ? `<p><strong>Resume:</strong> <a href="#" class="resume-link" data-blob="${escapeHtml(app.resumeBlobPath)}" onclick="viewResume('${escapeHtml(app.resumeBlobPath)}'); return false;">View Resume</a></p>` : ''}
                        </div>
                    </div>
                    <div class="application-actions">
                        <a href="applications.html?jobId=${app.jobId}" class="btn btn-secondary btn-sm">View Job Applications</a>
                        ${app.status === 'Pending' || !app.status ? `
                            <button class="btn btn-success btn-sm approve-btn" data-application-id="${app.applicationId}">
                                ✓ Approve
                            </button>
                            <button class="btn btn-danger btn-sm reject-btn" data-application-id="${app.applicationId}">
                                ✗ Reject
                            </button>
                        ` : `
                            <span class="action-info">Status: ${app.status}</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

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
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load applications. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function applyFilters() {
    loadApplications();
}

function clearFilters() {
    document.getElementById('filterJob').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchInput').value = '';
    loadApplications();
}

// Allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
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
        await ApplicationsAPI.updateApplicationStatus(applicationId, status);
        alert(`Application ${status.toLowerCase()} successfully!`);
        await loadApplications();
    } catch (error) {
        console.error('Error updating application status:', error);
        alert(`Failed to update application status: ${error.message}`);
    }
}

function viewResume(blobPath) {
    // TODO: Implement resume viewing/downloading
    alert('Resume download functionality coming soon!');
    console.log('Resume blob path:', blobPath);
}
