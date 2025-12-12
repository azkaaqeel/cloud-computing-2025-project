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

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Create `.env` file (see `INSTALL.md` for template)
   - Add your Azure SQL Database credentials
   - Add your Azure Blob Storage connection string

3. **Set up SQL Database:**
   - Run `schema.sql` in your Azure SQL Database
   - See `SETUP.md` for detailed instructions

4. **Start backend server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000`

5. **Start frontend (in new terminal):**
   ```bash
   python3 -m http.server 8000
   ```
   Access at `http://localhost:8000`

### Detailed Setup

For complete setup instructions, see:
- **`INSTALL.md`** - Quick installation guide
- **`SETUP.md`** - Detailed setup with troubleshooting

### Backend API Endpoints

The backend server provides the following endpoints:

- `POST /api/applications` - Submit job application (with file upload)
- `GET /api/applications` - Get all applications
- `GET /api/applications/job/:jobId` - Get applications for a job
- `GET /api/health` - Health check

### Frontend API Integration

The frontend uses mock data fallbacks for development. The backend provides real endpoints:

- `GET /api/jobs` - Get active jobs (mock data fallback)
- `GET /api/jobs/all` - Get all jobs (mock data fallback)
- `GET /api/jobs/:jobId` - Get job by ID (mock data fallback)
- `POST /api/jobs` - Create new job (mock data fallback)
- `DELETE /api/jobs/:jobId` - Deactivate job (mock data fallback)
- `POST /api/applications` - Submit application (real backend)
- `POST /api/hr/login` - HR login (mock data fallback)

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

