/**
 * Test Azure SQL Database Connection
 * Run with: node test-db-connection.js
 */

const sql = require('mssql');
require('dotenv').config();

// SQL Database connection configuration
const sqlConfig = {
  user: process.env.SQL_USER || 'sqladmin',
  password: process.env.SQL_PASSWORD || 'cloudplouD1',
  server: process.env.SQL_SERVER || 'sql-resumesrv.database.windows.net',
  database: process.env.SQL_DATABASE || 'hr-workflow-db',
  options: {
    encrypt: true, // Use encryption for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function testConnection() {
  console.log('🔌 Testing Azure SQL Database Connection...\n');
  console.log('Configuration:');
  console.log(`  Server: ${sqlConfig.server}`);
  console.log(`  Database: ${sqlConfig.database}`);
  console.log(`  User: ${sqlConfig.user}`);
  console.log(`  Encrypt: ${sqlConfig.options.encrypt}\n`);

  let pool;

  try {
    console.log('⏳ Connecting to database...');
    pool = await sql.connect(sqlConfig);
    console.log('✅ Successfully connected to Azure SQL Database!\n');

    // Test query: Get database version
    console.log('📊 Testing query execution...');
    const result = await pool.request().query('SELECT @@VERSION AS Version, DB_NAME() AS DatabaseName, USER_NAME() AS CurrentUser');
    
    console.log('✅ Query executed successfully!\n');
    console.log('Database Information:');
    console.log(`  Database Name: ${result.recordset[0].DatabaseName}`);
    console.log(`  Current User: ${result.recordset[0].CurrentUser}`);
    console.log(`  SQL Server Version: ${result.recordset[0].Version.split('\n')[0]}\n`);

    // Check if Applications table exists
    console.log('🔍 Checking for Applications table...');
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Applications'
    `);

    if (tableCheck.recordset.length > 0) {
      console.log('✅ Applications table exists!\n');

      // Get table structure
      console.log('📋 Table Structure:');
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

      columns.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
      });

      // Count records
      const countResult = await pool.request().query('SELECT COUNT(*) AS Total FROM Applications');
      console.log(`\n📊 Total Applications: ${countResult.recordset[0].Total}`);
    } else {
      console.log('⚠️  Applications table does not exist.');
      console.log('   Please run schema.sql to create the table.\n');
    }

    console.log('\n✅ All tests passed! Database connection is working correctly.');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.code === 'ETIMEOUT') {
      console.error('\n💡 Possible issues:');
      console.error('  - Firewall rules: Check Azure Portal > SQL Server > Firewall settings');
      console.error('  - Server name: Verify the server name is correct');
      console.error('  - Network connectivity: Check your internet connection');
    } else if (error.code === 'ELOGIN') {
      console.error('\n💡 Possible issues:');
      console.error('  - Invalid credentials: Check username and password');
      console.error('  - User permissions: Verify user has access to the database');
    } else if (error.code === 'ESOCKET') {
      console.error('\n💡 Possible issues:');
      console.error('  - Firewall blocking connection');
      console.error('  - Server not accessible from your IP address');
      console.error('  - Add your IP to Azure SQL Server firewall rules');
    }

    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Connection closed.');
    }
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
