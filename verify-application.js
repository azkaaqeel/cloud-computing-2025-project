/**
 * Script to verify that an application was successfully submitted to the database
 * Usage: node verify-application.js [applicationId]
 */

const sql = require('mssql');
require('dotenv').config();

const sqlConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function verifyApplication(applicationId = null) {
    try {
        console.log('Connecting to Azure SQL Database...');
        const pool = await sql.connect(sqlConfig);
        console.log('✓ Connected to database\n');

        const request = pool.request();

        if (applicationId) {
            // Get specific application
            console.log(`Looking for application: ${applicationId}\n`);
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
                console.log('❌ Application NOT FOUND in database');
                console.log(`   ApplicationId: ${applicationId}\n`);
            } else {
                const app = result.recordset[0];
                console.log('✅ Application FOUND in database!\n');
                console.log('Application Details:');
                console.log('─'.repeat(50));
                console.log(`Application ID: ${app.ApplicationId}`);
                console.log(`Candidate Name: ${app.CandidateName}`);
                console.log(`Email: ${app.CandidateEmail}`);
                console.log(`Phone: ${app.CandidatePhone || 'N/A'}`);
                console.log(`CGPA: ${app.CGPA || 'N/A'}`);
                console.log(`University: ${app.University || 'N/A'}`);
                console.log(`Experience Years: ${app.ExperienceYears || 'N/A'}`);
                console.log(`Resume Blob Path: ${app.ResumeBlobPath || 'N/A'}`);
                console.log(`Job ID: ${app.JobId || 'N/A'}`);
                console.log(`Job Title: ${app.JobTitle || 'N/A'}`);
                console.log(`Status: ${app.Status || 'Pending'}`);
                console.log(`Submitted At: ${app.SubmittedAt || 'N/A'}`);
                console.log(`Notes: ${app.Notes || 'N/A'}`);
                console.log('─'.repeat(50));
            }
        } else {
            // Get all applications (most recent first)
            console.log('Fetching all applications (most recent first)...\n');
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
                    SubmittedAt
                FROM Applications
                ORDER BY SubmittedAt DESC
            `);

            if (result.recordset.length === 0) {
                console.log('❌ No applications found in database\n');
            } else {
                console.log(`✅ Found ${result.recordset.length} application(s) in database:\n`);
                result.recordset.forEach((app, index) => {
                    console.log(`Application #${index + 1}:`);
                    console.log('─'.repeat(50));
                    console.log(`Application ID: ${app.ApplicationId}`);
                    console.log(`Candidate Name: ${app.CandidateName}`);
                    console.log(`Email: ${app.CandidateEmail}`);
                    console.log(`Phone: ${app.CandidatePhone || 'N/A'}`);
                    console.log(`CGPA: ${app.CGPA || 'N/A'}`);
                    console.log(`University: ${app.University || 'N/A'}`);
                    console.log(`Experience Years: ${app.ExperienceYears || 'N/A'}`);
                    console.log(`Resume Blob Path: ${app.ResumeBlobPath || 'N/A'}`);
                    console.log(`Job ID: ${app.JobId || 'N/A'}`);
                    console.log(`Job Title: ${app.JobTitle || 'N/A'}`);
                    console.log(`Status: ${app.Status || 'Pending'}`);
                    console.log(`Submitted At: ${app.SubmittedAt || 'N/A'}`);
                    console.log('─'.repeat(50));
                    console.log('');
                });
            }
        }

        await pool.close();
        console.log('\n✓ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ETIMEOUT') {
            console.error('   Connection timeout. Check your SQL server and firewall settings.');
        } else if (error.code === 'ELOGIN') {
            console.error('   Login failed. Check your SQL credentials in .env file.');
        }
        process.exit(1);
    }
}

// Get application ID from command line argument if provided
const applicationId = process.argv[2] || null;

verifyApplication(applicationId)
    .then(() => {
        console.log('\n✅ Verification complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });
