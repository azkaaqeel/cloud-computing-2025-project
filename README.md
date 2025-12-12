# HireHive Labs - Job Application Portal

A complete job application portal for HireHive Labs, allowing applicants to apply for positions and HR to manage jobs and applications.

## Features

### Public Features (No Login Required)
- **Careers Page** (`index.html`) - Browse active job openings
- **Application Form** (`apply.html`) - Submit applications with resume upload
- Resume uploads to Azure Blob Storage with structured paths

### HR Portal (Login Required)
- **HR Login** (`hr/login.html`) - Secure authentication
- **HR Dashboard** (`hr/dashboard.html`) - Overview and navigation
- **Jobs Management** (`hr/jobs.html`) - Create, view, and deactivate jobs
- **Applications View** (`hr/applications.html`) - View applications by job

## File Structure

```
/
├── index.html              # Public careers page
├── apply.html              # Application form page
├── styles.css              # Main stylesheet
├── api.js                  # API integration layer
├── upload.js              # Azure Blob Storage upload logic
├── careers.js             # Careers page logic
├── apply.js               # Application form logic
├── hr/
│   ├── login.html         # HR login page
│   ├── login.js           # Login logic
│   ├── dashboard.html     # HR dashboard
│   ├── jobs.html          # Jobs management page
│   ├── jobs.js            # Jobs management logic
│   ├── applications.html  # Applications view page
│   └── applications.js    # Applications view logic
└── README.md              # This file
```

## Setup

### 1. Azure Blob Storage Configuration

Update the SAS URL in `upload.js`:
```javascript
const SAS_URL = 'YOUR_SAS_URL_HERE';
```

### 2. CORS Configuration

Configure CORS on your Azure Storage Account to allow requests from your domain:
- Allowed origins: `http://localhost:8000,http://127.0.0.1:8000,http://[::]:8000`
- Allowed methods: `PUT,GET,HEAD,OPTIONS`
- Allowed headers: `*`
- See `CORS_SETUP_INSTRUCTIONS.md` for details

### 3. API Configuration

Update the API base URL in `api.js`:
```javascript
const API_BASE_URL = '/api';
```

The application includes mock data fallbacks for development. Replace with your actual API endpoints:

- `GET /api/jobs` - Get active jobs
- `GET /api/jobs/all` - Get all jobs (HR)
- `GET /api/jobs/:jobId` - Get job by ID
- `POST /api/jobs` - Create new job
- `DELETE /api/jobs/:jobId` - Deactivate job
- `GET /api/applications/job/:jobId` - Get applications for a job
- `POST /api/applications` - Submit application
- `POST /api/hr/login` - HR login

### 4. Run Locally

Start a local web server:
```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Usage

### For Applicants

1. Visit the careers page (`index.html`)
2. Browse available positions
3. Click "Apply Now" on a job
4. Fill out the application form
5. Upload resume (PDF or DOCX, max 5MB)
6. Submit application

### For HR

1. Navigate to `hr/login.html`
2. Login with credentials
3. Access dashboard to manage jobs and view applications
4. Create new job postings
5. View applications by job
6. Deactivate jobs when needed

## Resume Storage

Resumes are uploaded directly to Azure Blob Storage container root with the following naming format:
```
{timestamp}_{name}_{jobTitle}.pdf
```

Example: `2025-12-11T14-30-45-123Z_john-doe_software-engineer.pdf`

### Metadata Attached to Each Blob

All metadata is attached to the blob using Azure Storage metadata headers (`x-ms-meta-*`):

- `x-ms-meta-jobid` - Job ID the application is for
- `x-ms-meta-applicationid` - Application UUID (unique identifier)
- `x-ms-meta-applicantname` - Full name of the applicant
- `x-ms-meta-applicantemail` - Email address of the applicant
- `x-ms-meta-jobtitle` - Title of the job position
- `x-ms-meta-timestamp` - ISO timestamp when the file was uploaded
- `x-ms-meta-originalfilename` - Original filename from the user's device

This metadata can be retrieved when accessing the blob through Azure Storage APIs or SDKs, allowing easy filtering and organization of resumes without requiring a separate database.

## Authentication

HR routes are protected by checking for authentication token in localStorage. If not authenticated, users are redirected to the login page.

## Development Notes

- All API calls include error handling with mock data fallbacks
- File uploads include progress tracking
- Form validation ensures data quality
- Responsive design works on mobile and desktop
- Clean, professional UI with HireHive Labs branding

## Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Considerations

- CORS must be properly configured
- HR authentication should be validated server-side
- File uploads are limited to PDF/DOCX and 5MB max
- SAS tokens should have appropriate expiration dates

