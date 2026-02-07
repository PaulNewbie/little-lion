  /**
   * Little Lions - Activity Photo Backup to Google Drive
   *
   * Backs up activity photos from Cloudinary to Google Drive, organized by student.
   * Photos STAY on Cloudinary (app works as-is). Drive is just a safety backup.
   *
   * Drive folder structure:
   *   Little Lions Archived Photos/
   *     Juan D./
   *       2025-01-15 - Outdoor Building Blocks/
   *         photo1.jpg
   *         photo2.jpg
   *     Maria S./
   *       2025-01-15 - Outdoor Building Blocks/
   *         photo1.jpg
   *
   * SETUP:
   * 1. Go to https://script.google.com and create a new project
   * 2. Replace the default code with this entire file
   * 3. Click the gear icon (Project Settings)
   *    - Check "Show appsscript.json manifest file in editor"
   *    - Scroll down to "Script Properties" and add these:
   *        FIRESTORE_PROJECT_ID  = little-lions-2cae7
   *        GDRIVE_FOLDER_ID      = (your Drive folder ID)
   * 4. Go back to Editor, open appsscript.json, replace with:
   *        {
   *          "timeZone": "Asia/Manila",
   *          "dependencies": {},
   *          "exceptionLogging": "STACKDRIVER",
   *          "runtimeVersion": "V8",
   *          "oauthScopes": [
   *            "https://www.googleapis.com/auth/drive",
   *            "https://www.googleapis.com/auth/datastore",
   *            "https://www.googleapis.com/auth/script.external_request"
   *          ]
   *        }
   * 5. Go back to Code.gs, select "testConnection" from dropdown, click Run
   * 6. Approve the permissions when prompted
   * 7. Check the Execution Log for results
   * 8. To schedule: Triggers (clock icon) > Add Trigger
   *
   *    PHOTO BACKUP (monthly):
   *        Function: backupActivityPhotos
   *        Event source: Time-driven
   *        Type: Month timer
   *        Day: 1st
   *        Time: 2am-3am
   *
   *    DATABASE BACKUP (daily):
   *        Function: backupFirestoreData
   *        Event source: Time-driven
   *        Type: Day timer
   *        Time: 3am-4am
   */

  // ============================================================
  // MAIN BACKUP FUNCTION
  // ============================================================

  function backupActivityPhotos() {
    var props = PropertiesService.getScriptProperties().getProperties();
    var token = ScriptApp.getOAuthToken();
    var projectId = props.FIRESTORE_PROJECT_ID;

    var cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    var cutoffStr = cutoff.toISOString();

    Logger.log('=== Starting Activity Photo Backup ===');
    Logger.log('Cutoff date: ' + cutoffStr);

    // Query activities older than 3 months that haven't been backed up yet
    var activities = queryActivitiesForBackup_(token, projectId, cutoffStr);

    if (activities.length === 0) {
      Logger.log('No activities to back up. Done!');
      return;
    }

    Logger.log('Found ' + activities.length + ' activities to back up');

    // Load student names (for folder organization)
    var studentMap = loadStudentNames_(token, projectId);
    Logger.log('Loaded ' + Object.keys(studentMap).length + ' student names');

    var rootFolder = DriveApp.getFolderById(props.GDRIVE_FOLDER_ID);
    var backedUp = 0;
    var BATCH_SIZE = 10;

    for (var i = 0; i < activities.length; i++) {
      if (backedUp >= BATCH_SIZE) {
        Logger.log('Batch limit reached (' + BATCH_SIZE + '), will continue next run.');
        break;
      }

      var activity = activities[i];
      var docName = activity.document.name;
      var fields = activity.document.fields;
      var photoUrls = getArrayValues_(fields.photoUrls);

      if (!photoUrls || photoUrls.length === 0) continue;

      // Skip if already backed up
      if (fields.driveBackedUp && fields.driveBackedUp.booleanValue === true) continue;

      // Get activity info for folder naming
      var activityDate = getStringValue_(fields.date) || 'unknown-date';
      var activityTitle = getStringValue_(fields.title) || 'Untitled';
      var activityFolderName = activityDate + ' - ' + sanitizeFolderName_(activityTitle);

      // Get participating student IDs
      var studentIds = getArrayValues_(fields.participatingStudentIds);
      var photoCount = 0;

      // Download all photos once
      var blobs = [];
      for (var j = 0; j < photoUrls.length; j++) {
        try {
          var response = UrlFetchApp.fetch(photoUrls[j]);
          var blob = response.getBlob();
          var urlParts = photoUrls[j].split('/');
          var fileName = urlParts[urlParts.length - 1] || ('photo_' + (j + 1) + '.jpg');
          blob.setName(fileName);
          blobs.push(blob);
        } catch (e) {
          Logger.log('  Failed to download photo ' + (j + 1) + ': ' + e.message);
          blobs.push(null);
        }
      }

      // Copy photos into each student's folder
      if (studentIds.length > 0) {
        for (var k = 0; k < studentIds.length; k++) {
          var studentId = studentIds[k];
          var studentName = studentMap[studentId] || ('Unknown Student ' + studentId.substring(0, 6));

          // Get or create: Root > StudentName > ActivityDate - Title
          var studentFolder = getOrCreateSubfolder_(rootFolder, studentName);
          var activityFolder = getOrCreateSubfolder_(studentFolder, activityFolderName);

          for (var b = 0; b < blobs.length; b++) {
            if (blobs[b]) {
              activityFolder.createFile(blobs[b]);
              photoCount++;
            }
          }
        }
      } else {
        // No students tagged - put in _Untagged folder
        var untaggedFolder = getOrCreateSubfolder_(rootFolder, '_Untagged');
        var activityFolder = getOrCreateSubfolder_(untaggedFolder, activityFolderName);

        for (var b = 0; b < blobs.length; b++) {
          if (blobs[b]) {
            activityFolder.createFile(blobs[b]);
            photoCount++;
          }
        }
      }

      // Mark as backed up in Firestore (don't touch photoUrls!)
      markAsBackedUp_(token, docName);
      backedUp++;
      Logger.log('Activity ' + backedUp + ': "' + activityTitle + '" - ' +
                blobs.filter(Boolean).length + ' photos -> ' + studentIds.length + ' student folders');
    }

    // Log to Firestore
    addBackupLog_(token, projectId, backedUp, 'success');

    Logger.log('=== Backup Complete! ===');
    Logger.log('Activities backed up: ' + backedUp);
  }

  // ============================================================
  // TEST - Run this first to verify everything works
  // ============================================================

  function testConnection() {
    var props = PropertiesService.getScriptProperties().getProperties();

    // Check Script Properties
    var required = ['FIRESTORE_PROJECT_ID', 'GDRIVE_FOLDER_ID'];

    var missing = required.filter(function(key) { return !props[key]; });
    if (missing.length > 0) {
      Logger.log('MISSING Script Properties: ' + missing.join(', '));
      Logger.log('Go to Project Settings > Script Properties to add them.');
      return;
    }
    Logger.log('Script Properties: OK');

    // Test Firestore
    try {
      var token = ScriptApp.getOAuthToken();
      var url = 'https://firestore.googleapis.com/v1/projects/' + props.FIRESTORE_PROJECT_ID +
                '/databases/(default)/documents/activities?pageSize=1';
      var response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = JSON.parse(response.getContentText());
      var docCount = data.documents ? data.documents.length : 0;
      Logger.log('Firestore: OK (found ' + docCount + ' test doc)');
    } catch (e) {
      Logger.log('Firestore: FAILED - ' + e.message);
    }

    // Test Drive folder
    try {
      var folder = DriveApp.getFolderById(props.GDRIVE_FOLDER_ID);
      Logger.log('Drive folder: OK ("' + folder.getName() + '")');
    } catch (e) {
      Logger.log('Drive folder: FAILED - ' + e.message);
    }

    // Test student name loading
    try {
      var token = ScriptApp.getOAuthToken();
      var studentMap = loadStudentNames_(token, props.FIRESTORE_PROJECT_ID);
      var count = Object.keys(studentMap).length;
      Logger.log('Students: OK (loaded ' + count + ' names)');
      // Show first 3 as sample
      var names = Object.values(studentMap).slice(0, 3);
      if (names.length > 0) {
        Logger.log('  Sample: ' + names.join(', '));
      }
    } catch (e) {
      Logger.log('Students: FAILED - ' + e.message);
    }

    Logger.log('--- Test complete ---');
  }

  // ============================================================
  // STATUS CHECK
  // ============================================================

  function checkStatus() {
    var props = PropertiesService.getScriptProperties().getProperties();
    var token = ScriptApp.getOAuthToken();

    var cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    var activities = queryActivitiesForBackup_(token, props.FIRESTORE_PROJECT_ID, cutoff.toISOString());

    Logger.log('Cutoff date: ' + cutoff.toISOString());
    Logger.log('Activities older than 3 months not yet backed up: ' + activities.length);

    // Count total photos
    var totalPhotos = 0;
    for (var i = 0; i < activities.length; i++) {
      var urls = getArrayValues_(activities[i].document.fields.photoUrls);
      totalPhotos += urls.length;
    }
    Logger.log('Total photos to back up: ' + totalPhotos);
  }

  // ============================================================
  // FIRESTORE HELPERS
  // ============================================================

  /**
   * Query activities that have photoUrlsUploadedAt older than cutoff
   * AND have not been backed up yet (driveBackedUp != true)
   */
  function queryActivitiesForBackup_(token, projectId, cutoffStr) {
    var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
              '/databases/(default)/documents:runQuery';

    // Query activities with old photos
    var body = {
      structuredQuery: {
        from: [{ collectionId: 'activities' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'photoUrlsUploadedAt' },
            op: 'LESS_THAN',
            value: { stringValue: cutoffStr }
          }
        },
        limit: 50
      }
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify(body)
    });

    var results = JSON.parse(response.getContentText());

    // Filter to only docs that exist and haven't been backed up
    return results.filter(function(r) {
      if (!r.document) return false;
      var fields = r.document.fields;
      if (fields.driveBackedUp && fields.driveBackedUp.booleanValue === true) return false;
      return true;
    });
  }

  /**
   * Load all student names into a map: { studentId: "FirstName L." }
   */
  function loadStudentNames_(token, projectId) {
    var studentMap = {};
    var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
              '/databases/(default)/documents/children?pageSize=300';

    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    var data = JSON.parse(response.getContentText());
    var docs = data.documents || [];

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var fields = doc.fields || {};
      var firstName = getStringValue_(fields.firstName) || 'Unknown';
      var lastName = getStringValue_(fields.lastName) || '';
      var lastInitial = lastName ? ' ' + lastName.charAt(0) + '.' : '';
      var displayName = firstName + lastInitial;

      // Extract doc ID from name path
      var nameParts = doc.name.split('/');
      var docId = nameParts[nameParts.length - 1];
      studentMap[docId] = displayName;
    }

    return studentMap;
  }

  /**
   * Mark an activity as backed up (only adds driveBackedUp flag, doesn't touch photos)
   */
  function markAsBackedUp_(token, docName) {
    var url = 'https://firestore.googleapis.com/v1/' + docName +
              '?updateMask.fieldPaths=driveBackedUp&updateMask.fieldPaths=driveBackedUpAt';

    UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify({
        fields: {
          driveBackedUp: { booleanValue: true },
          driveBackedUpAt: { stringValue: new Date().toISOString() }
        }
      })
    });
  }

  /**
   * Add a backup log entry to Firestore
   */
  function addBackupLog_(token, projectId, count, status) {
    var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
              '/databases/(default)/documents/migration_logs';

    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify({
        fields: {
          type: { stringValue: 'photo_backup' },
          timestamp: { stringValue: new Date().toISOString() },
          activitiesBackedUp: { integerValue: String(count) },
          status: { stringValue: status }
        }
      })
    });
  }

  // ============================================================
  // DRIVE HELPERS
  // ============================================================

  /**
   * Get existing subfolder by name, or create it if it doesn't exist
   */
  function getOrCreateSubfolder_(parentFolder, name) {
    var folders = parentFolder.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return parentFolder.createFolder(name);
  }

  /**
   * Remove characters that aren't allowed in Drive folder names
   */
  function sanitizeFolderName_(name) {
    return name.replace(/[\/\\:*?"<>|]/g, '-').substring(0, 100);
  }

  // ============================================================
  // FIRESTORE DATABASE BACKUP
  // ============================================================

  /**
   * Back up all Firestore collections as JSON files to Google Drive.
   *
   * Drive folder structure:
   *   Little Lions Archived Photos/
   *     _Database Backups/
   *       2026-02-07/
   *         users.json
   *         children.json
   *         activities.json
   *         therapy_sessions.json
   *         assessments.json
   *         services.json
   *         concerns.json
   *         inquiries.json
   *
   * Schedule: weekly (Sunday 3am) via Triggers
   */
  function backupFirestoreData() {
    var props = PropertiesService.getScriptProperties().getProperties();
    var token = ScriptApp.getOAuthToken();
    var projectId = props.FIRESTORE_PROJECT_ID;

    Logger.log('=== Starting Firestore Database Backup ===');

    var rootFolder = DriveApp.getFolderById(props.GDRIVE_FOLDER_ID);
    var backupsFolder = getOrCreateSubfolder_(rootFolder, '_Database Backups');

    // Create dated subfolder
    var today = new Date();
    var dateStr = today.getFullYear() + '-' +
      ('0' + (today.getMonth() + 1)).slice(-2) + '-' +
      ('0' + today.getDate()).slice(-2);
    var dateFolder = getOrCreateSubfolder_(backupsFolder, dateStr);

    // Collections to back up
    var collections = [
      'users',
      'children',
      'activities',
      'therapy_sessions',
      'assessments',
      'services',
      'concerns',
      'inquiries'
    ];

    var totalDocs = 0;

    for (var i = 0; i < collections.length; i++) {
      var collectionName = collections[i];
      try {
        var docs = fetchAllDocuments_(token, projectId, collectionName);
        var cleanDocs = docs.map(function(doc) { return convertFirestoreDoc_(doc); });
        totalDocs += cleanDocs.length;

        var json = JSON.stringify(cleanDocs, null, 2);
        dateFolder.createFile(collectionName + '.json', json, 'application/json');

        Logger.log('  ' + collectionName + ': ' + cleanDocs.length + ' docs (' +
                  Math.round(json.length / 1024) + ' KB)');
      } catch (e) {
        Logger.log('  ' + collectionName + ': FAILED - ' + e.message);
      }
    }

    // Clean up old backups (keep last 30 days)
    cleanOldBackups_(backupsFolder, 30);

    Logger.log('=== Backup Complete! ===');
    Logger.log('Total: ' + totalDocs + ' documents across ' + collections.length + ' collections');
    Logger.log('Saved to: _Database Backups/' + dateStr + '/');
  }

  /**
   * Fetch all documents from a Firestore collection (handles pagination)
   */
  function fetchAllDocuments_(token, projectId, collectionName) {
    var allDocs = [];
    var pageToken = null;

    do {
      var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
                '/databases/(default)/documents/' + collectionName + '?pageSize=300';
      if (pageToken) url += '&pageToken=' + pageToken;

      var response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      var data = JSON.parse(response.getContentText());
      var docs = data.documents || [];
      allDocs = allDocs.concat(docs);
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allDocs;
  }

  /**
   * Convert a Firestore REST API document to clean JSON.
   * Strips the Firestore value type wrappers:
   *   { "stringValue": "hello" }  ->  "hello"
   *   { "integerValue": "42" }    ->  42
   *   { "booleanValue": true }    ->  true
   *   { "arrayValue": { ... } }   ->  [...]
   *   { "mapValue": { ... } }     ->  {...}
   */
  function convertFirestoreDoc_(doc) {
    var nameParts = doc.name.split('/');
    var docId = nameParts[nameParts.length - 1];
    var result = { _id: docId };

    var fields = doc.fields || {};
    for (var key in fields) {
      result[key] = convertFirestoreValue_(fields[key]);
    }

    return result;
  }

  function convertFirestoreValue_(value) {
    if (!value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('nullValue' in value) return null;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) {
      var values = (value.arrayValue && value.arrayValue.values) || [];
      return values.map(function(v) { return convertFirestoreValue_(v); });
    }
    if ('mapValue' in value) {
      var map = {};
      var mapFields = (value.mapValue && value.mapValue.fields) || {};
      for (var k in mapFields) {
        map[k] = convertFirestoreValue_(mapFields[k]);
      }
      return map;
    }
    return null;
  }

  /**
   * Delete backup folders older than maxKeep weeks
   */
  function cleanOldBackups_(backupsFolder, maxKeep) {
    var folders = backupsFolder.getFolders();
    var allFolders = [];

    while (folders.hasNext()) {
      var folder = folders.next();
      allFolders.push({ name: folder.getName(), folder: folder });
    }

    // Sort by name descending (newest first, since names are YYYY-MM-DD)
    allFolders.sort(function(a, b) { return b.name.localeCompare(a.name); });

    // Delete anything beyond maxKeep
    for (var i = maxKeep; i < allFolders.length; i++) {
      Logger.log('  Removing old backup: ' + allFolders[i].name);
      allFolders[i].folder.setTrashed(true);
    }
  }

  // ============================================================
  // UTILITY
  // ============================================================

  function getArrayValues_(field) {
    if (!field || !field.arrayValue || !field.arrayValue.values) return [];
    return field.arrayValue.values.map(function(v) { return v.stringValue; });
  }

  function getStringValue_(field) {
    if (!field) return '';
    return field.stringValue || '';
  }
