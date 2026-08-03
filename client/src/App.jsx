import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { BookOpen, Search, Menu, ChevronRight, BookOpenCheck, Globe, HelpCircle, Settings, X, Type, ChevronDown } from 'lucide-react';

import SearchWorker from './workers/search.worker.js?worker';

const searchWorker = new SearchWorker();
let messageIdCounter = 0;
const workerPromises = {};

searchWorker.addEventListener('message', (e) => {
  const { type, id, error } = e.data;
  if (workerPromises[id]) {
    if (type === 'ERROR') {
      workerPromises[id].reject(new Error(error));
    } else {
      workerPromises[id].resolve(e.data);
    }
    delete workerPromises[id];
  }
});

const sendWorkerMessage = (type, payload) => {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter;
    workerPromises[id] = { resolve, reject };
    searchWorker.postMessage({ type, payload, id });
  });
};

const LANG_FILE_MAP = {
  ENGLISH: 'english',
  KJV: 'english',
  TELUGU: 'telugu',
  HINDI: 'hindi'
};

const GENESIS_1_FALLBACK = [
  { _id: 'fallback_1_1_1', bookNumber: 1, chapterNumber: 1, verseNumber: 1, translations: { KJV: 'In the beginning God created the heaven and the earth.', TELUGU: 'ఆదియందు దేవుడు భూమ్యాకాశములను సృజించెను.', HINDI: 'आदि में परमेश्वर ने आकाश और पृथ्वी की सृष्टि की।' } },
  { _id: 'fallback_1_1_2', bookNumber: 1, chapterNumber: 1, verseNumber: 2, translations: { KJV: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.', TELUGU: 'భూమి నిరాకారముగాను శూన్యముగాను ఉండెను; చీకటి అగాధ జలముమీద కమ్మియుండెను; దేవుని ఆత్మ జలములమీద అల్లాడుచుండెను.', HINDI: 'और पृथ्वी बेडौल और सूनी पड़ी थी, और गहरे जल के ऊपर अन्धियारा था: तथा परमेश्वर का आत्मा जल के ऊपर मण्डलाता था।' } },
  { _id: 'fallback_1_1_3', bookNumber: 1, chapterNumber: 1, verseNumber: 3, translations: { KJV: 'And God said, Let there be light: and there was light.', TELUGU: 'దేవుడు వెలుగు కమ్మని పలుకగా వెలుగు కలిగెను.', HINDI: 'तब परमेश्वर ने कहा, उजियाला हो: तो उजियाला हो गया।' } },
  { _id: 'fallback_1_1_4', bookNumber: 1, chapterNumber: 1, verseNumber: 4, translations: { KJV: 'And God saw the light, that it was good: and God divided the light from the darkness.', TELUGU: 'వెలుగు మంచిదైనట్టు దేవుడు చూచెను; దేవుడు చీకటిని వెలుగును వేరుపరచెను.', HINDI: 'और परमेश्वर ने उजियाले को देखा कि अच्छा है; और परमेश्वर ने उजियाले को अन्धियारे से अलग किया।' } },
  { _id: 'fallback_1_1_5', bookNumber: 1, chapterNumber: 1, verseNumber: 5, translations: { KJV: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.', TELUGU: 'దేవుడు వెలుగునకు పగలనియు, చీకటికి రాత్రి అనియు పేరు పెట్టెను. అస్తమయమును ఉదయమును కలుగగా ఒక దినమాయెను.', HINDI: 'और परमेश्वर ने उजियाले को दिन और अन्धियारे को रात कहा। तथा सांझ हुई फिर भोर हुआ। इस प्रकार पहिला दिन हो गया।' } }
];

const ENGLISH_BOOK_NAMES = [
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

// ============================================================================
// DYNAMIC THEMING DEFINITIONS
// ============================================================================
const THEMES = {
  geometry: { primary: '#1A1A1A', cream: '#F5F5DC', surface: '#FFFFFF', name: 'Grace Theme' },
  obsidian: { primary: '#FFFFFF', cream: '#121212', surface: '#1A1A1A', name: 'Dark Theme' },
  parchment: { primary: '#3E2723', cream: '#F5E6D3', surface: '#FFF8E7', name: 'Sepia Theme' }
};
const ACCENTS = ['#FF3B30', '#007AFF', '#34C759', '#FFCC00', '#FF2D55'];

const getInitialSettings = () => {
  const saved = localStorage.getItem('bible_settings');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return { theme: 'geometry', accent: '#FF3B30', fontScale: 1.0 };
};

const buildVerseCitation = ({ rawText, regBookName, enBookName, chapter, startVerse, endVerse, hasEnglish, hasRegional }) => {
  const verseRange = startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`;

  let bookCitation = '';
  if (hasEnglish && !hasRegional) {
    bookCitation = enBookName;
  } else if (!regBookName || regBookName === enBookName) {
    bookCitation = enBookName || regBookName;
  } else {
    bookCitation = `${regBookName} (${enBookName})`;
  }

  const cleanedText = rawText.replace(/\[\d+(?:-\d+)?\]/g, '').trim();

  return `"${cleanedText}" - *${bookCitation} ${chapter}:${verseRange}*`;
};

export default function App() {
  // Navigation & UI Layout State
  const [menuData, setMenuData] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('parallel'); // single_kjv, single_telugu, parallel
  const [testamentFilter, setTestamentFilter] = useState('OT'); // OT, NT
  
  // Ergonomics & Thematic Settings State
  const [settings, setSettings] = useState(getInitialSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('TELUGU');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const viewModeRef = useRef(null);
  const langRef = useRef(null);
  const quickNavRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewModeRef.current && !viewModeRef.current.contains(event.target)) {
        setIsViewModeDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (quickNavRef.current && !quickNavRef.current.contains(event.target)) {
        setIsQuickNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToVerse = (verseNum) => {
    setIsQuickNavOpen(false);
    const el = document.getElementById(`verse-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  // Content Display & Cache States
  const [loadedBibles, setLoadedBibles] = useState({});
  const [chapterVerses, setChapterVerses] = useState([]);
  
  // Advanced Search Engine States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTranslation, setSearchTranslation] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('reader'); // reader, search
  const [isViewModeDropdownOpen, setIsViewModeDropdownOpen] = useState(false);

  const handleNativeCopy = useCallback((e) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const verses = document.querySelectorAll('[data-verse]');
    const selectedVerseNodes = Array.from(verses).filter(el => range.intersectsNode(el));

    if (selectedVerseNodes.length === 0) return;

    e.preventDefault();

    const startVerseNode = selectedVerseNodes[0];
    const enBookName = startVerseNode.getAttribute('data-book-name-en') || '';
    const regBookName = startVerseNode.getAttribute('data-book-name-reg') || enBookName;
    const chapter = startVerseNode.getAttribute('data-chapter');
    const startVerse = startVerseNode.getAttribute('data-verse');
    const endVerse = selectedVerseNodes[selectedVerseNodes.length - 1].getAttribute('data-verse');

    const englishContainers = document.querySelectorAll('[data-language="ENGLISH"]');
    const regionalContainers = document.querySelectorAll('[data-language="REGIONAL"]');
    
    let hasEnglish = false;
    let hasRegional = false;
    
    englishContainers.forEach(el => {
      if (range.intersectsNode(el)) hasEnglish = true;
    });
    regionalContainers.forEach(el => {
      if (range.intersectsNode(el)) hasRegional = true;
    });

    const rawText = selection.toString();
    const formattedText = buildVerseCitation({
      rawText,
      regBookName,
      enBookName,
      chapter,
      startVerse,
      endVerse,
      hasEnglish,
      hasRegional
    });

    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', formattedText);
    }
  }, []);

  const highlightText = useCallback((text, query) => {
    if (!query || !text) return text;
    const nText = text.normalize('NFC');
    const nQuery = query.normalize('NFC');
    const escapedQuery = nQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[^\\p{L}\\p{M}\\d])(${escapedQuery})(?=[^\\p{L}\\p{M}\\d]|$)`, 'giu');
    const parts = nText.split(regex);
    return parts.map((part, i) => {
      return (i % 2 === 1 && part) ? 
        <mark key={i} className="bg-primary text-surface-white px-1 mx-0.5 font-black">{part}</mark> : part;
    });
  }, []);

  // ============================================================================
  // VIEW MODE STATE SYNCHRONIZATION
  // ============================================================================
  useEffect(() => {
    if (viewMode === 'single_english') {
      setSelectedLanguage('ENGLISH');
    } else if (selectedLanguage === 'ENGLISH') {
      setSelectedLanguage('TELUGU');
    }
  }, [viewMode, selectedLanguage]);

  // ============================================================================
  // SYNCHRONOUS THEMATIC BINDING (PREVENTS FLASHING)
  // ============================================================================
  useLayoutEffect(() => {
    const root = document.documentElement;
    const currentTheme = THEMES[settings.theme] || THEMES.geometry;
    
    root.style.setProperty('--app-primary', currentTheme.primary);
    root.style.setProperty('--app-cream', currentTheme.cream);
    root.style.setProperty('--app-surface', currentTheme.surface);
    root.style.setProperty('--app-accent', settings.accent);
    
    localStorage.setItem('bible_settings', JSON.stringify(settings));
  }, [settings]);

  // Phase 1: Load Single Language JSON Manifests on Demand
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    const activeFile = LANG_FILE_MAP[selectedLanguage] || 'english';

    const loadLang = (fileKey) => {
      if (loadedBibles[fileKey]) return Promise.resolve(loadedBibles[fileKey]);
      return fetch(`${baseUrl}data/bible/${fileKey}.json`)
        .then(res => res.json())
        .then(data => {
          setLoadedBibles(prev => ({ ...prev, [fileKey]: data }));
          return data;
        });
    };

    Promise.all([
      loadLang(activeFile),
      loadLang('english')
    ]).then(([activeData]) => {
      if (activeData && activeData.books) {
        setMenuData(activeData.books);
        setSelectedBook(prev => {
          if (!prev) return activeData.books[0];
          return activeData.books.find(b => b.bookNumber === prev.bookNumber) || activeData.books[0];
        });
      }
    }).catch(err => console.error("Failed to load language JSON:", err));

    sendWorkerMessage('LOAD_INDEX', { lang: activeFile, baseUrl }).catch(console.error);
    sendWorkerMessage('LOAD_INDEX', { lang: 'english', baseUrl }).catch(console.error);
  }, [selectedLanguage]);

  // Phase 2: Instant Reader State Mapping from Cached Memory
  useEffect(() => {
    if (!selectedBook) return;
    
    if (selectedBook.bookNumber === 1 && selectedChapter === 1 && chapterVerses.length === 0) {
       setChapterVerses(GENESIS_1_FALLBACK);
    }

    const activeFile = LANG_FILE_MAP[selectedLanguage] || 'english';
    const englishData = loadedBibles['english'];
    const activeData = loadedBibles[activeFile];

    if (!englishData && !activeData) return;

    const targetBookNumber = selectedBook.bookNumber;

    const kjvBook = englishData?.books?.find(b => b.bookNumber === targetBookNumber);
    const kjvChap = kjvBook?.chapters?.find(c => c.chapter === selectedChapter);

    const regBook = activeData?.books?.find(b => b.bookNumber === targetBookNumber);
    const regChap = regBook?.chapters?.find(c => c.chapter === selectedChapter);

    const kjvVerses = kjvChap?.verses || [];
    const regVerses = regChap?.verses || [];

    const maxVerseCount = Math.max(kjvVerses.length, regVerses.length);
    const zipped = [];

    for (let i = 1; i <= maxVerseCount; i++) {
      const kV = kjvVerses.find(v => v.number === i);
      const rV = regVerses.find(v => v.number === i);

      zipped.push({
        _id: `cached_${targetBookNumber}_${selectedChapter}_${i}`,
        bookNumber: targetBookNumber,
        chapterNumber: selectedChapter,
        verseNumber: i,
        translations: {
          KJV: kV ? kV.text : 'Text Unavailable',
          [selectedLanguage]: rV ? rV.text : 'Text Unavailable'
        }
      });
    }

    setChapterVerses(zipped);
  }, [selectedBook, selectedChapter, selectedLanguage, loadedBibles]);

  // Phase 3: Execute Target Search Form Logic
  const performSearch = useCallback((query, translation) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    
    const baseUrl = import.meta.env.BASE_URL;
    const rawLang = translation || selectedLanguage;
    const targetFile = LANG_FILE_MAP[rawLang] || 'english';
    
    sendWorkerMessage('LOAD_INDEX', { lang: targetFile, baseUrl })
      .then(() => sendWorkerMessage('SEARCH', { query, translation: targetFile, baseUrl }))
      .then(response => {
        if (response.type === 'SEARCH_RESULTS') {
          setSearchResults(response.results);
        }
        setSearching(false);
      })
      .catch(err => {
        console.error("Search execution error:", err);
        setSearching(false);
      });
  }, [selectedLanguage]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    performSearch(searchQuery, searchTranslation);
  };

  useEffect(() => {
    if (activeTab === 'search') {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          performSearch(searchQuery, searchTranslation);
        } else {
          setSearchResults(null);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchTranslation, activeTab, performSearch]);

  const jumpToChapter = (bookNum, chapNum) => {
    const targetBook = menuData.find(b => b.bookNumber === bookNum);
    if (targetBook) {
      setSelectedBook(targetBook);
      setSelectedChapter(chapNum);
      
      // Auto-switch testament tab if jumping across boundaries
      if (bookNum <= 39) setTestamentFilter('OT');
      else setTestamentFilter('NT');
      
      setActiveTab('reader');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-cream font-space-grotesk text-primary">
      {/* ERGONOMICS SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-primary/80 z-[100] flex items-center justify-center p-4">
          <div className="w-[92vw] md:w-[450px] max-h-[90vh] overflow-y-auto bg-surface-white border-4 border-primary shadow-[8px_8px_0px_0px_#1A1A1A] flex flex-col transition-all">
            <div className="p-5 border-b-4 border-primary flex justify-between items-center bg-cream shrink-0">
               <h2 className="font-extrabold text-2xl uppercase tracking-widest text-primary flex items-center gap-2"><Settings className="w-6 h-6"/> Settings</h2>
               <button onClick={() => setIsSettingsOpen(false)} className="p-2 border-2 border-primary hover:bg-surface-white transition-all active:scale-95 active:translate-y-[1px]"><X className="w-5 h-5 text-primary"/></button>
            </div>
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
               {/* THEMES */}
               <div>
                 <h3 className="font-bold text-lg uppercase tracking-wider text-primary mb-3">Bible Theme</h3>
                 <div className="space-y-3">
                   {Object.entries(THEMES).map(([key, t]) => (
                     <button 
                       key={key} 
                       onClick={() => setSettings({...settings, theme: key})}
                       className={`w-full p-4 border-2 flex items-center justify-between transition-all active:scale-[0.98] ${settings.theme === key ? 'border-primary bg-primary text-surface-white shadow-[4px_4px_0px_0px_#1A1A1A] -translate-x-1 -translate-y-1' : 'border-primary bg-cream text-primary hover:bg-surface-white'}`}
                     >
                       <span className="font-extrabold uppercase tracking-widest">{t.name}</span>
                       <div className="flex border-2 border-primary">
                          <div className="w-4 h-4" style={{backgroundColor: t.cream}}></div>
                          <div className="w-4 h-4" style={{backgroundColor: t.surface}}></div>
                          <div className="w-4 h-4" style={{backgroundColor: t.primary}}></div>
                       </div>
                     </button>
                   ))}
                 </div>
               </div>

               {/* ACCENTS */}
               <div>
                 <h3 className="font-bold text-lg uppercase tracking-wider text-primary mb-3">Active Accent</h3>
                 <div className="flex gap-3 flex-wrap">
                   {ACCENTS.map(acc => (
                     <button 
                       key={acc}
                       onClick={() => setSettings({...settings, accent: acc})}
                       className={`w-12 h-12 border-2 border-primary transition-all active:scale-90 ${settings.accent === acc ? 'shadow-[4px_4px_0px_0px_#1A1A1A] -translate-y-1 -translate-x-1' : 'opacity-70 hover:opacity-100'}`}
                       style={{backgroundColor: acc}}
                     />
                   ))}
                 </div>
               </div>

               {/* TYPOGRAPHY SCALE */}
               <div>
                 <h3 className="font-bold text-lg uppercase tracking-wider text-primary mb-3">Change Font</h3>
                 <div className="grid grid-cols-3 border-2 border-primary bg-cream">
                   <button aria-label="Decrease font size" onClick={() => setSettings({...settings, fontScale: Math.max(0.85, settings.fontScale - 0.15)})} className="p-4 border-r-2 border-primary hover:bg-surface-white focus:outline-none focus:ring-4 focus:ring-accent-red active:bg-primary active:text-surface-white transition-colors text-primary flex justify-center items-center font-extrabold text-3xl min-h-[44px] min-w-[44px]">-</button>
                   <div className="flex items-center justify-center font-extrabold text-primary tracking-widest border-r-2 border-primary text-base md:text-lg">{Math.round(settings.fontScale * 100)}%</div>
                   <button aria-label="Increase font size" onClick={() => setSettings({...settings, fontScale: Math.min(1.45, settings.fontScale + 0.15)})} className="p-4 hover:bg-surface-white focus:outline-none focus:ring-4 focus:ring-accent-red active:bg-primary active:text-surface-white transition-colors text-primary flex justify-center items-center font-extrabold text-3xl min-h-[44px] min-w-[44px]">+</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300 ease-in-out" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-80 h-full bg-cream border-r-4 border-primary flex flex-col overflow-hidden`}>
        <div className="p-5 border-b-4 border-primary flex items-center gap-3 bg-primary text-surface-white shrink-0">
          <BookOpenCheck className="h-7 w-7 shrink-0" />
          <h1 className="font-bold text-xl tracking-wide whitespace-nowrap uppercase">Sinai Bible</h1>
        </div>

        {/* Binary Segmentation Toggle */}
        <div className="p-3 border-b-4 border-primary shrink-0 bg-surface-white">
          <div className="flex border-2 border-primary bg-cream">
            <button
              onClick={() => setTestamentFilter('OT')}
              className={`flex-1 min-h-[44px] py-2 text-sm font-bold uppercase tracking-widest transition-none border-r-2 border-primary ${testamentFilter === 'OT' ? 'bg-primary text-surface-white' : 'text-primary md:hover:bg-surface-white'}`}
            >
              Old Test.
            </button>
            <button
              onClick={() => setTestamentFilter('NT')}
              className={`flex-1 min-h-[44px] py-2 text-sm font-bold uppercase tracking-widest transition-none ${testamentFilter === 'NT' ? 'bg-primary text-surface-white' : 'text-primary md:hover:bg-surface-white'}`}
            >
              New Test.
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {menuData.filter(b => testamentFilter === 'OT' ? b.bookNumber <= 39 : b.bookNumber > 39).map((book) => {
            const isSelected = selectedBook?.bookNumber === book.bookNumber;
            return (
              <div key={book.bookNumber} className="overflow-hidden">
                <button
                  onClick={() => { setSelectedBook(book); setSelectedChapter(1); }}
                  className={`w-full min-h-[44px] min-w-[44px] px-4 py-3 flex items-center justify-between text-left transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] border-2 ${isSelected ? 'bg-primary text-surface-white border-primary shadow-[4px_4px_0px_0px_#1A1A1A] translate-x-[-2px] translate-y-[-2px]' : 'bg-surface-white text-primary border-primary md:hover:bg-cream md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-x-1 md:hover:-translate-y-1'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={`text-xs font-bold px-2 py-1.5 border-2 shrink-0 ${isSelected ? 'border-surface-white bg-primary text-surface-white' : 'border-primary bg-cream text-primary'}`}>{book.abbreviation}</span>
                    <div className="flex flex-col items-start truncate overflow-hidden">
                      <span className={`truncate font-extrabold tracking-widest ${isSelected ? 'text-surface-white' : 'text-primary'}`}>{book.name}</span>
                      {selectedLanguage !== 'ENGLISH' && (
                        <span className={`truncate font-normal text-sm opacity-70 tracking-wide mt-0.5 ${isSelected ? 'text-surface-white/80' : 'text-primary/70'}`}>
                          {ENGLISH_BOOK_NAMES[book.bookNumber - 1]}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </button>
                
                {/* Expandable Chapter Selection Sub-Grid */}
                {isSelected && (
                  <div className="bg-cream p-4 grid grid-cols-5 gap-2.5 border-l-2 border-r-2 border-b-2 border-primary mb-3 max-h-56 overflow-y-auto ml-2 mr-2">
                    {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map((chap) => (
                      <button
                        key={chap}
                        onClick={() => {
                          setSelectedChapter(chap);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`min-h-[44px] min-w-[44px] py-2.5 text-center text-sm font-bold border-2 transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] ${selectedChapter === chap ? 'bg-accent-red text-surface-white border-primary shadow-[2px_2px_0px_0px_#1A1A1A] translate-x-[-1px] translate-y-[-1px]' : 'bg-surface-white text-primary border-primary md:hover:bg-cream md:hover:shadow-[2px_2px_0px_0px_#1A1A1A] md:hover:-translate-x-[1px] md:hover:-translate-y-[1px]'}`}
                      >
                        {chap}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* MAIN VIEWPORT INTERFACE AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-cream">
        {/* UPPER CONSOLE BAR */}
        <header className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-2 md:gap-4 w-full p-2 md:p-4 md:px-8 shrink-0 bg-surface-white border-b-2 md:border-b-4 border-primary relative z-50">
          <div className="flex items-center gap-2 md:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 border-2 border-primary bg-surface-white transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] md:hidden text-primary min-h-[40px] min-w-[40px] flex items-center justify-center">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex bg-cream p-1 border-2 border-primary w-full sm:w-auto justify-center">
              <button onClick={() => setActiveTab('reader')} className={`flex-1 sm:flex-none min-h-[40px] min-w-[40px] px-2 py-1.5 md:px-6 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] border-2 border-transparent flex items-center justify-center gap-1.5 ${activeTab === 'reader' ? 'bg-primary text-surface-white' : 'text-primary md:hover:bg-surface-white md:hover:border-primary'}`}>
                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" /> Reader
              </button>
              <button onClick={() => setActiveTab('search')} className={`flex-1 sm:flex-none min-h-[40px] min-w-[40px] px-2 py-1.5 md:px-6 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] border-2 border-transparent flex items-center justify-center gap-1.5 ${activeTab === 'search' ? 'bg-primary text-surface-white' : 'text-primary md:hover:bg-surface-white md:hover:border-primary'}`}>
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4" /> Search
              </button>
            </div>
          </div>

            <div className="flex items-center gap-2 justify-between w-full sm:w-auto mt-1 sm:mt-0">
               {activeTab === 'reader' && selectedBook && (
                  <div ref={viewModeRef} className="relative flex-1 sm:flex-none">
                    <button 
                      onClick={() => {
                        setIsLangDropdownOpen(false);
                        setIsQuickNavOpen(false);
                        setIsViewModeDropdownOpen(!isViewModeDropdownOpen);
                      }}
                      className="flex w-full sm:w-56 items-center justify-between gap-1.5 md:gap-3 bg-surface-white border-2 border-primary px-2 py-1.5 md:px-4 md:py-3 transition-all duration-300 ease-out active:scale-[0.98] md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1 cursor-pointer min-h-[40px]"
                    >
                      <div className="flex items-center gap-2">
                         <BookOpenCheck className="h-5 w-5 text-primary hidden sm:block" />
                         <span className="font-bold uppercase tracking-wider text-sm">
                           {viewMode === 'parallel' ? 'Parallel View' : viewMode === 'single_english' ? 'English Only' : 'Regional Only'}
                         </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${isViewModeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`absolute top-full left-0 right-0 mt-2 bg-surface-white border-2 border-primary shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col overflow-hidden transition-all duration-300 origin-top z-60 ${isViewModeDropdownOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
                      {['parallel', 'single_english', 'single_regional'].map(mode => (
                        <button 
                          key={mode}
                          onClick={() => { setViewMode(mode); setIsViewModeDropdownOpen(false); }}
                          className={`px-4 py-4 text-left font-bold uppercase tracking-wider text-sm transition-colors md:hover:bg-cream ${viewMode === mode ? 'bg-primary text-surface-white md:hover:bg-primary' : 'text-primary'}`}
                        >
                          {mode === 'parallel' ? 'Eng & Tel' : mode === 'single_english' ? 'English Only' : 'Regional Only'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
              {/* Global Language Selector Dropdown */}
              {viewMode !== 'single_english' && (
                <div ref={langRef} className="relative">
                  <button 
                    onClick={() => {
                      setIsViewModeDropdownOpen(false);
                      setIsQuickNavOpen(false);
                      setIsLangDropdownOpen(!isLangDropdownOpen);
                    }}
                    className="p-2 px-3 md:px-4 bg-surface-white border-2 border-primary text-primary transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1 min-h-[40px] flex items-center justify-center gap-2 font-bold text-xs md:text-sm"
                  >
                    <Globe className="w-4 h-4 md:w-5 md:h-5"/>
                    <span className="uppercase">{selectedLanguage}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isLangDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-36 bg-surface-white border-2 border-primary shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col z-60">
                      {['TELUGU', 'HINDI'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`text-left px-4 py-3 font-bold text-sm transition-colors border-b-2 border-primary last:border-b-0 ${selectedLanguage === lang ? 'bg-primary text-surface-white' : 'text-primary md:hover:bg-cream'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              )}

                <button 
                  onClick={() => setIsSettingsOpen(true)} 
                  className="p-2 bg-surface-white border-2 border-primary text-primary transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5"/>
              </button>
          </div>
        </header>

        {/* CONTAINER DISPLAY WINDOW */}
        <div className="flex-1 p-2 md:p-8 overflow-hidden flex flex-col">
          {activeTab === 'reader' ? (
            <div 
              onCopy={handleNativeCopy}
              className="max-w-5xl w-full mx-auto bg-surface-white border-2 md:border-4 border-primary shadow-[4px_4px_0px_0px_#1A1A1A] md:shadow-[8px_8px_0px_0px_#1A1A1A] min-h-0 flex flex-col h-full overflow-hidden"
            >
              {selectedBook ? (
                <>
                  {/* INTERACTIVE CONTROL HEADER / QUICK-NAV TRIGGER */}
                  <div ref={quickNavRef} className="border-b-2 md:border-b-4 border-primary shrink-0 flex flex-col relative z-20 bg-cream">
                    <button 
                      onClick={() => {
                        setIsViewModeDropdownOpen(false);
                        setIsLangDropdownOpen(false);
                        setIsQuickNavOpen(!isQuickNavOpen);
                      }}
                      className="p-3 md:p-8 text-center w-full transition-all md:hover:bg-primary md:hover:text-surface-white group cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-xl md:text-5xl font-extrabold text-primary group-hover:text-surface-white tracking-tighter uppercase transition-colors">{selectedBook.name}</h2>
                        <ChevronDown className={`w-5 h-5 md:w-8 md:h-8 text-primary group-hover:text-surface-white transition-transform duration-300 ${isQuickNavOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <p className="text-primary group-hover:text-surface-white/80 font-bold mt-0.5 md:mt-2 text-xs md:text-lg tracking-widest uppercase transition-colors">Chapter {selectedChapter} &nbsp;&bull;&nbsp; {chapterVerses.length} Verses</p>
                    </button>
                    
                    {/* QUICK-NAV GRID OVERLAY */}
                    <div className={`absolute top-full left-0 right-0 bg-surface-white border-primary shadow-[0_8px_0px_0px_#1A1A1A] overflow-hidden transition-all duration-300 origin-top z-30 ${isQuickNavOpen ? 'max-h-96 opacity-100 border-b-4 border-t-2' : 'max-h-0 opacity-0 border-b-0 border-t-0'}`}>
                      <div className="p-4 md:p-6 overflow-y-auto max-h-96">
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
                          {chapterVerses.map(v => (
                            <button
                              key={v.verseNumber}
                              onClick={() => scrollToVerse(v.verseNumber)}
                              className="p-2 md:py-3 text-sm md:text-base font-bold bg-cream border-2 border-primary text-primary transition-all md:hover:bg-primary md:hover:text-surface-white active:scale-[0.98] active:translate-y-[0.5px] md:hover:-translate-y-1 md:hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
                            >
                              {v.verseNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SCROLLABLE TEXT WRAPPER */}
                  <div className="p-3 md:p-10 flex-1 overflow-y-auto space-y-4 md:space-y-6 bg-surface-white">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-none h-10 w-10 border-4 border-primary border-t-accent-red" />
                        <p className="text-lg text-primary font-bold uppercase tracking-widest">Rendering...</p>
                      </div>
                    ) : (
                      chapterVerses.map((v) => (
                        <div 
                          key={v._id} 
                          id={`verse-${v.verseNumber}`} 
                          data-book-name-en={ENGLISH_BOOK_NAMES[selectedBook?.bookNumber - 1] || selectedBook?.name}
                          data-book-name-reg={selectedBook?.name}
                          data-chapter={selectedChapter}
                          data-verse={v.verseNumber}
                          className="group flex items-start gap-4 p-4 border-2 border-primary bg-surface-white transition-all duration-100 ease-out md:hover:shadow-[6px_6px_0px_0px_#1A1A1A] md:hover:translate-x-[-2px] md:hover:translate-y-[-2px]"
                        >
                          <div className="flex flex-col items-center gap-2 mt-1 shrink-0">
                            <span className="text-sm font-bold text-surface-white bg-primary px-3 py-1.5 select-none">{v.verseNumber}</span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-8 transition-none script-container-lock">
                            {/* DYNAMIC LAYOUT CONTROL RENDERING */}
                            {(viewMode === 'parallel' || viewMode === 'single_english') && (
                              <div data-language="ENGLISH" className={`transition-none ${viewMode === 'parallel' ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                                <p className="text-primary leading-relaxed font-medium" style={{ fontSize: `calc(1.15rem * ${settings.fontScale})` }}>
                                  {v.translations?.KJV || <span className="text-primary/50 italic">Text Unavailable</span>}
                                </p>
                              </div>
                            )}
                            {(viewMode === 'parallel' || viewMode === 'single_regional') && (
                              <div data-language="REGIONAL" className={`transition-none ${viewMode === 'parallel' ? 'lg:col-span-1 border-t-4 border-primary pt-6 lg:border-t-0 lg:border-l-4 lg:pt-0 lg:pl-8' : 'lg:col-span-2'}`}>
                                <p className="text-primary font-sans font-semibold" style={{ fontSize: `calc(1.4rem * ${settings.fontScale * 0.9})`, lineHeight: 1.8 }}>
                                  {v.translations?.[selectedLanguage] || <span className="text-primary/50 italic">Text Unavailable</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-primary bg-surface-white">
                  <BookOpen className="h-16 w-16 mb-4" />
                  <p className="font-bold text-xl uppercase tracking-widest">Select a book</p>
                </div>
              )}
            </div>
          ) : (
            /* SEARCH TAB PANELS */
            <div className="max-w-4xl w-full mx-auto bg-surface-white border-4 border-primary shadow-[8px_8px_0px_0px_#1A1A1A] p-6 md:p-10 min-h-0 flex flex-col h-full overflow-hidden">
              <form onSubmit={handleSearch} className="flex gap-4 mb-8 shrink-0 flex-wrap sm:flex-nowrap">
                <div className="flex-1 relative w-full sm:w-auto">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-primary" />
                  <input
                    type="text"
                    placeholder="QUERY SCRIPTURE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[44px] min-w-[44px] pl-12 pr-4 py-3 bg-surface-white border-2 border-primary text-lg font-bold placeholder-primary/50 focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] md:focus:-translate-y-1 md:focus:-translate-x-1 transition-all"
                  />
                </div>
                <select
                  value={searchTranslation}
                  onChange={(e) => setSearchTranslation(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] min-w-[44px] bg-cream border-2 border-primary px-4 py-3 sm:py-0 text-lg font-bold uppercase tracking-wider text-primary focus:outline-none cursor-pointer appearance-none md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1 transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px]"
                >
                  <option value="">All Regions</option>
                  <option value="KJV">English (KJV)</option>
                  <option value="TELUGU">Telugu (తెలుగు)</option>
                </select>
                <button type="submit" disabled={searching} className="w-full sm:w-auto min-h-[44px] min-w-[44px] bg-primary text-surface-white font-extrabold text-lg px-8 py-3 sm:py-0 border-2 border-primary uppercase tracking-widest md:hover:bg-accent-red md:hover:shadow-[4px_4px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1 transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] disabled:opacity-50">
                  {searching ? 'Querying' : 'Search'}
                </button>
              </form>

              {/* SEARCH ENGINE MATCH OUTPUT CONTAINER */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {searching ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-accent-red" />
                  </div>
                ) : searchResults ? (
                  <>
                    <div className="border-b-4 border-primary pb-4 mb-4">
                      <p className="text-xl font-extrabold text-primary tracking-widest uppercase">Total Matches: {searchResults.length}</p>
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={result._id}
                        onClick={() => {
                           jumpToChapter(result.bookNumber, result.chapterNumber);
                           if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className="p-6 min-h-[44px] border-2 border-primary bg-cream md:hover:bg-surface-white cursor-pointer transition-all duration-100 ease-out active:scale-[0.98] active:translate-y-[0.5px] space-y-4 group md:hover:shadow-[6px_6px_0px_0px_#1A1A1A] md:hover:-translate-y-1 md:hover:-translate-x-1"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-lg font-extrabold text-primary md:group-hover:text-accent-red uppercase tracking-wider">
                            {(menuData.find(b => b.bookNumber === result.bookNumber)?.name) || `Book ${result.bookNumber}`} {result.chapterNumber}:{result.verseNumber}
                          </span>
                          <span className="text-sm text-surface-white bg-primary px-3 py-1.5 font-bold uppercase tracking-widest border-2 border-primary md:group-hover:bg-accent-red transition-colors inline-block w-fit">JUMP →</span>
                        </div>
                        <div className="space-y-3">
                          {result.translations?.KJV && <p className="text-primary leading-relaxed font-medium" style={{ fontSize: `calc(1.15rem * ${settings.fontScale})` }}>{highlightText(result.translations.KJV, searchQuery)}</p>}
                          {result.translations?.TELUGU && <p className="text-primary font-sans font-semibold border-t-2 border-primary pt-3" style={{ fontSize: `calc(1.4rem * ${settings.fontScale * 0.9})`, lineHeight: 1.8 }}>{highlightText(result.translations.TELUGU, searchQuery)}</p>}
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && (
                      <div className="text-center py-20 text-primary">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4" />
                        <p className="font-bold text-xl uppercase tracking-widest">No matches found</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-primary">
                    <Search className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-bold text-xl uppercase tracking-widest">Enter parameters to query</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}