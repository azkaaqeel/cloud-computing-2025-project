# How to Configure CORS for Azure Blob Storage

The upload is failing because Azure Blob Storage needs CORS (Cross-Origin Resource Sharing) configured to allow requests from your browser.

## Steps to Configure CORS:

### Option 1: Using Azure Portal (Easiest)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account: **resumestored**
3. In the left menu, scroll down to **Settings** → **Resource sharing (CORS)**
4. Click on **Blob service** tab
5. Click **+ Add** to add a new CORS rule
6. Configure the rule:
   - **Allowed origins**: `http://localhost:8000` (or `*` for all origins - less secure but easier for testing)
   - **Allowed methods**: `PUT, GET, HEAD, OPTIONS`
   - **Allowed headers**: `*` (or specific headers: `x-ms-meta-*, x-ms-blob-type, x-ms-version, Content-Type, Content-Length`)
   - **Exposed headers**: `*`
   - **Max age**: `3600` (or higher)
7. Click **Save**

### Option 2: Using Azure CLI

```bash
az storage cors add \
  --services b \
  --methods PUT GET HEAD OPTIONS \
  --origins http://localhost:8000 \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name resumestored
```

### Option 3: Using Azure Storage Explorer

1. Open Azure Storage Explorer
2. Right-click on your storage account → **Configure CORS Rules**
3. Add the same settings as Option 1

## After Configuration:

1. Wait a few seconds for the changes to propagate
2. Refresh your browser page
3. Try uploading again

## For Production:

When deploying to production, replace `http://localhost:8000` with your actual domain (e.g., `https://yourdomain.com`).

