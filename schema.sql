-- Azure SQL Database Schema for HireHive Labs Job Application Portal
-- Database: hr-workflow-db

-- Create Applications table with all required fields
CREATE TABLE Applications (
  ApplicationId UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
  CandidateName NVARCHAR(200) NOT NULL,
  CandidateEmail NVARCHAR(256) NOT NULL,
  CandidatePhone NVARCHAR(50) NULL,
  CGPA DECIMAL(3, 2) NULL,  -- CGPA field (e.g., 3.75)
  University NVARCHAR(200) NULL,  -- University field
  ExperienceYears INT NULL,  -- Experience Years field
  ResumeBlobPath NVARCHAR(500) NULL,  -- Path to the uploaded resume file in Blob Storage
  JobId NVARCHAR(100) NULL,  -- Job ID the application is for
  JobTitle NVARCHAR(200) NULL,  -- Job title
  SubmittedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
  Status NVARCHAR(50) DEFAULT 'Pending',  -- E.g., Pending, Approved, Rejected
  Notes NVARCHAR(MAX) NULL
);

-- Create index on JobId for faster queries
CREATE INDEX IX_Applications_JobId ON Applications(JobId);

-- Create index on Status for filtering
CREATE INDEX IX_Applications_Status ON Applications(Status);

-- Create index on SubmittedAt for sorting
CREATE INDEX IX_Applications_SubmittedAt ON Applications(SubmittedAt DESC);

-- Example query to view all applications
-- SELECT * FROM Applications ORDER BY SubmittedAt DESC;

-- Example query to view applications by job
-- SELECT * FROM Applications WHERE JobId = 'your-job-id' ORDER BY SubmittedAt DESC;

-- Create Jobs table for job postings
CREATE TABLE Jobs (
  JobId UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
  Title NVARCHAR(200) NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Department NVARCHAR(100) NULL,
  Location NVARCHAR(100) NULL,
  EmploymentType NVARCHAR(50) NULL,  -- Full-time, Part-time, Contract, etc.
  SalaryRange NVARCHAR(100) NULL,
  Requirements NVARCHAR(MAX) NULL,
  IsActive BIT DEFAULT 1,  -- 1 = Active (accepting applications), 0 = Inactive
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
  CreatedBy NVARCHAR(100) NULL,
  Notes NVARCHAR(MAX) NULL
);

-- Create index on IsActive for faster filtering
CREATE INDEX IX_Jobs_IsActive ON Jobs(IsActive);

-- Create index on CreatedAt for sorting
CREATE INDEX IX_Jobs_CreatedAt ON Jobs(CreatedAt DESC);

-- Example query to view all active jobs
-- SELECT * FROM Jobs WHERE IsActive = 1 ORDER BY CreatedAt DESC;

-- Example query to view all jobs (for HR)
-- SELECT * FROM Jobs ORDER BY CreatedAt DESC;
