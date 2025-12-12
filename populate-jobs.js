/**
 * Populate Jobs table with sample job postings
 * Run with: node populate-jobs.js
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

const sampleJobs = [
    {
        title: 'Senior Software Engineer',
        description: 'We are looking for an experienced software engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies. The ideal candidate should have strong problem-solving skills and experience with cloud platforms.',
        department: 'Engineering',
        location: 'Remote / Karachi, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$80,000 - $120,000',
        requirements: '• 5+ years of experience in software development\n• Strong knowledge of JavaScript, Node.js, and React\n• Experience with cloud platforms (Azure preferred)\n• Bachelor\'s degree in Computer Science or related field\n• Excellent communication and teamwork skills',
        isActive: true
    },
    {
        title: 'Product Designer',
        description: 'Join our design team to create beautiful and functional products that users love. You will work closely with product managers and engineers to design user interfaces and experiences. We value creativity, attention to detail, and user-centered design thinking.',
        department: 'Design',
        location: 'Hybrid / Lahore, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$60,000 - $90,000',
        requirements: '• 3+ years of experience in product design\n• Proficiency in Figma, Adobe Creative Suite\n• Strong portfolio demonstrating UX/UI design skills\n• Understanding of user research and testing methodologies\n• Bachelor\'s degree in Design or related field',
        isActive: true
    },
    {
        title: 'Data Scientist',
        description: 'We are seeking a talented Data Scientist to help us extract insights from complex datasets and build predictive models. You will work with large-scale data, develop machine learning models, and collaborate with cross-functional teams to drive data-driven decisions.',
        department: 'Data & Analytics',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryRange: '$90,000 - $130,000',
        requirements: '• Master\'s degree in Data Science, Statistics, or related field\n• 4+ years of experience in data science\n• Proficiency in Python, R, SQL\n• Experience with machine learning frameworks (TensorFlow, PyTorch)\n• Strong statistical analysis skills',
        isActive: true
    },
    {
        title: 'DevOps Engineer',
        description: 'Looking for a DevOps Engineer to help us build and maintain our cloud infrastructure. You will be responsible for CI/CD pipelines, infrastructure automation, monitoring, and ensuring high availability of our services. Experience with Azure is highly preferred.',
        department: 'Engineering',
        location: 'Remote / Islamabad, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$85,000 - $115,000',
        requirements: '• 4+ years of DevOps experience\n• Strong knowledge of Azure cloud services\n• Experience with Docker, Kubernetes, Terraform\n• Proficiency in scripting (Bash, PowerShell, Python)\n• Understanding of CI/CD pipelines and automation',
        isActive: true
    },
    {
        title: 'Marketing Manager',
        description: 'Lead our marketing efforts and help grow our brand presence. You will develop and execute marketing strategies, manage campaigns, analyze performance metrics, and work with external agencies. This role requires creativity, strategic thinking, and strong communication skills.',
        department: 'Marketing',
        location: 'Karachi, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$70,000 - $100,000',
        requirements: '• 5+ years of marketing experience\n• Experience with digital marketing channels\n• Strong analytical and project management skills\n• Bachelor\'s degree in Marketing or related field\n• Excellent written and verbal communication',
        isActive: true
    },
    {
        title: 'Frontend Developer',
        description: 'We need a skilled Frontend Developer to build responsive and interactive web applications. You will work with React, TypeScript, and modern CSS frameworks to create seamless user experiences. Join us if you are passionate about creating beautiful, performant web applications.',
        department: 'Engineering',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryRange: '$65,000 - $95,000',
        requirements: '• 3+ years of frontend development experience\n• Strong proficiency in React, TypeScript, HTML5, CSS3\n• Experience with state management (Redux, Zustand)\n• Knowledge of responsive design principles\n• Bachelor\'s degree in Computer Science or related field',
        isActive: true
    },
    {
        title: 'HR Business Partner',
        description: 'Join our HR team to support talent acquisition, employee relations, and organizational development. You will work closely with managers to develop HR strategies, manage recruitment processes, and ensure a positive employee experience.',
        department: 'Human Resources',
        location: 'Karachi, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$55,000 - $80,000',
        requirements: '• 4+ years of HR experience\n• Strong understanding of HR best practices\n• Excellent interpersonal and communication skills\n• Bachelor\'s degree in HR or related field\n• Experience with HRIS systems',
        isActive: true
    },
    {
        title: 'Quality Assurance Engineer',
        description: 'We are looking for a QA Engineer to ensure the quality of our software products. You will design and execute test plans, identify bugs, work with developers to resolve issues, and help maintain high quality standards across our products.',
        department: 'Engineering',
        location: 'Hybrid / Lahore, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$50,000 - $75,000',
        requirements: '• 3+ years of QA/testing experience\n• Knowledge of testing methodologies and tools\n• Experience with automated testing frameworks\n• Strong attention to detail and analytical skills\n• Bachelor\'s degree in Computer Science or related field',
        isActive: true
    },
    {
        title: 'Sales Representative',
        description: 'We are expanding our sales team and looking for motivated Sales Representatives. You will identify new business opportunities, build relationships with clients, and help drive revenue growth. This role offers competitive commission structure.',
        department: 'Sales',
        location: 'Karachi, Pakistan',
        employmentType: 'Full-time',
        salaryRange: '$40,000 - $70,000 + Commission',
        requirements: '• 2+ years of sales experience\n• Strong communication and negotiation skills\n• Self-motivated and goal-oriented\n• Bachelor\'s degree preferred\n• Experience in B2B sales is a plus',
        isActive: false
    },
    {
        title: 'Content Writer',
        description: 'Looking for a creative Content Writer to produce engaging content for our website, blog, and marketing materials. You will write articles, blog posts, social media content, and help maintain our brand voice across all channels.',
        department: 'Marketing',
        location: 'Remote',
        employmentType: 'Part-time',
        salaryRange: '$30,000 - $50,000',
        requirements: '• 2+ years of content writing experience\n• Excellent writing and editing skills\n• Knowledge of SEO best practices\n• Portfolio of published work\n• Bachelor\'s degree in English, Journalism, or related field',
        isActive: true
    }
];

async function populateJobs() {
    let pool;
    
    try {
        console.log('🔌 Connecting to Azure SQL Database...\n');
        pool = await sql.connect(sqlConfig);
        console.log('✅ Connected successfully!\n');

        // Check if Jobs table exists
        console.log('🔍 Checking if Jobs table exists...');
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Jobs'
        `);

        if (tableCheck.recordset.length === 0) {
            console.log('❌ Jobs table does not exist!');
            console.log('   Please run schema.sql first to create the table.\n');
            await pool.close();
            process.exit(1);
        }

        console.log('✅ Jobs table exists\n');

        // Check if table already has data
        const countResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Jobs');
        const existingCount = countResult.recordset[0].Total;

        if (existingCount > 0) {
            console.log(`⚠️  Jobs table already contains ${existingCount} job(s).`);
            console.log('   Do you want to add sample jobs anyway? (This will not delete existing jobs)');
            console.log('   Proceeding with insert...\n');
        }

        // Insert sample jobs
        console.log('📝 Inserting sample jobs...\n');
        let inserted = 0;
        let skipped = 0;

        for (const job of sampleJobs) {
            try {
                const request = pool.request();
                request.input('Title', sql.NVarChar(200), job.title);
                request.input('Description', sql.NVarChar(sql.MAX), job.description);
                request.input('Department', sql.NVarChar(100), job.department || null);
                request.input('Location', sql.NVarChar(100), job.location || null);
                request.input('EmploymentType', sql.NVarChar(50), job.employmentType || null);
                request.input('SalaryRange', sql.NVarChar(100), job.salaryRange || null);
                request.input('Requirements', sql.NVarChar(sql.MAX), job.requirements || null);
                request.input('IsActive', sql.Bit, job.isActive ? 1 : 0);
                request.input('CreatedBy', sql.NVarChar(100), 'System');

                await request.query(`
                    INSERT INTO Jobs (
                        Title, Description, Department, Location, 
                        EmploymentType, SalaryRange, Requirements, 
                        IsActive, CreatedBy
                    )
                    VALUES (
                        @Title, @Description, @Department, @Location,
                        @EmploymentType, @SalaryRange, @Requirements,
                        @IsActive, @CreatedBy
                    )
                `);

                console.log(`  ✓ Inserted: ${job.title}`);
                inserted++;
            } catch (error) {
                if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                    console.log(`  ⊘ Skipped (duplicate): ${job.title}`);
                    skipped++;
                } else {
                    console.error(`  ✗ Error inserting ${job.title}:`, error.message);
                }
            }
        }

        console.log(`\n✅ Completed!`);
        console.log(`   Inserted: ${inserted} job(s)`);
        if (skipped > 0) {
            console.log(`   Skipped: ${skipped} job(s)`);
        }

        // Show summary
        const finalCount = await pool.request().query('SELECT COUNT(*) AS Total FROM Jobs');
        const activeCount = await pool.request().query('SELECT COUNT(*) AS Total FROM Jobs WHERE IsActive = 1');
        
        console.log(`\n📊 Database Summary:`);
        console.log(`   Total Jobs: ${finalCount.recordset[0].Total}`);
        console.log(`   Active Jobs: ${activeCount.recordset[0].Total}`);

        await pool.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ETIMEOUT') {
            console.error('   Connection timeout. Check your SQL server and firewall settings.');
        } else if (error.code === 'ELOGIN') {
            console.error('   Login failed. Check your SQL credentials in .env file.');
        }
        if (pool) {
            await pool.close();
        }
        process.exit(1);
    }
}

populateJobs()
    .then(() => {
        console.log('\n✨ Population completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
