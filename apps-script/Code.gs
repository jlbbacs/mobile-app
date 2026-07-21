/**
 * Personal Information Collection App — Google Apps Script backend (v2).
 *
 * Deploy this as a Web App (Deploy > New deployment > Web app).
 * See /docs/DEPLOYMENT.md in the repo for the full step-by-step guide.
 *
 * v2 adds a QR-code registration system on top of v1:
 *  - Every registration gets a unique Registration ID (REG-YYYYMMDD-NNNNNN).
 *  - A QR code PNG (containing ONLY the Registration ID, never personal
 *    data) is generated and stored in a "QR Codes" Drive folder. The sheet
 *    stores both the plain URL ("QR Code URL", read by the app) and a
 *    visible thumbnail via an =IMAGE() formula ("QR Code Image").
 *  - The Web App is now action-based. POST a JSON body with an "action"
 *    field:
 *      register (default) — save a new registration
 *      lookup   — { registrationId } -> full record
 *      search   — { query } -> records matching id/name/phone/email
 *      update   — { registrationId, ...fields, imageBase64? } -> edit record
 *      stats    — {} -> dashboard statistics
 *      list     — {} -> all records (for CSV export)
 *
 * MIGRATION NOTE: v2 changes the sheet columns. If you deployed v1, delete
 * (or rename) the old "Registrations" tab so v2 can recreate it with the
 * new headers. UrlFetchApp (QR generation) needs an extra permission, so
 * Google will ask you to re-authorize when you deploy this version.
 */

var SHEET_NAME = 'Registrations';
var DRIVE_FOLDER_NAME = 'Personal Registrations';
var QR_FOLDER_NAME = 'QR Codes';

var SHEET_HEADERS = [
  'Timestamp',
  'Registration ID',
  'First Name',
  'Middle Name',
  'Last Name',
  'Age',
  'Sex',
  'Civil Status',
  'Nationality',
  'Phone Number',
  'Email',
  'Complete Address',
  'Google Drive Image URL',
  'QR Code URL',
  'QR Code Image',
  'Status',
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

    // Optional shared-secret check. Set a script property named API_TOKEN to
    // require callers to send a matching `apiKey` field. Applies to every action.
    var expectedToken = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (expectedToken && data.apiKey !== expectedToken) {
      return jsonResponse({ success: false, message: 'Unauthorized request.' });
    }

    var action = data.action || 'register';
    switch (action) {
      case 'register':
        return handleRegister(data);
      case 'lookup':
        return handleLookup(data);
      case 'search':
        return handleSearch(data);
      case 'update':
        return handleUpdate(data);
      case 'stats':
        return handleStats();
      case 'list':
        return handleList();
      default:
        return jsonResponse({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server error: ' + err.message });
  }
}

function doGet() {
  return jsonResponse({ success: true, message: 'Personal Information Collection App API is running.' });
}

/**
 * Run this manually from the Apps Script editor (select it in the function
 * dropdown next to "Debug", then click "Run") if QR codes are coming back
 * empty. Running a function directly — instead of through the deployed Web
 * App — is what actually triggers Google's authorization prompt for the
 * "connect to an external service" permission that QR generation needs.
 * Check View > Logs afterward for the result.
 */
function testQrGeneration() {
  var url = generateQrCode('TEST-0000');
  if (url) {
    Logger.log('SUCCESS: ' + url);
  } else {
    Logger.log('FAILED: see the error above, or re-run after authorizing.');
  }
}

// ---------------------------------------------------------------- register

function handleRegister(data) {
  var validationError = validatePayload(data);
  if (validationError) {
    return jsonResponse({ success: false, message: validationError });
  }

  var registrationId = nextRegistrationId();
  var imageUrl = uploadImageToDrive(data.imageBase64, data.imageFileName, data.imageMimeType);
  var qrCodeUrl = generateQrCode(registrationId);

  var sheet = getOrCreateSheet();
  sheet.appendRow([
    new Date(),
    registrationId,
    data.firstName || '',
    data.middleName || '',
    data.lastName || '',
    data.age || '',
    data.sex || '',
    data.civilStatus || '',
    data.nationality || '',
    data.phoneNumber ? "'" + data.phoneNumber : '',
    data.email || '',
    data.completeAddress || '',
    imageUrl,
    qrCodeUrl,
    qrCodeUrl ? '=IMAGE("' + qrCodeUrl + '",4,80,80)' : '',
    'Active',
    data.deviceModel || '',
    data.osVersion || '',
    data.appVersion || '',
  ]);

  return jsonResponse({
    success: true,
    registrationId: registrationId,
    imageUrl: imageUrl,
    qrCodeUrl: qrCodeUrl,
    message: 'Registration saved successfully.',
  });
}

/**
 * Generates a sequential REG-YYYYMMDD-NNNNNN id. The counter lives in
 * script properties; LockService prevents two simultaneous submissions
 * from receiving the same number.
 */
function nextRegistrationId() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var counter = Number(props.getProperty('REG_COUNTER') || '0') + 1;
    props.setProperty('REG_COUNTER', String(counter));
  } finally {
    lock.releaseLock();
  }
  var now = new Date();
  var pad = function (n, w) {
    var s = String(n);
    while (s.length < w) s = '0' + s;
    return s;
  };
  var dateStr = '' + now.getFullYear() + pad(now.getMonth() + 1, 2) + pad(now.getDate(), 2);
  return 'REG-' + dateStr + '-' + pad(counter, 6);
}

/**
 * Builds a QR PNG containing ONLY the registration id and stores it in the
 * "QR Codes" Drive folder. Returns the file URL, or '' if generation fails
 * (a failed QR must never block the registration itself).
 */
function generateQrCode(registrationId) {
  try {
    var qrApi =
      'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' +
      encodeURIComponent(registrationId);
    var response = UrlFetchApp.fetch(qrApi, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      console.error('QR fetch returned HTTP ' + response.getResponseCode() + ' for ' + registrationId);
      return '';
    }
    var blob = response.getBlob().setName(registrationId + '.png');
    var folder = getOrCreateFolderByName(QR_FOLDER_NAME);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?id=' + file.getId();
  } catch (err) {
    console.error('generateQrCode failed for ' + registrationId + ': ' + err.message);
    return '';
  }
}

// ---------------------------------------------------------------- queries

function handleLookup(data) {
  var registrationId = String(data.registrationId || '').trim();
  if (!registrationId) {
    return jsonResponse({ success: false, message: 'Registration ID is required.' });
  }
  var record = findRecordById(registrationId);
  if (!record) {
    return jsonResponse({ success: false, message: 'Record Not Found' });
  }
  return jsonResponse({ success: true, record: record });
}

function handleSearch(data) {
  var query = String(data.query || '').trim().toLowerCase();
  if (!query) {
    return jsonResponse({ success: false, message: 'Search query is required.' });
  }
  var records = readAllRecords();
  var matches = [];
  for (var i = 0; i < records.length && matches.length < 25; i++) {
    var r = records[i];
    var name = (r.firstName + ' ' + r.middleName + ' ' + r.lastName).toLowerCase();
    if (
      r.registrationId.toLowerCase().indexOf(query) !== -1 ||
      name.indexOf(query) !== -1 ||
      String(r.phoneNumber).toLowerCase().indexOf(query) !== -1 ||
      String(r.email).toLowerCase().indexOf(query) !== -1
    ) {
      matches.push(r);
    }
  }
  return jsonResponse({ success: true, records: matches });
}

function handleUpdate(data) {
  var registrationId = String(data.registrationId || '').trim();
  if (!registrationId) {
    return jsonResponse({ success: false, message: 'Registration ID is required.' });
  }

  var sheet = getOrCreateSheet();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var col = headerIndexMap(headers);
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][col['Registration ID']]) === registrationId) {
      rowIndex = i;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, message: 'Record Not Found' });
  }

  var editable = {
    firstName: 'First Name',
    middleName: 'Middle Name',
    lastName: 'Last Name',
    age: 'Age',
    sex: 'Sex',
    civilStatus: 'Civil Status',
    nationality: 'Nationality',
    phoneNumber: 'Phone Number',
    email: 'Email',
    completeAddress: 'Complete Address',
    status: 'Status',
  };
  for (var field in editable) {
    if (data[field] !== undefined) {
      var value = data[field];
      if (field === 'phoneNumber' && value) value = "'" + value;
      sheet.getRange(rowIndex + 1, col[editable[field]] + 1).setValue(value);
    }
  }

  if (data.imageBase64) {
    var imageUrl = uploadImageToDrive(data.imageBase64, data.imageFileName, data.imageMimeType);
    sheet.getRange(rowIndex + 1, col['Google Drive Image URL'] + 1).setValue(imageUrl);
  }

  return jsonResponse({ success: true, record: findRecordById(registrationId), message: 'Record updated.' });
}

function handleStats() {
  var records = readAllRecords();
  var today = new Date();
  var todayKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  var stats = { total: records.length, today: 0, male: 0, female: 0, other: 0, averageAge: 0, recent: [] };
  var ageSum = 0;
  var ageCount = 0;

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var ts = new Date(r.timestamp);
    var key = ts.getFullYear() + '-' + (ts.getMonth() + 1) + '-' + ts.getDate();
    if (key === todayKey) stats.today++;
    if (r.sex === 'Male') stats.male++;
    else if (r.sex === 'Female') stats.female++;
    else if (r.sex === 'Other') stats.other++;
    var age = Number(r.age);
    if (!isNaN(age) && age > 0) {
      ageSum += age;
      ageCount++;
    }
  }
  stats.averageAge = ageCount ? Math.round((ageSum / ageCount) * 10) / 10 : 0;

  var recent = records.slice(-5).reverse();
  for (var j = 0; j < recent.length; j++) {
    stats.recent.push({
      registrationId: recent[j].registrationId,
      name: (recent[j].firstName + ' ' + recent[j].lastName).trim(),
      timestamp: recent[j].timestamp,
    });
  }

  return jsonResponse({ success: true, stats: stats });
}

function handleList() {
  return jsonResponse({ success: true, records: readAllRecords() });
}

// ---------------------------------------------------------------- helpers

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
  if (!data.completeAddress || !String(data.completeAddress).trim()) {
    return 'Complete address is required.';
  }
  if (!data.imageBase64) return 'A profile photo is required.';

  var approxImageBytes = Math.floor((String(data.imageBase64).length * 3) / 4);
  if (approxImageBytes > 10 * 1024 * 1024) return 'Image exceeds the 10MB size limit.';

  return null;
}

function uploadImageToDrive(base64Data, fileName, mimeType) {
  var folder = getOrCreateFolder();
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName || 'photo.jpg');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id=' + file.getId();
}

function getOrCreateFolder() {
  var configuredId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (configuredId) {
    try {
      return DriveApp.getFolderById(configuredId);
    } catch (err) {
      // Fall through to name-based lookup if the configured ID is invalid.
    }
  }
  return getOrCreateFolderByName(DRIVE_FOLDER_NAME);
}

function getOrCreateFolderByName(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
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

function headerIndexMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) map[headers[i]] = i;
  return map;
}

function readAllRecords() {
  var sheet = getOrCreateSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var col = headerIndexMap(values[0]);
  var records = [];
  for (var i = 1; i < values.length; i++) {
    records.push(rowToRecord(values[i], col));
  }
  return records;
}

function findRecordById(registrationId) {
  var records = readAllRecords();
  for (var i = 0; i < records.length; i++) {
    if (records[i].registrationId === registrationId) return records[i];
  }
  return null;
}

function rowToRecord(row, col) {
  var get = function (header) {
    var idx = col[header];
    return idx === undefined ? '' : row[idx];
  };
  var timestamp = get('Timestamp');
  return {
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp),
    registrationId: String(get('Registration ID')),
    firstName: String(get('First Name')),
    middleName: String(get('Middle Name')),
    lastName: String(get('Last Name')),
    age: String(get('Age')),
    sex: String(get('Sex')),
    civilStatus: String(get('Civil Status')),
    nationality: String(get('Nationality')),
    phoneNumber: String(get('Phone Number')),
    email: String(get('Email')),
    completeAddress: String(get('Complete Address')),
    imageUrl: String(get('Google Drive Image URL')),
    qrCodeUrl: String(get('QR Code URL')),
    status: String(get('Status')),
    deviceModel: String(get('Device Model')),
    osVersion: String(get('OS Version')),
    appVersion: String(get('App Version')),
  };
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
