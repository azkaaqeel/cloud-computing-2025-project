/**
 * Setup Environment Variables Helper
 * This script helps create .env file with Azure Storage configuration
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnv() {
  console.log('🔧 Azure Storage Configuration Setup\n');
  console.log('You need your Azure Storage Account Key to continue.');
  console.log('To get it:');
  console.log('  1. Go to Azure Portal (https://portal.azure.com)');
  console.log('  2. Navigate to: Storage accounts > resumestored');
  console.log('  3. Click "Access keys" in the left menu');
  console.log('  4. Copy "key1" or "key2" connection string\n');

  const hasKey = await question('Do you have your Azure Storage Account Key? (yes/no): ');
  
  if (hasKey.toLowerCase() !== 'yes' && hasKey.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please get your Azure Storage Account Key first.');
    console.log('   You can find it in Azure Portal > Storage Account > Access keys');
    console.log('   Copy the full "Connection string" (not just the key)\n');
    rl.close();
    return;
  }

  const connectionString = await question('\nPaste your Azure Storage Connection String: ');
  
  if (!connectionString || connectionString.includes('YOUR_ACCOUNT_KEY')) {
    console.log('\n❌ Invalid connection string. Please try again.');
    rl.close();
    return;
  }

  // Create .env file content
  const envContent = `# Azure SQL Database Configuration
SQL_USER=sqladmin
SQL_PASSWORD=cloudplouD1
SQL_SERVER=sql-resumesrv.database.windows.net
SQL_DATABASE=hr-workflow-db

# Azure Blob Storage Connection String
AZURE_STORAGE_CONNECTION_STRING=${connectionString.trim()}

# Server Port
PORT=3000
`;

  // Write .env file
  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Restart your backend server: npm start');
    console.log('  2. Test the connection\n');
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setupEnv();
