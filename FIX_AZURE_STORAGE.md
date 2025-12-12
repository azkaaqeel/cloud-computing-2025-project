# Fix Azure Blob Storage Authentication Error

## Error Message
```
Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.
```

## Problem
The backend server is trying to connect to Azure Blob Storage but doesn't have valid credentials.

## Solution

### Step 1: Get Your Azure Storage Account Key

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to Storage Account**:
   - Search for "resumestored" in the top search bar
   - Click on your storage account: **resumestored**
3. **Get Connection String**:
   - In the left menu, click **"Access keys"**
   - Under **"key1"**, click **"Show"** next to the connection string
   - Click **"Copy"** to copy the full connection string
   - It should look like:
     ```
     DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=xxxxx...;EndpointSuffix=core.windows.net
     ```

### Step 2: Create .env File

**Option A: Using the helper script**
```bash
node setup-env.js
```

**Option B: Manual creation**

Create a file named `.env` in the project root:

```env
# Azure SQL Database Configuration
SQL_USER=sqladmin
SQL_PASSWORD=cloudplouD1
SQL_SERVER=sql-resumesrv.database.windows.net
SQL_DATABASE=hr-workflow-db

# Azure Blob Storage Connection String
# Paste your connection string here (the full string from Azure Portal)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=YOUR_ACTUAL_KEY_HERE;EndpointSuffix=core.windows.net

# Server Port
PORT=3000
```

**Important**: Replace `YOUR_ACTUAL_KEY_HERE` with your actual connection string from Azure Portal.

### Step 3: Restart Backend Server

After creating the `.env` file:

1. **Stop the current server** (Ctrl+C)
2. **Restart it**:
   ```bash
   npm start
   ```

### Step 4: Verify

The server should now show:
```
✅ Azure Blob Storage client initialized
✅ Connected to Azure SQL Database
```

## Alternative: Using SAS Token (if you prefer)

If you want to use SAS tokens instead of connection strings, you can modify `server.js` to use the SAS URL from `upload.js`. However, connection strings are simpler for backend use.

## Still Having Issues?

1. **Check .env file exists**: `ls -la .env`
2. **Verify connection string format**: Should start with `DefaultEndpointsProtocol=https`
3. **Check Azure Portal**: Ensure storage account is active
4. **Check container exists**: Container name should be `resumes-upload`

## Quick Test

After setting up, test the connection:
```bash
curl http://localhost:3000/api/health
```

Then try submitting an application form - the blob upload should work now!
