/**
 * Test Azure Blob Storage Connection
 * Run with: node test-blob-connection.js
 */

const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

async function testBlobConnection() {
  console.log('🔌 Testing Azure Blob Storage Connection...\n');

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString || connectionString.includes('YOUR_ACCOUNT_KEY')) {
      throw new Error('Azure Storage connection string not configured in .env file');
    }

    console.log('Configuration:');
    console.log(`  Account Name: resumestored`);
    console.log(`  Container: resumes-upload\n`);

    console.log('⏳ Connecting to Azure Blob Storage...');
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    console.log('✅ Connected successfully!\n');

    // Test container access
    console.log('📦 Checking container access...');
    const containerClient = blobServiceClient.getContainerClient('resumes-upload');
    
    // Check if container exists
    const exists = await containerClient.exists();
    
    if (exists) {
      console.log('✅ Container "resumes-upload" exists!\n');
      
      // List blobs in container
      console.log('📋 Listing blobs in container...');
      let blobCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        blobCount++;
        if (blobCount <= 5) {
          console.log(`  - ${blob.name} (${(blob.properties.contentLength / 1024).toFixed(2)} KB)`);
        }
      }
      
      if (blobCount === 0) {
        console.log('  (Container is empty - ready for uploads)');
      } else if (blobCount > 5) {
        console.log(`  ... and ${blobCount - 5} more blobs`);
      }
      
      console.log(`\n📊 Total blobs: ${blobCount}`);
    } else {
      console.log('⚠️  Container "resumes-upload" does not exist.');
      console.log('   Creating container...');
      
      await containerClient.create();
      console.log('✅ Container created successfully!');
    }

    // Test upload capability (create a test blob)
    console.log('\n🧪 Testing upload capability...');
    const testBlobName = `test-connection-${Date.now()}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(testBlobName);
    
    await blockBlobClient.upload('Test connection', 'Test connection'.length, {
      metadata: {
        test: 'true',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`✅ Test blob uploaded: ${testBlobName}`);
    
    // Clean up test blob
    console.log('🧹 Cleaning up test blob...');
    await blockBlobClient.delete();
    console.log('✅ Test blob deleted\n');

    console.log('✅ All tests passed! Blob Storage is ready to use.');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.message.includes('connection string')) {
      console.error('\n💡 Solution:');
      console.error('  1. Check that .env file exists');
      console.error('  2. Verify AZURE_STORAGE_CONNECTION_STRING is set correctly');
      console.error('  3. Make sure connection string includes AccountKey');
    } else if (error.message.includes('authentication') || error.message.includes('signature')) {
      console.error('\n💡 Possible issues:');
      console.error('  - Invalid AccountKey in connection string');
      console.error('  - Connection string format is incorrect');
      console.error('  - Storage account key may have been regenerated');
    } else if (error.message.includes('ContainerNotFound')) {
      console.error('\n💡 Solution:');
      console.error('  Container will be created automatically on first upload');
    }

    process.exit(1);
  }
}

// Run the test
testBlobConnection()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
