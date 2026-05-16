// =============================================
//  Google Apps Script — Real Estate API
//  انسخ هذا الكود في Apps Script تبع الشيت
// =============================================

// اسم الشيت تبع المعروض — غيّره لو مختلف
const SHEET_NAME = "المعروض";

function doGet(e) {
  return handleRequest(e);
}
function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    let params = {};
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }

    const action = params.action;
    let result;

    switch (action) {
      case 'getProperties':    result = getProperties();          break;
      case 'getProperty':      result = getProperty(params.id);   break;
      case 'addProperty':      result = addProperty(params);      break;
      case 'updateProperty':   result = updateProperty(params);   break;
      case 'deleteProperty':   result = deleteProperty(params.id);break;
      default:                 result = { success: false, error: 'action غير معروف: ' + action };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }

  return output;
}

// ---- Helpers ----
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function generateId(sheet) {
  const lastRow = sheet.getLastRow();
  return 'PR-' + String(lastRow).padStart(4, '0');
}

// ---- Column Mapping (يطابق أعمدة الشيت) ----
// تأكد أن أسماء الأعمدة في الشيت تطابق هذه القيم
const COL = {
  id:             'ID',
  type:           'النوع',
  status:         'الحالة',
  location:       'الموقع',
  rent:           'الإيجار',
  floor:          'الدور',
  furnished:      'مفروشة',
  parking:        'موقف',
  ownerName:      'اسم المالك',
  ownerPhone:     'هاتف المالك',
  ownerWhatsapp:  'واتساب المالك',
  images:         'الصور',
  notes:          'ملاحظات',
};

function mapRowToProperty(obj) {
  return {
    id:            obj[COL.id]            || '',
    type:          obj[COL.type]          || '',
    status:        obj[COL.status]        || 'متاح',
    location:      obj[COL.location]      || '',
    rent:          obj[COL.rent]          || 0,
    floor:         obj[COL.floor]         || '',
    furnished:     obj[COL.furnished]     || 'لا',
    parking:       obj[COL.parking]       || '',
    ownerName:     obj[COL.ownerName]     || '',
    ownerPhone:    obj[COL.ownerPhone]    || '',
    ownerWhatsapp: obj[COL.ownerWhatsapp] || '',
    images:        obj[COL.images]        || '',
    notes:         obj[COL.notes]         || '',
  };
}

// ---- CRUD ----
function getProperties() {
  const sheet = getSheet();
  if (!sheet) return { success: false, error: 'الشيت غير موجود: ' + SHEET_NAME };
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, properties: [] };
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const properties = rows
    .map(r => rowToObj(headers, r))
    .filter(o => o[COL.id])
    .map(mapRowToProperty);
  return { success: true, properties };
}

function getProperty(id) {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, error: 'لا يوجد بيانات' };
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idCol = headers.indexOf(COL.id);
  const rowIdx = rows.findIndex(r => String(r[idCol]) === String(id));
  if (rowIdx === -1) return { success: false, error: 'العقار غير موجود' };
  const property = mapRowToProperty(rowToObj(headers, rows[rowIdx]));
  return { success: true, property };
}

function addProperty(params) {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const newId = generateId(sheet);
  const row = headers.map(h => {
    const key = Object.keys(COL).find(k => COL[k] === h);
    if (h === COL.id) return newId;
    return key ? (params[key] || '') : '';
  });
  sheet.appendRow(row);
  return { success: true, id: newId };
}

function updateProperty(params) {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idCol = headers.indexOf(COL.id);
  const rowIdx = rows.findIndex(r => String(r[idCol]) === String(params.id));
  if (rowIdx === -1) return { success: false, error: 'العقار غير موجود' };
  const sheetRow = rowIdx + 2;
  const newRow = headers.map(h => {
    if (h === COL.id) return params.id;
    const key = Object.keys(COL).find(k => COL[k] === h);
    return key ? (params[key] !== undefined ? params[key] : rows[rowIdx][headers.indexOf(h)]) : rows[rowIdx][headers.indexOf(h)];
  });
  sheet.getRange(sheetRow, 1, 1, headers.length).setValues([newRow]);
  return { success: true };
}

function deleteProperty(id) {
  const sheet = getSheet();
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idCol = headers.indexOf(COL.id);
  const rowIdx = rows.findIndex(r => String(r[idCol]) === String(id));
  if (rowIdx === -1) return { success: false, error: 'العقار غير موجود' };
  sheet.deleteRow(rowIdx + 2);
  return { success: true };
}
