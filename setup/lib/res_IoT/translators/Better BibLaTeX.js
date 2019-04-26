{
	"translatorID": "f895aa0d-f28e-47fe-b247-2ea77c6ed583",
	"translatorType": 2,
	"label": "Better BibLaTeX",
	"creator": "Simon Kornblith, Richard Karnesky, Anders Johansson and Emiliano Heyns",
	"target": "bib",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"priority": 50,
	"inRepository": false,
	"configOptions": {
		"getCollections": true,
		"hash": "fb64e2eac4aec255d9aa88e13f127c2e-6f140157e9a2b4c68976c9a07ae1f25c"
	},
	"displayOptions": {
		"exportNotes": false,
		"exportFileData": false,
		"useJournalAbbreviation": false,
		"keepUpdated": false
	},
	"lastUpdated": "2019-04-17 16:17:14"
}

var Translator = {
  initialize: function () {},
  BetterBibLaTeX: true,
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
  Zotero.debug("Better BibLaTeX" + ' export took ' + (Date.now() - start))
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./Better BibLaTeX.ts");
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

/***/ "./Better BibLaTeX.ts":
/*!****************************!*\
  !*** ./Better BibLaTeX.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {


    Zotero.debug('zotero-better-bibtex: loading translators/Better BibLaTeX.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reference_1 = __webpack_require__(/*! ./bibtex/reference */ "./bibtex/reference.ts");
const exporter_1 = __webpack_require__(/*! ./lib/exporter */ "./lib/exporter.ts");
const debug_1 = __webpack_require__(/*! ./lib/debug */ "./lib/debug.ts");
reference_1.Reference.prototype.fieldEncoding = {
    url: 'url',
    doi: 'verbatim',
    eprint: 'verbatim',
    eprintclass: 'verbatim',
    crossref: 'raw',
    xdata: 'raw',
    xref: 'raw',
    entrykey: 'raw',
    childentrykey: 'raw',
    verba: 'verbatim',
    verbb: 'verbatim',
    verbc: 'verbatim',
    institution: 'literal',
    publisher: 'literal',
    organization: 'literal',
    location: 'literal',
};
reference_1.Reference.prototype.caseConversion = {
    title: true,
    series: true,
    shorttitle: true,
    origtitle: true,
    booktitle: true,
    maintitle: true,
    eventtitle: true,
};
reference_1.Reference.prototype.lint = __webpack_require__(/*! ./bibtex/biblatex.qr.bcf */ "./bibtex/biblatex.qr.bcf");
reference_1.Reference.prototype.addCreators = function () {
    debug_1.debug('addCreators:', this.item.creators);
    if (!this.item.creators || !this.item.creators.length)
        return;
    const creators = {
        author: [],
        bookauthor: [],
        commentator: [],
        editor: [],
        editora: [],
        editorb: [],
        holder: [],
        translator: [],
        scriptwriter: [],
        director: [],
    };
    for (const creator of this.item.creators) {
        let kind;
        switch (creator.creatorType) {
            case 'director':
                // 365.something
                if (['video', 'movie'].includes(this.referencetype)) {
                    kind = 'director';
                }
                else {
                    kind = 'author';
                }
                break;
            case 'author':
            case 'inventor':
            case 'interviewer':
            case 'programmer':
            case 'artist':
            case 'podcaster':
            case 'presenter':
                kind = 'author';
                break;
            case 'bookAuthor':
                kind = 'bookauthor';
                break;
            case 'commenter':
                kind = 'commentator';
                break;
            case 'editor':
                kind = 'editor';
                break;
            case 'assignee':
                kind = 'holder';
                break;
            case 'translator':
                kind = 'translator';
                break;
            case 'seriesEditor':
                kind = 'editorb';
                break;
            case 'scriptwriter':
                // 365.something
                if (['video', 'movie'].includes(this.referencetype)) {
                    kind = 'scriptwriter';
                }
                else {
                    kind = 'editora';
                }
                break;
            default:
                kind = 'editora';
        }
        creators[kind].push(creator);
    }
    debug_1.debug('addCreators:', creators);
    for (const [field, value] of Object.entries(creators)) {
        this.remove(field);
        this.add({ name: field, value, enc: 'creators' });
    }
    this.remove('editoratype');
    if (creators.editora.length > 0)
        this.add({ name: 'editoratype', value: 'collaborator' });
    this.remove('editorbtype');
    if (creators.editorb.length > 0)
        this.add({ name: 'editorbtype', value: 'redactor' });
};
reference_1.Reference.prototype.typeMap = {
    csl: {
        article: 'article',
        'article-journal': 'article',
        'article-magazine': { type: 'article', subtype: 'magazine' },
        'article-newspaper': { type: 'article', subtype: 'newspaper' },
        bill: 'legislation',
        book: 'book',
        broadcast: { type: 'misc', subtype: 'broadcast' },
        chapter: 'incollection',
        dataset: 'data',
        entry: 'inreference',
        'entry-dictionary': 'inreference',
        'entry-encyclopedia': 'inreference',
        figure: 'image',
        graphic: 'image',
        interview: { type: 'misc', subtype: 'interview' },
        legal_case: 'jurisdiction',
        legislation: 'legislation',
        manuscript: 'unpublished',
        map: { type: 'misc', subtype: 'map' },
        motion_picture: 'movie',
        musical_score: 'audio',
        pamphlet: 'booklet',
        'paper-conference': 'inproceedings',
        patent: 'patent',
        personal_communication: 'letter',
        post: 'online',
        'post-weblog': 'online',
        report: 'report',
        review: 'review',
        'review-book': 'review',
        song: 'music',
        speech: { type: 'misc', subtype: 'speech' },
        thesis: 'thesis',
        treaty: 'legal',
        webpage: 'online',
    },
    zotero: {
        artwork: 'artwork',
        audioRecording: 'audio',
        bill: 'legislation',
        blogPost: 'online',
        book: 'book',
        bookSection: 'incollection',
        case: 'jurisdiction',
        computerProgram: 'software',
        conferencePaper: 'inproceedings',
        dictionaryEntry: 'inreference',
        document: 'misc',
        email: 'letter',
        encyclopediaArticle: 'inreference',
        film: 'movie',
        forumPost: 'online',
        hearing: 'jurisdiction',
        instantMessage: 'misc',
        interview: 'misc',
        journalArticle: 'article',
        letter: 'letter',
        magazineArticle: { type: 'article', subtype: 'magazine' },
        manuscript: 'unpublished',
        map: 'misc',
        newspaperArticle: { type: 'article', subtype: 'newspaper' },
        patent: 'patent',
        podcast: 'audio',
        presentation: 'unpublished',
        radioBroadcast: 'audio',
        report: 'report',
        statute: 'legislation',
        thesis: 'thesis',
        tvBroadcast: 'video',
        videoRecording: 'video',
        webpage: 'online',
    },
};
Translator.initialize = () => {
    reference_1.Reference.installPostscript();
    Translator.unicode = !Translator.preferences.asciiBibLaTeX;
};
function looks_like_number(n) {
    if (n.match(/^(?=[MDCLXVI])M*(C[MD]|D?C*)(X[CL]|L?X*)(I[XV]|V?I*)$/))
        return 'roman';
    if (n.match(/^[A-Z]?[0-9]+(\.[0-9]+)?$/i))
        return 'arabic';
    if (n.match(/^[A-Z]$/i))
        return 'arabic';
    return false;
}
function looks_like_number_field(n) {
    if (!n)
        return false;
    n = n.split(/-+|–|,|\//).map(_n => _n.trim());
    switch (n.length) {
        case 1:
            return looks_like_number(n[0]);
        case 2:
            return looks_like_number(n[0]) && (looks_like_number(n[0]) === looks_like_number(n[1]));
        default:
            return false;
    }
}
const patent = new class {
    constructor() {
        this.countries = ['de', 'eu', 'fr', 'uk', 'us'];
        this.prefix = { us: 'us', ep: 'eu', gb: 'uk', de: 'de', fr: 'fr' };
    }
    region(item) {
        if (item.itemType !== 'patent')
            return '';
        if (item.country) {
            const country = item.country.toLowerCase();
            if (this.countries.includes(country))
                return country;
        }
        if (item.number) {
            const country = item.number.substr(0, 2).toLowerCase();
            if (this.prefix[country])
                return this.prefix[country];
        }
        return '';
    }
    number(item) {
        if (item.itemType !== 'patent' || !item.number)
            return '';
        const country = item.number.substr(0, 2).toLowerCase();
        if (this.prefix[country])
            return item.number.substr(country.length);
        return item.number;
    }
};
Translator.doExport = () => {
    // Zotero.write(`\n% ${Translator.header.label}\n`)
    Zotero.write('\n');
    let item;
    while (item = exporter_1.Exporter.nextItem()) {
        const ref = new reference_1.Reference(item);
        if (['bookSection', 'chapter'].includes(item.referenceType) && ref.hasCreator('bookAuthor'))
            ref.referencetype = 'inbook';
        if (item.referenceType === 'book' && !ref.hasCreator('author') && ref.hasCreator('editor'))
            ref.referencetype = 'collection';
        if (ref.referencetype === 'book' && item.numberOfVolumes)
            ref.referencetype = 'mvbook';
        let m;
        if (item.url && (m = item.url.match(/^http:\/\/www.jstor.org\/stable\/([\S]+)$/i))) {
            ref.override({ name: 'eprinttype', value: 'jstor' });
            ref.override({ name: 'eprint', value: m[1] });
            ref.remove('archivePrefix');
            ref.remove('primaryClass');
            delete item.url;
            ref.remove('url');
        }
        if (item.url && (m = item.url.match(/^http:\/\/books.google.com\/books?id=([\S]+)$/i))) {
            ref.override({ name: 'eprinttype', value: 'googlebooks' });
            ref.override({ name: 'eprint', value: m[1] });
            ref.remove('archivePrefix');
            ref.remove('primaryClass');
            delete item.url;
            ref.remove('url');
        }
        if (item.url && (m = item.url.match(/^http:\/\/www.ncbi.nlm.nih.gov\/pubmed\/([\S]+)$/i))) {
            ref.override({ name: 'eprinttype', value: 'pubmed' });
            ref.override({ name: 'eprint', value: m[1] });
            ref.remove('archivePrefix');
            ref.remove('primaryClass');
            delete item.url;
            ref.remove('url');
        }
        ref.add({ name: 'langid', value: ref.language });
        switch (item.referenceType) {
            case 'presentation':
                ref.add({ name: 'venue', value: item.place, enc: 'literal' });
                break;
            case 'patent':
                if (item.country && !patent.region(item))
                    ref.add({ name: 'location', value: item.country });
                break;
            default:
                ref.add({ name: 'location', value: item.place, enc: 'literal' });
                break;
        }
        /*
        if (ref.referencetype === 'inbook') {
          ref.add({ name: 'chapter', value: item.title })
        } else {
          ref.add({ name: 'title', value: item.title })
        }
        */
        ref.add({ name: 'title', value: item.title });
        ref.add({ name: 'edition', value: item.edition });
        ref.add({ name: 'volume', value: item.volume });
        // ref.add({ name: 'rights', value: item.rights })
        ref.add({ name: 'isbn', value: item.ISBN });
        ref.add({ name: 'issn', value: item.ISSN });
        ref.add({ name: 'url', value: item.url });
        ref.add({ name: 'doi', value: item.DOI });
        ref.add({ name: 'shorttitle', value: item.shortTitle });
        ref.add({ name: 'abstract', value: item.abstractNote });
        ref.add({ name: 'volumes', value: item.numberOfVolumes });
        ref.add({ name: 'version', value: item.versionNumber });
        ref.add({ name: 'eventtitle', value: item.conferenceName });
        ref.add({ name: 'pagetotal', value: item.numPages });
        ref.add({ name: 'number', value: patent.number(item) || item.number || item.seriesNumber });
        ref.add({ name: looks_like_number_field(item.issue) ? 'number' : 'issue', value: item.issue });
        switch (item.referenceType) {
            case 'case':
            case 'gazette':
            case 'legal_case':
                ref.add({ name: 'journaltitle', value: item.reporter, preserveBibTeXVariables: true });
                break;
            case 'statute':
            case 'bill':
            case 'legislation':
                ref.add({ name: 'journaltitle', value: item.code, preserveBibTeXVariables: true });
                break;
        }
        if (item.publicationTitle) {
            switch (item.referenceType) {
                case 'bookSection':
                case 'conferencePaper':
                case 'dictionaryEntry':
                case 'encyclopediaArticle':
                case 'chapter':
                case 'chapter':
                    ref.add({ name: 'booktitle', value: item.publicationTitle, preserveBibTeXVariables: true });
                    break;
                case 'magazineArticle':
                case 'newspaperArticle':
                case 'article-magazine':
                case 'article-newspaper':
                    ref.add({ name: 'journaltitle', value: item.publicationTitle, preserveBibTeXVariables: true });
                    if (['newspaperArticle', 'article-newspaper'].includes(item.referenceType))
                        ref.add({ name: 'journalsubtitle', value: item.section });
                    break;
                case 'journalArticle':
                case 'article':
                case 'article-journal':
                    if (ref.isBibVar(item.publicationTitle)) {
                        ref.add({ name: 'journaltitle', value: item.publicationTitle, preserveBibTeXVariables: true });
                    }
                    else {
                        if (Translator.options.useJournalAbbreviation && item.journalAbbreviation) {
                            ref.add({ name: 'journaltitle', value: item.journalAbbreviation, preserveBibTeXVariables: true });
                        }
                        else {
                            ref.add({ name: 'journaltitle', value: item.publicationTitle, preserveBibTeXVariables: true });
                            ref.add({ name: 'shortjournal', value: item.journalAbbreviation, preserveBibTeXVariables: true });
                        }
                    }
                    break;
                default:
                    if (!ref.has.journaltitle && (item.publicationTitle !== item.title))
                        ref.add({ name: 'journaltitle', value: item.publicationTitle });
            }
        }
        switch (item.referenceType) {
            case 'bookSection':
            case 'encyclopediaArticle':
            case 'dictionaryEntry':
            case 'conferencePaper':
            case 'film':
            case 'videoRecording':
            case 'tvBroadcast':
                if (!ref.has.booktitle)
                    ref.add({ name: 'booktitle', value: item.publicationTitle });
                break;
        }
        let main;
        if (((item.multi || {})._keys || {}).title && (main = (item.multi.main || {}).title || item.language)) {
            const languages = Object.keys(item.multi._keys.title).filter(lang => lang !== main);
            main += '-';
            languages.sort((a, b) => {
                if (a === b)
                    return 0;
                if (a.indexOf(main) === 0 && b.indexOf(main) !== 0)
                    return -1;
                if (a.indexOf(main) !== 0 && b.indexOf(main) === 0)
                    return 1;
                if (a < b)
                    return -1;
                return 1;
            });
            for (let i = 0; i < languages.length; i++) {
                ref.add({
                    name: i === 0 ? 'titleaddon' : `user${String.fromCharCode('d'.charCodeAt(0) + i)}`,
                    value: item.multi._keys.title[languages[i]],
                });
            }
        }
        ref.add({ name: 'series', value: item.seriesTitle || item.series });
        switch (item.referenceType) {
            case 'report':
            case 'thesis':
                ref.add({ name: 'institution', value: item.publisher });
                break;
            case 'case':
            case 'hearing':
            case 'legal_case':
                ref.add({ name: 'institution', value: item.court });
                break;
            case 'computerProgram':
                ref.add({ name: 'organization', value: item.publisher });
                break;
            default:
                ref.add({ name: 'publisher', value: item.publisher });
        }
        debug_1.debug('adding type:', { item_type: item.type || '', item_referenceType: item.referenceType, referencetype: this.referencetype });
        switch (item.referenceType) {
            case 'letter':
            case 'personal_communication':
                ref.add({ name: 'type', value: item.type || 'Letter' });
                break;
            case 'email':
                ref.add({ name: 'type', value: 'E-mail' });
                break;
            case 'thesis':
                const thesistype = item.type ? item.type.toLowerCase() : null;
                if (['phdthesis', 'mastersthesis'].includes(thesistype)) {
                    ref.referencetype = thesistype;
                }
                else {
                    ref.add({ name: 'type', value: item.type });
                }
                break;
            case 'report':
                if ((item.type || '').toLowerCase().trim() === 'techreport') {
                    ref.referencetype = 'techreport';
                }
                else {
                    ref.add({ name: 'type', value: item.type });
                }
                break;
            case 'patent':
                ref.add({ name: 'type', value: 'patent' + patent.region(item) });
                break;
            default:
                ref.add({ name: 'type', value: item.type });
        }
        if (item.referenceType === 'manuscript')
            ref.add({ name: 'howpublished', value: item.type });
        ref.add({ name: 'eventtitle', value: item.meetingName });
        if (item.accessDate && item.url)
            ref.add({ name: 'urldate', value: Zotero.Utilities.strToISO(item.accessDate), enc: 'date' });
        ref.add({
            name: 'date',
            verbatim: 'year',
            orig: { name: 'origdate', verbatim: 'origdate' },
            value: item.date,
            enc: 'date',
        });
        ref.add({ name: 'pages', value: ref.normalizeDashes(item.pages) });
        ref.add({ name: 'keywords', value: item.tags, enc: 'tags' });
        if (!item.creators)
            item.creators = [];
        // https://github.com/retorquere/zotero-better-bibtex/issues/1060
        if (item.itemType === 'patent' && item.assignee && !item.creators.find(cr => cr.name === item.assignee || (cr.lastName === item.assignee && (cr.fieldMode === 1)))) {
            item.creators.push({
                name: item.assignee,
                creatorType: 'assignee',
            });
        }
        ref.addCreators();
        // 'juniorcomma' needs more thought, it isn't for *all* suffixes you want this. Or even at all.
        // ref.add({ name: 'options', value: (option for option in ['useprefix', 'juniorcomma'] when ref[option]).join(',') })
        if (ref.useprefix)
            ref.add({ name: 'options', value: 'useprefix=true' });
        ref.add({ name: 'file', value: item.attachments, enc: 'attachments' });
        if (item.cslVolumeTitle) { // #381
            debug_1.debug('cslVolumeTitle: true, type:', item.referenceType, 'has:', Object.keys(ref.has));
            if (item.referenceType === 'book' && ref.has.title) {
                debug_1.debug('cslVolumeTitle: for book, type:', item.referenceType, 'has:', Object.keys(ref.has));
                ref.add({ name: 'maintitle', value: item.cslVolumeTitle }); // ; to prevent chaining
                [ref.has.title.bibtex, ref.has.maintitle.bibtex] = [ref.has.maintitle.bibtex, ref.has.title.bibtex]; // ; to prevent chaining
                [ref.has.title.value, ref.has.maintitle.value] = [ref.has.maintitle.value, ref.has.title.value];
            }
            if (['bookSection', 'chapter'].includes(item.referenceType) && ref.has.booktitle) {
                debug_1.debug('cslVolumeTitle: for bookSection, type:', item.referenceType, 'has:', Object.keys(ref.has));
                ref.add({ name: 'maintitle', value: item.cslVolumeTitle }); // ; to prevent chaining
                [ref.has.booktitle.bibtex, ref.has.maintitle.bibtex] = [ref.has.maintitle.bibtex, ref.has.booktitle.bibtex]; // ; to preven chaining
                [ref.has.booktitle.value, ref.has.maintitle.value] = [ref.has.maintitle.value, ref.has.booktitle.value];
            }
        }
        for (const eprinttype of ['pmid', 'arxiv', 'jstor', 'hdl', 'googlebooks']) {
            if (ref.has[eprinttype]) {
                if (!ref.has.eprinttype) {
                    ref.add({ name: 'eprinttype', value: eprinttype });
                    ref.add({ name: 'eprint', value: ref.has[eprinttype].value });
                }
                ref.remove(eprinttype);
            }
        }
        if (item.archive && item.archiveLocation) {
            let archive = true;
            switch (item.archive.toLowerCase()) {
                case 'arxiv':
                    if (!ref.has.eprinttype)
                        ref.add({ name: 'eprinttype', value: 'arxiv' });
                    ref.add({ name: 'eprintclass', value: item.callNumber });
                    break;
                case 'jstor':
                    if (!ref.has.eprinttype)
                        ref.add({ name: 'eprinttype', value: 'jstor' });
                    break;
                case 'pubmed':
                    if (!ref.has.eprinttype)
                        ref.add({ name: 'eprinttype', value: 'pubmed' });
                    break;
                case 'hdl':
                    if (!ref.has.eprinttype)
                        ref.add({ name: 'eprinttype', value: 'hdl' });
                    break;
                case 'googlebooks':
                case 'google books':
                    if (!ref.has.eprinttype)
                        ref.add({ name: 'eprinttype', value: 'googlebooks' });
                    break;
                default:
                    archive = false;
            }
            if (archive) {
                if (!ref.has.eprint)
                    ref.add({ name: 'eprint', value: item.archiveLocation });
            }
        }
        ref.complete();
    }
    exporter_1.Exporter.complete();
    Zotero.write('\n');
};
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/Better BibLaTeX.ts')
  ; } catch ($wrap_loader_catcher_translators_Better_BibLaTeX_ts) { 
    var $wrap_loader_message_translators_Better_BibLaTeX_ts = 'Error: zotero-better-bibtex: load of translators/Better BibLaTeX.ts failed:' + $wrap_loader_catcher_translators_Better_BibLaTeX_ts + '::' + $wrap_loader_catcher_translators_Better_BibLaTeX_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_Better_BibLaTeX_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_Better_BibLaTeX_ts)
    }
   };

/***/ }),

/***/ "./bibtex/biblatex.qr.bcf":
/*!********************************!*\
  !*** ./bibtex/biblatex.qr.bcf ***!
  \********************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

const fieldSet = {
  'optional': new Set([
    'abstract',
    'annotation',
    'authortype',
    'bookpagination',
    'crossref',
    'date',
    'entryset',
    'entrysubtype',
    'execute',
    'file',
    'gender',
    'ids',
    'indextitle',
    'indexsorttitle',
    'isan',
    'ismn',
    'iswc',
    'keywords',
    'label',
    'langid',
    'langidopts',
    'library',
    'lista',
    'listb',
    'listc',
    'listd',
    'liste',
    'listf',
    'month',
    'nameaddon',
    'options',
    'origdate',
    'origlocation',
    'origpublisher',
    'origtitle',
    'pagination',
    'presort',
    'related',
    'relatedoptions',
    'relatedstring',
    'relatedtype',
    'shortauthor',
    'shorteditor',
    'shorthand',
    'shorthandintro',
    'shortjournal',
    'shortseries',
    'shorttitle',
    'sortkey',
    'sortname',
    'sortshorthand',
    'sorttitle',
    'sortyear',
    'url',
    'urldate',
    'usera',
    'userb',
    'userc',
    'userd',
    'usere',
    'userf',
    'verba',
    'verbb',
    'verbc',
    'xdata',
    'xref',
    'year'
  ]),
  'optional_set': new Set([
    'entryset',
    'crossref'
  ]),
  'optional_article': new Set([
    'addendum',
    'annotator',
    'author',
    'commentator',
    'doi',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eid',
    'eprint',
    'eprintclass',
    'eprinttype',
    'issn',
    'issue',
    'issuetitle',
    'issuesubtitle',
    'journalsubtitle',
    'journaltitle',
    'language',
    'note',
    'number',
    'origlanguage',
    'pages',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'version',
    'volume'
  ]),
  'optional_bibnote': new Set([
    'note'
  ]),
  'optional_book': new Set([
    'author',
    'addendum',
    'afterword',
    'annotator',
    'chapter',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'maintitle',
    'maintitleaddon',
    'mainsubtitle',
    'note',
    'number',
    'origlanguage',
    'pages',
    'pagetotal',
    'part',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_mvbook': new Set([
    'addendum',
    'afterword',
    'annotator',
    'author',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'note',
    'number',
    'origlanguage',
    'pagetotal',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_bookinbook_inbook_suppbook': new Set([
    'addendum',
    'afterword',
    'annotator',
    'author',
    'booktitle',
    'bookauthor',
    'booksubtitle',
    'booktitleaddon',
    'chapter',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'mainsubtitle',
    'maintitle',
    'maintitleaddon',
    'note',
    'number',
    'origlanguage',
    'part',
    'publisher',
    'pages',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_booklet': new Set([
    'addendum',
    'author',
    'chapter',
    'doi',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'howpublished',
    'language',
    'location',
    'note',
    'pages',
    'pagetotal',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'type'
  ]),
  'optional_collection_reference': new Set([
    'addendum',
    'afterword',
    'annotator',
    'chapter',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'mainsubtitle',
    'maintitle',
    'maintitleaddon',
    'note',
    'number',
    'origlanguage',
    'pages',
    'pagetotal',
    'part',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_mvcollection_mvreference': new Set([
    'addendum',
    'afterword',
    'annotator',
    'author',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'note',
    'number',
    'origlanguage',
    'publisher',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_incollection_inreference_suppcollection': new Set([
    'addendum',
    'afterword',
    'annotator',
    'author',
    'booksubtitle',
    'booktitle',
    'booktitleaddon',
    'chapter',
    'commentator',
    'doi',
    'edition',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'foreword',
    'introduction',
    'isbn',
    'language',
    'location',
    'mainsubtitle',
    'maintitle',
    'maintitleaddon',
    'note',
    'number',
    'origlanguage',
    'pages',
    'part',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'translator',
    'volume',
    'volumes'
  ]),
  'optional_manual': new Set([
    'addendum',
    'author',
    'chapter',
    'doi',
    'edition',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'isbn',
    'language',
    'location',
    'note',
    'number',
    'organization',
    'pages',
    'pagetotal',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'type',
    'version'
  ]),
  'optional_misc': new Set([
    'addendum',
    'author',
    'doi',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'howpublished',
    'language',
    'location',
    'note',
    'organization',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'type',
    'version'
  ]),
  'optional_online': new Set([
    'addendum',
    'author',
    'editor',
    'editortype',
    'language',
    'note',
    'organization',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'version'
  ]),
  'optional_patent': new Set([
    'addendum',
    'author',
    'doi',
    'eprint',
    'eprintclass',
    'eprinttype',
    'holder',
    'location',
    'note',
    'number',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'type',
    'version'
  ]),
  'optional_periodical': new Set([
    'addendum',
    'doi',
    'editor',
    'editora',
    'editorb',
    'editorc',
    'editortype',
    'editoratype',
    'editorbtype',
    'editorctype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'issn',
    'issue',
    'issuesubtitle',
    'issuetitle',
    'language',
    'note',
    'number',
    'pubstate',
    'date',
    'series',
    'subtitle',
    'title',
    'volume'
  ]),
  'optional_mvproceedings': new Set([
    'addendum',
    'doi',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'eventdate',
    'eventtitle',
    'eventtitleaddon',
    'isbn',
    'language',
    'location',
    'note',
    'number',
    'organization',
    'pagetotal',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'venue',
    'volumes'
  ]),
  'optional_proceedings': new Set([
    'addendum',
    'chapter',
    'doi',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'eventdate',
    'eventtitle',
    'eventtitleaddon',
    'isbn',
    'language',
    'location',
    'mainsubtitle',
    'maintitle',
    'maintitleaddon',
    'note',
    'number',
    'organization',
    'pages',
    'pagetotal',
    'part',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'venue',
    'volume',
    'volumes'
  ]),
  'optional_inproceedings': new Set([
    'addendum',
    'author',
    'booksubtitle',
    'booktitle',
    'booktitleaddon',
    'chapter',
    'doi',
    'editor',
    'editortype',
    'eprint',
    'eprintclass',
    'eprinttype',
    'eventdate',
    'eventtitle',
    'eventtitleaddon',
    'isbn',
    'language',
    'location',
    'mainsubtitle',
    'maintitle',
    'maintitleaddon',
    'note',
    'number',
    'organization',
    'pages',
    'part',
    'publisher',
    'pubstate',
    'series',
    'subtitle',
    'title',
    'titleaddon',
    'venue',
    'volume',
    'volumes'
  ]),
  'optional_report': new Set([
    'addendum',
    'author',
    'chapter',
    'doi',
    'eprint',
    'eprintclass',
    'eprinttype',
    'institution',
    'isrn',
    'language',
    'location',
    'note',
    'number',
    'pages',
    'pagetotal',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'type',
    'version'
  ]),
  'optional_thesis': new Set([
    'addendum',
    'author',
    'chapter',
    'doi',
    'eprint',
    'eprintclass',
    'eprinttype',
    'institution',
    'language',
    'location',
    'note',
    'pages',
    'pagetotal',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon',
    'type'
  ]),
  'optional_unpublished': new Set([
    'addendum',
    'author',
    'howpublished',
    'language',
    'location',
    'note',
    'pubstate',
    'subtitle',
    'title',
    'titleaddon'
  ])
}
const allowed = {
  article: [
      fieldSet.optional,
      fieldSet.optional_article,
  ],
  artwork: [
      fieldSet.optional,
  ],
  audio: [
      fieldSet.optional,
  ],
  bibnote: [
      fieldSet.optional,
      fieldSet.optional_bibnote,
  ],
  book: [
      fieldSet.optional,
      fieldSet.optional_book,
  ],
  bookinbook: [
      fieldSet.optional,
      fieldSet.optional_bookinbook_inbook_suppbook,
  ],
  booklet: [
      fieldSet.optional,
      fieldSet.optional_booklet,
  ],
  collection: [
      fieldSet.optional,
      fieldSet.optional_collection_reference,
  ],
  commentary: [
      fieldSet.optional,
  ],
  customa: [
      fieldSet.optional,
  ],
  customb: [
      fieldSet.optional,
  ],
  customc: [
      fieldSet.optional,
  ],
  customd: [
      fieldSet.optional,
  ],
  custome: [
      fieldSet.optional,
  ],
  customf: [
      fieldSet.optional,
  ],
  inbook: [
      fieldSet.optional,
      fieldSet.optional_bookinbook_inbook_suppbook,
  ],
  incollection: [
      fieldSet.optional,
      fieldSet.optional_incollection_inreference_suppcollection,
  ],
  inproceedings: [
      fieldSet.optional,
      fieldSet.optional_inproceedings,
  ],
  inreference: [
      fieldSet.optional,
      fieldSet.optional_incollection_inreference_suppcollection,
  ],
  image: [
      fieldSet.optional,
  ],
  jurisdiction: [
      fieldSet.optional,
  ],
  legal: [
      fieldSet.optional,
  ],
  legislation: [
      fieldSet.optional,
  ],
  letter: [
      fieldSet.optional,
  ],
  manual: [
      fieldSet.optional,
      fieldSet.optional_manual,
  ],
  misc: [
      fieldSet.optional,
      fieldSet.optional_misc,
  ],
  movie: [
      fieldSet.optional,
  ],
  music: [
      fieldSet.optional,
  ],
  mvcollection: [
      fieldSet.optional,
      fieldSet.optional_mvcollection_mvreference,
  ],
  mvreference: [
      fieldSet.optional,
      fieldSet.optional_mvcollection_mvreference,
  ],
  mvproceedings: [
      fieldSet.optional,
      fieldSet.optional_mvproceedings,
  ],
  mvbook: [
      fieldSet.optional,
      fieldSet.optional_mvbook,
  ],
  online: [
      fieldSet.optional,
      fieldSet.optional_online,
  ],
  patent: [
      fieldSet.optional,
      fieldSet.optional_patent,
  ],
  performance: [
      fieldSet.optional,
  ],
  periodical: [
      fieldSet.optional,
      fieldSet.optional_periodical,
  ],
  proceedings: [
      fieldSet.optional,
      fieldSet.optional_proceedings,
  ],
  reference: [
      fieldSet.optional,
      fieldSet.optional_collection_reference,
  ],
  report: [
      fieldSet.optional,
      fieldSet.optional_report,
  ],
  review: [
      fieldSet.optional,
  ],
  set: [
      fieldSet.optional,
      fieldSet.optional_set,
  ],
  software: [
      fieldSet.optional,
  ],
  standard: [
      fieldSet.optional,
  ],
  suppbook: [
      fieldSet.optional,
      fieldSet.optional_bookinbook_inbook_suppbook,
  ],
  suppcollection: [
      fieldSet.optional,
      fieldSet.optional_incollection_inreference_suppcollection,
  ],
  suppperiodical: [
      fieldSet.optional,
  ],
  thesis: [
      fieldSet.optional,
      fieldSet.optional_thesis,
  ],
  unpublished: [
      fieldSet.optional,
      fieldSet.optional_unpublished,
  ],
  video: [
      fieldSet.optional,
  ],
  xdata: [
      fieldSet.optional,
  ],
}
const required = [
    {
      types: new Set(["article","book","bookinbook","booklet","collection","inbook","incollection","inproceedings","inreference","manual","misc","mvbook","mvcollection","online","patent","periodical","proceedings","reference","report","set","suppbook","suppcollection","suppperiodical","thesis","unpublished"]),
      check: function(ref, report) {
            if (!ref.has.date === !ref.has.year) report.push("Exactly one of 'date' / 'year' must be present")
      }
    },
    {
      types: new Set(["set"]),
      check: function(ref, report) {
            if (!ref.has.entryset) report.push("Missing required field 'entryset'")
            if (!ref.has.crossref) report.push("Missing required field 'crossref'")
      }
    },
    {
      types: new Set(["article"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.journaltitle) report.push("Missing required field 'journaltitle'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["book","mvbook","mvcollection","mvreference"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["bookinbook","inbook","suppbook"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.booktitle) report.push("Missing required field 'booktitle'")
      }
    },
    {
      types: new Set(["booklet"]),
      check: function(ref, report) {
            if (!(this.has.author || this.has.editor)) report.push("At least one of 'author' / 'editor' must be present")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["collection","reference"]),
      check: function(ref, report) {
            if (!ref.has.editor) report.push("Missing required field 'editor'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["incollection","inreference","suppcollection"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.editor) report.push("Missing required field 'editor'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.booktitle) report.push("Missing required field 'booktitle'")
      }
    },
    {
      types: new Set(["manual"]),
      check: function(ref, report) {
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["misc"]),
      check: function(ref, report) {
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["online"]),
      check: function(ref, report) {
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.url) report.push("Missing required field 'url'")
      }
    },
    {
      types: new Set(["patent"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.number) report.push("Missing required field 'number'")
      }
    },
    {
      types: new Set(["periodical"]),
      check: function(ref, report) {
            if (!ref.has.editor) report.push("Missing required field 'editor'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["mvproceedings","proceedings"]),
      check: function(ref, report) {
            if (!ref.has.editor) report.push("Missing required field 'editor'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
    {
      types: new Set(["inproceedings"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.booktitle) report.push("Missing required field 'booktitle'")
      }
    },
    {
      types: new Set(["report"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.type) report.push("Missing required field 'type'")
            if (!ref.has.institution) report.push("Missing required field 'institution'")
      }
    },
    {
      types: new Set(["thesis"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
            if (!ref.has.type) report.push("Missing required field 'type'")
            if (!ref.has.institution) report.push("Missing required field 'institution'")
      }
    },
    {
      types: new Set(["unpublished"]),
      check: function(ref, report) {
            if (!ref.has.author) report.push("Missing required field 'author'")
            if (!ref.has.title) report.push("Missing required field 'title'")
      }
    },
]

module.exports = function(explanation) {
  var type = this.referencetype.toLowerCase()

  if (!allowed[type]) return

  var unexpected = Object.keys(this.has).filter(field => !allowed[type].find(set => set.has(field)))
  var report = unexpected.map(field => "Unexpected field '" + field + "'" + (explanation[field] ? (' (' + explanation[field] + ')'): ''))

  for (const test of required) {
    if (test.types.has(type)) test.check(this, report)
  }

    for (const field of ["isbn"]) {
      if (this.has[field]) {
        const warning = Zotero.BetterBibTeX.qrCheck(this.has[field].value, "isbn", null)
        if (warning) report.push("'" + field + "': " + warning)
      }
    }
    for (const field of ["issn"]) {
      if (this.has[field]) {
        const warning = Zotero.BetterBibTeX.qrCheck(this.has[field].value, "issn", null)
        if (warning) report.push("'" + field + "': " + warning)
      }
    }
    for (const field of ["ismn"]) {
      if (this.has[field]) {
        const warning = Zotero.BetterBibTeX.qrCheck(this.has[field].value, "ismn", null)
        if (warning) report.push("'" + field + "': " + warning)
      }
    }
    for (const field of ["date","eventdate","origdate","urldate"]) {
      if (this.has[field]) {
        const warning = Zotero.BetterBibTeX.qrCheck(this.has[field].value, "date", null)
        if (warning) report.push("'" + field + "': " + warning)
      }
    }
    for (const field of ["gender"]) {
      if (this.has[field]) {
        const warning = Zotero.BetterBibTeX.qrCheck(this.has[field].value, "pattern", "(?:sf|sm|sn|pf|pm|pn|pp)")
        if (warning) report.push("'" + field + "': " + warning)
      }
    }

  return report
}


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
