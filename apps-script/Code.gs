/**
 * Personal Information Collection App — Google Apps Script backend.
 *
 * Deploy this as a Web App (Deploy > New deployment > Web app).
 * See /docs/DEPLOYMENT.md in the repo for the full step-by-step guide.
 *
 * Responsibilities:
 *  1. Receive a JSON POST body containing form fields + a base64 image.
 *  2. Save the image into the "Personal Registrations" Google Drive folder.
 *  3. Append one row with all form data + the resulting Drive image URL
 *     to the configured Google Sheet.
 *  4. Return { success, imageUrl, message } as JSON.
 */

var SHEET_NAME = 'Registrations';
var DRIVE_FOLDER_NAME = 'Personal Registrations';

var SHEET_HEADERS = [
  'Timestamp',
  'First Name',
  'Middle Name',
  'Last Name',
  'Age',
  'Birthdate',
  'Sex',
  'Civil Status',
  'Nationality',
  'Phone Number',
  'Email',
  'House Number',
  'Street',
  'Barangay',
  'City',
  'Province',
  'Zip Code',
  'Country',
  'Occupation',
  'Company',
  'Emergency Contact',
  'Emergency Number',
  'Relationship',
  'Remarks',
  'Google Drive Image URL',
  'Latitude',
  'Longitude',
  'Device Model',
  'OS Version',
  'App Version',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: 'Empty request body.' });
    }

    var data = JSON.parse(e.postData.contents);

    var validationError = validatePayload(data);
    if (validationError) {
      return jsonResponse({ success: false, message: validationError });
    }

    // Optional shared-secret check. Set a script property named API_TOKEN to
    // require callers to send a matching `apiKey` field. Leave unset to disable.
    var expectedToken = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (expectedToken && data.apiKey !== expectedToken) {
      return jsonResponse({ success: false, message: 'Unauthorized request.' });
    }

    var imageUrl = uploadImageToDrive(data.imageBase64, data.imageFileName, data.imageMimeType);
    appendRegistrationRow(data, imageUrl);

    return jsonResponse({ success: true, imageUrl: imageUrl, message: 'Registration saved successfully.' });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server error: ' + err.message });
  }
}

function doGet() {
  return jsonResponse({ success: true, message: 'Personal Information Collection App API is running.' });
}

function validatePayload(data) {
  if (!data.firstName || !String(data.firstName).trim()) return 'First name is required.';
  if (!data.lastName || !String(data.lastName).trim()) return 'Last name is required.';
  if (!data.age) return 'Age is required.';
  var age = Number(data.age);
  if (isNaN(age) || age < 1 || age > 120) return 'Age must be between 1 and 120.';
  if (!data.phoneNumber || !/^\d+$/.test(String(data.phoneNumber))) {
    return 'A valid, numeric phone number is required.';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'Email address is not valid.';
  }
  if (!data.imageBase64) return 'A profile photo is required.';

  var approxImageBytes = Math.floor((String(data.imageBase64).length * 3) / 4);
  if (approxImageBytes > 10 * 1024 * 1024) return 'Image exceeds the 10MB size limit.';

  return null;
}

function uploadImageToDrive(base64Data, fileName, mimeType) {
  var folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName || 'photo.jpg');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id=' + file.getId();
}

function getOrCreateFolder(name) {
  var configuredId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (configuredId) {
    try {
      return DriveApp.getFolderById(configuredId);
    } catch (err) {
      // Fall through to name-based lookup if the configured ID is invalid.
    }
  }
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function appendRegistrationRow(data, imageUrl) {
  var sheet = getOrCreateSheet();
  sheet.appendRow([
    new Date(),
    data.firstName || '',
    data.middleName || '',
    data.lastName || '',
    data.age || '',
    data.birthdate || '',
    data.sex || '',
    data.civilStatus || '',
    data.nationality || '',
    data.phoneNumber || '',
    data.email || '',
    data.houseNumber || '',
    data.street || '',
    data.barangay || '',
    data.city || '',
    data.province || '',
    data.zipCode || '',
    data.country || '',
    data.occupation || '',
    data.company || '',
    data.emergencyContactName || '',
    data.emergencyContactNumber || '',
    data.relationship || '',
    data.remarks || '',
    imageUrl,
    data.latitude || '',
    data.longitude || '',
    data.deviceModel || '',
    data.osVersion || '',
    data.appVersion || '',
  ]);
}

function getOrCreateSheet() {
  var configuredUrl = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
  var ss = configuredUrl ? SpreadsheetApp.openByUrl(configuredUrl) : SpreadsheetApp.getActiveSpreadsheet();

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
