// Application Page Logic
document.addEventListener('DOMContentLoaded', async function() {
    // Get jobId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');

    if (!jobId) {
        showMessage('Invalid job application link.', 'error');
        document.getElementById('applicationForm').style.display = 'none';
        return;
    }

        // Load job details
        let currentJobTitle = '';
        try {
            const job = await JobsAPI.getJobById(jobId);
            
            // Check if job is active
            if (!job.isActive) {
                document.getElementById('jobInfo').innerHTML = `
                    <div class="message error">
                        <h3>Position No Longer Available</h3>
                        <p>This position is no longer accepting applications.</p>
                        <a href="index.html" class="btn btn-secondary">View Other Positions</a>
                    </div>
                `;
                document.getElementById('applicationForm').style.display = 'none';
                return;
            }

            // Display job info
            currentJobTitle = job.title;
            document.getElementById('jobTitle').textContent = currentJobTitle;
            document.getElementById('jobDescription').textContent = job.description;

            // Store jobId and jobTitle for form submission
            document.getElementById('applicationForm').dataset.jobId = jobId;
            document.getElementById('applicationForm').dataset.jobTitle = currentJobTitle;

    } catch (error) {
        console.error('Error loading job:', error);
        showMessage('Failed to load job details. Please try again.', 'error');
    }

    // Setup form submission
    const form = document.getElementById('applicationForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('resumeFile');
    const fileSizeInfo = document.getElementById('fileSizeInfo');

    // Show file size info
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            fileSizeInfo.textContent = `File size: ${sizeMB} MB (Max: 5 MB)`;
            fileSizeInfo.style.display = 'block';
        } else {
            fileSizeInfo.style.display = 'none';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const file = fileInput.files[0];
        const currentJobId = form.dataset.jobId;
        const currentJobTitle = form.dataset.jobTitle || '';

        // Validate inputs
        if (!fullName || !email || !file) {
            showMessage('Please fill in all fields and select a file.', 'error');
            return;
        }

        // Validate file type
        try {
            validateFileType(file);
        } catch (error) {
            showMessage(error.message, 'error');
            return;
        }

        // Validate file size (5MB max)
        try {
            validateFileSize(file, 5);
        } catch (error) {
            showMessage(error.message, 'error');
            return;
        }

        // Generate application ID
        const applicationId = generateUUID();

        // Disable upload button during upload
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Submitting Application...';
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = '';
        messageDiv.className = 'message';

        try {
            // Upload resume to Azure Blob Storage
            await uploadToAzureBlob(file, fullName, email, currentJobId, applicationId, currentJobTitle);

            // Submit application record to API
            try {
                await ApplicationsAPI.submitApplication({
                    applicationId,
                    jobId: currentJobId,
                    applicantName: fullName,
                    applicantEmail: email,
                    status: 'Pending'
                });
            } catch (apiError) {
                console.warn('Application record submission failed, but resume uploaded:', apiError);
                // Continue even if API call fails - resume is uploaded
            }

            // Show success message
            showMessage('Application submitted successfully! Thank you for applying to HireHive Labs.', 'success');
            
            // Reset form
            form.reset();
            fileSizeInfo.style.display = 'none';

            // Redirect to careers page after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);

        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'Application submission failed. Please try again.';
            if (error.message && error.message.includes('CORS')) {
                errorMessage = 'CORS Error: Configure CORS on Azure Storage. Check CORS_SETUP_INSTRUCTIONS.md';
            } else if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Connection failed. Check CORS configuration. See CORS_SETUP_INSTRUCTIONS.md';
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Submit Application';
        }
    });
});

