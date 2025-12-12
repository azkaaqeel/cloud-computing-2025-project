# Setup Guide - Azure SQL Database & Blob Storage Integration

This guide will help you set up the backend server with Azure SQL Database and Blob Storage integration.

## Prerequisites

- Node.js (v14 or higher)
- Azure SQL Database instance
- Azure Storage Account with Blob Storage container
- npm or yarn package manager

## Step 1: Install Required Packages

Run the following command in your project directory:

```bash
npm install
```

This will install all required dependencies:
- `express` - Web server framework
- `mssql` - SQL Server/Azure SQL Database driver
- `@azure/storage-blob` - Azure Blob Storage SDK
- `multer` - File upload handling
- `dotenv` - Environment variable management
- `cors` - Cross-Origin Resource Sharing
- `uuid` - UUID generation

## Step 2: Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example` if available):

```env
# Azure SQL Database Configuration
SQL_USER=sqladmin
SQL_PASSWORD=cloudplouD1
SQL_SERVER=sql-resumesrv.database.windows.net
SQL_DATABASE=hr-workflow-db

# Azure Blob Storage Connection String
# Get this from Azure Portal > Storage Account > Access Keys > Connection string
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net

# Server Port
PORT=3000
```

**Important:** Replace `YOUR_ACCOUNT_KEY` with your actual Azure Storage Account key.

## Step 3: Create SQL Database Table

Connect to your Azure SQL Database and run the SQL script from `schema.sql`:

```bash
# Option 1: Using Azure Portal
# Go to Azure Portal > SQL Database > Query editor
# Copy and paste the contents of schema.sql

# Option 2: Using sqlcmd
sqlcmd -S sql-resumesrv.database.windows.net -U sqladmin -P cloudplouD1 -d hr-workflow-db -i schema.sql
```

The schema creates:
- `Applications` table with all required fields
- Indexes for performance optimization

## Step 4: Configure Azure Blob Storage

1. **Create Container:**
   - Go to Azure Portal > Storage Account > Containers
   - Create a container named `resumes-upload`
   - Set access level to "Blob" (private)

2. **Get Connection String:**
   - Go to Azure Portal > Storage Account > Access Keys
   - Copy the "Connection string" value
   - Paste it in your `.env` file

3. **Configure CORS (for direct uploads):**
   - Go to Azure Portal > Storage Account > Resource sharing (CORS)
   - Add CORS rule:
     - Allowed origins: `http://localhost:3000`
     - Allowed methods: `PUT, GET, HEAD, OPTIONS`
     - Allowed headers: `*`
     - Exposed headers: `*`
     - Max age: `3600`

## Step 5: Start the Server

Run the server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Step 6: Test the Application

1. **Start the frontend:**
   ```bash
   # In a separate terminal, serve the frontend
   python3 -m http.server 8000
   ```

2. **Access the application:**
   - Open `http://localhost:8000` in your browser
   - Navigate to a job posting and click "Apply Now"
   - Fill out the application form with all fields
   - Submit the form

3. **Verify data:**
   - Check Azure SQL Database: Query the `Applications` table
   - Check Azure Blob Storage: Verify the resume file was uploaded

## API Endpoints

### POST `/api/applications`
Submit a new job application.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `fullName` (string, required)
  - `email` (string, required)
  - `phone` (string, required)
  - `cgpa` (number, required, 0-4.0)
  - `university` (string, required)
  - `experienceYears` (number, required, >= 0)
  - `jobId` (string, required)
  - `applicationId` (string, optional - auto-generated if not provided)
  - `jobTitle` (string, optional)
  - `resumeFile` (file, required, PDF or DOCX, max 5MB)

**Response:**
```json
{
  "success": true,
  "applicationId": "uuid-here",
  "message": "Application submitted successfully"
}
```

### GET `/api/applications/job/:jobId`
Get all applications for a specific job.

**Response:**
```json
[
  {
    "ApplicationId": "uuid",
    "CandidateName": "John Doe",
    "CandidateEmail": "john@example.com",
    "CandidatePhone": "123-456-7890",
    "CGPA": 3.75,
    "University": "University of Technology",
    "ExperienceYears": 2,
    "ResumeBlobPath": "2025-12-11T14-30-45-123Z_john-doe_software-engineer.pdf",
    "JobId": "job-id",
    "JobTitle": "Software Engineer",
    "Status": "Pending",
    "SubmittedAt": "2025-12-11T14:30:45.123Z",
    "Notes": null
  }
]
```

### GET `/api/applications`
Get all applications.

### GET `/api/health`
Health check endpoint.

## Troubleshooting

### Connection Issues

1. **SQL Database Connection Failed:**
   - Verify SQL credentials in `.env`
   - Check firewall rules in Azure Portal (allow your IP)
   - Ensure SQL Server allows Azure services

2. **Blob Storage Upload Failed:**
   - Verify connection string in `.env`
   - Check container name matches (`resumes-upload`)
   - Verify storage account key is correct

3. **CORS Errors:**
   - Ensure CORS is configured in Azure Storage Account
   - Check allowed origins include your frontend URL

### Database Errors

- **Table doesn't exist:** Run `schema.sql` to create the table
- **Column errors:** Ensure schema matches the code (check `schema.sql`)

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use environment variables** in production
3. **Enable SQL firewall** rules in Azure
4. **Use SAS tokens** for production blob access instead of connection strings
5. **Validate all inputs** on both frontend and backend

## Next Steps

- Set up authentication for HR portal
- Add file validation and virus scanning
- Implement email notifications
- Add application status management
- Set up logging and monitoring
