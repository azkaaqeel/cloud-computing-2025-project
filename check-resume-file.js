/**
 * Check if a specific resume file exists in Azure Blob Storage
 * Usage: node check-resume-file.js [blobName]
 */

const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

async function checkResumeFile(blobName = null) {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        
        if (!connectionString || connectionString.includes('YOUR_ACCOUNT_KEY')) {
            throw new Error('Azure Storage connection string not configured in .env file');
        }

        console.log('Connecting to Azure Blob Storage...');
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('resumes-upload');
        
        console.log('✓ Connected\n');

        if (blobName) {
            // Check specific file
            console.log(`Looking for file: ${blobName}\n`);
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const exists = await blockBlobClient.exists();
            
            if (exists) {
                const properties = await blockBlobClient.getProperties();
                console.log('✅ File FOUND in Blob Storage!\n');
                console.log('File Details:');
                console.log('─'.repeat(50));
                console.log(`Blob Name: ${blobName}`);
                console.log(`Size: ${(properties.contentLength / 1024).toFixed(2)} KB`);
                console.log(`Content Type: ${properties.contentType}`);
                console.log(`Last Modified: ${properties.lastModified}`);
                console.log(`Metadata:`);
                Object.keys(properties.metadata).forEach(key => {
                    console.log(`  ${key}: ${properties.metadata[key]}`);
                });
                console.log('─'.repeat(50));
            } else {
                console.log(`❌ File NOT FOUND: ${blobName}\n`);
            }
        } else {
            // List all resume files (most recent first)
            console.log('Listing all resume files in container...\n');
            const blobs = [];
            for await (const blob of containerClient.listBlobsFlat()) {
                blobs.push(blob);
            }
            
            // Sort by last modified (most recent first)
            blobs.sort((a, b) => new Date(b.properties.lastModified) - new Date(a.properties.lastModified));
            
            console.log(`Found ${blobs.length} file(s):\n`);
            blobs.slice(0, 10).forEach((blob, index) => {
                console.log(`${index + 1}. ${blob.name}`);
                console.log(`   Size: ${(blob.properties.contentLength / 1024).toFixed(2)} KB`);
                console.log(`   Modified: ${blob.properties.lastModified}`);
                console.log('');
            });
            
            if (blobs.length > 10) {
                console.log(`... and ${blobs.length - 10} more files\n`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get blob name from command line argument if provided
const blobName = process.argv[2] || null;

checkResumeFile(blobName)
    .then(() => {
        console.log('\n✅ Check complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Check failed:', error);
        process.exit(1);
    });
