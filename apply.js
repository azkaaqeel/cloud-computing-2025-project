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

        // Collect all form data
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const cgpa = document.getElementById('cgpa').value.trim();
        const university = document.getElementById('university').value.trim();
        const experienceYears = document.getElementById('experienceYears').value.trim();
        const file = fileInput.files[0];
        const currentJobId = form.dataset.jobId;
        const currentJobTitle = form.dataset.jobTitle || '';

        // Validate inputs
        if (!fullName || !email || !phone || !cgpa || !university || experienceYears === '' || !file) {
            showMessage('Please fill in all required fields and select a resume file.', 'error');
            return;
        }

        // Validate CGPA range
        const cgpaValue = parseFloat(cgpa);
        if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 4.0) {
            showMessage('Please enter a valid CGPA between 0.00 and 4.00', 'error');
            return;
        }

        // Validate experience years
        const expYears = parseInt(experienceYears);
        if (isNaN(expYears) || expYears < 0) {
            showMessage('Please enter a valid number of years of experience (0 or more)', 'error');
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
            // Create FormData to send to backend
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('cgpa', cgpa);
            formData.append('university', university);
            formData.append('experienceYears', experienceYears);
            formData.append('jobId', currentJobId);
            formData.append('applicationId', applicationId);
            formData.append('jobTitle', currentJobTitle);
            formData.append('resumeFile', file);

            // Send form data to backend API
            // Use full URL when backend runs on different port, or relative when same origin
            const API_BASE_URL = window.API_BASE_URL || (window.location.port === '3000' ? '' : 'http://localhost:3000');
            const response = await fetch(`${API_BASE_URL}/api/applications`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to submit application' }));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Show success message
                showMessage('Application submitted successfully! Thank you for applying to HireHive Labs.', 'success');
                
                // Reset form
                form.reset();
                fileSizeInfo.style.display = 'none';

                // Redirect to careers page after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                throw new Error(result.message || 'Application submission failed');
            }

        } catch (error) {
            console.error('Application submission error:', error);
            let errorMessage = 'Application submission failed. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Connection failed. Please check if the server is running.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Submit Application';
        }
    });
});

