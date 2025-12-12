/**
 * Create Applications Table in Azure SQL Database
 * Run with: node create-table.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// SQL Database connection configuration
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

async function createTable() {
  console.log('🔌 Connecting to Azure SQL Database...\n');

  let pool;

  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected successfully!\n');

    // Check if table already exists
    console.log('🔍 Checking if Applications table exists...');
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Applications'
    `);

    if (checkTable.recordset.length > 0) {
      console.log('⚠️  Applications table already exists!\n');
      console.log('Skipping table creation.');
      
      // Show current table structure
      const columns = await pool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Applications'
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

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Remove comments and split SQL into individual statements
    const cleanedSQL = schemaSQL
      .split('\n')
      .map(line => {
        // Remove full-line comments
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');

    // Split by semicolon and filter empty statements
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length > 10); // Filter out very short strings

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip if it's just whitespace or a comment
      if (!statement || statement.trim().length === 0) continue;

      try {
        console.log(`  [${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
        await pool.request().query(statement);
        console.log(`  ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Some statements might fail (like CREATE INDEX if it already exists)
        if (error.message.includes('already exists') || 
            error.message.includes('There is already') ||
            error.message.includes('duplicate key')) {
          console.log(`  ⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`  ❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Table creation completed!\n');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const verifyTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Applications'
    `);

    if (verifyTable.recordset.length > 0) {
      console.log('✅ Applications table created successfully!\n');

      // Show table structure
      const columns = await pool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Applications'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('Table Structure:');
      columns.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
      });

      // Check indexes
      const indexes = await pool.request().query(`
        SELECT 
          i.name AS IndexName,
          i.type_desc AS IndexType
        FROM sys.indexes i
        WHERE i.object_id = OBJECT_ID('Applications') AND i.name IS NOT NULL
      `);

      if (indexes.recordset.length > 0) {
        console.log('\nIndexes created:');
        indexes.recordset.forEach(idx => {
          console.log(`  - ${idx.IndexName} (${idx.IndexType})`);
        });
      }
    } else {
      throw new Error('Table was not created successfully');
    }

  } catch (error) {
    console.error('\n❌ Error creating table:\n');
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

// Run the script
createTable()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
