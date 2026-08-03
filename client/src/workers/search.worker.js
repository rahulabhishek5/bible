// search.worker.js

let bibleData = {};
let isLoaded = {};

const LANG_MAP = {
  KJV: 'english',
  ENGLISH: 'english',
  TELUGU: 'telugu',
  HINDI: 'hindi'
};

self.addEventListener('message', async (e) => {
  const { type, payload, id } = e.data;

  if (type === 'LOAD_INDEX') {
    const rawLang = (payload.lang || 'english').toLowerCase();
    const lang = LANG_MAP[rawLang.toUpperCase()] || rawLang;
    const { baseUrl } = payload;

    if (!isLoaded[lang]) {
      try {
        const response = await fetch(`${baseUrl}data/bible/${lang}.json`);
        const data = await response.json();
        bibleData[lang] = data;
        isLoaded[lang] = true;
        self.postMessage({ type: 'INDEX_LOADED', lang, id });
      } catch (err) {
        self.postMessage({ type: 'ERROR', error: err.message, id });
      }
    } else {
      self.postMessage({ type: 'INDEX_LOADED', lang, id });
    }
  }

  if (type === 'SEARCH') {
    const { query, translation, baseUrl } = payload;
    const rawLang = (translation || 'english').toLowerCase();
    const targetLang = LANG_MAP[rawLang.toUpperCase()] || rawLang;

    const nQuery = query.normalize('NFC').toLowerCase();
    const results = [];
    const matchedCoordinates = new Set();
    const maxResults = 50;

    const langData = bibleData[targetLang];
    if (langData && langData.books) {
      for (const book of langData.books) {
        for (const chap of book.chapters) {
          for (const verse of chap.verses) {
            if (verse.text.normalize('NFC').toLowerCase().includes(nQuery)) {
              const coordKey = `${book.bookNumber}_${chap.chapter}_${verse.number}`;
              if (matchedCoordinates.has(coordKey)) continue;
              matchedCoordinates.add(coordKey);

              const zippedTrans = {
                KJV: 'Text Unavailable',
                TELUGU: 'Text Unavailable',
                HINDI: 'Text Unavailable'
              };

              // Map current match
              const keyName = targetLang === 'english' ? 'KJV' : targetLang.toUpperCase();
              zippedTrans[keyName] = verse.text;

              // Cross reference other loaded languages
              for (const [lKey, lData] of Object.entries(bibleData)) {
                if (lKey === targetLang) continue;
                const lKeyName = lKey === 'english' ? 'KJV' : lKey.toUpperCase();
                const lBook = lData.books.find(b => b.bookNumber === book.bookNumber);
                if (lBook) {
                  const lChap = lBook.chapters.find(c => c.chapter === chap.chapter);
                  if (lChap) {
                    const lVerse = lChap.verses.find(v => v.number === verse.number);
                    if (lVerse) zippedTrans[lKeyName] = lVerse.text;
                  }
                }
              }

              results.push({
                _id: `worker_${book.bookNumber}_${chap.chapter}_${verse.number}`,
                bookNumber: book.bookNumber,
                chapterNumber: chap.chapter,
                verseNumber: verse.number,
                translations: zippedTrans
              });

              if (results.length >= maxResults) break;
            }
          }
          if (results.length >= maxResults) break;
        }
        if (results.length >= maxResults) break;
      }
    }

    self.postMessage({ type: 'SEARCH_RESULTS', results, id });
  }
});
