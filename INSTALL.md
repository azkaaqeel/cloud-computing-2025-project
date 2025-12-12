# Quick Installation Guide

## Step-by-Step Installation

### 1. Install Required Packages

Open your terminal in the project directory and run:

```bash
npm install mssql @azure/storage-blob multer express dotenv cors uuid
```

Or simply:

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the project root:

```bash
# Copy this template and fill in your values
cat > .env << EOF
SQL_USER=sqladmin
SQL_PASSWORD=cloudplouD1
SQL_SERVER=sql-resumesrv.database.windows.net
SQL_DATABASE=hr-workflow-db
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=resumestored;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net
PORT=3000
EOF
```

**Important:** Replace `YOUR_ACCOUNT_KEY` with your actual Azure Storage Account key from Azure Portal.

### 3. Set Up SQL Database

Connect to your Azure SQL Database and run the `schema.sql` file:

**Option A: Using Azure Portal**
1. Go to Azure Portal > SQL Database > Query editor
2. Copy contents of `schema.sql`
3. Paste and execute

**Option B: Using sqlcmd**
```bash
sqlcmd -S sql-resumesrv.database.windows.net -U sqladmin -P cloudplouD1 -d hr-workflow-db -i schema.sql
```

### 4. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 5. Start the Frontend (in a new terminal)

```bash
python3 -m http.server 8000
```

Access the application at `http://localhost:8000`

## Verification

1. **Check Server:** Visit `http://localhost:3000/api/health` - should return `{"status":"ok"}`
2. **Submit Test Application:** Fill out the form and submit
3. **Check SQL Database:** Query `SELECT * FROM Applications`
4. **Check Blob Storage:** Verify file uploaded in `resumes-upload` container

## Troubleshooting

- **Port already in use:** Change `PORT` in `.env` file
- **SQL connection failed:** Check firewall rules in Azure Portal
- **Blob upload failed:** Verify connection string and container name

For detailed setup instructions, see `SETUP.md`
