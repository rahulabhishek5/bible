const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATHS = {
  KJV: path.join(__dirname, '../../kjv_en.db'),
  TELUGU: path.join(__dirname, '../../telugu_bsi.db'),
  HINDI: path.join(__dirname, '../../hindi_bible.db')
};

const CANONICAL_ENGLISH_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const CANONICAL_ENGLISH_ABBR = [
  "Gen", "Exo", "Lev", "Num", "Deu", "Jos", "Jdg", "Rut", "1Sa", "2Sa", "1Ki", "2Ki", "1Ch", "2Ch", "Ezr", "Neh", "Est", "Job", "Psa", "Pro", "Ecc", "Sng", "Isa", "Jer", "Lam", "Eze", "Dan", "Hos", "Joe", "Amo", "Oba", "Jon", "Mic", "Nah", "Hab", "Zep", "Hag", "Zec", "Mal", "Mat", "Mak", "Luk", "Jhn", "Act", "Rom", "1Co", "2Co", "Gal", "Eph", "Php", "Col", "1Th", "2Th", "1Ti", "2Ti", "Tit", "Phm", "Heb", "Jas", "1Pe", "2Pe", "1Jn", "2Jn", "3Jn", "Jud", "Rev"
];

const CANONICAL_TELUGU_BOOKS = [
  "ఆదికాండము", "నిర్గమకాండము", "లేవీయకాండము", "సంఖ్యాకాండము", "ద్వితీయోపదేశకాండము",
  "యెహోషువ", "న్యాయాధిపతులు", "రూతు", "1 సమూయేలు", "2 సమూయేలు", "1 రాజులు", "2 రాజులు",
  "1 దినవృత్తాంతములు", "2 దినవృత్తాంతములు", "ఎజ్రా", "నెహెమ్యా", "ఎస్తేరు", "యోబు",
  "కీర్తనల గ్రంథము", "సామెతలు", "ప్రసంగి", "పరమగీతము", "యెషయా", "యిర్మియా",
  "విలాపవాక్యములు", "యెహెజ్కేలు", "దానియేలు", "హోషేయ", "యోవేలు", "ఆమోసు", "ఓబద్యా",
  "యోనా", "మీకా", "నహూము", "హబక్కూకు", "జెఫన్యా", "హగ్గయి", "జెకర్యా", "మలాకీ",
  "మత్తయి", "మార్కు", "లూకా", "యోహాను", "అపొస్తలుల కార్యములు", "రోమీయులకు",
  "1 కొరింథీయులకు", "2 కొరింథీయులకు", "గలతీయులకు", "ఎఫెసీయులకు", "ఫిలిప్పీయులకు",
  "కొలొస్సయులకు", "1 థెస్సలొనీకయులకు", "2 థెస్సలొనీకయులకు", "1 తిమోతికి", "2 తిమోతికి",
  "తీతుకు", "ఫిలేమోనుకు", "హెబ్రీయులకు", "యాకోబు", "1 పేతురు", "2 పేతురు", "1 యోహాను",
  "2 యోహాను", "3 యోహాను", "యూదా", "ప్రకటన గ్రంథము"
];

const CANONICAL_HINDI_BOOKS = [
  "उत्पत्ति", "निर्गमन", "लैव्यव्यवस्था", "गिनती", "व्यवस्थाविवरण",
  "यहोशू", "न्यायियों", "रूत", "1 शमूएल", "2 शमूएल", "1 राजा", "2 राजा",
  "1 इतिहास", "2 इतिहास", "एज्रा", "नहेमायाह", "एस्तेर", "अय्यूब",
  "भजन संहिता", "नीतिवचन", "सभोपदेशक", "श्रेष्ठगीत", "यशायाह", "यिर्मयाह",
  "विलापगीत", "यहेजकेल", "दानिय्येल", "होशे", "योएल", "आमोस", "ओबद्याह",
  "योना", "मीका", "नहूम", "हबक्कूक", "सपन्याह", "हाग्गै", "जकर्याह", "मलाकी",
  "मत्ती", "मरकुस", "लूका", "यूहन्ना", "प्रेरितों के काम", "रोमियों",
  "1 कुरिन्थियों", "2 कुरिन्थियों", "गलातियों", "इफिसियों", "फिलिप्पियों",
  "कुलुस्सियों", "1 थिस्सलुनीकियों", "2 थिस्सलुनीकियों", "1 तीमुथियुस", "2 तीमुथियुस",
  "तीतुस", "फिलेमोन", "इब्रानियों", "याकूब", "1 पतरस", "2 पतरस", "1 यूहन्ना",
  "2 यूहन्ना", "3 यूहन्ना", "यहूदा", "प्रकाशितवाक्य"
];

const dbs = {};
const schemaInfo = {}; // { KJV: { bookCol, chapCol, verseCol, textCol }, ... }
const bookMaps = {}; // { KJV: { 1: 'Gen', 2: 'Exo' }, HINDI: { 1: 'उत्पत्ति' } }
const navigationCaches = {}; // { KJV: [...], HINDI: [...] }

// ============================================================
// INITIALIZATION: ZERO-RAM PERSISTENT SQLITE CONNECTIONS
// ============================================================
function initDatabases() {
  for (const [lang, dbPath] of Object.entries(DB_PATHS)) {
    try {
      dbs[lang] = new Database(dbPath, { readonly: true });
      
      // Dynamic Schema Introspection (PRAGMA table_info)
      const columns = dbs[lang].pragma("table_info('verses')");
      const colNames = columns.map(c => c.name.toLowerCase());
      
      let bookCol = colNames.includes('book') ? 'Book' : (colNames.includes('b') ? 'b' : null);
      let chapCol = colNames.includes('chapter') ? 'Chapter' : (colNames.includes('c') ? 'c' : null);
      let verseCol = colNames.includes('verse') ? 'Verse' : (colNames.includes('v') ? 'v' : null);
      let textCol = colNames.includes('text') ? 'Text' : (colNames.includes('t') ? 't' : null);
      
      if (!bookCol) {
        bookCol = columns.find(c => c.name.toLowerCase() === 'book' || c.name.toLowerCase() === 'b')?.name || 'b';
        chapCol = columns.find(c => c.name.toLowerCase() === 'chapter' || c.name.toLowerCase() === 'c')?.name || 'c';
        verseCol = columns.find(c => c.name.toLowerCase() === 'verse' || c.name.toLowerCase() === 'v')?.name || 'v';
        textCol = columns.find(c => c.name.toLowerCase() === 'text' || c.name.toLowerCase() === 't')?.name || 't';
      }

      schemaInfo[lang] = { bookCol, chapCol, verseCol, textCol };
      
      // Dynamic Navigation Builder: Query distinct books preserving native row order
      const bookRows = dbs[lang].prepare(`SELECT ${bookCol} AS bName, MAX(${chapCol}) AS totalChapters FROM verses GROUP BY ${bookCol} ORDER BY MIN(rowid)`).all();
      
      bookMaps[lang] = {};
      const navData = [];
      
      bookRows.forEach((row, idx) => {
        const bookNumber = idx + 1;
        bookMaps[lang][bookNumber] = row.bName; // Map integer to structural string (e.g. 1 -> 'Gen' or 'उत्పत्ति')
        
        let displayName = String(row.bName);
        let displayAbbr = String(row.bName).substring(0, 4).trim();
        
        if (lang === 'KJV' && CANONICAL_ENGLISH_BOOKS[idx]) {
          displayName = CANONICAL_ENGLISH_BOOKS[idx];
          displayAbbr = CANONICAL_ENGLISH_ABBR[idx] || displayName.substring(0, 4).trim();
        } else if (lang === 'TELUGU' && CANONICAL_TELUGU_BOOKS[idx]) {
          displayName = CANONICAL_TELUGU_BOOKS[idx];
          displayAbbr = CANONICAL_TELUGU_BOOKS[idx].substring(0, 4).trim();
        } else if (lang === 'HINDI' && CANONICAL_HINDI_BOOKS[idx]) {
          displayName = CANONICAL_HINDI_BOOKS[idx];
          displayAbbr = CANONICAL_HINDI_BOOKS[idx].substring(0, 4).trim();
        }
        
        navData.push({
          bookNumber,
          name: displayName,
          abbreviation: displayAbbr,
          testament: bookNumber <= 39 ? 'Old' : 'New',
          totalChapters: parseInt(row.totalChapters, 10)
        });
      });
      
      navigationCaches[lang] = navData;
      console.log(`✅ [SQLite Engine]: ${lang} connected and mapped ${bookRows.length} books.`);
    } catch (err) {
      console.error(`❌ [SQLite Engine]: Failed to load ${lang} db:`, err.message);
    }
  }
}

initDatabases();

// ============================================================
// ROUTE 1: GET /api/bible/navigation-menu
// ============================================================
router.get('/navigation-menu', (req, res) => {
  let lang = (req.query.lang || 'ENGLISH').toUpperCase();
  if (lang === 'ENGLISH') lang = 'KJV';

  const targetLang = navigationCaches[lang] ? lang : 'KJV';
  
  if (!navigationCaches[targetLang]) {
    return res.status(500).json({ status: 'error', message: 'Navigation cache unavailable' });
  }

  res.status(200).json({
    status: 'success',
    mode: 'SQLite',
    totalBooks: navigationCaches[targetLang].length,
    data: navigationCaches[targetLang]
  });
});

// ============================================================
// ROUTE 2: GET /api/bible/search?q=query&translation=TELUGU
// ============================================================
router.get('/search', (req, res) => {
  const rawQ = req.query.q;
  let translation = (req.query.translation || '').toUpperCase();
  if (translation === 'ENGLISH') translation = 'KJV';

  if (!rawQ || !rawQ.trim()) {
    return res.status(400).json({ status: 'error', message: 'Query parameter "q" is required' });
  }

  const q = rawQ.trim().normalize('NFC');

  // Determine target DBs: If specified and exists, search that DB; otherwise search ALL loaded DBs!
  const targetLangs = (translation && dbs[translation]) 
    ? [translation] 
    : Object.keys(dbs);

  const matchedCoordinates = new Set();
  const zippedResults = [];

  try {
    for (const langKey of targetLangs) {
      const db = dbs[langKey];
      const schema = schemaInfo[langKey];
      if (!db || !schema) continue;

      const reverseBookMap = {};
      for (const [k, v] of Object.entries(bookMaps[langKey])) {
        reverseBookMap[v] = parseInt(k, 10);
      }

      const stmt = db.prepare(`SELECT * FROM verses WHERE ${schema.textCol} LIKE ? LIMIT 50`);
      const rows = stmt.all(`%${q}%`);

      for (const row of rows) {
        const bName = row[schema.bookCol];
        const bInt = reverseBookMap[bName] || 1;
        const cInt = parseInt(row[schema.chapCol], 10);
        const vInt = parseInt(row[schema.verseCol], 10);

        const coordKey = `${bInt}_${cInt}_${vInt}`;
        if (matchedCoordinates.has(coordKey)) continue;
        matchedCoordinates.add(coordKey);

        const zippedTrans = {
          KJV: 'Text Unavailable',
          TELUGU: 'Text Unavailable',
          HINDI: 'Text Unavailable'
        };

        // Parallel DB Coordinate Zipping
        for (const [lKey, lDb] of Object.entries(dbs)) {
          const lSchema = schemaInfo[lKey];
          const lInternalBook = bookMaps[lKey][bInt];
          if (!lSchema || !lInternalBook) continue;

          try {
            const vStmt = lDb.prepare(`SELECT ${lSchema.textCol} AS t FROM verses WHERE ${lSchema.bookCol} = ? AND ${lSchema.chapCol} = ? AND ${lSchema.verseCol} = ?`);
            const vRow = vStmt.get(lInternalBook, cInt, vInt);
            if (vRow) zippedTrans[lKey] = vRow.t;
          } catch(e) {}
        }

        zippedResults.push({
          _id: `sqlite_${bInt}_${cInt}_${vInt}`,
          bookNumber: bInt,
          chapterNumber: cInt,
          verseNumber: vInt,
          translations: zippedTrans
        });

        if (zippedResults.length >= 50) break;
      }

      if (zippedResults.length >= 50) break;
    }

    res.status(200).json({
      status: 'success',
      mode: 'SQLite',
      results: zippedResults.length,
      data: zippedResults
    });
  } catch(e) {
    console.error('Search Route Error:', e);
    res.status(500).json({ status: 'error', message: 'Failed to perform search query' });
  }
});

// ============================================================
// ROUTE 3: GET /api/bible/chapter/:bookNumber/:chapterNumber
// ============================================================
router.get('/chapter/:bookNumber/:chapterNumber', (req, res) => {
  const b = parseInt(req.params.bookNumber, 10);
  const c = parseInt(req.params.chapterNumber, 10);

  const translationsMap = {}; 
  let maxVerse = 0;

  for (const [langKey, db] of Object.entries(dbs)) {
    const schema = schemaInfo[langKey];
    const internalBookName = bookMaps[langKey][b];
    
    if (!internalBookName || !schema) continue;

    try {
      const stmt = db.prepare(`SELECT ${schema.verseCol} AS v, ${schema.textCol} AS t FROM verses WHERE ${schema.bookCol} = ? AND ${schema.chapCol} = ?`);
      const rows = stmt.all(internalBookName, c);
      
      // Hindi Blob Regex Parsing
      // NOTE: Hindi DB stores multiple verses concatenated in a single row.
      // We split on standalone verse numbers (1–3 digits) that appear at a
      // token boundary — NOT on numbers embedded inside scripture text
      // (e.g. "100 cubits" must NOT be treated as verse 100).
      if (langKey === 'HINDI') {
        const parsedRows = [];
        rows.forEach(row => {
           let cleanText = row.t || "";
           if (cleanText.includes(': HINOVBSI')) {
             cleanText = cleanText.split(': HINOVBSI')[0].trim();
           }
           // Only split on 1-3 digit numbers that are NOT preceded by another
           // digit or letter (i.e. genuine verse markers, not numbers in text).
           const parts = cleanText ? cleanText.split(/(?<![\d\w])(\d{1,3})(?=\s)/) : [];
           if (parts.length > 1) {
               let currentVerse = row.v;
               let currentText = "";
               for (let i = 0; i < parts.length; i++) {
                   if (parts[i].match(/^\d{1,3}$/) && parseInt(parts[i], 10) >= 1 && parseInt(parts[i], 10) <= 176) {
                       if (currentText.trim().length > 0) {
                           parsedRows.push({ v: currentVerse, t: currentText.trim() });
                           currentText = "";
                       }
                       currentVerse = parseInt(parts[i], 10);
                   } else {
                       currentText += parts[i] + " ";
                   }
               }
               if (currentText.trim().length > 0) {
                   parsedRows.push({ v: currentVerse, t: currentText.trim() });
               }
           } else {
               parsedRows.push(row);
           }
        });
        rows.length = 0;
        parsedRows.forEach(r => rows.push(r));
      }

      rows.forEach(row => {
        const v = parseInt(row.v, 10);
        if (!translationsMap[v]) translationsMap[v] = {};
        translationsMap[v][langKey] = row.t;
        // Only let KJV and TELUGU set maxVerse — they store one verse per row
        // so their verse numbers are authoritative. Hindi blob-parsing can
        // produce spurious high verse numbers that would add phantom
        // "Text Unavailable" entries at the end of every chapter.
        if (langKey !== 'HINDI' && v > maxVerse) maxVerse = v;
      });
    } catch(e) {
      console.error(`Error querying ${langKey}:`, e.message);
    }
  }

  const resultData = [];
  for (let v = 1; v <= maxVerse; v++) {
    const tr = translationsMap[v] || {};
    resultData.push({
      _id: `sqlite_${b}_${c}_${v}`,
      bookNumber: b,
      chapterNumber: c,
      verseNumber: v,
      translations: {
        KJV: tr.KJV || 'Text Unavailable',
        TELUGU: tr.TELUGU || 'Text Unavailable',
        HINDI: tr.HINDI || 'पाठ उपलब्ध नहीं है (Text Unavailable)'
      }
    });
  }

  res.status(200).json({
    status: 'success',
    mode: 'SQLite',
    results: resultData.length,
    data: resultData
  });
});

module.exports = router;
