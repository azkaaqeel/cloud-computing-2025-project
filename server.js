const express = require('express');
const sql = require('mssql');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files (HTML, CSS, JS)

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  }
});

// Azure Blob Storage connection setup
let blobServiceClient;
let containerClient;

try {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
    'DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net';
  
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient('resumes-upload');
  console.log('Azure Blob Storage client initialized');
} catch (error) {
  console.error('Error initializing Blob Storage:', error.message);
}

// SQL Database connection configuration
const sqlConfig = {
  user: process.env.SQL_USER || 'sqladmin',
  password: process.env.SQL_PASSWORD || 'cloudplouD1',
  server: process.env.SQL_SERVER || 'sql-resumesrv.database.windows.net',
  database: process.env.SQL_DATABASE || 'hr-workflow-db',
  options: {
    encrypt: true, // Use encryption for Azure SQL
    trustServerCertificate: false, // Don't trust the certificate in production
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// SQL Connection Pool
let sqlPool;

async function connectToSQL() {
  try {
    sqlPool = await sql.connect(sqlConfig);
    console.log('Connected to Azure SQL Database');
    return sqlPool;
  } catch (error) {
    console.error('SQL Database connection error:', error);
    throw error;
  }
}

// Initialize SQL connection on server start
connectToSQL().catch(err => {
  console.error('Failed to connect to SQL Database:', err);
});

// Endpoint to handle application form submission
app.post('/api/applications', upload.single('resumeFile'), async (req, res) => {
  const { 
    fullName, 
    email, 
    phone, 
    cgpa, 
    university, 
    experienceYears,
    jobId,
    applicationId,
    jobTitle
  } = req.body;

  let resumeBlobPath = null;
  let blobName = null;

  try {
    // Upload resume to Azure Blob Storage if file exists
    if (req.file) {
      // Generate timestamp for blob name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = (fullName || '').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      const sanitizedJobTitle = (jobTitle || 'job').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      const blobExtension = fileExtension === 'docx' ? 'pdf' : fileExtension;
      
      blobName = `${timestamp}_${sanitizedName}_${sanitizedJobTitle}.${blobExtension}`;
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload file with metadata
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { 
          blobContentType: req.file.mimetype 
        },
        metadata: {
          jobid: jobId || '',
          applicationid: applicationId || '',
          applicantname: fullName || '',
          applicantemail: email || '',
          jobtitle: jobTitle || '',
          timestamp: timestamp,
          originalfilename: req.file.originalname
        }
      });

      resumeBlobPath = blobName;
      console.log('Resume uploaded to Blob Storage:', resumeBlobPath);
    }

    // Insert application data into SQL Database
    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    
    // Generate ApplicationId if not provided
    const appId = applicationId || uuidv4();
    
    request.input('ApplicationId', sql.UniqueIdentifier, appId);
    request.input('CandidateName', sql.NVarChar(200), fullName);
    request.input('CandidateEmail', sql.NVarChar(256), email);
    request.input('CandidatePhone', sql.NVarChar(50), phone || null);
    request.input('CGPA', sql.Decimal(3, 2), cgpa ? parseFloat(cgpa) : null);
    request.input('University', sql.NVarChar(200), university || null);
    request.input('ExperienceYears', sql.Int, experienceYears ? parseInt(experienceYears) : null);
    request.input('ResumeBlobPath', sql.NVarChar(500), resumeBlobPath);
    request.input('JobId', sql.NVarChar(100), jobId || null);
    request.input('JobTitle', sql.NVarChar(200), jobTitle || null);
    request.input('Status', sql.NVarChar(50), 'Pending');

    const result = await request.query(`
      INSERT INTO Applications (
        ApplicationId, 
        CandidateName, 
        CandidateEmail, 
        CandidatePhone, 
        CGPA, 
        University, 
        ExperienceYears, 
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status
      )
      OUTPUT inserted.ApplicationId
      VALUES (
        @ApplicationId,
        @CandidateName, 
        @CandidateEmail, 
        @CandidatePhone, 
        @CGPA, 
        @University, 
        @ExperienceYears, 
        @ResumeBlobPath,
        @JobId,
        @JobTitle,
        @Status
      )
    `);

    const insertedApplicationId = result.recordset[0].ApplicationId;

    res.json({ 
      success: true, 
      applicationId: insertedApplicationId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process application',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== JOBS API ENDPOINTS ====================

// Get all active jobs (for public landing page)
app.get('/api/jobs', async (req, res) => {
  try {
    if (!sqlPool) {
      await connectToSQL();
    }

    const result = await sqlPool.request().query(`
      SELECT 
        JobId,
        Title,
        Description,
        Department,
        Location,
        EmploymentType,
        SalaryRange,
        Requirements,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Jobs
      WHERE IsActive = 1
      ORDER BY CreatedAt DESC
    `);

    // Convert IsActive bit to boolean and format JobId as string
    const jobs = result.recordset.map(job => ({
      jobId: job.JobId.toString(),
      title: job.Title,
      description: job.Description,
      department: job.Department,
      location: job.Location,
      employmentType: job.EmploymentType,
      salaryRange: job.SalaryRange,
      requirements: job.Requirements,
      isActive: job.IsActive === 1,
      createdAt: job.CreatedAt,
      updatedAt: job.UpdatedAt
    }));

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get all jobs (active + inactive) - for HR portal
app.get('/api/jobs/all', async (req, res) => {
  try {
    if (!sqlPool) {
      await connectToSQL();
    }

    const result = await sqlPool.request().query(`
      SELECT 
        JobId,
        Title,
        Description,
        Department,
        Location,
        EmploymentType,
        SalaryRange,
        Requirements,
        IsActive,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        Notes
      FROM Jobs
      ORDER BY CreatedAt DESC
    `);

    // Convert IsActive bit to boolean and format JobId as string
    const jobs = result.recordset.map(job => ({
      jobId: job.JobId.toString(),
      title: job.Title,
      description: job.Description,
      department: job.Department,
      location: job.Location,
      employmentType: job.EmploymentType,
      salaryRange: job.SalaryRange,
      requirements: job.Requirements,
      isActive: job.IsActive === 1,
      createdAt: job.CreatedAt,
      updatedAt: job.UpdatedAt,
      createdBy: job.CreatedBy,
      notes: job.Notes
    }));

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
app.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('JobId', sql.UniqueIdentifier, jobId);

    const result = await request.query(`
      SELECT 
        JobId,
        Title,
        Description,
        Department,
        Location,
        EmploymentType,
        SalaryRange,
        Requirements,
        IsActive,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        Notes
      FROM Jobs
      WHERE JobId = @JobId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.recordset[0];
    res.json({
      jobId: job.JobId.toString(),
      title: job.Title,
      description: job.Description,
      department: job.Department,
      location: job.Location,
      employmentType: job.EmploymentType,
      salaryRange: job.SalaryRange,
      requirements: job.Requirements,
      isActive: job.IsActive === 1,
      createdAt: job.CreatedAt,
      updatedAt: job.UpdatedAt,
      createdBy: job.CreatedBy,
      notes: job.Notes
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create new job - HR endpoint
app.post('/api/jobs', async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      location,
      employmentType,
      salaryRange,
      requirements,
      isActive,
      notes
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('Title', sql.NVarChar(200), title);
    request.input('Description', sql.NVarChar(sql.MAX), description);
    request.input('Department', sql.NVarChar(100), department || null);
    request.input('Location', sql.NVarChar(100), location || null);
    request.input('EmploymentType', sql.NVarChar(50), employmentType || null);
    request.input('SalaryRange', sql.NVarChar(100), salaryRange || null);
    request.input('Requirements', sql.NVarChar(sql.MAX), requirements || null);
    request.input('IsActive', sql.Bit, isActive !== undefined ? (isActive ? 1 : 0) : 1);
    request.input('CreatedBy', sql.NVarChar(100), 'HR User');
    request.input('Notes', sql.NVarChar(sql.MAX), notes || null);

    const result = await request.query(`
      INSERT INTO Jobs (
        Title, Description, Department, Location,
        EmploymentType, SalaryRange, Requirements,
        IsActive, CreatedBy, Notes
      )
      OUTPUT inserted.JobId, inserted.Title, inserted.CreatedAt
      VALUES (
        @Title, @Description, @Department, @Location,
        @EmploymentType, @SalaryRange, @Requirements,
        @IsActive, @CreatedBy, @Notes
      )
    `);

    const newJob = result.recordset[0];
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: {
        jobId: newJob.JobId.toString(),
        title: newJob.Title,
        createdAt: newJob.CreatedAt
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job', message: error.message });
  }
});

// Update job - HR endpoint
app.put('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      description,
      department,
      location,
      employmentType,
      salaryRange,
      requirements,
      isActive,
      notes
    } = req.body;

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('JobId', sql.UniqueIdentifier, jobId);
    request.input('Title', sql.NVarChar(200), title);
    request.input('Description', sql.NVarChar(sql.MAX), description);
    request.input('Department', sql.NVarChar(100), department || null);
    request.input('Location', sql.NVarChar(100), location || null);
    request.input('EmploymentType', sql.NVarChar(50), employmentType || null);
    request.input('SalaryRange', sql.NVarChar(100), salaryRange || null);
    request.input('Requirements', sql.NVarChar(sql.MAX), requirements || null);
    request.input('IsActive', sql.Bit, isActive !== undefined ? (isActive ? 1 : 0) : 1);
    request.input('Notes', sql.NVarChar(sql.MAX), notes || null);

    const result = await request.query(`
      UPDATE Jobs
      SET 
        Title = @Title,
        Description = @Description,
        Department = @Department,
        Location = @Location,
        EmploymentType = @EmploymentType,
        SalaryRange = @SalaryRange,
        Requirements = @Requirements,
        IsActive = @IsActive,
        Notes = @Notes,
        UpdatedAt = SYSUTCDATETIME()
      WHERE JobId = @JobId
      
      SELECT 
        JobId, Title, Description, Department, Location,
        EmploymentType, SalaryRange, Requirements, IsActive,
        CreatedAt, UpdatedAt, CreatedBy, Notes
      FROM Jobs
      WHERE JobId = @JobId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.recordset[0];
    res.json({
      success: true,
      message: 'Job updated successfully',
      job: {
        jobId: job.JobId.toString(),
        title: job.Title,
        description: job.Description,
        department: job.Department,
        location: job.Location,
        employmentType: job.EmploymentType,
        salaryRange: job.SalaryRange,
        requirements: job.Requirements,
        isActive: job.IsActive === 1,
        createdAt: job.CreatedAt,
        updatedAt: job.UpdatedAt,
        createdBy: job.CreatedBy,
        notes: job.Notes
      }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job', message: error.message });
  }
});

// Delete job - HR endpoint
app.delete('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('JobId', sql.UniqueIdentifier, jobId);

    // Check if job exists
    const checkResult = await request.query(`
      SELECT JobId, Title FROM Jobs WHERE JobId = @JobId
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if there are applications for this job
    const appCheck = await sqlPool.request().query(`
      SELECT COUNT(*) AS ApplicationCount 
      FROM Applications 
      WHERE JobId = @JobId
    `);
    request.input('JobId', sql.UniqueIdentifier, jobId);

    const appCount = appCheck.recordset[0].ApplicationCount;

    if (appCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete job. There are ${appCount} application(s) associated with this job.`,
        applicationCount: appCount
      });
    }

    // Delete the job
    await request.query('DELETE FROM Jobs WHERE JobId = @JobId');

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job', message: error.message });
  }
});

// Toggle job active status - HR endpoint
app.patch('/api/jobs/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('JobId', sql.UniqueIdentifier, jobId);
    request.input('IsActive', sql.Bit, isActive ? 1 : 0);

    const result = await request.query(`
      UPDATE Jobs
      SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
      WHERE JobId = @JobId
      
      SELECT JobId, Title, IsActive, UpdatedAt
      FROM Jobs
      WHERE JobId = @JobId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.recordset[0];
    res.json({
      success: true,
      message: `Job ${isActive ? 'activated' : 'deactivated'} successfully`,
      job: {
        jobId: job.JobId.toString(),
        title: job.Title,
        isActive: job.IsActive === 1,
        updatedAt: job.UpdatedAt
      }
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status', message: error.message });
  }
});

// Get applications endpoint (for HR portal)
app.get('/api/applications/job/:jobId', async (req, res) => {
  try {
    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('JobId', sql.NVarChar(100), req.params.jobId);

    const result = await request.query(`
      SELECT 
        ApplicationId,
        CandidateName,
        CandidateEmail,
        CandidatePhone,
        CGPA,
        University,
        ExperienceYears,
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status,
        SubmittedAt,
        Notes
      FROM Applications
      WHERE JobId = @JobId
      ORDER BY SubmittedAt DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get all applications endpoint
app.get('/api/applications', async (req, res) => {
  try {
    if (!sqlPool) {
      await connectToSQL();
    }

    const result = await sqlPool.request().query(`
      SELECT 
        ApplicationId,
        CandidateName,
        CandidateEmail,
        CandidatePhone,
        CGPA,
        University,
        ExperienceYears,
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status,
        SubmittedAt,
        Notes
      FROM Applications
      ORDER BY SubmittedAt DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status (Approve/Reject) - HR endpoint
app.patch('/api/applications/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status - only Approved or Rejected
    const validStatuses = ['Approved', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be either: Approved or Rejected' 
      });
    }

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('ApplicationId', sql.UniqueIdentifier, applicationId);
    request.input('Status', sql.NVarChar(50), status);

    const result = await request.query(`
      UPDATE Applications
      SET Status = @Status
      WHERE ApplicationId = @ApplicationId
      
      SELECT 
        ApplicationId,
        CandidateName,
        CandidateEmail,
        CandidatePhone,
        CGPA,
        University,
        ExperienceYears,
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status,
        SubmittedAt,
        Notes
      FROM Applications
      WHERE ApplicationId = @ApplicationId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ 
      success: true, 
      message: `Application ${status.toLowerCase()} successfully`,
      application: result.recordset[0]
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Get single application by ID
app.get('/api/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!sqlPool) {
      await connectToSQL();
    }

    const request = sqlPool.request();
    request.input('ApplicationId', sql.UniqueIdentifier, applicationId);

    const result = await request.query(`
      SELECT 
        ApplicationId,
        CandidateName,
        CandidateEmail,
        CandidatePhone,
        CGPA,
        University,
        ExperienceYears,
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status,
        SubmittedAt,
        Notes
      FROM Applications
      WHERE ApplicationId = @ApplicationId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Get application statistics - for HR dashboard
app.get('/api/applications/stats/summary', async (req, res) => {
  try {
    if (!sqlPool) {
      await connectToSQL();
    }

    // Get total applications, pending, approved, rejected
    const statsResult = await sqlPool.request().query(`
      SELECT 
        COUNT(*) AS Total,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS Pending,
        SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) AS Approved,
        SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) AS Rejected
      FROM Applications
    `);

    // Get applications per job
    const perJobResult = await sqlPool.request().query(`
      SELECT 
        j.JobId,
        j.Title AS JobTitle,
        COUNT(a.ApplicationId) AS ApplicationCount,
        SUM(CASE WHEN a.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN a.Status = 'Approved' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN a.Status = 'Rejected' THEN 1 ELSE 0 END) AS RejectedCount
      FROM Jobs j
      LEFT JOIN Applications a ON j.JobId = a.JobId
      GROUP BY j.JobId, j.Title
      ORDER BY ApplicationCount DESC
    `);

    const stats = statsResult.recordset[0];
    const jobsWithApps = perJobResult.recordset.map(row => ({
      jobId: row.JobId.toString(),
      jobTitle: row.JobTitle,
      totalApplications: row.ApplicationCount,
      pending: row.PendingCount,
      approved: row.ApprovedCount,
      rejected: row.RejectedCount
    }));

    res.json({
      summary: {
        total: stats.Total,
        pending: stats.Pending,
        approved: stats.Approved,
        rejected: stats.Rejected
      },
      byJob: jobsWithApps
    });
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get applications with optional filters
app.get('/api/applications/filter', async (req, res) => {
  try {
    const { jobId, status, search } = req.query;

    if (!sqlPool) {
      await connectToSQL();
    }

    let query = `
      SELECT 
        ApplicationId,
        CandidateName,
        CandidateEmail,
        CandidatePhone,
        CGPA,
        University,
        ExperienceYears,
        ResumeBlobPath,
        JobId,
        JobTitle,
        Status,
        SubmittedAt,
        Notes
      FROM Applications
      WHERE 1=1
    `;

    const request = sqlPool.request();

    if (jobId) {
      query += ` AND JobId = @JobId`;
      request.input('JobId', sql.NVarChar(100), jobId);
    }

    if (status) {
      query += ` AND Status = @Status`;
      request.input('Status', sql.NVarChar(50), status);
    }

    if (search) {
      query += ` AND (
        CandidateName LIKE @Search OR 
        CandidateEmail LIKE @Search OR 
        JobTitle LIKE @Search OR
        University LIKE @Search
      )`;
      request.input('Search', sql.NVarChar(500), `%${search}%`);
    }

    query += ` ORDER BY SubmittedAt DESC`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error filtering applications:', error);
    res.status(500).json({ error: 'Failed to filter applications' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (sqlPool) {
    await sqlPool.close();
    console.log('SQL connection closed');
  }
  process.exit(0);
});
