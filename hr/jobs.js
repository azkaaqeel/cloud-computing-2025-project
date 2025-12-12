// HR Jobs Management Logic
document.addEventListener('DOMContentLoaded', async function() {
    await loadJobs();

    // Setup new job form
    const form = document.getElementById('newJobForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('jobTitle').value.trim();
        const description = document.getElementById('jobDescription').value.trim();
        const department = document.getElementById('jobDepartment').value.trim();
        const location = document.getElementById('jobLocation').value.trim();
        const employmentType = document.getElementById('jobEmploymentType').value.trim();
        const salaryRange = document.getElementById('jobSalaryRange').value.trim();
        const requirements = document.getElementById('jobRequirements').value.trim();
        const isActive = document.getElementById('jobIsActive').checked;

        if (!title || !description) {
            showJobFormMessage('Please fill in all required fields (Title and Description).', 'error');
            return;
        }

        try {
            await JobsAPI.createJob({ 
                title, 
                description, 
                department: department || null,
                location: location || null,
                employmentType: employmentType || null,
                salaryRange: salaryRange || null,
                requirements: requirements || null,
                isActive 
            });
            showJobFormMessage('Job created successfully!', 'success');
            form.reset();
            document.getElementById('jobIsActive').checked = true; // Reset checkbox
            toggleJobForm();
            await loadJobs();
        } catch (error) {
            console.error('Error creating job:', error);
            showJobFormMessage('Failed to create job. Please try again.', 'error');
        }
    });
});

async function loadJobs() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const jobsListDiv = document.getElementById('jobsList');

    try {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';

        const jobs = await JobsAPI.getAllJobs();
        loadingDiv.style.display = 'none';

        if (!jobs || jobs.length === 0) {
            jobsListDiv.innerHTML = '<p>No jobs found. Create your first job posting!</p>';
            return;
        }

        jobsListDiv.innerHTML = jobs.map(job => `
            <div class="job-card ${job.isActive ? '' : 'inactive'}">
                <div class="job-card-header">
                    <h3>${escapeHtml(job.title)}</h3>
                    <span class="job-status ${job.isActive ? 'active' : 'inactive'}">
                        ${job.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                ${job.department ? `<p class="job-meta"><strong>Department:</strong> ${escapeHtml(job.department)}</p>` : ''}
                ${job.location ? `<p class="job-meta"><strong>Location:</strong> ${escapeHtml(job.location)}</p>` : ''}
                ${job.employmentType ? `<p class="job-meta"><strong>Type:</strong> ${escapeHtml(job.employmentType)}</p>` : ''}
                <p class="job-description">${escapeHtml(job.description)}</p>
                <div class="job-card-actions">
                    <a href="applications.html?jobId=${job.jobId}" class="btn btn-secondary btn-sm">View Applications</a>
                    ${job.isActive ? `
                        <button onclick="deactivateJob('${job.jobId}')" class="btn btn-warning btn-sm">Deactivate</button>
                    ` : `
                        <button onclick="activateJob('${job.jobId}')" class="btn btn-success btn-sm">Activate</button>
                    `}
                    <button onclick="deleteJob('${job.jobId}', '${escapeHtml(job.title)}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading jobs:', error);
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load jobs. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function deactivateJob(jobId) {
    if (!confirm('Are you sure you want to deactivate this job? It will no longer accept applications.')) {
        return;
    }

    try {
        await JobsAPI.deactivateJob(jobId);
        await loadJobs();
    } catch (error) {
        console.error('Error deactivating job:', error);
        alert('Failed to deactivate job. Please try again.');
    }
}

async function activateJob(jobId) {
    if (!confirm('Are you sure you want to activate this job? It will start accepting applications.')) {
        return;
    }

    try {
        await JobsAPI.activateJob(jobId);
        await loadJobs();
    } catch (error) {
        console.error('Error activating job:', error);
        alert('Failed to activate job. Please try again.');
    }
}

async function deleteJob(jobId, jobTitle) {
    if (!confirm(`Are you sure you want to DELETE "${jobTitle}"?\n\nThis action cannot be undone. The job will be permanently removed from the system.\n\nNote: Jobs with existing applications cannot be deleted.`)) {
        return;
    }

    try {
        const result = await JobsAPI.deleteJob(jobId);
        if (result.success) {
            alert('Job deleted successfully!');
            await loadJobs();
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        const errorMessage = error.message || 'Failed to delete job. Please try again.';
        if (errorMessage.includes('application')) {
            alert(`Cannot delete job: ${errorMessage}`);
        } else {
            alert('Failed to delete job. Please try again.');
        }
    }
}

function toggleJobForm() {
    const form = document.getElementById('addJobForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById('jobFormMessage').textContent = '';
        document.getElementById('jobFormMessage').className = 'message';
    }
}

function showJobFormMessage(text, type) {
    const messageDiv = document.getElementById('jobFormMessage');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

