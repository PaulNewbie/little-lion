/**
 * Little Lions - Photo Migration (Google Apps Script)
 *
 * Migrates activity photos from Cloudinary to Google Drive after 3 months,
 * keeping the app within Cloudinary's free tier storage limit.
 *
 * This is a FREE alternative to the Firebase Cloud Function version
 * (which requires the Blaze pay-as-you-go plan). It runs entirely on
 * Google Apps Script infrastructure at no cost.
 *
 * =========================================================================
 * SETUP INSTRUCTIONS
 * =========================================================================
 *
 * 1. Go to https://script.google.com > "New project"
 * 2. Delete any existing code and paste this entire file
 * 3. Rename the project to "Little Lions Photo Migration"
 *
 * 4. Set Script Properties (Project Settings > Script Properties):
 *    - FIREBASE_PROJECT_ID   : Your Firebase project ID (e.g. "little-lions-sped")
 *    - GDRIVE_FOLDER_ID      : Google Drive folder ID for archived photos
 *                              (create a folder, copy the ID from the URL)
 *    - CLOUDINARY_CLOUD_NAME : Your Cloudinary cloud name (e.g. "dlfjnz8xq")
 *    - CLOUDINARY_API_KEY    : (Optional) For deleting from Cloudinary after migration
 *    - CLOUDINARY_API_SECRET : (Optional) For deleting from Cloudinary after migration
 *
 * 5. Click "Services" (+) on the left sidebar and add "Google Drive API"
 *
 * 6. Run the setup() function once:
 *    - Select "setup" from the function dropdown at the top
 *    - Click "Run"
 *    - Grant the OAuth permissions when prompted
 *    - This creates a monthly trigger (1st of each month at 2-3 AM)
 *
 * 7. Test by running migratePhotos() manually:
 *    - Select "migratePhotos" from the dropdown
 *    - Click "Run"
 *    - Check the Execution Log for results
 *
 * IMPORTANT: Run this script under the Google account that owns (or has
 * editor access to) the Firebase project. The script uses that account's
 * OAuth token to authenticate with the Firestore REST API.
 *
 * =========================================================================
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var CONFIG = {
  MIGRATION_AGE_MONTHS: 3,
  BATCH_SIZE: 10
};

/**
 * Read configuration from Script Properties.
 * @returns {Object} Configuration values
 */
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    projectId: props.getProperty('FIREBASE_PROJECT_ID'),
    folderId: props.getProperty('GDRIVE_FOLDER_ID'),
    cloudinaryCloudName: props.getProperty('CLOUDINARY_CLOUD_NAME'),
    cloudinaryApiKey: props.getProperty('CLOUDINARY_API_KEY') || '',
    cloudinaryApiSecret: props.getProperty('CLOUDINARY_API_SECRET') || ''
  };
}

// =============================================================================
// SETUP & TRIGGERS
// =============================================================================

/**
 * Run this ONCE to create the monthly trigger.
 * Select this function in the dropdown and click "Run".
 */
function setup() {
  // Remove any existing triggers for this project
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'migratePhotos') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create a monthly trigger: 1st of each month, 2-3 AM
  ScriptApp.newTrigger('migratePhotos')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();

  Logger.log('Monthly trigger created: migratePhotos will run on the 1st of each month at 2-3 AM');
  Logger.log('You can also run migratePhotos() manually at any time.');

  // Validate configuration
  var config = getConfig();
  var missing = [];
  if (!config.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!config.folderId) missing.push('GDRIVE_FOLDER_ID');
  if (!config.cloudinaryCloudName) missing.push('CLOUDINARY_CLOUD_NAME');

  if (missing.length > 0) {
    Logger.log('WARNING: Missing required Script Properties: ' + missing.join(', '));
    Logger.log('Go to Project Settings > Script Properties to set them.');
  } else {
    Logger.log('All required Script Properties are set.');
    if (!config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
      Logger.log('NOTE: Cloudinary API key/secret not set. Photos will be copied but NOT deleted from Cloudinary.');
    }
  }
}

/**
 * Remove all triggers for this project.
 */
function removeTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('All triggers removed.');
}

// =============================================================================
// FIRESTORE REST API HELPERS
// =============================================================================

/**
 * Get the Firestore REST API base URL.
 * @returns {string}
 */
function getFirestoreBaseUrl() {
  var config = getConfig();
  return 'https://firestore.googleapis.com/v1/projects/' +
    config.projectId + '/databases/(default)/documents';
}

/**
 * Get OAuth token for authenticated requests.
 * Uses the script owner's Google account credentials.
 * @returns {string}
 */
function getAuthToken() {
  return ScriptApp.getOAuthToken();
}

/**
 * Make an authenticated request to the Firestore REST API.
 * @param {string} url - Full URL
 * @param {Object} options - UrlFetchApp options
 * @returns {Object} Parsed JSON response
 */
function firestoreRequest(url, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers['Authorization'] = 'Bearer ' + getAuthToken();
  options.headers['Content-Type'] = 'application/json';
  options.muteHttpExceptions = true;

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code >= 400) {
    throw new Error('Firestore API error (' + code + '): ' + body);
  }

  return JSON.parse(body);
}

/**
 * Query Firestore for activities with old photos that need migration..
 * Uses the structured query endpoint to filter by photoUrlsUploadedAt.
 * @returns {Array} Array of {docId, photoUrls, photoUrlsUploadedAt}
 */
function queryActivitiesForMigration() {
  var config = getConfig();
  var cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - CONFIG.MIGRATION_AGE_MONTHS);

  var url = 'https://firestore.googleapis.com/v1/projects/' +
    config.projectId + '/databases/(default)/documents:runQuery';

  var query = {
    structuredQuery: {
      from: [{ collectionId: 'activities' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'photoUrlsUploadedAt' },
                op: 'LESS_THAN',
                value: { stringValue: cutoffDate.toISOString() }
              }
            }
          ]
        }
      },
      limit: CONFIG.BATCH_SIZE * 2 // fetch extra to account for already-migrated docs
    }
  };

  var results = firestoreRequest(url, {
    method: 'post',
    payload: JSON.stringify(query)
  });

  var activities = [];

  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    if (!result.document) continue;

    var doc = result.document;
    var docPath = doc.name;
    var docId = docPath.split('/').pop();
    var fields = doc.fields || {};

    // Extract photoUrls array
    var photoUrls = [];
    if (fields.photoUrls && fields.photoUrls.arrayValue && fields.photoUrls.arrayValue.values) {
      var values = fields.photoUrls.arrayValue.values;
      for (var j = 0; j < values.length; j++) {
        if (values[j].stringValue) {
          photoUrls.push(values[j].stringValue);
        }
      }
    }

    // Skip docs with no photos or already fully migrated
    if (photoUrls.length === 0) continue;

    var hasCloudinary = false;
    for (var k = 0; k < photoUrls.length; k++) {
      if (photoUrls[k].indexOf('cloudinary.com') !== -1) {
        hasCloudinary = true;
        break;
      }
    }
    if (!hasCloudinary) continue;

    var uploadedAt = '';
    if (fields.photoUrlsUploadedAt && fields.photoUrlsUploadedAt.stringValue) {
      uploadedAt = fields.photoUrlsUploadedAt.stringValue;
    }

    activities.push({
      docId: docId,
      docPath: docPath,
      photoUrls: photoUrls,
      photoUrlsUploadedAt: uploadedAt
    });
  }

  return activities;
}

/**
 * Update a Firestore document with new photo URLs and migration metadata.
 * @param {string} docPath - Full document path (from query result)
 * @param {Array} newUrls - New Google Drive URLs
 * @param {Array} originalUrls - Original Cloudinary URLs
 */
function updateActivityDocument(docPath, newUrls, originalUrls) {
  var url = 'https://firestore.googleapis.com/v1/' + docPath +
    '?updateMask.fieldPaths=photoUrls' +
    '&updateMask.fieldPaths=photoUrlsMigratedAt' +
    '&updateMask.fieldPaths=photoUrlsOriginal';

  var urlValues = [];
  for (var i = 0; i < newUrls.length; i++) {
    urlValues.push({ stringValue: newUrls[i] });
  }

  var origValues = [];
  for (var j = 0; j < originalUrls.length; j++) {
    origValues.push({ stringValue: originalUrls[j] });
  }

  var body = {
    fields: {
      photoUrls: { arrayValue: { values: urlValues } },
      photoUrlsMigratedAt: { stringValue: new Date().toISOString() },
      photoUrlsOriginal: { arrayValue: { values: origValues } }
    }
  };

  firestoreRequest(url, {
    method: 'patch',
    payload: JSON.stringify(body)
  });
}

/**
 * Write a migration log entry to Firestore.
 * @param {string} status - "success" or "error"
 * @param {number} activitiesMigrated - Count of migrated activities
 * @param {string} [errorMessage] - Error message if status is "error"
 */
function writeMigrationLog(status, activitiesMigrated, errorMessage) {
  var config = getConfig();
  var url = 'https://firestore.googleapis.com/v1/projects/' +
    config.projectId + '/databases/(default)/documents/migration_logs';

  var fields = {
    type: { stringValue: 'photo_migration' },
    source: { stringValue: 'apps_script' },
    timestamp: { stringValue: new Date().toISOString() },
    activitiesMigrated: { integerValue: String(activitiesMigrated) },
    status: { stringValue: status }
  };

  if (errorMessage) {
    fields.error = { stringValue: errorMessage };
  }

  firestoreRequest(url, {
    method: 'post',
    payload: JSON.stringify({ fields: fields })
  });
}

// =============================================================================
// GOOGLE DRIVE HELPERS
// =============================================================================

/**
 * Upload a photo to Google Drive and make it publicly accessible.
 * @param {Blob} blob - The file content as a Blob
 * @param {string} fileName - Name for the file in Drive
 * @returns {string} Public URL for the uploaded file
 */
function uploadToGoogleDrive(blob, fileName) {
  var config = getConfig();
  var folder = DriveApp.getFolderById(config.folderId);

  var file = folder.createFile(blob);
  file.setName(fileName);

  // Make publicly accessible (anyone with link can view)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Return direct image URL
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

// =============================================================================
// CLOUDINARY HELPERS
// =============================================================================

/**
 * Extract public ID from a Cloudinary URL for deletion.
 * URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null
 */
function getCloudinaryPublicId(url) {
  var match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}

/**
 * Delete a photo from Cloudinary using the Admin API.
 * Requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Script Properties.
 * @param {string} publicId - Cloudinary public ID
 * @returns {boolean} true if deleted successfully
 */
function deleteFromCloudinary(publicId) {
  var config = getConfig();
  if (!config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    return false;
  }

  var url = 'https://api.cloudinary.com/v1_1/' +
    config.cloudinaryCloudName + '/image/destroy';

  var credentials = Utilities.base64Encode(
    config.cloudinaryApiKey + ':' + config.cloudinaryApiSecret
  );

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + credentials
    },
    payload: {
      'public_id': publicId
    },
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  return result.result === 'ok';
}

// =============================================================================
// MAIN MIGRATION FUNCTION
// =============================================================================

/**
 * Main entry point. Migrates old activity photos from Cloudinary to Google Drive.
 *
 * This function:
 * 1. Queries Firestore for activities with photos older than 3 months
 * 2. Downloads each photo from Cloudinary
 * 3. Uploads to Google Drive (publicly accessible)
 * 4. Updates the Firestore document with new URLs
 * 5. Optionally deletes from Cloudinary
 * 6. Logs results to Firestore migration_logs collection
 *
 * Safe to run multiple times - already-migrated photos are skipped.
 * Processes up to 10 activities per run to stay within Apps Script time limits.
 */
function migratePhotos() {
  Logger.log('=== Little Lions Photo Migration ===');
  Logger.log('Date: ' + new Date().toISOString());
  Logger.log('Migration age: ' + CONFIG.MIGRATION_AGE_MONTHS + ' months');

  // Validate configuration
  var config = getConfig();
  var missing = [];
  if (!config.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!config.folderId) missing.push('GDRIVE_FOLDER_ID');
  if (!config.cloudinaryCloudName) missing.push('CLOUDINARY_CLOUD_NAME');

  if (missing.length > 0) {
    Logger.log('ERROR: Missing Script Properties: ' + missing.join(', '));
    Logger.log('Go to Project Settings > Script Properties to set them.');
    return;
  }

  try {
    // Query for activities needing migration
    Logger.log('Querying Firestore for activities with old photos...');
    var activities = queryActivitiesForMigration();
    Logger.log('Found ' + activities.length + ' activities to migrate');

    if (activities.length === 0) {
      Logger.log('No activities need migration. Done!');
      writeMigrationLog('success', 0);
      return;
    }

    var migrated = 0;
    var totalPhotos = 0;

    // Process each activity (up to BATCH_SIZE)
    for (var i = 0; i < Math.min(activities.length, CONFIG.BATCH_SIZE); i++) {
      var activity = activities[i];
      Logger.log('--- Activity ' + (i + 1) + '/' +
        Math.min(activities.length, CONFIG.BATCH_SIZE) +
        ' (ID: ' + activity.docId + ') ---');

      var newUrls = [];
      var originalUrls = activity.photoUrls.slice();
      var photosInActivity = 0;

      for (var j = 0; j < activity.photoUrls.length; j++) {
        var url = activity.photoUrls[j];

        // Skip if already on Google Drive
        if (url.indexOf('drive.google.com') !== -1) {
          Logger.log('  Photo ' + (j + 1) + ': Already on Google Drive, skipping');
          newUrls.push(url);
          continue;
        }

        // Skip if not a Cloudinary URL
        if (url.indexOf('cloudinary.com') === -1) {
          Logger.log('  Photo ' + (j + 1) + ': Not a Cloudinary URL, keeping as-is');
          newUrls.push(url);
          continue;
        }

        try {
          // Download from Cloudinary
          Logger.log('  Photo ' + (j + 1) + ': Downloading from Cloudinary...');
          var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

          if (response.getResponseCode() !== 200) {
            Logger.log('  Photo ' + (j + 1) + ': Download failed (HTTP ' +
              response.getResponseCode() + '), keeping original URL');
            newUrls.push(url);
            continue;
          }

          var blob = response.getBlob();

          // Generate filename from URL
          var urlParts = url.split('/');
          var fileName = urlParts[urlParts.length - 1] || ('photo_' + Date.now() + '.jpg');

          // Upload to Google Drive
          Logger.log('  Photo ' + (j + 1) + ': Uploading to Google Drive...');
          var newUrl = uploadToGoogleDrive(blob, fileName);
          newUrls.push(newUrl);
          photosInActivity++;

          Logger.log('  Photo ' + (j + 1) + ': Migrated successfully');

          // Delete from Cloudinary (optional)
          var publicId = getCloudinaryPublicId(url);
          if (publicId && config.cloudinaryApiKey) {
            Logger.log('  Photo ' + (j + 1) + ': Deleting from Cloudinary...');
            var deleted = deleteFromCloudinary(publicId);
            Logger.log('  Photo ' + (j + 1) + ': Cloudinary deletion ' +
              (deleted ? 'successful' : 'failed (non-critical)'));
          }
        } catch (photoError) {
          Logger.log('  Photo ' + (j + 1) + ': ERROR - ' + photoError.message);
          newUrls.push(url); // Keep original on failure
        }
      }

      // Update Firestore document if any photos were migrated
      if (photosInActivity > 0) {
        Logger.log('  Updating Firestore document with ' + photosInActivity + ' new URLs...');
        updateActivityDocument(activity.docPath, newUrls, originalUrls);
        migrated++;
        totalPhotos += photosInActivity;
      }
    }

    // Log results
    Logger.log('=== Migration Complete ===');
    Logger.log('Activities migrated: ' + migrated);
    Logger.log('Total photos migrated: ' + totalPhotos);

    writeMigrationLog('success', migrated);

  } catch (error) {
    Logger.log('ERROR: Migration failed - ' + error.message);
    Logger.log(error.stack);

    try {
      writeMigrationLog('error', 0, error.message);
    } catch (logError) {
      Logger.log('Could not write error log to Firestore: ' + logError.message);
    }
  }
}

/**
 * Check migration status - shows pending items and recent logs.
 * Run this to see how many activities still need migration.
 */
function checkStatus() {
  var config = getConfig();

  if (!config.projectId) {
    Logger.log('ERROR: FIREBASE_PROJECT_ID not set in Script Properties');
    return;
  }

  Logger.log('=== Migration Status ===');

  // Query for pending activities
  try {
    var activities = queryActivitiesForMigration();
    Logger.log('Activities pending migration: ' + activities.length);

    var totalPhotos = 0;
    for (var i = 0; i < activities.length; i++) {
      var cloudinaryCount = 0;
      for (var j = 0; j < activities[i].photoUrls.length; j++) {
        if (activities[i].photoUrls[j].indexOf('cloudinary.com') !== -1) {
          cloudinaryCount++;
        }
      }
      totalPhotos += cloudinaryCount;
    }
    Logger.log('Total Cloudinary photos to migrate: ' + totalPhotos);
  } catch (e) {
    Logger.log('Could not query activities: ' + e.message);
  }

  // Get recent migration logs
  try {
    var logsUrl = getFirestoreBaseUrl() + '/migration_logs?orderBy=timestamp desc&pageSize=5';
    var logs = firestoreRequest(logsUrl);

    if (logs.documents && logs.documents.length > 0) {
      Logger.log('');
      Logger.log('Recent migration logs:');
      for (var k = 0; k < logs.documents.length; k++) {
        var fields = logs.documents[k].fields;
        var ts = fields.timestamp ? fields.timestamp.stringValue : 'unknown';
        var status = fields.status ? fields.status.stringValue : 'unknown';
        var count = fields.activitiesMigrated ? fields.activitiesMigrated.integerValue : '0';
        var source = fields.source ? fields.source.stringValue : 'cloud_function';
        Logger.log('  ' + ts + ' | ' + status + ' | ' + count + ' activities | via ' + source);
      }
    } else {
      Logger.log('No migration logs found.');
    }
  } catch (e) {
    Logger.log('Could not read migration logs: ' + e.message);
  }
}
