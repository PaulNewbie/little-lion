/**
 * Little Lions - Photo Migration Cloud Function
 *
 * Automatically migrates ACTIVITY photos from Cloudinary to Google Drive after
 * 3 months to stay within Cloudinary's free tier storage limit.
 * Profile photos, child photos, and service images stay on Cloudinary permanently.
 *
 * Schedule: Runs on the 1st of every month at 2:00 AM
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  MIGRATION_AGE_MONTHS: 3,
  GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dlfjnz8xq',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  BATCH_SIZE: 10,
};

// =============================================================================
// GOOGLE DRIVE SETUP
// =============================================================================

/**
 * Get authenticated Google Drive client using service account
 */
async function getGoogleDriveClient() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GDRIVE_PROJECT_ID,
    private_key_id: process.env.GDRIVE_PRIVATE_KEY_ID,
    private_key: (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    client_id: process.env.GDRIVE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file to Google Drive
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - Name for the file
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - Public URL of the uploaded file
 */
async function uploadToGoogleDrive(fileBuffer, fileName, mimeType = 'image/jpeg') {
  const drive = await getGoogleDriveClient();

  // Convert buffer to stream
  const { Readable } = require('stream');
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  // Upload file
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [CONFIG.GDRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = response.data.id;

  // Make file publicly accessible
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Return direct image URL
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// =============================================================================
// CLOUDINARY SETUP
// =============================================================================

/**
 * Initialize Cloudinary with credentials
 */
function initCloudinary() {
  cloudinary.config({
    cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
    api_key: CONFIG.CLOUDINARY_API_KEY,
    api_secret: CONFIG.CLOUDINARY_API_SECRET,
  });
}

/**
 * Extract public ID from Cloudinary URL for deletion
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
function getCloudinaryPublicId(url) {
  // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
async function deleteFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

// =============================================================================
// MIGRATION LOGIC
// =============================================================================

/**
 * Download file from URL
 * @param {string} url - URL to download from
 * @returns {Buffer} - File content
 */
async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  return response.buffer();
}

/**
 * Check if a date is older than X months
 * @param {string} dateStr - ISO date string
 * @param {number} months - Number of months
 * @returns {boolean}
 */
function isOlderThan(dateStr, months) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return date < cutoff;
}

/**
 * Migrate a single photo
 * @param {string} url - Cloudinary URL
 * @param {string} context - Description for logging (e.g., "user/abc123")
 * @returns {string|null} - New Google Drive URL or null if failed
 */
async function migratePhoto(url, context) {
  try {
    // Skip if already a Google Drive URL
    if (url.includes('drive.google.com')) {
      console.log(`[${context}] Already on Google Drive, skipping`);
      return null;
    }

    // Skip if not a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      console.log(`[${context}] Not a Cloudinary URL, skipping`);
      return null;
    }

    console.log(`[${context}] Downloading from Cloudinary...`);
    const fileBuffer = await downloadFile(url);

    // Generate filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1] || `photo_${Date.now()}.jpg`;

    console.log(`[${context}] Uploading to Google Drive...`);
    const newUrl = await uploadToGoogleDrive(fileBuffer, fileName);

    // Delete from Cloudinary
    const publicId = getCloudinaryPublicId(url);
    if (publicId && CONFIG.CLOUDINARY_API_KEY) {
      console.log(`[${context}] Deleting from Cloudinary...`);
      await deleteFromCloudinary(publicId);
    }

    console.log(`[${context}] Migration complete!`);
    return newUrl;
  } catch (error) {
    console.error(`[${context}] Migration failed:`, error.message);
    return null;
  }
}

// =============================================================================
// ACTIVITY PHOTO MIGRATION
// =============================================================================

/**
 * Migrate group activity photos
 */
async function migrateActivityPhotos() {
  console.log('=== Migrating Activity Photos ===');

  const activitiesSnapshot = await db.collection('activities')
    .where('photoUrlsUploadedAt', '!=', null)
    .get();

  let migrated = 0;

  for (const doc of activitiesSnapshot.docs) {
    const data = doc.data();

    if (!isOlderThan(data.photoUrlsUploadedAt, CONFIG.MIGRATION_AGE_MONTHS)) {
      continue;
    }

    if (!data.photoUrls || data.photoUrls.length === 0) {
      continue;
    }

    // Check if already migrated
    if (data.photoUrls.every(url => url.includes('drive.google.com'))) {
      continue;
    }

    const newUrls = [];
    const originalUrls = [...data.photoUrls];
    let activityMigrated = 0;

    for (const url of data.photoUrls) {
      if (url.includes('drive.google.com')) {
        newUrls.push(url);
        continue;
      }

      const newUrl = await migratePhoto(url, `activity/${doc.id}`);
      newUrls.push(newUrl || url); // Keep original if migration failed

      if (newUrl) activityMigrated++;
    }

    if (activityMigrated > 0) {
      await doc.ref.update({
        photoUrls: newUrls,
        photoUrlsMigratedAt: new Date().toISOString(),
        photoUrlsOriginal: originalUrls,
      });
      migrated++;
    }

    if (migrated >= CONFIG.BATCH_SIZE) {
      console.log(`Batch limit reached (${CONFIG.BATCH_SIZE}), will continue next run`);
      break;
    }
  }

  console.log(`Migrated ${migrated} activity photo sets`);
  return migrated;
}

// =============================================================================
// CLOUD FUNCTIONS
// =============================================================================

/**
 * Scheduled function - runs monthly to migrate old photos
 * Schedule: 1st of every month at 2:00 AM
 */
exports.migratePhotosToGoogleDrive = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max
    memory: '1GB',
  })
  .pubsub.schedule('0 2 1 * *') // At 02:00 on day 1 of every month
  .timeZone('Asia/Manila') // Adjust to your timezone
  .onRun(async (context) => {
    console.log('===========================================');
    console.log('Starting Photo Migration to Google Drive');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Migration age: ${CONFIG.MIGRATION_AGE_MONTHS} months`);
    console.log('===========================================');

    // Validate configuration
    if (!CONFIG.GDRIVE_FOLDER_ID) {
      console.error('ERROR: Google Drive folder ID not configured');
      return null;
    }

    // Initialize Cloudinary
    initCloudinary();

    try {
      const activitiesMigrated = await migrateActivityPhotos();

      console.log('===========================================');
      console.log('Migration Complete!');
      console.log(`Activity photo sets migrated: ${activitiesMigrated}`);
      console.log('===========================================');

      await db.collection('migration_logs').add({
        type: 'photo_migration',
        timestamp: new Date().toISOString(),
        activitiesMigrated,
        status: 'success',
      });

      return { success: true, activitiesMigrated };
    } catch (error) {
      console.error('Migration failed:', error);

      await db.collection('migration_logs').add({
        type: 'photo_migration',
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  });

/**
 * HTTP function - manually trigger migration (for testing)
 * Call: https://us-central1-YOUR_PROJECT.cloudfunctions.net/manualMigration
 */
exports.manualMigration = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .https.onRequest(async (req, res) => {
    // Basic auth check (use a secret key in production)
    const authKey = req.headers['x-migration-key'];
    const expectedKey = process.env.MIGRATION_SECRET_KEY;

    if (!expectedKey || authKey !== expectedKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('Manual migration triggered');

    if (!CONFIG.GDRIVE_FOLDER_ID) {
      res.status(500).json({ error: 'Google Drive folder ID not configured' });
      return;
    }

    initCloudinary();

    try {
      const activitiesMigrated = await migrateActivityPhotos();

      res.json({
        success: true,
        migrated: {
          activities: activitiesMigrated,
        },
      });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ error: error.message });
    }
  });

/**
 * HTTP function - check migration status and pending items
 */
exports.migrationStatus = functions.https.onRequest(async (req, res) => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - CONFIG.MIGRATION_AGE_MONTHS);
  const cutoffStr = cutoffDate.toISOString();

  try {
    const activitiesSnap = await db.collection('activities')
      .where('photoUrlsUploadedAt', '<', cutoffStr)
      .get();

    const pendingActivities = activitiesSnap.docs.filter(d =>
      d.data().photoUrls?.some(url => url.includes('cloudinary.com'))
    ).length;

    const logsSnap = await db.collection('migration_logs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const recentLogs = logsSnap.docs.map(d => d.data());

    res.json({
      cutoffDate: cutoffStr,
      pending: {
        activities: pendingActivities,
      },
      recentMigrations: recentLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
