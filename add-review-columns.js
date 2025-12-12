/**
 * Add HR Review Columns to Applications Table
 * Run with: node add-review-columns.js
 */

const sql = require('mssql');
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

async function addReviewColumns() {
  console.log('🔌 Connecting to Azure SQL Database...\n');

  let pool;

  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected successfully!\n');

    // Check if ReviewedBy column exists
    console.log('🔍 Checking for ReviewedBy column...');
    const checkReviewedBy = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Applications' AND COLUMN_NAME = 'ReviewedBy'
    `);

    if (checkReviewedBy.recordset.length > 0) {
      console.log('⚠️  ReviewedBy column already exists\n');
    } else {
      console.log('➕ Adding ReviewedBy column...');
      await pool.request().query(`
        ALTER TABLE Applications
        ADD ReviewedBy NVARCHAR(256) NULL
      `);
      console.log('✅ ReviewedBy column added successfully!\n');
    }

    // Check if ReviewedAt column exists
    console.log('🔍 Checking for ReviewedAt column...');
    const checkReviewedAt = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Applications' AND COLUMN_NAME = 'ReviewedAt'
    `);

    if (checkReviewedAt.recordset.length > 0) {
      console.log('⚠️  ReviewedAt column already exists\n');
    } else {
      console.log('➕ Adding ReviewedAt column...');
      await pool.request().query(`
        ALTER TABLE Applications
        ADD ReviewedAt DATETIME2 NULL
      `);
      console.log('✅ ReviewedAt column added successfully!\n');
    }

    // Verify the changes
    console.log('📋 Verifying table structure...');
    const columns = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Applications'
      AND COLUMN_NAME IN ('Status', 'ReviewedBy', 'ReviewedAt', 'Notes')
      ORDER BY COLUMN_NAME
    `);

    console.log('\nReview-related columns:');
    columns.recordset.forEach(col => {
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Status values:');
    console.log('  - Pending: Application awaiting review');
    console.log('  - Approved: Application approved by HR');
    console.log('  - Rejected: Application rejected by HR');

  } catch (error) {
    console.error('\n❌ Error adding columns:\n');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.originalError) {
      console.error(`  Original Error: ${error.originalError.message}`);
    }

    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Connection closed.');
    }
  }
}

// Run the migration
addReviewColumns()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
