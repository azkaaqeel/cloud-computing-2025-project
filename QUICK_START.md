# Quick Start Guide - HireHive Labs Portal

## 🚀 Getting Started

### 1. Start the Server
```bash
cd "/Users/aqeel/Desktop/cloud final project"
python3 -m http.server 8000
```

### 2. Open in Browser
Navigate to: `http://localhost:8000`

## 📋 Pages Overview

### Public Pages (No Login)
- **`/index.html`** - Careers page - Browse and apply to jobs
- **`/apply.html?jobId=xxx`** - Application form for a specific job

### HR Portal (Login Required)
- **`/hr/login.html`** - HR login page
- **`/hr/dashboard.html`** - HR dashboard (after login)
- **`/hr/jobs.html`** - Manage job postings
- **`/hr/applications.html?jobId=xxx`** - View applications for a job

## 🔑 Testing HR Login

The app includes mock authentication for development:
- Enter any email and password
- You'll be logged in and redirected to the dashboard

**Note:** In production, replace the mock login in `api.js` with real backend authentication.

## 📝 Testing the Application Flow

1. **View Jobs**: Go to `index.html` - See available positions
2. **Apply**: Click "Apply Now" on any job
3. **Fill Form**: Enter name, email, and upload resume (PDF/DOCX, max 5MB)
4. **Submit**: Application is uploaded to Azure Blob Storage

## 🛠️ Configuration Checklist

- [x] SAS URL configured in `upload.js`
- [ ] CORS configured on Azure Storage (see `CORS_SETUP_INSTRUCTIONS.md`)
- [ ] API endpoints configured in `api.js` (or use mock data)
- [ ] Test file upload functionality
- [ ] Test HR login and dashboard access

## 📁 Key Files

- **`api.js`** - All API calls and mock data
- **`upload.js`** - Azure Blob Storage upload logic
- **`styles.css`** - All styling and branding
- **`apply.js`** - Application form logic
- **`careers.js`** - Careers page logic

## 🐛 Troubleshooting

### CORS Errors
- Configure CORS on Azure Storage Account
- See `CORS_SETUP_INSTRUCTIONS.md`

### API Errors
- Check browser console for details
- Mock data will be used if API is unavailable
- Update `API_BASE_URL` in `api.js`

### Upload Fails
- Verify SAS URL is correct and not expired
- Check CORS configuration
- Verify file is PDF/DOCX and under 5MB

## 📚 Next Steps

1. Connect to your real backend API
2. Implement proper HR authentication
3. Configure production CORS settings
4. Deploy to your hosting platform

