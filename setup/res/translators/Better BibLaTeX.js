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
		"hash": "0b93a22a552dab02712ba2705ea59278-a20e787f257e9de4c153f62b5b52359e"
	},
	"displayOptions": {
		"exportNotes": false,
		"exportFileData": false,
		"useJournalAbbreviation": false,
		"keepUpdated": false
	},
	"lastUpdated": "2019-02-21 00:04:51"
}

var Translator = {
  initialize: function () {},
  BetterBibLaTeX: true,
  BetterTeX: true,
  BetterCSL: false,
  header: ZOTERO_TRANSLATOR_INFO,
  // header: < %- JSON.stringify(header) % >,
  preferences: {"DOIandURL":"both","ascii":"","asciiBibLaTeX":false,"asciiBibTeX":true,"autoAbbrev":false,"autoAbbrevStyle":"","autoExport":"immediate","autoExportDelay":1,"autoExportIdleWait":10,"autoExportPrimeExportCacheBatch":10,"autoExportPrimeExportCacheThreshold":0,"autoPin":false,"auxImport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"bibtexParticleNoOp":false,"bibtexURL":"off","cacheFlushInterval":5,"citeCommand":"cite","citekeyFold":true,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citeprocNoteCitekey":false,"csquotes":"","debug":false,"debugLog":"","git":"config","itemObserverDelay":100,"jabrefFormat":0,"keyConflictPolicy":"keep","keyScope":"library","kuroshiro":false,"lockedInit":false,"parseParticles":true,"postscript":"","preserveBibTeXVariables":false,"qualityReport":false,"quickCopyMode":"latex","quickCopyPandocBrackets":false,"rawLaTag":"#LaTeX","relativeFilePaths":false,"scrubDatabase":false,"skipFields":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","sorted":false,"strings":"","suppressTitleCase":false,"testing":false,"warnBulkModify":10},
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

module.exports = {'_':{'tex':'\\_'},'{':{'tex':'\\{'},'}':{'tex':'\\}'},'&':{'tex':'\\&'},'#':{'tex':'\\#'},'%':{'tex':'\\%'},'^':{'tex':'\\^'},'<':{'tex':'<','math':true},'>':{'tex':'>','math':true},'~':{'tex':'\\textasciitilde{}'},'$':{'tex':'\\$'},'\\':{'tex':'\\backslash{}','math':true},'\xA0':{'tex':'~','space':true},'\xA1':{'tex':'\\textexclamdown{}'},'\xA2':{'tex':'\\textcent{}'},'\xA3':{'tex':'\\textsterling{}'},'\xA4':{'tex':'\\textcurrency{}'},'\xA5':{'tex':'\\textyen{}'},'\xA6':{'tex':'\\textbrokenbar{}'},'\xA7':{'tex':'\\textsection{}'},'\xA8':{'tex':'\\textasciidieresis{}'},'\xA9':{'tex':'\\textcopyright{}'},'\xAA':{'tex':'\\textordfeminine{}'},'\xAB':{'tex':'\\guillemotleft{}'},'\xAC':{'tex':'\\lnot{}','math':true},'\xAD':{'tex':'\\-','math':true},'\xAE':{'tex':'\\textregistered{}'},'\xAF':{'tex':'\\textasciimacron{}'},'\xB0':{'tex':'^\\circ{}','math':true},'\xB1':{'tex':'\\pm{}','math':true},'\xB2':{'tex':'^2','math':true},'\xB3':{'tex':'^3','math':true},'\xB4':{'tex':'\\textasciiacute{}'},'\xB5':{'tex':'\\mathrm{\\mu}','math':true},'\xB6':{'tex':'\\textparagraph{}'},'\xB7':{'tex':'\\cdot{}','math':true},'\xB8':{'tex':'\\c{}'},'\xB9':{'tex':'^1','math':true},'\xBA':{'tex':'\\textordmasculine{}'},'\xBB':{'tex':'\\guillemotright{}'},'\xBC':{'tex':'\\textonequarter{}'},'\xBD':{'tex':'\\textonehalf{}'},'\xBE':{'tex':'\\textthreequarters{}'},'\xBF':{'tex':'\\textquestiondown{}'},'\xC0':{'tex':'\\`A'},'\xC1':{'tex':'\\\'A'},'\xC2':{'tex':'\\^A'},'\xC3':{'tex':'\\~A'},'\xC4':{'tex':'\\"A'},'\xC5':{'tex':'\\AA{}'},'\xC6':{'tex':'\\AE{}'},'\xC7':{'tex':'{\\c C}'},'\xC8':{'tex':'\\`E'},'\xC9':{'tex':'\\\'E'},'\xCA':{'tex':'\\^E'},'\xCB':{'tex':'\\"E'},'\xCC':{'tex':'\\`I'},'\xCD':{'tex':'\\\'I'},'\xCE':{'tex':'\\^I'},'\xCF':{'tex':'\\"I'},'\xD0':{'tex':'\\DH{}'},'\xD1':{'tex':'\\~N'},'\xD2':{'tex':'\\`O'},'\xD3':{'tex':'\\\'O'},'\xD4':{'tex':'\\^O'},'\xD5':{'tex':'\\~O'},'\xD6':{'tex':'\\"O'},'\xD7':{'tex':'\\texttimes{}'},'\xD8':{'tex':'\\O{}'},'\xD9':{'tex':'\\`U'},'\xDA':{'tex':'\\\'U'},'\xDB':{'tex':'\\^U'},'\xDC':{'tex':'\\"U'},'\xDD':{'tex':'\\\'Y'},'\xDE':{'tex':'\\TH{}'},'\xDF':{'tex':'\\ss{}'},'\xE0':{'tex':'\\`a'},'\xE1':{'tex':'\\\'a'},'\xE2':{'tex':'\\^a'},'\xE3':{'tex':'\\~a'},'\xE4':{'tex':'\\"a'},'\xE5':{'tex':'\\aa{}'},'\xE6':{'tex':'\\ae{}'},'\xE7':{'tex':'{\\c c}'},'\xE8':{'tex':'\\`e'},'\xE9':{'tex':'\\\'e'},'\xEA':{'tex':'\\^e'},'\xEB':{'tex':'\\"e'},'\xEC':{'tex':'\\`i'},'\xED':{'tex':'\\\'i'},'\xEE':{'tex':'\\^i'},'\xEF':{'tex':'\\"i'},'\xF0':{'tex':'\\dh{}'},'\xF1':{'tex':'\\~n'},'\xF2':{'tex':'\\`o'},'\xF3':{'tex':'\\\'o'},'\xF4':{'tex':'\\^o'},'\xF5':{'tex':'\\~o'},'\xF6':{'tex':'\\"o'},'\xF7':{'tex':'\\div{}','math':true},'\xF8':{'tex':'\\o{}'},'\xF9':{'tex':'\\`u'},'\xFA':{'tex':'\\\'u'},'\xFB':{'tex':'\\^u'},'\xFC':{'tex':'\\"u'},'\xFD':{'tex':'\\\'y'},'\xFE':{'tex':'\\th{}'},'\xFF':{'tex':'\\"y'},'\u0100':{'tex':'\\=A'},'\u0101':{'tex':'\\=a'},'\u0102':{'tex':'{\\u A}'},'\u0103':{'tex':'{\\u a}'},'\u0104':{'tex':'\\k{A}'},'\u0105':{'tex':'\\k{a}'},'\u0106':{'tex':'\\\'C'},'\u0107':{'tex':'\\\'c'},'\u0108':{'tex':'\\^C'},'\u0109':{'tex':'\\^c'},'\u010A':{'tex':'\\.{C}'},'\u010B':{'tex':'\\.{c}'},'\u010C':{'tex':'{\\v C}'},'\u010D':{'tex':'{\\v c}'},'\u010E':{'tex':'{\\v D}'},'\u010F':{'tex':'{\\v d}'},'\u0110':{'tex':'\\DJ{}'},'\u0111':{'tex':'\\dj{}'},'\u0112':{'tex':'\\=E'},'\u0113':{'tex':'\\=e'},'\u0114':{'tex':'{\\u E}'},'\u0115':{'tex':'{\\u e}'},'\u0116':{'tex':'\\.{E}'},'\u0117':{'tex':'\\.{e}'},'\u0118':{'tex':'\\k{E}'},'\u0119':{'tex':'\\k{e}'},'\u011A':{'tex':'{\\v E}'},'\u011B':{'tex':'{\\v e}'},'\u011C':{'tex':'\\^G'},'\u011D':{'tex':'\\^g'},'\u011E':{'tex':'{\\u G}'},'\u011F':{'tex':'{\\u g}'},'\u0120':{'tex':'\\.{G}'},'\u0121':{'tex':'\\.{g}'},'\u0122':{'tex':'{\\c G}'},'\u0123':{'tex':'{\\c g}'},'\u0124':{'tex':'\\^H'},'\u0125':{'tex':'\\^h'},'\u0126':{'tex':'{\\fontencoding{LELA}\\selectfont\\char40}'},'\u0127':{'tex':'\\Elzxh{}','math':true},'\u0128':{'tex':'\\~I'},'\u0129':{'tex':'\\~i'},'\u012A':{'tex':'\\=I'},'\u012B':{'tex':'\\=i'},'\u012C':{'tex':'{\\u I}'},'\u012D':{'tex':'{\\u \\i}'},'\u012E':{'tex':'\\k{I}'},'\u012F':{'tex':'\\k{i}'},'\u0130':{'tex':'\\.{I}'},'\u0131':{'tex':'\\i{}'},'\u0132':{'tex':'IJ'},'\u0133':{'tex':'ij'},'\u0134':{'tex':'\\^J'},'\u0135':{'tex':'\\^\\{j}'},'\u0136':{'tex':'{\\c K}'},'\u0137':{'tex':'{\\c k}'},'\u0138':{'tex':'{\\fontencoding{LELA}\\selectfont\\char91}'},'\u0139':{'tex':'\\\'L'},'\u013A':{'tex':'\\\'l'},'\u013B':{'tex':'{\\c L}'},'\u013C':{'tex':'{\\c l}'},'\u013D':{'tex':'{\\v L}'},'\u013E':{'tex':'{\\v l}'},'\u013F':{'tex':'{\\fontencoding{LELA}\\selectfont\\char201}'},'\u0140':{'tex':'{\\fontencoding{LELA}\\selectfont\\char202}'},'\u0141':{'tex':'\\L{}'},'\u0142':{'tex':'\\l{}'},'\u0143':{'tex':'\\\'N'},'\u0144':{'tex':'\\\'n'},'\u0145':{'tex':'{\\c N}'},'\u0146':{'tex':'{\\c n}'},'\u0147':{'tex':'{\\v N}'},'\u0148':{'tex':'{\\v n}'},'\u0149':{'tex':'\'n'},'\u014A':{'tex':'\\NG{}'},'\u014B':{'tex':'\\ng{}'},'\u014C':{'tex':'\\=O'},'\u014D':{'tex':'\\=o'},'\u014E':{'tex':'{\\u O}'},'\u014F':{'tex':'{\\u o}'},'\u0150':{'tex':'{\\H O}'},'\u0151':{'tex':'{\\H o}'},'\u0152':{'tex':'\\OE{}'},'\u0153':{'tex':'\\oe{}'},'\u0154':{'tex':'\\\'R'},'\u0155':{'tex':'\\\'r'},'\u0156':{'tex':'{\\c R}'},'\u0157':{'tex':'{\\c r}'},'\u0158':{'tex':'{\\v R}'},'\u0159':{'tex':'{\\v r}'},'\u015A':{'tex':'\\\'S'},'\u015B':{'tex':'\\\'s'},'\u015C':{'tex':'\\^S'},'\u015D':{'tex':'\\^s'},'\u015E':{'tex':'{\\c S}'},'\u015F':{'tex':'{\\c s}'},'\u0160':{'tex':'{\\v S}'},'\u0161':{'tex':'{\\v s}'},'\u0162':{'tex':'{\\c T}'},'\u0163':{'tex':'{\\c t}'},'\u0164':{'tex':'{\\v T}'},'\u0165':{'tex':'{\\v t}'},'\u0166':{'tex':'{\\fontencoding{LELA}\\selectfont\\char47}'},'\u0167':{'tex':'{\\fontencoding{LELA}\\selectfont\\char63}'},'\u0168':{'tex':'\\~U'},'\u0169':{'tex':'\\~u'},'\u016A':{'tex':'\\=U'},'\u016B':{'tex':'\\=u'},'\u016C':{'tex':'{\\u U}'},'\u016D':{'tex':'{\\u u}'},'\u016E':{'tex':'\\r{U}'},'\u016F':{'tex':'\\r{u}'},'\u0170':{'tex':'{\\H U}'},'\u0171':{'tex':'{\\H u}'},'\u0172':{'tex':'\\k{U}'},'\u0173':{'tex':'\\k{u}'},'\u0174':{'tex':'\\^W'},'\u0175':{'tex':'\\^w'},'\u0176':{'tex':'\\^Y'},'\u0177':{'tex':'\\^y'},'\u0178':{'tex':'\\"Y'},'\u0179':{'tex':'\\\'Z'},'\u017A':{'tex':'\\\'z'},'\u017B':{'tex':'\\.{Z}'},'\u017C':{'tex':'\\.{z}'},'\u017D':{'tex':'{\\v Z}'},'\u017E':{'tex':'{\\v z}'},'\u017F':{'tex':'s'},'\u0192':{'tex':'f','math':true},'\u0195':{'tex':'\\texthvlig{}'},'\u019E':{'tex':'\\textnrleg{}'},'\u01AA':{'tex':'\\eth{}','math':true},'\u01B5':{'tex':'\\Zbar{}','math':true},'\u01BA':{'tex':'{\\fontencoding{LELA}\\selectfont\\char195}'},'\u01C2':{'tex':'\\textdoublepipe{}'},'\u01CD':{'tex':'{\\v A}'},'\u01CE':{'tex':'{\\v a}'},'\u01CF':{'tex':'{\\v I}'},'\u01D0':{'tex':'{\\v i}'},'\u01D1':{'tex':'{\\v O}'},'\u01D2':{'tex':'{\\v o}'},'\u01D3':{'tex':'{\\v U}'},'\u01D4':{'tex':'{\\v u}'},'\u01E6':{'tex':'{\\v G}'},'\u01E7':{'tex':'{\\v g}'},'\u01E8':{'tex':'{\\v K}'},'\u01E9':{'tex':'{\\v k}'},'\u01EA':{'tex':'{\\k O}'},'\u01EB':{'tex':'{\\k o}'},'\u01F0':{'tex':'{\\v j}'},'\u01F4':{'tex':'\\\'G'},'\u01F5':{'tex':'\\\'g'},'\u0237':{'tex':'\\jmath{}','math':true},'\u0250':{'tex':'\\Elztrna{}','math':true},'\u0252':{'tex':'\\Elztrnsa{}','math':true},'\u0254':{'tex':'\\Elzopeno{}','math':true},'\u0256':{'tex':'\\Elzrtld{}','math':true},'\u0258':{'tex':'{\\fontencoding{LEIP}\\selectfont\\char61}'},'\u0259':{'tex':'\\Elzschwa{}','math':true},'\u025B':{'tex':'\\varepsilon{}','math':true},'\u0261':{'tex':'g'},'\u0263':{'tex':'\\Elzpgamma{}','math':true},'\u0264':{'tex':'\\Elzpbgam{}','math':true},'\u0265':{'tex':'\\Elztrnh{}','math':true},'\u026C':{'tex':'\\Elzbtdl{}','math':true},'\u026D':{'tex':'\\Elzrtll{}','math':true},'\u026F':{'tex':'\\Elztrnm{}','math':true},'\u0270':{'tex':'\\Elztrnmlr{}','math':true},'\u0271':{'tex':'\\Elzltlmr{}','math':true},'\u0272':{'tex':'\\Elzltln{}'},'\u0273':{'tex':'\\Elzrtln{}','math':true},'\u0277':{'tex':'\\Elzclomeg{}','math':true},'\u0278':{'tex':'\\textphi{}'},'\u0279':{'tex':'\\Elztrnr{}','math':true},'\u027A':{'tex':'\\Elztrnrl{}','math':true},'\u027B':{'tex':'\\Elzrttrnr{}','math':true},'\u027C':{'tex':'\\Elzrl{}','math':true},'\u027D':{'tex':'\\Elzrtlr{}','math':true},'\u027E':{'tex':'\\Elzfhr{}','math':true},'\u027F':{'tex':'{\\fontencoding{LEIP}\\selectfont\\char202}'},'\u0282':{'tex':'\\Elzrtls{}','math':true},'\u0283':{'tex':'\\Elzesh{}','math':true},'\u0287':{'tex':'\\Elztrnt{}','math':true},'\u0288':{'tex':'\\Elzrtlt{}','math':true},'\u028A':{'tex':'\\Elzpupsil{}','math':true},'\u028B':{'tex':'\\Elzpscrv{}','math':true},'\u028C':{'tex':'\\Elzinvv{}','math':true},'\u028D':{'tex':'\\Elzinvw{}','math':true},'\u028E':{'tex':'\\Elztrny{}','math':true},'\u0290':{'tex':'\\Elzrtlz{}','math':true},'\u0292':{'tex':'\\Elzyogh{}','math':true},'\u0294':{'tex':'\\Elzglst{}','math':true},'\u0295':{'tex':'\\Elzreglst{}','math':true},'\u0296':{'tex':'\\Elzinglst{}','math':true},'\u029E':{'tex':'\\textturnk{}'},'\u02A4':{'tex':'\\Elzdyogh{}','math':true},'\u02A7':{'tex':'\\Elztesh{}','math':true},'\u02B9':{'tex':'\''},'\u02BB':{'tex':'\''},'\u02BC':{'tex':'\''},'\u02BD':{'tex':'\''},'\u02C6':{'tex':'\\textasciicircum{}'},'\u02C7':{'tex':'\\textasciicaron{}'},'\u02C8':{'tex':'\\Elzverts{}','math':true},'\u02C9':{'tex':'-'},'\u02CC':{'tex':'\\Elzverti{}','math':true},'\u02D0':{'tex':'\\Elzlmrk{}','math':true},'\u02D1':{'tex':'\\Elzhlmrk{}','math':true},'\u02D2':{'tex':'\\Elzsbrhr{}','math':true},'\u02D3':{'tex':'\\Elzsblhr{}','math':true},'\u02D4':{'tex':'\\Elzrais{}','math':true},'\u02D5':{'tex':'\\Elzlow{}','math':true},'\u02D8':{'tex':'\\textasciibreve{}'},'\u02D9':{'tex':'\\textperiodcentered{}'},'\u02DA':{'tex':'\\r{}'},'\u02DB':{'tex':'\\k{}'},'\u02DC':{'tex':'\\texttildelow{}'},'\u02DD':{'tex':'\\H{}'},'\u02E5':{'tex':'\\tone{55}'},'\u02E6':{'tex':'\\tone{44}'},'\u02E7':{'tex':'\\tone{33}'},'\u02E8':{'tex':'\\tone{22}'},'\u02E9':{'tex':'\\tone{11}'},'\u0300':{'tex':'\\`'},'\u0301':{'tex':'\\\''},'\u0302':{'tex':'\\^'},'\u0303':{'tex':'\\~'},'\u0304':{'tex':'\\='},'\u0305':{'tex':'\\overline{}','math':true},'\u0306':{'tex':'\\u{}'},'\u0307':{'tex':'\\.'},'\u0308':{'tex':'\\"'},'\u0309':{'tex':'\\ovhook{}','math':true},'\u030A':{'tex':'\\r{}'},'\u030B':{'tex':'\\H{}'},'\u030C':{'tex':'\\v{}'},'\u030F':{'tex':'\\cyrchar\\C{}'},'\u0310':{'tex':'\\candra{}','math':true},'\u0311':{'tex':'{\\fontencoding{LECO}\\selectfont\\char177}'},'\u0312':{'tex':'\\oturnedcomma{}','math':true},'\u0315':{'tex':'\\ocommatopright{}','math':true},'\u0318':{'tex':'{\\fontencoding{LECO}\\selectfont\\char184}'},'\u0319':{'tex':'{\\fontencoding{LECO}\\selectfont\\char185}'},'\u031A':{'tex':'\\droang{}','math':true},'\u0321':{'tex':'\\Elzpalh{}','math':true},'\u0322':{'tex':'\\Elzrh{}'},'\u0327':{'tex':'\\c{}'},'\u0328':{'tex':'\\k{}'},'\u032A':{'tex':'\\Elzsbbrg{}','math':true},'\u032B':{'tex':'{\\fontencoding{LECO}\\selectfont\\char203}'},'\u032F':{'tex':'{\\fontencoding{LECO}\\selectfont\\char207}'},'\u0330':{'tex':'\\utilde{}','math':true},'\u0331':{'tex':'\\underbar{}','math':true},'\u0332':{'tex':'\\underline{}','math':true},'\u0335':{'tex':'\\Elzxl{}'},'\u0336':{'tex':'\\Elzbar{}'},'\u0337':{'tex':'{\\fontencoding{LECO}\\selectfont\\char215}'},'\u0338':{'tex':'{\\fontencoding{LECO}\\selectfont\\char216}'},'\u033A':{'tex':'{\\fontencoding{LECO}\\selectfont\\char218}'},'\u033B':{'tex':'{\\fontencoding{LECO}\\selectfont\\char219}'},'\u033C':{'tex':'{\\fontencoding{LECO}\\selectfont\\char220}'},'\u033D':{'tex':'{\\fontencoding{LECO}\\selectfont\\char221}'},'\u0361':{'tex':'{\\fontencoding{LECO}\\selectfont\\char225}'},'\u0375':{'tex':','},';':{'tex':';'},'\u0386':{'tex':'\\\'A'},'\u0388':{'tex':'\\\'E'},'\u0389':{'tex':'\\\'H'},'\u038A':{'tex':'\\\'{}{I}'},'\u038C':{'tex':'{\\\'{}O}'},'\u038E':{'tex':'\\mathrm{\'Y}','math':true},'\u038F':{'tex':'\\mathrm{\'\\Omega}','math':true},'\u0390':{'tex':'\\acute{\\ddot{\\iota}}','math':true},'\u0391':{'tex':'A','math':true},'\u0392':{'tex':'B','math':true},'\u0393':{'tex':'\\Gamma{}','math':true},'\u0394':{'tex':'\\Delta{}','math':true},'\u0395':{'tex':'E','math':true},'\u0396':{'tex':'Z','math':true},'\u0397':{'tex':'H','math':true},'\u0398':{'tex':'\\Theta{}','math':true},'\u0399':{'tex':'I','math':true},'\u039A':{'tex':'K','math':true},'\u039B':{'tex':'\\Lambda{}','math':true},'\u039C':{'tex':'M','math':true},'\u039D':{'tex':'N','math':true},'\u039E':{'tex':'\\Xi{}','math':true},'\u039F':{'tex':'O','math':true},'\u03A0':{'tex':'\\Pi{}','math':true},'\u03A1':{'tex':'P','math':true},'\u03A3':{'tex':'\\Sigma{}','math':true},'\u03A4':{'tex':'T','math':true},'\u03A5':{'tex':'\\Upsilon{}','math':true},'\u03A6':{'tex':'\\Phi{}','math':true},'\u03A7':{'tex':'X','math':true},'\u03A8':{'tex':'\\Psi{}','math':true},'\u03A9':{'tex':'\\Omega{}','math':true},'\u03AA':{'tex':'\\mathrm{\\ddot{I}}','math':true},'\u03AB':{'tex':'\\mathrm{\\ddot{Y}}','math':true},'\u03AC':{'tex':'{\\\'$\\alpha$}'},'\u03AD':{'tex':'\\acute{\\epsilon}','math':true},'\u03AE':{'tex':'\\acute{\\eta}','math':true},'\u03AF':{'tex':'\\acute{\\iota}','math':true},'\u03B0':{'tex':'\\acute{\\ddot{\\upsilon}}','math':true},'\u03B1':{'tex':'\\alpha{}','math':true},'\u03B2':{'tex':'\\beta{}','math':true},'\u03B3':{'tex':'\\gamma{}','math':true},'\u03B4':{'tex':'\\delta{}','math':true},'\u03B5':{'tex':'\\epsilon{}','math':true},'\u03B6':{'tex':'\\zeta{}','math':true},'\u03B7':{'tex':'\\eta{}','math':true},'\u03B8':{'tex':'\\texttheta{}'},'\u03B9':{'tex':'\\iota{}','math':true},'\u03BA':{'tex':'\\kappa{}','math':true},'\u03BB':{'tex':'\\lambda{}','math':true},'\u03BC':{'tex':'\\mu{}','math':true},'\u03BD':{'tex':'\\nu{}','math':true},'\u03BE':{'tex':'\\xi{}','math':true},'\u03BF':{'tex':'o','math':true},'\u03C0':{'tex':'\\pi{}','math':true},'\u03C1':{'tex':'\\rho{}','math':true},'\u03C2':{'tex':'\\varsigma{}','math':true},'\u03C3':{'tex':'\\sigma{}','math':true},'\u03C4':{'tex':'\\tau{}','math':true},'\u03C5':{'tex':'\\upsilon{}','math':true},'\u03C6':{'tex':'\\varphi{}','math':true},'\u03C7':{'tex':'\\chi{}','math':true},'\u03C8':{'tex':'\\psi{}','math':true},'\u03C9':{'tex':'\\omega{}','math':true},'\u03CA':{'tex':'\\ddot{\\iota}','math':true},'\u03CB':{'tex':'\\ddot{\\upsilon}','math':true},'\u03CC':{'tex':'\\\'o'},'\u03CD':{'tex':'\\acute{\\upsilon}','math':true},'\u03CE':{'tex':'\\acute{\\omega}','math':true},'\u03D0':{'tex':'\\Pisymbol{ppi022}{87}'},'\u03D1':{'tex':'\\textvartheta{}'},'\u03D2':{'tex':'\\Upsilon{}','math':true},'\u03D5':{'tex':'\\phi{}','math':true},'\u03D6':{'tex':'\\varpi{}','math':true},'\u03D8':{'tex':'\\Qoppa{}','math':true},'\u03D9':{'tex':'\\qoppa{}','math':true},'\u03DA':{'tex':'\\Stigma{}','math':true},'\u03DB':{'tex':'\\stigma{}','math':true},'\u03DC':{'tex':'\\Digamma{}','math':true},'\u03DD':{'tex':'\\digamma{}','math':true},'\u03DE':{'tex':'\\Koppa{}','math':true},'\u03DF':{'tex':'\\koppa{}','math':true},'\u03E0':{'tex':'\\Sampi{}','math':true},'\u03E1':{'tex':'\\sampi{}','math':true},'\u03F0':{'tex':'\\varkappa{}','math':true},'\u03F1':{'tex':'\\varrho{}','math':true},'\u03F4':{'tex':'\\textTheta{}'},'\u03F5':{'tex':'\\epsilon{}','math':true},'\u03F6':{'tex':'\\backepsilon{}','math':true},'\u0401':{'tex':'\\cyrchar\\CYRYO{}'},'\u0402':{'tex':'\\cyrchar\\CYRDJE{}'},'\u0403':{'tex':'\\cyrchar{\\\'\\CYRG}'},'\u0404':{'tex':'\\cyrchar\\CYRIE{}'},'\u0405':{'tex':'\\cyrchar\\CYRDZE{}'},'\u0406':{'tex':'\\cyrchar\\CYRII{}'},'\u0407':{'tex':'\\cyrchar\\CYRYI{}'},'\u0408':{'tex':'\\cyrchar\\CYRJE{}'},'\u0409':{'tex':'\\cyrchar\\CYRLJE{}'},'\u040A':{'tex':'\\cyrchar\\CYRNJE{}'},'\u040B':{'tex':'\\cyrchar\\CYRTSHE{}'},'\u040C':{'tex':'\\cyrchar{\\\'\\CYRK}'},'\u040E':{'tex':'\\cyrchar\\CYRUSHRT{}'},'\u040F':{'tex':'\\cyrchar\\CYRDZHE{}'},'\u0410':{'tex':'\\cyrchar\\CYRA{}'},'\u0411':{'tex':'\\cyrchar\\CYRB{}'},'\u0412':{'tex':'\\cyrchar\\CYRV{}'},'\u0413':{'tex':'\\cyrchar\\CYRG{}'},'\u0414':{'tex':'\\cyrchar\\CYRD{}'},'\u0415':{'tex':'\\cyrchar\\CYRE{}'},'\u0416':{'tex':'\\cyrchar\\CYRZH{}'},'\u0417':{'tex':'\\cyrchar\\CYRZ{}'},'\u0418':{'tex':'\\cyrchar\\CYRI{}'},'\u0419':{'tex':'\\cyrchar\\CYRISHRT{}'},'\u041A':{'tex':'\\cyrchar\\CYRK{}'},'\u041B':{'tex':'\\cyrchar\\CYRL{}'},'\u041C':{'tex':'\\cyrchar\\CYRM{}'},'\u041D':{'tex':'\\cyrchar\\CYRN{}'},'\u041E':{'tex':'\\cyrchar\\CYRO{}'},'\u041F':{'tex':'\\cyrchar\\CYRP{}'},'\u0420':{'tex':'\\cyrchar\\CYRR{}'},'\u0421':{'tex':'\\cyrchar\\CYRS{}'},'\u0422':{'tex':'\\cyrchar\\CYRT{}'},'\u0423':{'tex':'\\cyrchar\\CYRU{}'},'\u0424':{'tex':'\\cyrchar\\CYRF{}'},'\u0425':{'tex':'\\cyrchar\\CYRH{}'},'\u0426':{'tex':'\\cyrchar\\CYRC{}'},'\u0427':{'tex':'\\cyrchar\\CYRCH{}'},'\u0428':{'tex':'\\cyrchar\\CYRSH{}'},'\u0429':{'tex':'\\cyrchar\\CYRSHCH{}'},'\u042A':{'tex':'\\cyrchar\\CYRHRDSN{}'},'\u042B':{'tex':'\\cyrchar\\CYRERY{}'},'\u042C':{'tex':'\\cyrchar\\CYRSFTSN{}'},'\u042D':{'tex':'\\cyrchar\\CYREREV{}'},'\u042E':{'tex':'\\cyrchar\\CYRYU{}'},'\u042F':{'tex':'\\cyrchar\\CYRYA{}'},'\u0430':{'tex':'\\cyrchar\\cyra{}'},'\u0431':{'tex':'\\cyrchar\\cyrb{}'},'\u0432':{'tex':'\\cyrchar\\cyrv{}'},'\u0433':{'tex':'\\cyrchar\\cyrg{}'},'\u0434':{'tex':'\\cyrchar\\cyrd{}'},'\u0435':{'tex':'\\cyrchar\\cyre{}'},'\u0436':{'tex':'\\cyrchar\\cyrzh{}'},'\u0437':{'tex':'\\cyrchar\\cyrz{}'},'\u0438':{'tex':'\\cyrchar\\cyri{}'},'\u0439':{'tex':'\\cyrchar\\cyrishrt{}'},'\u043A':{'tex':'\\cyrchar\\cyrk{}'},'\u043B':{'tex':'\\cyrchar\\cyrl{}'},'\u043C':{'tex':'\\cyrchar\\cyrm{}'},'\u043D':{'tex':'\\cyrchar\\cyrn{}'},'\u043E':{'tex':'\\cyrchar\\cyro{}'},'\u043F':{'tex':'\\cyrchar\\cyrp{}'},'\u0440':{'tex':'\\cyrchar\\cyrr{}'},'\u0441':{'tex':'\\cyrchar\\cyrs{}'},'\u0442':{'tex':'\\cyrchar\\cyrt{}'},'\u0443':{'tex':'\\cyrchar\\cyru{}'},'\u0444':{'tex':'\\cyrchar\\cyrf{}'},'\u0445':{'tex':'\\cyrchar\\cyrh{}'},'\u0446':{'tex':'\\cyrchar\\cyrc{}'},'\u0447':{'tex':'\\cyrchar\\cyrch{}'},'\u0448':{'tex':'\\cyrchar\\cyrsh{}'},'\u0449':{'tex':'\\cyrchar\\cyrshch{}'},'\u044A':{'tex':'\\cyrchar\\cyrhrdsn{}'},'\u044B':{'tex':'\\cyrchar\\cyrery{}'},'\u044C':{'tex':'\\cyrchar\\cyrsftsn{}'},'\u044D':{'tex':'\\cyrchar\\cyrerev{}'},'\u044E':{'tex':'\\cyrchar\\cyryu{}'},'\u044F':{'tex':'\\cyrchar\\cyrya{}'},'\u0451':{'tex':'\\cyrchar\\cyryo{}'},'\u0452':{'tex':'\\cyrchar\\cyrdje{}'},'\u0453':{'tex':'\\cyrchar{\\\'\\cyrg}'},'\u0454':{'tex':'\\cyrchar\\cyrie{}'},'\u0455':{'tex':'\\cyrchar\\cyrdze{}'},'\u0456':{'tex':'\\cyrchar\\cyrii{}'},'\u0457':{'tex':'\\cyrchar\\cyryi{}'},'\u0458':{'tex':'\\cyrchar\\cyrje{}'},'\u0459':{'tex':'\\cyrchar\\cyrlje{}'},'\u045A':{'tex':'\\cyrchar\\cyrnje{}'},'\u045B':{'tex':'\\cyrchar\\cyrtshe{}'},'\u045C':{'tex':'\\cyrchar{\\\'\\cyrk}'},'\u045E':{'tex':'\\cyrchar\\cyrushrt{}'},'\u045F':{'tex':'\\cyrchar\\cyrdzhe{}'},'\u0460':{'tex':'\\cyrchar\\CYROMEGA{}'},'\u0461':{'tex':'\\cyrchar\\cyromega{}'},'\u0462':{'tex':'\\cyrchar\\CYRYAT{}'},'\u0464':{'tex':'\\cyrchar\\CYRIOTE{}'},'\u0465':{'tex':'\\cyrchar\\cyriote{}'},'\u0466':{'tex':'\\cyrchar\\CYRLYUS{}'},'\u0467':{'tex':'\\cyrchar\\cyrlyus{}'},'\u0468':{'tex':'\\cyrchar\\CYRIOTLYUS{}'},'\u0469':{'tex':'\\cyrchar\\cyriotlyus{}'},'\u046A':{'tex':'\\cyrchar\\CYRBYUS{}'},'\u046C':{'tex':'\\cyrchar\\CYRIOTBYUS{}'},'\u046D':{'tex':'\\cyrchar\\cyriotbyus{}'},'\u046E':{'tex':'\\cyrchar\\CYRKSI{}'},'\u046F':{'tex':'\\cyrchar\\cyrksi{}'},'\u0470':{'tex':'\\cyrchar\\CYRPSI{}'},'\u0471':{'tex':'\\cyrchar\\cyrpsi{}'},'\u0472':{'tex':'\\cyrchar\\CYRFITA{}'},'\u0474':{'tex':'\\cyrchar\\CYRIZH{}'},'\u0478':{'tex':'\\cyrchar\\CYRUK{}'},'\u0479':{'tex':'\\cyrchar\\cyruk{}'},'\u047A':{'tex':'\\cyrchar\\CYROMEGARND{}'},'\u047B':{'tex':'\\cyrchar\\cyromegarnd{}'},'\u047C':{'tex':'\\cyrchar\\CYROMEGATITLO{}'},'\u047D':{'tex':'\\cyrchar\\cyromegatitlo{}'},'\u047E':{'tex':'\\cyrchar\\CYROT{}'},'\u047F':{'tex':'\\cyrchar\\cyrot{}'},'\u0480':{'tex':'\\cyrchar\\CYRKOPPA{}'},'\u0481':{'tex':'\\cyrchar\\cyrkoppa{}'},'\u0482':{'tex':'\\cyrchar\\cyrthousands{}'},'\u0488':{'tex':'\\cyrchar\\cyrhundredthousands{}'},'\u0489':{'tex':'\\cyrchar\\cyrmillions{}'},'\u048C':{'tex':'\\cyrchar\\CYRSEMISFTSN{}'},'\u048D':{'tex':'\\cyrchar\\cyrsemisftsn{}'},'\u048E':{'tex':'\\cyrchar\\CYRRTICK{}'},'\u048F':{'tex':'\\cyrchar\\cyrrtick{}'},'\u0490':{'tex':'\\cyrchar\\CYRGUP{}'},'\u0491':{'tex':'\\cyrchar\\cyrgup{}'},'\u0492':{'tex':'\\cyrchar\\CYRGHCRS{}'},'\u0493':{'tex':'\\cyrchar\\cyrghcrs{}'},'\u0494':{'tex':'\\cyrchar\\CYRGHK{}'},'\u0495':{'tex':'\\cyrchar\\cyrghk{}'},'\u0496':{'tex':'\\cyrchar\\CYRZHDSC{}'},'\u0497':{'tex':'\\cyrchar\\cyrzhdsc{}'},'\u0498':{'tex':'\\cyrchar\\CYRZDSC{}'},'\u0499':{'tex':'\\cyrchar\\cyrzdsc{}'},'\u049A':{'tex':'\\cyrchar\\CYRKDSC{}'},'\u049B':{'tex':'\\cyrchar\\cyrkdsc{}'},'\u049C':{'tex':'\\cyrchar\\CYRKVCRS{}'},'\u049D':{'tex':'\\cyrchar\\cyrkvcrs{}'},'\u049E':{'tex':'\\cyrchar\\CYRKHCRS{}'},'\u049F':{'tex':'\\cyrchar\\cyrkhcrs{}'},'\u04A0':{'tex':'\\cyrchar\\CYRKBEAK{}'},'\u04A1':{'tex':'\\cyrchar\\cyrkbeak{}'},'\u04A2':{'tex':'\\cyrchar\\CYRNDSC{}'},'\u04A3':{'tex':'\\cyrchar\\cyrndsc{}'},'\u04A4':{'tex':'\\cyrchar\\CYRNG{}'},'\u04A5':{'tex':'\\cyrchar\\cyrng{}'},'\u04A6':{'tex':'\\cyrchar\\CYRPHK{}'},'\u04A7':{'tex':'\\cyrchar\\cyrphk{}'},'\u04A8':{'tex':'\\cyrchar\\CYRABHHA{}'},'\u04A9':{'tex':'\\cyrchar\\cyrabhha{}'},'\u04AA':{'tex':'\\cyrchar\\CYRSDSC{}'},'\u04AB':{'tex':'\\cyrchar\\cyrsdsc{}'},'\u04AC':{'tex':'\\cyrchar\\CYRTDSC{}'},'\u04AD':{'tex':'\\cyrchar\\cyrtdsc{}'},'\u04AE':{'tex':'\\cyrchar\\CYRY{}'},'\u04AF':{'tex':'\\cyrchar\\cyry{}'},'\u04B0':{'tex':'\\cyrchar\\CYRYHCRS{}'},'\u04B1':{'tex':'\\cyrchar\\cyryhcrs{}'},'\u04B2':{'tex':'\\cyrchar\\CYRHDSC{}'},'\u04B3':{'tex':'\\cyrchar\\cyrhdsc{}'},'\u04B4':{'tex':'\\cyrchar\\CYRTETSE{}'},'\u04B5':{'tex':'\\cyrchar\\cyrtetse{}'},'\u04B6':{'tex':'\\cyrchar\\CYRCHRDSC{}'},'\u04B7':{'tex':'\\cyrchar\\cyrchrdsc{}'},'\u04B8':{'tex':'\\cyrchar\\CYRCHVCRS{}'},'\u04B9':{'tex':'\\cyrchar\\cyrchvcrs{}'},'\u04BA':{'tex':'\\cyrchar\\CYRSHHA{}'},'\u04BB':{'tex':'\\cyrchar\\cyrshha{}'},'\u04BC':{'tex':'\\cyrchar\\CYRABHCH{}'},'\u04BD':{'tex':'\\cyrchar\\cyrabhch{}'},'\u04BE':{'tex':'\\cyrchar\\CYRABHCHDSC{}'},'\u04BF':{'tex':'\\cyrchar\\cyrabhchdsc{}'},'\u04C0':{'tex':'\\cyrchar\\CYRpalochka{}'},'\u04C3':{'tex':'\\cyrchar\\CYRKHK{}'},'\u04C4':{'tex':'\\cyrchar\\cyrkhk{}'},'\u04C7':{'tex':'\\cyrchar\\CYRNHK{}'},'\u04C8':{'tex':'\\cyrchar\\cyrnhk{}'},'\u04CB':{'tex':'\\cyrchar\\CYRCHLDSC{}'},'\u04CC':{'tex':'\\cyrchar\\cyrchldsc{}'},'\u04D4':{'tex':'\\cyrchar\\CYRAE{}'},'\u04D5':{'tex':'\\cyrchar\\cyrae{}'},'\u04D8':{'tex':'\\cyrchar\\CYRSCHWA{}'},'\u04D9':{'tex':'\\cyrchar\\cyrschwa{}'},'\u04E0':{'tex':'\\cyrchar\\CYRABHDZE{}'},'\u04E1':{'tex':'\\cyrchar\\cyrabhdze{}'},'\u04E8':{'tex':'\\cyrchar\\CYROTLD{}'},'\u04E9':{'tex':'\\cyrchar\\cyrotld{}'},'\u0871':{'tex':'\\\\backslash{}','math':true},'\u1E02':{'tex':'\\.{B}'},'\u1E03':{'tex':'\\.{b}'},'\u1E04':{'tex':'{\\d B}'},'\u1E05':{'tex':'{\\d b}'},'\u1E06':{'tex':'{\\b B}'},'\u1E07':{'tex':'{\\b b}'},'\u1E0A':{'tex':'\\.{D}'},'\u1E0B':{'tex':'\\.{d}'},'\u1E0C':{'tex':'{\\d D}'},'\u1E0D':{'tex':'{\\d d}'},'\u1E0E':{'tex':'{\\b D}'},'\u1E0F':{'tex':'{\\b d}'},'\u1E10':{'tex':'{\\c D}'},'\u1E11':{'tex':'{\\c d}'},'\u1E1E':{'tex':'\\.{F}'},'\u1E1F':{'tex':'\\.{f}'},'\u1E20':{'tex':'\\=G'},'\u1E21':{'tex':'\\=g'},'\u1E22':{'tex':'\\.{H}'},'\u1E23':{'tex':'\\.{h}'},'\u1E24':{'tex':'{\\d H}'},'\u1E25':{'tex':'{\\d h}'},'\u1E26':{'tex':'\\"H'},'\u1E27':{'tex':'\\"h'},'\u1E28':{'tex':'{\\c H}'},'\u1E29':{'tex':'{\\c h}'},'\u1E30':{'tex':'\\\'K'},'\u1E31':{'tex':'\\\'k'},'\u1E32':{'tex':'{\\d K}'},'\u1E33':{'tex':'{\\d k}'},'\u1E34':{'tex':'{\\b K}'},'\u1E35':{'tex':'{\\b k}'},'\u1E36':{'tex':'{\\d L}'},'\u1E37':{'tex':'{\\d l}'},'\u1E3A':{'tex':'{\\b L}'},'\u1E3B':{'tex':'{\\b l}'},'\u1E3E':{'tex':'\\\'M'},'\u1E3F':{'tex':'\\\'m'},'\u1E40':{'tex':'\\.{M}'},'\u1E41':{'tex':'\\.{m}'},'\u1E42':{'tex':'{\\d M}'},'\u1E43':{'tex':'{\\d m}'},'\u1E44':{'tex':'\\.{N}'},'\u1E45':{'tex':'\\.{n}'},'\u1E46':{'tex':'{\\d N}'},'\u1E47':{'tex':'{\\d n}'},'\u1E48':{'tex':'{\\b N}'},'\u1E49':{'tex':'{\\b n}'},'\u1E54':{'tex':'\\\'P'},'\u1E55':{'tex':'\\\'p'},'\u1E56':{'tex':'\\.{P}'},'\u1E57':{'tex':'\\.{p}'},'\u1E58':{'tex':'\\.{R}'},'\u1E59':{'tex':'\\.{r}'},'\u1E5A':{'tex':'{\\d R}'},'\u1E5B':{'tex':'{\\d r}'},'\u1E5E':{'tex':'{\\b R}'},'\u1E5F':{'tex':'{\\b r}'},'\u1E60':{'tex':'\\.{S}'},'\u1E61':{'tex':'\\.{s}'},'\u1E62':{'tex':'{\\d S}'},'\u1E63':{'tex':'{\\d s}'},'\u1E6A':{'tex':'\\.{T}'},'\u1E6B':{'tex':'\\.{t}'},'\u1E6C':{'tex':'{\\d T}'},'\u1E6D':{'tex':'{\\d t}'},'\u1E6E':{'tex':'{\\b T}'},'\u1E6F':{'tex':'{\\b t}'},'\u1E7C':{'tex':'\\~V'},'\u1E7D':{'tex':'\\~v'},'\u1E7E':{'tex':'{\\d V}'},'\u1E7F':{'tex':'{\\d v}'},'\u1E80':{'tex':'\\`W'},'\u1E81':{'tex':'\\`w'},'\u1E82':{'tex':'\\\'W'},'\u1E83':{'tex':'\\\'w'},'\u1E84':{'tex':'\\"W'},'\u1E85':{'tex':'\\"w'},'\u1E86':{'tex':'\\.{W}'},'\u1E87':{'tex':'\\.{w}'},'\u1E88':{'tex':'{\\d W}'},'\u1E89':{'tex':'{\\d w}'},'\u1E8A':{'tex':'\\.{X}'},'\u1E8B':{'tex':'\\.{x}'},'\u1E8C':{'tex':'\\"X'},'\u1E8D':{'tex':'\\"x'},'\u1E8E':{'tex':'\\.{Y}'},'\u1E8F':{'tex':'\\.{y}'},'\u1E90':{'tex':'\\^Z'},'\u1E91':{'tex':'\\^z'},'\u1E92':{'tex':'{\\d Z}'},'\u1E93':{'tex':'{\\d z}'},'\u1E94':{'tex':'{\\b Z}'},'\u1E95':{'tex':'{\\b z}'},'\u1E96':{'tex':'{\\b h}'},'\u1E97':{'tex':'\\"t'},'\u1E98':{'tex':'{\\r w}'},'\u1E99':{'tex':'{\\r y}'},'\u1EA0':{'tex':'{\\d A}'},'\u1EA1':{'tex':'{\\d a}'},'\u1EB8':{'tex':'{\\d E}'},'\u1EB9':{'tex':'{\\d e}'},'\u1EBC':{'tex':'\\~E'},'\u1EBD':{'tex':'\\~e'},'\u1ECA':{'tex':'{\\d I}'},'\u1ECB':{'tex':'{\\d i}'},'\u1ECC':{'tex':'{\\d O}'},'\u1ECD':{'tex':'{\\d o}'},'\u1EE4':{'tex':'{\\d U}'},'\u1EE5':{'tex':'{\\d u}'},'\u1EF2':{'tex':'\\`Y'},'\u1EF3':{'tex':'\\`y'},'\u1EF4':{'tex':'{\\d Y}'},'\u1EF5':{'tex':'{\\d y}'},'\u1EF8':{'tex':'\\~Y'},'\u1EF9':{'tex':'\\~y'},'\u2002':{'tex':'\\hspace{0.6em}','space':true},'\u2003':{'tex':'\\quad{}','math':true,'space':true},'\u2004':{'tex':'\\;','space':true},'\u2005':{'tex':'\\hspace{0.25em}','space':true},'\u2006':{'tex':'\\hspace{0.166em}','space':true},'\u2007':{'tex':'\\hphantom{0}','space':true},'\u2008':{'tex':'\\hphantom{,}','space':true},'\u2009':{'tex':'\\,','space':true},'\u200A':{'tex':'\\mkern1mu{}','math':true,'space':true},'\u200B':{'tex':'\\mbox{}','space':true},'\u200C':{'tex':'{\\aftergroup\\ignorespaces}'},'\u2010':{'tex':'-'},'\u2011':{'tex':'-'},'\u2012':{'tex':'-'},'\u2013':{'tex':'\\textendash{}'},'\u2014':{'tex':'\\textemdash{}'},'\u2015':{'tex':'\\rule{1em}{1pt}'},'\u2016':{'tex':'\\Vert{}','math':true},'\u2017':{'tex':'\\twolowline{}','math':true},'\u2018':{'tex':'`'},'\u2019':{'tex':'\''},'\u201A':{'tex':','},'\u201B':{'tex':'\\Elzreapos{}','math':true},'\u201C':{'tex':'``'},'\u201D':{'tex':'\'\''},'\u201E':{'tex':',,'},'\u201F':{'tex':'\\quotedblbase{}'},'\u2020':{'tex':'\\textdagger{}'},'\u2021':{'tex':'\\textdaggerdbl{}'},'\u2022':{'tex':'\\textbullet{}'},'\u2023':{'tex':'>'},'\u2024':{'tex':'.'},'\u2025':{'tex':'..'},'\u2026':{'tex':'\\ldots{}'},'\u2027':{'tex':'-'},'\u202F':{'tex':' ','space':true},'\u2030':{'tex':'\\textperthousand{}'},'\u2031':{'tex':'\\textpertenthousand{}'},'\u2032':{'tex':'{\'}','math':true},'\u2033':{'tex':'{\'\'}','math':true},'\u2034':{'tex':'{\'\'\'}','math':true},'\u2035':{'tex':'\\backprime{}','math':true},'\u2036':{'tex':'\\backdprime{}','math':true},'\u2037':{'tex':'\\backtrprime{}','math':true},'\u2038':{'tex':'\\caretinsert{}','math':true},'\u2039':{'tex':'\\guilsinglleft{}'},'\u203A':{'tex':'\\guilsinglright{}'},'\u203C':{'tex':'\\Exclam{}','math':true},'\u203E':{'tex':'-'},'\u2040':{'tex':'\\cat{}','math':true},'\u2043':{'tex':'\\hyphenbullet{}','math':true},'\u2044':{'tex':'\\fracslash{}','math':true},'\u2047':{'tex':'\\Question{}','math':true},'\u2048':{'tex':'?!'},'\u2049':{'tex':'!?'},'\u204A':{'tex':'7'},'\u2050':{'tex':'\\closure{}','math':true},'\u2057':{'tex':'\'\'\'\'','math':true},'\u205F':{'tex':'\\:','space':true},'\u2060':{'tex':'\\nolinebreak{}'},'\u2070':{'tex':'^{0}','math':true},'\u2074':{'tex':'^{4}','math':true},'\u2075':{'tex':'^{5}','math':true},'\u2076':{'tex':'^{6}','math':true},'\u2077':{'tex':'^{7}','math':true},'\u2078':{'tex':'^{8}','math':true},'\u2079':{'tex':'^{9}','math':true},'\u207A':{'tex':'^{+}','math':true},'\u207B':{'tex':'^{-}','math':true},'\u207C':{'tex':'^{=}','math':true},'\u207D':{'tex':'^{(}','math':true},'\u207E':{'tex':'^{)}','math':true},'\u207F':{'tex':'^{n}','math':true},'\u2080':{'tex':'_{0}','math':true},'\u2081':{'tex':'_{1}','math':true},'\u2082':{'tex':'_{2}','math':true},'\u2083':{'tex':'_{3}','math':true},'\u2084':{'tex':'_{4}','math':true},'\u2085':{'tex':'_{5}','math':true},'\u2086':{'tex':'_{6}','math':true},'\u2087':{'tex':'_{7}','math':true},'\u2088':{'tex':'_{8}','math':true},'\u2089':{'tex':'_{9}','math':true},'\u208A':{'tex':'_{+}','math':true},'\u208B':{'tex':'_{-}','math':true},'\u208C':{'tex':'_{=}','math':true},'\u208D':{'tex':'_{(}','math':true},'\u208E':{'tex':'_{)}','math':true},'\u20A7':{'tex':'\\ensuremath{\\Elzpes}'},'\u20AC':{'tex':'\\texteuro{}'},'\u20D0':{'tex':'\\lvec{}','math':true},'\u20D1':{'tex':'\\vec{}','math':true},'\u20D2':{'tex':'\\vertoverlay{}','math':true},'\u20D6':{'tex':'\\LVec{}','math':true},'\u20D7':{'tex':'\\vec{}','math':true},'\u20DB':{'tex':'\\dddot{}','math':true},'\u20DC':{'tex':'\\ddddot{}','math':true},'\u20DD':{'tex':'\\enclosecircle{}','math':true},'\u20DE':{'tex':'\\enclosesquare{}','math':true},'\u20DF':{'tex':'\\enclosediamond{}','math':true},'\u20E1':{'tex':'\\overleftrightarrow{}','math':true},'\u20E4':{'tex':'\\enclosetriangle{}','math':true},'\u20E7':{'tex':'\\annuity{}','math':true},'\u20E8':{'tex':'\\threeunderdot{}','math':true},'\u20E9':{'tex':'\\widebridgeabove{}','math':true},'\u20EC':{'tex':'\\underrightharpoondown{}','math':true},'\u20ED':{'tex':'\\underleftharpoondown{}','math':true},'\u20EE':{'tex':'\\underleftarrow{}','math':true},'\u20EF':{'tex':'\\underrightarrow{}','math':true},'\u20F0':{'tex':'\\asteraccent{}','math':true},'\u2100':{'tex':'a/c'},'\u2101':{'tex':'a/s'},'\u2102':{'tex':'\\mathbb{C}','math':true},'\u2103':{'tex':'\\textcelsius{}'},'\u2105':{'tex':'c/o'},'\u2106':{'tex':'c/u'},'\u2107':{'tex':'\\Euler{}','math':true},'\u2109':{'tex':'F'},'\u210A':{'tex':'\\mathscr{g}','math':true},'\u210B':{'tex':'\\mathscr{H}','math':true},'\u210C':{'tex':'\\mathfrak{H}','math':true},'\u210D':{'tex':'\\mathbb{H}','math':true},'\u210E':{'tex':'\\Planckconst{}','math':true},'\u210F':{'tex':'\\hslash{}','math':true},'\u2110':{'tex':'\\mathscr{I}','math':true},'\u2111':{'tex':'\\mathfrak{I}','math':true},'\u2112':{'tex':'\\mathscr{L}','math':true},'\u2113':{'tex':'\\mathscr{l}','math':true},'\u2115':{'tex':'\\mathbb{N}','math':true},'\u2116':{'tex':'\\cyrchar\\textnumero{}'},'\u2117':{'tex':'\\textcircledP{}'},'\u2118':{'tex':'\\wp{}','math':true},'\u2119':{'tex':'\\mathbb{P}','math':true},'\u211A':{'tex':'\\mathbb{Q}','math':true},'\u211B':{'tex':'\\mathscr{R}','math':true},'\u211C':{'tex':'\\mathfrak{R}','math':true},'\u211D':{'tex':'\\mathbb{R}','math':true},'\u211E':{'tex':'\\Elzxrat{}','math':true},'\u2120':{'tex':'\\textservicemark{}'},'\u2121':{'tex':'TEL'},'\u2122':{'tex':'\\texttrademark{}'},'\u2124':{'tex':'\\mathbb{Z}','math':true},'\u2127':{'tex':'\\mho{}','math':true},'\u2128':{'tex':'\\mathfrak{Z}','math':true},'\u2129':{'tex':'\\ElsevierGlyph{2129}','math':true},'K':{'tex':'K'},'\u212C':{'tex':'\\mathscr{B}','math':true},'\u212D':{'tex':'\\mathfrak{C}','math':true},'\u212E':{'tex':'\\textestimated{}'},'\u212F':{'tex':'\\mathscr{e}','math':true},'\u2130':{'tex':'\\mathscr{E}','math':true},'\u2131':{'tex':'\\mathscr{F}','math':true},'\u2132':{'tex':'\\Finv{}','math':true},'\u2133':{'tex':'\\mathscr{M}','math':true},'\u2134':{'tex':'\\mathscr{o}','math':true},'\u2135':{'tex':'\\aleph{}','math':true},'\u2136':{'tex':'\\beth{}','math':true},'\u2137':{'tex':'\\gimel{}','math':true},'\u2138':{'tex':'\\daleth{}','math':true},'\u213C':{'tex':'\\mathbb{\\pi}','math':true},'\u213D':{'tex':'\\mathbb{\\gamma}','math':true},'\u213E':{'tex':'\\mathbb{\\Gamma}','math':true},'\u213F':{'tex':'\\mathbb{\\Pi}','math':true},'\u2140':{'tex':'\\mathbb{\\Sigma}','math':true},'\u2141':{'tex':'\\Game{}','math':true},'\u2142':{'tex':'\\sansLturned{}','math':true},'\u2143':{'tex':'\\sansLmirrored{}','math':true},'\u2144':{'tex':'\\Yup{}','math':true},'\u2145':{'tex':'\\CapitalDifferentialD{}','math':true},'\u2146':{'tex':'\\DifferentialD{}','math':true},'\u2147':{'tex':'\\ExponetialE{}','math':true},'\u2148':{'tex':'\\ComplexI{}','math':true},'\u2149':{'tex':'\\ComplexJ{}','math':true},'\u214A':{'tex':'\\PropertyLine{}','math':true},'\u214B':{'tex':'\\invamp{}','math':true},'\u2153':{'tex':'\\textfrac{1}{3}','math':true},'\u2154':{'tex':'\\textfrac{2}{3}','math':true},'\u2155':{'tex':'\\textfrac{1}{5}','math':true},'\u2156':{'tex':'\\textfrac{2}{5}','math':true},'\u2157':{'tex':'\\textfrac{3}{5}','math':true},'\u2158':{'tex':'\\textfrac{4}{5}','math':true},'\u2159':{'tex':'\\textfrac{1}{6}','math':true},'\u215A':{'tex':'\\textfrac{5}{6}','math':true},'\u215B':{'tex':'\\textfrac{1}{8}','math':true},'\u215C':{'tex':'\\textfrac{3}{8}','math':true},'\u215D':{'tex':'\\textfrac{5}{8}','math':true},'\u215E':{'tex':'\\textfrac{7}{8}','math':true},'\u215F':{'tex':' 1/'},'\u2160':{'tex':'I'},'\u2161':{'tex':'II'},'\u2162':{'tex':'III'},'\u2163':{'tex':'IV'},'\u2164':{'tex':'V'},'\u2165':{'tex':'VI'},'\u2166':{'tex':'VII'},'\u2167':{'tex':'VIII'},'\u2168':{'tex':'IX'},'\u2169':{'tex':'X'},'\u216A':{'tex':'XI'},'\u216B':{'tex':'XII'},'\u216C':{'tex':'L'},'\u216D':{'tex':'C'},'\u216E':{'tex':'D'},'\u216F':{'tex':'M'},'\u2170':{'tex':'i'},'\u2171':{'tex':'ii'},'\u2172':{'tex':'iii'},'\u2173':{'tex':'iv'},'\u2174':{'tex':'v'},'\u2175':{'tex':'vi'},'\u2176':{'tex':'vii'},'\u2177':{'tex':'viii'},'\u2178':{'tex':'ix'},'\u2179':{'tex':'x'},'\u217A':{'tex':'xi'},'\u217B':{'tex':'xii'},'\u217C':{'tex':'l'},'\u217D':{'tex':'c'},'\u217E':{'tex':'d'},'\u217F':{'tex':'m'},'\u2190':{'tex':'\\leftarrow{}','math':true},'\u2191':{'tex':'\\uparrow{}','math':true},'\u2192':{'tex':'\\rightarrow{}','math':true},'\u2193':{'tex':'\\downarrow{}','math':true},'\u2194':{'tex':'\\leftrightarrow{}','math':true},'\u2195':{'tex':'\\updownarrow{}','math':true},'\u2196':{'tex':'\\nwarrow{}','math':true},'\u2197':{'tex':'\\nearrow{}','math':true},'\u2198':{'tex':'\\searrow{}','math':true},'\u2199':{'tex':'\\swarrow{}','math':true},'\u219A':{'tex':'\\nleftarrow{}','math':true},'\u219B':{'tex':'\\nrightarrow{}','math':true},'\u219C':{'tex':'\\arrowwaveleft{}','math':true},'\u219D':{'tex':'\\arrowwaveright{}','math':true},'\u219E':{'tex':'\\twoheadleftarrow{}','math':true},'\u219F':{'tex':'\\twoheaduparrow{}','math':true},'\u21A0':{'tex':'\\twoheadrightarrow{}','math':true},'\u21A1':{'tex':'\\twoheaddownarrow{}','math':true},'\u21A2':{'tex':'\\leftarrowtail{}','math':true},'\u21A3':{'tex':'\\rightarrowtail{}','math':true},'\u21A4':{'tex':'\\mapsfrom{}','math':true},'\u21A5':{'tex':'\\MapsUp{}','math':true},'\u21A6':{'tex':'\\mapsto{}','math':true},'\u21A7':{'tex':'\\MapsDown{}','math':true},'\u21A8':{'tex':'\\updownarrowbar{}','math':true},'\u21A9':{'tex':'\\hookleftarrow{}','math':true},'\u21AA':{'tex':'\\hookrightarrow{}','math':true},'\u21AB':{'tex':'\\looparrowleft{}','math':true},'\u21AC':{'tex':'\\looparrowright{}','math':true},'\u21AD':{'tex':'\\leftrightsquigarrow{}','math':true},'\u21AE':{'tex':'\\nleftrightarrow{}','math':true},'\u21AF':{'tex':'\\lightning{}','math':true},'\u21B0':{'tex':'\\Lsh{}','math':true},'\u21B1':{'tex':'\\Rsh{}','math':true},'\u21B2':{'tex':'\\dlsh{}','math':true},'\u21B3':{'tex':'\\ElsevierGlyph{21B3}','math':true},'\u21B4':{'tex':'\\linefeed{}','math':true},'\u21B5':{'tex':'\\carriagereturn{}','math':true},'\u21B6':{'tex':'\\curvearrowleft{}','math':true},'\u21B7':{'tex':'\\curvearrowright{}','math':true},'\u21B8':{'tex':'\\barovernorthwestarrow{}','math':true},'\u21B9':{'tex':'\\barleftarrowrightarrowba{}','math':true},'\u21BA':{'tex':'\\circlearrowleft{}','math':true},'\u21BB':{'tex':'\\circlearrowright{}','math':true},'\u21BC':{'tex':'\\leftharpoonup{}','math':true},'\u21BD':{'tex':'\\leftharpoondown{}','math':true},'\u21BE':{'tex':'\\upharpoonright{}','math':true},'\u21BF':{'tex':'\\upharpoonleft{}','math':true},'\u21C0':{'tex':'\\rightharpoonup{}','math':true},'\u21C1':{'tex':'\\rightharpoondown{}','math':true},'\u21C2':{'tex':'\\downharpoonright{}','math':true},'\u21C3':{'tex':'\\downharpoonleft{}','math':true},'\u21C4':{'tex':'\\rightleftarrows{}','math':true},'\u21C5':{'tex':'\\dblarrowupdown{}','math':true},'\u21C6':{'tex':'\\leftrightarrows{}','math':true},'\u21C7':{'tex':'\\leftleftarrows{}','math':true},'\u21C8':{'tex':'\\upuparrows{}','math':true},'\u21C9':{'tex':'\\rightrightarrows{}','math':true},'\u21CA':{'tex':'\\downdownarrows{}','math':true},'\u21CB':{'tex':'\\leftrightharpoons{}','math':true},'\u21CC':{'tex':'\\rightleftharpoons{}','math':true},'\u21CD':{'tex':'\\nLeftarrow{}','math':true},'\u21CE':{'tex':'\\nLeftrightarrow{}','math':true},'\u21CF':{'tex':'\\nRightarrow{}','math':true},'\u21D0':{'tex':'\\Leftarrow{}','math':true},'\u21D1':{'tex':'\\Uparrow{}','math':true},'\u21D2':{'tex':'\\Rightarrow{}','math':true},'\u21D3':{'tex':'\\Downarrow{}','math':true},'\u21D4':{'tex':'\\Leftrightarrow{}','math':true},'\u21D5':{'tex':'\\Updownarrow{}','math':true},'\u21D6':{'tex':'\\Nwarrow{}','math':true},'\u21D7':{'tex':'\\Nearrow{}','math':true},'\u21D8':{'tex':'\\Searrow{}','math':true},'\u21D9':{'tex':'\\Swarrow{}','math':true},'\u21DA':{'tex':'\\Lleftarrow{}','math':true},'\u21DB':{'tex':'\\Rrightarrow{}','math':true},'\u21DC':{'tex':'\\leftsquigarrow{}','math':true},'\u21DD':{'tex':'\\rightsquigarrow{}','math':true},'\u21DE':{'tex':'\\nHuparrow{}','math':true},'\u21DF':{'tex':'\\nHdownarrow{}','math':true},'\u21E0':{'tex':'\\dashleftarrow{}','math':true},'\u21E1':{'tex':'\\updasharrow{}','math':true},'\u21E2':{'tex':'\\dashrightarrow{}','math':true},'\u21E3':{'tex':'\\downdasharrow{}','math':true},'\u21E4':{'tex':'\\LeftArrowBar{}','math':true},'\u21E5':{'tex':'\\RightArrowBar{}','math':true},'\u21E6':{'tex':'\\leftwhitearrow{}','math':true},'\u21E7':{'tex':'\\upwhitearrow{}','math':true},'\u21E8':{'tex':'\\rightwhitearrow{}','math':true},'\u21E9':{'tex':'\\downwhitearrow{}','math':true},'\u21EA':{'tex':'\\whitearrowupfrombar{}','math':true},'\u21F4':{'tex':'\\circleonrightarrow{}','math':true},'\u21F5':{'tex':'\\DownArrowUpArrow{}','math':true},'\u21F6':{'tex':'\\rightthreearrows{}','math':true},'\u21F7':{'tex':'\\nvleftarrow{}','math':true},'\u21F8':{'tex':'\\pfun{}','math':true},'\u21F9':{'tex':'\\nvleftrightarrow{}','math':true},'\u21FA':{'tex':'\\nVleftarrow{}','math':true},'\u21FB':{'tex':'\\ffun{}','math':true},'\u21FC':{'tex':'\\nVleftrightarrow{}','math':true},'\u21FD':{'tex':'\\leftarrowtriangle{}','math':true},'\u21FE':{'tex':'\\rightarrowtriangle{}','math':true},'\u21FF':{'tex':'\\leftrightarrowtriangle{}','math':true},'\u2200':{'tex':'\\forall{}','math':true},'\u2201':{'tex':'\\complement{}','math':true},'\u2202':{'tex':'\\partial{}','math':true},'\u2203':{'tex':'\\exists{}','math':true},'\u2204':{'tex':'\\nexists{}','math':true},'\u2205':{'tex':'\\varnothing{}','math':true},'\u2206':{'tex':'\\increment{}','math':true},'\u2207':{'tex':'\\nabla{}','math':true},'\u2208':{'tex':'\\in{}','math':true},'\u2209':{'tex':'\\not\\in{}','math':true},'\u220A':{'tex':'\\smallin{}','math':true},'\u220B':{'tex':'\\ni{}','math':true},'\u220C':{'tex':'\\not\\ni{}','math':true},'\u220D':{'tex':'\\smallni{}','math':true},'\u220E':{'tex':'\\QED{}','math':true},'\u220F':{'tex':'\\prod{}','math':true},'\u2210':{'tex':'\\coprod{}','math':true},'\u2211':{'tex':'\\sum{}','math':true},'\u2212':{'tex':'-'},'\u2213':{'tex':'\\mp{}','math':true},'\u2214':{'tex':'\\dotplus{}','math':true},'\u2215':{'tex':'\\slash{}','math':true},'\u2216':{'tex':'\\setminus{}','math':true},'\u2217':{'tex':'{_\\ast}','math':true},'\u2218':{'tex':'\\circ{}','math':true},'\u2219':{'tex':'\\bullet{}','math':true},'\u221A':{'tex':'\\surd{}','math':true},'\u221B':{'tex':'\\sqrt[3]','math':true},'\u221C':{'tex':'\\sqrt[4]','math':true},'\u221D':{'tex':'\\propto{}','math':true},'\u221E':{'tex':'\\infty{}','math':true},'\u221F':{'tex':'\\rightangle{}','math':true},'\u2220':{'tex':'\\angle{}','math':true},'\u2221':{'tex':'\\measuredangle{}','math':true},'\u2222':{'tex':'\\sphericalangle{}','math':true},'\u2223':{'tex':'\\mid{}','math':true},'\u2224':{'tex':'\\nmid{}','math':true},'\u2225':{'tex':'\\parallel{}','math':true},'\u2226':{'tex':'\\nparallel{}','math':true},'\u2227':{'tex':'\\wedge{}','math':true},'\u2228':{'tex':'\\vee{}','math':true},'\u2229':{'tex':'\\cap{}','math':true},'\u222A':{'tex':'\\cup{}','math':true},'\u222B':{'tex':'\\int{}','math':true},'\u222C':{'tex':'{\\int\\!\\int}','math':true},'\u222D':{'tex':'{\\int\\!\\int\\!\\int}','math':true},'\u222E':{'tex':'\\oint{}','math':true},'\u222F':{'tex':'\\surfintegral{}','math':true},'\u2230':{'tex':'\\volintegral{}','math':true},'\u2231':{'tex':'\\clwintegral{}','math':true},'\u2232':{'tex':'\\ElsevierGlyph{2232}','math':true},'\u2233':{'tex':'\\ElsevierGlyph{2233}','math':true},'\u2234':{'tex':'\\therefore{}','math':true},'\u2235':{'tex':'\\because{}','math':true},'\u2236':{'tex':':','math':true},'\u2237':{'tex':'\\Colon{}','math':true},'\u2238':{'tex':'\\ElsevierGlyph{2238}','math':true},'\u2239':{'tex':'\\eqcolon{}','math':true},'\u223A':{'tex':'\\mathbin{{:}\\!\\!{-}\\!\\!{:}}','math':true},'\u223B':{'tex':'\\homothetic{}','math':true},'\u223C':{'tex':'\\sim{}','math':true},'\u223D':{'tex':'\\backsim{}','math':true},'\u223E':{'tex':'\\lazysinv{}','math':true},'\u223F':{'tex':'\\AC{}','math':true},'\u2240':{'tex':'\\wr{}','math':true},'\u2241':{'tex':'\\not\\sim{}','math':true},'\u2242':{'tex':'\\ElsevierGlyph{2242}','math':true},'\u2243':{'tex':'\\simeq{}','math':true},'\u2244':{'tex':'\\not\\simeq{}','math':true},'\u2245':{'tex':'\\cong{}','math':true},'\u2246':{'tex':'\\approxnotequal{}','math':true},'\u2247':{'tex':'\\not\\cong{}','math':true},'\u2248':{'tex':'\\approx{}','math':true},'\u2249':{'tex':'\\not\\approx{}','math':true},'\u224A':{'tex':'\\approxeq{}','math':true},'\u224B':{'tex':'\\tildetrpl{}','math':true},'\u224C':{'tex':'\\allequal{}','math':true},'\u224D':{'tex':'\\asymp{}','math':true},'\u224E':{'tex':'\\Bumpeq{}','math':true},'\u224F':{'tex':'\\bumpeq{}','math':true},'\u2250':{'tex':'\\doteq{}','math':true},'\u2251':{'tex':'\\doteqdot{}','math':true},'\u2252':{'tex':'\\fallingdotseq{}','math':true},'\u2253':{'tex':'\\risingdotseq{}','math':true},'\u2254':{'tex':':='},'\u2255':{'tex':'=:','math':true},'\u2256':{'tex':'\\eqcirc{}','math':true},'\u2257':{'tex':'\\circeq{}','math':true},'\u2258':{'tex':'\\arceq{}','math':true},'\u2259':{'tex':'\\estimates{}','math':true},'\u225A':{'tex':'\\ElsevierGlyph{225A}','math':true},'\u225B':{'tex':'\\starequal{}','math':true},'\u225C':{'tex':'\\triangleq{}','math':true},'\u225D':{'tex':'\\eqdef{}','math':true},'\u225E':{'tex':'\\measeq{}','math':true},'\u225F':{'tex':'\\ElsevierGlyph{225F}','math':true},'\u2260':{'tex':'\\not =','math':true},'\u2261':{'tex':'\\equiv{}','math':true},'\u2262':{'tex':'\\not\\equiv{}','math':true},'\u2263':{'tex':'\\Equiv{}','math':true},'\u2264':{'tex':'\\leq{}','math':true},'\u2265':{'tex':'\\geq{}','math':true},'\u2266':{'tex':'\\leqq{}','math':true},'\u2267':{'tex':'\\geqq{}','math':true},'\u2268':{'tex':'\\lneqq{}','math':true},'\u2269':{'tex':'\\gneqq{}','math':true},'\u226A':{'tex':'\\ll{}','math':true},'\u226B':{'tex':'\\gg{}','math':true},'\u226C':{'tex':'\\between{}','math':true},'\u226D':{'tex':'{\\not\\kern-0.3em\\times}','math':true},'\u226E':{'tex':'\\not<','math':true},'\u226F':{'tex':'\\not>','math':true},'\u2270':{'tex':'\\not\\leq{}','math':true},'\u2271':{'tex':'\\not\\geq{}','math':true},'\u2272':{'tex':'\\lessequivlnt{}','math':true},'\u2273':{'tex':'\\greaterequivlnt{}','math':true},'\u2274':{'tex':'\\ElsevierGlyph{2274}','math':true},'\u2275':{'tex':'\\ElsevierGlyph{2275}','math':true},'\u2276':{'tex':'\\lessgtr{}','math':true},'\u2277':{'tex':'\\gtrless{}','math':true},'\u2278':{'tex':'\\notlessgreater{}','math':true},'\u2279':{'tex':'\\notgreaterless{}','math':true},'\u227A':{'tex':'\\prec{}','math':true},'\u227B':{'tex':'\\succ{}','math':true},'\u227C':{'tex':'\\preccurlyeq{}','math':true},'\u227D':{'tex':'\\succcurlyeq{}','math':true},'\u227E':{'tex':'\\precapprox{}','math':true},'\u227F':{'tex':'\\succapprox{}','math':true},'\u2280':{'tex':'\\not\\prec{}','math':true},'\u2281':{'tex':'\\not\\succ{}','math':true},'\u2282':{'tex':'\\subset{}','math':true},'\u2283':{'tex':'\\supset{}','math':true},'\u2284':{'tex':'\\not\\subset{}','math':true},'\u2285':{'tex':'\\not\\supset{}','math':true},'\u2286':{'tex':'\\subseteq{}','math':true},'\u2287':{'tex':'\\supseteq{}','math':true},'\u2288':{'tex':'\\not\\subseteq{}','math':true},'\u2289':{'tex':'\\not\\supseteq{}','math':true},'\u228A':{'tex':'\\subsetneq{}','math':true},'\u228B':{'tex':'\\supsetneq{}','math':true},'\u228C':{'tex':'\\cupleftarrow{}','math':true},'\u228D':{'tex':'\\cupdot{}','math':true},'\u228E':{'tex':'\\uplus{}','math':true},'\u228F':{'tex':'\\sqsubset{}','math':true},'\u2290':{'tex':'\\sqsupset{}','math':true},'\u2291':{'tex':'\\sqsubseteq{}','math':true},'\u2292':{'tex':'\\sqsupseteq{}','math':true},'\u2293':{'tex':'\\sqcap{}','math':true},'\u2294':{'tex':'\\sqcup{}','math':true},'\u2295':{'tex':'\\oplus{}','math':true},'\u2296':{'tex':'\\ominus{}','math':true},'\u2297':{'tex':'\\otimes{}','math':true},'\u2298':{'tex':'\\oslash{}','math':true},'\u2299':{'tex':'\\odot{}','math':true},'\u229A':{'tex':'\\circledcirc{}','math':true},'\u229B':{'tex':'\\circledast{}','math':true},'\u229C':{'tex':'\\circledequal{}','math':true},'\u229D':{'tex':'\\circleddash{}','math':true},'\u229E':{'tex':'\\boxplus{}','math':true},'\u229F':{'tex':'\\boxminus{}','math':true},'\u22A0':{'tex':'\\boxtimes{}','math':true},'\u22A1':{'tex':'\\boxdot{}','math':true},'\u22A2':{'tex':'\\vdash{}','math':true},'\u22A3':{'tex':'\\dashv{}','math':true},'\u22A4':{'tex':'\\top{}','math':true},'\u22A5':{'tex':'\\perp{}','math':true},'\u22A6':{'tex':'\\assert{}','math':true},'\u22A7':{'tex':'\\truestate{}','math':true},'\u22A8':{'tex':'\\forcesextra{}','math':true},'\u22A9':{'tex':'\\Vdash{}','math':true},'\u22AA':{'tex':'\\Vvdash{}','math':true},'\u22AB':{'tex':'\\VDash{}','math':true},'\u22AC':{'tex':'\\nvdash{}','math':true},'\u22AD':{'tex':'\\nvDash{}','math':true},'\u22AE':{'tex':'\\nVdash{}','math':true},'\u22AF':{'tex':'\\nVDash{}','math':true},'\u22B0':{'tex':'\\prurel{}','math':true},'\u22B1':{'tex':'\\scurel{}','math':true},'\u22B2':{'tex':'\\vartriangleleft{}','math':true},'\u22B3':{'tex':'\\vartriangleright{}','math':true},'\u22B4':{'tex':'\\trianglelefteq{}','math':true},'\u22B5':{'tex':'\\trianglerighteq{}','math':true},'\u22B6':{'tex':'\\original{}','math':true},'\u22B7':{'tex':'\\image{}','math':true},'\u22B8':{'tex':'\\multimap{}','math':true},'\u22B9':{'tex':'\\hermitconjmatrix{}','math':true},'\u22BA':{'tex':'\\intercal{}','math':true},'\u22BB':{'tex':'\\veebar{}','math':true},'\u22BC':{'tex':'\\barwedge{}','math':true},'\u22BD':{'tex':'\\barvee{}','math':true},'\u22BE':{'tex':'\\rightanglearc{}','math':true},'\u22BF':{'tex':'\\varlrtriangle{}','math':true},'\u22C0':{'tex':'\\ElsevierGlyph{22C0}','math':true},'\u22C1':{'tex':'\\ElsevierGlyph{22C1}','math':true},'\u22C2':{'tex':'\\bigcap{}','math':true},'\u22C3':{'tex':'\\bigcup{}','math':true},'\u22C4':{'tex':'\\diamond{}','math':true},'\u22C5':{'tex':'\\cdot{}','math':true},'\u22C6':{'tex':'\\star{}','math':true},'\u22C7':{'tex':'\\divideontimes{}','math':true},'\u22C8':{'tex':'\\bowtie{}','math':true},'\u22C9':{'tex':'\\ltimes{}','math':true},'\u22CA':{'tex':'\\rtimes{}','math':true},'\u22CB':{'tex':'\\leftthreetimes{}','math':true},'\u22CC':{'tex':'\\rightthreetimes{}','math':true},'\u22CD':{'tex':'\\backsimeq{}','math':true},'\u22CE':{'tex':'\\curlyvee{}','math':true},'\u22CF':{'tex':'\\curlywedge{}','math':true},'\u22D0':{'tex':'\\Subset{}','math':true},'\u22D1':{'tex':'\\Supset{}','math':true},'\u22D2':{'tex':'\\Cap{}','math':true},'\u22D3':{'tex':'\\Cup{}','math':true},'\u22D4':{'tex':'\\pitchfork{}','math':true},'\u22D5':{'tex':'\\hash{}','math':true},'\u22D6':{'tex':'\\lessdot{}','math':true},'\u22D7':{'tex':'\\gtrdot{}','math':true},'\u22D8':{'tex':'\\verymuchless{}','math':true},'\u22D9':{'tex':'\\verymuchgreater{}','math':true},'\u22DA':{'tex':'\\lesseqgtr{}','math':true},'\u22DB':{'tex':'\\gtreqless{}','math':true},'\u22DC':{'tex':'\\eqless{}','math':true},'\u22DD':{'tex':'\\eqgtr{}','math':true},'\u22DE':{'tex':'\\curlyeqprec{}','math':true},'\u22DF':{'tex':'\\curlyeqsucc{}','math':true},'\u22E0':{'tex':'\\npreceq{}','math':true},'\u22E1':{'tex':'\\nsucceq{}','math':true},'\u22E2':{'tex':'\\not\\sqsubseteq{}','math':true},'\u22E3':{'tex':'\\not\\sqsupseteq{}','math':true},'\u22E4':{'tex':'\\sqsubsetneq{}','math':true},'\u22E5':{'tex':'\\Elzsqspne{}','math':true},'\u22E6':{'tex':'\\lnsim{}','math':true},'\u22E7':{'tex':'\\gnsim{}','math':true},'\u22E8':{'tex':'\\precedesnotsimilar{}','math':true},'\u22E9':{'tex':'\\succnsim{}','math':true},'\u22EA':{'tex':'\\ntriangleleft{}','math':true},'\u22EB':{'tex':'\\ntriangleright{}','math':true},'\u22EC':{'tex':'\\ntrianglelefteq{}','math':true},'\u22ED':{'tex':'\\ntrianglerighteq{}','math':true},'\u22EE':{'tex':'\\vdots{}','math':true},'\u22EF':{'tex':'\\cdots{}','math':true},'\u22F0':{'tex':'\\upslopeellipsis{}','math':true},'\u22F1':{'tex':'\\downslopeellipsis{}','math':true},'\u22F2':{'tex':'\\disin{}','math':true},'\u22F3':{'tex':'\\varisins{}','math':true},'\u22F4':{'tex':'\\isins{}','math':true},'\u22F5':{'tex':'\\isindot{}','math':true},'\u22F6':{'tex':'\\barin{}','math':true},'\u22F7':{'tex':'\\isinobar{}','math':true},'\u22F8':{'tex':'\\isinvb{}','math':true},'\u22F9':{'tex':'\\isinE{}','math':true},'\u22FA':{'tex':'\\nisd{}','math':true},'\u22FB':{'tex':'\\varnis{}','math':true},'\u22FC':{'tex':'\\nis{}','math':true},'\u22FD':{'tex':'\\varniobar{}','math':true},'\u22FE':{'tex':'\\niobar{}','math':true},'\u22FF':{'tex':'\\bagmember{}','math':true},'\u2300':{'tex':'\\diameter{}','math':true},'\u2302':{'tex':'\\house{}','math':true},'\u2305':{'tex':'\\barwedge{}'},'\u2306':{'tex':'\\perspcorrespond{}','math':true},'\u2308':{'tex':'\\lceil{}','math':true},'\u2309':{'tex':'\\rceil{}','math':true},'\u230A':{'tex':'\\lfloor{}','math':true},'\u230B':{'tex':'\\rfloor{}','math':true},'\u2310':{'tex':'\\invneg{}','math':true},'\u2311':{'tex':'\\wasylozenge{}','math':true},'\u2312':{'tex':'\\profline{}','math':true},'\u2313':{'tex':'\\profsurf{}','math':true},'\u2315':{'tex':'\\recorder{}','math':true},'\u2316':{'tex':'{\\mathchar"2208}','math':true},'\u2317':{'tex':'\\viewdata{}','math':true},'\u2319':{'tex':'\\turnednot{}','math':true},'\u231C':{'tex':'\\ulcorner{}','math':true},'\u231D':{'tex':'\\urcorner{}','math':true},'\u231E':{'tex':'\\llcorner{}','math':true},'\u231F':{'tex':'\\lrcorner{}','math':true},'\u2320':{'tex':'\\inttop{}','math':true},'\u2321':{'tex':'\\intbottom{}','math':true},'\u2322':{'tex':'\\frown{}','math':true},'\u2323':{'tex':'\\smile{}','math':true},'\u3008':{'tex':'\\langle{}','math':true},'\u3009':{'tex':'\\rangle{}','math':true},'\u232C':{'tex':'\\varhexagonlrbonds{}','math':true},'\u2332':{'tex':'\\conictaper{}','math':true},'\u2336':{'tex':'\\topbot{}','math':true},'\u2339':{'tex':'\\APLinv{}','math':true},'\u233D':{'tex':'\\ElsevierGlyph{E838}','math':true},'\u233F':{'tex':'\\notslash{}','math':true},'\u2340':{'tex':'\\notbackslash{}','math':true},'\u2347':{'tex':'\\APLleftarrowbox{}','math':true},'\u2348':{'tex':'\\APLrightarrowbox{}','math':true},'\u2349':{'tex':'\\invdiameter{}','math':true},'\u2350':{'tex':'\\APLuparrowbox{}','math':true},'\u2353':{'tex':'\\APLboxupcaret{}','math':true},'\u2357':{'tex':'\\APLdownarrowbox{}','math':true},'\u235D':{'tex':'\\APLcomment{}','math':true},'\u235E':{'tex':'\\APLinput{}','math':true},'\u235F':{'tex':'\\APLlog{}','math':true},'\u2370':{'tex':'\\APLboxquestion{}','math':true},'\u237C':{'tex':'\\rangledownzigzagarrow{}','math':true},'\u2394':{'tex':'\\hexagon{}','math':true},'\u239B':{'tex':'\\lparenuend{}','math':true},'\u239C':{'tex':'\\lparenextender{}','math':true},'\u239D':{'tex':'\\lparenlend{}','math':true},'\u239E':{'tex':'\\rparenuend{}','math':true},'\u239F':{'tex':'\\rparenextender{}','math':true},'\u23A0':{'tex':'\\rparenlend{}','math':true},'\u23A1':{'tex':'\\lbrackuend{}','math':true},'\u23A2':{'tex':'\\lbrackextender{}','math':true},'\u23A3':{'tex':'\\Elzdlcorn{}','math':true},'\u23A4':{'tex':'\\rbrackuend{}','math':true},'\u23A5':{'tex':'\\rbrackextender{}','math':true},'\u23A6':{'tex':'\\rbracklend{}','math':true},'\u23A7':{'tex':'\\lbraceuend{}','math':true},'\u23A8':{'tex':'\\lbracemid{}','math':true},'\u23A9':{'tex':'\\lbracelend{}','math':true},'\u23AA':{'tex':'\\vbraceextender{}','math':true},'\u23AB':{'tex':'\\rbraceuend{}','math':true},'\u23AC':{'tex':'\\rbracemid{}','math':true},'\u23AD':{'tex':'\\rbracelend{}','math':true},'\u23AE':{'tex':'\\intextender{}','math':true},'\u23AF':{'tex':'\\harrowextender{}','math':true},'\u23B0':{'tex':'\\lmoustache{}','math':true},'\u23B1':{'tex':'\\rmoustache{}','math':true},'\u23B2':{'tex':'\\sumtop{}','math':true},'\u23B3':{'tex':'\\sumbottom{}','math':true},'\u23B4':{'tex':'\\overbracket{}','math':true},'\u23B5':{'tex':'\\underbracket{}','math':true},'\u23B6':{'tex':'\\bbrktbrk{}','math':true},'\u23B7':{'tex':'\\sqrtbottom{}','math':true},'\u23B8':{'tex':'\\lvboxline{}','math':true},'\u23B9':{'tex':'\\rvboxline{}','math':true},'\u23CE':{'tex':'\\varcarriagereturn{}','math':true},'\u23DC':{'tex':'\\overparen{}','math':true},'\u23DD':{'tex':'\\underparen{}','math':true},'\u23DE':{'tex':'\\overbrace{}','math':true},'\u23DF':{'tex':'\\underbrace{}','math':true},'\u23E0':{'tex':'\\obrbrak{}','math':true},'\u23E1':{'tex':'\\ubrbrak{}','math':true},'\u23E2':{'tex':'\\trapezium{}','math':true},'\u23E3':{'tex':'\\benzenr{}','math':true},'\u23E4':{'tex':'\\strns{}','math':true},'\u23E5':{'tex':'\\fltns{}','math':true},'\u23E6':{'tex':'\\accurrent{}','math':true},'\u23E7':{'tex':'\\elinters{}','math':true},'\u2400':{'tex':'NUL'},'\u2401':{'tex':'SOH'},'\u2402':{'tex':'STX'},'\u2403':{'tex':'ETX'},'\u2404':{'tex':'EOT'},'\u2405':{'tex':'ENQ'},'\u2406':{'tex':'ACK'},'\u2407':{'tex':'BEL'},'\u2408':{'tex':'BS'},'\u2409':{'tex':'HT'},'\u240A':{'tex':'LF'},'\u240B':{'tex':'VT'},'\u240C':{'tex':'FF'},'\u240D':{'tex':'CR'},'\u240E':{'tex':'SO'},'\u240F':{'tex':'SI'},'\u2410':{'tex':'DLE'},'\u2411':{'tex':'DC1'},'\u2412':{'tex':'DC2'},'\u2413':{'tex':'DC3'},'\u2414':{'tex':'DC4'},'\u2415':{'tex':'NAK'},'\u2416':{'tex':'SYN'},'\u2417':{'tex':'ETB'},'\u2418':{'tex':'CAN'},'\u2419':{'tex':'EM'},'\u241A':{'tex':'SUB'},'\u241B':{'tex':'ESC'},'\u241C':{'tex':'FS'},'\u241D':{'tex':'GS'},'\u241E':{'tex':'RS'},'\u241F':{'tex':'US'},'\u2420':{'tex':'SP'},'\u2421':{'tex':'DEL'},'\u2423':{'tex':'\\textvisiblespace{}'},'\u2424':{'tex':'NL'},'\u2425':{'tex':'///'},'\u2426':{'tex':'?'},'\u2460':{'tex':'\\ding{172}'},'\u2461':{'tex':'\\ding{173}'},'\u2462':{'tex':'\\ding{174}'},'\u2463':{'tex':'\\ding{175}'},'\u2464':{'tex':'\\ding{176}'},'\u2465':{'tex':'\\ding{177}'},'\u2466':{'tex':'\\ding{178}'},'\u2467':{'tex':'\\ding{179}'},'\u2468':{'tex':'\\ding{180}'},'\u2469':{'tex':'\\ding{181}'},'\u246A':{'tex':'(11)'},'\u246B':{'tex':'(12)'},'\u246C':{'tex':'(13)'},'\u246D':{'tex':'(14)'},'\u246E':{'tex':'(15)'},'\u246F':{'tex':'(16)'},'\u2470':{'tex':'(17)'},'\u2471':{'tex':'(18)'},'\u2472':{'tex':'(19)'},'\u2473':{'tex':'(20)'},'\u2474':{'tex':'(1)'},'\u2475':{'tex':'(2)'},'\u2476':{'tex':'(3)'},'\u2477':{'tex':'(4)'},'\u2478':{'tex':'(5)'},'\u2479':{'tex':'(6)'},'\u247A':{'tex':'(7)'},'\u247B':{'tex':'(8)'},'\u247C':{'tex':'(9)'},'\u247D':{'tex':'(10)'},'\u247E':{'tex':'(11)'},'\u247F':{'tex':'(12)'},'\u2480':{'tex':'(13)'},'\u2481':{'tex':'(14)'},'\u2482':{'tex':'(15)'},'\u2483':{'tex':'(16)'},'\u2484':{'tex':'(17)'},'\u2485':{'tex':'(18)'},'\u2486':{'tex':'(19)'},'\u2487':{'tex':'(20)'},'\u2488':{'tex':'1.'},'\u2489':{'tex':'2.'},'\u248A':{'tex':'3.'},'\u248B':{'tex':'4.'},'\u248C':{'tex':'5.'},'\u248D':{'tex':'6.'},'\u248E':{'tex':'7.'},'\u248F':{'tex':'8.'},'\u2490':{'tex':'9.'},'\u2491':{'tex':'10.'},'\u2492':{'tex':'11.'},'\u2493':{'tex':'12.'},'\u2494':{'tex':'13.'},'\u2495':{'tex':'14.'},'\u2496':{'tex':'15.'},'\u2497':{'tex':'16.'},'\u2498':{'tex':'17.'},'\u2499':{'tex':'18.'},'\u249A':{'tex':'19.'},'\u249B':{'tex':'20.'},'\u249C':{'tex':'(a)'},'\u249D':{'tex':'(b)'},'\u249E':{'tex':'(c)'},'\u249F':{'tex':'(d)'},'\u24A0':{'tex':'(e)'},'\u24A1':{'tex':'(f)'},'\u24A2':{'tex':'(g)'},'\u24A3':{'tex':'(h)'},'\u24A4':{'tex':'(i)'},'\u24A5':{'tex':'(j)'},'\u24A6':{'tex':'(k)'},'\u24A7':{'tex':'(l)'},'\u24A8':{'tex':'(m)'},'\u24A9':{'tex':'(n)'},'\u24AA':{'tex':'(o)'},'\u24AB':{'tex':'(p)'},'\u24AC':{'tex':'(q)'},'\u24AD':{'tex':'(r)'},'\u24AE':{'tex':'(s)'},'\u24AF':{'tex':'(t)'},'\u24B0':{'tex':'(u)'},'\u24B1':{'tex':'(v)'},'\u24B2':{'tex':'(w)'},'\u24B3':{'tex':'(x)'},'\u24B4':{'tex':'(y)'},'\u24B5':{'tex':'(z)'},'\u24B6':{'tex':'(A)'},'\u24B7':{'tex':'(B)'},'\u24B8':{'tex':'(C)'},'\u24B9':{'tex':'(D)'},'\u24BA':{'tex':'(E)'},'\u24BB':{'tex':'(F)'},'\u24BC':{'tex':'(G)'},'\u24BD':{'tex':'(H)'},'\u24BE':{'tex':'(I)'},'\u24BF':{'tex':'(J)'},'\u24C0':{'tex':'(K)'},'\u24C1':{'tex':'(L)'},'\u24C2':{'tex':'(M)'},'\u24C3':{'tex':'(N)'},'\u24C4':{'tex':'(O)'},'\u24C5':{'tex':'(P)'},'\u24C6':{'tex':'(Q)'},'\u24C7':{'tex':'(R)'},'\u24C8':{'tex':'\\circledS{}','math':true},'\u24C9':{'tex':'(T)'},'\u24CA':{'tex':'(U)'},'\u24CB':{'tex':'(V)'},'\u24CC':{'tex':'(W)'},'\u24CD':{'tex':'(X)'},'\u24CE':{'tex':'(Y)'},'\u24CF':{'tex':'(Z)'},'\u24D0':{'tex':'(a)'},'\u24D1':{'tex':'(b)'},'\u24D2':{'tex':'(c)'},'\u24D3':{'tex':'(d)'},'\u24D4':{'tex':'(e)'},'\u24D5':{'tex':'(f)'},'\u24D6':{'tex':'(g)'},'\u24D7':{'tex':'(h)'},'\u24D8':{'tex':'(i)'},'\u24D9':{'tex':'(j)'},'\u24DA':{'tex':'(k)'},'\u24DB':{'tex':'(l)'},'\u24DC':{'tex':'(m)'},'\u24DD':{'tex':'(n)'},'\u24DE':{'tex':'(o)'},'\u24DF':{'tex':'(p)'},'\u24E0':{'tex':'(q)'},'\u24E1':{'tex':'(r)'},'\u24E2':{'tex':'(s)'},'\u24E3':{'tex':'(t)'},'\u24E4':{'tex':'(u)'},'\u24E5':{'tex':'(v)'},'\u24E6':{'tex':'(w)'},'\u24E7':{'tex':'(x)'},'\u24E8':{'tex':'(y)'},'\u24E9':{'tex':'(z)'},'\u24EA':{'tex':'(0)'},'\u2500':{'tex':'-'},'\u2501':{'tex':'='},'\u2502':{'tex':'|'},'\u2503':{'tex':'|'},'\u2504':{'tex':'-'},'\u2505':{'tex':'='},'\u2506':{'tex':'\\Elzdshfnc{}','math':true},'\u2507':{'tex':'|'},'\u2508':{'tex':'-'},'\u2509':{'tex':'='},'\u250A':{'tex':'|'},'\u250B':{'tex':'|'},'\u250C':{'tex':'+'},'\u250D':{'tex':'+'},'\u250E':{'tex':'+'},'\u250F':{'tex':'+'},'\u2510':{'tex':'+'},'\u2511':{'tex':'+'},'\u2512':{'tex':'+'},'\u2513':{'tex':'+'},'\u2514':{'tex':'+'},'\u2515':{'tex':'+'},'\u2516':{'tex':'+'},'\u2517':{'tex':'+'},'\u2518':{'tex':'+'},'\u2519':{'tex':'\\Elzsqfnw{}','math':true},'\u251A':{'tex':'+'},'\u251B':{'tex':'+'},'\u251C':{'tex':'+'},'\u251D':{'tex':'+'},'\u251E':{'tex':'+'},'\u251F':{'tex':'+'},'\u2520':{'tex':'+'},'\u2521':{'tex':'+'},'\u2522':{'tex':'+'},'\u2523':{'tex':'+'},'\u2524':{'tex':'+'},'\u2525':{'tex':'+'},'\u2526':{'tex':'+'},'\u2527':{'tex':'+'},'\u2528':{'tex':'+'},'\u2529':{'tex':'+'},'\u252A':{'tex':'+'},'\u252B':{'tex':'+'},'\u252C':{'tex':'+'},'\u252D':{'tex':'+'},'\u252E':{'tex':'+'},'\u252F':{'tex':'+'},'\u2530':{'tex':'+'},'\u2531':{'tex':'+'},'\u2532':{'tex':'+'},'\u2533':{'tex':'+'},'\u2534':{'tex':'+'},'\u2535':{'tex':'+'},'\u2536':{'tex':'+'},'\u2537':{'tex':'+'},'\u2538':{'tex':'+'},'\u2539':{'tex':'+'},'\u253A':{'tex':'+'},'\u253B':{'tex':'+'},'\u253C':{'tex':'+'},'\u253D':{'tex':'+'},'\u253E':{'tex':'+'},'\u253F':{'tex':'+'},'\u2540':{'tex':'+'},'\u2541':{'tex':'+'},'\u2542':{'tex':'+'},'\u2543':{'tex':'+'},'\u2544':{'tex':'+'},'\u2545':{'tex':'+'},'\u2546':{'tex':'+'},'\u2547':{'tex':'+'},'\u2548':{'tex':'+'},'\u2549':{'tex':'+'},'\u254A':{'tex':'+'},'\u254B':{'tex':'+'},'\u254C':{'tex':'-'},'\u254D':{'tex':'='},'\u254E':{'tex':'|'},'\u254F':{'tex':'|'},'\u2550':{'tex':'='},'\u2551':{'tex':'|'},'\u2552':{'tex':'+'},'\u2553':{'tex':'+'},'\u2554':{'tex':'+'},'\u2555':{'tex':'+'},'\u2556':{'tex':'+'},'\u2557':{'tex':'+'},'\u2558':{'tex':'+'},'\u2559':{'tex':'+'},'\u255A':{'tex':'+'},'\u255B':{'tex':'+'},'\u255C':{'tex':'+'},'\u255D':{'tex':'+'},'\u255E':{'tex':'+'},'\u255F':{'tex':'+'},'\u2560':{'tex':'+'},'\u2561':{'tex':'+'},'\u2562':{'tex':'+'},'\u2563':{'tex':'+'},'\u2564':{'tex':'+'},'\u2565':{'tex':'+'},'\u2566':{'tex':'+'},'\u2567':{'tex':'+'},'\u2568':{'tex':'+'},'\u2569':{'tex':'+'},'\u256A':{'tex':'+'},'\u256B':{'tex':'+'},'\u256C':{'tex':'+'},'\u256D':{'tex':'+'},'\u256E':{'tex':'+'},'\u256F':{'tex':'+'},'\u2570':{'tex':'+'},'\u2571':{'tex':'\\diagup{}','math':true},'\u2572':{'tex':'\\'},'\u2573':{'tex':'X'},'\u257C':{'tex':'-'},'\u257D':{'tex':'|'},'\u257E':{'tex':'-'},'\u257F':{'tex':'|'},'\u2580':{'tex':'\\blockuphalf{}','math':true},'\u2584':{'tex':'\\blocklowhalf{}','math':true},'\u2588':{'tex':'\\blockfull{}','math':true},'\u258C':{'tex':'\\blocklefthalf{}','math':true},'\u2590':{'tex':'\\blockrighthalf{}','math':true},'\u2591':{'tex':'\\blockqtrshaded{}','math':true},'\u2592':{'tex':'\\blockhalfshaded{}','math':true},'\u2593':{'tex':'\\blockthreeqtrshaded{}','math':true},'\u25A0':{'tex':'\\ding{110}'},'\u25A1':{'tex':'\\square{}','math':true},'\u25A2':{'tex':'\\squoval{}','math':true},'\u25A3':{'tex':'\\blackinwhitesquare{}','math':true},'\u25A4':{'tex':'\\squarehfill{}','math':true},'\u25A5':{'tex':'\\squarevfill{}','math':true},'\u25A6':{'tex':'\\squarehvfill{}','math':true},'\u25A7':{'tex':'\\squarenwsefill{}','math':true},'\u25A8':{'tex':'\\squareneswfill{}','math':true},'\u25A9':{'tex':'\\squarecrossfill{}','math':true},'\u25AA':{'tex':'\\blacksquare{}','math':true},'\u25AB':{'tex':'\\smwhtsquare{}','math':true},'\u25AC':{'tex':'\\hrectangleblack{}','math':true},'\u25AD':{'tex':'\\fbox{~~}','math':true},'\u25AE':{'tex':'\\vrectangleblack{}','math':true},'\u25AF':{'tex':'\\Elzvrecto{}','math':true},'\u25B0':{'tex':'\\parallelogramblack{}','math':true},'\u25B1':{'tex':'\\ElsevierGlyph{E381}','math':true},'\u25B2':{'tex':'\\ding{115}'},'\u25B3':{'tex':'\\bigtriangleup{}','math':true},'\u25B4':{'tex':'\\blacktriangle{}','math':true},'\u25B5':{'tex':'\\vartriangle{}','math':true},'\u25B6':{'tex':'\\RHD{}','math':true},'\u25B7':{'tex':'\\rhd{}','math':true},'\u25B8':{'tex':'\\blacktriangleright{}','math':true},'\u25B9':{'tex':'\\triangleright{}','math':true},'\u25BA':{'tex':'\\blackpointerright{}','math':true},'\u25BB':{'tex':'\\whitepointerright{}','math':true},'\u25BC':{'tex':'\\ding{116}'},'\u25BD':{'tex':'\\bigtriangledown{}','math':true},'\u25BE':{'tex':'\\blacktriangledown{}','math':true},'\u25BF':{'tex':'\\triangledown{}','math':true},'\u25C0':{'tex':'\\LHD{}','math':true},'\u25C1':{'tex':'\\lhd{}','math':true},'\u25C2':{'tex':'\\blacktriangleleft{}','math':true},'\u25C3':{'tex':'\\triangleleft{}','math':true},'\u25C4':{'tex':'\\blackpointerleft{}','math':true},'\u25C5':{'tex':'\\whitepointerleft{}','math':true},'\u25C6':{'tex':'\\ding{117}'},'\u25C7':{'tex':'\\Diamond{}','math':true},'\u25C8':{'tex':'\\blackinwhitediamond{}','math':true},'\u25C9':{'tex':'\\fisheye{}','math':true},'\u25CA':{'tex':'\\lozenge{}','math':true},'\u25CB':{'tex':'\\bigcirc{}','math':true},'\u25CC':{'tex':'\\dottedcircle{}','math':true},'\u25CD':{'tex':'\\circlevertfill{}','math':true},'\u25CE':{'tex':'\\bullseye{}','math':true},'\u25CF':{'tex':'\\ding{108}'},'\u25D0':{'tex':'\\Elzcirfl{}','math':true},'\u25D1':{'tex':'\\Elzcirfr{}','math':true},'\u25D2':{'tex':'\\Elzcirfb{}','math':true},'\u25D3':{'tex':'\\circletophalfblack{}','math':true},'\u25D4':{'tex':'\\circleurquadblack{}','math':true},'\u25D5':{'tex':'\\blackcircleulquadwhite{}','math':true},'\u25D6':{'tex':'\\LEFTCIRCLE{}','math':true},'\u25D7':{'tex':'\\ding{119}'},'\u25D8':{'tex':'\\Elzrvbull{}','math':true},'\u25D9':{'tex':'\\inversewhitecircle{}','math':true},'\u25DA':{'tex':'\\invwhiteupperhalfcircle{}','math':true},'\u25DB':{'tex':'\\invwhitelowerhalfcircle{}','math':true},'\u25DC':{'tex':'\\ularc{}','math':true},'\u25DD':{'tex':'\\urarc{}','math':true},'\u25DE':{'tex':'\\lrarc{}','math':true},'\u25DF':{'tex':'\\llarc{}','math':true},'\u25E0':{'tex':'\\topsemicircle{}','math':true},'\u25E1':{'tex':'\\botsemicircle{}','math':true},'\u25E2':{'tex':'\\lrblacktriangle{}','math':true},'\u25E3':{'tex':'\\llblacktriangle{}','math':true},'\u25E4':{'tex':'\\ulblacktriangle{}','math':true},'\u25E5':{'tex':'\\urblacktriangle{}','math':true},'\u25E6':{'tex':'\\smwhtcircle{}','math':true},'\u25E7':{'tex':'\\Elzsqfl{}','math':true},'\u25E8':{'tex':'\\Elzsqfr{}','math':true},'\u25E9':{'tex':'\\squareulblack{}','math':true},'\u25EA':{'tex':'\\Elzsqfse{}','math':true},'\u25EB':{'tex':'\\boxbar{}','math':true},'\u25EC':{'tex':'\\trianglecdot{}','math':true},'\u25ED':{'tex':'\\triangleleftblack{}','math':true},'\u25EE':{'tex':'\\trianglerightblack{}','math':true},'\u25EF':{'tex':'\\bigcirc{}','math':true},'\u25F0':{'tex':'\\squareulquad{}','math':true},'\u25F1':{'tex':'\\squarellquad{}','math':true},'\u25F2':{'tex':'\\squarelrquad{}','math':true},'\u25F3':{'tex':'\\squareurquad{}','math':true},'\u25F4':{'tex':'\\circleulquad{}','math':true},'\u25F5':{'tex':'\\circlellquad{}','math':true},'\u25F6':{'tex':'\\circlelrquad{}','math':true},'\u25F7':{'tex':'\\circleurquad{}','math':true},'\u25F8':{'tex':'\\ultriangle{}','math':true},'\u25F9':{'tex':'\\urtriangle{}','math':true},'\u25FA':{'tex':'\\lltriangle{}','math':true},'\u25FB':{'tex':'\\square{}','math':true},'\u25FC':{'tex':'\\blacksquare{}','math':true},'\u25FD':{'tex':'\\mdsmwhtsquare{}','math':true},'\u25FE':{'tex':'\\mdsmblksquare{}','math':true},'\u25FF':{'tex':'\\lrtriangle{}','math':true},'\u2605':{'tex':'\\ding{72}'},'\u2606':{'tex':'\\ding{73}'},'\u2609':{'tex':'\\Sun{}','math':true},'\u260E':{'tex':'\\ding{37}'},'\u2610':{'tex':'\\Square{}','math':true},'\u2611':{'tex':'\\CheckedBox{}','math':true},'\u2612':{'tex':'\\XBox{}','math':true},'\u2613':{'tex':'X'},'\u2615':{'tex':'\\steaming{}','math':true},'\u261B':{'tex':'\\ding{42}'},'\u261E':{'tex':'\\ding{43}'},'\u2620':{'tex':'\\skull{}','math':true},'\u2621':{'tex':'\\danger{}','math':true},'\u2622':{'tex':'\\radiation{}','math':true},'\u2623':{'tex':'\\biohazard{}','math':true},'\u262F':{'tex':'\\yinyang{}','math':true},'\u2639':{'tex':'\\frownie{}','math':true},'\u263A':{'tex':'\\smiley{}','math':true},'\u263B':{'tex':'\\blacksmiley{}','math':true},'\u263C':{'tex':'\\sun{}','math':true},'\u263D':{'tex':'\\rightmoon{}','math':true},'\u263E':{'tex':'\\rightmoon{}'},'\u263F':{'tex':'\\mercury{}'},'\u2640':{'tex':'\\venus{}'},'\u2641':{'tex':'\\earth{}','math':true},'\u2642':{'tex':'\\male{}'},'\u2643':{'tex':'\\jupiter{}'},'\u2644':{'tex':'\\saturn{}'},'\u2645':{'tex':'\\uranus{}'},'\u2646':{'tex':'\\neptune{}'},'\u2647':{'tex':'\\pluto{}'},'\u2648':{'tex':'\\aries{}'},'\u2649':{'tex':'\\taurus{}'},'\u264A':{'tex':'\\gemini{}'},'\u264B':{'tex':'\\cancer{}'},'\u264C':{'tex':'\\leo{}'},'\u264D':{'tex':'\\virgo{}'},'\u264E':{'tex':'\\libra{}'},'\u264F':{'tex':'\\scorpio{}'},'\u2650':{'tex':'\\sagittarius{}'},'\u2651':{'tex':'\\capricornus{}'},'\u2652':{'tex':'\\aquarius{}'},'\u2653':{'tex':'\\pisces{}'},'\u2660':{'tex':'\\ding{171}'},'\u2661':{'tex':'\\heartsuit{}','math':true},'\u2662':{'tex':'\\diamond{}','math':true},'\u2663':{'tex':'\\ding{168}'},'\u2664':{'tex':'\\varspadesuit{}','math':true},'\u2665':{'tex':'\\ding{170}'},'\u2666':{'tex':'\\ding{169}'},'\u2667':{'tex':'\\varclubsuit{}','math':true},'\u2669':{'tex':'\\quarternote{}'},'\u266A':{'tex':'\\eighthnote{}'},'\u266B':{'tex':'\\twonotes{}','math':true},'\u266C':{'tex':'\\sixteenthnote{}','math':true},'\u266D':{'tex':'\\flat{}','math':true},'\u266E':{'tex':'\\natural{}','math':true},'\u266F':{'tex':'\\sharp{}','math':true},'\u267B':{'tex':'\\recycle{}','math':true},'\u267E':{'tex':'\\acidfree{}','math':true},'\u2680':{'tex':'\\dicei{}','math':true},'\u2681':{'tex':'\\diceii{}','math':true},'\u2682':{'tex':'\\diceiii{}','math':true},'\u2683':{'tex':'\\diceiv{}','math':true},'\u2684':{'tex':'\\dicev{}','math':true},'\u2685':{'tex':'\\dicevi{}','math':true},'\u2686':{'tex':'\\circledrightdot{}','math':true},'\u2687':{'tex':'\\circledtwodots{}','math':true},'\u2688':{'tex':'\\blackcircledrightdot{}','math':true},'\u2689':{'tex':'\\blackcircledtwodots{}','math':true},'\u2693':{'tex':'\\anchor{}','math':true},'\u2694':{'tex':'\\swords{}','math':true},'\u26A0':{'tex':'\\warning{}','math':true},'\u26A5':{'tex':'\\Hermaphrodite{}','math':true},'\u26AA':{'tex':'\\medcirc{}','math':true},'\u26AB':{'tex':'\\medbullet{}','math':true},'\u26AC':{'tex':'\\mdsmwhtcircle{}','math':true},'\u26B2':{'tex':'\\neuter{}','math':true},'\u2701':{'tex':'\\ding{33}'},'\u2702':{'tex':'\\ding{34}'},'\u2703':{'tex':'\\ding{35}'},'\u2704':{'tex':'\\ding{36}'},'\u2706':{'tex':'\\ding{38}'},'\u2707':{'tex':'\\ding{39}'},'\u2708':{'tex':'\\ding{40}'},'\u2709':{'tex':'\\ding{41}'},'\u270C':{'tex':'\\ding{44}'},'\u270D':{'tex':'\\ding{45}'},'\u270E':{'tex':'\\ding{46}'},'\u270F':{'tex':'\\ding{47}'},'\u2710':{'tex':'\\ding{48}'},'\u2711':{'tex':'\\ding{49}'},'\u2712':{'tex':'\\ding{50}'},'\u2713':{'tex':'\\ding{51}'},'\u2714':{'tex':'\\ding{52}'},'\u2715':{'tex':'\\ding{53}'},'\u2716':{'tex':'\\ding{54}'},'\u2717':{'tex':'\\ding{55}'},'\u2718':{'tex':'\\ding{56}'},'\u2719':{'tex':'\\ding{57}'},'\u271A':{'tex':'\\ding{58}'},'\u271B':{'tex':'\\ding{59}'},'\u271C':{'tex':'\\ding{60}'},'\u271D':{'tex':'\\ding{61}'},'\u271E':{'tex':'\\ding{62}'},'\u271F':{'tex':'\\ding{63}'},'\u2720':{'tex':'\\ding{64}'},'\u2721':{'tex':'\\ding{65}'},'\u2722':{'tex':'\\ding{66}'},'\u2723':{'tex':'\\ding{67}'},'\u2724':{'tex':'\\ding{68}'},'\u2725':{'tex':'\\ding{69}'},'\u2726':{'tex':'\\ding{70}'},'\u2727':{'tex':'\\ding{71}'},'\u2729':{'tex':'\\ding{73}'},'\u272A':{'tex':'\\ding{74}'},'\u272B':{'tex':'\\ding{75}'},'\u272C':{'tex':'\\ding{76}'},'\u272D':{'tex':'\\ding{77}'},'\u272E':{'tex':'\\ding{78}'},'\u272F':{'tex':'\\ding{79}'},'\u2730':{'tex':'\\ding{80}'},'\u2731':{'tex':'\\ding{81}'},'\u2732':{'tex':'\\ding{82}'},'\u2733':{'tex':'\\ding{83}'},'\u2734':{'tex':'\\ding{84}'},'\u2735':{'tex':'\\ding{85}'},'\u2736':{'tex':'\\ding{86}'},'\u2737':{'tex':'\\ding{87}'},'\u2738':{'tex':'\\ding{88}'},'\u2739':{'tex':'\\ding{89}'},'\u273A':{'tex':'\\ding{90}'},'\u273B':{'tex':'\\ding{91}'},'\u273C':{'tex':'\\ding{92}'},'\u273D':{'tex':'\\ding{93}'},'\u273E':{'tex':'\\ding{94}'},'\u273F':{'tex':'\\ding{95}'},'\u2740':{'tex':'\\ding{96}'},'\u2741':{'tex':'\\ding{97}'},'\u2742':{'tex':'\\ding{98}'},'\u2743':{'tex':'\\ding{99}'},'\u2744':{'tex':'\\ding{100}'},'\u2745':{'tex':'\\ding{101}'},'\u2746':{'tex':'\\ding{102}'},'\u2747':{'tex':'\\ding{103}'},'\u2748':{'tex':'\\ding{104}'},'\u2749':{'tex':'\\ding{105}'},'\u274A':{'tex':'\\ding{106}'},'\u274B':{'tex':'\\ding{107}'},'\u274D':{'tex':'\\ding{109}'},'\u274F':{'tex':'\\ding{111}'},'\u2750':{'tex':'\\ding{112}'},'\u2751':{'tex':'\\ding{113}'},'\u2752':{'tex':'\\ding{114}'},'\u2756':{'tex':'\\ding{118}'},'\u2758':{'tex':'\\ding{120}'},'\u2759':{'tex':'\\ding{121}'},'\u275A':{'tex':'\\ding{122}'},'\u275B':{'tex':'\\ding{123}'},'\u275C':{'tex':'\\ding{124}'},'\u275D':{'tex':'\\ding{125}'},'\u275E':{'tex':'\\ding{126}'},'\u2761':{'tex':'\\ding{161}'},'\u2762':{'tex':'\\ding{162}'},'\u2763':{'tex':'\\ding{163}'},'\u2764':{'tex':'\\ding{164}'},'\u2765':{'tex':'\\ding{165}'},'\u2766':{'tex':'\\ding{166}'},'\u2767':{'tex':'\\ding{167}'},'\u2772':{'tex':'\\lbrbrak{}','math':true},'\u2773':{'tex':'\\rbrbrak{}','math':true},'\u2776':{'tex':'\\ding{182}'},'\u2777':{'tex':'\\ding{183}'},'\u2778':{'tex':'\\ding{184}'},'\u2779':{'tex':'\\ding{185}'},'\u277A':{'tex':'\\ding{186}'},'\u277B':{'tex':'\\ding{187}'},'\u277C':{'tex':'\\ding{188}'},'\u277D':{'tex':'\\ding{189}'},'\u277E':{'tex':'\\ding{190}'},'\u277F':{'tex':'\\ding{191}'},'\u2780':{'tex':'\\ding{192}'},'\u2781':{'tex':'\\ding{193}'},'\u2782':{'tex':'\\ding{194}'},'\u2783':{'tex':'\\ding{195}'},'\u2784':{'tex':'\\ding{196}'},'\u2785':{'tex':'\\ding{197}'},'\u2786':{'tex':'\\ding{198}'},'\u2787':{'tex':'\\ding{199}'},'\u2788':{'tex':'\\ding{200}'},'\u2789':{'tex':'\\ding{201}'},'\u278A':{'tex':'\\ding{202}'},'\u278B':{'tex':'\\ding{203}'},'\u278C':{'tex':'\\ding{204}'},'\u278D':{'tex':'\\ding{205}'},'\u278E':{'tex':'\\ding{206}'},'\u278F':{'tex':'\\ding{207}'},'\u2790':{'tex':'\\ding{208}'},'\u2791':{'tex':'\\ding{209}'},'\u2792':{'tex':'\\ding{210}'},'\u2793':{'tex':'\\ding{211}'},'\u2794':{'tex':'\\ding{212}'},'\u2798':{'tex':'\\ding{216}'},'\u2799':{'tex':'\\ding{217}'},'\u279A':{'tex':'\\ding{218}'},'\u279B':{'tex':'\\ding{219}'},'\u279C':{'tex':'\\ding{220}'},'\u279D':{'tex':'\\ding{221}'},'\u279E':{'tex':'\\ding{222}'},'\u279F':{'tex':'\\ding{223}'},'\u27A0':{'tex':'\\ding{224}'},'\u27A1':{'tex':'\\ding{225}'},'\u27A2':{'tex':'\\ding{226}'},'\u27A3':{'tex':'\\ding{227}'},'\u27A4':{'tex':'\\ding{228}'},'\u27A5':{'tex':'\\ding{229}'},'\u27A6':{'tex':'\\ding{230}'},'\u27A7':{'tex':'\\ding{231}'},'\u27A8':{'tex':'\\ding{232}'},'\u27A9':{'tex':'\\ding{233}'},'\u27AA':{'tex':'\\ding{234}'},'\u27AB':{'tex':'\\ding{235}'},'\u27AC':{'tex':'\\ding{236}'},'\u27AD':{'tex':'\\ding{237}'},'\u27AE':{'tex':'\\ding{238}'},'\u27AF':{'tex':'\\ding{239}'},'\u27B1':{'tex':'\\ding{241}'},'\u27B2':{'tex':'\\ding{242}'},'\u27B3':{'tex':'\\ding{243}'},'\u27B4':{'tex':'\\ding{244}'},'\u27B5':{'tex':'\\ding{245}'},'\u27B6':{'tex':'\\ding{246}'},'\u27B7':{'tex':'\\ding{247}'},'\u27B8':{'tex':'\\ding{248}'},'\u27B9':{'tex':'\\ding{249}'},'\u27BA':{'tex':'\\ding{250}'},'\u27BB':{'tex':'\\ding{251}'},'\u27BC':{'tex':'\\ding{252}'},'\u27BD':{'tex':'\\ding{253}'},'\u27BE':{'tex':'\\ding{254}'},'\u27C0':{'tex':'\\threedangle{}','math':true},'\u27C1':{'tex':'\\whiteinwhitetriangle{}','math':true},'\u27C2':{'tex':'\\perp{}','math':true},'\u27C3':{'tex':'\\subsetcirc{}','math':true},'\u27C4':{'tex':'\\supsetcirc{}','math':true},'\u27C5':{'tex':'\\Lbag{}','math':true},'\u27C6':{'tex':'\\Rbag{}','math':true},'\u27C7':{'tex':'\\veedot{}','math':true},'\u27C8':{'tex':'\\bsolhsub{}','math':true},'\u27C9':{'tex':'\\suphsol{}','math':true},'\u27CC':{'tex':'\\longdivision{}','math':true},'\u27D0':{'tex':'\\Diamonddot{}','math':true},'\u27D1':{'tex':'\\wedgedot{}','math':true},'\u27D2':{'tex':'\\upin{}','math':true},'\u27D3':{'tex':'\\pullback{}','math':true},'\u27D4':{'tex':'\\pushout{}','math':true},'\u27D5':{'tex':'\\leftouterjoin{}','math':true},'\u27D6':{'tex':'\\rightouterjoin{}','math':true},'\u27D7':{'tex':'\\fullouterjoin{}','math':true},'\u27D8':{'tex':'\\bigbot{}','math':true},'\u27D9':{'tex':'\\bigtop{}','math':true},'\u27DA':{'tex':'\\DashVDash{}','math':true},'\u27DB':{'tex':'\\dashVdash{}','math':true},'\u27DC':{'tex':'\\multimapinv{}','math':true},'\u27DD':{'tex':'\\vlongdash{}','math':true},'\u27DE':{'tex':'\\longdashv{}','math':true},'\u27DF':{'tex':'\\cirbot{}','math':true},'\u27E0':{'tex':'\\lozengeminus{}','math':true},'\u27E1':{'tex':'\\concavediamond{}','math':true},'\u27E2':{'tex':'\\concavediamondtickleft{}','math':true},'\u27E3':{'tex':'\\concavediamondtickright{}','math':true},'\u27E4':{'tex':'\\whitesquaretickleft{}','math':true},'\u27E5':{'tex':'\\whitesquaretickright{}','math':true},'\u27E6':{'tex':'\\llbracket{}','math':true},'\u27E7':{'tex':'\\rrbracket{}','math':true},'\u27E8':{'tex':'\\langle{}'},'\u27E9':{'tex':'\\rangle{}'},'\u27EA':{'tex':'\\lang{}','math':true},'\u27EB':{'tex':'\\rang{}','math':true},'\u27EC':{'tex':'\\Lbrbrak{}','math':true},'\u27ED':{'tex':'\\Rbrbrak{}','math':true},'\u27EE':{'tex':'\\lgroup{}','math':true},'\u27EF':{'tex':'\\rgroup{}','math':true},'\u27F0':{'tex':'\\UUparrow{}','math':true},'\u27F1':{'tex':'\\DDownarrow{}','math':true},'\u27F2':{'tex':'\\acwgapcirclearrow{}','math':true},'\u27F3':{'tex':'\\cwgapcirclearrow{}','math':true},'\u27F4':{'tex':'\\rightarrowonoplus{}','math':true},'\u27F5':{'tex':'\\longleftarrow{}','math':true},'\u27F6':{'tex':'\\longrightarrow{}','math':true},'\u27F7':{'tex':'\\longleftrightarrow{}','math':true},'\u27F8':{'tex':'\\Longleftarrow{}','math':true},'\u27F9':{'tex':'\\Longrightarrow{}','math':true},'\u27FA':{'tex':'\\Longleftrightarrow{}','math':true},'\u27FB':{'tex':'\\longmapsfrom{}','math':true},'\u27FC':{'tex':'\\longmapsto{}','math':true},'\u27FD':{'tex':'\\Longmapsfrom{}','math':true},'\u27FE':{'tex':'\\Longmapsto{}','math':true},'\u27FF':{'tex':'\\sim\\joinrel\\leadsto{}','math':true},'\u2900':{'tex':'\\psur{}','math':true},'\u2901':{'tex':'\\nVtwoheadrightarrow{}','math':true},'\u2902':{'tex':'\\nvLeftarrow{}','math':true},'\u2903':{'tex':'\\nvRightarrow{}','math':true},'\u2904':{'tex':'\\nvLeftrightarrow{}','math':true},'\u2905':{'tex':'\\ElsevierGlyph{E212}','math':true},'\u2906':{'tex':'\\Mapsfrom{}','math':true},'\u2907':{'tex':'\\Mapsto{}','math':true},'\u2908':{'tex':'\\downarrowbarred{}','math':true},'\u2909':{'tex':'\\uparrowbarred{}','math':true},'\u290A':{'tex':'\\Uuparrow{}','math':true},'\u290B':{'tex':'\\Ddownarrow{}','math':true},'\u290C':{'tex':'\\leftbkarrow{}','math':true},'\u290D':{'tex':'\\rightbkarrow{}','math':true},'\u290E':{'tex':'\\leftdbkarrow{}','math':true},'\u290F':{'tex':'\\dbkarow{}','math':true},'\u2910':{'tex':'\\drbkarow{}','math':true},'\u2911':{'tex':'\\rightdotarrow{}','math':true},'\u2912':{'tex':'\\UpArrowBar{}','math':true},'\u2913':{'tex':'\\DownArrowBar{}','math':true},'\u2914':{'tex':'\\pinj{}','math':true},'\u2915':{'tex':'\\finj{}','math':true},'\u2916':{'tex':'\\bij{}','math':true},'\u2917':{'tex':'\\nvtwoheadrightarrowtail{}','math':true},'\u2918':{'tex':'\\nVtwoheadrightarrowtail{}','math':true},'\u2919':{'tex':'\\lefttail{}','math':true},'\u291A':{'tex':'\\righttail{}','math':true},'\u291B':{'tex':'\\leftdbltail{}','math':true},'\u291C':{'tex':'\\rightdbltail{}','math':true},'\u291D':{'tex':'\\diamondleftarrow{}','math':true},'\u291E':{'tex':'\\rightarrowdiamond{}','math':true},'\u291F':{'tex':'\\diamondleftarrowbar{}','math':true},'\u2920':{'tex':'\\barrightarrowdiamond{}','math':true},'\u2921':{'tex':'\\nwsearrow{}','math':true},'\u2922':{'tex':'\\neswarrow{}','math':true},'\u2923':{'tex':'\\ElsevierGlyph{E20C}','math':true},'\u2924':{'tex':'\\ElsevierGlyph{E20D}','math':true},'\u2925':{'tex':'\\ElsevierGlyph{E20B}','math':true},'\u2926':{'tex':'\\ElsevierGlyph{E20A}','math':true},'\u2927':{'tex':'\\ElsevierGlyph{E211}','math':true},'\u2928':{'tex':'\\ElsevierGlyph{E20E}','math':true},'\u2929':{'tex':'\\ElsevierGlyph{E20F}','math':true},'\u292A':{'tex':'\\ElsevierGlyph{E210}','math':true},'\u292B':{'tex':'\\rdiagovfdiag{}','math':true},'\u292C':{'tex':'\\fdiagovrdiag{}','math':true},'\u292D':{'tex':'\\seovnearrow{}','math':true},'\u292E':{'tex':'\\neovsearrow{}','math':true},'\u292F':{'tex':'\\fdiagovnearrow{}','math':true},'\u2930':{'tex':'\\rdiagovsearrow{}','math':true},'\u2931':{'tex':'\\neovnwarrow{}','math':true},'\u2932':{'tex':'\\nwovnearrow{}','math':true},'\u2933':{'tex':'\\ElsevierGlyph{E21C}','math':true},'\u2934':{'tex':'\\uprightcurvearrow{}','math':true},'\u2935':{'tex':'\\downrightcurvedarrow{}','math':true},'\u2936':{'tex':'\\ElsevierGlyph{E21A}','math':true},'\u2937':{'tex':'\\ElsevierGlyph{E219}','math':true},'\u2938':{'tex':'\\cwrightarcarrow{}','math':true},'\u2939':{'tex':'\\acwleftarcarrow{}','math':true},'\u293A':{'tex':'\\acwoverarcarrow{}','math':true},'\u293B':{'tex':'\\acwunderarcarrow{}','math':true},'\u293C':{'tex':'\\curvearrowrightminus{}','math':true},'\u293D':{'tex':'\\curvearrowleftplus{}','math':true},'\u293E':{'tex':'\\cwundercurvearrow{}','math':true},'\u293F':{'tex':'\\ccwundercurvearrow{}','math':true},'\u2940':{'tex':'\\Elolarr{}','math':true},'\u2941':{'tex':'\\Elorarr{}','math':true},'\u2942':{'tex':'\\ElzRlarr{}','math':true},'\u2943':{'tex':'\\leftarrowshortrightarrow{}','math':true},'\u2944':{'tex':'\\ElzrLarr{}','math':true},'\u2945':{'tex':'\\rightarrowplus{}','math':true},'\u2946':{'tex':'\\leftarrowplus{}','math':true},'\u2947':{'tex':'\\Elzrarrx{}','math':true},'\u2948':{'tex':'\\leftrightarrowcircle{}','math':true},'\u2949':{'tex':'\\twoheaduparrowcircle{}','math':true},'\u294A':{'tex':'\\leftrightharpoon{}','math':true},'\u294B':{'tex':'\\rightleftharpoon{}','math':true},'\u294C':{'tex':'\\updownharpoonrightleft{}','math':true},'\u294D':{'tex':'\\updownharpoonleftright{}','math':true},'\u294E':{'tex':'\\LeftRightVector{}','math':true},'\u294F':{'tex':'\\RightUpDownVector{}','math':true},'\u2950':{'tex':'\\DownLeftRightVector{}','math':true},'\u2951':{'tex':'\\LeftUpDownVector{}','math':true},'\u2952':{'tex':'\\LeftVectorBar{}','math':true},'\u2953':{'tex':'\\RightVectorBar{}','math':true},'\u2954':{'tex':'\\RightUpVectorBar{}','math':true},'\u2955':{'tex':'\\RightDownVectorBar{}','math':true},'\u2956':{'tex':'\\DownLeftVectorBar{}','math':true},'\u2957':{'tex':'\\DownRightVectorBar{}','math':true},'\u2958':{'tex':'\\LeftUpVectorBar{}','math':true},'\u2959':{'tex':'\\LeftDownVectorBar{}','math':true},'\u295A':{'tex':'\\LeftTeeVector{}','math':true},'\u295B':{'tex':'\\RightTeeVector{}','math':true},'\u295C':{'tex':'\\RightUpTeeVector{}','math':true},'\u295D':{'tex':'\\RightDownTeeVector{}','math':true},'\u295E':{'tex':'\\DownLeftTeeVector{}','math':true},'\u295F':{'tex':'\\DownRightTeeVector{}','math':true},'\u2960':{'tex':'\\LeftUpTeeVector{}','math':true},'\u2961':{'tex':'\\LeftDownTeeVector{}','math':true},'\u2962':{'tex':'\\leftleftharpoons{}','math':true},'\u2963':{'tex':'\\upupharpoons{}','math':true},'\u2964':{'tex':'\\rightrightharpoons{}','math':true},'\u2965':{'tex':'\\downdownharpoons{}','math':true},'\u2966':{'tex':'\\leftrightharpoonsup{}','math':true},'\u2967':{'tex':'\\leftrightharpoonsdown{}','math':true},'\u2968':{'tex':'\\rightleftharpoonsup{}','math':true},'\u2969':{'tex':'\\rightleftharpoonsdown{}','math':true},'\u296A':{'tex':'\\leftbarharpoon{}','math':true},'\u296B':{'tex':'\\barleftharpoon{}','math':true},'\u296C':{'tex':'\\rightbarharpoon{}','math':true},'\u296D':{'tex':'\\barrightharpoon{}','math':true},'\u296E':{'tex':'\\UpEquilibrium{}','math':true},'\u296F':{'tex':'\\ReverseUpEquilibrium{}','math':true},'\u2970':{'tex':'\\RoundImplies{}','math':true},'\u2971':{'tex':'\\equalrightarrow{}','math':true},'\u2972':{'tex':'\\similarrightarrow{}','math':true},'\u2973':{'tex':'\\leftarrowsimilar{}','math':true},'\u2974':{'tex':'\\rightarrowsimilar{}','math':true},'\u2975':{'tex':'\\rightarrowapprox{}','math':true},'\u2976':{'tex':'\\ltlarr{}','math':true},'\u2977':{'tex':'\\leftarrowless{}','math':true},'\u2978':{'tex':'\\gtrarr{}','math':true},'\u2979':{'tex':'\\subrarr{}','math':true},'\u297A':{'tex':'\\leftarrowsubset{}','math':true},'\u297B':{'tex':'\\suplarr{}','math':true},'\u297C':{'tex':'\\ElsevierGlyph{E214}','math':true},'\u297D':{'tex':'\\ElsevierGlyph{E215}','math':true},'\u297E':{'tex':'\\upfishtail{}','math':true},'\u297F':{'tex':'\\downfishtail{}','math':true},'\u2980':{'tex':'\\Elztfnc{}','math':true},'\u2981':{'tex':'\\spot{}','math':true},'\u2982':{'tex':'\\typecolon{}','math':true},'\u2983':{'tex':'\\lBrace{}','math':true},'\u2984':{'tex':'\\rBrace{}','math':true},'\u2985':{'tex':'\\ElsevierGlyph{3018}','math':true},'\u2986':{'tex':'\\Elroang{}','math':true},'\u2987':{'tex':'\\limg{}','math':true},'\u2988':{'tex':'\\rimg{}','math':true},'\u2989':{'tex':'\\lblot{}','math':true},'\u298A':{'tex':'\\rblot{}','math':true},'\u298B':{'tex':'\\lbrackubar{}','math':true},'\u298C':{'tex':'\\rbrackubar{}','math':true},'\u298D':{'tex':'\\lbrackultick{}','math':true},'\u298E':{'tex':'\\rbracklrtick{}','math':true},'\u298F':{'tex':'\\lbracklltick{}','math':true},'\u2990':{'tex':'\\rbrackurtick{}','math':true},'\u2991':{'tex':'\\langledot{}','math':true},'\u2992':{'tex':'\\rangledot{}','math':true},'\u2993':{'tex':'<\\kern-0.58em(','math':true},'\u2994':{'tex':'\\ElsevierGlyph{E291}','math':true},'\u2995':{'tex':'\\Lparengtr{}','math':true},'\u2996':{'tex':'\\Rparenless{}','math':true},'\u2997':{'tex':'\\lblkbrbrak{}','math':true},'\u2998':{'tex':'\\rblkbrbrak{}','math':true},'\u2999':{'tex':'\\Elzddfnc{}','math':true},'\u299A':{'tex':'\\vzigzag{}','math':true},'\u299B':{'tex':'\\measuredangleleft{}','math':true},'\u299C':{'tex':'\\Angle{}','math':true},'\u299D':{'tex':'\\rightanglemdot{}','math':true},'\u299E':{'tex':'\\angles{}','math':true},'\u299F':{'tex':'\\angdnr{}','math':true},'\u29A0':{'tex':'\\Elzlpargt{}','math':true},'\u29A1':{'tex':'\\sphericalangleup{}','math':true},'\u29A2':{'tex':'\\turnangle{}','math':true},'\u29A3':{'tex':'\\revangle{}','math':true},'\u29A4':{'tex':'\\angleubar{}','math':true},'\u29A5':{'tex':'\\revangleubar{}','math':true},'\u29A6':{'tex':'\\wideangledown{}','math':true},'\u29A7':{'tex':'\\wideangleup{}','math':true},'\u29A8':{'tex':'\\measanglerutone{}','math':true},'\u29A9':{'tex':'\\measanglelutonw{}','math':true},'\u29AA':{'tex':'\\measanglerdtose{}','math':true},'\u29AB':{'tex':'\\measangleldtosw{}','math':true},'\u29AC':{'tex':'\\measangleurtone{}','math':true},'\u29AD':{'tex':'\\measangleultonw{}','math':true},'\u29AE':{'tex':'\\measangledrtose{}','math':true},'\u29AF':{'tex':'\\measangledltosw{}','math':true},'\u29B0':{'tex':'\\revemptyset{}','math':true},'\u29B1':{'tex':'\\emptysetobar{}','math':true},'\u29B2':{'tex':'\\emptysetocirc{}','math':true},'\u29B3':{'tex':'\\emptysetoarr{}','math':true},'\u29B4':{'tex':'\\emptysetoarrl{}','math':true},'\u29B5':{'tex':'\\ElsevierGlyph{E260}','math':true},'\u29B6':{'tex':'\\ElsevierGlyph{E61B}','math':true},'\u29B7':{'tex':'\\circledparallel{}','math':true},'\u29B8':{'tex':'\\circledbslash{}','math':true},'\u29B9':{'tex':'\\operp{}','math':true},'\u29BA':{'tex':'\\obot{}','math':true},'\u29BB':{'tex':'\\olcross{}','math':true},'\u29BC':{'tex':'\\odotslashdot{}','math':true},'\u29BD':{'tex':'\\uparrowoncircle{}','math':true},'\u29BE':{'tex':'\\circledwhitebullet{}','math':true},'\u29BF':{'tex':'\\circledbullet{}','math':true},'\u29C0':{'tex':'\\circledless{}','math':true},'\u29C1':{'tex':'\\circledgtr{}','math':true},'\u29C2':{'tex':'\\cirscir{}','math':true},'\u29C3':{'tex':'\\cirE{}','math':true},'\u29C4':{'tex':'\\boxslash{}','math':true},'\u29C5':{'tex':'\\boxbslash{}','math':true},'\u29C6':{'tex':'\\boxast{}','math':true},'\u29C7':{'tex':'\\boxcircle{}','math':true},'\u29C8':{'tex':'\\boxbox{}','math':true},'\u29C9':{'tex':'\\boxonbox{}','math':true},'\u29CA':{'tex':'\\ElzLap{}','math':true},'\u29CB':{'tex':'\\Elzdefas{}','math':true},'\u29CC':{'tex':'\\triangles{}','math':true},'\u29CD':{'tex':'\\triangleserifs{}','math':true},'\u29CE':{'tex':'\\rtriltri{}','math':true},'\u29CF':{'tex':'\\LeftTriangleBar{}','math':true},'\u29D0':{'tex':'\\RightTriangleBar{}','math':true},'\u29D1':{'tex':'\\lfbowtie{}','math':true},'\u29D2':{'tex':'\\rfbowtie{}','math':true},'\u29D3':{'tex':'\\fbowtie{}','math':true},'\u29D4':{'tex':'\\lftimes{}','math':true},'\u29D5':{'tex':'\\rftimes{}','math':true},'\u29D6':{'tex':'\\hourglass{}','math':true},'\u29D7':{'tex':'\\blackhourglass{}','math':true},'\u29D8':{'tex':'\\lvzigzag{}','math':true},'\u29D9':{'tex':'\\rvzigzag{}','math':true},'\u29DA':{'tex':'\\Lvzigzag{}','math':true},'\u29DB':{'tex':'\\Rvzigzag{}','math':true},'\u29DC':{'tex':'\\ElsevierGlyph{E372}','math':true},'\u29DD':{'tex':'\\tieinfty{}','math':true},'\u29DE':{'tex':'\\nvinfty{}','math':true},'\u29DF':{'tex':'\\multimapboth{}','math':true},'\u29E0':{'tex':'\\laplac{}','math':true},'\u29E1':{'tex':'\\lrtriangleeq{}','math':true},'\u29E2':{'tex':'\\shuffle{}','math':true},'\u29E3':{'tex':'\\eparsl{}','math':true},'\u29E4':{'tex':'\\smeparsl{}','math':true},'\u29E5':{'tex':'\\eqvparsl{}','math':true},'\u29E6':{'tex':'\\gleichstark{}','math':true},'\u29E7':{'tex':'\\thermod{}','math':true},'\u29E8':{'tex':'\\downtriangleleftblack{}','math':true},'\u29E9':{'tex':'\\downtrianglerightblack{}','math':true},'\u29EA':{'tex':'\\blackdiamonddownarrow{}','math':true},'\u29EB':{'tex':'\\blacklozenge{}','math':true},'\u29EC':{'tex':'\\circledownarrow{}','math':true},'\u29ED':{'tex':'\\blackcircledownarrow{}','math':true},'\u29EE':{'tex':'\\errbarsquare{}','math':true},'\u29EF':{'tex':'\\errbarblacksquare{}','math':true},'\u29F0':{'tex':'\\errbardiamond{}','math':true},'\u29F1':{'tex':'\\errbarblackdiamond{}','math':true},'\u29F2':{'tex':'\\errbarcircle{}','math':true},'\u29F3':{'tex':'\\errbarblackcircle{}','math':true},'\u29F4':{'tex':'\\RuleDelayed{}','math':true},'\u29F5':{'tex':'\\setminus{}','math':true},'\u29F6':{'tex':'\\dsol{}','math':true},'\u29F7':{'tex':'\\rsolbar{}','math':true},'\u29F8':{'tex':'\\xsol{}','math':true},'\u29F9':{'tex':'\\zhide{}','math':true},'\u29FA':{'tex':'\\doubleplus{}','math':true},'\u29FB':{'tex':'\\tripleplus{}','math':true},'\u29FC':{'tex':'\\lcurvyangle{}','math':true},'\u29FD':{'tex':'\\rcurvyangle{}','math':true},'\u29FE':{'tex':'\\tplus{}','math':true},'\u29FF':{'tex':'\\tminus{}','math':true},'\u2A00':{'tex':'\\bigodot{}','math':true},'\u2A01':{'tex':'\\bigoplus{}','math':true},'\u2A02':{'tex':'\\bigotimes{}','math':true},'\u2A03':{'tex':'\\bigcupdot{}','math':true},'\u2A04':{'tex':'\\Elxuplus{}','math':true},'\u2A05':{'tex':'\\ElzThr{}','math':true},'\u2A06':{'tex':'\\Elxsqcup{}','math':true},'\u2A07':{'tex':'\\ElzInf{}','math':true},'\u2A08':{'tex':'\\ElzSup{}','math':true},'\u2A09':{'tex':'\\varprod{}','math':true},'\u2A0A':{'tex':'\\modtwosum{}','math':true},'\u2A0B':{'tex':'\\sumint{}','math':true},'\u2A0C':{'tex':'\\iiiint{}','math':true},'\u2A0D':{'tex':'\\ElzCint{}','math':true},'\u2A0E':{'tex':'\\intBar{}','math':true},'\u2A0F':{'tex':'\\clockoint{}','math':true},'\u2A10':{'tex':'\\ElsevierGlyph{E395}','math':true},'\u2A11':{'tex':'\\awint{}','math':true},'\u2A12':{'tex':'\\rppolint{}','math':true},'\u2A13':{'tex':'\\scpolint{}','math':true},'\u2A14':{'tex':'\\npolint{}','math':true},'\u2A15':{'tex':'\\pointint{}','math':true},'\u2A16':{'tex':'\\sqrint{}','math':true},'\u2A17':{'tex':'\\intlarhk{}','math':true},'\u2A18':{'tex':'\\intx{}','math':true},'\u2A19':{'tex':'\\intcap{}','math':true},'\u2A1A':{'tex':'\\intcup{}','math':true},'\u2A1B':{'tex':'\\upint{}','math':true},'\u2A1C':{'tex':'\\lowint{}','math':true},'\u2A1D':{'tex':'\\Join{}','math':true},'\u2A1E':{'tex':'\\bigtriangleleft{}','math':true},'\u2A1F':{'tex':'\\zcmp{}','math':true},'\u2A20':{'tex':'\\zpipe{}','math':true},'\u2A21':{'tex':'\\zproject{}','math':true},'\u2A22':{'tex':'\\ringplus{}','math':true},'\u2A23':{'tex':'\\plushat{}','math':true},'\u2A24':{'tex':'\\simplus{}','math':true},'\u2A25':{'tex':'\\ElsevierGlyph{E25A}','math':true},'\u2A26':{'tex':'\\plussim{}','math':true},'\u2A27':{'tex':'\\plussubtwo{}','math':true},'\u2A28':{'tex':'\\plustrif{}','math':true},'\u2A29':{'tex':'\\commaminus{}','math':true},'\u2A2A':{'tex':'\\ElsevierGlyph{E25B}','math':true},'\u2A2B':{'tex':'\\minusfdots{}','math':true},'\u2A2C':{'tex':'\\minusrdots{}','math':true},'\u2A2D':{'tex':'\\ElsevierGlyph{E25C}','math':true},'\u2A2E':{'tex':'\\ElsevierGlyph{E25D}','math':true},'\u2A2F':{'tex':'\\ElzTimes{}','math':true},'\u2A30':{'tex':'\\dottimes{}','math':true},'\u2A31':{'tex':'\\timesbar{}','math':true},'\u2A32':{'tex':'\\btimes{}','math':true},'\u2A33':{'tex':'\\smashtimes{}','math':true},'\u2A34':{'tex':'\\ElsevierGlyph{E25E}','math':true},'\u2A35':{'tex':'\\ElsevierGlyph{E25E}','math':true},'\u2A36':{'tex':'\\otimeshat{}','math':true},'\u2A37':{'tex':'\\Otimes{}','math':true},'\u2A38':{'tex':'\\odiv{}','math':true},'\u2A39':{'tex':'\\triangleplus{}','math':true},'\u2A3A':{'tex':'\\triangleminus{}','math':true},'\u2A3B':{'tex':'\\triangletimes{}','math':true},'\u2A3C':{'tex':'\\ElsevierGlyph{E259}','math':true},'\u2A3D':{'tex':'\\intprodr{}','math':true},'\u2A3E':{'tex':'\\fcmp{}','math':true},'\u2A3F':{'tex':'\\amalg{}','math':true},'\u2A40':{'tex':'\\capdot{}','math':true},'\u2A41':{'tex':'\\uminus{}','math':true},'\u2A42':{'tex':'\\barcup{}','math':true},'\u2A43':{'tex':'\\barcap{}','math':true},'\u2A44':{'tex':'\\capwedge{}','math':true},'\u2A45':{'tex':'\\cupvee{}','math':true},'\u2A46':{'tex':'\\cupovercap{}','math':true},'\u2A47':{'tex':'\\capovercup{}','math':true},'\u2A48':{'tex':'\\cupbarcap{}','math':true},'\u2A49':{'tex':'\\capbarcup{}','math':true},'\u2A4A':{'tex':'\\twocups{}','math':true},'\u2A4B':{'tex':'\\twocaps{}','math':true},'\u2A4C':{'tex':'\\closedvarcup{}','math':true},'\u2A4D':{'tex':'\\closedvarcap{}','math':true},'\u2A4E':{'tex':'\\Sqcap{}','math':true},'\u2A4F':{'tex':'\\Sqcup{}','math':true},'\u2A50':{'tex':'\\closedvarcupsmashprod{}','math':true},'\u2A51':{'tex':'\\wedgeodot{}','math':true},'\u2A52':{'tex':'\\veeodot{}','math':true},'\u2A53':{'tex':'\\ElzAnd{}','math':true},'\u2A54':{'tex':'\\ElzOr{}','math':true},'\u2A55':{'tex':'\\ElsevierGlyph{E36E}','math':true},'\u2A56':{'tex':'\\ElOr{}','math':true},'\u2A57':{'tex':'\\bigslopedvee{}','math':true},'\u2A58':{'tex':'\\bigslopedwedge{}','math':true},'\u2A59':{'tex':'\\veeonwedge{}','math':true},'\u2A5A':{'tex':'\\wedgemidvert{}','math':true},'\u2A5B':{'tex':'\\veemidvert{}','math':true},'\u2A5C':{'tex':'\\midbarwedge{}','math':true},'\u2A5D':{'tex':'\\midbarvee{}','math':true},'\u2A5E':{'tex':'\\perspcorrespond{}','math':true},'\u2A5F':{'tex':'\\Elzminhat{}','math':true},'\u2A60':{'tex':'\\wedgedoublebar{}','math':true},'\u2A61':{'tex':'\\varveebar{}','math':true},'\u2A62':{'tex':'\\doublebarvee{}','math':true},'\u2A63':{'tex':'\\ElsevierGlyph{225A}','math':true},'\u2A64':{'tex':'\\dsub{}','math':true},'\u2A65':{'tex':'\\rsub{}','math':true},'\u2A66':{'tex':'\\eqdot{}','math':true},'\u2A67':{'tex':'\\dotequiv{}','math':true},'\u2A68':{'tex':'\\equivVert{}','math':true},'\u2A69':{'tex':'\\equivVvert{}','math':true},'\u2A6A':{'tex':'\\dotsim{}','math':true},'\u2A6B':{'tex':'\\simrdots{}','math':true},'\u2A6C':{'tex':'\\simminussim{}','math':true},'\u2A6D':{'tex':'\\congdot{}','math':true},'\u2A6E':{'tex':'\\stackrel{*}{=}','math':true},'\u2A6F':{'tex':'\\hatapprox{}','math':true},'\u2A70':{'tex':'\\approxeqq{}','math':true},'\u2A71':{'tex':'\\eqqplus{}','math':true},'\u2A72':{'tex':'\\pluseqq{}','math':true},'\u2A73':{'tex':'\\eqqsim{}','math':true},'\u2A74':{'tex':'\\Coloneqq{}','math':true},'\u2A75':{'tex':'\\Equal{}','math':true},'\u2A76':{'tex':'\\Same{}','math':true},'\u2A77':{'tex':'\\ddotseq{}','math':true},'\u2A78':{'tex':'\\equivDD{}','math':true},'\u2A79':{'tex':'\\ltcir{}','math':true},'\u2A7A':{'tex':'\\gtcir{}','math':true},'\u2A7B':{'tex':'\\ltquest{}','math':true},'\u2A7C':{'tex':'\\gtquest{}','math':true},'\u2A7D':{'tex':'\\leqslant{}','math':true},'\u2A7E':{'tex':'\\geqslant{}','math':true},'\u2A7F':{'tex':'\\lesdot{}','math':true},'\u2A80':{'tex':'\\gesdot{}','math':true},'\u2A81':{'tex':'\\lesdoto{}','math':true},'\u2A82':{'tex':'\\gesdoto{}','math':true},'\u2A83':{'tex':'\\lesdotor{}','math':true},'\u2A84':{'tex':'\\gesdotol{}','math':true},'\u2A85':{'tex':'\\lessapprox{}','math':true},'\u2A86':{'tex':'\\gtrapprox{}','math':true},'\u2A87':{'tex':'\\lneq{}','math':true},'\u2A88':{'tex':'\\gneq{}','math':true},'\u2A89':{'tex':'\\lnapprox{}','math':true},'\u2A8A':{'tex':'\\gnapprox{}','math':true},'\u2A8B':{'tex':'\\lesseqqgtr{}','math':true},'\u2A8C':{'tex':'\\gtreqqless{}','math':true},'\u2A8D':{'tex':'\\lsime{}','math':true},'\u2A8E':{'tex':'\\gsime{}','math':true},'\u2A8F':{'tex':'\\lsimg{}','math':true},'\u2A90':{'tex':'\\gsiml{}','math':true},'\u2A91':{'tex':'\\lgE{}','math':true},'\u2A92':{'tex':'\\glE{}','math':true},'\u2A93':{'tex':'\\lesges{}','math':true},'\u2A94':{'tex':'\\gesles{}','math':true},'\u2A95':{'tex':'\\eqslantless{}','math':true},'\u2A96':{'tex':'\\eqslantgtr{}','math':true},'\u2A97':{'tex':'\\elsdot{}','math':true},'\u2A98':{'tex':'\\egsdot{}','math':true},'\u2A99':{'tex':'\\eqqless{}','math':true},'\u2A9A':{'tex':'\\eqqgtr{}','math':true},'\u2A9B':{'tex':'\\eqqslantless{}','math':true},'\u2A9C':{'tex':'\\eqqslantgtr{}','math':true},'\u2A9D':{'tex':'\\Pisymbol{ppi020}{117}','math':true},'\u2A9E':{'tex':'\\Pisymbol{ppi020}{105}','math':true},'\u2A9F':{'tex':'\\simlE{}','math':true},'\u2AA0':{'tex':'\\simgE{}','math':true},'\u2AA1':{'tex':'\\NestedLessLess{}','math':true},'\u2AA2':{'tex':'\\NestedGreaterGreater{}','math':true},'\u2AA3':{'tex':'\\partialmeetcontraction{}','math':true},'\u2AA4':{'tex':'\\glj{}','math':true},'\u2AA5':{'tex':'\\gla{}','math':true},'\u2AA6':{'tex':'\\leftslice{}','math':true},'\u2AA7':{'tex':'\\rightslice{}','math':true},'\u2AA8':{'tex':'\\lescc{}','math':true},'\u2AA9':{'tex':'\\gescc{}','math':true},'\u2AAA':{'tex':'\\smt{}','math':true},'\u2AAB':{'tex':'\\lat{}','math':true},'\u2AAC':{'tex':'\\smte{}','math':true},'\u2AAD':{'tex':'\\late{}','math':true},'\u2AAE':{'tex':'\\bumpeqq{}','math':true},'\u2AAF':{'tex':'\\preceq{}','math':true},'\u2AB0':{'tex':'\\succeq{}','math':true},'\u2AB1':{'tex':'\\precneq{}','math':true},'\u2AB2':{'tex':'\\succneq{}','math':true},'\u2AB3':{'tex':'\\preceqq{}','math':true},'\u2AB4':{'tex':'\\succeqq{}','math':true},'\u2AB5':{'tex':'\\precneqq{}','math':true},'\u2AB6':{'tex':'\\succneqq{}','math':true},'\u2AB7':{'tex':'\\precapprox{}','math':true},'\u2AB8':{'tex':'\\succapprox{}','math':true},'\u2AB9':{'tex':'\\precnapprox{}','math':true},'\u2ABA':{'tex':'\\succnapprox{}','math':true},'\u2ABB':{'tex':'\\llcurly{}','math':true},'\u2ABC':{'tex':'\\ggcurly{}','math':true},'\u2ABD':{'tex':'\\subsetdot{}','math':true},'\u2ABE':{'tex':'\\supsetdot{}','math':true},'\u2ABF':{'tex':'\\subsetplus{}','math':true},'\u2AC0':{'tex':'\\supsetplus{}','math':true},'\u2AC1':{'tex':'\\submult{}','math':true},'\u2AC2':{'tex':'\\supmult{}','math':true},'\u2AC3':{'tex':'\\subedot{}','math':true},'\u2AC4':{'tex':'\\supedot{}','math':true},'\u2AC5':{'tex':'\\subseteqq{}','math':true},'\u2AC6':{'tex':'\\supseteqq{}','math':true},'\u2AC7':{'tex':'\\subsim{}','math':true},'\u2AC8':{'tex':'\\supsim{}','math':true},'\u2AC9':{'tex':'\\subsetapprox{}','math':true},'\u2ACA':{'tex':'\\supsetapprox{}','math':true},'\u2ACB':{'tex':'\\subsetneqq{}','math':true},'\u2ACC':{'tex':'\\supsetneqq{}','math':true},'\u2ACD':{'tex':'\\lsqhook{}','math':true},'\u2ACE':{'tex':'\\rsqhook{}','math':true},'\u2ACF':{'tex':'\\csub{}','math':true},'\u2AD0':{'tex':'\\csup{}','math':true},'\u2AD1':{'tex':'\\csube{}','math':true},'\u2AD2':{'tex':'\\csupe{}','math':true},'\u2AD3':{'tex':'\\subsup{}','math':true},'\u2AD4':{'tex':'\\supsub{}','math':true},'\u2AD5':{'tex':'\\subsub{}','math':true},'\u2AD6':{'tex':'\\supsup{}','math':true},'\u2AD7':{'tex':'\\suphsub{}','math':true},'\u2AD8':{'tex':'\\supdsub{}','math':true},'\u2AD9':{'tex':'\\forkv{}','math':true},'\u2ADA':{'tex':'\\topfork{}','math':true},'\u2ADB':{'tex':'\\mlcp{}','math':true},'\u2ADD\u0338':{'tex':'\\forks{}','math':true},'\u2ADD':{'tex':'\\forksnot{}','math':true},'\u2ADE':{'tex':'\\shortlefttack{}','math':true},'\u2ADF':{'tex':'\\shortdowntack{}','math':true},'\u2AE0':{'tex':'\\shortuptack{}','math':true},'\u2AE1':{'tex':'\\perps{}','math':true},'\u2AE2':{'tex':'\\vDdash{}','math':true},'\u2AE3':{'tex':'\\dashV{}','math':true},'\u2AE4':{'tex':'\\Dashv{}','math':true},'\u2AE5':{'tex':'\\DashV{}','math':true},'\u2AE6':{'tex':'\\varVdash{}','math':true},'\u2AE7':{'tex':'\\Barv{}','math':true},'\u2AE8':{'tex':'\\vBar{}','math':true},'\u2AE9':{'tex':'\\vBarv{}','math':true},'\u2AEA':{'tex':'\\Top{}','math':true},'\u2AEB':{'tex':'\\ElsevierGlyph{E30D}','math':true},'\u2AEC':{'tex':'\\Not{}','math':true},'\u2AED':{'tex':'\\bNot{}','math':true},'\u2AEE':{'tex':'\\revnmid{}','math':true},'\u2AEF':{'tex':'\\cirmid{}','math':true},'\u2AF0':{'tex':'\\midcir{}','math':true},'\u2AF1':{'tex':'\\topcir{}','math':true},'\u2AF2':{'tex':'\\nhpar{}','math':true},'\u2AF3':{'tex':'\\parsim{}','math':true},'\u2AF4':{'tex':'\\interleave{}','math':true},'\u2AF5':{'tex':'\\nhVvert{}','math':true},'\u2AF6':{'tex':'\\Elztdcol{}','math':true},'\u2AF7':{'tex':'\\lllnest{}','math':true},'\u2AF8':{'tex':'\\gggnest{}','math':true},'\u2AF9':{'tex':'\\leqqslant{}','math':true},'\u2AFA':{'tex':'\\geqqslant{}','math':true},'\u2AFB':{'tex':'\\trslash{}','math':true},'\u2AFC':{'tex':'\\biginterleave{}','math':true},'\u2AFD':{'tex':'{{/}\\!\\!{/}}','math':true},'\u2AFE':{'tex':'\\talloblong{}','math':true},'\u2AFF':{'tex':'\\bigtalloblong{}','math':true},'\u2B12':{'tex':'\\squaretopblack{}','math':true},'\u2B13':{'tex':'\\squarebotblack{}','math':true},'\u2B14':{'tex':'\\squareurblack{}','math':true},'\u2B15':{'tex':'\\squarellblack{}','math':true},'\u2B16':{'tex':'\\diamondleftblack{}','math':true},'\u2B17':{'tex':'\\diamondrightblack{}','math':true},'\u2B18':{'tex':'\\diamondtopblack{}','math':true},'\u2B19':{'tex':'\\diamondbotblack{}','math':true},'\u2B1A':{'tex':'\\dottedsquare{}','math':true},'\u2B1B':{'tex':'\\blacksquare{}','math':true},'\u2B1C':{'tex':'\\square{}','math':true},'\u2B1D':{'tex':'\\vysmblksquare{}','math':true},'\u2B1E':{'tex':'\\vysmwhtsquare{}','math':true},'\u2B1F':{'tex':'\\pentagonblack{}','math':true},'\u2B20':{'tex':'\\pentagon{}','math':true},'\u2B21':{'tex':'\\varhexagon{}','math':true},'\u2B22':{'tex':'\\varhexagonblack{}','math':true},'\u2B23':{'tex':'\\hexagonblack{}','math':true},'\u2B24':{'tex':'\\lgblkcircle{}','math':true},'\u2B25':{'tex':'\\mdblkdiamond{}','math':true},'\u2B26':{'tex':'\\mdwhtdiamond{}','math':true},'\u2B27':{'tex':'\\mdblklozenge{}','math':true},'\u2B28':{'tex':'\\mdwhtlozenge{}','math':true},'\u2B29':{'tex':'\\smblkdiamond{}','math':true},'\u2B2A':{'tex':'\\smblklozenge{}','math':true},'\u2B2B':{'tex':'\\smwhtlozenge{}','math':true},'\u2B2C':{'tex':'\\blkhorzoval{}','math':true},'\u2B2D':{'tex':'\\whthorzoval{}','math':true},'\u2B2E':{'tex':'\\blkvertoval{}','math':true},'\u2B2F':{'tex':'\\whtvertoval{}','math':true},'\u2B30':{'tex':'\\circleonleftarrow{}','math':true},'\u2B31':{'tex':'\\leftthreearrows{}','math':true},'\u2B32':{'tex':'\\leftarrowonoplus{}','math':true},'\u2B33':{'tex':'\\longleftsquigarrow{}','math':true},'\u2B34':{'tex':'\\nvtwoheadleftarrow{}','math':true},'\u2B35':{'tex':'\\nVtwoheadleftarrow{}','math':true},'\u2B36':{'tex':'\\twoheadmapsfrom{}','math':true},'\u2B37':{'tex':'\\twoheadleftdbkarrow{}','math':true},'\u2B38':{'tex':'\\leftdotarrow{}','math':true},'\u2B39':{'tex':'\\nvleftarrowtail{}','math':true},'\u2B3A':{'tex':'\\nVleftarrowtail{}','math':true},'\u2B3B':{'tex':'\\twoheadleftarrowtail{}','math':true},'\u2B3C':{'tex':'\\nvtwoheadleftarrowtail{}','math':true},'\u2B3D':{'tex':'\\nVtwoheadleftarrowtail{}','math':true},'\u2B3E':{'tex':'\\leftarrowx{}','math':true},'\u2B3F':{'tex':'\\leftcurvedarrow{}','math':true},'\u2B40':{'tex':'\\equalleftarrow{}','math':true},'\u2B41':{'tex':'\\bsimilarleftarrow{}','math':true},'\u2B42':{'tex':'\\leftarrowbackapprox{}','math':true},'\u2B43':{'tex':'\\rightarrowgtr{}','math':true},'\u2B44':{'tex':'\\rightarrowsupset{}','math':true},'\u2B45':{'tex':'\\LLeftarrow{}','math':true},'\u2B46':{'tex':'\\RRightarrow{}','math':true},'\u2B47':{'tex':'\\bsimilarrightarrow{}','math':true},'\u2B48':{'tex':'\\rightarrowbackapprox{}','math':true},'\u2B49':{'tex':'\\similarleftarrow{}','math':true},'\u2B4A':{'tex':'\\leftarrowapprox{}','math':true},'\u2B4B':{'tex':'\\leftarrowbsimilar{}','math':true},'\u2B4C':{'tex':'\\rightarrowbsimilar{}','math':true},'\u2B50':{'tex':'\\medwhitestar{}','math':true},'\u2B51':{'tex':'\\medblackstar{}','math':true},'\u2B52':{'tex':'\\smwhitestar{}','math':true},'\u2B53':{'tex':'\\rightpentagonblack{}','math':true},'\u2B54':{'tex':'\\rightpentagon{}','math':true},'\u300A':{'tex':'\\ElsevierGlyph{300A}','math':true},'\u300B':{'tex':'\\ElsevierGlyph{300B}','math':true},'\u3012':{'tex':'\\postalmark{}','math':true},'\u3014':{'tex':'\\lbrbrak{}','math':true},'\u3015':{'tex':'\\rbrbrak{}','math':true},'\u3018':{'tex':'\\ElsevierGlyph{3018}','math':true},'\u3019':{'tex':'\\ElsevierGlyph{3019}','math':true},'\u301A':{'tex':'\\openbracketleft{}','math':true},'\u301B':{'tex':'\\openbracketright{}','math':true},'\u3030':{'tex':'\\hzigzag{}','math':true},'\uFB00':{'tex':'ff'},'\uFB01':{'tex':'fi'},'\uFB02':{'tex':'fl'},'\uFB03':{'tex':'ffi'},'\uFB04':{'tex':'ffl'},'\uFB05':{'tex':'st'},'\uFB06':{'tex':'st'},'\uFFFD':{'tex':'\\dbend{}'},'\u2242\u0338':{'tex':'\\NotEqualTilde{}','math':true},'\u224B\u0338':{'tex':'\\not\\apid{}','math':true},'\u224E\u0338':{'tex':'\\NotHumpDownHump{}','math':true},'\u224F\u0338':{'tex':'\\NotHumpEqual{}','math':true},'\u2250\u0338':{'tex':'\\not\\doteq{}','math':true},'\u2268\uFE00':{'tex':'\\lvertneqq{}','math':true},'\u2269\uFE00':{'tex':'\\gvertneqq{}','math':true},'\u226A\u0338':{'tex':'\\NotLessLess{}','math':true},'\u226B\u0338':{'tex':'\\NotGreaterGreater{}','math':true},'\u227E\u0338':{'tex':'\\NotPrecedesTilde{}','math':true},'\u227F\u0338':{'tex':'\\NotSucceedsTilde{}','math':true},'\u228A\uFE00':{'tex':'\\varsubsetneqq{}','math':true},'\u228B\uFE00':{'tex':'\\varsupsetneq{}','math':true},'\u228F\u0338':{'tex':'\\NotSquareSubset{}','math':true},'\u2290\u0338':{'tex':'\\NotSquareSuperset{}','math':true},'\u2933\u0338':{'tex':'\\ElsevierGlyph{E21D}','math':true},'\u29CF\u0338':{'tex':'\\NotLeftTriangleBar{}','math':true},'\u29D0\u0338':{'tex':'\\NotRightTriangleBar{}','math':true},'\u2A7D\u0338':{'tex':'\\nleqslant{}','math':true},'\u2A7E\u0338':{'tex':'\\ngeqslant{}','math':true},'\u2AA1\u0338':{'tex':'\\NotNestedLessLess{}','math':true},'\u2AA2\u0338':{'tex':'\\NotNestedGreaterGreater{}','math':true},'\u2AAF\u0338':{'tex':'\\not\\preceq{}','math':true},'\u2AB0\u0338':{'tex':'\\not\\succeq{}','math':true},'\u2AC5\u0338':{'tex':'\\nsubseteqq{}','math':true},'\u2AC6\u0338':{'tex':'\\nsupseteqq{}','math':true},'\u2AFD\u20E5':{'tex':'{\\rlap{\\textbackslash}{{/}\\!\\!{/}}}','math':true},'\uD835\uDC00':{'tex':'\\mathbf{A}','math':true},'\uD835\uDC01':{'tex':'\\mathbf{B}','math':true},'\uD835\uDC02':{'tex':'\\mathbf{C}','math':true},'\uD835\uDC03':{'tex':'\\mathbf{D}','math':true},'\uD835\uDC04':{'tex':'\\mathbf{E}','math':true},'\uD835\uDC05':{'tex':'\\mathbf{F}','math':true},'\uD835\uDC06':{'tex':'\\mathbf{G}','math':true},'\uD835\uDC07':{'tex':'\\mathbf{H}','math':true},'\uD835\uDC08':{'tex':'\\mathbf{I}','math':true},'\uD835\uDC09':{'tex':'\\mathbf{J}','math':true},'\uD835\uDC0A':{'tex':'\\mathbf{K}','math':true},'\uD835\uDC0B':{'tex':'\\mathbf{L}','math':true},'\uD835\uDC0C':{'tex':'\\mathbf{M}','math':true},'\uD835\uDC0D':{'tex':'\\mathbf{N}','math':true},'\uD835\uDC0E':{'tex':'\\mathbf{O}','math':true},'\uD835\uDC0F':{'tex':'\\mathbf{P}','math':true},'\uD835\uDC10':{'tex':'\\mathbf{Q}','math':true},'\uD835\uDC11':{'tex':'\\mathbf{R}','math':true},'\uD835\uDC12':{'tex':'\\mathbf{S}','math':true},'\uD835\uDC13':{'tex':'\\mathbf{T}','math':true},'\uD835\uDC14':{'tex':'\\mathbf{U}','math':true},'\uD835\uDC15':{'tex':'\\mathbf{V}','math':true},'\uD835\uDC16':{'tex':'\\mathbf{W}','math':true},'\uD835\uDC17':{'tex':'\\mathbf{X}','math':true},'\uD835\uDC18':{'tex':'\\mathbf{Y}','math':true},'\uD835\uDC19':{'tex':'\\mathbf{Z}','math':true},'\uD835\uDC1A':{'tex':'\\mathbf{a}','math':true},'\uD835\uDC1B':{'tex':'\\mathbf{b}','math':true},'\uD835\uDC1C':{'tex':'\\mathbf{c}','math':true},'\uD835\uDC1D':{'tex':'\\mathbf{d}','math':true},'\uD835\uDC1E':{'tex':'\\mathbf{e}','math':true},'\uD835\uDC1F':{'tex':'\\mathbf{f}','math':true},'\uD835\uDC20':{'tex':'\\mathbf{g}','math':true},'\uD835\uDC21':{'tex':'\\mathbf{h}','math':true},'\uD835\uDC22':{'tex':'\\mathbf{i}','math':true},'\uD835\uDC23':{'tex':'\\mathbf{j}','math':true},'\uD835\uDC24':{'tex':'\\mathbf{k}','math':true},'\uD835\uDC25':{'tex':'\\mathbf{l}','math':true},'\uD835\uDC26':{'tex':'\\mathbf{m}','math':true},'\uD835\uDC27':{'tex':'\\mathbf{n}','math':true},'\uD835\uDC28':{'tex':'\\mathbf{o}','math':true},'\uD835\uDC29':{'tex':'\\mathbf{p}','math':true},'\uD835\uDC2A':{'tex':'\\mathbf{q}','math':true},'\uD835\uDC2B':{'tex':'\\mathbf{r}','math':true},'\uD835\uDC2C':{'tex':'\\mathbf{s}','math':true},'\uD835\uDC2D':{'tex':'\\mathbf{t}','math':true},'\uD835\uDC2E':{'tex':'\\mathbf{u}','math':true},'\uD835\uDC2F':{'tex':'\\mathbf{v}','math':true},'\uD835\uDC30':{'tex':'\\mathbf{w}','math':true},'\uD835\uDC31':{'tex':'\\mathbf{x}','math':true},'\uD835\uDC32':{'tex':'\\mathbf{y}','math':true},'\uD835\uDC33':{'tex':'\\mathbf{z}','math':true},'\uD835\uDC34':{'tex':'\\mathsl{A}','math':true},'\uD835\uDC35':{'tex':'\\mathsl{B}','math':true},'\uD835\uDC36':{'tex':'\\mathsl{C}','math':true},'\uD835\uDC37':{'tex':'\\mathsl{D}','math':true},'\uD835\uDC38':{'tex':'\\mathsl{E}','math':true},'\uD835\uDC39':{'tex':'\\mathsl{F}','math':true},'\uD835\uDC3A':{'tex':'\\mathsl{G}','math':true},'\uD835\uDC3B':{'tex':'\\mathsl{H}','math':true},'\uD835\uDC3C':{'tex':'\\mathsl{I}','math':true},'\uD835\uDC3D':{'tex':'\\mathsl{J}','math':true},'\uD835\uDC3E':{'tex':'\\mathsl{K}','math':true},'\uD835\uDC3F':{'tex':'\\mathsl{L}','math':true},'\uD835\uDC40':{'tex':'\\mathsl{M}','math':true},'\uD835\uDC41':{'tex':'\\mathsl{N}','math':true},'\uD835\uDC42':{'tex':'\\mathsl{O}','math':true},'\uD835\uDC43':{'tex':'\\mathsl{P}','math':true},'\uD835\uDC44':{'tex':'\\mathsl{Q}','math':true},'\uD835\uDC45':{'tex':'\\mathsl{R}','math':true},'\uD835\uDC46':{'tex':'\\mathsl{S}','math':true},'\uD835\uDC47':{'tex':'\\mathsl{T}','math':true},'\uD835\uDC48':{'tex':'\\mathsl{U}','math':true},'\uD835\uDC49':{'tex':'\\mathsl{V}','math':true},'\uD835\uDC4A':{'tex':'\\mathsl{W}','math':true},'\uD835\uDC4B':{'tex':'\\mathsl{X}','math':true},'\uD835\uDC4C':{'tex':'\\mathsl{Y}','math':true},'\uD835\uDC4D':{'tex':'\\mathsl{Z}','math':true},'\uD835\uDC4E':{'tex':'\\mathsl{a}','math':true},'\uD835\uDC4F':{'tex':'\\mathsl{b}','math':true},'\uD835\uDC50':{'tex':'\\mathsl{c}','math':true},'\uD835\uDC51':{'tex':'\\mathsl{d}','math':true},'\uD835\uDC52':{'tex':'\\mathsl{e}','math':true},'\uD835\uDC53':{'tex':'\\mathsl{f}','math':true},'\uD835\uDC54':{'tex':'\\mathsl{g}','math':true},'\uD835\uDC56':{'tex':'\\mathsl{i}','math':true},'\uD835\uDC57':{'tex':'\\mathsl{j}','math':true},'\uD835\uDC58':{'tex':'\\mathsl{k}','math':true},'\uD835\uDC59':{'tex':'\\mathsl{l}','math':true},'\uD835\uDC5A':{'tex':'\\mathsl{m}','math':true},'\uD835\uDC5B':{'tex':'\\mathsl{n}','math':true},'\uD835\uDC5C':{'tex':'\\mathsl{o}','math':true},'\uD835\uDC5D':{'tex':'\\mathsl{p}','math':true},'\uD835\uDC5E':{'tex':'\\mathsl{q}','math':true},'\uD835\uDC5F':{'tex':'\\mathsl{r}','math':true},'\uD835\uDC60':{'tex':'\\mathsl{s}','math':true},'\uD835\uDC61':{'tex':'\\mathsl{t}','math':true},'\uD835\uDC62':{'tex':'\\mathsl{u}','math':true},'\uD835\uDC63':{'tex':'\\mathsl{v}','math':true},'\uD835\uDC64':{'tex':'\\mathsl{w}','math':true},'\uD835\uDC65':{'tex':'\\mathsl{x}','math':true},'\uD835\uDC66':{'tex':'\\mathsl{y}','math':true},'\uD835\uDC67':{'tex':'\\mathsl{z}','math':true},'\uD835\uDC68':{'tex':'\\mathbit{A}','math':true},'\uD835\uDC69':{'tex':'\\mathbit{B}','math':true},'\uD835\uDC6A':{'tex':'\\mathbit{C}','math':true},'\uD835\uDC6B':{'tex':'\\mathbit{D}','math':true},'\uD835\uDC6C':{'tex':'\\mathbit{E}','math':true},'\uD835\uDC6D':{'tex':'\\mathbit{F}','math':true},'\uD835\uDC6E':{'tex':'\\mathbit{G}','math':true},'\uD835\uDC6F':{'tex':'\\mathbit{H}','math':true},'\uD835\uDC70':{'tex':'\\mathbit{I}','math':true},'\uD835\uDC71':{'tex':'\\mathbit{J}','math':true},'\uD835\uDC72':{'tex':'\\mathbit{K}','math':true},'\uD835\uDC73':{'tex':'\\mathbit{L}','math':true},'\uD835\uDC74':{'tex':'\\mathbit{M}','math':true},'\uD835\uDC75':{'tex':'\\mathbit{N}','math':true},'\uD835\uDC76':{'tex':'\\mathbit{O}','math':true},'\uD835\uDC77':{'tex':'\\mathbit{P}','math':true},'\uD835\uDC78':{'tex':'\\mathbit{Q}','math':true},'\uD835\uDC79':{'tex':'\\mathbit{R}','math':true},'\uD835\uDC7A':{'tex':'\\mathbit{S}','math':true},'\uD835\uDC7B':{'tex':'\\mathbit{T}','math':true},'\uD835\uDC7C':{'tex':'\\mathbit{U}','math':true},'\uD835\uDC7D':{'tex':'\\mathbit{V}','math':true},'\uD835\uDC7E':{'tex':'\\mathbit{W}','math':true},'\uD835\uDC7F':{'tex':'\\mathbit{X}','math':true},'\uD835\uDC80':{'tex':'\\mathbit{Y}','math':true},'\uD835\uDC81':{'tex':'\\mathbit{Z}','math':true},'\uD835\uDC82':{'tex':'\\mathbit{a}','math':true},'\uD835\uDC83':{'tex':'\\mathbit{b}','math':true},'\uD835\uDC84':{'tex':'\\mathbit{c}','math':true},'\uD835\uDC85':{'tex':'\\mathbit{d}','math':true},'\uD835\uDC86':{'tex':'\\mathbit{e}','math':true},'\uD835\uDC87':{'tex':'\\mathbit{f}','math':true},'\uD835\uDC88':{'tex':'\\mathbit{g}','math':true},'\uD835\uDC89':{'tex':'\\mathbit{h}','math':true},'\uD835\uDC8A':{'tex':'\\mathbit{i}','math':true},'\uD835\uDC8B':{'tex':'\\mathbit{j}','math':true},'\uD835\uDC8C':{'tex':'\\mathbit{k}','math':true},'\uD835\uDC8D':{'tex':'\\mathbit{l}','math':true},'\uD835\uDC8E':{'tex':'\\mathbit{m}','math':true},'\uD835\uDC8F':{'tex':'\\mathbit{n}','math':true},'\uD835\uDC90':{'tex':'\\mathbit{o}','math':true},'\uD835\uDC91':{'tex':'\\mathbit{p}','math':true},'\uD835\uDC92':{'tex':'\\mathbit{q}','math':true},'\uD835\uDC93':{'tex':'\\mathbit{r}','math':true},'\uD835\uDC94':{'tex':'\\mathbit{s}','math':true},'\uD835\uDC95':{'tex':'\\mathbit{t}','math':true},'\uD835\uDC96':{'tex':'\\mathbit{u}','math':true},'\uD835\uDC97':{'tex':'\\mathbit{v}','math':true},'\uD835\uDC98':{'tex':'\\mathbit{w}','math':true},'\uD835\uDC99':{'tex':'\\mathbit{x}','math':true},'\uD835\uDC9A':{'tex':'\\mathbit{y}','math':true},'\uD835\uDC9B':{'tex':'\\mathbit{z}','math':true},'\uD835\uDC9C':{'tex':'\\mathscr{A}','math':true},'\uD835\uDC9E':{'tex':'\\mathscr{C}','math':true},'\uD835\uDC9F':{'tex':'\\mathscr{D}','math':true},'\uD835\uDCA2':{'tex':'\\mathscr{G}','math':true},'\uD835\uDCA5':{'tex':'\\mathscr{J}','math':true},'\uD835\uDCA6':{'tex':'\\mathscr{K}','math':true},'\uD835\uDCA9':{'tex':'\\mathscr{N}','math':true},'\uD835\uDCAA':{'tex':'\\mathscr{O}','math':true},'\uD835\uDCAB':{'tex':'\\mathscr{P}','math':true},'\uD835\uDCAC':{'tex':'\\mathscr{Q}','math':true},'\uD835\uDCAE':{'tex':'\\mathscr{S}','math':true},'\uD835\uDCAF':{'tex':'\\mathscr{T}','math':true},'\uD835\uDCB0':{'tex':'\\mathscr{U}','math':true},'\uD835\uDCB1':{'tex':'\\mathscr{V}','math':true},'\uD835\uDCB2':{'tex':'\\mathscr{W}','math':true},'\uD835\uDCB3':{'tex':'\\mathscr{X}','math':true},'\uD835\uDCB4':{'tex':'\\mathscr{Y}','math':true},'\uD835\uDCB5':{'tex':'\\mathscr{Z}','math':true},'\uD835\uDCB6':{'tex':'\\mathscr{a}','math':true},'\uD835\uDCB7':{'tex':'\\mathscr{b}','math':true},'\uD835\uDCB8':{'tex':'\\mathscr{c}','math':true},'\uD835\uDCB9':{'tex':'\\mathscr{d}','math':true},'\uD835\uDCBB':{'tex':'\\mathscr{f}','math':true},'\uD835\uDCBD':{'tex':'\\mathscr{h}','math':true},'\uD835\uDCBE':{'tex':'\\mathscr{i}','math':true},'\uD835\uDCBF':{'tex':'\\mathscr{j}','math':true},'\uD835\uDCC0':{'tex':'\\mathscr{k}','math':true},'\uD835\uDCC1':{'tex':'\\mathscr{l}','math':true},'\uD835\uDCC2':{'tex':'\\mathscr{m}','math':true},'\uD835\uDCC3':{'tex':'\\mathscr{n}','math':true},'\uD835\uDCC5':{'tex':'\\mathscr{p}','math':true},'\uD835\uDCC6':{'tex':'\\mathscr{q}','math':true},'\uD835\uDCC7':{'tex':'\\mathscr{r}','math':true},'\uD835\uDCC8':{'tex':'\\mathscr{s}','math':true},'\uD835\uDCC9':{'tex':'\\mathscr{t}','math':true},'\uD835\uDCCA':{'tex':'\\mathscr{u}','math':true},'\uD835\uDCCB':{'tex':'\\mathscr{v}','math':true},'\uD835\uDCCC':{'tex':'\\mathscr{w}','math':true},'\uD835\uDCCD':{'tex':'\\mathscr{x}','math':true},'\uD835\uDCCE':{'tex':'\\mathscr{y}','math':true},'\uD835\uDCCF':{'tex':'\\mathscr{z}','math':true},'\uD835\uDCD0':{'tex':'\\mathmit{A}','math':true},'\uD835\uDCD1':{'tex':'\\mathmit{B}','math':true},'\uD835\uDCD2':{'tex':'\\mathmit{C}','math':true},'\uD835\uDCD3':{'tex':'\\mathmit{D}','math':true},'\uD835\uDCD4':{'tex':'\\mathmit{E}','math':true},'\uD835\uDCD5':{'tex':'\\mathmit{F}','math':true},'\uD835\uDCD6':{'tex':'\\mathmit{G}','math':true},'\uD835\uDCD7':{'tex':'\\mathmit{H}','math':true},'\uD835\uDCD8':{'tex':'\\mathmit{I}','math':true},'\uD835\uDCD9':{'tex':'\\mathmit{J}','math':true},'\uD835\uDCDA':{'tex':'\\mathmit{K}','math':true},'\uD835\uDCDB':{'tex':'\\mathmit{L}','math':true},'\uD835\uDCDC':{'tex':'\\mathmit{M}','math':true},'\uD835\uDCDD':{'tex':'\\mathmit{N}','math':true},'\uD835\uDCDE':{'tex':'\\mathmit{O}','math':true},'\uD835\uDCDF':{'tex':'\\mathmit{P}','math':true},'\uD835\uDCE0':{'tex':'\\mathmit{Q}','math':true},'\uD835\uDCE1':{'tex':'\\mathmit{R}','math':true},'\uD835\uDCE2':{'tex':'\\mathmit{S}','math':true},'\uD835\uDCE3':{'tex':'\\mathmit{T}','math':true},'\uD835\uDCE4':{'tex':'\\mathmit{U}','math':true},'\uD835\uDCE5':{'tex':'\\mathmit{V}','math':true},'\uD835\uDCE6':{'tex':'\\mathmit{W}','math':true},'\uD835\uDCE7':{'tex':'\\mathmit{X}','math':true},'\uD835\uDCE8':{'tex':'\\mathmit{Y}','math':true},'\uD835\uDCE9':{'tex':'\\mathmit{Z}','math':true},'\uD835\uDCEA':{'tex':'\\mathmit{a}','math':true},'\uD835\uDCEB':{'tex':'\\mathmit{b}','math':true},'\uD835\uDCEC':{'tex':'\\mathmit{c}','math':true},'\uD835\uDCED':{'tex':'\\mathmit{d}','math':true},'\uD835\uDCEE':{'tex':'\\mathmit{e}','math':true},'\uD835\uDCEF':{'tex':'\\mathmit{f}','math':true},'\uD835\uDCF0':{'tex':'\\mathmit{g}','math':true},'\uD835\uDCF1':{'tex':'\\mathmit{h}','math':true},'\uD835\uDCF2':{'tex':'\\mathmit{i}','math':true},'\uD835\uDCF3':{'tex':'\\mathmit{j}','math':true},'\uD835\uDCF4':{'tex':'\\mathmit{k}','math':true},'\uD835\uDCF5':{'tex':'\\mathmit{l}','math':true},'\uD835\uDCF6':{'tex':'\\mathmit{m}','math':true},'\uD835\uDCF7':{'tex':'\\mathmit{n}','math':true},'\uD835\uDCF8':{'tex':'\\mathmit{o}','math':true},'\uD835\uDCF9':{'tex':'\\mathmit{p}','math':true},'\uD835\uDCFA':{'tex':'\\mathmit{q}','math':true},'\uD835\uDCFB':{'tex':'\\mathmit{r}','math':true},'\uD835\uDCFC':{'tex':'\\mathmit{s}','math':true},'\uD835\uDCFD':{'tex':'\\mathmit{t}','math':true},'\uD835\uDCFE':{'tex':'\\mathmit{u}','math':true},'\uD835\uDCFF':{'tex':'\\mathmit{v}','math':true},'\uD835\uDD00':{'tex':'\\mathmit{w}','math':true},'\uD835\uDD01':{'tex':'\\mathmit{x}','math':true},'\uD835\uDD02':{'tex':'\\mathmit{y}','math':true},'\uD835\uDD03':{'tex':'\\mathmit{z}','math':true},'\uD835\uDD04':{'tex':'\\mathfrak{A}','math':true},'\uD835\uDD05':{'tex':'\\mathfrak{B}','math':true},'\uD835\uDD07':{'tex':'\\mathfrak{D}','math':true},'\uD835\uDD08':{'tex':'\\mathfrak{E}','math':true},'\uD835\uDD09':{'tex':'\\mathfrak{F}','math':true},'\uD835\uDD0A':{'tex':'\\mathfrak{G}','math':true},'\uD835\uDD0D':{'tex':'\\mathfrak{J}','math':true},'\uD835\uDD0E':{'tex':'\\mathfrak{K}','math':true},'\uD835\uDD0F':{'tex':'\\mathfrak{L}','math':true},'\uD835\uDD10':{'tex':'\\mathfrak{M}','math':true},'\uD835\uDD11':{'tex':'\\mathfrak{N}','math':true},'\uD835\uDD12':{'tex':'\\mathfrak{O}','math':true},'\uD835\uDD13':{'tex':'\\mathfrak{P}','math':true},'\uD835\uDD14':{'tex':'\\mathfrak{Q}','math':true},'\uD835\uDD16':{'tex':'\\mathfrak{S}','math':true},'\uD835\uDD17':{'tex':'\\mathfrak{T}','math':true},'\uD835\uDD18':{'tex':'\\mathfrak{U}','math':true},'\uD835\uDD19':{'tex':'\\mathfrak{V}','math':true},'\uD835\uDD1A':{'tex':'\\mathfrak{W}','math':true},'\uD835\uDD1B':{'tex':'\\mathfrak{X}','math':true},'\uD835\uDD1C':{'tex':'\\mathfrak{Y}','math':true},'\uD835\uDD1E':{'tex':'\\mathfrak{a}','math':true},'\uD835\uDD1F':{'tex':'\\mathfrak{b}','math':true},'\uD835\uDD20':{'tex':'\\mathfrak{c}','math':true},'\uD835\uDD21':{'tex':'\\mathfrak{d}','math':true},'\uD835\uDD22':{'tex':'\\mathfrak{e}','math':true},'\uD835\uDD23':{'tex':'\\mathfrak{f}','math':true},'\uD835\uDD24':{'tex':'\\mathfrak{g}','math':true},'\uD835\uDD25':{'tex':'\\mathfrak{h}','math':true},'\uD835\uDD26':{'tex':'\\mathfrak{i}','math':true},'\uD835\uDD27':{'tex':'\\mathfrak{j}','math':true},'\uD835\uDD28':{'tex':'\\mathfrak{k}','math':true},'\uD835\uDD29':{'tex':'\\mathfrak{l}','math':true},'\uD835\uDD2A':{'tex':'\\mathfrak{m}','math':true},'\uD835\uDD2B':{'tex':'\\mathfrak{n}','math':true},'\uD835\uDD2C':{'tex':'\\mathfrak{o}','math':true},'\uD835\uDD2D':{'tex':'\\mathfrak{p}','math':true},'\uD835\uDD2E':{'tex':'\\mathfrak{q}','math':true},'\uD835\uDD2F':{'tex':'\\mathfrak{r}','math':true},'\uD835\uDD30':{'tex':'\\mathfrak{s}','math':true},'\uD835\uDD31':{'tex':'\\mathfrak{t}','math':true},'\uD835\uDD32':{'tex':'\\mathfrak{u}','math':true},'\uD835\uDD33':{'tex':'\\mathfrak{v}','math':true},'\uD835\uDD34':{'tex':'\\mathfrak{w}','math':true},'\uD835\uDD35':{'tex':'\\mathfrak{x}','math':true},'\uD835\uDD36':{'tex':'\\mathfrak{y}','math':true},'\uD835\uDD37':{'tex':'\\mathfrak{z}','math':true},'\uD835\uDD38':{'tex':'\\mathbb{A}','math':true},'\uD835\uDD39':{'tex':'\\mathbb{B}','math':true},'\uD835\uDD3B':{'tex':'\\mathbb{D}','math':true},'\uD835\uDD3C':{'tex':'\\mathbb{E}','math':true},'\uD835\uDD3D':{'tex':'\\mathbb{F}','math':true},'\uD835\uDD3E':{'tex':'\\mathbb{G}','math':true},'\uD835\uDD40':{'tex':'\\mathbb{I}','math':true},'\uD835\uDD41':{'tex':'\\mathbb{J}','math':true},'\uD835\uDD42':{'tex':'\\mathbb{K}','math':true},'\uD835\uDD43':{'tex':'\\mathbb{L}','math':true},'\uD835\uDD44':{'tex':'\\mathbb{M}','math':true},'\uD835\uDD46':{'tex':'\\mathbb{O}','math':true},'\uD835\uDD4A':{'tex':'\\mathbb{S}','math':true},'\uD835\uDD4B':{'tex':'\\mathbb{T}','math':true},'\uD835\uDD4C':{'tex':'\\mathbb{U}','math':true},'\uD835\uDD4D':{'tex':'\\mathbb{V}','math':true},'\uD835\uDD4E':{'tex':'\\mathbb{W}','math':true},'\uD835\uDD4F':{'tex':'\\mathbb{X}','math':true},'\uD835\uDD50':{'tex':'\\mathbb{Y}','math':true},'\uD835\uDD52':{'tex':'\\mathbb{a}','math':true},'\uD835\uDD53':{'tex':'\\mathbb{b}','math':true},'\uD835\uDD54':{'tex':'\\mathbb{c}','math':true},'\uD835\uDD55':{'tex':'\\mathbb{d}','math':true},'\uD835\uDD56':{'tex':'\\mathbb{e}','math':true},'\uD835\uDD57':{'tex':'\\mathbb{f}','math':true},'\uD835\uDD58':{'tex':'\\mathbb{g}','math':true},'\uD835\uDD59':{'tex':'\\mathbb{h}','math':true},'\uD835\uDD5A':{'tex':'\\mathbb{i}','math':true},'\uD835\uDD5B':{'tex':'\\mathbb{j}','math':true},'\uD835\uDD5C':{'tex':'\\mathbb{k}','math':true},'\uD835\uDD5D':{'tex':'\\mathbb{l}','math':true},'\uD835\uDD5E':{'tex':'\\mathbb{m}','math':true},'\uD835\uDD5F':{'tex':'\\mathbb{n}','math':true},'\uD835\uDD60':{'tex':'\\mathbb{o}','math':true},'\uD835\uDD61':{'tex':'\\mathbb{p}','math':true},'\uD835\uDD62':{'tex':'\\mathbb{q}','math':true},'\uD835\uDD63':{'tex':'\\mathbb{r}','math':true},'\uD835\uDD64':{'tex':'\\mathbb{s}','math':true},'\uD835\uDD65':{'tex':'\\mathbb{t}','math':true},'\uD835\uDD66':{'tex':'\\mathbb{u}','math':true},'\uD835\uDD67':{'tex':'\\mathbb{v}','math':true},'\uD835\uDD68':{'tex':'\\mathbb{w}','math':true},'\uD835\uDD69':{'tex':'\\mathbb{x}','math':true},'\uD835\uDD6A':{'tex':'\\mathbb{y}','math':true},'\uD835\uDD6B':{'tex':'\\mathbb{z}','math':true},'\uD835\uDD6C':{'tex':'\\mathslbb{A}','math':true},'\uD835\uDD6D':{'tex':'\\mathslbb{B}','math':true},'\uD835\uDD6E':{'tex':'\\mathslbb{C}','math':true},'\uD835\uDD6F':{'tex':'\\mathslbb{D}','math':true},'\uD835\uDD70':{'tex':'\\mathslbb{E}','math':true},'\uD835\uDD71':{'tex':'\\mathslbb{F}','math':true},'\uD835\uDD72':{'tex':'\\mathslbb{G}','math':true},'\uD835\uDD73':{'tex':'\\mathslbb{H}','math':true},'\uD835\uDD74':{'tex':'\\mathslbb{I}','math':true},'\uD835\uDD75':{'tex':'\\mathslbb{J}','math':true},'\uD835\uDD76':{'tex':'\\mathslbb{K}','math':true},'\uD835\uDD77':{'tex':'\\mathslbb{L}','math':true},'\uD835\uDD78':{'tex':'\\mathslbb{M}','math':true},'\uD835\uDD79':{'tex':'\\mathslbb{N}','math':true},'\uD835\uDD7A':{'tex':'\\mathslbb{O}','math':true},'\uD835\uDD7B':{'tex':'\\mathslbb{P}','math':true},'\uD835\uDD7C':{'tex':'\\mathslbb{Q}','math':true},'\uD835\uDD7D':{'tex':'\\mathslbb{R}','math':true},'\uD835\uDD7E':{'tex':'\\mathslbb{S}','math':true},'\uD835\uDD7F':{'tex':'\\mathslbb{T}','math':true},'\uD835\uDD80':{'tex':'\\mathslbb{U}','math':true},'\uD835\uDD81':{'tex':'\\mathslbb{V}','math':true},'\uD835\uDD82':{'tex':'\\mathslbb{W}','math':true},'\uD835\uDD83':{'tex':'\\mathslbb{X}','math':true},'\uD835\uDD84':{'tex':'\\mathslbb{Y}','math':true},'\uD835\uDD85':{'tex':'\\mathslbb{Z}','math':true},'\uD835\uDD86':{'tex':'\\mathslbb{a}','math':true},'\uD835\uDD87':{'tex':'\\mathslbb{b}','math':true},'\uD835\uDD88':{'tex':'\\mathslbb{c}','math':true},'\uD835\uDD89':{'tex':'\\mathslbb{d}','math':true},'\uD835\uDD8A':{'tex':'\\mathslbb{e}','math':true},'\uD835\uDD8B':{'tex':'\\mathslbb{f}','math':true},'\uD835\uDD8C':{'tex':'\\mathslbb{g}','math':true},'\uD835\uDD8D':{'tex':'\\mathslbb{h}','math':true},'\uD835\uDD8E':{'tex':'\\mathslbb{i}','math':true},'\uD835\uDD8F':{'tex':'\\mathslbb{j}','math':true},'\uD835\uDD90':{'tex':'\\mathslbb{k}','math':true},'\uD835\uDD91':{'tex':'\\mathslbb{l}','math':true},'\uD835\uDD92':{'tex':'\\mathslbb{m}','math':true},'\uD835\uDD93':{'tex':'\\mathslbb{n}','math':true},'\uD835\uDD94':{'tex':'\\mathslbb{o}','math':true},'\uD835\uDD95':{'tex':'\\mathslbb{p}','math':true},'\uD835\uDD96':{'tex':'\\mathslbb{q}','math':true},'\uD835\uDD97':{'tex':'\\mathslbb{r}','math':true},'\uD835\uDD98':{'tex':'\\mathslbb{s}','math':true},'\uD835\uDD99':{'tex':'\\mathslbb{t}','math':true},'\uD835\uDD9A':{'tex':'\\mathslbb{u}','math':true},'\uD835\uDD9B':{'tex':'\\mathslbb{v}','math':true},'\uD835\uDD9C':{'tex':'\\mathslbb{w}','math':true},'\uD835\uDD9D':{'tex':'\\mathslbb{x}','math':true},'\uD835\uDD9E':{'tex':'\\mathslbb{y}','math':true},'\uD835\uDD9F':{'tex':'\\mathslbb{z}','math':true},'\uD835\uDDA0':{'tex':'\\mathsf{A}','math':true},'\uD835\uDDA1':{'tex':'\\mathsf{B}','math':true},'\uD835\uDDA2':{'tex':'\\mathsf{C}','math':true},'\uD835\uDDA3':{'tex':'\\mathsf{D}','math':true},'\uD835\uDDA4':{'tex':'\\mathsf{E}','math':true},'\uD835\uDDA5':{'tex':'\\mathsf{F}','math':true},'\uD835\uDDA6':{'tex':'\\mathsf{G}','math':true},'\uD835\uDDA7':{'tex':'\\mathsf{H}','math':true},'\uD835\uDDA8':{'tex':'\\mathsf{I}','math':true},'\uD835\uDDA9':{'tex':'\\mathsf{J}','math':true},'\uD835\uDDAA':{'tex':'\\mathsf{K}','math':true},'\uD835\uDDAB':{'tex':'\\mathsf{L}','math':true},'\uD835\uDDAC':{'tex':'\\mathsf{M}','math':true},'\uD835\uDDAD':{'tex':'\\mathsf{N}','math':true},'\uD835\uDDAE':{'tex':'\\mathsf{O}','math':true},'\uD835\uDDAF':{'tex':'\\mathsf{P}','math':true},'\uD835\uDDB0':{'tex':'\\mathsf{Q}','math':true},'\uD835\uDDB1':{'tex':'\\mathsf{R}','math':true},'\uD835\uDDB2':{'tex':'\\mathsf{S}','math':true},'\uD835\uDDB3':{'tex':'\\mathsf{T}','math':true},'\uD835\uDDB4':{'tex':'\\mathsf{U}','math':true},'\uD835\uDDB5':{'tex':'\\mathsf{V}','math':true},'\uD835\uDDB6':{'tex':'\\mathsf{W}','math':true},'\uD835\uDDB7':{'tex':'\\mathsf{X}','math':true},'\uD835\uDDB8':{'tex':'\\mathsf{Y}','math':true},'\uD835\uDDB9':{'tex':'\\mathsf{Z}','math':true},'\uD835\uDDBA':{'tex':'\\mathsf{a}','math':true},'\uD835\uDDBB':{'tex':'\\mathsf{b}','math':true},'\uD835\uDDBC':{'tex':'\\mathsf{c}','math':true},'\uD835\uDDBD':{'tex':'\\mathsf{d}','math':true},'\uD835\uDDBE':{'tex':'\\mathsf{e}','math':true},'\uD835\uDDBF':{'tex':'\\mathsf{f}','math':true},'\uD835\uDDC0':{'tex':'\\mathsf{g}','math':true},'\uD835\uDDC1':{'tex':'\\mathsf{h}','math':true},'\uD835\uDDC2':{'tex':'\\mathsf{i}','math':true},'\uD835\uDDC3':{'tex':'\\mathsf{j}','math':true},'\uD835\uDDC4':{'tex':'\\mathsf{k}','math':true},'\uD835\uDDC5':{'tex':'\\mathsf{l}','math':true},'\uD835\uDDC6':{'tex':'\\mathsf{m}','math':true},'\uD835\uDDC7':{'tex':'\\mathsf{n}','math':true},'\uD835\uDDC8':{'tex':'\\mathsf{o}','math':true},'\uD835\uDDC9':{'tex':'\\mathsf{p}','math':true},'\uD835\uDDCA':{'tex':'\\mathsf{q}','math':true},'\uD835\uDDCB':{'tex':'\\mathsf{r}','math':true},'\uD835\uDDCC':{'tex':'\\mathsf{s}','math':true},'\uD835\uDDCD':{'tex':'\\mathsf{t}','math':true},'\uD835\uDDCE':{'tex':'\\mathsf{u}','math':true},'\uD835\uDDCF':{'tex':'\\mathsf{v}','math':true},'\uD835\uDDD0':{'tex':'\\mathsf{w}','math':true},'\uD835\uDDD1':{'tex':'\\mathsf{x}','math':true},'\uD835\uDDD2':{'tex':'\\mathsf{y}','math':true},'\uD835\uDDD3':{'tex':'\\mathsf{z}','math':true},'\uD835\uDDD4':{'tex':'\\mathsfbf{A}','math':true},'\uD835\uDDD5':{'tex':'\\mathsfbf{B}','math':true},'\uD835\uDDD6':{'tex':'\\mathsfbf{C}','math':true},'\uD835\uDDD7':{'tex':'\\mathsfbf{D}','math':true},'\uD835\uDDD8':{'tex':'\\mathsfbf{E}','math':true},'\uD835\uDDD9':{'tex':'\\mathsfbf{F}','math':true},'\uD835\uDDDA':{'tex':'\\mathsfbf{G}','math':true},'\uD835\uDDDB':{'tex':'\\mathsfbf{H}','math':true},'\uD835\uDDDC':{'tex':'\\mathsfbf{I}','math':true},'\uD835\uDDDD':{'tex':'\\mathsfbf{J}','math':true},'\uD835\uDDDE':{'tex':'\\mathsfbf{K}','math':true},'\uD835\uDDDF':{'tex':'\\mathsfbf{L}','math':true},'\uD835\uDDE0':{'tex':'\\mathsfbf{M}','math':true},'\uD835\uDDE1':{'tex':'\\mathsfbf{N}','math':true},'\uD835\uDDE2':{'tex':'\\mathsfbf{O}','math':true},'\uD835\uDDE3':{'tex':'\\mathsfbf{P}','math':true},'\uD835\uDDE4':{'tex':'\\mathsfbf{Q}','math':true},'\uD835\uDDE5':{'tex':'\\mathsfbf{R}','math':true},'\uD835\uDDE6':{'tex':'\\mathsfbf{S}','math':true},'\uD835\uDDE7':{'tex':'\\mathsfbf{T}','math':true},'\uD835\uDDE8':{'tex':'\\mathsfbf{U}','math':true},'\uD835\uDDE9':{'tex':'\\mathsfbf{V}','math':true},'\uD835\uDDEA':{'tex':'\\mathsfbf{W}','math':true},'\uD835\uDDEB':{'tex':'\\mathsfbf{X}','math':true},'\uD835\uDDEC':{'tex':'\\mathsfbf{Y}','math':true},'\uD835\uDDED':{'tex':'\\mathsfbf{Z}','math':true},'\uD835\uDDEE':{'tex':'\\mathsfbf{a}','math':true},'\uD835\uDDEF':{'tex':'\\mathsfbf{b}','math':true},'\uD835\uDDF0':{'tex':'\\mathsfbf{c}','math':true},'\uD835\uDDF1':{'tex':'\\mathsfbf{d}','math':true},'\uD835\uDDF2':{'tex':'\\mathsfbf{e}','math':true},'\uD835\uDDF3':{'tex':'\\mathsfbf{f}','math':true},'\uD835\uDDF4':{'tex':'\\mathsfbf{g}','math':true},'\uD835\uDDF5':{'tex':'\\mathsfbf{h}','math':true},'\uD835\uDDF6':{'tex':'\\mathsfbf{i}','math':true},'\uD835\uDDF7':{'tex':'\\mathsfbf{j}','math':true},'\uD835\uDDF8':{'tex':'\\mathsfbf{k}','math':true},'\uD835\uDDF9':{'tex':'\\mathsfbf{l}','math':true},'\uD835\uDDFA':{'tex':'\\mathsfbf{m}','math':true},'\uD835\uDDFB':{'tex':'\\mathsfbf{n}','math':true},'\uD835\uDDFC':{'tex':'\\mathsfbf{o}','math':true},'\uD835\uDDFD':{'tex':'\\mathsfbf{p}','math':true},'\uD835\uDDFE':{'tex':'\\mathsfbf{q}','math':true},'\uD835\uDDFF':{'tex':'\\mathsfbf{r}','math':true},'\uD835\uDE00':{'tex':'\\mathsfbf{s}','math':true},'\uD835\uDE01':{'tex':'\\mathsfbf{t}','math':true},'\uD835\uDE02':{'tex':'\\mathsfbf{u}','math':true},'\uD835\uDE03':{'tex':'\\mathsfbf{v}','math':true},'\uD835\uDE04':{'tex':'\\mathsfbf{w}','math':true},'\uD835\uDE05':{'tex':'\\mathsfbf{x}','math':true},'\uD835\uDE06':{'tex':'\\mathsfbf{y}','math':true},'\uD835\uDE07':{'tex':'\\mathsfbf{z}','math':true},'\uD835\uDE08':{'tex':'\\mathsfsl{A}','math':true},'\uD835\uDE09':{'tex':'\\mathsfsl{B}','math':true},'\uD835\uDE0A':{'tex':'\\mathsfsl{C}','math':true},'\uD835\uDE0B':{'tex':'\\mathsfsl{D}','math':true},'\uD835\uDE0C':{'tex':'\\mathsfsl{E}','math':true},'\uD835\uDE0D':{'tex':'\\mathsfsl{F}','math':true},'\uD835\uDE0E':{'tex':'\\mathsfsl{G}','math':true},'\uD835\uDE0F':{'tex':'\\mathsfsl{H}','math':true},'\uD835\uDE10':{'tex':'\\mathsfsl{I}','math':true},'\uD835\uDE11':{'tex':'\\mathsfsl{J}','math':true},'\uD835\uDE12':{'tex':'\\mathsfsl{K}','math':true},'\uD835\uDE13':{'tex':'\\mathsfsl{L}','math':true},'\uD835\uDE14':{'tex':'\\mathsfsl{M}','math':true},'\uD835\uDE15':{'tex':'\\mathsfsl{N}','math':true},'\uD835\uDE16':{'tex':'\\mathsfsl{O}','math':true},'\uD835\uDE17':{'tex':'\\mathsfsl{P}','math':true},'\uD835\uDE18':{'tex':'\\mathsfsl{Q}','math':true},'\uD835\uDE19':{'tex':'\\mathsfsl{R}','math':true},'\uD835\uDE1A':{'tex':'\\mathsfsl{S}','math':true},'\uD835\uDE1B':{'tex':'\\mathsfsl{T}','math':true},'\uD835\uDE1C':{'tex':'\\mathsfsl{U}','math':true},'\uD835\uDE1D':{'tex':'\\mathsfsl{V}','math':true},'\uD835\uDE1E':{'tex':'\\mathsfsl{W}','math':true},'\uD835\uDE1F':{'tex':'\\mathsfsl{X}','math':true},'\uD835\uDE20':{'tex':'\\mathsfsl{Y}','math':true},'\uD835\uDE21':{'tex':'\\mathsfsl{Z}','math':true},'\uD835\uDE22':{'tex':'\\mathsfsl{a}','math':true},'\uD835\uDE23':{'tex':'\\mathsfsl{b}','math':true},'\uD835\uDE24':{'tex':'\\mathsfsl{c}','math':true},'\uD835\uDE25':{'tex':'\\mathsfsl{d}','math':true},'\uD835\uDE26':{'tex':'\\mathsfsl{e}','math':true},'\uD835\uDE27':{'tex':'\\mathsfsl{f}','math':true},'\uD835\uDE28':{'tex':'\\mathsfsl{g}','math':true},'\uD835\uDE29':{'tex':'\\mathsfsl{h}','math':true},'\uD835\uDE2A':{'tex':'\\mathsfsl{i}','math':true},'\uD835\uDE2B':{'tex':'\\mathsfsl{j}','math':true},'\uD835\uDE2C':{'tex':'\\mathsfsl{k}','math':true},'\uD835\uDE2D':{'tex':'\\mathsfsl{l}','math':true},'\uD835\uDE2E':{'tex':'\\mathsfsl{m}','math':true},'\uD835\uDE2F':{'tex':'\\mathsfsl{n}','math':true},'\uD835\uDE30':{'tex':'\\mathsfsl{o}','math':true},'\uD835\uDE31':{'tex':'\\mathsfsl{p}','math':true},'\uD835\uDE32':{'tex':'\\mathsfsl{q}','math':true},'\uD835\uDE33':{'tex':'\\mathsfsl{r}','math':true},'\uD835\uDE34':{'tex':'\\mathsfsl{s}','math':true},'\uD835\uDE35':{'tex':'\\mathsfsl{t}','math':true},'\uD835\uDE36':{'tex':'\\mathsfsl{u}','math':true},'\uD835\uDE37':{'tex':'\\mathsfsl{v}','math':true},'\uD835\uDE38':{'tex':'\\mathsfsl{w}','math':true},'\uD835\uDE39':{'tex':'\\mathsfsl{x}','math':true},'\uD835\uDE3A':{'tex':'\\mathsfsl{y}','math':true},'\uD835\uDE3B':{'tex':'\\mathsfsl{z}','math':true},'\uD835\uDE3C':{'tex':'\\mathsfbfsl{A}','math':true},'\uD835\uDE3D':{'tex':'\\mathsfbfsl{B}','math':true},'\uD835\uDE3E':{'tex':'\\mathsfbfsl{C}','math':true},'\uD835\uDE3F':{'tex':'\\mathsfbfsl{D}','math':true},'\uD835\uDE40':{'tex':'\\mathsfbfsl{E}','math':true},'\uD835\uDE41':{'tex':'\\mathsfbfsl{F}','math':true},'\uD835\uDE42':{'tex':'\\mathsfbfsl{G}','math':true},'\uD835\uDE43':{'tex':'\\mathsfbfsl{H}','math':true},'\uD835\uDE44':{'tex':'\\mathsfbfsl{I}','math':true},'\uD835\uDE45':{'tex':'\\mathsfbfsl{J}','math':true},'\uD835\uDE46':{'tex':'\\mathsfbfsl{K}','math':true},'\uD835\uDE47':{'tex':'\\mathsfbfsl{L}','math':true},'\uD835\uDE48':{'tex':'\\mathsfbfsl{M}','math':true},'\uD835\uDE49':{'tex':'\\mathsfbfsl{N}','math':true},'\uD835\uDE4A':{'tex':'\\mathsfbfsl{O}','math':true},'\uD835\uDE4B':{'tex':'\\mathsfbfsl{P}','math':true},'\uD835\uDE4C':{'tex':'\\mathsfbfsl{Q}','math':true},'\uD835\uDE4D':{'tex':'\\mathsfbfsl{R}','math':true},'\uD835\uDE4E':{'tex':'\\mathsfbfsl{S}','math':true},'\uD835\uDE4F':{'tex':'\\mathsfbfsl{T}','math':true},'\uD835\uDE50':{'tex':'\\mathsfbfsl{U}','math':true},'\uD835\uDE51':{'tex':'\\mathsfbfsl{V}','math':true},'\uD835\uDE52':{'tex':'\\mathsfbfsl{W}','math':true},'\uD835\uDE53':{'tex':'\\mathsfbfsl{X}','math':true},'\uD835\uDE54':{'tex':'\\mathsfbfsl{Y}','math':true},'\uD835\uDE55':{'tex':'\\mathsfbfsl{Z}','math':true},'\uD835\uDE56':{'tex':'\\mathsfbfsl{a}','math':true},'\uD835\uDE57':{'tex':'\\mathsfbfsl{b}','math':true},'\uD835\uDE58':{'tex':'\\mathsfbfsl{c}','math':true},'\uD835\uDE59':{'tex':'\\mathsfbfsl{d}','math':true},'\uD835\uDE5A':{'tex':'\\mathsfbfsl{e}','math':true},'\uD835\uDE5B':{'tex':'\\mathsfbfsl{f}','math':true},'\uD835\uDE5C':{'tex':'\\mathsfbfsl{g}','math':true},'\uD835\uDE5D':{'tex':'\\mathsfbfsl{h}','math':true},'\uD835\uDE5E':{'tex':'\\mathsfbfsl{i}','math':true},'\uD835\uDE5F':{'tex':'\\mathsfbfsl{j}','math':true},'\uD835\uDE60':{'tex':'\\mathsfbfsl{k}','math':true},'\uD835\uDE61':{'tex':'\\mathsfbfsl{l}','math':true},'\uD835\uDE62':{'tex':'\\mathsfbfsl{m}','math':true},'\uD835\uDE63':{'tex':'\\mathsfbfsl{n}','math':true},'\uD835\uDE64':{'tex':'\\mathsfbfsl{o}','math':true},'\uD835\uDE65':{'tex':'\\mathsfbfsl{p}','math':true},'\uD835\uDE66':{'tex':'\\mathsfbfsl{q}','math':true},'\uD835\uDE67':{'tex':'\\mathsfbfsl{r}','math':true},'\uD835\uDE68':{'tex':'\\mathsfbfsl{s}','math':true},'\uD835\uDE69':{'tex':'\\mathsfbfsl{t}','math':true},'\uD835\uDE6A':{'tex':'\\mathsfbfsl{u}','math':true},'\uD835\uDE6B':{'tex':'\\mathsfbfsl{v}','math':true},'\uD835\uDE6C':{'tex':'\\mathsfbfsl{w}','math':true},'\uD835\uDE6D':{'tex':'\\mathsfbfsl{x}','math':true},'\uD835\uDE6E':{'tex':'\\mathsfbfsl{y}','math':true},'\uD835\uDE6F':{'tex':'\\mathsfbfsl{z}','math':true},'\uD835\uDE70':{'tex':'\\mathtt{A}','math':true},'\uD835\uDE71':{'tex':'\\mathtt{B}','math':true},'\uD835\uDE72':{'tex':'\\mathtt{C}','math':true},'\uD835\uDE73':{'tex':'\\mathtt{D}','math':true},'\uD835\uDE74':{'tex':'\\mathtt{E}','math':true},'\uD835\uDE75':{'tex':'\\mathtt{F}','math':true},'\uD835\uDE76':{'tex':'\\mathtt{G}','math':true},'\uD835\uDE77':{'tex':'\\mathtt{H}','math':true},'\uD835\uDE78':{'tex':'\\mathtt{I}','math':true},'\uD835\uDE79':{'tex':'\\mathtt{J}','math':true},'\uD835\uDE7A':{'tex':'\\mathtt{K}','math':true},'\uD835\uDE7B':{'tex':'\\mathtt{L}','math':true},'\uD835\uDE7C':{'tex':'\\mathtt{M}','math':true},'\uD835\uDE7D':{'tex':'\\mathtt{N}','math':true},'\uD835\uDE7E':{'tex':'\\mathtt{O}','math':true},'\uD835\uDE7F':{'tex':'\\mathtt{P}','math':true},'\uD835\uDE80':{'tex':'\\mathtt{Q}','math':true},'\uD835\uDE81':{'tex':'\\mathtt{R}','math':true},'\uD835\uDE82':{'tex':'\\mathtt{S}','math':true},'\uD835\uDE83':{'tex':'\\mathtt{T}','math':true},'\uD835\uDE84':{'tex':'\\mathtt{U}','math':true},'\uD835\uDE85':{'tex':'\\mathtt{V}','math':true},'\uD835\uDE86':{'tex':'\\mathtt{W}','math':true},'\uD835\uDE87':{'tex':'\\mathtt{X}','math':true},'\uD835\uDE88':{'tex':'\\mathtt{Y}','math':true},'\uD835\uDE89':{'tex':'\\mathtt{Z}','math':true},'\uD835\uDE8A':{'tex':'\\mathtt{a}','math':true},'\uD835\uDE8B':{'tex':'\\mathtt{b}','math':true},'\uD835\uDE8C':{'tex':'\\mathtt{c}','math':true},'\uD835\uDE8D':{'tex':'\\mathtt{d}','math':true},'\uD835\uDE8E':{'tex':'\\mathtt{e}','math':true},'\uD835\uDE8F':{'tex':'\\mathtt{f}','math':true},'\uD835\uDE90':{'tex':'\\mathtt{g}','math':true},'\uD835\uDE91':{'tex':'\\mathtt{h}','math':true},'\uD835\uDE92':{'tex':'\\mathtt{i}','math':true},'\uD835\uDE93':{'tex':'\\mathtt{j}','math':true},'\uD835\uDE94':{'tex':'\\mathtt{k}','math':true},'\uD835\uDE95':{'tex':'\\mathtt{l}','math':true},'\uD835\uDE96':{'tex':'\\mathtt{m}','math':true},'\uD835\uDE97':{'tex':'\\mathtt{n}','math':true},'\uD835\uDE98':{'tex':'\\mathtt{o}','math':true},'\uD835\uDE99':{'tex':'\\mathtt{p}','math':true},'\uD835\uDE9A':{'tex':'\\mathtt{q}','math':true},'\uD835\uDE9B':{'tex':'\\mathtt{r}','math':true},'\uD835\uDE9C':{'tex':'\\mathtt{s}','math':true},'\uD835\uDE9D':{'tex':'\\mathtt{t}','math':true},'\uD835\uDE9E':{'tex':'\\mathtt{u}','math':true},'\uD835\uDE9F':{'tex':'\\mathtt{v}','math':true},'\uD835\uDEA0':{'tex':'\\mathtt{w}','math':true},'\uD835\uDEA1':{'tex':'\\mathtt{x}','math':true},'\uD835\uDEA2':{'tex':'\\mathtt{y}','math':true},'\uD835\uDEA3':{'tex':'\\mathtt{z}','math':true},'\uD835\uDEA4':{'tex':'\\imath{}','math':true},'\uD835\uDEA5':{'tex':'\\jmath{}','math':true},'\uD835\uDEA8':{'tex':'\\mathbf{A}','math':true},'\uD835\uDEA9':{'tex':'\\mathbf{B}','math':true},'\uD835\uDEAA':{'tex':'\\mathbf{\\Gamma}','math':true},'\uD835\uDEAB':{'tex':'\\mathbf{\\Delta}','math':true},'\uD835\uDEAC':{'tex':'\\mathbf{E}','math':true},'\uD835\uDEAD':{'tex':'\\mathbf{Z}','math':true},'\uD835\uDEAE':{'tex':'\\mathbf{H}','math':true},'\uD835\uDEAF':{'tex':'\\mathbf{\\Theta}','math':true},'\uD835\uDEB0':{'tex':'\\mathbf{I}','math':true},'\uD835\uDEB1':{'tex':'\\mathbf{K}','math':true},'\uD835\uDEB2':{'tex':'\\mathbf{\\Lambda}','math':true},'\uD835\uDEB3':{'tex':'M','math':true},'\uD835\uDEB4':{'tex':'N','math':true},'\uD835\uDEB5':{'tex':'\\mathbf{\\Xi}','math':true},'\uD835\uDEB6':{'tex':'O','math':true},'\uD835\uDEB7':{'tex':'\\mathbf{\\Pi}','math':true},'\uD835\uDEB8':{'tex':'\\mathbf{P}','math':true},'\uD835\uDEB9':{'tex':'\\mathbf{\\vartheta}','math':true},'\uD835\uDEBA':{'tex':'\\mathbf{\\Sigma}','math':true},'\uD835\uDEBB':{'tex':'\\mathbf{T}','math':true},'\uD835\uDEBC':{'tex':'\\mathbf{\\Upsilon}','math':true},'\uD835\uDEBD':{'tex':'\\mathbf{\\Phi}','math':true},'\uD835\uDEBE':{'tex':'\\mathbf{X}','math':true},'\uD835\uDEBF':{'tex':'\\mathbf{\\Psi}','math':true},'\uD835\uDEC0':{'tex':'\\mathbf{\\Omega}','math':true},'\uD835\uDEC1':{'tex':'\\mathbf{\\nabla}','math':true},'\uD835\uDEC2':{'tex':'\\mathbf{A}','math':true},'\uD835\uDEC3':{'tex':'\\mathbf{B}','math':true},'\uD835\uDEC4':{'tex':'\\mathbf{\\Gamma}','math':true},'\uD835\uDEC5':{'tex':'\\mathbf{\\Delta}','math':true},'\uD835\uDEC6':{'tex':'\\mathbf{E}','math':true},'\uD835\uDEC7':{'tex':'\\mathbf{Z}','math':true},'\uD835\uDEC8':{'tex':'\\mathbf{H}','math':true},'\uD835\uDEC9':{'tex':'\\mathbf{\\theta}','math':true},'\uD835\uDECA':{'tex':'\\mathbf{I}','math':true},'\uD835\uDECB':{'tex':'\\mathbf{K}','math':true},'\uD835\uDECC':{'tex':'\\mathbf{\\Lambda}','math':true},'\uD835\uDECD':{'tex':'M','math':true},'\uD835\uDECE':{'tex':'N','math':true},'\uD835\uDECF':{'tex':'\\mathbf{\\Xi}','math':true},'\uD835\uDED0':{'tex':'O','math':true},'\uD835\uDED1':{'tex':'\\mathbf{\\Pi}','math':true},'\uD835\uDED2':{'tex':'\\mathbf{P}','math':true},'\uD835\uDED3':{'tex':'\\mathbf{\\varsigma}','math':true},'\uD835\uDED4':{'tex':'\\mathbf{\\Sigma}','math':true},'\uD835\uDED5':{'tex':'\\mathbf{T}','math':true},'\uD835\uDED6':{'tex':'\\mathbf{\\Upsilon}','math':true},'\uD835\uDED7':{'tex':'\\mathbf{\\Phi}','math':true},'\uD835\uDED8':{'tex':'\\mathbf{X}','math':true},'\uD835\uDED9':{'tex':'\\mathbf{\\Psi}','math':true},'\uD835\uDEDA':{'tex':'\\mathbf{\\Omega}','math':true},'\uD835\uDEDB':{'tex':'\\partial{}','math':true},'\uD835\uDEDC':{'tex':'\\in{}','math':true},'\uD835\uDEDD':{'tex':'\\mathbf{\\vartheta}','math':true},'\uD835\uDEDE':{'tex':'\\mathbf{\\varkappa}','math':true},'\uD835\uDEDF':{'tex':'\\mathbf{\\phi}','math':true},'\uD835\uDEE0':{'tex':'\\mathbf{\\varrho}','math':true},'\uD835\uDEE1':{'tex':'\\mathbf{\\varpi}','math':true},'\uD835\uDEE2':{'tex':'\\mathsl{A}','math':true},'\uD835\uDEE3':{'tex':'\\mathsl{B}','math':true},'\uD835\uDEE4':{'tex':'\\mathsl{\\Gamma}','math':true},'\uD835\uDEE5':{'tex':'\\mathsl{\\Delta}','math':true},'\uD835\uDEE6':{'tex':'\\mathsl{E}','math':true},'\uD835\uDEE7':{'tex':'\\mathsl{Z}','math':true},'\uD835\uDEE8':{'tex':'\\mathsl{H}','math':true},'\uD835\uDEE9':{'tex':'\\mathsl{\\Theta}','math':true},'\uD835\uDEEA':{'tex':'\\mathsl{I}','math':true},'\uD835\uDEEB':{'tex':'\\mathsl{K}','math':true},'\uD835\uDEEC':{'tex':'\\mathsl{\\Lambda}','math':true},'\uD835\uDEED':{'tex':'M','math':true},'\uD835\uDEEE':{'tex':'N','math':true},'\uD835\uDEEF':{'tex':'\\mathsl{\\Xi}','math':true},'\uD835\uDEF0':{'tex':'O','math':true},'\uD835\uDEF1':{'tex':'\\mathsl{\\Pi}','math':true},'\uD835\uDEF2':{'tex':'\\mathsl{P}','math':true},'\uD835\uDEF3':{'tex':'\\mathsl{\\vartheta}','math':true},'\uD835\uDEF4':{'tex':'\\mathsl{\\Sigma}','math':true},'\uD835\uDEF5':{'tex':'\\mathsl{T}','math':true},'\uD835\uDEF6':{'tex':'\\mathsl{\\Upsilon}','math':true},'\uD835\uDEF7':{'tex':'\\mathsl{\\Phi}','math':true},'\uD835\uDEF8':{'tex':'\\mathsl{X}','math':true},'\uD835\uDEF9':{'tex':'\\mathsl{\\Psi}','math':true},'\uD835\uDEFA':{'tex':'\\mathsl{\\Omega}','math':true},'\uD835\uDEFB':{'tex':'\\mathsl{\\nabla}','math':true},'\uD835\uDEFC':{'tex':'\\mathsl{A}','math':true},'\uD835\uDEFD':{'tex':'\\mathsl{B}','math':true},'\uD835\uDEFE':{'tex':'\\mathsl{\\Gamma}','math':true},'\uD835\uDEFF':{'tex':'\\mathsl{\\Delta}','math':true},'\uD835\uDF00':{'tex':'\\mathsl{E}','math':true},'\uD835\uDF01':{'tex':'\\mathsl{Z}','math':true},'\uD835\uDF02':{'tex':'\\mathsl{H}','math':true},'\uD835\uDF03':{'tex':'\\mathsl{\\Theta}','math':true},'\uD835\uDF04':{'tex':'\\mathsl{I}','math':true},'\uD835\uDF05':{'tex':'\\mathsl{K}','math':true},'\uD835\uDF06':{'tex':'\\mathsl{\\Lambda}','math':true},'\uD835\uDF07':{'tex':'M','math':true},'\uD835\uDF08':{'tex':'N','math':true},'\uD835\uDF09':{'tex':'\\mathsl{\\Xi}','math':true},'\uD835\uDF0A':{'tex':'O','math':true},'\uD835\uDF0B':{'tex':'\\mathsl{\\Pi}','math':true},'\uD835\uDF0C':{'tex':'\\mathsl{P}','math':true},'\uD835\uDF0D':{'tex':'\\mathsl{\\varsigma}','math':true},'\uD835\uDF0E':{'tex':'\\mathsl{\\Sigma}','math':true},'\uD835\uDF0F':{'tex':'\\mathsl{T}','math':true},'\uD835\uDF10':{'tex':'\\mathsl{\\Upsilon}','math':true},'\uD835\uDF11':{'tex':'\\mathsl{\\Phi}','math':true},'\uD835\uDF12':{'tex':'\\mathsl{X}','math':true},'\uD835\uDF13':{'tex':'\\mathsl{\\Psi}','math':true},'\uD835\uDF14':{'tex':'\\mathsl{\\Omega}','math':true},'\uD835\uDF15':{'tex':'\\partial{}','math':true},'\uD835\uDF16':{'tex':'\\in{}','math':true},'\uD835\uDF17':{'tex':'\\mathsl{\\vartheta}','math':true},'\uD835\uDF18':{'tex':'\\mathsl{\\varkappa}','math':true},'\uD835\uDF19':{'tex':'\\mathsl{\\phi}','math':true},'\uD835\uDF1A':{'tex':'\\mathsl{\\varrho}','math':true},'\uD835\uDF1B':{'tex':'\\mathsl{\\varpi}','math':true},'\uD835\uDF1C':{'tex':'\\mathbit{A}','math':true},'\uD835\uDF1D':{'tex':'\\mathbit{B}','math':true},'\uD835\uDF1E':{'tex':'\\mathbit{\\Gamma}','math':true},'\uD835\uDF1F':{'tex':'\\mathbit{\\Delta}','math':true},'\uD835\uDF20':{'tex':'\\mathbit{E}','math':true},'\uD835\uDF21':{'tex':'\\mathbit{Z}','math':true},'\uD835\uDF22':{'tex':'\\mathbit{H}','math':true},'\uD835\uDF23':{'tex':'\\mathbit{\\Theta}','math':true},'\uD835\uDF24':{'tex':'\\mathbit{I}','math':true},'\uD835\uDF25':{'tex':'\\mathbit{K}','math':true},'\uD835\uDF26':{'tex':'\\mathbit{\\Lambda}','math':true},'\uD835\uDF27':{'tex':'M','math':true},'\uD835\uDF28':{'tex':'N','math':true},'\uD835\uDF29':{'tex':'\\mathbit{\\Xi}','math':true},'\uD835\uDF2A':{'tex':'O','math':true},'\uD835\uDF2B':{'tex':'\\mathbit{\\Pi}','math':true},'\uD835\uDF2C':{'tex':'\\mathbit{P}','math':true},'\uD835\uDF2D':{'tex':'\\mathbit{O}','math':true},'\uD835\uDF2E':{'tex':'\\mathbit{\\Sigma}','math':true},'\uD835\uDF2F':{'tex':'\\mathbit{T}','math':true},'\uD835\uDF30':{'tex':'\\mathbit{\\Upsilon}','math':true},'\uD835\uDF31':{'tex':'\\mathbit{\\Phi}','math':true},'\uD835\uDF32':{'tex':'\\mathbit{X}','math':true},'\uD835\uDF33':{'tex':'\\mathbit{\\Psi}','math':true},'\uD835\uDF34':{'tex':'\\mathbit{\\Omega}','math':true},'\uD835\uDF35':{'tex':'\\mathbit{\\nabla}','math':true},'\uD835\uDF36':{'tex':'\\mathbit{A}','math':true},'\uD835\uDF37':{'tex':'\\mathbit{B}','math':true},'\uD835\uDF38':{'tex':'\\mathbit{\\Gamma}','math':true},'\uD835\uDF39':{'tex':'\\mathbit{\\Delta}','math':true},'\uD835\uDF3A':{'tex':'\\mathbit{E}','math':true},'\uD835\uDF3B':{'tex':'\\mathbit{Z}','math':true},'\uD835\uDF3C':{'tex':'\\mathbit{H}','math':true},'\uD835\uDF3D':{'tex':'\\mathbit{\\Theta}','math':true},'\uD835\uDF3E':{'tex':'\\mathbit{I}','math':true},'\uD835\uDF3F':{'tex':'\\mathbit{K}','math':true},'\uD835\uDF40':{'tex':'\\mathbit{\\Lambda}','math':true},'\uD835\uDF41':{'tex':'M','math':true},'\uD835\uDF42':{'tex':'N','math':true},'\uD835\uDF43':{'tex':'\\mathbit{\\Xi}','math':true},'\uD835\uDF44':{'tex':'O','math':true},'\uD835\uDF45':{'tex':'\\mathbit{\\Pi}','math':true},'\uD835\uDF46':{'tex':'\\mathbit{P}','math':true},'\uD835\uDF47':{'tex':'\\mathbit{\\varsigma}','math':true},'\uD835\uDF48':{'tex':'\\mathbit{\\Sigma}','math':true},'\uD835\uDF49':{'tex':'\\mathbit{T}','math':true},'\uD835\uDF4A':{'tex':'\\mathbit{\\Upsilon}','math':true},'\uD835\uDF4B':{'tex':'\\mathbit{\\Phi}','math':true},'\uD835\uDF4C':{'tex':'\\mathbit{X}','math':true},'\uD835\uDF4D':{'tex':'\\mathbit{\\Psi}','math':true},'\uD835\uDF4E':{'tex':'\\mathbit{\\Omega}','math':true},'\uD835\uDF4F':{'tex':'\\partial{}','math':true},'\uD835\uDF50':{'tex':'\\in{}','math':true},'\uD835\uDF51':{'tex':'\\mathbit{\\vartheta}','math':true},'\uD835\uDF52':{'tex':'\\mathbit{\\varkappa}','math':true},'\uD835\uDF53':{'tex':'\\mathbit{\\phi}','math':true},'\uD835\uDF54':{'tex':'\\mathbit{\\varrho}','math':true},'\uD835\uDF55':{'tex':'\\mathbit{\\varpi}','math':true},'\uD835\uDF56':{'tex':'\\mathsfbf{A}','math':true},'\uD835\uDF57':{'tex':'\\mathsfbf{B}','math':true},'\uD835\uDF58':{'tex':'\\mathsfbf{\\Gamma}','math':true},'\uD835\uDF59':{'tex':'\\mathsfbf{\\Delta}','math':true},'\uD835\uDF5A':{'tex':'\\mathsfbf{E}','math':true},'\uD835\uDF5B':{'tex':'\\mathsfbf{Z}','math':true},'\uD835\uDF5C':{'tex':'\\mathsfbf{H}','math':true},'\uD835\uDF5D':{'tex':'\\mathsfbf{\\Theta}','math':true},'\uD835\uDF5E':{'tex':'\\mathsfbf{I}','math':true},'\uD835\uDF5F':{'tex':'\\mathsfbf{K}','math':true},'\uD835\uDF60':{'tex':'\\mathsfbf{\\Lambda}','math':true},'\uD835\uDF61':{'tex':'M','math':true},'\uD835\uDF62':{'tex':'N','math':true},'\uD835\uDF63':{'tex':'\\mathsfbf{\\Xi}','math':true},'\uD835\uDF64':{'tex':'O','math':true},'\uD835\uDF65':{'tex':'\\mathsfbf{\\Pi}','math':true},'\uD835\uDF66':{'tex':'\\mathsfbf{P}','math':true},'\uD835\uDF67':{'tex':'\\mathsfbf{\\vartheta}','math':true},'\uD835\uDF68':{'tex':'\\mathsfbf{\\Sigma}','math':true},'\uD835\uDF69':{'tex':'\\mathsfbf{T}','math':true},'\uD835\uDF6A':{'tex':'\\mathsfbf{\\Upsilon}','math':true},'\uD835\uDF6B':{'tex':'\\mathsfbf{\\Phi}','math':true},'\uD835\uDF6C':{'tex':'\\mathsfbf{X}','math':true},'\uD835\uDF6D':{'tex':'\\mathsfbf{\\Psi}','math':true},'\uD835\uDF6E':{'tex':'\\mathsfbf{\\Omega}','math':true},'\uD835\uDF6F':{'tex':'\\mathsfbf{\\nabla}','math':true},'\uD835\uDF70':{'tex':'\\mathsfbf{A}','math':true},'\uD835\uDF71':{'tex':'\\mathsfbf{B}','math':true},'\uD835\uDF72':{'tex':'\\mathsfbf{\\Gamma}','math':true},'\uD835\uDF73':{'tex':'\\mathsfbf{\\Delta}','math':true},'\uD835\uDF74':{'tex':'\\mathsfbf{E}','math':true},'\uD835\uDF75':{'tex':'\\mathsfbf{Z}','math':true},'\uD835\uDF76':{'tex':'\\mathsfbf{H}','math':true},'\uD835\uDF77':{'tex':'\\mathsfbf{\\Theta}','math':true},'\uD835\uDF78':{'tex':'\\mathsfbf{I}','math':true},'\uD835\uDF79':{'tex':'\\mathsfbf{K}','math':true},'\uD835\uDF7A':{'tex':'\\mathsfbf{\\Lambda}','math':true},'\uD835\uDF7B':{'tex':'M','math':true},'\uD835\uDF7C':{'tex':'N','math':true},'\uD835\uDF7D':{'tex':'\\mathsfbf{\\Xi}','math':true},'\uD835\uDF7E':{'tex':'O','math':true},'\uD835\uDF7F':{'tex':'\\mathsfbf{\\Pi}','math':true},'\uD835\uDF80':{'tex':'\\mathsfbf{P}','math':true},'\uD835\uDF81':{'tex':'\\mathsfbf{\\varsigma}','math':true},'\uD835\uDF82':{'tex':'\\mathsfbf{\\Sigma}','math':true},'\uD835\uDF83':{'tex':'\\mathsfbf{T}','math':true},'\uD835\uDF84':{'tex':'\\mathsfbf{\\Upsilon}','math':true},'\uD835\uDF85':{'tex':'\\mathsfbf{\\Phi}','math':true},'\uD835\uDF86':{'tex':'\\mathsfbf{X}','math':true},'\uD835\uDF87':{'tex':'\\mathsfbf{\\Psi}','math':true},'\uD835\uDF88':{'tex':'\\mathsfbf{\\Omega}','math':true},'\uD835\uDF89':{'tex':'\\partial{}','math':true},'\uD835\uDF8A':{'tex':'\\in{}','math':true},'\uD835\uDF8B':{'tex':'\\mathsfbf{\\vartheta}','math':true},'\uD835\uDF8C':{'tex':'\\mathsfbf{\\varkappa}','math':true},'\uD835\uDF8D':{'tex':'\\mathsfbf{\\phi}','math':true},'\uD835\uDF8E':{'tex':'\\mathsfbf{\\varrho}','math':true},'\uD835\uDF8F':{'tex':'\\mathsfbf{\\varpi}','math':true},'\uD835\uDF90':{'tex':'\\mathsfbfsl{A}','math':true},'\uD835\uDF91':{'tex':'\\mathsfbfsl{B}','math':true},'\uD835\uDF92':{'tex':'\\mathsfbfsl{\\Gamma}','math':true},'\uD835\uDF93':{'tex':'\\mathsfbfsl{\\Delta}','math':true},'\uD835\uDF94':{'tex':'\\mathsfbfsl{E}','math':true},'\uD835\uDF95':{'tex':'\\mathsfbfsl{Z}','math':true},'\uD835\uDF96':{'tex':'\\mathsfbfsl{H}','math':true},'\uD835\uDF97':{'tex':'\\mathsfbfsl{\\vartheta}','math':true},'\uD835\uDF98':{'tex':'\\mathsfbfsl{I}','math':true},'\uD835\uDF99':{'tex':'\\mathsfbfsl{K}','math':true},'\uD835\uDF9A':{'tex':'\\mathsfbfsl{\\Lambda}','math':true},'\uD835\uDF9B':{'tex':'M','math':true},'\uD835\uDF9C':{'tex':'N','math':true},'\uD835\uDF9D':{'tex':'\\mathsfbfsl{\\Xi}','math':true},'\uD835\uDF9E':{'tex':'O','math':true},'\uD835\uDF9F':{'tex':'\\mathsfbfsl{\\Pi}','math':true},'\uD835\uDFA0':{'tex':'\\mathsfbfsl{P}','math':true},'\uD835\uDFA1':{'tex':'\\mathsfbfsl{\\vartheta}','math':true},'\uD835\uDFA2':{'tex':'\\mathsfbfsl{\\Sigma}','math':true},'\uD835\uDFA3':{'tex':'\\mathsfbfsl{T}','math':true},'\uD835\uDFA4':{'tex':'\\mathsfbfsl{\\Upsilon}','math':true},'\uD835\uDFA5':{'tex':'\\mathsfbfsl{\\Phi}','math':true},'\uD835\uDFA6':{'tex':'\\mathsfbfsl{X}','math':true},'\uD835\uDFA7':{'tex':'\\mathsfbfsl{\\Psi}','math':true},'\uD835\uDFA8':{'tex':'\\mathsfbfsl{\\Omega}','math':true},'\uD835\uDFA9':{'tex':'\\mathsfbfsl{\\nabla}','math':true},'\uD835\uDFAA':{'tex':'\\mathsfbfsl{A}','math':true},'\uD835\uDFAB':{'tex':'\\mathsfbfsl{B}','math':true},'\uD835\uDFAC':{'tex':'\\mathsfbfsl{\\Gamma}','math':true},'\uD835\uDFAD':{'tex':'\\mathsfbfsl{\\Delta}','math':true},'\uD835\uDFAE':{'tex':'\\mathsfbfsl{E}','math':true},'\uD835\uDFAF':{'tex':'\\mathsfbfsl{Z}','math':true},'\uD835\uDFB0':{'tex':'\\mathsfbfsl{H}','math':true},'\uD835\uDFB1':{'tex':'\\mathsfbfsl{\\vartheta}','math':true},'\uD835\uDFB2':{'tex':'\\mathsfbfsl{I}','math':true},'\uD835\uDFB3':{'tex':'\\mathsfbfsl{K}','math':true},'\uD835\uDFB4':{'tex':'\\mathsfbfsl{\\Lambda}','math':true},'\uD835\uDFB5':{'tex':'M','math':true},'\uD835\uDFB6':{'tex':'N','math':true},'\uD835\uDFB7':{'tex':'\\mathsfbfsl{\\Xi}','math':true},'\uD835\uDFB8':{'tex':'O','math':true},'\uD835\uDFB9':{'tex':'\\mathsfbfsl{\\Pi}','math':true},'\uD835\uDFBA':{'tex':'\\mathsfbfsl{P}','math':true},'\uD835\uDFBB':{'tex':'\\mathsfbfsl{\\varsigma}','math':true},'\uD835\uDFBC':{'tex':'\\mathsfbfsl{\\Sigma}','math':true},'\uD835\uDFBD':{'tex':'\\mathsfbfsl{T}','math':true},'\uD835\uDFBE':{'tex':'\\mathsfbfsl{\\Upsilon}','math':true},'\uD835\uDFBF':{'tex':'\\mathsfbfsl{\\Phi}','math':true},'\uD835\uDFC0':{'tex':'\\mathsfbfsl{X}','math':true},'\uD835\uDFC1':{'tex':'\\mathsfbfsl{\\Psi}','math':true},'\uD835\uDFC2':{'tex':'\\mathsfbfsl{\\Omega}','math':true},'\uD835\uDFC3':{'tex':'\\partial{}','math':true},'\uD835\uDFC4':{'tex':'\\in{}','math':true},'\uD835\uDFC5':{'tex':'\\mathsfbfsl{\\vartheta}','math':true},'\uD835\uDFC6':{'tex':'\\mathsfbfsl{\\varkappa}','math':true},'\uD835\uDFC7':{'tex':'\\mathsfbfsl{\\phi}','math':true},'\uD835\uDFC8':{'tex':'\\mathsfbfsl{\\varrho}','math':true},'\uD835\uDFC9':{'tex':'\\mathsfbfsl{\\varpi}','math':true},'\uD835\uDFCA':{'tex':'\\mbfDigamma{}','math':true},'\uD835\uDFCB':{'tex':'\\mbfdigamma{}','math':true},'\uD835\uDFCE':{'tex':'\\mathbf{0}','math':true},'\uD835\uDFCF':{'tex':'\\mathbf{1}','math':true},'\uD835\uDFD0':{'tex':'\\mathbf{2}','math':true},'\uD835\uDFD1':{'tex':'\\mathbf{3}','math':true},'\uD835\uDFD2':{'tex':'\\mathbf{4}','math':true},'\uD835\uDFD3':{'tex':'\\mathbf{5}','math':true},'\uD835\uDFD4':{'tex':'\\mathbf{6}','math':true},'\uD835\uDFD5':{'tex':'\\mathbf{7}','math':true},'\uD835\uDFD6':{'tex':'\\mathbf{8}','math':true},'\uD835\uDFD7':{'tex':'\\mathbf{9}','math':true},'\uD835\uDFD8':{'tex':'\\mathbb{0}','math':true},'\uD835\uDFD9':{'tex':'\\mathbb{1}','math':true},'\uD835\uDFDA':{'tex':'\\mathbb{2}','math':true},'\uD835\uDFDB':{'tex':'\\mathbb{3}','math':true},'\uD835\uDFDC':{'tex':'\\mathbb{4}','math':true},'\uD835\uDFDD':{'tex':'\\mathbb{5}','math':true},'\uD835\uDFDE':{'tex':'\\mathbb{6}','math':true},'\uD835\uDFDF':{'tex':'\\mathbb{7}','math':true},'\uD835\uDFE0':{'tex':'\\mathbb{8}','math':true},'\uD835\uDFE1':{'tex':'\\mathbb{9}','math':true},'\uD835\uDFE2':{'tex':'\\mathsf{0}','math':true},'\uD835\uDFE3':{'tex':'\\mathsf{1}','math':true},'\uD835\uDFE4':{'tex':'\\mathsf{2}','math':true},'\uD835\uDFE5':{'tex':'\\mathsf{3}','math':true},'\uD835\uDFE6':{'tex':'\\mathsf{4}','math':true},'\uD835\uDFE7':{'tex':'\\mathsf{5}','math':true},'\uD835\uDFE8':{'tex':'\\mathsf{6}','math':true},'\uD835\uDFE9':{'tex':'\\mathsf{7}','math':true},'\uD835\uDFEA':{'tex':'\\mathsf{8}','math':true},'\uD835\uDFEB':{'tex':'\\mathsf{9}','math':true},'\uD835\uDFEC':{'tex':'\\mathsfbf{0}','math':true},'\uD835\uDFED':{'tex':'\\mathsfbf{1}','math':true},'\uD835\uDFEE':{'tex':'\\mathsfbf{2}','math':true},'\uD835\uDFEF':{'tex':'\\mathsfbf{3}','math':true},'\uD835\uDFF0':{'tex':'\\mathsfbf{4}','math':true},'\uD835\uDFF1':{'tex':'\\mathsfbf{5}','math':true},'\uD835\uDFF2':{'tex':'\\mathsfbf{6}','math':true},'\uD835\uDFF3':{'tex':'\\mathsfbf{7}','math':true},'\uD835\uDFF4':{'tex':'\\mathsfbf{8}','math':true},'\uD835\uDFF5':{'tex':'\\mathsfbf{9}','math':true},'\uD835\uDFF6':{'tex':'\\mathtt{0}','math':true},'\uD835\uDFF7':{'tex':'\\mathtt{1}','math':true},'\uD835\uDFF8':{'tex':'\\mathtt{2}','math':true},'\uD835\uDFF9':{'tex':'\\mathtt{3}','math':true},'\uD835\uDFFA':{'tex':'\\mathtt{4}','math':true},'\uD835\uDFFB':{'tex':'\\mathtt{5}','math':true},'\uD835\uDFFC':{'tex':'\\mathtt{6}','math':true},'\uD835\uDFFD':{'tex':'\\mathtt{7}','math':true},'\uD835\uDFFE':{'tex':'\\mathtt{8}','math':true},'\uD835\uDFFF':{'tex':'\\mathtt{9}','math':true}};

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

module.exports = {'_':{'tex':'\\_'},'{':{'tex':'\\{'},'}':{'tex':'\\}'},'&':{'tex':'\\&'},'#':{'tex':'\\#'},'%':{'tex':'\\%'},'^':{'tex':'\\^'},'<':{'tex':'<','math':true},'>':{'tex':'>','math':true},'~':{'tex':'\\textasciitilde{}'},'$':{'tex':'\\$'},'\\':{'tex':'\\backslash{}','math':true},'\xA0':{'tex':'~','space':true},'\u2002':{'tex':'\\hspace{0.6em}','space':true},'\u2003':{'tex':'\\quad{}','math':true,'space':true},'\u2004':{'tex':'\\;','space':true},'\u2005':{'tex':'\\hspace{0.25em}','space':true},'\u2006':{'tex':'\\hspace{0.166em}','space':true},'\u2007':{'tex':'\\hphantom{0}','space':true},'\u2008':{'tex':'\\hphantom{,}','space':true},'\u2009':{'tex':'\\,','space':true},'\u200A':{'tex':'\\mkern1mu{}','math':true,'space':true},'\u200B':{'tex':'\\mbox{}','space':true},'\u202F':{'tex':' ','space':true},'\u205F':{'tex':'\\:','space':true}};

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
        return this.enc_latex({ value: new String(f.value) }); // tslint:disable-line:no-construct
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
    walk(tag) {
        if (!tag)
            return;
        switch (tag.nodeName) {
            case '#text':
                this.chars(tag.value);
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
            this.walk(child);
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
    chars(text) {
        if (this.options.html)
            text = HE.decode(text, { isAttributeValue: true });
        let latex = '';
        let math = false;
        let braced = 0;
        // const chars = Zotero.Utilities.XRegExp.split(text.normalize('NFC'), '')
        const chars = Array.from(text.normalize('NFC'));
        let ch, mapped;
        while (chars.length) {
            if (chars.length > 1 && (mapped = this.mapping[ch = (chars[0] + chars[1])] || this.extramapping[ch])) {
                chars.splice(0, 2);
            }
            else {
                mapped = this.mapping[chars[0]] || this.extramapping[chars[0]] || { tex: chars[0] };
                ch = chars.shift();
            }
            // in and out of math mode
            if (!!mapped.math !== math) {
                latex += '$';
                math = !math;
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
            latex += this.embrace(mapped.tex, this.embrace_tex[mapped.tex]);
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
        if (math)
            latex += '$';
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
