// Careers Page Logic
document.addEventListener('DOMContentLoaded', async function() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const noJobsDiv = document.getElementById('noJobs');
    const jobsListDiv = document.getElementById('jobsList');

    try {
        // Fetch active jobs
        const jobs = await JobsAPI.getActiveJobs();
        
        loadingDiv.style.display = 'none';

        if (!jobs || jobs.length === 0) {
            noJobsDiv.style.display = 'block';
            return;
        }

        // Render jobs
        jobsListDiv.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h3 class="job-title">${escapeHtml(job.title)}</h3>
                <p class="job-description">${escapeHtml(job.description)}</p>
                <a href="apply.html?jobId=${job.jobId}" class="btn btn-primary">Apply Now</a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading jobs:', error);
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load job openings. Please try again later.';
        errorDiv.style.display = 'block';
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

