/**
 * ============================================================
 * REFINERY INGESTION APP
 * Version: 2.28
 * ============================================================
 * Phase 1: The Old Reader (TOR) RSS ingestion
 * Phase 3: Gmail two-tier ingestion
 *   Tier 1 - Known newsletter senders: save full HTML as artifacts
 *   Tier 2 - All inbox emails: save as article cards to Supabase
 * Functions: runDailyIngestion, ingestGmailTwoTier, rebuildEmailArtifacts,
 *            fixArtifactDatesFromGmail, saveAllEmailsAsArtifacts
 * ============================================================
 */

var CONFIG = {
  SUPABASE_URL:     "https://hwropcciwxzzukfcjlsr.supabase.co",
  SUPABASE_API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cm9wY2Npd3h6enVrZmNqbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTQwODQsImV4cCI6MjA4Nzk5MDA4NH0.ExKBBi2sL2RFrfglHghiXiUTWzOtMRTIB_wqT1q3eHg",
  SHEET_ID:         "1oJhKgjsp3HnNgyFdD3HON1mIHmlc00NCkDfo7R1QLss",

  TOR_BASE_URL:      "https://theoldreader.com/reader/api/0",
  TOR_AUTH_TOKEN:    "RY7S6rpupU2huEbLx3hx",
  TOR_BATCH_SIZE:    1000,
  TOR_MAX_ARTICLES:  500,
  TOR_EXECUTION_LIMIT_MS: 330000,

  GMAIL: {
    NEWSLETTER_SENDERS: [
      'thecode@mail.joinsuperhuman.ai',
      'newsletter@mail.chatai.com',
      'news@mail.ollama.ai',
      'hello@lonelyoctopus.com'
    ],
    SPONSOR_PATTERNS: [
      'beehiiv.com', 'magic.beehiiv', 'r2trck.com',
      'elitetrade', 'mongodb', 'workos', 'datadog', 'delve', 'attio',
      'unsubscribe', 'manage', 'preferences', 'privacy'
    ],
    PROCESS_ALL_INBOX: true,
    MAX_EMAILS_PER_RUN: 40,
    PROCESSED_LABEL: 'Refinery/Processed',
    SAVE_COMPLETE_NEWSLETTERS: true,
    SAVE_COMPLETE_EMAIL_ARTIFACTS: true,
    EXTRACT_NEWSLETTER_ARTICLES: false,
    COMPLETE_NEWSLETTER_FOLDER_ID: '1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz'
  },

  CATEGORY_BACKFILL: {
    LIMIT: 500,
    OFFSET: 0,
    SOURCE_FILTER: ''
  },

  DEDUPE_REVIEW: {
    WINDOW_DAYS: 7,
    MAX_CANDIDATES: 500,
    MIN_SCORE: 0.66,
    MIN_SHARED_TOKENS: 3
  }
};

var CATEGORY_SOURCE_MAP = {
  // Social / Video — matched against source name or article URL
  'reddit': 'Reddit',
  'r/': 'Reddit',
  'youtube': 'YouTube',
  'youtu.be': 'YouTube',

  // Watches — source names / domains
  'hodinkee': 'Watches',
  'wornandwound': 'Watches',
  'worn & wound': 'Watches',
  'ablogtowatch': 'Watches',
  'monochrome-watches': 'Watches',
  'fratello': 'Watches',
  'deployant': 'Watches',
  'watchesbysjx': 'Watches',
  'revolutionwatch': 'Watches',
  'timeandtidewatches': 'Watches',
  'watchtime': 'Watches',
  'bobswatches': 'Watches',
  'acollectedman': 'Watches',
  'watchboxstudios': 'Watches',

  // AI & LLMs — specific feed domains that are AI-only sources
  'aws.amazon.com/blogs/machine-learning': 'AI & LLMs',
  'blog.google/innovation-and-ai': 'AI & LLMs',
  'news.mit.edu/rss/topic/artificial-intelligence': 'AI & LLMs',
  'microsoft.com/en-us/research': 'AI & LLMs',
  'nvidiablog': 'AI & LLMs',
  'openai.com/news': 'AI & LLMs',
  'anthropic.com': 'AI & LLMs',
  'huggingface.co/blog': 'AI & LLMs',
  'deeplearning.ai': 'AI & LLMs',
  'simonwillison.net': 'AI & LLMs',
  'venturebeat.com': 'AI & LLMs',

  // News
  'bbci.co.uk/news': 'Top Story',
  'nytimes.com': 'Top Story',
  'reuters.com': 'Top Story',
  'foxnews.com': 'Top Story',
  'news.google.com': 'Top Story',
  'news.yahoo.com': 'Top Story',

  // Finance
  'cnbc.com': 'Finance',
  'foxbusiness.com': 'Finance',
  'marketwatch.com': 'Finance',
  'finance.yahoo.com': 'Finance',
  'seekingalpha.com': 'Finance',
  'fool.com': 'Finance'
};

var CATEGORY_OPTIONS = [
  'Top Story',
  'AI & LLMs',
  'Finance',
  'Resources',
  'Tech & Trends',
  'Policy & Society',
  'Dev Tools',
  'Research',
  'Strategy',
  'Watches',
  'YouTube',
  'Reddit',
  'Email',
  'Duplicate'
];

// ─── CONTENT NOISE FILTER ─────────────────────────────────────────────────────
// Articles whose titles match any of these patterns are skipped at ingestion.
// Keep patterns specific — err on the side of letting articles through.
// Add new patterns here as noise sources are identified.
var NOISE_TITLE_PATTERNS = [
  // Celebrity / entertainment gossip
  /\bweight loss\b|\bweight gain\b|\bshocking weight\b/i,
  /\bshocker\b|\bshocking secret\b|\bshocking reveal\b/i,
  /\bcelebrity gossip\b|\bceleb gossip\b/i,
  /\bplastic surgery\b|\bbefore and after\b/i,
  // AI image art spam (typically low-signal posts from art subreddits)
  /\bai.?generated art\b|\bai.?art showcase\b|\bai.?image gen\b/i,
  /\bmidjourney showcase\b|\bstable diffusion art\b/i,
  // Promotional / listicle noise
  /\byou won't believe\b|\bdoctors hate\b|\bone weird trick\b/i
];

function isNoisyArticle_(record) {
  var title = String(record && record.title || '');
  for (var i = 0; i < NOISE_TITLE_PATTERNS.length; i++) {
    if (NOISE_TITLE_PATTERNS[i].test(title)) {
      Logger.log('NOISE FILTER: skipping — ' + title);
      return true;
    }
  }
  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── FINANCE SOURCE ALLOWLIST FILTER ─────────────────────────────────────────
// High-volume dedicated finance feeds are filtered to portfolio/sector topics.
// General news finance (Reuters, top-level CNBC) is NOT in this list — those
// pass through unfiltered as Top Story / broad market coverage.
// Add tickers or companies to FINANCE_ALLOW_PATTERNS as the portfolio grows.
var FINANCE_FILTER_DOMAINS = [
  'seekingalpha.com',
  'fool.com',
  'finance.yahoo.com',
  'marketwatch.com',
  'foxbusiness.com'
  // cnbc.com Mad Money feed also uses cnbc.com — leave out to keep broad CNBC coverage
];

var FINANCE_ALLOW_PATTERNS = [
  // ── Sectors ──────────────────────────────────────────────────────────────
  /\bdividend/i,
  /\bcrypto\b|bitcoin|ethereum|\bbtc\b|\beth\b|blockchain/i,
  /\bpharma\b|pharmaceutical|biotech|drug approval|\bfda\b|clinical trial/i,
  /\bsemiconductor\b|chip maker|chip stock/i,
  // ── Macro / broad market (always keep) ───────────────────────────────────
  /\bfed\b|federal reserve|interest rate|inflation|\bgdp\b|recession/i,
  /\bearnings\b|\bipo\b|\bmarket\b|nasdaq|s&p 500|\bdow\b|wall street/i,
  /\brate cut\b|rate hike|bond yield|treasury/i,
  /\bmerger\b|acquisition|\bbuyout\b|\bbreaking\b/i,
  // ── Magnificent 7 ────────────────────────────────────────────────────────
  /\bapple\b|\baapl\b/i,
  /\bmicrosoft\b|\bmsft\b/i,
  /\bgoogle\b|\balphabet\b|\bgoogl\b|\bgoog\b/i,
  /\bamazon\b|\bamzn\b/i,
  /\bnvidia\b|\bnvda\b/i,
  /\btesla\b|\btsla\b/i,
  /\bmeta\b|\bfacebook\b/i,
  // ── Portfolio holdings ───────────────────────────────────────────────────
  /\bamd\b/i,
  /\bcoatue\b/i,
  /\boracle\b|\borcl\b/i,
  /\bcomcast\b|\bcmcsa\b/i,
  // ── AI (tech sector crossover) ───────────────────────────────────────────
  /\bartificial intelligence\b|\bai stock\b|\bai invest/i
];

function isFinanceSourceFiltered_(url) {
  var lower = String(url || '').toLowerCase();
  for (var i = 0; i < FINANCE_FILTER_DOMAINS.length; i++) {
    if (lower.indexOf(FINANCE_FILTER_DOMAINS[i]) !== -1) return true;
  }
  return false;
}

function passesFinanceAllowlist_(record) {
  var haystack = (String(record.title || '') + ' ' + String(record.summary || '')).toLowerCase();
  for (var i = 0; i < FINANCE_ALLOW_PATTERNS.length; i++) {
    if (FINANCE_ALLOW_PATTERNS[i].test(haystack)) return true;
  }
  return false;
}

// Returns true if the article should be skipped (finance source but off-topic).
function isFinanceFiltered_(record) {
  if (!isFinanceSourceFiltered_(record.url)) return false;
  if (passesFinanceAllowlist_(record)) return false;
  Logger.log('FINANCE FILTER: skipping off-portfolio — ' + record.title);
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

var SOURCE_CATEGORY_OVERRIDE_CACHE = null;
var SOURCE_CATEGORY_SHEET_NAME = 'rss_source_map';

// ─── INGESTION PERFORMANCE CACHES ─────────────────────────────────────────────
// Populated once at the start of each ingestion phase, cleared after.
// Eliminates per-article Supabase HTTP calls for dedup candidate fetching
// and audit trail writing — reduces ~1000 HTTP calls/run to ~200.
var INGESTION_DEDUP_CACHE_ = null;   // candidate rows for fuzzy dedup
var AUDIT_TRAIL_BATCH_     = [];     // queued audit trail records, flushed at phase end
// ─────────────────────────────────────────────────────────────────────────────

function runDailyIngestion() {
  // Runs both phases sequentially. If timing out, switch to separate triggers:
  //   runTORIngestionOnly()   — schedule every N hours
  //   runGmailIngestionOnly() — schedule offset by a few minutes
  var report = { timestamp: new Date().toISOString(), phase1_tor: {}, phase3_gmail: {} };
  Logger.log("=== REFINERY DAILY INGESTION START === " + report.timestamp);
  try {
    Logger.log("\n--- PHASE 1: The Old Reader ---");
    report.phase1_tor = ingestFromTheOldReader();
    Logger.log("\n--- PHASE 3: Gmail ---");
    report.phase3_gmail = ingestGmailTwoTier();
  } catch (e) {
    Logger.log("FATAL ERROR: " + e);
    report.error = e.toString();
  }
  Logger.log("\n=== COMPLETE ===\n" + JSON.stringify(report, null, 2));
  return report;
}

// Run TOR ingestion only — use as a standalone time trigger to give TOR its own
// 6-minute Apps Script window, independent of Gmail.
function runTORIngestionOnly() {
  var report = { timestamp: new Date().toISOString(), phase1_tor: {} };
  Logger.log("=== TOR INGESTION ONLY === " + report.timestamp);
  try {
    report.phase1_tor = ingestFromTheOldReader();
  } catch(e) {
    Logger.log("FATAL ERROR: " + e);
    report.error = e.toString();
  }
  Logger.log("\n=== COMPLETE ===\n" + JSON.stringify(report, null, 2));
  return report;
}

// Run Gmail ingestion only — use as a standalone time trigger, offset a few minutes
// after runTORIngestionOnly so they don't overlap.
function runGmailIngestionOnly() {
  var report = { timestamp: new Date().toISOString(), phase3_gmail: {} };
  Logger.log("=== GMAIL INGESTION ONLY === " + report.timestamp);
  try {
    report.phase3_gmail = ingestGmailTwoTier();
  } catch(e) {
    Logger.log("FATAL ERROR: " + e);
    report.error = e.toString();
  }
  Logger.log("\n=== COMPLETE ===\n" + JSON.stringify(report, null, 2));
  return report;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ PHASE 1: TOR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function runEmail(limit, offset) {
  return runEmailSummaryCleanup(limit, offset);
}

function ingestFromTheOldReader() {
  var stats = { unreadCount:0, articlesProcessed:0, articlesInserted:0, duplicatesSkipped:0, errors:0 };
  var startedAt = Date.now();
  var headers = {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY};
  try {
    stats.unreadCount = getTORUnreadCount();
    if (stats.unreadCount === 0) { Logger.log("TOR: no unread"); return stats; }
    Logger.log("TOR: " + stats.unreadCount + " unread");

    var articles = getTORUnreadArticles();
    if (!articles.length) { Logger.log("TOR: contents returned nothing"); return stats; }
    Logger.log("TOR: processing " + articles.length + " articles");

    // Warm the dedup candidate cache ONCE before the loop.
    // Without this, every article makes its own 500-row Supabase fetch (~100 extra calls).
    warmDedupCache_(headers);

    var ingestedIds = [];
    for (var i = 0; i < articles.length; i++) {
      if (Date.now() - startedAt > (CONFIG.TOR_EXECUTION_LIMIT_MS || 330000)) {
        Logger.log("TOR: stopping early to avoid Apps Script timeout at article " + i);
        break;
      }

      stats.articlesProcessed++;
      try {
        var record = mapTORArticleToSchema(articles[i]);
        if (isNoisyArticle_(record)) {
          stats.duplicatesSkipped++;
          ingestedIds.push(articles[i].id); // mark read in TOR
          continue;
        }
        if (isFinanceFiltered_(record)) {
          stats.duplicatesSkipped++;
          ingestedIds.push(articles[i].id); // mark read in TOR
          continue;
        }
        var duplicateResult = reviewDuplicateRecord_(record);
        if (duplicateResult.error) {
          stats.errors++;
          if (duplicateResult.error === 'temporary') {
            Logger.log("TOR: stopping early due to temporary Supabase issue");
            break;
          }
          continue;
        }
        if (duplicateResult.duplicate) {
          // Exact duplicate — skip insert entirely, just mark as read in TOR
          stats.duplicatesSkipped++;
          ingestedIds.push(articles[i].id);
          Logger.log("TOR: exact duplicate skipped — " + (record.title || record.url));
          continue;
        }
        if (duplicateResult.possibleDuplicate) {
          record = markRecordAsDuplicateReview_(record, duplicateResult);
        }

        var insertResult = insertToSupabase(record);
        if (insertResult.ok) {
          stats.articlesInserted++;
          logToAuditTrail(record.source, record.url, record.title, duplicateResult.possibleDuplicate ? 'possible_duplicate' : 'ingested', null);
          ingestedIds.push(articles[i].id);
        } else {
          stats.errors++;
        }
      } catch(e) {
        Logger.log("TOR article error [" + i + "]: " + e);
        stats.errors++;
      }
    }

    if (ingestedIds.length > 0) markTORArticlesAsRead(ingestedIds);
  } catch(e) {
    Logger.log("ERROR ingestFromTheOldReader: " + e);
    stats.errors++;
  } finally {
    // Clear cache and flush audit trail regardless of success/failure
    INGESTION_DEDUP_CACHE_ = null;
    flushAuditTrailBatch_();
  }
  return stats;
}

function getTORUnreadCount() {
  try {
    var resp = UrlFetchApp.fetch(CONFIG.TOR_BASE_URL + "/unread-count?output=json", {
      headers: {'Authorization': 'GoogleLogin auth=' + CONFIG.TOR_AUTH_TOKEN},
      muteHttpExceptions: true
    });
    var data = JSON.parse(resp.getContentText());
    var unreadCounts = data.unreadcounts || [];
    for (var i = 0; i < unreadCounts.length; i++) {
      if (unreadCounts[i].id === 'user/-/state/com.google/reading-list') {
        return unreadCounts[i].count || 0;
      }
    }
    return 0;
  } catch(e) { Logger.log("ERROR getTORUnreadCount: "+e); return 0; }
}

function getTORUnreadArticles() {
  try {
    var maxArticles = CONFIG.TOR_MAX_ARTICLES > 0 ? CONFIG.TOR_MAX_ARTICLES : Number.MAX_SAFE_INTEGER;
    var batchSize = CONFIG.TOR_BATCH_SIZE || 1000;
    var allIds = [];
    var continuation = null;

    while (allIds.length < maxArticles) {
      var remaining = maxArticles - allIds.length;
      var requestSize = Math.min(batchSize, remaining);
      var url = CONFIG.TOR_BASE_URL
        + "/stream/items/ids?output=json&s=user/-/state/com.google/reading-list"
        + "&xt=user/-/state/com.google/read"
        + "&n=" + requestSize;

      if (continuation) url += "&c=" + encodeURIComponent(continuation);

      var idsResp = UrlFetchApp.fetch(url, {
        headers: {'Authorization': 'GoogleLogin auth=' + CONFIG.TOR_AUTH_TOKEN},
        muteHttpExceptions: true
      });
      var idsData = JSON.parse(idsResp.getContentText());
      var itemRefs = idsData.itemRefs || [];

      if (!itemRefs.length) break;

      itemRefs.forEach(function(ref) { allIds.push(ref.id); });
      Logger.log("TOR: fetched " + itemRefs.length + " IDs, total " + allIds.length);

      if (!idsData.continuation || itemRefs.length < requestSize) break;
      continuation = idsData.continuation;
    }

    if (!allIds.length) { Logger.log("TOR: no item IDs"); return []; }

    var allItems = [];
    for (var i = 0; i < allIds.length; i += batchSize) {
      var idBatch = allIds.slice(i, i + batchSize);
      var payload = idBatch.map(function(id){ return "i=" + encodeURIComponent(id); }).join("&");
      var contResp = UrlFetchApp.fetch(CONFIG.TOR_BASE_URL + "/stream/items/contents?output=json", {
        method: 'post',
        headers: {'Authorization': 'GoogleLogin auth=' + CONFIG.TOR_AUTH_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded'},
        payload: payload,
        muteHttpExceptions: true
      });
      var items = JSON.parse(contResp.getContentText()).items || [];
      allItems = allItems.concat(items);
      Logger.log("TOR: fetched " + items.length + " article bodies, total " + allItems.length);
    }

    return allItems;
  } catch(e) { Logger.log("ERROR getTORUnreadArticles: "+e); return []; }
}

function mapTORArticleToSchema(article) {
  var pubDate = new Date(article.published * 1000);
  var url = (article.canonical && article.canonical[0]) ? article.canonical[0].href
          : (article.alternate  && article.alternate[0])  ? article.alternate[0].href : '';

  var rawSummary = '';
  if (typeof article.summary === 'string') {
    rawSummary = article.summary;
  } else if (article.summary && typeof article.summary.content === 'string') {
    rawSummary = article.summary.content;
  }

  var cleanSummary = stripHtml(rawSummary);
  var source = article.origin ? article.origin.title : 'Unknown';
  url = cleanUrl(url);
  var enriched = enrichArticleFromUrl(url, article.title || 'Untitled');
  var finalTitle = sanitizeText(enriched.title || article.title || 'Untitled', 250);
  var finalSummary = finalizeSummaryForRecord_(enriched.summary || cleanSummary, '', url, article.title || 'Untitled');
  var finalCategory = normalizeCategory('', source, finalTitle, finalSummary, url);
  finalSummary = finalizeSummaryForRecord_(finalSummary, finalCategory, url, finalTitle);

  return {
    source:     source,
    issue:      Utilities.formatDate(pubDate, 'UTC', 'MMM d yyyy'),
    category:   finalCategory,
    status:     'unread',
    title:      finalTitle,
    summary:    prependImageMarker(finalSummary, enriched.imageUrl, finalCategory).substring(0, 2000),
    signal:     deriveSignal(finalTitle, finalSummary || cleanSummary),
    url:        url,
    archived:   false,
    kept:       false,
    date_added: pubDate.toISOString()
  };
}

// FIX: build "i=id1&i=id2&...&a=..." as a simple string Ã¢â‚¬â€ v2.1 was malforming multi-value arrays
function markTORArticlesAsRead(ids) {
  try {
    var payload = ids.map(function(id){ return "i=" + encodeURIComponent(id); }).join("&")
                + "&a=" + encodeURIComponent("user/-/state/com.google/read");
    UrlFetchApp.fetch(CONFIG.TOR_BASE_URL + "/edit-tag", {
      method: 'post',
      headers: {'Authorization': 'GoogleLogin auth=' + CONFIG.TOR_AUTH_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded'},
      payload: payload,
      muteHttpExceptions: true
    });
    Logger.log("TOR: marked " + ids.length + " as read");
  } catch(e) { Logger.log("ERROR markTORArticlesAsRead: "+e); }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ PHASE 3: GMAIL TWO-TIER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ingestGmailTwoTier() {
  var stats = {
    tier1_newsletters: {emailsProcessed:0, articlesExtracted:0, articlesInserted:0, duplicatesSkipped:0, completeIssuesSaved:0},
    tier2_inbox:       {emailsProcessed:0, emailCardsCreated:0, duplicatesSkipped:0}
  };
  var headers = {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY};
  try {
    // Warm dedup cache once for the entire Gmail phase
    warmDedupCache_(headers);
    var label = getOrCreateLabel(CONFIG.GMAIL.PROCESSED_LABEL);
    stats.tier1_newsletters = processNewsletterTier(label);
    if (CONFIG.GMAIL.PROCESS_ALL_INBOX) stats.tier2_inbox = processInboxTier(label);
  } catch(e) { Logger.log("ERROR ingestGmailTwoTier: "+e); stats.error = e.toString(); }
  finally {
    INGESTION_DEDUP_CACHE_ = null;
    flushAuditTrailBatch_();
  }
  return stats;
}

function processNewsletterTier(label) {
  var stats = {emailsProcessed:0, articlesExtracted:0, articlesInserted:0, duplicatesSkipped:0, completeIssuesSaved:0};
  var query = CONFIG.GMAIL.NEWSLETTER_SENDERS.map(function(s){ return 'from:'+s; }).join(' OR ') + ' is:unread';
  var threads = GmailApp.search(query, 0, CONFIG.GMAIL.MAX_EMAILS_PER_RUN);
  Logger.log("Tier 1: " + threads.length + " threads");

  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(msg) {
      if (!msg.isUnread()) return;
      var result = processNewsletterEmail(msg);
      stats.emailsProcessed++;
      stats.articlesExtracted  += result.articlesExtracted;
      stats.articlesInserted   += result.articlesInserted;
      stats.duplicatesSkipped  += result.duplicatesSkipped;
      if (result.canMarkRead) {
        msg.markRead();
        thread.addLabel(label);
      }
    });
  });
  return stats;
}

function processNewsletterEmail(msg) {
  var result = {articlesExtracted:0, articlesInserted:0, duplicatesSkipped:0, completeIssuesSaved:0, errors:0, canMarkRead:true};
  var from    = msg.getFrom();
  var subject = msg.getSubject();
  var date    = msg.getDate();
  var plainBody = msg.getPlainBody();
  var htmlBody  = msg.getBody();
  var body      = htmlBody || plainBody;
  var source    = extractSourceName(from);
  var issue     = Utilities.formatDate(date, 'UTC', 'MMM d yyyy');

  Logger.log("Newsletter: [" + source + "] " + subject);

  if (CONFIG.GMAIL.SAVE_COMPLETE_NEWSLETTERS) {
    var artifactResult = saveCompleteNewsletterArtifact_(msg, source, subject, date, htmlBody, plainBody);
    if (artifactResult.ok) {
      result.completeIssuesSaved = 1;
      Logger.log("  -> complete issue saved");
    } else {
      Logger.log("  -> complete issue save failed: " + artifactResult.error);
      result.errors++;
      result.canMarkRead = false;
    }
  }

  if (CONFIG.GMAIL.EXTRACT_NEWSLETTER_ARTICLES === false) {
    Logger.log("  -> article extraction skipped (full issue mode)");
    return result;
  }

  var articles = extractArticlesFromBody(body, source, issue, date, subject, plainBody);
  result.articlesExtracted = articles.length;
  Logger.log("  -> " + articles.length + " articles extracted");

  if (articles.length === 0) {
    var canonUrl = extractCanonicalUrl(body) || buildGmailUrl(msg.getId());
    articles = [{
      source: source, issue: issue,
      category: detectCategory(subject, ''), status: 'unread',
      title: subject, summary: buildEmailSummary(subject, plainBody, canonUrl),
      signal: '', url: canonUrl,
      archived: false, kept: false, date_added: date.toISOString()
    }];
    Logger.log("  -> fallback: 1 record");
  }

  articles.forEach(function(record) {
    var duplicateResult = reviewDuplicateRecord_(record);
    if (duplicateResult.error) {
      result.errors++;
      result.canMarkRead = false;
      return;
    }
    if (duplicateResult.duplicate || duplicateResult.possibleDuplicate) {
      record = markRecordAsDuplicateReview_(record, duplicateResult);
    }
    var insertResult = insertToSupabase(record);
    if (insertResult.ok) {
      result.articlesInserted++;
      logToAuditTrail(record.source, record.url, record.title, duplicateResult.duplicate ? 'exact_duplicate_review' : duplicateResult.possibleDuplicate ? 'possible_duplicate' : 'ingested', null);
    } else {
      result.errors++;
      result.canMarkRead = false;
    }
  });
  return result;
}

// Supports multi-format newsletter extraction, including The Code HTML emails.
function extractArticlesFromBody(body, source, issue, date, fallbackTitle, plainBody) {
  var articles = [];
  var seenUrls = {};
  var html = String(body || '');
  var text = String(plainBody || stripHtml(body || ''));

  function contextTitleForUrl(sourceText, index, fallbackUrl) {
    var before = sourceText.substring(Math.max(0, index - 500), index);
    var lines = before.split(/\r?\n/).map(function(line) {
      return line.replace(/<[^>]+>/g, '').replace(/^[#>*\-\s]+/, '').trim();
    }).filter(Boolean);
    for (var i = lines.length - 1; i >= 0; i--) {
      var line = decodeHtmlEntities(lines[i]).replace(/\s+/g, ' ').trim();
      if (!line) continue;
      if (/read online|view online|unsubscribe|manage preferences|privacy|sponsor|advertis/i.test(line)) continue;
      if (/^https?:\/\//i.test(line)) continue;
      if (line.length >= 6 && line.length <= 180) return line;
    }
    return fallbackTitle || fallbackUrl;
  }

  function addArticle(title, url, contextIndex, contextSource) {
    url = cleanUrl(url);
    if (!url || isSponsorUrl(url) || seenUrls[url]) return;
    if (/unsubscribe|preferences|privacy|mailto:|view-source|accounts\.google|theoldreader\.com\/reader/i.test(url)) return;
    seenUrls[url] = true;

    var effectiveTitle = (title || '').trim();
    if (!effectiveTitle || /^https?:\/\//i.test(effectiveTitle) || effectiveTitle.length < 4) {
      effectiveTitle = contextTitleForUrl(contextSource || text, contextIndex || 0, url);
    }

    var enrichment = enrichArticleFromUrl(url, effectiveTitle || fallbackTitle);
    var finalTitle = enrichment.title || effectiveTitle || fallbackTitle || url;
    var finalSummary = finalizeSummaryForRecord_(enrichment.summary || extractFirstSentences(text, 5), '', url, finalTitle);
    var finalCategory = normalizeCategory('', source, finalTitle, finalSummary, url);
    finalSummary = finalizeSummaryForRecord_(finalSummary, finalCategory, url, finalTitle);

    articles.push({
      source: source,
      issue: issue,
      category: finalCategory,
      status: 'unread',
      title:      finalTitle,
      summary: prependImageMarker(finalSummary, enrichment.imageUrl, finalCategory).substring(0, 2000),
      signal: deriveSignal(finalTitle, finalSummary),
      url: url,
      archived: false,
      kept: false,
      date_added: date.toISOString()
    });
  }

  var m;
  var anchorPattern = /<a\b[^>]*href=["'](https?:\/\/[^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = anchorPattern.exec(html)) !== null) {
    var href = decodeHtmlEntities(m[1]);
    var anchorText = decodeHtmlEntities(stripHtml(m[2])).replace(/\s+/g, ' ').trim();
    addArticle(anchorText, href, m.index, html);
  }

  var markdownPattern = /\[(?:\*\*)?([^\]]+?)(?:\*\*)?\]\((https?:\/\/[^\)]+)\)/g;
  while ((m = markdownPattern.exec(text)) !== null) addArticle(m[1].trim(), m[2], m.index, text);

  var labeledPattern = /^[A-Za-z ][A-Za-z &]{0,30}:\s+([^\(]*?)\s*\((https?:\/\/[^\)]+)\)\s*$/gm;
  while ((m = labeledPattern.exec(text)) !== null) addArticle(m[1].trim(), m[2], m.index, text);

  var lineUrlPattern = /https?:\/\/[^\s<>\)]+/g;
  while ((m = lineUrlPattern.exec(text)) !== null) addArticle('', m[0], m.index, text);

  return articles;
}

function isSponsorUrl(url) {
  var lower = url.toLowerCase();
  return CONFIG.GMAIL.SPONSOR_PATTERNS.some(function(p){ return lower.indexOf(p) !== -1; });
}

function cleanUrl(url) {
  if (!url) return '';
  url = url.trim().replace(/[.,;>\]\)]+$/, '');
  try {
    url = url.replace(/^https?:\/\/m\.youtube\.com\//i, 'https://www.youtube.com/');
    url = url.replace(/^https?:\/\/youtu\.be\/([^?&]+)/i, 'https://www.youtube.com/watch?v=$1');
    url = url.replace(/^https?:\/\/www\.youtube\.com\/shorts\/([^?&/]+)/i, 'https://www.youtube.com/watch?v=$1');
    url = url.replace(/^https?:\/\/(?:old|np|new|m)\.reddit\.com\//i, 'https://www.reddit.com/');
    url = url.replace(/#.*$/, '');
    var tracking = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_name','ref','_bhiiv','bhcl_id','si','feature','fbclid','gclid','context','rdt','share_id'];
    var parts = url.split('?');
    var cleaned = parts[0];
    if (parts.length >= 2) {
      var params = parts[1].split('&').filter(function(p){ return tracking.indexOf(p.split('=')[0]) === -1; });
      cleaned = params.length ? parts[0] + '?' + params.join('&') : parts[0];
    }
    cleaned = cleaned.replace(/\/+$/, '');
    if (/youtube\.com\/watch/i.test(cleaned)) {
      var m = cleaned.match(/[?&]v=([^&]+)/);
      return m ? 'https://www.youtube.com/watch?v=' + m[1] : cleaned;
    }
    if (isRedditUrl_(cleaned)) {
      var postMatch = cleaned.match(/^(https?:\/\/www\.reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/[^\/?#]+)/i);
      if (postMatch) return postMatch[1];
    }
    return cleaned;
  } catch(e) { return url; }
}

function extractCanonicalUrl(body) {
  var patterns = [
    /view (?:this )?post (?:on the web )?at (https?:\/\/[^\s]+)/i,
    /view online[:\s]+(https?:\/\/[^\s]+)/i,
    /read (?:it )?online[:\s]+(https?:\/\/[^\s]+)/i
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = body.match(patterns[i]);
    if (m) return cleanUrl(m[1]);
  }
  return null;
}

function saveCompleteNewsletterArtifact_(msg, source, subject, date, htmlBody, plainBody) {
  return saveCompleteEmailArtifact_(msg, source, subject, date, htmlBody, plainBody, 'newsletter');
}

function saveCompleteInboxEmailArtifact_(msg, source, subject, date, htmlBody, plainBody) {
  return saveCompleteEmailArtifact_(msg, source, subject, date, htmlBody, plainBody, 'email');
}

function saveCompleteEmailArtifact_(msg, source, subject, date, htmlBody, plainBody, kind, replaceExisting) {
  try {
    var folderId = CONFIG.GMAIL.COMPLETE_NEWSLETTER_FOLDER_ID;
    if (!folderId) return { ok:false, error:'missing newsletter artifact folder id' };

    var folder = DriveApp.getFolderById(folderId);
    var artifactKind = String(kind || 'email').toLowerCase() === 'newsletter' ? 'newsletter' : 'email';
    var baseTitle = buildArtifactTitle_(artifactKind, source, subject, date, msg.getId());
    if (replaceExisting) removeExistingArtifactFiles_(folder, baseTitle);

    var existing = folder.getFiles();
    while (existing.hasNext()) {
      var existingFile = existing.next();
      if (stripArtifactExtension_(existingFile.getName()) === baseTitle && !existingFile.isTrashed()) {
        return { ok:true, existing:true, fileId: existingFile.getId(), fileUrl: existingFile.getUrl() };
      }
    }

    var html = buildCompleteEmailArtifactHtml_(msg, source, subject, date, htmlBody, plainBody, artifactKind);
    var file = Drive.Files.insert({
      title: baseTitle + '.html',
      mimeType: 'text/html',
      description: buildArtifactDescription_(artifactKind, msg.getId(), source, subject, date),
      parents: [{ id: folderId }]
    }, Utilities.newBlob(html, 'text/html', baseTitle + '.html'));
    return { ok:true, fileId:file.id, fileUrl:'https://drive.google.com/file/d/' + file.id + '/view' };
  } catch (e) {
    return { ok:false, error:e.toString() };
  }
}

function buildArtifactTitle_(kind, source, subject, date, messageId) {
  var safeSource = sanitizeFileName_(source || 'Email');
  var safeSubject = sanitizeFileName_(subject || 'Issue');
  var datePart = Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd');
  return datePart + ' -- ' + safeSource + ' - ' + safeSubject + ' [' + messageId + ']';
}

function removeExistingArtifactFiles_(folder, baseTitle) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (stripArtifactExtension_(file.getName()) === baseTitle) file.setTrashed(true);
  }
}

function stripArtifactExtension_(name) {
  return String(name || '').replace(/\.(html?|pdf|txt)$/i, '');
}

function buildArtifactDescription_(kind, messageId, source, subject, date) {
  return 'REFINERY_ARTIFACT ' + JSON.stringify({
    kind: String(kind || 'email').toLowerCase(),
    messageId: String(messageId || ''),
    source: String(source || ''),
    subject: String(subject || ''),
    date: date instanceof Date ? date.toISOString() : String(date || '')
  });
}

function parseArtifactDescription_(text) {
  var raw = String(text || '');
  if (raw.indexOf('REFINERY_ARTIFACT ') !== 0) return null;
  try {
    return JSON.parse(raw.substring('REFINERY_ARTIFACT '.length));
  } catch (e) {
    return null;
  }
}

function buildCompleteEmailArtifactHtml_(msg, source, subject, date, htmlBody, plainBody, kind) {
  var artifactKind = String(kind || 'email').toLowerCase() === 'newsletter' ? 'newsletter' : 'email';
  var bodyHtml = buildEmailArtifactBodyHtml_(htmlBody, plainBody);
  var kindLabel = artifactKind === 'newsletter' ? 'Newsletter' : 'Email';
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<base target="_blank">',
    '<title>' + escapeHtml_(subject || kindLabel) + '</title>',
    '<style>',
    ':root{color-scheme:light;}',
    'html,body{margin:0;padding:0;background:#f6f2ea;color:#1f1b16;}',
    'body{font-family:Georgia,serif;line-height:1.65;}',
    '.shell{max-width:980px;margin:0 auto;padding:28px 20px 48px;}',
    '.header{margin-bottom:22px;padding:0 0 16px;border-bottom:1px solid #ddd4c6;}',
    '.eyebrow{font:600 11px/1.4 Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#b5551c;margin-bottom:10px;}',
    '.title{font-size:34px;line-height:1.1;margin:0 0 8px;word-break:break-word;}',
    '.meta{font:500 13px/1.5 Arial,sans-serif;color:#665d52;display:flex;gap:16px;flex-wrap:wrap;}',
    '.links{margin-top:12px;font:500 13px/1.5 Arial,sans-serif;display:flex;gap:14px;flex-wrap:wrap;}',
    '.links a{color:#b5551c;text-decoration:none;}',
    '.content{background:#fff;border:1px solid #e3dbcf;border-radius:10px;padding:20px;overflow:auto;}',
    '.content img{max-width:100%;height:auto;}',
    '.content table{max-width:100% !important;height:auto !important;}',
    '.content a{color:#b5551c;word-break:break-word;}',
    '.content pre{white-space:pre-wrap;font-family:Arial,sans-serif;}',
    '@media (max-width: 720px){.shell{padding:16px 12px 28px;}.title{font-size:28px;}.content{padding:14px;}}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="shell">',
    '<header class="header">',
    '<div class="eyebrow">' + kindLabel + '</div>',
    '<h1 class="title">' + escapeHtml_(subject || kindLabel) + '</h1>',
    '<div class="meta"><span>' + escapeHtml_(source || kindLabel) + '</span><span>' + escapeHtml_(Utilities.formatDate(date, 'UTC', 'MMM d yyyy')) + '</span></div>',
    '<div class="links"><a href="' + escapeHtml_(buildGmailUrl(msg.getId())) + '">Open in Gmail</a></div>',
    '</header>',
    '<main class="content">' + bodyHtml + '</main>',
    '</div>',
    '</body>',
    '</html>'
  ].join('');
}

function buildEmailArtifactBodyHtml_(htmlBody, plainBody) {
  var html = String(htmlBody || '').trim();
  if (html) {
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<base[^>]*>/gi, '');
    html = html.replace(/\s(on[a-z]+)=("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    html = html.replace(/\shref=("|')javascript:[\s\S]*?\1/gi, ' href="#"');
    return html;
  }
  return '<pre>' + escapeHtml_(plainBody || '') + '</pre>';
}

function sanitizeFileName_(value) {
  return String(value || '')
    .replace(/[\\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 120);
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Ã¢â€â‚¬Ã¢â€â‚¬ TIER 2: INBOX EMAIL CARDS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function processInboxTier(label) {
  var stats = {emailsProcessed:0, emailCardsCreated:0, duplicatesSkipped:0};
  var excludes = CONFIG.GMAIL.NEWSLETTER_SENDERS.map(function(s){ return '-from:'+s; }).join(' ');
  var threads  = GmailApp.search('in:inbox is:unread ' + excludes, 0, CONFIG.GMAIL.MAX_EMAILS_PER_RUN);
  Logger.log("Tier 2: " + threads.length + " threads");

  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(msg) {
      if (!msg.isUnread()) return;
      var msgId   = msg.getId();
      var subject = msg.getSubject();
      var from    = msg.getFrom();

      if (isDuplicateBySourceId(msgId) || isTransactionalNoise(subject, from)) {
        msg.markRead(); thread.addLabel(label);
        stats.duplicatesSkipped++;
        return;
      }

      var date     = msg.getDate();
      var body     = msg.getPlainBody();
      var htmlBody = msg.getBody();
      var record = {
        source: extractSourceName(from),
        issue:  Utilities.formatDate(date, 'UTC', 'MMM d yyyy'),
        category: 'Email', status: 'unread',
        title:   subject.substring(0, 250),
        summary: buildEmailSummary(subject, body, buildGmailUrl(msgId)),
        signal:  '',
        url:     buildGmailUrl(msgId),
        archived: false, kept: false,
        date_added: date.toISOString()
      };

      if (isNoisyArticle_(record)) {
        msg.markRead(); thread.addLabel(label);
        stats.duplicatesSkipped++;
        return;
      }
      var duplicateResult = reviewDuplicateRecord_(record);
      if (duplicateResult.error) {
        Logger.log('Inbox duplicate review failed: ' + duplicateResult.error);
        return;
      }
      if (duplicateResult.duplicate) {
        // Exact duplicate — skip insert, mark as read
        msg.markRead(); thread.addLabel(label);
        stats.duplicatesSkipped++;
        Logger.log('Inbox: exact duplicate skipped — ' + subject);
        return;
      }
      if (duplicateResult.possibleDuplicate) {
        record = markRecordAsDuplicateReview_(record, duplicateResult);
      }

      var insertResult = insertToSupabase(record);
      if (insertResult.ok) {
        var artifactResult = { ok:true };
        if (CONFIG.GMAIL.SAVE_COMPLETE_EMAIL_ARTIFACTS) {
          artifactResult = saveCompleteInboxEmailArtifact_(msg, record.source, subject, date, htmlBody, body);
          if (!artifactResult.ok) {
            Logger.log('Inbox artifact save failed: ' + artifactResult.error);
          }
        }

        logToAuditTrail(record.source, buildGmailUrl(msgId), record.title, duplicateResult.possibleDuplicate ? 'possible_duplicate' : 'ingested', msgId);
        stats.emailsProcessed++;
        stats.emailCardsCreated++;
        if (artifactResult.ok) {
          msg.markRead();
          thread.addLabel(label);
        }
      }
    });
  });
  return stats;
}

function buildGmailUrl(id) { return 'https://mail.google.com/mail/u/0/#all/' + id; }

function isTransactionalNoise(subject, from) {
  var noiseSub  = ['verify your email','confirm your','security alert','password reset',
                   'invoice','your receipt','order confirmation','sign-in attempt','trial ends'];
  var noiseFrom = ['no-reply@accounts.google.com','no-reply@email.claude.com',
                   'welcome@supabase.com','noreply@github.com','marketing.emails@cloudhq.net'];
  var s = subject.toLowerCase(), f = from.toLowerCase();
  return noiseSub.some(function(n){ return s.indexOf(n) !== -1; }) ||
         noiseFrom.some(function(n){ return f.indexOf(n) !== -1; });
}

// Ã¢â€â‚¬Ã¢â€â‚¬ SUPABASE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function insertToSupabase(record) {
  try {
    record = sanitizeRecord(record);
    var resp = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/articles', {
      method: 'post', contentType: 'application/json',
      headers: {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY, 'Prefer': 'return=minimal'},
      payload: JSON.stringify(record), muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 201) {
      Logger.log("Supabase error (" + resp.getResponseCode() + "): " + resp.getContentText().substring(0,200));
      Logger.log("Failed record: " + JSON.stringify({
        source: record && record.source,
        title: record && record.title,
        url: record && record.url,
        category: record && record.category
      }).substring(0,500));
      return { ok:false, transient:isTransientSupabaseError_(resp.getContentText()) };
    }
    return { ok:true };
  } catch(e) {
    Logger.log("ERROR insertToSupabase: "+e);
    Logger.log("Failed record: " + JSON.stringify({
      source: record && record.source,
      title: record && record.title,
      url: record && record.url,
      category: record && record.category
    }).substring(0,500));
    return { ok:false, transient:isTransientSupabaseError_(e) };
  }
}

function sanitizeRecord(record) {
  return {
    source: sanitizeText(canonicalSourceName_(record.source, record.url), 200),
    issue: sanitizeText(record.issue, 50),
    category: sanitizeText(normalizeCategory(record.category, record.source, record.title, record.summary, record.url), 100),
    status: sanitizeText(record.status || 'unread', 20),
    title: sanitizeText(record.title, 250),
    summary: sanitizeSummaryText(record.summary, 4000),
    signal: sanitizeText(record.signal, 500),
    url: cleanUrl(record.url || ''),
    archived: !!record.archived,
    kept: !!record.kept,
    date_added: record.date_added || new Date().toISOString()
  };
}

function sanitizeText(value, maxLen) {
  var text = String(value == null ? '' : value)
    .replace(/\u0000/g, ' ')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return maxLen ? text.substring(0, maxLen) : text;
}

function sanitizeSummaryText(value, maxLen) {
  var markerMatch = String(value == null ? '' : value).match(/^\[\[image_url=https?:\/\/[^\]]+\]\]\s*/i);
  var marker = markerMatch ? markerMatch[0] : '';
  var body = String(value == null ? '' : value).replace(/^\[\[image_url=https?:\/\/[^\]]+\]\]\s*/i, '');
  var lines = body.replace(/\r\n?/g, '\n').split('\n').map(function(line) {
    return sanitizeText(line, 500);
  }).filter(function(line) {
    return !!line;
  });

  var clean = lines.join('\n').trim();
  if (!clean) clean = sanitizeText(body, maxLen || 4000);
  if ((maxLen || 0) && clean.length > maxLen) clean = clean.substring(0, maxLen).trim();
  return marker + clean;
}

function canonicalSourceName_(source, url) {
  var raw = String(source || '').trim();
  var haystack = (raw + ' ' + String(url || '')).toLowerCase();
  if (/reddit|(^|[\s(])r\/[a-z0-9_]+|reddit\.com\/r\/|redd\.it\//i.test(haystack)) return 'Reddit';
  return raw;
}

function normalizeSourceForDedupe(source, url) {
  return String(canonicalSourceName_(source, url) || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeTitleForDedupe(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalCategoryName_(value) {
  var key = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  var map = {
    'news': 'Top Story',
    'top story': 'Top Story',
    'top stories': 'Top Story',
    'watch': 'Watches',
    'watches': 'Watches',
    'video': 'YouTube',
    'youtube': 'YouTube',
    'policy society': 'Policy & Society',
    'policy & society': 'Policy & Society',
    'ai llms': 'AI & LLMs',
    'ai & llms': 'AI & LLMs',
    'tech trends': 'Tech & Trends',
    'tech & trends': 'Tech & Trends',
    'dev tools': 'Dev Tools',
    'duplicate': 'Duplicate',
    'duplicates': 'Duplicate'
  };

  if (map[key]) return map[key];
  return String(value || '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isKnownCategory_(value) {
  return [
    'Top Story',
    'AI & LLMs',
    'Finance',
    'Resources',
    'Tech & Trends',
    'Policy & Society',
    'Dev Tools',
    'Research',
    'Strategy',
    'Watches',
    'YouTube',
    'Reddit',
    'Email',
    'Duplicate'
  ].indexOf(value) !== -1;
}

function categoryFromSource_(source, url) {
  var haystack = (String(source || '') + ' ' + String(url || '')).toLowerCase();
  for (var key in CATEGORY_SOURCE_MAP) {
    if (CATEGORY_SOURCE_MAP.hasOwnProperty(key) && haystack.indexOf(key) !== -1) {
      return CATEGORY_SOURCE_MAP[key];
    }
  }
  return '';
}

function categoryFromUrl_(url) {
  var lower = String(url || '').toLowerCase();
  if (!lower) return '';
  if (/reddit\.com\/r\/|redd\.it\//i.test(lower)) return 'Reddit';
  if (/youtube\.com|youtu\.be/i.test(lower)) return 'YouTube';
  if (/hodinkee|wornandwound|ablogtowatch|monochrome-watches|fratello/i.test(lower)) return 'Watches';
  return '';
}

function normalizeCategory(category, source, title, summary, url) {
  // Duplicate is set intentionally by markRecordAsDuplicateReview_ — never overwrite it.
  // Any source/content match that fires later would silently un-flag the duplicate.
  if (canonicalCategoryName_(category) === 'Duplicate') return 'Duplicate';

  var override = getSourceCategoryOverrideFor_(source, url);
  if (override) return override;

  var mapped = categoryFromSource_(source, url);
  if (mapped) return mapped;

  mapped = categoryFromUrl_(url);
  if (mapped) return mapped;

  var canonical = canonicalCategoryName_(category);
  if (isKnownCategory_(canonical)) return canonical;

  return detectCategory(title, summary, source, url);
}

function syncTorSourceCategorySheet() {
  var subscriptions = getTORSubscriptions_();
  var contextMap = getArticleContextBySource_();
  var sheet = getOrCreateSourceCategorySheet_();
  var existingRows = getExistingSourceCategoryRows_(sheet);
  var nowIso = new Date().toISOString();

  subscriptions.sort(function(a, b) {
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  var values = [getSourceCategorySheetHeaders_()];
  subscriptions.forEach(function(subscription) {
    var key = normalizeSourceKey_(subscription.title);
    var existing = existingRows[key] || {};
    var context = contextMap[key] || { articleCount: 0, sampleTitles: [] };
    var suggested = suggestCategoryForTorSource_(
      subscription.title,
      subscription.feedUrl,
      subscription.siteUrl,
      context.sampleTitles
    );
    var assigned = existing.assignedCategory || suggested || '';
    values.push([
      subscription.title || '',
      assigned,
      suggested || '',
      context.articleCount || 0,
      (context.sampleTitles || []).join(' | '),
      subscription.feedUrl || '',
      subscription.siteUrl || '',
      nowIso
    ]);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  applyCategoryDropdownValidation_(sheet, values.length - 1);
  sheet.setFrozenRows(1);
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(1, 1, values.length, values[0].length).createFilter();
  sheet.autoResizeColumns(1, values[0].length);
  SOURCE_CATEGORY_OVERRIDE_CACHE = null;

  Logger.log('TOR SOURCE CATEGORY SHEET: ' + JSON.stringify({
    rows: Math.max(0, values.length - 1),
    sheet: SOURCE_CATEGORY_SHEET_NAME
  }, null, 2));

  return {
    rows: Math.max(0, values.length - 1),
    sheetName: SOURCE_CATEGORY_SHEET_NAME
  };
}

function previewSourceCategoryBackfill(limit, offset, sourceFilter) {
  return backfillCategories_(true, sourceFilter || '', limit, offset);
}

function applySourceCategoryBackfill(limit, offset, sourceFilter) {
  return backfillCategories_(false, sourceFilter || '', limit, offset);
}

function getSourceCategoryOverrideFor_(source, url) {
  var overrides = getSourceCategoryOverrides_();
  var sourceKey = normalizeSourceKey_(source);
  if (sourceKey && overrides[sourceKey]) return overrides[sourceKey];

  var hostKey = normalizeSourceHostKey_(url);
  if (hostKey && overrides[hostKey]) return overrides[hostKey];
  return '';
}

function getSourceCategoryOverrides_() {
  if (SOURCE_CATEGORY_OVERRIDE_CACHE) return SOURCE_CATEGORY_OVERRIDE_CACHE;

  var overrides = {};
  try {
    var sheet = getOrCreateSourceCategorySheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      SOURCE_CATEGORY_OVERRIDE_CACHE = overrides;
      return overrides;
    }

    var rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    rows.forEach(function(row) {
      var sourceTitle = normalizeSourceKey_(row[0]);
      var assignedCategory = canonicalCategoryName_(row[1] || '');
      var feedUrl = normalizeSourceHostKey_(row[5]);
      if (sourceTitle && assignedCategory) overrides[sourceTitle] = assignedCategory;
      if (feedUrl && assignedCategory) overrides[feedUrl] = assignedCategory;
    });
  } catch (e) {
    Logger.log('SOURCE CATEGORY OVERRIDE READ ERROR: ' + e);
  }

  SOURCE_CATEGORY_OVERRIDE_CACHE = overrides;
  return overrides;
}

function getOrCreateSourceCategorySheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(SOURCE_CATEGORY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SOURCE_CATEGORY_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, getSourceCategorySheetHeaders_().length).setValues([getSourceCategorySheetHeaders_()]);
  }
  return sheet;
}

function getSourceCategorySheetHeaders_() {
  return [
    'source_title',
    'assigned_category',
    'suggested_category',
    'article_count',
    'sample_titles',
    'feed_url',
    'site_url',
    'last_synced'
  ];
}

function getExistingSourceCategoryRows_(sheet) {
  var existing = {};
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return existing;

  var rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  rows.forEach(function(row) {
    var key = normalizeSourceKey_(row[0]);
    if (!key) return;
    existing[key] = {
      assignedCategory: canonicalCategoryName_(row[1] || ''),
      suggestedCategory: canonicalCategoryName_(row[2] || '')
    };
  });
  return existing;
}

function applyCategoryDropdownValidation_(sheet, rowCount) {
  if (rowCount <= 0) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CATEGORY_OPTIONS, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, 2, rowCount, 1).setDataValidation(rule);
}

function getTORSubscriptions_() {
  var response = UrlFetchApp.fetch(CONFIG.TOR_BASE_URL + '/subscription/list?output=json', {
    headers: { 'Authorization': 'GoogleLogin auth=' + CONFIG.TOR_AUTH_TOKEN },
    muteHttpExceptions: true
  });
  var payload = JSON.parse(response.getContentText() || '{}');
  var subscriptions = payload.subscriptions || [];

  return subscriptions.map(function(subscription) {
    return {
      title: sanitizeText(subscription && subscription.title || '', 200),
      feedUrl: parseTorFeedUrl_(subscription),
      siteUrl: cleanUrl(subscription && subscription.htmlUrl || '')
    };
  }).filter(function(subscription) {
    return !!subscription.title;
  });
}

function listKagiTorSubscriptions() {
  var subscriptions = getTORSubscriptions_().filter(function(subscription) {
    var haystack = [
      subscription && subscription.title,
      subscription && subscription.feedUrl,
      subscription && subscription.siteUrl
    ].join(' ').toLowerCase();
    return /(^|\b)kagi\b|kite\.kagi\.com|kagi\.com\/api\/v1\/smallweb/.test(haystack);
  }).sort(function(a, b) {
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  Logger.log('KAGI TOR SUBSCRIPTIONS: ' + JSON.stringify({
    count: subscriptions.length,
    subscriptions: subscriptions
  }, null, 2));
  return subscriptions;
}

function parseTorFeedUrl_(subscription) {
  var id = String(subscription && subscription.id || '');
  if (/^feed\//i.test(id)) return cleanUrl(id.substring(5));
  return cleanUrl(subscription && (subscription.url || subscription.feedUrl) || '');
}

function getArticleContextBySource_() {
  var headers = {
    'apikey': CONFIG.SUPABASE_API_KEY,
    'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY
  };
  var offset = 0;
  var limit = 1000;
  var context = {};

  while (true) {
    var response = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL
        + '/rest/v1/articles?select=source,title,category&order=date_added.desc'
        + '&limit=' + encodeURIComponent(limit)
        + '&offset=' + encodeURIComponent(offset),
      { headers: headers, muteHttpExceptions: true }
    );
    var rows = JSON.parse(response.getContentText() || '[]') || [];
    if (!rows.length) break;

    rows.forEach(function(row) {
      var sourceKey = normalizeSourceKey_(row && row.source || '');
      if (!sourceKey) return;
      if (canonicalCategoryName_(row && row.category || '') === 'Email') return;
      if (!context[sourceKey]) {
        context[sourceKey] = { articleCount: 0, sampleTitles: [] };
      }
      context[sourceKey].articleCount += 1;
      var title = sanitizeText(row && row.title || '', 160);
      if (!title) return;
      if (context[sourceKey].sampleTitles.indexOf(title) !== -1) return;
      if (context[sourceKey].sampleTitles.length < 3) {
        context[sourceKey].sampleTitles.push(title);
      }
    });

    if (rows.length < limit) break;
    offset += limit;
  }

  return context;
}

function suggestCategoryForTorSource_(sourceTitle, feedUrl, siteUrl, sampleTitles) {
  var url = feedUrl || siteUrl || '';
  var sourceText = String(sourceTitle || '');
  var sampleText = String((sampleTitles || []).join(' '));
  var mapped = categoryFromSource_(sourceText, url);
  if (mapped) return mapped;

  mapped = categoryFromUrl_(url);
  if (mapped) return mapped;

  return detectCategory(sampleText, '', sourceText, url);
}

function normalizeSourceKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSourceHostKey_(url) {
  var clean = cleanUrl(url || '');
  if (!clean) return '';
  var match = clean.match(/^https?:\/\/([^\/?#]+)/i);
  return match ? normalizeSourceKey_(match[1]) : '';
}

function reviewDuplicateRecord_(record) {
  if (!record) return { duplicate:false, possibleDuplicate:false };
  try {
    var headers = {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY};
    var url = cleanUrl(record.url || '');
    var resp;

    if (url) {
      resp = UrlFetchApp.fetch(
        CONFIG.SUPABASE_URL + '/rest/v1/articles?url=eq.' + encodeURIComponent(url)
        + '&select=id,source,title,url,summary,category,date_added,status,kept,archived&limit=1',
        {headers: headers, muteHttpExceptions: true}
      );
      var exactUrlRows = JSON.parse(resp.getContentText()) || [];
      if (exactUrlRows.length > 0) {
        return {
          duplicate: true,
          possibleDuplicate: false,
          primary: exactUrlRows[0],
          reason: 'exact URL match',
          score: 1
        };
      }
    }

    var source = sanitizeText(normalizeSourceForDedupe(record.source, url), 200);
    var rawTitle = sanitizeText(record.title, 250);
    var title = sanitizeText(normalizeTitleForDedupe(record.title), 250);
    if (!source || !title || !rawTitle) return { duplicate:false, possibleDuplicate:false };

    // Use ilike (case-insensitive) so "I've Built..." matches "I'VE BUILT..." or
    // "i ve built..." (apostrophes stripped by some RSS feeds). Escape % and _ first
    // so they don't act as wildcards.
    var ilikeTitle = rawTitle.replace(/%/g, '\\%').replace(/_/g, '\\_');
    resp = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL + '/rest/v1/articles?title=ilike.' + encodeURIComponent(ilikeTitle)
      + '&select=id,source,title,url,summary,category,date_added,status,kept,archived&limit=25',
      {headers: headers, muteHttpExceptions: true}
    );
    var exactTitleRows = JSON.parse(resp.getContentText()) || [];
    var exactTitleMatch = findExactDuplicateCandidate_(record, exactTitleRows);
    if (exactTitleMatch) {
      return {
        duplicate: true,
        possibleDuplicate: false,
        primary: exactTitleMatch,
        reason: 'exact title match (case-insensitive)',
        score: 0.98
      };
    }

    if (source === 'reddit') {
      resp = UrlFetchApp.fetch(
        CONFIG.SUPABASE_URL + '/rest/v1/articles?select=id,source,title,url,summary,category,date_added,status,kept,archived&order=date_added.desc&limit=250',
        {headers: headers, muteHttpExceptions: true}
      );
      var redditRows = JSON.parse(resp.getContentText()) || [];
      var redditMatch = findExactDuplicateCandidate_(record, redditRows);
      if (redditMatch) {
        return {
          duplicate: true,
          possibleDuplicate: false,
          primary: redditMatch,
          reason: 'exact Reddit repost match',
          score: 0.98
        };
      }
    }

    var possible = findPossibleDuplicateCandidate_(record, headers);
    if (possible) {
      return {
        duplicate: false,
        possibleDuplicate: true,
        primary: possible.primary,
        reason: possible.reason,
        score: possible.score
      };
    }

    return { duplicate:false, possibleDuplicate:false };
  } catch(e) {
    Logger.log("ERROR reviewDuplicateRecord_: " + e);
    return { duplicate:false, possibleDuplicate:false, error:isTransientSupabaseError_(e) ? 'temporary' : 'failed' };
  }
}

function findPossibleDuplicateCandidate_(record, headers) {
  var rows;
  if (INGESTION_DEDUP_CACHE_ !== null) {
    // Use pre-fetched cache — no HTTP call needed
    rows = INGESTION_DEDUP_CACHE_;
  } else {
    // Fallback: fetch on demand (used when called outside an ingestion run)
    var windowDays = Math.max(1, parseInt(CONFIG.DEDUPE_REVIEW.WINDOW_DAYS, 10) || 7);
    var sinceIso = new Date(Date.now() - (windowDays * 24 * 60 * 60 * 1000)).toISOString();
    var maxCandidates = Math.max(25, parseInt(CONFIG.DEDUPE_REVIEW.MAX_CANDIDATES, 10) || 500);
    var response = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL
        + '/rest/v1/articles?select=id,source,title,url,summary,category,date_added,status,kept,archived'
        + '&kept=eq.false&status=neq.deleted'
        + '&date_added=gte.' + encodeURIComponent(sinceIso)
        + '&order=date_added.asc'
        + '&limit=' + encodeURIComponent(maxCandidates),
      { headers: headers, muteHttpExceptions: true }
    );
    rows = JSON.parse(response.getContentText()) || [];
  }
  if (!rows.length) return null;

  var matches = rows.map(function(candidate) {
    if (!candidate || !candidate.id) return null;
    if (canonicalCategoryName_(candidate.category || '') === 'Duplicate') return null;
    return scorePossibleDuplicateMatch_(record, candidate);
  }).filter(function(match) {
    return !!match;
  });

  if (!matches.length) return null;

  matches.sort(function(a, b) {
    var dateA = new Date(a.primary.date_added || 0).getTime();
    var dateB = new Date(b.primary.date_added || 0).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return b.score - a.score;
  });

  return matches[0];
}

function scorePossibleDuplicateMatch_(record, candidate) {
  var incomingUrl = cleanUrl(record && record.url || '');
  var candidateUrl = cleanUrl(candidate && candidate.url || '');
  if (incomingUrl && candidateUrl && incomingUrl === candidateUrl) return null;

  var incomingTitle = normalizeTitleForDedupe(record && record.title || '');
  var candidateTitle = normalizeTitleForDedupe(candidate && candidate.title || '');
  if (!incomingTitle || !candidateTitle) return null;
  if (incomingTitle === candidateTitle) return null;

  var incomingTitleTokens = dedupeTokens_(record && record.title || '', true);
  var candidateTitleTokens = dedupeTokens_(candidate && candidate.title || '', true);
  var incomingTopicTokens = dedupeTokens_((record && record.title || '') + ' ' + cleanSummaryForDedupe_(record && record.summary || ''), false);
  var candidateTopicTokens = dedupeTokens_((candidate && candidate.title || '') + ' ' + cleanSummaryForDedupe_(candidate && candidate.summary || ''), false);

  var titleStats = tokenOverlapStats_(incomingTitleTokens, candidateTitleTokens);
  var topicStats = tokenOverlapStats_(incomingTopicTokens, candidateTopicTokens);
  var containment = Math.max(titleStats.leftCoverage, titleStats.rightCoverage);
  var minShared = Math.max(2, parseInt(CONFIG.DEDUPE_REVIEW.MIN_SHARED_TOKENS, 10) || 3);

  // Simhash: compute 64-bit fingerprints for combined title+summary text
  var incomingFullText = (record && record.title || '') + ' ' + cleanSummaryForDedupe_(record && record.summary || '');
  var candidateFullText = (candidate && candidate.title || '') + ' ' + cleanSummaryForDedupe_(candidate && candidate.summary || '');
  var incomingSH  = simhashText_(incomingFullText);
  var candidateSH = simhashText_(candidateFullText);
  var hdist = hammingDistance_(incomingSH, candidateSH);

  var score = Math.max(
    titleStats.jaccard * 0.85 + topicStats.jaccard * 0.15,
    containment * 0.75 + Math.min(topicStats.shared.length, 6) * 0.04
  );

  // Simhash boost: near-identical fingerprint → raise score regardless of token path
  if (hdist <= 4) {
    score = Math.max(score, 0.90);
  } else if (hdist <= SIMHASH_THRESHOLD) {
    score = Math.max(score, 0.80);
  }

  var reason = '';
  if (hdist <= 4) {
    reason = 'simhash near-identical (hamming=' + hdist + ')';
  } else if (hdist <= SIMHASH_THRESHOLD) {
    reason = 'simhash strong match (hamming=' + hdist + ')';
  } else if (titleStats.shared.length >= minShared && containment >= 0.7) {
    reason = 'same event with overlapping titles';
    score = Math.max(score, 0.78);
  } else if (titleStats.shared.length >= minShared && topicStats.shared.length >= (minShared + 1)) {
    reason = 'same topic with strong keyword overlap';
    score = Math.max(score, 0.71);
  } else if (topicStats.shared.length >= (minShared + 2) && containment >= 0.45) {
    reason = 'same company/topic among active unread articles';
    score = Math.max(score, 0.68);
  } else {
    return null;
  }

  if (score < (CONFIG.DEDUPE_REVIEW.MIN_SCORE || 0.66)) return null;

  return {
    score: score,
    reason: reason,
    primary: candidate
  };
}

function dedupeTokens_(text, titleOnly) {
  var stopwords = {
    the:true, a:true, an:true, and:true, or:true, but:true, for:true, from:true, with:true,
    into:true, onto:true, over:true, under:true, after:true, before:true, about:true, this:true,
    that:true, these:true, those:true, your:true, their:true, his:true, her:true, our:true,
    why:true, how:true, what:true, when:true, where:true, says:true, say:true, said:true,
    just:true, new:true, now:true, more:true, most:true, less:true, than:true, then:true,
    into:true, amid:true, amid:true, amids:true, report:true, reports:true, according:true,
    review:true, video:true, podcast:true, newsletter:true, email:true, watch:true, watches:true
  };
  return String(text || '')
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(function(token) {
      if (!token) return false;
      if (/^\d+$/.test(token)) return false;
      if (token.length < (titleOnly ? 4 : 3)) return false;
      return !stopwords[token];
    });
}

function cleanSummaryForDedupe_(summary) {
  return String(summary || '')
    .replace(/^\[\[image_url=https?:\/\/[^\]]+\]\]\s*/i, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

function tokenOverlapStats_(left, right) {
  var leftMap = {};
  var rightMap = {};
  (left || []).forEach(function(token) { leftMap[token] = true; });
  (right || []).forEach(function(token) { rightMap[token] = true; });

  var shared = [];
  Object.keys(leftMap).forEach(function(token) {
    if (rightMap[token]) shared.push(token);
  });

  var unionSize = Object.keys(leftMap).length;
  Object.keys(rightMap).forEach(function(token) {
    if (!leftMap[token]) unionSize++;
  });

  return {
    shared: shared,
    jaccard: unionSize ? (shared.length / unionSize) : 0,
    leftCoverage: Object.keys(leftMap).length ? (shared.length / Object.keys(leftMap).length) : 0,
    rightCoverage: Object.keys(rightMap).length ? (shared.length / Object.keys(rightMap).length) : 0
  };
}

// ─── SIMHASH NEAR-DUPLICATE FINGERPRINTING ───────────────────────────────────
// Simhash produces a 64-bit fingerprint per text block. Two documents are
// near-duplicates when their fingerprints differ by <= SIMHASH_THRESHOLD bits
// (Hamming distance). Works alongside token-overlap scoring to catch paraphrased
// duplicates that share structure but not identical wording.
//
// Threshold guide (out of 64 bits):
//   <= 4  : extremely similar / likely same article, different whitespace
//   <= 8  : strong near-duplicate
//   <= 12 : moderate overlap (use with care — may false-positive on short texts)

var SIMHASH_THRESHOLD = 8;

function djb2Hash_(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = (((hash << 5) + hash) + str.charCodeAt(i)) | 0; // keep 32-bit signed
  }
  return hash;
}

function computeSimhash_(text) {
  var tokens = dedupeTokens_(text, false);
  if (!tokens || !tokens.length) return { hi: 0, lo: 0 };
  var v = [];
  var i;
  for (i = 0; i < 64; i++) v[i] = 0;
  for (var t = 0; t < tokens.length; t++) {
    var token = tokens[t];
    var h1 = djb2Hash_(token);
    var h2 = djb2Hash_(token + '\x01');
    for (var bit = 0; bit < 32; bit++) {
      v[bit]      += ((h1 >>> bit) & 1) ? 1 : -1;
      v[bit + 32] += ((h2 >>> bit) & 1) ? 1 : -1;
    }
  }
  var lo = 0, hi = 0;
  for (i = 0; i < 32; i++) {
    if (v[i]      > 0) lo |= (1 << i);
    if (v[i + 32] > 0) hi |= (1 << i);
  }
  return { hi: hi >>> 0, lo: lo >>> 0 };
}

function popcount32_(n) {
  n = n >>> 0;
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  n = (n + (n >>> 4)) & 0x0f0f0f0f;
  return ((n * 0x01010101) >>> 24);
}

function hammingDistance_(a, b) {
  return popcount32_((a.hi ^ b.hi) >>> 0) + popcount32_((a.lo ^ b.lo) >>> 0);
}

function simhashText_(text) {
  return computeSimhash_(String(text || ''));
}
// ─────────────────────────────────────────────────────────────────────────────

function markRecordAsDuplicateReview_(record, duplicateResult) {
  var primary = duplicateResult && duplicateResult.primary || {};
  var originalDate = formatDuplicateReviewDate_(primary.date_added);
  var exact = !!(duplicateResult && duplicateResult.duplicate);
  var reviewLines = [
    exact ? 'Exact duplicate review.' : 'Possible duplicate review.',
    'Original article: ' + sanitizeText(primary.title || '', 250),
    'Original source: ' + sanitizeText(primary.source || '', 200),
    'Original date: ' + originalDate,
    'Original status: original = true',
    'This article status: original = false',
    'Match reason: ' + sanitizeText(duplicateResult.reason || (exact ? 'exact duplicate' : 'possible duplicate'), 200)
  ];

  if (primary.url) reviewLines.push('Original URL: ' + cleanUrl(primary.url));

  record.category = 'Duplicate';
  record.signal = '';
  record.summary = reviewLines.join('\n') + '\n\n' + String(record.summary || '');
  return record;
}

function formatDuplicateReviewDate_(value) {
  var date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) return 'Unknown';
  return Utilities.formatDate(date, 'America/New_York', 'MMM d, yyyy');
}

function findExactDuplicateCandidate_(record, candidates) {
  if (!candidates || !candidates.length) return null;

  var incomingUrl = cleanUrl(record && record.url || '');
  var incomingSource = normalizeSourceForDedupe(record && record.source, incomingUrl);
  var incomingTitle = normalizeTitleForDedupe(record && record.title || '');
  if (!incomingTitle) return null;

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var candidateUrl = cleanUrl(candidate && candidate.url || '');
    if (incomingUrl && candidateUrl && incomingUrl === candidateUrl) return candidate;
    if (normalizeTitleForDedupe(candidate && candidate.title || '') !== incomingTitle) continue;
    if (normalizeSourceForDedupe(candidate && candidate.source, candidateUrl) === incomingSource) return candidate;
  }

  return null;
}

function hasDuplicateCandidate_(record, candidates) {
  if (!candidates || !candidates.length) return false;

  var incomingUrl = cleanUrl(record && record.url || '');
  var incomingSource = normalizeSourceForDedupe(record && record.source, incomingUrl);
  var incomingTitle = normalizeTitleForDedupe(record && record.title || '');

  if (!incomingSource || !incomingTitle) return false;

  return candidates.some(function(candidate) {
    var candidateUrl = cleanUrl(candidate && candidate.url || '');
    if (incomingUrl && candidateUrl && incomingUrl === candidateUrl) return true;

    if (normalizeTitleForDedupe(candidate && candidate.title || '') !== incomingTitle) return false;
    return normalizeSourceForDedupe(candidate && candidate.source, candidateUrl) === incomingSource;
  });
}

function isDuplicateBySourceId(sourceId) {
  if (!sourceId) return false;
  try {
    var resp = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/audit_trail?source_id=eq.' + encodeURIComponent(sourceId) + '&select=id&limit=1',
      {headers: {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY}, muteHttpExceptions: true});
    return JSON.parse(resp.getContentText()).length > 0;
  } catch(e) { Logger.log("ERROR isDuplicateBySourceId: "+e); return false; }
}

function isTransientSupabaseError_(errorLike) {
  var text = String(errorLike || '');
  return /Address unavailable|timed out|Exception:\s*Service invoked too many times|Exception:\s*Request failed/i.test(text);
}

// Warm the dedup candidate cache once per ingestion phase.
// Without this, every article makes its own Supabase fetch for 500 candidates.
function warmDedupCache_(headers) {
  var windowDays = Math.max(1, parseInt(CONFIG.DEDUPE_REVIEW.WINDOW_DAYS, 10) || 7);
  var sinceIso = new Date(Date.now() - (windowDays * 24 * 60 * 60 * 1000)).toISOString();
  var maxCandidates = Math.max(25, parseInt(CONFIG.DEDUPE_REVIEW.MAX_CANDIDATES, 10) || 500);
  try {
    var response = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL
        + '/rest/v1/articles?select=id,source,title,url,summary,category,date_added,status,kept,archived'
        + '&kept=eq.false&status=neq.deleted'
        + '&date_added=gte.' + encodeURIComponent(sinceIso)
        + '&order=date_added.asc'
        + '&limit=' + encodeURIComponent(maxCandidates),
      { headers: headers, muteHttpExceptions: true }
    );
    INGESTION_DEDUP_CACHE_ = JSON.parse(response.getContentText()) || [];
    Logger.log('DEDUP CACHE: warmed with ' + INGESTION_DEDUP_CACHE_.length + ' candidates');
  } catch(e) {
    Logger.log('DEDUP CACHE: warm failed, will query per-article — ' + e);
    INGESTION_DEDUP_CACHE_ = null;
  }
}

// Queue an audit trail record. Flushed in batch at end of each ingestion phase.
// Replaces one HTTP call per article with one batch call per phase.
function logToAuditTrail(source, url, title, status, sourceId) {
  var record = {source:canonicalSourceName_(source, url), url:url, title:title, status:status, date_published:new Date().toISOString()};
  if (sourceId) record.source_id = sourceId;
  AUDIT_TRAIL_BATCH_.push(record);
  // Safety flush if batch grows large (shouldn't happen in normal runs)
  if (AUDIT_TRAIL_BATCH_.length >= 75) flushAuditTrailBatch_();
}

function flushAuditTrailBatch_() {
  if (!AUDIT_TRAIL_BATCH_.length) return;
  var batch = AUDIT_TRAIL_BATCH_.slice();
  AUDIT_TRAIL_BATCH_ = [];
  try {
    UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/audit_trail', {
      method: 'post', contentType: 'application/json',
      headers: {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY, 'Prefer': 'return=minimal'},
      payload: JSON.stringify(batch), muteHttpExceptions: true
    });
    Logger.log('AUDIT TRAIL: flushed ' + batch.length + ' records');
  } catch(e) { Logger.log("ERROR flushAuditTrailBatch_: " + e); }
}

function detectCategory(title, summary, source, url) {
  var t = (String(source || '') + ' ' + String(title || '') + ' ' + String(summary || '') + ' ' + String(url || '')).toLowerCase();
  if (t.match(/\bpossible duplicate review\b|\bduplicate review\b/)) return 'Duplicate';
  if (t.match(/reddit|r\//)) return 'Reddit';
  if (t.match(/youtube|youtu\.be/)) return 'YouTube';
  if (t.match(/watchmaking|horology|timepiece|timepieces|patek|rolex|omega|seiko|chronograph|hodinkee|worn.?wound|ablogtowatch|fratello|monochrome|audemars|breitling|cartier|jaeger|iwc|hublot/)) return 'Watches';
  // AI & LLMs checked BEFORE Finance/Research/Policy so "AI funding" and "AI regulation"
  // land here rather than being pulled into a secondary category.
  if (t.match(/\bai\b|llm|gpt|claude|gemini|chatgpt|openai|anthropic|deepseek|qwen|mistral|ollama|copilot|diffusion|transformer|multimodal|foundation model/)) return 'AI & LLMs';
  // Dev Tools: intentionally narrow — only clear developer tooling content.
  // "open source", "repo", "framework", "library" removed — they appear in mainstream
  // tech news constantly and cause false positives from HN/Verge/TechCrunch.
  if (t.match(/\bgithub\.com\b|npm install|pip install|\bvscode\b|\bvs code\b|\bcursor ide\b|\bxcode\b|cli tool|command.?line tool|developer tool|dev tool|package manager|\bsdk release\b|\bapi client\b/)) return 'Dev Tools';
  if (t.match(/arxiv|preprint|benchmark|dataset|peer.?review/)) return 'Research';
  if (t.match(/tutorial|how.?to|cheat sheet|step.?by.?step/)) return 'Resources';
  if (t.match(/policy|regulation|law|congress|pentagon|dod|government|senate|compliance/)) return 'Policy & Society';
  if (t.match(/stock|market|earnings|valuation|ipo|funding|unicorn|venture|finance|trading|macro|fed|treasury|dealbook/)) return 'Finance';
  if (t.match(/research|paper|study|learn|course/)) return 'Research';
  if (t.match(/strategy|playbook|mental model|roadmap|positioning/)) return 'Strategy';
  // Top Story: major news events only — "launches" and "announces" removed because
  // every product announcement matches them, drowning real top stories in Tech & Trends.
  if (t.match(/breaking|acquisition|merger|crisis|war|election|top story|headline/)) return 'Top Story';
  if (t.match(/email|newsletter/)) return 'Email';
  return 'Tech & Trends';
}

function deriveSignal(title, summary) {
  return '';
}

function finalizeSummaryForRecord_(summary, category, url, title) {
  var clean = sanitizeText(summary || '', 4000);
  if (!clean) clean = sanitizeText(title || '', 250);
  if (String(category || '') === 'Reddit' || isRedditUrl_(url)) {
    clean = cleanRedditSummary_(clean, title);
    return normalizeSummaryLength_(clean, title, 5, 850);
  } else if (String(category || '') === 'YouTube' || /youtube\.com|youtu\.be/i.test(String(url || ''))) {
    // YouTube: keep the full cleaned description — it's the closest thing to a transcript summary.
    // Allow up to 20 sentences / 3500 chars so the reading pane shows the full description.
    clean = cleanYoutubeSummary_(clean, title);
    return normalizeSummaryLength_(clean, title, 20, 3500);
  }
  return normalizeSummaryLength_(clean, title, 5, 850);
}

function normalizeSummaryLength_(summary, title, maxSentences, maxLen) {
  var clean = sanitizeText(summary || '', 3000);
  if (!clean) clean = sanitizeText(title || '', 250);
  clean = clean.replace(/\s+/g, ' ').trim();

  var sentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [];
  sentences = sentences.map(function(sentence) {
    return String(sentence || '').trim();
  }).filter(function(sentence) {
    return !!sentence;
  });

  if (sentences.length > maxSentences) {
    clean = sentences.slice(0, maxSentences).join(' ');
  }

  if (clean.length > maxLen) {
    var clipped = clean.substring(0, maxLen).replace(/\s+\S*$/, '').trim();
    clean = (clipped || clean.substring(0, maxLen).trim()) + '...';
  }

  return clean;
}

function cleanYoutubeSummary_(summary, title) {
  var clean = String(summary || '').replace(/^\[\[image_url=https?:\/\/[^\]]+\]\]\s*/i, '');
  if (!clean) return sanitizeText(title || '', 250);

  clean = clean.replace(/\r\n?/g, '\n');
  clean = clean.replace(/(^|\s)#[A-Za-z0-9_]+/g, ' ');
  clean = clean.replace(/\btry\s+[A-Za-z0-9]+\s*:\s*.*?(?=\b(ever wonder|in this video|today|this video|the discussion|megyn kelly|panel warns)\b)/i, ' ');
  clean = clean.replace(/\bbecome an ai master\b.*?(?=\b(ever wonder|in this video|today|this video)\b)/i, ' ');
  clean = clean.replace(/\bget a custom promo video\b.*?(?=\b(ever wonder|in this video|today|this video)\b)/i, ' ');
  clean = clean.replace(/\bTimestamps?:[\s\S]*$/i, ' ');
  clean = clean.replace(/(?:^|\n)\d{1,2}:\d{2}(?::\d{2})?\s*[-–—].*$/gim, ' ');
  clean = clean.replace(/https?:\/\/\S+/gi, ' ');
  clean = clean.replace(/@[_A-Za-z0-9-]+/g, ' ');
  clean = clean.replace(/\s[-–—]{3,}\s*/g, '. ');
  clean = clean.replace(/\n+/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();

  var sentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [clean];
  var kept = [];
  var seen = {};

  sentences.forEach(function(sentence) {
    var current = sanitizeText(sentence, 500);
    if (!current) return;
    if (isYoutubeBoilerplateSentence_(current)) return;
    var key = current.toLowerCase()
      .replace(/^in this video[:,]?\s*/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (!key || seen[key]) return;
    seen[key] = true;
    kept.push(current);
  });

  clean = kept.join(' ').replace(/\s+/g, ' ').trim();
  if (!clean) clean = sanitizeText(title || '', 250);
  return clean;
}

function isYoutubeBoilerplateSentence_(sentence) {
  var text = String(sentence || '').toLowerCase().trim();
  if (!text) return true;
  if (/^(like\s*&?\s*subscribe|subscribe|watch full|full episode|sign up|tune in live|find the full audio show|follow .*social|connect with me|connect on|about us|timestamps?|chapters?)\b/.test(text)) return true;
  if (/(sponsored|promo video|all in one ai learning|try atoms|text us|minnect|kalshi|podcast circles|boardroom cigar lounge|bet david consulting)/.test(text)) return true;
  if (/^(apple|spotify|twitter|instagram|facebook|siriusxm)\b/.test(text)) return true;
  if (/^\d{1,2}:\d{2}/.test(text)) return true;
  return false;
}

function cleanRedditSummary_(summary, title) {
  var clean = sanitizeText(summary || '', 2000);
  if (!clean) return sanitizeText(title || '', 250);

  clean = clean
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\[link\]|\[comments?\]/gi, ' ')
    .replace(/submitted by\s+\/u\/[a-z0-9_-]+/gi, ' ')
    .replace(/\bto main content\b/gi, ' ')
    .replace(/\s*:\s*(?=\b[A-Z][A-Za-z0-9&+\- ]{1,30}\s*:)/g, ', ')
    .replace(/\s*:\s*$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .trim();

  if (!clean || /^submitted by\b/i.test(clean)) {
    return sanitizeText(title || '', 250);
  }

  return clean;
}
function prependImageMarker(summary, imageUrl, category) {
  var cleanSummary = sanitizeText(summary || '', 2000);
  if (!imageUrl) return cleanSummary;
  if (!/(top story|watches|youtube|watch|video|news)/i.test(String(category || ''))) return cleanSummary;
  return '[[image_url=' + imageUrl + ']] ' + cleanSummary;
}

function isRedditUrl_(url) {
  return /https?:\/\/(?:www\.)?(?:reddit\.com|redd\.it)\//i.test(String(url || ''));
}

function enrichArticleFromUrl(url, fallbackTitle) {
  var result = { title: fallbackTitle || '', summary: '', imageUrl: '' };
  if (!url) return result;
  try {
    if (isRedditUrl_(url)) {
      return result;
    }
    if (/youtube\.com\/watch/i.test(url)) {
      var match = url.match(/[?&]v=([^&]+)/);
      if (match) {
        result.imageUrl = 'https://img.youtube.com/vi/' + match[1] + '/hqdefault.jpg';
      }
      return result;
    }

    var resp = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 RefineryBot/2.1a' }
    });
    if (resp.getResponseCode() >= 400) return result;

    var html = resp.getContentText();
    var text = stripHtml(html);
    result.title = getMetaContent(html, 'property', 'og:title')
      || getMetaContent(html, 'name', 'twitter:title')
      || extractTagText(html, 'title')
      || fallbackTitle
      || url;
    result.summary = getMetaContent(html, 'property', 'og:description')
      || getMetaContent(html, 'name', 'description')
      || getMetaContent(html, 'name', 'twitter:description')
      || extractFirstSentences(text, 3);
    result.imageUrl = getMetaContent(html, 'property', 'og:image')
      || getMetaContent(html, 'name', 'twitter:image')
      || '';
    return result;
  } catch (e) {
    Logger.log('URL enrichment failed: ' + url + ' | ' + e);
    return result;
  }
}

function dryRunPurgeGenericRedditShellArticles(limit) {
  return purgeGenericRedditShellArticles_(true, limit);
}

function purgeGenericRedditShellArticles(limit) {
  return purgeGenericRedditShellArticles_(false, limit);
}

function purgeGenericRedditShellArticles_(dryRun, limit) {
  limit = limit || 250;
  var headers = {'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY, 'Prefer': 'return=representation'};
  var query = CONFIG.SUPABASE_URL + '/rest/v1/articles?source=eq.' + encodeURIComponent('Reddit')
    + '&title=eq.' + encodeURIComponent('Reddit - The heart of the internet')
    + '&select=id,title,url,date_added&order=date_added.desc&limit=' + encodeURIComponent(limit);
  var rows = JSON.parse(UrlFetchApp.fetch(query, {headers: headers, muteHttpExceptions: true}).getContentText()) || [];
  var summary = { dryRun: !!dryRun, matches: rows.length, sample: rows.slice(0, 20) };
  if (dryRun || !rows.length) {
    Logger.log('GENERIC REDDIT PURGE: ' + JSON.stringify(summary, null, 2));
    return summary;
  }

  var delUrl = CONFIG.SUPABASE_URL + '/rest/v1/articles?source=eq.' + encodeURIComponent('Reddit')
    + '&title=eq.' + encodeURIComponent('Reddit - The heart of the internet');
  var deleted = JSON.parse(UrlFetchApp.fetch(delUrl, {
    method: 'delete',
    headers: headers,
    muteHttpExceptions: true
  }).getContentText()) || [];
  summary.deleted = deleted.length;
  Logger.log('GENERIC REDDIT PURGE: ' + JSON.stringify(summary, null, 2));
  return summary;
}

// ============================================================
// DUPLICATE CLEANUP
// Safe to run at any time. kept=true articles are never touched.
// Always run previewDuplicateArticles first to see what will be affected.
// ============================================================

function previewDuplicateArticles() {
  var result = DUPE_CLEANUP_.run(true);
  Logger.log('DUPLICATE PREVIEW:\n' + JSON.stringify(result, null, 2));
  return result;
}

function softDeleteDuplicateArticles() {
  var result = DUPE_CLEANUP_.run(false);
  Logger.log('DUPLICATE CLEANUP:\n' + JSON.stringify(result, null, 2));
  return result;
}

var DUPE_CLEANUP_ = {

  // URLs that are known-bad (Gmail UI, generic redirects, etc.)
  // Articles sharing these URLs are NOT duplicates — they have different content
  // with a broken/generic URL. Do not dedupe on these.
  BAD_URL_PREFIXES: [
    'https://mail.google.com',
    'https://www.google.com/url',
    'https://l.facebook.com',
    'https://t.co/',
    'about:',
    'javascript:'
  ],

  isBadUrl: function(url) {
    var prefixes = DUPE_CLEANUP_.BAD_URL_PREFIXES;
    for (var i = 0; i < prefixes.length; i++) {
      if (url.indexOf(prefixes[i]) === 0) return true;
    }
    return false;
  },

  run: function(dryRun) {
    var headers = { 'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY };
    var allArticles = DUPE_CLEANUP_.fetchAll(headers);

    // Group by cleaned URL — skip kept, already-deleted, and bad URLs
    var byUrl = {};
    var noUrl = [];
    var skippedBadUrl = [];
    allArticles.forEach(function(a) {
      if (a.kept === true) return;           // never touch kept
      if (a.status === 'deleted') return;    // already soft-deleted
      var url = String(a.url || '').trim();
      if (!url) { noUrl.push(a); return; }
      url = cleanUrl(url);
      if (DUPE_CLEANUP_.isBadUrl(url)) { skippedBadUrl.push(a); return; }
      if (!byUrl[url]) byUrl[url] = [];
      byUrl[url].push(a);
    });

    // Find groups with more than one entry
    var dupeGroups = [];
    var toDelete = [];
    Object.keys(byUrl).forEach(function(url) {
      var group = byUrl[url];
      if (group.length < 2) return;
      // Sort oldest first — keep the first (lowest id), mark the rest
      group.sort(function(a, b) { return a.id - b.id; });
      var keep = group[0];
      var dupes = group.slice(1);
      dupes.forEach(function(d) { toDelete.push(d.id); });
      dupeGroups.push({
        url: url,
        keepId: keep.id,
        keepTitle: String(keep.title || '').substring(0, 80),
        keepDate: keep.date_added,
        dupeCount: dupes.length,
        dupeIds: dupes.map(function(d) { return d.id; })
      });
    });

    var summary = {
      dryRun: dryRun,
      totalFetched: allArticles.length,
      uniqueUrlGroups: Object.keys(byUrl).length,
      dupeGroups: dupeGroups.length,
      dupeRowsToDelete: toDelete.length,
      noUrlArticles: noUrl.length,
      skippedBadUrls: skippedBadUrl.length,
      sample: dupeGroups.slice(0, 10)
    };

    if (dryRun || toDelete.length === 0) return summary;

    // Soft-delete in batches of 100
    var deleted = 0;
    var errors = 0;
    for (var i = 0; i < toDelete.length; i += 100) {
      var batch = toDelete.slice(i, i + 100);
      var idList = batch.join(',');
      try {
        var resp = UrlFetchApp.fetch(
          CONFIG.SUPABASE_URL + '/rest/v1/articles?id=in.(' + idList + ')&kept=eq.false',
          {
            method: 'patch',
            contentType: 'application/json',
            headers: { 'apikey': CONFIG.SUPABASE_API_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY, 'Prefer': 'return=representation' },
            payload: JSON.stringify({ status: 'deleted' }),
            muteHttpExceptions: true
          }
        );
        var code = resp.getResponseCode();
        if (code === 200) {
          deleted += JSON.parse(resp.getContentText() || '[]').length;
        } else {
          Logger.log('Batch error ' + code + ': ' + resp.getContentText().substring(0, 200));
          errors++;
        }
      } catch(e) {
        Logger.log('Batch exception: ' + e);
        errors++;
      }
    }

    summary.deleted = deleted;
    summary.errors = errors;
    return summary;
  },

  fetchAll: function(headers) {
    var all = [];
    var offset = 0;
    var pageSize = 1000;
    while (true) {
      var resp = UrlFetchApp.fetch(
        CONFIG.SUPABASE_URL + '/rest/v1/articles?select=id,url,title,date_added,status,kept&order=id.asc&limit=' + pageSize + '&offset=' + offset,
        { method: 'get', headers: headers, muteHttpExceptions: true }
      );
      if (resp.getResponseCode() !== 200) throw new Error('Fetch failed: ' + resp.getContentText().substring(0, 200));
      var page = JSON.parse(resp.getContentText()) || [];
      all = all.concat(page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    return all;
  }
};

function previewPurgeArticlesBeforeApril2026(batchSize) {
  return ARTICLE_PURGE_.run(true, '2026-04-01', batchSize);
}

function purgeArticlesBeforeApril2026(batchSize) {
  return ARTICLE_PURGE_.run(false, '2026-04-01', batchSize);
}

// Hard-delete rows already soft-deleted (status='deleted'), older than PURGE_DAYS days.
// kept=true rows are never touched. Run this only after confirming the soft-delete list is correct.
function hardPurgeDeletedArticles() {
  // Purge all soft-deleted rows (status='deleted', kept=false).
  // No age cutoff — if it's been soft-deleted and confirmed, it goes.
  // Using a far-future date as the upper bound to match all rows.
  var iso = new Date(Date.now() + 86400000).toISOString(); // tomorrow = catch everything

  var serviceRoleKey = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    Logger.log('hardPurgeDeletedArticles: missing SUPABASE_SERVICE_ROLE_KEY script property');
    return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  var resp = UrlFetchApp.fetch(
    CONFIG.SUPABASE_URL + '/rest/v1/articles?kept=eq.false&status=eq.deleted&date_added=lt.' + encodeURIComponent(iso),
    {
      method: 'delete',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=representation'
      },
      muteHttpExceptions: true
    }
  );
  var code = resp.getResponseCode();
  if (code !== 200) {
    Logger.log('hardPurgeDeletedArticles error: ' + code + ' ' + resp.getContentText().substring(0, 200));
    return { error: 'Supabase error ' + code };
  }
  var rows = JSON.parse(resp.getContentText() || '[]') || [];
  Logger.log('hardPurgeDeletedArticles: permanently removed ' + rows.length + ' rows');
  return { purged: rows.length };
}

var ARTICLE_PURGE_ = {
  run: function(dryRun, cutoffInput, batchSize) {
    var cutoffIso = ARTICLE_PURGE_.normalizeCutoffIso(cutoffInput || '2026-04-01');
    var pageSize = Math.max(1, Math.min(Number(batchSize) || 250, 500));
    var summary = {
      dryRun: !!dryRun,
      cutoffIso: cutoffIso,
      artifactsTouched: false,
      matched: ARTICLE_PURGE_.countOlderThanDate(cutoffIso),
      moved: 0,
      deleted: 0,
      errors: 0,
      sample: ARTICLE_PURGE_.fetchOlderThanDate(cutoffIso, pageSize, 0).slice(0, 25).map(function(row) {
        return {
          id: row.id,
          date_added: row.date_added,
          source: row.source,
          category: row.category,
          title: String(row.title || '').substring(0, 120)
        };
      })
    };

    if (dryRun) {
      Logger.log('ARTICLE PURGE PREVIEW: ' + JSON.stringify(summary, null, 2));
      return summary;
    }

    if (summary.matched > 0) {
      var moveResult = ARTICLE_PURGE_.moveOlderThanDateOutOfMain(cutoffIso);
      summary.moved = moveResult.moved || 0;
      summary.deleted = 0;
      summary.errors = moveResult.errors || 0;
      if (moveResult.error) summary.error = moveResult.error;
    }

    Logger.log('ARTICLE PURGE COMPLETE: ' + JSON.stringify(summary, null, 2));
    return summary;
  },

  normalizeCutoffIso: function(cutoffInput) {
    var raw = String(cutoffInput || '').trim();
    if (!raw) throw new Error('Missing cutoff date');
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw += 'T00:00:00.000Z';
    var cutoff = new Date(raw);
    if (isNaN(cutoff.getTime())) throw new Error('Invalid cutoff date: ' + cutoffInput);
    return cutoff.toISOString();
  },

  countOlderThanDate: function(cutoffIso) {
    var resp = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL + '/rest/v1/articles?select=id&kept=eq.false&status=neq.deleted&date_added=lt.' + encodeURIComponent(cutoffIso) + '&limit=1',
      {
        method: 'get',
        headers: ARTICLE_PURGE_.authHeaders({ 'Prefer': 'count=exact' }),
        muteHttpExceptions: true
      }
    );
    var code = resp.getResponseCode();
    if (code !== 200 && code !== 206) {
      throw new Error('Supabase old-article count failed: ' + code + ' ' + resp.getContentText().substring(0, 200));
    }
    var headers = resp.getAllHeaders();
    var contentRange = headers['Content-Range'] || headers['content-range'] || '';
    var match = String(contentRange).match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  },

  fetchOlderThanDate: function(cutoffIso, limit, offset) {
    var url = CONFIG.SUPABASE_URL + '/rest/v1/articles'
      + '?select=id,source,title,category,date_added,kept'
      + '&kept=eq.false'
      + '&status=neq.deleted'
      + '&date_added=lt.' + encodeURIComponent(cutoffIso)
      + '&order=date_added.asc'
      + '&limit=' + encodeURIComponent(limit)
      + '&offset=' + encodeURIComponent(offset || 0);

    var resp = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: ARTICLE_PURGE_.authHeaders(),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      throw new Error('Supabase old-article fetch failed: ' + resp.getResponseCode() + ' ' + resp.getContentText().substring(0, 200));
    }

    return JSON.parse(resp.getContentText()) || [];
  },

  moveOlderThanDateOutOfMain: function(cutoffIso) {
    var serviceRoleKey = ARTICLE_PURGE_.getServiceRoleKey();
    var validationError = ARTICLE_PURGE_.validateElevatedKey(serviceRoleKey);
    if (validationError) {
      return {
        moved: 0,
        errors: 1,
        error: validationError
      };
    }

    var resp = UrlFetchApp.fetch(
      CONFIG.SUPABASE_URL + '/rest/v1/articles?kept=eq.false&status=neq.deleted&date_added=lt.' + encodeURIComponent(cutoffIso),
      {
        method: 'patch',
        contentType: 'application/json',
        headers: ARTICLE_PURGE_.writeHeaders(serviceRoleKey, { 'Prefer': 'return=representation' }),
        payload: JSON.stringify({ status: 'deleted' }),
        muteHttpExceptions: true
      }
    );
    var code = resp.getResponseCode();
    if (code !== 200) {
      return {
        moved: 0,
        errors: 1,
        error: 'Supabase soft delete failed: ' + code + ' ' + resp.getContentText().substring(0, 200)
      };
    }
    var rows = JSON.parse(resp.getContentText() || '[]') || [];
    return { moved: rows.length, errors: 0 };
  },

  getServiceRoleKey: function() {
    return PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
  },

  validateElevatedKey: function(key) {
    key = String(key || '').trim();
    if (!key) return 'Missing script property SUPABASE_SERVICE_ROLE_KEY';
    if (key.indexOf('sb_publishable_') === 0) {
      return 'SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use the legacy service_role key or a server-side sb_secret key.';
    }
    return '';
  },

  authHeaders: function(extra) {
    var serviceRoleKey = ARTICLE_PURGE_.getServiceRoleKey();
    if (serviceRoleKey && !ARTICLE_PURGE_.validateElevatedKey(serviceRoleKey)) {
      return ARTICLE_PURGE_.writeHeaders(serviceRoleKey, extra);
    }
    return ARTICLE_PURGE_.readHeaders(extra);
  },

  writeHeaders: function(key, extra) {
    key = String(key || '').trim();
    var headers = {
      'apikey': key
    };
    if (key.indexOf('sb_secret_') !== 0) {
      headers['Authorization'] = 'Bearer ' + key;
    }
    return ARTICLE_PURGE_.mergeHeaders(headers, extra);
  },

  mergeHeaders: function(base, extra) {
    var headers = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) headers[key] = base[key];
    }
    extra = extra || {};
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) headers[key] = extra[key];
    }
    return headers;
  }
};
function getMetaContent(html, attr, value) {
  if (!html) return '';
  var pattern1 = new RegExp('<meta[^>]*' + attr + '=["\\\']' + escapeRegex(value) + '["\\\'][^>]*content=["\\\']([^"\\\']+)["\\\']', 'i');
  var match1 = html.match(pattern1);
  if (match1) return decodeHtmlEntities(match1[1]);
  var pattern2 = new RegExp('<meta[^>]*content=["\\\']([^"\\\']+)["\\\'][^>]*' + attr + '=["\\\']' + escapeRegex(value) + '["\\\']', 'i');
  var match2 = html.match(pattern2);
  return match2 ? decodeHtmlEntities(match2[1]) : '';
}

function extractTagText(html, tag) {
  var re = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i');
  var match = html.match(re);
  return match ? decodeHtmlEntities(stripHtml(match[1])) : '';
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(html) {
  if (html == null) return '';
  if (typeof html !== 'string') {
    if (typeof html.content === 'string') {
      html = html.content;
    } else {
      html = String(html);
    }
  }

  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}

function extractFirstSentence(text) {
  var c = stripHtml(text).replace(/\s+/g,' ').trim();
  var m = c.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : c.substring(0,200);
}

function extractFirstSentences(text, count) {
  var c = stripHtml(text).replace(/\s+/g,' ').trim();
  var sentences = c.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, count).join(' ').substring(0,500) || c.substring(0,500);
}

function buildEmailSummary(subject, body, fallbackUrl) {
  var lines = extractEmailSummaryLines_(body, subject);
  var seen = {};
  lines.forEach(function(line) {
    seen[line.toLowerCase()] = true;
  });

  extractUrls_(body).forEach(function(url) {
    if (!url) return;
    if (/mail\.google\.com\/mail/i.test(url)) return;
    if (isSponsorUrl(url)) return;
    if (/unsubscribe|preferences|privacy|mailto:/i.test(url)) return;
    var key = url.toLowerCase();
    if (seen[key] || lines.length >= 5) return;
    seen[key] = true;
    lines.push(url);
  });

  if (fallbackUrl && !/mail\.google\.com\/mail/i.test(fallbackUrl) && lines.length < 5) {
    var cleanUrlValue = cleanUrl(fallbackUrl);
    if (cleanUrlValue && !seen[cleanUrlValue.toLowerCase()]) {
      lines.push(cleanUrlValue);
    }
  }

  if (!lines.length) {
    var fallback = extractFirstSentences(body, 5) || sanitizeText(subject || '', 250);
    if (fallback) lines = [fallback];
  }

  return sanitizeSummaryText(lines.slice(0, 5).join('\n'), 4000);
}

function extractEmailSummaryLines_(body, subject) {
  var text = stripHtml(body || '').replace(/\r\n?/g, '\n');
  var rawLines = text.split('\n');
  var cleaned = [];
  var seen = {};
  var subjectNorm = sanitizeText(subject || '', 250).toLowerCase();

  function pushCandidate(candidate) {
    var line = sanitizeText(candidate, 260);
    if (!line) return;
    if (line.length < 20) return;
    if (/^https?:\/\//i.test(line)) return;
    if (/^(from|to|sent|subject):/i.test(line)) return;
    if (/^(read online|view online|unsubscribe|manage preferences|privacy policy|terms|follow us|connect with|like\s*&?\s*subscribe|watch full|timestamps?:|chapters?:)/i.test(line)) return;
    if (/^\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]/.test(line)) return;
    var key = line.toLowerCase();
    if (subjectNorm && key === subjectNorm) return;
    if (seen[key]) return;
    seen[key] = true;
    cleaned.push(line);
  }

  rawLines.forEach(function(line) {
    if (cleaned.length >= 5) return;
    pushCandidate(String(line || '').replace(/^[>\-*\u2022\s]+/, '').trim());
  });

  if (cleaned.length < 5) {
    var sentencePool = stripHtml(body || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+(?:[.!?]+|$)/g) || [];
    sentencePool.forEach(function(sentence) {
      if (cleaned.length >= 5) return;
      pushCandidate(sentence);
    });
  }

  return cleaned.slice(0, 5);
}

function extractUrls_(text) {
  var matches = String(text || '').match(/https?:\/\/[^\s<>")]+/gi) || [];
  var seen = {};
  return matches.map(function(url) {
    return cleanUrl(url);
  }).filter(function(url) {
    if (!url) return false;
    var key = url.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function detectUrgency(subject, body) {
  var kw = ['urgent','asap','immediate','action required','deadline','expires'];
  var t  = (subject+' '+body).toLowerCase();
  return kw.some(function(k){ return t.indexOf(k) !== -1; });
}

function getOrCreateLabel(name) {
  var l = GmailApp.getUserLabelByName(name);
  return l || GmailApp.createLabel(name);
}

function extractSourceName(from) {
  var text = String(from || '').trim();
  var nameMatch = text.match(/^"?([^"<]+?)"?\s*<[^>]+>$/);
  if (nameMatch && nameMatch[1]) return sanitizeText(nameMatch[1], 120);
  var emailMatch = text.match(/<([^>]+)>/);
  var email = emailMatch ? emailMatch[1] : text;
  var domain = email.split('@')[1] || email;
  var base = domain.split('.')[0] || email;
  return sanitizeText(base.replace(/[-_]+/g, ' '), 120);
}



function previewCategoryBackfill() {
  return backfillCategories_(true);
}

function applyCategoryBackfill() {
  return backfillCategories_(false);
}

function previewYoutubeSummaryBackfill(limit, offset) {
  return backfillYoutubeSummaries_(true, limit, offset);
}

function applyYoutubeSummaryBackfill(limit, offset) {
  return backfillYoutubeSummaries_(false, limit, offset);
}

function runYoutubeSummaryCleanup(limit, offset) {
  var preview = backfillYoutubeSummaries_(true, limit, offset);
  if (!preview.changed) {
    Logger.log('YOUTUBE SUMMARY CLEANUP: no changes needed');
    return { preview: preview, applied: null };
  }

  var applied = backfillYoutubeSummaries_(false, limit, offset);
  Logger.log('YOUTUBE SUMMARY CLEANUP COMPLETE: ' + JSON.stringify({
    previewChanged: preview.changed,
    updated: applied.updated,
    errors: applied.errors
  }, null, 2));
  return { preview: preview, applied: applied };
}

function previewRedditSummaryBackfill(limit, offset) {
  return backfillRedditSummaries_(true, limit, offset);
}

function applyRedditSummaryBackfill(limit, offset) {
  return backfillRedditSummaries_(false, limit, offset);
}

function runRedditSummaryCleanup(limit, offset) {
  var preview = backfillRedditSummaries_(true, limit, offset);
  if (!preview.changed) {
    Logger.log('REDDIT SUMMARY CLEANUP: no changes needed');
    return { preview: preview, applied: null };
  }

  var applied = backfillRedditSummaries_(false, limit, offset);
  Logger.log('REDDIT SUMMARY CLEANUP COMPLETE: ' + JSON.stringify({
    previewChanged: preview.changed,
    updated: applied.updated,
    errors: applied.errors
  }, null, 2));
  return { preview: preview, applied: applied };
}

function previewSummaryNormalizationBackfill(limit, offset) {
  return backfillNormalizedSummaries_(true, limit, offset);
}

function applySummaryNormalizationBackfill(limit, offset) {
  return backfillNormalizedSummaries_(false, limit, offset);
}

function runSummaryNormalizationCleanup(limit, offset) {
  var preview = backfillNormalizedSummaries_(true, limit, offset);
  if (!preview.changed) {
    Logger.log('SUMMARY NORMALIZATION CLEANUP: no changes needed');
    return { preview: preview, applied: null };
  }

  var applied = backfillNormalizedSummaries_(false, limit, offset);
  Logger.log('SUMMARY NORMALIZATION CLEANUP COMPLETE: ' + JSON.stringify({
    previewChanged: preview.changed,
    updated: applied.updated,
    errors: applied.errors
  }, null, 2));
  return { preview: preview, applied: applied };
}

function backfillYoutubeSummaries_(dryRun, limit, offset) {
  var effectiveLimit = limit || CONFIG.CATEGORY_BACKFILL.LIMIT || 500;
  var effectiveOffset = offset || CONFIG.CATEGORY_BACKFILL.OFFSET || 0;
  var rows = fetchArticlesForCategoryBackfill_(effectiveLimit, effectiveOffset, '');
  var summary = { dryRun: !!dryRun, scanned: rows.length, matched: 0, changed: 0, updated: 0, errors: 0, sample: [] };

  rows.forEach(function(row) {
    if (!isYoutubeRow_(row)) return;
    summary.matched++;

    var currentSummary = String(row.summary || '');
    var markerMatch = currentSummary.match(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i);
    var marker = markerMatch ? markerMatch[1] : '';
    var body = currentSummary.replace(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i, '');
    var nextBody = finalizeSummaryForRecord_(body, 'YouTube', row.url, row.title);
    var nextSummary = marker + nextBody;
    var nextSignal = deriveSignal(row.title, nextBody);

    if (nextSummary === currentSummary && String(row.signal || '') === nextSignal) return;

    summary.changed++;
    if (summary.sample.length < 25) {
      summary.sample.push({
        id: row.id,
        title: (row.title || '').substring(0, 90),
        before: currentSummary.substring(0, 180),
        after: nextSummary.substring(0, 180)
      });
    }

    if (dryRun) return;

    var patchResult = patchArticleById_(row.id, { summary: nextSummary, signal: nextSignal });
    if (patchResult.ok) summary.updated++;
    else summary.errors++;
  });

  Logger.log('YOUTUBE SUMMARY BACKFILL: ' + JSON.stringify(summary, null, 2));
  return summary;
}


function backfillRedditSummaries_(dryRun, limit, offset) {
  var effectiveLimit = limit || CONFIG.CATEGORY_BACKFILL.LIMIT || 500;
  var effectiveOffset = offset || CONFIG.CATEGORY_BACKFILL.OFFSET || 0;
  var rows = fetchArticlesForCategoryBackfill_(effectiveLimit, effectiveOffset, '');
  var summary = { dryRun: !!dryRun, scanned: rows.length, matched: 0, changed: 0, updated: 0, errors: 0, sample: [] };

  rows.forEach(function(row) {
    if (!isRedditRow_(row)) return;
    summary.matched++;

    var currentSummary = String(row.summary || '');
    var markerMatch = currentSummary.match(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i);
    var marker = markerMatch ? markerMatch[1] : '';
    var body = currentSummary.replace(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i, '');
    var nextBody = finalizeSummaryForRecord_(body, 'Reddit', row.url, row.title);
    var nextSummary = marker + nextBody;
    var nextSignal = deriveSignal(row.title, nextBody);

    if (nextSummary === currentSummary && String(row.signal || '') === nextSignal) return;

    summary.changed++;
    if (summary.sample.length < 25) {
      summary.sample.push({
        id: row.id,
        title: (row.title || '').substring(0, 90),
        before: currentSummary.substring(0, 180),
        after: nextSummary.substring(0, 180)
      });
    }

    if (dryRun) return;

    var patchResult = patchArticleById_(row.id, { summary: nextSummary, signal: nextSignal });
    if (patchResult.ok) summary.updated++;
    else summary.errors++;
  });

  Logger.log('REDDIT SUMMARY BACKFILL: ' + JSON.stringify(summary, null, 2));
  return summary;
}

function backfillNormalizedSummaries_(dryRun, limit, offset) {
  var effectiveLimit = limit || CONFIG.CATEGORY_BACKFILL.LIMIT || 500;
  var effectiveOffset = offset || CONFIG.CATEGORY_BACKFILL.OFFSET || 0;
  var rows = fetchArticlesForCategoryBackfill_(effectiveLimit, effectiveOffset, '');
  var summary = { dryRun: !!dryRun, scanned: rows.length, changed: 0, updated: 0, errors: 0, sample: [] };

  rows.forEach(function(row) {
    var currentSummary = String(row.summary || '');
    var markerMatch = currentSummary.match(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i);
    var marker = markerMatch ? markerMatch[1] : '';
    var body = currentSummary.replace(/^(\[\[image_url=https?:\/\/[^\]]+\]\]\s*)/i, '');
    var nextBody = finalizeSummaryForRecord_(body, row.category, row.url, row.title);
    var nextSummary = marker + nextBody;
    var nextSignal = deriveSignal(row.title, nextBody);

    if (nextSummary === currentSummary && String(row.signal || '') === nextSignal) return;

    summary.changed++;
    if (summary.sample.length < 25) {
      summary.sample.push({
        id: row.id,
        category: row.category || '',
        title: (row.title || '').substring(0, 90),
        before: currentSummary.substring(0, 180),
        after: nextSummary.substring(0, 180)
      });
    }

    if (dryRun) return;

    var patchResult = patchArticleById_(row.id, { summary: nextSummary, signal: nextSignal });
    if (patchResult.ok) summary.updated++;
    else summary.errors++;
  });

  Logger.log('SUMMARY NORMALIZATION BACKFILL: ' + JSON.stringify(summary, null, 2));
  return summary;
}

function isYoutubeRow_(row) {
  return canonicalCategoryName_(row && row.category || '') === 'YouTube'
    || /youtube\.com|youtu\.be/i.test(String(row && row.url || ''));
}

function isRedditRow_(row) {
  return canonicalCategoryName_(row && row.category || '') === 'Reddit'
    || isRedditUrl_(row && row.url || '');
}

function backfillCategories_(dryRun, sourceFilter, limit, offset) {
  var effectiveSource = sourceFilter != null ? sourceFilter : (CONFIG.CATEGORY_BACKFILL.SOURCE_FILTER || '');
  var effectiveLimit = limit || CONFIG.CATEGORY_BACKFILL.LIMIT || 500;
  var effectiveOffset = offset || CONFIG.CATEGORY_BACKFILL.OFFSET || 0;
  var rows = fetchArticlesForCategoryBackfill_(effectiveLimit, effectiveOffset, effectiveSource);
  var summary = { dryRun: !!dryRun, scanned: rows.length, changed: 0, updated: 0, errors: 0, sourceFilter: effectiveSource || '', sample: [] };

  rows.forEach(function(row) {
    var nextCategory = normalizeCategory('', row.source, row.title, row.summary, row.url);
    var currentCategory = canonicalCategoryName_(row.category || '');
    if (nextCategory === currentCategory) return;

    summary.changed++;
    if (summary.sample.length < 25) {
      summary.sample.push({
        id: row.id,
        source: row.source,
        from: row.category || '',
        to: nextCategory,
        title: (row.title || '').substring(0, 90)
      });
    }

    if (dryRun) return;

    var patchResult = patchArticleById_(row.id, { category: nextCategory });
    if (patchResult.ok) summary.updated++;
    else summary.errors++;
  });

  Logger.log('CATEGORY BACKFILL: ' + JSON.stringify(summary, null, 2));
  return summary;
}

function fetchArticlesForCategoryBackfill_(limit, offset, sourceFilter) {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/articles?select=id,source,title,summary,signal,url,category&order=date_added.desc'
    + '&limit=' + encodeURIComponent(limit)
    + '&offset=' + encodeURIComponent(offset);

  if (sourceFilter) {
    url += '&source=ilike.*' + encodeURIComponent(sourceFilter) + '*';
  }

  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'apikey': CONFIG.SUPABASE_API_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY
    },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('Supabase backfill fetch failed: ' + resp.getResponseCode() + ' ' + resp.getContentText().substring(0, 200));
  }

  return JSON.parse(resp.getContentText()) || [];
}

function patchArticleById_(id, fields) {
  try {
    var resp = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/articles?id=eq.' + encodeURIComponent(id), {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        'apikey': CONFIG.SUPABASE_API_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_API_KEY,
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(fields),
      muteHttpExceptions: true
    });

    return { ok: resp.getResponseCode() === 204 || resp.getResponseCode() === 200, code: resp.getResponseCode() };
  } catch (e) {
    Logger.log('ERROR patchArticleById_: ' + e);
    return { ok: false, error: e.toString() };
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ TRIGGERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function previewEmailSummaryBackfill(limit, offset) {
  return backfillEmailSummaries_(true, limit, offset);
}

function applyEmailSummaryBackfill(limit, offset) {
  return backfillEmailSummaries_(false, limit, offset);
}

function runEmailSummaryCleanup(limit, offset) {
  var preview = backfillEmailSummaries_(true, limit, offset);
  if (!preview.changed) {
    Logger.log('EMAIL SUMMARY CLEANUP: no changes needed');
    return { preview: preview, applied: null };
  }

  var applied = backfillEmailSummaries_(false, limit, offset);
  Logger.log('EMAIL SUMMARY CLEANUP COMPLETE: ' + JSON.stringify({
    previewChanged: preview.changed,
    updated: applied.updated,
    errors: applied.errors
  }, null, 2));
  return { preview: preview, applied: applied };
}

function backfillEmailSummaries_(dryRun, limit, offset) {
  var effectiveLimit = limit || CONFIG.CATEGORY_BACKFILL.LIMIT || 500;
  var effectiveOffset = offset || CONFIG.CATEGORY_BACKFILL.OFFSET || 0;
  var rows = fetchArticlesForCategoryBackfill_(effectiveLimit, effectiveOffset, '');
  var summary = { dryRun: !!dryRun, scanned: rows.length, matched: 0, changed: 0, updated: 0, errors: 0, sample: [] };

  rows.forEach(function(row) {
    if (!isEmailRow_(row)) return;
    summary.matched++;

    try {
      var messageId = extractGmailMessageId_(row.url);
      if (!messageId) return;
      var msg = GmailApp.getMessageById(messageId);
      if (!msg) return;

      var canonicalUrl = extractCanonicalUrl(msg.getBody()) || row.url;
      var nextSummary = buildEmailSummary(row.title, msg.getPlainBody(), canonicalUrl);
      var currentSummary = sanitizeSummaryText(row.summary || '', 4000);
      var nextSignal = '';
      var nextCategory = 'Email';

      if (nextSummary === currentSummary && String(row.signal || '') === nextSignal && String(row.category || '') === nextCategory) {
        return;
      }

      summary.changed++;
      if (summary.sample.length < 5) {
        summary.sample.push({
          id: row.id,
          title: row.title,
          before: currentSummary,
          after: nextSummary
        });
      }

      if (dryRun) return;

      var patch = patchArticleById_(row.id, {
        summary: nextSummary,
        signal: nextSignal,
        category: nextCategory
      });
      if (patch.ok) {
        summary.updated++;
      } else {
        summary.errors++;
      }
    } catch (e) {
      summary.errors++;
      Logger.log('EMAIL SUMMARY CLEANUP ERROR [' + row.id + ']: ' + e);
    }
  });

  Logger.log('EMAIL SUMMARY BACKFILL: ' + JSON.stringify(summary, null, 2));
  return summary;
}

function isEmailRow_(row) {
  return canonicalCategoryName_(row.category || '') === 'Email' || /mail\.google\.com\/mail/i.test(String(row.url || ''));
}

function extractGmailMessageId_(url) {
  var match = String(url || '').match(/#all\/([a-zA-Z0-9]+)/);
  return match ? match[1] : '';
}

function previewEmailArtifactRebuild(limit, offset) {
  return rebuildEmailArtifacts_(true, limit, offset);
}

function applyEmailArtifactRebuild(limit, offset) {
  return rebuildEmailArtifacts_(false, limit, offset);
}

function runEmailArtifactRebuild(limit, offset) {
  var preview = rebuildEmailArtifacts_(true, limit, offset);
  if (!preview.candidateCount && !preview.orphanArtifactCount) {
    Logger.log('EMAIL ARTIFACT REBUILD: no email artifacts or email messages found');
    return { preview: preview, applied: null };
  }

  var applied = rebuildEmailArtifacts_(false, limit, offset);
  Logger.log('EMAIL ARTIFACT REBUILD COMPLETE: ' + JSON.stringify({
    deleted: applied.deleted,
    rebuilt: applied.rebuilt,
    errors: applied.errors,
    orphanArtifactsDeleted: applied.orphanArtifactsDeleted
  }, null, 2));
  return { preview: preview, applied: applied };
}

function rebuildEmailArtifacts_(dryRun, limit, offset) {
  var folder = DriveApp.getFolderById(CONFIG.GMAIL.COMPLETE_NEWSLETTER_FOLDER_ID);
  var effectiveOffset = Math.max(0, offset || 0);
  var effectiveLimit = Math.max(0, limit || 0);
  var scanTarget = effectiveLimit > 0 ? effectiveLimit + effectiveOffset + 250 : 2000;
  var existingArtifacts = collectEmailArtifactFiles_(folder);
  var articleRows = fetchEmailArtifactArticleRows_(scanTarget);
  var kindByMessageId = {};
  var selectedIdSet = {};
  var candidateIds;
  var orphanArtifacts = existingArtifacts.filter(function(item) { return !item.messageId; });

  existingArtifacts.forEach(function(item) {
    if (!item.messageId) return;
    if (!kindByMessageId[item.messageId]) kindByMessageId[item.messageId] = item.kind || 'email';
  });

  articleRows.forEach(function(row) {
    if (!isEmailRow_(row)) return;
    var messageId = extractGmailMessageId_(row.url);
    if (!messageId) return;
    if (!kindByMessageId[messageId]) kindByMessageId[messageId] = 'email';
  });

  candidateIds = Object.keys(kindByMessageId).sort();
  if (effectiveOffset > 0) candidateIds = candidateIds.slice(effectiveOffset);
  if (effectiveLimit > 0) candidateIds = candidateIds.slice(0, effectiveLimit);
  candidateIds.forEach(function(messageId) { selectedIdSet[messageId] = true; });

  var selectedArtifacts = existingArtifacts.filter(function(item) {
    return !!item.messageId && !!selectedIdSet[item.messageId];
  });
  var selectedOrphans = (!limit && !offset) ? orphanArtifacts : [];

  var summary = {
    dryRun: !!dryRun,
    existingEmailArtifacts: existingArtifacts.length,
    candidateCount: candidateIds.length,
    orphanArtifactCount: orphanArtifacts.length,
    selectedArtifactCount: selectedArtifacts.length,
    deleted: 0,
    rebuilt: 0,
    errors: 0,
    orphanArtifactsDeleted: 0,
    sample: []
  };

  candidateIds.slice(0, 20).forEach(function(messageId) {
    if (summary.sample.length >= 10) return;
    summary.sample.push({ messageId: messageId, kind: kindByMessageId[messageId] || 'email' });
  });

  if (dryRun) {
    Logger.log('EMAIL ARTIFACT REBUILD PREVIEW: ' + JSON.stringify(summary, null, 2));
    return summary;
  }

  selectedArtifacts.forEach(function(item) {
    try {
      item.file.setTrashed(true);
      summary.deleted++;
    } catch (e) {
      summary.errors++;
      Logger.log('EMAIL ARTIFACT DELETE ERROR [' + item.name + ']: ' + e);
    }
  });

  selectedOrphans.forEach(function(item) {
    try {
      item.file.setTrashed(true);
      summary.orphanArtifactsDeleted++;
    } catch (e) {
      summary.errors++;
      Logger.log('EMAIL ORPHAN ARTIFACT DELETE ERROR [' + item.name + ']: ' + e);
    }
  });

  candidateIds.forEach(function(messageId) {
    var rebuildResult = saveArtifactForMessageId_(messageId, kindByMessageId[messageId]);
    if (rebuildResult.ok) summary.rebuilt++;
    else {
      summary.errors++;
      Logger.log('EMAIL ARTIFACT REBUILD ERROR [' + messageId + ']: ' + rebuildResult.error);
    }
  });

  Logger.log('EMAIL ARTIFACT REBUILD: ' + JSON.stringify(summary, null, 2));
  return summary;
}

function fetchEmailArtifactArticleRows_(targetCount) {
  var rows = [];
  var pageSize = 250;
  var offset = 0;
  var maxRows = Math.max(targetCount || 0, 250);

  while (rows.length < maxRows) {
    var batch = fetchArticlesForCategoryBackfill_(pageSize, offset, '');
    if (!batch.length) break;

    batch.forEach(function(row) {
      if (isEmailRow_(row)) rows.push(row);
    });

    offset += batch.length;
    if (batch.length < pageSize) break;
  }

  return rows;
}

function collectEmailArtifactFiles_(folder) {
  var files = folder.getFiles();
  var results = [];

  while (files.hasNext()) {
    var file = files.next();
    var meta = parseArtifactDescription_(file.getDescription());
    if (!looksLikeEmailArtifact_(file.getName(), meta)) continue;
    results.push({
      file: file,
      id: file.getId(),
      name: file.getName(),
      kind: (meta && meta.kind) || inferArtifactKindFromName_(file.getName()),
      messageId: (meta && meta.messageId) || extractArtifactMessageIdFromName_(file.getName())
    });
  }

  return results;
}

function looksLikeEmailArtifact_(name, meta) {
  if (meta && /^(email|newsletter)$/i.test(String(meta.kind || ''))) return true;
  return /^(Refinery )?(Newsletter|Email) - /i.test(String(name || ''));
}

function inferArtifactKindFromName_(name) {
  return /^Refinery Newsletter - /i.test(String(name || '')) || /^Newsletter - /i.test(String(name || '')) ? 'newsletter' : 'email';
}

function extractArtifactMessageIdFromName_(name) {
  var match = String(name || '').match(/\[([a-zA-Z0-9]+)\]/);
  return match ? match[1] : '';
}

function fixArtifactDatesFromGmail() {
  var folder = DriveApp.getFolderById(CONFIG.GMAIL.COMPLETE_NEWSLETTER_FOLDER_ID);
  var files = folder.getFiles();
  var fixed = 0, skipped = 0, errors = [];

  while (files.hasNext()) {
    try {
      var file = files.next();
      var meta = parseArtifactDescription_(file.getDescription());
      var messageId = (meta && meta.messageId) || extractArtifactMessageIdFromName_(file.getName());
      if (!messageId) { skipped++; continue; }

      var msg = GmailApp.getMessageById(messageId);
      if (!msg) { skipped++; continue; }

      var emailDate = msg.getDate();
      var source = (meta && meta.source) || extractSourceName(msg.getFrom());
      var subject = (meta && meta.subject) || msg.getSubject();
      var newName = buildArtifactTitle_(
        (meta && meta.kind) || 'email',
        source, subject, emailDate, messageId
      );

      if (file.getName() === newName || file.getName() === newName + '.html') {
        skipped++;
      } else {
        file.setName(newName);
        fixed++;
      }
    } catch(e) {
      errors.push(e.toString());
      Logger.log('Error: ' + e);
    }
  }

  Logger.log('fixArtifactDatesFromGmail — Fixed: ' + fixed + ', Skipped: ' + skipped + ', Errors: ' + errors.length);
  return { fixed: fixed, skipped: skipped, errors: errors };
}

function saveArtifactForMessageId_(messageId, preferredKind) {
  try {
    if (!messageId) return { ok:false, error:'missing message id' };
    var msg = GmailApp.getMessageById(messageId);
    if (!msg) return { ok:false, error:'gmail message not found' };
    var from = msg.getFrom();
    var kind = preferredKind || (isNewsletterSender_(from) ? 'newsletter' : 'email');
    return saveCompleteEmailArtifact_(
      msg,
      extractSourceName(from),
      msg.getSubject(),
      msg.getDate(),
      msg.getBody(),
      msg.getPlainBody(),
      kind,
      true
    );
  } catch (e) {
    return { ok:false, error:e.toString() };
  }
}

function isNewsletterSender_(from) {
  var normalized = String(from || '').toLowerCase();
  return CONFIG.GMAIL.NEWSLETTER_SENDERS.some(function(sender) {
    return normalized.indexOf(String(sender || '').toLowerCase()) !== -1;
  });
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'runDailyIngestion') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runDailyIngestion').timeBased().atHour(7).everyDays(1).create();
  Logger.log("Daily trigger: runDailyIngestion at 7am");
}

function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t){ ScriptApp.deleteTrigger(t); });
  Logger.log("All triggers deleted");
}

// Ã¢â€â‚¬Ã¢â€â‚¬ TEST FUNCTIONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// Test URL extraction only Ã¢â‚¬â€ no writes to Supabase
function testUrlExtraction() {
  Logger.log("=== URL EXTRACTION TEST ===");
  var query = CONFIG.GMAIL.NEWSLETTER_SENDERS.map(function(s){ return 'from:'+s; }).join(' OR ') + ' is:unread';
  var threads = GmailApp.search(query, 0, 10);
  Logger.log("Threads: " + threads.length);
  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(msg) {
      var source  = extractSourceName(msg.getFrom());
      var subject = msg.getSubject();
      var body    = msg.getPlainBody();
      Logger.log("\n[" + source + "] " + subject);
      var articles = extractArticlesFromBody(body, source, 'test', new Date(), subject);
      Logger.log("Extracted: " + articles.length + " articles");
      articles.forEach(function(a, i){
        Logger.log("  ["+i+"] "+a.title.substring(0,60));
        Logger.log("       "+a.url.substring(0,80));
      });
    });
  });
}

// Test TOR fetch only Ã¢â‚¬â€ no writes
function testTORDryRun() {
  Logger.log("=== TOR DRY RUN ===");
  Logger.log("Unread: " + getTORUnreadCount());
  var articles = getTORUnreadArticles();
  Logger.log("Fetched: " + articles.length);
  articles.slice(0,3).forEach(function(a,i){
    var r = mapTORArticleToSchema(a);
    Logger.log("["+i+"] "+r.source+" | "+r.title.substring(0,60));
  });
}

// Supabase migration Ã¢â‚¬â€ run once if source_id column missing
function showAuditTrailMigration() {
  Logger.log("ALTER TABLE audit_trail ADD COLUMN IF NOT EXISTS source_id TEXT;");
  Logger.log("CREATE INDEX IF NOT EXISTS idx_audit_source_id ON audit_trail(source_id);");
}









function deleteLegacyArtifactFolder() {
  return trashDriveFolderById_('1Cc9IwXg2F0Zte9z-tmf6zIg7oS3ysoFn');
}

function trashDriveFolderById_(folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var name = folder.getName();
    folder.setTrashed(true);
    return { success:true, id:folderId, name:name };
  } catch (e) {
    return { success:false, error:e.toString(), id:folderId };
  }
}













