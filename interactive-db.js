/**
 * Interactive Database Query Tool
 * Run with: node interactive-db.js
 * 
 * This allows you to run custom SQL queries against your Azure SQL Database
 */

const sql = require('mssql');
const readline = require('readline');
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

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SQL> '
});

let pool;

// Helper function to format and display results
function displayResults(result) {
    if (!result.recordset || result.recordset.length === 0) {
        console.log('\n✓ Query executed successfully. No rows returned.\n');
        return;
    }

    const rows = result.recordset;
    const columns = Object.keys(rows[0]);
    
    // Calculate column widths
    const colWidths = {};
    columns.forEach(col => {
        colWidths[col] = Math.max(
            col.length,
            ...rows.map(row => String(row[col] || '').length)
        );
    });

    // Print header
    console.log('\n' + '─'.repeat(columns.reduce((sum, col) => sum + colWidths[col] + 3, 0)));
    const header = columns.map(col => col.padEnd(colWidths[col])).join(' | ');
    console.log(header);
    console.log('─'.repeat(columns.reduce((sum, col) => sum + colWidths[col] + 3, 0)));

    // Print rows
    rows.forEach(row => {
        const rowStr = columns.map(col => String(row[col] || '').padEnd(colWidths[col])).join(' | ');
        console.log(rowStr);
    });

    console.log('─'.repeat(columns.reduce((sum, col) => sum + colWidths[col] + 3, 0)));
    console.log(`\n✓ ${rows.length} row(s) returned\n`);
}

// Helper function to execute query
async function executeQuery(query) {
    try {
        if (!pool) {
            console.log('Connecting to database...');
            pool = await sql.connect(sqlConfig);
            console.log('✓ Connected!\n');
        }

        const request = pool.request();
        const result = await request.query(query);
        
        displayResults(result);
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
    }
}

// Main interactive loop
async function startInteractive() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Interactive Azure SQL Database Query Tool');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Connected to:');
    console.log(`  Server: ${sqlConfig.server}`);
    console.log(`  Database: ${sqlConfig.database}`);
    console.log(`  User: ${sqlConfig.user}\n`);
    console.log('Type SQL queries and press Enter to execute.');
    console.log('Commands:');
    console.log('  - Type "exit" or "quit" to close');
    console.log('  - Type "help" for example queries');
    console.log('  - Multi-line queries: Type "go" on a new line to execute\n');
    console.log('Example queries:');
    console.log('  SELECT * FROM Applications');
    console.log('  SELECT COUNT(*) FROM Applications');
    console.log('  SELECT * FROM Applications WHERE Status = \'Pending\'');
    console.log('───────────────────────────────────────────────────────\n');

    let currentQuery = '';

    rl.prompt();

    rl.on('line', async (input) => {
        const line = input.trim();

        if (line.toLowerCase() === 'exit' || line.toLowerCase() === 'quit') {
            console.log('\nClosing connection...');
            if (pool) {
                await pool.close();
            }
            rl.close();
            process.exit(0);
            return;
        }

        if (line.toLowerCase() === 'help') {
            console.log('\nExample Queries:');
            console.log('───────────────────────────────────────────────────────');
            console.log('1. View all applications:');
            console.log('   SELECT * FROM Applications');
            console.log('');
            console.log('2. Count total applications:');
            console.log('   SELECT COUNT(*) AS Total FROM Applications');
            console.log('');
            console.log('3. View pending applications:');
            console.log('   SELECT * FROM Applications WHERE Status = \'Pending\'');
            console.log('');
            console.log('4. View applications by job:');
            console.log('   SELECT * FROM Applications WHERE JobId = \'YOUR_JOB_ID\'');
            console.log('');
            console.log('5. Update application status:');
            console.log('   UPDATE Applications SET Status = \'Approved\' WHERE ApplicationId = \'YOUR_ID\'');
            console.log('');
            console.log('6. View table structure:');
            console.log('   SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'Applications\'');
            console.log('───────────────────────────────────────────────────────\n');
            rl.prompt();
            return;
        }

        if (line.toLowerCase() === 'go' && currentQuery) {
            // Execute accumulated query
            await executeQuery(currentQuery);
            currentQuery = '';
            rl.prompt();
            return;
        }

        if (line) {
            currentQuery += (currentQuery ? ' ' : '') + line;
        }

        // Check if query ends with semicolon (single-line query)
        if (currentQuery.trim().endsWith(';')) {
            currentQuery = currentQuery.trim().slice(0, -1); // Remove semicolon
            await executeQuery(currentQuery);
            currentQuery = '';
        }

        rl.prompt();
    });

    rl.on('close', async () => {
        if (pool) {
            await pool.close();
        }
        console.log('\n\nGoodbye!');
        process.exit(0);
    });
}

// Start the interactive session
startInteractive().catch(error => {
    console.error('Failed to start:', error);
    process.exit(1);
});
