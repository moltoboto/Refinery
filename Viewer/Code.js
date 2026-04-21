// REFINERY - Google Apps Script Backend - Viewer v2.9

const CONFIG = {
  SHEET_ID: '1oJhKgjsp3HnNgyFdD3HON1mIHmlc00NCkDfo7R1QLss',
  ARTICLES_TAB: 'articles',
  AUDIT_TAB: 'ingestion_log',
  ARTIFACTS_TAB: 'artifacts',
  DRIVE_FOLDER_ID: '1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz',
  PURGE_DAYS: 30,
  PURGE_MAX: 5000,
  SUPABASE_URL: 'https://hwropcciwxzzukfcjlsr.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cm9wY2Npd3h6enVrZmNqbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTQwODQsImV4cCI6MjA4Nzk5MDA4NH0.ExKBBi2sL2RFrfglHghiXiUTWzOtMRTIB_wqT1q3eHg'
};

const ARTIFACT_KEEP_PROPERTY = 'refinery.keptArtifacts';
const SUPABASE_PAGE_SIZE = 250;

function authorizeExternal() {
  UrlFetchApp.fetch('https://www.google.com');
  Logger.log('External request authorization granted.');
}

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('Refinery V2.8')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'ingest') {
      return ContentService
        .createTextOutput(JSON.stringify(ingestArticles(body.articles)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unknown action: ' + body.action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ingestArticles(articles) {
  if (!articles || !articles.length) {
    return { inserted: 0, errors: ['No articles provided'] };
  }

  var response = supabaseRequest_('/rest/v1/articles', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(articles)
  });

  if (response.error) {
    return { inserted: 0, errors: [response.error] };
  }

  if (response.code === 201) {
    var inserted = Array.isArray(response.json) ? response.json.length : articles.length;
    _logIngestion(articles, inserted);
    return { inserted: inserted, errors: [] };
  }

  return {
    inserted: 0,
    errors: ['Supabase error ' + response.code + ': ' + response.text]
  };
}

function _logIngestion(articles, count) {
  try {
    var sources = unique_(articles.map(function(article) { return article.source; })).join(', ');
    var issues = unique_(articles.map(function(article) { return article.issue; })).join(', ');
    appendAuditLog({
      date_processed: new Date().toISOString(),
      email_subject: issues,
      sender: sources,
      articles_extracted: count,
      notes: 'Ingested via Claude -> Apps Script -> Supabase'
    });
  } catch (e) {
    // non-fatal
  }
}

function getArticles() {
  try {
    return { articles: getAllArticles_() };
  } catch (e) {
    return { error: e.toString() };
  }
}

function getInitialArticles() {
  return getViewerBootstrap(250, 50);
}

function getViewerBootstrap(limit, artifactLimit) {
  try {
    limit = normalizePositiveInt_(limit, 1250);
    artifactLimit = normalizePositiveInt_(artifactLimit, 50);

    var keptArticles = [];
    var unreadMain = [];
    var readMain = [];
    var stats = null;
    var artifactResult = { artifacts: [], total: 0 };

    keptArticles = fetchAllArticlesByQuery_(
      'kept=eq.true&order=date_added.desc',
      '*'
    );
    unreadMain = fetchAllArticlesByQuery_(
      'kept=eq.false&status=not.in.(read,deleted)&order=date_added.desc',
      '*'
    );

    var fillCount = Math.max(limit - unreadMain.length, 0);
    if (fillCount > 0) {
      try {
        readMain = fetchLimitedArticlesByQuery_(
          'kept=eq.false&status=eq.read&order=date_added.desc',
          '*',
          fillCount
        );
      } catch (fillError) {
        Logger.log('Bootstrap fill degraded: ' + fillError);
        readMain = [];
      }
    }

    try {
      stats = buildViewerStats_();
    } catch (statsError) {
      Logger.log('Viewer stats degraded: ' + statsError);
      stats = buildFallbackStats_(keptArticles.concat(unreadMain, readMain));
    }

    try {
      artifactResult = getArtifacts(artifactLimit);
      if (artifactResult.error) {
        Logger.log('Artifacts degraded: ' + artifactResult.error);
        artifactResult = { artifacts: [], total: 0 };
      }
    } catch (artifactError) {
      Logger.log('Artifacts degraded: ' + artifactError);
      artifactResult = { artifacts: [], total: 0 };
    }

    return {
      articles: keptArticles.concat(unreadMain, readMain),
      stats: stats,
      artifacts: artifactResult.artifacts || [],
      artifactTotal: artifactResult.total || 0,
      moreAvailable: Math.max((stats.browseableArticles || 0) - (unreadMain.length + readMain.length), 0),
      degraded: readMain.length === 0 && fillCount > 0
    };
  } catch (e) {
    return { error: e.toString() };
  }
}
function getMoreArticles(excludeIds, limit) {
  try {
    limit = normalizePositiveInt_(limit, 250);
    excludeIds = Array.isArray(excludeIds) ? excludeIds : [];

    var excluded = {};
    for (var i = 0; i < excludeIds.length; i++) {
      excluded[String(excludeIds[i])] = true;
    }

    var offset = 0;
    var results = [];
    var keepGoing = true;

    while (keepGoing && results.length < limit) {
      var batch = fetchBatch_(
        'kept=eq.false&status=eq.read&order=date_added.desc',
        '*',
        offset,
        SUPABASE_PAGE_SIZE
      );
      if (!batch.length) break;

      for (var j = 0; j < batch.length && results.length < limit; j++) {
        var article = batch[j];
        if (!excluded[String(article.id)]) {
          results.push(article);
          excluded[String(article.id)] = true;
        }
      }

      if (batch.length < SUPABASE_PAGE_SIZE) {
        keepGoing = false;
      } else {
        offset += SUPABASE_PAGE_SIZE;
      }
    }

    return { articles: results };
  } catch (e) {
    return { error: e.toString() };
  }
}

function testGetArticles() {
  var result = getArticles();
  if (result.error) {
    Logger.log('ERROR: ' + result.error);
    return;
  }
  Logger.log('Total articles: ' + result.articles.length);
  Logger.log('Kept articles: ' + result.articles.filter(function(a) { return a.kept === true; }).length);
}

function updateArticle(id, fields) {
  try {
    var response = supabaseRequest_('/rest/v1/articles?id=eq.' + encodeURIComponent(id), {
      method: 'patch',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(fields)
    });

    if (response.error) return { error: response.error };
    if (response.code === 200) return { success: true };
    return { error: 'Supabase error ' + response.code + ': ' + response.text };
  } catch (e) {
    return { error: e.toString() };
  }
}

function archiveArticle(id) {
  return updateArticle(id, { status: 'read', archived: true });
}

function keepArticle(id, kept) {
  if (typeof kept === 'undefined') kept = true;
  return updateArticle(id, { kept: kept });
}

function markRead(id) {
  return updateArticle(id, { status: 'read' });
}

function markUnread(id) {
  return updateArticle(id, { status: 'unread' });
}


function getArtifacts(limit) {
  try {
    limit = normalizePositiveInt_(limit, 0);
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    var files = folder.getFiles();
    var artifacts = [];
    var keepMap = getArtifactKeepMap_();

    while (files.hasNext()) {
      var file = files.next();
      var mimeType = file.getMimeType();
      var meta = parseArtifactMeta_(file.getDescription());
      var artifactKind = inferArtifactKind_(file.getName(), meta);
      var effectiveMime = normalizeArtifactMime_(mimeType, artifactKind, file.getName());
      artifacts.push(buildArtifactRecord_(file, meta, artifactKind, effectiveMime, keepMap));
    }

    artifacts.sort(function(a, b) {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

    return {
      total: artifacts.length,
      artifacts: limit > 0 ? artifacts.slice(0, limit) : artifacts
    };
  } catch (e) {
    return { error: e.toString(), total: 0, artifacts: [] };
  }
}

function buildArtifactRecord_(file, meta, artifactKind, effectiveMime, keepMap) {
  var createdAt = file.getDateCreated();
  var effectiveDate = extractArtifactDate_(file.getName(), meta, createdAt);
  return {
    id: file.getId(),
    name: file.getName(),
    displayTitle: getArtifactDisplayTitle_(file.getName(), meta),
    mimeType: effectiveMime,
    rawMimeType: file.getMimeType(),
    typeLabel: getMimeLabel(effectiveMime),
    typeIcon: getMimeIcon(effectiveMime),
    viewerMode: getArtifactViewerMode_(effectiveMime),
    artifactKind: artifactKind,
    url: file.getUrl(),
    previewUrl: getPreviewUrl(file.getId(), effectiveMime),
    size: formatBytes(file.getSize()),
    dateAdded: effectiveDate.toISOString(),
    dateLabel: Utilities.formatDate(effectiveDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    kept: !!keepMap[file.getId()]
  };
}

function getArtifactContent(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var rawMimeType = file.getMimeType();
    var meta = parseArtifactMeta_(file.getDescription());
    var artifactKind = inferArtifactKind_(file.getName(), meta);
    var mimeType = normalizeArtifactMime_(rawMimeType, artifactKind, file.getName());
    var viewerMode = getArtifactViewerMode_(mimeType);
    var blob = file.getBlob();
    var title = getArtifactDisplayTitle_(file.getName(), meta);

    if (viewerMode === 'html') {
      var raw = blob.getDataAsString('UTF-8');
      var html = mimeType === 'text/plain'
        ? buildArtifactHtmlDocument_('<pre class="artifact-text">' + escapeHtml_(raw) + '</pre>', title)
        : buildArtifactHtmlDocument_(sanitizeArtifactHtml_(raw), title);
      return { success: true, mode: 'html', html: html, name: file.getName(), mimeType: mimeType, rawMimeType: rawMimeType };
    }

    if (viewerMode === 'image') {
      return {
        success: true,
        mode: 'image',
        dataUrl: 'data:' + mimeType + ';base64,' + Utilities.base64Encode(blob.getBytes()),
        name: file.getName(),
        mimeType: mimeType,
        rawMimeType: rawMimeType
      };
    }

    return { error: 'Artifact is not locally renderable', mode: viewerMode, mimeType: mimeType, rawMimeType: rawMimeType };
  } catch (e) {
    return { error: e.toString() };
  }
}

function parseArtifactMeta_(description) {
  var raw = String(description || '');
  if (raw.indexOf('REFINERY_ARTIFACT ') !== 0) return null;
  try {
    return JSON.parse(raw.substring('REFINERY_ARTIFACT '.length));
  } catch (e) {
    return null;
  }
}

function inferArtifactKind_(name, meta) {
  if (meta && meta.kind) return String(meta.kind);
  return /^(Refinery )?Newsletter - /i.test(String(name || '')) ? 'newsletter' : /^(Refinery )?Email - /i.test(String(name || '')) ? 'email' : 'file';
}

function getArtifactDisplayTitle_(name, meta) {
  if (meta && meta.title) return String(meta.title);
  var title = String(name || 'Artifact');
  title = title.replace(/\.[^.]+$/, '');                                     // strip extension
  title = title.replace(/\s*\[[^\]]+\]\s*$/, '');                           // strip [messageId]
  title = title.replace(/^\d{4}-\d{2}-\d{2}\s*--\s*/, '');                 // strip leading "YYYY-MM-DD -- "
  title = title.replace(/^(Refinery\s+)?(?:Newsletter|Email)\s*-\s*/i, ''); // strip "Refinery Newsletter - "
  title = title.replace(/\s*-\s*\d{4}-\d{2}-\d{2}\s*-\s*/, ' - ');        // strip embedded " - YYYY-MM-DD - "
  title = title.replace(/^\s*-\s*/, '');                                    // clean leading dash
  return title.trim() || String(name || 'Artifact');
}

function normalizeArtifactMime_(mime, artifactKind, name) {
  var raw = String(mime || '').toLowerCase();
  var lowerName = String(name || '').toLowerCase();
  if (looksLikeTextMime_(raw) && /^(email|newsletter)$/i.test(String(artifactKind || ''))) return 'text/html';
  if (raw === 'text/html' || /\.html?$/i.test(lowerName)) return 'text/html';
  if (looksLikeTextMime_(raw) || /\.(txt|md|markdown|json|csv|log|text)$/i.test(lowerName)) return 'text/plain';
  if ((raw === 'application/octet-stream' || raw === '') && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName)) {
    if (/\.png$/i.test(lowerName)) return 'image/png';
    if (/\.jpe?g$/i.test(lowerName)) return 'image/jpeg';
    if (/\.gif$/i.test(lowerName)) return 'image/gif';
    if (/\.webp$/i.test(lowerName)) return 'image/webp';
    if (/\.bmp$/i.test(lowerName)) return 'image/bmp';
    if (/\.svg$/i.test(lowerName)) return 'image/svg+xml';
  }
  return mime;
}

function looksLikeTextMime_(mime) {
  var raw = String(mime || '').toLowerCase();
  return raw === 'text/plain'
    || raw === 'text/markdown'
    || raw === 'text/x-markdown'
    || raw === 'text/csv'
    || raw === 'application/json'
    || raw === 'application/x-ndjson'
    || raw === 'text/xml'
    || raw === 'application/xml'
    || (raw.indexOf('text/') === 0 && raw !== 'text/html');
}

function getArtifactViewerMode_(mime) {
  if (mime === 'text/html' || mime === 'text/plain') return 'html';
  if (String(mime || '').indexOf('image/') === 0) return 'image';
  return 'drive';
}

function getMimeLabel(mime) {
  var map = {
    'application/pdf': 'PDF',
    'application/vnd.google-apps.document': 'Doc',
    'application/vnd.google-apps.spreadsheet': 'Sheet',
    'application/vnd.google-apps.presentation': 'Slides',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/png': 'Image',
    'image/jpeg': 'Image',
    'image/gif': 'Image',
    'image/webp': 'Image',
    'image/bmp': 'Image',
    'image/svg+xml': 'Image',
    'text/plain': 'Text',
    'text/html': 'HTML',
    'application/zip': 'ZIP'
  };
  return map[mime] || 'File';
}

function getMimeIcon(mime) {
  var safeMime = String(mime || '');
  if (safeMime.indexOf('pdf') !== -1) return 'PDF';
  if (safeMime === 'text/html') return 'HTML';
  if (safeMime.indexOf('document') !== -1) return 'DOC';
  if (safeMime.indexOf('spreadsheet') !== -1 || safeMime.indexOf('excel') !== -1) return 'XLS';
  if (safeMime.indexOf('presentation') !== -1) return 'PPT';
  if (safeMime.indexOf('image') !== -1) return 'IMG';
  if (safeMime.indexOf('text') !== -1) return 'TXT';
  if (safeMime.indexOf('zip') !== -1) return 'ZIP';
  return 'FILE';
}

function getPreviewUrl(fileId, mime) {
  if (mime === 'text/html' || mime === 'text/plain') return '';
  if (mime === 'application/pdf') return 'https://drive.google.com/file/d/' + fileId + '/preview';
  if (String(mime || '').indexOf('application/vnd.google-apps') === 0) return 'https://drive.google.com/file/d/' + fileId + '/preview';
  if (String(mime || '').indexOf('image/') === 0) return 'https://drive.google.com/uc?id=' + fileId;
  return 'https://drive.google.com/file/d/' + fileId + '/preview';
}

function sanitizeArtifactHtml_(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    .replace(/\s(on[a-z]+)=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\shref=("|')javascript:[\s\S]*?\1/gi, ' href="#"');
}

function buildArtifactHtmlDocument_(bodyHtml, title) {
  var content = String(bodyHtml || '');
  if (/<html[\s>]/i.test(content)) {
    if (/<head[\s>]/i.test(content)) {
      return content.replace(/<head([^>]*)>/i, '<head$1><base target="_blank">');
    }
    return content.replace(/<html([^>]*)>/i, '<html$1><head><base target="_blank"></head>');
  }

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<base target="_blank">',
    '<title>' + escapeHtml_(title || 'Artifact') + '</title>',
    '<style>html,body{margin:0;padding:0;background:#f6f2ea;}body{font-family:Arial,sans-serif;color:#1f1b16;}img{max-width:100%;height:auto;}table{max-width:100% !important;}a{color:#b5551c;word-break:break-word;}.artifact-text{white-space:pre-wrap;font:14px/1.7 Arial,sans-serif;padding:20px;}</style>',
    '</head>',
    '<body>',
    content,
    '</body>',
    '</html>'
  ].join('');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function setArtifactKept(id, kept) {
  try {
    var keepMap = getArtifactKeepMap_();
    if (kept) keepMap[id] = new Date().toISOString();
    else delete keepMap[id];
    saveArtifactKeepMap_(keepMap);
    return { success: true, kept: !!kept };
  } catch (e) {
    return { error: e.toString() };
  }
}

function deleteArtifactFile(fileId) {
  try {
    var keepMap = getArtifactKeepMap_();
    delete keepMap[fileId];
    saveArtifactKeepMap_(keepMap);
    DriveApp.getFileById(fileId).setTrashed(true);
    return { success: true, id: fileId };
  } catch (e) {
    return { error: e.toString() };
  }
}

function extractArtifactDate_(name, meta, fallback) {
  // 1. Try meta.date (stored in file description)
  if (meta && meta.date) {
    var d = new Date(meta.date);
    if (!isNaN(d.getTime())) return d;
  }
  // 2. Extract YYYY-MM-DD from filename (works for both old and new naming formats)
  var match = String(name || '').match(/(\d{4}-\d{2}-\d{2})/);
  if (match) {
    var d2 = new Date(match[1]);
    if (!isNaN(d2.getTime())) return d2;
  }
  // 3. Fall back to file creation date
  return fallback || new Date();
}

function renameArtifactsToDateTitle() {
  var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var files = folder.getFiles();
  var renamed = 0;
  var skipped = 0;
  var errors = [];

  while (files.hasNext()) {
    try {
      var file = files.next();
      var meta = parseArtifactMeta_(file.getDescription());
      var displayTitle = getArtifactDisplayTitle_(file.getName(), meta);
      var effectiveDate = extractArtifactDate_(file.getName(), meta, file.getDateCreated());
      var dateLabel = Utilities.formatDate(effectiveDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var newName = dateLabel + ' -- ' + displayTitle;

      if (file.getName() === newName) {
        skipped++;
      } else {
        file.setName(newName);
        renamed++;
      }
    } catch (e) {
      errors.push(e.toString());
    }
  }

  Logger.log('Renamed: ' + renamed + ', Skipped (already correct): ' + skipped + ', Errors: ' + errors.length);
  if (errors.length) Logger.log('Errors: ' + errors.join('\n'));
  return { renamed: renamed, skipped: skipped, errors: errors };
}

function getArtifactKeepMap_() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(ARTIFACT_KEEP_PROPERTY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveArtifactKeepMap_(keepMap) {
  PropertiesService.getScriptProperties().setProperty(
    ARTIFACT_KEEP_PROPERTY,
    JSON.stringify(keepMap || {})
  );
}

function appendAuditLog(entry) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.AUDIT_TAB);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.AUDIT_TAB);
      sheet.appendRow([
        'date_processed',
        'email_subject',
        'email_date',
        'sender',
        'gmail_message_id',
        'articles_extracted',
        'article_ids',
        'notes'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    }

    sheet.appendRow([
      entry.date_processed || new Date().toISOString(),
      entry.email_subject || '',
      entry.email_date || '',
      entry.sender || '',
      entry.gmail_message_id || '',
      entry.articles_extracted || 0,
      entry.article_ids || '',
      entry.notes || ''
    ]);

    return { success: true };
  } catch (e) {
    return { error: e.toString() };
  }
}

function getAuditLog() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.AUDIT_TAB);
    if (!sheet) return { log: [] };

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { log: [] };

    var headers = data[0];
    var log = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });

    return { log: log };
  } catch (e) {
    return { error: e.toString() };
  }
}

function ensureSheetStructure() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var audit = ss.getSheetByName(CONFIG.AUDIT_TAB);

    if (!audit) {
      audit = ss.insertSheet(CONFIG.AUDIT_TAB);
      var headers = [
        'date_processed',
        'email_subject',
        'email_date',
        'sender',
        'gmail_message_id',
        'articles_extracted',
        'article_ids',
        'notes'
      ];
      audit.appendRow(headers);
      audit.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    return { success: true };
  } catch (e) {
    return { error: e.toString() };
  }
}

function debugCounts() {
  var bootstrap = getViewerBootstrap(1250, 50);
  if (bootstrap.error) {
    Logger.log('ERROR: ' + bootstrap.error);
    return;
  }
  Logger.log(JSON.stringify({
    loaded: bootstrap.articles.length,
    total: bootstrap.stats.totalArticles,
    unread: bootstrap.stats.unreadArticles,
    kept: bootstrap.stats.keptArticles,
    artifacts: bootstrap.artifactTotal
  }));
}

function getAllArticles_() {
  return fetchAllArticlesByQuery_('order=date_added.desc', '*');
}

function buildViewerStats_() {
  var unreadRows = fetchAllArticlesByQuery_(
    'kept=eq.false&status=not.in.(read,deleted)&order=date_added.desc',
    'id,category,source'
  );
  var categoryCounts = {};
  var sourceCounts = {};

  unreadRows.forEach(function(row) {
    var category = normalizeCategory_(row.category);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    if (row.source) {
      sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1;
    }
  });

  return {
    totalArticles: fetchCount_(''),
    unreadArticles: unreadRows.length,
    keptArticles: fetchCount_('kept=eq.true'),
    deletedArticles: fetchCount_('kept=eq.false&status=eq.deleted'),
    browseableArticles: unreadRows.length + fetchCount_('kept=eq.false&status=eq.read'),
    categoryCounts: categoryCounts,
    sourceCounts: sourceCounts
  };
}

function buildFallbackStats_(articles) {
  var stats = {
    totalArticles: articles.length,
    unreadArticles: 0,
    keptArticles: 0,
    deletedArticles: 0,
    browseableArticles: 0,
    categoryCounts: {},
    sourceCounts: {}
  };

  (articles || []).forEach(function(article) {
    if (article.status === 'deleted') {
      stats.deletedArticles += 1;
      return;
    }
    if (article.kept) {
      stats.keptArticles += 1;
      return;
    }

    stats.browseableArticles += 1;
    if (article.status !== 'read') {
      stats.unreadArticles += 1;
      var category = normalizeCategory_(article.category);
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
      if (article.source) {
        stats.sourceCounts[article.source] = (stats.sourceCounts[article.source] || 0) + 1;
      }
    }
  });

  return stats;
}

function fetchCount_(query) {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/articles?select=id&limit=1';
  if (query) url += '&' + query;

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: supabaseHeaders_({
      'Prefer': 'count=exact'
    }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code !== 200 && code !== 206) {
    throw new Error('Supabase count error ' + code + ': ' + response.getContentText());
  }

  var headers = response.getAllHeaders();
  var contentRange = headers['Content-Range'] || headers['content-range'] || '';
  var match = String(contentRange).match(/\/(\d+)$/);
  if (match) return parseInt(match[1], 10);

  var body = safeJsonParse_(response.getContentText(), 'count');
  return Array.isArray(body) ? body.length : 0;
}

function fetchAllArticlesByQuery_(query, select) {
  var offset = 0;
  var allRows = [];
  var keepGoing = true;

  while (keepGoing) {
    var batch = fetchBatch_(query, select, offset, SUPABASE_PAGE_SIZE);
    if (!batch.length) break;
    allRows = allRows.concat(batch);
    if (batch.length < SUPABASE_PAGE_SIZE) {
      keepGoing = false;
    } else {
      offset += SUPABASE_PAGE_SIZE;
    }
  }

  return allRows;
}

function fetchLimitedArticlesByQuery_(query, select, limit) {
  var offset = 0;
  var rows = [];

  while (rows.length < limit) {
    var batchSize = Math.min(SUPABASE_PAGE_SIZE, limit - rows.length);
    var batch = fetchBatch_(query, select, offset, batchSize);
    if (!batch.length) break;
    rows = rows.concat(batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return rows;
}

function fetchBatch_(query, select, offset, limit) {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/articles'
    + '?select=' + encodeURIComponent(select || '*')
    + '&limit=' + limit
    + '&offset=' + offset;
  if (query) url += '&' + query;

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: supabaseHeaders_(),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Supabase fetch error ' + code + ': ' + response.getContentText());
  }

  return safeJsonParse_(response.getContentText(), 'offset=' + offset).map(normalizeArticleForViewer_);
}

function supabaseRequest_(path, options) {
  options = options || {};
  var response;
  try {
    response = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + path, {
      method: options.method || 'get',
      headers: supabaseHeaders_(options.headers),
      payload: options.payload,
      muteHttpExceptions: true
    });
  } catch (e) {
    return { error: e.toString() };
  }

  var text = response.getContentText();
  var json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e2) {
      json = null;
    }
  }

  return {
    code: response.getResponseCode(),
    text: text,
    json: json,
    headers: response.getAllHeaders()
  };
}

function supabaseHeaders_(extra) {
  var headers = {
    'apikey': CONFIG.SUPABASE_KEY,
    'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY
  };
  extra = extra || {};
  for (var key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      headers[key] = extra[key];
    }
  }
  return headers;
}

function safeJsonParse_(text, label) {
  try {
    return JSON.parse(text || '[]');
  } catch (e) {
    Logger.log('JSON parse failed for ' + label + ' with length=' + String(text || '').length);
    Logger.log(String(text || '').substring(0, 500));
    throw new Error('JSON parse failed for ' + label + ': ' + e.toString());
  }
}

function normalizePositiveInt_(value, fallback) {
  var parsed = parseInt(value, 10);
  return parsed > 0 ? parsed : fallback;
}

function normalizeSourceLabel_(source, url) {
  var raw = String(source || '').trim();
  var haystack = (raw + ' ' + String(url || '')).toLowerCase();
  if (/reddit|(^|[\s(])r\/[a-z0-9_]+|reddit\.com\/r\/|redd\.it\//i.test(haystack)) return 'Reddit';
  return raw;
}

function normalizeArticleForViewer_(row) {
  if (!row) return row;
  row.source = normalizeSourceLabel_(row.source, row.url);
  return row;
}
function normalizeCategory_(raw) {
  if (!raw) return 'Tech & Trends';
  var clean = String(raw).replace(/^[^\w]+/, '').trim().toLowerCase();
  var map = {
    'top story': 'Top Story',
    'top stories': 'Top Story',
    'ai & llms': 'AI & LLMs',
    'ai': 'AI & LLMs',
    'finance': 'Finance',
    'resources': 'Resources',
    'framework': 'Resources',
    'insight': 'Resources',
    'learning': 'Resources',
    'tech & trends': 'Tech & Trends',
    'technology': 'Tech & Trends',
    'tech': 'Tech & Trends',
    'quick hit': 'Tech & Trends',
    'general': 'Tech & Trends',
    'news': 'Tech & Trends',
    'policy & society': 'Policy & Society',
    'policy': 'Policy & Society',
    'dev tools': 'Dev Tools',
    'research': 'Research',
    'strategy': 'Strategy',
    'watches': 'Watches',
    'watch': 'Watches',
    'youtube': 'YouTube',
    'video': 'YouTube',
    'reddit': 'Reddit',
    'email': 'Email',
    'duplicate': 'Duplicate',
    'duplicates': 'Duplicate',
    'artifacts': 'Artifacts'
  };
  return map[clean] || 'Tech & Trends';
}

function unique_(list) {
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var value = list[i];
    if (!value || seen[value]) continue;
    seen[value] = true;
    out.push(value);
  }
  return out;
}










