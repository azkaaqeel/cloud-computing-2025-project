// SAS URL placeholder - replace with your actual SAS URL
// Format: https://<account>.blob.core.windows.net/<container>?<sas-token>
const SAS_URL = 'https://resumestored.blob.core.windows.net/resumes-upload?sp=racw&st=2025-12-11T14:40:53Z&se=2025-12-30T22:55:53Z&sv=2024-11-04&sr=c&sig=2J7tCqWiejU0%2FYPHX47SvofB%2FxTw4Gx%2F9bjCpT4BWlY%3D';

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
 * Upload file to Azure Blob Storage using SAS URL and REST API
 * @param {File} file - The file to upload
 * @param {string} applicantName - Full name of the applicant
 * @param {string} applicantEmail - Email of the applicant
 * @param {string} jobId - Job ID the application is for
 * @param {string} applicationId - Application ID (UUID)
 * @param {string} jobTitle - Title of the job position
 * @param {Function} onProgress - Optional progress callback (progress: 0-100)
 */
async function uploadToAzureBlob(file, applicantName, applicantEmail, jobId, applicationId, jobTitle, onProgress) {
    // Check if SAS URL is configured
    if (!SAS_URL || SAS_URL === 'YOUR_SAS_URL_HERE') {
        throw new Error('SAS URL not configured. Please update the SAS_URL variable in upload.js');
    }
    
    try {
        // Parse the SAS URL to extract container base URL and SAS token
        // SAS URL format: https://<account>.blob.core.windows.net/<container>?<sas-token>
        const urlParts = SAS_URL.split('?');
        const baseUrl = urlParts[0]; // https://resumestored.blob.core.windows.net/resumes-upload
        const sasToken = urlParts[1]; // sp=racw&st=...
        
        // Determine file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const blobExtension = fileExtension === 'docx' ? 'pdf' : fileExtension; // Store as PDF or original extension
        
        // Generate timestamp in ISO format with colons and dots replaced by dashes
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Sanitize name and jobTitle for filename (remove/replace invalid characters)
        const sanitizedName = applicantName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        const sanitizedJobTitle = (jobTitle || 'job').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        
        // Construct blob name: {timestamp}_{name}_{jobTitle}.pdf (uploaded directly to container root)
        const blobName = `${timestamp}_${sanitizedName}_${sanitizedJobTitle}.${blobExtension}`;
        
        // Construct the full blob URL with SAS token
        const blobUrl = `${baseUrl}/${encodeURIComponent(blobName)}?${sasToken}`;
        
        // Prepare metadata headers
        // Azure Storage requires metadata headers to be prefixed with 'x-ms-meta-'
        // All metadata is attached to the blob for easy retrieval and organization
        const metadataHeaders = {
            'x-ms-meta-jobid': jobId,
            'x-ms-meta-applicationid': applicationId,
            'x-ms-meta-applicantname': applicantName,
            'x-ms-meta-applicantemail': applicantEmail,
            'x-ms-meta-jobtitle': jobTitle || '',
            'x-ms-meta-timestamp': timestamp,
            'x-ms-meta-originalfilename': file.name,
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-version': '2024-11-04'
        };
        
        // Upload using PUT request to Azure Blob Storage REST API
        const response = await fetch(blobUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
                'Content-Length': file.size.toString(),
                ...metadataHeaders
            },
            body: file
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 0 || errorText.includes('CORS') || errorText.includes('Failed to fetch')) {
                throw new Error('CORS Error: Please configure CORS on your Azure Storage Account. See CORS_SETUP_INSTRUCTIONS.md for details.');
            }
            throw new Error(`Upload failed: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        // Log successful upload with metadata information
        console.log('File uploaded successfully:', blobName);
        console.log('Metadata attached:', {
            jobId,
            applicationId,
            applicantName,
            applicantEmail,
            jobTitle,
            timestamp,
            originalFilename: file.name
        });
        return { blobName, applicationId };
    } catch (error) {
        console.error('Azure Blob Storage upload error:', error);
        throw error;
    }
}

/**
 * Display message to user
 * @param {string} text - Message text
 * @param {string} type - Message type: 'success' or 'error'
 */
function showMessage(text, type, messageElementId = 'message') {
    const messageDiv = document.getElementById(messageElementId);
    if (!messageDiv) {
        console.error('Message element not found:', messageElementId);
        return;
    }
    
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Clear message after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}

/**
 * Validate file size (max 5MB)
 */
function validateFileSize(file, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit. Please upload a smaller file.`);
    }
    return true;
}

/**
 * Validate file type
 */
function validateFileType(file) {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or DOCX file only.');
    }
    return true;
}
