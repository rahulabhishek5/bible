const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATHS = {
  english: path.join(__dirname, '../kjv_en.db'),
  telugu: path.join(__dirname, '../telugu_bsi.db'),
  hindi: path.join(__dirname, '../hindi_bible.db')
};

const TRANSLATION_LABELS = {
  english: 'KJV',
  telugu: 'TELUGU',
  hindi: 'HINDI'
};

const OUTPUT_BASE = path.join(__dirname, '../client/public/data/bible');

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

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function processLanguage(langKey, dbPath, canonicalBooks, canonicalAbbr = null) {
  console.log(`Processing ${langKey}...`);
  ensureDirSync(OUTPUT_BASE);

  let db;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch (err) {
    console.error(`Failed to open DB for ${langKey}: ${err.message}`);
    return;
  }

  // Introspect Schema
  const columns = db.pragma("table_info('verses')");
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

  const bookRows = db.prepare(`SELECT ${bookCol} AS bName, MAX(CAST(${chapCol} AS INTEGER)) AS totalChapters FROM verses GROUP BY ${bookCol} ORDER BY MIN(rowid)`).all();
  
  const booksData = [];

  bookRows.forEach((row, idx) => {
    const bookNumber = idx + 1;
    let displayName = canonicalBooks ? canonicalBooks[idx] : String(row.bName);
    let displayAbbr = canonicalAbbr ? canonicalAbbr[idx] : displayName.substring(0, 4).trim();
    const bookSlug = String(displayName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const totalChapters = parseInt(row.totalChapters, 10);

    const chaptersData = [];

    for (let c = 1; c <= totalChapters; c++) {
      const stmt = db.prepare(`SELECT CAST(${verseCol} AS INTEGER) AS v, ${textCol} AS t FROM verses WHERE ${bookCol} = ? AND CAST(${chapCol} AS INTEGER) = ? ORDER BY v ASC`);
      let rows = stmt.all(row.bName, c);
      
      const parsedVerses = [];
      
      if (langKey === 'hindi') {
        rows.forEach(r => {
           let cleanText = r.t || "";
           if (cleanText.includes(': HINOVBSI')) {
             cleanText = cleanText.split(': HINOVBSI')[0].trim();
           }
           const parts = cleanText ? cleanText.split(/(?<![\d\w])(\d{1,3})(?=\s)/) : [];
           if (parts.length > 1) {
               let currentVerse = r.v;
               let currentText = "";
               for (let i = 0; i < parts.length; i++) {
                   if (parts[i].match(/^\d{1,3}$/) && parseInt(parts[i], 10) >= 1 && parseInt(parts[i], 10) <= 176) {
                       if (currentText.trim().length > 0) {
                           parsedVerses.push({ number: currentVerse, text: currentText.trim() });
                           currentText = "";
                       }
                       currentVerse = parseInt(parts[i], 10);
                   } else {
                       currentText += parts[i] + " ";
                   }
               }
               if (currentText.trim().length > 0) {
                   parsedVerses.push({ number: currentVerse, text: currentText.trim() });
               }
           } else {
               parsedVerses.push({ number: r.v, text: cleanText.trim() });
           }
        });
      } else {
        rows.forEach(r => {
          parsedVerses.push({ number: r.v, text: (r.t || "").trim() });
        });
      }

      chaptersData.push({
        chapter: c,
        verses: parsedVerses
      });
    }

    booksData.push({
      bookNumber,
      name: displayName,
      abbreviation: displayAbbr,
      slug: bookSlug,
      testament: bookNumber <= 39 ? 'Old' : 'New',
      totalChapters,
      chapters: chaptersData
    });

    console.log(`  - Exported ${displayName} (${totalChapters} chapters)`);
  });

  const consolidatedJSON = {
    language: langKey,
    translation: TRANSLATION_LABELS[langKey],
    books: booksData
  };

  const outputPath = path.join(OUTPUT_BASE, `${langKey}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(consolidatedJSON));

  db.close();
  console.log(`✅ Finished ${langKey}. Saved to ${outputPath}`);
}

console.log("Starting consolidated DB-to-JSON extraction...");
processLanguage('english', DB_PATHS.english, CANONICAL_ENGLISH_BOOKS, CANONICAL_ENGLISH_ABBR);
processLanguage('telugu', DB_PATHS.telugu, CANONICAL_TELUGU_BOOKS);
processLanguage('hindi', DB_PATHS.hindi, CANONICAL_HINDI_BOOKS);
console.log("Extraction complete.");
