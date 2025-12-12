# Troubleshooting Guide

## Error: 404 (File not found) and 501 (Unsupported method)

### Problem Explanation

You're seeing these errors because:

1. **404 Error**: Python's HTTP server (`python3 -m http.server`) only serves **static files** (HTML, CSS, JS). It cannot handle API routes like `/api/jobs` or `/api/applications`.

2. **501 Error**: Python's HTTP server doesn't support POST requests - it only handles GET requests for static files.

### Solution

You need to run **TWO servers**:

1. **Backend Server (Node.js)** - Handles API requests on port 3000
2. **Frontend Server (Python)** - Serves static files on port 8000 (optional, since backend also serves static files)

## Quick Fix

### Option 1: Use Backend Server for Everything (Recommended)

The backend server (`server.js`) already serves static files, so you can use it for both frontend and API:

```bash
# Start backend server (serves both frontend and API)
npm start
# or
node server.js
```

Then access:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Option 2: Run Both Servers

If you want to keep Python server for frontend:

**Terminal 1 - Backend:**
```bash
npm start
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
# Frontend runs on http://localhost:8000
```

The frontend code is already configured to call `http://localhost:3000/api` when running on port 8000.

## Common Issues

### Issue 1: Backend Server Won't Start

**Error**: `Cannot find module 'mssql'` or similar

**Solution**:
```bash
npm install
```

### Issue 2: Blob Storage Connection Error

**Error**: `Error initializing Blob Storage`

**Solution**: Create `.env` file with your Azure Storage connection string:
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
```

### Issue 3: SQL Database Connection Error

**Error**: `Connection failed` or `ETIMEOUT`

**Solution**: 
1. Check firewall rules in Azure Portal
2. Verify credentials in `.env` file
3. Test connection: `node test-db-connection.js`

### Issue 4: CORS Errors

**Error**: `CORS policy` or `Access-Control-Allow-Origin`

**Solution**: The backend already has CORS enabled. If issues persist:
1. Ensure backend is running on port 3000
2. Check that frontend calls the correct API URL

## Step-by-Step Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file** (if not exists):
   ```env
   SQL_USER=sqladmin
   SQL_PASSWORD=cloudplouD1
   SQL_SERVER=sql-resumesrv.database.windows.net
   SQL_DATABASE=hr-workflow-db
   AZURE_STORAGE_CONNECTION_STRING=Your_Connection_String_Here
   PORT=3000
   ```

3. **Start backend server**:
   ```bash
   npm start
   ```

4. **Access application**:
   - Open browser: http://localhost:3000
   - The backend serves both frontend files and API endpoints

## Verify Everything Works

1. **Check backend health**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test database connection**:
   ```bash
   node test-db-connection.js
   ```

3. **Test table exists**:
   ```bash
   node create-table.js
   ```

## Current Status

✅ Database connection: Working
✅ Applications table: Created
✅ Backend code: Ready
⏳ Backend server: Needs to be started

## Next Steps

1. Stop Python server (Ctrl+C)
2. Start Node.js backend: `npm start`
3. Access: http://localhost:3000
4. Test application submission
