/**
 * Create Jobs table in Azure SQL Database
 * Run with: node create-jobs-table.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sqlConfig = {
  user: process.env.SQL_USER || 'sqladmin',
  password: process.env.SQL_PASSWORD || 'cloudplouD1',
  server: process.env.SQL_SERVER || 'sql-resumesrv.database.windows.net',
  database: process.env.SQL_DATABASE || 'hr-workflow-db',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function createJobsTable() {
  console.log('🔌 Connecting to Azure SQL Database...\n');

  let pool;

  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected successfully!\n');

    // Check if Jobs table already exists
    console.log('🔍 Checking if Jobs table exists...');
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Jobs'
    `);

    if (checkTable.recordset.length > 0) {
      console.log('⚠️  Jobs table already exists!\n');
      console.log('Skipping table creation.');
      
      // Show current table structure
      const columns = await pool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Jobs'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('\nCurrent table structure:');
      columns.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
      });

      await pool.close();
      return;
    }

    // Read schema.sql file
    console.log('📄 Reading schema.sql file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('schema.sql file not found!');
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract Jobs table creation SQL
    const jobsTableStart = schemaContent.indexOf('-- Create Jobs table');
    if (jobsTableStart === -1) {
      throw new Error('Jobs table definition not found in schema.sql');
    }

    const jobsTableSQL = schemaContent.substring(jobsTableStart);
    
    // Remove comments and split by semicolon
    const statements = jobsTableSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.toUpperCase().includes('CREATE'));

    console.log(`Found ${statements.length} SQL statement(s) to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}...`);
          await pool.request().query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully\n`);
        } catch (error) {
          // Ignore "already exists" errors for indexes
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Jobs table created successfully!\n');

    // Verify table creation
    const verify = await pool.request().query(`
      SELECT COUNT(*) AS ColumnCount
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Jobs'
    `);

    console.log(`📊 Jobs table has ${verify.recordset[0].ColumnCount} columns`);

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

createJobsTable()
  .then(() => {
    console.log('\n✨ Table creation completed successfully!');
    console.log('\n💡 Next step: Run "node populate-jobs.js" to add sample job postings.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
