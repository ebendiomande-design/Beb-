// ============================================================
//  DÉCLARATIONS HSE — Backend Google Apps Script
//  Personnalisez les 3 constantes ci-dessous puis déployez.
// ============================================================

const SHEET_ID      = '1PtxTsZqCeMeT_iAhtjha6_EBjYUc3hqZr-ydfME6ZGs';
const EMAIL_HSE     = 'eben.diomande@gmail.com';
const ENVOYER_EMAIL = true;                      // false = désactive les emails

// ------------------------------------------------------------
//  Tables autorisées et définition des colonnes (ordre = colonnes Sheet)
// ------------------------------------------------------------
const TABLES = {
  Observations: [
    'Ref','DateHeure','DeclarationType','DeclarantNom','Email',
    'EntiteEmettrice','Source','Zone','Zone0','TypeSituation',
    'Categorie','GravitePotentielle','Description',
    'Statut','PieceJointe','Title','Recu'
  ],
  Accidents: [
    'Ref','DateHeure','DeclarationType','DeclarantNom','Email',
    'Site','Zone','PersonneBlessee','Fonction',
    'NatureBlessure','DescriptionAccident',
    'PieceJointe','Title','Recu'
  ],
  Actions: [
    'Ref','EvenementID','EvenementType',
    'DescriptionAction','ResponsableAction','Echeance',
    'Priorite','StatutAction','Commentaire','Title','Recu'
  ]
};

// Préfixes de référence par table
const PREFIXES = { Observations: 'OBS', Accidents: 'ACC', Actions: 'ACT' };

// ------------------------------------------------------------
//  Point d'entrée POST
// ------------------------------------------------------------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const table   = payload.table;
    const data    = payload.data || {};

    if (!TABLES[table]) {
      return jsonResp({ ok: false, error: 'Table inconnue : ' + table });
    }

    const ref  = genRef(PREFIXES[table]);
    const now  = nowParis();
    const ss   = SpreadsheetApp.openById(SHEET_ID);
    const cols = TABLES[table];

    // Crée l'onglet + en-têtes si absent
    let sheet = ss.getSheetByName(table);
    if (!sheet) {
      sheet = ss.insertSheet(table);
      sheet.appendRow(cols);
      sheet.setFrozenRows(1);
      formatHeader(sheet, cols.length);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(cols);
      sheet.setFrozenRows(1);
      formatHeader(sheet, cols.length);
    }

    // Photo : stocke uniquement un marqueur dans la cellule
    let photoBase64 = null;
    if (data.PieceJointe && data.PieceJointe.length > 200) {
      photoBase64        = data.PieceJointe; // conservé pour l'email
      data.PieceJointe   = 'Photo jointe (voir email)';
    }

    // Construction de la ligne dans l'ordre des colonnes
    data.Ref    = ref;
    data.Recu   = now;
    if (!data.Statut)      data.Statut      = 'Nouveau';
    if (!data.StatutAction) data.StatutAction = 'En cours';

    const row = cols.map(col => (data[col] !== undefined ? data[col] : ''));
    sheet.appendRow(row);

    // Mise en forme légère de la nouvelle ligne
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, cols.length)
      .setWrap(true)
      .setVerticalAlignment('top');

    // Email d'alerte (Observations et Accidents uniquement)
    if (ENVOYER_EMAIL && table !== 'Actions') {
      notifier(table, ref, data, photoBase64);
    }

    return jsonResp({ ok: true, ref: ref });

  } catch (err) {
    Logger.log(err);
    return jsonResp({ ok: false, error: err.message });
  }
}

// ------------------------------------------------------------
//  Point d'entrée GET (test de vie)
// ------------------------------------------------------------
function doGet() {
  return jsonResp({ ok: true, msg: 'HSE backend actif.' });
}

// ------------------------------------------------------------
//  Envoi de l'email d'alerte
// ------------------------------------------------------------
function notifier(table, ref, data, photoBase64) {
  const sujet = '🔔 Nouvelle déclaration HSE : ' + (data.DeclarationType || table) + ' [' + ref + ']';

  const corps = [
    '=== NOUVELLE DÉCLARATION HSE ===',
    '',
    'Référence    : ' + ref,
    'Type         : ' + (data.DeclarationType || '—'),
    'Déclarant    : ' + (data.DeclarantNom    || '—'),
    'Date/Heure   : ' + (data.DateHeure       || '—'),
    'Zone/Site    : ' + (data.Zone || data.Site || '—'),
    'Description  : ' + (data.Description || data.DescriptionAccident || '—'),
    'Gravité      : ' + (data.GravitePotentielle || '—'),
    'Statut       : ' + (data.Statut || 'Nouveau'),
    '',
    '--- Accéder au Google Sheets pour traiter cette déclaration. ---'
  ].join('\n');

  const opts = { name: 'Système HSE' };

  if (photoBase64) {
    try {
      const match    = photoBase64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const b64data  = match ? match[2] : photoBase64;
      const blob     = Utilities.newBlob(Utilities.base64Decode(b64data), mimeType, 'photo_' + ref + '.jpg');
      opts.attachments = [blob];
    } catch (imgErr) {
      Logger.log('Photo non jointe : ' + imgErr.message);
    }
  }

  MailApp.sendEmail(EMAIL_HSE, sujet, corps, opts);
}

// ------------------------------------------------------------
//  Utilitaires
// ------------------------------------------------------------
function genRef(prefix) {
  const d   = new Date();
  const tz  = 'Europe/Paris';
  const fmt = str => Utilities.formatDate(d, tz, str);
  return prefix + '-' + fmt('yyMMdd') + '-' + fmt('HHmmss');
}

function nowParis() {
  return Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm:ss');
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatHeader(sheet, nbCols) {
  const hdr = sheet.getRange(1, 1, 1, nbCols);
  hdr.setBackground('#16191f')
     .setFontColor('#f5a623')
     .setFontWeight('bold')
     .setFontSize(10);
  sheet.setColumnWidth(1, 140);
}
