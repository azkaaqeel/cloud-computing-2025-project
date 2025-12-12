# ⚠️ CORS Configuration Required - Step by Step Guide

Your upload is failing because Azure Blob Storage needs CORS configured. Follow these exact steps:

## Method 1: Azure Portal (Recommended)

### Step 1: Open Azure Portal
1. Go to https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Navigate to Storage Account
1. In the search bar at the top, type: **resumestored**
2. Click on your storage account: **resumestored**

### Step 3: Open CORS Settings
1. In the left menu, scroll down to find **Settings**
2. Click on **Resource sharing (CORS)**
3. You'll see tabs: **Blob service**, **File service**, etc.
4. Click on the **Blob service** tab

### Step 4: Add CORS Rule
1. Click the **+ Add** button (or if there's already a rule, click **Edit**)
2. Fill in these EXACT values:

   **Allowed origins:**
   ```
   http://localhost:8000,http://127.0.0.1:8000,http://[::]:8000,http://[::1]:8000
   ```
   (This covers all localhost variants: IPv4 localhost, IPv4 127.0.0.1, IPv6 localhost, and IPv6 ::1)

   **Allowed methods:**
   ```
   PUT,GET,HEAD,OPTIONS
   ```
   (Make sure PUT and OPTIONS are included!)

   **Allowed headers:**
   ```
   *
   ```
   (Or specifically: `x-ms-meta-*,x-ms-blob-type,x-ms-version,Content-Type,Content-Length`)

   **Exposed headers:**
   ```
   *
   ```

   **Max age (seconds):**
   ```
   3600
   ```

3. Click **Save** at the top

### Step 5: Wait and Test
1. Wait 10-30 seconds for changes to propagate
2. Refresh your browser page (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. Try uploading again

---

## Method 2: Azure CLI (If you have it installed)

Open terminal and run:

```bash
az storage cors add \
  --services b \
  --methods PUT GET HEAD OPTIONS \
  --origins "http://localhost:8000" "http://[::]:8000" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name resumestored
```

---

## Method 3: Quick Test (Less Secure - For Testing Only)

If you just want to test quickly, you can temporarily allow ALL origins:

**Allowed origins:** `*`

⚠️ **Warning:** Only use `*` for testing. For production, use your specific domain.

---

## Troubleshooting

### Still getting CORS errors?
1. Make sure you saved the CORS rule
2. Wait 30 seconds and try again
3. Hard refresh your browser (Ctrl+Shift+R)
4. Check that OPTIONS is in the allowed methods
5. Try using `*` for allowed origins to test

### Check if CORS is configured:
You can verify by checking the browser Network tab:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try uploading
4. Look for the OPTIONS request
5. Check the Response Headers - you should see `Access-Control-Allow-Origin`

---

## Why is this needed?

Browsers block cross-origin requests by default for security. Since your page runs on `localhost:8000` and Azure Storage is on `resumestored.blob.core.windows.net`, the browser requires CORS headers to allow the request.

