{
	"translatorID": "ca65189f-8815-4afe-8c8b-8c7c15f0edca",
	"translatorType": 3,
	"label": "Better BibTeX",
	"creator": "Simon Kornblith, Richard Karnesky and Emiliano heyns",
	"target": "bib",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"priority": 199,
	"inRepository": false,
	"configOptions": {
		"async": true,
		"getCollections": true,
		"hash": "cffca401194c9d7f1899e4bcd1b01d09-fa4775b7be7887bf40f78c3a22c2b891"
	},
	"displayOptions": {
		"exportNotes": false,
		"exportFileData": false,
		"useJournalAbbreviation": false,
		"keepUpdated": false
	},
	"browserSupport": "gcsv",
	"lastUpdated": "2019-04-17 16:17:14"
}

var Translator = {
  initialize: function () {},
  BetterBibTeX: true,
  BetterTeX: true,
  BetterCSL: false,
  header: ZOTERO_TRANSLATOR_INFO,
  // header: < %- JSON.stringify(header) % >,
  preferences: {"DOIandURL":"both","ascii":"","asciiBibLaTeX":false,"asciiBibTeX":true,"autoAbbrev":false,"autoAbbrevStyle":"","autoExport":"immediate","autoExportDelay":1,"autoExportIdleWait":10,"autoExportPrimeExportCacheBatch":10,"autoExportPrimeExportCacheThreshold":0,"autoExportTooLong":10,"autoPin":false,"auxImport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"bibtexParticleNoOp":false,"bibtexURL":"off","cacheFlushInterval":5,"citeCommand":"cite","citekeyFold":true,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citeprocNoteCitekey":false,"csquotes":"","debug":false,"debugLog":"","git":"config","itemObserverDelay":100,"jabrefFormat":0,"keyConflictPolicy":"keep","keyScope":"library","kuroshiro":false,"lockedInit":false,"parseParticles":true,"postscript":"","preserveBibTeXVariables":false,"qualityReport":false,"quickCopyMode":"latex","quickCopyPandocBrackets":false,"rawLaTag":"#LaTeX","relativeFilePaths":false,"scrubDatabase":false,"skipFields":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","sorted":false,"strings":"","suppressBraceProtection":false,"suppressTitleCase":false,"testing":false,"warnBulkModify":10},
  options: {"exportFileData":false,"exportNotes":false,"keepUpdated":false,"useJournalAbbreviation":false},

  stringCompare: (new Intl.Collator('en')).compare,

  configure: function(stage) {
    var version = Zotero.BetterBibTeX.version();
    this.isZotero = version.Zotero.isZotero;
    this.isJurisM = version.Zotero.isJurisM;

    this.BetterCSL = this.BetterCSLYAML || this.BetterCSLJSON;

    this.debugEnabled = Zotero.BetterBibTeX.debugEnabled();
    this.unicode = true; // set by Better BibTeX later

    if (stage == 'detectImport') {
      this.options = {}
    } else {
      this.pathSep = (Zotero.BetterBibTeX.platform().toLowerCase().startsWith('win')) ? '\\' : '/'

      this.references = []

      for (var key in this.options) {
        if (typeof this.options[key] === 'boolean') {
          this.options[key] = !!Zotero.getOption(key)
        } else {
          this.options[key] = Zotero.getOption(key)
        }
      }
      // special handling

      if (stage === 'doExport') {
        this.options.exportPath = Zotero.getOption('exportPath')
        if (this.options.exportPath && !this.options.exportPath.endsWith(this.pathSep)) this.options.exportPath += this.pathSep
      }
    }

    for (const pref of Object.keys(this.preferences)) {
      let value = undefined

      try {
        value = Zotero.getOption(`preference_${pref}`)
      } catch (err) {
        value = undefined
      }

      if (typeof value === 'undefined') {
        value = Zotero.getHiddenPref('better-bibtex.' + pref)
        Zotero.debug(`preference load: ${pref} = ${value}`)
      } else {
        Zotero.debug(`preference override: ${pref} = ${value}`)
      }
      this.preferences[pref] = value
    }
    // special handling
    this.preferences.skipWords = this.preferences.skipWords.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    this.preferences.skipFields = this.preferences.skipFields.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    if (!this.preferences.rawLaTag) this.preferences.rawLaTag = '#LaTeX'
    Zotero.debug('prefs loaded: ' + JSON.stringify(this.preferences, null, 2))

    if (stage == 'doExport') {
      this.caching = !(
        // when exporting file data you get relative paths, when not, you get absolute paths, only one version can go into the cache
        this.options.exportFileData

        // jabref 4 stores collection info inside the reference, and collection info depends on which part of your library you're exporting
        || (this.BetterTeX && this.preferences.jabrefFormat === 4)

        // if you're looking at this.options.exportPath in the postscript you're probably outputting something different based on it
        || ((this.preferences.postscript || '').indexOf('Translator.options.exportPath') >= 0)
      )
      Zotero.debug('export caching:' + this.caching)
    }

    this.collections = {}
    if (stage == 'doExport' && this.header.configOptions && this.header.configOptions.getCollections && Zotero.nextCollection) {
      let collection
      while (collection = Zotero.nextCollection()) {
        let children = collection.children || collection.descendents || []
        let key = (collection.primary ? collection.primary : collection).key

        this.collections[key] = {
          id: collection.id,
          key: key,
          parent: collection.fields.parentKey,
          name: collection.name,
          items: collection.childItems,
          collections: children.filter(function(coll) { return coll.type === 'collection'}).map(function(coll) { return coll.key}),
          // items: (item.itemID for item in children when item.type != 'collection')
          // descendents: undefined
          // children: undefined
          // childCollections: undefined
          // primary: undefined
          // fields: undefined
          // type: undefined
          // level: undefined
        }
      }
      for (const collection of Object.values(this.collections)) {
        if (collection.parent && !this.collections[collection.parent]) {
          collection.parent = false
          Zotero.debug('BBT translator: collection with key ' + collection.key + ' has non-existent parent ' + collection.parent + ', assuming root collection')
        }
      }
    }
  }
};


function doExport() {
  const start = Date.now()
  Translator.configure('doExport')
  Translator.initialize()
  Translator.doExport()
  Zotero.debug("Better BibTeX" + ' export took ' + (Date.now() - start))
}



function detectImport() {
  Translator.configure('detectImport')
  return Translator.detectImport()
}
function doImport() {
  Translator.configure('doImport')
  Translator.initialize()
  return Translator.doImport()
}

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./Better BibTeX.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../content/arXiv.ts":
/*!***************************!*\
  !*** ../content/arXiv.ts ***!
  \***************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {


    Zotero.debug('zotero-better-bibtex: loading content/arXiv.ts')
  ; try { "use strict";
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
Object.defineProperty(exports, "__esModule", { value: true });
exports.arXiv = new class {
    constructor() {
        // new-style IDs
        // arXiv:0707.3168 [hep-th]
        // arXiv:YYMM.NNNNv# [category]
        this.post2007 = /(?:^|\s|\/)(?:arXiv:\s*)?(\d{4}\.\d{4,5}(?:v\d+)?)(?:\s\[(.*?)\])?(?=$|\s)/i;
        // arXiv:arch-ive/YYMMNNNv# or arXiv:arch-ive/YYMMNNNv# [category]
        this.pre2007 = /(?:^|\s|\/)(?:arXiv:\s*)?([a-z-]+(?:\.[A-Z]{2})?\/\d{2}(?:0[1-9]|1[012])\d{3}(?:v\d+)?(?=$|\s))/i;
    }
    parse(id) {
        if (!id)
            return { id: null };
        let match;
        if (match = this.post2007.exec(id)) {
            return { id: match[1], category: match[2] && match[2].trim() };
        }
        if (match = this.pre2007.exec(id)) {
            return { id: match[1] };
        }
        return { id: null };
    }
};
; 
    Zotero.debug('zotero-better-bibtex: loaded content/arXiv.ts')
  ; } catch ($wrap_loader_catcher_content_arXiv_ts) { 
    var $wrap_loader_message_content_arXiv_ts = 'Error: zotero-better-bibtex: load of content/arXiv.ts failed:' + $wrap_loader_catcher_content_arXiv_ts + '::' + $wrap_loader_catcher_content_arXiv_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_content_arXiv_ts)
    } else {
      Zotero.debug($wrap_loader_message_content_arXiv_ts)
    }
   };

/***/ }),

/***/ "../content/escape.ts":
/*!****************************!*\
  !*** ../content/escape.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {


    Zotero.debug('zotero-better-bibtex: loading content/escape.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function html(str) {
    const entity = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
    };
    // return str.replace(/[\u00A0-\u9999<>\&]/gim, c => entity[c] || `&#${c.charCodeAt(0)};`)
    return str.replace(/[<>\&"']/g, c => entity[c] || `&#${c.charCodeAt(0)};`);
}
exports.html = html;
function rtf(str) {
    return str
        .replace(/([{}\\])/g, '\\$1')
        .replace(/\n/g, '\\par ');
}
exports.rtf = rtf;
; 
    Zotero.debug('zotero-better-bibtex: loaded content/escape.ts')
  ; } catch ($wrap_loader_catcher_content_escape_ts) { 
    var $wrap_loader_message_content_escape_ts = 'Error: zotero-better-bibtex: load of content/escape.ts failed:' + $wrap_loader_catcher_content_escape_ts + '::' + $wrap_loader_catcher_content_escape_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_content_escape_ts)
    } else {
      Zotero.debug($wrap_loader_message_content_escape_ts)
    }
   };

/***/ }),

/***/ "../gen/itemfields.ts":
/*!****************************!*\
  !*** ../gen/itemfields.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {


    Zotero.debug('zotero-better-bibtex: loading gen/itemfields.ts')
  ; try { "use strict";
// tslint:disable:one-line
Object.defineProperty(exports, "__esModule", { value: true });
// don't take this from Translator.isZotero because that initializes after library load
const client = Zotero.BetterBibTeX.version().Zotero;
const zotero = client.isZotero;
const jurism = client.isJurisM;
exports.valid = new Map([
    ['conferencePaper', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['DOI', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['conferenceName', true],
            ['date', true],
            ['extra', true],
            ['institution', jurism],
            ['issue', jurism],
            ['language', true],
            ['libraryCatalog', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['series', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['journalArticle', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['DOI', true],
            ['ISSN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['issue', true],
            ['journalAbbreviation', true],
            ['language', true],
            ['libraryCatalog', true],
            ['pages', true],
            ['publicationTitle', true],
            ['rights', true],
            ['series', true],
            ['seriesText', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['audioRecording', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['numberOfVolumes', true],
            ['place', true],
            ['publisher', true],
            ['rights', true],
            ['runningTime', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['book', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', jurism],
            ['numPages', true],
            ['numberOfVolumes', true],
            ['place', true],
            ['publisher', true],
            ['rights', true],
            ['series', true],
            ['seriesNumber', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['bookSection', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['numberOfVolumes', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['series', true],
            ['seriesNumber', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['computerProgram', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['libraryCatalog', true],
            ['place', true],
            ['programmingLanguage', true],
            ['publisher', true],
            ['rights', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['system', true],
            ['title', true],
            ['url', true],
            ['versionNumber', true],
        ]),
    ],
    ['dictionaryEntry', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['numberOfVolumes', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['series', true],
            ['seriesNumber', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['encyclopediaArticle', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['numberOfVolumes', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['series', true],
            ['seriesNumber', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['map', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['place', true],
            ['publisher', true],
            ['rights', true],
            ['scale', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['videoRecording', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISBN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['numberOfVolumes', true],
            ['place', true],
            ['publisher', true],
            ['rights', true],
            ['runningTime', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
            ['websiteTitle', jurism],
        ]),
    ],
    ['magazineArticle', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISSN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['issue', true],
            ['language', true],
            ['libraryCatalog', true],
            ['pages', true],
            ['place', jurism],
            ['publicationTitle', true],
            ['publisher', jurism],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['newspaperArticle', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['ISSN', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['court', jurism],
            ['date', true],
            ['edition', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', true],
            ['rights', true],
            ['section', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['artwork', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['artworkSize', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['publicationTitle', jurism],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['bill', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archiveLocation', jurism],
            ['code', true],
            ['date', true],
            ['extra', true],
            ['history', true],
            ['language', true],
            ['legislativeBody', true],
            ['number', true],
            ['pages', true],
            ['rights', true],
            ['section', true],
            ['session', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['blogPost', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['publicationTitle', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['case', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', jurism],
            ['archiveLocation', jurism],
            ['callNumber', jurism],
            ['court', true],
            ['date', true],
            ['extra', true],
            ['filingDate', jurism],
            ['history', true],
            ['issue', jurism],
            ['language', true],
            ['number', true],
            ['pages', true],
            ['place', jurism],
            ['publicationTitle', jurism],
            ['publisher', jurism],
            ['reporter', zotero],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', true],
        ]),
    ],
    ['classic', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', jurism],
            ['accessDate', jurism],
            ['archive', jurism],
            ['archiveLocation', jurism],
            ['callNumber', jurism],
            ['date', jurism],
            ['extra', jurism],
            ['language', jurism],
            ['libraryCatalog', jurism],
            ['numPages', jurism],
            ['place', jurism],
            ['rights', jurism],
            ['shortTitle', jurism],
            ['title', jurism],
            ['type', jurism],
            ['url', jurism],
            ['volume', jurism],
        ]),
    ],
    ['document', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['publisher', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['versionNumber', jurism],
        ]),
    ],
    ['email', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['film', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['publisher', true],
            ['rights', true],
            ['runningTime', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['forumPost', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['publicationTitle', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['gazette', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', jurism],
            ['accessDate', jurism],
            ['code', jurism],
            ['codeNumber', jurism],
            ['date', jurism],
            ['extra', jurism],
            ['history', jurism],
            ['language', jurism],
            ['number', jurism],
            ['pages', jurism],
            ['publisher', jurism],
            ['rights', jurism],
            ['section', jurism],
            ['session', jurism],
            ['shortTitle', jurism],
            ['title', jurism],
            ['url', jurism],
        ]),
    ],
    ['hearing', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archiveLocation', jurism],
            ['committee', true],
            ['date', true],
            ['extra', true],
            ['history', true],
            ['language', true],
            ['legislativeBody', true],
            ['number', true],
            ['numberOfVolumes', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', jurism],
            ['publisher', true],
            ['rights', true],
            ['session', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
            ['volume', jurism],
        ]),
    ],
    ['instantMessage', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['interview', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['place', jurism],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['letter', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['manuscript', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['numPages', true],
            ['place', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['patent', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['applicationNumber', true],
            ['assignee', true],
            ['country', true],
            ['date', true],
            ['extra', true],
            ['filingDate', true],
            ['genre', jurism],
            ['issuingAuthority', true],
            ['language', true],
            ['legalStatus', true],
            ['number', true],
            ['pages', true],
            ['place', true],
            ['priorityNumbers', true],
            ['references', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['podcast', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', jurism],
            ['extra', true],
            ['language', true],
            ['medium', true],
            ['number', true],
            ['publisher', jurism],
            ['rights', true],
            ['runningTime', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['presentation', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['meetingName', true],
            ['place', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['radioBroadcast', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['number', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['runningTime', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['regulation', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', jurism],
            ['accessDate', jurism],
            ['code', jurism],
            ['codeNumber', jurism],
            ['date', jurism],
            ['extra', jurism],
            ['history', jurism],
            ['language', jurism],
            ['number', jurism],
            ['pages', jurism],
            ['publisher', jurism],
            ['rights', jurism],
            ['section', jurism],
            ['session', jurism],
            ['shortTitle', jurism],
            ['title', jurism],
            ['url', jurism],
        ]),
    ],
    ['report', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['committee', jurism],
            ['date', true],
            ['extra', true],
            ['institution', jurism],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', jurism],
            ['number', true],
            ['pages', true],
            ['place', true],
            ['publicationTitle', jurism],
            ['publisher', zotero],
            ['rights', true],
            ['seriesTitle', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['standard', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', jurism],
            ['accessDate', jurism],
            ['archive', jurism],
            ['archiveLocation', jurism],
            ['callNumber', jurism],
            ['date', jurism],
            ['extra', jurism],
            ['language', jurism],
            ['libraryCatalog', jurism],
            ['number', jurism],
            ['publisher', jurism],
            ['rights', jurism],
            ['shortTitle', jurism],
            ['title', jurism],
            ['url', jurism],
            ['versionNumber', jurism],
        ]),
    ],
    ['statute', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['code', true],
            ['codeNumber', true],
            ['date', true],
            ['extra', true],
            ['history', true],
            ['language', true],
            ['number', true],
            ['pages', true],
            ['publisher', jurism],
            ['rights', true],
            ['section', true],
            ['session', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['thesis', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['numPages', true],
            ['place', true],
            ['publisher', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['treaty', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', jurism],
            ['accessDate', jurism],
            ['archive', jurism],
            ['archiveLocation', jurism],
            ['callNumber', jurism],
            ['date', jurism],
            ['extra', jurism],
            ['language', jurism],
            ['libraryCatalog', jurism],
            ['pages', jurism],
            ['publisher', jurism],
            ['reporter', jurism],
            ['rights', jurism],
            ['section', jurism],
            ['shortTitle', jurism],
            ['title', jurism],
            ['url', jurism],
            ['volume', jurism],
        ]),
    ],
    ['tvBroadcast', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['archive', true],
            ['archiveLocation', true],
            ['callNumber', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['libraryCatalog', true],
            ['medium', true],
            ['number', true],
            ['place', true],
            ['publicationTitle', true],
            ['publisher', true],
            ['rights', true],
            ['runningTime', true],
            ['shortTitle', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['webpage', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['abstractNote', true],
            ['accessDate', true],
            ['date', true],
            ['extra', true],
            ['language', true],
            ['publicationTitle', true],
            ['rights', true],
            ['shortTitle', true],
            ['title', true],
            ['type', true],
            ['url', true],
        ]),
    ],
    ['attachment', new Map([
            ['itemType', true],
            ['creators', true],
            ['tags', true],
            ['attachments', true],
            ['notes', true],
            ['seeAlso', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
            ['multi', true],
            ['accessDate', true],
            ['title', true],
            ['url', true],
        ]),
    ],
    ['note', new Map([
            ['itemType', true],
            ['tags', true],
            ['note', true],
            ['id', true],
            ['itemID', true],
            ['dateAdded', true],
            ['dateModified', true],
        ]),
    ],
]);
function unalias(item) {
    // date
    if (typeof item.dateDecided !== 'undefined') {
        item.date = item.dateDecided;
        delete item.dateDecided;
    }
    else if (jurism && typeof item.dateEnacted !== 'undefined') {
        item.date = item.dateEnacted;
        delete item.dateEnacted;
    }
    else if (typeof item.dateEnacted !== 'undefined') {
        item.date = item.dateEnacted;
        delete item.dateEnacted;
    }
    else if (typeof item.issueDate !== 'undefined') {
        item.date = item.issueDate;
        delete item.issueDate;
    }
    // medium
    if (typeof item.artworkMedium !== 'undefined') {
        item.medium = item.artworkMedium;
        delete item.artworkMedium;
    }
    else if (typeof item.audioFileType !== 'undefined') {
        item.medium = item.audioFileType;
        delete item.audioFileType;
    }
    else if (typeof item.audioRecordingFormat !== 'undefined') {
        item.medium = item.audioRecordingFormat;
        delete item.audioRecordingFormat;
    }
    else if (typeof item.interviewMedium !== 'undefined') {
        item.medium = item.interviewMedium;
        delete item.interviewMedium;
    }
    else if (typeof item.videoRecordingFormat !== 'undefined') {
        item.medium = item.videoRecordingFormat;
        delete item.videoRecordingFormat;
    }
    // number
    if (typeof item.billNumber !== 'undefined') {
        item.number = item.billNumber;
        delete item.billNumber;
    }
    else if (typeof item.docketNumber !== 'undefined') {
        item.number = item.docketNumber;
        delete item.docketNumber;
    }
    else if (typeof item.documentNumber !== 'undefined') {
        item.number = item.documentNumber;
        delete item.documentNumber;
    }
    else if (typeof item.episodeNumber !== 'undefined') {
        item.number = item.episodeNumber;
        delete item.episodeNumber;
    }
    else if (typeof item.patentNumber !== 'undefined') {
        item.number = item.patentNumber;
        delete item.patentNumber;
    }
    else if (jurism && typeof item.publicLawNumber !== 'undefined') {
        item.number = item.publicLawNumber;
        delete item.publicLawNumber;
    }
    else if (typeof item.publicLawNumber !== 'undefined') {
        item.number = item.publicLawNumber;
        delete item.publicLawNumber;
    }
    else if (typeof item.reportNumber !== 'undefined') {
        item.number = item.reportNumber;
        delete item.reportNumber;
    }
    // pages
    if (typeof item.codePages !== 'undefined') {
        item.pages = item.codePages;
        delete item.codePages;
    }
    else if (typeof item.firstPage !== 'undefined') {
        item.pages = item.firstPage;
        delete item.firstPage;
    }
    // publicationTitle
    if (typeof item.blogTitle !== 'undefined') {
        item.publicationTitle = item.blogTitle;
        delete item.blogTitle;
    }
    else if (typeof item.bookTitle !== 'undefined') {
        item.publicationTitle = item.bookTitle;
        delete item.bookTitle;
    }
    else if (jurism && typeof item.bookTitle !== 'undefined') {
        item.publicationTitle = item.bookTitle;
        delete item.bookTitle;
    }
    else if (typeof item.dictionaryTitle !== 'undefined') {
        item.publicationTitle = item.dictionaryTitle;
        delete item.dictionaryTitle;
    }
    else if (typeof item.encyclopediaTitle !== 'undefined') {
        item.publicationTitle = item.encyclopediaTitle;
        delete item.encyclopediaTitle;
    }
    else if (typeof item.forumTitle !== 'undefined') {
        item.publicationTitle = item.forumTitle;
        delete item.forumTitle;
    }
    else if (typeof item.proceedingsTitle !== 'undefined') {
        item.publicationTitle = item.proceedingsTitle;
        delete item.proceedingsTitle;
    }
    else if (typeof item.programTitle !== 'undefined') {
        item.publicationTitle = item.programTitle;
        delete item.programTitle;
    }
    else if (jurism && typeof item.reporter !== 'undefined') {
        item.publicationTitle = item.reporter;
        delete item.reporter;
    }
    else if (jurism && typeof item.websiteTitle !== 'undefined') {
        item.publicationTitle = item.websiteTitle;
        delete item.websiteTitle;
    }
    else if (typeof item.websiteTitle !== 'undefined') {
        item.publicationTitle = item.websiteTitle;
        delete item.websiteTitle;
    }
    // publisher
    if (typeof item.company !== 'undefined') {
        item.publisher = item.company;
        delete item.company;
    }
    else if (typeof item.distributor !== 'undefined') {
        item.publisher = item.distributor;
        delete item.distributor;
    }
    else if (zotero && typeof item.institution !== 'undefined') {
        item.publisher = item.institution;
        delete item.institution;
    }
    else if (typeof item.label !== 'undefined') {
        item.publisher = item.label;
        delete item.label;
    }
    else if (typeof item.network !== 'undefined') {
        item.publisher = item.network;
        delete item.network;
    }
    else if (typeof item.studio !== 'undefined') {
        item.publisher = item.studio;
        delete item.studio;
    }
    else if (typeof item.university !== 'undefined') {
        item.publisher = item.university;
        delete item.university;
    }
    // title
    if (typeof item.caseName !== 'undefined') {
        item.title = item.caseName;
        delete item.caseName;
    }
    else if (jurism && typeof item.nameOfAct !== 'undefined') {
        item.title = item.nameOfAct;
        delete item.nameOfAct;
    }
    else if (typeof item.nameOfAct !== 'undefined') {
        item.title = item.nameOfAct;
        delete item.nameOfAct;
    }
    else if (typeof item.subject !== 'undefined') {
        item.title = item.subject;
        delete item.subject;
    }
    // type
    if (typeof item.genre !== 'undefined') {
        item.type = item.genre;
        delete item.genre;
    }
    else if (typeof item.letterType !== 'undefined') {
        item.type = item.letterType;
        delete item.letterType;
    }
    else if (jurism && typeof item.manuscriptType !== 'undefined') {
        item.type = item.manuscriptType;
        delete item.manuscriptType;
    }
    else if (typeof item.manuscriptType !== 'undefined') {
        item.type = item.manuscriptType;
        delete item.manuscriptType;
    }
    else if (typeof item.mapType !== 'undefined') {
        item.type = item.mapType;
        delete item.mapType;
    }
    else if (typeof item.postType !== 'undefined') {
        item.type = item.postType;
        delete item.postType;
    }
    else if (typeof item.presentationType !== 'undefined') {
        item.type = item.presentationType;
        delete item.presentationType;
    }
    else if (typeof item.reportType !== 'undefined') {
        item.type = item.reportType;
        delete item.reportType;
    }
    else if (typeof item.thesisType !== 'undefined') {
        item.type = item.thesisType;
        delete item.thesisType;
    }
    else if (typeof item.websiteType !== 'undefined') {
        item.type = item.websiteType;
        delete item.websiteType;
    }
    // volume
    if (typeof item.codeVolume !== 'undefined') {
        item.volume = item.codeVolume;
        delete item.codeVolume;
    }
    else if (typeof item.reporterVolume !== 'undefined') {
        item.volume = item.reporterVolume;
        delete item.reporterVolume;
    }
}
// import & export translators expect different creator formats... nice
function simplifyForExport(item, dropAttachments = false) {
    unalias(item);
    item.tags = item.tags ? item.tags.map(tag => tag.tag) : [];
    item.notes = item.notes ? item.notes.map(note => note.note || note) : [];
    if (item.filingDate)
        item.filingDate = item.filingDate.replace(/^0000-00-00 /, '');
    if (item.creators) {
        for (const creator of item.creators) {
            if (creator.fieldMode) {
                creator.name = creator.name || creator.lastName;
                delete creator.lastName;
                delete creator.firstName;
                delete creator.fieldMode;
            }
        }
    }
    if (dropAttachments)
        item.attachments = [];
    return item;
}
exports.simplifyForExport = simplifyForExport;
function simplifyForImport(item) {
    unalias(item);
    if (item.creators) {
        for (const creator of item.creators) {
            if (creator.name) {
                creator.lastName = creator.lastName || creator.name;
                creator.fieldMode = 1;
                delete creator.firstName;
                delete creator.name;
            }
        }
    }
    return item;
}
exports.simplifyForImport = simplifyForImport;
; 
    Zotero.debug('zotero-better-bibtex: loaded gen/itemfields.ts')
  ; } catch ($wrap_loader_catcher_gen_itemfields_ts) { 
    var $wrap_loader_message_gen_itemfields_ts = 'Error: zotero-better-bibtex: load of gen/itemfields.ts failed:' + $wrap_loader_catcher_gen_itemfields_ts + '::' + $wrap_loader_catcher_gen_itemfields_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_gen_itemfields_ts)
    } else {
      Zotero.debug($wrap_loader_message_gen_itemfields_ts)
    }
   };

/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/const.js":
/*!***********************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/const.js ***!
  \***********************************************************/
/*! exports provided: BibFieldTypes, BibTypes */
/*! exports used: BibFieldTypes, BibTypes */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibFieldTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return BibTypes; });
/*::
export type MarkObject = {
    type: string;
}

type OtherNodeObject = {
    type: string;
    marks?: Array<MarkObject>;
    attrs?: Object;
}

export type TextNodeObject = {
    type: 'text';
    text: string;
    marks?: Array<MarkObject>;
    attrs?: Object;
}

export type NodeObject = OtherNodeObject | TextNodeObject;

export type NodeArray = Array<NodeObject>;

export type EntryObject = {
    entry_key: string;
    incomplete?: boolean;
    bib_type: string;
    fields: Object;
    unexpected_fields?: Object;
    unknown_fields?: UnknownFieldsObject;
}

export type NameDictObject = {
    literal?: NodeArray;
    family?: NodeArray;
    given?: NodeArray;
    prefix?: NodeArray;
    suffix?: NodeArray;
    useprefix?: boolean;
}

export type GroupObject = {
    name: string;
    references: Array<string>;
    groups: Array<GroupObject>;
}

export type RangeArray = [NodeArray, NodeArray] | [NodeArray];

*/

/** A list of supported languages (without aliases)  in the langid field */
const langidOptions = {
    "acadian": {
        "csl": "fr-CA",
        "biblatex": "acadian"
    },
    "afrikaans": {
        "csl": "af-ZA",
        "biblatex": "afrikaans"
    },
    "arabic": {
        "csl": "ar",
        "biblatex": "arabic"
    },
    "basque": {
        "csl": "eu",
        "biblatex": "basque"
    },
    "bulgarian": {
        "csl": "bg-BG",
        "biblatex": "bulgarian"
    },
    "catalan": {
        "csl": "ca-AD",
        "biblatex": "catalan"
    },
    "chinese": {
        "csl": "zh-CN",
        "biblatex": "pinyin"
    },
    "croatian": {
        "csl": "hr-HR",
        "biblatex": "croatian"
    },
    "czech": {
        "csl": "cs-CZ",
        "biblatex": "czech"
    },
    "danish": {
        "csl": "da-DK",
        "biblatex": "danish"
    },
    "dutch": {
        "csl": "nl-NL",
        "biblatex": "dutch"
    },
    "auenglish": {
        "csl": "en-GB",
        "biblatex": "australian"
    },
    "caenglish": {
        "csl": "en-US",
        "biblatex": "canadian"
    },
    "nzenglish": {
        "csl": "en-GB",
        "biblatex": "newzealand"
    },
    "ukenglish": {
        "csl": "en-GB",
        "biblatex": "ukenglish"
    },
    "usenglish": {
        "csl": "en-US",
        "biblatex": "usenglish"
    },
    "estonian": {
        "csl": "et-EE",
        "biblatex": "estonian"
    },
    "finnish": {
        "csl": "fi-FI",
        "biblatex": "finnish"
    },
    "french": {
        "csl": "fr-FR",
        "biblatex": "french"
    },
    "cafrench": {
        "csl": "fr-CA",
        "biblatex": "canadien"
    },
    "german": {
        "csl": "de-DE",
        "biblatex": "ngerman"
    },
    "atgerman": {
        "csl": "de-AT",
        "biblatex": "naustrian"
    },
    "greek": {
        "csl": "el-GR",
        "biblatex": "greek"
    },
    "hebrew": {
        "csl": "he-IL",
        "biblatex": "hebrew"
    },
    "hungarian": {
        "csl": "hu-HU",
        "biblatex": "hungarian"
    },
    "icelandic": {
        "csl": "is-IS",
        "biblatex": "icelandic"
    },
    "italian": {
        "csl": "it-IT",
        "biblatex": "italian"
    },
    "japanese": {
        "csl": "ja-JP",
        "biblatex": "japanese"
    },
    "latin": {
        "csl": "la",
        "biblatex": "latin"
    },
    "latvian": {
        "csl": "lv-LV",
        "biblatex": "latvian"
    },
    "lithuanian": {
        "csl": "lt-LT",
        "biblatex": "lithuanian"
    },
    "magyar": {
        "csl": "hu-HU",
        "biblatex": "magyar"
    },
    "mongolian": {
        "csl": "mn-MN",
        "biblatex": "mongolian"
    },
    "norwegian": {
        "csl": "nb-NO",
        "biblatex": "norsk"
    },
    "newnorwegian": {
        "csl": "nn-NO",
        "biblatex": "nynorsk"
    },
    "farsi": {
        "csl": "fa-IR",
        "biblatex": "farsi"
    },
    "polish": {
        "csl": "pl-PL",
        "biblatex": "polish"
    },
    "portuguese": {
        "csl": "pt-PT",
        "biblatex": "portuguese"
    },
    "brportuguese": {
        "csl": "pt-BR",
        "biblatex": "brazilian"
    },
    "romanian": {
        "csl": "ro-RO",
        "biblatex": "romanian"
    },
    "russian": {
        "csl": "ru-RU",
        "biblatex": "russian"
    },
    "serbian": {
        "csl": "sr-RS",
        "biblatex": "serbian"
    },
    "cyrillicserbian": {
        "csl": "sr-RS",
        "biblatex": "serbianc"
    },
    "slovak": {
        "csl": "sk-SK",
        "biblatex": "slovak"
    },
    "slovene": {
        "csl": "sl-SL",
        "biblatex": "slovene"
    },
    "spanish": {
        "csl": "es-ES",
        "biblatex": "spanish"
    },
    "swedish": {
        "csl": "sv-SE",
        "biblatex": "swedish"
    },
    "thai": {
        "csl": "th-TH",
        "biblatex": "thai"
    },
    "turkish": {
        "csl": "tr-TR",
        "biblatex": "turkish"
    },
    "ukrainian": {
        "csl": "uk-UA",
        "biblatex": "ukrainian"
    },
    "vietnamese": {
        "csl": "vi-VN",
        "biblatex": "vietnamese"
    }
}

const pubstateOptions = {
    "inpreparation": {
        "csl": "in preparation",
        "biblatex": "inpreparation"
    },
    "submitted": {
        "csl": "submitted",
        "biblatex": "submitted"
    },
    "forthcoming": {
        "csl": "forthcoming",
        "biblatex": "forthcoming"
    },
    "inpress": {
        "csl": "in press",
        "biblatex": "inpress"
    },
    "prepublished": {
        "csl": "prepublished",
        "biblatex": "prepublished"
    }
}

const languageOptions = ['catalan', 'croatian', 'czech', 'danish',
'dutch', 'english', 'american', 'finnish', 'french', 'german', 'greek',
'italian', 'latin', 'norwegian', 'polish', 'portuguese', 'brazilian', 'russian',
'slovene', 'spanish', 'swedish']


/** A list of field types of Bibligraphy DB with lookup by field name. */
const BibFieldTypes = {
    'abstract': {
        type: 'f_long_literal',
        biblatex: 'abstract',
        csl: 'abstract'
    },
    'addendum': {
        type: 'f_literal',
        biblatex: 'addendum'
    },
    'afterword': {
        type: 'l_name',
        biblatex: 'afterword'
    },
    'annotation': {
        type: 'f_long_literal',
        biblatex: 'annotation'
    },
    'annotator': {
        type: 'l_name',
        biblatex: 'annotator'
    },
    'author': {
        type: 'l_name',
        biblatex: 'author',
        csl: 'author'
    },
    'bookauthor': {
        type: 'l_name',
        biblatex: 'bookauthor',
        csl: 'container-author'
    },
    'bookpagination': {
        type: 'f_key',
        biblatex: 'bookpagination',
        options: ['page', 'column', 'section', 'paragraph', 'verse', 'line']
    },
    'booksubtitle': {
        type: 'f_title',
        biblatex: 'booksubtitle'
    },
    'booktitle': {
        type: 'f_title',
        biblatex: 'booktitle',
        csl: 'container-title'
    },
    'booktitleaddon': {
        type: 'f_title',
        biblatex: 'booktitleaddon'
    },
    'chapter': {
        type: 'f_literal',
        biblatex: 'chapter',
        csl: 'chapter-number'
    },
    'commentator': {
        type: 'l_name',
        biblatex: 'commentator'
    },
    'date': {
        type: 'f_date',
        biblatex: 'date',
        csl: 'issued'
    },
    'doi': {
        type: 'f_verbatim',
        biblatex: 'doi',
        csl: 'DOI'
    },
    'edition': {
        type: 'f_integer',
        biblatex: 'edition',
        csl: 'edition'
    },
    'editor': {
        type: 'l_name',
        biblatex: 'editor',
        csl: 'editor'
    },
    'editora': {
        type: 'l_name',
        biblatex: 'editora'
    },
    'editorb': {
        type: 'l_name',
        biblatex: 'editorb'
    },
    'editorc': {
        type: 'l_name',
        biblatex: 'editorc'
    },
    'editortype': {
        type: 'f_key',
        biblatex: 'editortype',
        options: ['editor', 'compiler', 'founder', 'continuator', 'redactor', 'reviser', 'collaborator']
    },
    'editoratype': {
        type: 'f_key',
        biblatex: 'editoratype',
        options: ['editor', 'compiler', 'founder', 'continuator', 'redactor', 'reviser', 'collaborator']
    },
    'editorbtype': {
        type: 'f_key',
        biblatex: 'editorbtype',
        options: ['editor', 'compiler', 'founder', 'continuator', 'redactor', 'reviser', 'collaborator']
    },
    'editorctype': {
        type: 'f_key',
        biblatex: 'editorctype',
        options: ['editor', 'compiler', 'founder', 'continuator', 'redactor', 'reviser', 'collaborator']
    },
    'eid': {
        type: 'f_literal',
        biblatex: 'eid'
    },
    'entrysubtype': {
        type: 'f_literal',
        biblatex: 'entrysubtype'
    },
    'eprint': {
        type: 'f_verbatim',
        biblatex: 'eprint'
    },
    'eprintclass': {
        type: 'f_literal',
        biblatex: 'eprintclass'
    },
    'eprinttype': {
        type: 'f_literal',
        biblatex: 'eprinttype'
    },
    'eventdate': {
        type: 'f_date',
        biblatex: 'eventdate',
        csl: 'event-date'
    },
    'eventtitle': {
        type: 'f_title',
        biblatex: 'eventtitle',
        csl: 'event'
    },
    'file': {
        type: 'f_verbatim',
        biblatex: 'file'
    },
    'foreword': {
        type: 'l_name',
        biblatex: 'foreword'
    },
    'holder': {
        type: 'l_name',
        biblatex: 'holder'
    },
    'howpublished': {
        type: 'f_literal',
        biblatex: 'howpublished',
        csl: 'medium'
    },
    'indextitle': {
        type: 'f_literal',
        biblatex: 'indextitle'
    },
    'institution': {
        type: 'l_literal',
        biblatex: 'institution'
    },
    'introduction': {
        type: 'l_name',
        biblatex: 'introduction'
    },
    'isan': {
        type: 'f_literal',
        biblatex: 'isan'
    },
    'isbn': {
        type: 'f_literal',
        biblatex: 'isbn',
        csl: 'ISBN'
    },
    'ismn': {
        type: 'f_literal',
        biblatex: 'ismn'
    },
    'isrn': {
        type: 'f_literal',
        biblatex: 'isrn'
    },
    'issn': {
        type: 'f_literal',
        biblatex: 'issn',
        csl: 'ISSN'
    },
    'issue': {
        type: 'f_literal',
        biblatex: 'issue',
        csl: 'issue'
    },
    'issuesubtitle': {
        type: 'f_literal',
        biblatex: 'issuesubtitle'
    },
    'issuetitle': {
        type: 'f_literal',
        biblatex: 'issuetitle'
    },
    'iswc': {
        type: 'f_literal',
        biblatex: 'iswc'
    },
    'journalsubtitle': {
        type: 'f_literal',
        biblatex: 'journalsubtitle'
    },
    'journaltitle': {
        type: 'f_literal',
        biblatex: 'journaltitle',
        csl: 'container-title'
    },
    'keywords': {
        type: 'l_tag',
        biblatex: 'keywords'
    },
    'label': {
        type: 'f_literal',
        biblatex: 'label'
    },
    'language': {
        type: 'l_key',
        biblatex: 'language',
        options: languageOptions
    },
    'langid': {
        type: 'f_key',
        strict: true, // Does not allow costum strings
        biblatex: 'langid',
        csl: 'language',
        options: langidOptions
    },
    'library': {
        type: 'f_literal',
        biblatex: 'library'
    },
    'location': {
        type: 'l_literal',
        biblatex: 'location',
        csl: 'publisher-place'
    },
    'mainsubtitle': {
        type: 'f_title',
        biblatex: 'mainsubtitle'
    },
    'maintitle': {
        type: 'f_title',
        biblatex: 'maintitle'
    },
    'maintitleaddon': {
        type: 'f_title',
        biblatex: 'maintitleaddon'
    },
    'nameaddon': {
        type: 'f_literal',
        biblatex: 'nameaddon'
    },
    'note': {
        type: 'f_literal',
        biblatex: 'note',
        csl: 'note'
    },
    'number': {
        type: 'f_literal',
        biblatex: 'number',
        csl: 'number'
    },
    'organization': {
        type: 'l_literal',
        biblatex: 'organization'
    },
    'origdate': {
        type: 'f_date',
        biblatex: 'origdate',
        csl: 'original-date'
    },
    'origlanguage': {
        type: 'f_key',
        biblatex: 'origlanguage',
        options: languageOptions
    },
    'origlocation': {
        type: 'l_literal',
        biblatex: 'origlocation',
        csl: 'original-publisher-place'
    },
    'origpublisher': {
        type: 'l_literal',
        biblatex: 'origpublisher',
        csl: 'original-publisher'
    },
    'origtitle': {
        type: 'f_title',
        biblatex: 'origtitle',
        csl: 'original-title'
    },
    'pages': {
        type: 'l_range',
        biblatex: 'pages',
        csl: 'page'
    },
    'pagetotal': {
        type: 'f_literal',
        biblatex: 'pagetotal',
        csl: 'number-of-pages'
    },
    'pagination': {
        type: 'f_key',
        biblatex: 'pagination',
        options: ['page', 'column', 'section', 'paragraph', 'verse', 'line']
    },
    'part': {
        type: 'f_literal',
        biblatex: 'part'
    },
    'publisher': {
        type: 'l_literal',
        biblatex: 'publisher',
        csl: 'publisher'
    },
    'pubstate': {
        type: 'f_key',
        biblatex: 'pubstate',
        csl: 'status',
        options: pubstateOptions
    },
    'reprinttitle': {
        type: 'f_literal',
        biblatex: 'reprinttitle'
    },
    'series': {
        type: 'f_literal',
        biblatex: 'series',
        csl: 'collection-title'
    },
    'shortauthor': {
        type: 'l_name',
        biblatex: 'shortauthor'
    },
    'shorteditor': {
        type: 'l_name',
        biblatex: 'shorteditor'
    },
    'shorthand': {
        type: 'f_literal',
        biblatex: 'shorthand'
    },
    'shorthandintro': {
        type: 'f_literal',
        biblatex: 'shorthandintro'
    },
    'shortjournal': {
        type: 'f_literal',
        biblatex: 'shortjournal',
        csl: 'container-title-short'
    },
    'shortseries': {
        type: 'f_literal',
        biblatex: 'shortseries'
    },
    'shorttitle': {
        type: 'f_literal',
        biblatex: 'shorttitle',
        csl: 'title-short'
    },
    'subtitle': {
        type: 'f_title',
        biblatex: 'subtitle'
    },
    'title': {
        type: 'f_title',
        biblatex: 'title',
        csl: 'title'
    },
    'titleaddon': {
        type: 'f_title',
        biblatex: 'titleaddon'
    },
    'translator': {
        type: 'l_name',
        biblatex: 'translator',
        csl: 'translator'
    },
    'type': {
        type: 'f_key',
        biblatex: 'type',
        options: ['manual', 'patent', 'report', 'thesis', 'mathesis', 'phdthesis', 'candthesis', 'techreport', 'resreport', 'software', 'datacd', 'audiocd']
    },
    'url': {
        type: 'f_uri',
        biblatex: 'url',
        csl: 'URL'
    },
    'urldate': {
        type: 'f_date',
        biblatex: 'urldate',
        csl: 'accessed'
    },
    'venue': {
        type: 'f_literal',
        biblatex: 'venue',
        csl: 'event-place'
    },
    'version': {
        type: 'f_literal',
        biblatex: 'version',
        csl: 'version'
    },
    'volume': {
        type: 'f_literal',
        biblatex: 'volume',
        csl: 'volume'
    },
    'volumes': {
        type: 'f_literal',
        biblatex: 'volumes',
        csl: 'number-of-volumes'
    }
}

/** A list of all bib types and their fields. */
const BibTypes = {
    "article": {
        "order": 1,
        "biblatex": "article",
        "csl": "article",
        "required": ["journaltitle", "title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "annotator", "commentator", "doi", "editor", "editora", "editorb", "editorc", "eid", "eprint", "eprintclass", "eprinttype", "issn", "issue", "issuesubtitle", "issuetitle", "journalsubtitle", "language", "langid", "note", "number", "origlanguage", "pages", "pagination", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "version", "volume", "annotation", "keywords"]
    },
    "article-magazine": {
        "order": 2,
        "biblatex": "article",
        "csl": "article-magazine",
        "required": ["journaltitle", "title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "annotator", "commentator", "doi", "editor", "editora", "editorb", "editorc", "eid", "eprint", "eprintclass", "eprinttype", "issn", "issue", "issuesubtitle", "issuetitle", "journalsubtitle", "language", "langid", "note", "number", "origlanguage", "pages", "pagination", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "version", "volume", "annotation", "keywords"]
    },
    "article-newspaper": {
        "order": 3,
        "biblatex": "article",
        "csl": "article-newspaper",
        "required": ["journaltitle", "title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "annotator", "commentator", "doi", "editor", "editora", "editorb", "editorc", "eid", "eprint", "eprintclass", "eprinttype", "issn", "issue", "issuesubtitle", "issuetitle", "journalsubtitle", "language", "langid", "note", "number", "origlanguage", "pages", "pagination", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "version", "volume", "annotation", "keywords"]
    },
    "article-journal": {
        "order": 4,
        "biblatex": "article",
        "csl": "article-journal",
        "required": ["journaltitle", "title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "annotator", "commentator", "doi", "editor", "editora", "editorb", "editorc", "eid", "eprint", "eprintclass", "eprinttype", "issn", "issue", "issuesubtitle", "issuetitle", "journalsubtitle", "language", "langid", "note", "number", "origlanguage", "pages", "pagination", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "version", "volume", "annotation", "keywords"]
    },
    "post-weblog": {
        "order": 5,
        "biblatex": "online",
        "csl": "post-weblog",
        "required": ["date", "title", "url"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "addendum", "pubstate", "subtitle", "language", "langid", "urldate", "titleaddon", "version", "note", "organization", "annotation", "keywords"]
    },
    "book": {
        "order": 10,
        "biblatex": "book",
        "csl": "book",
        "required": ["title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "chapter", "commentator", "doi", "edition", "editor", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "pagetotal", "bookpagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "mvbook": {
        "order": 11,
        "biblatex": "mvbook",
        "csl": "book",
        "required": ["title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "commentator", "doi", "edition", "editor", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "note", "number", "origlanguage", "pagetotal", "bookpagination", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volumes", "annotation", "keywords"]
    },
    "inbook": {
        "order": 12,
        "biblatex": "inbook",
        "csl": "chapter",
        "required": ["title", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "bookauthor", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editor", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "bookinbook": {
        "order": 13,
        "biblatex": "bookinbook",
        "csl": "chapter",
        "required": ["title", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "bookauthor", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editor", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "suppbook": {
        "order": 14,
        "biblatex": "suppbook",
        "csl": "chapter",
        "required": ["title", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "bookauthor", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editor", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "booklet": {
        "order": 15,
        "biblatex": "booklet",
        "csl": "pamphlet",
        "required": ["title", "date"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "titleaddon", "addendum", "pages", "pagination", "howpublished", "type", "pubstate", "chapter", "doi", "subtitle", "language", "langid", "location", "url", "urldate", "pagetotal", "bookpagination", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "collection": {
        "order": 20,
        "biblatex": "collection",
        "csl": "dataset",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "pagetotal", "bookpagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "mvcollection": {
        "order": 21,
        "biblatex": "mvcollection",
        "csl": "dataset",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "note", "number", "origlanguage", "pagetotal", "bookpagination", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volumes", "annotation", "keywords"]
    },
    "incollection": {
        "order": 22,
        "biblatex": "incollection",
        "csl": "entry",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "suppcollection": {
        "order": 23,
        "biblatex": "suppcollection",
        "csl": "entry",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "post": {
        "order": 30,
        "biblatex": "online",
        "csl": "post",
        "required": ["date", "title", "url"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "addendum", "pubstate", "subtitle", "language", "langid", "urldate", "titleaddon", "version", "note", "organization", "annotation", "keywords"]
    },
    "manual": {
        "order": 40,
        "biblatex": "manual",
        "csl": "book",
        "required": ["title", "date"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "addendum", "chapter", "doi", "edition", "eprint", "eprintclass", "eprinttype", "isbn", "language", "langid", "location", "note", "number", "organization", "pages", "pagination", "pagetotal", "bookpagination", "publisher", "pubstate", "series", "subtitle", "titleaddon", "type", "url", "urldate", "version", "annotation", "keywords"]
    },
    "misc": {
        "order": 41,
        "biblatex": "misc",
        "csl": "entry",
        "required": ["title", "date"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "addendum", "howpublished", "type", "pubstate", "organization", "doi", "subtitle", "language", "langid", "location", "url", "urldate", "titleaddon", "version", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "online": {
        "order": 42,
        "biblatex": "online",
        "csl": "webpage",
        "required": ["date", "title", "url"],
        "eitheror": ["editor", "author"],
        "optional": ["abstract", "addendum", "pubstate", "subtitle", "language", "langid", "urldate", "titleaddon", "version", "note", "organization", "annotation", "keywords"]
    },
    "patent": {
        "order": 43,
        "biblatex": "patent",
        "csl": "patent",
        "required": ["title", "number", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "holder", "location", "pubstate", "doi", "subtitle", "titleaddon", "type", "url", "urldate", "version", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "periodical": {
        "order": 50,
        "biblatex": "periodical",
        "csl": "book",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "volume", "pubstate", "number", "series", "issn", "issue", "issuesubtitle", "issuetitle", "doi", "subtitle", "editora", "editorb", "editorc", "url", "urldate", "language", "langid", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "suppperiodical": {
        "order": 51,
        "biblatex": "suppperiodical",
        "csl": "entry",
        "required": ["journaltitle", "title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "annotator", "commentator", "doi", "editor", "editora", "editorb", "editorc", "eid", "eprint", "eprintclass", "eprinttype", "issn", "issue", "issuesubtitle", "issuetitle", "journalsubtitle", "language", "langid", "note", "number", "origlanguage", "pages", "pagination", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "version", "volume", "annotation", "keywords"]
    },
    "proceedings": {
        "order": 60,
        "biblatex": "proceedings",
        "csl": "entry",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "chapter", "doi", "eprint", "eprintclass", "eprinttype", "eventdate", "eventtitle", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "organization", "pages", "pagination", "pagetotal", "bookpagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "url", "urldate", "venue", "volume", "volumes", "annotation", "keywords"]
    },
    "mvproceedings": {
        "order": 61,
        "biblatex": "mvproceedings",
        "csl": "entry",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "doi", "eprint", "eprintclass", "eprinttype", "eventdate", "eventtitle", "isbn", "language", "langid", "location", "note", "number", "organization", "pagetotal", "bookpagination", "publisher", "pubstate", "series", "subtitle", "titleaddon", "url", "urldate", "venue", "volumes", "annotation", "keywords"]
    },
    "inproceedings": {
        "order": 62,
        "biblatex": "inproceedings",
        "csl": "paper-conference",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "booksubtitle", "booktitleaddon", "chapter", "doi", "eprint", "eprintclass", "eprinttype", "eventdate", "eventtitle", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "organization", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "url", "urldate", "venue", "volume", "volumes", "annotation", "keywords"]
    },
    "reference": {
        "order": 70,
        "biblatex": "book",
        "csl": "reference",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "pagetotal", "bookpagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "mvreference": {
        "order": 71,
        "biblatex": "mvreference",
        "csl": "book",
        "required": ["editor", "title", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "note", "number", "origlanguage", "pagetotal", "bookpagination", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volumes", "annotation", "keywords"]
    },
    "inreference": {
        "order": 72,
        "biblatex": "inreference",
        "csl": "entry",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "entry-encyclopedia": {
        "order": 73,
        "biblatex": "inreference",
        "csl": "entry-encyclopedia",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "entry-dictionary": {
        "order": 74,
        "biblatex": "inreference",
        "csl": "entry-dictionary",
        "required": ["title", "editor", "booktitle", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "afterword", "annotator", "booksubtitle", "booktitleaddon", "chapter", "commentator", "doi", "edition", "editora", "editorb", "editorc", "eprint", "eprintclass", "eprinttype", "foreword", "introduction", "isbn", "language", "langid", "location", "mainsubtitle", "maintitle", "maintitleaddon", "note", "number", "origlanguage", "pages", "pagination", "part", "publisher", "pubstate", "series", "subtitle", "titleaddon", "translator", "url", "urldate", "volume", "volumes", "annotation", "keywords"]
    },
    "report": {
        "order": 80,
        "biblatex": "report",
        "csl": "report",
        "required": ["author", "title", "type", "institution", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "pages", "pagination", "pagetotal", "bookpagination", "pubstate", "number", "isrn", "chapter", "doi", "subtitle", "language", "langid", "location", "url", "urldate", "titleaddon", "version", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "thesis": {
        "order": 81,
        "biblatex": "thesis",
        "csl": "thesis",
        "required": ["author", "title", "type", "institution", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "pages", "pagination", "pagetotal", "bookpagination", "pubstate", "isbn", "chapter", "doi", "subtitle", "language", "langid", "location", "url", "urldate", "titleaddon", "note", "eprint", "eprintclass", "eprinttype", "annotation", "keywords"]
    },
    "unpublished": {
        "order": 90,
        "biblatex": "unpublished",
        "csl": "manuscript",
        "required": ["title", "author", "date"],
        "eitheror": [],
        "optional": ["abstract", "addendum", "howpublished", "pubstate", "isbn", "date", "subtitle", "language", "langid", "location", "url", "urldate", "titleaddon", "note", "annotation", "keywords"]
    }
}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/edtf-parser.js":
/*!*****************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/edtf-parser.js ***!
  \*****************************************************************/
/*! exports provided: edtfParse */
/*! exports used: edtfParse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return edtfParse; });
// @flow

// Class to do a simple check for level 0 and 1 while waiting for a compatible
// edtf.js version and figuring out if the license is OK.
// It has an interface that is similar to the part of edtf.js we use so that we
// can quickly switch back.

// Notice: this allows open ended date ranges and it uses 1-12 rather than 0-11 for months.

/*::

type SimpleDateArray = Array<string | number>;

type DateArray = $ReadOnlyArray<string | number | SimpleDateArray>;

type EDTFOutputObject = {
    type: string;
    valid: boolean;
    values: DateArray;
    cleanedString: string;
    uncertain: boolean;
    approximate: boolean;
}

*/

class SimpleEDTFParser {
    /*::
    string: string;
    type: string;
    valid: boolean;
    values: SimpleDateArray;
    uncertain: boolean;
    approximate: boolean;
    parts: Array<SimpleEDTFParser>;
    */

    constructor(string /*: string */) {
        this.string = string
        this.type = 'None' // default
        this.valid = true // default
        this.values = []
        this.uncertain = false
        this.approximate = false
        this.parts = []
    }

    init() /*: EDTFOutputObject */ {
        this.checkCertainty()
        this.splitInterval()
        return {
            type: this.type,
            valid: this.valid,
            values: this.type === 'Interval' ? this.getPartValues() : this.values,
            cleanedString: this.cleanString(),
            uncertain: this.uncertain,
            approximate: this.approximate
        }
    }

    getPartValues() /*: DateArray */ {
        if (this.parts.length===0) {
            const emptyPart = []
            return emptyPart
        } else if (this.parts.length===1) {
            const datePart = this.parts[0].values
            return datePart
        } else {
            const datePartInterval = [
                this.parts[0].values,
                this.parts[1].values
            ]
            return datePartInterval
        }
    }

    cleanString() /*: string */ {
        let cleanedString = ''
        if (this.parts.length) {
            cleanedString = this.parts.map(datePart => datePart.cleanString()).join('/')
        } else if (this.values) {
            cleanedString = this.values.reduce((dateString, value, index) => {
                if (index === 0) {
                    if (typeof value === 'number' && value > 0) {
                        return String(value).padStart(4, '0')
                    } else {
                        return String(value)
                    }
                } else if (index < 3) {
                    return `${dateString}-${String(value).padStart(2, '0')}`
                } else if (index===3) {
                    return `${dateString}T${String(value).padStart(2, '0')}`
                } else if (index < 6){
                    return `${dateString}:${String(value).padStart(2, '0')}`
                } else {
                    return `${dateString}${value}`
                }
            }, '')
        }
        if (this.uncertain) {
            cleanedString += '?'
        }
        if (this.approximate) {
            cleanedString += '~'
        }
        return cleanedString
    }

    checkCertainty() {
        if (this.string.slice(-1)==='~') {
            this.approximate = true
            this.string = this.string.slice(0, -1)
        }
        if (this.string.slice(-1)==='?') {
            this.uncertain = true
            this.string = this.string.slice(0, -1)
        }
    }

    splitInterval() {
        let parts = this.string.split('/')
        if (parts.length > 2) {
            this.valid = false
        } else if (parts.length === 2) {
            this.type = 'Interval'
            let valid = false
            parts.forEach(part => {
                let parser = new SimpleEDTFParser(part)
                parser.init()
                if (parser.valid || parser.type==='Open') {
                    this.parts.push(parser)
                    if (parser.valid) {
                        valid = true
                    }
                } else {
                    this.valid = false
                }
            })
            if (!valid) {
                // From open to open is invalid
                this.valid = false
            }
        } else {
            this.splitDateParts()
        }

    }

    splitDateParts() {
        if (['','..'].includes(this.string)) {
            // Empty string. Invalid by itself but could be valied as part of a range
            this.valid = false
            this.values = []
            this.type = 'Open'
            return
        }

        let parts = this.string.replace(/^y/, '').split(/(?!^)-/)

        if (parts.length > 3) {
            this.valid = false
            return
        }
        let certain = true
        let year = parts[0]

        let yearChecker = /^-?[0-9]*u{0,2}$/ // 1994, 19uu, -234, 187u, 0, 1984?~, etc.
        if (!yearChecker.test(year)) {
            this.valid = false
            return
        }
        if (year.slice(-1) === 'u') {
            certain = false
            this.type = 'Interval'
            let from = new SimpleEDTFParser(year.replace(/u/g,'0'))
            from.init()
            let to = new SimpleEDTFParser(year.replace(/u/g,'9'))
            to.init()
            this.parts = [from, to]
            if (!from.valid || !to.valid) {
                this.valid = false
            }
        } else {
            this.values = [parseInt(year)]
            this.type = 'Date'
        }

        if (parts.length < 2) {
            return
        }

        // Month / Season

        let month = parts[1]
        if (!certain && month !== 'uu') {
            // End of year uncertain but month specified. Invalid
            this.valid = false
            return
        }
        let monthChecker = /^[0-2][0-9]|uu$/ // uu or 01, 02, 03, ..., 11, 12
        let monthInt = parseInt(month.replace('uu','01'))
        if(
            !monthChecker.test(month) ||
            monthInt < 1 ||
            (monthInt > 12 && monthInt < 21) ||
            monthInt > 24
        ) {
            this.valid = false
            return
        }
        if (month === 'uu') {
            certain = false
        }

        if (certain) {
            this.values.push(monthInt)
        }

        if (parts.length < 3) {
            if (monthInt > 12) {
                this.type = 'Season'
            }
            return
        }
        if (monthInt > 12) {
            // Season + day - invalid
            this.valid = false
            return
        }

        // Day

        let dayTime = parts[2].split('T'), day = dayTime[0]
        if (!certain && day !== 'uu') {
            // Month uncertain but day specified. Invalid
            this.valid = false
            return
        }
        let dayChecker = /^[0-3][0-9]$|uu/ // uu or 01, 02, 03, ..., 11, 12
        let dayInt = parseInt(day.replace('uu','01'))
        if(
            !dayChecker.test(month) ||
            dayInt < 1 ||
            dayInt > 31
        ) {
            this.valid = false
            return
        }
        if (day === 'uu') {
            certain = false
        }

        if (certain) {

            let testDate = new Date(`${year}/${month}/${day}`)

            if (
                testDate.getFullYear() !== parseInt(year) ||
                testDate.getMonth() + 1 !== monthInt ||
                testDate.getDate() !== dayInt
            ) {
                this.valid = false
                return
            }

            this.values.push(dayInt)
        }

        if (dayTime.length < 2) {
            return
        }

        // Time

        if (!certain) {
            // Day uncertain but time specified
            this.valid = false
            return
        }

        let timeParts = dayTime[1].slice(0, 8).split(':').map(part => parseInt(part))

        if (
            timeParts.length !== 3 ||
            timeParts[0] < 0 ||
            timeParts[0] > 23 ||
            timeParts[1] < 0 ||
            timeParts[1] > 59 ||
            timeParts[2] < 0 ||
            timeParts[2] > 59
        ) {
            // Invalid time
            this.valid = false
            return
        }

        this.values = this.values.concat(timeParts)

        if (dayTime[1].length === 8) {
            // No timezone
            return
        }
        let timeZone = dayTime[1].slice(8)

        if (timeZone === 'Z') {
            // Zulu
            this.values.push('Z')
            return
        }

        let tzChecker = RegExp('^[+-][0-1][0-9]:[0-1][0-9]$'),
        tzParts = timeZone.split(':').map(part => parseInt(part))

        if (
            !tzChecker.test(timeZone) ||
            tzParts[0] < -11 ||
            tzParts[0] > 14 ||
            tzParts[1] < 0 ||
            tzParts[1] > 59
        ) {
            this.valid = false
            return
        } else {
            this.values.push(timeZone)
        }
        return

    }

}


function edtfParse(dateString /*: string */) {

    let parser = new SimpleEDTFParser(dateString)
    return parser.init()
}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/biblatex.js":
/*!*********************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/biblatex.js ***!
  \*********************************************************************/
/*! exports provided: BibLatexParser, parse */
/*! all exports used */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BibLatexParser", function() { return BibLatexParser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parse", function() { return parse; });
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../const */ "../node_modules/biblatex-csl-converter/src/const.js");
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./const */ "../node_modules/biblatex-csl-converter/src/import/const.js");
/* harmony import */ var _name_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./name-parser */ "../node_modules/biblatex-csl-converter/src/import/name-parser.js");
/* harmony import */ var _literal_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./literal-parser */ "../node_modules/biblatex-csl-converter/src/import/literal-parser.js");
/* harmony import */ var _group_parser__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./group-parser */ "../node_modules/biblatex-csl-converter/src/import/group-parser.js");
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./tools */ "../node_modules/biblatex-csl-converter/src/import/tools.js");
/* harmony import */ var _edtf_parser__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../edtf-parser */ "../node_modules/biblatex-csl-converter/src/edtf-parser.js");
// @flow








/** Parses files in BibTeX/BibLaTeX format
 */

 /* Based on original work by Henrik Muehe (c) 2010,
  * licensed under the MIT license,
  * https://code.google.com/archive/p/bibtex-js/
  */

  /* Config options (default value for every option is false)

    - processUnexpected (false/true):

    Processes fields with names that are known, but are not expected for the given bibtype,
    adding them to an `unexpected_fields` object to each entry.

    - processUnknown (false/true/object [specifying content type for specific unknown]):

    Processes fields with names that are unknown, adding them to an `unknown_fields`
    object to each entry.

    example:
        > a = new BibLatexParser(..., {processUnknown: true})
        > a.output
        {
            "0:": {
                ...
                unknown_fields: {
                    ...
                }
            }
        }

        > a = new BibLatexParser(..., {processUnknown: {commentator: 'l_name'}})
        > a.output
        {
            "0:": {
                ...
                unknown_fields: {
                    commentator: [
                        {
                            given: ...,
                            family: ...
                        }
                    ]
                    ...
                }
            }
        }
  */

/*::
import type {GroupObject, NodeObject, NodeArray, EntryObject, NameDictObject, RangeArray} from "../const"

type ConfigObject = {
    processUnknown?: Object;
    processUnexpected?: boolean;
    processInvalidURIs?: boolean;
    processComments?: boolean;
    async?: boolean;
};

type ErrorObject = {
    type: string;
    expected?: string;
    found?: string;
    line?: number;
    key?: string;
    entry?: string;
    field_name?: string;
    value?: Array<string> | string;
}

type MatchOptionsObject = {
    skipWhitespace : string | boolean;
};

type UnknownFieldsObject = {
    groups?: Array<NodeObject>;
    [string]: Array<NodeObject> | Array<RangeArray> | Array<NodeArray> | Array<NodeArray | string> | Array<NameDictObject> | string;
}

*/

const hasbackslash = /\\/

class BibLatexParser {
    /*::
        input: string;
        config: ConfigObject;
        pos: number;
        entries: Array<EntryObject>;
        currentKey: string | false;
        currentEntry: ?EntryObject;
        currentType: string;
        currentRawFields: Object;
        bibDB: Object;
        errors: Array<ErrorObject>;
        warnings: Array<ErrorObject>;
        variables: {
            JAN: string,
            FEB: string,
            MAR: string,
            APR: string,
            MAY: string,
            JUN: string,
            JUL: string,
            AUG: string,
            SEP: string,
            OCT: string,
            NOV: string,
            DEC: string
        };
        comments: Array<string>;
        groupParser: GroupParser;
        groups: Array<GroupObject> | false;
        jabrefMeta: Object
        jabref: {
          groups: Array<GroupObject> | false;
          meta: Object
        }
    */


    constructor(input /*: string */, config /*: ConfigObject */ = {}) {
        this.input = input
        this.config = config
        this.pos = 0
        this.entries = []
        this.bibDB = {}
        this.currentKey = false
        this.currentEntry = null
        this.currentType = ""
        this.errors = []
        this.warnings = []
        this.comments = []
        // These variables are expected to be defined by some bibtex sources.
        this.variables = {
            JAN: "01",
            FEB: "02",
            MAR: "03",
            APR: "04",
            MAY: "05",
            JUN: "06",
            JUL: "07",
            AUG: "08",
            SEP: "09",
            OCT: "10",
            NOV: "11",
            DEC: "12"
        }
        this.groupParser = new _group_parser__WEBPACK_IMPORTED_MODULE_4__[/* GroupParser */ "a"](this.entries)
        this.groups = false
        this.jabrefMeta = {}
    }

    isWhitespace(s /*: string */) {
        return (s == ' ' || s == '\r' || s == '\t' || s == '\n')
    }

    error(data /*: ErrorObject */) {
        this.errors.push(Object.assign({}, data, {line: this.input.slice(0, this.pos).split('\n').length }))
    }

    warning(data /*: ErrorObject */) {
        this.warnings.push(Object.assign({}, data, {line: this.input.slice(0, this.pos).split('\n').length }))
    }


    match(s /*: string */, options /*: MatchOptionsObject */ = { skipWhitespace: true }) {
        if (options.skipWhitespace === true || options.skipWhitespace === 'leading') {
            this.skipWhitespace()
        }
        if (this.input.substring(this.pos, this.pos + s.length) == s) {
            this.pos += s.length
        } else {
            this.error({
                type: 'token_mismatch',
                expected: s,
                found: this.input.substring(this.pos, this.pos + s.length),
            })
        }
        if (options.skipWhitespace === true || options.skipWhitespace === 'trailing') this.skipWhitespace()
    }

    tryMatch(s /*: string */) {
        this.skipWhitespace()
        if (this.input.substring(this.pos, this.pos + s.length) == s) {
            return true
        } else {
            return false
        }
    }

    skipWhitespace() {
        while (this.isWhitespace(this.input[this.pos])) {
            this.pos++
        }
        if (this.input[this.pos] == "%") {
            while (this.input[this.pos] != "\n") {
                this.pos++
            }
            this.skipWhitespace()
        }
    }

    skipToNext() {
        while ((this.input.length > this.pos) && (this.input[this.pos] != "@")) {
            this.pos++
        }
        if (this.input.length == this.pos) {
            return false
        } else {
            return true
        }
    }

    valueBraces() {
        let bracecount = 0
        this.match("{", { skipWhitespace: 'leading' })
        let string = ""
        while (this.pos < this.input.length) {
            switch(this.input[this.pos]) {
                case '\\':
                    string += this.input.substring(this.pos, this.pos+2)
                    this.pos++
                    break
                case '}':
                    if (bracecount === 0) {
                        this.match("}")
                        return string
                    }
                    string += '}'
                    bracecount--
                    break
                case '{':
                    string += '{'
                    bracecount++
                    break
                default:
                    string += this.input[this.pos]
                    break
            }
            this.pos++
        }
        this.errors.push({type: 'unexpected_eof'})
        return string
    }

    valueQuotes() {
        this.match('"', { skipWhitespace: 'leading' })
        let string = ""
        while (this.pos < this.input.length) {
            switch(this.input[this.pos]) {
                case '\\':
                    string += this.input.substring(this.pos, this.pos+2)
                    this.pos++
                    break
                case '"':
                    this.match('"')
                    return string
                default:
                    string += this.input[this.pos]
                    break
            }
            this.pos++
        }
        this.errors.push({type: 'unexpected_eof'})
        return string
    }

    singleValue() {
        if (this.tryMatch("{")) {
            return this.valueBraces()
        } else if (this.tryMatch('"')) {
            return this.valueQuotes()
        } else {
            let k = this.key()
            if (this.variables[k.toUpperCase()]) {
                return this.variables[k.toUpperCase()]
            } else if (k.match("^[0-9]+$")) {
                return k
            } else {
                const warning /*: Object */ = {
                    type: 'undefined_variable',
                    variable: k
                }
                if (this.currentEntry) {
                    warning.entry = this.currentEntry['entry_key']
                }
                if (this.currentKey) {
                    warning.key = this.currentKey
                }
                this.warning(warning)
                // Using \u0870 as a delimiter for variables as they cannot be
                // used in regular latex code.
                return `\u0870${k}\u0870`
            }
        }
    }

    value(asis /*: boolean */ = false) {
        let values = []
        values.push(this.singleValue())
        while (this.tryMatch("#")) {
            this.match("#")
            values.push(this.singleValue())
        }
        values = values.join("")
        if (!asis) values = values.replace(/[\t ]+/g, ' ').trim()
        return values
    }

    key(optional /*: boolean */ = false) /*: string */ {
        let start = this.pos
        while (true) {
            if (this.pos == this.input.length) {
                this.error({type: 'runaway_key' })
                break
            }
            if (['(',')',',','{','}',' ','=', '\t', '\n'].includes(this.input[this.pos])) {
                let key = this.input.substring(start, this.pos)
                if (optional && this.input[this.pos] != ',') {
                    this.skipWhitespace()
                    if (this.input[this.pos] != ',') {
                        this.pos = start
                        return ''
                    }
                }
                return key
            } else {
                this.pos++
            }
        }

        return ''
    }

    keyEqualsValue(asis /*: boolean */ = false) /*: [string, string] | false */{
        let key = this.key()
        if (!key.length) {
            const error /*: ErrorObject */ = {
                type: 'cut_off_citation',
            }
            if (this.currentEntry) {
                error.entry = this.currentEntry['entry_key']
                // The citation is not full, we remove the existing parts.
                this.currentEntry['incomplete'] = true
            }
            this.error(error)
            return false
        }
        this.currentKey = key.toLowerCase()
        if (this.tryMatch("=")) {
            this.match("=")
            const val = this.value(asis)
            if (this.currentKey) {
                return [this.currentKey, val]
            } else {
                return false
            }
        } else {
            const error /*: ErrorObject */ = {
                type: 'missing_equal_sign'
            }
            if (this.currentEntry) {
                error.entry = this.currentEntry['entry_key']
            }
            if (this.currentKey) {
                error.key = this.currentKey
            }
            this.error(error)
        }
        return false
    }

    keyValueList() {
        let kv = this.keyEqualsValue()
        if (!kv || !this.currentRawFields) {
            // Entry has no fields, so we delete it.
            // It was the last one pushed, so we remove the last one
            this.entries.pop()
            return
        }
        let rawFields = this.currentRawFields
        rawFields[kv[0]] = kv[1]
        while (this.tryMatch(",")) {
            this.match(",")
            //fixes problems with commas at the end of a list
            if (this.tryMatch("}") || this.tryMatch(")")) {
                break
            }
            kv = this.keyEqualsValue()
            if (!kv) {
                const error /*: ErrorObject */ = {
                    type: 'key_value_error'
                }
                if (this.currentEntry) {
                    error.entry = this.currentEntry['entry_key']
                }
                this.error(error)
                break
            }
            rawFields[kv[0]] = kv[1]
        }
    }

    processFields() {
        if (!this.currentEntry) {
            return
        }
        let rawFields = this.currentRawFields
        let fields = this.currentEntry['fields']

        // date may come either as year, year + month or as date field.
        // We therefore need to catch these hear and transform it to the
        // date field after evaluating all the fields.
        // All other date fields only come in the form of a date string.

        let date, month
        if (rawFields.date) {
            // date string has precedence.
            date = rawFields.date
        } else if (rawFields.year && rawFields.month) {
            month = rawFields.month
            if (isNaN(parseInt(month)) && this.variables[month.toUpperCase()]) {
                month = this.variables[month.toUpperCase()]
            } else if (
                typeof month.split('~').find(monthPart => isNaN(parseInt(monthPart))) === 'undefined'
            ) {
                // handle cases like '09~26' but not '~09' (approximate month in edtf)
                month = month.replace(/~/g, '-')
            }
            date = `${rawFields.year}-${month}`
        } else if (rawFields.year) {
            date = `${rawFields.year}`
        }
        if (date) {
            let dateObj = Object(_edtf_parser__WEBPACK_IMPORTED_MODULE_6__[/* edtfParse */ "a"])(date)
            if (dateObj.valid) {
                fields['date'] = dateObj.cleanedString
                delete rawFields.year
                delete rawFields.month
            } else {
                let fieldName, value, errorList
                if (rawFields.date) {
                    fieldName = 'date'
                    value = rawFields.date
                    errorList = this.errors
                } else if (rawFields.year && rawFields.month) {
                    fieldName = 'year,month'
                    value = [rawFields.year, rawFields.month]
                    errorList = this.warnings
                } else {
                    fieldName = 'year'
                    value = rawFields.year
                    errorList = this.warnings
                }
                const error /*: ErrorObject */ = {
                    type: 'unknown_date',
                    field_name: fieldName,
                    value
                }
                if (this.currentEntry) {
                    error.entry = this.currentEntry['entry_key']
                }
                errorList.push(error)
            }
        }
        // Check for English language. If the citation is in English language,
        // titles may use case preservation.
        let langEnglish = true // By default we assume everything to be written in English.
        if (rawFields.langid && rawFields.langid.length) {
            let langString = rawFields.langid.toLowerCase().trim()
            let englishOptions = ['english', 'american', 'british', 'usenglish', 'ukenglish', 'canadian', 'australian', 'newzealand']
            if (!englishOptions.some((option)=>{return langString === option})) {
                langEnglish = false
            }
        } else if (rawFields.language) {
            // langid and language. The two mean different things, see discussion https://forums.zotero.org/discussion/33960/biblatex-import-export-csl-language-biblatex-langid
            // but in bibtex, language is often used for what is essentially langid.
            // If there is no langid, but a language, and the language happens to be
            // a known langid, set the langid to be equal to the language.
            let langid = this._reformKey(rawFields.language, 'langid')
            if (langid.length) {
                fields['langid'] = langid
                if (!['usenglish', 'ukenglish', 'caenglish', 'auenglish', 'nzenglish'].includes(langid)) {
                    langEnglish = false
                }
            }
        }

        iterateFields: for(let bKey /*: string */ in rawFields) {

            if (bKey==='date' || (['year','month'].includes(bKey) && !this.config.processUnknown)) {
                // Handled above
                continue iterateFields
            }

            // Replace alias fields with their main term.
            let aliasKey = _const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexFieldAliasTypes */ "c"][bKey], fKey = ''
            if (aliasKey) {
                if (rawFields[aliasKey]) {
                    const warning /*: ErrorObject */ = {
                        type: 'alias_creates_duplicate_field',
                        field: bKey,
                        alias_of: aliasKey,
                        value: rawFields[bKey],
                        alias_of_value: rawFields[aliasKey]
                    }
                    if (this.currentEntry) {
                        warning.entry = this.currentEntry['entry_key']
                    }
                    this.warning(warning)
                    continue iterateFields
                }

                fKey = Object.keys(_const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"]).find((ft)=>{
                    return _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][ft].biblatex === aliasKey
                }) || ''
            } else {
                fKey = Object.keys(_const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"]).find((ft)=>{
                    return _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][ft].biblatex === bKey
                }) || ''
            }

            let oFields, fType
            let bType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"][this.currentEntry['bib_type']]

            if(!fKey.length) {
                const warning /*: ErrorObject */ = {
                    type: 'unknown_field',
                    field_name: bKey
                }
                if (this.currentEntry) {
                    warning.entry = this.currentEntry['entry_key']
                }
                this.warning(warning)
                if (!this.config.processUnknown) {
                    continue iterateFields
                }
                if (this.currentEntry && !this.currentEntry['unknown_fields']) {
                    this.currentEntry['unknown_fields'] = {}
                }
                oFields = this.currentEntry && this.currentEntry['unknown_fields'] ?
                        this.currentEntry['unknown_fields'] :
                        {}
                fType = this.config.processUnknown && this.config.processUnknown[bKey] ?
                        this.config.processUnknown[bKey] :
                        'f_literal'
                fKey = bKey
            } else if (
                bType['required'].includes(fKey) ||
                bType['optional'].includes(fKey) ||
                bType['eitheror'].includes(fKey)
            ) {
                oFields = fields
                fType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['type']
            } else {
                const warning /*: ErrorObject */ = {
                    type: 'unexpected_field',
                    field_name: bKey
                }
                if (this.currentEntry) {
                    warning.entry = this.currentEntry['entry_key']
                }
                this.warning(warning)
                if (!this.config.processUnexpected) {
                    continue iterateFields
                }
                if (this.currentEntry && !this.currentEntry['unexpected_fields']) {
                    this.currentEntry['unexpected_fields'] = {}
                }
                oFields = this.currentEntry && this.currentEntry['unexpected_fields'] ?
                        this.currentEntry['unexpected_fields'] :
                        {}
                fType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['type']
            }


            let fValue = rawFields[bKey],
                reformedValue
            switch(fType) {
                case 'f_date':
                    reformedValue = Object(_edtf_parser__WEBPACK_IMPORTED_MODULE_6__[/* edtfParse */ "a"])(fValue)
                    if (reformedValue.valid) {
                        oFields[fKey] = reformedValue.cleanedString
                    } else if (this.currentEntry) {
                        this.error({
                            type: 'unknown_date',
                            entry: this.currentEntry['entry_key'],
                            field_name: fKey,
                            value: fValue,
                        })
                    }
                    break
                case 'f_integer':
                    oFields[fKey] = this._reformLiteral(fValue)
                    break
                case 'f_key':
                    reformedValue = this._reformKey(fValue, fKey)
                    if (reformedValue.length) {
                        oFields[fKey] = reformedValue
                    }
                    break
                case 'f_literal':
                case 'f_long_literal':
                    oFields[fKey] = this._reformLiteral(fValue)
                    break
                case 'l_range':
                    oFields[fKey] = this._reformRange(fValue)
                    break
                case 'f_title':
                    oFields[fKey] = this._reformLiteral(fValue, langEnglish)
                    break
                case 'f_uri':
                    if (this.config.processInvalidURIs || this._checkURI(fValue)) {
                        oFields[fKey] = this._reformURI(fValue)
                    } else {
                        const error /*: ErrorObject */ = {
                            type: 'unknown_uri',
                            field_name: fKey,
                            value: fValue,
                        }
                        if (this.currentEntry) {
                            error.entry = this.currentEntry['entry_key']
                        }
                        this.error(error)
                    }
                    break
                case 'f_verbatim':
                    oFields[fKey] = fValue
                    break
                case 'l_key':
                    oFields[fKey] = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(fValue).map(
                        keyField => this._reformKey(keyField, fKey)
                    )
                    break
                case 'l_tag':
                    oFields[fKey] = fValue.split(/[,;]/).map(string => string.trim())
                    break
                case 'l_literal':
                    oFields[fKey] = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(fValue).map(item => this._reformLiteral(item.trim()))
                    break
                case 'l_name':
                    oFields[fKey] = this._reformNameList(fValue)
                    break
                default:
                    // Something must be wrong in the code.
                    console.warn(`Unrecognized type: ${fType}!`)
            }
        }

    }

    _reformKey(keyString /*: string */, fKey /*: string */) /*: string | NodeArray */ {
        let keyValue = keyString.trim().toLowerCase()
        let fieldType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]
        if (_const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexAliasOptions */ "a"][fKey] && _const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexAliasOptions */ "a"][fKey][keyValue]) {
            keyValue = _const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexAliasOptions */ "a"][fKey][keyValue]
        }
        if (fieldType['options']) {
            if (Array.isArray(fieldType['options'])) {
                if (fieldType['options'].includes(keyValue)) {
                    return keyValue
                }
            } else {
                let optionValue = Object.keys(fieldType['options']).find(key => {
                    return fieldType['options'][key]['biblatex'] === keyValue
                })
                if (optionValue) {
                    return optionValue
                } else {
                    return ''
                }
            }
        }
        if (fieldType.strict) {
            const warning /*: ErrorObject */ = {
                type: 'unknown_key',
                field_name: fKey,
                value: keyString
            }
            if (this.currentEntry) {
                warning.entry = this.currentEntry['entry_key']
            }
            this.warning(warning)
            return ''
        }
        return this._reformLiteral(keyString)
    }

    _checkURI(uriString /*: string */) /*: boolean */ {
        /* Copyright (c) 2010-2013 Diego Perini, MIT licensed
           https://gist.github.com/dperini/729294
         */
        return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(uriString)
    }

    _reformURI(uriString /*: string */) {
        return uriString.replace(/\\/g,'')
    }

    _reformNameList(nameString /*: string */) /*: Array<NameDictObject> */ {
        const people = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(nameString),
            names = people.map(person => {
                const nameParser = new _name_parser__WEBPACK_IMPORTED_MODULE_2__[/* BibLatexNameParser */ "a"](person),
                    name = nameParser.output
                if (name) {
                    return name
                } else {
                    return false
                }
            }),
            result = ((names.filter((name /*: NameDictObject | false */) => {
                return typeof name == 'object'
            }) /*: Array<any> */) /*: Array<NameDictObject> */)
        return result
    }

    _reformRange(rangeString /*: string */) /*: Array<RangeArray> */{
        return rangeString.split(',').map(string => {
            let parts = string.split('--')
            if (parts.length > 1) {
                return [
                    this._reformLiteral(parts.shift().trim()),
                    this._reformLiteral(parts.join('--').trim())
                ]
            } else {
                parts = string.split('-')
                if (parts.length > 1) {
                    return [
                        this._reformLiteral(parts.shift().trim()),
                        this._reformLiteral(parts.join('-').trim())
                    ]
                } else {
                    return [this._reformLiteral(string.trim())]
                }
            }
        })
    }

    _reformLiteral(theValue /*: string */, cpMode /*: boolean */ = false) /*: NodeArray */ {
        const parser = new _literal_parser__WEBPACK_IMPORTED_MODULE_3__[/* BibLatexLiteralParser */ "a"](theValue, cpMode)
        return parser.output
    }

    bibType() /*: string */ {
        let biblatexType = this.currentType
        if (_const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexAliasTypes */ "b"][biblatexType]) {
            biblatexType = _const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexAliasTypes */ "b"][biblatexType]
        }

        let bibType = Object.keys(_const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"]).find((bType) => {
            return _const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"][bType]['biblatex'] === biblatexType
        })

        if(typeof bibType === 'undefined') {
            this.warning({
                type: 'unknown_type',
                type_name: biblatexType
            })
            bibType = 'misc'
        }

        return bibType
    }

    createNewEntry() {
        this.currentEntry = {
            'bib_type': this.bibType(),
            'entry_key': this.key(true),
            'fields': {}
        }
        this.currentRawFields = {}
        this.entries.push(this.currentEntry)
        if (this.currentEntry && this.currentEntry['entry_key'].length) {
            this.match(",")
        }
        this.keyValueList()
        this.processFields()
    }

    directive() {
        this.match("@")
        this.currentType = this.key()
        if (!this.currentType.length) return null
        this.currentType = this.currentType.toLowerCase()
        return "@" + this.currentType
    }

    string() {
        const kv = this.keyEqualsValue(true)
        if (kv) {
            this.variables[kv[0].toUpperCase()] = kv[1]
        }
    }

    preamble() {
        this.value()
    }

    replaceTeXChars() {
        let value = this.input
        let len = _const__WEBPACK_IMPORTED_MODULE_1__[/* TeXSpecialChars */ "d"].length
        for (let i = 0; i < len; i++) {
            if (!hasbackslash.test(value)) break
            let texChar = _const__WEBPACK_IMPORTED_MODULE_1__[/* TeXSpecialChars */ "d"][i]
            value = value.replace(texChar.tex, texChar.unicode)
        }
        // Delete multiple spaces
        this.input = value.replace(/ +(?= )/g, '')
        return
    }

    stepThroughBibtex() {
        while (this.skipToNext()) {
          this.parseNext()
        }
    }

    stepThroughBibtexAsync() {
      return this.skipToNext() ? (new Promise(resolve => resolve(this.parseNext()))).then(() => this.stepThroughBibtexAsync()) : Promise.resolve(null)
    }

    parseNext() {
        let closer
        let d = this.directive()
        if (!d) return

        if (this.tryMatch("{")) {
          this.match("{")
          closer = '}'
        } else if (this.tryMatch("(")) { // apparently, references can also be surrended with round braces
          this.match("(")
          closer = ')'
        } else if (d === "@comment") { // braceless comments are a thing it appears
          closer = null
        } else {
          this.match("{")
          closer = '}'
        }

        if (d == "@string") {
            this.string()
        } else if (d == "@preamble") {
            this.preamble()
        } else if (d == "@comment") {
            this.parseComment(!closer)
        } else {
            this.createNewEntry()
        }

        if (closer) this.match(closer)
    }

    parseComment(braceless /*: boolean */) {
        let start = this.pos
        let braces = 1

        if (braceless) {
          while (this.input.length > this.pos && this.input[this.pos] != '\n') {
            this.pos++
          }
        } else {
          while (this.input.length > this.pos && braces > 0) {
            switch (this.input[this.pos]) {
              case '{':
                braces += 1
                break
              case '}':
                braces -= 1
            }
            this.pos++
          }
        }

        // no ending brace found
        if (braceless || braces !== 0) { return }

        // leave the ending brace for the main parser to pick up
        this.pos--
        let comment = this.input.substring(start, this.pos)
        this.groupParser.checkString(comment)
        if (this.groupParser.groups.length) {
            this.groups = this.groupParser.groups
        } else {
          comment = comment.trim()
          const m = comment.match(/^jabref-meta: ([a-zA-Z]+):(.*);$/)
          if (m && m[1] !== 'groupsversion') {
            this.jabrefMeta[m[1]] = m[2].replace(/\\(.)/g, '$1')
          } else if (comment && this.config.processComments) {
            this.comments.push(comment)
          }
        }
    }

    createBibDB() {
        this.entries.forEach((entry, index)=> {
            // Start index from 1 to create less issues with testing
            this.bibDB[index + 1] = entry
        })
    }

    cleanDB() {
        this.bibDB = JSON.parse(
            JSON.stringify(this.bibDB)
                .replace(/\u0871/,'\\\\') // Backslashes placed outside of literal fields
                .replace(/\u0870/,'') // variable start/end outside of literal fields
        )
    }

    get output() {
        console.warn('BibLatexParser.output will be deprecated in biblatex-csl-converter 2.x. Use BibLatexParser.parse() instead.')
        this.replaceTeXChars()
        this.stepThroughBibtex()
        this.createBibDB()
        this.cleanDB()
        return this.bibDB
    }

    parsed() {
        this.createBibDB()
        this.cleanDB()
        return {
            entries: this.bibDB,
            errors: this.errors,
            warnings: this.warnings,
            comments: this.comments,
            jabref: {
              groups: this.groups,
              meta: this.jabrefMeta,
            },
        }
    }

    parse() {
        this.replaceTeXChars()

        if (this.config.async) {
            return this.stepThroughBibtexAsync().then(() => this.parsed())
        } else {
            this.stepThroughBibtex()
            return this.parsed()
        }
    }
}

function parse(input /*: string */, config /*: ConfigObject */ = {}) {
    return (new BibLatexParser(input, config)).parse()
}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/const.js":
/*!******************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/const.js ***!
  \******************************************************************/
/*! exports provided: BiblatexFieldAliasTypes, BiblatexAliasTypes, BiblatexAliasOptions, TeXSpecialChars */
/*! exports used: BiblatexAliasOptions, BiblatexAliasTypes, BiblatexFieldAliasTypes, TeXSpecialChars */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return BiblatexFieldAliasTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return BiblatexAliasTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BiblatexAliasOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return TeXSpecialChars; });
// @flow
/** A list of all field aliases and what they refer to. */
const BiblatexFieldAliasTypes = {
    'address': 'location',
    'annote': 'annotation',
    'archiveprefix': 'eprinttype',
    'journal': 'journaltitle',
    'pdf': 'file',
    'primaryclass': 'eprintclass',
    'school': 'institution'
}

/** A list of all bibentry aliases and what they refer to. */
const BiblatexAliasTypes = {
    'conference': 'inproceedings',
    'electronic': 'online',
    'mastersthesis': 'thesis',
    'phdthesis': 'thesis',
    'techreport': 'report',
    'www': 'online'
}

const langidAliases = {
    'english': 'usenglish',
    'american': 'usenglish',
    'en': 'usenglish',
    'eng': 'usenglish',
    'en-US': 'usenglish',
    'anglais': 'usenglish',
    'british': 'ukenglish',
    'en-GB': 'ukenglish',
    'francais': 'french',
    'austrian': 'naustrian',
    'german': 'ngerman',
    'germanb': 'ngerman',
    'polutonikogreek': 'greek',
    'brazil': 'brazilian',
    'portugues': 'portuguese',
    'chinese': 'pinyin'
}

const languageAliases = {
    "langamerican": "american",
    "langbrazilian": "brazilian",
    "langcatalan": "catalan",
    "langcroation": "croation",
    "langczech": "czech",
    "langdanish": "danish",
    "langdutch": "dutch",
    "langenglish": "english",
    "langfinnish": "finnish",
    "langfrench": "french",
    "langgerman": "german",
    "langgreek": "greek",
    "langitalian": "italian",
    "langlatin": "latin",
    "langnorwegian": "norwegian",
    "langpolish": "polish",
    "langportuguese": "portuguese",
    "langrussian": "russian",
    "langslovene": "slovene",
    "langspanish": "spanish",
    "langswedish": "swedish"
}

/** A list of aliases for options known by biblatex/babel/polyglosia and what they refer to. */
const BiblatexAliasOptions = {
    'language': languageAliases,
    'origlanguage': languageAliases,
    'langid': langidAliases
}


/** A list of special chars in Tex and their unicode equivalent. */

/* The copyright holder of the below composition is Emiliano Heyns, and it is made available under the MIT license.

Data sources for the composition are:

http://milde.users.sourceforge.net/LUCR/Math/data/unimathsymbols.txt
http://www.w3.org/2003/entities/2007xml/unicode.xml
http://www.w3.org/Math/characters/unicode.xml
*/
const TeXSpecialChars /*: Array<{ tex: RegExp, unicode: string}> */ = [
  { tex: /\\\^A|\\\^\{A\}/, unicode: '\xC2' },
  { tex: /\\\^a|\\\^\{a\}/, unicode: '\xE2' },
  { tex: /\\\^C|\\\^\{C\}/, unicode: '\u0108' },
  { tex: /\\\^c|\\\^\{c\}/, unicode: '\u0109' },
  { tex: /\\\^E|\\\^\{E\}/, unicode: '\xCA' },
  { tex: /\\\^e|\\\^\{e\}/, unicode: '\xEA' },
  { tex: /\\\^G|\\\^\{G\}/, unicode: '\u011C' },
  { tex: /\\\^g|\\\^\{g\}/, unicode: '\u011D' },
  { tex: /\\\^H|\\\^\{H\}/, unicode: '\u0124' },
  { tex: /\\\^h|\\\^\{h\}/, unicode: '\u0125' },
  { tex: /\\\^I|\\\^\{I\}/, unicode: '\xCE' },
  { tex: /\\\^\\i|\\\^\{\\i\}/, unicode: '\xEE' },
  { tex: /\\\^J|\\\^\{J\}/, unicode: '\u0134' },
  { tex: /\\\^\\j|\\\^\{\\j\}/, unicode: '\u0135' },
  { tex: /\\\^O|\\\^\{O\}/, unicode: '\xD4' },
  { tex: /\\\^o|\\\^\{o\}/, unicode: '\xF4' },
  { tex: /\\\^S|\\\^\{S\}/, unicode: '\u015C' },
  { tex: /\\\^s|\\\^\{s\}/, unicode: '\u015D' },
  { tex: /\\\^U|\\\^\{U\}/, unicode: '\xDB' },
  { tex: /\\\^u|\\\^\{u\}/, unicode: '\xFB' },
  { tex: /\\\^W|\\\^\{W\}/, unicode: '\u0174' },
  { tex: /\\\^w|\\\^\{w\}/, unicode: '\u0175' },
  { tex: /\\\^Y|\\\^\{Y\}/, unicode: '\u0176' },
  { tex: /\\\^y|\\\^\{y\}/, unicode: '\u0177' },

  { tex: /\\\.C|\\\.\{C\}/, unicode: '\u010A' },
  { tex: /\\\.c|\\\.\{c\}/, unicode: '\u010B' },
  { tex: /\\\.E|\\\.\{E\}/, unicode: '\u0116' },
  { tex: /\\\.e|\\\.\{e\}/, unicode: '\u0117' },
  { tex: /\\\.G|\\\.\{G\}/, unicode: '\u0120' },
  { tex: /\\\.g|\\\.\{g\}/, unicode: '\u0121' },
  { tex: /\\\.I|\\\.\{I\}/, unicode: '\u0130' },
  { tex: /\\\.Z|\\\.\{Z\}/, unicode: '\u017B' },
  { tex: /\\\.z|\\\.\{z\}/, unicode: '\u017C' },

  { tex: /\\=A|\\=\{A\}/, unicode: '\u0100' },
  { tex: /\\=a|\\=\{a\}/, unicode: '\u0101' },
  { tex: /\\=E|\\=\{E\}/, unicode: '\u0112' },
  { tex: /\\=e|\\=\{e\}/, unicode: '\u0113' },
  { tex: /\\=I|\\=\{I\}/, unicode: '\u012A' },
  { tex: /\\=\\i|\\=\{\\i\}/, unicode: '\u012B' },
  { tex: /\\=O|\\=\{O\}/, unicode: '\u014C' },
  { tex: /\\=o|\\=\{o\}/, unicode: '\u014D' },
  { tex: /\\=U|\\=\{U\}/, unicode: '\u016A' },
  { tex: /\\=u|\\=\{u\}/, unicode: '\u016B' },

  { tex: /\\~A|\\~\{A\}/, unicode: '\xC3' },
  { tex: /\\~a|\\~\{a\}/, unicode: '\xE3' },
  { tex: /\\~I|\\~\{I\}/, unicode: '\u0128' },
  { tex: /\\~\\i/, unicode: '\u0129' },
  { tex: /\\~N|\\~\{N\}/, unicode: '\xD1' },
  { tex: /\\~n|\\~\{n\}/, unicode: '\xF1' },
  { tex: /\\~O|\\~\{O\}/, unicode: '\xD5' },
  { tex: /\\~o|\\~\{o\}/, unicode: '\xF5' },
  { tex: /\\~U|\\~\{U\}/, unicode: '\u0168' },
  { tex: /\\~u|\\~\{u\}/, unicode: '\u0169' },

  { tex: /\\`A|\\`\{A\}/, unicode: '\xC0' },
  { tex: /\\`a|\\`\{a\}/, unicode: '\xE0' },
  { tex: /\\`E|\\`\{E\}/, unicode: '\xC8' },
  { tex: /\\`e|\\`\{e\}/, unicode: '\xE8' },
  { tex: /\\`I|\\`\{I\}/, unicode: '\xCC' },
  { tex: /\\`\\i|\\`i|\\`\{\\i\}|\\`\{i\}/, unicode: '\xEC' },
  { tex: /\\`O|\\`\{O\}/, unicode: '\xD2' },
  { tex: /\\`o|\\`\{o\}/, unicode: '\xF2' },
  { tex: /\\`U|\\`\{U\}/, unicode: '\xD9' },
  { tex: /\\`u|\\`\{u\}/, unicode: '\xF9' },

  { tex: /\\"A|\\"\{A\}/, unicode: '\xC4' },
  { tex: /\\"a|\\"\{a\}/, unicode: '\xE4' },
  { tex: /\\"E|\\"\{E\}/, unicode: '\xCB' },
  { tex: /\\"e|\\"\{e\}/, unicode: '\xEB' },
  { tex: /\\"\\i|\\"\{\\i\}|\\"i|\\"\{i\}/, unicode: '\xEF' },
  { tex: /\\"I|\\"\{I\}/, unicode: '\xCF' },
  { tex: /\\"O|\\"\{O\}/, unicode: '\xD6' },
  { tex: /\\"o|\\"\{o\}/, unicode: '\xF6' },
  { tex: /\\"U|\\"\{U\}/, unicode: '\xDC' },
  { tex: /\\"u|\\"\{u\}/, unicode: '\xFC' },
  { tex: /\\"Y|\\"\{Y\}/, unicode: '\u0178' },
  { tex: /\\"y|\\"\{y\}/, unicode: '\xFF' },

  { tex: /\\'A|\\'\{A\}/, unicode: '\xC1' },
  { tex: /\\'a|\\'\{a\}/, unicode: '\xE1' },
  { tex: /\\'C|\\'\{C\}/, unicode: '\u0106' },
  { tex: /\\'c|\\'\{c\}/, unicode: '\u0107' },
  { tex: /\\'E|\\'\{E\}/, unicode: '\xC9' },
  { tex: /\\'e|\\'\{e\}/, unicode: '\xE9' },
  { tex: /\\'g|\\'\{g\}/, unicode: '\u01F5' },
  { tex: /\\'H|\\'\{H\}/, unicode: '\u0389' },
  { tex: /\\'I|\\'\{I\}/, unicode: '\xCD' },
  { tex: /\\'\\i|\\'i/, unicode: '\xED' },
  { tex: /\\'L|\\'\{L\}/, unicode: '\u0139' },
  { tex: /\\'l|\\'\{l\}/, unicode: '\u013A' },
  { tex: /\\'N|\\'\{N\}/, unicode: '\u0143' },
  { tex: /\\'n|\\'\{n\}/, unicode: '\u0144' },
  { tex: /\\'O|\\'\{O\}/, unicode: '\xD3' },
  { tex: /\\'o|\\'\{o\}/, unicode: '\xF3' },
  { tex: /\\'R|\\'\{R\}/, unicode: '\u0154' },
  { tex: /\\'r|\\'\{r\}/, unicode: '\u0155' },
  { tex: /\\'S|\\'\{S\}/, unicode: '\u015A' },
  { tex: /\\'s|\\'\{s\}/, unicode: '\u015B' },
  { tex: /\\'U|\\'\{U\}/, unicode: '\xDA' },
  { tex: /\\'u|\\'\{u\}/, unicode: '\xFA' },
  { tex: /\\'Y|\\'\{Y\}/, unicode: '\xDD' },
  { tex: /\\'y|\\'\{y\}/, unicode: '\xFD' },
  { tex: /\\'Z|\\'\{Z\}/, unicode: '\u0179' },
  { tex: /\\'z|\\'\{z\}/, unicode: '\u017A' },

  { tex: /\\c C|\\c\{C\}/, unicode: '\xC7' },
  { tex: /\\c c|\\c\{c\}/, unicode: '\xE7' },
  { tex: /\\c G|\\c\{G\}/, unicode: '\u0122' },
  { tex: /\\c g|\\c\{g\}/, unicode: '\u0123' },
  { tex: /\\c K|\\c\{K\}/, unicode: '\u0136' },
  { tex: /\\c k|\\c\{k\}/, unicode: '\u0137' },
  { tex: /\\c L|\\c\{L\}/, unicode: '\u013B' },
  { tex: /\\c l|\\c\{l\}/, unicode: '\u013C' },
  { tex: /\\c N|\\c\{N\}/, unicode: '\u0145' },
  { tex: /\\c n|\\c\{n\}/, unicode: '\u0146' },
  { tex: /\\c R|\\c\{R\}/, unicode: '\u0156' },
  { tex: /\\c r|\\c\{r\}/, unicode: '\u0157' },
  { tex: /\\c S|\\c\{S\}/, unicode: '\u015E' },
  { tex: /\\c s|\\c\{s\}/, unicode: '\u015F' },
  { tex: /\\c T|\\c\{T\}/, unicode: '\u0162' },
  { tex: /\\c t|\\c\{t\}/, unicode: '\u0163' },

  { tex: /\\H O|\\H\{O\}/, unicode: '\u0150' },
  { tex: /\\H o|\\H\{o\}/, unicode: '\u0151' },
  { tex: /\\H U|\\H\{U\}/, unicode: '\u0170' },
  { tex: /\\H u|\\H\{u\}/, unicode: '\u0171' },

  { tex: /\\k A|\\k\{A\}/, unicode: '\u0104' },
  { tex: /\\k a|\\k\{a\}/, unicode: '\u0105' },
  { tex: /\\k E|\\k\{E\}/, unicode: '\u0118' },
  { tex: /\\k e|\\k\{e\}/, unicode: '\u0119' },
  { tex: /\\k I|\\k\{I\}/, unicode: '\u012E' },
  { tex: /\\k i|\\k\{i\}/, unicode: '\u012F' },
  { tex: /\\k U|\\k\{U\}/, unicode: '\u0172' },
  { tex: /\\k u|\\k\{u\}/, unicode: '\u0173' },

  { tex: /\\r U|\\r\{U\}/, unicode: '\u016E' },
  { tex: /\\r u|\\r\{u\}/, unicode: '\u016F' },

  { tex: /\\u A|\\u\{A\}/, unicode: '\u0102' },
  { tex: /\\u a|\\u\{a\}/, unicode: '\u0103' },
  { tex: /\\u E|\\u\{E\}/, unicode: '\u0114' },
  { tex: /\\u e|\\u\{e\}/, unicode: '\u0115' },
  { tex: /\\u G|\\u\{G\}/, unicode: '\u011E' },
  { tex: /\\u g|\\u\{g\}/, unicode: '\u011F' },
  { tex: /\\u I|\\u\{I\}/, unicode: '\u012C' },
  { tex: /\\u \\i/, unicode: '\u012D' }, // adding |\\u\{\\i\} breaks the tests?
  { tex: /\\u O|\\u\{O\}/, unicode: '\u014E' },
  { tex: /\\u o|\\u\{o\}/, unicode: '\u014F' },
  { tex: /\\u U|\\u\{U\}/, unicode: '\u016C' },
  { tex: /\\u u|\\u\{u\}/, unicode: '\u016D' },

  { tex: /\\v A|\\v\{A\}/, unicode: '\u01CD' },
  { tex: /\\v a|\\v\{a\}/, unicode: '\u01CE' },
  { tex: /\\v C|\\v\{C\}/, unicode: '\u010C' },
  { tex: /\\v c|\\v\{c\}/, unicode: '\u010D' },
  { tex: /\\v D|\\v\{D\}/, unicode: '\u010E' },
  { tex: /\\v d|\\v\{d\}/, unicode: '\u010F' },
  { tex: /\\v E|\\v\{E\}/, unicode: '\u011A' },
  { tex: /\\v e|\\v\{e\}/, unicode: '\u011B' },
  { tex: /\\v I|\\v\{I\}/, unicode: '\u01CF' },
  { tex: /\\v i|\\v\{i\}/, unicode: '\u01D0' },
  { tex: /\\v L|\\v\{L\}/, unicode: '\u013D' },
  { tex: /\\v l|\\v\{l\}/, unicode: '\u013E' },
  { tex: /\\v N|\\v\{N\}/, unicode: '\u0147' },
  { tex: /\\v n|\\v\{n\}/, unicode: '\u0148' },
  { tex: /\\v O|\\v\{O\}/, unicode: '\u01D1' },
  { tex: /\\v o|\\v\{o\}/, unicode: '\u01D2' },
  { tex: /\\v R|\\v\{R\}/, unicode: '\u0158' },
  { tex: /\\v r|\\v\{r\}/, unicode: '\u0159' },
  { tex: /\\v S|\\v\{S\}/, unicode: '\u0160' },
  { tex: /\\v s|\\v\{s\}/, unicode: '\u0161' },
  { tex: /\\v T|\\v\{T\}/, unicode: '\u0164' },
  { tex: /\\v t|\\v\{t\}/, unicode: '\u0165' },
  { tex: /\\v U|\\v\{U\}/, unicode: '\u01D3' },
  { tex: /\\v u|\\v\{u\}/, unicode: '\u01D4' },
  { tex: /\\v Z|\\v\{Z\}/, unicode: '\u017D' },
  { tex: /\\v z|\\v\{z\}/, unicode: '\u017E' },

  { tex: /\\texteuro|\{\\mbox\{\\texteuro\}\}|\\mbox\{\\texteuro\}/, unicode: '\u20AC' },

  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char220\}|\\fontencoding\{LECO\}\\selectfont\\char220/, unicode: '\u033C' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char225\}|\\fontencoding\{LECO\}\\selectfont\\char225/, unicode: '\u0361' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char201\}|\\fontencoding\{LELA\}\\selectfont\\char201/, unicode: '\u013F' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char218\}|\\fontencoding\{LECO\}\\selectfont\\char218/, unicode: '\u033A' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char202\}|\\fontencoding\{LELA\}\\selectfont\\char202/, unicode: '\u0140' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char207\}|\\fontencoding\{LECO\}\\selectfont\\char207/, unicode: '\u032F' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char203\}|\\fontencoding\{LECO\}\\selectfont\\char203/, unicode: '\u032B' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char185\}|\\fontencoding\{LECO\}\\selectfont\\char185/, unicode: '\u0319' },
  { tex: /\{\\fontencoding\{LEIP\}\\selectfont\\char202\}|\\fontencoding\{LEIP\}\\selectfont\\char202/, unicode: '\u027F' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char184\}|\\fontencoding\{LECO\}\\selectfont\\char184/, unicode: '\u0318' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char177\}|\\fontencoding\{LECO\}\\selectfont\\char177/, unicode: '\u0311' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char195\}|\\fontencoding\{LELA\}\\selectfont\\char195/, unicode: '\u01BA' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char215\}|\\fontencoding\{LECO\}\\selectfont\\char215/, unicode: '\u0337' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char216\}|\\fontencoding\{LECO\}\\selectfont\\char216/, unicode: '\u0338' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char219\}|\\fontencoding\{LECO\}\\selectfont\\char219/, unicode: '\u033B' },
  { tex: /\{\\fontencoding\{LECO\}\\selectfont\\char221\}|\\fontencoding\{LECO\}\\selectfont\\char221/, unicode: '\u033D' },
  { tex: /\{\\fontencoding\{LEIP\}\\selectfont\\char61\}|\\fontencoding\{LEIP\}\\selectfont\\char61/, unicode: '\u0258' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char63\}|\\fontencoding\{LELA\}\\selectfont\\char63/, unicode: '\u0167' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char91\}|\\fontencoding\{LELA\}\\selectfont\\char91/, unicode: '\u0138' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char40\}|\\fontencoding\{LELA\}\\selectfont\\char40/, unicode: '\u0126' },
  { tex: /\{\\fontencoding\{LELA\}\\selectfont\\char47\}|\\fontencoding\{LELA\}\\selectfont\\char47/, unicode: '\u0166' },

  { tex: /\\mathbin\{\{:\}\\!\\!\{-\}\\!\\!\{:\}\}/, unicode: '\u223A' },

  { tex: /\\mathbit\{A\}/, unicode: '\uD835\uDC68' },
  { tex: /\\mathbit\{a\}/, unicode: '\uD835\uDC82' },
  { tex: /\\mathbit\{B\}/, unicode: '\uD835\uDC69' },
  { tex: /\\mathbit\{b\}/, unicode: '\uD835\uDC83' },
  { tex: /\\mathbit\{C\}/, unicode: '\uD835\uDC6A' },
  { tex: /\\mathbit\{c\}/, unicode: '\uD835\uDC84' },
  { tex: /\\mathbit\{\\Delta\}/, unicode: '\uD835\uDF1F' },
  { tex: /\\mathbit\{D\}/, unicode: '\uD835\uDC6B' },
  { tex: /\\mathbit\{d\}/, unicode: '\uD835\uDC85' },
  { tex: /\\mathbit\{E\}/, unicode: '\uD835\uDC6C' },
  { tex: /\\mathbit\{e\}/, unicode: '\uD835\uDC86' },
  { tex: /\\mathbit\{F\}/, unicode: '\uD835\uDC6D' },
  { tex: /\\mathbit\{f\}/, unicode: '\uD835\uDC87' },
  { tex: /\\mathbit\{\\Gamma\}/, unicode: '\uD835\uDF1E' },
  { tex: /\\mathbit\{G\}/, unicode: '\uD835\uDC6E' },
  { tex: /\\mathbit\{g\}/, unicode: '\uD835\uDC88' },
  { tex: /\\mathbit\{H\}/, unicode: '\uD835\uDC6F' },
  { tex: /\\mathbit\{h\}/, unicode: '\uD835\uDC89' },
  { tex: /\\mathbit\{I\}/, unicode: '\uD835\uDC70' },
  { tex: /\\mathbit\{i\}/, unicode: '\uD835\uDC8A' },
  { tex: /\\mathbit\{J\}/, unicode: '\uD835\uDC71' },
  { tex: /\\mathbit\{j\}/, unicode: '\uD835\uDC8B' },
  { tex: /\\mathbit\{K\}/, unicode: '\uD835\uDC72' },
  { tex: /\\mathbit\{k\}/, unicode: '\uD835\uDC8C' },
  { tex: /\\mathbit\{\\Lambda\}/, unicode: '\uD835\uDF26' },
  { tex: /\\mathbit\{L\}/, unicode: '\uD835\uDC73' },
  { tex: /\\mathbit\{l\}/, unicode: '\uD835\uDC8D' },
  { tex: /\\mathbit\{M\}/, unicode: '\uD835\uDC74' },
  { tex: /\\mathbit\{m\}/, unicode: '\uD835\uDC8E' },
  { tex: /\\mathbit\{\\nabla\}/, unicode: '\uD835\uDF35' },
  { tex: /\\mathbit\{N\}/, unicode: '\uD835\uDC75' },
  { tex: /\\mathbit\{n\}/, unicode: '\uD835\uDC8F' },
  { tex: /\\mathbit\{\\Omega\}/, unicode: '\uD835\uDF34' },
  { tex: /\\mathbit\{O\}/, unicode: '\uD835\uDC76' },
  { tex: /\\mathbit\{o\}/, unicode: '\uD835\uDC90' },
  { tex: /\\mathbit\{\\Phi\}/, unicode: '\uD835\uDF31' },
  { tex: /\\mathbit\{\\phi\}/, unicode: '\uD835\uDF53' },
  { tex: /\\mathbit\{\\Pi\}/, unicode: '\uD835\uDF2B' },
  { tex: /\\mathbit\{\\Psi\}/, unicode: '\uD835\uDF33' },
  { tex: /\\mathbit\{P\}/, unicode: '\uD835\uDC77' },
  { tex: /\\mathbit\{p\}/, unicode: '\uD835\uDC91' },
  { tex: /\\mathbit\{Q\}/, unicode: '\uD835\uDC78' },
  { tex: /\\mathbit\{q\}/, unicode: '\uD835\uDC92' },
  { tex: /\\mathbit\{R\}/, unicode: '\uD835\uDC79' },
  { tex: /\\mathbit\{r\}/, unicode: '\uD835\uDC93' },
  { tex: /\\mathbit\{\\Sigma\}/, unicode: '\uD835\uDF2E' },
  { tex: /\\mathbit\{S\}/, unicode: '\uD835\uDC7A' },
  { tex: /\\mathbit\{s\}/, unicode: '\uD835\uDC94' },
  { tex: /\\mathbit\{\\Theta\}/, unicode: '\uD835\uDF23' },
  { tex: /\\mathbit\{T\}/, unicode: '\uD835\uDC7B' },
  { tex: /\\mathbit\{t\}/, unicode: '\uD835\uDC95' },
  { tex: /\\mathbit\{\\Upsilon\}/, unicode: '\uD835\uDF30' },
  { tex: /\\mathbit\{U\}/, unicode: '\uD835\uDC7C' },
  { tex: /\\mathbit\{u\}/, unicode: '\uD835\uDC96' },
  { tex: /\\mathbit\{\\varkappa\}/, unicode: '\uD835\uDF52' },
  { tex: /\\mathbit\{\\varpi\}/, unicode: '\uD835\uDF55' },
  { tex: /\\mathbit\{\\varrho\}/, unicode: '\uD835\uDF54' },
  { tex: /\\mathbit\{\\varsigma\}/, unicode: '\uD835\uDF47' },
  { tex: /\\mathbit\{\\vartheta\}/, unicode: '\uD835\uDF51' },
  { tex: /\\mathbit\{V\}/, unicode: '\uD835\uDC7D' },
  { tex: /\\mathbit\{v\}/, unicode: '\uD835\uDC97' },
  { tex: /\\mathbit\{W\}/, unicode: '\uD835\uDC7E' },
  { tex: /\\mathbit\{w\}/, unicode: '\uD835\uDC98' },
  { tex: /\\mathbit\{\\Xi\}/, unicode: '\uD835\uDF29' },
  { tex: /\\mathbit\{X\}/, unicode: '\uD835\uDC7F' },
  { tex: /\\mathbit\{x\}/, unicode: '\uD835\uDC99' },
  { tex: /\\mathbit\{Y\}/, unicode: '\uD835\uDC80' },
  { tex: /\\mathbit\{y\}/, unicode: '\uD835\uDC9A' },
  { tex: /\\mathbit\{Z\}/, unicode: '\uD835\uDC81' },
  { tex: /\\mathbit\{z\}/, unicode: '\uD835\uDC9B' },

  { tex: /\\mathsfbfsl\{A\}/, unicode: '\uD835\uDE3C' },
  { tex: /\\mathsfbfsl\{a\}/, unicode: '\uD835\uDE56' },
  { tex: /\\mathsfbfsl\{B\}/, unicode: '\uD835\uDE3D' },
  { tex: /\\mathsfbfsl\{b\}/, unicode: '\uD835\uDE57' },
  { tex: /\\mathsfbfsl\{C\}/, unicode: '\uD835\uDE3E' },
  { tex: /\\mathsfbfsl\{c\}/, unicode: '\uD835\uDE58' },
  { tex: /\\mathsfbfsl\{\\Delta\}/, unicode: '\uD835\uDF93' },
  { tex: /\\mathsfbfsl\{D\}/, unicode: '\uD835\uDE3F' },
  { tex: /\\mathsfbfsl\{d\}/, unicode: '\uD835\uDE59' },
  { tex: /\\mathsfbfsl\{E\}/, unicode: '\uD835\uDE40' },
  { tex: /\\mathsfbfsl\{e\}/, unicode: '\uD835\uDE5A' },
  { tex: /\\mathsfbfsl\{F\}/, unicode: '\uD835\uDE41' },
  { tex: /\\mathsfbfsl\{f\}/, unicode: '\uD835\uDE5B' },
  { tex: /\\mathsfbfsl\{\\Gamma\}/, unicode: '\uD835\uDF92' },
  { tex: /\\mathsfbfsl\{G\}/, unicode: '\uD835\uDE42' },
  { tex: /\\mathsfbfsl\{g\}/, unicode: '\uD835\uDE5C' },
  { tex: /\\mathsfbfsl\{H\}/, unicode: '\uD835\uDE43' },
  { tex: /\\mathsfbfsl\{h\}/, unicode: '\uD835\uDE5D' },
  { tex: /\\mathsfbfsl\{I\}/, unicode: '\uD835\uDE44' },
  { tex: /\\mathsfbfsl\{i\}/, unicode: '\uD835\uDE5E' },
  { tex: /\\mathsfbfsl\{J\}/, unicode: '\uD835\uDE45' },
  { tex: /\\mathsfbfsl\{j\}/, unicode: '\uD835\uDE5F' },
  { tex: /\\mathsfbfsl\{K\}/, unicode: '\uD835\uDE46' },
  { tex: /\\mathsfbfsl\{k\}/, unicode: '\uD835\uDE60' },
  { tex: /\\mathsfbfsl\{\\Lambda\}/, unicode: '\uD835\uDF9A' },
  { tex: /\\mathsfbfsl\{L\}/, unicode: '\uD835\uDE47' },
  { tex: /\\mathsfbfsl\{l\}/, unicode: '\uD835\uDE61' },
  { tex: /\\mathsfbfsl\{M\}/, unicode: '\uD835\uDE48' },
  { tex: /\\mathsfbfsl\{m\}/, unicode: '\uD835\uDE62' },
  { tex: /\\mathsfbfsl\{\\nabla\}/, unicode: '\uD835\uDFA9' },
  { tex: /\\mathsfbfsl\{N\}/, unicode: '\uD835\uDE49' },
  { tex: /\\mathsfbfsl\{n\}/, unicode: '\uD835\uDE63' },
  { tex: /\\mathsfbfsl\{\\Omega\}/, unicode: '\uD835\uDFA8' },
  { tex: /\\mathsfbfsl\{O\}/, unicode: '\uD835\uDE4A' },
  { tex: /\\mathsfbfsl\{o\}/, unicode: '\uD835\uDE64' },
  { tex: /\\mathsfbfsl\{\\Phi\}/, unicode: '\uD835\uDFA5' },
  { tex: /\\mathsfbfsl\{\\phi\}/, unicode: '\uD835\uDFC7' },
  { tex: /\\mathsfbfsl\{\\Pi\}/, unicode: '\uD835\uDF9F' },
  { tex: /\\mathsfbfsl\{\\Psi\}/, unicode: '\uD835\uDFA7' },
  { tex: /\\mathsfbfsl\{P\}/, unicode: '\uD835\uDE4B' },
  { tex: /\\mathsfbfsl\{p\}/, unicode: '\uD835\uDE65' },
  { tex: /\\mathsfbfsl\{Q\}/, unicode: '\uD835\uDE4C' },
  { tex: /\\mathsfbfsl\{q\}/, unicode: '\uD835\uDE66' },
  { tex: /\\mathsfbfsl\{R\}/, unicode: '\uD835\uDE4D' },
  { tex: /\\mathsfbfsl\{r\}/, unicode: '\uD835\uDE67' },
  { tex: /\\mathsfbfsl\{\\Sigma\}/, unicode: '\uD835\uDFA2' },
  { tex: /\\mathsfbfsl\{S\}/, unicode: '\uD835\uDE4E' },
  { tex: /\\mathsfbfsl\{s\}/, unicode: '\uD835\uDE68' },
  { tex: /\\mathsfbfsl\{T\}/, unicode: '\uD835\uDE4F' },
  { tex: /\\mathsfbfsl\{t\}/, unicode: '\uD835\uDE69' },
  { tex: /\\mathsfbfsl\{\\Upsilon\}/, unicode: '\uD835\uDFA4' },
  { tex: /\\mathsfbfsl\{U\}/, unicode: '\uD835\uDE50' },
  { tex: /\\mathsfbfsl\{u\}/, unicode: '\uD835\uDE6A' },
  { tex: /\\mathsfbfsl\{\\varkappa\}/, unicode: '\uD835\uDFC6' },
  { tex: /\\mathsfbfsl\{\\varpi\}/, unicode: '\uD835\uDFC9' },
  { tex: /\\mathsfbfsl\{\\varrho\}/, unicode: '\uD835\uDFC8' },
  { tex: /\\mathsfbfsl\{\\varsigma\}/, unicode: '\uD835\uDFBB' },
  { tex: /\\mathsfbfsl\{\\vartheta\}/, unicode: '\uD835\uDF97' },
  { tex: /\\mathsfbfsl\{V\}/, unicode: '\uD835\uDE51' },
  { tex: /\\mathsfbfsl\{v\}/, unicode: '\uD835\uDE6B' },
  { tex: /\\mathsfbfsl\{W\}/, unicode: '\uD835\uDE52' },
  { tex: /\\mathsfbfsl\{w\}/, unicode: '\uD835\uDE6C' },
  { tex: /\\mathsfbfsl\{\\Xi\}/, unicode: '\uD835\uDF9D' },
  { tex: /\\mathsfbfsl\{X\}/, unicode: '\uD835\uDE53' },
  { tex: /\\mathsfbfsl\{x\}/, unicode: '\uD835\uDE6D' },
  { tex: /\\mathsfbfsl\{Y\}/, unicode: '\uD835\uDE54' },
  { tex: /\\mathsfbfsl\{y\}/, unicode: '\uD835\uDE6E' },
  { tex: /\\mathsfbfsl\{Z\}/, unicode: '\uD835\uDE55' },
  { tex: /\\mathsfbfsl\{z\}/, unicode: '\uD835\uDE6F' },

  { tex: /\\mathsfbf\{0\}/, unicode: '\uD835\uDFEC' },
  { tex: /\\mathsfbf\{1\}/, unicode: '\uD835\uDFED' },
  { tex: /\\mathsfbf\{2\}/, unicode: '\uD835\uDFEE' },
  { tex: /\\mathsfbf\{3\}/, unicode: '\uD835\uDFEF' },
  { tex: /\\mathsfbf\{4\}/, unicode: '\uD835\uDFF0' },
  { tex: /\\mathsfbf\{5\}/, unicode: '\uD835\uDFF1' },
  { tex: /\\mathsfbf\{6\}/, unicode: '\uD835\uDFF2' },
  { tex: /\\mathsfbf\{7\}/, unicode: '\uD835\uDFF3' },
  { tex: /\\mathsfbf\{8\}/, unicode: '\uD835\uDFF4' },
  { tex: /\\mathsfbf\{9\}/, unicode: '\uD835\uDFF5' },
  { tex: /\\mathsfbf\{A\}/, unicode: '\uD835\uDDD4' },
  { tex: /\\mathsfbf\{a\}/, unicode: '\uD835\uDDEE' },
  { tex: /\\mathsfbf\{B\}/, unicode: '\uD835\uDDD5' },
  { tex: /\\mathsfbf\{b\}/, unicode: '\uD835\uDDEF' },
  { tex: /\\mathsfbf\{C\}/, unicode: '\uD835\uDDD6' },
  { tex: /\\mathsfbf\{c\}/, unicode: '\uD835\uDDF0' },
  { tex: /\\mathsfbf\{\\Delta\}/, unicode: '\uD835\uDF59' },
  { tex: /\\mathsfbf\{D\}/, unicode: '\uD835\uDDD7' },
  { tex: /\\mathsfbf\{d\}/, unicode: '\uD835\uDDF1' },
  { tex: /\\mathsfbf\{E\}/, unicode: '\uD835\uDDD8' },
  { tex: /\\mathsfbf\{e\}/, unicode: '\uD835\uDDF2' },
  { tex: /\\mathsfbf\{F\}/, unicode: '\uD835\uDDD9' },
  { tex: /\\mathsfbf\{f\}/, unicode: '\uD835\uDDF3' },
  { tex: /\\mathsfbf\{\\Gamma\}/, unicode: '\uD835\uDF58' },
  { tex: /\\mathsfbf\{G\}/, unicode: '\uD835\uDDDA' },
  { tex: /\\mathsfbf\{g\}/, unicode: '\uD835\uDDF4' },
  { tex: /\\mathsfbf\{H\}/, unicode: '\uD835\uDDDB' },
  { tex: /\\mathsfbf\{h\}/, unicode: '\uD835\uDDF5' },
  { tex: /\\mathsfbf\{I\}/, unicode: '\uD835\uDDDC' },
  { tex: /\\mathsfbf\{i\}/, unicode: '\uD835\uDDF6' },
  { tex: /\\mathsfbf\{J\}/, unicode: '\uD835\uDDDD' },
  { tex: /\\mathsfbf\{j\}/, unicode: '\uD835\uDDF7' },
  { tex: /\\mathsfbf\{K\}/, unicode: '\uD835\uDDDE' },
  { tex: /\\mathsfbf\{k\}/, unicode: '\uD835\uDDF8' },
  { tex: /\\mathsfbf\{\\Lambda\}/, unicode: '\uD835\uDF60' },
  { tex: /\\mathsfbf\{L\}/, unicode: '\uD835\uDDDF' },
  { tex: /\\mathsfbf\{l\}/, unicode: '\uD835\uDDF9' },
  { tex: /\\mathsfbf\{M\}/, unicode: '\uD835\uDDE0' },
  { tex: /\\mathsfbf\{m\}/, unicode: '\uD835\uDDFA' },
  { tex: /\\mathsfbf\{\\nabla\}/, unicode: '\uD835\uDF6F' },
  { tex: /\\mathsfbf\{N\}/, unicode: '\uD835\uDDE1' },
  { tex: /\\mathsfbf\{n\}/, unicode: '\uD835\uDDFB' },
  { tex: /\\mathsfbf\{\\Omega\}/, unicode: '\uD835\uDF6E' },
  { tex: /\\mathsfbf\{O\}/, unicode: '\uD835\uDDE2' },
  { tex: /\\mathsfbf\{o\}/, unicode: '\uD835\uDDFC' },
  { tex: /\\mathsfbf\{\\Phi\}/, unicode: '\uD835\uDF6B' },
  { tex: /\\mathsfbf\{\\phi\}/, unicode: '\uD835\uDF8D' },
  { tex: /\\mathsfbf\{\\Pi\}/, unicode: '\uD835\uDF65' },
  { tex: /\\mathsfbf\{\\Psi\}/, unicode: '\uD835\uDF6D' },
  { tex: /\\mathsfbf\{P\}/, unicode: '\uD835\uDDE3' },
  { tex: /\\mathsfbf\{p\}/, unicode: '\uD835\uDDFD' },
  { tex: /\\mathsfbf\{Q\}/, unicode: '\uD835\uDDE4' },
  { tex: /\\mathsfbf\{q\}/, unicode: '\uD835\uDDFE' },
  { tex: /\\mathsfbf\{R\}/, unicode: '\uD835\uDDE5' },
  { tex: /\\mathsfbf\{r\}/, unicode: '\uD835\uDDFF' },
  { tex: /\\mathsfbf\{\\Sigma\}/, unicode: '\uD835\uDF68' },
  { tex: /\\mathsfbf\{S\}/, unicode: '\uD835\uDDE6' },
  { tex: /\\mathsfbf\{s\}/, unicode: '\uD835\uDE00' },
  { tex: /\\mathsfbf\{\\Theta\}/, unicode: '\uD835\uDF5D' },
  { tex: /\\mathsfbf\{T\}/, unicode: '\uD835\uDDE7' },
  { tex: /\\mathsfbf\{t\}/, unicode: '\uD835\uDE01' },
  { tex: /\\mathsfbf\{\\Upsilon\}/, unicode: '\uD835\uDF6A' },
  { tex: /\\mathsfbf\{U\}/, unicode: '\uD835\uDDE8' },
  { tex: /\\mathsfbf\{u\}/, unicode: '\uD835\uDE02' },
  { tex: /\\mathsfbf\{\\varkappa\}/, unicode: '\uD835\uDF8C' },
  { tex: /\\mathsfbf\{\\varpi\}/, unicode: '\uD835\uDF8F' },
  { tex: /\\mathsfbf\{\\varrho\}/, unicode: '\uD835\uDF8E' },
  { tex: /\\mathsfbf\{\\varsigma\}/, unicode: '\uD835\uDF81' },
  { tex: /\\mathsfbf\{\\vartheta\}/, unicode: '\uD835\uDF67' },
  { tex: /\\mathsfbf\{V\}/, unicode: '\uD835\uDDE9' },
  { tex: /\\mathsfbf\{v\}/, unicode: '\uD835\uDE03' },
  { tex: /\\mathsfbf\{W\}/, unicode: '\uD835\uDDEA' },
  { tex: /\\mathsfbf\{w\}/, unicode: '\uD835\uDE04' },
  { tex: /\\mathsfbf\{\\Xi\}/, unicode: '\uD835\uDF63' },
  { tex: /\\mathsfbf\{X\}/, unicode: '\uD835\uDDEB' },
  { tex: /\\mathsfbf\{x\}/, unicode: '\uD835\uDE05' },
  { tex: /\\mathsfbf\{Y\}/, unicode: '\uD835\uDDEC' },
  { tex: /\\mathsfbf\{y\}/, unicode: '\uD835\uDE06' },
  { tex: /\\mathsfbf\{Z\}/, unicode: '\uD835\uDDED' },
  { tex: /\\mathsfbf\{z\}/, unicode: '\uD835\uDE07' },

  { tex: /\\mathrm\{\\ddot\{I\}\}/, unicode: '\u03AA' },
  { tex: /\\mathrm\{\\ddot\{Y\}\}/, unicode: '\u03AB' },
  { tex: /\\mathrm\{\\mu\}/, unicode: '\xB5' },
  { tex: /\\mathrm\{'\\Omega\}/, unicode: '\u038F' },
  { tex: /\\mathrm\{'Y\}/, unicode: '\u038E' },
  { tex: /\\mathrm/, unicode: '' }, // must be last in group

  { tex: /\\mathsl\{A\}/, unicode: '\uD835\uDC34' },
  { tex: /\\mathsl\{a\}/, unicode: '\uD835\uDC4E' },
  { tex: /\\mathsl\{B\}/, unicode: '\uD835\uDC35' },
  { tex: /\\mathsl\{b\}/, unicode: '\uD835\uDC4F' },
  { tex: /\\mathsl\{C\}/, unicode: '\uD835\uDC36' },
  { tex: /\\mathsl\{c\}/, unicode: '\uD835\uDC50' },
  { tex: /\\mathsl\{\\Delta\}/, unicode: '\uD835\uDEE5' },
  { tex: /\\mathsl\{D\}/, unicode: '\uD835\uDC37' },
  { tex: /\\mathsl\{d\}/, unicode: '\uD835\uDC51' },
  { tex: /\\mathsl\{E\}/, unicode: '\uD835\uDC38' },
  { tex: /\\mathsl\{e\}/, unicode: '\uD835\uDC52' },
  { tex: /\\mathsl\{F\}/, unicode: '\uD835\uDC39' },
  { tex: /\\mathsl\{f\}/, unicode: '\uD835\uDC53' },
  { tex: /\\mathsl\{\\Gamma\}/, unicode: '\uD835\uDEE4' },
  { tex: /\\mathsl\{G\}/, unicode: '\uD835\uDC3A' },
  { tex: /\\mathsl\{g\}/, unicode: '\uD835\uDC54' },
  { tex: /\\mathsl\{H\}/, unicode: '\uD835\uDC3B' },
  { tex: /\\mathsl\{I\}/, unicode: '\uD835\uDC3C' },
  { tex: /\\mathsl\{i\}/, unicode: '\uD835\uDC56' },
  { tex: /\\mathsl\{J\}/, unicode: '\uD835\uDC3D' },
  { tex: /\\mathsl\{j\}/, unicode: '\uD835\uDC57' },
  { tex: /\\mathsl\{K\}/, unicode: '\uD835\uDC3E' },
  { tex: /\\mathsl\{k\}/, unicode: '\uD835\uDC58' },
  { tex: /\\mathsl\{\\Lambda\}/, unicode: '\uD835\uDEEC' },
  { tex: /\\mathsl\{L\}/, unicode: '\uD835\uDC3F' },
  { tex: /\\mathsl\{l\}/, unicode: '\uD835\uDC59' },
  { tex: /\\mathsl\{M\}/, unicode: '\uD835\uDC40' },
  { tex: /\\mathsl\{m\}/, unicode: '\uD835\uDC5A' },
  { tex: /\\mathsl\{\\nabla\}/, unicode: '\uD835\uDEFB' },
  { tex: /\\mathsl\{N\}/, unicode: '\uD835\uDC41' },
  { tex: /\\mathsl\{n\}/, unicode: '\uD835\uDC5B' },
  { tex: /\\mathsl\{\\Omega\}/, unicode: '\uD835\uDEFA' },
  { tex: /\\mathsl\{O\}/, unicode: '\uD835\uDC42' },
  { tex: /\\mathsl\{o\}/, unicode: '\uD835\uDC5C' },
  { tex: /\\mathsl\{\\Phi\}/, unicode: '\uD835\uDEF7' },
  { tex: /\\mathsl\{\\phi\}/, unicode: '\uD835\uDF19' },
  { tex: /\\mathsl\{\\Pi\}/, unicode: '\uD835\uDEF1' },
  { tex: /\\mathsl\{\\Psi\}/, unicode: '\uD835\uDEF9' },
  { tex: /\\mathsl\{P\}/, unicode: '\uD835\uDC43' },
  { tex: /\\mathsl\{p\}/, unicode: '\uD835\uDC5D' },
  { tex: /\\mathsl\{Q\}/, unicode: '\uD835\uDC44' },
  { tex: /\\mathsl\{q\}/, unicode: '\uD835\uDC5E' },
  { tex: /\\mathsl\{R\}/, unicode: '\uD835\uDC45' },
  { tex: /\\mathsl\{r\}/, unicode: '\uD835\uDC5F' },
  { tex: /\\mathsl\{\\Sigma\}/, unicode: '\uD835\uDEF4' },
  { tex: /\\mathsl\{S\}/, unicode: '\uD835\uDC46' },
  { tex: /\\mathsl\{s\}/, unicode: '\uD835\uDC60' },
  { tex: /\\mathsl\{\\Theta\}/, unicode: '\uD835\uDEE9' },
  { tex: /\\mathsl\{T\}/, unicode: '\uD835\uDC47' },
  { tex: /\\mathsl\{t\}/, unicode: '\uD835\uDC61' },
  { tex: /\\mathsl\{\\Upsilon\}/, unicode: '\uD835\uDEF6' },
  { tex: /\\mathsl\{U\}/, unicode: '\uD835\uDC48' },
  { tex: /\\mathsl\{u\}/, unicode: '\uD835\uDC62' },
  { tex: /\\mathsl\{\\varkappa\}/, unicode: '\uD835\uDF18' },
  { tex: /\\mathsl\{\\varpi\}/, unicode: '\uD835\uDF1B' },
  { tex: /\\mathsl\{\\varrho\}/, unicode: '\uD835\uDF1A' },
  { tex: /\\mathsl\{\\varsigma\}/, unicode: '\uD835\uDF0D' },
  { tex: /\\mathsl\{\\vartheta\}/, unicode: '\uD835\uDEF3' },
  { tex: /\\mathsl\{V\}/, unicode: '\uD835\uDC49' },
  { tex: /\\mathsl\{v\}/, unicode: '\uD835\uDC63' },
  { tex: /\\mathsl\{W\}/, unicode: '\uD835\uDC4A' },
  { tex: /\\mathsl\{w\}/, unicode: '\uD835\uDC64' },
  { tex: /\\mathsl\{\\Xi\}/, unicode: '\uD835\uDEEF' },
  { tex: /\\mathsl\{X\}/, unicode: '\uD835\uDC4B' },
  { tex: /\\mathsl\{x\}/, unicode: '\uD835\uDC65' },
  { tex: /\\mathsl\{Y\}/, unicode: '\uD835\uDC4C' },
  { tex: /\\mathsl\{y\}/, unicode: '\uD835\uDC66' },
  { tex: /\\mathsl\{Z\}/, unicode: '\uD835\uDC4D' },
  { tex: /\\mathsl\{z\}/, unicode: '\uD835\uDC67' },

  { tex: /\\mathbf\{0\}/, unicode: '\uD835\uDFCE' },
  { tex: /\\mathbf\{1\}/, unicode: '\uD835\uDFCF' },
  { tex: /\\mathbf\{2\}/, unicode: '\uD835\uDFD0' },
  { tex: /\\mathbf\{3\}/, unicode: '\uD835\uDFD1' },
  { tex: /\\mathbf\{4\}/, unicode: '\uD835\uDFD2' },
  { tex: /\\mathbf\{5\}/, unicode: '\uD835\uDFD3' },
  { tex: /\\mathbf\{6\}/, unicode: '\uD835\uDFD4' },
  { tex: /\\mathbf\{7\}/, unicode: '\uD835\uDFD5' },
  { tex: /\\mathbf\{8\}/, unicode: '\uD835\uDFD6' },
  { tex: /\\mathbf\{9\}/, unicode: '\uD835\uDFD7' },
  { tex: /\\mathbf\{A\}/, unicode: '\uD835\uDC00' },
  { tex: /\\mathbf\{a\}/, unicode: '\uD835\uDC1A' },
  { tex: /\\mathbf\{B\}/, unicode: '\uD835\uDC01' },
  { tex: /\\mathbf\{b\}/, unicode: '\uD835\uDC1B' },
  { tex: /\\mathbf\{C\}/, unicode: '\uD835\uDC02' },
  { tex: /\\mathbf\{c\}/, unicode: '\uD835\uDC1C' },
  { tex: /\\mathbf\{\\Delta\}/, unicode: '\uD835\uDEAB' },
  { tex: /\\mathbf\{D\}/, unicode: '\uD835\uDC03' },
  { tex: /\\mathbf\{d\}/, unicode: '\uD835\uDC1D' },
  { tex: /\\mathbf\{E\}/, unicode: '\uD835\uDC04' },
  { tex: /\\mathbf\{e\}/, unicode: '\uD835\uDC1E' },
  { tex: /\\mathbf\{F\}/, unicode: '\uD835\uDC05' },
  { tex: /\\mathbf\{f\}/, unicode: '\uD835\uDC1F' },
  { tex: /\\mathbf\{\\Gamma\}/, unicode: '\uD835\uDEAA' },
  { tex: /\\mathbf\{G\}/, unicode: '\uD835\uDC06' },
  { tex: /\\mathbf\{g\}/, unicode: '\uD835\uDC20' },
  { tex: /\\mathbf\{H\}/, unicode: '\uD835\uDC07' },
  { tex: /\\mathbf\{h\}/, unicode: '\uD835\uDC21' },
  { tex: /\\mathbf\{I\}/, unicode: '\uD835\uDC08' },
  { tex: /\\mathbf\{i\}/, unicode: '\uD835\uDC22' },
  { tex: /\\mathbf\{J\}/, unicode: '\uD835\uDC09' },
  { tex: /\\mathbf\{j\}/, unicode: '\uD835\uDC23' },
  { tex: /\\mathbf\{K\}/, unicode: '\uD835\uDC0A' },
  { tex: /\\mathbf\{k\}/, unicode: '\uD835\uDC24' },
  { tex: /\\mathbf\{\\Lambda\}/, unicode: '\uD835\uDEB2' },
  { tex: /\\mathbf\{L\}/, unicode: '\uD835\uDC0B' },
  { tex: /\\mathbf\{l\}/, unicode: '\uD835\uDC25' },
  { tex: /\\mathbf\{M\}/, unicode: '\uD835\uDC0C' },
  { tex: /\\mathbf\{m\}/, unicode: '\uD835\uDC26' },
  { tex: /\\mathbf\{\\nabla\}/, unicode: '\uD835\uDEC1' },
  { tex: /\\mathbf\{N\}/, unicode: '\uD835\uDC0D' },
  { tex: /\\mathbf\{n\}/, unicode: '\uD835\uDC27' },
  { tex: /\\mathbf\{\\Omega\}/, unicode: '\uD835\uDEC0' },
  { tex: /\\mathbf\{O\}/, unicode: '\uD835\uDC0E' },
  { tex: /\\mathbf\{o\}/, unicode: '\uD835\uDC28' },
  { tex: /\\mathbf\{\\Phi\}/, unicode: '\uD835\uDEBD' },
  { tex: /\\mathbf\{\\phi\}/, unicode: '\uD835\uDEDF' },
  { tex: /\\mathbf\{\\Pi\}/, unicode: '\uD835\uDEB7' },
  { tex: /\\mathbf\{\\Psi\}/, unicode: '\uD835\uDEBF' },
  { tex: /\\mathbf\{P\}/, unicode: '\uD835\uDC0F' },
  { tex: /\\mathbf\{p\}/, unicode: '\uD835\uDC29' },
  { tex: /\\mathbf\{Q\}/, unicode: '\uD835\uDC10' },
  { tex: /\\mathbf\{q\}/, unicode: '\uD835\uDC2A' },
  { tex: /\\mathbf\{R\}/, unicode: '\uD835\uDC11' },
  { tex: /\\mathbf\{r\}/, unicode: '\uD835\uDC2B' },
  { tex: /\\mathbf\{\\Sigma\}/, unicode: '\uD835\uDEBA' },
  { tex: /\\mathbf\{S\}/, unicode: '\uD835\uDC12' },
  { tex: /\\mathbf\{s\}/, unicode: '\uD835\uDC2C' },
  { tex: /\\mathbf\{\\Theta\}/, unicode: '\uD835\uDEAF' },
  { tex: /\\mathbf\{\\theta\}/, unicode: '\uD835\uDEC9' },
  { tex: /\\mathbf\{T\}/, unicode: '\uD835\uDC13' },
  { tex: /\\mathbf\{t\}/, unicode: '\uD835\uDC2D' },
  { tex: /\\mathbf\{\\Upsilon\}/, unicode: '\uD835\uDEBC' },
  { tex: /\\mathbf\{U\}/, unicode: '\uD835\uDC14' },
  { tex: /\\mathbf\{u\}/, unicode: '\uD835\uDC2E' },
  { tex: /\\mathbf\{\\varkappa\}/, unicode: '\uD835\uDEDE' },
  { tex: /\\mathbf\{\\varpi\}/, unicode: '\uD835\uDEE1' },
  { tex: /\\mathbf\{\\varrho\}/, unicode: '\uD835\uDEE0' },
  { tex: /\\mathbf\{\\varsigma\}/, unicode: '\uD835\uDED3' },
  { tex: /\\mathbf\{\\vartheta\}/, unicode: '\uD835\uDEB9' },
  { tex: /\\mathbf\{V\}/, unicode: '\uD835\uDC15' },
  { tex: /\\mathbf\{v\}/, unicode: '\uD835\uDC2F' },
  { tex: /\\mathbf\{W\}/, unicode: '\uD835\uDC16' },
  { tex: /\\mathbf\{w\}/, unicode: '\uD835\uDC30' },
  { tex: /\\mathbf\{\\Xi\}/, unicode: '\uD835\uDEB5' },
  { tex: /\\mathbf\{X\}/, unicode: '\uD835\uDC17' },
  { tex: /\\mathbf\{x\}/, unicode: '\uD835\uDC31' },
  { tex: /\\mathbf\{Y\}/, unicode: '\uD835\uDC18' },
  { tex: /\\mathbf\{y\}/, unicode: '\uD835\uDC32' },
  { tex: /\\mathbf\{Z\}/, unicode: '\uD835\uDC19' },
  { tex: /\\mathbf\{z\}/, unicode: '\uD835\uDC33' },

  { tex: /\\mathbb\{0\}/, unicode: '\uD835\uDFD8' },
  { tex: /\\mathbb\{1\}/, unicode: '\uD835\uDFD9' },
  { tex: /\\mathbb\{2\}/, unicode: '\uD835\uDFDA' },
  { tex: /\\mathbb\{3\}/, unicode: '\uD835\uDFDB' },
  { tex: /\\mathbb\{4\}/, unicode: '\uD835\uDFDC' },
  { tex: /\\mathbb\{5\}/, unicode: '\uD835\uDFDD' },
  { tex: /\\mathbb\{6\}/, unicode: '\uD835\uDFDE' },
  { tex: /\\mathbb\{7\}/, unicode: '\uD835\uDFDF' },
  { tex: /\\mathbb\{8\}/, unicode: '\uD835\uDFE0' },
  { tex: /\\mathbb\{9\}/, unicode: '\uD835\uDFE1' },
  { tex: /\\mathbb\{A\}/, unicode: '\uD835\uDD38' },
  { tex: /\\mathbb\{a\}/, unicode: '\uD835\uDD52' },
  { tex: /\\mathbb\{B\}/, unicode: '\uD835\uDD39' },
  { tex: /\\mathbb\{b\}/, unicode: '\uD835\uDD53' },
  { tex: /\\mathbb\{C\}/, unicode: '\u2102' },
  { tex: /\\mathbb\{c\}/, unicode: '\uD835\uDD54' },
  { tex: /\\mathbb\{D\}/, unicode: '\uD835\uDD3B' },
  { tex: /\\mathbb\{d\}/, unicode: '\uD835\uDD55' },
  { tex: /\\mathbb\{E\}/, unicode: '\uD835\uDD3C' },
  { tex: /\\mathbb\{e\}/, unicode: '\uD835\uDD56' },
  { tex: /\\mathbb\{F\}/, unicode: '\uD835\uDD3D' },
  { tex: /\\mathbb\{f\}/, unicode: '\uD835\uDD57' },
  { tex: /\\mathbb\{\\gamma\}/, unicode: '\u213D' },
  { tex: /\\mathbb\{\\Gamma\}/, unicode: '\u213E' },
  { tex: /\\mathbb\{G\}/, unicode: '\uD835\uDD3E' },
  { tex: /\\mathbb\{g\}/, unicode: '\uD835\uDD58' },
  { tex: /\\mathbb\{H\}/, unicode: '\u210D' },
  { tex: /\\mathbb\{h\}/, unicode: '\uD835\uDD59' },
  { tex: /\\mathbb\{I\}/, unicode: '\uD835\uDD40' },
  { tex: /\\mathbb\{i\}/, unicode: '\uD835\uDD5A' },
  { tex: /\\mathbb\{J\}/, unicode: '\uD835\uDD41' },
  { tex: /\\mathbb\{j\}/, unicode: '\uD835\uDD5B' },
  { tex: /\\mathbb\{K\}/, unicode: '\uD835\uDD42' },
  { tex: /\\mathbb\{k\}/, unicode: '\uD835\uDD5C' },
  { tex: /\\mathbb\{L\}/, unicode: '\uD835\uDD43' },
  { tex: /\\mathbb\{l\}/, unicode: '\uD835\uDD5D' },
  { tex: /\\mathbb\{M\}/, unicode: '\uD835\uDD44' },
  { tex: /\\mathbb\{m\}/, unicode: '\uD835\uDD5E' },
  { tex: /\\mathbb\{N\}/, unicode: '\u2115' },
  { tex: /\\mathbb\{n\}/, unicode: '\uD835\uDD5F' },
  { tex: /\\mathbb\{O\}/, unicode: '\uD835\uDD46' },
  { tex: /\\mathbb\{o\}/, unicode: '\uD835\uDD60' },
  { tex: /\\mathbb\{\\pi\}/, unicode: '\u213C' },
  { tex: /\\mathbb\{\\Pi\}/, unicode: '\u213F' },
  { tex: /\\mathbb\{P\}/, unicode: '\u2119' },
  { tex: /\\mathbb\{p\}/, unicode: '\uD835\uDD61' },
  { tex: /\\mathbb\{Q\}/, unicode: '\u211A' },
  { tex: /\\mathbb\{q\}/, unicode: '\uD835\uDD62' },
  { tex: /\\mathbb\{R\}/, unicode: '\u211D' },
  { tex: /\\mathbb\{r\}/, unicode: '\uD835\uDD63' },
  { tex: /\\mathbb\{\\Sigma\}/, unicode: '\u2140' },
  { tex: /\\mathbb\{S\}/, unicode: '\uD835\uDD4A' },
  { tex: /\\mathbb\{s\}/, unicode: '\uD835\uDD64' },
  { tex: /\\mathbb\{T\}/, unicode: '\uD835\uDD4B' },
  { tex: /\\mathbb\{t\}/, unicode: '\uD835\uDD65' },
  { tex: /\\mathbb\{U\}/, unicode: '\uD835\uDD4C' },
  { tex: /\\mathbb\{u\}/, unicode: '\uD835\uDD66' },
  { tex: /\\mathbb\{V\}/, unicode: '\uD835\uDD4D' },
  { tex: /\\mathbb\{v\}/, unicode: '\uD835\uDD67' },
  { tex: /\\mathbb\{W\}/, unicode: '\uD835\uDD4E' },
  { tex: /\\mathbb\{w\}/, unicode: '\uD835\uDD68' },
  { tex: /\\mathbb\{X\}/, unicode: '\uD835\uDD4F' },
  { tex: /\\mathbb\{x\}/, unicode: '\uD835\uDD69' },
  { tex: /\\mathbb\{Y\}/, unicode: '\uD835\uDD50' },
  { tex: /\\mathbb\{y\}/, unicode: '\uD835\uDD6A' },
  { tex: /\\mathbb\{Z\}/, unicode: '\u2124' },
  { tex: /\\mathbb\{z\}/, unicode: '\uD835\uDD6B' },

  { tex: /\\mathslbb\{A\}/, unicode: '\uD835\uDD6C' },
  { tex: /\\mathslbb\{a\}/, unicode: '\uD835\uDD86' },
  { tex: /\\mathslbb\{B\}/, unicode: '\uD835\uDD6D' },
  { tex: /\\mathslbb\{b\}/, unicode: '\uD835\uDD87' },
  { tex: /\\mathslbb\{C\}/, unicode: '\uD835\uDD6E' },
  { tex: /\\mathslbb\{c\}/, unicode: '\uD835\uDD88' },
  { tex: /\\mathslbb\{D\}/, unicode: '\uD835\uDD6F' },
  { tex: /\\mathslbb\{d\}/, unicode: '\uD835\uDD89' },
  { tex: /\\mathslbb\{E\}/, unicode: '\uD835\uDD70' },
  { tex: /\\mathslbb\{e\}/, unicode: '\uD835\uDD8A' },
  { tex: /\\mathslbb\{F\}/, unicode: '\uD835\uDD71' },
  { tex: /\\mathslbb\{f\}/, unicode: '\uD835\uDD8B' },
  { tex: /\\mathslbb\{G\}/, unicode: '\uD835\uDD72' },
  { tex: /\\mathslbb\{g\}/, unicode: '\uD835\uDD8C' },
  { tex: /\\mathslbb\{H\}/, unicode: '\uD835\uDD73' },
  { tex: /\\mathslbb\{h\}/, unicode: '\uD835\uDD8D' },
  { tex: /\\mathslbb\{I\}/, unicode: '\uD835\uDD74' },
  { tex: /\\mathslbb\{i\}/, unicode: '\uD835\uDD8E' },
  { tex: /\\mathslbb\{J\}/, unicode: '\uD835\uDD75' },
  { tex: /\\mathslbb\{j\}/, unicode: '\uD835\uDD8F' },
  { tex: /\\mathslbb\{K\}/, unicode: '\uD835\uDD76' },
  { tex: /\\mathslbb\{k\}/, unicode: '\uD835\uDD90' },
  { tex: /\\mathslbb\{L\}/, unicode: '\uD835\uDD77' },
  { tex: /\\mathslbb\{l\}/, unicode: '\uD835\uDD91' },
  { tex: /\\mathslbb\{M\}/, unicode: '\uD835\uDD78' },
  { tex: /\\mathslbb\{m\}/, unicode: '\uD835\uDD92' },
  { tex: /\\mathslbb\{N\}/, unicode: '\uD835\uDD79' },
  { tex: /\\mathslbb\{n\}/, unicode: '\uD835\uDD93' },
  { tex: /\\mathslbb\{O\}/, unicode: '\uD835\uDD7A' },
  { tex: /\\mathslbb\{o\}/, unicode: '\uD835\uDD94' },
  { tex: /\\mathslbb\{P\}/, unicode: '\uD835\uDD7B' },
  { tex: /\\mathslbb\{p\}/, unicode: '\uD835\uDD95' },
  { tex: /\\mathslbb\{Q\}/, unicode: '\uD835\uDD7C' },
  { tex: /\\mathslbb\{q\}/, unicode: '\uD835\uDD96' },
  { tex: /\\mathslbb\{R\}/, unicode: '\uD835\uDD7D' },
  { tex: /\\mathslbb\{r\}/, unicode: '\uD835\uDD97' },
  { tex: /\\mathslbb\{S\}/, unicode: '\uD835\uDD7E' },
  { tex: /\\mathslbb\{s\}/, unicode: '\uD835\uDD98' },
  { tex: /\\mathslbb\{T\}/, unicode: '\uD835\uDD7F' },
  { tex: /\\mathslbb\{t\}/, unicode: '\uD835\uDD99' },
  { tex: /\\mathslbb\{U\}/, unicode: '\uD835\uDD80' },
  { tex: /\\mathslbb\{u\}/, unicode: '\uD835\uDD9A' },
  { tex: /\\mathslbb\{V\}/, unicode: '\uD835\uDD81' },
  { tex: /\\mathslbb\{v\}/, unicode: '\uD835\uDD9B' },
  { tex: /\\mathslbb\{W\}/, unicode: '\uD835\uDD82' },
  { tex: /\\mathslbb\{w\}/, unicode: '\uD835\uDD9C' },
  { tex: /\\mathslbb\{X\}/, unicode: '\uD835\uDD83' },
  { tex: /\\mathslbb\{x\}/, unicode: '\uD835\uDD9D' },
  { tex: /\\mathslbb\{Y\}/, unicode: '\uD835\uDD84' },
  { tex: /\\mathslbb\{y\}/, unicode: '\uD835\uDD9E' },
  { tex: /\\mathslbb\{Z\}/, unicode: '\uD835\uDD85' },
  { tex: /\\mathslbb\{z\}/, unicode: '\uD835\uDD9F' },

  { tex: /\\mathfrak\{A\}/, unicode: '\uD835\uDD04' },
  { tex: /\\mathfrak\{a\}/, unicode: '\uD835\uDD1E' },
  { tex: /\\mathfrak\{B\}/, unicode: '\uD835\uDD05' },
  { tex: /\\mathfrak\{b\}/, unicode: '\uD835\uDD1F' },
  { tex: /\\mathfrak\{C\}/, unicode: '\u212D' },
  { tex: /\\mathfrak\{c\}/, unicode: '\uD835\uDD20' },
  { tex: /\\mathfrak\{D\}/, unicode: '\uD835\uDD07' },
  { tex: /\\mathfrak\{d\}/, unicode: '\uD835\uDD21' },
  { tex: /\\mathfrak\{E\}/, unicode: '\uD835\uDD08' },
  { tex: /\\mathfrak\{e\}/, unicode: '\uD835\uDD22' },
  { tex: /\\mathfrak\{F\}/, unicode: '\uD835\uDD09' },
  { tex: /\\mathfrak\{f\}/, unicode: '\uD835\uDD23' },
  { tex: /\\mathfrak\{G\}/, unicode: '\uD835\uDD0A' },
  { tex: /\\mathfrak\{g\}/, unicode: '\uD835\uDD24' },
  { tex: /\\mathfrak\{H\}/, unicode: '\u210C' },
  { tex: /\\mathfrak\{h\}/, unicode: '\uD835\uDD25' },
  { tex: /\\mathfrak\{I\}/, unicode: '\u2111' },
  { tex: /\\mathfrak\{i\}/, unicode: '\uD835\uDD26' },
  { tex: /\\mathfrak\{J\}/, unicode: '\uD835\uDD0D' },
  { tex: /\\mathfrak\{j\}/, unicode: '\uD835\uDD27' },
  { tex: /\\mathfrak\{K\}/, unicode: '\uD835\uDD0E' },
  { tex: /\\mathfrak\{k\}/, unicode: '\uD835\uDD28' },
  { tex: /\\mathfrak\{L\}/, unicode: '\uD835\uDD0F' },
  { tex: /\\mathfrak\{l\}/, unicode: '\uD835\uDD29' },
  { tex: /\\mathfrak\{M\}/, unicode: '\uD835\uDD10' },
  { tex: /\\mathfrak\{m\}/, unicode: '\uD835\uDD2A' },
  { tex: /\\mathfrak\{N\}/, unicode: '\uD835\uDD11' },
  { tex: /\\mathfrak\{n\}/, unicode: '\uD835\uDD2B' },
  { tex: /\\mathfrak\{O\}/, unicode: '\uD835\uDD12' },
  { tex: /\\mathfrak\{o\}/, unicode: '\uD835\uDD2C' },
  { tex: /\\mathfrak\{P\}/, unicode: '\uD835\uDD13' },
  { tex: /\\mathfrak\{p\}/, unicode: '\uD835\uDD2D' },
  { tex: /\\mathfrak\{Q\}/, unicode: '\uD835\uDD14' },
  { tex: /\\mathfrak\{q\}/, unicode: '\uD835\uDD2E' },
  { tex: /\\mathfrak\{R\}/, unicode: '\u211C' },
  { tex: /\\mathfrak\{r\}/, unicode: '\uD835\uDD2F' },
  { tex: /\\mathfrak\{S\}/, unicode: '\uD835\uDD16' },
  { tex: /\\mathfrak\{s\}/, unicode: '\uD835\uDD30' },
  { tex: /\\mathfrak\{T\}/, unicode: '\uD835\uDD17' },
  { tex: /\\mathfrak\{t\}/, unicode: '\uD835\uDD31' },
  { tex: /\\mathfrak\{U\}/, unicode: '\uD835\uDD18' },
  { tex: /\\mathfrak\{u\}/, unicode: '\uD835\uDD32' },
  { tex: /\\mathfrak\{V\}/, unicode: '\uD835\uDD19' },
  { tex: /\\mathfrak\{v\}/, unicode: '\uD835\uDD33' },
  { tex: /\\mathfrak\{W\}/, unicode: '\uD835\uDD1A' },
  { tex: /\\mathfrak\{w\}/, unicode: '\uD835\uDD34' },
  { tex: /\\mathfrak\{X\}/, unicode: '\uD835\uDD1B' },
  { tex: /\\mathfrak\{x\}/, unicode: '\uD835\uDD35' },
  { tex: /\\mathfrak\{Y\}/, unicode: '\uD835\uDD1C' },
  { tex: /\\mathfrak\{y\}/, unicode: '\uD835\uDD36' },
  { tex: /\\mathfrak\{Z\}/, unicode: '\u2128' },
  { tex: /\\mathfrak\{z\}/, unicode: '\uD835\uDD37' },

  { tex: /\\mathsfsl\{A\}/, unicode: '\uD835\uDE08' },
  { tex: /\\mathsfsl\{a\}/, unicode: '\uD835\uDE22' },
  { tex: /\\mathsfsl\{B\}/, unicode: '\uD835\uDE09' },
  { tex: /\\mathsfsl\{b\}/, unicode: '\uD835\uDE23' },
  { tex: /\\mathsfsl\{C\}/, unicode: '\uD835\uDE0A' },
  { tex: /\\mathsfsl\{c\}/, unicode: '\uD835\uDE24' },
  { tex: /\\mathsfsl\{D\}/, unicode: '\uD835\uDE0B' },
  { tex: /\\mathsfsl\{d\}/, unicode: '\uD835\uDE25' },
  { tex: /\\mathsfsl\{E\}/, unicode: '\uD835\uDE0C' },
  { tex: /\\mathsfsl\{e\}/, unicode: '\uD835\uDE26' },
  { tex: /\\mathsfsl\{F\}/, unicode: '\uD835\uDE0D' },
  { tex: /\\mathsfsl\{f\}/, unicode: '\uD835\uDE27' },
  { tex: /\\mathsfsl\{G\}/, unicode: '\uD835\uDE0E' },
  { tex: /\\mathsfsl\{g\}/, unicode: '\uD835\uDE28' },
  { tex: /\\mathsfsl\{H\}/, unicode: '\uD835\uDE0F' },
  { tex: /\\mathsfsl\{h\}/, unicode: '\uD835\uDE29' },
  { tex: /\\mathsfsl\{I\}/, unicode: '\uD835\uDE10' },
  { tex: /\\mathsfsl\{i\}/, unicode: '\uD835\uDE2A' },
  { tex: /\\mathsfsl\{J\}/, unicode: '\uD835\uDE11' },
  { tex: /\\mathsfsl\{j\}/, unicode: '\uD835\uDE2B' },
  { tex: /\\mathsfsl\{K\}/, unicode: '\uD835\uDE12' },
  { tex: /\\mathsfsl\{k\}/, unicode: '\uD835\uDE2C' },
  { tex: /\\mathsfsl\{L\}/, unicode: '\uD835\uDE13' },
  { tex: /\\mathsfsl\{l\}/, unicode: '\uD835\uDE2D' },
  { tex: /\\mathsfsl\{M\}/, unicode: '\uD835\uDE14' },
  { tex: /\\mathsfsl\{m\}/, unicode: '\uD835\uDE2E' },
  { tex: /\\mathsfsl\{N\}/, unicode: '\uD835\uDE15' },
  { tex: /\\mathsfsl\{n\}/, unicode: '\uD835\uDE2F' },
  { tex: /\\mathsfsl\{O\}/, unicode: '\uD835\uDE16' },
  { tex: /\\mathsfsl\{o\}/, unicode: '\uD835\uDE30' },
  { tex: /\\mathsfsl\{P\}/, unicode: '\uD835\uDE17' },
  { tex: /\\mathsfsl\{p\}/, unicode: '\uD835\uDE31' },
  { tex: /\\mathsfsl\{Q\}/, unicode: '\uD835\uDE18' },
  { tex: /\\mathsfsl\{q\}/, unicode: '\uD835\uDE32' },
  { tex: /\\mathsfsl\{R\}/, unicode: '\uD835\uDE19' },
  { tex: /\\mathsfsl\{r\}/, unicode: '\uD835\uDE33' },
  { tex: /\\mathsfsl\{S\}/, unicode: '\uD835\uDE1A' },
  { tex: /\\mathsfsl\{s\}/, unicode: '\uD835\uDE34' },
  { tex: /\\mathsfsl\{T\}/, unicode: '\uD835\uDE1B' },
  { tex: /\\mathsfsl\{t\}/, unicode: '\uD835\uDE35' },
  { tex: /\\mathsfsl\{U\}/, unicode: '\uD835\uDE1C' },
  { tex: /\\mathsfsl\{u\}/, unicode: '\uD835\uDE36' },
  { tex: /\\mathsfsl\{V\}/, unicode: '\uD835\uDE1D' },
  { tex: /\\mathsfsl\{v\}/, unicode: '\uD835\uDE37' },
  { tex: /\\mathsfsl\{W\}/, unicode: '\uD835\uDE1E' },
  { tex: /\\mathsfsl\{w\}/, unicode: '\uD835\uDE38' },
  { tex: /\\mathsfsl\{X\}/, unicode: '\uD835\uDE1F' },
  { tex: /\\mathsfsl\{x\}/, unicode: '\uD835\uDE39' },
  { tex: /\\mathsfsl\{Y\}/, unicode: '\uD835\uDE20' },
  { tex: /\\mathsfsl\{y\}/, unicode: '\uD835\uDE3A' },
  { tex: /\\mathsfsl\{Z\}/, unicode: '\uD835\uDE21' },
  { tex: /\\mathsfsl\{z\}/, unicode: '\uD835\uDE3B' },

  { tex: /\\mathscr\{A\}/, unicode: '\uD835\uDC9C' },
  { tex: /\\mathscr\{a\}/, unicode: '\uD835\uDCB6' },
  { tex: /\\mathscr\{B\}/, unicode: '\u212C' },
  { tex: /\\mathscr\{b\}/, unicode: '\uD835\uDCB7' },
  { tex: /\\mathscr\{C\}/, unicode: '\uD835\uDC9E' },
  { tex: /\\mathscr\{c\}/, unicode: '\uD835\uDCB8' },
  { tex: /\\mathscr\{D\}/, unicode: '\uD835\uDC9F' },
  { tex: /\\mathscr\{d\}/, unicode: '\uD835\uDCB9' },
  { tex: /\\mathscr\{e\}/, unicode: '\u212F' },
  { tex: /\\mathscr\{E\}/, unicode: '\u2130' },
  { tex: /\\mathscr\{F\}/, unicode: '\u2131' },
  { tex: /\\mathscr\{f\}/, unicode: '\uD835\uDCBB' },
  { tex: /\\mathscr\{g\}/, unicode: '\u210A' },
  { tex: /\\mathscr\{G\}/, unicode: '\uD835\uDCA2' },
  { tex: /\\mathscr\{H\}/, unicode: '\u210B' },
  { tex: /\\mathscr\{h\}/, unicode: '\uD835\uDCBD' },
  { tex: /\\mathscr\{I\}/, unicode: '\u2110' },
  { tex: /\\mathscr\{i\}/, unicode: '\uD835\uDCBE' },
  { tex: /\\mathscr\{J\}/, unicode: '\uD835\uDCA5' },
  { tex: /\\mathscr\{j\}/, unicode: '\uD835\uDCBF' },
  { tex: /\\mathscr\{K\}/, unicode: '\uD835\uDCA6' },
  { tex: /\\mathscr\{k\}/, unicode: '\uD835\uDCC0' },
  { tex: /\\mathscr\{L\}/, unicode: '\u2112' },
  { tex: /\\mathscr\{l\}/, unicode: '\u2113' },
  { tex: /\\mathscr\{M\}/, unicode: '\u2133' },
  { tex: /\\mathscr\{m\}/, unicode: '\uD835\uDCC2' },
  { tex: /\\mathscr\{N\}/, unicode: '\uD835\uDCA9' },
  { tex: /\\mathscr\{n\}/, unicode: '\uD835\uDCC3' },
  { tex: /\\mathscr\{o\}/, unicode: '\u2134' },
  { tex: /\\mathscr\{O\}/, unicode: '\uD835\uDCAA' },
  { tex: /\\mathscr\{P\}/, unicode: '\uD835\uDCAB' },
  { tex: /\\mathscr\{p\}/, unicode: '\uD835\uDCC5' },
  { tex: /\\mathscr\{Q\}/, unicode: '\uD835\uDCAC' },
  { tex: /\\mathscr\{q\}/, unicode: '\uD835\uDCC6' },
  { tex: /\\mathscr\{R\}/, unicode: '\u211B' },
  { tex: /\\mathscr\{r\}/, unicode: '\uD835\uDCC7' },
  { tex: /\\mathscr\{S\}/, unicode: '\uD835\uDCAE' },
  { tex: /\\mathscr\{s\}/, unicode: '\uD835\uDCC8' },
  { tex: /\\mathscr\{T\}/, unicode: '\uD835\uDCAF' },
  { tex: /\\mathscr\{t\}/, unicode: '\uD835\uDCC9' },
  { tex: /\\mathscr\{U\}/, unicode: '\uD835\uDCB0' },
  { tex: /\\mathscr\{u\}/, unicode: '\uD835\uDCCA' },
  { tex: /\\mathscr\{V\}/, unicode: '\uD835\uDCB1' },
  { tex: /\\mathscr\{v\}/, unicode: '\uD835\uDCCB' },
  { tex: /\\mathscr\{W\}/, unicode: '\uD835\uDCB2' },
  { tex: /\\mathscr\{w\}/, unicode: '\uD835\uDCCC' },
  { tex: /\\mathscr\{X\}/, unicode: '\uD835\uDCB3' },
  { tex: /\\mathscr\{x\}/, unicode: '\uD835\uDCCD' },
  { tex: /\\mathscr\{Y\}/, unicode: '\uD835\uDCB4' },
  { tex: /\\mathscr\{y\}/, unicode: '\uD835\uDCCE' },
  { tex: /\\mathscr\{Z\}/, unicode: '\uD835\uDCB5' },
  { tex: /\\mathscr\{z\}/, unicode: '\uD835\uDCCF' },

  { tex: /\\mathmit\{A\}/, unicode: '\uD835\uDCD0' },
  { tex: /\\mathmit\{a\}/, unicode: '\uD835\uDCEA' },
  { tex: /\\mathmit\{B\}/, unicode: '\uD835\uDCD1' },
  { tex: /\\mathmit\{b\}/, unicode: '\uD835\uDCEB' },
  { tex: /\\mathmit\{C\}/, unicode: '\uD835\uDCD2' },
  { tex: /\\mathmit\{c\}/, unicode: '\uD835\uDCEC' },
  { tex: /\\mathmit\{D\}/, unicode: '\uD835\uDCD3' },
  { tex: /\\mathmit\{d\}/, unicode: '\uD835\uDCED' },
  { tex: /\\mathmit\{E\}/, unicode: '\uD835\uDCD4' },
  { tex: /\\mathmit\{e\}/, unicode: '\uD835\uDCEE' },
  { tex: /\\mathmit\{F\}/, unicode: '\uD835\uDCD5' },
  { tex: /\\mathmit\{f\}/, unicode: '\uD835\uDCEF' },
  { tex: /\\mathmit\{G\}/, unicode: '\uD835\uDCD6' },
  { tex: /\\mathmit\{g\}/, unicode: '\uD835\uDCF0' },
  { tex: /\\mathmit\{H\}/, unicode: '\uD835\uDCD7' },
  { tex: /\\mathmit\{h\}/, unicode: '\uD835\uDCF1' },
  { tex: /\\mathmit\{I\}/, unicode: '\uD835\uDCD8' },
  { tex: /\\mathmit\{i\}/, unicode: '\uD835\uDCF2' },
  { tex: /\\mathmit\{J\}/, unicode: '\uD835\uDCD9' },
  { tex: /\\mathmit\{j\}/, unicode: '\uD835\uDCF3' },
  { tex: /\\mathmit\{K\}/, unicode: '\uD835\uDCDA' },
  { tex: /\\mathmit\{k\}/, unicode: '\uD835\uDCF4' },
  { tex: /\\mathmit\{L\}/, unicode: '\uD835\uDCDB' },
  { tex: /\\mathmit\{l\}/, unicode: '\uD835\uDCF5' },
  { tex: /\\mathmit\{M\}/, unicode: '\uD835\uDCDC' },
  { tex: /\\mathmit\{m\}/, unicode: '\uD835\uDCF6' },
  { tex: /\\mathmit\{N\}/, unicode: '\uD835\uDCDD' },
  { tex: /\\mathmit\{n\}/, unicode: '\uD835\uDCF7' },
  { tex: /\\mathmit\{O\}/, unicode: '\uD835\uDCDE' },
  { tex: /\\mathmit\{o\}/, unicode: '\uD835\uDCF8' },
  { tex: /\\mathmit\{P\}/, unicode: '\uD835\uDCDF' },
  { tex: /\\mathmit\{p\}/, unicode: '\uD835\uDCF9' },
  { tex: /\\mathmit\{Q\}/, unicode: '\uD835\uDCE0' },
  { tex: /\\mathmit\{q\}/, unicode: '\uD835\uDCFA' },
  { tex: /\\mathmit\{R\}/, unicode: '\uD835\uDCE1' },
  { tex: /\\mathmit\{r\}/, unicode: '\uD835\uDCFB' },
  { tex: /\\mathmit\{S\}/, unicode: '\uD835\uDCE2' },
  { tex: /\\mathmit\{s\}/, unicode: '\uD835\uDCFC' },
  { tex: /\\mathmit\{T\}/, unicode: '\uD835\uDCE3' },
  { tex: /\\mathmit\{t\}/, unicode: '\uD835\uDCFD' },
  { tex: /\\mathmit\{U\}/, unicode: '\uD835\uDCE4' },
  { tex: /\\mathmit\{u\}/, unicode: '\uD835\uDCFE' },
  { tex: /\\mathmit\{V\}/, unicode: '\uD835\uDCE5' },
  { tex: /\\mathmit\{v\}/, unicode: '\uD835\uDCFF' },
  { tex: /\\mathmit\{W\}/, unicode: '\uD835\uDCE6' },
  { tex: /\\mathmit\{w\}/, unicode: '\uD835\uDD00' },
  { tex: /\\mathmit\{X\}/, unicode: '\uD835\uDCE7' },
  { tex: /\\mathmit\{x\}/, unicode: '\uD835\uDD01' },
  { tex: /\\mathmit\{Y\}/, unicode: '\uD835\uDCE8' },
  { tex: /\\mathmit\{y\}/, unicode: '\uD835\uDD02' },
  { tex: /\\mathmit\{Z\}/, unicode: '\uD835\uDCE9' },
  { tex: /\\mathmit\{z\}/, unicode: '\uD835\uDD03' },

  { tex: /\\mathtt\{0\}/, unicode: '\uD835\uDFF6' },
  { tex: /\\mathtt\{1\}/, unicode: '\uD835\uDFF7' },
  { tex: /\\mathtt\{2\}/, unicode: '\uD835\uDFF8' },
  { tex: /\\mathtt\{3\}/, unicode: '\uD835\uDFF9' },
  { tex: /\\mathtt\{4\}/, unicode: '\uD835\uDFFA' },
  { tex: /\\mathtt\{5\}/, unicode: '\uD835\uDFFB' },
  { tex: /\\mathtt\{6\}/, unicode: '\uD835\uDFFC' },
  { tex: /\\mathtt\{7\}/, unicode: '\uD835\uDFFD' },
  { tex: /\\mathtt\{8\}/, unicode: '\uD835\uDFFE' },
  { tex: /\\mathtt\{9\}/, unicode: '\uD835\uDFFF' },
  { tex: /\\mathtt\{A\}/, unicode: '\uD835\uDE70' },
  { tex: /\\mathtt\{a\}/, unicode: '\uD835\uDE8A' },
  { tex: /\\mathtt\{B\}/, unicode: '\uD835\uDE71' },
  { tex: /\\mathtt\{b\}/, unicode: '\uD835\uDE8B' },
  { tex: /\\mathtt\{C\}/, unicode: '\uD835\uDE72' },
  { tex: /\\mathtt\{c\}/, unicode: '\uD835\uDE8C' },
  { tex: /\\mathtt\{D\}/, unicode: '\uD835\uDE73' },
  { tex: /\\mathtt\{d\}/, unicode: '\uD835\uDE8D' },
  { tex: /\\mathtt\{E\}/, unicode: '\uD835\uDE74' },
  { tex: /\\mathtt\{e\}/, unicode: '\uD835\uDE8E' },
  { tex: /\\mathtt\{F\}/, unicode: '\uD835\uDE75' },
  { tex: /\\mathtt\{f\}/, unicode: '\uD835\uDE8F' },
  { tex: /\\mathtt\{G\}/, unicode: '\uD835\uDE76' },
  { tex: /\\mathtt\{g\}/, unicode: '\uD835\uDE90' },
  { tex: /\\mathtt\{H\}/, unicode: '\uD835\uDE77' },
  { tex: /\\mathtt\{h\}/, unicode: '\uD835\uDE91' },
  { tex: /\\mathtt\{I\}/, unicode: '\uD835\uDE78' },
  { tex: /\\mathtt\{i\}/, unicode: '\uD835\uDE92' },
  { tex: /\\mathtt\{J\}/, unicode: '\uD835\uDE79' },
  { tex: /\\mathtt\{j\}/, unicode: '\uD835\uDE93' },
  { tex: /\\mathtt\{K\}/, unicode: '\uD835\uDE7A' },
  { tex: /\\mathtt\{k\}/, unicode: '\uD835\uDE94' },
  { tex: /\\mathtt\{L\}/, unicode: '\uD835\uDE7B' },
  { tex: /\\mathtt\{l\}/, unicode: '\uD835\uDE95' },
  { tex: /\\mathtt\{M\}/, unicode: '\uD835\uDE7C' },
  { tex: /\\mathtt\{m\}/, unicode: '\uD835\uDE96' },
  { tex: /\\mathtt\{N\}/, unicode: '\uD835\uDE7D' },
  { tex: /\\mathtt\{n\}/, unicode: '\uD835\uDE97' },
  { tex: /\\mathtt\{O\}/, unicode: '\uD835\uDE7E' },
  { tex: /\\mathtt\{o\}/, unicode: '\uD835\uDE98' },
  { tex: /\\mathtt\{P\}/, unicode: '\uD835\uDE7F' },
  { tex: /\\mathtt\{p\}/, unicode: '\uD835\uDE99' },
  { tex: /\\mathtt\{Q\}/, unicode: '\uD835\uDE80' },
  { tex: /\\mathtt\{q\}/, unicode: '\uD835\uDE9A' },
  { tex: /\\mathtt\{R\}/, unicode: '\uD835\uDE81' },
  { tex: /\\mathtt\{r\}/, unicode: '\uD835\uDE9B' },
  { tex: /\\mathtt\{S\}/, unicode: '\uD835\uDE82' },
  { tex: /\\mathtt\{s\}/, unicode: '\uD835\uDE9C' },
  { tex: /\\mathtt\{T\}/, unicode: '\uD835\uDE83' },
  { tex: /\\mathtt\{t\}/, unicode: '\uD835\uDE9D' },
  { tex: /\\mathtt\{U\}/, unicode: '\uD835\uDE84' },
  { tex: /\\mathtt\{u\}/, unicode: '\uD835\uDE9E' },
  { tex: /\\mathtt\{V\}/, unicode: '\uD835\uDE85' },
  { tex: /\\mathtt\{v\}/, unicode: '\uD835\uDE9F' },
  { tex: /\\mathtt\{W\}/, unicode: '\uD835\uDE86' },
  { tex: /\\mathtt\{w\}/, unicode: '\uD835\uDEA0' },
  { tex: /\\mathtt\{X\}/, unicode: '\uD835\uDE87' },
  { tex: /\\mathtt\{x\}/, unicode: '\uD835\uDEA1' },
  { tex: /\\mathtt\{Y\}/, unicode: '\uD835\uDE88' },
  { tex: /\\mathtt\{y\}/, unicode: '\uD835\uDEA2' },
  { tex: /\\mathtt\{Z\}/, unicode: '\uD835\uDE89' },
  { tex: /\\mathtt\{z\}/, unicode: '\uD835\uDEA3' },

  { tex: /\\mathsf\{0\}/, unicode: '\uD835\uDFE2' },
  { tex: /\\mathsf\{1\}/, unicode: '\uD835\uDFE3' },
  { tex: /\\mathsf\{2\}/, unicode: '\uD835\uDFE4' },
  { tex: /\\mathsf\{3\}/, unicode: '\uD835\uDFE5' },
  { tex: /\\mathsf\{4\}/, unicode: '\uD835\uDFE6' },
  { tex: /\\mathsf\{5\}/, unicode: '\uD835\uDFE7' },
  { tex: /\\mathsf\{6\}/, unicode: '\uD835\uDFE8' },
  { tex: /\\mathsf\{7\}/, unicode: '\uD835\uDFE9' },
  { tex: /\\mathsf\{8\}/, unicode: '\uD835\uDFEA' },
  { tex: /\\mathsf\{9\}/, unicode: '\uD835\uDFEB' },
  { tex: /\\mathsf\{A\}/, unicode: '\uD835\uDDA0' },
  { tex: /\\mathsf\{a\}/, unicode: '\uD835\uDDBA' },
  { tex: /\\mathsf\{B\}/, unicode: '\uD835\uDDA1' },
  { tex: /\\mathsf\{b\}/, unicode: '\uD835\uDDBB' },
  { tex: /\\mathsf\{C\}/, unicode: '\uD835\uDDA2' },
  { tex: /\\mathsf\{c\}/, unicode: '\uD835\uDDBC' },
  { tex: /\\mathsf\{D\}/, unicode: '\uD835\uDDA3' },
  { tex: /\\mathsf\{d\}/, unicode: '\uD835\uDDBD' },
  { tex: /\\mathsf\{E\}/, unicode: '\uD835\uDDA4' },
  { tex: /\\mathsf\{e\}/, unicode: '\uD835\uDDBE' },
  { tex: /\\mathsf\{F\}/, unicode: '\uD835\uDDA5' },
  { tex: /\\mathsf\{f\}/, unicode: '\uD835\uDDBF' },
  { tex: /\\mathsf\{G\}/, unicode: '\uD835\uDDA6' },
  { tex: /\\mathsf\{g\}/, unicode: '\uD835\uDDC0' },
  { tex: /\\mathsf\{H\}/, unicode: '\uD835\uDDA7' },
  { tex: /\\mathsf\{h\}/, unicode: '\uD835\uDDC1' },
  { tex: /\\mathsf\{I\}/, unicode: '\uD835\uDDA8' },
  { tex: /\\mathsf\{i\}/, unicode: '\uD835\uDDC2' },
  { tex: /\\mathsf\{J\}/, unicode: '\uD835\uDDA9' },
  { tex: /\\mathsf\{j\}/, unicode: '\uD835\uDDC3' },
  { tex: /\\mathsf\{K\}/, unicode: '\uD835\uDDAA' },
  { tex: /\\mathsf\{k\}/, unicode: '\uD835\uDDC4' },
  { tex: /\\mathsf\{L\}/, unicode: '\uD835\uDDAB' },
  { tex: /\\mathsf\{l\}/, unicode: '\uD835\uDDC5' },
  { tex: /\\mathsf\{M\}/, unicode: '\uD835\uDDAC' },
  { tex: /\\mathsf\{m\}/, unicode: '\uD835\uDDC6' },
  { tex: /\\mathsf\{N\}/, unicode: '\uD835\uDDAD' },
  { tex: /\\mathsf\{n\}/, unicode: '\uD835\uDDC7' },
  { tex: /\\mathsf\{O\}/, unicode: '\uD835\uDDAE' },
  { tex: /\\mathsf\{o\}/, unicode: '\uD835\uDDC8' },
  { tex: /\\mathsf\{P\}/, unicode: '\uD835\uDDAF' },
  { tex: /\\mathsf\{p\}/, unicode: '\uD835\uDDC9' },
  { tex: /\\mathsf\{Q\}/, unicode: '\uD835\uDDB0' },
  { tex: /\\mathsf\{q\}/, unicode: '\uD835\uDDCA' },
  { tex: /\\mathsf\{R\}/, unicode: '\uD835\uDDB1' },
  { tex: /\\mathsf\{r\}/, unicode: '\uD835\uDDCB' },
  { tex: /\\mathsf\{S\}/, unicode: '\uD835\uDDB2' },
  { tex: /\\mathsf\{s\}/, unicode: '\uD835\uDDCC' },
  { tex: /\\mathsf\{T\}/, unicode: '\uD835\uDDB3' },
  { tex: /\\mathsf\{t\}/, unicode: '\uD835\uDDCD' },
  { tex: /\\mathsf\{U\}/, unicode: '\uD835\uDDB4' },
  { tex: /\\mathsf\{u\}/, unicode: '\uD835\uDDCE' },
  { tex: /\\mathsf\{V\}/, unicode: '\uD835\uDDB5' },
  { tex: /\\mathsf\{v\}/, unicode: '\uD835\uDDCF' },
  { tex: /\\mathsf\{W\}/, unicode: '\uD835\uDDB6' },
  { tex: /\\mathsf\{w\}/, unicode: '\uD835\uDDD0' },
  { tex: /\\mathsf\{X\}/, unicode: '\uD835\uDDB7' },
  { tex: /\\mathsf\{x\}/, unicode: '\uD835\uDDD1' },
  { tex: /\\mathsf\{Y\}/, unicode: '\uD835\uDDB8' },
  { tex: /\\mathsf\{y\}/, unicode: '\uD835\uDDD2' },
  { tex: /\\mathsf\{Z\}/, unicode: '\uD835\uDDB9' },
  { tex: /\\mathsf\{z\}/, unicode: '\uD835\uDDD3' },

  { tex: /\\mathchar"2208/, unicode: '\u2316' },

  { tex: /\\cyrchar\\C/, unicode: '\u030F' },
  { tex: /\\cyrchar\\CYRABHCHDSC/, unicode: '\u04BE' },
  { tex: /\\cyrchar\\cyrabhchdsc/, unicode: '\u04BF' },
  { tex: /\\cyrchar\\CYRABHCH/, unicode: '\u04BC' },
  { tex: /\\cyrchar\\cyrabhch/, unicode: '\u04BD' },
  { tex: /\\cyrchar\\CYRABHDZE/, unicode: '\u04E0' },
  { tex: /\\cyrchar\\cyrabhdze/, unicode: '\u04E1' },
  { tex: /\\cyrchar\\CYRABHHA/, unicode: '\u04A8' },
  { tex: /\\cyrchar\\cyrabhha/, unicode: '\u04A9' },
  { tex: /\\cyrchar\\CYRAE/, unicode: '\u04D4' },
  { tex: /\\cyrchar\\cyrae/, unicode: '\u04D5' },
  { tex: /\\cyrchar\\CYRA/, unicode: '\u0410' },
  { tex: /\\cyrchar\\cyra/, unicode: '\u0430' },
  { tex: /\\cyrchar\\CYRB/, unicode: '\u0411' },
  { tex: /\\cyrchar\\cyrb/, unicode: '\u0431' },
  { tex: /\\cyrchar\\CYRBYUS/, unicode: '\u046A' },
  { tex: /\\cyrchar\\CYRCHLDSC/, unicode: '\u04CB' },
  { tex: /\\cyrchar\\cyrchldsc/, unicode: '\u04CC' },
  { tex: /\\cyrchar\\CYRCHRDSC/, unicode: '\u04B6' },
  { tex: /\\cyrchar\\cyrchrdsc/, unicode: '\u04B7' },
  { tex: /\\cyrchar\\CYRCH/, unicode: '\u0427' },
  { tex: /\\cyrchar\\cyrch/, unicode: '\u0447' },
  { tex: /\\cyrchar\\CYRCHVCRS/, unicode: '\u04B8' },
  { tex: /\\cyrchar\\cyrchvcrs/, unicode: '\u04B9' },
  { tex: /\\cyrchar\\CYRC/, unicode: '\u0426' },
  { tex: /\\cyrchar\\cyrc/, unicode: '\u0446' },
  { tex: /\\cyrchar\\CYRDJE/, unicode: '\u0402' },
  { tex: /\\cyrchar\\cyrdje/, unicode: '\u0452' },
  { tex: /\\cyrchar\\CYRD/, unicode: '\u0414' },
  { tex: /\\cyrchar\\cyrd/, unicode: '\u0434' },
  { tex: /\\cyrchar\\CYRDZE/, unicode: '\u0405' },
  { tex: /\\cyrchar\\cyrdze/, unicode: '\u0455' },
  { tex: /\\cyrchar\\CYRDZHE/, unicode: '\u040F' },
  { tex: /\\cyrchar\\cyrdzhe/, unicode: '\u045F' },
  { tex: /\\cyrchar\\CYREREV/, unicode: '\u042D' },
  { tex: /\\cyrchar\\cyrerev/, unicode: '\u044D' },
  { tex: /\\cyrchar\\CYRERY/, unicode: '\u042B' },
  { tex: /\\cyrchar\\cyrery/, unicode: '\u044B' },
  { tex: /\\cyrchar\\CYRE/, unicode: '\u0415' },
  { tex: /\\cyrchar\\cyre/, unicode: '\u0435' },
  { tex: /\\cyrchar\\CYRFITA/, unicode: '\u0472' },
  { tex: /\\cyrchar\\CYRF/, unicode: '\u0424' },
  { tex: /\\cyrchar\\cyrf/, unicode: '\u0444' },
  { tex: /\\cyrchar\\CYRGHCRS/, unicode: '\u0492' },
  { tex: /\\cyrchar\\cyrghcrs/, unicode: '\u0493' },
  { tex: /\\cyrchar\\CYRGHK/, unicode: '\u0494' },
  { tex: /\\cyrchar\\cyrghk/, unicode: '\u0495' },
  { tex: /\\cyrchar\{\\'\\CYRG\}/, unicode: '\u0403' },
  { tex: /\\cyrchar\\CYRG/, unicode: '\u0413' },
  { tex: /\\cyrchar\\cyrg/, unicode: '\u0433' },
  { tex: /\\cyrchar\{\\'\\cyrg\}/, unicode: '\u0453' },
  { tex: /\\cyrchar\\CYRGUP/, unicode: '\u0490' },
  { tex: /\\cyrchar\\cyrgup/, unicode: '\u0491' },
  { tex: /\\cyrchar\\CYRHDSC/, unicode: '\u04B2' },
  { tex: /\\cyrchar\\cyrhdsc/, unicode: '\u04B3' },
  { tex: /\\cyrchar\\CYRHRDSN/, unicode: '\u042A' },
  { tex: /\\cyrchar\\cyrhrdsn/, unicode: '\u044A' },
  { tex: /\\cyrchar\\cyrhundredthousands/, unicode: '\u0488' },
  { tex: /\\cyrchar\\CYRH/, unicode: '\u0425' },
  { tex: /\\cyrchar\\cyrh/, unicode: '\u0445' },
  { tex: /\\cyrchar\\CYRIE/, unicode: '\u0404' },
  { tex: /\\cyrchar\\cyrie/, unicode: '\u0454' },
  { tex: /\\cyrchar\\CYRII/, unicode: '\u0406' },
  { tex: /\\cyrchar\\cyrii/, unicode: '\u0456' },
  { tex: /\\cyrchar\\CYRIOTBYUS/, unicode: '\u046C' },
  { tex: /\\cyrchar\\cyriotbyus/, unicode: '\u046D' },
  { tex: /\\cyrchar\\CYRIOTE/, unicode: '\u0464' },
  { tex: /\\cyrchar\\cyriote/, unicode: '\u0465' },
  { tex: /\\cyrchar\\CYRIOTLYUS/, unicode: '\u0468' },
  { tex: /\\cyrchar\\cyriotlyus/, unicode: '\u0469' },
  { tex: /\\cyrchar\\CYRISHRT/, unicode: '\u0419' },
  { tex: /\\cyrchar\\cyrishrt/, unicode: '\u0439' },
  { tex: /\\cyrchar\\CYRI/, unicode: '\u0418' },
  { tex: /\\cyrchar\\cyri/, unicode: '\u0438' },
  { tex: /\\cyrchar\\CYRIZH/, unicode: '\u0474' },
  { tex: /\\cyrchar\\CYRJE/, unicode: '\u0408' },
  { tex: /\\cyrchar\\cyrje/, unicode: '\u0458' },
  { tex: /\\cyrchar\\CYRKBEAK/, unicode: '\u04A0' },
  { tex: /\\cyrchar\\cyrkbeak/, unicode: '\u04A1' },
  { tex: /\\cyrchar\\CYRKDSC/, unicode: '\u049A' },
  { tex: /\\cyrchar\\cyrkdsc/, unicode: '\u049B' },
  { tex: /\\cyrchar\\CYRKHCRS/, unicode: '\u049E' },
  { tex: /\\cyrchar\\cyrkhcrs/, unicode: '\u049F' },
  { tex: /\\cyrchar\\CYRKHK/, unicode: '\u04C3' },
  { tex: /\\cyrchar\\cyrkhk/, unicode: '\u04C4' },
  { tex: /\\cyrchar\\CYRKOPPA/, unicode: '\u0480' },
  { tex: /\\cyrchar\\cyrkoppa/, unicode: '\u0481' },
  { tex: /\\cyrchar\\CYRKSI/, unicode: '\u046E' },
  { tex: /\\cyrchar\\cyrksi/, unicode: '\u046F' },
  { tex: /\\cyrchar\{\\'\\CYRK\}/, unicode: '\u040C' },
  { tex: /\\cyrchar\\CYRK/, unicode: '\u041A' },
  { tex: /\\cyrchar\\cyrk/, unicode: '\u043A' },
  { tex: /\\cyrchar\{\\'\\cyrk\}/, unicode: '\u045C' },
  { tex: /\\cyrchar\\CYRKVCRS/, unicode: '\u049C' },
  { tex: /\\cyrchar\\cyrkvcrs/, unicode: '\u049D' },
  { tex: /\\cyrchar\\CYRLJE/, unicode: '\u0409' },
  { tex: /\\cyrchar\\cyrlje/, unicode: '\u0459' },
  { tex: /\\cyrchar\\CYRL/, unicode: '\u041B' },
  { tex: /\\cyrchar\\cyrl/, unicode: '\u043B' },
  { tex: /\\cyrchar\\CYRLYUS/, unicode: '\u0466' },
  { tex: /\\cyrchar\\cyrlyus/, unicode: '\u0467' },
  { tex: /\\cyrchar\\cyrmillions/, unicode: '\u0489' },
  { tex: /\\cyrchar\\CYRM/, unicode: '\u041C' },
  { tex: /\\cyrchar\\cyrm/, unicode: '\u043C' },
  { tex: /\\cyrchar\\CYRNDSC/, unicode: '\u04A2' },
  { tex: /\\cyrchar\\cyrndsc/, unicode: '\u04A3' },
  { tex: /\\cyrchar\\CYRNG/, unicode: '\u04A4' },
  { tex: /\\cyrchar\\cyrng/, unicode: '\u04A5' },
  { tex: /\\cyrchar\\CYRNHK/, unicode: '\u04C7' },
  { tex: /\\cyrchar\\cyrnhk/, unicode: '\u04C8' },
  { tex: /\\cyrchar\\CYRNJE/, unicode: '\u040A' },
  { tex: /\\cyrchar\\cyrnje/, unicode: '\u045A' },
  { tex: /\\cyrchar\\CYRN/, unicode: '\u041D' },
  { tex: /\\cyrchar\\cyrn/, unicode: '\u043D' },
  { tex: /\\cyrchar\\CYROMEGARND/, unicode: '\u047A' },
  { tex: /\\cyrchar\\cyromegarnd/, unicode: '\u047B' },
  { tex: /\\cyrchar\\CYROMEGATITLO/, unicode: '\u047C' },
  { tex: /\\cyrchar\\cyromegatitlo/, unicode: '\u047D' },
  { tex: /\\cyrchar\\CYROMEGA/, unicode: '\u0460' },
  { tex: /\\cyrchar\\cyromega/, unicode: '\u0461' },
  { tex: /\\cyrchar\\CYROTLD/, unicode: '\u04E8' },
  { tex: /\\cyrchar\\cyrotld/, unicode: '\u04E9' },
  { tex: /\\cyrchar\\CYROT/, unicode: '\u047E' },
  { tex: /\\cyrchar\\cyrot/, unicode: '\u047F' },
  { tex: /\\cyrchar\\CYRO/, unicode: '\u041E' },
  { tex: /\\cyrchar\\cyro/, unicode: '\u043E' },
  { tex: /\\cyrchar\\CYRpalochka/, unicode: '\u04C0' },
  { tex: /\\cyrchar\\CYRPHK/, unicode: '\u04A6' },
  { tex: /\\cyrchar\\cyrphk/, unicode: '\u04A7' },
  { tex: /\\cyrchar\\CYRPSI/, unicode: '\u0470' },
  { tex: /\\cyrchar\\cyrpsi/, unicode: '\u0471' },
  { tex: /\\cyrchar\\CYRP/, unicode: '\u041F' },
  { tex: /\\cyrchar\\cyrp/, unicode: '\u043F' },
  { tex: /\\cyrchar\\CYRRTICK/, unicode: '\u048E' },
  { tex: /\\cyrchar\\cyrrtick/, unicode: '\u048F' },
  { tex: /\\cyrchar\\CYRR/, unicode: '\u0420' },
  { tex: /\\cyrchar\\cyrr/, unicode: '\u0440' },
  { tex: /\\cyrchar\\CYRSCHWA/, unicode: '\u04D8' },
  { tex: /\\cyrchar\\cyrschwa/, unicode: '\u04D9' },
  { tex: /\\cyrchar\\CYRSDSC/, unicode: '\u04AA' },
  { tex: /\\cyrchar\\cyrsdsc/, unicode: '\u04AB' },
  { tex: /\\cyrchar\\CYRSEMISFTSN/, unicode: '\u048C' },
  { tex: /\\cyrchar\\cyrsemisftsn/, unicode: '\u048D' },
  { tex: /\\cyrchar\\CYRSFTSN/, unicode: '\u042C' },
  { tex: /\\cyrchar\\cyrsftsn/, unicode: '\u044C' },
  { tex: /\\cyrchar\\CYRSHCH/, unicode: '\u0429' },
  { tex: /\\cyrchar\\cyrshch/, unicode: '\u0449' },
  { tex: /\\cyrchar\\CYRSHHA/, unicode: '\u04BA' },
  { tex: /\\cyrchar\\cyrshha/, unicode: '\u04BB' },
  { tex: /\\cyrchar\\CYRSH/, unicode: '\u0428' },
  { tex: /\\cyrchar\\cyrsh/, unicode: '\u0448' },
  { tex: /\\cyrchar\\CYRS/, unicode: '\u0421' },
  { tex: /\\cyrchar\\cyrs/, unicode: '\u0441' },
  { tex: /\\cyrchar\\CYRTDSC/, unicode: '\u04AC' },
  { tex: /\\cyrchar\\cyrtdsc/, unicode: '\u04AD' },
  { tex: /\\cyrchar\\CYRTETSE/, unicode: '\u04B4' },
  { tex: /\\cyrchar\\cyrtetse/, unicode: '\u04B5' },
  { tex: /\\cyrchar\\cyrthousands/, unicode: '\u0482' },
  { tex: /\\cyrchar\\CYRTSHE/, unicode: '\u040B' },
  { tex: /\\cyrchar\\cyrtshe/, unicode: '\u045B' },
  { tex: /\\cyrchar\\CYRT/, unicode: '\u0422' },
  { tex: /\\cyrchar\\cyrt/, unicode: '\u0442' },
  { tex: /\\cyrchar\\CYRUK/, unicode: '\u0478' },
  { tex: /\\cyrchar\\cyruk/, unicode: '\u0479' },
  { tex: /\\cyrchar\\CYRUSHRT/, unicode: '\u040E' },
  { tex: /\\cyrchar\\cyrushrt/, unicode: '\u045E' },
  { tex: /\\cyrchar\\CYRU/, unicode: '\u0423' },
  { tex: /\\cyrchar\\cyru/, unicode: '\u0443' },
  { tex: /\\cyrchar\\CYRV/, unicode: '\u0412' },
  { tex: /\\cyrchar\\cyrv/, unicode: '\u0432' },
  { tex: /\\cyrchar\\CYRYAT/, unicode: '\u0462' },
  { tex: /\\cyrchar\\CYRYA/, unicode: '\u042F' },
  { tex: /\\cyrchar\\cyrya/, unicode: '\u044F' },
  { tex: /\\cyrchar\\CYRYHCRS/, unicode: '\u04B0' },
  { tex: /\\cyrchar\\cyryhcrs/, unicode: '\u04B1' },
  { tex: /\\cyrchar\\CYRYI/, unicode: '\u0407' },
  { tex: /\\cyrchar\\cyryi/, unicode: '\u0457' },
  { tex: /\\cyrchar\\CYRYO/, unicode: '\u0401' },
  { tex: /\\cyrchar\\cyryo/, unicode: '\u0451' },
  { tex: /\\cyrchar\\CYRY/, unicode: '\u04AE' },
  { tex: /\\cyrchar\\cyry/, unicode: '\u04AF' },
  { tex: /\\cyrchar\\CYRYU/, unicode: '\u042E' },
  { tex: /\\cyrchar\\cyryu/, unicode: '\u044E' },
  { tex: /\\cyrchar\\CYRZDSC/, unicode: '\u0498' },
  { tex: /\\cyrchar\\cyrzdsc/, unicode: '\u0499' },
  { tex: /\\cyrchar\\CYRZHDSC/, unicode: '\u0496' },
  { tex: /\\cyrchar\\cyrzhdsc/, unicode: '\u0497' },
  { tex: /\\cyrchar\\CYRZH/, unicode: '\u0416' },
  { tex: /\\cyrchar\\cyrzh/, unicode: '\u0436' },
  { tex: /\\cyrchar\\CYRZ/, unicode: '\u0417' },
  { tex: /\\cyrchar\\cyrz/, unicode: '\u0437' },
  { tex: /\\cyrchar\\textnumero/, unicode: '\u2116' },

  { tex: /\\acute\{\\ddot\{\\iota\}\}/, unicode: '\u0390' },
  { tex: /\\acute\{\\ddot\{\\upsilon\}\}/, unicode: '\u03B0' },
  { tex: /\\acute\{\\epsilon\}/, unicode: '\u03AD' },
  { tex: /\\acute\{\\eta\}/, unicode: '\u03AE' },
  { tex: /\\acute\{\\iota\}/, unicode: '\u03AF' },
  { tex: /\\acute\{\\omega\}/, unicode: '\u03CE' },
  { tex: /\\acute\{\\upsilon\}/, unicode: '\u03CD' },

  { tex: /\\AA|\\A\{A\}/, unicode: '\xC5' },
  { tex: /\\AC|\\A\{C\}/, unicode: '\u223F' },
  { tex: /\\accurrent/, unicode: '\u23E6' },
  { tex: /\\acidfree/, unicode: '\u267E' },
  { tex: /\\acwgapcirclearrow/, unicode: '\u27F2' },
  { tex: /\\acwleftarcarrow/, unicode: '\u2939' },
  { tex: /\\acwoverarcarrow/, unicode: '\u293A' },
  { tex: /\\acwunderarcarrow/, unicode: '\u293B' },
  { tex: /\\AE|\\A\{E\}/, unicode: '\xC6' },
  { tex: /\\allequal/, unicode: '\u224C' },
  { tex: /\\'\$\\alpha\$/, unicode: '\u03AC' },
  { tex: /\\angdnr/, unicode: '\u299F' },
  { tex: /\\angles/, unicode: '\u299E' },
  { tex: /\\angleubar/, unicode: '\u29A4' },
  { tex: /\\annuity/, unicode: '\u20E7' },
  { tex: /\\APLboxquestion/, unicode: '\u2370' },
  { tex: /\\APLboxupcaret/, unicode: '\u2353' },
  { tex: /\\APLcomment/, unicode: '\u235D' },
  { tex: /\\APLdownarrowbox/, unicode: '\u2357' },
  { tex: /\\APLinput/, unicode: '\u235E' },
  { tex: /\\APLleftarrowbox/, unicode: '\u2347' },
  { tex: /\\APLrightarrowbox/, unicode: '\u2348' },
  { tex: /\\APLuparrowbox/, unicode: '\u2350' },
  { tex: /\\approxeqq/, unicode: '\u2A70' },
  { tex: /\\approxeq/, unicode: '\u224A' },
  { tex: /\\approxnotequal/, unicode: '\u2246' },
  { tex: /\\approx/, unicode: '\u2248' },
  { tex: /\\aquarius/, unicode: '\u2652' },
  { tex: /\\arrowwaveleft|\\arrowwaveright/, unicode: '\u219C' },
  { tex: /\\assert/, unicode: '\u22A6' },
  { tex: /\\asteraccent/, unicode: '\u20F0' },
  { tex: /\\backdprime/, unicode: '\u2036' },
  { tex: /\\backepsilon/, unicode: '\u03F6' },
  { tex: /\\backprime/, unicode: '\u2035' },
  { tex: /\\backsimeq/, unicode: '\u22CD' },
  { tex: /\\backsim/, unicode: '\u223D' },
  { tex: /\\backtrprime/, unicode: '\u2037' },
  { tex: /\\bagmember/, unicode: '\u22FF' },
  { tex: /\\barcap/, unicode: '\u2A43' },
  { tex: /\\barcup/, unicode: '\u2A42' },
  { tex: /\\barleftarrowrightarrowba/, unicode: '\u21B9' },
  { tex: /\\barleftharpoon/, unicode: '\u296B' },
  { tex: /\\barovernorthwestarrow/, unicode: '\u21B8' },
  { tex: /\\barrightarrowdiamond/, unicode: '\u2920' },
  { tex: /\\barrightharpoon/, unicode: '\u296D' },
  { tex: /\\barvee/, unicode: '\u22BD' },
  { tex: /\\barwedge/, unicode: '\u22BC' },
  { tex: /\\bbrktbrk/, unicode: '\u23B6' },
  { tex: /\\because/, unicode: '\u2235' },
  { tex: /\\benzenr/, unicode: '\u23E3' },
  { tex: /\\between/, unicode: '\u226C' },
  { tex: /\\bigcap/, unicode: '\u22C2' },
  { tex: /\\bigcirc/, unicode: '\u25CB' },
  { tex: /\\bigcupdot/, unicode: '\u2A03' },
  { tex: /\\bigcup/, unicode: '\u22C3' },
  { tex: /\\biginterleave/, unicode: '\u2AFC' },
  { tex: /\\bigodot/, unicode: '\u2A00' },
  { tex: /\\bigoplus/, unicode: '\u2A01' },
  { tex: /\\bigotimes/, unicode: '\u2A02' },
  { tex: /\\bigslopedvee/, unicode: '\u2A57' },
  { tex: /\\bigslopedwedge/, unicode: '\u2A58' },
  { tex: /\\bigtalloblong/, unicode: '\u2AFF' },
  { tex: /\\bigtop/, unicode: '\u27D9' },
  { tex: /\\bigtriangledown/, unicode: '\u25BD' },
  { tex: /\\bigtriangleleft/, unicode: '\u2A1E' },
  { tex: /\\bigtriangleup/, unicode: '\u25B3' },
  { tex: /\\biohazard/, unicode: '\u2623' },
  { tex: /\\blackcircledownarrow/, unicode: '\u29ED' },
  { tex: /\\blackcircledrightdot/, unicode: '\u2688' },
  { tex: /\\blackcircledtwodots/, unicode: '\u2689' },
  { tex: /\\blackcircleulquadwhite/, unicode: '\u25D5' },
  { tex: /\\blackdiamonddownarrow/, unicode: '\u29EA' },
  { tex: /\\blackhourglass/, unicode: '\u29D7' },
  { tex: /\\blackinwhitediamond/, unicode: '\u25C8' },
  { tex: /\\blackinwhitesquare/, unicode: '\u25A3' },
  { tex: /\\blacklozenge/, unicode: '\u29EB' },
  { tex: /\\blackpointerleft/, unicode: '\u25C4' },
  { tex: /\\blackpointerright/, unicode: '\u25BA' },
  { tex: /\\blacksmiley/, unicode: '\u263B' },
  { tex: /\\blacksquare/, unicode: '\u25AA' },
  { tex: /\\blacktriangledown/, unicode: '\u25BE' },
  { tex: /\\blacktriangleleft/, unicode: '\u25C2' },
  { tex: /\\blacktriangleright/, unicode: '\u25B8' },
  { tex: /\\blacktriangle/, unicode: '\u25B4' },
  { tex: /\\blkhorzoval/, unicode: '\u2B2C' },
  { tex: /\\blkvertoval/, unicode: '\u2B2E' },
  { tex: /\\blockfull/, unicode: '\u2588' },
  { tex: /\\blockhalfshaded/, unicode: '\u2592' },
  { tex: /\\blocklefthalf/, unicode: '\u258C' },
  { tex: /\\blocklowhalf/, unicode: '\u2584' },
  { tex: /\\blockqtrshaded/, unicode: '\u2591' },
  { tex: /\\blockrighthalf/, unicode: '\u2590' },
  { tex: /\\blockthreeqtrshaded/, unicode: '\u2593' },
  { tex: /\\blockuphalf/, unicode: '\u2580' },
  { tex: /\\botsemicircle/, unicode: '\u25E1' },
  { tex: /\\boxast/, unicode: '\u29C6' },
  { tex: /\\boxbox/, unicode: '\u29C8' },
  { tex: /\\boxbslash/, unicode: '\u29C5' },
  { tex: /\\boxcircle/, unicode: '\u29C7' },
  { tex: /\\boxdot/, unicode: '\u22A1' },
  { tex: /\\boxminus/, unicode: '\u229F' },
  { tex: /\\boxonbox/, unicode: '\u29C9' },
  { tex: /\\boxplus/, unicode: '\u229E' },
  { tex: /\\boxslash/, unicode: '\u29C4' },
  { tex: /\\boxtimes/, unicode: '\u22A0' },
  { tex: /\\bsimilarleftarrow/, unicode: '\u2B41' },
  { tex: /\\bsimilarrightarrow/, unicode: '\u2B47' },
  { tex: /\\bsolhsub/, unicode: '\u27C8' },
  { tex: /\\btimes/, unicode: '\u2A32' },
  { tex: /\\bullet/, unicode: '\u2219' },
  { tex: /\\bullseye/, unicode: '\u25CE' },
  { tex: /\\bumpeqq/, unicode: '\u2AAE' },
  { tex: /\\candra/, unicode: '\u0310' },
  { tex: /\\capbarcup/, unicode: '\u2A49' },
  { tex: /\\capdot/, unicode: '\u2A40' },
  { tex: /\\CapitalDifferentialD/, unicode: '\u2145' },
  { tex: /\\capovercup/, unicode: '\u2A47' },
  { tex: /\\capricornus/, unicode: '\u2651' },
  { tex: /\\capwedge/, unicode: '\u2A44' },
  { tex: /\\caretinsert/, unicode: '\u2038' },
  { tex: /\\carriagereturn/, unicode: '\u21B5' },
  { tex: /\\ccwundercurvearrow/, unicode: '\u293F' },
  { tex: /\\CheckedBox/, unicode: '\u2611' },
  { tex: /\\circlearrowleft/, unicode: '\u21BA' },
  { tex: /\\circlearrowright/, unicode: '\u21BB' },
  { tex: /\\circledast/, unicode: '\u229B' },
  { tex: /\\circledbslash/, unicode: '\u29B8' },
  { tex: /\\circledbullet/, unicode: '\u29BF' },
  { tex: /\\circledcirc/, unicode: '\u229A' },
  { tex: /\\circleddash/, unicode: '\u229D' },
  { tex: /\\circledequal/, unicode: '\u229C' },
  { tex: /\\circledgtr/, unicode: '\u29C1' },
  { tex: /\\circledless/, unicode: '\u29C0' },
  { tex: /\\circledownarrow/, unicode: '\u29EC' },
  { tex: /\\circledparallel/, unicode: '\u29B7' },
  { tex: /\\circledrightdot/, unicode: '\u2686' },
  { tex: /\\circledS/, unicode: '\u24C8' },
  { tex: /\\circledtwodots/, unicode: '\u2687' },
  { tex: /\\circledwhitebullet/, unicode: '\u29BE' },
  { tex: /\\circlellquad/, unicode: '\u25F5' },
  { tex: /\\circlelrquad/, unicode: '\u25F6' },
  { tex: /\\circleonleftarrow/, unicode: '\u2B30' },
  { tex: /\\circleonrightarrow/, unicode: '\u21F4' },
  { tex: /\\circletophalfblack/, unicode: '\u25D3' },
  { tex: /\\circleulquad/, unicode: '\u25F4' },
  { tex: /\\circleurquadblack/, unicode: '\u25D4' },
  { tex: /\\circleurquad/, unicode: '\u25F7' },
  { tex: /\\circlevertfill/, unicode: '\u25CD' },
  { tex: /\^\\circ|\\textdegree/, unicode: '\xB0' },
  { tex: /\\cirmid/, unicode: '\u2AEF' },
  { tex: /\\cirscir/, unicode: '\u29C2' },
  { tex: /\\clockoint/, unicode: '\u2A0F' },
  { tex: /\\closedvarcap/, unicode: '\u2A4D' },
  { tex: /\\closedvarcupsmashprod/, unicode: '\u2A50' },
  { tex: /\\closedvarcup/, unicode: '\u2A4C' },
  { tex: /\\closure/, unicode: '\u2050' },
  { tex: /\\clwintegral/, unicode: '\u2231' },
  { tex: /\\Coloneqq/, unicode: '\u2A74' },
  { tex: /\\commaminus/, unicode: '\u2A29' },
  { tex: /\\complement/, unicode: '\u2201' },
  { tex: /\\ComplexI/, unicode: '\u2148' },
  { tex: /\\ComplexJ/, unicode: '\u2149' },
  { tex: /\\concavediamondtickleft/, unicode: '\u27E2' },
  { tex: /\\concavediamondtickright/, unicode: '\u27E3' },
  { tex: /\\concavediamond/, unicode: '\u27E1' },
  { tex: /\\congdot/, unicode: '\u2A6D' },
  { tex: /\\conictaper/, unicode: '\u2332' },
  { tex: /\\coprod/, unicode: '\u2210' },
  { tex: /\\cupbarcap/, unicode: '\u2A48' },
  { tex: /\\cupdot/, unicode: '\u228D' },
  { tex: /\\cupleftarrow/, unicode: '\u228C' },
  { tex: /\\cupovercap/, unicode: '\u2A46' },
  { tex: /\\cupvee/, unicode: '\u2A45' },
  { tex: /\\curlyeqprec/, unicode: '\u22DE' },
  { tex: /\\curlyeqsucc/, unicode: '\u22DF' },
  { tex: /\\curlyvee/, unicode: '\u22CE' },
  { tex: /\\curlywedge/, unicode: '\u22CF' },
  { tex: /\\curvearrowleftplus/, unicode: '\u293D' },
  { tex: /\\curvearrowleft/, unicode: '\u21B6' },
  { tex: /\\curvearrowrightminus/, unicode: '\u293C' },
  { tex: /\\curvearrowright/, unicode: '\u21B7' },
  { tex: /\\cwgapcirclearrow/, unicode: '\u27F3' },
  { tex: /\\cwrightarcarrow/, unicode: '\u2938' },
  { tex: /\\cwundercurvearrow/, unicode: '\u293E' },
  { tex: /\\dashleftarrow/, unicode: '\u21E0' },
  { tex: /\\dashrightarrow/, unicode: '\u21E2' },
  { tex: /\\DashVDash/, unicode: '\u27DA' },
  { tex: /\\dashVdash/, unicode: '\u27DB' },
  { tex: /\\dbkarow/, unicode: '\u290F' },
  { tex: /\\dblarrowupdown/, unicode: '\u21C5' },
  { tex: /\\ddot\{\\iota\}/, unicode: '\u03CA' },
  { tex: /\\ddotseq/, unicode: '\u2A77' },
  { tex: /\\ddot\{\\upsilon\}/, unicode: '\u03CB' },
  { tex: /\\DDownarrow/, unicode: '\u27F1' },
  { tex: /\\Ddownarrow/, unicode: '\u290B' },
  { tex: /\\DH|\\D\{H\}/, unicode: '\xD0' },
  { tex: /\\diameter/, unicode: '\u2300' },
  { tex: /\\diamondbotblack/, unicode: '\u2B19' },
  { tex: /\\Diamonddot/, unicode: '\u27D0' },
  { tex: /\\diamondleftarrowbar/, unicode: '\u291F' },
  { tex: /\\diamondleftarrow/, unicode: '\u291D' },
  { tex: /\\diamondleftblack/, unicode: '\u2B16' },
  { tex: /\\diamondrightblack/, unicode: '\u2B17' },
  { tex: /\\diamondtopblack/, unicode: '\u2B18' },
  { tex: /\\diamond/, unicode: '\u22C4' },
  { tex: /\\Diamond/, unicode: '\u25C7' },
  { tex: /\\diceiii/, unicode: '\u2682' },
  { tex: /\\DifferentialD/, unicode: '\u2146' },
  { tex: /\\Digamma/, unicode: '\u03DC' },
  { tex: /\\digamma/, unicode: '\u03DD' },
  { tex: /\\ding\{100\}/, unicode: '\u2744' },
  { tex: /\\ding\{101\}/, unicode: '\u2745' },
  { tex: /\\ding\{102\}/, unicode: '\u2746' },
  { tex: /\\ding\{103\}/, unicode: '\u2747' },
  { tex: /\\ding\{104\}/, unicode: '\u2748' },
  { tex: /\\ding\{105\}/, unicode: '\u2749' },
  { tex: /\\ding\{106\}/, unicode: '\u274A' },
  { tex: /\\ding\{107\}/, unicode: '\u274B' },
  { tex: /\\ding\{108\}/, unicode: '\u25CF' },
  { tex: /\\ding\{109\}/, unicode: '\u274D' },
  { tex: /\\ding\{110\}/, unicode: '\u25A0' },
  { tex: /\\ding\{111\}/, unicode: '\u274F' },
  { tex: /\\ding\{112\}/, unicode: '\u2750' },
  { tex: /\\ding\{113\}/, unicode: '\u2751' },
  { tex: /\\ding\{114\}/, unicode: '\u2752' },
  { tex: /\\ding\{115\}/, unicode: '\u25B2' },
  { tex: /\\ding\{116\}/, unicode: '\u25BC' },
  { tex: /\\ding\{117\}/, unicode: '\u25C6' },
  { tex: /\\ding\{118\}/, unicode: '\u2756' },
  { tex: /\\ding\{119\}/, unicode: '\u25D7' },
  { tex: /\\ding\{120\}/, unicode: '\u2758' },
  { tex: /\\ding\{121\}/, unicode: '\u2759' },
  { tex: /\\ding\{122\}/, unicode: '\u275A' },
  { tex: /\\ding\{123\}/, unicode: '\u275B' },
  { tex: /\\ding\{124\}/, unicode: '\u275C' },
  { tex: /\\ding\{125\}/, unicode: '\u275D' },
  { tex: /\\ding\{126\}/, unicode: '\u275E' },
  { tex: /\\ding\{161\}/, unicode: '\u2761' },
  { tex: /\\ding\{162\}/, unicode: '\u2762' },
  { tex: /\\ding\{163\}/, unicode: '\u2763' },
  { tex: /\\ding\{164\}/, unicode: '\u2764' },
  { tex: /\\ding\{165\}/, unicode: '\u2765' },
  { tex: /\\ding\{166\}/, unicode: '\u2766' },
  { tex: /\\ding\{167\}/, unicode: '\u2767' },
  { tex: /\\ding\{168\}/, unicode: '\u2663' },
  { tex: /\\ding\{169\}/, unicode: '\u2666' },
  { tex: /\\ding\{170\}/, unicode: '\u2665' },
  { tex: /\\ding\{171\}/, unicode: '\u2660' },
  { tex: /\\ding\{172\}/, unicode: '\u2460' },
  { tex: /\\ding\{173\}/, unicode: '\u2461' },
  { tex: /\\ding\{174\}/, unicode: '\u2462' },
  { tex: /\\ding\{175\}/, unicode: '\u2463' },
  { tex: /\\ding\{176\}/, unicode: '\u2464' },
  { tex: /\\ding\{177\}/, unicode: '\u2465' },
  { tex: /\\ding\{178\}/, unicode: '\u2466' },
  { tex: /\\ding\{179\}/, unicode: '\u2467' },
  { tex: /\\ding\{180\}/, unicode: '\u2468' },
  { tex: /\\ding\{181\}/, unicode: '\u2469' },
  { tex: /\\ding\{182\}/, unicode: '\u2776' },
  { tex: /\\ding\{183\}/, unicode: '\u2777' },
  { tex: /\\ding\{184\}/, unicode: '\u2778' },
  { tex: /\\ding\{185\}/, unicode: '\u2779' },
  { tex: /\\ding\{186\}/, unicode: '\u277A' },
  { tex: /\\ding\{187\}/, unicode: '\u277B' },
  { tex: /\\ding\{188\}/, unicode: '\u277C' },
  { tex: /\\ding\{189\}/, unicode: '\u277D' },
  { tex: /\\ding\{190\}/, unicode: '\u277E' },
  { tex: /\\ding\{191\}/, unicode: '\u277F' },
  { tex: /\\ding\{192\}/, unicode: '\u2780' },
  { tex: /\\ding\{193\}/, unicode: '\u2781' },
  { tex: /\\ding\{194\}/, unicode: '\u2782' },
  { tex: /\\ding\{195\}/, unicode: '\u2783' },
  { tex: /\\ding\{196\}/, unicode: '\u2784' },
  { tex: /\\ding\{197\}/, unicode: '\u2785' },
  { tex: /\\ding\{198\}/, unicode: '\u2786' },
  { tex: /\\ding\{199\}/, unicode: '\u2787' },
  { tex: /\\ding\{200\}/, unicode: '\u2788' },
  { tex: /\\ding\{201\}/, unicode: '\u2789' },
  { tex: /\\ding\{202\}/, unicode: '\u278A' },
  { tex: /\\ding\{203\}/, unicode: '\u278B' },
  { tex: /\\ding\{204\}/, unicode: '\u278C' },
  { tex: /\\ding\{205\}/, unicode: '\u278D' },
  { tex: /\\ding\{206\}/, unicode: '\u278E' },
  { tex: /\\ding\{207\}/, unicode: '\u278F' },
  { tex: /\\ding\{208\}/, unicode: '\u2790' },
  { tex: /\\ding\{209\}/, unicode: '\u2791' },
  { tex: /\\ding\{210\}/, unicode: '\u2792' },
  { tex: /\\ding\{211\}/, unicode: '\u2793' },
  { tex: /\\ding\{212\}/, unicode: '\u2794' },
  { tex: /\\ding\{216\}/, unicode: '\u2798' },
  { tex: /\\ding\{217\}/, unicode: '\u2799' },
  { tex: /\\ding\{218\}/, unicode: '\u279A' },
  { tex: /\\ding\{219\}/, unicode: '\u279B' },
  { tex: /\\ding\{220\}/, unicode: '\u279C' },
  { tex: /\\ding\{221\}/, unicode: '\u279D' },
  { tex: /\\ding\{222\}/, unicode: '\u279E' },
  { tex: /\\ding\{223\}/, unicode: '\u279F' },
  { tex: /\\ding\{224\}/, unicode: '\u27A0' },
  { tex: /\\ding\{225\}/, unicode: '\u27A1' },
  { tex: /\\ding\{226\}/, unicode: '\u27A2' },
  { tex: /\\ding\{227\}/, unicode: '\u27A3' },
  { tex: /\\ding\{228\}/, unicode: '\u27A4' },
  { tex: /\\ding\{229\}/, unicode: '\u27A5' },
  { tex: /\\ding\{230\}/, unicode: '\u27A6' },
  { tex: /\\ding\{231\}/, unicode: '\u27A7' },
  { tex: /\\ding\{232\}/, unicode: '\u27A8' },
  { tex: /\\ding\{233\}/, unicode: '\u27A9' },
  { tex: /\\ding\{234\}/, unicode: '\u27AA' },
  { tex: /\\ding\{235\}/, unicode: '\u27AB' },
  { tex: /\\ding\{236\}/, unicode: '\u27AC' },
  { tex: /\\ding\{237\}/, unicode: '\u27AD' },
  { tex: /\\ding\{238\}/, unicode: '\u27AE' },
  { tex: /\\ding\{239\}/, unicode: '\u27AF' },
  { tex: /\\ding\{241\}/, unicode: '\u27B1' },
  { tex: /\\ding\{242\}/, unicode: '\u27B2' },
  { tex: /\\ding\{243\}/, unicode: '\u27B3' },
  { tex: /\\ding\{244\}/, unicode: '\u27B4' },
  { tex: /\\ding\{245\}/, unicode: '\u27B5' },
  { tex: /\\ding\{246\}/, unicode: '\u27B6' },
  { tex: /\\ding\{247\}/, unicode: '\u27B7' },
  { tex: /\\ding\{248\}/, unicode: '\u27B8' },
  { tex: /\\ding\{249\}/, unicode: '\u27B9' },
  { tex: /\\ding\{250\}/, unicode: '\u27BA' },
  { tex: /\\ding\{251\}/, unicode: '\u27BB' },
  { tex: /\\ding\{252\}/, unicode: '\u27BC' },
  { tex: /\\ding\{253\}/, unicode: '\u27BD' },
  { tex: /\\ding\{254\}/, unicode: '\u27BE' },
  { tex: /\\ding\{33\}/, unicode: '\u2701' },
  { tex: /\\ding\{34\}/, unicode: '\u2702' },
  { tex: /\\ding\{35\}/, unicode: '\u2703' },
  { tex: /\\ding\{36\}/, unicode: '\u2704' },
  { tex: /\\ding\{37\}/, unicode: '\u260E' },
  { tex: /\\ding\{38\}/, unicode: '\u2706' },
  { tex: /\\ding\{39\}/, unicode: '\u2707' },
  { tex: /\\ding\{40\}/, unicode: '\u2708' },
  { tex: /\\ding\{41\}/, unicode: '\u2709' },
  { tex: /\\ding\{42\}/, unicode: '\u261B' },
  { tex: /\\ding\{43\}/, unicode: '\u261E' },
  { tex: /\\ding\{44\}/, unicode: '\u270C' },
  { tex: /\\ding\{45\}/, unicode: '\u270D' },
  { tex: /\\ding\{46\}/, unicode: '\u270E' },
  { tex: /\\ding\{47\}/, unicode: '\u270F' },
  { tex: /\\ding\{48\}/, unicode: '\u2710' },
  { tex: /\\ding\{49\}/, unicode: '\u2711' },
  { tex: /\\ding\{50\}/, unicode: '\u2712' },
  { tex: /\\ding\{51\}/, unicode: '\u2713' },
  { tex: /\\ding\{52\}/, unicode: '\u2714' },
  { tex: /\\ding\{53\}/, unicode: '\u2715' },
  { tex: /\\ding\{54\}/, unicode: '\u2716' },
  { tex: /\\ding\{55\}/, unicode: '\u2717' },
  { tex: /\\ding\{56\}/, unicode: '\u2718' },
  { tex: /\\ding\{57\}/, unicode: '\u2719' },
  { tex: /\\ding\{58\}/, unicode: '\u271A' },
  { tex: /\\ding\{59\}/, unicode: '\u271B' },
  { tex: /\\ding\{60\}/, unicode: '\u271C' },
  { tex: /\\ding\{61\}/, unicode: '\u271D' },
  { tex: /\\ding\{62\}/, unicode: '\u271E' },
  { tex: /\\ding\{63\}/, unicode: '\u271F' },
  { tex: /\\ding\{64\}/, unicode: '\u2720' },
  { tex: /\\ding\{65\}/, unicode: '\u2721' },
  { tex: /\\ding\{66\}/, unicode: '\u2722' },
  { tex: /\\ding\{67\}/, unicode: '\u2723' },
  { tex: /\\ding\{68\}/, unicode: '\u2724' },
  { tex: /\\ding\{69\}/, unicode: '\u2725' },
  { tex: /\\ding\{70\}/, unicode: '\u2726' },
  { tex: /\\ding\{71\}/, unicode: '\u2727' },
  { tex: /\\ding\{72\}/, unicode: '\u2605' },
  { tex: /\\ding\{73\}/, unicode: '\u2606' },
  { tex: /\\ding\{74\}/, unicode: '\u272A' },
  { tex: /\\ding\{75\}/, unicode: '\u272B' },
  { tex: /\\ding\{76\}/, unicode: '\u272C' },
  { tex: /\\ding\{77\}/, unicode: '\u272D' },
  { tex: /\\ding\{78\}/, unicode: '\u272E' },
  { tex: /\\ding\{79\}/, unicode: '\u272F' },
  { tex: /\\ding\{80\}/, unicode: '\u2730' },
  { tex: /\\ding\{81\}/, unicode: '\u2731' },
  { tex: /\\ding\{82\}/, unicode: '\u2732' },
  { tex: /\\ding\{83\}/, unicode: '\u2733' },
  { tex: /\\ding\{84\}/, unicode: '\u2734' },
  { tex: /\\ding\{85\}/, unicode: '\u2735' },
  { tex: /\\ding\{86\}/, unicode: '\u2736' },
  { tex: /\\ding\{87\}/, unicode: '\u2737' },
  { tex: /\\ding\{88\}/, unicode: '\u2738' },
  { tex: /\\ding\{89\}/, unicode: '\u2739' },
  { tex: /\\ding\{90\}/, unicode: '\u273A' },
  { tex: /\\ding\{91\}/, unicode: '\u273B' },
  { tex: /\\ding\{92\}/, unicode: '\u273C' },
  { tex: /\\ding\{93\}/, unicode: '\u273D' },
  { tex: /\\ding\{94\}/, unicode: '\u273E' },
  { tex: /\\ding\{95\}/, unicode: '\u273F' },
  { tex: /\\ding\{96\}/, unicode: '\u2740' },
  { tex: /\\ding\{97\}/, unicode: '\u2741' },
  { tex: /\\ding\{98\}/, unicode: '\u2742' },
  { tex: /\\ding\{99\}/, unicode: '\u2743' },
  { tex: /\\divideontimes/, unicode: '\u22C7' },
  { tex: /\\doteqdot/, unicode: '\u2251' },
  { tex: /\\dotequiv/, unicode: '\u2A67' },
  { tex: /\\dotplus/, unicode: '\u2214' },
  { tex: /\\dotsim/, unicode: '\u2A6A' },
  { tex: /\\dottedcircle/, unicode: '\u25CC' },
  { tex: /\\dottedsquare/, unicode: '\u2B1A' },
  { tex: /\\dottimes/, unicode: '\u2A30' },
  { tex: /\\doublebarvee/, unicode: '\u2A62' },
  { tex: /\\doubleplus/, unicode: '\u29FA' },
  { tex: /\\downarrowbarred/, unicode: '\u2908' },
  { tex: /\\DownArrowBar/, unicode: '\u2913' },
  { tex: /\\downarrow/, unicode: '\u2193' },
  { tex: /\\Downarrow/, unicode: '\u21D3' },
  { tex: /\\DownArrowUpArrow/, unicode: '\u21F5' },
  { tex: /\\downdasharrow/, unicode: '\u21E3' },
  { tex: /\\downdownarrows/, unicode: '\u21CA' },
  { tex: /\\downdownharpoons/, unicode: '\u2965' },
  { tex: /\\downfishtail/, unicode: '\u297F' },
  { tex: /\\downharpoonleft/, unicode: '\u21C3' },
  { tex: /\\downharpoonright/, unicode: '\u21C2' },
  { tex: /\\DownLeftRightVector/, unicode: '\u2950' },
  { tex: /\\DownLeftTeeVector/, unicode: '\u295E' },
  { tex: /\\DownLeftVectorBar/, unicode: '\u2956' },
  { tex: /\\downrightcurvedarrow/, unicode: '\u2935' },
  { tex: /\\DownRightTeeVector/, unicode: '\u295F' },
  { tex: /\\DownRightVectorBar/, unicode: '\u2957' },
  { tex: /\\downslopeellipsis/, unicode: '\u22F1' },
  { tex: /\\downtriangleleftblack/, unicode: '\u29E8' },
  { tex: /\\downtrianglerightblack/, unicode: '\u29E9' },
  { tex: /\\downwhitearrow/, unicode: '\u21E9' },
  { tex: /\\drbkarow/, unicode: '\u2910' },
  { tex: /\\droang/, unicode: '\u031A' },
  { tex: /\\egsdot/, unicode: '\u2A98' },
  { tex: /\\eighthnote/, unicode: '\u266A' },
  { tex: /\\elinters/, unicode: '\u23E7' },
  { tex: /\\Elolarr/, unicode: '\u2940' },
  { tex: /\\Elorarr/, unicode: '\u2941' },
  { tex: /\\Elroang/, unicode: '\u2986' },
  { tex: /\\elsdot/, unicode: '\u2A97' },
  { tex: /\\ElsevierGlyph\{2129\}/, unicode: '\u2129' },
  { tex: /\\ElsevierGlyph\{21B3\}/, unicode: '\u21B3' },
  { tex: /\\ElsevierGlyph\{2232\}/, unicode: '\u2232' },
  { tex: /\\ElsevierGlyph\{2233\}/, unicode: '\u2233' },
  { tex: /\\ElsevierGlyph\{2238\}/, unicode: '\u2238' },
  { tex: /\\ElsevierGlyph\{2242\}/, unicode: '\u2242' },
  { tex: /\\ElsevierGlyph\{225A\}/, unicode: '\u225A' },
  { tex: /\\ElsevierGlyph\{225F\}/, unicode: '\u225F' },
  { tex: /\\ElsevierGlyph\{2274\}/, unicode: '\u2274' },
  { tex: /\\ElsevierGlyph\{2275\}/, unicode: '\u2275' },
  { tex: /\\ElsevierGlyph\{22C0\}/, unicode: '\u22C0' },
  { tex: /\\ElsevierGlyph\{22C1\}/, unicode: '\u22C1' },
  { tex: /\\ElsevierGlyph\{300A\}/, unicode: '\u300A' },
  { tex: /\\ElsevierGlyph\{300B\}/, unicode: '\u300B' },
  { tex: /\\ElsevierGlyph\{3018\}/, unicode: '\u2985' },
  { tex: /\\ElsevierGlyph\{3019\}/, unicode: '\u3019' },
  { tex: /\\ElsevierGlyph\{E20A\}/, unicode: '\u2926' },
  { tex: /\\ElsevierGlyph\{E20B\}/, unicode: '\u2925' },
  { tex: /\\ElsevierGlyph\{E20C\}/, unicode: '\u2923' },
  { tex: /\\ElsevierGlyph\{E20D\}/, unicode: '\u2924' },
  { tex: /\\ElsevierGlyph\{E20E\}/, unicode: '\u2928' },
  { tex: /\\ElsevierGlyph\{E20F\}/, unicode: '\u2929' },
  { tex: /\\ElsevierGlyph\{E210\}/, unicode: '\u292A' },
  { tex: /\\ElsevierGlyph\{E211\}/, unicode: '\u2927' },
  { tex: /\\ElsevierGlyph\{E212\}/, unicode: '\u2905' },
  { tex: /\\ElsevierGlyph\{E214\}/, unicode: '\u297C' },
  { tex: /\\ElsevierGlyph\{E215\}/, unicode: '\u297D' },
  { tex: /\\ElsevierGlyph\{E219\}/, unicode: '\u2937' },
  { tex: /\\ElsevierGlyph\{E21A\}/, unicode: '\u2936' },
  { tex: /\\ElsevierGlyph\{E21C\}/, unicode: '\u2933' },
  { tex: /\\ElsevierGlyph\{E259\}/, unicode: '\u2A3C' },
  { tex: /\\ElsevierGlyph\{E25A\}/, unicode: '\u2A25' },
  { tex: /\\ElsevierGlyph\{E25B\}/, unicode: '\u2A2A' },
  { tex: /\\ElsevierGlyph\{E25C\}/, unicode: '\u2A2D' },
  { tex: /\\ElsevierGlyph\{E25D\}/, unicode: '\u2A2E' },
  { tex: /\\ElsevierGlyph\{E25E\}/, unicode: '\u2A34' },
  { tex: /\\ElsevierGlyph\{E260\}/, unicode: '\u29B5' },
  { tex: /\\ElsevierGlyph\{E291\}/, unicode: '\u2994' },
  { tex: /\\ElsevierGlyph\{E30D\}/, unicode: '\u2AEB' },
  { tex: /\\ElsevierGlyph\{E36E\}/, unicode: '\u2A55' },
  { tex: /\\ElsevierGlyph\{E372\}/, unicode: '\u29DC' },
  { tex: /\\ElsevierGlyph\{E381\}/, unicode: '\u25B1' },
  { tex: /\\ElsevierGlyph\{E395\}/, unicode: '\u2A10' },
  { tex: /\\ElsevierGlyph\{E61B\}/, unicode: '\u29B6' },
  { tex: /\\ElsevierGlyph\{E838\}/, unicode: '\u233D' },
  { tex: /\\Elxsqcup/, unicode: '\u2A06' },
  { tex: /\\Elxuplus/, unicode: '\u2A04' },
  { tex: /\\ElzAnd/, unicode: '\u2A53' },
  { tex: /\\Elzbar/, unicode: '\u0336' },
  { tex: /\\Elzbtdl/, unicode: '\u026C' },
  { tex: /\\ElzCint/, unicode: '\u2A0D' },
  { tex: /\\Elzcirfb/, unicode: '\u25D2' },
  { tex: /\\Elzcirfl/, unicode: '\u25D0' },
  { tex: /\\Elzcirfr/, unicode: '\u25D1' },
  { tex: /\\Elzclomeg/, unicode: '\u0277' },
  { tex: /\\Elzddfnc/, unicode: '\u2999' },
  { tex: /\\Elzdefas/, unicode: '\u29CB' },
  { tex: /\\Elzdlcorn/, unicode: '\u23A3' },
  { tex: /\\Elzdshfnc/, unicode: '\u2506' },
  { tex: /\\Elzdyogh/, unicode: '\u02A4' },
  { tex: /\\Elzesh/, unicode: '\u0283' },
  { tex: /\\Elzfhr/, unicode: '\u027E' },
  { tex: /\\Elzglst/, unicode: '\u0294' },
  { tex: /\\Elzhlmrk/, unicode: '\u02D1' },
  { tex: /\\ElzInf/, unicode: '\u2A07' },
  { tex: /\\Elzinglst/, unicode: '\u0296' },
  { tex: /\\Elzinvv/, unicode: '\u028C' },
  { tex: /\\Elzinvw/, unicode: '\u028D' },
  { tex: /\\ElzLap/, unicode: '\u29CA' },
  { tex: /\\Elzlmrk/, unicode: '\u02D0' },
  { tex: /\\Elzlow/, unicode: '\u02D5' },
  { tex: /\\Elzlpargt/, unicode: '\u29A0' },
  { tex: /\\Elzltlmr/, unicode: '\u0271' },
  { tex: /\\Elzltln/, unicode: '\u0272' },
  { tex: /\\Elzminhat/, unicode: '\u2A5F' },
  { tex: /\\Elzopeno/, unicode: '\u0254' },
  { tex: /\\Elzpalh/, unicode: '\u0321' },
  { tex: /\\Elzpbgam/, unicode: '\u0264' },
  { tex: /\\Elzpgamma/, unicode: '\u0263' },
  { tex: /\\Elzpscrv/, unicode: '\u028B' },
  { tex: /\\Elzpupsil/, unicode: '\u028A' },
  { tex: /\\Elzrais/, unicode: '\u02D4' },
  { tex: /\\Elzrarrx/, unicode: '\u2947' },
  { tex: /\\Elzreapos/, unicode: '\u201B' },
  { tex: /\\Elzreglst/, unicode: '\u0295' },
  { tex: /\\ElzRlarr/, unicode: '\u2942' },
  { tex: /\\ElzrLarr/, unicode: '\u2944' },
  { tex: /\\Elzrtld/, unicode: '\u0256' },
  { tex: /\\Elzrtll/, unicode: '\u026D' },
  { tex: /\\Elzrtln/, unicode: '\u0273' },
  { tex: /\\Elzrtlr/, unicode: '\u027D' },
  { tex: /\\Elzrtls/, unicode: '\u0282' },
  { tex: /\\Elzrtlt/, unicode: '\u0288' },
  { tex: /\\Elzrtlz/, unicode: '\u0290' },
  { tex: /\\Elzrttrnr/, unicode: '\u027B' },
  { tex: /\\Elzrvbull/, unicode: '\u25D8' },
  { tex: /\\Elzsbbrg/, unicode: '\u032A' },
  { tex: /\\Elzsblhr/, unicode: '\u02D3' },
  { tex: /\\Elzsbrhr/, unicode: '\u02D2' },
  { tex: /\\Elzschwa/, unicode: '\u0259' },
  { tex: /\\Elzsqfl/, unicode: '\u25E7' },
  { tex: /\\Elzsqfnw/, unicode: '\u2519' },
  { tex: /\\Elzsqfr/, unicode: '\u25E8' },
  { tex: /\\Elzsqfse/, unicode: '\u25EA' },
  { tex: /\\Elzsqspne/, unicode: '\u22E5' },
  { tex: /\\ElzSup/, unicode: '\u2A08' },
  { tex: /\\Elztdcol/, unicode: '\u2AF6' },
  { tex: /\\Elztesh/, unicode: '\u02A7' },
  { tex: /\\Elztfnc/, unicode: '\u2980' },
  { tex: /\\ElzThr/, unicode: '\u2A05' },
  { tex: /\\ElzTimes/, unicode: '\u2A2F' },
  { tex: /\\Elztrna/, unicode: '\u0250' },
  { tex: /\\Elztrnh/, unicode: '\u0265' },
  { tex: /\\Elztrnmlr/, unicode: '\u0270' },
  { tex: /\\Elztrnm/, unicode: '\u026F' },
  { tex: /\\Elztrnrl/, unicode: '\u027A' },
  { tex: /\\Elztrnr/, unicode: '\u0279' },
  { tex: /\\Elztrnsa/, unicode: '\u0252' },
  { tex: /\\Elztrnt/, unicode: '\u0287' },
  { tex: /\\Elztrny/, unicode: '\u028E' },
  { tex: /\\Elzverti/, unicode: '\u02CC' },
  { tex: /\\Elzverts/, unicode: '\u02C8' },
  { tex: /\\Elzvrecto/, unicode: '\u25AF' },
  { tex: /\\Elzxrat/, unicode: '\u211E' },
  { tex: /\\Elzyogh/, unicode: '\u0292' },
  { tex: /\\emptysetoarrl/, unicode: '\u29B4' },
  { tex: /\\emptysetoarr/, unicode: '\u29B3' },
  { tex: /\\emptysetobar/, unicode: '\u29B1' },
  { tex: /\\emptysetocirc/, unicode: '\u29B2' },
  { tex: /\\enclosecircle/, unicode: '\u20DD' },
  { tex: /\\enclosediamond/, unicode: '\u20DF' },
  { tex: /\\enclosesquare/, unicode: '\u20DE' },
  { tex: /\\enclosetriangle/, unicode: '\u20E4' },
  { tex: /\\ensuremath\{\\Elzpes\}/, unicode: '\u20A7' },
  { tex: /\\eparsl/, unicode: '\u29E3' },
  { tex: /\\epsilon/, unicode: '\u03B5' },
  { tex: /\\eqcolon/, unicode: '\u2239' },
  { tex: /\\eqqgtr/, unicode: '\u2A9A' },
  { tex: /\\eqqless/, unicode: '\u2A99' },
  { tex: /\\eqqplus/, unicode: '\u2A71' },
  { tex: /\\eqqsim/, unicode: '\u2A73' },
  { tex: /\\eqqslantgtr/, unicode: '\u2A9C' },
  { tex: /\\eqqslantless/, unicode: '\u2A9B' },
  { tex: /\\eqslantgtr/, unicode: '\u2A96' },
  { tex: /\\eqslantless/, unicode: '\u2A95' },
  { tex: /\\equalleftarrow/, unicode: '\u2B40' },
  { tex: /\\equalrightarrow/, unicode: '\u2971' },
  { tex: /\\equivDD/, unicode: '\u2A78' },
  { tex: /\\equivVert/, unicode: '\u2A68' },
  { tex: /\\equivVvert/, unicode: '\u2A69' },
  { tex: /\\eqvparsl/, unicode: '\u29E5' },
  { tex: /\\errbarblackcircle/, unicode: '\u29F3' },
  { tex: /\\errbarblackdiamond/, unicode: '\u29F1' },
  { tex: /\\errbarblacksquare/, unicode: '\u29EF' },
  { tex: /\\errbarcircle/, unicode: '\u29F2' },
  { tex: /\\errbardiamond/, unicode: '\u29F0' },
  { tex: /\\errbarsquare/, unicode: '\u29EE' },
  { tex: /\\estimates/, unicode: '\u2259' },
  { tex: /\\exists/, unicode: '\u2203' },
  { tex: /\\ExponetialE/, unicode: '\u2147' },
  { tex: /\\fallingdotseq/, unicode: '\u2252' },
  { tex: /\\fbowtie/, unicode: '\u29D3' },
  { tex: /\\fbox\{~~\}/, unicode: '\u25AD' },
  { tex: /\\fdiagovnearrow/, unicode: '\u292F' },
  { tex: /\\fdiagovrdiag/, unicode: '\u292C' },
  { tex: /\\fisheye/, unicode: '\u25C9' },
  { tex: /\\forall/, unicode: '\u2200' },
  { tex: /\\forcesextra/, unicode: '\u22A8' },
  { tex: /\\forksnot/, unicode: '\u2ADD' },
  { tex: /\\fracslash/, unicode: '\u2044' },
  { tex: /\\frownie/, unicode: '\u2639' },
  { tex: /\\fullouterjoin/, unicode: '\u27D7' },
  { tex: /\\geqqslant/, unicode: '\u2AFA' },
  { tex: /\\geqslant/, unicode: '\u2A7E' },
  { tex: /\\gesdotol/, unicode: '\u2A84' },
  { tex: /\\gesdoto/, unicode: '\u2A82' },
  { tex: /\\gesdot/, unicode: '\u2A80' },
  { tex: /\\gesles/, unicode: '\u2A94' },
  { tex: /\\ggcurly/, unicode: '\u2ABC' },
  { tex: /\\gggnest/, unicode: '\u2AF8' },
  { tex: /\\gleichstark/, unicode: '\u29E6' },
  { tex: /\\gnapprox/, unicode: '\u2A8A' },
  { tex: /\\greaterequivlnt/, unicode: '\u2273' },
  { tex: /\\gtquest/, unicode: '\u2A7C' },
  { tex: /\\gtrapprox/, unicode: '\u2A86' },
  { tex: /\\gtrarr/, unicode: '\u2978' },
  { tex: /\\gtreqless/, unicode: '\u22DB' },
  { tex: /\\gtreqqless/, unicode: '\u2A8C' },
  { tex: /\\gtrless/, unicode: '\u2277' },
  { tex: /\\guillemotleft/, unicode: '\xAB' },
  { tex: /\\guillemotright/, unicode: '\xBB' },
  { tex: /\\guilsinglleft/, unicode: '\u2039' },
  { tex: /\\guilsinglright/, unicode: '\u203A' },
  { tex: /\\harrowextender/, unicode: '\u23AF' },
  { tex: /\\hatapprox/, unicode: '\u2A6F' },
  { tex: /\\heartsuit/, unicode: '\u2661' },
  { tex: /\\Hermaphrodite/, unicode: '\u26A5' },
  { tex: /\\hermitconjmatrix/, unicode: '\u22B9' },
  { tex: /\\hexagonblack/, unicode: '\u2B23' },
  { tex: /\\hexagon/, unicode: '\u2394' },
  { tex: /\\homothetic/, unicode: '\u223B' },
  { tex: /\\hookleftarrow/, unicode: '\u21A9' },
  { tex: /\\hookrightarrow/, unicode: '\u21AA' },
  { tex: /\\hourglass/, unicode: '\u29D6' },
  { tex: /\\hphantom\{0\}/, unicode: '\u2007' },
  { tex: /\\hphantom\{,\}/, unicode: '\u2008' },
  { tex: /\\hrectangleblack/, unicode: '\u25AC' },
  { tex: /\\hspace\{0\.166em\}/, unicode: '\u2006' },
  { tex: /\\,|\\hspace\{0\.167em\}/, unicode: '\u2009' },
  { tex: /\\hspace\{0\.25em\}/, unicode: '\u2005' },
  { tex: /\\hspace\{0\.33em\}/, unicode: '\u2004' },
  { tex: /\\hspace\{0\.6em\}/, unicode: '\u2002' },
  { tex: /\\hspace\{1em\}/, unicode: '\u2003' },
  { tex: /\\hyphenbullet/, unicode: '\u2043' },
  { tex: /\\hzigzag/, unicode: '\u3030' },
  { tex: /\\iiiint/, unicode: '\u2A0C' },
  { tex: /\\increment/, unicode: '\u2206' },
  { tex: /\\intBar/, unicode: '\u2A0E' },
  { tex: /\\intbottom/, unicode: '\u2321' },
  { tex: /\\intcap/, unicode: '\u2A19' },
  { tex: /\\intcup/, unicode: '\u2A1A' },
  { tex: /\\intercal/, unicode: '\u22BA' },
  { tex: /\\interleave/, unicode: '\u2AF4' },
  { tex: /\\intextender/, unicode: '\u23AE' },
  { tex: /\\int\\!\\int\\!\\int/, unicode: '\u222D' },
  { tex: /\\int\\!\\int/, unicode: '\u222C' },
  { tex: /\\intlarhk/, unicode: '\u2A17' },
  { tex: /\\intprodr/, unicode: '\u2A3D' },
  { tex: /\\inversewhitecircle/, unicode: '\u25D9' },
  { tex: /\\invwhitelowerhalfcircle/, unicode: '\u25DB' },
  { tex: /\\invwhiteupperhalfcircle/, unicode: '\u25DA' },
  { tex: /\\isindot/, unicode: '\u22F5' },
  { tex: /\\isinobar/, unicode: '\u22F7' },
  { tex: /\\'\{\}\{I\}/, unicode: '\u038A' },
  { tex: /\\jupiter/, unicode: '\u2643' },
  { tex: /<\\kern-0\.58em\(/, unicode: '\u2993' },
  { tex: /\\Lambda/, unicode: '\u039B' },
  { tex: /\\lambda/, unicode: '\u03BB' },
  { tex: /\\langledot/, unicode: '\u2991' },
  { tex: /\\laplac/, unicode: '\u29E0' },
  { tex: /\\lazysinv/, unicode: '\u223E' },
  { tex: /\\lblkbrbrak/, unicode: '\u2997' },
  { tex: /\\lbracelend/, unicode: '\u23A9' },
  { tex: /\\lbracemid/, unicode: '\u23A8' },
  { tex: /\\lbraceuend/, unicode: '\u23A7' },
  { tex: /\\lbrace/, unicode: '\\{' },
  { tex: /\\lBrace/, unicode: '\u2983' },
  { tex: /\\lbrackextender/, unicode: '\u23A2' },
  { tex: /\\lbracklltick/, unicode: '\u298F' },
  { tex: /\\lbrackubar/, unicode: '\u298B' },
  { tex: /\\lbrackuend/, unicode: '\u23A1' },
  { tex: /\\lbrackultick/, unicode: '\u298D' },
  { tex: /\\lbrbrak/, unicode: '\u2772' },
  { tex: /\\Lbrbrak/, unicode: '\u27EC' },
  { tex: /\\lcurvyangle/, unicode: '\u29FC' },
  { tex: /\\leftarrowapprox/, unicode: '\u2B4A' },
  { tex: /\\leftarrowbackapprox/, unicode: '\u2B42' },
  { tex: /\\LeftArrowBar/, unicode: '\u21E4' },
  { tex: /\\leftarrowbsimilar/, unicode: '\u2B4B' },
  { tex: /\\leftarrowless/, unicode: '\u2977' },
  { tex: /\\leftarrowonoplus/, unicode: '\u2B32' },
  { tex: /\\leftarrowplus/, unicode: '\u2946' },
  { tex: /\\leftarrowshortrightarrow/, unicode: '\u2943' },
  { tex: /\\leftarrowsimilar/, unicode: '\u2973' },
  { tex: /\\leftarrowsubset/, unicode: '\u297A' },
  { tex: /\\leftarrowtail/, unicode: '\u21A2' },
  { tex: /\\leftarrowtriangle/, unicode: '\u21FD' },
  { tex: /\\leftarrow/, unicode: '\u2190' },
  { tex: /\\Leftarrow/, unicode: '\u21D0' },
  { tex: /\\leftarrowx/, unicode: '\u2B3E' },
  { tex: /\\leftbarharpoon/, unicode: '\u296A' },
  { tex: /\\leftbkarrow/, unicode: '\u290C' },
  { tex: /\\LEFTCIRCLE/, unicode: '\u25D6' },
  { tex: /\\leftcurvedarrow/, unicode: '\u2B3F' },
  { tex: /\\leftdbkarrow/, unicode: '\u290E' },
  { tex: /\\leftdbltail/, unicode: '\u291B' },
  { tex: /\\leftdotarrow/, unicode: '\u2B38' },
  { tex: /\\LeftDownTeeVector/, unicode: '\u2961' },
  { tex: /\\LeftDownVectorBar/, unicode: '\u2959' },
  { tex: /\\leftharpoondown/, unicode: '\u21BD' },
  { tex: /\\leftharpoonup/, unicode: '\u21BC' },
  { tex: /\\leftleftarrows/, unicode: '\u21C7' },
  { tex: /\\leftleftharpoons/, unicode: '\u2962' },
  { tex: /\\leftouterjoin/, unicode: '\u27D5' },
  { tex: /\\leftrightarrowcircle/, unicode: '\u2948' },
  { tex: /\\leftrightarrows/, unicode: '\u21C6' },
  { tex: /\\leftrightarrowtriangle/, unicode: '\u21FF' },
  { tex: /\\leftrightarrow/, unicode: '\u2194' },
  { tex: /\\Leftrightarrow/, unicode: '\u21D4' },
  { tex: /\\leftrightharpoonsdown/, unicode: '\u2967' },
  { tex: /\\leftrightharpoons/, unicode: '\u21CB' },
  { tex: /\\leftrightharpoonsup/, unicode: '\u2966' },
  { tex: /\\leftrightharpoon/, unicode: '\u294A' },
  { tex: /\\leftrightsquigarrow/, unicode: '\u21AD' },
  { tex: /\\LeftRightVector/, unicode: '\u294E' },
  { tex: /\\leftslice/, unicode: '\u2AA6' },
  { tex: /\\leftsquigarrow/, unicode: '\u21DC' },
  { tex: /\\lefttail/, unicode: '\u2919' },
  { tex: /\\LeftTeeVector/, unicode: '\u295A' },
  { tex: /\\leftthreearrows/, unicode: '\u2B31' },
  { tex: /\\leftthreetimes/, unicode: '\u22CB' },
  { tex: /\\LeftTriangleBar/, unicode: '\u29CF' },
  { tex: /\\LeftUpDownVector/, unicode: '\u2951' },
  { tex: /\\LeftUpTeeVector/, unicode: '\u2960' },
  { tex: /\\LeftUpVectorBar/, unicode: '\u2958' },
  { tex: /\\LeftVectorBar/, unicode: '\u2952' },
  { tex: /\\leftwhitearrow/, unicode: '\u21E6' },
  { tex: /\\leqqslant/, unicode: '\u2AF9' },
  { tex: /\\leqslant/, unicode: '\u2A7D' },
  { tex: /\\lesdotor/, unicode: '\u2A83' },
  { tex: /\\lesdoto/, unicode: '\u2A81' },
  { tex: /\\lesdot/, unicode: '\u2A7F' },
  { tex: /\\lesges/, unicode: '\u2A93' },
  { tex: /\\lessapprox/, unicode: '\u2A85' },
  { tex: /\\lessdot/, unicode: '\u22D6' },
  { tex: /\\lesseqgtr/, unicode: '\u22DA' },
  { tex: /\\lesseqqgtr/, unicode: '\u2A8B' },
  { tex: /\\lessequivlnt/, unicode: '\u2272' },
  { tex: /\\lessgtr/, unicode: '\u2276' },
  { tex: /\\lfbowtie/, unicode: '\u29D1' },
  { tex: /\\lftimes/, unicode: '\u29D4' },
  { tex: /\\lgblkcircle/, unicode: '\u2B24' },
  { tex: /\\lgroup/, unicode: '\u27EE' },
  { tex: /\\lightning/, unicode: '\u21AF' },
  { tex: /\\linefeed/, unicode: '\u21B4' },
  { tex: /\\llblacktriangle/, unicode: '\u25E3' },
  { tex: /\\llbracket/, unicode: '\u27E6' },
  { tex: /\\llcorner/, unicode: '\u231E' },
  { tex: /\\llcurly/, unicode: '\u2ABB' },
  { tex: /\\Lleftarrow/, unicode: '\u21DA' },
  { tex: /\\LLeftarrow/, unicode: '\u2B45' },
  { tex: /\\lllnest/, unicode: '\u2AF7' },
  { tex: /\\lltriangle/, unicode: '\u25FA' },
  { tex: /\\lmoustache/, unicode: '\u23B0' },
  { tex: /\\lnapprox/, unicode: '\u2A89' },
  { tex: /\\longdashv/, unicode: '\u27DE' },
  { tex: /\\longdivision/, unicode: '\u27CC' },
  { tex: /\\longleftarrow/, unicode: '\u27F5' },
  { tex: /\\Longleftarrow/, unicode: '\u27F8' },
  { tex: /\\longleftrightarrow/, unicode: '\u27F7' },
  { tex: /\\Longleftrightarrow/, unicode: '\u27FA' },
  { tex: /\\longleftsquigarrow/, unicode: '\u2B33' },
  { tex: /\\longmapsfrom/, unicode: '\u27FB' },
  { tex: /\\Longmapsfrom/, unicode: '\u27FD' },
  { tex: /\\longmapsto/, unicode: '\u27FC' },
  { tex: /\\Longmapsto/, unicode: '\u27FE' },
  { tex: /\\longrightarrow/, unicode: '\u27F6' },
  { tex: /\\Longrightarrow/, unicode: '\u27F9' },
  { tex: /\\looparrowleft/, unicode: '\u21AB' },
  { tex: /\\looparrowright/, unicode: '\u21AC' },
  { tex: /\\lowint/, unicode: '\u2A1C' },
  { tex: /\\lozengeminus/, unicode: '\u27E0' },
  { tex: /\\lozenge/, unicode: '\u25CA' },
  { tex: /\\lparenextender/, unicode: '\u239C' },
  { tex: /\\Lparengtr/, unicode: '\u2995' },
  { tex: /\\lparenlend/, unicode: '\u239D' },
  { tex: /\\lparenuend/, unicode: '\u239B' },
  { tex: /\\lrblacktriangle/, unicode: '\u25E2' },
  { tex: /\\lrcorner/, unicode: '\u231F' },
  { tex: /\\lrtriangleeq/, unicode: '\u29E1' },
  { tex: /\\lrtriangle/, unicode: '\u25FF' },
  { tex: /\\lsqhook/, unicode: '\u2ACD' },
  { tex: /\\ltlarr/, unicode: '\u2976' },
  { tex: /\\ltquest/, unicode: '\u2A7B' },
  { tex: /\\lvboxline/, unicode: '\u23B8' },
  { tex: /\\lvzigzag/, unicode: '\u29D8' },
  { tex: /\\Lvzigzag/, unicode: '\u29DA' },
  { tex: /\\MapsDown/, unicode: '\u21A7' },
  { tex: /\\mapsfrom/, unicode: '\u21A4' },
  { tex: /\\Mapsfrom/, unicode: '\u2906' },
  { tex: /\\Mapsto/, unicode: '\u2907' },
  { tex: /\\mbfDigamma/, unicode: '\uD835\uDFCA' },
  { tex: /\\mbfdigamma/, unicode: '\uD835\uDFCB' },
  { tex: /\\mdblkdiamond/, unicode: '\u2B25' },
  { tex: /\\mdblklozenge/, unicode: '\u2B27' },
  { tex: /\\mdsmblksquare/, unicode: '\u25FE' },
  { tex: /\\mdsmwhtcircle/, unicode: '\u26AC' },
  { tex: /\\mdsmwhtsquare/, unicode: '\u25FD' },
  { tex: /\\mdwhtdiamond/, unicode: '\u2B26' },
  { tex: /\\mdwhtlozenge/, unicode: '\u2B28' },
  { tex: /\\measangledltosw/, unicode: '\u29AF' },
  { tex: /\\measangledrtose/, unicode: '\u29AE' },
  { tex: /\\measangleldtosw/, unicode: '\u29AB' },
  { tex: /\\measanglelutonw/, unicode: '\u29A9' },
  { tex: /\\measanglerdtose/, unicode: '\u29AA' },
  { tex: /\\measanglerutone/, unicode: '\u29A8' },
  { tex: /\\measangleultonw/, unicode: '\u29AD' },
  { tex: /\\measangleurtone/, unicode: '\u29AC' },
  { tex: /\\measeq/, unicode: '\u225E' },
  { tex: /\\measuredangleleft/, unicode: '\u299B' },
  { tex: /\\measuredangle/, unicode: '\u2221' },
  { tex: /\\medblackstar/, unicode: '\u2B51' },
  { tex: /\\medbullet/, unicode: '\u26AB' },
  { tex: /\\medcirc/, unicode: '\u26AA' },
  { tex: /\\medwhitestar/, unicode: '\u2B50' },
  { tex: /\\mercury/, unicode: '\u263F' },
  { tex: /\\midbarvee/, unicode: '\u2A5D' },
  { tex: /\\midbarwedge/, unicode: '\u2A5C' },
  { tex: /\\midcir/, unicode: '\u2AF0' },
  { tex: /\\minusfdots/, unicode: '\u2A2B' },
  { tex: /\\minusrdots/, unicode: '\u2A2C' },
  { tex: /\\mkern1mu/, unicode: '\u200A' },
  { tex: /\\:|\\mkern4mu/, unicode: '\u205F' },
  { tex: /\\modtwosum/, unicode: '\u2A0A' },
  { tex: /\\multimapboth/, unicode: '\u29DF' },
  { tex: /\\multimapinv/, unicode: '\u27DC' },
  { tex: /\\multimap/, unicode: '\u22B8' },
  { tex: /\\natural/, unicode: '\u266E' },
  { tex: /\\nearrow/, unicode: '\u2197' },
  { tex: /\\Nearrow/, unicode: '\u21D7' },
  { tex: /\\neovnwarrow/, unicode: '\u2931' },
  { tex: /\\neovsearrow/, unicode: '\u292E' },
  { tex: /\\neptune/, unicode: '\u2646' },
  { tex: /\\NestedGreaterGreater/, unicode: '\u2AA2' },
  { tex: /\\NestedLessLess/, unicode: '\u2AA1' },
  { tex: /\\neswarrow/, unicode: '\u2922' },
  { tex: /\\nexists/, unicode: '\u2204' },
  { tex: /\\nHdownarrow/, unicode: '\u21DF' },
  { tex: /\\nHuparrow/, unicode: '\u21DE' },
  { tex: /\\nhVvert/, unicode: '\u2AF5' },
  { tex: /\\nleftarrow/, unicode: '\u219A' },
  { tex: /\\nLeftarrow/, unicode: '\u21CD' },
  { tex: /\\nleftrightarrow/, unicode: '\u21AE' },
  { tex: /\\nLeftrightarrow/, unicode: '\u21CE' },
  { tex: /\\nolinebreak/, unicode: '\u2060' },
  { tex: /\\not\\approx/, unicode: '\u2249' },
  { tex: /\\notbackslash/, unicode: '\u2340' },
  { tex: /\\not\\cong/, unicode: '\u2247' },
  { tex: /\\not\\equiv/, unicode: '\u2262' },
  { tex: /\\not\\geq/, unicode: '\u2271' },
  { tex: /\\notgreaterless/, unicode: '\u2279' },
  { tex: /\\not\\in/, unicode: '\u2209' },
  { tex: /\\not\\kern-0\.3em\\times/, unicode: '\u226D' },
  { tex: /\\not\\leq/, unicode: '\u2270' },
  { tex: /\\notlessgreater/, unicode: '\u2278' },
  { tex: /\\not\\ni/, unicode: '\u220C' },
  { tex: /\\not\\prec/, unicode: '\u2280' },
  { tex: /\\not\\simeq/, unicode: '\u2244' },
  { tex: /\\not\\sim/, unicode: '\u2241' },
  { tex: /\\notslash/, unicode: '\u233F' },
  { tex: /\\not\\sqsubseteq/, unicode: '\u22E2' },
  { tex: /\\not\\sqsupseteq/, unicode: '\u22E3' },
  { tex: /\\not\\subseteq/, unicode: '\u2288' },
  { tex: /\\not\\subset/, unicode: '\u2284' },
  { tex: /\\not\\succ/, unicode: '\u2281' },
  { tex: /\\not\\supseteq/, unicode: '\u2289' },
  { tex: /\\not\\supset/, unicode: '\u2285' },
  { tex: /\\not =/, unicode: '\u2260' },
  { tex: /\\nparallel/, unicode: '\u2226' },
  { tex: /\\npolint/, unicode: '\u2A14' },
  { tex: /\\npreceq/, unicode: '\u22E0' },
  { tex: /\\nrightarrow/, unicode: '\u219B' },
  { tex: /\\nRightarrow/, unicode: '\u21CF' },
  { tex: /\\nsucceq/, unicode: '\u22E1' },
  { tex: /\\ntrianglelefteq/, unicode: '\u22EC' },
  { tex: /\\ntriangleleft/, unicode: '\u22EA' },
  { tex: /\\ntrianglerighteq/, unicode: '\u22ED' },
  { tex: /\\ntriangleright/, unicode: '\u22EB' },
  { tex: /\\nvdash/, unicode: '\u22AC' },
  { tex: /\\nvDash/, unicode: '\u22AD' },
  { tex: /\\nVdash/, unicode: '\u22AE' },
  { tex: /\\nVDash/, unicode: '\u22AF' },
  { tex: /\\nvinfty/, unicode: '\u29DE' },
  { tex: /\\nvleftarrowtail/, unicode: '\u2B39' },
  { tex: /\\nVleftarrowtail/, unicode: '\u2B3A' },
  { tex: /\\nvleftarrow/, unicode: '\u21F7' },
  { tex: /\\nVleftarrow/, unicode: '\u21FA' },
  { tex: /\\nvLeftarrow/, unicode: '\u2902' },
  { tex: /\\nvleftrightarrow/, unicode: '\u21F9' },
  { tex: /\\nVleftrightarrow/, unicode: '\u21FC' },
  { tex: /\\nvLeftrightarrow/, unicode: '\u2904' },
  { tex: /\\nvRightarrow/, unicode: '\u2903' },
  { tex: /\\nvtwoheadleftarrowtail/, unicode: '\u2B3C' },
  { tex: /\\nVtwoheadleftarrowtail/, unicode: '\u2B3D' },
  { tex: /\\nvtwoheadleftarrow/, unicode: '\u2B34' },
  { tex: /\\nVtwoheadleftarrow/, unicode: '\u2B35' },
  { tex: /\\nvtwoheadrightarrowtail/, unicode: '\u2917' },
  { tex: /\\nVtwoheadrightarrowtail/, unicode: '\u2918' },
  { tex: /\\nVtwoheadrightarrow/, unicode: '\u2901' },
  { tex: /\\nwarrow/, unicode: '\u2196' },
  { tex: /\\Nwarrow/, unicode: '\u21D6' },
  { tex: /\\nwovnearrow/, unicode: '\u2932' },
  { tex: /\\nwsearrow/, unicode: '\u2921' },
  { tex: /\\obrbrak/, unicode: '\u23E0' },
  { tex: /\\ocommatopright/, unicode: '\u0315' },
  { tex: /\\odotslashdot/, unicode: '\u29BC' },
  { tex: /\\olcross/, unicode: '\u29BB' },
  { tex: /\\ominus/, unicode: '\u2296' },
  { tex: /\{\\'\{\}O\}|\\'\{\}O/, unicode: '\u038C' },
  { tex: /\\openbracketleft/, unicode: '\u301A' },
  { tex: /\\openbracketright/, unicode: '\u301B' },
  { tex: /\\original/, unicode: '\u22B6' },
  { tex: /\\oslash/, unicode: '\u2298' },
  { tex: /\\otimeshat/, unicode: '\u2A36' },
  { tex: /\\otimes/, unicode: '\u2297' },
  { tex: /\\Otimes/, unicode: '\u2A37' },
  { tex: /\\oturnedcomma/, unicode: '\u0312' },
  { tex: /\\overbrace/, unicode: '\u23DE' },
  { tex: /\\overbracket/, unicode: '\u23B4' },
  { tex: /\\overleftrightarrow/, unicode: '\u20E1' },
  { tex: /\\overline/, unicode: '\u0305' },
  { tex: /\\overparen/, unicode: '\u23DC' },
  { tex: /\\ovhook/, unicode: '\u0309' },
  { tex: /\\parallelogramblack/, unicode: '\u25B0' },
  { tex: /\\parallel/, unicode: '\u2225' },
  { tex: /\\parsim/, unicode: '\u2AF3' },
  { tex: /\\partialmeetcontraction/, unicode: '\u2AA3' },
  { tex: /\\partial/, unicode: '\u2202' },
  { tex: /\\pentagonblack/, unicode: '\u2B1F' },
  { tex: /\\pentagon/, unicode: '\u2B20' },
  { tex: /\\perspcorrespond/, unicode: '\u2306' },
  { tex: /\\Pi|\\P\{i\}/, unicode: '\u03A0' },
  { tex: /\\Pisymbol\{ppi020\}\{105\}/, unicode: '\u2A9E' },
  { tex: /\\Pisymbol\{ppi020\}\{117\}/, unicode: '\u2A9D' },
  { tex: /\\Pisymbol\{ppi022\}\{87\}/, unicode: '\u03D0' },
  { tex: /\\pitchfork/, unicode: '\u22D4' },
  { tex: /\\Planckconst/, unicode: '\u210E' },
  { tex: /\\pluseqq/, unicode: '\u2A72' },
  { tex: /\\plushat/, unicode: '\u2A23' },
  { tex: /\\plussim/, unicode: '\u2A26' },
  { tex: /\\plussubtwo/, unicode: '\u2A27' },
  { tex: /\\plustrif/, unicode: '\u2A28' },
  { tex: /\\pointint/, unicode: '\u2A15' },
  { tex: /\\postalmark/, unicode: '\u3012' },
  { tex: /\\precapprox/, unicode: '\u227E' },
  { tex: /\\preccurlyeq/, unicode: '\u227C' },
  { tex: /\\precedesnotsimilar/, unicode: '\u22E8' },
  { tex: /\\preceqq/, unicode: '\u2AB3' },
  { tex: /\\preceq/, unicode: '\u2AAF' },
  { tex: /\\precnapprox/, unicode: '\u2AB9' },
  { tex: /\\precneqq/, unicode: '\u2AB5' },
  { tex: /\\precneq/, unicode: '\u2AB1' },
  { tex: /\\profline/, unicode: '\u2312' },
  { tex: /\\profsurf/, unicode: '\u2313' },
  { tex: /\\PropertyLine/, unicode: '\u214A' },
  { tex: /\\propto/, unicode: '\u221D' },
  { tex: /\\prurel/, unicode: '\u22B0' },
  { tex: /\\pullback/, unicode: '\u27D3' },
  { tex: /\\pushout/, unicode: '\u27D4' },
  { tex: /\\quarternote/, unicode: '\u2669' },
  { tex: /\\Question/, unicode: '\u2047' },
  { tex: /\\radiation/, unicode: '\u2622' },
  { tex: /\\rangledot/, unicode: '\u2992' },
  { tex: /\\rangledownzigzagarrow/, unicode: '\u237C' },
  { tex: /\\rblkbrbrak/, unicode: '\u2998' },
  { tex: /\\rbracelend/, unicode: '\u23AD' },
  { tex: /\\rbracemid/, unicode: '\u23AC' },
  { tex: /\\rbraceuend/, unicode: '\u23AB' },
  { tex: /\\rbrace/, unicode: '\\}' },
  { tex: /\\rBrace/, unicode: '\u2984' },
  { tex: /\\rbrackextender/, unicode: '\u23A5' },
  { tex: /\\rbracklend/, unicode: '\u23A6' },
  { tex: /\\rbracklrtick/, unicode: '\u298E' },
  { tex: /\\rbrackubar/, unicode: '\u298C' },
  { tex: /\\rbrackuend/, unicode: '\u23A4' },
  { tex: /\\rbrackurtick/, unicode: '\u2990' },
  { tex: /\\rbrbrak/, unicode: '\u2773' },
  { tex: /\\Rbrbrak/, unicode: '\u27ED' },
  { tex: /\\rcurvyangle/, unicode: '\u29FD' },
  { tex: /\\rdiagovfdiag/, unicode: '\u292B' },
  { tex: /\\rdiagovsearrow/, unicode: '\u2930' },
  { tex: /\\recorder/, unicode: '\u2315' },
  { tex: /\\recycle/, unicode: '\u267B' },
  { tex: /\\revangleubar/, unicode: '\u29A5' },
  { tex: /\\revangle/, unicode: '\u29A3' },
  { tex: /\\revemptyset/, unicode: '\u29B0' },
  { tex: /\\ReverseUpEquilibrium/, unicode: '\u296F' },
  { tex: /\\revnmid/, unicode: '\u2AEE' },
  { tex: /\\rfbowtie/, unicode: '\u29D2' },
  { tex: /\\rftimes/, unicode: '\u29D5' },
  { tex: /\\rgroup/, unicode: '\u27EF' },
  { tex: /\\rightanglearc/, unicode: '\u22BE' },
  { tex: /\\rightanglemdot/, unicode: '\u299D' },
  { tex: /\\rightangle/, unicode: '\u221F' },
  { tex: /\\rightarrowapprox/, unicode: '\u2975' },
  { tex: /\\rightarrowbackapprox/, unicode: '\u2B48' },
  { tex: /\\RightArrowBar/, unicode: '\u21E5' },
  { tex: /\\rightarrowbsimilar/, unicode: '\u2B4C' },
  { tex: /\\rightarrowdiamond/, unicode: '\u291E' },
  { tex: /\\rightarrowgtr/, unicode: '\u2B43' },
  { tex: /\\rightarrowonoplus/, unicode: '\u27F4' },
  { tex: /\\rightarrowplus/, unicode: '\u2945' },
  { tex: /\\rightarrowsimilar/, unicode: '\u2974' },
  { tex: /\\rightarrowsupset/, unicode: '\u2B44' },
  { tex: /\\rightarrowtail/, unicode: '\u21A3' },
  { tex: /\\rightarrowtriangle/, unicode: '\u21FE' },
  { tex: /\\rightarrow/, unicode: '\u2192' },
  { tex: /\\Rightarrow/, unicode: '\u21D2' },
  { tex: /\\rightbarharpoon/, unicode: '\u296C' },
  { tex: /\\rightbkarrow/, unicode: '\u290D' },
  { tex: /\\rightdbltail/, unicode: '\u291C' },
  { tex: /\\rightdotarrow/, unicode: '\u2911' },
  { tex: /\\RightDownTeeVector/, unicode: '\u295D' },
  { tex: /\\RightDownVectorBar/, unicode: '\u2955' },
  { tex: /\\rightharpoondown/, unicode: '\u21C1' },
  { tex: /\\rightharpoonup/, unicode: '\u21C0' },
  { tex: /\\rightleftarrows/, unicode: '\u21C4' },
  { tex: /\\rightleftharpoonsdown/, unicode: '\u2969' },
  { tex: /\\rightleftharpoons/, unicode: '\u21CC' },
  { tex: /\\rightleftharpoonsup/, unicode: '\u2968' },
  { tex: /\\rightleftharpoon/, unicode: '\u294B' },
  { tex: /\\rightmoon/, unicode: '\u263D' },
  { tex: /\\rightouterjoin/, unicode: '\u27D6' },
  { tex: /\\rightpentagonblack/, unicode: '\u2B53' },
  { tex: /\\rightpentagon/, unicode: '\u2B54' },
  { tex: /\\rightrightarrows/, unicode: '\u21C9' },
  { tex: /\\rightrightharpoons/, unicode: '\u2964' },
  { tex: /\\rightslice/, unicode: '\u2AA7' },
  { tex: /\\rightsquigarrow/, unicode: '\u21DD' },
  { tex: /\\righttail/, unicode: '\u291A' },
  { tex: /\\RightTeeVector/, unicode: '\u295B' },
  { tex: /\\rightthreearrows/, unicode: '\u21F6' },
  { tex: /\\rightthreetimes/, unicode: '\u22CC' },
  { tex: /\\RightTriangleBar/, unicode: '\u29D0' },
  { tex: /\\RightUpDownVector/, unicode: '\u294F' },
  { tex: /\\RightUpTeeVector/, unicode: '\u295C' },
  { tex: /\\RightUpVectorBar/, unicode: '\u2954' },
  { tex: /\\RightVectorBar/, unicode: '\u2953' },
  { tex: /\\rightwhitearrow/, unicode: '\u21E8' },
  { tex: /\\ringplus/, unicode: '\u2A22' },
  { tex: /\\risingdotseq/, unicode: '\u2253' },
  { tex: /\\rmoustache/, unicode: '\u23B1' },
  { tex: /\\RoundImplies/, unicode: '\u2970' },
  { tex: /\\rparenextender/, unicode: '\u239F' },
  { tex: /\\rparenlend/, unicode: '\u23A0' },
  { tex: /\\Rparenless/, unicode: '\u2996' },
  { tex: /\\rparenuend/, unicode: '\u239E' },
  { tex: /\\rppolint/, unicode: '\u2A12' },
  { tex: /\\rrbracket/, unicode: '\u27E7' },
  { tex: /\\Rrightarrow/, unicode: '\u21DB' },
  { tex: /\\RRightarrow/, unicode: '\u2B46' },
  { tex: /\\rsolbar/, unicode: '\u29F7' },
  { tex: /\\rsqhook/, unicode: '\u2ACE' },
  { tex: /\\rtriltri/, unicode: '\u29CE' },
  { tex: /\\rule\{1em\}\{1pt\}/, unicode: '\u2015' },
  { tex: /\\RuleDelayed/, unicode: '\u29F4' },
  { tex: /\\rvboxline/, unicode: '\u23B9' },
  { tex: /\\rvzigzag/, unicode: '\u29D9' },
  { tex: /\\Rvzigzag/, unicode: '\u29DB' },
  { tex: /\\sagittarius/, unicode: '\u2650' },
  { tex: /\\sansLmirrored/, unicode: '\u2143' },
  { tex: /\\sansLturned/, unicode: '\u2142' },
  { tex: /\\scorpio/, unicode: '\u264F' },
  { tex: /\\scpolint/, unicode: '\u2A13' },
  { tex: /\\scurel/, unicode: '\u22B1' },
  { tex: /\\searrow/, unicode: '\u2198' },
  { tex: /\\Searrow/, unicode: '\u21D8' },
  { tex: /\\seovnearrow/, unicode: '\u292D' },
  { tex: /\\setminus/, unicode: '\u2216' },
  { tex: /\\shortdowntack/, unicode: '\u2ADF' },
  { tex: /\\shortlefttack/, unicode: '\u2ADE' },
  { tex: /\\shortuptack/, unicode: '\u2AE0' },
  { tex: /\\shuffle/, unicode: '\u29E2' },
  { tex: /\\similarleftarrow/, unicode: '\u2B49' },
  { tex: /\\similarrightarrow/, unicode: '\u2972' },
  { tex: /\\sim\\joinrel\\leadsto/, unicode: '\u27FF' },
  { tex: /\\simminussim/, unicode: '\u2A6C' },
  { tex: /\\simplus/, unicode: '\u2A24' },
  { tex: /\\simrdots/, unicode: '\u2A6B' },
  { tex: /\\sixteenthnote/, unicode: '\u266C' },
  { tex: /\\smallin/, unicode: '\u220A' },
  { tex: /\\smallni/, unicode: '\u220D' },
  { tex: /\\smashtimes/, unicode: '\u2A33' },
  { tex: /\\smblkdiamond/, unicode: '\u2B29' },
  { tex: /\\smblklozenge/, unicode: '\u2B2A' },
  { tex: /\\smeparsl/, unicode: '\u29E4' },
  { tex: /\\smwhitestar/, unicode: '\u2B52' },
  { tex: /\\smwhtcircle/, unicode: '\u25E6' },
  { tex: /\\smwhtlozenge/, unicode: '\u2B2B' },
  { tex: /\\smwhtsquare/, unicode: '\u25AB' },
  { tex: /\\sphericalangle/, unicode: '\u2222' },
  { tex: /\\sphericalangleup/, unicode: '\u29A1' },
  { tex: /\\sqrint/, unicode: '\u2A16' },
  { tex: /\\sqrt\[3\]/, unicode: '\u221B' },
  { tex: /\\sqrt\[4\]/, unicode: '\u221C' },
  { tex: /\\sqrtbottom/, unicode: '\u23B7' },
  { tex: /\\sqsubseteq/, unicode: '\u2291' },
  { tex: /\\sqsubsetneq/, unicode: '\u22E4' },
  { tex: /\\sqsubset/, unicode: '\u228F' },
  { tex: /\\sqsupseteq/, unicode: '\u2292' },
  { tex: /\\sqsupset/, unicode: '\u2290' },
  { tex: /\\squarebotblack/, unicode: '\u2B13' },
  { tex: /\\squarecrossfill/, unicode: '\u25A9' },
  { tex: /\\squarehfill/, unicode: '\u25A4' },
  { tex: /\\squarehvfill/, unicode: '\u25A6' },
  { tex: /\\squarellblack/, unicode: '\u2B15' },
  { tex: /\\squarellquad/, unicode: '\u25F1' },
  { tex: /\\squarelrquad/, unicode: '\u25F2' },
  { tex: /\\squareneswfill/, unicode: '\u25A8' },
  { tex: /\\squarenwsefill/, unicode: '\u25A7' },
  { tex: /\\squaretopblack/, unicode: '\u2B12' },
  { tex: /\\squareulblack/, unicode: '\u25E9' },
  { tex: /\\squareulquad/, unicode: '\u25F0' },
  { tex: /\\squareurblack/, unicode: '\u2B14' },
  { tex: /\\squareurquad/, unicode: '\u25F3' },
  { tex: /\\squarevfill/, unicode: '\u25A5' },
  { tex: /\\squoval/, unicode: '\u25A2' },
  { tex: /\\stackrel\{\*\}\{=\}/, unicode: '\u2A6E' },
  { tex: /\\starequal/, unicode: '\u225B' },
  { tex: /\\steaming/, unicode: '\u2615' },
  { tex: /\\Stigma/, unicode: '\u03DA' },
  { tex: /\\stigma/, unicode: '\u03DB' },
  { tex: /\\subedot/, unicode: '\u2AC3' },
  { tex: /\\submult/, unicode: '\u2AC1' },
  { tex: /\\subrarr/, unicode: '\u2979' },
  { tex: /\\subsetapprox/, unicode: '\u2AC9' },
  { tex: /\\subsetcirc/, unicode: '\u27C3' },
  { tex: /\\subsetdot/, unicode: '\u2ABD' },
  { tex: /\\subseteqq/, unicode: '\u2AC5' },
  { tex: /\\subseteq/, unicode: '\u2286' },
  { tex: /\\subsetneqq/, unicode: '\u2ACB' },
  { tex: /\\subsetneq/, unicode: '\u228A' },
  { tex: /\\subsetplus/, unicode: '\u2ABF' },
  { tex: /\\subset/, unicode: '\u2282' },
  { tex: /\\subsim/, unicode: '\u2AC7' },
  { tex: /\\subsub/, unicode: '\u2AD5' },
  { tex: /\\subsup/, unicode: '\u2AD3' },
  { tex: /\\succapprox/, unicode: '\u227F' },
  { tex: /\\succcurlyeq/, unicode: '\u227D' },
  { tex: /\\succeqq/, unicode: '\u2AB4' },
  { tex: /\\succeq/, unicode: '\u2AB0' },
  { tex: /\\succnapprox/, unicode: '\u2ABA' },
  { tex: /\\succneqq/, unicode: '\u2AB6' },
  { tex: /\\succneq/, unicode: '\u2AB2' },
  { tex: /\\succnsim/, unicode: '\u22E9' },
  { tex: /\\sumbottom/, unicode: '\u23B3' },
  { tex: /\\sumint/, unicode: '\u2A0B' },
  { tex: /\\supdsub/, unicode: '\u2AD8' },
  { tex: /\\supedot/, unicode: '\u2AC4' },
  { tex: /\\suphsol/, unicode: '\u27C9' },
  { tex: /\\suphsub/, unicode: '\u2AD7' },
  { tex: /\\suplarr/, unicode: '\u297B' },
  { tex: /\\supmult/, unicode: '\u2AC2' },
  { tex: /\\supsetapprox/, unicode: '\u2ACA' },
  { tex: /\\supsetcirc/, unicode: '\u27C4' },
  { tex: /\\supsetdot/, unicode: '\u2ABE' },
  { tex: /\\supseteqq/, unicode: '\u2AC6' },
  { tex: /\\supseteq/, unicode: '\u2287' },
  { tex: /\\supsetneqq/, unicode: '\u2ACC' },
  { tex: /\\supsetneq/, unicode: '\u228B' },
  { tex: /\\supsetplus/, unicode: '\u2AC0' },
  { tex: /\\supset/, unicode: '\u2283' },
  { tex: /\\supsim/, unicode: '\u2AC8' },
  { tex: /\\supsub/, unicode: '\u2AD4' },
  { tex: /\\supsup/, unicode: '\u2AD6' },
  { tex: /\\surfintegral/, unicode: '\u222F' },
  { tex: /\\swarrow/, unicode: '\u2199' },
  { tex: /\\Swarrow/, unicode: '\u21D9' },
  { tex: /\\talloblong/, unicode: '\u2AFE' },
  { tex: /\\textasciiacute/, unicode: '\xB4' },
  { tex: /\\textasciibreve/, unicode: '\u02D8' },
  { tex: /\\textasciicaron/, unicode: '\u02C7' },
  { tex: /\\textasciidieresis/, unicode: '\xA8' },
  { tex: /\\textasciigrave/, unicode: '`' },
  { tex: /\\textasciimacron/, unicode: '\xAF' },
  { tex: /\\textbrokenbar/, unicode: '\xA6' },
  { tex: /\\textbullet/, unicode: '\u2022' },
  { tex: /\\textcent/, unicode: '\xA2' },
  { tex: /\\textcopyright/, unicode: '\xA9' },
  { tex: /\\textcurrency/, unicode: '\xA4' },
  { tex: /\\textdaggerdbl/, unicode: '\u2021' },
  { tex: /\\textdagger/, unicode: '\u2020' },
  { tex: /\\textdollar/, unicode: '\\$' },
  { tex: /\\textdoublepipe/, unicode: '\u01C2' },
  { tex: /\\textemdash/, unicode: '\u2014' },
  { tex: /\\textendash/, unicode: '\u2013' },
  { tex: /\\textexclamdown/, unicode: '\xA1' },
  { tex: /\\textfrac\{1\}\{3\}/, unicode: '\u2153' },
  { tex: /\\textfrac\{1\}\{5\}/, unicode: '\u2155' },
  { tex: /\\textfrac\{1\}\{6\}/, unicode: '\u2159' },
  { tex: /\\textfrac\{1\}\{8\}/, unicode: '\u215B' },
  { tex: /\\textfrac\{2\}\{3\}/, unicode: '\u2154' },
  { tex: /\\textfrac\{2\}\{5\}/, unicode: '\u2156' },
  { tex: /\\textfrac\{3\}\{5\}/, unicode: '\u2157' },
  { tex: /\\textfrac\{3\}\{8\}/, unicode: '\u215C' },
  { tex: /\\textfrac\{4\}\{5\}/, unicode: '\u2158' },
  { tex: /\\textfrac\{5\}\{6\}/, unicode: '\u215A' },
  { tex: /\\textfrac\{5\}\{8\}/, unicode: '\u215D' },
  { tex: /\\textfrac\{7\}\{8\}/, unicode: '\u215E' },
  { tex: /\\texthvlig/, unicode: '\u0195' },
  { tex: /\\textmu/, unicode: '\u03BC' },
  { tex: /\\textnrleg/, unicode: '\u019E' },
  { tex: /\\textonehalf/, unicode: '\xBD' },
  { tex: /\\textonequarter/, unicode: '\xBC' },
  { tex: /\\textordfeminine/, unicode: '\xAA' },
  { tex: /\\textordmasculine/, unicode: '\xBA' },
  { tex: /\\textparagraph/, unicode: '\xB6' },
  { tex: /\\textperiodcentered/, unicode: '\u02D9' },
  { tex: /\\textpertenthousand/, unicode: '\u2031' },
  { tex: /\\textperthousand/, unicode: '\u2030' },
  { tex: /\\textphi/, unicode: '\u0278' },
  { tex: /\\textquestiondown/, unicode: '\xBF' },
  { tex: /\\textquotedblleft/, unicode: '\u201C' },
  { tex: /\\textquotedblright/, unicode: '\u201D' },
  { tex: /\\textquotesingle/, unicode: '\'' },
  { tex: /\\textregistered/, unicode: '\xAE' },
  { tex: /\\textsection/, unicode: '\xA7' },
  { tex: /\\textsterling/, unicode: '\xA3' },
  { tex: /\\texttheta/, unicode: '\u03B8' },
  { tex: /\\textTheta/, unicode: '\u03F4' },
  { tex: /\\textthreequarters/, unicode: '\xBE' },
  { tex: /\\texttildelow/, unicode: '\u02DC' },
  { tex: /\\texttimes/, unicode: '\xD7' },
  { tex: /\\texttrademark/, unicode: '\u2122' },
  { tex: /\\textturnk/, unicode: '\u029E' },
  { tex: /\\textvartheta/, unicode: '\u03D1' },
  { tex: /\\textvisiblespace/, unicode: '\u2423' },
  { tex: /\\textyen/, unicode: '\xA5' },
  { tex: /\\therefore/, unicode: '\u2234' },
  { tex: /\\thermod/, unicode: '\u29E7' },
  { tex: /\\threedangle/, unicode: '\u27C0' },
  { tex: /\\threeunderdot/, unicode: '\u20E8' },
  { tex: /\\TH|\\T\{H\}/, unicode: '\xDE' },
  { tex: /\\tieinfty/, unicode: '\u29DD' },
  { tex: /\\tildetrpl/, unicode: '\u224B' },
  { tex: /\\timesbar/, unicode: '\u2A31' },
  { tex: /\\tminus/, unicode: '\u29FF' },
  { tex: /\\tone\{11\}/, unicode: '\u02E9' },
  { tex: /\\tone\{22\}/, unicode: '\u02E8' },
  { tex: /\\tone\{33\}/, unicode: '\u02E7' },
  { tex: /\\tone\{44\}/, unicode: '\u02E6' },
  { tex: /\\tone\{55\}/, unicode: '\u02E5' },
  { tex: /\\topcir/, unicode: '\u2AF1' },
  { tex: /\\topfork/, unicode: '\u2ADA' },
  { tex: /\\topsemicircle/, unicode: '\u25E0' },
  { tex: /\\trapezium/, unicode: '\u23E2' },
  { tex: /\\trianglecdot/, unicode: '\u25EC' },
  { tex: /\\triangledown/, unicode: '\u25BF' },
  { tex: /\\triangleleftblack/, unicode: '\u25ED' },
  { tex: /\\trianglelefteq/, unicode: '\u22B4' },
  { tex: /\\triangleleft/, unicode: '\u25C3' },
  { tex: /\\triangleminus/, unicode: '\u2A3A' },
  { tex: /\\triangleplus/, unicode: '\u2A39' },
  { tex: /\\triangleq/, unicode: '\u225C' },
  { tex: /\\trianglerightblack/, unicode: '\u25EE' },
  { tex: /\\trianglerighteq/, unicode: '\u22B5' },
  { tex: /\\triangleright/, unicode: '\u25B9' },
  { tex: /\\triangleserifs/, unicode: '\u29CD' },
  { tex: /\\triangles/, unicode: '\u29CC' },
  { tex: /\\triangletimes/, unicode: '\u2A3B' },
  { tex: /\\tripleplus/, unicode: '\u29FB' },
  { tex: /\\trslash/, unicode: '\u2AFB' },
  { tex: /\\truestate/, unicode: '\u22A7' },
  { tex: /\\turnangle/, unicode: '\u29A2' },
  { tex: /\\turnednot/, unicode: '\u2319' },
  { tex: /\\twocaps/, unicode: '\u2A4B' },
  { tex: /\\twocups/, unicode: '\u2A4A' },
  { tex: /\\twoheaddownarrow/, unicode: '\u21A1' },
  { tex: /\\twoheadleftarrowtail/, unicode: '\u2B3B' },
  { tex: /\\twoheadleftarrow/, unicode: '\u219E' },
  { tex: /\\twoheadleftdbkarrow/, unicode: '\u2B37' },
  { tex: /\\twoheadmapsfrom/, unicode: '\u2B36' },
  { tex: /\\twoheadrightarrow/, unicode: '\u21A0' },
  { tex: /\\twoheaduparrowcircle/, unicode: '\u2949' },
  { tex: /\\twoheaduparrow/, unicode: '\u219F' },
  { tex: /\\twolowline/, unicode: '\u2017' },
  { tex: /\\twonotes/, unicode: '\u266B' },
  { tex: /\\typecolon/, unicode: '\u2982' },
  { tex: /\\ubrbrak/, unicode: '\u23E1' },
  { tex: /\\ulblacktriangle/, unicode: '\u25E4' },
  { tex: /\\ulcorner/, unicode: '\u231C' },
  { tex: /\\ultriangle/, unicode: '\u25F8' },
  { tex: /\\uminus/, unicode: '\u2A41' },
  { tex: /\\underbar/, unicode: '\u0331' },
  { tex: /\\underbrace/, unicode: '\u23DF' },
  { tex: /\\underbracket/, unicode: '\u23B5' },
  { tex: /\\underleftarrow/, unicode: '\u20EE' },
  { tex: /\\underleftharpoondown/, unicode: '\u20ED' },
  { tex: /\\underline/, unicode: '\u0332' },
  { tex: /\\underparen/, unicode: '\u23DD' },
  { tex: /\\underrightarrow/, unicode: '\u20EF' },
  { tex: /\\underrightharpoondown/, unicode: '\u20EC' },
  { tex: /\{\{\/\}\\!\\!\{\/\}\}/, unicode: '\u2AFD' },
  { tex: /\\uparrowbarred/, unicode: '\u2909' },
  { tex: /\\UpArrowBar/, unicode: '\u2912' },
  { tex: /\\uparrowoncircle/, unicode: '\u29BD' },
  { tex: /\\uparrow/, unicode: '\u2191' },
  { tex: /\\Uparrow/, unicode: '\u21D1' },
  { tex: /\\updasharrow/, unicode: '\u21E1' },
  { tex: /\\updownarrowbar/, unicode: '\u21A8' },
  { tex: /\\updownarrow/, unicode: '\u2195' },
  { tex: /\\Updownarrow/, unicode: '\u21D5' },
  { tex: /\\updownharpoonleftright/, unicode: '\u294D' },
  { tex: /\\updownharpoonrightleft/, unicode: '\u294C' },
  { tex: /\\UpEquilibrium/, unicode: '\u296E' },
  { tex: /\\upfishtail/, unicode: '\u297E' },
  { tex: /\\upharpoonleft/, unicode: '\u21BF' },
  { tex: /\\upharpoonright/, unicode: '\u21BE' },
  { tex: /\\uprightcurvearrow/, unicode: '\u2934' },
  { tex: /\\Upsilon/, unicode: '\u03A5' },
  { tex: /\\upsilon/, unicode: '\u03C5' },
  { tex: /\\upslopeellipsis/, unicode: '\u22F0' },
  { tex: /\\upuparrows/, unicode: '\u21C8' },
  { tex: /\\upupharpoons/, unicode: '\u2963' },
  { tex: /\\upwhitearrow/, unicode: '\u21E7' },
  { tex: /\\urblacktriangle/, unicode: '\u25E5' },
  { tex: /\\urcorner/, unicode: '\u231D' },
  { tex: /\\urtriangle/, unicode: '\u25F9' },
  { tex: /\\utilde/, unicode: '\u0330' },
  { tex: /\\UUparrow/, unicode: '\u27F0' },
  { tex: /\\Uuparrow/, unicode: '\u290A' },
  { tex: /\\varcarriagereturn/, unicode: '\u23CE' },
  { tex: /\\varclubsuit/, unicode: '\u2667' },
  { tex: /\\varepsilon/, unicode: '\u025B' },
  { tex: /\\varhexagonblack/, unicode: '\u2B22' },
  { tex: /\\varhexagonlrbonds/, unicode: '\u232C' },
  { tex: /\\varhexagon/, unicode: '\u2B21' },
  { tex: /\\varisins/, unicode: '\u22F3' },
  { tex: /\\varkappa/, unicode: '\u03F0' },
  { tex: /\\varlrtriangle/, unicode: '\u22BF' },
  { tex: /\\varniobar/, unicode: '\u22FD' },
  { tex: /\\varnothing/, unicode: '\u2205' },
  { tex: /\\varphi/, unicode: '\u03C6' },
  { tex: /\\varprod/, unicode: '\u2A09' },
  { tex: /\\varrho/, unicode: '\u03F1' },
  { tex: /\\varsigma/, unicode: '\u03C2' },
  { tex: /\\varspadesuit/, unicode: '\u2664' },
  { tex: /\\vartriangleleft/, unicode: '\u22B2' },
  { tex: /\\vartriangleright/, unicode: '\u22B3' },
  { tex: /\\vartriangle/, unicode: '\u25B5' },
  { tex: /\\varVdash/, unicode: '\u2AE6' },
  { tex: /\\varveebar/, unicode: '\u2A61' },
  { tex: /\\vbraceextender/, unicode: '\u23AA' },
  { tex: /\\vDdash/, unicode: '\u2AE2' },
  { tex: /\\veebar/, unicode: '\u22BB' },
  { tex: /\\veemidvert/, unicode: '\u2A5B' },
  { tex: /\\veeodot/, unicode: '\u2A52' },
  { tex: /\\veeonwedge/, unicode: '\u2A59' },
  { tex: /\\vertoverlay/, unicode: '\u20D2' },
  { tex: /\\verymuchgreater/, unicode: '\u22D9' },
  { tex: /\\verymuchless/, unicode: '\u22D8' },
  { tex: /\\viewdata/, unicode: '\u2317' },
  { tex: /\\vlongdash/, unicode: '\u27DD' },
  { tex: /\\volintegral/, unicode: '\u2230' },
  { tex: /\\vphantom\\{/, unicode: '' },
  { tex: /\\vrectangleblack/, unicode: '\u25AE' },
  { tex: /\\Vvdash/, unicode: '\u22AA' },
  { tex: /\\vysmblksquare/, unicode: '\u2B1D' },
  { tex: /\\vysmwhtsquare/, unicode: '\u2B1E' },
  { tex: /\\vzigzag/, unicode: '\u299A' },
  { tex: /\\warning/, unicode: '\u26A0' },
  { tex: /\\wasylozenge/, unicode: '\u2311' },
  { tex: /\\wedgedot/, unicode: '\u27D1' },
  { tex: /\\wedgedoublebar/, unicode: '\u2A60' },
  { tex: /\\wedgemidvert/, unicode: '\u2A5A' },
  { tex: /\\wedgeodot/, unicode: '\u2A51' },
  { tex: /\\whitearrowupfrombar/, unicode: '\u21EA' },
  { tex: /\\whiteinwhitetriangle/, unicode: '\u27C1' },
  { tex: /\\whitepointerleft/, unicode: '\u25C5' },
  { tex: /\\whitepointerright/, unicode: '\u25BB' },
  { tex: /\\whitesquaretickleft/, unicode: '\u27E4' },
  { tex: /\\whitesquaretickright/, unicode: '\u27E5' },
  { tex: /\\whthorzoval/, unicode: '\u2B2D' },
  { tex: /\\whtvertoval/, unicode: '\u2B2F' },
  { tex: /\\wideangledown/, unicode: '\u29A6' },
  { tex: /\\wideangleup/, unicode: '\u29A7' },
  { tex: /\\widebridgeabove/, unicode: '\u20E9' },
  { tex: /\\Xi|\\X\{i\}/, unicode: '\u039E' },
  { tex: /\\yinyang/, unicode: '\u262F' },
  { tex: /\\zproject/, unicode: '\u2A21' },

  { tex: /\\circeq/, unicode: '\u2257' },
  { tex: /\\OE|\\O\{E\}/, unicode: '\u0152' },
  { tex: /\\NG|\\N\{G\}/, unicode: '\u014A' },
  { tex: /\\eqcirc/, unicode: '\u2256' },
  { tex: /\\lfloor/, unicode: '\u230A' },
  { tex: /\\rfloor/, unicode: '\u230B' },
  { tex: /\\invneg/, unicode: '\u2310' },
  { tex: /\\niobar/, unicode: '\u22FE' },
  { tex: /\\varnis/, unicode: '\u22FB' },
  { tex: /\\invamp/, unicode: '\u214B' },
  { tex: /\\inttop/, unicode: '\u2320' },
  { tex: /\\isinvb/, unicode: '\u22F8' },
  { tex: /\\langle/, unicode: '\u2329' },
  { tex: /\\rangle/, unicode: '\u232A' },
  { tex: /\\topbot/, unicode: '\u2336' },
  { tex: /\\APLinv/, unicode: '\u2339' },
  { tex: /\\MapsUp/, unicode: '\u21A5' },
  { tex: /\\mapsto/, unicode: '\u21A6' },
  { tex: /\\APLlog/, unicode: '\u235F' },
  { tex: /\\daleth/, unicode: '\u2138' },
  { tex: /\\sumtop/, unicode: '\u23B2' },
  { tex: /\\diagup/, unicode: '\u2571' },
  { tex: /\\square/, unicode: '\u25A1' },
  { tex: /\\hslash/, unicode: '\u210F' },
  { tex: /\\bumpeq/, unicode: '\u224F' },
  { tex: /\\boxbar/, unicode: '\u25EB' },
  { tex: /\\Square/, unicode: '\u2610' },
  { tex: /\\danger/, unicode: '\u2621' },
  { tex: /\\Bumpeq/, unicode: '\u224E' },
  { tex: /\\ddddot/, unicode: '\u20DC' },
  { tex: /\\smiley/, unicode: '\u263A' },
  { tex: /\\eqless/, unicode: '\u22DC' },
  { tex: /\\gtrdot/, unicode: '\u22D7' },
  { tex: /\\Exclam/, unicode: '\u203C' },
  { tex: /\\saturn/, unicode: '\u2644' },
  { tex: /\\uranus/, unicode: '\u2645' },
  { tex: /\\taurus/, unicode: '\u2649' },
  { tex: /\\gemini/, unicode: '\u264A' },
  { tex: /\\cancer/, unicode: '\u264B' },
  { tex: /\\pisces/, unicode: '\u2653' },
  { tex: /\\Supset/, unicode: '\u22D1' },
  { tex: /\\Subset/, unicode: '\u22D0' },
  { tex: /\\diceii/, unicode: '\u2681' },
  { tex: /\\diceiv/, unicode: '\u2683' },
  { tex: /\\dicevi/, unicode: '\u2685' },
  { tex: /\\anchor/, unicode: '\u2693' },
  { tex: /\\swords/, unicode: '\u2694' },
  { tex: /\\DJ|\\D\{J\}/, unicode: '\u0110' },
  { tex: /\\neuter/, unicode: '\u26B2' },
  { tex: /\\veedot/, unicode: '\u27C7' },
  { tex: /\\rtimes/, unicode: '\u22CA' },
  { tex: /\\ltimes/, unicode: '\u22C9' },
  { tex: /\\bowtie/, unicode: '\u22C8' },
  { tex: /\\bigbot/, unicode: '\u27D8' },
  { tex: /\\cirbot/, unicode: '\u27DF' },
  { tex: /\\LaTeX/, unicode: 'L$^A$T$_E$X' },
  { tex: /\\delta/, unicode: '\u03B4' },
  { tex: /\\image/, unicode: '\u22B7' },
  { tex: /\\llarc/, unicode: '\u25DF' },
  { tex: /\\simeq/, unicode: '\u2243' },
  { tex: /\\eqdef/, unicode: '\u225D' },
  { tex: /\\vBarv/, unicode: '\u2AE9' },
  { tex: /\\ElzOr/, unicode: '\u2A54' },
  { tex: /\\equiv/, unicode: '\u2261' },
  { tex: /\\space/, unicode: ' ' },
  { tex: /\\isins/, unicode: '\u22F4' },
  { tex: /\\lnsim/, unicode: '\u22E6' },
  { tex: /\\Elzxl/, unicode: '\u0335' },
  { tex: /\\Theta/, unicode: '\u0398' },
  { tex: /\\barin/, unicode: '\u22F6' },
  { tex: /\\kappa/, unicode: '\u03BA' },
  { tex: /\\lblot/, unicode: '\u2989' },
  { tex: /\\rblot/, unicode: '\u298A' },
  { tex: /\\frown/, unicode: '\u2322' },
  { tex: /\\earth/, unicode: '\u2641' },
  { tex: /\\Angle/, unicode: '\u299C' },
  { tex: /\\Sqcup/, unicode: '\u2A4F' },
  { tex: /\\Sqcap/, unicode: '\u2A4E' },
  { tex: /\\nhpar/, unicode: '\u2AF2' },
  { tex: /\\operp/, unicode: '\u29B9' },
  { tex: /\\sigma/, unicode: '\u03C3' },
  { tex: /\\csube/, unicode: '\u2AD1' },
  { tex: /\\csupe/, unicode: '\u2AD2' },
  { tex: /\\house/, unicode: '\u2302' },
  { tex: /\\forks/, unicode: '\u2ADC' },
  { tex: /\\Elzxh/, unicode: '\u0127' },
  { tex: /\\strns/, unicode: '\u23E4' },
  { tex: /\\eqgtr/, unicode: '\u22DD' },
  { tex: /\\forkv/, unicode: '\u2AD9' },
  { tex: /\\relax/, unicode: '' },
  { tex: /\\amalg/, unicode: '\u2A3F' },
  { tex: /\\infty/, unicode: '\u221E' },
  { tex: /\\VDash/, unicode: '\u22AB' },
  { tex: /\\fltns/, unicode: '\u23E5' },
  { tex: /\\disin/, unicode: '\u22F2' },
  { tex: /\\uplus/, unicode: '\u228E' },
  { tex: /\\angle/, unicode: '\u2220' },
  { tex: /\\pluto/, unicode: '\u2647' },
  { tex: /\\Vdash/, unicode: '\u22A9' },
  { tex: /\\cdots/, unicode: '\u22EF' },
  { tex: /\\lceil/, unicode: '\u2308' },
  { tex: /\\sqcap/, unicode: '\u2293' },
  { tex: /\\smile/, unicode: '\u2323' },
  { tex: /\\omega/, unicode: '\u03C9' },
  { tex: /\\vdots/, unicode: '\u22EE' },
  { tex: /\\arceq/, unicode: '\u2258' },
  { tex: /\\dashv/, unicode: '\u22A3' },
  { tex: /\\vdash/, unicode: '\u22A2' },
  { tex: /\\skull/, unicode: '\u2620' },
  { tex: /\\rceil/, unicode: '\u2309' },
  { tex: /\\virgo/, unicode: '\u264D' },
  { tex: /\\perps/, unicode: '\u2AE1' },
  { tex: /\\zhide/, unicode: '\u29F9' },
  { tex: /\\tplus/, unicode: '\u29FE' },
  { tex: /\\ldots/, unicode: '\u2026' },
  { tex: /\\zpipe/, unicode: '\u2A20' },
  { tex: /\\dicei/, unicode: '\u2680' },
  { tex: /\\venus/, unicode: '\u2640' },
  { tex: /\\varpi/, unicode: '\u03D6' },
  { tex: /\\Elzrh/, unicode: '\u0322' },
  { tex: /\\Qoppa/, unicode: '\u03D8' },
  { tex: /\\aries/, unicode: '\u2648' },
  { tex: /\\upint/, unicode: '\u2A1B' },
  { tex: /\\dddot/, unicode: '\u20DB' },
  { tex: /\\sqcup/, unicode: '\u2294' },
  { tex: /\\qoppa/, unicode: '\u03D9' },
  { tex: /\\Koppa/, unicode: '\u03DE' },
  { tex: /\\awint/, unicode: '\u2A11' },
  { tex: /\\koppa/, unicode: '\u03DF' },
  { tex: /\\Colon/, unicode: '\u2237' },
  { tex: /\\gescc/, unicode: '\u2AA9' },
  { tex: /\\oplus/, unicode: '\u2295' },
  { tex: /\\asymp/, unicode: '\u224D' },
  { tex: /\\isinE/, unicode: '\u22F9' },
  { tex: /\\Elzrl/, unicode: '\u027C' },
  { tex: /\\Sampi/, unicode: '\u03E0' },
  { tex: /\\sampi/, unicode: '\u03E1' },
  { tex: /\\doteq/, unicode: '\u2250' },
  { tex: /\\slash/, unicode: '\u2215' },
  { tex: /\\gnsim/, unicode: '\u22E7' },
  { tex: /\\libra/, unicode: '\u264E' },
  { tex: /\\gsiml/, unicode: '\u2A90' },
  { tex: /\\wedge/, unicode: '\u2227' },
  { tex: /\\dbend/, unicode: '\uFFFD' },
  { tex: /\\dashV/, unicode: '\u2AE3' },
  { tex: /\\Dashv/, unicode: '\u2AE4' },
  { tex: /\\DashV/, unicode: '\u2AE5' },
  { tex: /\\Sigma/, unicode: '\u03A3' },
  { tex: /\\lsimg/, unicode: '\u2A8F' },
  { tex: /\\gsime/, unicode: '\u2A8E' },
  { tex: /\\lsime/, unicode: '\u2A8D' },
  { tex: /\\Equiv/, unicode: '\u2263' },
  { tex: /\\dicev/, unicode: '\u2684' },
  { tex: /\\Gamma/, unicode: '\u0393' },
  { tex: /\\gtcir/, unicode: '\u2A7A' },
  { tex: /\\ltcir/, unicode: '\u2A79' },
  { tex: /\\jmath/, unicode: '\u0237' },
  { tex: /\\ularc/, unicode: '\u25DC' },
  { tex: /\\gneqq/, unicode: '\u2269' },
  { tex: /\\gimel/, unicode: '\u2137' },
  { tex: /\\lneqq/, unicode: '\u2268' },
  { tex: /\\Omega/, unicode: '\u03A9' },
  { tex: /\\Equal/, unicode: '\u2A75' },
  { tex: /\\aleph/, unicode: '\u2135' },
  { tex: /\\nabla/, unicode: '\u2207' },
  { tex: /\\lescc/, unicode: '\u2AA8' },
  { tex: /\\simgE/, unicode: '\u2AA0' },
  { tex: /\\sharp/, unicode: '\u266F' },
  { tex: /\\imath/, unicode: '\uD835\uDEA4' },
  { tex: /\\simlE/, unicode: '\u2A9F' },
  { tex: /\\Delta/, unicode: '\u0394' },
  { tex: /\\urarc/, unicode: '\u25DD' },
  { tex: /\\alpha/, unicode: '\u03B1' },
  { tex: /\\gamma/, unicode: '\u03B3' },
  { tex: /\\eqdot/, unicode: '\u2A66' },
  { tex: /\\Euler/, unicode: '\u2107' },
  { tex: /\\lrarc/, unicode: '\u25DE' },
  { tex: /\\late/, unicode: '\u2AAD' },
  { tex: /\\hash/, unicode: '\u22D5' },
  { tex: /\\circ/, unicode: '\u2218' },
  { tex: /\\Game/, unicode: '\u2141' },
  { tex: /\\surd/, unicode: '\u221A' },
  { tex: /\\Lbag/, unicode: '\u27C5' },
  { tex: /\\beth/, unicode: '\u2136' },
  { tex: /\\lnot/, unicode: '\xAC' },
  { tex: /\\Finv/, unicode: '\u2132' },
  { tex: /\\csub/, unicode: '\u2ACF' },
  { tex: /\\csup/, unicode: '\u2AD0' },
  { tex: /\\succ/, unicode: '\u227B' },
  { tex: /\\prec/, unicode: '\u227A' },
  { tex: /\\Vert/, unicode: '\u2016' },
  { tex: /\\nmid/, unicode: '\u2224' },
  { tex: /\\not</, unicode: '\u226E' },
  { tex: /\\dlsh/, unicode: '\u21B2' },
  { tex: /\\Barv/, unicode: '\u2AE7' },
  { tex: /\\cdot/, unicode: '\xB7' },
  { tex: /\\vBar/, unicode: '\u2AE8' },
  { tex: /\\lang/, unicode: '\u27EA' },
  { tex: /\\rang/, unicode: '\u27EB' },
  { tex: /\\Zbar/, unicode: '\u01B5' },
  { tex: /\\star/, unicode: '\u22C6' },
  { tex: /\\psur/, unicode: '\u2900' },
  { tex: /\\pinj/, unicode: '\u2914' },
  { tex: /\\finj/, unicode: '\u2915' },
  { tex: /\\bNot/, unicode: '\u2AED' },
  { tex: /\\spot/, unicode: '\u2981' },
  { tex: /\\limg/, unicode: '\u2987' },
  { tex: /\\rimg/, unicode: '\u2988' },
  { tex: /\\obot/, unicode: '\u29BA' },
  { tex: /\\cirE/, unicode: '\u29C3' },
  { tex: /\\XBox/, unicode: '\u2612' },
  { tex: /\\perp/, unicode: '\u22A5' },
  { tex: /\\leqq/, unicode: '\u2266' },
  { tex: /\\dsol/, unicode: '\u29F6' },
  { tex: /\\Rbag/, unicode: '\u27C6' },
  { tex: /\\xsol/, unicode: '\u29F8' },
  { tex: /\\odot/, unicode: '\u2299' },
  { tex: /\\flat/, unicode: '\u266D' },
  { tex: /\\LVec/, unicode: '\u20D6' },
  { tex: /\\intx/, unicode: '\u2A18' },
  { tex: /\\lvec/, unicode: '\u20D0' },
  { tex: /\\Join/, unicode: '\u2A1D' },
  { tex: /\\zcmp/, unicode: '\u2A1F' },
  { tex: /\\pfun/, unicode: '\u21F8' },
  { tex: /\\cong/, unicode: '\u2245' },
  { tex: /\\smte/, unicode: '\u2AAC' },
  { tex: /\\ffun/, unicode: '\u21FB' },
  { tex: /\\odiv/, unicode: '\u2A38' },
  { tex: /\\fcmp/, unicode: '\u2A3E' },
  { tex: /\\mlcp/, unicode: '\u2ADB' },
  { tex: /\\ElOr/, unicode: '\u2A56' },
  { tex: /\\dsub/, unicode: '\u2A64' },
  { tex: /\\rsub/, unicode: '\u2A65' },
  { tex: /\\oint/, unicode: '\u222E' },
  { tex: /\\Same/, unicode: '\u2A76' },
  { tex: /\\geqq/, unicode: '\u2267' },
  { tex: /\\prod/, unicode: '\u220F' },
  { tex: /\\lneq/, unicode: '\u2A87' },
  { tex: /\\gneq/, unicode: '\u2A88' },
  { tex: /\\upin/, unicode: '\u27D2' },
  { tex: /\\not>/, unicode: '\u226F' },
  { tex: /_\\ast/, unicode: '\u2217' },
  { tex: /\\iota/, unicode: '\u03B9' },
  { tex: /\\zeta/, unicode: '\u03B6' },
  { tex: /\\beta/, unicode: '\u03B2' },
  { tex: /\\male/, unicode: '\u2642' },
  { tex: /\\nisd/, unicode: '\u22FA' },
  { tex: /\\quad/, unicode: '\u2001' },
  { tex: /\\text/, unicode: '' },
  { tex: /\\glj/, unicode: '\u2AA4' },
  { tex: /\\int/, unicode: '\u222B' },
  { tex: /\\cup/, unicode: '\u222A' },
  { tex: /\\QED/, unicode: '\u220E' },
  { tex: /\\cap/, unicode: '\u2229' },
  { tex: /\\gla/, unicode: '\u2AA5' },
  { tex: /\\Psi/, unicode: '\u03A8' },
  { tex: /\\Phi/, unicode: '\u03A6' },
  { tex: /\\sum/, unicode: '\u2211' },
  { tex: /\\Rsh/, unicode: '\u21B1' },
  { tex: /\\vee/, unicode: '\u2228' },
  { tex: /\\Lsh/, unicode: '\u21B0' },
  { tex: /\\sim/, unicode: '\u223C' },
  { tex: /\\lhd/, unicode: '\u25C1' },
  { tex: /\\LHD/, unicode: '\u25C0' },
  { tex: /\\rhd/, unicode: '\u25B7' },
  { tex: /\\phi/, unicode: '\u03D5' },
  { tex: /\\lgE/, unicode: '\u2A91' },
  { tex: /\\glE/, unicode: '\u2A92' },
  { tex: /\\RHD/, unicode: '\u25B6' },
  { tex: /\\cat/, unicode: '\u2040' },
  { tex: /\\Yup/, unicode: '\u2144' },
  { tex: /\\vec/, unicode: '\u20D1' },
  { tex: /\\div/, unicode: '\xF7' },
  { tex: /\\mid/, unicode: '\u2223' },
  { tex: /\\mho/, unicode: '\u2127' },
  { tex: /\\psi/, unicode: '\u03C8' },
  { tex: /\\chi/, unicode: '\u03C7' },
  { tex: /\\top/, unicode: '\u22A4' },
  { tex: /\\Not/, unicode: '\u2AEC' },
  { tex: /\\tau/, unicode: '\u03C4' },
  { tex: /\\smt/, unicode: '\u2AAA' },
  { tex: /\\rho/, unicode: '\u03C1' },
  { tex: /\\sun/, unicode: '\u263C' },
  { tex: /\\Cap/, unicode: '\u22D2' },
  { tex: /\\lat/, unicode: '\u2AAB' },
  { tex: /\\leo/, unicode: '\u264C' },
  { tex: /\\Sun/, unicode: '\u2609' },
  { tex: /\\Cup/, unicode: '\u22D3' },
  { tex: /\\eta/, unicode: '\u03B7' },
  { tex: /\\Top/, unicode: '\u2AEA' },
  { tex: /\\bij/, unicode: '\u2916' },
  { tex: /\\eth/, unicode: '\u01AA' },
  { tex: /\\geq/, unicode: '\u2265' },
  { tex: /\\nis/, unicode: '\u22FC' },
  { tex: /\\leq/, unicode: '\u2264' },
  { tex: /\\le/, unicode: '\u2264' },
  { tex: /\\ll/, unicode: '\u226A' },
  { tex: /\\dj/, unicode: '\u0111' },
  { tex: /\\in/, unicode: '\u2208' },
  { tex: /\\-/, unicode: '\xAD' },
  { tex: /\\th/, unicode: '\xFE' },
  { tex: /\\wp/, unicode: '\u2118' },
  { tex: /\\aa/, unicode: '\xE5' },
  { tex: /\\ss/, unicode: '\xDF' },
  { tex: /\\ae/, unicode: '\xE6' },
  { tex: /\\ng/, unicode: '\u014B' },
  { tex: /\\mu/, unicode: '\u03BC' },
  { tex: /''''/, unicode: '\u2057' },
  { tex: /\\pi/, unicode: '\u03C0' },
  { tex: /\\gg/, unicode: '\u226B' },
  { tex: /\\xi/, unicode: '\u03BE' },
  { tex: /\\ni/, unicode: '\u220B' },
  { tex: /\\nu/, unicode: '\u03BD' },
  { tex: /\\pm/, unicode: '\xB1' },
  { tex: /\\mp/, unicode: '\u2213' },
  { tex: /\\wr/, unicode: '\u2240' },
  { tex: /\\\./, unicode: '\u0307' },
  { tex: /\\dh/, unicode: '\xF0' },
  { tex: /\\oe/, unicode: '\u0153' },
  { tex: /\\url/, unicode: '\\XXurl' },
  { tex: /\\u/, unicode: '\u0306' },
  { tex: /\\XXurl/, unicode: '\\url' },
  { tex: /\\L/, unicode: '\u0141' },
  { tex: /\\c/, unicode: '\xB8' },
  { tex: /\\i/, unicode: '\u0131' },
  { tex: /\\k/, unicode: '\u02DB' },
  { tex: /\\H/, unicode: '\u02DD' },
  { tex: /\\"/, unicode: '\u0308' },
  { tex: /\\v/, unicode: '\u030C' },
  { tex: /\\o/, unicode: '\xF8' },
  { tex: /\\`/, unicode: '\u0300' },
  { tex: /\\'/, unicode: '\u0301' },
  { tex: /\\~/, unicode: '\u0303' },
  { tex: /\\r/, unicode: '\u02DA' },
  { tex: /\\O/, unicode: '\xD8' },
  { tex: /\\=/, unicode: '\u0304' },
  { tex: /\\l/, unicode: '\u0142' },
  { tex: /'''/, unicode: '\u2034' },
  { tex: /\\textasciitilde/, unicode: '\\~' },

  { tex: /\\backslash|\\textbackslash/, unicode: '\u0871' }, // handled separately in parser

].map(texChar => {
  const re = texChar.tex.source
  return {
    tex: (/^[a-zA-Z\\]+$/.test(re) ?
      new RegExp(`{(${re})}|${re}\\s|${re}(?=\\W|\\_)`,'g') :
      new RegExp(`{(${re})}|${re}{}|${re}`,'g')),
    unicode: texChar.unicode,
  }
})


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/group-parser.js":
/*!*************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/group-parser.js ***!
  \*************************************************************************/
/*! exports provided: GroupParser */
/*! exports used: GroupParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GroupParser; });
// @flow

/*::
import type {EntryObject, NodeObject, GroupObject} from "../const"

type StringStartTuplet = [string, () => void];

type WarningObject = {
    type: string;
    group_type: string;
}

*/



class GroupParser {

    /*::
    groups: Array<GroupObject>;
    groupType: string;
    warnings: Array<WarningObject>;
    entries: Array<EntryObject>;
    stringStarts: Array<StringStartTuplet>;
    pos: number;
    fileDirectory: string;
    input: string;
    */

    constructor(entries /*: Array<EntryObject> */) {
      this.groups = []
      this.groupType = 'jabref4'
      this.warnings = []
      this.entries = entries
      this.pos = 0
      this.fileDirectory = ''
      this.input = ''
      this.stringStarts = [
          ["jabref-meta: databaseType:bibtex;", () => { this.groupType = 'jabref4' }],
          ["jabref-meta: databaseType:biblatex;", () => { this.groupType = 'jabref4' }],
          ["jabref-meta: groupsversion:3;", () => { this.groupType = 'jabref3' }],
          ["jabref-meta: grouping:", () => this.readGroupInfo('jabref4.1')],
          ["jabref-meta: groupstree:", () => this.readGroupInfo('')], //@retorquere: There seems to be a string missing
          ["jabref-meta: fileDirectory:", () => this.readFileDirectory()]
      ]
    }

    checkString(input /*: string */) {
        this.input = input
        //let searchPos = 0
        this.pos = 0
        this.stringStarts.find(stringStart => {
            let pos = input.indexOf(stringStart[0], this.pos)
            if (pos < 0) {
                return false
            } else {
                this.pos = pos + stringStart[0].length
                stringStart[1]()
                return true
            }
        })
    }

    readGroupInfo(groupType /*: string */) {
        if (groupType) this.groupType = groupType

        switch(this.groupType) {
            case 'jabref3':
                this.readJabref3()
                break
            case 'jabref4':
            case 'jabref4.1':
                this.readJabref4()
                break
            default:
                break
        }
    }

    readFileDirectory() {
        let fileDirectory = '',
            input = this.input ? this.input : '',
            pos = this.pos
        while ((input.length > pos) && (input[pos]) !== ';') {
            fileDirectory += input[pos]
            pos++
        }
        this.fileDirectory = fileDirectory
        this.pos = pos
    }

    readJabref3() {

      /*  The JabRef Groups format is... interesting. To parse it, you must:
          1. Unwrap the lines (just remove the newlines)
          2. Split the lines on ';' (but not on '\;')
          3. Each line is a group which is formatted as follows:
             <level> <type>:<name>\;<intersect>\;<citekey1>\;<citekey2>\;....

          Each level can interact with the level it is nested under; either no interaction (intersect = 0), intersection
          (intersect = 1) or union (intersect = 2).

          There are several group types: root-level (all references are implicitly available on the root level),
          ExplicitGroup (the citation keys are listed in the group line) or query-type groups. I have only implemented
          explicit groups.
      */
        // skip any whitespace after the identifying string */
        while (
            (this.input.length > this.pos) &&
            ('\r\n '.indexOf(this.input[this.pos]) >= 0)
        ) { this.pos++ }
        // simplify parsing by taking the whole comment, throw away newlines, replace the escaped separators with tabs, and
        // then split on the remaining non-escaped separators
        // I use \u2004 to protect \; and \u2005 to protect \\\; (the escaped version of ';') when splitting lines at ;
        let lines = this.input.substring(this.pos).replace(/[\r\n]/g, '').replace(/\\\\\\;/g, '\u2005').replace(/\\;/g, '\u2004').split(';')
        lines = lines.map(line => line.replace(/\u2005/g,';'))
        let levels = { '0': { references: [], groups: [] } }
        for (let line of lines) {
            if (line === '') { continue }
            let match = line.match(/^([0-9])\s+([^:]+):(.*)/)
            if (!match) { return }
            let level = parseInt(match[1])
            let type = match[2]
            let references = match[3]
            references = references ? references.split('\u2004').filter(key => key) : []
            let name = references.shift()
            let intersection = references.shift() // 0 = independent, 1 = intersection, 2 = union

            // ignore root level, has no refs anyway in the comment
            if (level === 0) { continue }

            // remember this group as the current `level` level, so that any following `level + 1` levels can find it
            levels[level] = { name, groups: [], references }
            // and add it to its parent
            levels[level - 1].groups.push(levels[level])

            // treat all groups as explicit
            if (type != 'ExplicitGroup') {
                this.warnings.push({
                    type: 'unsupported_jabref_group',
                    group_type: type
                })
            }

            switch (intersection) {
                case '0':
                // do nothing more
                break
                case '1':
                // intersect with parent. Hardly ever used.
                levels[level].references = levels[level].references.filter(key => levels[level - 1].references.includes(key))
                break
                case '2':
                // union with parent
                levels[level].references = [...new Set([...levels[level].references, ...levels[level - 1].references])]
                break
            }
        }

        this.groups = levels['0'].groups
    }

    clearGroups(groups /*: Array<GroupObject> */) {
        for (const group of groups) {
            group.references = []
            this.clearGroups(group.groups || [])
        }
    }

    readJabref4() {

        this.readJabref3()

        if (this.groupType === 'jabref4.1') {
            this.clearGroups(this.groups)
        }

        // this assumes the JabRef groups always come after the references
        this.entries.forEach(bib => {

            if (!bib.unknown_fields || !bib.unknown_fields.groups || !bib.entry_key) {
                return
            }
            // this assumes ref.unknown_fields.groups is a single text chunk
            let groups = bib.unknown_fields.groups.reduce(
                (string /*: string */, node /*: NodeObject */) => {
                    if (typeof node.text === 'string') {
                        const text /*: string */ = node.text,
                        // undo undescores to marks -- groups content is in verbatim-ish mode
                            sub = (node.marks || []).find(mark => mark.type === 'sub') ? '_' : ''
                        string += sub + text
                    }
                    return string
                },
                ''
            ).trim()
            if (bib.unknown_fields) {
                delete bib.unknown_fields.groups
            }

            if (!groups.length) {
                return
            }

            groups.split(/\s*,\s*/).forEach(groupName => {
                let group = this.find(groupName)
                if (group) {
                    group.references.push(bib.entry_key)
                }
            })
        })
    }

    find (name /*: string */, groups /*: Array<GroupObject> | void */) /*: GroupObject | false */ {
        groups = groups || this.groups
        if (!groups) {
            return false
        }

        for (let i = 0; i < groups.length; i++) {
            if (groups[i].name === name) return groups[i]
            let group = this.find(name, groups[i].groups)
            if (group) return group
        }
        return false
    }
}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/literal-parser.js":
/*!***************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/literal-parser.js ***!
  \***************************************************************************/
/*! exports provided: BibLatexLiteralParser */
/*! exports used: BibLatexLiteralParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexLiteralParser; });
// @flow
const LATEX_COMMANDS = [ // commands that can can contain richtext.
    ['\\textbf{', 'strong'],
    ['\\mkbibbold{', 'strong'],
    ['\\mkbibitalic{', 'em'],
    ['\\mkbibemph{', 'em'],
    ['\\textit{', 'em'],
    ['\\emph{', 'em'],
    ['\\textsc{', 'smallcaps'],
    ['\\enquote{', 'enquote'],
    ['\\mkbibquote{', 'enquote'],
    ['\\textsubscript{', 'sub'],
    ['\\textsuperscript{', 'sup']
]

const LATEX_VERBATIM_COMMANDS = [ // commands that can only contain plaintext.
    ['\\url{', 'url']
]

const LATEX_SPECIAL_CHARS = {
    '&': '&',
    '%': '%',
    '$': '$',
    '#': '#',
    '_': '_',
    '{': '{',
    '}': '}',
    ',': ',',
    '~': '~',
    '^': '^',
    '\'': '\'',
    ';': '\u2004',
    '\\': '\n'
}

/*::

import type {NodeObject, TextNodeObject, MarkObject} from "../const"
*/

class BibLatexLiteralParser {
    /*::
    string: string;
    cpMode: boolean;
    braceLevel: number;
    slen: number;
    si: number;
    json: Array<NodeObject>;
    braceClosings: Array<boolean>;
    currentMarks: Array<MarkObject>;
    inCasePreserve: number | null;
    textNode: TextNodeObject;
    */


    constructor(string /*: string */, cpMode /*: boolean */ = false) {
        this.string = string
        this.cpMode = cpMode // Whether to consider case preservation.
        this.braceLevel = 0
        this.slen = string.length
        this.si = 0 // string index
        this.json = []
        this.braceClosings = []
        this.currentMarks = []
        this.inCasePreserve = null
        this.addNewTextNode()
    }

    // If the last text node has no content, remove it.
    removeIfEmptyTextNode() {
        if (this.textNode.text.length === 0) {
            this.json.pop()
        }
    }

    checkAndAddNewTextNode() {
        if (this.textNode.text.length > 0) {
            // We have text in the last node already,
            // so we need to start a new text node.
            this.addNewTextNode()
        }
    }

    addNewTextNode() {
        const textNode /*: TextNodeObject */ = {type: 'text', text: ''}
        this.json.push(textNode)
        this.textNode = textNode
    }

    stringParser() {
        let variable, sj
        parseString: while (this.si < this.slen) {
            switch(this.string[this.si]) {
                case '\\':
                    for (let command of LATEX_COMMANDS) {
                        if (this.string.substring(this.si, this.si + command[0].length) === command[0]) {
                            this.braceLevel++
                            this.si += command[0].length
                            this.checkAndAddNewTextNode()
                            if (this.cpMode) {
                                // If immediately inside a brace that added case protection, remove case protection. See
                                // http://tex.stackexchange.com/questions/276943/biblatex-how-to-emphasize-but-not-caps-protect
                                if (
                                    this.inCasePreserve===(this.braceLevel-1) &&
                                    this.string[this.si-1] === '{' &&
                                    this.currentMarks[this.currentMarks.length-1].type === 'nocase'
                                ) {
                                    this.currentMarks.pop()
                                    this.inCasePreserve = null
                                } else {
                                    // Of not immediately inside a brace, any styling also
                                    // adds case protection.
                                    this.currentMarks.push({type:'nocase'})
                                    this.inCasePreserve = this.braceLevel
                                }
                            }
                            this.currentMarks.push({type:command[1]})
                            this.textNode.marks = this.currentMarks.slice()
                            this.braceClosings.push(true)
                            continue parseString
                        }
                    }
                    for (let command of LATEX_VERBATIM_COMMANDS) {
                        if (this.string.substring(this.si, this.si + command[0].length) === command[0]) {
                            this.checkAndAddNewTextNode()
                            this.textNode.marks = this.currentMarks.slice()
                            this.textNode.marks.push({type:command[1]})
                            this.si += command[0].length
                            let sj = this.si
                            let internalBraceLevel = 0
                            while (
                                sj < this.slen &&
                                (
                                    this.string[sj] !== '}' ||
                                    internalBraceLevel > 0
                                )
                            ) {
                                switch (this.string[sj]) {
                                    case '{':
                                        internalBraceLevel++
                                        break
                                    case '}':
                                        internalBraceLevel--
                                        break
                                }
                                sj++
                            }
                            this.textNode.text = this.string.substring(this.si,sj)
                            this.addNewTextNode()
                            this.si = sj + 1
                            continue parseString
                        }
                    }
                    if (LATEX_SPECIAL_CHARS[this.string[this.si+1]]) {
                        this.textNode.text += LATEX_SPECIAL_CHARS[this.string[this.si+1]]
                        this.si += 2
                    } else {
                        // We don't know the command and skip it.
                        this.si++
                        while(this.si<this.slen && this.string[this.si].match("[a-zA-Z0-9]")) {
                            this.si++
                        }
                        // If there is a brace at the end of the command,
                        // increase brace level but ignore brace.
                        if (this.string[this.si] === "{") {
                            this.braceLevel++
                            this.braceClosings.push(false)
                            this.si++
                        }
                    }
                    break
                case '_':
                    switch(this.string[this.si+1]) {
                        case '{':
                            this.checkAndAddNewTextNode()
                            this.braceLevel++
                            this.si += 2
                            this.currentMarks.push({type:'sub'})
                            this.textNode.marks = this.currentMarks.slice()
                            this.braceClosings.push(true)
                            break
                        case '\\':
                            // There is a command following directly. Ignore the sub symbol.
                            this.si++
                            break
                        default:
                            // We only add the next character to a sub node.
                            this.checkAndAddNewTextNode()
                            this.textNode.marks = this.currentMarks.slice()
                            this.textNode.marks.push({type:'sub'})
                            this.textNode.text = this.string[this.si+1]
                            this.addNewTextNode()
                            if (this.currentMarks.length) {
                                this.textNode.marks = this.currentMarks.slice()
                            }
                            this.si += 2
                    }
                    break
                case '`':
                    if (this.string[this.si+1] === '`') {
                        this.checkAndAddNewTextNode()
                        this.braceLevel++
                        this.si += 2
                        this.currentMarks.push({type:'enquote'})
                        this.textNode.marks = this.currentMarks.slice()
                        this.braceClosings.push(true)
                    } else {
                        this.textNode.text += this.string[this.si]
                        this.si++
                    }
                    break
                case '\'':
                    if (this.string[this.si+1] === '\'') {
                        this.braceLevel--
                        if (this.braceLevel > -1) {
                            let closeBrace = this.braceClosings.pop()
                            if (closeBrace) {
                                this.checkAndAddNewTextNode()
                                this.currentMarks.pop()
                                if (this.currentMarks.length) {
                                    this.textNode.marks = this.currentMarks.slice()
                                } else {
                                    delete this.textNode.marks
                                }
                            }
                            this.si += 2
                            //continue parseString
                        } else {
                            // A brace was closed before it was opened. Abort and return the original string.
                            return [{type: 'text', text: this.string}]
                        }
                    } else {
                        this.textNode.text += this.string[this.si]
                        this.si++
                    }
                    break
                case '^':
                    switch(this.string[this.si+1]) {
                        case '{':
                            this.checkAndAddNewTextNode()
                            this.braceLevel++
                            this.si += 2
                            this.currentMarks.push({type:'sup'})
                            this.textNode.marks = this.currentMarks.slice()
                            this.braceClosings.push(true)
                            break
                        case '\\':
                            // There is a command following directly. Ignore the sup symbol.
                            this.si++
                            break
                        default:
                            // We only add the next character to a sup node.
                            this.checkAndAddNewTextNode()
                            this.textNode.marks = this.currentMarks.slice()
                            this.textNode.marks.push({type:'sup'})
                            this.textNode.text = this.string[this.si+1]
                            this.addNewTextNode()
                            if (this.currentMarks.length) {
                                this.textNode.marks = this.currentMarks.slice()
                            }
                            this.si += 2
                    }
                    break
                case '{':
                    if (this.string[this.si+1] === '}') {
                        // bracket is closing immediately. Ignore it.
                        this.si += 2
                        continue
                    }
                    this.braceLevel++
                    if (this.inCasePreserve || !this.cpMode) {
                        // If already inside case preservation, do not add a second
                        this.braceClosings.push(false)
                    } else {
                        this.inCasePreserve = this.braceLevel
                        this.checkAndAddNewTextNode()
                        this.currentMarks.push({type:'nocase'})
                        this.textNode.marks = this.currentMarks.slice()
                        this.braceClosings.push(true)
                    }
                    this.si++
                    break
                case '}':
                    this.braceLevel--
                    if (this.braceLevel > -1) {
                        let closeBrace = this.braceClosings.pop()
                        if (closeBrace) {
                            this.checkAndAddNewTextNode()
                            let lastMark = this.currentMarks.pop()
                            if (this.inCasePreserve===(this.braceLevel+1)) {
                                this.inCasePreserve = null
                                // The last tag may have added more tags. The
                                // lowest level will be the case preserving one.
                                while(lastMark.type !== 'nocase' && this.currentMarks.length) {
                                    lastMark = this.currentMarks.pop()
                                }
                            }
                            if (this.currentMarks.length) {
                                this.textNode.marks = this.currentMarks.slice()
                            } else {
                                delete this.textNode.marks
                            }
                        }
                        this.si++
                        //continue parseString
                    } else {
                        // A brace was closed before it was opened. Abort and return the original string.
                        return [{type: 'text', text: this.string}]
                    }
                    break
                case '$':
                    // math env, just remove
                    this.si++
                    break
                case '~':
                    // a non-breakable space
                    this.textNode.text += '\u00A0'
                    this.si++
                    break
                case '\u0870':
                    // An undefined variable.
                    this.removeIfEmptyTextNode()
                    sj = this.si + 1
                    while (sj < this.slen && this.string[sj] !== '\u0870') {
                        sj++
                    }
                    variable = this.string.substring(this.si+1, sj)
                    this.json.push({type:'variable', attrs:{variable}})
                    this.addNewTextNode()
                    this.si = sj + 1
                    break
                case '\u0871':
                    // A backslash
                    this.textNode.text += '\\'
                    this.si++
                    break
                case '\r':
                    this.si++
                    break
                case '\n':
                    if (
                        ['\r','\n'].includes(this.string[this.si+1]) &&
                        this.string[this.si-1] !== '\n'
                    ) {
                        this.textNode.text += '\n\n'
                    } else if (
                        /\S/.test(this.string[this.si-1]) &&
                        /\S/.test(this.string[this.si+1])
                    ) {
                        this.textNode.text += ' '
                    }
                    this.si++
                    break
                default:
                    this.textNode.text += this.string[this.si]
                    this.si++
            }
        }

        if (this.braceLevel > 0) {
            // Too many opening braces, we return the original string.
            return [{type: 'text', text: this.string}]
        }

        this.removeIfEmptyTextNode()

        // Braces were accurate.
        return this.json
    }

    get output() {
        return this.stringParser()
    }
}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/name-parser.js":
/*!************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/name-parser.js ***!
  \************************************************************************/
/*! exports provided: BibLatexNameParser */
/*! exports used: BibLatexNameParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexNameParser; });
/* harmony import */ var _literal_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./literal-parser */ "../node_modules/biblatex-csl-converter/src/import/literal-parser.js");
// @flow


/*::

import type {NodeArray, NameDictObject} from "../const"

*/

class BibLatexNameParser {

    /*::
    nameString: string;
    nameDict: NameDictObject;
    _particle: Array<string>;
    _suffix: Array<string>;
    */

    constructor(nameString /*: string */) {
        this.nameString = nameString.trim()
        this.nameDict = {}
        this._particle = []
        this._suffix = []
    }

    parseName() {
        let parts = this.splitTexString(this.nameString, ',')
        if (parts.length > 1 && this.nameString.includes('=')) {
            // extended name detected.
            this.parseExtendedName(parts)
        } else if (parts.length ===  3) { // von Last, Jr, First
            this.processVonLast(
                this.splitTexString(parts[0].replace(/[{}]/g,'')),
                this.splitTexString(parts[1])
            )
            this.processFirstMiddle(this.splitTexString(parts[2]))
        } else if (parts.length === 2) {  // von Last, First
            this.processVonLast(this.splitTexString(parts[0].replace(/[{}]/g,'')))
            this.processFirstMiddle(this.splitTexString(parts[1]))
        } else if (parts.length === 1) {  // First von Last
            let spacedParts = this.splitTexString(this.nameString)
            if (spacedParts.length === 1) {
                if (
                    this.nameString[0] === '{' &&
                    this.nameString[this.nameString.length-1] === '}' &&
                    this.nameString.includes('=') &&
                    this.nameString.includes(',') &&
                    this.nameString.includes(' ') &&
                    (
                        this.nameString.includes('given') ||
                        this.nameString.includes('family')
                    )
                ) {
                    parts = this.splitTexString(
                        this.nameString.slice(1, this.nameString.length - 1),
                        ','
                    )
                    // extended name detected.
                    this.parseExtendedName(parts)
                } else {
                    let literal = this._reformLiteral(spacedParts[0])
                    if (literal.length) {
                        this.nameDict['literal'] = literal
                    }
                }
            } else {
                let split = this.splitAt(spacedParts)
                let firstMiddle = split[0]
                let vonLast = split[1]
                if (vonLast.length === 0 && firstMiddle.length > 1) {
                    let last = firstMiddle.pop()
                    vonLast.push(last)
                }
                this.processFirstMiddle(firstMiddle)
                this.processVonLast(vonLast)
            }

        } else {
            this.nameDict['literal'] = this._reformLiteral(this.nameString.trim())
        }
    }

    parseExtendedName(parts /*: Array<string> */) {
        parts.forEach( part => {
            let attrParts = part.trim().replace(/^"|"$/g,'').split('=')
            let attrName = attrParts.shift().trim().toLowerCase()
            if (['family', 'given', 'prefix', 'suffix'].includes(attrName)) {
                this.nameDict[attrName] = this._reformLiteral(attrParts.join('=').trim())
            } else if (attrName==='useprefix') {
                if (attrParts.join('').trim().toLowerCase() === 'true') {
                    this.nameDict['useprefix'] = true
                } else {
                    this.nameDict['useprefix'] = false
                }
            }
        })
    }

    get output() {
        this.parseName()
        if (Object.keys(this.nameDict).length) {
            return this.nameDict
        } else {
            return false
        }
    }

    splitTexString(string /*: string */, sep /*: string */='[\\s~]+') {
        let braceLevel = 0
        let inQuotes = false
        let nameStart = 0
        let result = []
        let stringLen = string.length
        let pos = 0
        while (pos < stringLen) {
            let char = string.charAt(pos)
            switch (char) {
                case '{':
                    braceLevel += 1
                    break
                case '}':
                    braceLevel -= 1
                    break
                case '"':
                    inQuotes = !inQuotes
                    break
                case '\\':
                    // skip next
                    pos++
                    break
                default:
                    if (braceLevel === 0 && inQuotes === false && pos > 0) {
                        let match = string.slice(pos).match(RegExp(`^${sep}`))
                        if (match) {
                            let sepLen = match[0].length
                            if (pos + sepLen < stringLen) {
                                result.push(string.slice(nameStart, pos))
                                nameStart = pos + sepLen
                            }
                        }
                    }
            }

            pos++
        }
        if (nameStart < stringLen) {
            result.push(string.slice(nameStart))
        }
        return result
    }

    processFirstMiddle(parts /*: Array<string> */) {
        this.nameDict['given'] = this._reformLiteral(parts.join(' ').trim())
    }

    processVonLast(parts /*: Array<string> */, lineage /*: Array<string> */ =[]) {
        let rSplit = this.rsplitAt(parts)
        let von = rSplit[0]
        let last = rSplit[1]
        if (von && !last) {
            last.push(von.pop())
        }
        if (von.length) {
            this.nameDict['prefix'] = this._reformLiteral(von.join(' ').trim())
            this.nameDict['useprefix'] = true // The info at hand is not clear, so we guess.
        }
        if (lineage.length) {
            this.nameDict['suffix'] = this._reformLiteral(lineage.join(' ').trim())
        }
        this.nameDict['family'] = this._reformLiteral(last.join(' ').trim())
    }

    findFirstLowerCaseWord(lst /*: Array<string> */) {
        // return index of first lowercase word in lst. Else return length of lst.
        for(let i = 0;i<lst.length;i++) {
            let word = lst[i]
            if (word === word.toLowerCase()) {
                return i
            }
        }
        return lst.length
    }

    splitAt(lst /*: Array<string> */) /*: [Array<string>, Array<string>] */ {
        // Split the given list into two parts.
        // The second part starts with the first lowercase word.
        const pos = this.findFirstLowerCaseWord(lst)
        return [lst.slice(0, pos), lst.slice(pos)]
    }

    rsplitAt(lst /*: Array<string> */) /*: [Array<string>, Array<string>] */{
        const rpos = this.findFirstLowerCaseWord(lst.slice().reverse())
        const pos = lst.length - rpos
        return [lst.slice(0, pos), lst.slice(pos)]
    }

    _reformLiteral(litString /*: string */) {
        let parser = new _literal_parser__WEBPACK_IMPORTED_MODULE_0__[/* BibLatexLiteralParser */ "a"](litString)
        return parser.output
    }

}


/***/ }),

/***/ "../node_modules/biblatex-csl-converter/src/import/tools.js":
/*!******************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/tools.js ***!
  \******************************************************************/
/*! exports provided: splitTeXString */
/*! exports used: splitTeXString */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return splitTeXString; });
// @flow
// split at each occurence of splitToken, but only if no braces are currently open.
function splitTeXString(texString /*: string */, splitToken /*: string */ ='and') /*: Array<string> */ {
    let output = []
    let tokenRe = /([^\s{}]+|\s|{|})/g
    let j = 0
    let k = 0
    let item
    while ((item = tokenRe.exec(texString)) !== null) {
        const token = item && item.length ? item[0] : false
        if (token===false) {
            break
        }
        if (k === output.length) {
            output.push('')
        }
        switch (token) {
            case '{':
                j += 1
                output[k] += token
                break
            case '}':
                j -= 1
                output[k] += token
                break
            case splitToken:
                if (0===j) {
                    k++
                } else {
                    output[k] += token
                }
                break
            default:
                output[k] += token
        }
    }
    return output
}


/***/ }),

/***/ "../node_modules/he/he.js":
/*!********************************!*\
  !*** ../node_modules/he/he.js ***!
  \********************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/he v1.2.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports =  true && exports;

	// Detect free variable `module`.
	var freeModule =  true && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	// All astral symbols.
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	// All ASCII symbols (not just printable ASCII) except those listed in the
	// first column of the overrides table.
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
	var regexAsciiWhitelist = /[\x01-\x7F]/g;
	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
	// code points listed in the first column of the overrides table on
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

	var regexEscape = /["&'<>`]/g;
	var escapeMap = {
		'"': '&quot;',
		'&': '&amp;',
		'\'': '&#x27;',
		'<': '&lt;',
		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
		// following is not strictly necessary unless it’s part of a tag or an
		// unquoted attribute value. We’re only escaping it to support those
		// situations, and for XML support.
		'>': '&gt;',
		// In Internet Explorer ≤ 8, the backtick character can be used
		// to break out of (un)quoted attribute values or HTML comments.
		// See http://html5sec.org/#102, http://html5sec.org/#108, and
		// http://html5sec.org/#133.
		'`': '&#x60;'
	};

	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var has = function(object, propertyName) {
		return hasOwnProperty.call(object, propertyName);
	};

	var contains = function(array, value) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			if (array[index] == value) {
				return true;
			}
		}
		return false;
	};

	var merge = function(options, defaults) {
		if (!options) {
			return defaults;
		}
		var result = {};
		var key;
		for (key in defaults) {
			// A `hasOwnProperty` check is not needed here, since only recognized
			// option names are used anyway. Any others are ignored.
			result[key] = has(options, key) ? options[key] : defaults[key];
		}
		return result;
	};

	// Modified version of `ucs2encode`; see https://mths.be/punycode.
	var codePointToSymbol = function(codePoint, strict) {
		var output = '';
		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
			// See issue #4:
			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
			// REPLACEMENT CHARACTER.”
			if (strict) {
				parseError('character reference outside the permissible Unicode range');
			}
			return '\uFFFD';
		}
		if (has(decodeMapNumeric, codePoint)) {
			if (strict) {
				parseError('disallowed character reference');
			}
			return decodeMapNumeric[codePoint];
		}
		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
			parseError('disallowed character reference');
		}
		if (codePoint > 0xFFFF) {
			codePoint -= 0x10000;
			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
			codePoint = 0xDC00 | codePoint & 0x3FF;
		}
		output += stringFromCharCode(codePoint);
		return output;
	};

	var hexEscape = function(codePoint) {
		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
	};

	var decEscape = function(codePoint) {
		return '&#' + codePoint + ';';
	};

	var parseError = function(message) {
		throw Error('Parse error: ' + message);
	};

	/*--------------------------------------------------------------------------*/

	var encode = function(string, options) {
		options = merge(options, encode.options);
		var strict = options.strict;
		if (strict && regexInvalidRawCodePoint.test(string)) {
			parseError('forbidden code point');
		}
		var encodeEverything = options.encodeEverything;
		var useNamedReferences = options.useNamedReferences;
		var allowUnsafeSymbols = options.allowUnsafeSymbols;
		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

		var escapeBmpSymbol = function(symbol) {
			return escapeCodePoint(symbol.charCodeAt(0));
		};

		if (encodeEverything) {
			// Encode ASCII symbols.
			string = string.replace(regexAsciiWhitelist, function(symbol) {
				// Use named references if requested & possible.
				if (useNamedReferences && has(encodeMap, symbol)) {
					return '&' + encodeMap[symbol] + ';';
				}
				return escapeBmpSymbol(symbol);
			});
			// Shorten a few escapes that represent two symbols, of which at least one
			// is within the ASCII range.
			if (useNamedReferences) {
				string = string
					.replace(/&gt;\u20D2/g, '&nvgt;')
					.replace(/&lt;\u20D2/g, '&nvlt;')
					.replace(/&#x66;&#x6A;/g, '&fjlig;');
			}
			// Encode non-ASCII symbols.
			if (useNamedReferences) {
				// Encode non-ASCII symbols that can be replaced with a named reference.
				string = string.replace(regexEncodeNonAscii, function(string) {
					// Note: there is no need to check `has(encodeMap, string)` here.
					return '&' + encodeMap[string] + ';';
				});
			}
			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
		} else if (useNamedReferences) {
			// Apply named character references.
			// Encode `<>"'&` using named character references.
			if (!allowUnsafeSymbols) {
				string = string.replace(regexEscape, function(string) {
					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
				});
			}
			// Shorten escapes that represent two symbols, of which at least one is
			// `<>"'&`.
			string = string
				.replace(/&gt;\u20D2/g, '&nvgt;')
				.replace(/&lt;\u20D2/g, '&nvlt;');
			// Encode non-ASCII symbols that can be replaced with a named reference.
			string = string.replace(regexEncodeNonAscii, function(string) {
				// Note: there is no need to check `has(encodeMap, string)` here.
				return '&' + encodeMap[string] + ';';
			});
		} else if (!allowUnsafeSymbols) {
			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
			// using named character references.
			string = string.replace(regexEscape, escapeBmpSymbol);
		}
		return string
			// Encode astral symbols.
			.replace(regexAstralSymbols, function($0) {
				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
				var high = $0.charCodeAt(0);
				var low = $0.charCodeAt(1);
				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
				return escapeCodePoint(codePoint);
			})
			// Encode any remaining BMP symbols that are not printable ASCII symbols
			// using a hexadecimal escape.
			.replace(regexBmpWhitelist, escapeBmpSymbol);
	};
	// Expose default options (so they can be overridden globally).
	encode.options = {
		'allowUnsafeSymbols': false,
		'encodeEverything': false,
		'strict': false,
		'useNamedReferences': false,
		'decimal' : false
	};

	var decode = function(html, options) {
		options = merge(options, decode.options);
		var strict = options.strict;
		if (strict && regexInvalidEntity.test(html)) {
			parseError('malformed character reference');
		}
		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
			var codePoint;
			var semicolon;
			var decDigits;
			var hexDigits;
			var reference;
			var next;

			if ($1) {
				reference = $1;
				// Note: there is no need to check `has(decodeMap, reference)`.
				return decodeMap[reference];
			}

			if ($2) {
				// Decode named character references without trailing `;`, e.g. `&amp`.
				// This is only a parse error if it gets converted to `&`, or if it is
				// followed by `=` in an attribute context.
				reference = $2;
				next = $3;
				if (next && options.isAttributeValue) {
					if (strict && next == '=') {
						parseError('`&` did not start a character reference');
					}
					return $0;
				} else {
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
					return decodeMapLegacy[reference] + (next || '');
				}
			}

			if ($4) {
				// Decode decimal escapes, e.g. `&#119558;`.
				decDigits = $4;
				semicolon = $5;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(decDigits, 10);
				return codePointToSymbol(codePoint, strict);
			}

			if ($6) {
				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
				hexDigits = $6;
				semicolon = $7;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(hexDigits, 16);
				return codePointToSymbol(codePoint, strict);
			}

			// If we’re still here, `if ($7)` is implied; it’s an ambiguous
			// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
			if (strict) {
				parseError(
					'named character reference was not terminated by a semicolon'
				);
			}
			return $0;
		});
	};
	// Expose default options (so they can be overridden globally).
	decode.options = {
		'isAttributeValue': false,
		'strict': false
	};

	var escape = function(string) {
		return string.replace(regexEscape, function($0) {
			// Note: there is no need to check `has(escapeMap, $0)` here.
			return escapeMap[$0];
		});
	};

	/*--------------------------------------------------------------------------*/

	var he = {
		'version': '1.2.0',
		'encode': encode,
		'decode': decode,
		'escape': escape,
		'unescape': decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
			return he;
		}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}	else { var key; }

}(this));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/module.js */ "../node_modules/webpack/buildin/module.js")(module), __webpack_require__(/*! ./../webpack/buildin/global.js */ "../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "../node_modules/json5/dist/index.js":
/*!*******************************************!*\
  !*** ../node_modules/json5/dist/index.js ***!
  \*******************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

(function (global, factory) {
	 true ? module.exports = factory() :
	undefined;
}(this, (function () { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _global = createCommonjsModule(function (module) {
	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') { __g = global; } // eslint-disable-line no-undef
	});

	var _core = createCommonjsModule(function (module) {
	var core = module.exports = { version: '2.5.7' };
	if (typeof __e == 'number') { __e = core; } // eslint-disable-line no-undef
	});
	var _core_1 = _core.version;

	var _isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	var _anObject = function (it) {
	  if (!_isObject(it)) { throw TypeError(it + ' is not an object!'); }
	  return it;
	};

	var _fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};

	// Thank's IE8 for his funny defineProperty
	var _descriptors = !_fails(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});

	var document = _global.document;
	// typeof document.createElement is 'object' in old IE
	var is = _isObject(document) && _isObject(document.createElement);
	var _domCreate = function (it) {
	  return is ? document.createElement(it) : {};
	};

	var _ie8DomDefine = !_descriptors && !_fails(function () {
	  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
	});

	// 7.1.1 ToPrimitive(input [, PreferredType])

	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var _toPrimitive = function (it, S) {
	  if (!_isObject(it)) { return it; }
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) { return val; }
	  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) { return val; }
	  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) { return val; }
	  throw TypeError("Can't convert object to primitive value");
	};

	var dP = Object.defineProperty;

	var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  _anObject(O);
	  P = _toPrimitive(P, true);
	  _anObject(Attributes);
	  if (_ie8DomDefine) { try {
	    return dP(O, P, Attributes);
	  } catch (e) { /* empty */ } }
	  if ('get' in Attributes || 'set' in Attributes) { throw TypeError('Accessors not supported!'); }
	  if ('value' in Attributes) { O[P] = Attributes.value; }
	  return O;
	};

	var _objectDp = {
		f: f
	};

	var _propertyDesc = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var _hide = _descriptors ? function (object, key, value) {
	  return _objectDp.f(object, key, _propertyDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var hasOwnProperty = {}.hasOwnProperty;
	var _has = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};

	var id = 0;
	var px = Math.random();
	var _uid = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

	var _redefine = createCommonjsModule(function (module) {
	var SRC = _uid('src');
	var TO_STRING = 'toString';
	var $toString = Function[TO_STRING];
	var TPL = ('' + $toString).split(TO_STRING);

	_core.inspectSource = function (it) {
	  return $toString.call(it);
	};

	(module.exports = function (O, key, val, safe) {
	  var isFunction = typeof val == 'function';
	  if (isFunction) { _has(val, 'name') || _hide(val, 'name', key); }
	  if (O[key] === val) { return; }
	  if (isFunction) { _has(val, SRC) || _hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key))); }
	  if (O === _global) {
	    O[key] = val;
	  } else if (!safe) {
	    delete O[key];
	    _hide(O, key, val);
	  } else if (O[key]) {
	    O[key] = val;
	  } else {
	    _hide(O, key, val);
	  }
	// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	})(Function.prototype, TO_STRING, function toString() {
	  return typeof this == 'function' && this[SRC] || $toString.call(this);
	});
	});

	var _aFunction = function (it) {
	  if (typeof it != 'function') { throw TypeError(it + ' is not a function!'); }
	  return it;
	};

	// optional / simple context binding

	var _ctx = function (fn, that, length) {
	  _aFunction(fn);
	  if (that === undefined) { return fn; }
	  switch (length) {
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};

	var PROTOTYPE = 'prototype';

	var $export = function (type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] || (_global[name] = {}) : (_global[name] || {})[PROTOTYPE];
	  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
	  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
	  var key, own, out, exp;
	  if (IS_GLOBAL) { source = name; }
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    // export native or passed
	    out = (own ? target : source)[key];
	    // bind timers to global for call from export context
	    exp = IS_BIND && own ? _ctx(out, _global) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
	    // extend global
	    if (target) { _redefine(target, key, out, type & $export.U); }
	    // export
	    if (exports[key] != out) { _hide(exports, key, exp); }
	    if (IS_PROTO && expProto[key] != out) { expProto[key] = out; }
	  }
	};
	_global.core = _core;
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library`
	var _export = $export;

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	var _toInteger = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

	// 7.2.1 RequireObjectCoercible(argument)
	var _defined = function (it) {
	  if (it == undefined) { throw TypeError("Can't call method on  " + it); }
	  return it;
	};

	// true  -> String#at
	// false -> String#codePointAt
	var _stringAt = function (TO_STRING) {
	  return function (that, pos) {
	    var s = String(_defined(that));
	    var i = _toInteger(pos);
	    var l = s.length;
	    var a, b;
	    if (i < 0 || i >= l) { return TO_STRING ? '' : undefined; }
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

	var $at = _stringAt(false);
	_export(_export.P, 'String', {
	  // 21.1.3.3 String.prototype.codePointAt(pos)
	  codePointAt: function codePointAt(pos) {
	    return $at(this, pos);
	  }
	});

	var codePointAt = _core.String.codePointAt;

	var max = Math.max;
	var min = Math.min;
	var _toAbsoluteIndex = function (index, length) {
	  index = _toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

	var fromCharCode = String.fromCharCode;
	var $fromCodePoint = String.fromCodePoint;

	// length should be 1, old FF problem
	_export(_export.S + _export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
	  // 21.1.2.2 String.fromCodePoint(...codePoints)
	  fromCodePoint: function fromCodePoint(x) {
	    var arguments$1 = arguments;
	 // eslint-disable-line no-unused-vars
	    var res = [];
	    var aLen = arguments.length;
	    var i = 0;
	    var code;
	    while (aLen > i) {
	      code = +arguments$1[i++];
	      if (_toAbsoluteIndex(code, 0x10ffff) !== code) { throw RangeError(code + ' is not a valid code point'); }
	      res.push(code < 0x10000
	        ? fromCharCode(code)
	        : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
	      );
	    } return res.join('');
	  }
	});

	var fromCodePoint = _core.String.fromCodePoint;

	// This is a generated file. Do not edit.
	var Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
	var ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
	var ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;

	var unicode = {
		Space_Separator: Space_Separator,
		ID_Start: ID_Start,
		ID_Continue: ID_Continue
	};

	var util = {
	    isSpaceSeparator: function isSpaceSeparator (c) {
	        return unicode.Space_Separator.test(c)
	    },

	    isIdStartChar: function isIdStartChar (c) {
	        return (
	            (c >= 'a' && c <= 'z') ||
	        (c >= 'A' && c <= 'Z') ||
	        (c === '$') || (c === '_') ||
	        unicode.ID_Start.test(c)
	        )
	    },

	    isIdContinueChar: function isIdContinueChar (c) {
	        return (
	            (c >= 'a' && c <= 'z') ||
	        (c >= 'A' && c <= 'Z') ||
	        (c >= '0' && c <= '9') ||
	        (c === '$') || (c === '_') ||
	        (c === '\u200C') || (c === '\u200D') ||
	        unicode.ID_Continue.test(c)
	        )
	    },

	    isDigit: function isDigit (c) {
	        return /[0-9]/.test(c)
	    },

	    isHexDigit: function isHexDigit (c) {
	        return /[0-9A-Fa-f]/.test(c)
	    },
	};

	var source;
	var parseState;
	var stack;
	var pos;
	var line;
	var column;
	var token;
	var key;
	var root;

	var parse = function parse (text, reviver) {
	    source = String(text);
	    parseState = 'start';
	    stack = [];
	    pos = 0;
	    line = 1;
	    column = 0;
	    token = undefined;
	    key = undefined;
	    root = undefined;

	    do {
	        token = lex();

	        // This code is unreachable.
	        // if (!parseStates[parseState]) {
	        //     throw invalidParseState()
	        // }

	        parseStates[parseState]();
	    } while (token.type !== 'eof')

	    if (typeof reviver === 'function') {
	        return internalize({'': root}, '', reviver)
	    }

	    return root
	};

	function internalize (holder, name, reviver) {
	    var value = holder[name];
	    if (value != null && typeof value === 'object') {
	        for (var key in value) {
	            var replacement = internalize(value, key, reviver);
	            if (replacement === undefined) {
	                delete value[key];
	            } else {
	                value[key] = replacement;
	            }
	        }
	    }

	    return reviver.call(holder, name, value)
	}

	var lexState;
	var buffer;
	var doubleQuote;
	var sign;
	var c;

	function lex () {
	    lexState = 'default';
	    buffer = '';
	    doubleQuote = false;
	    sign = 1;

	    for (;;) {
	        c = peek();

	        // This code is unreachable.
	        // if (!lexStates[lexState]) {
	        //     throw invalidLexState(lexState)
	        // }

	        var token = lexStates[lexState]();
	        if (token) {
	            return token
	        }
	    }
	}

	function peek () {
	    if (source[pos]) {
	        return String.fromCodePoint(source.codePointAt(pos))
	    }
	}

	function read () {
	    var c = peek();

	    if (c === '\n') {
	        line++;
	        column = 0;
	    } else if (c) {
	        column += c.length;
	    } else {
	        column++;
	    }

	    if (c) {
	        pos += c.length;
	    }

	    return c
	}

	var lexStates = {
	    default: function default$1 () {
	        switch (c) {
	        case '\t':
	        case '\v':
	        case '\f':
	        case ' ':
	        case '\u00A0':
	        case '\uFEFF':
	        case '\n':
	        case '\r':
	        case '\u2028':
	        case '\u2029':
	            read();
	            return

	        case '/':
	            read();
	            lexState = 'comment';
	            return

	        case undefined:
	            read();
	            return newToken('eof')
	        }

	        if (util.isSpaceSeparator(c)) {
	            read();
	            return
	        }

	        // This code is unreachable.
	        // if (!lexStates[parseState]) {
	        //     throw invalidLexState(parseState)
	        // }

	        return lexStates[parseState]()
	    },

	    comment: function comment () {
	        switch (c) {
	        case '*':
	            read();
	            lexState = 'multiLineComment';
	            return

	        case '/':
	            read();
	            lexState = 'singleLineComment';
	            return
	        }

	        throw invalidChar(read())
	    },

	    multiLineComment: function multiLineComment () {
	        switch (c) {
	        case '*':
	            read();
	            lexState = 'multiLineCommentAsterisk';
	            return

	        case undefined:
	            throw invalidChar(read())
	        }

	        read();
	    },

	    multiLineCommentAsterisk: function multiLineCommentAsterisk () {
	        switch (c) {
	        case '*':
	            read();
	            return

	        case '/':
	            read();
	            lexState = 'default';
	            return

	        case undefined:
	            throw invalidChar(read())
	        }

	        read();
	        lexState = 'multiLineComment';
	    },

	    singleLineComment: function singleLineComment () {
	        switch (c) {
	        case '\n':
	        case '\r':
	        case '\u2028':
	        case '\u2029':
	            read();
	            lexState = 'default';
	            return

	        case undefined:
	            read();
	            return newToken('eof')
	        }

	        read();
	    },

	    value: function value () {
	        switch (c) {
	        case '{':
	        case '[':
	            return newToken('punctuator', read())

	        case 'n':
	            read();
	            literal('ull');
	            return newToken('null', null)

	        case 't':
	            read();
	            literal('rue');
	            return newToken('boolean', true)

	        case 'f':
	            read();
	            literal('alse');
	            return newToken('boolean', false)

	        case '-':
	        case '+':
	            if (read() === '-') {
	                sign = -1;
	            }

	            lexState = 'sign';
	            return

	        case '.':
	            buffer = read();
	            lexState = 'decimalPointLeading';
	            return

	        case '0':
	            buffer = read();
	            lexState = 'zero';
	            return

	        case '1':
	        case '2':
	        case '3':
	        case '4':
	        case '5':
	        case '6':
	        case '7':
	        case '8':
	        case '9':
	            buffer = read();
	            lexState = 'decimalInteger';
	            return

	        case 'I':
	            read();
	            literal('nfinity');
	            return newToken('numeric', Infinity)

	        case 'N':
	            read();
	            literal('aN');
	            return newToken('numeric', NaN)

	        case '"':
	        case "'":
	            doubleQuote = (read() === '"');
	            buffer = '';
	            lexState = 'string';
	            return
	        }

	        throw invalidChar(read())
	    },

	    identifierNameStartEscape: function identifierNameStartEscape () {
	        if (c !== 'u') {
	            throw invalidChar(read())
	        }

	        read();
	        var u = unicodeEscape();
	        switch (u) {
	        case '$':
	        case '_':
	            break

	        default:
	            if (!util.isIdStartChar(u)) {
	                throw invalidIdentifier()
	            }

	            break
	        }

	        buffer += u;
	        lexState = 'identifierName';
	    },

	    identifierName: function identifierName () {
	        switch (c) {
	        case '$':
	        case '_':
	        case '\u200C':
	        case '\u200D':
	            buffer += read();
	            return

	        case '\\':
	            read();
	            lexState = 'identifierNameEscape';
	            return
	        }

	        if (util.isIdContinueChar(c)) {
	            buffer += read();
	            return
	        }

	        return newToken('identifier', buffer)
	    },

	    identifierNameEscape: function identifierNameEscape () {
	        if (c !== 'u') {
	            throw invalidChar(read())
	        }

	        read();
	        var u = unicodeEscape();
	        switch (u) {
	        case '$':
	        case '_':
	        case '\u200C':
	        case '\u200D':
	            break

	        default:
	            if (!util.isIdContinueChar(u)) {
	                throw invalidIdentifier()
	            }

	            break
	        }

	        buffer += u;
	        lexState = 'identifierName';
	    },

	    sign: function sign$1 () {
	        switch (c) {
	        case '.':
	            buffer = read();
	            lexState = 'decimalPointLeading';
	            return

	        case '0':
	            buffer = read();
	            lexState = 'zero';
	            return

	        case '1':
	        case '2':
	        case '3':
	        case '4':
	        case '5':
	        case '6':
	        case '7':
	        case '8':
	        case '9':
	            buffer = read();
	            lexState = 'decimalInteger';
	            return

	        case 'I':
	            read();
	            literal('nfinity');
	            return newToken('numeric', sign * Infinity)

	        case 'N':
	            read();
	            literal('aN');
	            return newToken('numeric', NaN)
	        }

	        throw invalidChar(read())
	    },

	    zero: function zero () {
	        switch (c) {
	        case '.':
	            buffer += read();
	            lexState = 'decimalPoint';
	            return

	        case 'e':
	        case 'E':
	            buffer += read();
	            lexState = 'decimalExponent';
	            return

	        case 'x':
	        case 'X':
	            buffer += read();
	            lexState = 'hexadecimal';
	            return
	        }

	        return newToken('numeric', sign * 0)
	    },

	    decimalInteger: function decimalInteger () {
	        switch (c) {
	        case '.':
	            buffer += read();
	            lexState = 'decimalPoint';
	            return

	        case 'e':
	        case 'E':
	            buffer += read();
	            lexState = 'decimalExponent';
	            return
	        }

	        if (util.isDigit(c)) {
	            buffer += read();
	            return
	        }

	        return newToken('numeric', sign * Number(buffer))
	    },

	    decimalPointLeading: function decimalPointLeading () {
	        if (util.isDigit(c)) {
	            buffer += read();
	            lexState = 'decimalFraction';
	            return
	        }

	        throw invalidChar(read())
	    },

	    decimalPoint: function decimalPoint () {
	        switch (c) {
	        case 'e':
	        case 'E':
	            buffer += read();
	            lexState = 'decimalExponent';
	            return
	        }

	        if (util.isDigit(c)) {
	            buffer += read();
	            lexState = 'decimalFraction';
	            return
	        }

	        return newToken('numeric', sign * Number(buffer))
	    },

	    decimalFraction: function decimalFraction () {
	        switch (c) {
	        case 'e':
	        case 'E':
	            buffer += read();
	            lexState = 'decimalExponent';
	            return
	        }

	        if (util.isDigit(c)) {
	            buffer += read();
	            return
	        }

	        return newToken('numeric', sign * Number(buffer))
	    },

	    decimalExponent: function decimalExponent () {
	        switch (c) {
	        case '+':
	        case '-':
	            buffer += read();
	            lexState = 'decimalExponentSign';
	            return
	        }

	        if (util.isDigit(c)) {
	            buffer += read();
	            lexState = 'decimalExponentInteger';
	            return
	        }

	        throw invalidChar(read())
	    },

	    decimalExponentSign: function decimalExponentSign () {
	        if (util.isDigit(c)) {
	            buffer += read();
	            lexState = 'decimalExponentInteger';
	            return
	        }

	        throw invalidChar(read())
	    },

	    decimalExponentInteger: function decimalExponentInteger () {
	        if (util.isDigit(c)) {
	            buffer += read();
	            return
	        }

	        return newToken('numeric', sign * Number(buffer))
	    },

	    hexadecimal: function hexadecimal () {
	        if (util.isHexDigit(c)) {
	            buffer += read();
	            lexState = 'hexadecimalInteger';
	            return
	        }

	        throw invalidChar(read())
	    },

	    hexadecimalInteger: function hexadecimalInteger () {
	        if (util.isHexDigit(c)) {
	            buffer += read();
	            return
	        }

	        return newToken('numeric', sign * Number(buffer))
	    },

	    string: function string () {
	        switch (c) {
	        case '\\':
	            read();
	            buffer += escape();
	            return

	        case '"':
	            if (doubleQuote) {
	                read();
	                return newToken('string', buffer)
	            }

	            buffer += read();
	            return

	        case "'":
	            if (!doubleQuote) {
	                read();
	                return newToken('string', buffer)
	            }

	            buffer += read();
	            return

	        case '\n':
	        case '\r':
	            throw invalidChar(read())

	        case '\u2028':
	        case '\u2029':
	            separatorChar(c);
	            break

	        case undefined:
	            throw invalidChar(read())
	        }

	        buffer += read();
	    },

	    start: function start () {
	        switch (c) {
	        case '{':
	        case '[':
	            return newToken('punctuator', read())

	        // This code is unreachable since the default lexState handles eof.
	        // case undefined:
	        //     return newToken('eof')
	        }

	        lexState = 'value';
	    },

	    beforePropertyName: function beforePropertyName () {
	        switch (c) {
	        case '$':
	        case '_':
	            buffer = read();
	            lexState = 'identifierName';
	            return

	        case '\\':
	            read();
	            lexState = 'identifierNameStartEscape';
	            return

	        case '}':
	            return newToken('punctuator', read())

	        case '"':
	        case "'":
	            doubleQuote = (read() === '"');
	            lexState = 'string';
	            return
	        }

	        if (util.isIdStartChar(c)) {
	            buffer += read();
	            lexState = 'identifierName';
	            return
	        }

	        throw invalidChar(read())
	    },

	    afterPropertyName: function afterPropertyName () {
	        if (c === ':') {
	            return newToken('punctuator', read())
	        }

	        throw invalidChar(read())
	    },

	    beforePropertyValue: function beforePropertyValue () {
	        lexState = 'value';
	    },

	    afterPropertyValue: function afterPropertyValue () {
	        switch (c) {
	        case ',':
	        case '}':
	            return newToken('punctuator', read())
	        }

	        throw invalidChar(read())
	    },

	    beforeArrayValue: function beforeArrayValue () {
	        if (c === ']') {
	            return newToken('punctuator', read())
	        }

	        lexState = 'value';
	    },

	    afterArrayValue: function afterArrayValue () {
	        switch (c) {
	        case ',':
	        case ']':
	            return newToken('punctuator', read())
	        }

	        throw invalidChar(read())
	    },

	    end: function end () {
	        // This code is unreachable since it's handled by the default lexState.
	        // if (c === undefined) {
	        //     read()
	        //     return newToken('eof')
	        // }

	        throw invalidChar(read())
	    },
	};

	function newToken (type, value) {
	    return {
	        type: type,
	        value: value,
	        line: line,
	        column: column,
	    }
	}

	function literal (s) {
	    for (var i = 0, list = s; i < list.length; i += 1) {
	        var c = list[i];

	        var p = peek();

	        if (p !== c) {
	            throw invalidChar(read())
	        }

	        read();
	    }
	}

	function escape () {
	    var c = peek();
	    switch (c) {
	    case 'b':
	        read();
	        return '\b'

	    case 'f':
	        read();
	        return '\f'

	    case 'n':
	        read();
	        return '\n'

	    case 'r':
	        read();
	        return '\r'

	    case 't':
	        read();
	        return '\t'

	    case 'v':
	        read();
	        return '\v'

	    case '0':
	        read();
	        if (util.isDigit(peek())) {
	            throw invalidChar(read())
	        }

	        return '\0'

	    case 'x':
	        read();
	        return hexEscape()

	    case 'u':
	        read();
	        return unicodeEscape()

	    case '\n':
	    case '\u2028':
	    case '\u2029':
	        read();
	        return ''

	    case '\r':
	        read();
	        if (peek() === '\n') {
	            read();
	        }

	        return ''

	    case '1':
	    case '2':
	    case '3':
	    case '4':
	    case '5':
	    case '6':
	    case '7':
	    case '8':
	    case '9':
	        throw invalidChar(read())

	    case undefined:
	        throw invalidChar(read())
	    }

	    return read()
	}

	function hexEscape () {
	    var buffer = '';
	    var c = peek();

	    if (!util.isHexDigit(c)) {
	        throw invalidChar(read())
	    }

	    buffer += read();

	    c = peek();
	    if (!util.isHexDigit(c)) {
	        throw invalidChar(read())
	    }

	    buffer += read();

	    return String.fromCodePoint(parseInt(buffer, 16))
	}

	function unicodeEscape () {
	    var buffer = '';
	    var count = 4;

	    while (count-- > 0) {
	        var c = peek();
	        if (!util.isHexDigit(c)) {
	            throw invalidChar(read())
	        }

	        buffer += read();
	    }

	    return String.fromCodePoint(parseInt(buffer, 16))
	}

	var parseStates = {
	    start: function start () {
	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        push();
	    },

	    beforePropertyName: function beforePropertyName () {
	        switch (token.type) {
	        case 'identifier':
	        case 'string':
	            key = token.value;
	            parseState = 'afterPropertyName';
	            return

	        case 'punctuator':
	            // This code is unreachable since it's handled by the lexState.
	            // if (token.value !== '}') {
	            //     throw invalidToken()
	            // }

	            pop();
	            return

	        case 'eof':
	            throw invalidEOF()
	        }

	        // This code is unreachable since it's handled by the lexState.
	        // throw invalidToken()
	    },

	    afterPropertyName: function afterPropertyName () {
	        // This code is unreachable since it's handled by the lexState.
	        // if (token.type !== 'punctuator' || token.value !== ':') {
	        //     throw invalidToken()
	        // }

	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        parseState = 'beforePropertyValue';
	    },

	    beforePropertyValue: function beforePropertyValue () {
	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        push();
	    },

	    beforeArrayValue: function beforeArrayValue () {
	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        if (token.type === 'punctuator' && token.value === ']') {
	            pop();
	            return
	        }

	        push();
	    },

	    afterPropertyValue: function afterPropertyValue () {
	        // This code is unreachable since it's handled by the lexState.
	        // if (token.type !== 'punctuator') {
	        //     throw invalidToken()
	        // }

	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        switch (token.value) {
	        case ',':
	            parseState = 'beforePropertyName';
	            return

	        case '}':
	            pop();
	        }

	        // This code is unreachable since it's handled by the lexState.
	        // throw invalidToken()
	    },

	    afterArrayValue: function afterArrayValue () {
	        // This code is unreachable since it's handled by the lexState.
	        // if (token.type !== 'punctuator') {
	        //     throw invalidToken()
	        // }

	        if (token.type === 'eof') {
	            throw invalidEOF()
	        }

	        switch (token.value) {
	        case ',':
	            parseState = 'beforeArrayValue';
	            return

	        case ']':
	            pop();
	        }

	        // This code is unreachable since it's handled by the lexState.
	        // throw invalidToken()
	    },

	    end: function end () {
	        // This code is unreachable since it's handled by the lexState.
	        // if (token.type !== 'eof') {
	        //     throw invalidToken()
	        // }
	    },
	};

	function push () {
	    var value;

	    switch (token.type) {
	    case 'punctuator':
	        switch (token.value) {
	        case '{':
	            value = {};
	            break

	        case '[':
	            value = [];
	            break
	        }

	        break

	    case 'null':
	    case 'boolean':
	    case 'numeric':
	    case 'string':
	        value = token.value;
	        break

	    // This code is unreachable.
	    // default:
	    //     throw invalidToken()
	    }

	    if (root === undefined) {
	        root = value;
	    } else {
	        var parent = stack[stack.length - 1];
	        if (Array.isArray(parent)) {
	            parent.push(value);
	        } else {
	            parent[key] = value;
	        }
	    }

	    if (value !== null && typeof value === 'object') {
	        stack.push(value);

	        if (Array.isArray(value)) {
	            parseState = 'beforeArrayValue';
	        } else {
	            parseState = 'beforePropertyName';
	        }
	    } else {
	        var current = stack[stack.length - 1];
	        if (current == null) {
	            parseState = 'end';
	        } else if (Array.isArray(current)) {
	            parseState = 'afterArrayValue';
	        } else {
	            parseState = 'afterPropertyValue';
	        }
	    }
	}

	function pop () {
	    stack.pop();

	    var current = stack[stack.length - 1];
	    if (current == null) {
	        parseState = 'end';
	    } else if (Array.isArray(current)) {
	        parseState = 'afterArrayValue';
	    } else {
	        parseState = 'afterPropertyValue';
	    }
	}

	// This code is unreachable.
	// function invalidParseState () {
	//     return new Error(`JSON5: invalid parse state '${parseState}'`)
	// }

	// This code is unreachable.
	// function invalidLexState (state) {
	//     return new Error(`JSON5: invalid lex state '${state}'`)
	// }

	function invalidChar (c) {
	    if (c === undefined) {
	        return syntaxError(("JSON5: invalid end of input at " + line + ":" + column))
	    }

	    return syntaxError(("JSON5: invalid character '" + (formatChar(c)) + "' at " + line + ":" + column))
	}

	function invalidEOF () {
	    return syntaxError(("JSON5: invalid end of input at " + line + ":" + column))
	}

	// This code is unreachable.
	// function invalidToken () {
	//     if (token.type === 'eof') {
	//         return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
	//     }

	//     const c = String.fromCodePoint(token.value.codePointAt(0))
	//     return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
	// }

	function invalidIdentifier () {
	    column -= 5;
	    return syntaxError(("JSON5: invalid identifier character at " + line + ":" + column))
	}

	function separatorChar (c) {
	    console.warn(("JSON5: '" + (formatChar(c)) + "' in strings is not valid ECMAScript; consider escaping"));
	}

	function formatChar (c) {
	    var replacements = {
	        "'": "\\'",
	        '"': '\\"',
	        '\\': '\\\\',
	        '\b': '\\b',
	        '\f': '\\f',
	        '\n': '\\n',
	        '\r': '\\r',
	        '\t': '\\t',
	        '\v': '\\v',
	        '\0': '\\0',
	        '\u2028': '\\u2028',
	        '\u2029': '\\u2029',
	    };

	    if (replacements[c]) {
	        return replacements[c]
	    }

	    if (c < ' ') {
	        var hexString = c.charCodeAt(0).toString(16);
	        return '\\x' + ('00' + hexString).substring(hexString.length)
	    }

	    return c
	}

	function syntaxError (message) {
	    var err = new SyntaxError(message);
	    err.lineNumber = line;
	    err.columnNumber = column;
	    return err
	}

	var stringify = function stringify (value, replacer, space) {
	    var stack = [];
	    var indent = '';
	    var propertyList;
	    var replacerFunc;
	    var gap = '';
	    var quote;

	    if (
	        replacer != null &&
	        typeof replacer === 'object' &&
	        !Array.isArray(replacer)
	    ) {
	        space = replacer.space;
	        quote = replacer.quote;
	        replacer = replacer.replacer;
	    }

	    if (typeof replacer === 'function') {
	        replacerFunc = replacer;
	    } else if (Array.isArray(replacer)) {
	        propertyList = [];
	        for (var i = 0, list = replacer; i < list.length; i += 1) {
	            var v = list[i];

	            var item = (void 0);

	            if (typeof v === 'string') {
	                item = v;
	            } else if (
	                typeof v === 'number' ||
	                v instanceof String ||
	                v instanceof Number
	            ) {
	                item = String(v);
	            }

	            if (item !== undefined && propertyList.indexOf(item) < 0) {
	                propertyList.push(item);
	            }
	        }
	    }

	    if (space instanceof Number) {
	        space = Number(space);
	    } else if (space instanceof String) {
	        space = String(space);
	    }

	    if (typeof space === 'number') {
	        if (space > 0) {
	            space = Math.min(10, Math.floor(space));
	            gap = '          '.substr(0, space);
	        }
	    } else if (typeof space === 'string') {
	        gap = space.substr(0, 10);
	    }

	    return serializeProperty('', {'': value})

	    function serializeProperty (key, holder) {
	        var value = holder[key];
	        if (value != null) {
	            if (typeof value.toJSON5 === 'function') {
	                value = value.toJSON5(key);
	            } else if (typeof value.toJSON === 'function') {
	                value = value.toJSON(key);
	            }
	        }

	        if (replacerFunc) {
	            value = replacerFunc.call(holder, key, value);
	        }

	        if (value instanceof Number) {
	            value = Number(value);
	        } else if (value instanceof String) {
	            value = String(value);
	        } else if (value instanceof Boolean) {
	            value = value.valueOf();
	        }

	        switch (value) {
	        case null: return 'null'
	        case true: return 'true'
	        case false: return 'false'
	        }

	        if (typeof value === 'string') {
	            return quoteString(value, false)
	        }

	        if (typeof value === 'number') {
	            return String(value)
	        }

	        if (typeof value === 'object') {
	            return Array.isArray(value) ? serializeArray(value) : serializeObject(value)
	        }

	        return undefined
	    }

	    function quoteString (value) {
	        var quotes = {
	            "'": 0.1,
	            '"': 0.2,
	        };

	        var replacements = {
	            "'": "\\'",
	            '"': '\\"',
	            '\\': '\\\\',
	            '\b': '\\b',
	            '\f': '\\f',
	            '\n': '\\n',
	            '\r': '\\r',
	            '\t': '\\t',
	            '\v': '\\v',
	            '\0': '\\0',
	            '\u2028': '\\u2028',
	            '\u2029': '\\u2029',
	        };

	        var product = '';

	        for (var i = 0, list = value; i < list.length; i += 1) {
	            var c = list[i];

	            switch (c) {
	            case "'":
	            case '"':
	                quotes[c]++;
	                product += c;
	                continue
	            }

	            if (replacements[c]) {
	                product += replacements[c];
	                continue
	            }

	            if (c < ' ') {
	                var hexString = c.charCodeAt(0).toString(16);
	                product += '\\x' + ('00' + hexString).substring(hexString.length);
	                continue
	            }

	            product += c;
	        }

	        var quoteChar = quote || Object.keys(quotes).reduce(function (a, b) { return (quotes[a] < quotes[b]) ? a : b; });

	        product = product.replace(new RegExp(quoteChar, 'g'), replacements[quoteChar]);

	        return quoteChar + product + quoteChar
	    }

	    function serializeObject (value) {
	        if (stack.indexOf(value) >= 0) {
	            throw TypeError('Converting circular structure to JSON5')
	        }

	        stack.push(value);

	        var stepback = indent;
	        indent = indent + gap;

	        var keys = propertyList || Object.keys(value);
	        var partial = [];
	        for (var i = 0, list = keys; i < list.length; i += 1) {
	            var key = list[i];

	            var propertyString = serializeProperty(key, value);
	            if (propertyString !== undefined) {
	                var member = serializeKey(key) + ':';
	                if (gap !== '') {
	                    member += ' ';
	                }
	                member += propertyString;
	                partial.push(member);
	            }
	        }

	        var final;
	        if (partial.length === 0) {
	            final = '{}';
	        } else {
	            var properties;
	            if (gap === '') {
	                properties = partial.join(',');
	                final = '{' + properties + '}';
	            } else {
	                var separator = ',\n' + indent;
	                properties = partial.join(separator);
	                final = '{\n' + indent + properties + ',\n' + stepback + '}';
	            }
	        }

	        stack.pop();
	        indent = stepback;
	        return final
	    }

	    function serializeKey (key) {
	        if (key.length === 0) {
	            return quoteString(key, true)
	        }

	        var firstChar = String.fromCodePoint(key.codePointAt(0));
	        if (!util.isIdStartChar(firstChar)) {
	            return quoteString(key, true)
	        }

	        for (var i = firstChar.length; i < key.length; i++) {
	            if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
	                return quoteString(key, true)
	            }
	        }

	        return key
	    }

	    function serializeArray (value) {
	        if (stack.indexOf(value) >= 0) {
	            throw TypeError('Converting circular structure to JSON5')
	        }

	        stack.push(value);

	        var stepback = indent;
	        indent = indent + gap;

	        var partial = [];
	        for (var i = 0; i < value.length; i++) {
	            var propertyString = serializeProperty(String(i), value);
	            partial.push((propertyString !== undefined) ? propertyString : 'null');
	        }

	        var final;
	        if (partial.length === 0) {
	            final = '[]';
	        } else {
	            if (gap === '') {
	                var properties = partial.join(',');
	                final = '[' + properties + ']';
	            } else {
	                var separator = ',\n' + indent;
	                var properties$1 = partial.join(separator);
	                final = '[\n' + indent + properties$1 + ',\n' + stepback + ']';
	            }
	        }

	        stack.pop();
	        indent = stepback;
	        return final
	    }
	};

	var JSON5 = {
	    parse: parse,
	    stringify: stringify,
	};

	var lib = JSON5;

	var es5 = lib;

	return es5;

})));


/***/ }),

/***/ "../node_modules/unicode2latex/dist/ascii.json":
/*!*****************************************************!*\
  !*** ../node_modules/unicode2latex/dist/ascii.json ***!
  \*****************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = {'_':{'math':'\\_','text':'\\_'},'{':{'math':'\\lbrace{}','text':'\\{'},'}':{'math':'\\rbrace{}','text':'\\}'},'&':{'math':'\\&','text':'\\&'},'#':{'math':'\\#','text':'\\#'},'%':{'math':'\\%','text':'\\%'},'^':{'math':'\\sphat{}','text':'\\^'},'<':{'math':'<'},'>':{'math':'>'},'~':{'math':'\\sptilde{}','text':'\\textasciitilde{}'},'$':{'math':'\\$','text':'\\$'},'\\':{'math':'\\backslash{}','text':'\\textbackslash{}'},'\xA0':{'math':'~','text':'~','space':true},'\xA1':{'text':'\\textexclamdown{}'},'\xA2':{'math':'\\cent{}','text':'\\textcent{}'},'\xA3':{'math':'\\pounds{}','text':'\\textsterling{}'},'\xA4':{'text':'\\textcurrency{}'},'\xA5':{'math':'\\yen{}','text':'\\textyen{}'},'\xA6':{'text':'\\textbrokenbar{}'},'\xA7':{'text':'\\textsection{}'},'\xA8':{'math':'\\spddot{}','text':'\\textasciidieresis{}'},'\xA9':{'text':'\\textcopyright{}'},'\xAA':{'text':'\\textordfeminine{}'},'\xAB':{'text':'\\guillemotleft{}'},'\xAC':{'math':'\\lnot{}'},'\xAD':{'math':'\\-','text':'\\-'},'\xAE':{'math':'\\circledR{}','text':'\\textregistered{}'},'\xAF':{'text':'\\textasciimacron{}'},'\xB0':{'math':'^\\circ{}','text':'\\textdegree{}'},'\xB1':{'math':'\\pm{}'},'\xB2':{'math':'^2'},'\xB3':{'math':'^3'},'\xB4':{'text':'\\textasciiacute{}'},'\xB5':{'math':'\\mathrm{\\mu}'},'\xB6':{'text':'\\textparagraph{}'},'\xB7':{'math':'\\cdot{}'},'\xB8':{'text':'\\c{}'},'\xB9':{'math':'^1'},'\xBA':{'text':'\\textordmasculine{}'},'\xBB':{'text':'\\guillemotright{}'},'\xBC':{'text':'\\textonequarter{}'},'\xBD':{'text':'\\textonehalf{}'},'\xBE':{'text':'\\textthreequarters{}'},'\xBF':{'text':'\\textquestiondown{}'},'\xC0':{'text':'\\`A'},'\xC1':{'text':'\\\'A'},'\xC2':{'text':'\\^A'},'\xC3':{'text':'\\~A'},'\xC4':{'text':'\\"A'},'\xC5':{'math':'\\Angstroem{}','text':'\\AA{}'},'\xC6':{'text':'\\AE{}'},'\xC7':{'text':'{\\c C}'},'\xC8':{'text':'\\`E'},'\xC9':{'text':'\\\'E'},'\xCA':{'text':'\\^E'},'\xCB':{'text':'\\"E'},'\xCC':{'text':'\\`I'},'\xCD':{'text':'\\\'I'},'\xCE':{'text':'\\^I'},'\xCF':{'text':'\\"I'},'\xD0':{'text':'\\DH{}'},'\xD1':{'text':'\\~N'},'\xD2':{'text':'\\`O'},'\xD3':{'text':'\\\'O'},'\xD4':{'text':'\\^O'},'\xD5':{'text':'\\~O'},'\xD6':{'text':'\\"O'},'\xD7':{'math':'\\times{}','text':'\\texttimes{}'},'\xD8':{'text':'\\O{}'},'\xD9':{'text':'\\`U'},'\xDA':{'text':'\\\'U'},'\xDB':{'text':'\\^U'},'\xDC':{'text':'\\"U'},'\xDD':{'text':'\\\'Y'},'\xDE':{'text':'\\TH{}'},'\xDF':{'text':'\\ss{}'},'\xE0':{'text':'\\`a'},'\xE1':{'text':'\\\'a'},'\xE2':{'text':'\\^a'},'\xE3':{'text':'\\~a'},'\xE4':{'text':'\\"a'},'\xE5':{'text':'\\aa{}'},'\xE6':{'text':'\\ae{}'},'\xE7':{'text':'{\\c c}'},'\xE8':{'text':'\\`e'},'\xE9':{'text':'\\\'e'},'\xEA':{'text':'\\^e'},'\xEB':{'text':'\\"e'},'\xEC':{'text':'\\`i'},'\xED':{'text':'\\\'i'},'\xEE':{'text':'\\^i'},'\xEF':{'text':'\\"i'},'\xF0':{'math':'\\eth{}','text':'\\dh{}'},'\xF1':{'text':'\\~n'},'\xF2':{'text':'\\`o'},'\xF3':{'text':'\\\'o'},'\xF4':{'text':'\\^o'},'\xF5':{'text':'\\~o'},'\xF6':{'text':'\\"o'},'\xF7':{'math':'\\div{}'},'\xF8':{'text':'\\o{}'},'\xF9':{'text':'\\`u'},'\xFA':{'text':'\\\'u'},'\xFB':{'text':'\\^u'},'\xFC':{'text':'\\"u'},'\xFD':{'text':'\\\'y'},'\xFE':{'text':'\\th{}'},'\xFF':{'text':'\\"y'},'\u0100':{'text':'\\=A'},'\u0101':{'text':'\\=a'},'\u0102':{'text':'{\\u A}'},'\u0103':{'text':'{\\u a}'},'\u0104':{'text':'\\k{A}'},'\u0105':{'text':'\\k{a}'},'\u0106':{'text':'\\\'C'},'\u0107':{'text':'\\\'c'},'\u0108':{'text':'\\^C'},'\u0109':{'text':'\\^c'},'\u010A':{'text':'\\.{C}'},'\u010B':{'text':'\\.{c}'},'\u010C':{'text':'{\\v C}'},'\u010D':{'text':'{\\v c}'},'\u010E':{'text':'{\\v D}'},'\u010F':{'text':'{\\v d}'},'\u0110':{'text':'\\DJ{}'},'\u0111':{'text':'\\dj{}'},'\u0112':{'text':'\\=E'},'\u0113':{'text':'\\=e'},'\u0114':{'text':'{\\u E}'},'\u0115':{'text':'{\\u e}'},'\u0116':{'text':'\\.{E}'},'\u0117':{'text':'\\.{e}'},'\u0118':{'text':'\\k{E}'},'\u0119':{'text':'\\k{e}'},'\u011A':{'text':'{\\v E}'},'\u011B':{'text':'{\\v e}'},'\u011C':{'text':'\\^G'},'\u011D':{'text':'\\^g'},'\u011E':{'text':'{\\u G}'},'\u011F':{'text':'{\\u g}'},'\u0120':{'text':'\\.{G}'},'\u0121':{'text':'\\.{g}'},'\u0122':{'text':'{\\c G}'},'\u0123':{'text':'{\\c g}'},'\u0124':{'text':'\\^H'},'\u0125':{'text':'\\^h'},'\u0126':{'text':'{\\fontencoding{LELA}\\selectfont\\char40}'},'\u0127':{'math':'\\Elzxh{}'},'\u0128':{'text':'\\~I'},'\u0129':{'text':'\\~i'},'\u012A':{'text':'\\=I'},'\u012B':{'text':'\\=i'},'\u012C':{'text':'{\\u I}'},'\u012D':{'text':'{\\u \\i}'},'\u012E':{'text':'\\k{I}'},'\u012F':{'text':'\\k{i}'},'\u0130':{'text':'\\.{I}'},'\u0131':{'math':'\\imath{}','text':'\\i{}'},'\u0132':{'text':'IJ'},'\u0133':{'text':'ij'},'\u0134':{'text':'\\^J'},'\u0135':{'text':'\\^\\j'},'\u0136':{'text':'{\\c K}'},'\u0137':{'text':'{\\c k}'},'\u0138':{'text':'{\\fontencoding{LELA}\\selectfont\\char91}'},'\u0139':{'text':'\\\'L'},'\u013A':{'text':'\\\'l'},'\u013B':{'text':'{\\c L}'},'\u013C':{'text':'{\\c l}'},'\u013D':{'text':'{\\v L}'},'\u013E':{'text':'{\\v l}'},'\u013F':{'text':'{\\fontencoding{LELA}\\selectfont\\char201}'},'\u0140':{'text':'{\\fontencoding{LELA}\\selectfont\\char202}'},'\u0141':{'text':'\\L{}'},'\u0142':{'text':'\\l{}'},'\u0143':{'text':'\\\'N'},'\u0144':{'text':'\\\'n'},'\u0145':{'text':'{\\c N}'},'\u0146':{'text':'{\\c n}'},'\u0147':{'text':'{\\v N}'},'\u0148':{'text':'{\\v n}'},'\u0149':{'text':'\'n'},'\u014A':{'text':'\\NG{}'},'\u014B':{'text':'\\ng{}'},'\u014C':{'text':'\\=O'},'\u014D':{'text':'\\=o'},'\u014E':{'text':'{\\u O}'},'\u014F':{'text':'{\\u o}'},'\u0150':{'text':'{\\H O}'},'\u0151':{'text':'{\\H o}'},'\u0152':{'text':'\\OE{}'},'\u0153':{'text':'\\oe{}'},'\u0154':{'text':'\\\'R'},'\u0155':{'text':'\\\'r'},'\u0156':{'text':'{\\c R}'},'\u0157':{'text':'{\\c r}'},'\u0158':{'text':'{\\v R}'},'\u0159':{'text':'{\\v r}'},'\u015A':{'text':'\\\'S'},'\u015B':{'text':'\\\'s'},'\u015C':{'text':'\\^S'},'\u015D':{'text':'\\^s'},'\u015E':{'text':'{\\c S}'},'\u015F':{'text':'{\\c s}'},'\u0160':{'text':'{\\v S}'},'\u0161':{'text':'{\\v s}'},'\u0162':{'text':'{\\c T}'},'\u0163':{'text':'{\\c t}'},'\u0164':{'text':'{\\v T}'},'\u0165':{'text':'{\\v t}'},'\u0166':{'text':'{\\fontencoding{LELA}\\selectfont\\char47}'},'\u0167':{'text':'{\\fontencoding{LELA}\\selectfont\\char63}'},'\u0168':{'text':'\\~U'},'\u0169':{'text':'\\~u'},'\u016A':{'text':'\\=U'},'\u016B':{'text':'\\=u'},'\u016C':{'text':'{\\u U}'},'\u016D':{'text':'{\\u u}'},'\u016E':{'text':'\\r{U}'},'\u016F':{'text':'\\r{u}'},'\u0170':{'text':'{\\H U}'},'\u0171':{'text':'{\\H u}'},'\u0172':{'text':'\\k{U}'},'\u0173':{'text':'\\k{u}'},'\u0174':{'text':'\\^W'},'\u0175':{'text':'\\^w'},'\u0176':{'text':'\\^Y'},'\u0177':{'text':'\\^y'},'\u0178':{'text':'\\"Y'},'\u0179':{'text':'\\\'Z'},'\u017A':{'text':'\\\'z'},'\u017B':{'text':'\\.{Z}'},'\u017C':{'text':'\\.{z}'},'\u017D':{'text':'{\\v Z}'},'\u017E':{'text':'{\\v z}'},'\u017F':{'text':'s'},'\u0192':{'math':'f'},'\u0195':{'text':'\\texthvlig{}'},'\u019E':{'text':'\\textnrleg{}'},'\u01AA':{'math':'\\eth{}'},'\u01B5':{'math':'\\Zbar{}'},'\u01BA':{'text':'{\\fontencoding{LELA}\\selectfont\\char195}'},'\u01C2':{'text':'\\textdoublepipe{}'},'\u01CD':{'text':'{\\v A}'},'\u01CE':{'text':'{\\v a}'},'\u01CF':{'text':'{\\v I}'},'\u01D0':{'text':'{\\v i}'},'\u01D1':{'text':'{\\v O}'},'\u01D2':{'text':'{\\v o}'},'\u01D3':{'text':'{\\v U}'},'\u01D4':{'text':'{\\v u}'},'\u01E6':{'text':'{\\v G}'},'\u01E7':{'text':'{\\v g}'},'\u01E8':{'text':'{\\v K}'},'\u01E9':{'text':'{\\v k}'},'\u01EA':{'text':'{\\k O}'},'\u01EB':{'text':'{\\k o}'},'\u01F0':{'text':'{\\v j}'},'\u01F4':{'text':'\\\'G'},'\u01F5':{'text':'\\\'g'},'\u0237':{'math':'\\jmath{}'},'\u0250':{'math':'\\Elztrna{}'},'\u0252':{'math':'\\Elztrnsa{}'},'\u0254':{'math':'\\Elzopeno{}'},'\u0256':{'math':'\\Elzrtld{}'},'\u0258':{'text':'{\\fontencoding{LEIP}\\selectfont\\char61}'},'\u0259':{'math':'\\Elzschwa{}'},'\u025B':{'math':'\\varepsilon{}'},'\u0261':{'text':'g'},'\u0263':{'math':'\\Elzpgamma{}'},'\u0264':{'math':'\\Elzpbgam{}'},'\u0265':{'math':'\\Elztrnh{}'},'\u026C':{'math':'\\Elzbtdl{}'},'\u026D':{'math':'\\Elzrtll{}'},'\u026F':{'math':'\\Elztrnm{}'},'\u0270':{'math':'\\Elztrnmlr{}'},'\u0271':{'math':'\\Elzltlmr{}'},'\u0272':{'text':'\\Elzltln{}'},'\u0273':{'math':'\\Elzrtln{}'},'\u0277':{'math':'\\Elzclomeg{}'},'\u0278':{'text':'\\textphi{}'},'\u0279':{'math':'\\Elztrnr{}'},'\u027A':{'math':'\\Elztrnrl{}'},'\u027B':{'math':'\\Elzrttrnr{}'},'\u027C':{'math':'\\Elzrl{}'},'\u027D':{'math':'\\Elzrtlr{}'},'\u027E':{'math':'\\Elzfhr{}'},'\u027F':{'text':'{\\fontencoding{LEIP}\\selectfont\\char202}'},'\u0282':{'math':'\\Elzrtls{}'},'\u0283':{'math':'\\Elzesh{}'},'\u0287':{'math':'\\Elztrnt{}'},'\u0288':{'math':'\\Elzrtlt{}'},'\u028A':{'math':'\\Elzpupsil{}'},'\u028B':{'math':'\\Elzpscrv{}'},'\u028C':{'math':'\\Elzinvv{}'},'\u028D':{'math':'\\Elzinvw{}'},'\u028E':{'math':'\\Elztrny{}'},'\u0290':{'math':'\\Elzrtlz{}'},'\u0292':{'math':'\\Elzyogh{}'},'\u0294':{'math':'\\Elzglst{}'},'\u0295':{'math':'\\Elzreglst{}'},'\u0296':{'math':'\\Elzinglst{}'},'\u029E':{'text':'\\textturnk{}'},'\u02A4':{'math':'\\Elzdyogh{}'},'\u02A7':{'math':'\\Elztesh{}'},'\u02B9':{'text':'\''},'\u02BB':{'text':'\''},'\u02BC':{'text':'\''},'\u02BD':{'text':'\''},'\u02C6':{'text':'\\textasciicircum{}'},'\u02C7':{'text':'\\textasciicaron{}'},'\u02C8':{'math':'\\Elzverts{}'},'\u02C9':{'text':'-'},'\u02CC':{'math':'\\Elzverti{}'},'\u02D0':{'math':'\\Elzlmrk{}'},'\u02D1':{'math':'\\Elzhlmrk{}'},'\u02D2':{'math':'\\Elzsbrhr{}'},'\u02D3':{'math':'\\Elzsblhr{}'},'\u02D4':{'math':'\\Elzrais{}'},'\u02D5':{'math':'\\Elzlow{}'},'\u02D8':{'text':'\\textasciibreve{}'},'\u02D9':{'text':'\\textperiodcentered{}'},'\u02DA':{'text':'\\r{}'},'\u02DB':{'text':'\\k{}'},'\u02DC':{'text':'\\texttildelow{}'},'\u02DD':{'text':'\\H{}'},'\u02E5':{'text':'\\tone{55}'},'\u02E6':{'text':'\\tone{44}'},'\u02E7':{'text':'\\tone{33}'},'\u02E8':{'text':'\\tone{22}'},'\u02E9':{'text':'\\tone{11}'},'\u0300':{'math':'\\grave{}','text':'\\`'},'\u0301':{'math':'\\acute{}','text':'\\\''},'\u0302':{'math':'\\hat{}','text':'\\^'},'\u0303':{'math':'\\tilde{}','text':'\\~'},'\u0304':{'math':'\\bar{}','text':'\\='},'\u0305':{'math':'\\overline{}'},'\u0306':{'math':'\\breve{}','text':'\\u{}'},'\u0307':{'math':'\\dot{}','text':'\\.'},'\u0308':{'math':'\\ddot{}','text':'\\"'},'\u0309':{'math':'\\ovhook{}'},'\u030A':{'math':'\\mathring{}','text':'\\r{}'},'\u030B':{'text':'\\H{}'},'\u030C':{'math':'\\check{}','text':'\\v{}'},'\u030F':{'text':'\\cyrchar\\C{}'},'\u0310':{'math':'\\candra{}'},'\u0311':{'text':'{\\fontencoding{LECO}\\selectfont\\char177}'},'\u0312':{'math':'\\oturnedcomma{}'},'\u0315':{'math':'\\ocommatopright{}'},'\u0318':{'text':'{\\fontencoding{LECO}\\selectfont\\char184}'},'\u0319':{'text':'{\\fontencoding{LECO}\\selectfont\\char185}'},'\u031A':{'math':'\\droang{}'},'\u0321':{'math':'\\Elzpalh{}'},'\u0322':{'text':'\\Elzrh{}'},'\u0327':{'text':'\\c{}'},'\u0328':{'text':'\\k{}'},'\u032A':{'math':'\\Elzsbbrg{}'},'\u032B':{'text':'{\\fontencoding{LECO}\\selectfont\\char203}'},'\u032F':{'text':'{\\fontencoding{LECO}\\selectfont\\char207}'},'\u0330':{'math':'\\utilde{}'},'\u0331':{'math':'\\underbar{}'},'\u0332':{'math':'\\underline{}'},'\u0335':{'text':'\\Elzxl{}'},'\u0336':{'text':'\\Elzbar{}'},'\u0337':{'text':'{\\fontencoding{LECO}\\selectfont\\char215}'},'\u0338':{'math':'\\not{}'},'\u033A':{'text':'{\\fontencoding{LECO}\\selectfont\\char218}'},'\u033B':{'text':'{\\fontencoding{LECO}\\selectfont\\char219}'},'\u033C':{'text':'{\\fontencoding{LECO}\\selectfont\\char220}'},'\u033D':{'text':'{\\fontencoding{LECO}\\selectfont\\char221}'},'\u0361':{'text':'{\\fontencoding{LECO}\\selectfont\\char225}'},'\u0375':{'text':','},';':{'text':';'},'\u0386':{'text':'\\\'A'},'\u0388':{'text':'\\\'E'},'\u0389':{'text':'\\\'H'},'\u038A':{'text':'\\\'{}{I}'},'\u038C':{'text':'{\\\'{}O}'},'\u038E':{'math':'\\mathrm{\'Y}'},'\u038F':{'math':'\\mathrm{\'\\Omega}'},'\u0390':{'math':'\\acute{\\ddot{\\iota}}'},'\u0391':{'math':'A'},'\u0392':{'math':'B'},'\u0393':{'math':'\\Gamma{}'},'\u0394':{'math':'\\Delta{}'},'\u0395':{'math':'E'},'\u0396':{'math':'Z'},'\u0397':{'math':'H'},'\u0398':{'math':'\\Theta{}'},'\u0399':{'math':'I'},'\u039A':{'math':'K'},'\u039B':{'math':'\\Lambda{}'},'\u039C':{'math':'M'},'\u039D':{'math':'N'},'\u039E':{'math':'\\Xi{}'},'\u039F':{'math':'O'},'\u03A0':{'math':'\\Pi{}'},'\u03A1':{'math':'P'},'\u03A3':{'math':'\\Sigma{}'},'\u03A4':{'math':'T'},'\u03A5':{'math':'\\Upsilon{}'},'\u03A6':{'math':'\\Phi{}'},'\u03A7':{'math':'X'},'\u03A8':{'math':'\\Psi{}'},'\u03A9':{'math':'\\Omega{}'},'\u03AA':{'math':'\\mathrm{\\ddot{I}}'},'\u03AB':{'math':'\\mathrm{\\ddot{Y}}'},'\u03AC':{'text':'{\\\'$\\alpha$}'},'\u03AD':{'math':'\\acute{\\epsilon}'},'\u03AE':{'math':'\\acute{\\eta}'},'\u03AF':{'math':'\\acute{\\iota}'},'\u03B0':{'math':'\\acute{\\ddot{\\upsilon}}'},'\u03B1':{'math':'\\alpha{}'},'\u03B2':{'math':'\\beta{}'},'\u03B3':{'math':'\\gamma{}'},'\u03B4':{'math':'\\delta{}'},'\u03B5':{'math':'\\epsilon{}'},'\u03B6':{'math':'\\zeta{}'},'\u03B7':{'math':'\\eta{}'},'\u03B8':{'math':'\\theta{}','text':'\\texttheta{}'},'\u03B9':{'math':'\\iota{}'},'\u03BA':{'math':'\\kappa{}'},'\u03BB':{'math':'\\lambda{}'},'\u03BC':{'math':'\\mu{}'},'\u03BD':{'math':'\\nu{}'},'\u03BE':{'math':'\\xi{}'},'\u03BF':{'math':'o'},'\u03C0':{'math':'\\pi{}'},'\u03C1':{'math':'\\rho{}'},'\u03C2':{'math':'\\varsigma{}'},'\u03C3':{'math':'\\sigma{}'},'\u03C4':{'math':'\\tau{}'},'\u03C5':{'math':'\\upsilon{}'},'\u03C6':{'math':'\\varphi{}'},'\u03C7':{'math':'\\chi{}'},'\u03C8':{'math':'\\psi{}'},'\u03C9':{'math':'\\omega{}'},'\u03CA':{'math':'\\ddot{\\iota}'},'\u03CB':{'math':'\\ddot{\\upsilon}'},'\u03CC':{'text':'\\\'o'},'\u03CD':{'math':'\\acute{\\upsilon}'},'\u03CE':{'math':'\\acute{\\omega}'},'\u03D0':{'math':'\\varbeta{}','text':'\\Pisymbol{ppi022}{87}'},'\u03D1':{'math':'\\vartheta{}','text':'\\textvartheta{}'},'\u03D2':{'math':'\\Upsilon{}'},'\u03D5':{'math':'\\phi{}'},'\u03D6':{'math':'\\varpi{}'},'\u03D8':{'math':'\\Qoppa{}'},'\u03D9':{'math':'\\qoppa{}'},'\u03DA':{'math':'\\Stigma{}'},'\u03DB':{'math':'\\stigma{}'},'\u03DC':{'math':'\\Digamma{}'},'\u03DD':{'math':'\\digamma{}'},'\u03DE':{'math':'\\Koppa{}'},'\u03DF':{'math':'\\koppa{}'},'\u03E0':{'math':'\\Sampi{}'},'\u03E1':{'math':'\\sampi{}'},'\u03F0':{'math':'\\varkappa{}'},'\u03F1':{'math':'\\varrho{}'},'\u03F4':{'math':'\\upvarTheta{}','text':'\\textTheta{}'},'\u03F5':{'math':'\\epsilon{}'},'\u03F6':{'math':'\\backepsilon{}'},'\u0401':{'text':'\\cyrchar\\CYRYO{}'},'\u0402':{'text':'\\cyrchar\\CYRDJE{}'},'\u0403':{'text':'\\cyrchar{\\\'\\CYRG}'},'\u0404':{'text':'\\cyrchar\\CYRIE{}'},'\u0405':{'text':'\\cyrchar\\CYRDZE{}'},'\u0406':{'text':'\\cyrchar\\CYRII{}'},'\u0407':{'text':'\\cyrchar\\CYRYI{}'},'\u0408':{'text':'\\cyrchar\\CYRJE{}'},'\u0409':{'text':'\\cyrchar\\CYRLJE{}'},'\u040A':{'text':'\\cyrchar\\CYRNJE{}'},'\u040B':{'text':'\\cyrchar\\CYRTSHE{}'},'\u040C':{'text':'\\cyrchar{\\\'\\CYRK}'},'\u040E':{'text':'\\cyrchar\\CYRUSHRT{}'},'\u040F':{'text':'\\cyrchar\\CYRDZHE{}'},'\u0410':{'text':'\\cyrchar\\CYRA{}'},'\u0411':{'text':'\\cyrchar\\CYRB{}'},'\u0412':{'text':'\\cyrchar\\CYRV{}'},'\u0413':{'text':'\\cyrchar\\CYRG{}'},'\u0414':{'text':'\\cyrchar\\CYRD{}'},'\u0415':{'text':'\\cyrchar\\CYRE{}'},'\u0416':{'text':'\\cyrchar\\CYRZH{}'},'\u0417':{'text':'\\cyrchar\\CYRZ{}'},'\u0418':{'text':'\\cyrchar\\CYRI{}'},'\u0419':{'text':'\\cyrchar\\CYRISHRT{}'},'\u041A':{'text':'\\cyrchar\\CYRK{}'},'\u041B':{'text':'\\cyrchar\\CYRL{}'},'\u041C':{'text':'\\cyrchar\\CYRM{}'},'\u041D':{'text':'\\cyrchar\\CYRN{}'},'\u041E':{'text':'\\cyrchar\\CYRO{}'},'\u041F':{'text':'\\cyrchar\\CYRP{}'},'\u0420':{'text':'\\cyrchar\\CYRR{}'},'\u0421':{'text':'\\cyrchar\\CYRS{}'},'\u0422':{'text':'\\cyrchar\\CYRT{}'},'\u0423':{'text':'\\cyrchar\\CYRU{}'},'\u0424':{'text':'\\cyrchar\\CYRF{}'},'\u0425':{'text':'\\cyrchar\\CYRH{}'},'\u0426':{'text':'\\cyrchar\\CYRC{}'},'\u0427':{'text':'\\cyrchar\\CYRCH{}'},'\u0428':{'text':'\\cyrchar\\CYRSH{}'},'\u0429':{'text':'\\cyrchar\\CYRSHCH{}'},'\u042A':{'text':'\\cyrchar\\CYRHRDSN{}'},'\u042B':{'text':'\\cyrchar\\CYRERY{}'},'\u042C':{'text':'\\cyrchar\\CYRSFTSN{}'},'\u042D':{'text':'\\cyrchar\\CYREREV{}'},'\u042E':{'text':'\\cyrchar\\CYRYU{}'},'\u042F':{'text':'\\cyrchar\\CYRYA{}'},'\u0430':{'text':'\\cyrchar\\cyra{}'},'\u0431':{'text':'\\cyrchar\\cyrb{}'},'\u0432':{'text':'\\cyrchar\\cyrv{}'},'\u0433':{'text':'\\cyrchar\\cyrg{}'},'\u0434':{'text':'\\cyrchar\\cyrd{}'},'\u0435':{'text':'\\cyrchar\\cyre{}'},'\u0436':{'text':'\\cyrchar\\cyrzh{}'},'\u0437':{'text':'\\cyrchar\\cyrz{}'},'\u0438':{'text':'\\cyrchar\\cyri{}'},'\u0439':{'text':'\\cyrchar\\cyrishrt{}'},'\u043A':{'text':'\\cyrchar\\cyrk{}'},'\u043B':{'text':'\\cyrchar\\cyrl{}'},'\u043C':{'text':'\\cyrchar\\cyrm{}'},'\u043D':{'text':'\\cyrchar\\cyrn{}'},'\u043E':{'text':'\\cyrchar\\cyro{}'},'\u043F':{'text':'\\cyrchar\\cyrp{}'},'\u0440':{'text':'\\cyrchar\\cyrr{}'},'\u0441':{'text':'\\cyrchar\\cyrs{}'},'\u0442':{'text':'\\cyrchar\\cyrt{}'},'\u0443':{'text':'\\cyrchar\\cyru{}'},'\u0444':{'text':'\\cyrchar\\cyrf{}'},'\u0445':{'text':'\\cyrchar\\cyrh{}'},'\u0446':{'text':'\\cyrchar\\cyrc{}'},'\u0447':{'text':'\\cyrchar\\cyrch{}'},'\u0448':{'text':'\\cyrchar\\cyrsh{}'},'\u0449':{'text':'\\cyrchar\\cyrshch{}'},'\u044A':{'text':'\\cyrchar\\cyrhrdsn{}'},'\u044B':{'text':'\\cyrchar\\cyrery{}'},'\u044C':{'text':'\\cyrchar\\cyrsftsn{}'},'\u044D':{'text':'\\cyrchar\\cyrerev{}'},'\u044E':{'text':'\\cyrchar\\cyryu{}'},'\u044F':{'text':'\\cyrchar\\cyrya{}'},'\u0451':{'text':'\\cyrchar\\cyryo{}'},'\u0452':{'text':'\\cyrchar\\cyrdje{}'},'\u0453':{'text':'\\cyrchar{\\\'\\cyrg}'},'\u0454':{'text':'\\cyrchar\\cyrie{}'},'\u0455':{'text':'\\cyrchar\\cyrdze{}'},'\u0456':{'text':'\\cyrchar\\cyrii{}'},'\u0457':{'text':'\\cyrchar\\cyryi{}'},'\u0458':{'text':'\\cyrchar\\cyrje{}'},'\u0459':{'text':'\\cyrchar\\cyrlje{}'},'\u045A':{'text':'\\cyrchar\\cyrnje{}'},'\u045B':{'text':'\\cyrchar\\cyrtshe{}'},'\u045C':{'text':'\\cyrchar{\\\'\\cyrk}'},'\u045E':{'text':'\\cyrchar\\cyrushrt{}'},'\u045F':{'text':'\\cyrchar\\cyrdzhe{}'},'\u0460':{'text':'\\cyrchar\\CYROMEGA{}'},'\u0461':{'text':'\\cyrchar\\cyromega{}'},'\u0462':{'text':'\\cyrchar\\CYRYAT{}'},'\u0464':{'text':'\\cyrchar\\CYRIOTE{}'},'\u0465':{'text':'\\cyrchar\\cyriote{}'},'\u0466':{'text':'\\cyrchar\\CYRLYUS{}'},'\u0467':{'text':'\\cyrchar\\cyrlyus{}'},'\u0468':{'text':'\\cyrchar\\CYRIOTLYUS{}'},'\u0469':{'text':'\\cyrchar\\cyriotlyus{}'},'\u046A':{'text':'\\cyrchar\\CYRBYUS{}'},'\u046C':{'text':'\\cyrchar\\CYRIOTBYUS{}'},'\u046D':{'text':'\\cyrchar\\cyriotbyus{}'},'\u046E':{'text':'\\cyrchar\\CYRKSI{}'},'\u046F':{'text':'\\cyrchar\\cyrksi{}'},'\u0470':{'text':'\\cyrchar\\CYRPSI{}'},'\u0471':{'text':'\\cyrchar\\cyrpsi{}'},'\u0472':{'text':'\\cyrchar\\CYRFITA{}'},'\u0474':{'text':'\\cyrchar\\CYRIZH{}'},'\u0478':{'text':'\\cyrchar\\CYRUK{}'},'\u0479':{'text':'\\cyrchar\\cyruk{}'},'\u047A':{'text':'\\cyrchar\\CYROMEGARND{}'},'\u047B':{'text':'\\cyrchar\\cyromegarnd{}'},'\u047C':{'text':'\\cyrchar\\CYROMEGATITLO{}'},'\u047D':{'text':'\\cyrchar\\cyromegatitlo{}'},'\u047E':{'text':'\\cyrchar\\CYROT{}'},'\u047F':{'text':'\\cyrchar\\cyrot{}'},'\u0480':{'text':'\\cyrchar\\CYRKOPPA{}'},'\u0481':{'text':'\\cyrchar\\cyrkoppa{}'},'\u0482':{'text':'\\cyrchar\\cyrthousands{}'},'\u0488':{'text':'\\cyrchar\\cyrhundredthousands{}'},'\u0489':{'text':'\\cyrchar\\cyrmillions{}'},'\u048C':{'text':'\\cyrchar\\CYRSEMISFTSN{}'},'\u048D':{'text':'\\cyrchar\\cyrsemisftsn{}'},'\u048E':{'text':'\\cyrchar\\CYRRTICK{}'},'\u048F':{'text':'\\cyrchar\\cyrrtick{}'},'\u0490':{'text':'\\cyrchar\\CYRGUP{}'},'\u0491':{'text':'\\cyrchar\\cyrgup{}'},'\u0492':{'text':'\\cyrchar\\CYRGHCRS{}'},'\u0493':{'text':'\\cyrchar\\cyrghcrs{}'},'\u0494':{'text':'\\cyrchar\\CYRGHK{}'},'\u0495':{'text':'\\cyrchar\\cyrghk{}'},'\u0496':{'text':'\\cyrchar\\CYRZHDSC{}'},'\u0497':{'text':'\\cyrchar\\cyrzhdsc{}'},'\u0498':{'text':'\\cyrchar\\CYRZDSC{}'},'\u0499':{'text':'\\cyrchar\\cyrzdsc{}'},'\u049A':{'text':'\\cyrchar\\CYRKDSC{}'},'\u049B':{'text':'\\cyrchar\\cyrkdsc{}'},'\u049C':{'text':'\\cyrchar\\CYRKVCRS{}'},'\u049D':{'text':'\\cyrchar\\cyrkvcrs{}'},'\u049E':{'text':'\\cyrchar\\CYRKHCRS{}'},'\u049F':{'text':'\\cyrchar\\cyrkhcrs{}'},'\u04A0':{'text':'\\cyrchar\\CYRKBEAK{}'},'\u04A1':{'text':'\\cyrchar\\cyrkbeak{}'},'\u04A2':{'text':'\\cyrchar\\CYRNDSC{}'},'\u04A3':{'text':'\\cyrchar\\cyrndsc{}'},'\u04A4':{'text':'\\cyrchar\\CYRNG{}'},'\u04A5':{'text':'\\cyrchar\\cyrng{}'},'\u04A6':{'text':'\\cyrchar\\CYRPHK{}'},'\u04A7':{'text':'\\cyrchar\\cyrphk{}'},'\u04A8':{'text':'\\cyrchar\\CYRABHHA{}'},'\u04A9':{'text':'\\cyrchar\\cyrabhha{}'},'\u04AA':{'text':'\\cyrchar\\CYRSDSC{}'},'\u04AB':{'text':'\\cyrchar\\cyrsdsc{}'},'\u04AC':{'text':'\\cyrchar\\CYRTDSC{}'},'\u04AD':{'text':'\\cyrchar\\cyrtdsc{}'},'\u04AE':{'text':'\\cyrchar\\CYRY{}'},'\u04AF':{'text':'\\cyrchar\\cyry{}'},'\u04B0':{'text':'\\cyrchar\\CYRYHCRS{}'},'\u04B1':{'text':'\\cyrchar\\cyryhcrs{}'},'\u04B2':{'text':'\\cyrchar\\CYRHDSC{}'},'\u04B3':{'text':'\\cyrchar\\cyrhdsc{}'},'\u04B4':{'text':'\\cyrchar\\CYRTETSE{}'},'\u04B5':{'text':'\\cyrchar\\cyrtetse{}'},'\u04B6':{'text':'\\cyrchar\\CYRCHRDSC{}'},'\u04B7':{'text':'\\cyrchar\\cyrchrdsc{}'},'\u04B8':{'text':'\\cyrchar\\CYRCHVCRS{}'},'\u04B9':{'text':'\\cyrchar\\cyrchvcrs{}'},'\u04BA':{'text':'\\cyrchar\\CYRSHHA{}'},'\u04BB':{'text':'\\cyrchar\\cyrshha{}'},'\u04BC':{'text':'\\cyrchar\\CYRABHCH{}'},'\u04BD':{'text':'\\cyrchar\\cyrabhch{}'},'\u04BE':{'text':'\\cyrchar\\CYRABHCHDSC{}'},'\u04BF':{'text':'\\cyrchar\\cyrabhchdsc{}'},'\u04C0':{'text':'\\cyrchar\\CYRpalochka{}'},'\u04C3':{'text':'\\cyrchar\\CYRKHK{}'},'\u04C4':{'text':'\\cyrchar\\cyrkhk{}'},'\u04C7':{'text':'\\cyrchar\\CYRNHK{}'},'\u04C8':{'text':'\\cyrchar\\cyrnhk{}'},'\u04CB':{'text':'\\cyrchar\\CYRCHLDSC{}'},'\u04CC':{'text':'\\cyrchar\\cyrchldsc{}'},'\u04D4':{'text':'\\cyrchar\\CYRAE{}'},'\u04D5':{'text':'\\cyrchar\\cyrae{}'},'\u04D8':{'text':'\\cyrchar\\CYRSCHWA{}'},'\u04D9':{'text':'\\cyrchar\\cyrschwa{}'},'\u04E0':{'text':'\\cyrchar\\CYRABHDZE{}'},'\u04E1':{'text':'\\cyrchar\\cyrabhdze{}'},'\u04E8':{'text':'\\cyrchar\\CYROTLD{}'},'\u04E9':{'text':'\\cyrchar\\cyrotld{}'},'\u0871':{'math':'\\\\backslash{}'},'\u1E02':{'text':'\\.{B}'},'\u1E03':{'text':'\\.{b}'},'\u1E04':{'text':'{\\d B}'},'\u1E05':{'text':'{\\d b}'},'\u1E06':{'text':'{\\b B}'},'\u1E07':{'text':'{\\b b}'},'\u1E0A':{'text':'\\.{D}'},'\u1E0B':{'text':'\\.{d}'},'\u1E0C':{'text':'{\\d D}'},'\u1E0D':{'text':'{\\d d}'},'\u1E0E':{'text':'{\\b D}'},'\u1E0F':{'text':'{\\b d}'},'\u1E10':{'text':'{\\c D}'},'\u1E11':{'text':'{\\c d}'},'\u1E1E':{'text':'\\.{F}'},'\u1E1F':{'text':'\\.{f}'},'\u1E20':{'text':'\\=G'},'\u1E21':{'text':'\\=g'},'\u1E22':{'text':'\\.{H}'},'\u1E23':{'text':'\\.{h}'},'\u1E24':{'text':'{\\d H}'},'\u1E25':{'text':'{\\d h}'},'\u1E26':{'text':'\\"H'},'\u1E27':{'text':'\\"h'},'\u1E28':{'text':'{\\c H}'},'\u1E29':{'text':'{\\c h}'},'\u1E30':{'text':'\\\'K'},'\u1E31':{'text':'\\\'k'},'\u1E32':{'text':'{\\d K}'},'\u1E33':{'text':'{\\d k}'},'\u1E34':{'text':'{\\b K}'},'\u1E35':{'text':'{\\b k}'},'\u1E36':{'text':'{\\d L}'},'\u1E37':{'text':'{\\d l}'},'\u1E3A':{'text':'{\\b L}'},'\u1E3B':{'text':'{\\b l}'},'\u1E3E':{'text':'\\\'M'},'\u1E3F':{'text':'\\\'m'},'\u1E40':{'text':'\\.{M}'},'\u1E41':{'text':'\\.{m}'},'\u1E42':{'text':'{\\d M}'},'\u1E43':{'text':'{\\d m}'},'\u1E44':{'text':'\\.{N}'},'\u1E45':{'text':'\\.{n}'},'\u1E46':{'text':'{\\d N}'},'\u1E47':{'text':'{\\d n}'},'\u1E48':{'text':'{\\b N}'},'\u1E49':{'text':'{\\b n}'},'\u1E54':{'text':'\\\'P'},'\u1E55':{'text':'\\\'p'},'\u1E56':{'text':'\\.{P}'},'\u1E57':{'text':'\\.{p}'},'\u1E58':{'text':'\\.{R}'},'\u1E59':{'text':'\\.{r}'},'\u1E5A':{'text':'{\\d R}'},'\u1E5B':{'text':'{\\d r}'},'\u1E5E':{'text':'{\\b R}'},'\u1E5F':{'text':'{\\b r}'},'\u1E60':{'text':'\\.{S}'},'\u1E61':{'text':'\\.{s}'},'\u1E62':{'text':'{\\d S}'},'\u1E63':{'text':'{\\d s}'},'\u1E6A':{'text':'\\.{T}'},'\u1E6B':{'text':'\\.{t}'},'\u1E6C':{'text':'{\\d T}'},'\u1E6D':{'text':'{\\d t}'},'\u1E6E':{'text':'{\\b T}'},'\u1E6F':{'text':'{\\b t}'},'\u1E7C':{'text':'\\~V'},'\u1E7D':{'text':'\\~v'},'\u1E7E':{'text':'{\\d V}'},'\u1E7F':{'text':'{\\d v}'},'\u1E80':{'text':'\\`W'},'\u1E81':{'text':'\\`w'},'\u1E82':{'text':'\\\'W'},'\u1E83':{'text':'\\\'w'},'\u1E84':{'text':'\\"W'},'\u1E85':{'text':'\\"w'},'\u1E86':{'text':'\\.{W}'},'\u1E87':{'text':'\\.{w}'},'\u1E88':{'text':'{\\d W}'},'\u1E89':{'text':'{\\d w}'},'\u1E8A':{'text':'\\.{X}'},'\u1E8B':{'text':'\\.{x}'},'\u1E8C':{'text':'\\"X'},'\u1E8D':{'text':'\\"x'},'\u1E8E':{'text':'\\.{Y}'},'\u1E8F':{'text':'\\.{y}'},'\u1E90':{'text':'\\^Z'},'\u1E91':{'text':'\\^z'},'\u1E92':{'text':'{\\d Z}'},'\u1E93':{'text':'{\\d z}'},'\u1E94':{'text':'{\\b Z}'},'\u1E95':{'text':'{\\b z}'},'\u1E96':{'text':'{\\b h}'},'\u1E97':{'text':'\\"t'},'\u1E98':{'text':'{\\r w}'},'\u1E99':{'text':'{\\r y}'},'\u1EA0':{'text':'{\\d A}'},'\u1EA1':{'text':'{\\d a}'},'\u1EB8':{'text':'{\\d E}'},'\u1EB9':{'text':'{\\d e}'},'\u1EBC':{'text':'\\~E'},'\u1EBD':{'text':'\\~e'},'\u1ECA':{'text':'{\\d I}'},'\u1ECB':{'text':'{\\d i}'},'\u1ECC':{'text':'{\\d O}'},'\u1ECD':{'text':'{\\d o}'},'\u1EE4':{'text':'{\\d U}'},'\u1EE5':{'text':'{\\d u}'},'\u1EF2':{'text':'\\`Y'},'\u1EF3':{'text':'\\`y'},'\u1EF4':{'text':'{\\d Y}'},'\u1EF5':{'text':'{\\d y}'},'\u1EF8':{'text':'\\~Y'},'\u1EF9':{'text':'\\~y'},'\u2002':{'text':'\\hspace{0.6em}','space':true},'\u2003':{'math':'\\quad{}','text':'\\hspace{1em}','space':true},'\u2004':{'text':'\\;','space':true},'\u2005':{'text':'\\hspace{0.25em}','space':true},'\u2006':{'text':'\\hspace{0.166em}','space':true},'\u2007':{'text':'\\hphantom{0}','space':true},'\u2008':{'text':'\\hphantom{,}','space':true},'\u2009':{'text':'\\,','space':true},'\u200A':{'space':true,'math':'\\mkern1mu{}'},'\u200B':{'text':'\\mbox{}','space':true},'\u200C':{'text':'{\\aftergroup\\ignorespaces}'},'\u2010':{'text':'-'},'\u2011':{'text':'-'},'\u2012':{'text':'-'},'\u2013':{'text':'\\textendash{}'},'\u2014':{'text':'\\textemdash{}'},'\u2015':{'math':'\\horizbar{}','text':'\\rule{1em}{1pt}'},'\u2016':{'math':'\\Vert{}'},'\u2017':{'math':'\\twolowline{}'},'\u2018':{'text':'`'},'\u2019':{'text':'\''},'\u201A':{'text':','},'\u201B':{'math':'\\Elzreapos{}'},'\u201C':{'text':'``'},'\u201D':{'text':'\'\''},'\u201E':{'text':',,'},'\u201F':{'text':'\\quotedblbase{}'},'\u2020':{'math':'\\dagger{}','text':'\\textdagger{}'},'\u2021':{'math':'\\ddagger{}','text':'\\textdaggerdbl{}'},'\u2022':{'math':'\\bullet{}','text':'\\textbullet{}'},'\u2023':{'text':'>'},'\u2024':{'text':'.'},'\u2025':{'math':'\\enleadertwodots{}','text':'..'},'\u2026':{'math':'\\ldots{}','text':'\\ldots{}'},'\u2027':{'text':'-'},'\u202F':{'text':' ','space':true},'\u2030':{'text':'\\textperthousand{}'},'\u2031':{'text':'\\textpertenthousand{}'},'\u2032':{'math':'{\'}'},'\u2033':{'math':'{\'\'}'},'\u2034':{'math':'{\'\'\'}'},'\u2035':{'math':'\\backprime{}'},'\u2036':{'math':'\\backdprime{}'},'\u2037':{'math':'\\backtrprime{}'},'\u2038':{'math':'\\caretinsert{}'},'\u2039':{'text':'\\guilsinglleft{}'},'\u203A':{'text':'\\guilsinglright{}'},'\u203C':{'math':'\\Exclam{}'},'\u203E':{'text':'-'},'\u2040':{'math':'\\cat{}'},'\u2043':{'math':'\\hyphenbullet{}'},'\u2044':{'math':'\\fracslash{}'},'\u2047':{'math':'\\Question{}'},'\u2048':{'text':'?!'},'\u2049':{'text':'!?'},'\u204A':{'text':'7'},'\u2050':{'math':'\\closure{}'},'\u2057':{'math':'\'\'\'\''},'\u205F':{'math':'\\:','text':'\\:','space':true},'\u2060':{'text':'\\nolinebreak{}'},'\u2070':{'math':'^{0}'},'\u2074':{'math':'^{4}'},'\u2075':{'math':'^{5}'},'\u2076':{'math':'^{6}'},'\u2077':{'math':'^{7}'},'\u2078':{'math':'^{8}'},'\u2079':{'math':'^{9}'},'\u207A':{'math':'^{+}'},'\u207B':{'math':'^{-}'},'\u207C':{'math':'^{=}'},'\u207D':{'math':'^{(}'},'\u207E':{'math':'^{)}'},'\u207F':{'math':'^{n}'},'\u2080':{'math':'_{0}'},'\u2081':{'math':'_{1}'},'\u2082':{'math':'_{2}'},'\u2083':{'math':'_{3}'},'\u2084':{'math':'_{4}'},'\u2085':{'math':'_{5}'},'\u2086':{'math':'_{6}'},'\u2087':{'math':'_{7}'},'\u2088':{'math':'_{8}'},'\u2089':{'math':'_{9}'},'\u208A':{'math':'_{+}'},'\u208B':{'math':'_{-}'},'\u208C':{'math':'_{=}'},'\u208D':{'math':'_{(}'},'\u208E':{'math':'_{)}'},'\u20A7':{'text':'\\ensuremath{\\Elzpes}'},'\u20AC':{'math':'\\euro{}','text':'\\texteuro{}'},'\u20D0':{'math':'\\lvec{}'},'\u20D1':{'math':'\\vec{}'},'\u20D2':{'math':'\\vertoverlay{}'},'\u20D6':{'math':'\\LVec{}'},'\u20D7':{'math':'\\vec{}'},'\u20DB':{'math':'\\dddot{}'},'\u20DC':{'math':'\\ddddot{}'},'\u20DD':{'math':'\\enclosecircle{}'},'\u20DE':{'math':'\\enclosesquare{}'},'\u20DF':{'math':'\\enclosediamond{}'},'\u20E1':{'math':'\\overleftrightarrow{}'},'\u20E4':{'math':'\\enclosetriangle{}'},'\u20E7':{'math':'\\annuity{}'},'\u20E8':{'math':'\\threeunderdot{}'},'\u20E9':{'math':'\\widebridgeabove{}'},'\u20EC':{'math':'\\underrightharpoondown{}'},'\u20ED':{'math':'\\underleftharpoondown{}'},'\u20EE':{'math':'\\underleftarrow{}'},'\u20EF':{'math':'\\underrightarrow{}'},'\u20F0':{'math':'\\asteraccent{}'},'\u2100':{'text':'a/c'},'\u2101':{'text':'a/s'},'\u2102':{'math':'\\mathbb{C}'},'\u2103':{'text':'\\textcelsius{}'},'\u2105':{'text':'c/o'},'\u2106':{'text':'c/u'},'\u2107':{'math':'\\Euler{}'},'\u2109':{'text':'F'},'\u210A':{'math':'\\mathscr{g}'},'\u210B':{'math':'\\mathscr{H}'},'\u210C':{'math':'\\mathfrak{H}'},'\u210D':{'math':'\\mathbb{H}'},'\u210E':{'math':'\\Planckconst{}'},'\u210F':{'math':'\\hslash{}'},'\u2110':{'math':'\\mathscr{I}'},'\u2111':{'math':'\\mathfrak{I}'},'\u2112':{'math':'\\mathscr{L}'},'\u2113':{'math':'\\mathscr{l}'},'\u2115':{'math':'\\mathbb{N}'},'\u2116':{'text':'\\cyrchar\\textnumero{}'},'\u2117':{'text':'\\textcircledP{}'},'\u2118':{'math':'\\wp{}'},'\u2119':{'math':'\\mathbb{P}'},'\u211A':{'math':'\\mathbb{Q}'},'\u211B':{'math':'\\mathscr{R}'},'\u211C':{'math':'\\mathfrak{R}'},'\u211D':{'math':'\\mathbb{R}'},'\u211E':{'math':'\\Elzxrat{}'},'\u2120':{'text':'\\textservicemark{}'},'\u2121':{'text':'TEL'},'\u2122':{'text':'\\texttrademark{}'},'\u2124':{'math':'\\mathbb{Z}'},'\u2127':{'math':'\\mho{}'},'\u2128':{'math':'\\mathfrak{Z}'},'\u2129':{'math':'\\ElsevierGlyph{2129}'},'K':{'text':'K'},'\u212C':{'math':'\\mathscr{B}'},'\u212D':{'math':'\\mathfrak{C}'},'\u212E':{'text':'\\textestimated{}'},'\u212F':{'math':'\\mathscr{e}'},'\u2130':{'math':'\\mathscr{E}'},'\u2131':{'math':'\\mathscr{F}'},'\u2132':{'math':'\\Finv{}'},'\u2133':{'math':'\\mathscr{M}'},'\u2134':{'math':'\\mathscr{o}'},'\u2135':{'math':'\\aleph{}'},'\u2136':{'math':'\\beth{}'},'\u2137':{'math':'\\gimel{}'},'\u2138':{'math':'\\daleth{}'},'\u213C':{'math':'\\mathbb{\\pi}'},'\u213D':{'math':'\\mathbb{\\gamma}'},'\u213E':{'math':'\\mathbb{\\Gamma}'},'\u213F':{'math':'\\mathbb{\\Pi}'},'\u2140':{'math':'\\mathbb{\\Sigma}'},'\u2141':{'math':'\\Game{}'},'\u2142':{'math':'\\sansLturned{}'},'\u2143':{'math':'\\sansLmirrored{}'},'\u2144':{'math':'\\Yup{}'},'\u2145':{'math':'\\CapitalDifferentialD{}'},'\u2146':{'math':'\\DifferentialD{}'},'\u2147':{'math':'\\ExponetialE{}'},'\u2148':{'math':'\\ComplexI{}'},'\u2149':{'math':'\\ComplexJ{}'},'\u214A':{'math':'\\PropertyLine{}'},'\u214B':{'math':'\\invamp{}'},'\u2153':{'math':'\\textfrac{1}{3}'},'\u2154':{'math':'\\textfrac{2}{3}'},'\u2155':{'math':'\\textfrac{1}{5}'},'\u2156':{'math':'\\textfrac{2}{5}'},'\u2157':{'math':'\\textfrac{3}{5}'},'\u2158':{'math':'\\textfrac{4}{5}'},'\u2159':{'math':'\\textfrac{1}{6}'},'\u215A':{'math':'\\textfrac{5}{6}'},'\u215B':{'math':'\\textfrac{1}{8}'},'\u215C':{'math':'\\textfrac{3}{8}'},'\u215D':{'math':'\\textfrac{5}{8}'},'\u215E':{'math':'\\textfrac{7}{8}'},'\u215F':{'text':' 1/'},'\u2160':{'text':'I'},'\u2161':{'text':'II'},'\u2162':{'text':'III'},'\u2163':{'text':'IV'},'\u2164':{'text':'V'},'\u2165':{'text':'VI'},'\u2166':{'text':'VII'},'\u2167':{'text':'VIII'},'\u2168':{'text':'IX'},'\u2169':{'text':'X'},'\u216A':{'text':'XI'},'\u216B':{'text':'XII'},'\u216C':{'text':'L'},'\u216D':{'text':'C'},'\u216E':{'text':'D'},'\u216F':{'text':'M'},'\u2170':{'text':'i'},'\u2171':{'text':'ii'},'\u2172':{'text':'iii'},'\u2173':{'text':'iv'},'\u2174':{'text':'v'},'\u2175':{'text':'vi'},'\u2176':{'text':'vii'},'\u2177':{'text':'viii'},'\u2178':{'text':'ix'},'\u2179':{'text':'x'},'\u217A':{'text':'xi'},'\u217B':{'text':'xii'},'\u217C':{'text':'l'},'\u217D':{'text':'c'},'\u217E':{'text':'d'},'\u217F':{'text':'m'},'\u2190':{'math':'\\leftarrow{}'},'\u2191':{'math':'\\uparrow{}'},'\u2192':{'math':'\\rightarrow{}'},'\u2193':{'math':'\\downarrow{}'},'\u2194':{'math':'\\leftrightarrow{}'},'\u2195':{'math':'\\updownarrow{}'},'\u2196':{'math':'\\nwarrow{}'},'\u2197':{'math':'\\nearrow{}'},'\u2198':{'math':'\\searrow{}'},'\u2199':{'math':'\\swarrow{}'},'\u219A':{'math':'\\nleftarrow{}'},'\u219B':{'math':'\\nrightarrow{}'},'\u219C':{'math':'\\arrowwaveleft{}'},'\u219D':{'math':'\\arrowwaveright{}'},'\u219E':{'math':'\\twoheadleftarrow{}'},'\u219F':{'math':'\\twoheaduparrow{}'},'\u21A0':{'math':'\\twoheadrightarrow{}'},'\u21A1':{'math':'\\twoheaddownarrow{}'},'\u21A2':{'math':'\\leftarrowtail{}'},'\u21A3':{'math':'\\rightarrowtail{}'},'\u21A4':{'math':'\\mapsfrom{}'},'\u21A5':{'math':'\\MapsUp{}'},'\u21A6':{'math':'\\mapsto{}'},'\u21A7':{'math':'\\MapsDown{}'},'\u21A8':{'math':'\\updownarrowbar{}'},'\u21A9':{'math':'\\hookleftarrow{}'},'\u21AA':{'math':'\\hookrightarrow{}'},'\u21AB':{'math':'\\looparrowleft{}'},'\u21AC':{'math':'\\looparrowright{}'},'\u21AD':{'math':'\\leftrightsquigarrow{}'},'\u21AE':{'math':'\\nleftrightarrow{}'},'\u21AF':{'math':'\\lightning{}'},'\u21B0':{'math':'\\Lsh{}'},'\u21B1':{'math':'\\Rsh{}'},'\u21B2':{'math':'\\dlsh{}'},'\u21B3':{'math':'\\ElsevierGlyph{21B3}'},'\u21B4':{'math':'\\linefeed{}'},'\u21B5':{'math':'\\carriagereturn{}'},'\u21B6':{'math':'\\curvearrowleft{}'},'\u21B7':{'math':'\\curvearrowright{}'},'\u21B8':{'math':'\\barovernorthwestarrow{}'},'\u21B9':{'math':'\\barleftarrowrightarrowba{}'},'\u21BA':{'math':'\\circlearrowleft{}'},'\u21BB':{'math':'\\circlearrowright{}'},'\u21BC':{'math':'\\leftharpoonup{}'},'\u21BD':{'math':'\\leftharpoondown{}'},'\u21BE':{'math':'\\upharpoonright{}'},'\u21BF':{'math':'\\upharpoonleft{}'},'\u21C0':{'math':'\\rightharpoonup{}'},'\u21C1':{'math':'\\rightharpoondown{}'},'\u21C2':{'math':'\\downharpoonright{}'},'\u21C3':{'math':'\\downharpoonleft{}'},'\u21C4':{'math':'\\rightleftarrows{}'},'\u21C5':{'math':'\\dblarrowupdown{}'},'\u21C6':{'math':'\\leftrightarrows{}'},'\u21C7':{'math':'\\leftleftarrows{}'},'\u21C8':{'math':'\\upuparrows{}'},'\u21C9':{'math':'\\rightrightarrows{}'},'\u21CA':{'math':'\\downdownarrows{}'},'\u21CB':{'math':'\\leftrightharpoons{}'},'\u21CC':{'math':'\\rightleftharpoons{}'},'\u21CD':{'math':'\\nLeftarrow{}'},'\u21CE':{'math':'\\nLeftrightarrow{}'},'\u21CF':{'math':'\\nRightarrow{}'},'\u21D0':{'math':'\\Leftarrow{}'},'\u21D1':{'math':'\\Uparrow{}'},'\u21D2':{'math':'\\Rightarrow{}'},'\u21D3':{'math':'\\Downarrow{}'},'\u21D4':{'math':'\\Leftrightarrow{}'},'\u21D5':{'math':'\\Updownarrow{}'},'\u21D6':{'math':'\\Nwarrow{}'},'\u21D7':{'math':'\\Nearrow{}'},'\u21D8':{'math':'\\Searrow{}'},'\u21D9':{'math':'\\Swarrow{}'},'\u21DA':{'math':'\\Lleftarrow{}'},'\u21DB':{'math':'\\Rrightarrow{}'},'\u21DC':{'math':'\\leftsquigarrow{}'},'\u21DD':{'math':'\\rightsquigarrow{}'},'\u21DE':{'math':'\\nHuparrow{}'},'\u21DF':{'math':'\\nHdownarrow{}'},'\u21E0':{'math':'\\dashleftarrow{}'},'\u21E1':{'math':'\\updasharrow{}'},'\u21E2':{'math':'\\dashrightarrow{}'},'\u21E3':{'math':'\\downdasharrow{}'},'\u21E4':{'math':'\\LeftArrowBar{}'},'\u21E5':{'math':'\\RightArrowBar{}'},'\u21E6':{'math':'\\leftwhitearrow{}'},'\u21E7':{'math':'\\upwhitearrow{}'},'\u21E8':{'math':'\\rightwhitearrow{}'},'\u21E9':{'math':'\\downwhitearrow{}'},'\u21EA':{'math':'\\whitearrowupfrombar{}'},'\u21F4':{'math':'\\circleonrightarrow{}'},'\u21F5':{'math':'\\DownArrowUpArrow{}'},'\u21F6':{'math':'\\rightthreearrows{}'},'\u21F7':{'math':'\\nvleftarrow{}'},'\u21F8':{'math':'\\pfun{}'},'\u21F9':{'math':'\\nvleftrightarrow{}'},'\u21FA':{'math':'\\nVleftarrow{}'},'\u21FB':{'math':'\\ffun{}'},'\u21FC':{'math':'\\nVleftrightarrow{}'},'\u21FD':{'math':'\\leftarrowtriangle{}'},'\u21FE':{'math':'\\rightarrowtriangle{}'},'\u21FF':{'math':'\\leftrightarrowtriangle{}'},'\u2200':{'math':'\\forall{}'},'\u2201':{'math':'\\complement{}'},'\u2202':{'math':'\\partial{}'},'\u2203':{'math':'\\exists{}'},'\u2204':{'math':'\\nexists{}'},'\u2205':{'math':'\\varnothing{}'},'\u2206':{'math':'\\increment{}'},'\u2207':{'math':'\\nabla{}'},'\u2208':{'math':'\\in{}'},'\u2209':{'math':'\\not\\in{}'},'\u220A':{'math':'\\smallin{}'},'\u220B':{'math':'\\ni{}'},'\u220C':{'math':'\\not\\ni{}'},'\u220D':{'math':'\\smallni{}'},'\u220E':{'math':'\\QED{}'},'\u220F':{'math':'\\prod{}'},'\u2210':{'math':'\\coprod{}'},'\u2211':{'math':'\\sum{}'},'\u2212':{'math':'-','text':'-'},'\u2213':{'math':'\\mp{}'},'\u2214':{'math':'\\dotplus{}'},'\u2215':{'math':'\\slash{}'},'\u2216':{'math':'\\setminus{}'},'\u2217':{'math':'{_\\ast}'},'\u2218':{'math':'\\circ{}'},'\u2219':{'math':'\\bullet{}'},'\u221A':{'math':'\\surd{}'},'\u221B':{'math':'\\sqrt[3]'},'\u221C':{'math':'\\sqrt[4]'},'\u221D':{'math':'\\propto{}'},'\u221E':{'math':'\\infty{}'},'\u221F':{'math':'\\rightangle{}'},'\u2220':{'math':'\\angle{}'},'\u2221':{'math':'\\measuredangle{}'},'\u2222':{'math':'\\sphericalangle{}'},'\u2223':{'math':'\\mid{}'},'\u2224':{'math':'\\nmid{}'},'\u2225':{'math':'\\parallel{}'},'\u2226':{'math':'\\nparallel{}'},'\u2227':{'math':'\\wedge{}'},'\u2228':{'math':'\\vee{}'},'\u2229':{'math':'\\cap{}'},'\u222A':{'math':'\\cup{}'},'\u222B':{'math':'\\int{}'},'\u222C':{'math':'{\\int\\!\\int}'},'\u222D':{'math':'{\\int\\!\\int\\!\\int}'},'\u222E':{'math':'\\oint{}'},'\u222F':{'math':'\\surfintegral{}'},'\u2230':{'math':'\\volintegral{}'},'\u2231':{'math':'\\clwintegral{}'},'\u2232':{'math':'\\ElsevierGlyph{2232}'},'\u2233':{'math':'\\ElsevierGlyph{2233}'},'\u2234':{'math':'\\therefore{}'},'\u2235':{'math':'\\because{}'},'\u2236':{'math':':'},'\u2237':{'math':'\\Colon{}'},'\u2238':{'math':'\\ElsevierGlyph{2238}'},'\u2239':{'math':'\\eqcolon{}'},'\u223A':{'math':'\\mathbin{{:}\\!\\!{-}\\!\\!{:}}'},'\u223B':{'math':'\\homothetic{}'},'\u223C':{'math':'\\sim{}'},'\u223D':{'math':'\\backsim{}'},'\u223E':{'math':'\\lazysinv{}'},'\u223F':{'math':'\\AC{}'},'\u2240':{'math':'\\wr{}'},'\u2241':{'math':'\\not\\sim{}'},'\u2242':{'math':'\\ElsevierGlyph{2242}'},'\u2243':{'math':'\\simeq{}'},'\u2244':{'math':'\\not\\simeq{}'},'\u2245':{'math':'\\cong{}'},'\u2246':{'math':'\\approxnotequal{}'},'\u2247':{'math':'\\not\\cong{}'},'\u2248':{'math':'\\approx{}'},'\u2249':{'math':'\\not\\approx{}'},'\u224A':{'math':'\\approxeq{}'},'\u224B':{'math':'\\tildetrpl{}'},'\u224C':{'math':'\\allequal{}'},'\u224D':{'math':'\\asymp{}'},'\u224E':{'math':'\\Bumpeq{}'},'\u224F':{'math':'\\bumpeq{}'},'\u2250':{'math':'\\doteq{}'},'\u2251':{'math':'\\doteqdot{}'},'\u2252':{'math':'\\fallingdotseq{}'},'\u2253':{'math':'\\risingdotseq{}'},'\u2254':{'math':'\\coloneq{}','text':':='},'\u2255':{'math':'=:'},'\u2256':{'math':'\\eqcirc{}'},'\u2257':{'math':'\\circeq{}'},'\u2258':{'math':'\\arceq{}'},'\u2259':{'math':'\\estimates{}'},'\u225A':{'math':'\\ElsevierGlyph{225A}'},'\u225B':{'math':'\\starequal{}'},'\u225C':{'math':'\\triangleq{}'},'\u225D':{'math':'\\eqdef{}'},'\u225E':{'math':'\\measeq{}'},'\u225F':{'math':'\\ElsevierGlyph{225F}'},'\u2260':{'math':'\\not ='},'\u2261':{'math':'\\equiv{}'},'\u2262':{'math':'\\not\\equiv{}'},'\u2263':{'math':'\\Equiv{}'},'\u2264':{'math':'\\leq{}'},'\u2265':{'math':'\\geq{}'},'\u2266':{'math':'\\leqq{}'},'\u2267':{'math':'\\geqq{}'},'\u2268':{'math':'\\lneqq{}'},'\u2269':{'math':'\\gneqq{}'},'\u226A':{'math':'\\ll{}'},'\u226B':{'math':'\\gg{}'},'\u226C':{'math':'\\between{}'},'\u226D':{'math':'{\\not\\kern-0.3em\\times}'},'\u226E':{'math':'\\not<'},'\u226F':{'math':'\\not>'},'\u2270':{'math':'\\not\\leq{}'},'\u2271':{'math':'\\not\\geq{}'},'\u2272':{'math':'\\lessequivlnt{}'},'\u2273':{'math':'\\greaterequivlnt{}'},'\u2274':{'math':'\\ElsevierGlyph{2274}'},'\u2275':{'math':'\\ElsevierGlyph{2275}'},'\u2276':{'math':'\\lessgtr{}'},'\u2277':{'math':'\\gtrless{}'},'\u2278':{'math':'\\notlessgreater{}'},'\u2279':{'math':'\\notgreaterless{}'},'\u227A':{'math':'\\prec{}'},'\u227B':{'math':'\\succ{}'},'\u227C':{'math':'\\preccurlyeq{}'},'\u227D':{'math':'\\succcurlyeq{}'},'\u227E':{'math':'\\precapprox{}'},'\u227F':{'math':'\\succapprox{}'},'\u2280':{'math':'\\not\\prec{}'},'\u2281':{'math':'\\not\\succ{}'},'\u2282':{'math':'\\subset{}'},'\u2283':{'math':'\\supset{}'},'\u2284':{'math':'\\not\\subset{}'},'\u2285':{'math':'\\not\\supset{}'},'\u2286':{'math':'\\subseteq{}'},'\u2287':{'math':'\\supseteq{}'},'\u2288':{'math':'\\not\\subseteq{}'},'\u2289':{'math':'\\not\\supseteq{}'},'\u228A':{'math':'\\subsetneq{}'},'\u228B':{'math':'\\supsetneq{}'},'\u228C':{'math':'\\cupleftarrow{}'},'\u228D':{'math':'\\cupdot{}'},'\u228E':{'math':'\\uplus{}'},'\u228F':{'math':'\\sqsubset{}'},'\u2290':{'math':'\\sqsupset{}'},'\u2291':{'math':'\\sqsubseteq{}'},'\u2292':{'math':'\\sqsupseteq{}'},'\u2293':{'math':'\\sqcap{}'},'\u2294':{'math':'\\sqcup{}'},'\u2295':{'math':'\\oplus{}'},'\u2296':{'math':'\\ominus{}'},'\u2297':{'math':'\\otimes{}'},'\u2298':{'math':'\\oslash{}'},'\u2299':{'math':'\\odot{}'},'\u229A':{'math':'\\circledcirc{}'},'\u229B':{'math':'\\circledast{}'},'\u229C':{'math':'\\circledequal{}'},'\u229D':{'math':'\\circleddash{}'},'\u229E':{'math':'\\boxplus{}'},'\u229F':{'math':'\\boxminus{}'},'\u22A0':{'math':'\\boxtimes{}'},'\u22A1':{'math':'\\boxdot{}'},'\u22A2':{'math':'\\vdash{}'},'\u22A3':{'math':'\\dashv{}'},'\u22A4':{'math':'\\top{}'},'\u22A5':{'math':'\\perp{}'},'\u22A6':{'math':'\\assert{}'},'\u22A7':{'math':'\\truestate{}'},'\u22A8':{'math':'\\forcesextra{}'},'\u22A9':{'math':'\\Vdash{}'},'\u22AA':{'math':'\\Vvdash{}'},'\u22AB':{'math':'\\VDash{}'},'\u22AC':{'math':'\\nvdash{}'},'\u22AD':{'math':'\\nvDash{}'},'\u22AE':{'math':'\\nVdash{}'},'\u22AF':{'math':'\\nVDash{}'},'\u22B0':{'math':'\\prurel{}'},'\u22B1':{'math':'\\scurel{}'},'\u22B2':{'math':'\\vartriangleleft{}'},'\u22B3':{'math':'\\vartriangleright{}'},'\u22B4':{'math':'\\trianglelefteq{}'},'\u22B5':{'math':'\\trianglerighteq{}'},'\u22B6':{'math':'\\original{}'},'\u22B7':{'math':'\\image{}'},'\u22B8':{'math':'\\multimap{}'},'\u22B9':{'math':'\\hermitconjmatrix{}'},'\u22BA':{'math':'\\intercal{}'},'\u22BB':{'math':'\\veebar{}'},'\u22BC':{'math':'\\barwedge{}'},'\u22BD':{'math':'\\barvee{}'},'\u22BE':{'math':'\\rightanglearc{}'},'\u22BF':{'math':'\\varlrtriangle{}'},'\u22C0':{'math':'\\ElsevierGlyph{22C0}'},'\u22C1':{'math':'\\ElsevierGlyph{22C1}'},'\u22C2':{'math':'\\bigcap{}'},'\u22C3':{'math':'\\bigcup{}'},'\u22C4':{'math':'\\diamond{}'},'\u22C5':{'math':'\\cdot{}'},'\u22C6':{'math':'\\star{}'},'\u22C7':{'math':'\\divideontimes{}'},'\u22C8':{'math':'\\bowtie{}'},'\u22C9':{'math':'\\ltimes{}'},'\u22CA':{'math':'\\rtimes{}'},'\u22CB':{'math':'\\leftthreetimes{}'},'\u22CC':{'math':'\\rightthreetimes{}'},'\u22CD':{'math':'\\backsimeq{}'},'\u22CE':{'math':'\\curlyvee{}'},'\u22CF':{'math':'\\curlywedge{}'},'\u22D0':{'math':'\\Subset{}'},'\u22D1':{'math':'\\Supset{}'},'\u22D2':{'math':'\\Cap{}'},'\u22D3':{'math':'\\Cup{}'},'\u22D4':{'math':'\\pitchfork{}'},'\u22D5':{'math':'\\hash{}'},'\u22D6':{'math':'\\lessdot{}'},'\u22D7':{'math':'\\gtrdot{}'},'\u22D8':{'math':'\\verymuchless{}'},'\u22D9':{'math':'\\verymuchgreater{}'},'\u22DA':{'math':'\\lesseqgtr{}'},'\u22DB':{'math':'\\gtreqless{}'},'\u22DC':{'math':'\\eqless{}'},'\u22DD':{'math':'\\eqgtr{}'},'\u22DE':{'math':'\\curlyeqprec{}'},'\u22DF':{'math':'\\curlyeqsucc{}'},'\u22E0':{'math':'\\npreceq{}'},'\u22E1':{'math':'\\nsucceq{}'},'\u22E2':{'math':'\\not\\sqsubseteq{}'},'\u22E3':{'math':'\\not\\sqsupseteq{}'},'\u22E4':{'math':'\\sqsubsetneq{}'},'\u22E5':{'math':'\\Elzsqspne{}'},'\u22E6':{'math':'\\lnsim{}'},'\u22E7':{'math':'\\gnsim{}'},'\u22E8':{'math':'\\precedesnotsimilar{}'},'\u22E9':{'math':'\\succnsim{}'},'\u22EA':{'math':'\\ntriangleleft{}'},'\u22EB':{'math':'\\ntriangleright{}'},'\u22EC':{'math':'\\ntrianglelefteq{}'},'\u22ED':{'math':'\\ntrianglerighteq{}'},'\u22EE':{'math':'\\vdots{}'},'\u22EF':{'math':'\\cdots{}'},'\u22F0':{'math':'\\upslopeellipsis{}'},'\u22F1':{'math':'\\downslopeellipsis{}'},'\u22F2':{'math':'\\disin{}'},'\u22F3':{'math':'\\varisins{}'},'\u22F4':{'math':'\\isins{}'},'\u22F5':{'math':'\\isindot{}'},'\u22F6':{'math':'\\barin{}'},'\u22F7':{'math':'\\isinobar{}'},'\u22F8':{'math':'\\isinvb{}'},'\u22F9':{'math':'\\isinE{}'},'\u22FA':{'math':'\\nisd{}'},'\u22FB':{'math':'\\varnis{}'},'\u22FC':{'math':'\\nis{}'},'\u22FD':{'math':'\\varniobar{}'},'\u22FE':{'math':'\\niobar{}'},'\u22FF':{'math':'\\bagmember{}'},'\u2300':{'math':'\\diameter{}'},'\u2302':{'math':'\\house{}'},'\u2305':{'math':'\\varbarwedge{}','text':'\\barwedge{}'},'\u2306':{'math':'\\perspcorrespond{}'},'\u2308':{'math':'\\lceil{}'},'\u2309':{'math':'\\rceil{}'},'\u230A':{'math':'\\lfloor{}'},'\u230B':{'math':'\\rfloor{}'},'\u2310':{'math':'\\invneg{}'},'\u2311':{'math':'\\wasylozenge{}'},'\u2312':{'math':'\\profline{}'},'\u2313':{'math':'\\profsurf{}'},'\u2315':{'math':'\\recorder{}'},'\u2316':{'math':'{\\mathchar"2208}'},'\u2317':{'math':'\\viewdata{}'},'\u2319':{'math':'\\turnednot{}'},'\u231C':{'math':'\\ulcorner{}'},'\u231D':{'math':'\\urcorner{}'},'\u231E':{'math':'\\llcorner{}'},'\u231F':{'math':'\\lrcorner{}'},'\u2320':{'math':'\\inttop{}'},'\u2321':{'math':'\\intbottom{}'},'\u2322':{'math':'\\frown{}'},'\u2323':{'math':'\\smile{}'},'\u3008':{'math':'\\langle{}'},'\u3009':{'math':'\\rangle{}'},'\u232C':{'math':'\\varhexagonlrbonds{}'},'\u2332':{'math':'\\conictaper{}'},'\u2336':{'math':'\\topbot{}'},'\u2339':{'math':'\\APLinv{}'},'\u233D':{'math':'\\ElsevierGlyph{E838}'},'\u233F':{'math':'\\notslash{}'},'\u2340':{'math':'\\notbackslash{}'},'\u2347':{'math':'\\APLleftarrowbox{}'},'\u2348':{'math':'\\APLrightarrowbox{}'},'\u2349':{'math':'\\invdiameter{}'},'\u2350':{'math':'\\APLuparrowbox{}'},'\u2353':{'math':'\\APLboxupcaret{}'},'\u2357':{'math':'\\APLdownarrowbox{}'},'\u235D':{'math':'\\APLcomment{}'},'\u235E':{'math':'\\APLinput{}'},'\u235F':{'math':'\\APLlog{}'},'\u2370':{'math':'\\APLboxquestion{}'},'\u237C':{'math':'\\rangledownzigzagarrow{}'},'\u2394':{'math':'\\hexagon{}'},'\u239B':{'math':'\\lparenuend{}'},'\u239C':{'math':'\\lparenextender{}'},'\u239D':{'math':'\\lparenlend{}'},'\u239E':{'math':'\\rparenuend{}'},'\u239F':{'math':'\\rparenextender{}'},'\u23A0':{'math':'\\rparenlend{}'},'\u23A1':{'math':'\\lbrackuend{}'},'\u23A2':{'math':'\\lbrackextender{}'},'\u23A3':{'math':'\\Elzdlcorn{}'},'\u23A4':{'math':'\\rbrackuend{}'},'\u23A5':{'math':'\\rbrackextender{}'},'\u23A6':{'math':'\\rbracklend{}'},'\u23A7':{'math':'\\lbraceuend{}'},'\u23A8':{'math':'\\lbracemid{}'},'\u23A9':{'math':'\\lbracelend{}'},'\u23AA':{'math':'\\vbraceextender{}'},'\u23AB':{'math':'\\rbraceuend{}'},'\u23AC':{'math':'\\rbracemid{}'},'\u23AD':{'math':'\\rbracelend{}'},'\u23AE':{'math':'\\intextender{}'},'\u23AF':{'math':'\\harrowextender{}'},'\u23B0':{'math':'\\lmoustache{}'},'\u23B1':{'math':'\\rmoustache{}'},'\u23B2':{'math':'\\sumtop{}'},'\u23B3':{'math':'\\sumbottom{}'},'\u23B4':{'math':'\\overbracket{}'},'\u23B5':{'math':'\\underbracket{}'},'\u23B6':{'math':'\\bbrktbrk{}'},'\u23B7':{'math':'\\sqrtbottom{}'},'\u23B8':{'math':'\\lvboxline{}'},'\u23B9':{'math':'\\rvboxline{}'},'\u23CE':{'math':'\\varcarriagereturn{}'},'\u23DC':{'math':'\\overparen{}'},'\u23DD':{'math':'\\underparen{}'},'\u23DE':{'math':'\\overbrace{}'},'\u23DF':{'math':'\\underbrace{}'},'\u23E0':{'math':'\\obrbrak{}'},'\u23E1':{'math':'\\ubrbrak{}'},'\u23E2':{'math':'\\trapezium{}'},'\u23E3':{'math':'\\benzenr{}'},'\u23E4':{'math':'\\strns{}'},'\u23E5':{'math':'\\fltns{}'},'\u23E6':{'math':'\\accurrent{}'},'\u23E7':{'math':'\\elinters{}'},'\u2400':{'text':'NUL'},'\u2401':{'text':'SOH'},'\u2402':{'text':'STX'},'\u2403':{'text':'ETX'},'\u2404':{'text':'EOT'},'\u2405':{'text':'ENQ'},'\u2406':{'text':'ACK'},'\u2407':{'text':'BEL'},'\u2408':{'text':'BS'},'\u2409':{'text':'HT'},'\u240A':{'text':'LF'},'\u240B':{'text':'VT'},'\u240C':{'text':'FF'},'\u240D':{'text':'CR'},'\u240E':{'text':'SO'},'\u240F':{'text':'SI'},'\u2410':{'text':'DLE'},'\u2411':{'text':'DC1'},'\u2412':{'text':'DC2'},'\u2413':{'text':'DC3'},'\u2414':{'text':'DC4'},'\u2415':{'text':'NAK'},'\u2416':{'text':'SYN'},'\u2417':{'text':'ETB'},'\u2418':{'text':'CAN'},'\u2419':{'text':'EM'},'\u241A':{'text':'SUB'},'\u241B':{'text':'ESC'},'\u241C':{'text':'FS'},'\u241D':{'text':'GS'},'\u241E':{'text':'RS'},'\u241F':{'text':'US'},'\u2420':{'text':'SP'},'\u2421':{'text':'DEL'},'\u2423':{'text':'\\textvisiblespace{}'},'\u2424':{'text':'NL'},'\u2425':{'text':'///'},'\u2426':{'text':'?'},'\u2460':{'text':'\\ding{172}'},'\u2461':{'text':'\\ding{173}'},'\u2462':{'text':'\\ding{174}'},'\u2463':{'text':'\\ding{175}'},'\u2464':{'text':'\\ding{176}'},'\u2465':{'text':'\\ding{177}'},'\u2466':{'text':'\\ding{178}'},'\u2467':{'text':'\\ding{179}'},'\u2468':{'text':'\\ding{180}'},'\u2469':{'text':'\\ding{181}'},'\u246A':{'text':'(11)'},'\u246B':{'text':'(12)'},'\u246C':{'text':'(13)'},'\u246D':{'text':'(14)'},'\u246E':{'text':'(15)'},'\u246F':{'text':'(16)'},'\u2470':{'text':'(17)'},'\u2471':{'text':'(18)'},'\u2472':{'text':'(19)'},'\u2473':{'text':'(20)'},'\u2474':{'text':'(1)'},'\u2475':{'text':'(2)'},'\u2476':{'text':'(3)'},'\u2477':{'text':'(4)'},'\u2478':{'text':'(5)'},'\u2479':{'text':'(6)'},'\u247A':{'text':'(7)'},'\u247B':{'text':'(8)'},'\u247C':{'text':'(9)'},'\u247D':{'text':'(10)'},'\u247E':{'text':'(11)'},'\u247F':{'text':'(12)'},'\u2480':{'text':'(13)'},'\u2481':{'text':'(14)'},'\u2482':{'text':'(15)'},'\u2483':{'text':'(16)'},'\u2484':{'text':'(17)'},'\u2485':{'text':'(18)'},'\u2486':{'text':'(19)'},'\u2487':{'text':'(20)'},'\u2488':{'text':'1.'},'\u2489':{'text':'2.'},'\u248A':{'text':'3.'},'\u248B':{'text':'4.'},'\u248C':{'text':'5.'},'\u248D':{'text':'6.'},'\u248E':{'text':'7.'},'\u248F':{'text':'8.'},'\u2490':{'text':'9.'},'\u2491':{'text':'10.'},'\u2492':{'text':'11.'},'\u2493':{'text':'12.'},'\u2494':{'text':'13.'},'\u2495':{'text':'14.'},'\u2496':{'text':'15.'},'\u2497':{'text':'16.'},'\u2498':{'text':'17.'},'\u2499':{'text':'18.'},'\u249A':{'text':'19.'},'\u249B':{'text':'20.'},'\u249C':{'text':'(a)'},'\u249D':{'text':'(b)'},'\u249E':{'text':'(c)'},'\u249F':{'text':'(d)'},'\u24A0':{'text':'(e)'},'\u24A1':{'text':'(f)'},'\u24A2':{'text':'(g)'},'\u24A3':{'text':'(h)'},'\u24A4':{'text':'(i)'},'\u24A5':{'text':'(j)'},'\u24A6':{'text':'(k)'},'\u24A7':{'text':'(l)'},'\u24A8':{'text':'(m)'},'\u24A9':{'text':'(n)'},'\u24AA':{'text':'(o)'},'\u24AB':{'text':'(p)'},'\u24AC':{'text':'(q)'},'\u24AD':{'text':'(r)'},'\u24AE':{'text':'(s)'},'\u24AF':{'text':'(t)'},'\u24B0':{'text':'(u)'},'\u24B1':{'text':'(v)'},'\u24B2':{'text':'(w)'},'\u24B3':{'text':'(x)'},'\u24B4':{'text':'(y)'},'\u24B5':{'text':'(z)'},'\u24B6':{'text':'(A)'},'\u24B7':{'text':'(B)'},'\u24B8':{'text':'(C)'},'\u24B9':{'text':'(D)'},'\u24BA':{'text':'(E)'},'\u24BB':{'text':'(F)'},'\u24BC':{'text':'(G)'},'\u24BD':{'text':'(H)'},'\u24BE':{'text':'(I)'},'\u24BF':{'text':'(J)'},'\u24C0':{'text':'(K)'},'\u24C1':{'text':'(L)'},'\u24C2':{'text':'(M)'},'\u24C3':{'text':'(N)'},'\u24C4':{'text':'(O)'},'\u24C5':{'text':'(P)'},'\u24C6':{'text':'(Q)'},'\u24C7':{'text':'(R)'},'\u24C8':{'math':'\\circledS{}'},'\u24C9':{'text':'(T)'},'\u24CA':{'text':'(U)'},'\u24CB':{'text':'(V)'},'\u24CC':{'text':'(W)'},'\u24CD':{'text':'(X)'},'\u24CE':{'text':'(Y)'},'\u24CF':{'text':'(Z)'},'\u24D0':{'text':'(a)'},'\u24D1':{'text':'(b)'},'\u24D2':{'text':'(c)'},'\u24D3':{'text':'(d)'},'\u24D4':{'text':'(e)'},'\u24D5':{'text':'(f)'},'\u24D6':{'text':'(g)'},'\u24D7':{'text':'(h)'},'\u24D8':{'text':'(i)'},'\u24D9':{'text':'(j)'},'\u24DA':{'text':'(k)'},'\u24DB':{'text':'(l)'},'\u24DC':{'text':'(m)'},'\u24DD':{'text':'(n)'},'\u24DE':{'text':'(o)'},'\u24DF':{'text':'(p)'},'\u24E0':{'text':'(q)'},'\u24E1':{'text':'(r)'},'\u24E2':{'text':'(s)'},'\u24E3':{'text':'(t)'},'\u24E4':{'text':'(u)'},'\u24E5':{'text':'(v)'},'\u24E6':{'text':'(w)'},'\u24E7':{'text':'(x)'},'\u24E8':{'text':'(y)'},'\u24E9':{'text':'(z)'},'\u24EA':{'text':'(0)'},'\u2500':{'text':'-'},'\u2501':{'text':'='},'\u2502':{'text':'|'},'\u2503':{'text':'|'},'\u2504':{'text':'-'},'\u2505':{'text':'='},'\u2506':{'math':'\\Elzdshfnc{}'},'\u2507':{'text':'|'},'\u2508':{'text':'-'},'\u2509':{'text':'='},'\u250A':{'text':'|'},'\u250B':{'text':'|'},'\u250C':{'text':'+'},'\u250D':{'text':'+'},'\u250E':{'text':'+'},'\u250F':{'text':'+'},'\u2510':{'text':'+'},'\u2511':{'text':'+'},'\u2512':{'text':'+'},'\u2513':{'text':'+'},'\u2514':{'text':'+'},'\u2515':{'text':'+'},'\u2516':{'text':'+'},'\u2517':{'text':'+'},'\u2518':{'text':'+'},'\u2519':{'math':'\\Elzsqfnw{}'},'\u251A':{'text':'+'},'\u251B':{'text':'+'},'\u251C':{'text':'+'},'\u251D':{'text':'+'},'\u251E':{'text':'+'},'\u251F':{'text':'+'},'\u2520':{'text':'+'},'\u2521':{'text':'+'},'\u2522':{'text':'+'},'\u2523':{'text':'+'},'\u2524':{'text':'+'},'\u2525':{'text':'+'},'\u2526':{'text':'+'},'\u2527':{'text':'+'},'\u2528':{'text':'+'},'\u2529':{'text':'+'},'\u252A':{'text':'+'},'\u252B':{'text':'+'},'\u252C':{'text':'+'},'\u252D':{'text':'+'},'\u252E':{'text':'+'},'\u252F':{'text':'+'},'\u2530':{'text':'+'},'\u2531':{'text':'+'},'\u2532':{'text':'+'},'\u2533':{'text':'+'},'\u2534':{'text':'+'},'\u2535':{'text':'+'},'\u2536':{'text':'+'},'\u2537':{'text':'+'},'\u2538':{'text':'+'},'\u2539':{'text':'+'},'\u253A':{'text':'+'},'\u253B':{'text':'+'},'\u253C':{'text':'+'},'\u253D':{'text':'+'},'\u253E':{'text':'+'},'\u253F':{'text':'+'},'\u2540':{'text':'+'},'\u2541':{'text':'+'},'\u2542':{'text':'+'},'\u2543':{'text':'+'},'\u2544':{'text':'+'},'\u2545':{'text':'+'},'\u2546':{'text':'+'},'\u2547':{'text':'+'},'\u2548':{'text':'+'},'\u2549':{'text':'+'},'\u254A':{'text':'+'},'\u254B':{'text':'+'},'\u254C':{'text':'-'},'\u254D':{'text':'='},'\u254E':{'text':'|'},'\u254F':{'text':'|'},'\u2550':{'text':'='},'\u2551':{'text':'|'},'\u2552':{'text':'+'},'\u2553':{'text':'+'},'\u2554':{'text':'+'},'\u2555':{'text':'+'},'\u2556':{'text':'+'},'\u2557':{'text':'+'},'\u2558':{'text':'+'},'\u2559':{'text':'+'},'\u255A':{'text':'+'},'\u255B':{'text':'+'},'\u255C':{'text':'+'},'\u255D':{'text':'+'},'\u255E':{'text':'+'},'\u255F':{'text':'+'},'\u2560':{'text':'+'},'\u2561':{'text':'+'},'\u2562':{'text':'+'},'\u2563':{'text':'+'},'\u2564':{'text':'+'},'\u2565':{'text':'+'},'\u2566':{'text':'+'},'\u2567':{'text':'+'},'\u2568':{'text':'+'},'\u2569':{'text':'+'},'\u256A':{'text':'+'},'\u256B':{'text':'+'},'\u256C':{'text':'+'},'\u256D':{'text':'+'},'\u256E':{'text':'+'},'\u256F':{'text':'+'},'\u2570':{'text':'+'},'\u2571':{'math':'\\diagup{}'},'\u2572':{'text':'\\'},'\u2573':{'text':'X'},'\u257C':{'text':'-'},'\u257D':{'text':'|'},'\u257E':{'text':'-'},'\u257F':{'text':'|'},'\u2580':{'math':'\\blockuphalf{}'},'\u2584':{'math':'\\blocklowhalf{}'},'\u2588':{'math':'\\blockfull{}'},'\u258C':{'math':'\\blocklefthalf{}'},'\u2590':{'math':'\\blockrighthalf{}'},'\u2591':{'math':'\\blockqtrshaded{}'},'\u2592':{'math':'\\blockhalfshaded{}'},'\u2593':{'math':'\\blockthreeqtrshaded{}'},'\u25A0':{'math':'\\mdlgblksquare{}','text':'\\ding{110}'},'\u25A1':{'math':'\\square{}'},'\u25A2':{'math':'\\squoval{}'},'\u25A3':{'math':'\\blackinwhitesquare{}'},'\u25A4':{'math':'\\squarehfill{}'},'\u25A5':{'math':'\\squarevfill{}'},'\u25A6':{'math':'\\squarehvfill{}'},'\u25A7':{'math':'\\squarenwsefill{}'},'\u25A8':{'math':'\\squareneswfill{}'},'\u25A9':{'math':'\\squarecrossfill{}'},'\u25AA':{'math':'\\blacksquare{}'},'\u25AB':{'math':'\\smwhtsquare{}'},'\u25AC':{'math':'\\hrectangleblack{}'},'\u25AD':{'math':'\\fbox{~~}'},'\u25AE':{'math':'\\vrectangleblack{}'},'\u25AF':{'math':'\\Elzvrecto{}'},'\u25B0':{'math':'\\parallelogramblack{}'},'\u25B1':{'math':'\\ElsevierGlyph{E381}'},'\u25B2':{'math':'\\bigblacktriangleup{}','text':'\\ding{115}'},'\u25B3':{'math':'\\bigtriangleup{}'},'\u25B4':{'math':'\\blacktriangle{}'},'\u25B5':{'math':'\\vartriangle{}'},'\u25B6':{'math':'\\RHD{}'},'\u25B7':{'math':'\\rhd{}'},'\u25B8':{'math':'\\blacktriangleright{}'},'\u25B9':{'math':'\\triangleright{}'},'\u25BA':{'math':'\\blackpointerright{}'},'\u25BB':{'math':'\\whitepointerright{}'},'\u25BC':{'math':'\\bigblacktriangledown{}','text':'\\ding{116}'},'\u25BD':{'math':'\\bigtriangledown{}'},'\u25BE':{'math':'\\blacktriangledown{}'},'\u25BF':{'math':'\\triangledown{}'},'\u25C0':{'math':'\\LHD{}'},'\u25C1':{'math':'\\lhd{}'},'\u25C2':{'math':'\\blacktriangleleft{}'},'\u25C3':{'math':'\\triangleleft{}'},'\u25C4':{'math':'\\blackpointerleft{}'},'\u25C5':{'math':'\\whitepointerleft{}'},'\u25C6':{'math':'\\Diamondblack{}','text':'\\ding{117}'},'\u25C7':{'math':'\\Diamond{}'},'\u25C8':{'math':'\\blackinwhitediamond{}'},'\u25C9':{'math':'\\fisheye{}'},'\u25CA':{'math':'\\lozenge{}'},'\u25CB':{'math':'\\bigcirc{}'},'\u25CC':{'math':'\\dottedcircle{}'},'\u25CD':{'math':'\\circlevertfill{}'},'\u25CE':{'math':'\\bullseye{}'},'\u25CF':{'math':'\\CIRCLE{}','text':'\\ding{108}'},'\u25D0':{'math':'\\Elzcirfl{}'},'\u25D1':{'math':'\\Elzcirfr{}'},'\u25D2':{'math':'\\Elzcirfb{}'},'\u25D3':{'math':'\\circletophalfblack{}'},'\u25D4':{'math':'\\circleurquadblack{}'},'\u25D5':{'math':'\\blackcircleulquadwhite{}'},'\u25D6':{'math':'\\LEFTCIRCLE{}'},'\u25D7':{'math':'\\RIGHTCIRCLE{}','text':'\\ding{119}'},'\u25D8':{'math':'\\Elzrvbull{}'},'\u25D9':{'math':'\\inversewhitecircle{}'},'\u25DA':{'math':'\\invwhiteupperhalfcircle{}'},'\u25DB':{'math':'\\invwhitelowerhalfcircle{}'},'\u25DC':{'math':'\\ularc{}'},'\u25DD':{'math':'\\urarc{}'},'\u25DE':{'math':'\\lrarc{}'},'\u25DF':{'math':'\\llarc{}'},'\u25E0':{'math':'\\topsemicircle{}'},'\u25E1':{'math':'\\botsemicircle{}'},'\u25E2':{'math':'\\lrblacktriangle{}'},'\u25E3':{'math':'\\llblacktriangle{}'},'\u25E4':{'math':'\\ulblacktriangle{}'},'\u25E5':{'math':'\\urblacktriangle{}'},'\u25E6':{'math':'\\smwhtcircle{}'},'\u25E7':{'math':'\\Elzsqfl{}'},'\u25E8':{'math':'\\Elzsqfr{}'},'\u25E9':{'math':'\\squareulblack{}'},'\u25EA':{'math':'\\Elzsqfse{}'},'\u25EB':{'math':'\\boxbar{}'},'\u25EC':{'math':'\\trianglecdot{}'},'\u25ED':{'math':'\\triangleleftblack{}'},'\u25EE':{'math':'\\trianglerightblack{}'},'\u25EF':{'math':'\\bigcirc{}'},'\u25F0':{'math':'\\squareulquad{}'},'\u25F1':{'math':'\\squarellquad{}'},'\u25F2':{'math':'\\squarelrquad{}'},'\u25F3':{'math':'\\squareurquad{}'},'\u25F4':{'math':'\\circleulquad{}'},'\u25F5':{'math':'\\circlellquad{}'},'\u25F6':{'math':'\\circlelrquad{}'},'\u25F7':{'math':'\\circleurquad{}'},'\u25F8':{'math':'\\ultriangle{}'},'\u25F9':{'math':'\\urtriangle{}'},'\u25FA':{'math':'\\lltriangle{}'},'\u25FB':{'math':'\\square{}'},'\u25FC':{'math':'\\blacksquare{}'},'\u25FD':{'math':'\\mdsmwhtsquare{}'},'\u25FE':{'math':'\\mdsmblksquare{}'},'\u25FF':{'math':'\\lrtriangle{}'},'\u2605':{'math':'\\bigstar{}','text':'\\ding{72}'},'\u2606':{'math':'\\bigwhitestar{}','text':'\\ding{73}'},'\u2609':{'math':'\\Sun{}'},'\u260E':{'text':'\\ding{37}'},'\u2610':{'math':'\\Square{}'},'\u2611':{'math':'\\CheckedBox{}'},'\u2612':{'math':'\\XBox{}'},'\u2613':{'text':'X'},'\u2615':{'math':'\\steaming{}'},'\u261B':{'text':'\\ding{42}'},'\u261E':{'math':'\\pointright{}','text':'\\ding{43}'},'\u2620':{'math':'\\skull{}'},'\u2621':{'math':'\\danger{}'},'\u2622':{'math':'\\radiation{}'},'\u2623':{'math':'\\biohazard{}'},'\u262F':{'math':'\\yinyang{}'},'\u2639':{'math':'\\frownie{}'},'\u263A':{'math':'\\smiley{}'},'\u263B':{'math':'\\blacksmiley{}'},'\u263C':{'math':'\\sun{}'},'\u263D':{'math':'\\rightmoon{}'},'\u263E':{'math':'\\leftmoon{}','text':'\\rightmoon{}'},'\u263F':{'math':'\\mercury{}','text':'\\mercury{}'},'\u2640':{'math':'\\female{}','text':'\\venus{}'},'\u2641':{'math':'\\earth{}'},'\u2642':{'math':'\\male{}','text':'\\male{}'},'\u2643':{'math':'\\jupiter{}','text':'\\jupiter{}'},'\u2644':{'math':'\\saturn{}','text':'\\saturn{}'},'\u2645':{'math':'\\uranus{}','text':'\\uranus{}'},'\u2646':{'math':'\\neptune{}','text':'\\neptune{}'},'\u2647':{'math':'\\pluto{}','text':'\\pluto{}'},'\u2648':{'math':'\\aries{}','text':'\\aries{}'},'\u2649':{'math':'\\taurus{}','text':'\\taurus{}'},'\u264A':{'math':'\\gemini{}','text':'\\gemini{}'},'\u264B':{'math':'\\cancer{}','text':'\\cancer{}'},'\u264C':{'math':'\\leo{}','text':'\\leo{}'},'\u264D':{'math':'\\virgo{}','text':'\\virgo{}'},'\u264E':{'math':'\\libra{}','text':'\\libra{}'},'\u264F':{'math':'\\scorpio{}','text':'\\scorpio{}'},'\u2650':{'math':'\\sagittarius{}','text':'\\sagittarius{}'},'\u2651':{'math':'\\capricornus{}','text':'\\capricornus{}'},'\u2652':{'math':'\\aquarius{}','text':'\\aquarius{}'},'\u2653':{'math':'\\pisces{}','text':'\\pisces{}'},'\u2660':{'math':'\\spadesuit{}','text':'\\ding{171}'},'\u2661':{'math':'\\heartsuit{}'},'\u2662':{'math':'\\diamond{}'},'\u2663':{'math':'\\clubsuit{}','text':'\\ding{168}'},'\u2664':{'math':'\\varspadesuit{}'},'\u2665':{'math':'\\varheartsuit{}','text':'\\ding{170}'},'\u2666':{'math':'\\vardiamondsuit{}','text':'\\ding{169}'},'\u2667':{'math':'\\varclubsuit{}'},'\u2669':{'math':'\\quarternote{}','text':'\\quarternote{}'},'\u266A':{'math':'\\eighthnote{}','text':'\\eighthnote{}'},'\u266B':{'math':'\\twonotes{}'},'\u266C':{'math':'\\sixteenthnote{}'},'\u266D':{'math':'\\flat{}'},'\u266E':{'math':'\\natural{}'},'\u266F':{'math':'\\sharp{}'},'\u267B':{'math':'\\recycle{}'},'\u267E':{'math':'\\acidfree{}'},'\u2680':{'math':'\\dicei{}'},'\u2681':{'math':'\\diceii{}'},'\u2682':{'math':'\\diceiii{}'},'\u2683':{'math':'\\diceiv{}'},'\u2684':{'math':'\\dicev{}'},'\u2685':{'math':'\\dicevi{}'},'\u2686':{'math':'\\circledrightdot{}'},'\u2687':{'math':'\\circledtwodots{}'},'\u2688':{'math':'\\blackcircledrightdot{}'},'\u2689':{'math':'\\blackcircledtwodots{}'},'\u2693':{'math':'\\anchor{}'},'\u2694':{'math':'\\swords{}'},'\u26A0':{'math':'\\warning{}'},'\u26A5':{'math':'\\Hermaphrodite{}'},'\u26AA':{'math':'\\medcirc{}'},'\u26AB':{'math':'\\medbullet{}'},'\u26AC':{'math':'\\mdsmwhtcircle{}'},'\u26B2':{'math':'\\neuter{}'},'\u2701':{'text':'\\ding{33}'},'\u2702':{'text':'\\ding{34}'},'\u2703':{'text':'\\ding{35}'},'\u2704':{'text':'\\ding{36}'},'\u2706':{'text':'\\ding{38}'},'\u2707':{'text':'\\ding{39}'},'\u2708':{'text':'\\ding{40}'},'\u2709':{'text':'\\ding{41}'},'\u270C':{'text':'\\ding{44}'},'\u270D':{'text':'\\ding{45}'},'\u270E':{'math':'\\pencil{}','text':'\\ding{46}'},'\u270F':{'text':'\\ding{47}'},'\u2710':{'text':'\\ding{48}'},'\u2711':{'text':'\\ding{49}'},'\u2712':{'text':'\\ding{50}'},'\u2713':{'math':'\\checkmark{}','text':'\\ding{51}'},'\u2714':{'text':'\\ding{52}'},'\u2715':{'text':'\\ding{53}'},'\u2716':{'text':'\\ding{54}'},'\u2717':{'math':'\\ballotx{}','text':'\\ding{55}'},'\u2718':{'text':'\\ding{56}'},'\u2719':{'text':'\\ding{57}'},'\u271A':{'text':'\\ding{58}'},'\u271B':{'text':'\\ding{59}'},'\u271C':{'text':'\\ding{60}'},'\u271D':{'text':'\\ding{61}'},'\u271E':{'text':'\\ding{62}'},'\u271F':{'text':'\\ding{63}'},'\u2720':{'math':'\\maltese{}','text':'\\ding{64}'},'\u2721':{'text':'\\ding{65}'},'\u2722':{'text':'\\ding{66}'},'\u2723':{'text':'\\ding{67}'},'\u2724':{'text':'\\ding{68}'},'\u2725':{'text':'\\ding{69}'},'\u2726':{'text':'\\ding{70}'},'\u2727':{'text':'\\ding{71}'},'\u2729':{'text':'\\ding{73}'},'\u272A':{'math':'\\circledstar{}','text':'\\ding{74}'},'\u272B':{'text':'\\ding{75}'},'\u272C':{'text':'\\ding{76}'},'\u272D':{'text':'\\ding{77}'},'\u272E':{'text':'\\ding{78}'},'\u272F':{'text':'\\ding{79}'},'\u2730':{'text':'\\ding{80}'},'\u2731':{'text':'\\ding{81}'},'\u2732':{'text':'\\ding{82}'},'\u2733':{'text':'\\ding{83}'},'\u2734':{'text':'\\ding{84}'},'\u2735':{'text':'\\ding{85}'},'\u2736':{'math':'\\varstar{}','text':'\\ding{86}'},'\u2737':{'text':'\\ding{87}'},'\u2738':{'text':'\\ding{88}'},'\u2739':{'text':'\\ding{89}'},'\u273A':{'text':'\\ding{90}'},'\u273B':{'text':'\\ding{91}'},'\u273C':{'text':'\\ding{92}'},'\u273D':{'math':'\\dingasterisk{}','text':'\\ding{93}'},'\u273E':{'text':'\\ding{94}'},'\u273F':{'text':'\\ding{95}'},'\u2740':{'text':'\\ding{96}'},'\u2741':{'text':'\\ding{97}'},'\u2742':{'text':'\\ding{98}'},'\u2743':{'text':'\\ding{99}'},'\u2744':{'text':'\\ding{100}'},'\u2745':{'text':'\\ding{101}'},'\u2746':{'text':'\\ding{102}'},'\u2747':{'text':'\\ding{103}'},'\u2748':{'text':'\\ding{104}'},'\u2749':{'text':'\\ding{105}'},'\u274A':{'text':'\\ding{106}'},'\u274B':{'text':'\\ding{107}'},'\u274D':{'text':'\\ding{109}'},'\u274F':{'text':'\\ding{111}'},'\u2750':{'text':'\\ding{112}'},'\u2751':{'text':'\\ding{113}'},'\u2752':{'text':'\\ding{114}'},'\u2756':{'text':'\\ding{118}'},'\u2758':{'text':'\\ding{120}'},'\u2759':{'text':'\\ding{121}'},'\u275A':{'text':'\\ding{122}'},'\u275B':{'text':'\\ding{123}'},'\u275C':{'text':'\\ding{124}'},'\u275D':{'text':'\\ding{125}'},'\u275E':{'text':'\\ding{126}'},'\u2761':{'text':'\\ding{161}'},'\u2762':{'text':'\\ding{162}'},'\u2763':{'text':'\\ding{163}'},'\u2764':{'text':'\\ding{164}'},'\u2765':{'text':'\\ding{165}'},'\u2766':{'text':'\\ding{166}'},'\u2767':{'text':'\\ding{167}'},'\u2772':{'math':'\\lbrbrak{}'},'\u2773':{'math':'\\rbrbrak{}'},'\u2776':{'text':'\\ding{182}'},'\u2777':{'text':'\\ding{183}'},'\u2778':{'text':'\\ding{184}'},'\u2779':{'text':'\\ding{185}'},'\u277A':{'text':'\\ding{186}'},'\u277B':{'text':'\\ding{187}'},'\u277C':{'text':'\\ding{188}'},'\u277D':{'text':'\\ding{189}'},'\u277E':{'text':'\\ding{190}'},'\u277F':{'text':'\\ding{191}'},'\u2780':{'text':'\\ding{192}'},'\u2781':{'text':'\\ding{193}'},'\u2782':{'text':'\\ding{194}'},'\u2783':{'text':'\\ding{195}'},'\u2784':{'text':'\\ding{196}'},'\u2785':{'text':'\\ding{197}'},'\u2786':{'text':'\\ding{198}'},'\u2787':{'text':'\\ding{199}'},'\u2788':{'text':'\\ding{200}'},'\u2789':{'text':'\\ding{201}'},'\u278A':{'text':'\\ding{202}'},'\u278B':{'text':'\\ding{203}'},'\u278C':{'text':'\\ding{204}'},'\u278D':{'text':'\\ding{205}'},'\u278E':{'text':'\\ding{206}'},'\u278F':{'text':'\\ding{207}'},'\u2790':{'text':'\\ding{208}'},'\u2791':{'text':'\\ding{209}'},'\u2792':{'text':'\\ding{210}'},'\u2793':{'text':'\\ding{211}'},'\u2794':{'text':'\\ding{212}'},'\u2798':{'text':'\\ding{216}'},'\u2799':{'text':'\\ding{217}'},'\u279A':{'text':'\\ding{218}'},'\u279B':{'math':'\\draftingarrow{}','text':'\\ding{219}'},'\u279C':{'text':'\\ding{220}'},'\u279D':{'text':'\\ding{221}'},'\u279E':{'text':'\\ding{222}'},'\u279F':{'text':'\\ding{223}'},'\u27A0':{'text':'\\ding{224}'},'\u27A1':{'text':'\\ding{225}'},'\u27A2':{'math':'\\arrowbullet{}','text':'\\ding{226}'},'\u27A3':{'text':'\\ding{227}'},'\u27A4':{'text':'\\ding{228}'},'\u27A5':{'text':'\\ding{229}'},'\u27A6':{'text':'\\ding{230}'},'\u27A7':{'text':'\\ding{231}'},'\u27A8':{'text':'\\ding{232}'},'\u27A9':{'text':'\\ding{233}'},'\u27AA':{'text':'\\ding{234}'},'\u27AB':{'text':'\\ding{235}'},'\u27AC':{'text':'\\ding{236}'},'\u27AD':{'text':'\\ding{237}'},'\u27AE':{'text':'\\ding{238}'},'\u27AF':{'text':'\\ding{239}'},'\u27B1':{'text':'\\ding{241}'},'\u27B2':{'text':'\\ding{242}'},'\u27B3':{'text':'\\ding{243}'},'\u27B4':{'text':'\\ding{244}'},'\u27B5':{'text':'\\ding{245}'},'\u27B6':{'text':'\\ding{246}'},'\u27B7':{'text':'\\ding{247}'},'\u27B8':{'text':'\\ding{248}'},'\u27B9':{'text':'\\ding{249}'},'\u27BA':{'text':'\\ding{250}'},'\u27BB':{'text':'\\ding{251}'},'\u27BC':{'text':'\\ding{252}'},'\u27BD':{'text':'\\ding{253}'},'\u27BE':{'text':'\\ding{254}'},'\u27C0':{'math':'\\threedangle{}'},'\u27C1':{'math':'\\whiteinwhitetriangle{}'},'\u27C2':{'math':'\\perp{}'},'\u27C3':{'math':'\\subsetcirc{}'},'\u27C4':{'math':'\\supsetcirc{}'},'\u27C5':{'math':'\\Lbag{}'},'\u27C6':{'math':'\\Rbag{}'},'\u27C7':{'math':'\\veedot{}'},'\u27C8':{'math':'\\bsolhsub{}'},'\u27C9':{'math':'\\suphsol{}'},'\u27CC':{'math':'\\longdivision{}'},'\u27D0':{'math':'\\Diamonddot{}'},'\u27D1':{'math':'\\wedgedot{}'},'\u27D2':{'math':'\\upin{}'},'\u27D3':{'math':'\\pullback{}'},'\u27D4':{'math':'\\pushout{}'},'\u27D5':{'math':'\\leftouterjoin{}'},'\u27D6':{'math':'\\rightouterjoin{}'},'\u27D7':{'math':'\\fullouterjoin{}'},'\u27D8':{'math':'\\bigbot{}'},'\u27D9':{'math':'\\bigtop{}'},'\u27DA':{'math':'\\DashVDash{}'},'\u27DB':{'math':'\\dashVdash{}'},'\u27DC':{'math':'\\multimapinv{}'},'\u27DD':{'math':'\\vlongdash{}'},'\u27DE':{'math':'\\longdashv{}'},'\u27DF':{'math':'\\cirbot{}'},'\u27E0':{'math':'\\lozengeminus{}'},'\u27E1':{'math':'\\concavediamond{}'},'\u27E2':{'math':'\\concavediamondtickleft{}'},'\u27E3':{'math':'\\concavediamondtickright{}'},'\u27E4':{'math':'\\whitesquaretickleft{}'},'\u27E5':{'math':'\\whitesquaretickright{}'},'\u27E6':{'math':'\\llbracket{}'},'\u27E7':{'math':'\\rrbracket{}'},'\u27E8':{'math':'\\langle{}','text':'\\langle{}'},'\u27E9':{'math':'\\rangle{}','text':'\\rangle{}'},'\u27EA':{'math':'\\lang{}'},'\u27EB':{'math':'\\rang{}'},'\u27EC':{'math':'\\Lbrbrak{}'},'\u27ED':{'math':'\\Rbrbrak{}'},'\u27EE':{'math':'\\lgroup{}'},'\u27EF':{'math':'\\rgroup{}'},'\u27F0':{'math':'\\UUparrow{}'},'\u27F1':{'math':'\\DDownarrow{}'},'\u27F2':{'math':'\\acwgapcirclearrow{}'},'\u27F3':{'math':'\\cwgapcirclearrow{}'},'\u27F4':{'math':'\\rightarrowonoplus{}'},'\u27F5':{'math':'\\longleftarrow{}'},'\u27F6':{'math':'\\longrightarrow{}'},'\u27F7':{'math':'\\longleftrightarrow{}'},'\u27F8':{'math':'\\Longleftarrow{}'},'\u27F9':{'math':'\\Longrightarrow{}'},'\u27FA':{'math':'\\Longleftrightarrow{}'},'\u27FB':{'math':'\\longmapsfrom{}'},'\u27FC':{'math':'\\longmapsto{}'},'\u27FD':{'math':'\\Longmapsfrom{}'},'\u27FE':{'math':'\\Longmapsto{}'},'\u27FF':{'math':'\\sim\\joinrel\\leadsto{}'},'\u2900':{'math':'\\psur{}'},'\u2901':{'math':'\\nVtwoheadrightarrow{}'},'\u2902':{'math':'\\nvLeftarrow{}'},'\u2903':{'math':'\\nvRightarrow{}'},'\u2904':{'math':'\\nvLeftrightarrow{}'},'\u2905':{'math':'\\ElsevierGlyph{E212}'},'\u2906':{'math':'\\Mapsfrom{}'},'\u2907':{'math':'\\Mapsto{}'},'\u2908':{'math':'\\downarrowbarred{}'},'\u2909':{'math':'\\uparrowbarred{}'},'\u290A':{'math':'\\Uuparrow{}'},'\u290B':{'math':'\\Ddownarrow{}'},'\u290C':{'math':'\\leftbkarrow{}'},'\u290D':{'math':'\\rightbkarrow{}'},'\u290E':{'math':'\\leftdbkarrow{}'},'\u290F':{'math':'\\dbkarow{}'},'\u2910':{'math':'\\drbkarow{}'},'\u2911':{'math':'\\rightdotarrow{}'},'\u2912':{'math':'\\UpArrowBar{}'},'\u2913':{'math':'\\DownArrowBar{}'},'\u2914':{'math':'\\pinj{}'},'\u2915':{'math':'\\finj{}'},'\u2916':{'math':'\\bij{}'},'\u2917':{'math':'\\nvtwoheadrightarrowtail{}'},'\u2918':{'math':'\\nVtwoheadrightarrowtail{}'},'\u2919':{'math':'\\lefttail{}'},'\u291A':{'math':'\\righttail{}'},'\u291B':{'math':'\\leftdbltail{}'},'\u291C':{'math':'\\rightdbltail{}'},'\u291D':{'math':'\\diamondleftarrow{}'},'\u291E':{'math':'\\rightarrowdiamond{}'},'\u291F':{'math':'\\diamondleftarrowbar{}'},'\u2920':{'math':'\\barrightarrowdiamond{}'},'\u2921':{'math':'\\nwsearrow{}'},'\u2922':{'math':'\\neswarrow{}'},'\u2923':{'math':'\\ElsevierGlyph{E20C}'},'\u2924':{'math':'\\ElsevierGlyph{E20D}'},'\u2925':{'math':'\\ElsevierGlyph{E20B}'},'\u2926':{'math':'\\ElsevierGlyph{E20A}'},'\u2927':{'math':'\\ElsevierGlyph{E211}'},'\u2928':{'math':'\\ElsevierGlyph{E20E}'},'\u2929':{'math':'\\ElsevierGlyph{E20F}'},'\u292A':{'math':'\\ElsevierGlyph{E210}'},'\u292B':{'math':'\\rdiagovfdiag{}'},'\u292C':{'math':'\\fdiagovrdiag{}'},'\u292D':{'math':'\\seovnearrow{}'},'\u292E':{'math':'\\neovsearrow{}'},'\u292F':{'math':'\\fdiagovnearrow{}'},'\u2930':{'math':'\\rdiagovsearrow{}'},'\u2931':{'math':'\\neovnwarrow{}'},'\u2932':{'math':'\\nwovnearrow{}'},'\u2933':{'math':'\\ElsevierGlyph{E21C}'},'\u2934':{'math':'\\uprightcurvearrow{}'},'\u2935':{'math':'\\downrightcurvedarrow{}'},'\u2936':{'math':'\\ElsevierGlyph{E21A}'},'\u2937':{'math':'\\ElsevierGlyph{E219}'},'\u2938':{'math':'\\cwrightarcarrow{}'},'\u2939':{'math':'\\acwleftarcarrow{}'},'\u293A':{'math':'\\acwoverarcarrow{}'},'\u293B':{'math':'\\acwunderarcarrow{}'},'\u293C':{'math':'\\curvearrowrightminus{}'},'\u293D':{'math':'\\curvearrowleftplus{}'},'\u293E':{'math':'\\cwundercurvearrow{}'},'\u293F':{'math':'\\ccwundercurvearrow{}'},'\u2940':{'math':'\\Elolarr{}'},'\u2941':{'math':'\\Elorarr{}'},'\u2942':{'math':'\\ElzRlarr{}'},'\u2943':{'math':'\\leftarrowshortrightarrow{}'},'\u2944':{'math':'\\ElzrLarr{}'},'\u2945':{'math':'\\rightarrowplus{}'},'\u2946':{'math':'\\leftarrowplus{}'},'\u2947':{'math':'\\Elzrarrx{}'},'\u2948':{'math':'\\leftrightarrowcircle{}'},'\u2949':{'math':'\\twoheaduparrowcircle{}'},'\u294A':{'math':'\\leftrightharpoon{}'},'\u294B':{'math':'\\rightleftharpoon{}'},'\u294C':{'math':'\\updownharpoonrightleft{}'},'\u294D':{'math':'\\updownharpoonleftright{}'},'\u294E':{'math':'\\LeftRightVector{}'},'\u294F':{'math':'\\RightUpDownVector{}'},'\u2950':{'math':'\\DownLeftRightVector{}'},'\u2951':{'math':'\\LeftUpDownVector{}'},'\u2952':{'math':'\\LeftVectorBar{}'},'\u2953':{'math':'\\RightVectorBar{}'},'\u2954':{'math':'\\RightUpVectorBar{}'},'\u2955':{'math':'\\RightDownVectorBar{}'},'\u2956':{'math':'\\DownLeftVectorBar{}'},'\u2957':{'math':'\\DownRightVectorBar{}'},'\u2958':{'math':'\\LeftUpVectorBar{}'},'\u2959':{'math':'\\LeftDownVectorBar{}'},'\u295A':{'math':'\\LeftTeeVector{}'},'\u295B':{'math':'\\RightTeeVector{}'},'\u295C':{'math':'\\RightUpTeeVector{}'},'\u295D':{'math':'\\RightDownTeeVector{}'},'\u295E':{'math':'\\DownLeftTeeVector{}'},'\u295F':{'math':'\\DownRightTeeVector{}'},'\u2960':{'math':'\\LeftUpTeeVector{}'},'\u2961':{'math':'\\LeftDownTeeVector{}'},'\u2962':{'math':'\\leftleftharpoons{}'},'\u2963':{'math':'\\upupharpoons{}'},'\u2964':{'math':'\\rightrightharpoons{}'},'\u2965':{'math':'\\downdownharpoons{}'},'\u2966':{'math':'\\leftrightharpoonsup{}'},'\u2967':{'math':'\\leftrightharpoonsdown{}'},'\u2968':{'math':'\\rightleftharpoonsup{}'},'\u2969':{'math':'\\rightleftharpoonsdown{}'},'\u296A':{'math':'\\leftbarharpoon{}'},'\u296B':{'math':'\\barleftharpoon{}'},'\u296C':{'math':'\\rightbarharpoon{}'},'\u296D':{'math':'\\barrightharpoon{}'},'\u296E':{'math':'\\UpEquilibrium{}'},'\u296F':{'math':'\\ReverseUpEquilibrium{}'},'\u2970':{'math':'\\RoundImplies{}'},'\u2971':{'math':'\\equalrightarrow{}'},'\u2972':{'math':'\\similarrightarrow{}'},'\u2973':{'math':'\\leftarrowsimilar{}'},'\u2974':{'math':'\\rightarrowsimilar{}'},'\u2975':{'math':'\\rightarrowapprox{}'},'\u2976':{'math':'\\ltlarr{}'},'\u2977':{'math':'\\leftarrowless{}'},'\u2978':{'math':'\\gtrarr{}'},'\u2979':{'math':'\\subrarr{}'},'\u297A':{'math':'\\leftarrowsubset{}'},'\u297B':{'math':'\\suplarr{}'},'\u297C':{'math':'\\ElsevierGlyph{E214}'},'\u297D':{'math':'\\ElsevierGlyph{E215}'},'\u297E':{'math':'\\upfishtail{}'},'\u297F':{'math':'\\downfishtail{}'},'\u2980':{'math':'\\Elztfnc{}'},'\u2981':{'math':'\\spot{}'},'\u2982':{'math':'\\typecolon{}'},'\u2983':{'math':'\\lBrace{}'},'\u2984':{'math':'\\rBrace{}'},'\u2985':{'math':'\\ElsevierGlyph{3018}'},'\u2986':{'math':'\\Elroang{}'},'\u2987':{'math':'\\limg{}'},'\u2988':{'math':'\\rimg{}'},'\u2989':{'math':'\\lblot{}'},'\u298A':{'math':'\\rblot{}'},'\u298B':{'math':'\\lbrackubar{}'},'\u298C':{'math':'\\rbrackubar{}'},'\u298D':{'math':'\\lbrackultick{}'},'\u298E':{'math':'\\rbracklrtick{}'},'\u298F':{'math':'\\lbracklltick{}'},'\u2990':{'math':'\\rbrackurtick{}'},'\u2991':{'math':'\\langledot{}'},'\u2992':{'math':'\\rangledot{}'},'\u2993':{'math':'<\\kern-0.58em('},'\u2994':{'math':'\\ElsevierGlyph{E291}'},'\u2995':{'math':'\\Lparengtr{}'},'\u2996':{'math':'\\Rparenless{}'},'\u2997':{'math':'\\lblkbrbrak{}'},'\u2998':{'math':'\\rblkbrbrak{}'},'\u2999':{'math':'\\Elzddfnc{}'},'\u299A':{'math':'\\vzigzag{}'},'\u299B':{'math':'\\measuredangleleft{}'},'\u299C':{'math':'\\Angle{}'},'\u299D':{'math':'\\rightanglemdot{}'},'\u299E':{'math':'\\angles{}'},'\u299F':{'math':'\\angdnr{}'},'\u29A0':{'math':'\\Elzlpargt{}'},'\u29A1':{'math':'\\sphericalangleup{}'},'\u29A2':{'math':'\\turnangle{}'},'\u29A3':{'math':'\\revangle{}'},'\u29A4':{'math':'\\angleubar{}'},'\u29A5':{'math':'\\revangleubar{}'},'\u29A6':{'math':'\\wideangledown{}'},'\u29A7':{'math':'\\wideangleup{}'},'\u29A8':{'math':'\\measanglerutone{}'},'\u29A9':{'math':'\\measanglelutonw{}'},'\u29AA':{'math':'\\measanglerdtose{}'},'\u29AB':{'math':'\\measangleldtosw{}'},'\u29AC':{'math':'\\measangleurtone{}'},'\u29AD':{'math':'\\measangleultonw{}'},'\u29AE':{'math':'\\measangledrtose{}'},'\u29AF':{'math':'\\measangledltosw{}'},'\u29B0':{'math':'\\revemptyset{}'},'\u29B1':{'math':'\\emptysetobar{}'},'\u29B2':{'math':'\\emptysetocirc{}'},'\u29B3':{'math':'\\emptysetoarr{}'},'\u29B4':{'math':'\\emptysetoarrl{}'},'\u29B5':{'math':'\\ElsevierGlyph{E260}'},'\u29B6':{'math':'\\ElsevierGlyph{E61B}'},'\u29B7':{'math':'\\circledparallel{}'},'\u29B8':{'math':'\\circledbslash{}'},'\u29B9':{'math':'\\operp{}'},'\u29BA':{'math':'\\obot{}'},'\u29BB':{'math':'\\olcross{}'},'\u29BC':{'math':'\\odotslashdot{}'},'\u29BD':{'math':'\\uparrowoncircle{}'},'\u29BE':{'math':'\\circledwhitebullet{}'},'\u29BF':{'math':'\\circledbullet{}'},'\u29C0':{'math':'\\circledless{}'},'\u29C1':{'math':'\\circledgtr{}'},'\u29C2':{'math':'\\cirscir{}'},'\u29C3':{'math':'\\cirE{}'},'\u29C4':{'math':'\\boxslash{}'},'\u29C5':{'math':'\\boxbslash{}'},'\u29C6':{'math':'\\boxast{}'},'\u29C7':{'math':'\\boxcircle{}'},'\u29C8':{'math':'\\boxbox{}'},'\u29C9':{'math':'\\boxonbox{}'},'\u29CA':{'math':'\\ElzLap{}'},'\u29CB':{'math':'\\Elzdefas{}'},'\u29CC':{'math':'\\triangles{}'},'\u29CD':{'math':'\\triangleserifs{}'},'\u29CE':{'math':'\\rtriltri{}'},'\u29CF':{'math':'\\LeftTriangleBar{}'},'\u29D0':{'math':'\\RightTriangleBar{}'},'\u29D1':{'math':'\\lfbowtie{}'},'\u29D2':{'math':'\\rfbowtie{}'},'\u29D3':{'math':'\\fbowtie{}'},'\u29D4':{'math':'\\lftimes{}'},'\u29D5':{'math':'\\rftimes{}'},'\u29D6':{'math':'\\hourglass{}'},'\u29D7':{'math':'\\blackhourglass{}'},'\u29D8':{'math':'\\lvzigzag{}'},'\u29D9':{'math':'\\rvzigzag{}'},'\u29DA':{'math':'\\Lvzigzag{}'},'\u29DB':{'math':'\\Rvzigzag{}'},'\u29DC':{'math':'\\ElsevierGlyph{E372}'},'\u29DD':{'math':'\\tieinfty{}'},'\u29DE':{'math':'\\nvinfty{}'},'\u29DF':{'math':'\\multimapboth{}'},'\u29E0':{'math':'\\laplac{}'},'\u29E1':{'math':'\\lrtriangleeq{}'},'\u29E2':{'math':'\\shuffle{}'},'\u29E3':{'math':'\\eparsl{}'},'\u29E4':{'math':'\\smeparsl{}'},'\u29E5':{'math':'\\eqvparsl{}'},'\u29E6':{'math':'\\gleichstark{}'},'\u29E7':{'math':'\\thermod{}'},'\u29E8':{'math':'\\downtriangleleftblack{}'},'\u29E9':{'math':'\\downtrianglerightblack{}'},'\u29EA':{'math':'\\blackdiamonddownarrow{}'},'\u29EB':{'math':'\\blacklozenge{}'},'\u29EC':{'math':'\\circledownarrow{}'},'\u29ED':{'math':'\\blackcircledownarrow{}'},'\u29EE':{'math':'\\errbarsquare{}'},'\u29EF':{'math':'\\errbarblacksquare{}'},'\u29F0':{'math':'\\errbardiamond{}'},'\u29F1':{'math':'\\errbarblackdiamond{}'},'\u29F2':{'math':'\\errbarcircle{}'},'\u29F3':{'math':'\\errbarblackcircle{}'},'\u29F4':{'math':'\\RuleDelayed{}'},'\u29F5':{'math':'\\setminus{}'},'\u29F6':{'math':'\\dsol{}'},'\u29F7':{'math':'\\rsolbar{}'},'\u29F8':{'math':'\\xsol{}'},'\u29F9':{'math':'\\zhide{}'},'\u29FA':{'math':'\\doubleplus{}'},'\u29FB':{'math':'\\tripleplus{}'},'\u29FC':{'math':'\\lcurvyangle{}'},'\u29FD':{'math':'\\rcurvyangle{}'},'\u29FE':{'math':'\\tplus{}'},'\u29FF':{'math':'\\tminus{}'},'\u2A00':{'math':'\\bigodot{}'},'\u2A01':{'math':'\\bigoplus{}'},'\u2A02':{'math':'\\bigotimes{}'},'\u2A03':{'math':'\\bigcupdot{}'},'\u2A04':{'math':'\\Elxuplus{}'},'\u2A05':{'math':'\\ElzThr{}'},'\u2A06':{'math':'\\Elxsqcup{}'},'\u2A07':{'math':'\\ElzInf{}'},'\u2A08':{'math':'\\ElzSup{}'},'\u2A09':{'math':'\\varprod{}'},'\u2A0A':{'math':'\\modtwosum{}'},'\u2A0B':{'math':'\\sumint{}'},'\u2A0C':{'math':'\\iiiint{}'},'\u2A0D':{'math':'\\ElzCint{}'},'\u2A0E':{'math':'\\intBar{}'},'\u2A0F':{'math':'\\clockoint{}'},'\u2A10':{'math':'\\ElsevierGlyph{E395}'},'\u2A11':{'math':'\\awint{}'},'\u2A12':{'math':'\\rppolint{}'},'\u2A13':{'math':'\\scpolint{}'},'\u2A14':{'math':'\\npolint{}'},'\u2A15':{'math':'\\pointint{}'},'\u2A16':{'math':'\\sqrint{}'},'\u2A17':{'math':'\\intlarhk{}'},'\u2A18':{'math':'\\intx{}'},'\u2A19':{'math':'\\intcap{}'},'\u2A1A':{'math':'\\intcup{}'},'\u2A1B':{'math':'\\upint{}'},'\u2A1C':{'math':'\\lowint{}'},'\u2A1D':{'math':'\\Join{}'},'\u2A1E':{'math':'\\bigtriangleleft{}'},'\u2A1F':{'math':'\\zcmp{}'},'\u2A20':{'math':'\\zpipe{}'},'\u2A21':{'math':'\\zproject{}'},'\u2A22':{'math':'\\ringplus{}'},'\u2A23':{'math':'\\plushat{}'},'\u2A24':{'math':'\\simplus{}'},'\u2A25':{'math':'\\ElsevierGlyph{E25A}'},'\u2A26':{'math':'\\plussim{}'},'\u2A27':{'math':'\\plussubtwo{}'},'\u2A28':{'math':'\\plustrif{}'},'\u2A29':{'math':'\\commaminus{}'},'\u2A2A':{'math':'\\ElsevierGlyph{E25B}'},'\u2A2B':{'math':'\\minusfdots{}'},'\u2A2C':{'math':'\\minusrdots{}'},'\u2A2D':{'math':'\\ElsevierGlyph{E25C}'},'\u2A2E':{'math':'\\ElsevierGlyph{E25D}'},'\u2A2F':{'math':'\\ElzTimes{}'},'\u2A30':{'math':'\\dottimes{}'},'\u2A31':{'math':'\\timesbar{}'},'\u2A32':{'math':'\\btimes{}'},'\u2A33':{'math':'\\smashtimes{}'},'\u2A34':{'math':'\\ElsevierGlyph{E25E}'},'\u2A35':{'math':'\\ElsevierGlyph{E25E}'},'\u2A36':{'math':'\\otimeshat{}'},'\u2A37':{'math':'\\Otimes{}'},'\u2A38':{'math':'\\odiv{}'},'\u2A39':{'math':'\\triangleplus{}'},'\u2A3A':{'math':'\\triangleminus{}'},'\u2A3B':{'math':'\\triangletimes{}'},'\u2A3C':{'math':'\\ElsevierGlyph{E259}'},'\u2A3D':{'math':'\\intprodr{}'},'\u2A3E':{'math':'\\fcmp{}'},'\u2A3F':{'math':'\\amalg{}'},'\u2A40':{'math':'\\capdot{}'},'\u2A41':{'math':'\\uminus{}'},'\u2A42':{'math':'\\barcup{}'},'\u2A43':{'math':'\\barcap{}'},'\u2A44':{'math':'\\capwedge{}'},'\u2A45':{'math':'\\cupvee{}'},'\u2A46':{'math':'\\cupovercap{}'},'\u2A47':{'math':'\\capovercup{}'},'\u2A48':{'math':'\\cupbarcap{}'},'\u2A49':{'math':'\\capbarcup{}'},'\u2A4A':{'math':'\\twocups{}'},'\u2A4B':{'math':'\\twocaps{}'},'\u2A4C':{'math':'\\closedvarcup{}'},'\u2A4D':{'math':'\\closedvarcap{}'},'\u2A4E':{'math':'\\Sqcap{}'},'\u2A4F':{'math':'\\Sqcup{}'},'\u2A50':{'math':'\\closedvarcupsmashprod{}'},'\u2A51':{'math':'\\wedgeodot{}'},'\u2A52':{'math':'\\veeodot{}'},'\u2A53':{'math':'\\ElzAnd{}'},'\u2A54':{'math':'\\ElzOr{}'},'\u2A55':{'math':'\\ElsevierGlyph{E36E}'},'\u2A56':{'math':'\\ElOr{}'},'\u2A57':{'math':'\\bigslopedvee{}'},'\u2A58':{'math':'\\bigslopedwedge{}'},'\u2A59':{'math':'\\veeonwedge{}'},'\u2A5A':{'math':'\\wedgemidvert{}'},'\u2A5B':{'math':'\\veemidvert{}'},'\u2A5C':{'math':'\\midbarwedge{}'},'\u2A5D':{'math':'\\midbarvee{}'},'\u2A5E':{'math':'\\perspcorrespond{}'},'\u2A5F':{'math':'\\Elzminhat{}'},'\u2A60':{'math':'\\wedgedoublebar{}'},'\u2A61':{'math':'\\varveebar{}'},'\u2A62':{'math':'\\doublebarvee{}'},'\u2A63':{'math':'\\ElsevierGlyph{225A}'},'\u2A64':{'math':'\\dsub{}'},'\u2A65':{'math':'\\rsub{}'},'\u2A66':{'math':'\\eqdot{}'},'\u2A67':{'math':'\\dotequiv{}'},'\u2A68':{'math':'\\equivVert{}'},'\u2A69':{'math':'\\equivVvert{}'},'\u2A6A':{'math':'\\dotsim{}'},'\u2A6B':{'math':'\\simrdots{}'},'\u2A6C':{'math':'\\simminussim{}'},'\u2A6D':{'math':'\\congdot{}'},'\u2A6E':{'math':'\\stackrel{*}{=}'},'\u2A6F':{'math':'\\hatapprox{}'},'\u2A70':{'math':'\\approxeqq{}'},'\u2A71':{'math':'\\eqqplus{}'},'\u2A72':{'math':'\\pluseqq{}'},'\u2A73':{'math':'\\eqqsim{}'},'\u2A74':{'math':'\\Coloneqq{}'},'\u2A75':{'math':'\\Equal{}'},'\u2A76':{'math':'\\Same{}'},'\u2A77':{'math':'\\ddotseq{}'},'\u2A78':{'math':'\\equivDD{}'},'\u2A79':{'math':'\\ltcir{}'},'\u2A7A':{'math':'\\gtcir{}'},'\u2A7B':{'math':'\\ltquest{}'},'\u2A7C':{'math':'\\gtquest{}'},'\u2A7D':{'math':'\\leqslant{}'},'\u2A7E':{'math':'\\geqslant{}'},'\u2A7F':{'math':'\\lesdot{}'},'\u2A80':{'math':'\\gesdot{}'},'\u2A81':{'math':'\\lesdoto{}'},'\u2A82':{'math':'\\gesdoto{}'},'\u2A83':{'math':'\\lesdotor{}'},'\u2A84':{'math':'\\gesdotol{}'},'\u2A85':{'math':'\\lessapprox{}'},'\u2A86':{'math':'\\gtrapprox{}'},'\u2A87':{'math':'\\lneq{}'},'\u2A88':{'math':'\\gneq{}'},'\u2A89':{'math':'\\lnapprox{}'},'\u2A8A':{'math':'\\gnapprox{}'},'\u2A8B':{'math':'\\lesseqqgtr{}'},'\u2A8C':{'math':'\\gtreqqless{}'},'\u2A8D':{'math':'\\lsime{}'},'\u2A8E':{'math':'\\gsime{}'},'\u2A8F':{'math':'\\lsimg{}'},'\u2A90':{'math':'\\gsiml{}'},'\u2A91':{'math':'\\lgE{}'},'\u2A92':{'math':'\\glE{}'},'\u2A93':{'math':'\\lesges{}'},'\u2A94':{'math':'\\gesles{}'},'\u2A95':{'math':'\\eqslantless{}'},'\u2A96':{'math':'\\eqslantgtr{}'},'\u2A97':{'math':'\\elsdot{}'},'\u2A98':{'math':'\\egsdot{}'},'\u2A99':{'math':'\\eqqless{}'},'\u2A9A':{'math':'\\eqqgtr{}'},'\u2A9B':{'math':'\\eqqslantless{}'},'\u2A9C':{'math':'\\eqqslantgtr{}'},'\u2A9D':{'math':'\\Pisymbol{ppi020}{117}'},'\u2A9E':{'math':'\\Pisymbol{ppi020}{105}'},'\u2A9F':{'math':'\\simlE{}'},'\u2AA0':{'math':'\\simgE{}'},'\u2AA1':{'math':'\\NestedLessLess{}'},'\u2AA2':{'math':'\\NestedGreaterGreater{}'},'\u2AA3':{'math':'\\partialmeetcontraction{}'},'\u2AA4':{'math':'\\glj{}'},'\u2AA5':{'math':'\\gla{}'},'\u2AA6':{'math':'\\leftslice{}'},'\u2AA7':{'math':'\\rightslice{}'},'\u2AA8':{'math':'\\lescc{}'},'\u2AA9':{'math':'\\gescc{}'},'\u2AAA':{'math':'\\smt{}'},'\u2AAB':{'math':'\\lat{}'},'\u2AAC':{'math':'\\smte{}'},'\u2AAD':{'math':'\\late{}'},'\u2AAE':{'math':'\\bumpeqq{}'},'\u2AAF':{'math':'\\preceq{}'},'\u2AB0':{'math':'\\succeq{}'},'\u2AB1':{'math':'\\precneq{}'},'\u2AB2':{'math':'\\succneq{}'},'\u2AB3':{'math':'\\preceqq{}'},'\u2AB4':{'math':'\\succeqq{}'},'\u2AB5':{'math':'\\precneqq{}'},'\u2AB6':{'math':'\\succneqq{}'},'\u2AB7':{'math':'\\precapprox{}'},'\u2AB8':{'math':'\\succapprox{}'},'\u2AB9':{'math':'\\precnapprox{}'},'\u2ABA':{'math':'\\succnapprox{}'},'\u2ABB':{'math':'\\llcurly{}'},'\u2ABC':{'math':'\\ggcurly{}'},'\u2ABD':{'math':'\\subsetdot{}'},'\u2ABE':{'math':'\\supsetdot{}'},'\u2ABF':{'math':'\\subsetplus{}'},'\u2AC0':{'math':'\\supsetplus{}'},'\u2AC1':{'math':'\\submult{}'},'\u2AC2':{'math':'\\supmult{}'},'\u2AC3':{'math':'\\subedot{}'},'\u2AC4':{'math':'\\supedot{}'},'\u2AC5':{'math':'\\subseteqq{}'},'\u2AC6':{'math':'\\supseteqq{}'},'\u2AC7':{'math':'\\subsim{}'},'\u2AC8':{'math':'\\supsim{}'},'\u2AC9':{'math':'\\subsetapprox{}'},'\u2ACA':{'math':'\\supsetapprox{}'},'\u2ACB':{'math':'\\subsetneqq{}'},'\u2ACC':{'math':'\\supsetneqq{}'},'\u2ACD':{'math':'\\lsqhook{}'},'\u2ACE':{'math':'\\rsqhook{}'},'\u2ACF':{'math':'\\csub{}'},'\u2AD0':{'math':'\\csup{}'},'\u2AD1':{'math':'\\csube{}'},'\u2AD2':{'math':'\\csupe{}'},'\u2AD3':{'math':'\\subsup{}'},'\u2AD4':{'math':'\\supsub{}'},'\u2AD5':{'math':'\\subsub{}'},'\u2AD6':{'math':'\\supsup{}'},'\u2AD7':{'math':'\\suphsub{}'},'\u2AD8':{'math':'\\supdsub{}'},'\u2AD9':{'math':'\\forkv{}'},'\u2ADA':{'math':'\\topfork{}'},'\u2ADB':{'math':'\\mlcp{}'},'\u2ADD\u0338':{'math':'\\forks{}'},'\u2ADD':{'math':'\\forksnot{}'},'\u2ADE':{'math':'\\shortlefttack{}'},'\u2ADF':{'math':'\\shortdowntack{}'},'\u2AE0':{'math':'\\shortuptack{}'},'\u2AE1':{'math':'\\perps{}'},'\u2AE2':{'math':'\\vDdash{}'},'\u2AE3':{'math':'\\dashV{}'},'\u2AE4':{'math':'\\Dashv{}'},'\u2AE5':{'math':'\\DashV{}'},'\u2AE6':{'math':'\\varVdash{}'},'\u2AE7':{'math':'\\Barv{}'},'\u2AE8':{'math':'\\vBar{}'},'\u2AE9':{'math':'\\vBarv{}'},'\u2AEA':{'math':'\\Top{}'},'\u2AEB':{'math':'\\ElsevierGlyph{E30D}'},'\u2AEC':{'math':'\\Not{}'},'\u2AED':{'math':'\\bNot{}'},'\u2AEE':{'math':'\\revnmid{}'},'\u2AEF':{'math':'\\cirmid{}'},'\u2AF0':{'math':'\\midcir{}'},'\u2AF1':{'math':'\\topcir{}'},'\u2AF2':{'math':'\\nhpar{}'},'\u2AF3':{'math':'\\parsim{}'},'\u2AF4':{'math':'\\interleave{}'},'\u2AF5':{'math':'\\nhVvert{}'},'\u2AF6':{'math':'\\Elztdcol{}'},'\u2AF7':{'math':'\\lllnest{}'},'\u2AF8':{'math':'\\gggnest{}'},'\u2AF9':{'math':'\\leqqslant{}'},'\u2AFA':{'math':'\\geqqslant{}'},'\u2AFB':{'math':'\\trslash{}'},'\u2AFC':{'math':'\\biginterleave{}'},'\u2AFD':{'math':'{{/}\\!\\!{/}}'},'\u2AFE':{'math':'\\talloblong{}'},'\u2AFF':{'math':'\\bigtalloblong{}'},'\u2B12':{'math':'\\squaretopblack{}'},'\u2B13':{'math':'\\squarebotblack{}'},'\u2B14':{'math':'\\squareurblack{}'},'\u2B15':{'math':'\\squarellblack{}'},'\u2B16':{'math':'\\diamondleftblack{}'},'\u2B17':{'math':'\\diamondrightblack{}'},'\u2B18':{'math':'\\diamondtopblack{}'},'\u2B19':{'math':'\\diamondbotblack{}'},'\u2B1A':{'math':'\\dottedsquare{}'},'\u2B1B':{'math':'\\blacksquare{}'},'\u2B1C':{'math':'\\square{}'},'\u2B1D':{'math':'\\vysmblksquare{}'},'\u2B1E':{'math':'\\vysmwhtsquare{}'},'\u2B1F':{'math':'\\pentagonblack{}'},'\u2B20':{'math':'\\pentagon{}'},'\u2B21':{'math':'\\varhexagon{}'},'\u2B22':{'math':'\\varhexagonblack{}'},'\u2B23':{'math':'\\hexagonblack{}'},'\u2B24':{'math':'\\lgblkcircle{}'},'\u2B25':{'math':'\\mdblkdiamond{}'},'\u2B26':{'math':'\\mdwhtdiamond{}'},'\u2B27':{'math':'\\mdblklozenge{}'},'\u2B28':{'math':'\\mdwhtlozenge{}'},'\u2B29':{'math':'\\smblkdiamond{}'},'\u2B2A':{'math':'\\smblklozenge{}'},'\u2B2B':{'math':'\\smwhtlozenge{}'},'\u2B2C':{'math':'\\blkhorzoval{}'},'\u2B2D':{'math':'\\whthorzoval{}'},'\u2B2E':{'math':'\\blkvertoval{}'},'\u2B2F':{'math':'\\whtvertoval{}'},'\u2B30':{'math':'\\circleonleftarrow{}'},'\u2B31':{'math':'\\leftthreearrows{}'},'\u2B32':{'math':'\\leftarrowonoplus{}'},'\u2B33':{'math':'\\longleftsquigarrow{}'},'\u2B34':{'math':'\\nvtwoheadleftarrow{}'},'\u2B35':{'math':'\\nVtwoheadleftarrow{}'},'\u2B36':{'math':'\\twoheadmapsfrom{}'},'\u2B37':{'math':'\\twoheadleftdbkarrow{}'},'\u2B38':{'math':'\\leftdotarrow{}'},'\u2B39':{'math':'\\nvleftarrowtail{}'},'\u2B3A':{'math':'\\nVleftarrowtail{}'},'\u2B3B':{'math':'\\twoheadleftarrowtail{}'},'\u2B3C':{'math':'\\nvtwoheadleftarrowtail{}'},'\u2B3D':{'math':'\\nVtwoheadleftarrowtail{}'},'\u2B3E':{'math':'\\leftarrowx{}'},'\u2B3F':{'math':'\\leftcurvedarrow{}'},'\u2B40':{'math':'\\equalleftarrow{}'},'\u2B41':{'math':'\\bsimilarleftarrow{}'},'\u2B42':{'math':'\\leftarrowbackapprox{}'},'\u2B43':{'math':'\\rightarrowgtr{}'},'\u2B44':{'math':'\\rightarrowsupset{}'},'\u2B45':{'math':'\\LLeftarrow{}'},'\u2B46':{'math':'\\RRightarrow{}'},'\u2B47':{'math':'\\bsimilarrightarrow{}'},'\u2B48':{'math':'\\rightarrowbackapprox{}'},'\u2B49':{'math':'\\similarleftarrow{}'},'\u2B4A':{'math':'\\leftarrowapprox{}'},'\u2B4B':{'math':'\\leftarrowbsimilar{}'},'\u2B4C':{'math':'\\rightarrowbsimilar{}'},'\u2B50':{'math':'\\medwhitestar{}'},'\u2B51':{'math':'\\medblackstar{}'},'\u2B52':{'math':'\\smwhitestar{}'},'\u2B53':{'math':'\\rightpentagonblack{}'},'\u2B54':{'math':'\\rightpentagon{}'},'\u300A':{'math':'\\ElsevierGlyph{300A}'},'\u300B':{'math':'\\ElsevierGlyph{300B}'},'\u3012':{'math':'\\postalmark{}'},'\u3014':{'math':'\\lbrbrak{}'},'\u3015':{'math':'\\rbrbrak{}'},'\u3018':{'math':'\\ElsevierGlyph{3018}'},'\u3019':{'math':'\\ElsevierGlyph{3019}'},'\u301A':{'math':'\\openbracketleft{}'},'\u301B':{'math':'\\openbracketright{}'},'\u3030':{'math':'\\hzigzag{}'},'\uFB00':{'text':'ff'},'\uFB01':{'text':'fi'},'\uFB02':{'text':'fl'},'\uFB03':{'text':'ffi'},'\uFB04':{'text':'ffl'},'\uFB05':{'text':'st'},'\uFB06':{'text':'st'},'\uFFFD':{'text':'\\dbend{}'},'\u2242\u0338':{'math':'\\NotEqualTilde{}'},'\u224B\u0338':{'math':'\\not\\apid{}'},'\u224E\u0338':{'math':'\\NotHumpDownHump{}'},'\u224F\u0338':{'math':'\\NotHumpEqual{}'},'\u2250\u0338':{'math':'\\not\\doteq{}'},'\u2268\uFE00':{'math':'\\lvertneqq{}'},'\u2269\uFE00':{'math':'\\gvertneqq{}'},'\u226A\u0338':{'math':'\\NotLessLess{}'},'\u226B\u0338':{'math':'\\NotGreaterGreater{}'},'\u227E\u0338':{'math':'\\NotPrecedesTilde{}'},'\u227F\u0338':{'math':'\\NotSucceedsTilde{}'},'\u228A\uFE00':{'math':'\\varsubsetneqq{}'},'\u228B\uFE00':{'math':'\\varsupsetneq{}'},'\u228F\u0338':{'math':'\\NotSquareSubset{}'},'\u2290\u0338':{'math':'\\NotSquareSuperset{}'},'\u2933\u0338':{'math':'\\ElsevierGlyph{E21D}'},'\u29CF\u0338':{'math':'\\NotLeftTriangleBar{}'},'\u29D0\u0338':{'math':'\\NotRightTriangleBar{}'},'\u2A7D\u0338':{'math':'\\nleqslant{}'},'\u2A7E\u0338':{'math':'\\ngeqslant{}'},'\u2AA1\u0338':{'math':'\\NotNestedLessLess{}'},'\u2AA2\u0338':{'math':'\\NotNestedGreaterGreater{}'},'\u2AAF\u0338':{'math':'\\not\\preceq{}'},'\u2AB0\u0338':{'math':'\\not\\succeq{}'},'\u2AC5\u0338':{'math':'\\nsubseteqq{}'},'\u2AC6\u0338':{'math':'\\nsupseteqq{}'},'\u2AFD\u20E5':{'math':'{\\rlap{\\textbackslash}{{/}\\!\\!{/}}}'},'\uD835\uDC00':{'math':'\\mathbf{A}'},'\uD835\uDC01':{'math':'\\mathbf{B}'},'\uD835\uDC02':{'math':'\\mathbf{C}'},'\uD835\uDC03':{'math':'\\mathbf{D}'},'\uD835\uDC04':{'math':'\\mathbf{E}'},'\uD835\uDC05':{'math':'\\mathbf{F}'},'\uD835\uDC06':{'math':'\\mathbf{G}'},'\uD835\uDC07':{'math':'\\mathbf{H}'},'\uD835\uDC08':{'math':'\\mathbf{I}'},'\uD835\uDC09':{'math':'\\mathbf{J}'},'\uD835\uDC0A':{'math':'\\mathbf{K}'},'\uD835\uDC0B':{'math':'\\mathbf{L}'},'\uD835\uDC0C':{'math':'\\mathbf{M}'},'\uD835\uDC0D':{'math':'\\mathbf{N}'},'\uD835\uDC0E':{'math':'\\mathbf{O}'},'\uD835\uDC0F':{'math':'\\mathbf{P}'},'\uD835\uDC10':{'math':'\\mathbf{Q}'},'\uD835\uDC11':{'math':'\\mathbf{R}'},'\uD835\uDC12':{'math':'\\mathbf{S}'},'\uD835\uDC13':{'math':'\\mathbf{T}'},'\uD835\uDC14':{'math':'\\mathbf{U}'},'\uD835\uDC15':{'math':'\\mathbf{V}'},'\uD835\uDC16':{'math':'\\mathbf{W}'},'\uD835\uDC17':{'math':'\\mathbf{X}'},'\uD835\uDC18':{'math':'\\mathbf{Y}'},'\uD835\uDC19':{'math':'\\mathbf{Z}'},'\uD835\uDC1A':{'math':'\\mathbf{a}'},'\uD835\uDC1B':{'math':'\\mathbf{b}'},'\uD835\uDC1C':{'math':'\\mathbf{c}'},'\uD835\uDC1D':{'math':'\\mathbf{d}'},'\uD835\uDC1E':{'math':'\\mathbf{e}'},'\uD835\uDC1F':{'math':'\\mathbf{f}'},'\uD835\uDC20':{'math':'\\mathbf{g}'},'\uD835\uDC21':{'math':'\\mathbf{h}'},'\uD835\uDC22':{'math':'\\mathbf{i}'},'\uD835\uDC23':{'math':'\\mathbf{j}'},'\uD835\uDC24':{'math':'\\mathbf{k}'},'\uD835\uDC25':{'math':'\\mathbf{l}'},'\uD835\uDC26':{'math':'\\mathbf{m}'},'\uD835\uDC27':{'math':'\\mathbf{n}'},'\uD835\uDC28':{'math':'\\mathbf{o}'},'\uD835\uDC29':{'math':'\\mathbf{p}'},'\uD835\uDC2A':{'math':'\\mathbf{q}'},'\uD835\uDC2B':{'math':'\\mathbf{r}'},'\uD835\uDC2C':{'math':'\\mathbf{s}'},'\uD835\uDC2D':{'math':'\\mathbf{t}'},'\uD835\uDC2E':{'math':'\\mathbf{u}'},'\uD835\uDC2F':{'math':'\\mathbf{v}'},'\uD835\uDC30':{'math':'\\mathbf{w}'},'\uD835\uDC31':{'math':'\\mathbf{x}'},'\uD835\uDC32':{'math':'\\mathbf{y}'},'\uD835\uDC33':{'math':'\\mathbf{z}'},'\uD835\uDC34':{'math':'\\mathsl{A}'},'\uD835\uDC35':{'math':'\\mathsl{B}'},'\uD835\uDC36':{'math':'\\mathsl{C}'},'\uD835\uDC37':{'math':'\\mathsl{D}'},'\uD835\uDC38':{'math':'\\mathsl{E}'},'\uD835\uDC39':{'math':'\\mathsl{F}'},'\uD835\uDC3A':{'math':'\\mathsl{G}'},'\uD835\uDC3B':{'math':'\\mathsl{H}'},'\uD835\uDC3C':{'math':'\\mathsl{I}'},'\uD835\uDC3D':{'math':'\\mathsl{J}'},'\uD835\uDC3E':{'math':'\\mathsl{K}'},'\uD835\uDC3F':{'math':'\\mathsl{L}'},'\uD835\uDC40':{'math':'\\mathsl{M}'},'\uD835\uDC41':{'math':'\\mathsl{N}'},'\uD835\uDC42':{'math':'\\mathsl{O}'},'\uD835\uDC43':{'math':'\\mathsl{P}'},'\uD835\uDC44':{'math':'\\mathsl{Q}'},'\uD835\uDC45':{'math':'\\mathsl{R}'},'\uD835\uDC46':{'math':'\\mathsl{S}'},'\uD835\uDC47':{'math':'\\mathsl{T}'},'\uD835\uDC48':{'math':'\\mathsl{U}'},'\uD835\uDC49':{'math':'\\mathsl{V}'},'\uD835\uDC4A':{'math':'\\mathsl{W}'},'\uD835\uDC4B':{'math':'\\mathsl{X}'},'\uD835\uDC4C':{'math':'\\mathsl{Y}'},'\uD835\uDC4D':{'math':'\\mathsl{Z}'},'\uD835\uDC4E':{'math':'\\mathsl{a}'},'\uD835\uDC4F':{'math':'\\mathsl{b}'},'\uD835\uDC50':{'math':'\\mathsl{c}'},'\uD835\uDC51':{'math':'\\mathsl{d}'},'\uD835\uDC52':{'math':'\\mathsl{e}'},'\uD835\uDC53':{'math':'\\mathsl{f}'},'\uD835\uDC54':{'math':'\\mathsl{g}'},'\uD835\uDC56':{'math':'\\mathsl{i}'},'\uD835\uDC57':{'math':'\\mathsl{j}'},'\uD835\uDC58':{'math':'\\mathsl{k}'},'\uD835\uDC59':{'math':'\\mathsl{l}'},'\uD835\uDC5A':{'math':'\\mathsl{m}'},'\uD835\uDC5B':{'math':'\\mathsl{n}'},'\uD835\uDC5C':{'math':'\\mathsl{o}'},'\uD835\uDC5D':{'math':'\\mathsl{p}'},'\uD835\uDC5E':{'math':'\\mathsl{q}'},'\uD835\uDC5F':{'math':'\\mathsl{r}'},'\uD835\uDC60':{'math':'\\mathsl{s}'},'\uD835\uDC61':{'math':'\\mathsl{t}'},'\uD835\uDC62':{'math':'\\mathsl{u}'},'\uD835\uDC63':{'math':'\\mathsl{v}'},'\uD835\uDC64':{'math':'\\mathsl{w}'},'\uD835\uDC65':{'math':'\\mathsl{x}'},'\uD835\uDC66':{'math':'\\mathsl{y}'},'\uD835\uDC67':{'math':'\\mathsl{z}'},'\uD835\uDC68':{'math':'\\mathbit{A}'},'\uD835\uDC69':{'math':'\\mathbit{B}'},'\uD835\uDC6A':{'math':'\\mathbit{C}'},'\uD835\uDC6B':{'math':'\\mathbit{D}'},'\uD835\uDC6C':{'math':'\\mathbit{E}'},'\uD835\uDC6D':{'math':'\\mathbit{F}'},'\uD835\uDC6E':{'math':'\\mathbit{G}'},'\uD835\uDC6F':{'math':'\\mathbit{H}'},'\uD835\uDC70':{'math':'\\mathbit{I}'},'\uD835\uDC71':{'math':'\\mathbit{J}'},'\uD835\uDC72':{'math':'\\mathbit{K}'},'\uD835\uDC73':{'math':'\\mathbit{L}'},'\uD835\uDC74':{'math':'\\mathbit{M}'},'\uD835\uDC75':{'math':'\\mathbit{N}'},'\uD835\uDC76':{'math':'\\mathbit{O}'},'\uD835\uDC77':{'math':'\\mathbit{P}'},'\uD835\uDC78':{'math':'\\mathbit{Q}'},'\uD835\uDC79':{'math':'\\mathbit{R}'},'\uD835\uDC7A':{'math':'\\mathbit{S}'},'\uD835\uDC7B':{'math':'\\mathbit{T}'},'\uD835\uDC7C':{'math':'\\mathbit{U}'},'\uD835\uDC7D':{'math':'\\mathbit{V}'},'\uD835\uDC7E':{'math':'\\mathbit{W}'},'\uD835\uDC7F':{'math':'\\mathbit{X}'},'\uD835\uDC80':{'math':'\\mathbit{Y}'},'\uD835\uDC81':{'math':'\\mathbit{Z}'},'\uD835\uDC82':{'math':'\\mathbit{a}'},'\uD835\uDC83':{'math':'\\mathbit{b}'},'\uD835\uDC84':{'math':'\\mathbit{c}'},'\uD835\uDC85':{'math':'\\mathbit{d}'},'\uD835\uDC86':{'math':'\\mathbit{e}'},'\uD835\uDC87':{'math':'\\mathbit{f}'},'\uD835\uDC88':{'math':'\\mathbit{g}'},'\uD835\uDC89':{'math':'\\mathbit{h}'},'\uD835\uDC8A':{'math':'\\mathbit{i}'},'\uD835\uDC8B':{'math':'\\mathbit{j}'},'\uD835\uDC8C':{'math':'\\mathbit{k}'},'\uD835\uDC8D':{'math':'\\mathbit{l}'},'\uD835\uDC8E':{'math':'\\mathbit{m}'},'\uD835\uDC8F':{'math':'\\mathbit{n}'},'\uD835\uDC90':{'math':'\\mathbit{o}'},'\uD835\uDC91':{'math':'\\mathbit{p}'},'\uD835\uDC92':{'math':'\\mathbit{q}'},'\uD835\uDC93':{'math':'\\mathbit{r}'},'\uD835\uDC94':{'math':'\\mathbit{s}'},'\uD835\uDC95':{'math':'\\mathbit{t}'},'\uD835\uDC96':{'math':'\\mathbit{u}'},'\uD835\uDC97':{'math':'\\mathbit{v}'},'\uD835\uDC98':{'math':'\\mathbit{w}'},'\uD835\uDC99':{'math':'\\mathbit{x}'},'\uD835\uDC9A':{'math':'\\mathbit{y}'},'\uD835\uDC9B':{'math':'\\mathbit{z}'},'\uD835\uDC9C':{'math':'\\mathscr{A}'},'\uD835\uDC9E':{'math':'\\mathscr{C}'},'\uD835\uDC9F':{'math':'\\mathscr{D}'},'\uD835\uDCA2':{'math':'\\mathscr{G}'},'\uD835\uDCA5':{'math':'\\mathscr{J}'},'\uD835\uDCA6':{'math':'\\mathscr{K}'},'\uD835\uDCA9':{'math':'\\mathscr{N}'},'\uD835\uDCAA':{'math':'\\mathscr{O}'},'\uD835\uDCAB':{'math':'\\mathscr{P}'},'\uD835\uDCAC':{'math':'\\mathscr{Q}'},'\uD835\uDCAE':{'math':'\\mathscr{S}'},'\uD835\uDCAF':{'math':'\\mathscr{T}'},'\uD835\uDCB0':{'math':'\\mathscr{U}'},'\uD835\uDCB1':{'math':'\\mathscr{V}'},'\uD835\uDCB2':{'math':'\\mathscr{W}'},'\uD835\uDCB3':{'math':'\\mathscr{X}'},'\uD835\uDCB4':{'math':'\\mathscr{Y}'},'\uD835\uDCB5':{'math':'\\mathscr{Z}'},'\uD835\uDCB6':{'math':'\\mathscr{a}'},'\uD835\uDCB7':{'math':'\\mathscr{b}'},'\uD835\uDCB8':{'math':'\\mathscr{c}'},'\uD835\uDCB9':{'math':'\\mathscr{d}'},'\uD835\uDCBB':{'math':'\\mathscr{f}'},'\uD835\uDCBD':{'math':'\\mathscr{h}'},'\uD835\uDCBE':{'math':'\\mathscr{i}'},'\uD835\uDCBF':{'math':'\\mathscr{j}'},'\uD835\uDCC0':{'math':'\\mathscr{k}'},'\uD835\uDCC1':{'math':'\\mathscr{l}'},'\uD835\uDCC2':{'math':'\\mathscr{m}'},'\uD835\uDCC3':{'math':'\\mathscr{n}'},'\uD835\uDCC5':{'math':'\\mathscr{p}'},'\uD835\uDCC6':{'math':'\\mathscr{q}'},'\uD835\uDCC7':{'math':'\\mathscr{r}'},'\uD835\uDCC8':{'math':'\\mathscr{s}'},'\uD835\uDCC9':{'math':'\\mathscr{t}'},'\uD835\uDCCA':{'math':'\\mathscr{u}'},'\uD835\uDCCB':{'math':'\\mathscr{v}'},'\uD835\uDCCC':{'math':'\\mathscr{w}'},'\uD835\uDCCD':{'math':'\\mathscr{x}'},'\uD835\uDCCE':{'math':'\\mathscr{y}'},'\uD835\uDCCF':{'math':'\\mathscr{z}'},'\uD835\uDCD0':{'math':'\\mathmit{A}'},'\uD835\uDCD1':{'math':'\\mathmit{B}'},'\uD835\uDCD2':{'math':'\\mathmit{C}'},'\uD835\uDCD3':{'math':'\\mathmit{D}'},'\uD835\uDCD4':{'math':'\\mathmit{E}'},'\uD835\uDCD5':{'math':'\\mathmit{F}'},'\uD835\uDCD6':{'math':'\\mathmit{G}'},'\uD835\uDCD7':{'math':'\\mathmit{H}'},'\uD835\uDCD8':{'math':'\\mathmit{I}'},'\uD835\uDCD9':{'math':'\\mathmit{J}'},'\uD835\uDCDA':{'math':'\\mathmit{K}'},'\uD835\uDCDB':{'math':'\\mathmit{L}'},'\uD835\uDCDC':{'math':'\\mathmit{M}'},'\uD835\uDCDD':{'math':'\\mathmit{N}'},'\uD835\uDCDE':{'math':'\\mathmit{O}'},'\uD835\uDCDF':{'math':'\\mathmit{P}'},'\uD835\uDCE0':{'math':'\\mathmit{Q}'},'\uD835\uDCE1':{'math':'\\mathmit{R}'},'\uD835\uDCE2':{'math':'\\mathmit{S}'},'\uD835\uDCE3':{'math':'\\mathmit{T}'},'\uD835\uDCE4':{'math':'\\mathmit{U}'},'\uD835\uDCE5':{'math':'\\mathmit{V}'},'\uD835\uDCE6':{'math':'\\mathmit{W}'},'\uD835\uDCE7':{'math':'\\mathmit{X}'},'\uD835\uDCE8':{'math':'\\mathmit{Y}'},'\uD835\uDCE9':{'math':'\\mathmit{Z}'},'\uD835\uDCEA':{'math':'\\mathmit{a}'},'\uD835\uDCEB':{'math':'\\mathmit{b}'},'\uD835\uDCEC':{'math':'\\mathmit{c}'},'\uD835\uDCED':{'math':'\\mathmit{d}'},'\uD835\uDCEE':{'math':'\\mathmit{e}'},'\uD835\uDCEF':{'math':'\\mathmit{f}'},'\uD835\uDCF0':{'math':'\\mathmit{g}'},'\uD835\uDCF1':{'math':'\\mathmit{h}'},'\uD835\uDCF2':{'math':'\\mathmit{i}'},'\uD835\uDCF3':{'math':'\\mathmit{j}'},'\uD835\uDCF4':{'math':'\\mathmit{k}'},'\uD835\uDCF5':{'math':'\\mathmit{l}'},'\uD835\uDCF6':{'math':'\\mathmit{m}'},'\uD835\uDCF7':{'math':'\\mathmit{n}'},'\uD835\uDCF8':{'math':'\\mathmit{o}'},'\uD835\uDCF9':{'math':'\\mathmit{p}'},'\uD835\uDCFA':{'math':'\\mathmit{q}'},'\uD835\uDCFB':{'math':'\\mathmit{r}'},'\uD835\uDCFC':{'math':'\\mathmit{s}'},'\uD835\uDCFD':{'math':'\\mathmit{t}'},'\uD835\uDCFE':{'math':'\\mathmit{u}'},'\uD835\uDCFF':{'math':'\\mathmit{v}'},'\uD835\uDD00':{'math':'\\mathmit{w}'},'\uD835\uDD01':{'math':'\\mathmit{x}'},'\uD835\uDD02':{'math':'\\mathmit{y}'},'\uD835\uDD03':{'math':'\\mathmit{z}'},'\uD835\uDD04':{'math':'\\mathfrak{A}'},'\uD835\uDD05':{'math':'\\mathfrak{B}'},'\uD835\uDD07':{'math':'\\mathfrak{D}'},'\uD835\uDD08':{'math':'\\mathfrak{E}'},'\uD835\uDD09':{'math':'\\mathfrak{F}'},'\uD835\uDD0A':{'math':'\\mathfrak{G}'},'\uD835\uDD0D':{'math':'\\mathfrak{J}'},'\uD835\uDD0E':{'math':'\\mathfrak{K}'},'\uD835\uDD0F':{'math':'\\mathfrak{L}'},'\uD835\uDD10':{'math':'\\mathfrak{M}'},'\uD835\uDD11':{'math':'\\mathfrak{N}'},'\uD835\uDD12':{'math':'\\mathfrak{O}'},'\uD835\uDD13':{'math':'\\mathfrak{P}'},'\uD835\uDD14':{'math':'\\mathfrak{Q}'},'\uD835\uDD16':{'math':'\\mathfrak{S}'},'\uD835\uDD17':{'math':'\\mathfrak{T}'},'\uD835\uDD18':{'math':'\\mathfrak{U}'},'\uD835\uDD19':{'math':'\\mathfrak{V}'},'\uD835\uDD1A':{'math':'\\mathfrak{W}'},'\uD835\uDD1B':{'math':'\\mathfrak{X}'},'\uD835\uDD1C':{'math':'\\mathfrak{Y}'},'\uD835\uDD1E':{'math':'\\mathfrak{a}'},'\uD835\uDD1F':{'math':'\\mathfrak{b}'},'\uD835\uDD20':{'math':'\\mathfrak{c}'},'\uD835\uDD21':{'math':'\\mathfrak{d}'},'\uD835\uDD22':{'math':'\\mathfrak{e}'},'\uD835\uDD23':{'math':'\\mathfrak{f}'},'\uD835\uDD24':{'math':'\\mathfrak{g}'},'\uD835\uDD25':{'math':'\\mathfrak{h}'},'\uD835\uDD26':{'math':'\\mathfrak{i}'},'\uD835\uDD27':{'math':'\\mathfrak{j}'},'\uD835\uDD28':{'math':'\\mathfrak{k}'},'\uD835\uDD29':{'math':'\\mathfrak{l}'},'\uD835\uDD2A':{'math':'\\mathfrak{m}'},'\uD835\uDD2B':{'math':'\\mathfrak{n}'},'\uD835\uDD2C':{'math':'\\mathfrak{o}'},'\uD835\uDD2D':{'math':'\\mathfrak{p}'},'\uD835\uDD2E':{'math':'\\mathfrak{q}'},'\uD835\uDD2F':{'math':'\\mathfrak{r}'},'\uD835\uDD30':{'math':'\\mathfrak{s}'},'\uD835\uDD31':{'math':'\\mathfrak{t}'},'\uD835\uDD32':{'math':'\\mathfrak{u}'},'\uD835\uDD33':{'math':'\\mathfrak{v}'},'\uD835\uDD34':{'math':'\\mathfrak{w}'},'\uD835\uDD35':{'math':'\\mathfrak{x}'},'\uD835\uDD36':{'math':'\\mathfrak{y}'},'\uD835\uDD37':{'math':'\\mathfrak{z}'},'\uD835\uDD38':{'math':'\\mathbb{A}'},'\uD835\uDD39':{'math':'\\mathbb{B}'},'\uD835\uDD3B':{'math':'\\mathbb{D}'},'\uD835\uDD3C':{'math':'\\mathbb{E}'},'\uD835\uDD3D':{'math':'\\mathbb{F}'},'\uD835\uDD3E':{'math':'\\mathbb{G}'},'\uD835\uDD40':{'math':'\\mathbb{I}'},'\uD835\uDD41':{'math':'\\mathbb{J}'},'\uD835\uDD42':{'math':'\\mathbb{K}'},'\uD835\uDD43':{'math':'\\mathbb{L}'},'\uD835\uDD44':{'math':'\\mathbb{M}'},'\uD835\uDD46':{'math':'\\mathbb{O}'},'\uD835\uDD4A':{'math':'\\mathbb{S}'},'\uD835\uDD4B':{'math':'\\mathbb{T}'},'\uD835\uDD4C':{'math':'\\mathbb{U}'},'\uD835\uDD4D':{'math':'\\mathbb{V}'},'\uD835\uDD4E':{'math':'\\mathbb{W}'},'\uD835\uDD4F':{'math':'\\mathbb{X}'},'\uD835\uDD50':{'math':'\\mathbb{Y}'},'\uD835\uDD52':{'math':'\\mathbb{a}'},'\uD835\uDD53':{'math':'\\mathbb{b}'},'\uD835\uDD54':{'math':'\\mathbb{c}'},'\uD835\uDD55':{'math':'\\mathbb{d}'},'\uD835\uDD56':{'math':'\\mathbb{e}'},'\uD835\uDD57':{'math':'\\mathbb{f}'},'\uD835\uDD58':{'math':'\\mathbb{g}'},'\uD835\uDD59':{'math':'\\mathbb{h}'},'\uD835\uDD5A':{'math':'\\mathbb{i}'},'\uD835\uDD5B':{'math':'\\mathbb{j}'},'\uD835\uDD5C':{'math':'\\mathbb{k}'},'\uD835\uDD5D':{'math':'\\mathbb{l}'},'\uD835\uDD5E':{'math':'\\mathbb{m}'},'\uD835\uDD5F':{'math':'\\mathbb{n}'},'\uD835\uDD60':{'math':'\\mathbb{o}'},'\uD835\uDD61':{'math':'\\mathbb{p}'},'\uD835\uDD62':{'math':'\\mathbb{q}'},'\uD835\uDD63':{'math':'\\mathbb{r}'},'\uD835\uDD64':{'math':'\\mathbb{s}'},'\uD835\uDD65':{'math':'\\mathbb{t}'},'\uD835\uDD66':{'math':'\\mathbb{u}'},'\uD835\uDD67':{'math':'\\mathbb{v}'},'\uD835\uDD68':{'math':'\\mathbb{w}'},'\uD835\uDD69':{'math':'\\mathbb{x}'},'\uD835\uDD6A':{'math':'\\mathbb{y}'},'\uD835\uDD6B':{'math':'\\mathbb{z}'},'\uD835\uDD6C':{'math':'\\mathslbb{A}'},'\uD835\uDD6D':{'math':'\\mathslbb{B}'},'\uD835\uDD6E':{'math':'\\mathslbb{C}'},'\uD835\uDD6F':{'math':'\\mathslbb{D}'},'\uD835\uDD70':{'math':'\\mathslbb{E}'},'\uD835\uDD71':{'math':'\\mathslbb{F}'},'\uD835\uDD72':{'math':'\\mathslbb{G}'},'\uD835\uDD73':{'math':'\\mathslbb{H}'},'\uD835\uDD74':{'math':'\\mathslbb{I}'},'\uD835\uDD75':{'math':'\\mathslbb{J}'},'\uD835\uDD76':{'math':'\\mathslbb{K}'},'\uD835\uDD77':{'math':'\\mathslbb{L}'},'\uD835\uDD78':{'math':'\\mathslbb{M}'},'\uD835\uDD79':{'math':'\\mathslbb{N}'},'\uD835\uDD7A':{'math':'\\mathslbb{O}'},'\uD835\uDD7B':{'math':'\\mathslbb{P}'},'\uD835\uDD7C':{'math':'\\mathslbb{Q}'},'\uD835\uDD7D':{'math':'\\mathslbb{R}'},'\uD835\uDD7E':{'math':'\\mathslbb{S}'},'\uD835\uDD7F':{'math':'\\mathslbb{T}'},'\uD835\uDD80':{'math':'\\mathslbb{U}'},'\uD835\uDD81':{'math':'\\mathslbb{V}'},'\uD835\uDD82':{'math':'\\mathslbb{W}'},'\uD835\uDD83':{'math':'\\mathslbb{X}'},'\uD835\uDD84':{'math':'\\mathslbb{Y}'},'\uD835\uDD85':{'math':'\\mathslbb{Z}'},'\uD835\uDD86':{'math':'\\mathslbb{a}'},'\uD835\uDD87':{'math':'\\mathslbb{b}'},'\uD835\uDD88':{'math':'\\mathslbb{c}'},'\uD835\uDD89':{'math':'\\mathslbb{d}'},'\uD835\uDD8A':{'math':'\\mathslbb{e}'},'\uD835\uDD8B':{'math':'\\mathslbb{f}'},'\uD835\uDD8C':{'math':'\\mathslbb{g}'},'\uD835\uDD8D':{'math':'\\mathslbb{h}'},'\uD835\uDD8E':{'math':'\\mathslbb{i}'},'\uD835\uDD8F':{'math':'\\mathslbb{j}'},'\uD835\uDD90':{'math':'\\mathslbb{k}'},'\uD835\uDD91':{'math':'\\mathslbb{l}'},'\uD835\uDD92':{'math':'\\mathslbb{m}'},'\uD835\uDD93':{'math':'\\mathslbb{n}'},'\uD835\uDD94':{'math':'\\mathslbb{o}'},'\uD835\uDD95':{'math':'\\mathslbb{p}'},'\uD835\uDD96':{'math':'\\mathslbb{q}'},'\uD835\uDD97':{'math':'\\mathslbb{r}'},'\uD835\uDD98':{'math':'\\mathslbb{s}'},'\uD835\uDD99':{'math':'\\mathslbb{t}'},'\uD835\uDD9A':{'math':'\\mathslbb{u}'},'\uD835\uDD9B':{'math':'\\mathslbb{v}'},'\uD835\uDD9C':{'math':'\\mathslbb{w}'},'\uD835\uDD9D':{'math':'\\mathslbb{x}'},'\uD835\uDD9E':{'math':'\\mathslbb{y}'},'\uD835\uDD9F':{'math':'\\mathslbb{z}'},'\uD835\uDDA0':{'math':'\\mathsf{A}'},'\uD835\uDDA1':{'math':'\\mathsf{B}'},'\uD835\uDDA2':{'math':'\\mathsf{C}'},'\uD835\uDDA3':{'math':'\\mathsf{D}'},'\uD835\uDDA4':{'math':'\\mathsf{E}'},'\uD835\uDDA5':{'math':'\\mathsf{F}'},'\uD835\uDDA6':{'math':'\\mathsf{G}'},'\uD835\uDDA7':{'math':'\\mathsf{H}'},'\uD835\uDDA8':{'math':'\\mathsf{I}'},'\uD835\uDDA9':{'math':'\\mathsf{J}'},'\uD835\uDDAA':{'math':'\\mathsf{K}'},'\uD835\uDDAB':{'math':'\\mathsf{L}'},'\uD835\uDDAC':{'math':'\\mathsf{M}'},'\uD835\uDDAD':{'math':'\\mathsf{N}'},'\uD835\uDDAE':{'math':'\\mathsf{O}'},'\uD835\uDDAF':{'math':'\\mathsf{P}'},'\uD835\uDDB0':{'math':'\\mathsf{Q}'},'\uD835\uDDB1':{'math':'\\mathsf{R}'},'\uD835\uDDB2':{'math':'\\mathsf{S}'},'\uD835\uDDB3':{'math':'\\mathsf{T}'},'\uD835\uDDB4':{'math':'\\mathsf{U}'},'\uD835\uDDB5':{'math':'\\mathsf{V}'},'\uD835\uDDB6':{'math':'\\mathsf{W}'},'\uD835\uDDB7':{'math':'\\mathsf{X}'},'\uD835\uDDB8':{'math':'\\mathsf{Y}'},'\uD835\uDDB9':{'math':'\\mathsf{Z}'},'\uD835\uDDBA':{'math':'\\mathsf{a}'},'\uD835\uDDBB':{'math':'\\mathsf{b}'},'\uD835\uDDBC':{'math':'\\mathsf{c}'},'\uD835\uDDBD':{'math':'\\mathsf{d}'},'\uD835\uDDBE':{'math':'\\mathsf{e}'},'\uD835\uDDBF':{'math':'\\mathsf{f}'},'\uD835\uDDC0':{'math':'\\mathsf{g}'},'\uD835\uDDC1':{'math':'\\mathsf{h}'},'\uD835\uDDC2':{'math':'\\mathsf{i}'},'\uD835\uDDC3':{'math':'\\mathsf{j}'},'\uD835\uDDC4':{'math':'\\mathsf{k}'},'\uD835\uDDC5':{'math':'\\mathsf{l}'},'\uD835\uDDC6':{'math':'\\mathsf{m}'},'\uD835\uDDC7':{'math':'\\mathsf{n}'},'\uD835\uDDC8':{'math':'\\mathsf{o}'},'\uD835\uDDC9':{'math':'\\mathsf{p}'},'\uD835\uDDCA':{'math':'\\mathsf{q}'},'\uD835\uDDCB':{'math':'\\mathsf{r}'},'\uD835\uDDCC':{'math':'\\mathsf{s}'},'\uD835\uDDCD':{'math':'\\mathsf{t}'},'\uD835\uDDCE':{'math':'\\mathsf{u}'},'\uD835\uDDCF':{'math':'\\mathsf{v}'},'\uD835\uDDD0':{'math':'\\mathsf{w}'},'\uD835\uDDD1':{'math':'\\mathsf{x}'},'\uD835\uDDD2':{'math':'\\mathsf{y}'},'\uD835\uDDD3':{'math':'\\mathsf{z}'},'\uD835\uDDD4':{'math':'\\mathsfbf{A}'},'\uD835\uDDD5':{'math':'\\mathsfbf{B}'},'\uD835\uDDD6':{'math':'\\mathsfbf{C}'},'\uD835\uDDD7':{'math':'\\mathsfbf{D}'},'\uD835\uDDD8':{'math':'\\mathsfbf{E}'},'\uD835\uDDD9':{'math':'\\mathsfbf{F}'},'\uD835\uDDDA':{'math':'\\mathsfbf{G}'},'\uD835\uDDDB':{'math':'\\mathsfbf{H}'},'\uD835\uDDDC':{'math':'\\mathsfbf{I}'},'\uD835\uDDDD':{'math':'\\mathsfbf{J}'},'\uD835\uDDDE':{'math':'\\mathsfbf{K}'},'\uD835\uDDDF':{'math':'\\mathsfbf{L}'},'\uD835\uDDE0':{'math':'\\mathsfbf{M}'},'\uD835\uDDE1':{'math':'\\mathsfbf{N}'},'\uD835\uDDE2':{'math':'\\mathsfbf{O}'},'\uD835\uDDE3':{'math':'\\mathsfbf{P}'},'\uD835\uDDE4':{'math':'\\mathsfbf{Q}'},'\uD835\uDDE5':{'math':'\\mathsfbf{R}'},'\uD835\uDDE6':{'math':'\\mathsfbf{S}'},'\uD835\uDDE7':{'math':'\\mathsfbf{T}'},'\uD835\uDDE8':{'math':'\\mathsfbf{U}'},'\uD835\uDDE9':{'math':'\\mathsfbf{V}'},'\uD835\uDDEA':{'math':'\\mathsfbf{W}'},'\uD835\uDDEB':{'math':'\\mathsfbf{X}'},'\uD835\uDDEC':{'math':'\\mathsfbf{Y}'},'\uD835\uDDED':{'math':'\\mathsfbf{Z}'},'\uD835\uDDEE':{'math':'\\mathsfbf{a}'},'\uD835\uDDEF':{'math':'\\mathsfbf{b}'},'\uD835\uDDF0':{'math':'\\mathsfbf{c}'},'\uD835\uDDF1':{'math':'\\mathsfbf{d}'},'\uD835\uDDF2':{'math':'\\mathsfbf{e}'},'\uD835\uDDF3':{'math':'\\mathsfbf{f}'},'\uD835\uDDF4':{'math':'\\mathsfbf{g}'},'\uD835\uDDF5':{'math':'\\mathsfbf{h}'},'\uD835\uDDF6':{'math':'\\mathsfbf{i}'},'\uD835\uDDF7':{'math':'\\mathsfbf{j}'},'\uD835\uDDF8':{'math':'\\mathsfbf{k}'},'\uD835\uDDF9':{'math':'\\mathsfbf{l}'},'\uD835\uDDFA':{'math':'\\mathsfbf{m}'},'\uD835\uDDFB':{'math':'\\mathsfbf{n}'},'\uD835\uDDFC':{'math':'\\mathsfbf{o}'},'\uD835\uDDFD':{'math':'\\mathsfbf{p}'},'\uD835\uDDFE':{'math':'\\mathsfbf{q}'},'\uD835\uDDFF':{'math':'\\mathsfbf{r}'},'\uD835\uDE00':{'math':'\\mathsfbf{s}'},'\uD835\uDE01':{'math':'\\mathsfbf{t}'},'\uD835\uDE02':{'math':'\\mathsfbf{u}'},'\uD835\uDE03':{'math':'\\mathsfbf{v}'},'\uD835\uDE04':{'math':'\\mathsfbf{w}'},'\uD835\uDE05':{'math':'\\mathsfbf{x}'},'\uD835\uDE06':{'math':'\\mathsfbf{y}'},'\uD835\uDE07':{'math':'\\mathsfbf{z}'},'\uD835\uDE08':{'math':'\\mathsfsl{A}'},'\uD835\uDE09':{'math':'\\mathsfsl{B}'},'\uD835\uDE0A':{'math':'\\mathsfsl{C}'},'\uD835\uDE0B':{'math':'\\mathsfsl{D}'},'\uD835\uDE0C':{'math':'\\mathsfsl{E}'},'\uD835\uDE0D':{'math':'\\mathsfsl{F}'},'\uD835\uDE0E':{'math':'\\mathsfsl{G}'},'\uD835\uDE0F':{'math':'\\mathsfsl{H}'},'\uD835\uDE10':{'math':'\\mathsfsl{I}'},'\uD835\uDE11':{'math':'\\mathsfsl{J}'},'\uD835\uDE12':{'math':'\\mathsfsl{K}'},'\uD835\uDE13':{'math':'\\mathsfsl{L}'},'\uD835\uDE14':{'math':'\\mathsfsl{M}'},'\uD835\uDE15':{'math':'\\mathsfsl{N}'},'\uD835\uDE16':{'math':'\\mathsfsl{O}'},'\uD835\uDE17':{'math':'\\mathsfsl{P}'},'\uD835\uDE18':{'math':'\\mathsfsl{Q}'},'\uD835\uDE19':{'math':'\\mathsfsl{R}'},'\uD835\uDE1A':{'math':'\\mathsfsl{S}'},'\uD835\uDE1B':{'math':'\\mathsfsl{T}'},'\uD835\uDE1C':{'math':'\\mathsfsl{U}'},'\uD835\uDE1D':{'math':'\\mathsfsl{V}'},'\uD835\uDE1E':{'math':'\\mathsfsl{W}'},'\uD835\uDE1F':{'math':'\\mathsfsl{X}'},'\uD835\uDE20':{'math':'\\mathsfsl{Y}'},'\uD835\uDE21':{'math':'\\mathsfsl{Z}'},'\uD835\uDE22':{'math':'\\mathsfsl{a}'},'\uD835\uDE23':{'math':'\\mathsfsl{b}'},'\uD835\uDE24':{'math':'\\mathsfsl{c}'},'\uD835\uDE25':{'math':'\\mathsfsl{d}'},'\uD835\uDE26':{'math':'\\mathsfsl{e}'},'\uD835\uDE27':{'math':'\\mathsfsl{f}'},'\uD835\uDE28':{'math':'\\mathsfsl{g}'},'\uD835\uDE29':{'math':'\\mathsfsl{h}'},'\uD835\uDE2A':{'math':'\\mathsfsl{i}'},'\uD835\uDE2B':{'math':'\\mathsfsl{j}'},'\uD835\uDE2C':{'math':'\\mathsfsl{k}'},'\uD835\uDE2D':{'math':'\\mathsfsl{l}'},'\uD835\uDE2E':{'math':'\\mathsfsl{m}'},'\uD835\uDE2F':{'math':'\\mathsfsl{n}'},'\uD835\uDE30':{'math':'\\mathsfsl{o}'},'\uD835\uDE31':{'math':'\\mathsfsl{p}'},'\uD835\uDE32':{'math':'\\mathsfsl{q}'},'\uD835\uDE33':{'math':'\\mathsfsl{r}'},'\uD835\uDE34':{'math':'\\mathsfsl{s}'},'\uD835\uDE35':{'math':'\\mathsfsl{t}'},'\uD835\uDE36':{'math':'\\mathsfsl{u}'},'\uD835\uDE37':{'math':'\\mathsfsl{v}'},'\uD835\uDE38':{'math':'\\mathsfsl{w}'},'\uD835\uDE39':{'math':'\\mathsfsl{x}'},'\uD835\uDE3A':{'math':'\\mathsfsl{y}'},'\uD835\uDE3B':{'math':'\\mathsfsl{z}'},'\uD835\uDE3C':{'math':'\\mathsfbfsl{A}'},'\uD835\uDE3D':{'math':'\\mathsfbfsl{B}'},'\uD835\uDE3E':{'math':'\\mathsfbfsl{C}'},'\uD835\uDE3F':{'math':'\\mathsfbfsl{D}'},'\uD835\uDE40':{'math':'\\mathsfbfsl{E}'},'\uD835\uDE41':{'math':'\\mathsfbfsl{F}'},'\uD835\uDE42':{'math':'\\mathsfbfsl{G}'},'\uD835\uDE43':{'math':'\\mathsfbfsl{H}'},'\uD835\uDE44':{'math':'\\mathsfbfsl{I}'},'\uD835\uDE45':{'math':'\\mathsfbfsl{J}'},'\uD835\uDE46':{'math':'\\mathsfbfsl{K}'},'\uD835\uDE47':{'math':'\\mathsfbfsl{L}'},'\uD835\uDE48':{'math':'\\mathsfbfsl{M}'},'\uD835\uDE49':{'math':'\\mathsfbfsl{N}'},'\uD835\uDE4A':{'math':'\\mathsfbfsl{O}'},'\uD835\uDE4B':{'math':'\\mathsfbfsl{P}'},'\uD835\uDE4C':{'math':'\\mathsfbfsl{Q}'},'\uD835\uDE4D':{'math':'\\mathsfbfsl{R}'},'\uD835\uDE4E':{'math':'\\mathsfbfsl{S}'},'\uD835\uDE4F':{'math':'\\mathsfbfsl{T}'},'\uD835\uDE50':{'math':'\\mathsfbfsl{U}'},'\uD835\uDE51':{'math':'\\mathsfbfsl{V}'},'\uD835\uDE52':{'math':'\\mathsfbfsl{W}'},'\uD835\uDE53':{'math':'\\mathsfbfsl{X}'},'\uD835\uDE54':{'math':'\\mathsfbfsl{Y}'},'\uD835\uDE55':{'math':'\\mathsfbfsl{Z}'},'\uD835\uDE56':{'math':'\\mathsfbfsl{a}'},'\uD835\uDE57':{'math':'\\mathsfbfsl{b}'},'\uD835\uDE58':{'math':'\\mathsfbfsl{c}'},'\uD835\uDE59':{'math':'\\mathsfbfsl{d}'},'\uD835\uDE5A':{'math':'\\mathsfbfsl{e}'},'\uD835\uDE5B':{'math':'\\mathsfbfsl{f}'},'\uD835\uDE5C':{'math':'\\mathsfbfsl{g}'},'\uD835\uDE5D':{'math':'\\mathsfbfsl{h}'},'\uD835\uDE5E':{'math':'\\mathsfbfsl{i}'},'\uD835\uDE5F':{'math':'\\mathsfbfsl{j}'},'\uD835\uDE60':{'math':'\\mathsfbfsl{k}'},'\uD835\uDE61':{'math':'\\mathsfbfsl{l}'},'\uD835\uDE62':{'math':'\\mathsfbfsl{m}'},'\uD835\uDE63':{'math':'\\mathsfbfsl{n}'},'\uD835\uDE64':{'math':'\\mathsfbfsl{o}'},'\uD835\uDE65':{'math':'\\mathsfbfsl{p}'},'\uD835\uDE66':{'math':'\\mathsfbfsl{q}'},'\uD835\uDE67':{'math':'\\mathsfbfsl{r}'},'\uD835\uDE68':{'math':'\\mathsfbfsl{s}'},'\uD835\uDE69':{'math':'\\mathsfbfsl{t}'},'\uD835\uDE6A':{'math':'\\mathsfbfsl{u}'},'\uD835\uDE6B':{'math':'\\mathsfbfsl{v}'},'\uD835\uDE6C':{'math':'\\mathsfbfsl{w}'},'\uD835\uDE6D':{'math':'\\mathsfbfsl{x}'},'\uD835\uDE6E':{'math':'\\mathsfbfsl{y}'},'\uD835\uDE6F':{'math':'\\mathsfbfsl{z}'},'\uD835\uDE70':{'math':'\\mathtt{A}'},'\uD835\uDE71':{'math':'\\mathtt{B}'},'\uD835\uDE72':{'math':'\\mathtt{C}'},'\uD835\uDE73':{'math':'\\mathtt{D}'},'\uD835\uDE74':{'math':'\\mathtt{E}'},'\uD835\uDE75':{'math':'\\mathtt{F}'},'\uD835\uDE76':{'math':'\\mathtt{G}'},'\uD835\uDE77':{'math':'\\mathtt{H}'},'\uD835\uDE78':{'math':'\\mathtt{I}'},'\uD835\uDE79':{'math':'\\mathtt{J}'},'\uD835\uDE7A':{'math':'\\mathtt{K}'},'\uD835\uDE7B':{'math':'\\mathtt{L}'},'\uD835\uDE7C':{'math':'\\mathtt{M}'},'\uD835\uDE7D':{'math':'\\mathtt{N}'},'\uD835\uDE7E':{'math':'\\mathtt{O}'},'\uD835\uDE7F':{'math':'\\mathtt{P}'},'\uD835\uDE80':{'math':'\\mathtt{Q}'},'\uD835\uDE81':{'math':'\\mathtt{R}'},'\uD835\uDE82':{'math':'\\mathtt{S}'},'\uD835\uDE83':{'math':'\\mathtt{T}'},'\uD835\uDE84':{'math':'\\mathtt{U}'},'\uD835\uDE85':{'math':'\\mathtt{V}'},'\uD835\uDE86':{'math':'\\mathtt{W}'},'\uD835\uDE87':{'math':'\\mathtt{X}'},'\uD835\uDE88':{'math':'\\mathtt{Y}'},'\uD835\uDE89':{'math':'\\mathtt{Z}'},'\uD835\uDE8A':{'math':'\\mathtt{a}'},'\uD835\uDE8B':{'math':'\\mathtt{b}'},'\uD835\uDE8C':{'math':'\\mathtt{c}'},'\uD835\uDE8D':{'math':'\\mathtt{d}'},'\uD835\uDE8E':{'math':'\\mathtt{e}'},'\uD835\uDE8F':{'math':'\\mathtt{f}'},'\uD835\uDE90':{'math':'\\mathtt{g}'},'\uD835\uDE91':{'math':'\\mathtt{h}'},'\uD835\uDE92':{'math':'\\mathtt{i}'},'\uD835\uDE93':{'math':'\\mathtt{j}'},'\uD835\uDE94':{'math':'\\mathtt{k}'},'\uD835\uDE95':{'math':'\\mathtt{l}'},'\uD835\uDE96':{'math':'\\mathtt{m}'},'\uD835\uDE97':{'math':'\\mathtt{n}'},'\uD835\uDE98':{'math':'\\mathtt{o}'},'\uD835\uDE99':{'math':'\\mathtt{p}'},'\uD835\uDE9A':{'math':'\\mathtt{q}'},'\uD835\uDE9B':{'math':'\\mathtt{r}'},'\uD835\uDE9C':{'math':'\\mathtt{s}'},'\uD835\uDE9D':{'math':'\\mathtt{t}'},'\uD835\uDE9E':{'math':'\\mathtt{u}'},'\uD835\uDE9F':{'math':'\\mathtt{v}'},'\uD835\uDEA0':{'math':'\\mathtt{w}'},'\uD835\uDEA1':{'math':'\\mathtt{x}'},'\uD835\uDEA2':{'math':'\\mathtt{y}'},'\uD835\uDEA3':{'math':'\\mathtt{z}'},'\uD835\uDEA4':{'math':'\\imath{}'},'\uD835\uDEA5':{'math':'\\jmath{}'},'\uD835\uDEA8':{'math':'\\mathbf{A}'},'\uD835\uDEA9':{'math':'\\mathbf{B}'},'\uD835\uDEAA':{'math':'\\mathbf{\\Gamma}'},'\uD835\uDEAB':{'math':'\\mathbf{\\Delta}'},'\uD835\uDEAC':{'math':'\\mathbf{E}'},'\uD835\uDEAD':{'math':'\\mathbf{Z}'},'\uD835\uDEAE':{'math':'\\mathbf{H}'},'\uD835\uDEAF':{'math':'\\mathbf{\\Theta}'},'\uD835\uDEB0':{'math':'\\mathbf{I}'},'\uD835\uDEB1':{'math':'\\mathbf{K}'},'\uD835\uDEB2':{'math':'\\mathbf{\\Lambda}'},'\uD835\uDEB3':{'math':'M'},'\uD835\uDEB4':{'math':'N'},'\uD835\uDEB5':{'math':'\\mathbf{\\Xi}'},'\uD835\uDEB6':{'math':'O'},'\uD835\uDEB7':{'math':'\\mathbf{\\Pi}'},'\uD835\uDEB8':{'math':'\\mathbf{P}'},'\uD835\uDEB9':{'math':'\\mathbf{\\vartheta}'},'\uD835\uDEBA':{'math':'\\mathbf{\\Sigma}'},'\uD835\uDEBB':{'math':'\\mathbf{T}'},'\uD835\uDEBC':{'math':'\\mathbf{\\Upsilon}'},'\uD835\uDEBD':{'math':'\\mathbf{\\Phi}'},'\uD835\uDEBE':{'math':'\\mathbf{X}'},'\uD835\uDEBF':{'math':'\\mathbf{\\Psi}'},'\uD835\uDEC0':{'math':'\\mathbf{\\Omega}'},'\uD835\uDEC1':{'math':'\\mathbf{\\nabla}'},'\uD835\uDEC2':{'math':'\\mathbf{A}'},'\uD835\uDEC3':{'math':'\\mathbf{B}'},'\uD835\uDEC4':{'math':'\\mathbf{\\Gamma}'},'\uD835\uDEC5':{'math':'\\mathbf{\\Delta}'},'\uD835\uDEC6':{'math':'\\mathbf{E}'},'\uD835\uDEC7':{'math':'\\mathbf{Z}'},'\uD835\uDEC8':{'math':'\\mathbf{H}'},'\uD835\uDEC9':{'math':'\\mathbf{\\theta}'},'\uD835\uDECA':{'math':'\\mathbf{I}'},'\uD835\uDECB':{'math':'\\mathbf{K}'},'\uD835\uDECC':{'math':'\\mathbf{\\Lambda}'},'\uD835\uDECD':{'math':'M'},'\uD835\uDECE':{'math':'N'},'\uD835\uDECF':{'math':'\\mathbf{\\Xi}'},'\uD835\uDED0':{'math':'O'},'\uD835\uDED1':{'math':'\\mathbf{\\Pi}'},'\uD835\uDED2':{'math':'\\mathbf{P}'},'\uD835\uDED3':{'math':'\\mathbf{\\varsigma}'},'\uD835\uDED4':{'math':'\\mathbf{\\Sigma}'},'\uD835\uDED5':{'math':'\\mathbf{T}'},'\uD835\uDED6':{'math':'\\mathbf{\\Upsilon}'},'\uD835\uDED7':{'math':'\\mathbf{\\Phi}'},'\uD835\uDED8':{'math':'\\mathbf{X}'},'\uD835\uDED9':{'math':'\\mathbf{\\Psi}'},'\uD835\uDEDA':{'math':'\\mathbf{\\Omega}'},'\uD835\uDEDB':{'math':'\\partial{}'},'\uD835\uDEDC':{'math':'\\in{}'},'\uD835\uDEDD':{'math':'\\mathbf{\\vartheta}'},'\uD835\uDEDE':{'math':'\\mathbf{\\varkappa}'},'\uD835\uDEDF':{'math':'\\mathbf{\\phi}'},'\uD835\uDEE0':{'math':'\\mathbf{\\varrho}'},'\uD835\uDEE1':{'math':'\\mathbf{\\varpi}'},'\uD835\uDEE2':{'math':'\\mathsl{A}'},'\uD835\uDEE3':{'math':'\\mathsl{B}'},'\uD835\uDEE4':{'math':'\\mathsl{\\Gamma}'},'\uD835\uDEE5':{'math':'\\mathsl{\\Delta}'},'\uD835\uDEE6':{'math':'\\mathsl{E}'},'\uD835\uDEE7':{'math':'\\mathsl{Z}'},'\uD835\uDEE8':{'math':'\\mathsl{H}'},'\uD835\uDEE9':{'math':'\\mathsl{\\Theta}'},'\uD835\uDEEA':{'math':'\\mathsl{I}'},'\uD835\uDEEB':{'math':'\\mathsl{K}'},'\uD835\uDEEC':{'math':'\\mathsl{\\Lambda}'},'\uD835\uDEED':{'math':'M'},'\uD835\uDEEE':{'math':'N'},'\uD835\uDEEF':{'math':'\\mathsl{\\Xi}'},'\uD835\uDEF0':{'math':'O'},'\uD835\uDEF1':{'math':'\\mathsl{\\Pi}'},'\uD835\uDEF2':{'math':'\\mathsl{P}'},'\uD835\uDEF3':{'math':'\\mathsl{\\vartheta}'},'\uD835\uDEF4':{'math':'\\mathsl{\\Sigma}'},'\uD835\uDEF5':{'math':'\\mathsl{T}'},'\uD835\uDEF6':{'math':'\\mathsl{\\Upsilon}'},'\uD835\uDEF7':{'math':'\\mathsl{\\Phi}'},'\uD835\uDEF8':{'math':'\\mathsl{X}'},'\uD835\uDEF9':{'math':'\\mathsl{\\Psi}'},'\uD835\uDEFA':{'math':'\\mathsl{\\Omega}'},'\uD835\uDEFB':{'math':'\\mathsl{\\nabla}'},'\uD835\uDEFC':{'math':'\\mathsl{A}'},'\uD835\uDEFD':{'math':'\\mathsl{B}'},'\uD835\uDEFE':{'math':'\\mathsl{\\Gamma}'},'\uD835\uDEFF':{'math':'\\mathsl{\\Delta}'},'\uD835\uDF00':{'math':'\\mathsl{E}'},'\uD835\uDF01':{'math':'\\mathsl{Z}'},'\uD835\uDF02':{'math':'\\mathsl{H}'},'\uD835\uDF03':{'math':'\\mathsl{\\Theta}'},'\uD835\uDF04':{'math':'\\mathsl{I}'},'\uD835\uDF05':{'math':'\\mathsl{K}'},'\uD835\uDF06':{'math':'\\mathsl{\\Lambda}'},'\uD835\uDF07':{'math':'M'},'\uD835\uDF08':{'math':'N'},'\uD835\uDF09':{'math':'\\mathsl{\\Xi}'},'\uD835\uDF0A':{'math':'O'},'\uD835\uDF0B':{'math':'\\mathsl{\\Pi}'},'\uD835\uDF0C':{'math':'\\mathsl{P}'},'\uD835\uDF0D':{'math':'\\mathsl{\\varsigma}'},'\uD835\uDF0E':{'math':'\\mathsl{\\Sigma}'},'\uD835\uDF0F':{'math':'\\mathsl{T}'},'\uD835\uDF10':{'math':'\\mathsl{\\Upsilon}'},'\uD835\uDF11':{'math':'\\mathsl{\\Phi}'},'\uD835\uDF12':{'math':'\\mathsl{X}'},'\uD835\uDF13':{'math':'\\mathsl{\\Psi}'},'\uD835\uDF14':{'math':'\\mathsl{\\Omega}'},'\uD835\uDF15':{'math':'\\partial{}'},'\uD835\uDF16':{'math':'\\in{}'},'\uD835\uDF17':{'math':'\\mathsl{\\vartheta}'},'\uD835\uDF18':{'math':'\\mathsl{\\varkappa}'},'\uD835\uDF19':{'math':'\\mathsl{\\phi}'},'\uD835\uDF1A':{'math':'\\mathsl{\\varrho}'},'\uD835\uDF1B':{'math':'\\mathsl{\\varpi}'},'\uD835\uDF1C':{'math':'\\mathbit{A}'},'\uD835\uDF1D':{'math':'\\mathbit{B}'},'\uD835\uDF1E':{'math':'\\mathbit{\\Gamma}'},'\uD835\uDF1F':{'math':'\\mathbit{\\Delta}'},'\uD835\uDF20':{'math':'\\mathbit{E}'},'\uD835\uDF21':{'math':'\\mathbit{Z}'},'\uD835\uDF22':{'math':'\\mathbit{H}'},'\uD835\uDF23':{'math':'\\mathbit{\\Theta}'},'\uD835\uDF24':{'math':'\\mathbit{I}'},'\uD835\uDF25':{'math':'\\mathbit{K}'},'\uD835\uDF26':{'math':'\\mathbit{\\Lambda}'},'\uD835\uDF27':{'math':'M'},'\uD835\uDF28':{'math':'N'},'\uD835\uDF29':{'math':'\\mathbit{\\Xi}'},'\uD835\uDF2A':{'math':'O'},'\uD835\uDF2B':{'math':'\\mathbit{\\Pi}'},'\uD835\uDF2C':{'math':'\\mathbit{P}'},'\uD835\uDF2D':{'math':'\\mathbit{O}'},'\uD835\uDF2E':{'math':'\\mathbit{\\Sigma}'},'\uD835\uDF2F':{'math':'\\mathbit{T}'},'\uD835\uDF30':{'math':'\\mathbit{\\Upsilon}'},'\uD835\uDF31':{'math':'\\mathbit{\\Phi}'},'\uD835\uDF32':{'math':'\\mathbit{X}'},'\uD835\uDF33':{'math':'\\mathbit{\\Psi}'},'\uD835\uDF34':{'math':'\\mathbit{\\Omega}'},'\uD835\uDF35':{'math':'\\mathbit{\\nabla}'},'\uD835\uDF36':{'math':'\\mathbit{A}'},'\uD835\uDF37':{'math':'\\mathbit{B}'},'\uD835\uDF38':{'math':'\\mathbit{\\Gamma}'},'\uD835\uDF39':{'math':'\\mathbit{\\Delta}'},'\uD835\uDF3A':{'math':'\\mathbit{E}'},'\uD835\uDF3B':{'math':'\\mathbit{Z}'},'\uD835\uDF3C':{'math':'\\mathbit{H}'},'\uD835\uDF3D':{'math':'\\mathbit{\\Theta}'},'\uD835\uDF3E':{'math':'\\mathbit{I}'},'\uD835\uDF3F':{'math':'\\mathbit{K}'},'\uD835\uDF40':{'math':'\\mathbit{\\Lambda}'},'\uD835\uDF41':{'math':'M'},'\uD835\uDF42':{'math':'N'},'\uD835\uDF43':{'math':'\\mathbit{\\Xi}'},'\uD835\uDF44':{'math':'O'},'\uD835\uDF45':{'math':'\\mathbit{\\Pi}'},'\uD835\uDF46':{'math':'\\mathbit{P}'},'\uD835\uDF47':{'math':'\\mathbit{\\varsigma}'},'\uD835\uDF48':{'math':'\\mathbit{\\Sigma}'},'\uD835\uDF49':{'math':'\\mathbit{T}'},'\uD835\uDF4A':{'math':'\\mathbit{\\Upsilon}'},'\uD835\uDF4B':{'math':'\\mathbit{\\Phi}'},'\uD835\uDF4C':{'math':'\\mathbit{X}'},'\uD835\uDF4D':{'math':'\\mathbit{\\Psi}'},'\uD835\uDF4E':{'math':'\\mathbit{\\Omega}'},'\uD835\uDF4F':{'math':'\\partial{}'},'\uD835\uDF50':{'math':'\\in{}'},'\uD835\uDF51':{'math':'\\mathbit{\\vartheta}'},'\uD835\uDF52':{'math':'\\mathbit{\\varkappa}'},'\uD835\uDF53':{'math':'\\mathbit{\\phi}'},'\uD835\uDF54':{'math':'\\mathbit{\\varrho}'},'\uD835\uDF55':{'math':'\\mathbit{\\varpi}'},'\uD835\uDF56':{'math':'\\mathsfbf{A}'},'\uD835\uDF57':{'math':'\\mathsfbf{B}'},'\uD835\uDF58':{'math':'\\mathsfbf{\\Gamma}'},'\uD835\uDF59':{'math':'\\mathsfbf{\\Delta}'},'\uD835\uDF5A':{'math':'\\mathsfbf{E}'},'\uD835\uDF5B':{'math':'\\mathsfbf{Z}'},'\uD835\uDF5C':{'math':'\\mathsfbf{H}'},'\uD835\uDF5D':{'math':'\\mathsfbf{\\Theta}'},'\uD835\uDF5E':{'math':'\\mathsfbf{I}'},'\uD835\uDF5F':{'math':'\\mathsfbf{K}'},'\uD835\uDF60':{'math':'\\mathsfbf{\\Lambda}'},'\uD835\uDF61':{'math':'M'},'\uD835\uDF62':{'math':'N'},'\uD835\uDF63':{'math':'\\mathsfbf{\\Xi}'},'\uD835\uDF64':{'math':'O'},'\uD835\uDF65':{'math':'\\mathsfbf{\\Pi}'},'\uD835\uDF66':{'math':'\\mathsfbf{P}'},'\uD835\uDF67':{'math':'\\mathsfbf{\\vartheta}'},'\uD835\uDF68':{'math':'\\mathsfbf{\\Sigma}'},'\uD835\uDF69':{'math':'\\mathsfbf{T}'},'\uD835\uDF6A':{'math':'\\mathsfbf{\\Upsilon}'},'\uD835\uDF6B':{'math':'\\mathsfbf{\\Phi}'},'\uD835\uDF6C':{'math':'\\mathsfbf{X}'},'\uD835\uDF6D':{'math':'\\mathsfbf{\\Psi}'},'\uD835\uDF6E':{'math':'\\mathsfbf{\\Omega}'},'\uD835\uDF6F':{'math':'\\mathsfbf{\\nabla}'},'\uD835\uDF70':{'math':'\\mathsfbf{A}'},'\uD835\uDF71':{'math':'\\mathsfbf{B}'},'\uD835\uDF72':{'math':'\\mathsfbf{\\Gamma}'},'\uD835\uDF73':{'math':'\\mathsfbf{\\Delta}'},'\uD835\uDF74':{'math':'\\mathsfbf{E}'},'\uD835\uDF75':{'math':'\\mathsfbf{Z}'},'\uD835\uDF76':{'math':'\\mathsfbf{H}'},'\uD835\uDF77':{'math':'\\mathsfbf{\\Theta}'},'\uD835\uDF78':{'math':'\\mathsfbf{I}'},'\uD835\uDF79':{'math':'\\mathsfbf{K}'},'\uD835\uDF7A':{'math':'\\mathsfbf{\\Lambda}'},'\uD835\uDF7B':{'math':'M'},'\uD835\uDF7C':{'math':'N'},'\uD835\uDF7D':{'math':'\\mathsfbf{\\Xi}'},'\uD835\uDF7E':{'math':'O'},'\uD835\uDF7F':{'math':'\\mathsfbf{\\Pi}'},'\uD835\uDF80':{'math':'\\mathsfbf{P}'},'\uD835\uDF81':{'math':'\\mathsfbf{\\varsigma}'},'\uD835\uDF82':{'math':'\\mathsfbf{\\Sigma}'},'\uD835\uDF83':{'math':'\\mathsfbf{T}'},'\uD835\uDF84':{'math':'\\mathsfbf{\\Upsilon}'},'\uD835\uDF85':{'math':'\\mathsfbf{\\Phi}'},'\uD835\uDF86':{'math':'\\mathsfbf{X}'},'\uD835\uDF87':{'math':'\\mathsfbf{\\Psi}'},'\uD835\uDF88':{'math':'\\mathsfbf{\\Omega}'},'\uD835\uDF89':{'math':'\\partial{}'},'\uD835\uDF8A':{'math':'\\in{}'},'\uD835\uDF8B':{'math':'\\mathsfbf{\\vartheta}'},'\uD835\uDF8C':{'math':'\\mathsfbf{\\varkappa}'},'\uD835\uDF8D':{'math':'\\mathsfbf{\\phi}'},'\uD835\uDF8E':{'math':'\\mathsfbf{\\varrho}'},'\uD835\uDF8F':{'math':'\\mathsfbf{\\varpi}'},'\uD835\uDF90':{'math':'\\mathsfbfsl{A}'},'\uD835\uDF91':{'math':'\\mathsfbfsl{B}'},'\uD835\uDF92':{'math':'\\mathsfbfsl{\\Gamma}'},'\uD835\uDF93':{'math':'\\mathsfbfsl{\\Delta}'},'\uD835\uDF94':{'math':'\\mathsfbfsl{E}'},'\uD835\uDF95':{'math':'\\mathsfbfsl{Z}'},'\uD835\uDF96':{'math':'\\mathsfbfsl{H}'},'\uD835\uDF97':{'math':'\\mathsfbfsl{\\vartheta}'},'\uD835\uDF98':{'math':'\\mathsfbfsl{I}'},'\uD835\uDF99':{'math':'\\mathsfbfsl{K}'},'\uD835\uDF9A':{'math':'\\mathsfbfsl{\\Lambda}'},'\uD835\uDF9B':{'math':'M'},'\uD835\uDF9C':{'math':'N'},'\uD835\uDF9D':{'math':'\\mathsfbfsl{\\Xi}'},'\uD835\uDF9E':{'math':'O'},'\uD835\uDF9F':{'math':'\\mathsfbfsl{\\Pi}'},'\uD835\uDFA0':{'math':'\\mathsfbfsl{P}'},'\uD835\uDFA1':{'math':'\\mathsfbfsl{\\vartheta}'},'\uD835\uDFA2':{'math':'\\mathsfbfsl{\\Sigma}'},'\uD835\uDFA3':{'math':'\\mathsfbfsl{T}'},'\uD835\uDFA4':{'math':'\\mathsfbfsl{\\Upsilon}'},'\uD835\uDFA5':{'math':'\\mathsfbfsl{\\Phi}'},'\uD835\uDFA6':{'math':'\\mathsfbfsl{X}'},'\uD835\uDFA7':{'math':'\\mathsfbfsl{\\Psi}'},'\uD835\uDFA8':{'math':'\\mathsfbfsl{\\Omega}'},'\uD835\uDFA9':{'math':'\\mathsfbfsl{\\nabla}'},'\uD835\uDFAA':{'math':'\\mathsfbfsl{A}'},'\uD835\uDFAB':{'math':'\\mathsfbfsl{B}'},'\uD835\uDFAC':{'math':'\\mathsfbfsl{\\Gamma}'},'\uD835\uDFAD':{'math':'\\mathsfbfsl{\\Delta}'},'\uD835\uDFAE':{'math':'\\mathsfbfsl{E}'},'\uD835\uDFAF':{'math':'\\mathsfbfsl{Z}'},'\uD835\uDFB0':{'math':'\\mathsfbfsl{H}'},'\uD835\uDFB1':{'math':'\\mathsfbfsl{\\vartheta}'},'\uD835\uDFB2':{'math':'\\mathsfbfsl{I}'},'\uD835\uDFB3':{'math':'\\mathsfbfsl{K}'},'\uD835\uDFB4':{'math':'\\mathsfbfsl{\\Lambda}'},'\uD835\uDFB5':{'math':'M'},'\uD835\uDFB6':{'math':'N'},'\uD835\uDFB7':{'math':'\\mathsfbfsl{\\Xi}'},'\uD835\uDFB8':{'math':'O'},'\uD835\uDFB9':{'math':'\\mathsfbfsl{\\Pi}'},'\uD835\uDFBA':{'math':'\\mathsfbfsl{P}'},'\uD835\uDFBB':{'math':'\\mathsfbfsl{\\varsigma}'},'\uD835\uDFBC':{'math':'\\mathsfbfsl{\\Sigma}'},'\uD835\uDFBD':{'math':'\\mathsfbfsl{T}'},'\uD835\uDFBE':{'math':'\\mathsfbfsl{\\Upsilon}'},'\uD835\uDFBF':{'math':'\\mathsfbfsl{\\Phi}'},'\uD835\uDFC0':{'math':'\\mathsfbfsl{X}'},'\uD835\uDFC1':{'math':'\\mathsfbfsl{\\Psi}'},'\uD835\uDFC2':{'math':'\\mathsfbfsl{\\Omega}'},'\uD835\uDFC3':{'math':'\\partial{}'},'\uD835\uDFC4':{'math':'\\in{}'},'\uD835\uDFC5':{'math':'\\mathsfbfsl{\\vartheta}'},'\uD835\uDFC6':{'math':'\\mathsfbfsl{\\varkappa}'},'\uD835\uDFC7':{'math':'\\mathsfbfsl{\\phi}'},'\uD835\uDFC8':{'math':'\\mathsfbfsl{\\varrho}'},'\uD835\uDFC9':{'math':'\\mathsfbfsl{\\varpi}'},'\uD835\uDFCA':{'math':'\\mbfDigamma{}'},'\uD835\uDFCB':{'math':'\\mbfdigamma{}'},'\uD835\uDFCE':{'math':'\\mathbf{0}'},'\uD835\uDFCF':{'math':'\\mathbf{1}'},'\uD835\uDFD0':{'math':'\\mathbf{2}'},'\uD835\uDFD1':{'math':'\\mathbf{3}'},'\uD835\uDFD2':{'math':'\\mathbf{4}'},'\uD835\uDFD3':{'math':'\\mathbf{5}'},'\uD835\uDFD4':{'math':'\\mathbf{6}'},'\uD835\uDFD5':{'math':'\\mathbf{7}'},'\uD835\uDFD6':{'math':'\\mathbf{8}'},'\uD835\uDFD7':{'math':'\\mathbf{9}'},'\uD835\uDFD8':{'math':'\\mathbb{0}'},'\uD835\uDFD9':{'math':'\\mathbb{1}'},'\uD835\uDFDA':{'math':'\\mathbb{2}'},'\uD835\uDFDB':{'math':'\\mathbb{3}'},'\uD835\uDFDC':{'math':'\\mathbb{4}'},'\uD835\uDFDD':{'math':'\\mathbb{5}'},'\uD835\uDFDE':{'math':'\\mathbb{6}'},'\uD835\uDFDF':{'math':'\\mathbb{7}'},'\uD835\uDFE0':{'math':'\\mathbb{8}'},'\uD835\uDFE1':{'math':'\\mathbb{9}'},'\uD835\uDFE2':{'math':'\\mathsf{0}'},'\uD835\uDFE3':{'math':'\\mathsf{1}'},'\uD835\uDFE4':{'math':'\\mathsf{2}'},'\uD835\uDFE5':{'math':'\\mathsf{3}'},'\uD835\uDFE6':{'math':'\\mathsf{4}'},'\uD835\uDFE7':{'math':'\\mathsf{5}'},'\uD835\uDFE8':{'math':'\\mathsf{6}'},'\uD835\uDFE9':{'math':'\\mathsf{7}'},'\uD835\uDFEA':{'math':'\\mathsf{8}'},'\uD835\uDFEB':{'math':'\\mathsf{9}'},'\uD835\uDFEC':{'math':'\\mathsfbf{0}'},'\uD835\uDFED':{'math':'\\mathsfbf{1}'},'\uD835\uDFEE':{'math':'\\mathsfbf{2}'},'\uD835\uDFEF':{'math':'\\mathsfbf{3}'},'\uD835\uDFF0':{'math':'\\mathsfbf{4}'},'\uD835\uDFF1':{'math':'\\mathsfbf{5}'},'\uD835\uDFF2':{'math':'\\mathsfbf{6}'},'\uD835\uDFF3':{'math':'\\mathsfbf{7}'},'\uD835\uDFF4':{'math':'\\mathsfbf{8}'},'\uD835\uDFF5':{'math':'\\mathsfbf{9}'},'\uD835\uDFF6':{'math':'\\mathtt{0}'},'\uD835\uDFF7':{'math':'\\mathtt{1}'},'\uD835\uDFF8':{'math':'\\mathtt{2}'},'\uD835\uDFF9':{'math':'\\mathtt{3}'},'\uD835\uDFFA':{'math':'\\mathtt{4}'},'\uD835\uDFFB':{'math':'\\mathtt{5}'},'\uD835\uDFFC':{'math':'\\mathtt{6}'},'\uD835\uDFFD':{'math':'\\mathtt{7}'},'\uD835\uDFFE':{'math':'\\mathtt{8}'},'\uD835\uDFFF':{'math':'\\mathtt{9}'}};

/***/ }),

/***/ "../node_modules/unicode2latex/dist/index.js":
/*!***************************************************!*\
  !*** ../node_modules/unicode2latex/dist/index.js ***!
  \***************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  ascii: __webpack_require__(/*! ./ascii.json */ "../node_modules/unicode2latex/dist/ascii.json"),
  unicode: __webpack_require__(/*! ./unicode.json */ "../node_modules/unicode2latex/dist/unicode.json"),
};


/***/ }),

/***/ "../node_modules/unicode2latex/dist/unicode.json":
/*!*******************************************************!*\
  !*** ../node_modules/unicode2latex/dist/unicode.json ***!
  \*******************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = {'_':{'math':'\\_','text':'\\_'},'{':{'math':'\\lbrace{}','text':'\\{'},'}':{'math':'\\rbrace{}','text':'\\}'},'&':{'math':'\\&','text':'\\&'},'#':{'math':'\\#','text':'\\#'},'%':{'math':'\\%','text':'\\%'},'^':{'math':'\\sphat{}','text':'\\^'},'<':{'math':'<'},'>':{'math':'>'},'~':{'math':'\\sptilde{}','text':'\\textasciitilde{}'},'$':{'math':'\\$','text':'\\$'},'\\':{'math':'\\backslash{}','text':'\\textbackslash{}'},'\xA0':{'math':'~','text':'~','space':true},'\u2002':{'text':'\\hspace{0.6em}','space':true},'\u2003':{'math':'\\quad{}','text':'\\hspace{1em}','space':true},'\u2004':{'text':'\\;','space':true},'\u2005':{'text':'\\hspace{0.25em}','space':true},'\u2006':{'text':'\\hspace{0.166em}','space':true},'\u2007':{'text':'\\hphantom{0}','space':true},'\u2008':{'text':'\\hphantom{,}','space':true},'\u2009':{'text':'\\,','space':true},'\u200A':{'space':true,'math':'\\mkern1mu{}'},'\u200B':{'text':'\\mbox{}','space':true},'\u202F':{'text':' ','space':true},'\u205F':{'math':'\\:','text':'\\:','space':true}};

/***/ }),

/***/ "../node_modules/webpack/buildin/global.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/global.js ***!
  \*************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "../node_modules/webpack/buildin/module.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/module.js ***!
  \*************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./Better BibTeX.ts":
/*!**************************!*\
  !*** ./Better BibTeX.ts ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/Better BibTeX.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reference_1 = __webpack_require__(/*! ./bibtex/reference */ "./bibtex/reference.ts");
const exporter_1 = __webpack_require__(/*! ./lib/exporter */ "./lib/exporter.ts");
const debug_1 = __webpack_require__(/*! ./lib/debug */ "./lib/debug.ts");
const escape = __webpack_require__(/*! ../content/escape */ "../content/escape.ts");
const JSON5 = __webpack_require__(/*! json5 */ "../node_modules/json5/dist/index.js");
const biblatex = __webpack_require__(/*! biblatex-csl-converter/src/import/biblatex */ "../node_modules/biblatex-csl-converter/src/import/biblatex.js");
const itemfields_1 = __webpack_require__(/*! ../gen/itemfields */ "../gen/itemfields.ts");
const arXiv_1 = __webpack_require__(/*! ../content/arXiv */ "../content/arXiv.ts");
reference_1.Reference.prototype.caseConversion = {
    title: true,
    series: true,
    shorttitle: true,
    booktitle: true,
    type: true,
};
reference_1.Reference.prototype.fieldEncoding = {
    url: 'verbatim',
    doi: 'verbatim',
    // school: 'literal'
    institution: 'literal',
    publisher: 'literal',
    organization: 'literal',
};
reference_1.Reference.prototype.lint = function (explanation) {
    const required = {
        inproceedings: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
        article: ['author', 'journal', 'number', 'pages', 'title', 'volume', 'year'],
        techreport: ['author', 'institution', 'title', 'year'],
        incollection: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
        book: ['author', 'publisher', 'title', 'year'],
        inbook: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
        proceedings: ['editor', 'publisher', 'title', 'year'],
        phdthesis: ['author', 'school', 'title', 'year'],
        mastersthesis: ['author', 'school', 'title', 'year'],
        electronic: ['author', 'title', 'url', 'year'],
        misc: ['author', 'howpublished', 'title', 'year'],
    };
    const fields = required[this.referencetype.toLowerCase()];
    if (!fields)
        return;
    return fields.map(field => this.has[field] ? '' : `Missing required field '${field}'`).filter(msg => msg);
};
reference_1.Reference.prototype.addCreators = function () {
    if (!this.item.creators || !this.item.creators.length)
        return;
    /* split creators into subcategories */
    const authors = [];
    const editors = [];
    const translators = [];
    const collaborators = [];
    const primaryCreatorType = Zotero.Utilities.getCreatorsForType(this.item.itemType)[0];
    for (const creator of this.item.creators) {
        switch (creator.creatorType) {
            case 'editor':
            case 'seriesEditor':
                editors.push(creator);
                break;
            case 'translator':
                translators.push(creator);
                break;
            case primaryCreatorType:
                authors.push(creator);
                break;
            default: collaborators.push(creator);
        }
    }
    this.remove('author');
    this.remove('editor');
    this.remove('translator');
    this.remove('collaborator');
    this.add({ name: 'author', value: authors, enc: 'creators' });
    this.add({ name: 'editor', value: editors, enc: 'creators' });
    this.add({ name: 'translator', value: translators, enc: 'creators' });
    this.add({ name: 'collaborator', value: collaborators, enc: 'creators' });
};
reference_1.Reference.prototype.typeMap = {
    csl: {
        article: 'article',
        'article-journal': 'article',
        'article-magazine': 'article',
        'article-newspaper': 'article',
        bill: 'misc',
        book: 'book',
        broadcast: 'misc',
        chapter: 'incollection',
        dataset: 'misc',
        entry: 'incollection',
        'entry-dictionary': 'incollection',
        'entry-encyclopedia': 'incollection',
        figure: 'misc',
        graphic: 'misc',
        interview: 'misc',
        legal_case: 'misc',
        legislation: 'misc',
        manuscript: 'unpublished',
        map: 'misc',
        motion_picture: 'misc',
        musical_score: 'misc',
        pamphlet: 'booklet',
        'paper-conference': 'inproceedings',
        patent: 'misc',
        personal_communication: 'misc',
        post: 'misc',
        'post-weblog': 'misc',
        report: 'techreport',
        review: 'article',
        'review-book': 'article',
        song: 'misc',
        speech: 'misc',
        thesis: 'phdthesis',
        treaty: 'misc',
        webpage: 'misc',
    },
    zotero: {
        artwork: 'misc',
        audioRecording: 'misc',
        bill: 'misc',
        blogPost: 'misc',
        book: 'book',
        bookSection: 'incollection',
        case: 'misc',
        computerProgram: 'misc',
        conferencePaper: 'inproceedings',
        dictionaryEntry: 'misc',
        document: 'misc',
        email: 'misc',
        encyclopediaArticle: 'article',
        film: 'misc',
        forumPost: 'misc',
        hearing: 'misc',
        instantMessage: 'misc',
        interview: 'misc',
        journalArticle: 'article',
        letter: 'misc',
        magazineArticle: 'article',
        manuscript: 'unpublished',
        map: 'misc',
        newspaperArticle: 'article',
        patent: 'patent',
        podcast: 'misc',
        presentation: 'misc',
        radioBroadcast: 'misc',
        report: 'techreport',
        statute: 'misc',
        thesis: 'phdthesis',
        tvBroadcast: 'misc',
        videoRecording: 'misc',
        webpage: 'misc',
    },
};
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
Translator.doExport = () => {
    // Zotero.write(`\n% ${Translator.header.label}\n`)
    Zotero.write('\n');
    let item;
    while (item = exporter_1.Exporter.nextItem()) {
        const ref = new reference_1.Reference(item);
        ref.add({ name: 'address', value: item.place });
        ref.add({ name: 'chapter', value: item.section });
        ref.add({ name: 'edition', value: item.edition });
        ref.add({ name: 'type', value: item.type });
        ref.add({ name: 'series', value: item.series });
        ref.add({ name: 'title', value: item.title });
        ref.add({ name: 'volume', value: item.volume });
        ref.add({ name: 'copyright', value: item.rights });
        ref.add({ name: 'isbn', value: item.ISBN });
        ref.add({ name: 'issn', value: item.ISSN });
        ref.add({ name: 'lccn', value: item.callNumber });
        ref.add({ name: 'shorttitle', value: item.shortTitle });
        ref.add({ name: 'doi', value: item.DOI });
        ref.add({ name: 'abstract', value: item.abstractNote });
        ref.add({ name: 'nationality', value: item.country });
        ref.add({ name: 'language', value: item.language });
        ref.add({ name: 'assignee', value: item.assignee });
        ref.add({ name: 'number', value: item.number || item.issue || item.seriesNumber });
        ref.add({ name: 'urldate', value: item.accessDate && item.accessDate.replace(/\s*T?\d+:\d+:\d+.*/, '') });
        if (['bookSection', 'conferencePaper', 'chapter'].includes(item.referenceType)) {
            ref.add({ name: 'booktitle', value: item.publicationTitle || item.conferenceName, preserveBibTeXVariables: true });
        }
        else if (ref.isBibVar(item.publicationTitle)) {
            ref.add({ name: 'journal', value: item.publicationTitle, preserveBibTeXVariables: true });
        }
        else {
            ref.add({ name: 'journal', value: (Translator.options.useJournalAbbreviation && item.journalAbbreviation) || item.publicationTitle, preserveBibTeXVariables: true });
        }
        switch (item.referenceType) {
            case 'thesis':
                ref.add({ name: 'school', value: item.publisher });
                break;
            case 'report':
                ref.add({ name: 'institution', value: item.publisher });
                break;
            case 'computerProgram':
                ref.add({ name: 'howpublished', value: item.publisher });
                break;
            default:
                ref.add({ name: 'publisher', value: item.publisher });
                break;
        }
        switch (Translator.preferences.bibtexURL) {
            case 'url':
                ref.add({ name: 'url', value: item.url });
                break;
            case 'note':
                ref.add({ name: (['misc', 'booklet'].includes(ref.referencetype) && !ref.has.howpublished ? 'howpublished' : 'note'), value: item.url, enc: 'url' });
                break;
            default:
                if (['webpage', 'post', 'post-weblog'].includes(item.referenceType))
                    ref.add({ name: 'howpublished', value: item.url });
        }
        if (item.referenceType === 'thesis' && ['mastersthesis', 'phdthesis'].includes(item.type)) {
            ref.referencetype = item.type;
            ref.remove('type');
        }
        ref.addCreators();
        if (item.date) {
            const date = Zotero.BetterBibTeX.parseDate(item.date);
            switch ((date || {}).type || 'verbatim') {
                case 'verbatim':
                    ref.add({ name: 'year', value: item.date });
                    break;
                case 'interval':
                    if (date.from.month)
                        ref.add({ name: 'month', value: months[date.from.month - 1], bare: true });
                    ref.add({ name: 'year', value: `${date.from.year}` });
                    break;
                case 'date':
                    if (date.month)
                        ref.add({ name: 'month', value: months[date.month - 1], bare: true });
                    if ((date.orig || {}).type === 'date') {
                        ref.add({ name: 'year', value: `[${date.orig.year}] ${date.year}` });
                    }
                    else {
                        ref.add({ name: 'year', value: `${date.year}` });
                    }
                    break;
            }
        }
        ref.add({ name: 'keywords', value: item.tags, enc: 'tags' });
        ref.add({ name: 'pages', value: ref.normalizeDashes(item.pages) });
        ref.add({ name: 'file', value: item.attachments, enc: 'attachments' });
        ref.complete();
    }
    exporter_1.Exporter.complete();
    Zotero.write('\n');
};
Translator.detectImport = () => {
    const input = Zotero.read(102400); // tslint:disable-line:no-magic-numbers
    const bib = biblatex.parse(input, {
        processUnexpected: true,
        processUnknown: { comment: 'f_verbatim' },
        processInvalidURIs: true,
    });
    return Object.keys(bib.entries).length > 0;
};
function importGroup(group, itemIDs, root = null) {
    const collection = new Zotero.Collection();
    collection.type = 'collection';
    collection.name = group.name;
    collection.children = group.references.filter(citekey => itemIDs[citekey]).map(citekey => ({ type: 'item', id: itemIDs[citekey] }));
    for (const subgroup of group.groups || []) {
        collection.children.push(importGroup(subgroup, itemIDs));
    }
    if (root)
        collection.complete();
    return collection;
}
class ZoteroItem {
    constructor(id, bibtex, jabref) {
        this.id = id;
        this.bibtex = bibtex;
        this.jabref = jabref;
        this.tags = {
            strong: { open: '<b>', close: '</b>' },
            em: { open: '<i>', close: '</i>' },
            sub: { open: '<sub>', close: '</sub>' },
            sup: { open: '<sup>', close: '</sup>' },
            smallcaps: { open: '<span style="font-variant:small-caps;">', close: '</span>' },
            nocase: { open: '', close: '' },
            enquote: { open: '“', close: '”' },
            url: { open: '', close: '' },
            undefined: { open: '[', close: ']' },
        };
        this.typeMap = {
            book: 'book',
            booklet: 'book',
            manual: 'book',
            proceedings: 'book',
            collection: 'book',
            incollection: 'bookSection',
            inbook: 'bookSection',
            inreference: 'encyclopediaArticle',
            article: 'journalArticle',
            misc: 'journalArticle',
            phdthesis: 'thesis',
            mastersthesis: 'thesis',
            thesis: 'thesis',
            unpublished: 'manuscript',
            patent: 'patent',
            inproceedings: 'conferencePaper',
            conference: 'conferencePaper',
            techreport: 'report',
            report: 'report',
        };
        this.sup = {
            '(': '\u207D',
            ')': '\u207E',
            '+': '\u207A',
            '=': '\u207C',
            '-': '\u207B',
            '\u00C6': '\u1D2D',
            '\u014B': '\u1D51',
            '\u018E': '\u1D32',
            '\u0222': '\u1D3D',
            '\u0250': '\u1D44',
            '\u0251': '\u1D45',
            '\u0254': '\u1D53',
            '\u0259': '\u1D4A',
            '\u025B': '\u1D4B',
            '\u025C': '\u1D4C',
            '\u0263': '\u02E0',
            '\u0266': '\u02B1',
            '\u026F': '\u1D5A',
            '\u0279': '\u02B4',
            '\u027B': '\u02B5',
            '\u0281': '\u02B6',
            '\u0294': '\u02C0',
            '\u0295': '\u02C1',
            '\u03B2': '\u1D5D',
            '\u03B3': '\u1D5E',
            '\u03B4': '\u1D5F',
            '\u03C6': '\u1D60',
            '\u03C7': '\u1D61',
            '\u1D02': '\u1D46',
            '\u1D16': '\u1D54',
            '\u1D17': '\u1D55',
            '\u1D1D': '\u1D59',
            '\u1D25': '\u1D5C',
            '\u2212': '\u207B',
            '\u2218': '\u00B0',
            '\u4E00': '\u3192',
            0: '\u2070',
            1: '\u00B9',
            2: '\u00B2',
            3: '\u00B3',
            4: '\u2074',
            5: '\u2075',
            6: '\u2076',
            7: '\u2077',
            8: '\u2078',
            9: '\u2079',
            A: '\u1D2C',
            B: '\u1D2E',
            D: '\u1D30',
            E: '\u1D31',
            G: '\u1D33',
            H: '\u1D34',
            I: '\u1D35',
            J: '\u1D36',
            K: '\u1D37',
            L: '\u1D38',
            M: '\u1D39',
            N: '\u1D3A',
            O: '\u1D3C',
            P: '\u1D3E',
            R: '\u1D3F',
            T: '\u1D40',
            U: '\u1D41',
            W: '\u1D42',
            a: '\u1D43',
            b: '\u1D47',
            d: '\u1D48',
            e: '\u1D49',
            g: '\u1D4D',
            h: '\u02B0',
            i: '\u2071',
            j: '\u02B2',
            k: '\u1D4F',
            l: '\u02E1',
            m: '\u1D50',
            n: '\u207F',
            o: '\u1D52',
            p: '\u1D56',
            r: '\u02B3',
            s: '\u02E2',
            t: '\u1D57',
            u: '\u1D58',
            v: '\u1D5B',
            w: '\u02B7',
            x: '\u02E3',
            y: '\u02B8',
        };
        this.sub = {
            0: '\u2080',
            1: '\u2081',
            2: '\u2082',
            3: '\u2083',
            4: '\u2084',
            5: '\u2085',
            6: '\u2086',
            7: '\u2087',
            8: '\u2088',
            9: '\u2089',
            '+': '\u208A',
            '-': '\u208B',
            '=': '\u208C',
            '(': '\u208D',
            ')': '\u208E',
            a: '\u2090',
            e: '\u2091',
            o: '\u2092',
            x: '\u2093',
            h: '\u2095',
            k: '\u2096',
            l: '\u2097',
            m: '\u2098',
            n: '\u2099',
            p: '\u209A',
            s: '\u209B',
            t: '\u209C',
        };
        this.bibtex.bib_type = this.bibtex.bib_type.toLowerCase();
        this.type = this.typeMap[this.bibtex.bib_type] || 'journalArticle';
        this.validFields = itemfields_1.valid.get(this.type);
        if (!this.validFields)
            this.error(`import error: unexpected item ${this.bibtex.entry_key} of type ${this.type}`);
        this.fields = Object.assign({}, (this.bibtex.fields || {}), (this.bibtex.unexpected_fields || {}), (this.bibtex.unknown_fields || {}));
        this.item = new Zotero.Item(this.type);
        this.item.itemID = this.id;
        this.extra = { data: {}, json: false };
        this.import();
        if (Translator.preferences.testing) {
            const err = Object.keys(this.item).filter(name => !this.validFields.get(name)).join(', ');
            if (err)
                this.error(`import error: unexpected fields on ${this.type} ${this.bibtex.entry_key}: ${err}`);
        }
    }
    async complete() {
        await this.item.complete();
    }
    $title(value) {
        const title = [this.unparse(value)];
        if (this.fields.titleaddon)
            title.push(this.unparse(this.fields.titleaddon));
        if (this.fields.subtitle)
            title.push(this.unparse(this.fields.subtitle));
        if (this.type === 'encyclopediaArticle') {
            this.set('publicationTitle', title.join(' - '));
        }
        else {
            this.set('title', title.join(' - '));
        }
        return true;
    }
    $titleaddon(value) { return true; } // handled by $title
    $subtitle(value) { return true; } // handled by $title
    $author(value, field) {
        this.item.creators.push.apply(this.item.creators, this.unparseNamelist(value, field));
        // biblatex-csl-importer does not preserve field order, so sort on creator type, preserving order within creatorType
        const creators = {
            author: [],
            editor: [],
            translator: [],
        };
        for (const creator of this.item.creators) {
            creators[creator.creatorType].push(creator);
        }
        this.item.creators = creators.author.concat(creators.editor, creators.translator);
        return true;
    }
    $editor(value, field) { return this.$author(value, field); }
    $translator(value, field) { return this.$author(value, field); }
    $publisher(value) {
        const field = ['publisher', 'institution'].find(f => this.validFields.get(f)); // difference between jurism and zotero
        if (!field)
            return false;
        if (!this.item[field])
            this.item[field] = '';
        if (this.item[field])
            this.item[field] += ' / ';
        this.item[field] += value.map(this.unparse).join(' and ').replace(/[ \t\r\n]+/g, ' ');
        return true;
    }
    $institution(value) { return this.$publisher(value); }
    $school(value) { return this.$publisher(value); }
    $address(value) { return this.set('place', this.unparse(value)); }
    $location(value) {
        if (this.type === 'conferencePaper') {
            this.hackyFields.push(`event-place: ${this.unparse(value)}`);
            return true;
        }
        return this.$address(value);
    }
    $edition(value) { return this.set('edition', this.unparse(value)); }
    $isbn(value) { return this.set('ISBN', this.unparse(value)); }
    $date(value) { return this.set('date', this.unparse(value)); }
    $booktitle(value) {
        value = this.unparse(value);
        switch (this.type) {
            case 'conferencePaper':
            case 'bookSection':
                return this.set('publicationTitle', value);
            case 'book':
                if (!this.item.title)
                    return this.set('title', value);
                break;
        }
        return false;
    }
    $journaltitle(value) {
        value = this.unparse(value);
        switch (this.type) {
            case 'conferencePaper':
                this.set('series', value);
                break;
            default:
                this.set('publicationTitle', value);
                break;
        }
        return true;
    }
    $journal(value) { return this.$journaltitle(value); }
    $pages(value) {
        // https://github.com/fiduswriter/biblatex-csl-converter/issues/51
        const pages = [];
        for (const range of value) {
            if (range.length === 1) {
                const p = this.unparse(range[0]);
                if (p)
                    pages.push(p);
            }
            else {
                const p0 = this.unparse(range[0]);
                const p1 = this.unparse(range[1]);
                if (p0 || p1)
                    pages.push(`${p0}-${p1}`);
            }
        }
        if (!pages.length)
            return true;
        for (const field of ['pages', 'numPages']) {
            if (!this.validFields.get(field))
                continue;
            this.set(field, pages.join(', '));
            return true;
        }
        return false;
    }
    $pagetotal(value) { return this.$pages([[value]]); } // pages expects ranges
    $volume(value) { return this.set('volume', this.unparse(value)); }
    $doi(value) { return this.set('DOI', this.unparse(value)); }
    $abstract(value) { return this.set('abstractNote', this.unparse(value, false)); }
    $keywords(value) {
        value = value.map(tag => this.unparse(tag).replace(/\n+/g, ' '));
        if (value.length === 1 && value[0].indexOf(';') > 0)
            value = value[0].split(/\s*;\s*/);
        if (!this.item.tags)
            this.item.tags = [];
        this.item.tags = this.item.tags.concat(value);
        this.item.tags = this.item.tags.sort().filter((item, pos, ary) => !pos || (item !== ary[pos - 1]));
        return true;
    }
    $keyword(value) { return this.$keywords(value); }
    $year(value) {
        value = this.unparse(value);
        if (this.item.date) {
            if (this.item.date.indexOf(value) < 0)
                this.item.date += value;
        }
        else {
            this.item.date = value;
        }
        return true;
    }
    $month(value) {
        value = this.unparse(value);
        const month = months.indexOf(value.toLowerCase());
        if (month >= 0) {
            value = Zotero.Utilities.formatDate({ month });
        }
        else {
            value += ' ';
        }
        if (this.item.date) {
            if (value.indexOf(this.item.date) >= 0) {
                /* value contains year and more */
                this.item.date = value;
            }
            else {
                this.item.date = value + this.item.date;
            }
        }
        else {
            this.item.date = value;
        }
        return true;
    }
    $file(value) {
        value = this.unparse(value);
        const replace = {
            '\\;': '\u0011',
            '\u0011': ';',
            '\\:': '\u0012',
            '\u0012': ':',
            '\\\\': '\u0013',
            '\u0013': '\\',
        };
        for (const record of value.replace(/\\[\\;:]/g, escaped => replace[escaped]).split(';')) {
            const att = {
                mimeType: '',
                path: '',
                title: '',
            };
            const parts = record.split(':').map(str => str.replace(/[\u0011\u0012\u0013]/g, escaped => replace[escaped]));
            switch (parts.length) {
                case 1:
                    att.path = parts[0];
                    break;
                case 3: // tslint:disable-line:no-magic-numbers
                    att.title = parts[0];
                    att.path = parts[1];
                    att.mimeType = parts[2]; // tslint:disable-line:no-magic-numbers
                    break;
                default:
                    debug_1.debug(`Unexpected number of parts in file record '${record}': ${parts.length}`);
                    break;
            }
            if (!att.path) {
                debug_1.debug(`file record '${record}' has no file path`);
                continue;
            }
            debug_1.debug('$file:', att, this.jabref.meta);
            if (this.jabref.meta.fileDirectory)
                att.path = `${this.jabref.meta.fileDirectory}${Translator.pathSep}${att.path}`;
            if (att.mimeType.toLowerCase() === 'pdf' || (!att.mimeType && att.path.toLowerCase().endsWith('.pdf'))) {
                att.mimeType = 'application/pdf';
            }
            if (!att.mimeType)
                delete att.mimeType;
            att.title = att.title || att.path.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
            if (!att.title)
                delete att.title;
            debug_1.debug('$file:*', att, this.jabref.meta);
            this.item.attachments.push(att);
        }
        return true;
    }
    '$date-modified'(value) { return this.item.dateAdded = this.unparse(value); }
    '$date-added'(value) { return this.item.dateAdded = this.unparse(value); }
    '$added-at'(value) { return this.item.dateAdded = this.unparse(value); }
    $timestamp(value) { return this.item.dateAdded = this.unparse(value); }
    $number(value) {
        value = this.unparse(value);
        for (const field of ['seriesNumber', 'number', 'issue']) {
            if (!this.validFields.get(field))
                continue;
            this.set(field, value);
            return true;
        }
        return false;
    }
    $issue(value) { return this.$number(value); }
    $issn(value) {
        if (!this.validFields.get('ISSN'))
            return false;
        return this.set('ISSN', this.unparse(value));
    }
    $url(value, field) {
        let m, url;
        value = this.unparse(value);
        if (m = value.match(/^(\\url{)(https?:\/\/|mailto:)}$/i)) {
            url = m[2];
        }
        else if (field === 'url' || /^(https?:\/\/|mailto:)/i.test(value)) {
            url = value;
        }
        else {
            url = null;
        }
        if (!url)
            return false;
        if (this.item.url)
            return (this.item.url === url);
        this.item.url = url;
        return true;
    }
    $howpublished(value, field) { return this.$url(value, field); }
    $holder(value) {
        this.set('assignee', this.unparseNamelist(value, 'assignee').map(assignee => assignee.fieldMode ? assignee.lastName : `${assignee.lastName}, ${assignee.firstName}`).join('; '));
        return true;
    }
    $type(value) {
        value = this.unparse(value);
        if (this.type === 'patent') {
            this.numberPrefix = { patent: '', patentus: 'US', patenteu: 'EP', patentuk: 'GB', patentdede: 'DE', patentfr: 'FR' }[value.toLowerCase()];
            return typeof this.numberPrefix !== 'undefined';
        }
        if (this.validFields.get('type')) {
            this.set('type', this.unparse(value));
            return true;
        }
        return false;
    }
    $lista(value) {
        if (this.type !== 'encyclopediaArticle' || !!this.item.title)
            return false;
        this.set('title', this.unparse(value));
        return true;
    }
    $annotation(value) {
        this.item.notes.push(Zotero.Utilities.text2html(this.unparse(value, false)));
        return true;
    }
    $comment(value) { return this.$annotation(value); }
    $annote(value) { return this.$annotation(value); }
    $review(value) { return this.$annotation(value); }
    $notes(value) { return this.$annotation(value); }
    $urldate(value) { return this.set('accessDate', this.unparse(value)); }
    $lastchecked(value) { return this.$urldate(value); }
    $series(value) { return this.set('series', this.unparse(value)); }
    // if the biblatex-csl-converter hasn't already taken care of it it is a remnant of the horribly broken JabRaf 3.8.1
    // groups format -- shoo, we don't want you
    $groups(value) { return true; }
    $note(value) {
        this.addToExtra(this.unparse(value, false));
        return true;
    }
    $language(value, field) {
        let language;
        if (field === 'language') {
            language = value.map(this.unparse).join(' and ');
        }
        else {
            language = this.unparse(value);
        }
        if (!language)
            return true;
        switch (language.toLowerCase()) {
            case 'en':
            case 'eng':
            case 'usenglish':
            case 'english':
                language = 'English';
                break;
        }
        this.set('language', language);
        return true;
    }
    $langid(value, field) { return this.$language(value, field); }
    $shorttitle(value) { return this.set('shortTitle', this.unparse(value)); }
    $eprinttype(value, field) {
        this.eprint[field] = this.unparse(value).trim();
        this.eprint.eprintType = {
            arxiv: 'arXiv',
            jstor: 'JSTOR',
            pubmed: 'PMID',
            hdl: 'HDL',
            googlebooks: 'GoogleBooksID',
        }[this.eprint[field].toLowerCase()] || '';
        return true;
    }
    $archiveprefix(value, field) { return this.$eprinttype(value, field); }
    $eprint(value, field) {
        this.eprint[field] = this.unparse(value);
        return true;
    }
    $eprintclass(value, field) { return this.$eprint(value, field); }
    $primaryclass(value, field) { return this.$eprint(value, 'eprintclass'); }
    $slaccitation(value, field) { return this.$eprint(value, field); }
    $nationality(value) { return this.set('country', this.unparse(value)); }
    $chapter(value) { return this.set('section', this.unparse(value)); }
    error(err) {
        debug_1.debug(err);
        throw new Error(err);
    }
    unparse(text, condense = true) {
        debug_1.debug('unparsing', text);
        if (Array.isArray(text) && Array.isArray(text[0]))
            return text.map(t => this.unparse(t)).join(' and ');
        if (['string', 'number'].includes(typeof text))
            return text;
        if (!Array.isArray(text))
            text = [text];
        // split out sup/sub text that can be unicodified
        const chunks = [];
        for (const node of text) {
            if (node.type === 'variable') {
                chunks.push({ text: node.attrs.variable, marks: [] });
                continue;
            }
            if (!node.marks) {
                chunks.push(node);
                continue;
            }
            let sup = false;
            let sub = false;
            const nosupb = node.marks.filter(mark => {
                sup = sup || mark.type === 'sup';
                sub = sub || mark.type === 'sub';
                return !['sup', 'sub'].includes(mark.type);
            });
            if (sup === sub) { // !xor
                chunks.push(node);
                continue;
            }
            const tr = sup ? this.sup : this.sub;
            let unicoded = '';
            for (const c of Zotero.Utilities.XRegExp.split(node.text, '')) {
                if (sup && c === '\u00B0') { // spurious mark
                    unicoded += c;
                }
                else if (tr[c]) {
                    unicoded += tr[c];
                }
                else {
                    unicoded = null;
                    break;
                }
            }
            if (unicoded) {
                node.text = unicoded;
                node.marks = nosupb;
            }
            chunks.push(node);
        }
        //        switch
        //          when tr[c] && (i == 0 || !chunks[chunks.length - 1].unicoded) # can be replaced but not appended
        //            chunks.push({text: tr[c], marks: nosupb, unicoded: true})
        //          when tr[c]
        //            chunks[chunks.length - 1].text += tr[c] # can be replaced and appended
        //          when i == 0 || chunks[chunks.length - 1].unicoded # cannot be replaced and and cannot be appended
        //            chunks.push({text: c, marks: node.marks})
        //          else
        //            chunks[chunks.length - 1].text += c # cannot be replaced but can be appended
        // convert to string
        let html = '';
        let lastMarks = [];
        for (const node of chunks) {
            if (node.type === 'variable') {
                // This is an undefined variable
                // This should usually not happen, as CSL doesn't know what to
                // do with these. We'll put them into an unsupported tag.
                html += `${this.tags.undefined.open}${node.attrs.variable}${this.tags.undefined.close}`;
                continue;
            }
            const newMarks = [];
            if (node.marks) {
                for (const mark of node.marks) {
                    newMarks.push(mark.type);
                }
            }
            // close all tags that are not present in current text node.
            let closing = false;
            const closeTags = [];
            for (let index = 0; index < lastMarks.length; index++) {
                const mark = lastMarks[index];
                if (mark !== newMarks[index])
                    closing = true;
                if (closing)
                    closeTags.push(this.tags[mark].close);
            }
            // Add close tags in reverse order to close innermost tags
            // first.
            closeTags.reverse();
            html += closeTags.join('');
            // open all new tags that were not present in the last text node.
            let opening = false;
            for (let index = 0; index < newMarks.length; index++) {
                const mark = newMarks[index];
                if (mark !== lastMarks[index])
                    opening = true;
                if (opening)
                    html += this.tags[mark].open;
            }
            html += node.text;
            lastMarks = newMarks;
        }
        // Close all still open tags
        for (const mark of lastMarks.slice().reverse()) {
            html += this.tags[mark].close;
        }
        html = html.replace(/ \u00A0/g, ' ~'); // if allowtilde
        html = html.replace(/\u00A0 /g, '~ '); // if allowtilde
        // html = html.replace(/\uFFFD/g, '') # we have no use for the unicode replacement character
        return condense ? html.replace(/[\t\r\n ]+/g, ' ') : html;
    }
    unparseNamelist(names, creatorType) {
        return names.map(parsed => {
            const name = { creatorType };
            if (parsed.literal) {
                name.lastName = this.unparse(parsed.literal);
                name.fieldMode = 1;
            }
            else {
                name.firstName = this.unparse(parsed.given);
                name.lastName = this.unparse(parsed.family);
                if (parsed.prefix)
                    name.lastName = `${this.unparse(parsed.prefix)} ${name.lastName}`;
                if (parsed.suffix)
                    name.lastName = `${name.lastName}, ${this.unparse(parsed.suffix)}`;
                // creator = Zotero.Utilities.cleanAuthor(creator, field, false)
                if (name.lastName && !name.firstName)
                    name.fieldMode = 1;
            }
            return name;
        });
    }
    import() {
        this.hackyFields = [];
        this.eprint = {};
        for (const subtitle of ['titleaddon', 'subtitle']) {
            if (!this.fields.title && this.fields[subtitle]) {
                this.fields.title = this.fields[subtitle];
                delete this.fields[subtitle];
            }
        }
        debug_1.debug('importing bibtex:', this.bibtex, this.fields);
        for (const [field, value] of Object.entries(this.fields)) {
            if (field.match(/^local-zo-url-[0-9]+$/)) {
                if (this.$file(value))
                    continue;
            }
            else if (field.match(/^bdsk-url-[0-9]+$/)) {
                if (this.$url(value, field))
                    continue;
            }
            if (this[`$${field}`] && this[`$${field}`](value, field))
                continue;
            switch (field) {
                case 'doi':
                    this.hackyFields.push(`DOI: ${this.unparse(value)}`);
                    break;
                case 'issn':
                    this.hackyFields.push(`ISSN: ${this.unparse(value)}`);
                    break;
                default:
                    this.addToExtraData(field, this.unparse(value));
                    break;
            }
        }
        if (this.numberPrefix && this.item.number && !this.item.number.toLowerCase().startsWith(this.numberPrefix.toLowerCase()))
            this.item.number = `${this.numberPrefix}${this.item.number}`;
        if (this.bibtex.entry_key)
            this.addToExtra(`Citation Key: ${this.bibtex.entry_key}`); // Endnote has no citation keys in their bibtex
        if (this.eprint.slaccitation && !this.eprint.eprint) {
            const m = this.eprint.slaccitation.match(/^%%CITATION = (.+);%%$/);
            const arxiv = arXiv_1.arXiv.parse(m && m[1].trim());
            if (arxiv.id) {
                this.eprint.eprintType = this.eprint.eprinttype = 'arXiv';
                if (!this.eprint.archiveprefix)
                    this.eprint.archiveprefix = 'arXiv';
                this.eprint.eprint = arxiv.id;
                if (!this.eprint.eprintclass && arxiv.category)
                    this.eprint.eprintclass = arxiv.category;
            }
        }
        delete this.eprint.slaccitation;
        if (this.eprint.eprintType && this.eprint.eprint) {
            const eprintclass = this.eprint.eprintType === 'arXiv' && this.eprint.eprintclass ? ` [${this.eprint.eprintclass}]` : '';
            this.hackyFields.push(`${this.eprint.eprintType}: ${this.eprint.eprint}${eprintclass}`);
        }
        else {
            delete this.eprint.eprintType;
            for (const [k, v] of Object.entries(this.eprint)) {
                this.addToExtraData(k, v);
            }
        }
        const keys = Object.keys(this.extra.data);
        if (keys.length > 0) {
            let extraData;
            if (Translator.preferences.testing)
                keys.sort();
            if (this.extra.json && Translator.preferences.testing) {
                extraData = `bibtex*{${keys.map(k => JSON5.stringify({ [k]: this.extra.data[k] }).slice(1, -1))}}`;
            }
            else if (this.extra.json) {
                extraData = `bibtex*${JSON5.stringify(this.extra.data)}`;
            }
            else {
                extraData = `bibtex*[${keys.map(key => `${key}=${this.extra.data[key]}`).join(';')}]`;
            }
            this.addToExtra(extraData);
        }
        if (this.hackyFields.length > 0) {
            this.hackyFields.sort();
            this.addToExtra(this.hackyFields.join(' \n'));
        }
        if (!this.item.publisher && this.item.backupPublisher) {
            this.item.publisher = this.item.backupPublisher;
            delete this.item.backupPublisher;
        }
    }
    addToExtra(str) {
        if (this.item.extra && (this.item.extra !== '')) {
            this.item.extra += ` \n${str}`;
        }
        else {
            this.item.extra = str;
        }
    }
    addToExtraData(key, value) {
        this.extra.data[key] = this.unparse(value);
        if (key.match(/[\[\]=;\r\n]/) || value.match(/[\[\]=;\r\n]/))
            this.extra.json = true;
    }
    set(field, value) {
        debug_1.debug('import.set:', this.type, field, this.validFields.get(field));
        if (!this.validFields.get(field))
            return false;
        if (Translator.preferences.testing && (this.item[field] || typeof this.item[field] === 'number') && (value || typeof value === 'number') && this.item[field] !== value) {
            this.error(`import error: duplicate ${field} on ${this.type} ${this.bibtex.entry_key} (old: ${this.item[field]}, new: ${value})`);
        }
        this.item[field] = value;
        return true;
    }
}
// ZoteroItem::$__note__ = ZoteroItem::$__key__ = -> true
//
// ZoteroItem::$referenceType = (value) ->
//   @item.thesisType = value if value in [ 'phdthesis', 'mastersthesis' ]
//   return true
//
// ### these return the value which will be interpreted as 'true' ###
//
// ZoteroItem::$copyright    = (value) -> @item.rights = value
// ZoteroItem::$assignee     = (value) -> @item.assignee = value
// ZoteroItem::$issue        = (value) -> @item.issue = value
//
// ### ZoteroItem::$lccn = (value) -> @item.callNumber = value ###
// ZoteroItem::$lccn = (value) -> @hackyFields.push("LCCB: #{value}")
// ZoteroItem::$pmid = ZoteroItem::$pmcid = (value, field) -> @hackyFields.push("#{field.toUpperCase()}: #{value}")
// ZoteroItem::$mrnumber = (value) -> @hackyFields.push("MR: #{value}")
// ZoteroItem::$zmnumber = (value) -> @hackyFields.push("Zbl: #{value}")
//
// ZoteroItem::$subtitle = (value) ->
//   @item.title = '' unless @item.title
//   @item.title = @item.title.trim()
//   value = value.trim()
//   if not /[-–—:!?.;]$/.test(@item.title) and not /^[-–—:.;¡¿]/.test(value)
//     @item.title += ': '
//   else
//   @item.title += ' ' if @item.title.length
//   @item.title += value
//   return true
//
// ZoteroItem::$fjournal = (value) ->
//   @item.journalAbbreviation = @item.publicationTitle if @item.publicationTitle
//   @item.publicationTitle = value
//   return true
Translator.initialize = () => {
    reference_1.Reference.installPostscript();
    Translator.unicode = !Translator.preferences.asciiBibTeX;
};
Translator.doImport = async () => {
    let read;
    let input = '';
    while ((read = Zotero.read(0x100000)) !== false) { // tslint:disable-line:no-magic-numbers
        input += read;
    }
    if (Translator.preferences.strings)
        input = `${Translator.preferences.strings}\n${input}`;
    const bib = await biblatex.parse(input, {
        processUnexpected: true,
        processUnknown: { comment: 'f_verbatim' },
        processInvalidURIs: true,
        async: true,
        processComments: true,
    });
    const ignoreErrors = new Set(['alias_creates_duplicate_field', 'unexpected_field', 'unknown_date', 'unknown_field']); // ignore these -- biblatex-csl-converter considers these errors, I don't
    const errors = bib.errors.concat(bib.warnings).filter(err => !ignoreErrors.has(err.type));
    if (Translator.preferences.csquotes) {
        ZoteroItem.prototype.tags.enquote = { open: Translator.preferences.csquotes[0], close: Translator.preferences.csquotes[1] };
    }
    const whitelist = bib.comments
        .filter(comment => comment.startsWith('zotero-better-bibtex:whitelist:'))
        .map(comment => comment.toLowerCase().replace(/\s/g, '').split(':').pop().split(',').filter(key => key))[0];
    const itemIDS = {};
    let imported = 0;
    const references = Object.entries(bib.entries); // TODO: add typings to the npm package
    for (const [id, bibtex] of references) {
        if (bibtex.entry_key && whitelist && !whitelist.includes(bibtex.entry_key.toLowerCase()))
            continue;
        if (bibtex.entry_key)
            itemIDS[bibtex.entry_key] = id; // Endnote has no citation keys
        debug_1.debug('importing item with key', bibtex.entry_key);
        try {
            await (new ZoteroItem(id, bibtex, bib.jabref)).complete();
        }
        catch (err) {
            debug_1.debug('bbt import error:', err);
            errors.push({ type: 'bbt_error', error: err });
        }
        imported += 1;
        Zotero.setProgress(imported / references.length * 100); // tslint:disable-line:no-magic-numbers
    }
    for (const group of bib.jabref.groups || []) {
        importGroup(group, itemIDS, true);
    }
    if (errors.length) {
        const item = new Zotero.Item('note');
        item.note = 'Import errors found: <ul>';
        for (const err of errors) {
            switch (err.type) {
                case 'cut_off_citation':
                    item.note += `<li>line ${err.line}: ${escape.html(`incomplete reference @${err.entry}`)}</li>`;
                    break;
                case 'token_mismatch':
                    item.note += `<li>line ${err.line}: found ${escape.html(JSON.stringify(err.found))}, expected ${escape.html(JSON.stringify(err.expected))}</li>`;
                    break;
                case 'undefined_variable':
                    item.note += `<li>line ${err.line}: undefined variable '${escape.html(err.variable)}'</li>`;
                    break;
                case 'unknown_type':
                    item.note += `<li>line ${err.line}: unknown reference type '${escape.html(err.type_name)}'</li>`;
                    break;
                case 'bbt_error':
                    item.note += `<li>Unhandled Better BibTeX error: '${escape.html(err.error.toString())}'</li>`;
                    break;
                default:
                    if (Translator.preferences.testing)
                        throw new Error('unhandled import error: ' + JSON.stringify(err));
                    item.note += `<li>line ${err.line}: found ${escape.html(err.type)}`;
                    break;
            }
        }
        item.tags = ['#Better BibTeX import error'];
        item.note += '</ul>';
        await item.complete();
    }
    Zotero.setProgress(100); // tslint:disable-line:no-magic-numbers
};
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/Better BibTeX.ts')
  ; } catch ($wrap_loader_catcher_translators_Better_BibTeX_ts) { 
    var $wrap_loader_message_translators_Better_BibTeX_ts = 'Error: zotero-better-bibtex: load of translators/Better BibTeX.ts failed:' + $wrap_loader_catcher_translators_Better_BibTeX_ts + '::' + $wrap_loader_catcher_translators_Better_BibTeX_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_Better_BibTeX_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_Better_BibTeX_ts)
    }
   };

/***/ }),

/***/ "./bibtex/datefield.ts":
/*!*****************************!*\
  !*** ./bibtex/datefield.ts ***!
  \*****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/bibtex/datefield.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __webpack_require__(/*! ../lib/debug */ "./lib/debug.ts");
function pad(v, padding) {
    if (v.length >= padding.length)
        return v;
    return (padding + v).slice(-padding.length);
}
function year(y) {
    // tslint:disable-next-line:no-magic-numbers
    if (Math.abs(y) > 999) {
        return `${y}`;
    }
    else {
        // tslint:disable-next-line:no-magic-numbers
        return (y < 0 ? '-' : '') + (`000${Math.abs(y)}`).slice(-4);
    }
}
function format(date) {
    let formatted;
    if (typeof date.year === 'number' && date.month && date.day) {
        formatted = `${year(date.year)}-${pad(date.month, '00')}-${pad(date.day, '00')}`;
    }
    else if (typeof date.year === 'number' && (date.month || date.season)) {
        // tslint:disable-next-line:no-magic-numbers
        formatted = `${year(date.year)}-${pad((date.month || (date.season + 20)), '00')}`;
    }
    else if (typeof date.year === 'number') {
        formatted = year(date.year);
    }
    else {
        formatted = '';
    }
    if (formatted && Translator.BetterBibLaTeX && Translator.preferences.biblatexExtendedDateFormat) {
        if (date.uncertain)
            formatted += '?';
        if (date.approximate)
            formatted += '~';
    }
    return formatted;
}
function datefield(date, field) {
    debug_1.debug('formatting date', date, field);
    if (!date)
        return {};
    if (date && !date.type && date.orig)
        return {};
    if (!date.type)
        throw new Error(`Failed to parse ${JSON.stringify(date)}`);
    field = Object.assign({}, field, { enc: 'latex', value: '' });
    if (date.type === 'verbatim') {
        field.name = field.verbatim;
        if (date.verbatim === 'n.d.') {
            field.value = '<pre>\\bibstring{nodate}</pre>';
        }
        else {
            field.value = date.verbatim;
        }
    }
    else if (date.type === 'date' || date.type === 'season') {
        field.value = format(date);
    }
    else if (date.type === 'interval') {
        field.value = `${format(date.from)}/${format(date.to)}`;
    }
    else if (date.year) {
        field.value = format(date);
    }
    if (!field.value || !field.name)
        return {};
    // well this is fairly dense... the date field is not an verbatim field, so the 'circa' symbol ('~') ought to mean a
    // NBSP... but some magic happens in that field (always with the magic, BibLaTeX...). But hey, if I insert an NBSP,
    // guess what that gets translated to!
    if (date.type !== 'verbatim')
        field.value = field.value.replace(/~/g, '\u00A0');
    return field;
}
exports.datefield = datefield;
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/bibtex/datefield.ts')
  ; } catch ($wrap_loader_catcher_translators_bibtex_datefield_ts) { 
    var $wrap_loader_message_translators_bibtex_datefield_ts = 'Error: zotero-better-bibtex: load of translators/bibtex/datefield.ts failed:' + $wrap_loader_catcher_translators_bibtex_datefield_ts + '::' + $wrap_loader_catcher_translators_bibtex_datefield_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_bibtex_datefield_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_bibtex_datefield_ts)
    }
   };

/***/ }),

/***/ "./bibtex/jabref.ts":
/*!**************************!*\
  !*** ./bibtex/jabref.ts ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/bibtex/jabref.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __webpack_require__(/*! ../lib/debug */ "./lib/debug.ts");
class JabRef {
    constructor() {
        this.citekeys = new Map;
    }
    exportGroups() {
        if ((Object.keys(Translator.collections).length === 0) || !Translator.preferences.jabrefFormat)
            return;
        let meta;
        if (Translator.preferences.jabrefFormat === 3) { // tslint:disable-line:no-magic-numbers
            meta = 'groupsversion:3';
        }
        else if (Translator.BetterBibLaTeX) {
            meta = 'databaseType:biblatex';
        }
        else {
            meta = 'databaseType:bibtex';
        }
        Zotero.write(`@comment{jabref-meta: ${meta};}\n`);
        Zotero.write('@comment{jabref-meta: groupstree:\n');
        this.groups = ['0 AllEntriesGroup:'];
        for (const collection of Object.values(Translator.collections)) {
            if (collection.parent)
                continue;
            this.exportGroup(collection, 1);
        }
        Zotero.write(this.groups.map(group => this.quote(group, true)).concat('').join(';\n'));
        Zotero.write('}\n');
    }
    exportGroup(collection, level) {
        let group = [`${level} ExplicitGroup:${this.quote(collection.name)}`, '0'];
        if (Translator.preferences.jabrefFormat === 3) { // tslint:disable-line:no-magic-numbers
            const references = ((collection.items || []).filter(id => this.citekeys.has(id)).map(id => this.quote(this.citekeys.get(id))));
            if (Translator.preferences.testing)
                references.sort();
            group = group.concat(references);
        }
        // what is the meaning of the empty cell at the end, JabRef?
        group.push('');
        this.groups.push(group.join(';'));
        for (const key of collection.collections || []) {
            if (Translator.collections[key])
                this.exportGroup(Translator.collections[key], level + 1);
        }
    }
    quote(s, wrap = false) {
        s = s.replace(/([\\;])/g, '\\$1');
        debug_1.debug('JabRef.quote:', s);
        if (wrap)
            s = s.match(/.{1,70}/g).join('\n');
        return s;
    }
}
exports.JabRef = JabRef;
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/bibtex/jabref.ts')
  ; } catch ($wrap_loader_catcher_translators_bibtex_jabref_ts) { 
    var $wrap_loader_message_translators_bibtex_jabref_ts = 'Error: zotero-better-bibtex: load of translators/bibtex/jabref.ts failed:' + $wrap_loader_catcher_translators_bibtex_jabref_ts + '::' + $wrap_loader_catcher_translators_bibtex_jabref_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_bibtex_jabref_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_bibtex_jabref_ts)
    }
   };

/***/ }),

/***/ "./bibtex/reference.ts":
/*!*****************************!*\
  !*** ./bibtex/reference.ts ***!
  \*****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/bibtex/reference.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exporter_1 = __webpack_require__(/*! ../lib/exporter */ "./lib/exporter.ts");
const unicode_translator_1 = __webpack_require__(/*! ./unicode_translator */ "./bibtex/unicode_translator.ts");
const debug_1 = __webpack_require__(/*! ../lib/debug */ "./lib/debug.ts");
const datefield_1 = __webpack_require__(/*! ./datefield */ "./bibtex/datefield.ts");
const arXiv_1 = __webpack_require__(/*! ../../content/arXiv */ "../content/arXiv.ts");
const Language = new class {
    constructor() {
        this.babelMap = {
            af: 'afrikaans',
            am: 'amharic',
            ar: 'arabic',
            ast: 'asturian',
            bg: 'bulgarian',
            bn: 'bengali',
            bo: 'tibetan',
            br: 'breton',
            ca: 'catalan',
            cop: 'coptic',
            cy: 'welsh',
            cz: 'czech',
            da: 'danish',
            de_1996: 'ngerman',
            de_at_1996: 'naustrian',
            de_at: 'austrian',
            de_de_1996: 'ngerman',
            de: ['german', 'germanb'],
            dsb: ['lsorbian', 'lowersorbian'],
            dv: 'divehi',
            el: 'greek',
            el_polyton: 'polutonikogreek',
            en_au: 'australian',
            en_ca: 'canadian',
            en: 'english',
            en_gb: ['british', 'ukenglish'],
            en_nz: 'newzealand',
            en_us: ['american', 'usenglish'],
            eo: 'esperanto',
            es: 'spanish',
            et: 'estonian',
            eu: 'basque',
            fa: 'farsi',
            fi: 'finnish',
            fr_ca: ['acadian', 'canadian', 'canadien'],
            fr: ['french', 'francais', 'français'],
            fur: 'friulan',
            ga: 'irish',
            gd: ['scottish', 'gaelic'],
            gl: 'galician',
            he: 'hebrew',
            hi: 'hindi',
            hr: 'croatian',
            hsb: ['usorbian', 'uppersorbian'],
            hu: 'magyar',
            hy: 'armenian',
            ia: 'interlingua',
            id: ['indonesian', 'bahasa', 'bahasai', 'indon', 'meyalu'],
            is: 'icelandic',
            it: 'italian',
            ja: 'japanese',
            kn: 'kannada',
            la: 'latin',
            lo: 'lao',
            lt: 'lithuanian',
            lv: 'latvian',
            ml: 'malayalam',
            mn: 'mongolian',
            mr: 'marathi',
            nb: ['norsk', 'bokmal', 'nob'],
            nl: 'dutch',
            nn: 'nynorsk',
            no: ['norwegian', 'norsk'],
            oc: 'occitan',
            pl: 'polish',
            pms: 'piedmontese',
            pt_br: ['brazil', 'brazilian'],
            pt: ['portuguese', 'portuges'],
            pt_pt: 'portuguese',
            rm: 'romansh',
            ro: 'romanian',
            ru: 'russian',
            sa: 'sanskrit',
            se: 'samin',
            sk: 'slovak',
            sl: ['slovenian', 'slovene'],
            sq_al: 'albanian',
            sr_cyrl: 'serbianc',
            sr_latn: 'serbian',
            sr: 'serbian',
            sv: 'swedish',
            syr: 'syriac',
            ta: 'tamil',
            te: 'telugu',
            th: ['thai', 'thaicjk'],
            tk: 'turkmen',
            tr: 'turkish',
            uk: 'ukrainian',
            ur: 'urdu',
            vi: 'vietnamese',
            zh_latn: 'pinyin',
            zh: 'pinyin',
            zlm: ['malay', 'bahasam', 'melayu'],
        };
        for (const [key, value] of Object.entries(this.babelMap)) {
            if (typeof value === 'string')
                this.babelMap[key] = [value];
        }
        // list of unique languages
        this.babelList = [];
        for (const v of Object.values(this.babelMap)) {
            for (const lang of v) {
                if (this.babelList.indexOf(lang) < 0)
                    this.babelList.push(lang);
            }
        }
        this.cache = {};
        this.prefix = {};
    }
    lookup(langcode) {
        if (!this.cache[langcode]) {
            this.cache[langcode] = [];
            for (const lc of Language.babelList) {
                this.cache[langcode].push({ lang: lc, sim: this.string_similarity(langcode, lc) });
            }
            this.cache[langcode].sort((a, b) => b.sim - a.sim);
        }
        return this.cache[langcode];
    }
    fromPrefix(langcode) {
        if (!langcode || (langcode.length < 2))
            return false;
        if (this.prefix[langcode] == null) {
            // consider a langcode matched if it is the prefix of exactly one language in the map
            const lc = langcode.toLowerCase();
            const matches = [];
            for (const languages of Object.values(Language.babelMap)) {
                for (const lang of languages) {
                    if (lang.toLowerCase().indexOf(lc) !== 0)
                        continue;
                    matches.push(languages);
                    break;
                }
            }
            if (matches.length === 1) {
                this.prefix[langcode] = matches[0];
            }
            else {
                this.prefix[langcode] = false;
            }
        }
        return this.prefix[langcode];
    }
    get_bigrams(str) {
        const s = str.toLowerCase();
        const bigrams = [...Array(s.length).keys()].map(i => s.slice(i, i + 2));
        bigrams.sort();
        return bigrams;
    }
    string_similarity(str1, str2) {
        const pairs1 = this.get_bigrams(str1);
        const pairs2 = this.get_bigrams(str2);
        const union = pairs1.length + pairs2.length;
        let hit_count = 0;
        while ((pairs1.length > 0) && (pairs2.length > 0)) {
            if (pairs1[0] === pairs2[0]) {
                hit_count++;
                pairs1.shift();
                pairs2.shift();
                continue;
            }
            if (pairs1[0] < pairs2[0]) {
                pairs1.shift();
            }
            else {
                pairs2.shift();
            }
        }
        return (hit_count * 2) / union;
    }
};
/*
 * h1 Global object: Translator
 *
 * The global Translator object allows access to the current configuration of the translator
 *
 * @param {enum} caseConversion whether titles should be title-cased and case-preserved
 * @param {boolean} bibtexURL set to true when BBT will generate \url{..} around the urls for BibTeX
 */
/*
 * h1 class: Reference
 *
 * The Bib(La)TeX references are generated by the `Reference` class. Before being comitted to the cache, you can add
 * postscript code that can manipulated the `has` or the `referencetype`
 *
 * @param {String} @referencetype referencetype
 * @param {Object} @item the current Zotero item being converted
 */
/*
 * The fields are objects with the following keys:
 *   * name: name of the Bib(La)TeX field
 *   * value: the value of the field
 *   * bibtex: the LaTeX-encoded value of the field
 *   * enc: the encoding to use for the field
 */
class Reference {
    constructor(item) {
        this.has = {};
        this.cachable = true;
        // private nonLetters = new Zotero.Utilities.XRegExp('[^\\p{Letter}]', 'g')
        this.punctuationAtEnd = new Zotero.Utilities.XRegExp('[\\p{Punctuation}]$');
        this.startsWithLowercase = new Zotero.Utilities.XRegExp('^[\\p{Ll}]');
        this.hasLowercaseWord = new Zotero.Utilities.XRegExp('\\s[\\p{Ll}]');
        this.whitespace = new Zotero.Utilities.XRegExp('\\p{Zs}');
        this.inPostscript = false;
        this._enc_creators_initials_marker = '\u0097'; // end of guarded area
        this._enc_creators_relax_marker = '\u200C'; // zero-width non-joiner
        this.isBibVarRE = /^[a-z][a-z0-9_]*$/i;
        this.metadata = { DeclarePrefChars: '', noopsort: false };
        this.item = item;
        this.raw = (Translator.preferences.rawLaTag === '*') || (this.item.tags.includes(Translator.preferences.rawLaTag));
        if (!this.item.language) {
            this.english = true;
            debug_1.debug('detecting language: defaulting to english');
        }
        else {
            const langlc = this.item.language.toLowerCase();
            let language = Language.babelMap[langlc.replace(/[^a-z0-9]/, '_')];
            if (!language)
                language = Language.babelMap[langlc.replace(/-[a-z]+$/i, '').replace(/[^a-z0-9]/, '_')];
            if (!language)
                language = Language.fromPrefix(langlc);
            debug_1.debug('detecting language:', { langlc, language });
            if (language) {
                this.language = language[0];
            }
            else {
                const match = Language.lookup(langlc);
                if (match[0].sim >= 0.9) { // tslint:disable-line:no-magic-numbers
                    this.language = match[0].lang;
                }
                else {
                    this.language = this.item.language;
                }
            }
            this.english = ['american', 'british', 'canadian', 'english', 'australian', 'newzealand', 'usenglish', 'ukenglish', 'anglais'].includes(this.language.toLowerCase());
            debug_1.debug('detected language:', { language: this.language, english: this.english });
        }
        if (this.item.extraFields.csl.type) {
            this.item.cslType = this.item.extraFields.csl.type.value.toLowerCase();
            delete item.extraFields.csl.type;
        }
        if (this.item.extraFields.csl['volume-title']) { // should just have been mapped by Zotero
            this.item.cslVolumeTitle = this.item.extraFields.csl['volume-title'].value;
            delete this.item.extraFields.csl['volume-title'];
        }
        this.item.referenceType = this.item.cslType || this.item.itemType;
        debug_1.debug('postextract: item:', this.item);
        // should be const referencetype: string | { type: string, subtype?: string }
        // https://github.com/Microsoft/TypeScript/issues/10422
        const referencetype = this.typeMap.csl[this.item.cslType] || this.typeMap.zotero[this.item.itemType] || 'misc';
        if (typeof referencetype === 'string') {
            this.referencetype = referencetype;
        }
        else {
            this.add({ name: 'entrysubtype', value: referencetype.subtype });
            this.referencetype = referencetype.type;
        }
        if (Translator.preferences.jabrefFormat) {
            if (Translator.preferences.testing) {
                this.add({ name: 'timestamp', value: '2015-02-24 12:14:36 +0100' });
            }
            else {
                this.add({ name: 'timestamp', value: this.item.dateModified || this.item.dateAdded });
            }
        }
        if ((this.item.libraryCatalog || '').match(/^arxiv(\.org)?$/i) && (this.item.arXiv = arXiv_1.arXiv.parse(this.item.publicationTitle)) && this.item.arXiv.id) {
            this.item.arXiv.source = 'publicationTitle';
            if (Translator.BetterBibLaTeX)
                delete this.item.publicationTitle;
        }
        else if (this.item.extraFields.kv.arxiv && (this.item.arXiv = arXiv_1.arXiv.parse(this.item.extraFields.kv.arxiv)) && this.item.arXiv.id) {
            this.item.arXiv.source = 'extra';
        }
        else {
            this.item.arXiv = null;
        }
        if (this.item.arXiv) {
            delete this.item.extraFields.kv.arxiv;
            this.add({ name: 'archivePrefix', value: 'arXiv' });
            this.add({ name: 'eprinttype', value: 'arxiv' });
            this.add({ name: 'eprint', value: this.item.arXiv.id });
            this.add({ name: 'primaryClass', value: this.item.arXiv.category });
        }
    }
    static installPostscript() {
        const postscript = Translator.preferences.postscript;
        if (typeof postscript !== 'string' || postscript.trim() === '')
            return;
        try {
            Reference.prototype.postscript = new Function('reference', 'item', `this.inPostscript = true; ${postscript}; this.inPostscript = false;`);
            Zotero.debug(`Installed postscript: ${JSON.stringify(postscript)}`);
        }
        catch (err) {
            Zotero.debug(`Failed to compile postscript: ${err}\n\n${JSON.stringify(postscript)}`);
        }
    }
    /** normalize dashes, mainly for use in `pages` */
    normalizeDashes(str) {
        str = (str || '').trim();
        if (this.raw)
            return str;
        return str
            .replace(/\u2053/g, '~')
            .replace(/[\u2014\u2015]/g, '---') // em-dash
            .replace(/[\u2012\u2013]/g, '--'); // en-dash
        // .replace(/([0-9])\s-\s([0-9])/g, '$1--$2') // treat space-hyphen-space like an en-dash when it's between numbers
    }
    /*
     * Add a field to the reference field set
     *
     * @param {field} field to add. 'name' must be set, and either 'value' or 'bibtex'. If you set 'bibtex', BBT will trust
     *   you and just use that as-is. If you set 'value', BBT will escape the value according the encoder passed in 'enc'; no
     *   'enc' means 'enc_latex'. If you pass both 'bibtex' and 'latex', 'bibtex' takes precedence (and 'value' will be
     *   ignored)
     */
    add(field) {
        debug_1.debug('add field', field);
        if (field.enc === 'date') {
            if (!field.value)
                return;
            if (Translator.BetterBibLaTeX && Translator.preferences.biblatexExtendedDateFormat && Zotero.BetterBibTeX.isEDTF(field.value, true)) {
                return this.add(Object.assign({}, field, { enc: 'verbatim' }));
            }
            if (field.value === 'today') {
                return this.add(Object.assign({}, field, { value: '<pre>\\today</pre>', enc: 'verbatim' }));
            }
            const date = Zotero.BetterBibTeX.parseDate(field.value);
            this.add(datefield_1.datefield(date, field));
            this.add(datefield_1.datefield(date.orig, Object.assign({}, field, { name: (field.orig && field.orig.inherit) ? `orig${field.name}` : (field.orig && field.orig.name), verbatim: (field.orig && field.orig.inherit && field.verbatim) ? `orig${field.verbatim}` : (field.orig && field.orig.verbatim) })));
            return;
        }
        if (field.fallback && field.replace)
            throw new Error('pick fallback or replace, buddy');
        if (field.fallback && this.has[field.name])
            return;
        // legacy field addition, leave in place for postscripts
        if (!field.name) {
            const keys = Object.keys(field);
            switch (keys.length) {
                case 0: // name -> undefined/null
                    return;
                case 1:
                    field = { name: keys[0], value: field[keys[0]] };
                    break;
                default:
                    throw new Error(`Quick-add mode expects exactly one name -> value mapping, found ${JSON.stringify(field)} (${(new Error()).stack})`);
            }
        }
        if (!field.bibtex) {
            if ((typeof field.value !== 'number') && !field.value)
                return;
            if ((typeof field.value === 'string') && (field.value.trim() === ''))
                return;
            if (Array.isArray(field.value) && (field.value.length === 0))
                return;
        }
        if (this.has[field.name]) {
            if (!this.inPostscript && !field.replace)
                throw new Error(`duplicate field '${field.name}' for ${this.item.citekey}`);
            this.remove(field.name);
        }
        if (!field.bibtex) {
            if ((typeof field.value === 'number') || (field.preserveBibTeXVariables && this.isBibVar(field.value))) {
                field.bibtex = `${field.value}`;
            }
            else {
                const enc = field.enc || this.fieldEncoding[field.name] || 'latex';
                let value = this[`enc_${enc}`](field, this.raw);
                if (!value)
                    return;
                value = value.trim();
                if (!field.bare || field.value.match(/\s/)) {
                    // clean up unnecesary {} when followed by a char that safely terminates the command before
                    // value = value.replace(/({})+($|[{}$\/\\.;,])/g, '$2') // don't remove trailing {} https://github.com/retorquere/zotero-better-bibtex/issues/1091
                    value = value.replace(/({})+([{}\$\/\\\.;,])/g, '$2');
                    value = `{${value}}`;
                }
                field.bibtex = value;
            }
        }
        this.has[field.name] = field;
    }
    /*
     * Remove a field from the reference field set
     *
     * @param {name} field to remove.
     * @return {Object} the removed field, if present
     */
    remove(name) {
        if (!this.has[name])
            return;
        debug_1.debug('remove field', name);
        const removed = this.has[name];
        delete this.has[name];
        return removed;
    }
    isBibVar(value) {
        return Translator.preferences.preserveBibTeXVariables && value && (typeof value === 'string') && this.isBibVarRE.test(value);
    }
    hasCreator(type) { return (this.item.creators || []).some(creator => creator.creatorType === type); }
    override(field) {
        const itemtype_name = field.name.split('.');
        let name;
        if (itemtype_name.length === 2) {
            if (this.referencetype !== itemtype_name[0])
                return;
            name = itemtype_name[1];
        }
        else {
            name = itemtype_name;
        }
        if ((typeof field.value === 'string') && (field.value.trim() === '')) {
            this.remove(name);
            return;
        }
        this.add(Object.assign({}, field, { name, replace: (typeof field.replace !== 'boolean' && typeof field.fallback !== 'boolean') || field.replace }));
    }
    complete() {
        if (Translator.preferences.DOIandURL !== 'both') {
            if (this.has.doi && this.has.url) {
                debug_1.debug('removing', Translator.preferences.DOIandURL === 'doi' ? 'url' : 'doi');
                switch (Translator.preferences.DOIandURL) {
                    case 'doi':
                        this.remove('url');
                        break;
                    case 'url':
                        this.remove('doi');
                        break;
                }
            }
        }
        if ((this.item.collections || []).length && Translator.preferences.jabrefFormat === 4) { // tslint:disable-line:no-magic-numbers
            let groups = this.item.collections.filter(key => Translator.collections[key]).map(key => Translator.collections[key].name);
            groups = groups.sort().filter((item, pos, ary) => !pos || (item !== ary[pos - 1]));
            this.add({ name: 'groups', value: groups.join(',') });
        }
        for (const [cslName, field] of Object.entries(this.item.extraFields.csl)) {
            debug_1.debug('extraFields: csl', cslName, field);
            // these are handled just like 'arxiv' and 'lccn', respectively
            if (['pmid', 'pmcid'].includes(cslName)) {
                this.item.extraFields.kv[cslName] = field;
                delete this.item.extraFields.csl[cslName];
                continue;
            }
            let name = null;
            let replace = false;
            let enc;
            switch (field.type) {
                case 'string':
                    enc = null;
                    break;
                case 'creator':
                    enc = 'creators';
                    break;
                case 'date':
                    enc = 'date';
                    replace = true;
                default:
                    enc = field.type;
            }
            // CSL names are not in BibTeX format, so only add it if there's a mapping
            if (Translator.BetterBibLaTeX) {
                switch (cslName) {
                    case 'authority':
                        name = 'institution';
                        break;
                    case 'status':
                        name = 'pubstate';
                        break;
                    case 'title':
                        name = this.referencetype === 'book' ? 'maintitle' : null;
                        break;
                    case 'container-title':
                        switch (this.item.referenceType) {
                            case 'film':
                            case 'tvBroadcast':
                            case 'videoRecording':
                            case 'motion_picture':
                                name = 'booktitle';
                                break;
                            case 'bookSection':
                            case 'chapter':
                                name = 'maintitle';
                                break;
                            default:
                                name = 'journaltitle';
                                break;
                        }
                        break;
                    case 'original-publisher':
                        name = 'origpublisher';
                        enc = 'literal';
                        break;
                    case 'original-publisher-place':
                        name = 'origlocation';
                        enc = 'literal';
                        break;
                    case 'original-title':
                        name = 'origtitle';
                        break;
                    case 'original-date':
                        name = 'origdate';
                        break;
                    case 'publisher-place':
                        name = 'location';
                        enc = 'literal';
                        break;
                    case 'issued':
                        name = 'date';
                        break;
                    // https://github.com/retorquere/zotero-better-bibtex/issues/644
                    case 'event-place':
                        name = 'venue';
                        break;
                    case 'event-date':
                        name = 'eventdate';
                        break;
                    case 'accessed':
                        name = 'urldate';
                        break;
                    case 'number':
                    case 'volume':
                    case 'author':
                    case 'director':
                    case 'editor':
                    case 'doi':
                    case 'isbn':
                    case 'issn':
                        name = cslName;
                        break;
                }
            }
            if (Translator.BetterBibTeX) {
                switch (cslName) {
                    case 'call-number':
                        name = 'lccn';
                        break;
                    case 'doi':
                    case 'issn':
                        name = cslName;
                        break;
                }
            }
            if (name) {
                this.override({ name, verbatim: name, orig: { inherit: true }, value: field.value, enc, replace, fallback: !replace });
            }
            else {
                debug_1.debug('Unmapped CSL field', cslName, '=', field.value);
            }
        }
        for (const [name, field] of Object.entries(this.item.extraFields.bibtex)) {
            debug_1.debug('extraFields: bibtex', name, field);
            // psuedo-var, sets the reference type
            if (name === 'referencetype') {
                this.referencetype = field.value;
                continue;
            }
            debug_1.debug('extraFields: bibtex');
            this.override(field);
        }
        for (const [name, field] of Object.entries(this.item.extraFields.kv)) {
            debug_1.debug('extraFields: kv', name, field);
            switch (name) {
                case 'mr':
                    this.override({ name: 'mrnumber', value: field.value, raw: field.raw });
                    break;
                case 'zbl':
                    this.override({ name: 'zmnumber', value: field.value, raw: field.raw });
                    break;
                case 'lccn':
                case 'pmcid':
                    this.override({ name, value: field.value, raw: field.raw });
                    break;
                case 'pmid':
                case 'arxiv':
                case 'jstor':
                case 'hdl':
                    if (Translator.BetterBibLaTeX) {
                        this.override({ name: 'eprinttype', value: name });
                        this.override({ name: 'eprint', value: field.value, raw: field.raw });
                    }
                    else {
                        this.override({ name, value: field.value, raw: field.raw });
                    }
                    break;
                case 'googlebooksid':
                    if (Translator.BetterBibLaTeX) {
                        this.override({ name: 'eprinttype', value: 'googlebooks' });
                        this.override({ name: 'eprint', value: field.value, raw: field.raw });
                    }
                    else {
                        this.override({ name: 'googlebooks', value: field.value, raw: field.raw });
                    }
                    break;
                case 'xref':
                    this.override({ name, value: field.value, raw: field.raw });
                    break;
                default:
                    debug_1.debug('unexpected KV field', name, field);
            }
        }
        let notes = '';
        if (Translator.options.exportNotes && this.item.notes && this.item.notes.length) {
            notes = this.item.notes.join('<p>');
        }
        const annotation = Translator.BetterBibTeX ? 'annote' : 'annotation';
        if (this.has.note && this.item.extra) {
            this.add({ name: annotation, value: notes ? `${this.item.extra.replace(/\n/g, '<br/>')}<p>${notes}` : this.item.extra, html: !!notes });
        }
        else {
            this.add({ name: 'note', value: this.item.extra });
            this.add({ name: annotation, value: notes, html: true });
        }
        let cache;
        try {
            cache = this.postscript(this, this.item);
        }
        catch (err) {
            debug_1.debug('Reference.postscript failed:', err);
            cache = false;
        }
        this.cachable = this.cachable && (typeof cache !== 'boolean' || cache);
        for (const name of Translator.preferences.skipFields) {
            this.remove(name);
        }
        if (!this.has.url && this.has.urldate)
            this.remove('urldate');
        if (!Object.keys(this.has).length)
            this.add({ name: 'type', value: this.referencetype });
        const fields = Object.values(this.has).map(field => `  ${field.name} = ${field.bibtex}`);
        // sort fields for stable tests
        if (Translator.preferences.testing || Translator.preferences.sorted)
            fields.sort();
        let ref = `@${this.referencetype}{${this.item.citekey},\n`;
        ref += fields.join(',\n');
        ref += '\n}\n';
        ref += this.qualityReport();
        ref += '\n';
        if (Translator.preferences.sorted) {
            Translator.references.push({ citekey: this.item.citekey, reference: ref });
        }
        else {
            Zotero.write(ref);
        }
        this.metadata.DeclarePrefChars = exporter_1.Exporter.unique_chars(this.metadata.DeclarePrefChars);
        if (Translator.caching && this.cachable)
            Zotero.BetterBibTeX.cacheStore(this.item.itemID, Translator.options, Translator.preferences, ref, this.metadata);
        if (this.metadata.DeclarePrefChars)
            exporter_1.Exporter.preamble.DeclarePrefChars += this.metadata.DeclarePrefChars;
        if (this.metadata.noopsort)
            exporter_1.Exporter.preamble.noopsort = true;
    }
    /*
     * 'Encode' to raw LaTeX value
     *
     * @param {field} field to encode
     * @return {String} unmodified `field.value`
     */
    enc_raw(f) {
        return f.value;
    }
    /*
     * Encode to LaTeX url
     *
     * @param {field} field to encode
     * @return {String} field.value encoded as verbatim LaTeX string (minimal escaping). If in Better BibTeX, wraps return value in `\url{string}`
     */
    enc_url(f) {
        const value = this.enc_verbatim(f);
        if (Translator.BetterBibTeX) {
            return `\\url{${value}}`;
        }
        else {
            return value;
        }
    }
    /*
     * Encode to verbatim LaTeX
     *
     * @param {field} field to encode
     * @return {String} field.value encoded as verbatim LaTeX string (minimal escaping).
     */
    enc_verbatim(f) {
        return this.toVerbatim(f.value);
    }
    _enc_creators_scrub_name(name) {
        return Zotero.Utilities.XRegExp.replace(name, this.whitespace, ' ', 'all');
    }
    /*
     * Encode creators to author-style field
     *
     * @param {field} field to encode. The 'value' must be an array of Zotero-serialized `creator` objects.
     * @return {String} field.value encoded as author-style value
     */
    enc_creators(f, raw) {
        if (f.value.length === 0)
            return null;
        const encoded = [];
        for (const creator of f.value) {
            let name;
            if (creator.name || (creator.lastName && (creator.fieldMode === 1))) {
                name = creator.name || creator.lastName;
                if (name !== 'others')
                    name = raw ? `{${name}}` : this.enc_latex({ value: new String(this._enc_creators_scrub_name(name)) }); // tslint:disable-line:no-construct
            }
            else if (raw) {
                name = [creator.lastName || '', creator.firstName || ''].join(', ');
            }
            else if (creator.lastName || creator.firstName) {
                name = {
                    family: this._enc_creators_scrub_name(creator.lastName || ''),
                    given: this._enc_creators_scrub_name(creator.firstName || ''),
                };
                if (Translator.preferences.parseParticles)
                    Zotero.BetterBibTeX.parseParticles(name);
                if (!Translator.BetterBibLaTeX || !Translator.preferences.biblatexExtendedNameFormat) {
                    // side effects to set use-prefix/uniorcomma -- make sure addCreators is called *before* adding 'options'
                    if (!this.useprefix)
                        this.useprefix = !!name['non-dropping-particle'];
                    if (!this.juniorcomma)
                        this.juniorcomma = (f.juniorcomma && name['comma-suffix']);
                }
                if (Translator.BetterBibTeX) {
                    name = this._enc_creators_bibtex(name);
                }
                else {
                    name = this._enc_creators_biblatex(name);
                }
                name = name.replace(/ and /g, ' {and} ');
            }
            else {
                continue;
            }
            encoded.push(name.trim());
        }
        return encoded.join(' and ');
    }
    /*
     * Encode text to LaTeX literal list (double-braced)
     *
     * This encoding supports simple HTML markup.
     *
     * @param {field} field to encode.
     * @return {String} field.value encoded as author-style value
     */
    enc_literal(f) {
        if (!f.value)
            return null;
        return this.enc_latex({ value: Translator.preferences.suppressBraceProtection ? f.value : new String(f.value) }); // tslint:disable-line:no-construct
    }
    /*
     * Encode text to LaTeX
     *
     * This encoding supports simple HTML markup.
     *
     * @param {field} field to encode.
     * @return {String} field.value encoded as author-style value
     */
    enc_latex(f, raw = false) {
        if (typeof f.value === 'number')
            return f.value;
        if (!f.value)
            return null;
        if (Array.isArray(f.value)) {
            if (f.value.length === 0)
                return null;
            return f.value.map(elt => this.enc_latex(Object.assign({}, f, { bibtex: undefined, value: elt }), raw)).join(f.sep || '');
        }
        if (f.raw || raw)
            return f.value;
        const caseConversion = !Translator.preferences.suppressTitleCase && (this.caseConversion[f.name] || f.caseConversion);
        const latex = unicode_translator_1.text2latex(f.value, { html: f.html, caseConversion: caseConversion && this.english });
        let value = latex.latex;
        if (caseConversion && Translator.BetterBibTeX && !this.english)
            value = `{${value}}`;
        if (f.value instanceof String && !latex.raw)
            value = new String(`{${value}}`); // tslint:disable-line:no-construct
        return value;
    }
    enc_tags(f) {
        let tags = f.value.filter(tag => tag !== Translator.preferences.rawLaTag);
        if (tags.length === 0)
            return null;
        // sort tags for stable tests
        if (Translator.preferences.testing || Translator.preferences.sorted)
            tags.sort((a, b) => Translator.stringCompare(a, b));
        tags = tags.map(tag => {
            if (Translator.BetterBibTeX) {
                tag = tag.replace(/([#\\%&])/g, '\\$1');
            }
            else {
                tag = tag.replace(/([#%\\])/g, '\\$1');
            }
            // the , -> ; is unfortunate, but I see no other way
            tag = tag.replace(/,/g, ';');
            // verbatim fields require balanced braces -- please just don't use braces in your tags
            let balanced = 0;
            for (const ch of tag) {
                switch (ch) {
                    case '{':
                        balanced += 1;
                        break;
                    case '}':
                        balanced -= 1;
                        break;
                }
                if (balanced < 0)
                    break;
            }
            if (balanced !== 0)
                tag = tag.replace(/{/g, '(').replace(/}/g, ')');
            return tag;
        });
        return tags.join(',');
    }
    enc_attachments(f) {
        if (!f.value || (f.value.length === 0))
            return null;
        const attachments = [];
        const errors = [];
        for (const attachment of f.value) {
            const att = {
                title: attachment.title,
                mimetype: attachment.contentType || '',
                path: '',
            };
            if (Translator.options.exportFileData) {
                att.path = attachment.saveFile ? attachment.defaultPath : '';
            }
            else if (attachment.localPath) {
                att.path = attachment.localPath;
            }
            if (!att.path)
                continue; // amazon/googlebooks etc links show up as atachments without a path
            // att.path = att.path.replace(/^storage:/, '')
            att.path = att.path.replace(/(?:\s*[{}]+)+\s*/g, ' ');
            debug_1.debug('attachment::', Translator.options, att);
            if (Translator.options.exportFileData) {
                debug_1.debug('saving attachment::', Translator.options, att);
                attachment.saveFile(att.path, true);
            }
            if (!att.title)
                att.title = att.path.replace(/.*[\\\/]/, '') || 'attachment';
            if (!att.mimetype && (att.path.slice(-4).toLowerCase() === '.pdf'))
                att.mimetype = 'application/pdf'; // tslint:disable-line:no-magic-numbers
            if (Translator.preferences.testing) {
                att.path = `files/${this.item.citekey}/${att.path.replace(/.*[\/\\]/, '')}`;
            }
            else if (Translator.preferences.relativeFilePaths && Translator.options.exportPath && att.path.startsWith(Translator.options.exportPath)) {
                this.cachable = false;
                att.path = att.path.slice(Translator.options.exportPath.length);
                debug_1.debug('clipped attachment::', Translator.options, att);
            }
            attachments.push(att);
        }
        if (errors.length !== 0)
            f.errors = errors;
        if (attachments.length === 0)
            return null;
        // sort attachments for stable tests, and to make non-snapshots the default for JabRef to open (#355)
        attachments.sort((a, b) => {
            if ((a.mimetype === 'text/html') && (b.mimetype !== 'text/html'))
                return 1;
            if ((b.mimetype === 'text/html') && (a.mimetype !== 'text/html'))
                return -1;
            return Translator.stringCompare(a.path, b.path);
        });
        if (Translator.preferences.jabrefFormat)
            return attachments.map(att => [att.title, att.path, att.mimetype].map(part => part.replace(/([\\{}:;])/g, '\\$1')).join(':')).join(';');
        return attachments.map(att => att.path.replace(/([\\{};])/g, '\\$1')).join(';');
    }
    _enc_creators_pad_particle(particle, relax = false) {
        // space at end is always OK
        if (particle[particle.length - 1] === ' ')
            return particle;
        if (Translator.BetterBibLaTeX) {
            if (Zotero.Utilities.XRegExp.test(particle, this.punctuationAtEnd))
                this.metadata.DeclarePrefChars += particle[particle.length - 1];
            // if BBLT, always add a space if it isn't there
            return particle + ' ';
        }
        // otherwise, we're in BBT.
        // If the particle ends in a period, add a space
        if (particle[particle.length - 1] === '.')
            return particle + ' ';
        // if it ends in any other punctuation, it's probably something like d'Medici -- no space
        if (Zotero.Utilities.XRegExp.test(particle, this.punctuationAtEnd)) {
            if (relax)
                return `${particle}${this._enc_creators_relax_marker} `;
            return particle;
        }
        // otherwise, add a space
        return particle + ' ';
    }
    _enc_creators_biblatex(name) {
        let family, latex;
        if ((name.family.length > 1) && (name.family[0] === '"') && (name.family[name.family.length - 1] === '"')) {
            family = new String(name.family.slice(1, -1)); // tslint:disable-line:no-construct
        }
        else {
            ({ family } = name);
        }
        let initials = (name.given || '').indexOf(this._enc_creators_initials_marker); // end of guarded area
        if (Translator.preferences.biblatexExtendedNameFormat && (name['dropping-particle'] || name['non-dropping-particle'] || name['comma-suffix'])) {
            if (initials >= 0) {
                initials = name.given.substring(0, initials);
                if (initials.length > 1)
                    initials = new String(initials); // tslint:disable-line:no-construct
                name.given = name.given.replace(this._enc_creators_initials_marker, '');
            }
            else {
                initials = '';
            }
            latex = [];
            if (family)
                latex.push(`family=${this.enc_latex({ value: family })}`);
            if (name.given)
                latex.push(`given=${this.enc_latex({ value: name.given })}`);
            if (initials)
                latex.push(`given-i=${this.enc_latex({ value: initials })}`);
            if (name.suffix)
                latex.push(`suffix=${this.enc_latex({ value: name.suffix })}`);
            if (name['dropping-particle'] || name['non-dropping-particle']) {
                latex.push(`prefix=${this.enc_latex({ value: name['dropping-particle'] || name['non-dropping-particle'] })}`);
                latex.push(`useprefix=${!!name['non-dropping-particle']}`);
            }
            if (name['comma-suffix'])
                latex.push('juniorcomma=true');
            return latex.join(', ');
        }
        if (family && Zotero.Utilities.XRegExp.test(family, this.startsWithLowercase))
            family = new String(family); // tslint:disable-line:no-construct
        if (family)
            family = this.enc_latex({ value: family });
        if (initials >= 0)
            name.given = `<span relax="true">${name.given.replace(this._enc_creators_initials_marker, '</span>')}`;
        latex = '';
        if (name['dropping-particle'])
            latex += this.enc_latex({ value: this._enc_creators_pad_particle(name['dropping-particle']) });
        if (name['non-dropping-particle'])
            latex += this.enc_latex({ value: this._enc_creators_pad_particle(name['non-dropping-particle']) });
        if (family)
            latex += family;
        if (name.suffix)
            latex += `, ${this.enc_latex({ value: name.suffix })}`;
        if (name.given)
            latex += `, ${this.enc_latex({ value: name.given })}`;
        return latex;
    }
    _enc_creators_bibtex(name) {
        let family;
        if ((name.family.length > 1) && (name.family[0] === '"') && (name.family[name.family.length - 1] === '"')) { // quoted
            family = new String(name.family.slice(1, -1)); // tslint:disable-line:no-construct
        }
        else {
            family = name.family;
        }
        if (name.given && (name.given.indexOf(this._enc_creators_initials_marker) >= 0)) {
            name.given = `<span relax="true">${name.given.replace(this._enc_creators_initials_marker, '</span>')}`;
        }
        /*
          TODO: http://chat.stackexchange.com/rooms/34705/discussion-between-retorquere-and-egreg
    
          My advice is never using the alpha style; it's a relic of the past, when numbering citations was very difficult
          because one didn't know the full citation list when writing a paper. In order to have the bibliography in
          alphabetical order, such tricks were devised. The alternative was listing the citation in order of appearance.
          Your document gains nothing with something like XYZ88 as citation key.
    
          The “van” problem should be left to the bibliographic style. Some styles consider “van” as part of the name, some
          don't. In any case, you'll have a kludge, mostly unportable. However, if you want van Gogh to be realized as vGo
          in the label, use {\relax van} Gogh or something like this.
        */
        if (name['non-dropping-particle'])
            family = new String(this._enc_creators_pad_particle(name['non-dropping-particle']) + family); // tslint:disable-line:no-construct
        if (Zotero.Utilities.XRegExp.test(family, this.startsWithLowercase) || Zotero.Utilities.XRegExp.test(family, this.hasLowercaseWord))
            family = new String(family); // tslint:disable-line:no-construct
        // https://github.com/retorquere/zotero-better-bibtex/issues/978 -- enc_latex can return null
        family = this.enc_latex({ value: family }) || '';
        // https://github.com/retorquere/zotero-better-bibtex/issues/976#issuecomment-393442419
        if (family[0] !== '{' && name.family.match(/[-\u2014\u2015\u2012\u2013]/))
            family = `{${family}}`;
        if (name['dropping-particle'])
            family = this.enc_latex({ value: this._enc_creators_pad_particle(name['dropping-particle'], true) }) + family;
        if (Translator.BetterBibTeX && Translator.preferences.bibtexParticleNoOp && (name['non-dropping-particle'] || name['dropping-particle'])) {
            family = `{\\noopsort{${this.enc_latex({ value: name.family.toLowerCase() })}}}${family}`;
            this.metadata.noopsort = exporter_1.Exporter.preamble.noopsort = true;
        }
        if (name.given)
            name.given = this.enc_latex({ value: name.given });
        if (name.suffix)
            name.suffix = this.enc_latex({ value: name.suffix });
        let latex = family;
        if (name.suffix)
            latex += `, ${name.suffix}`;
        if (name.given)
            latex += `, ${name.given}`;
        return latex;
    }
    postscript(reference, item) { } // tslint:disable-line:no-empty
    toVerbatim(text) {
        text = text || '';
        let value;
        if (Translator.BetterBibTeX) {
            value = text.replace(/([#\\%&{}])/g, '\\$1');
        }
        else {
            value = text.replace(/([\\{}])/g, '\\$1');
        }
        if (!Translator.unicode)
            value = value.replace(/[^\x20-\x7E]/g, (chr => `\\%${`00${chr.charCodeAt(0).toString(16).slice(-2)}`}`)); // tslint:disable-line:no-magic-numbers
        return value;
    }
    qualityReport() {
        if (!Translator.preferences.qualityReport)
            return '';
        let report = this.lint({
            timestamp: `added because JabRef format is set to ${Translator.preferences.jabrefFormat || '?'}`,
        });
        if (report) {
            if (this.has.pages) {
                const dashes = this.has.pages.bibtex.match(/-+/g);
                // if (dashes && dashes.includes('-')) report.push('? hyphen found in pages field, did you mean to use an en-dash?')
                if (dashes && dashes.includes('---'))
                    report.push('? em-dash found in pages field, did you mean to use an en-dash?');
            }
            if (this.has.journal && this.has.journal.value.indexOf('.') >= 0)
                report.push(`? Possibly abbreviated journal title ${this.has.journal.value}`);
            if (this.has.journaltitle && this.has.journaltitle.value.indexOf('.') >= 0)
                report.push(`? Possibly abbreviated journal title ${this.has.journaltitle.value}`);
            if (this.referencetype === 'inproceedings' && this.has.booktitle) {
                if (!this.has.booktitle.value.match(/:|Proceedings|Companion| '/) || this.has.booktitle.value.match(/\.|workshop|conference|symposium/)) {
                    report.push('? Unsure about the formatting of the booktitle');
                }
            }
            if (this.has.title && !Translator.preferences.suppressTitleCase) {
                const titleCased = Zotero.BetterBibTeX.titleCase(this.has.title.value) === this.has.title.value;
                if (this.has.title.value.match(/\s/)) {
                    if (titleCased)
                        report.push('? Title looks like it was stored in title-case in Zotero');
                }
                else {
                    if (!titleCased)
                        report.push('? Title looks like it was stored in lower-case in Zotero');
                }
            }
        }
        else {
            report = [`I don't know how to quality-check ${this.referencetype} references`];
        }
        if (!report.length)
            return '';
        report.unshift(`== ${Translator.BetterBibTeX ? 'BibTeX' : 'BibLateX'} quality report for ${this.item.citekey}:`);
        return report.map(line => `% ${line}\n`).join('');
    }
}
exports.Reference = Reference;
//  @polyglossia = [
//    'albanian'
//    'amharic'
//    'arabic'
//    'armenian'
//    'asturian'
//    'bahasai'
//    'bahasam'
//    'basque'
//    'bengali'
//    'brazilian'
//    'brazil'
//    'breton'
//    'bulgarian'
//    'catalan'
//    'coptic'
//    'croatian'
//    'czech'
//    'danish'
//    'divehi'
//    'dutch'
//    'english'
//    'british'
//    'ukenglish'
//    'esperanto'
//    'estonian'
//    'farsi'
//    'finnish'
//    'french'
//    'friulan'
//    'galician'
//    'german'
//    'austrian'
//    'naustrian'
//    'greek'
//    'hebrew'
//    'hindi'
//    'icelandic'
//    'interlingua'
//    'irish'
//    'italian'
//    'kannada'
//    'lao'
//    'latin'
//    'latvian'
//    'lithuanian'
//    'lsorbian'
//    'magyar'
//    'malayalam'
//    'marathi'
//    'nko'
//    'norsk'
//    'nynorsk'
//    'occitan'
//    'piedmontese'
//    'polish'
//    'portuges'
//    'romanian'
//    'romansh'
//    'russian'
//    'samin'
//    'sanskrit'
//    'scottish'
//    'serbian'
//    'slovak'
//    'slovenian'
//    'spanish'
//    'swedish'
//    'syriac'
//    'tamil'
//    'telugu'
//    'thai'
//    'tibetan'
//    'turkish'
//    'turkmen'
//    'ukrainian'
//    'urdu'
//    'usorbian'
//    'vietnamese'
//    'welsh'
//  ]
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/bibtex/reference.ts')
  ; } catch ($wrap_loader_catcher_translators_bibtex_reference_ts) { 
    var $wrap_loader_message_translators_bibtex_reference_ts = 'Error: zotero-better-bibtex: load of translators/bibtex/reference.ts failed:' + $wrap_loader_catcher_translators_bibtex_reference_ts + '::' + $wrap_loader_catcher_translators_bibtex_reference_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_bibtex_reference_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_bibtex_reference_ts)
    }
   };

/***/ }),

/***/ "./bibtex/unicode_translator.ts":
/*!**************************************!*\
  !*** ./bibtex/unicode_translator.ts ***!
  \**************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/bibtex/unicode_translator.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __webpack_require__(/*! ../lib/debug */ "./lib/debug.ts");
const HE = __webpack_require__(/*! he */ "../node_modules/he/he.js");
const unicodeMapping = __webpack_require__(/*! unicode2latex */ "../node_modules/unicode2latex/dist/index.js");
const htmlConverter = new class HTMLConverter {
    constructor() {
        this.embrace_tex = {
            '\\k{A}': true,
            '\\k{E}': true,
            '\\k{I}': true,
            '\\k{U}': true,
            '\\k{a}': true,
            '\\k{e}': true,
            '\\k{i}': true,
            '\\k{u}': true,
            '\\r{U}': true,
            '\\r{u}': true,
        };
    }
    convert(html, options) {
        this.embraced = false;
        this.options = options;
        this.latex = '';
        this.mapping = (Translator.unicode ? unicodeMapping.unicode : unicodeMapping.ascii);
        this.extramapping = {};
        for (const c of Array.from(Translator.preferences.ascii)) {
            this.extramapping[c] = unicodeMapping.ascii[c];
        }
        this.stack = [];
        const ast = Zotero.BetterBibTeX.parseHTML(html, this.options);
        this.walk(ast);
        return { latex: this.latex, raw: ast.nodeName === 'pre' };
    }
    walk(tag, nocased = false) {
        if (!tag)
            return;
        switch (tag.nodeName) {
            case '#text':
                this.chars(tag.value, nocased);
                return;
            case 'pre':
            case 'script':
                this.latex += tag.value;
                return;
        }
        this.stack.unshift(tag);
        let latex = '...'; // default to no-op
        switch (tag.nodeName) {
            case 'i':
            case 'em':
            case 'italic':
                latex = '\\emph{...}';
                break;
            case 'b':
            case 'strong':
                latex = '\\textbf{...}';
                break;
            case 'a':
                /* zotero://open-pdf/0_5P2KA4XM/7 is actually a reference. */
                if (tag.attr.href && tag.attr.href.length)
                    latex = `\\href{${tag.attr.href}}{...}`;
                break;
            case 'sup':
                latex = '\\textsuperscript{...}';
                break;
            case 'sub':
                latex = '\\textsubscript{...}';
                break;
            case 'br':
                latex = '';
                /* line-breaks on empty line makes LaTeX sad */
                if (this.latex !== '' && this.latex[this.latex.length - 1] !== '\n')
                    latex = '\\\\';
                latex += '\n...';
                break;
            case 'p':
            case 'div':
            case 'table':
            case 'tr':
                latex = '\n\n...\n\n';
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
                latex = `\n\n\\${'sub'.repeat(parseInt(tag.nodeName[1]) - 1)}section{...}\n\n`;
                break;
            case 'ol':
                latex = '\n\n\\begin{enumerate}\n...\n\n\\end{enumerate}\n';
                break;
            case 'ul':
                latex = '\n\n\\begin{itemize}\n...\n\n\\end{itemize}\n';
                break;
            case 'li':
                latex = '\n\\item ...';
                break;
            case 'span':
            case 'sc':
            case 'nc':
                break; // ignore, handled by the relax/nocase/smallcaps handler below
            case 'td':
            case 'th':
                latex = ' ... ';
                break;
            case '#document':
            case '#document-fragment':
            case 'tbody':
            case 'html':
            case 'head':
            case 'body':
                break; // ignore
            default:
                debug_1.debug(`unexpected tag '${tag.nodeName}' (${Object.keys(tag)})`);
        }
        if (latex !== '...')
            latex = this.embrace(latex, latex.match(/^\\[a-z]+{\.\.\.}$/));
        if (tag.smallcaps)
            latex = this.embrace(`\\textsc{${latex}}`, true);
        if (tag.nocase)
            latex = `{{${latex}}}`;
        if (tag.relax)
            latex = `{\\relax ${latex}}`;
        if (tag.enquote) {
            if (Translator.BetterBibTeX) {
                latex = `\\enquote{${latex}}`;
            }
            else {
                latex = `\\mkbibquote{${latex}}`;
            }
        }
        const [prefix, postfix] = latex.split('...');
        this.latex += prefix;
        for (const child of tag.childNodes) {
            this.walk(child, nocased || tag.nocase);
        }
        this.latex += postfix;
        this.stack.shift();
    }
    embrace(latex, condition) {
        /* holy mother of %^$#^%$@ the bib(la)tex case conversion rules are insane */
        /* https://github.com/retorquere/zotero-better-bibtex/issues/541 */
        /* https://github.com/plk/biblatex/issues/459 ... oy! */
        if (!this.embraced)
            this.embraced = this.options.caseConversion && (((this.latex || latex)[0] !== '\\') || Translator.BetterBibTeX);
        if (!this.embraced || !condition)
            return latex;
        return `{${latex}}`;
    }
    chars(text, nocased) {
        if (this.options.html)
            text = HE.decode(text, { isAttributeValue: true });
        let latex = '';
        let mode = 'text';
        let braced = 0;
        const switchTo = {
            math: (nocased ? '$' : '{$'),
            text: (nocased ? '$' : '$}'),
        };
        const switchMode = {
            math: 'text',
            text: 'math',
        };
        // const chars = Zotero.Utilities.XRegExp.split(text.normalize('NFC'), '')
        const chars = Array.from(text.normalize('NFC'));
        let ch, mapped;
        while (chars.length) {
            if (chars.length > 1 && (mapped = this.mapping[ch = (chars[0] + chars[1])] || this.extramapping[ch])) {
                chars.splice(0, 2);
            }
            else {
                mapped = this.mapping[chars[0]] || this.extramapping[chars[0]] || { text: chars[0] };
                ch = chars.shift();
            }
            // in and out of math mode
            if (!mapped[mode]) {
                mode = switchMode[mode];
                latex += switchTo[mode];
            }
            // balance out braces with invisible braces until http://tex.stackexchange.com/questions/230750/open-brace-in-bibtex-fields/230754#comment545453_230754 is widely deployed
            switch (ch) {
                case '{':
                    braced += 1;
                    break;
                case '}':
                    braced -= 1;
                    break;
            }
            if (braced < 0) {
                latex += '\\vphantom\\{';
                braced = 0;
            }
            latex += this.embrace(mapped[mode], this.embrace_tex[mapped[mode]]);
        }
        // add any missing closing phantom braces
        switch (braced) {
            case 0:
                break;
            case 1:
                latex += '\\vphantom\\}';
                break;
            default:
                latex += `\\vphantom{${'\\}'.repeat(braced)}}`;
                break;
        }
        // might still be in math mode at the end
        if (mode === 'math')
            latex += switchTo.text;
        this.latex += latex;
    }
};
function html2latex(html, options) {
    if (typeof options.html === 'undefined')
        options.html = true;
    const latex = htmlConverter.convert(html, options);
    latex.latex = latex.latex
        // .replace(/(\\\\)+[^\S\n]*\n\n/g, '\n\n') // I don't recall why I had the middle match, replaced by match below until I figure it out
        .replace(/(\\\\)+\n\n/g, '\n\n') // paragraph breaks followed by line breaks == line breaks
        .replace(/\n\n\n+/g, '\n\n'); // line breaks > 3 is the same as two line breaks.
    // .replace(/{}([}])/g, '$1') // seems to have become obsolete
    return latex;
}
exports.html2latex = html2latex;
function text2latex(text, options = {}) {
    if (typeof options.html === 'undefined')
        options.html = false;
    return html2latex(text, options);
}
exports.text2latex = text2latex;
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/bibtex/unicode_translator.ts')
  ; } catch ($wrap_loader_catcher_translators_bibtex_unicode_translator_ts) { 
    var $wrap_loader_message_translators_bibtex_unicode_translator_ts = 'Error: zotero-better-bibtex: load of translators/bibtex/unicode_translator.ts failed:' + $wrap_loader_catcher_translators_bibtex_unicode_translator_ts + '::' + $wrap_loader_catcher_translators_bibtex_unicode_translator_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_bibtex_unicode_translator_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_bibtex_unicode_translator_ts)
    }
   };

/***/ }),

/***/ "./lib/debug.ts":
/*!**********************!*\
  !*** ./lib/debug.ts ***!
  \**********************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {


    Zotero.debug('zotero-better-bibtex: loading translators/lib/debug.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { format } from '../../content/debug-formatter'
function debug(...msg) {
    // if (!Translator.debugEnabled && !Translator.preferences.testing) return
    // Zotero.debug(format(`better-bibtex:${Translator.header.label}`, msg))
    Zotero.BetterBibTeX.debug(Translator.header.label, ...msg);
}
exports.debug = debug;
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/lib/debug.ts')
  ; } catch ($wrap_loader_catcher_translators_lib_debug_ts) { 
    var $wrap_loader_message_translators_lib_debug_ts = 'Error: zotero-better-bibtex: load of translators/lib/debug.ts failed:' + $wrap_loader_catcher_translators_lib_debug_ts + '::' + $wrap_loader_catcher_translators_lib_debug_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_lib_debug_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_lib_debug_ts)
    }
   };

/***/ }),

/***/ "./lib/exporter.ts":
/*!*************************!*\
  !*** ./lib/exporter.ts ***!
  \*************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/lib/exporter.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jabref_1 = __webpack_require__(/*! ../bibtex/jabref */ "./bibtex/jabref.ts"); // not so nice... BibTeX-specific code
const debug_1 = __webpack_require__(/*! ../lib/debug */ "./lib/debug.ts");
const itemfields = __webpack_require__(/*! ../../gen/itemfields */ "../gen/itemfields.ts");
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.Exporter = new class {
    constructor() {
        this.preamble = { DeclarePrefChars: '' };
        this.jabref = new jabref_1.JabRef();
    }
    unique_chars(str) {
        let uniq = '';
        for (const c of str) {
            if (uniq.indexOf(c) < 0)
                uniq += c;
        }
        return uniq;
    }
    nextItem() {
        let item;
        while (item = Zotero.nextItem()) {
            if (['note', 'attachment'].includes(item.itemType))
                continue;
            if (!item.citekey) {
                debug_1.debug(new Error('No citation key found in'), item);
                throw new Error(`No citation key in ${JSON.stringify(item)}`);
            }
            this.jabref.citekeys.set(item.itemID, item.citekey);
            // this is not automatically lazy-evaluated?!?!
            const cached = Translator.caching ? Zotero.BetterBibTeX.cacheFetch(item.itemID, Translator.options, Translator.preferences) : null;
            if (cached) {
                debug_1.debug('cache hit for', item.itemID);
                if (Translator.preferences.sorted && (Translator.BetterBibTeX || Translator.BetterBibLaTeX)) {
                    Translator.references.push({ citekey: item.citekey, reference: cached.reference });
                }
                else {
                    Zotero.write(cached.reference);
                }
                if (cached.metadata) {
                    if (cached.metadata.DeclarePrefChars)
                        this.preamble.DeclarePrefChars += cached.metadata.DeclarePrefChars;
                    if (cached.metadata.noopsort)
                        this.preamble.noopsort = true;
                }
                continue;
            }
            debug_1.debug('cache miss for', item.itemID);
            itemfields.simplifyForExport(item);
            Object.assign(item, Zotero.BetterBibTeX.extractFields(item));
            debug_1.debug('exporting', item);
            return item;
        }
        return null;
    }
    // TODO: move to bibtex-exporters
    complete() {
        debug_1.debug('sorted:', { prefs: Translator.preferences, bbt: Translator.BetterBibTeX, bbl: Translator.BetterBibLaTeX });
        if (Translator.preferences.sorted && (Translator.BetterBibTeX || Translator.BetterBibLaTeX)) {
            Translator.references.sort((a, b) => Translator.stringCompare(a.citekey, b.citekey));
            Zotero.write(Translator.references.map(ref => ref.reference).join(''));
        }
        debug_1.debug('Exporter.complete: write JabRef groups');
        this.jabref.exportGroups();
        let preamble = [];
        if (this.preamble.DeclarePrefChars)
            preamble.push("\\ifdefined\\DeclarePrefChars\\DeclarePrefChars{'’-}\\else\\fi");
        if (this.preamble.noopsort)
            preamble.push('\\newcommand{\\noopsort}[1]{}');
        if (preamble.length > 0) {
            preamble = preamble.map(cmd => `"${cmd} "`);
            Zotero.write(`@preamble{ ${preamble.join(' \n # ')} }\n`);
        }
    }
};
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/lib/exporter.ts')
  ; } catch ($wrap_loader_catcher_translators_lib_exporter_ts) { 
    var $wrap_loader_message_translators_lib_exporter_ts = 'Error: zotero-better-bibtex: load of translators/lib/exporter.ts failed:' + $wrap_loader_catcher_translators_lib_exporter_ts + '::' + $wrap_loader_catcher_translators_lib_exporter_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_lib_exporter_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_lib_exporter_ts)
    }
   };

/***/ })

/******/ });
