# Photo Migration Setup Guide

This guide walks you through setting up automatic photo migration from Cloudinary to Google Drive.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Cloud Function (runs monthly on the 1st at 2:00 AM)        │
├─────────────────────────────────────────────────────────────┤
│  1. Find photos older than 3 months                         │
│  2. Download from Cloudinary                                │
│  3. Upload to Google Drive                                  │
│  4. Update Firestore with new URL                           │
│  5. Delete from Cloudinary                                  │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account (for Google Drive)
- Cloudinary account with Admin API access

---

## Step 1: Install Firebase CLI & Login

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
cd little-lion
firebase init functions
# Select: Use an existing project > little-lions-2cae7
# Select: JavaScript
# Say NO to ESLint
# Say YES to install dependencies
```

---

## Step 2: Set Up Google Cloud Service Account

A service account allows the Cloud Function to upload to Google Drive without user login.

### 2.1 Create a Google Cloud Project (if needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing Firebase project
3. Note your **Project ID**

### 2.2 Enable Google Drive API

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Click **Enable**

### 2.3 Create Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **Create Service Account**
3. Name: `photo-migration`
4. Click **Create and Continue**
5. Skip roles (click **Continue**)
6. Click **Done**

### 2.4 Create Service Account Key

1. Click on your new service account
2. Go to **Keys** tab
3. Click **Add Key > Create new key**
4. Select **JSON**
5. Download the JSON file (keep it safe!)

The JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "photo-migration@YOUR_PROJECT.iam.gserviceaccount.com",
  "client_id": "123456789"
}
```

---

## Step 3: Set Up Google Drive Folder

### 3.1 Create Migration Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder: `Little Lions Archived Photos`
3. Right-click > **Get link**
4. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

### 3.2 Share Folder with Service Account

1. Right-click the folder > **Share**
2. Add the service account email:
   ```
   photo-migration@YOUR_PROJECT.iam.gserviceaccount.com
   ```
3. Give **Editor** access
4. Click **Send**

---

## Step 4: Get Cloudinary Admin API Credentials

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to **Settings** (gear icon)
3. Go to **Access Keys**
4. Copy:
   - **API Key**
   - **API Secret**
   - **Cloud Name** (should be `dlfjnz8xq`)

---

## Step 5: Configure Firebase Functions

Set all configuration values using Firebase CLI:

```bash
# Navigate to project root
cd little-lion

# Set Google Drive config
firebase functions:config:set gdrive.project_id="YOUR_PROJECT_ID"
firebase functions:config:set gdrive.private_key_id="YOUR_PRIVATE_KEY_ID"
firebase functions:config:set gdrive.private_key="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
firebase functions:config:set gdrive.client_email="photo-migration@YOUR_PROJECT.iam.gserviceaccount.com"
firebase functions:config:set gdrive.client_id="YOUR_CLIENT_ID"
firebase functions:config:set gdrive.folder_id="YOUR_FOLDER_ID"

# Set Cloudinary config
firebase functions:config:set cloudinary.cloud_name="dlfjnz8xq"
firebase functions:config:set cloudinary.api_key="YOUR_API_KEY"
firebase functions:config:set cloudinary.api_secret="YOUR_API_SECRET"

# Set migration secret (generate a random string)
firebase functions:config:set migration.secret_key="YOUR_RANDOM_SECRET_KEY"

# Verify configuration
firebase functions:config:get
```

**Note about private key:** The private key has newlines. When setting it, replace actual newlines with `\n`:
```bash
firebase functions:config:set gdrive.private_key="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

---

## Step 6: Deploy Cloud Functions

```bash
# Install function dependencies
cd functions
npm install

# Go back to project root
cd ..

# Deploy functions
firebase deploy --only functions
```

After deployment, you'll see URLs like:
```
✓ functions[migratePhotosToGoogleDrive]: Scheduled function created
✓ functions[manualMigration]: https://us-central1-little-lions-2cae7.cloudfunctions.net/manualMigration
✓ functions[migrationStatus]: https://us-central1-little-lions-2cae7.cloudfunctions.net/migrationStatus
```

---

## Step 7: Test the Migration

### Check Status (No Auth Required)

```bash
curl https://us-central1-little-lions-2cae7.cloudfunctions.net/migrationStatus
```

Response:
```json
{
  "cutoffDate": "2023-10-15T...",
  "pending": {
    "users": 5,
    "children": 12,
    "activities": 8,
    "services": 2,
    "total": 27
  },
  "recentMigrations": []
}
```

### Trigger Manual Migration (Requires Secret Key)

```bash
curl -X POST \
  -H "x-migration-key: YOUR_SECRET_KEY" \
  https://us-central1-little-lions-2cae7.cloudfunctions.net/manualMigration
```

---

## How It Works

### Automatic Schedule

The migration runs automatically on the **1st of every month at 2:00 AM** (Asia/Manila timezone).

### What Gets Migrated

Photos are migrated when:
1. They have an `uploadedAt` timestamp (added in Phase 1)
2. The timestamp is older than 3 months
3. The URL is still pointing to Cloudinary

### Batch Processing

To prevent Cloud Function timeouts, only **10 items** are migrated per collection per run. If you have many photos, it may take multiple months to migrate everything.

### Original URLs Preserved

When a photo is migrated, the original Cloudinary URL is saved:
```javascript
{
  profilePhoto: "https://drive.google.com/uc?export=view&id=...",
  profilePhotoMigratedAt: "2024-01-01T02:15:00Z",
  profilePhotoOriginalUrl: "https://res.cloudinary.com/..." // Backup
}
```

---

## Monitoring

### View Logs

```bash
firebase functions:log --only migratePhotosToGoogleDrive
```

### Check Migration History

Migration logs are stored in Firestore under `migration_logs` collection.

---

## Costs

| Service | Cost |
|---------|------|
| Firebase Cloud Functions | Free tier: 2M invocations/month |
| Google Drive | Free: 15GB, $2/month for 100GB |
| Cloudinary | Free: 25GB (which we're trying to stay under) |

---

## Troubleshooting

### "Permission denied" when uploading to Google Drive

- Make sure you shared the Drive folder with the service account email
- Check the folder ID is correct

### "Invalid credentials" error

- Double-check the private key format (newlines as `\n`)
- Verify the config was set correctly: `firebase functions:config:get`

### Photos not being migrated

- Check if photos have `uploadedAt` timestamps
- Verify the timestamp is older than 3 months
- Check the Cloud Function logs for errors

### Timeout errors

- Reduce `BATCH_SIZE` in `functions/index.js`
- The function will continue in the next scheduled run

---

## Future Improvements

1. **Email notifications** when migration completes
2. **Dashboard** to view migration progress
3. **Selective migration** (e.g., only migrate certain folders)
4. **Compression** before uploading to save space

---

## Support

If you encounter issues:
1. Check Firebase Functions logs
2. Check the `migration_logs` collection in Firestore
3. Test with the manual migration endpoint first
