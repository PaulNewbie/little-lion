/**
 * 
 * Disregard !!!!!!!!!!!! Not deployed, Not setup. Out of Scope
 * 
 * 
 * 
 * Little Lions - Daily Photo Backup (Cloudinary -> Google Drive)
 *
 * Backs up activity photos from Cloudinary to Google Drive, organized by student.
 * Photos STAY on Cloudinary (app works as-is). Drive is just a safety backup.
 * Runs daily at 2-3am. Processes up to 20 activities per run.
 * Already-backed-up activities are skipped (driveBackedUp flag).
 *
 * Drive folder structure:
 *   Little Lions Backup/
 *     Juan D./
 *       2025-01-15 - Outdoor Building Blocks/
 *         photo1.jpg
 *         photo2.jpg
 *     Maria S./
 *       2025-01-15 - Outdoor Building Blocks/
 *         photo1.jpg
 *     _Untagged/
 *       2025-01-20 - Free Play/
 *         photo1.jpg
 *
 * SETUP:
 * 1. Go to https://script.google.com and create a new project
 * 2. Replace the default code with this entire file
 * 3. Click the gear icon (Project Settings)
 *    - Check "Show appsscript.json manifest file in editor"
 *    - Scroll down to "Script Properties" and add:
 *        FIRESTORE_PROJECT_ID  = little-lions-2cae7
 *        GDRIVE_FOLDER_ID      = (your Drive folder ID)
 * 4. Under "Google Cloud Platform (GCP) Project", click "Change project"
 *    and enter your GCP project number (find it in console.cloud.google.com)
 * 5. Go back to Editor, open appsscript.json, replace with:
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
 * 6. Select "testConnection" from dropdown, click Run
 * 7. Approve the permissions when prompted
 * 8. Check the Execution Log - all should say OK
 * 9. To schedule: Triggers (clock icon) > Add Trigger
 *        Function: backupPhotos
 *        Event source: Time-driven
 *        Type: Day timer
 *        Time: 2am-3am
 */

// ============================================================
// MAIN - Run daily at 2-3am
// ============================================================

function backupPhotos() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var token = ScriptApp.getOAuthToken();
  var projectId = props.FIRESTORE_PROJECT_ID;

  Logger.log('=== Starting Daily Photo Backup ===');

  // Get all activities that have photos and haven't been backed up yet
  var activities = queryUnbackedActivities_(token, projectId);

  if (activities.length === 0) {
    Logger.log('No new activities to back up. Done!');
    return;
  }

  Logger.log('Found ' + activities.length + ' activities to back up');

  // Load student names for folder organization
  var studentMap = loadStudentNames_(token, projectId);
  Logger.log('Loaded ' + Object.keys(studentMap).length + ' student names');

  var rootFolder = DriveApp.getFolderById(props.GDRIVE_FOLDER_ID);
  var backedUp = 0;
  var totalPhotos = 0;
  var BATCH_SIZE = 20; // Apps Script has a 6-min timeout, 20 activities is safe

  for (var i = 0; i < activities.length; i++) {
    if (backedUp >= BATCH_SIZE) {
      Logger.log('Batch limit reached (' + BATCH_SIZE + '), will continue tomorrow.');
      break;
    }

    var activity = activities[i];
    var docName = activity.document.name;
    var fields = activity.document.fields;
    var photoUrls = getArrayValues_(fields.photoUrls);

    if (!photoUrls || photoUrls.length === 0) continue;

    // Get activity info for folder naming
    var activityDate = getStringValue_(fields.date) || 'unknown-date';
    var activityTitle = getStringValue_(fields.title) || 'Untitled';
    var activityFolderName = activityDate + ' - ' + sanitizeFolderName_(activityTitle);

    // Get participating student IDs
    var studentIds = getArrayValues_(fields.participatingStudentIds);

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

    var validBlobs = blobs.filter(Boolean);

    // Copy photos into each student's folder
    if (studentIds.length > 0) {
      for (var k = 0; k < studentIds.length; k++) {
        var studentId = studentIds[k];
        var studentName = studentMap[studentId] || ('Unknown Student ' + studentId.substring(0, 6));
        var studentFolder = getOrCreateSubfolder_(rootFolder, studentName);
        var activityFolder = getOrCreateSubfolder_(studentFolder, activityFolderName);

        for (var b = 0; b < validBlobs.length; b++) {
          activityFolder.createFile(validBlobs[b]);
        }
      }
    } else {
      // No students tagged - put in _Untagged folder
      var untaggedFolder = getOrCreateSubfolder_(rootFolder, '_Untagged');
      var activityFolder = getOrCreateSubfolder_(untaggedFolder, activityFolderName);

      for (var b = 0; b < validBlobs.length; b++) {
        activityFolder.createFile(validBlobs[b]);
      }
    }

    // Mark as backed up in Firestore
    markAsBackedUp_(token, docName);
    backedUp++;
    totalPhotos += validBlobs.length;
    Logger.log(backedUp + '. "' + activityTitle + '" - ' +
              validBlobs.length + ' photos -> ' +
              (studentIds.length > 0 ? studentIds.length + ' student folders' : '_Untagged'));
  }

  Logger.log('=== Backup Complete! ===');
  Logger.log('Activities: ' + backedUp + ' | Photos: ' + totalPhotos);
  Logger.log('Remaining: ' + Math.max(0, activities.length - backedUp));
}

// ============================================================
// TEST - Run this first to verify everything works
// ============================================================

function testConnection() {
  var props = PropertiesService.getScriptProperties().getProperties();

  // Check Script Properties
  var missing = ['FIRESTORE_PROJECT_ID', 'GDRIVE_FOLDER_ID'].filter(function(key) {
    return !props[key];
  });
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
    Logger.log('Firestore: OK (found ' + (data.documents ? data.documents.length : 0) + ' test doc)');
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

  // Test student names
  try {
    var token = ScriptApp.getOAuthToken();
    var studentMap = loadStudentNames_(token, props.FIRESTORE_PROJECT_ID);
    var count = Object.keys(studentMap).length;
    Logger.log('Students: OK (' + count + ' names)');
    var names = Object.values(studentMap).slice(0, 3);
    if (names.length > 0) Logger.log('  Sample: ' + names.join(', '));
  } catch (e) {
    Logger.log('Students: FAILED - ' + e.message);
  }

  // Count unbacked activities
  try {
    var token = ScriptApp.getOAuthToken();
    var activities = queryUnbackedActivities_(token, props.FIRESTORE_PROJECT_ID);
    var totalPhotos = 0;
    for (var i = 0; i < activities.length; i++) {
      totalPhotos += getArrayValues_(activities[i].document.fields.photoUrls).length;
    }
    Logger.log('Pending backup: ' + activities.length + ' activities, ' + totalPhotos + ' photos');
  } catch (e) {
    Logger.log('Pending check: FAILED - ' + e.message);
  }

  Logger.log('--- Test complete ---');
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

/**
 * Query activities that have photos and haven't been backed up yet.
 * No date cutoff - backs up everything not yet backed up.
 */
function queryUnbackedActivities_(token, projectId) {
  var allActivities = [];
  var pageToken = null;

  // Fetch all activities (paginated)
  do {
    var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
              '/databases/(default)/documents/activities?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;

    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    var data = JSON.parse(response.getContentText());
    var docs = data.documents || [];

    // Filter: has photos AND not yet backed up
    for (var i = 0; i < docs.length; i++) {
      var fields = docs[i].fields || {};
      if (fields.driveBackedUp && fields.driveBackedUp.booleanValue === true) continue;
      var photos = getArrayValues_(fields.photoUrls);
      if (photos.length === 0) continue;
      allActivities.push({ document: docs[i] });
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return allActivities;
}

/**
 * Load all student names: { studentId: "FirstName L." }
 */
function loadStudentNames_(token, projectId) {
  var studentMap = {};
  var pageToken = null;

  do {
    var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
              '/databases/(default)/documents/children?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;

    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    var data = JSON.parse(response.getContentText());
    var docs = data.documents || [];

    for (var i = 0; i < docs.length; i++) {
      var fields = docs[i].fields || {};
      var firstName = getStringValue_(fields.firstName) || 'Unknown';
      var lastName = getStringValue_(fields.lastName) || '';
      var lastInitial = lastName ? ' ' + lastName.charAt(0) + '.' : '';

      var nameParts = docs[i].name.split('/');
      var docId = nameParts[nameParts.length - 1];
      studentMap[docId] = firstName + lastInitial;
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return studentMap;
}

/**
 * Mark activity as backed up in Firestore (doesn't touch photos)
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

// ============================================================
// DRIVE HELPERS
// ============================================================

function getOrCreateSubfolder_(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}

function sanitizeFolderName_(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').substring(0, 100);
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
