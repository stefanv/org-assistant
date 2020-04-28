// Once this code is deployed as a web app, you can call it via curl:
//
// URL="..."
// TOKEN="..."
// curl -s -S -L -d "$TOKEN" "$URL?clear=1" >> output.org
//
// Remember to customize the assistant spreadsheet URL below.

function doPost(e) {
  // The document ID appears in the URL when you have the
  // spreadsheet open: https://docs.google.com/spreadsheets/d/<SPREADSHEET ID>/edit#gid=0
  var spreadsheetId = "...";

  // A token (your password) can be anything; you can generate it using, e.g., Python:
  //
  //   python -c "import base64, os; print(base64.b64encode(os.urandom(50)).decode('ascii'))"
  //
  var token = "...";

  var response = "Invalid token";
  var clear = (e.parameter['clear'] === '1');

  if (e.postData.contents === token) {
    response = assistantSpreadsheetToOrg(spreadsheetId, clear);
  }

  return ContentService.createTextOutput(response);
}

function doGet(e) {
  return ContentService.createTextOutput("OK");
}

function assistantDateToOrg(dateStr) {
  /*
  The IFTTT Google Assistant integration saves timestamps in the form

    November 12, 2018 at 11:28PM

  whereas org-mode expects them to look like

    [2018-11-12 11:28]
  */
  months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December']

  dateStr = dateStr.split(' ');
  month = dateStr[0];
  day = dateStr[1].substring(0, 2);
  year = dateStr[2].substring(0, 4);
  hour = dateStr[4].substring(0, 2);
  minute = dateStr[4].substring(3, 5);
  time = dateStr[4].substring(0, 5);
  ampm = dateStr[4].substring(5, 7);

  month_nr = months.indexOf(month) + 1;

  if (ampm === 'PM') {
    hour = (parseInt(hour) + 12).toString();
  }

  return Utilities.formatString("[%s-%s-%s %s:%s]", year, month_nr, day, hour, minute);
}

function assistantSpreadsheetToOrg(googleDriveFileId, clearSheet) {
  /*

  googleDriveFileId (str):
      The document ID is appears in the URL when you have the
      spreadsheet open:
          https://docs.google.com/spreadsheets/d/<SPREADSHEET ID>/edit#gid=0

  clearSheet (bool):
      whether or not to clear the spreadsheet after processing

  */
  var org_template = "* TODO %s\n:PROPERTIES:\n:ASSISTANT_TIMESTAMP: %s\n:END:\n"

  var ss = SpreadsheetApp.openById(googleDriveFileId);
  var sheet = ss.getSheets()[0];

  var rangeData = sheet.getDataRange();
  var lastColumn = rangeData.getLastColumn();
  var lastRow = rangeData.getLastRow();
  var searchRange = sheet.getRange(1, 1, lastRow, lastColumn);

  // Check whether spreadsheet has the two columns we expect;
  // if not, the spreadsheet is probably blank, so we exit early.
  if (lastColumn !== 2) {
    return "";
  }

  var org_file = [""];
  var rangeValues = searchRange.getValues();

  for ( i = 0; i < lastRow; i++ ) {
    date = assistantDateToOrg(rangeValues[i][0]);
    task = rangeValues[i][1];
    org_file.push(Utilities.formatString(org_template, task, date));
  }

  if (clearSheet === true) {
    sheet.clear();
  }

  return org_file.join("\n");
}
