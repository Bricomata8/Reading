{
	"translatorID": "a515a220-6fef-45ea-9842-8025dfebcc8f",
	"translatorType": 2,
	"label": "Better BibTeX Citation Key Quick Copy",
	"creator": "Emiliano heyns",
	"target": "txt",
	"minVersion": "4.0.27",
	"priority": 100,
	"inRepository": false,
	"configOptions": {
		"hash": "73d146dfe018b8b86964d860b2943a89-354fd7575b43a4ae16f2f49d78aa698f"
	},
	"displayOptions": {
		"quickCopyMode": ""
	},
	"browserSupport": "gcsv",
	"lastUpdated": "2019-10-27 20:31:52"
}

var Translator = {
  initialize: function () {},
  BetterBibTeXCitationKeyQuickCopy: true,
  BetterTeX: false,
  BetterCSL: false,
  header: ZOTERO_TRANSLATOR_INFO,
  // header: < %- JSON.stringify(header) % >,
  preferences: {"DOIandURL":"both","ascii":"","asciiBibLaTeX":false,"asciiBibTeX":true,"autoAbbrev":false,"autoAbbrevStyle":"","autoExport":"immediate","autoExportDelay":1,"autoExportIdleWait":10,"autoExportPrimeExportCacheBatch":4,"autoExportPrimeExportCacheDelay":100,"autoExportPrimeExportCacheThreshold":0,"autoExportTooLong":10,"autoPin":false,"automaticTags":true,"auxImport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"bibtexParticleNoOp":false,"bibtexURL":"off","cacheFlushInterval":5,"citeCommand":"cite","citekeyFold":true,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citeprocNoteCitekey":false,"csquotes":"","exportBibTeXStrings":"off","git":"config","importBibTeXStrings":true,"itemObserverDelay":100,"jabrefFormat":0,"keyConflictPolicy":"keep","keyScope":"library","kuroshiro":false,"lockedInit":false,"mapMath":"","mapText":"","mapUnicode":"conservative","newTranslatorsAskRestart":true,"parseParticles":true,"postscript":"","qualityReport":false,"quickCopyMode":"latex","quickCopyPandocBrackets":false,"rawLaTag":"#LaTeX","relativeFilePaths":false,"scrubDatabase":false,"skipFields":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","sorted":false,"strings":"","suppressBraceProtection":false,"suppressNoCase":false,"suppressSentenceCase":false,"suppressTitleCase":false,"verbatimFields":"url,doi,file,eprint,verba,verbb,verbc","warnBulkModify":10},
  options: {"quickCopyMode":""},

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
      this.platform = Zotero.BetterBibTeX.platform().toLowerCase().slice(0, 3)
      this.paths = {
        caseSensitive: this.platform !== 'mac' && this.platform !== 'win',
        sep: this.platform === 'win' ? '\\' : '/'
      }

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
        this.cache = {
          hits: 0,
          misses: 0,
        }
        this.options.exportPath = Zotero.getOption('exportPath')
        if (this.options.exportPath && this.options.exportPath.endsWith(this.pathSep)) this.options.exportPath = this.options.exportPath.slice(0, -1)
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
    this.skipFields = this.preferences.skipFields.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    this.skipField = this.skipFields.reduce((acc, field) => { acc[field] = true; return acc }, {})
    this.verbatimFields = this.preferences.verbatimFields.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    if (!this.verbatimFields.length) this.verbatimFields = null
    this.csquotes = this.preferences.csquotes ? { open: this.preferences.csquotes[0], close: this.preferences.csquotes[1] } : null
    this.preferences.testing = Zotero.getHiddenPref('better-bibtex.testing')
    Zotero.debug('prefs loaded: ' + JSON.stringify(this.preferences, null, 2))
    Zotero.debug('options loaded: ' + JSON.stringify(this.options, null, 2))

    if (stage == 'doExport') {
      this.caching = !(
        // when exporting file data you get relative paths, when not, you get absolute paths, only one version can go into the cache
        this.options.exportFileData

        // jabref 4 stores collection info inside the reference, and collection info depends on which part of your library you're exporting
        || (this.BetterTeX && this.preferences.jabrefFormat === 4)

        // if you're looking at this.options.exportPath in the postscript you're probably outputting something different based on it
        || ((this.preferences.postscript || '').indexOf('Translator.options.exportPath') >= 0)

        // relative file paths are going to be different based on the file being exported to
        || this.preferences.relativeFilePaths
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
  const elapsed = Date.now() - start
  const hits = Translator.cache.hits
  const misses = Translator.cache.misses
  Zotero.debug("Better BibTeX Citation Key Quick Copy" + ` export took ${elapsed/1000}s, hits=${hits}, misses=${misses}, ${elapsed / (misses + hits)}ms/item`)
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./Better BibTeX Citation Key Quick Copy.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../gen/itemfields.ts":
/*!****************************!*\
  !*** ../gen/itemfields.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

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
            if (!jurism)
                delete creator.multi;
        }
    }
    if (!jurism)
        delete item.multi;
    return item;
}
exports.simplifyForImport = simplifyForImport;


/***/ }),

/***/ "../node_modules/@retorquere/bibtex-parser/chunker.js":
/*!************************************************************!*\
  !*** ../node_modules/@retorquere/bibtex-parser/chunker.js ***!
  \************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Original work by Henrik Muehe (c) 2010
//
// CommonJS port by Mikola Lysenko 2013
//
Object.defineProperty(exports, "__esModule", { value: true });
class ParseError extends Error {
    constructor(message, parser) {
        message += ` @ ${parser.pos}`;
        if (parser.parsing)
            message += ` in ${JSON.stringify(parser.parsing)}`;
        super(message);
        this.name = 'ParseError';
    }
}
// tslint:disable-next-line prefer-template
const letter = new RegExp('[' + [
    // Letter, Uppercase
    /\u0041-\u005A\u00C0-\u00D6\u00D8-\u00DE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178-\u0179\u017B\u017D\u0181-\u0182\u0184\u0186-\u0187\u0189-\u018B\u018E-\u0191\u0193-\u0194\u0196-\u0198\u019C-\u019D\u019F-\u01A0\u01A2\u01A4\u01A6-\u01A7\u01A9\u01AC\u01AE-\u01AF\u01B1-\u01B3\u01B5\u01B7-\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A-\u023B\u023D-\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E-\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9-\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0-\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E-\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D-\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A/.source,
    // Letter, Titlecase
    /\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC/.source,
    // Letter, Lowercase
    /\u0061-\u007A\u00B5\u00DF-\u00F6\u00F8-\u00FF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137-\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148-\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C-\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA-\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9-\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC-\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF-\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F-\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0-\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB-\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE-\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6-\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FC7\u1FD0-\u1FD3\u1FD6-\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6-\u1FF7\u210A\u210E-\u210F\u2113\u212F\u2134\u2139\u213C-\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65-\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73-\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3-\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A/.source,
    // Letter, Modifier
    /\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5-\u06E6\u07F4-\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C-\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D-\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C-\uA69D\uA717-\uA71F\uA770\uA788\uA7F8-\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3-\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E-\uFF9F/.source,
    // Letter, Other
    /\u00AA\u00BA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A-\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC/.source,
].join('') + ']');
class BibtexParser {
    parse(input, options = {}) {
        // this._progress = 0
        this.pos = 0;
        this.input = input;
        this.max_entries = options.max_entries || 0;
        this.entries = 0;
        this.parsing = null;
        this.chunks = [];
        if (options.async) {
            return this.bibtexAsync().then(() => this.chunks);
        }
        else {
            this.bibtex();
            return this.chunks;
        }
    }
    isWhitespace(s, horizontalOnly = false) {
        return (s === ' ' || s === '\t' || (!horizontalOnly && (s === '\r' || s === '\n')));
    }
    match(s) {
        this.skipWhitespace();
        if (this.input.substr(this.pos, s.length) !== s) {
            throw new ParseError(`Token mismatch, expected ${JSON.stringify(s)}, found ${JSON.stringify(this.input.substr(this.pos, 20))}...`, this); // tslint:disable-line no-magic-numbers
        }
        this.pos += s.length;
        this.skipWhitespace();
    }
    tryMatch(s) {
        this.skipWhitespace();
        return (this.input.substr(this.pos, s.length) === s);
        // this.skipWhitespace()
    }
    skipWhitespace() {
        while (this.isWhitespace(this.input[this.pos]))
            this.pos++;
        // shady
        if (this.input[this.pos] === '%') {
            while (this.input[this.pos] !== '\n')
                this.pos++;
            this.skipWhitespace();
        }
    }
    value_braces() {
        let bracecount = 0;
        this.match('{');
        const start = this.pos;
        let math = false;
        while (true) {
            switch (this.input[this.pos]) {
                case '\\':
                    this.pos += 1;
                    break;
                case '{':
                    bracecount++;
                    break;
                case '}':
                    if (bracecount === 0) {
                        if (math)
                            throw new ParseError('Unclosed math section', this);
                        this.pos++;
                        return this.input.substring(start, this.pos - 1);
                    }
                    bracecount--;
                    break;
                case '$':
                    math = !math;
                    break;
            }
            this.pos++;
            if (this.pos >= this.input.length) {
                throw new ParseError(`Unterminated brace-value ${JSON.stringify(this.input.substr(start, 20))}`, this); // tslint:disable-line no-magic-numbers
            }
        }
    }
    value_quotes() {
        this.match('"');
        const start = this.pos;
        let bracecount = 0;
        while (true) {
            switch (this.input[this.pos]) {
                case '\\':
                    this.pos += 1;
                    break;
                case '{':
                    bracecount++;
                    break;
                case '}':
                    bracecount++;
                    break;
                case '"':
                    if (bracecount <= 0) {
                        this.pos++;
                        return this.input.substring(start, this.pos - 1);
                    }
            }
            this.pos++;
            if (this.pos >= this.input.length) {
                throw new ParseError(`Unterminated quote-value ${JSON.stringify(this.input.substr(start, 20))}`, this); // tslint:disable-line no-magic-numbers
            }
        }
    }
    single_value() {
        if (this.tryMatch('{')) {
            return this.value_braces();
        }
        else if (this.tryMatch('"')) {
            return this.value_quotes();
        }
        else {
            return this.key();
        }
    }
    value() {
        const values = [];
        values.push(this.single_value());
        while (this.tryMatch('#')) {
            this.match('#');
            values.push(this.single_value());
        }
        return values.join('');
    }
    key(allowUnicode = false) {
        const start = this.pos;
        while (true) {
            if (this.pos === this.input.length) {
                throw new ParseError('Runaway key', this);
            }
            if (this.input[this.pos].match(/['a-zA-Z0-9&;_:\\./-]/)) {
                this.pos++;
            }
            else if (allowUnicode && this.input[this.pos].match(letter)) {
                this.pos++;
            }
            else {
                return this.input.substring(start, this.pos);
            }
        }
    }
    key_equals_value() {
        const key = this.key();
        if (!this.tryMatch('=')) {
            throw new ParseError(`... = value expected, equals sign missing: ${JSON.stringify(this.input.substr(this.pos, 20))}...`, this); // tslint:disable-line no-magic-numbers
        }
        this.match('=');
        const val = this.value();
        return [key, val];
    }
    key_value_list() {
        this.key_equals_value();
        while (this.tryMatch(',')) {
            this.match(',');
            // fixes problems with commas at the end of a list
            if (this.tryMatch('}')) {
                break;
            }
            this.key_equals_value();
        }
    }
    entry(d) {
        this.parsing = this.key(true);
        this.match(',');
        this.key_value_list();
    }
    directive() {
        this.match('@');
        return `@${this.key()}`.toLowerCase();
    }
    string() {
        this.key_equals_value();
    }
    preamble() {
        this.value();
    }
    comment() {
        while (this.isWhitespace(this.input[this.pos], true))
            this.pos++;
        if (this.input[this.pos] === '{') {
            this.value_braces();
            return;
        }
        while (this.input[this.pos] !== '\n' && this.pos < this.input.length)
            this.pos++;
    }
    /*
    private progress() {
      const progress = Math.round((this.pos / this.input.length * 100) / 5) * 5 // tslint:disable-line no-magic-numbers
      if (this._progress !== progress) {
        this._progress = progress
        process.stdout.write(` (${this._progress}%) `)
      }
    }
    */
    hasMore() {
        if (this.max_entries && this.entries >= this.max_entries)
            return false;
        return (this.pos < this.input.length);
    }
    bibtex() {
        while (this.hasMore()) {
            this.parseNext();
        }
    }
    bibtexAsync() {
        return this.hasMore() ? (new Promise(resolve => resolve(this.parseNext()))).then(() => this.bibtexAsync()) : Promise.resolve(null);
    }
    parseNext() {
        // this.progress()
        const chunk = {
            offset: {
                pos: this.pos,
                line: this.input.substring(0, this.pos).split('\n').length - 1,
            },
            error: null,
            text: null,
        };
        this.skipWhitespace();
        if (this.pos >= this.input.length)
            return;
        try {
            const d = this.directive();
            switch (d) {
                case '@string':
                    this.match('{');
                    this.string();
                    this.match('}');
                    chunk.stringDeclaration = true;
                    break;
                case '@preamble':
                    this.match('{');
                    this.preamble();
                    this.match('}');
                    chunk.preamble = true;
                    break;
                case '@comment':
                    this.comment();
                    chunk.comment = true;
                    break;
                default:
                    this.match('{');
                    this.entry(d);
                    this.match('}');
                    chunk.entry = true;
                    this.entries++;
                    break;
            }
        }
        catch (err) {
            if (err.name !== 'ParseError')
                throw err;
            chunk.error = err.message,
                // skip ahead to the next @ and try again
                this.pos = chunk.offset.pos + 1;
            while (this.pos < this.input.length && this.input[this.pos] !== '@')
                this.pos++;
        }
        const text = this.input.substring(chunk.offset.pos, this.pos);
        const last = this.chunks.length - 1;
        if (chunk.error && this.chunks.length && this.chunks[last].error) {
            this.chunks[last].text += text;
        }
        else {
            chunk.text = text;
            this.chunks.push(chunk);
        }
    }
}
/**
 * Reads the bibtex input and splits it into separate chunks of `@string`s, `@comment`s, and bibtex entries. Useful for detecting if a file is bibtex file and for filtering out basic errors that would
 * make the more sophisticated [[bibtex.parse]] reject the whole file
 *
 * @returns array of chunks, with markers for type and errors (if any) found.
 */
function parse(input, options = {}) {
    return (new BibtexParser).parse(input, options);
}
exports.parse = parse;


/***/ }),

/***/ "../node_modules/@retorquere/bibtex-parser/index.js":
/*!**********************************************************!*\
  !*** ../node_modules/@retorquere/bibtex-parser/index.js ***!
  \**********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const bibtex = __webpack_require__(/*! astrocite-bibtex/lib/grammar */ "../node_modules/astrocite-bibtex/lib/grammar.js");
const chunker_1 = __webpack_require__(/*! ./chunker */ "../node_modules/@retorquere/bibtex-parser/chunker.js");
const latex2unicode = __webpack_require__(/*! ./latex2unicode */ "../node_modules/@retorquere/bibtex-parser/latex2unicode.js");
/*
function pad(s, n) {
  return `${s}${' '.repeat(n)}`.substr(0, n)
}

class Tracer {
  private input: string
  private level: number
  constructor(input) {
    this.input = input
    this.level = 0
  }

  trace(evt) {
    switch (evt.type) {
      case 'rule.enter':
        this.level++
        break

      case 'rule.fail':
      case 'rule.match':
        this.level--
        break

      default:
        throw new Error(JSON.stringify(evt))

    }

    console.log(pad(`${evt.location.start.offset}`, 6), pad(evt.type.split('.')[1], 5), pad(evt.rule, 10), '.'.repeat(this.level), JSON.stringify(this.input.substring(evt.location.start.offset, evt.location.end.offset)))
  }
}
*/
const marker = {
    and: '\u0001',
    comma: '\u0002',
    space: '\u0003',
    literal: '\u0004',
};
const markerRE = {
    and: new RegExp(marker.and, 'g'),
    comma: new RegExp(marker.comma, 'g'),
    space: new RegExp(marker.space, 'g'),
    literal: new RegExp(marker.literal, 'g'),
    literalName: new RegExp(`^${marker.literal}[^${marker.literal}]*${marker.literal}$`),
};
const fields = {
    creator: [
        'author',
        'bookauthor',
        'collaborators',
        'commentator',
        'director',
        'editor',
        'editora',
        'editorb',
        'editors',
        'holder',
        'scriptwriter',
        'translator',
        'translators',
    ],
    title: [
        'title',
        'series',
        'shorttitle',
        'booktitle',
        'type',
        'origtitle',
        'maintitle',
        'eventtitle',
    ],
    unnest: [
        'publisher',
        'location',
    ],
};
class Parser {
    constructor(options = {}) {
        this.unresolvedStrings = {};
        this.caseProtect = typeof options.caseProtect === 'undefined' ? true : options.caseProtect;
        this.sentenceCase = typeof options.sentenceCase === 'undefined' ? true : options.sentenceCase;
        this.markup = {
            enquote: { open: '\u201c', close: '\u201d' },
            sub: { open: '<sub>', close: '</sub>' },
            sup: { open: '<sup>', close: '</sup>' },
            bold: { open: '<b>', close: '</b>' },
            italics: { open: '<i>', close: '</i>' },
            smallCaps: { open: '<span style="font-variant:small-caps;">', close: '</span>' },
            caseProtect: { open: '<span class="nocase">', close: '</span>' },
            roman: { open: '', close: '' },
            fixedWidth: { open: '', close: '' },
        };
        for (const [markup, open_close] of Object.entries(options.markup || {})) {
            if (open_close)
                this.markup[markup] = open_close;
        }
        // tslint:disable-next-line only-arrow-functions
        this.errorHandler = (options.errorHandler || function (msg) { throw new Error(msg); });
        this.errors = [];
        this.comments = [];
        this.entries = [];
        this.strings = {};
        this.default_strings = {
            JAN: [this.text('01')],
            FEB: [this.text('02')],
            MAR: [this.text('03')],
            APR: [this.text('04')],
            MAY: [this.text('05')],
            JUN: [this.text('06')],
            JUL: [this.text('07')],
            AUG: [this.text('08')],
            SEP: [this.text('09')],
            OCT: [this.text('10')],
            NOV: [this.text('11')],
            DEC: [this.text('12')],
            ACMCS: [this.text('ACM Computing Surveys')],
            ACTA: [this.text('Acta Informatica')],
            CACM: [this.text('Communications of the ACM')],
            IBMJRD: [this.text('IBM Journal of Research and Development')],
            IBMSJ: [this.text('IBM Systems Journal')],
            IEEESE: [this.text('IEEE Transactions on Software Engineering')],
            IEEETC: [this.text('IEEE Transactions on Computers')],
            IEEETCAD: [this.text('IEEE Transactions on Computer-Aided Design of Integrated Circuits')],
            IPL: [this.text('Information Processing Letters')],
            JACM: [this.text('Journal of the ACM')],
            JCSS: [this.text('Journal of Computer and System Sciences')],
            SCP: [this.text('Science of Computer Programming')],
            SICOMP: [this.text('SIAM Journal on Computing')],
            TOCS: [this.text('ACM Transactions on Computer Systems')],
            TODS: [this.text('ACM Transactions on Database Systems')],
            TOG: [this.text('ACM Transactions on Graphics')],
            TOMS: [this.text('ACM Transactions on Mathematical Software')],
            TOOIS: [this.text('ACM Transactions on Office Information Systems')],
            TOPLAS: [this.text('ACM Transactions on Programming Languages and Systems')],
            TCS: [this.text('Theoretical Computer Science')],
        };
    }
    parse(input, options = {}) {
        for (const chunk of chunker_1.parse(input)) {
            this.parseChunk(chunk, options);
        }
        return this.parsed();
    }
    async parseAsync(input, options = {}) {
        for (const chunk of await chunker_1.parse(input, { async: true })) {
            this.parseChunk(chunk, options);
        }
        return this.parsed();
    }
    parsed() {
        this.field = null;
        const strings = {};
        for (const [key, value] of Object.entries(this.strings)) {
            this.field = {
                name: '@string',
                creator: false,
                text: '',
                level: 0,
                words: {
                    lowercase: 0,
                    other: 0,
                },
                exemptFromSentenceCase: null,
            };
            this.convert(value);
            strings[key] = this.field.text;
        }
        return {
            errors: this.errors,
            entries: this.entries,
            comments: this.comments,
            strings,
        };
    }
    parseChunk(chunk, options) {
        try {
            const ast = this.cleanup(bibtex.parse(chunk.text, { verbatimProperties: options.verbatimFields }), !this.caseProtect);
            if (ast.kind !== 'File')
                throw new Error(this.show(ast));
            for (const node of ast.children) {
                this.convert(node);
            }
        }
        catch (err) {
            if (!err.location)
                throw err;
            this.errors.push({
                message: err.message,
                line: err.location.start.line + chunk.offset.line,
                column: err.location.start.column,
            });
        }
    }
    show(o) {
        return JSON.stringify(o);
    }
    text(value = '') {
        return { kind: 'Text', value };
    }
    error(err, returnvalue) {
        this.errorHandler(err);
        return returnvalue;
    }
    condense(node, nocased) {
        if (!Array.isArray(node.value)) {
            if (node.value.kind === 'Number')
                return;
            return this.error(`cannot condense a ${node.value.kind}: ${this.show(node)}`, undefined);
        }
        const markup = {
            sl: 'italics',
            em: 'italics',
            it: 'italics',
            itshape: 'italics',
            bf: 'bold',
            bfseries: 'bold',
            sc: 'smallCaps',
            scshape: 'smallCaps',
            tt: 'fixedWidth',
            rm: 'roman',
            sf: 'sansSerif',
            verb: 'verbatim',
        };
        node.value = node.value.filter((child, i) => {
            // if (child.kind === 'Text' && !child.value) return false
            const next = node.value[i + 1] || {};
            if (child.kind === 'RegularCommand' && child.value.match(/^text(super|sub)script$/) && !child.arguments.length && next.kind === 'NestedLiteral') {
                child.arguments = [{ kind: 'RequiredArgument', value: next.value }];
                next.kind = 'Text';
                next.value = '';
                return true;
            }
            // \frac can either be "\frac{n}{d}" or "\frac n d" -- shudder
            if (child.kind === 'RegularCommand' && child.value === 'frac' && !child.arguments.length) {
                if (next.kind === 'Text' && next.value.match(/^\s+[a-z0-9]+\s+[a-z0-9]+$/i)) {
                    child.arguments = next.value.trim().split(/\s+/).map(v => ({ kind: 'RequiredArgument', value: [this.text(v)] }));
                    next.value = '';
                    return true;
                }
                // spaces after a bare command are consumed
            }
            else if (child.kind === 'RegularCommand' && !child.arguments.length && next.kind === 'Text' && next.value.match(/^\s+/)) {
                // despite Mozilla's claim that trimStart === trimLeft, and that trimStart should be preferred, trimStart does not seem to exist in FF chrome code.
                next.value = next.value.trimLeft();
            }
            if (child.kind === 'RegularCommand' && markup[child.value] && !child.arguments.length) {
                if (node.markup) {
                    node.markup.delete('caseProtect');
                    node.markup.add(markup[child.value]);
                    if (markup[child.value] === 'smallCaps')
                        node.exemptFromSentenceCase = true;
                }
                return false;
            }
            return true;
        });
        node.value = node.value.map(child => this.cleanup(child, nocased || (node.markup && (node.markup.has('caseProtect') || node.exemptFromSentenceCase))));
        node.value = node.value.reduce((acc, child) => {
            const last = acc.length - 1;
            if (acc.length === 0 || child.kind !== 'Text' || acc[last].kind !== 'Text') {
                acc.push(child);
            }
            else {
                acc[last].value += child.value;
            }
            return acc;
        }, []);
    }
    argument(node, type) {
        if (type === 'none') {
            if (!node.arguments.length)
                return true;
            if (node.arguments.find(arg => arg.kind !== 'RequiredArgument' || arg.value.length))
                return false;
            return true;
        }
        if (typeof type === 'number') {
            if (node.arguments.length !== type || node.arguments.find(arg => arg.value.length !== 1 || arg.value[0].kind !== 'Text'))
                return false;
            return node.arguments.map(arg => arg.value[0].value);
        }
        if (!node.arguments || node.arguments.length !== 1 || node.arguments.find(arg => arg.kind !== 'RequiredArgument'))
            return false;
        switch (type) {
            case 'array':
                return node.arguments[0].value;
            case 'Text':
            case 'RegularCommand':
                return node.arguments[0].value.length === 1 && node.arguments[0].value[0].kind === type ? node.arguments[0].value[0].value : false;
        }
        return false;
    }
    cleanup(node, nocased) {
        if (Array.isArray(node))
            return node.map(child => this.cleanup(child, nocased));
        delete node.loc;
        if (!this['clean_' + node.kind])
            return this.error(`no cleanup method for '${node.kind}' (${this.show(node)})`, this.text());
        return this['clean_' + node.kind](node, nocased);
    }
    clean_BracedComment(node, nocased) { return node; }
    clean_LineComment(node, nocased) { return node; }
    clean_File(node, nocased) {
        node.children = node.children.filter(child => child.kind !== 'NonEntryText').map(child => this.cleanup(child, nocased));
        return node;
    }
    clean_StringExpression(node, nocased) {
        this.condense(node, nocased);
        this.strings[node.key.toUpperCase()] = node.value;
        return node;
    }
    clean_String(node, nocased) {
        const reference = node.value.toUpperCase();
        const _string = this.strings[reference] || this.default_strings[reference];
        if (!_string) {
            if (!this.unresolvedStrings[reference])
                this.errors.push({ message: `Unresolved @string reference ${JSON.stringify(node.value)}` });
            this.unresolvedStrings[reference] = true;
        }
        // if the string isn't found, add it as-is but exempt it from sentence casing
        return {
            kind: 'String',
            exemptFromSentenceCase: !_string,
            value: this.cleanup(_string ? JSON.parse(JSON.stringify(_string)) : [this.text(node.value)], nocased),
        };
    }
    clean_Entry(node, nocased) {
        node.properties = node.properties.map(child => this.cleanup(child, nocased));
        return node;
    }
    clean_Property(node, nocased) {
        const key = node.key.toLowerCase();
        // because this was abused so much, many processors ignore second-level too
        if (fields.title.concat(fields.unnest).includes(key) && node.value.length === 1 && node.value[0].kind === 'NestedLiteral') {
            node.value[0].markup = new Set;
            node.value[0].exemptFromSentenceCase = true;
        }
        this.condense(node, ['url', 'doi', 'file', 'files', 'eprint', 'verba', 'verbb', 'verbc'].includes(key) || !this.caseProtect);
        return node;
    }
    clean_Text(node, nocased) { return node; }
    clean_MathMode(node, nocased) { return node; }
    clean_RegularCommand(node, nocased) {
        let arg, unicode;
        switch (node.value) {
            case 't':
                if ((arg = this.argument(node, 'Text')) && (unicode = latex2unicode[`\\t{${arg}}`])) {
                    return this.text(unicode);
                }
                break;
            case 'vphantom':
                return this.text();
            case 'frac':
                // not a spectactular solution but what ya gonna do.
                if (arg = this.argument(node, 2)) {
                    return this.cleanup({
                        kind: 'NestedLiteral',
                        exemptFromSentenceCase: true,
                        markup: new Set,
                        value: [this.text(`${arg[0]}/${arg[1]}`)],
                    }, nocased);
                }
                break;
            case 'path':
            case 'aftergroup':
            case 'ignorespaces':
            case 'noopsort':
                return this.text();
            case 'chsf':
                if (this.argument(node, 'none'))
                    return this.text();
                if (arg = this.argument(node, 'array')) {
                    return this.cleanup({
                        kind: 'NestedLiteral',
                        markup: new Set,
                        value: arg,
                    }, nocased);
                }
                return node;
            case 'bibstring':
                if (arg = this.argument(node, 'Text'))
                    return this.text(arg);
                break;
            case 'cite':
                if (arg = this.argument(node, 1)) {
                    return this.cleanup({
                        kind: 'NestedLiteral',
                        exemptFromSentenceCase: true,
                        markup: new Set,
                        value: [this.text(arg[0])],
                    }, nocased);
                }
                break;
            case 'textsuperscript':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set(['sup']),
                    value: arg,
                }, nocased);
            case 'textsubscript':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set(['sub']),
                    value: arg,
                }, nocased);
            case 'textsc':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    exemptFromSentenceCase: true,
                    markup: new Set(['smallCaps']),
                    value: arg,
                }, nocased);
            case 'enquote':
            case 'mkbibquote':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set(['enquote']),
                    value: arg,
                }, nocased);
            case 'textbf':
            case 'mkbibbold':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set(['bold']),
                    value: arg,
                }, nocased);
            case 'mkbibitalic':
            case 'mkbibemph':
            case 'textit':
            case 'emph':
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set(['italics']),
                    value: arg,
                }, nocased);
            case 'bibcyr':
                if (this.argument(node, 'none'))
                    return this.text();
                if (!(arg = this.argument(node, 'array')))
                    return this.error(node.value + this.show(node), this.text());
                return this.cleanup({
                    kind: 'NestedLiteral',
                    markup: new Set,
                    value: arg,
                }, nocased);
            case 'mathrm':
            case 'textrm':
            case 'ocirc':
            case 'mbox':
                if (arg = this.argument(node, 'Text')) {
                    unicode = latex2unicode[`\\${node.value}{${arg}}`];
                    return this.text(unicode || arg);
                }
                else if (!node.arguments.length) {
                    return this.text();
                }
                else if (arg = this.argument(node, 'array')) {
                    return this.cleanup({
                        kind: 'NestedLiteral',
                        markup: new Set,
                        value: arg,
                    }, nocased);
                }
                break;
            case 'href':
                if (arg = this.argument(node, 2)) {
                    return this.text(arg[0]);
                }
                break;
            case 'url':
                if (arg = this.argument(node, 'Text'))
                    return this.text(arg);
                if (arg = this.argument(node, 'array')) {
                    return this.cleanup({
                        kind: 'NestedLiteral',
                        markup: new Set,
                        value: arg,
                    }, nocased);
                }
                break;
            default:
                unicode = latex2unicode[`\\${node.value}`] || latex2unicode[`\\${node.value}{}`];
                if (unicode && this.argument(node, 'none')) {
                    return this.text(unicode);
                }
                if (arg = this.argument(node, 'Text')) {
                    if (unicode = latex2unicode[`\\${node.value}{${arg}}`]) {
                        return this.text(unicode);
                    }
                }
        }
        return this.error('Unhandled command: ' + this.show(node), this.text());
    }
    _clean_ScriptCommand(node, nocased, mode) {
        let value, singlechar;
        const cmd = mode === 'sup' ? '^' : '_';
        if (typeof node.value === 'string' && (singlechar = latex2unicode[`${cmd}${node.value}`] || latex2unicode[`${cmd}{${node.value}}`])) {
            return this.text(singlechar);
        }
        if (typeof node.value === 'string') {
            value = [this.text(node.value)];
        }
        else if (!Array.isArray(node.value)) {
            value = [node.value];
        }
        else {
            value = node.value;
        }
        return this.cleanup({
            kind: 'NestedLiteral',
            markup: new Set([mode]),
            value,
        }, nocased);
    }
    clean_SubscriptCommand(node, nocased) {
        return this._clean_ScriptCommand(node, nocased, 'sub');
    }
    clean_SuperscriptCommand(node, nocased) {
        return this._clean_ScriptCommand(node, nocased, 'sup');
    }
    clean_NestedLiteral(node, nocased) {
        if (!node.markup)
            node.markup = nocased ? new Set() : new Set(['caseProtect']);
        // https://github.com/retorquere/zotero-better-bibtex/issues/541#issuecomment-240156274
        if (node.value.length && ['RegularCommand', 'DicraticalCommand'].includes(node.value[0].kind)) {
            node.markup.delete('caseProtect');
        }
        else if (node.value.length && node.value[0].kind === 'Text') {
            if (!node.value[0].value.split(/\s+/).find(word => !this.implicitlyNoCased(word))) {
                node.markup.delete('caseProtect');
                node.exemptFromSentenceCase = true;
            }
        }
        this.condense(node, nocased);
        return node;
    }
    clean_DicraticalCommand(node, nocased) {
        const char = node.dotless ? `\\${node.character}` : node.character;
        const unicode = latex2unicode[`\\${node.mark}{${char}}`]
            || latex2unicode[`\\${node.mark}${char}`]
            || latex2unicode[`{\\${node.mark} ${char}}`]
            || latex2unicode[`{\\${node.mark}${char}}`]
            || latex2unicode[`\\${node.mark} ${char}`];
        if (!unicode)
            return this.error(`Unhandled {\\${node.mark} ${char}}`, this.text());
        return this.text(unicode);
    }
    clean_SymbolCommand(node, nocased) {
        return this.text(latex2unicode[`\\${node.value}`] || node.value);
    }
    clean_PreambleExpression(node, nocased) { return node; }
    implicitlyNoCased(word) {
        // word = word.replace(new RegExp(`"[${this.markup.enquote.open}${this.markup.enquote.close}:()]`, 'g'), '')
        word = word.replace(/[:()]/g, '');
        if (word.match(/^[A-Z][^A-Z]+$/))
            return false;
        if (word.length > 1 && word.match(/^[A-Z][a-z]*(-[A-Za-z]+)*$/))
            return false;
        if (word.match(/[A-Z]/))
            return true;
        if (word.match(/^[0-9]+$/))
            return true;
        return false;
    }
    convert(node) {
        if (Array.isArray(node))
            return node.map(child => this.convert(child)).join('');
        if (!this['convert_' + node.kind])
            return this.error(`no converter for ${node.kind}: ${this.show(node)}`, undefined);
        const start = this.field ? this.field.text.length : null;
        this['convert_' + node.kind](node);
        const exemptFromSentenceCase = (typeof start === 'number'
            && this.field.exemptFromSentenceCase
            && (node.exemptFromSentenceCase
                ||
                    (node.markup && node.markup.has('caseProtect'))));
        if (exemptFromSentenceCase)
            this.field.exemptFromSentenceCase.push({ start, end: this.field.text.length });
    }
    convert_BracedComment(node) {
        this.comments.push(node.value);
    }
    convert_LineComment(node) {
        this.comments.push(node.value);
    }
    splitOnce(s, sep, fromEnd = false) {
        const split = fromEnd ? s.lastIndexOf(sep) : s.indexOf(sep);
        return (split < 0) ? [s, ''] : [s.substr(0, split), s.substr(split + 1)];
    }
    parseName(name) {
        let parsed = null;
        const parts = name.split(marker.comma);
        if (parts.length && !parts.find(p => !p.match(/^[a-z]+=/i))) { // extended name format
            parsed = {};
            for (const part of parts) {
                const [attr, value] = this.splitOnce(part.replace(markerRE.space, ''), '=').map(v => v.trim());
                switch (attr.toLowerCase()) {
                    case 'family':
                        parsed.lastName = value;
                        break;
                    case 'given':
                        parsed.firstName = value;
                        break;
                    case 'prefix':
                        parsed.prefix = value;
                        break;
                    case 'suffix':
                        parsed.suffix = value;
                        break;
                    case 'useprefix':
                        parsed.useprefix = value.toLowerCase() === 'true';
                        break;
                }
            }
        }
        const prefix = /(.+?)\s+(vere|von|van den|van der|van|de|del|della|der|di|da|pietro|vanden|du|st.|st|la|lo|ter|bin|ibn|te|ten|op|ben|al)\s+(.+)/;
        let m;
        switch (parsed ? -1 : parts.length) {
            case -1:
                // already parsed
                break;
            case 0: // should never happen
                throw new Error(name);
            case 1: // name without commas
                // literal
                if (markerRE.literalName.test(parts[0])) {
                    parsed = { literal: parts[0] };
                }
                else if (m = parts[0].replace(markerRE.space, ' ').match(prefix)) { // split on prefix
                    parsed = {
                        firstName: m[1],
                        prefix: m[2],
                        lastName: m[3],
                    };
                }
                else {
                    // top-level "firstname lastname"
                    const [firstName, lastName] = this.splitOnce(parts[0], marker.space, true);
                    if (lastName) {
                        parsed = { firstName, lastName };
                    }
                    else {
                        parsed = { lastName: firstName };
                    }
                }
                break;
            case 2: // lastname, firstname
                parsed = {
                    lastName: parts[0],
                    firstName: parts[1],
                };
                break;
            default: // lastname, suffix, firstname
                parsed = {
                    lastName: parts[0],
                    suffix: parts[1],
                    firstName: parts.slice(2).join(marker.comma),
                };
        }
        for (let [k, v] of Object.entries(parsed)) {
            if (typeof v !== 'string')
                continue;
            // why do people have '{Lastname}, Firstname'?
            if (markerRE.literalName.test(v))
                v = v.replace(markerRE.literal, '"').slice(1, -1);
            parsed[k] = v.replace(markerRE.space, ' ').replace(markerRE.comma, ', ').replace(markerRE.literal, '"').trim();
        }
        return parsed;
    }
    convert_Entry(node) {
        this.entry = {
            key: node.id,
            type: node.type,
            fields: {},
            creators: {},
        };
        this.entries.push(this.entry);
        for (const prop of node.properties) {
            if (prop.kind !== 'Property')
                return this.error(`Expected Property, got ${prop.kind}`, undefined);
            const name = prop.key.toLowerCase();
            this.field = {
                name,
                creator: fields.creator.includes(prop.key.toLowerCase()),
                text: '',
                level: 0,
                words: {
                    lowercase: 0,
                    other: 0,
                },
                exemptFromSentenceCase: this.sentenceCase && fields.title.includes(name) ? [] : null,
            };
            this.entry.fields[this.field.name] = this.entry.fields[this.field.name] || [];
            this.convert(prop.value);
            this.field.text = this.field.text.trim();
            if (!this.field.text)
                continue;
            // "groups" is a jabref 3.8+ monstrosity
            if (this.field.name.match(/^(keywords?|groups)$/)) {
                for (let text of this.field.text.split(marker.comma)) {
                    text = text.trim();
                    if (text)
                        this.entry.fields[this.field.name].push(text);
                }
            }
            else if (this.field.creator) {
                if (!this.entry.creators[this.field.name])
                    this.entry.creators[this.field.name] = [];
                // {M. Halle, J. Bresnan, and G. Miller}
                if (this.field.text.includes(`${marker.comma}${marker.and}`)) { //
                    this.field.text = this.field.text.replace(new RegExp(`${marker.comma}${marker.and}`, 'g'), marker.and).replace(new RegExp(marker.comma), marker.and);
                }
                for (const creator of this.field.text.split(marker.and)) {
                    this.entry.fields[this.field.name].push(creator.replace(markerRE.comma, ', ').replace(markerRE.space, ' ').replace(markerRE.literal, '"'));
                    this.entry.creators[this.field.name].push(this.parseName(creator));
                }
            }
            else {
                if (this.field.words.lowercase > this.field.words.other)
                    this.field.exemptFromSentenceCase = null;
                this.entry.fields[this.field.name].push(this.convertToSentenceCase(this.field.text, this.field.exemptFromSentenceCase));
            }
        }
        this.field = null;
    }
    convertToSentenceCase(text, exemptions) {
        if (!exemptions)
            return text;
        let sentenceCased = text.toLowerCase().replace(/(([\?!]\s*|^)([\'\"¡¿“‘„«\s]+)?[^\s])/g, x => x.toUpperCase());
        for (const { start, end } of exemptions) {
            sentenceCased = sentenceCased.substring(0, start) + text.substring(start, end) + sentenceCased.substring(end);
        }
        return sentenceCased;
    }
    convert_Number(node) {
        this.field.text += `${node.value}`;
    }
    convert_Text(node) {
        node.value = node.value.replace(/``/g, this.markup.enquote.open).replace(/''/g, this.markup.enquote.close);
        // heuristic to detect pre-sentencecased text
        for (const word of node.value.split(/\b/)) {
            if (word.match(/^[a-z0-9]+$/)) {
                this.field.words.lowercase++;
            }
            else if (word.match(/[a-z]/i)) {
                this.field.words.other++;
            }
        }
        if (this.field.level === 0 && this.field.creator) {
            this.field.text += node.value.replace(/\s+and\s+/ig, marker.and).replace(/\s*,\s*/g, marker.comma).replace(/\s+/g, marker.space);
            return;
        }
        if (this.field.level === 0 && this.field.name.match(/^(keywords?|groups)$/)) {
            this.field.text += node.value.replace(/\s*[;,]\s*/g, marker.comma);
            return;
        }
        if (this.field.exemptFromSentenceCase) {
            for (const word of node.value.split(/(\s+)/)) {
                if (this.implicitlyNoCased(word))
                    this.field.exemptFromSentenceCase.push({ start: this.field.text.length, end: this.field.text.length + word.length });
                this.field.text += word;
            }
            return;
        }
        this.field.text += node.value;
    }
    convert_MathMode(node) { return; }
    convert_PreambleExpression(node) { return; }
    convert_StringExpression(node) { return; }
    convert_String(node) {
        this.convert(node.value);
    }
    convert_NestedLiteral(node) {
        const prefix = [];
        const postfix = [];
        // relies on Set remembering insertion order
        for (const markup of Array.from(node.markup)) {
            if (markup === 'caseProtect' && this.field.creator) {
                prefix.push(marker.literal);
                postfix.unshift(marker.literal);
                continue;
            }
            if (!this.markup[markup])
                return this.error(`markup: ${markup}`, undefined);
            prefix.push(this.markup[markup].open);
            postfix.unshift(this.markup[markup].close);
        }
        const end = {
            withoutPrefix: this.field.text.length,
            withPrefix: 0,
        };
        this.field.text += prefix.join('');
        end.withPrefix = this.field.text.length;
        this.field.level++;
        this.convert(node.value);
        this.field.level--;
        if (this.field.text.length === end.withPrefix) { // nothing was added, so remove prefix
            this.field.text = this.field.text.substring(0, end.withoutPrefix);
        }
        else {
            this.field.text += postfix.reverse().join('');
        }
        this.field.text = this.field.text.replace(/<(sup|sub)>([^<>]+)<\/\1>$/i, (m, mode, chars) => {
            const cmd = mode === 'sup' ? '^' : '_';
            let script = '';
            for (const char of chars) {
                const unicode = latex2unicode[`${cmd}${char}`] || latex2unicode[`${cmd}{${char}}`];
                script += unicode ? unicode : `<${mode}>${char}</${mode}>`;
            }
            script = script.replace(new RegExp(`</${mode}><${mode}>`, 'g'), '');
            return script.length < m.length ? script : m;
        });
    }
}
/**
 * parse bibtex. This will try to convert TeX commands into unicode equivalents, and apply `@string` expansion
 */
function parse(input, options = {}) {
    const parser = new Parser({
        caseProtect: options.caseProtect,
        sentenceCase: options.sentenceCase,
        markup: options.markup,
        errorHandler: options.errorHandler,
    });
    return options.async ? parser.parseAsync(input, { verbatimFields: options.verbatimFields }) : parser.parse(input, { verbatimFields: options.verbatimFields });
}
exports.parse = parse;
var chunker_2 = __webpack_require__(/*! ./chunker */ "../node_modules/@retorquere/bibtex-parser/chunker.js");
exports.chunker = chunker_2.parse;
var jabref_1 = __webpack_require__(/*! ./jabref */ "../node_modules/@retorquere/bibtex-parser/jabref.js");
exports.jabref = jabref_1.parse;


/***/ }),

/***/ "../node_modules/@retorquere/bibtex-parser/jabref.js":
/*!***********************************************************!*\
  !*** ../node_modules/@retorquere/bibtex-parser/jabref.js ***!
  \***********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function decode(s, sep = ';') {
    s = s.replace(/\n/g, '');
    let pos = 0;
    const records = [''];
    while (pos < s.length) {
        switch (s[pos]) {
            case '\\':
                pos++;
                records[0] += s[pos];
                break;
            case sep:
                records.unshift('');
                break;
            default:
                records[0] += s[pos];
        }
        pos++;
    }
    return records.reverse().filter(record => record);
}
const prefixes = {
    fileDirectory: 'jabref-meta: fileDirectory:',
    groupsversion: 'jabref-meta: groupsversion:',
    groupstree: 'jabref-meta: groupstree:',
};
/**
 * Import the JabRef groups from the `@string` comments in which they were stored. You would typically pass the comments parsed by [[bibtex.parse]] in here.
 *
 * JabRef knows several group types, and this parser parses most, but not all of them:
 *
 * * independent group: the keys listed in the group are the entries that are considered to belong to it
 * * intersection: the keys listed in the group are considered to belong to the group if they're also in the parent group
 * * union: the keys listed in the group are considered to belong to the group, and also the keys that are in the parent group
 * * query: not supported by this parser
 */
function parse(comments) {
    const result = {
        root: [],
        groups: {},
        fileDirectory: '',
        version: '',
    };
    const levels = [];
    const decoded = {
        fileDirectory: null,
        groupsversion: null,
        groupstree: null,
    };
    for (const comment of comments) {
        for (const [meta, prefix] of Object.entries(prefixes)) {
            if (comment.startsWith(prefix)) {
                decoded[meta] = decode(comment.substring(prefix.length));
            }
        }
    }
    result.version = decoded.groupsversion && decoded.groupsversion[0];
    result.fileDirectory = decoded.fileDirectory && decoded.fileDirectory[0];
    if (!decoded.groupstree)
        return result;
    for (const encoded of decoded.groupstree) {
        const fields = decode(encoded);
        const level_type_name = decode(fields.shift(), ':');
        const m = /^([0-9]+) (.+)/.exec(level_type_name[0]);
        if (!m)
            break;
        const level = parseInt(m[1]);
        // const type = m[2]
        if (level === 0)
            continue; // root
        const name = level_type_name[1];
        const intersection = decode(fields.shift())[0];
        const keys = fields.map(field => decode(field)[0]);
        const group = {
            name,
            entries: keys,
            groups: [],
        };
        result.groups[name] = result.groups[name] || group;
        if (levels.length < level) {
            levels.push(group);
        }
        else {
            levels[level - 1] = group;
        }
        if (level === 1) {
            result.root.push(group);
        }
        else {
            const parent = levels[level - 2];
            switch (intersection) {
                case '0': // independent
                    break;
                case '1': // intersect
                    group.entries = group.entries.filter(key => parent.entries.includes(key));
                    break;
                case '2': // union
                    group.entries = group.entries.concat(parent.entries.filter(key => !group.entries.includes(key)));
                    break;
            }
            levels[level - 2].groups.push(group);
        }
    }
    return result;
}
exports.parse = parse;


/***/ }),

/***/ "../node_modules/@retorquere/bibtex-parser/latex2unicode.js":
/*!******************************************************************!*\
  !*** ../node_modules/@retorquere/bibtex-parser/latex2unicode.js ***!
  \******************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = {
  '\\_': '_',
  '\\lbrace': '{',
  '\\{': '{',
  '\\rbrace': '}',
  '\\}': '}',
  '\\&': '&',
  '\\#': '#',
  '\\%': '%',
  '\\sphat': '^',
  '\\^': '\u0302',
  '\\sptilde': '~',
  '\\textasciitilde': '~',
  '\\$': '$',
  '\\backslash': '\\',
  '\\textbackslash': '\\',
  '\\textexclamdown': '\xA1',
  '\\cent': '\xA2',
  '\\textcent': '\xA2',
  '\\pounds': '\xA3',
  '\\textsterling': '\xA3',
  '\\textcurrency': '\xA4',
  '\\yen': '\xA5',
  '\\textyen': '\xA5',
  '\\textbrokenbar': '\xA6',
  '\\textsection': '\xA7',
  '\\spddot': '\xA8',
  '\\textasciidieresis': '\xA8',
  '\\textcopyright': '\xA9',
  '\\textordfeminine': '\xAA',
  '\\guillemotleft': '\xAB',
  '\\lnot': '\xAC',
  '\\-': '\xAD',
  '\\circledR': '\xAE',
  '\\textregistered': '\xAE',
  '\\textasciimacron': '\xAF',
  '^\\circ': '\xB0',
  '\\textdegree': '\xB0',
  '\\pm': '\xB1',
  '^{2}': '\xB2',
  '^{3}': '\xB3',
  '\\textasciiacute': '\xB4',
  '\\mathrm{\\mu}': '\xB5',
  '\\textparagraph': '\xB6',
  '\\cdot': '\u22C5',
  '\\c': '\u0327',
  '^{1}': '\xB9',
  '\\textordmasculine': '\xBA',
  '\\guillemotright': '\xBB',
  '\\textonequarter': '\xBC',
  '\\textonehalf': '\xBD',
  '\\textthreequarters': '\xBE',
  '\\textquestiondown': '\xBF',
  '\\`A': '\xC0',
  '\\\'A': '\u0386',
  '\\^A': '\xC2',
  '\\~A': '\xC3',
  '\\"A': '\xC4',
  '\\AA': '\u212B',
  '\\AE': '\xC6',
  '{\\c C}': '\xC7',
  '\\`E': '\xC8',
  '\\\'E': '\u0388',
  '\\^E': '\xCA',
  '\\"E': '\xCB',
  '\\`I': '\xCC',
  '\\\'I': '\xCD',
  '\\^I': '\xCE',
  '\\"I': '\xCF',
  '\\DH': '\xD0',
  '\\~N': '\xD1',
  '\\`O': '\xD2',
  '\\\'O': '\xD3',
  '\\^O': '\xD4',
  '\\~O': '\xD5',
  '\\"O': '\xD6',
  '\\times': '\xD7',
  '\\texttimes': '\xD7',
  '\\O': '\xD8',
  '\\`U': '\xD9',
  '\\\'U': '\xDA',
  '\\^U': '\xDB',
  '\\"U': '\xDC',
  '\\\'Y': '\xDD',
  '\\TH': '\xDE',
  '\\ss': '\xDF',
  '\\`a': '\xE0',
  '\\\'a': '\xE1',
  '\\^a': '\xE2',
  '\\~a': '\xE3',
  '\\"a': '\xE4',
  '\\aa': '\xE5',
  '\\ae': '\xE6',
  '{\\c c}': '\xE7',
  '\\`e': '\xE8',
  '\\\'e': '\xE9',
  '\\^e': '\xEA',
  '\\"e': '\xEB',
  '\\`i': '\xEC',
  '\\\'i': '\xED',
  '\\^i': '\xEE',
  '\\"i': '\xEF',
  '\\eth': '\u01AA',
  '\\dh': '\xF0',
  '\\~n': '\xF1',
  '\\`o': '\xF2',
  '\\\'o': '\u03CC',
  '\\^o': '\xF4',
  '\\~o': '\xF5',
  '\\"o': '\xF6',
  '\\div': '\xF7',
  '\\o': '\xF8',
  '\\`u': '\xF9',
  '\\\'u': '\xFA',
  '\\^u': '\xFB',
  '\\"u': '\xFC',
  '\\\'y': '\xFD',
  '\\th': '\xFE',
  '\\"y': '\xFF',
  '\\=A': '\u0100',
  '\\=a': '\u0101',
  '{\\u A}': '\u0102',
  '{\\u a}': '\u0103',
  '\\k{A}': '\u0104',
  '\\k{a}': '\u0105',
  '\\\'C': '\u0106',
  '\\\'c': '\u0107',
  '\\^C': '\u0108',
  '\\^c': '\u0109',
  '\\.C': '\u010A',
  '\\.c': '\u010B',
  '{\\v C}': '\u010C',
  '{\\v c}': '\u010D',
  '{\\v D}': '\u010E',
  '{\\v d}': '\u010F',
  '\\DJ': '\u0110',
  '\\dj': '\u0111',
  '\\=E': '\u0112',
  '\\=e': '\u0113',
  '{\\u E}': '\u0114',
  '{\\u e}': '\u0115',
  '\\.E': '\u0116',
  '\\.e': '\u0117',
  '\\k{E}': '\u0118',
  '\\k{e}': '\u0119',
  '{\\v E}': '\u011A',
  '{\\v e}': '\u011B',
  '\\^G': '\u011C',
  '\\^g': '\u011D',
  '{\\u G}': '\u011E',
  '{\\u g}': '\u011F',
  '\\.G': '\u0120',
  '\\.g': '\u0121',
  '{\\c G}': '\u0122',
  '{\\c g}': '\u0123',
  '\\^H': '\u0124',
  '\\^h': '\u0125',
  '{\\fontencoding{LELA}\\selectfont\\char40}': '\u0126',
  '\\Elzxh': '\u0127',
  '\\~I': '\u0128',
  '\\~i': '\u0129',
  '\\=I': '\u012A',
  '\\=i': '\u012B',
  '{\\u I}': '\u012C',
  '{\\u \\i}': '\u012D',
  '\\k{I}': '\u012E',
  '\\k{i}': '\u012F',
  '\\.I': '\u0130',
  '\\imath': '\uD835\uDEA4',
  '\\i': '\u0131',
  '\\^J': '\u0134',
  '\\^\\j': '\u0135',
  '{\\c K}': '\u0136',
  '{\\c k}': '\u0137',
  '{\\fontencoding{LELA}\\selectfont\\char91}': '\u0138',
  '\\\'L': '\u0139',
  '\\\'l': '\u013A',
  '{\\c L}': '\u013B',
  '{\\c l}': '\u013C',
  '{\\v L}': '\u013D',
  '{\\v l}': '\u013E',
  '{\\fontencoding{LELA}\\selectfont\\char201}': '\u013F',
  '{\\fontencoding{LELA}\\selectfont\\char202}': '\u0140',
  '\\L': '\u0141',
  '\\l': '\u0142',
  '\\\'N': '\u0143',
  '\\\'n': '\u0144',
  '{\\c N}': '\u0145',
  '{\\c n}': '\u0146',
  '{\\v N}': '\u0147',
  '{\\v n}': '\u0148',
  '\\NG': '\u014A',
  '\\ng': '\u014B',
  '\\=O': '\u014C',
  '\\=o': '\u014D',
  '{\\u O}': '\u014E',
  '{\\u o}': '\u014F',
  '{\\H O}': '\u0150',
  '{\\H o}': '\u0151',
  '\\OE': '\u0152',
  '\\oe': '\u0153',
  '\\\'R': '\u0154',
  '\\\'r': '\u0155',
  '{\\c R}': '\u0156',
  '{\\c r}': '\u0157',
  '{\\v R}': '\u0158',
  '{\\v r}': '\u0159',
  '\\\'S': '\u015A',
  '\\\'s': '\u015B',
  '\\^S': '\u015C',
  '\\^s': '\u015D',
  '{\\c S}': '\u015E',
  '{\\c s}': '\u015F',
  '{\\v S}': '\u0160',
  '{\\v s}': '\u0161',
  '{\\c T}': '\u0162',
  '{\\c t}': '\u0163',
  '{\\v T}': '\u0164',
  '{\\v t}': '\u0165',
  '{\\fontencoding{LELA}\\selectfont\\char47}': '\u0166',
  '{\\fontencoding{LELA}\\selectfont\\char63}': '\u0167',
  '\\~U': '\u0168',
  '\\~u': '\u0169',
  '\\=U': '\u016A',
  '\\=u': '\u016B',
  '{\\u U}': '\u016C',
  '{\\u u}': '\u016D',
  '\\r{U}': '\u016E',
  '\\r{u}': '\u016F',
  '{\\H U}': '\u0170',
  '{\\H u}': '\u0171',
  '\\k{U}': '\u0172',
  '\\k{u}': '\u0173',
  '\\^W': '\u0174',
  '\\^w': '\u0175',
  '\\^Y': '\u0176',
  '\\^y': '\u0177',
  '\\"Y': '\u0178',
  '\\\'Z': '\u0179',
  '\\\'z': '\u017A',
  '\\.Z': '\u017B',
  '\\.z': '\u017C',
  '{\\v Z}': '\u017D',
  '{\\v z}': '\u017E',
  '\\texthvlig': '\u0195',
  '\\textnrleg': '\u019E',
  '\\Zbar': '\u01B5',
  '{\\fontencoding{LELA}\\selectfont\\char195}': '\u01BA',
  '\\textdoublepipe': '\u01C2',
  '{\\v A}': '\u01CD',
  '{\\v a}': '\u01CE',
  '{\\v I}': '\u01CF',
  '{\\v i}': '\u01D0',
  '{\\v O}': '\u01D1',
  '{\\v o}': '\u01D2',
  '{\\v U}': '\u01D3',
  '{\\v u}': '\u01D4',
  '{\\v G}': '\u01E6',
  '{\\v g}': '\u01E7',
  '{\\v K}': '\u01E8',
  '{\\v k}': '\u01E9',
  '{\\k O}': '\u01EA',
  '{\\k o}': '\u01EB',
  '{\\v j}': '\u01F0',
  '\\\'G': '\u01F4',
  '\\\'g': '\u01F5',
  '\\jmath': '\uD835\uDEA5',
  '\\Elztrna': '\u0250',
  '\\Elztrnsa': '\u0252',
  '\\Elzopeno': '\u0254',
  '\\Elzrtld': '\u0256',
  '{\\fontencoding{LEIP}\\selectfont\\char61}': '\u0258',
  '\\Elzschwa': '\u0259',
  '\\varepsilon': '\u025B',
  '\\Elzpgamma': '\u0263',
  '\\Elzpbgam': '\u0264',
  '\\Elztrnh': '\u0265',
  '\\Elzbtdl': '\u026C',
  '\\Elzrtll': '\u026D',
  '\\Elztrnm': '\u026F',
  '\\Elztrnmlr': '\u0270',
  '\\Elzltlmr': '\u0271',
  '\\Elzltln': '\u0272',
  '\\Elzrtln': '\u0273',
  '\\Elzclomeg': '\u0277',
  '\\textphi': '\u0278',
  '\\Elztrnr': '\u0279',
  '\\Elztrnrl': '\u027A',
  '\\Elzrttrnr': '\u027B',
  '\\Elzrl': '\u027C',
  '\\Elzrtlr': '\u027D',
  '\\Elzfhr': '\u027E',
  '{\\fontencoding{LEIP}\\selectfont\\char202}': '\u027F',
  '\\Elzrtls': '\u0282',
  '\\Elzesh': '\u0283',
  '\\Elztrnt': '\u0287',
  '\\Elzrtlt': '\u0288',
  '\\Elzpupsil': '\u028A',
  '\\Elzpscrv': '\u028B',
  '\\Elzinvv': '\u028C',
  '\\Elzinvw': '\u028D',
  '\\Elztrny': '\u028E',
  '\\Elzrtlz': '\u0290',
  '\\Elzyogh': '\u0292',
  '\\Elzglst': '\u0294',
  '\\Elzreglst': '\u0295',
  '\\Elzinglst': '\u0296',
  '\\textturnk': '\u029E',
  '\\Elzdyogh': '\u02A4',
  '\\Elztesh': '\u02A7',
  '\\textasciicircum': '\u02C6',
  '\\textasciicaron': '\u02C7',
  '\\Elzverts': '\u02C8',
  '\\Elzverti': '\u02CC',
  '\\Elzlmrk': '\u02D0',
  '\\Elzhlmrk': '\u02D1',
  '\\Elzsbrhr': '\u02D2',
  '\\Elzsblhr': '\u02D3',
  '\\Elzrais': '\u02D4',
  '\\Elzlow': '\u02D5',
  '\\textasciibreve': '\u02D8',
  '\\textperiodcentered': '\u02D9',
  '\\r': '\u030A',
  '\\k': '\u0328',
  '\\texttildelow': '\u02DC',
  '\\H': '\u030B',
  '\\tone{55}': '\u02E5',
  '\\tone{44}': '\u02E6',
  '\\tone{33}': '\u02E7',
  '\\tone{22}': '\u02E8',
  '\\tone{11}': '\u02E9',
  '\\grave': '\u0300',
  '\\`': '\u0300',
  '\\acute': '\u0301',
  '\\\'': '\u0301',
  '\\hat': '\u0302',
  '\\tilde': '\u0303',
  '\\~': '\u0303',
  '\\bar': '\u0304',
  '\\=': '\u0304',
  '\\overline': '\u0305',
  '\\breve': '\u0306',
  '\\u': '\u0306',
  '\\dot': '\u0307',
  '\\.': '\u0307',
  '\\ddot': '\u0308',
  '\\"': '\u0308',
  '\\ovhook': '\u0309',
  '\\mathring': '\u030A',
  '\\check': '\u030C',
  '\\v': '\u030C',
  '\\cyrchar\\C': '\u030F',
  '\\candra': '\u0310',
  '{\\fontencoding{LECO}\\selectfont\\char177}': '\u0311',
  '\\oturnedcomma': '\u0312',
  '\\ocommatopright': '\u0315',
  '{\\fontencoding{LECO}\\selectfont\\char184}': '\u0318',
  '{\\fontencoding{LECO}\\selectfont\\char185}': '\u0319',
  '\\droang': '\u031A',
  '\\Elzpalh': '\u0321',
  '\\Elzrh': '\u0322',
  '\\Elzsbbrg': '\u032A',
  '{\\fontencoding{LECO}\\selectfont\\char203}': '\u032B',
  '{\\fontencoding{LECO}\\selectfont\\char207}': '\u032F',
  '\\utilde': '\u0330',
  '\\underbar': '\u0331',
  '\\underline': '\u0332',
  '\\Elzxl': '\u0335',
  '\\Elzbar': '\u0336',
  '{\\fontencoding{LECO}\\selectfont\\char215}': '\u0337',
  '\\not': '\u0338',
  '{\\fontencoding{LECO}\\selectfont\\char218}': '\u033A',
  '{\\fontencoding{LECO}\\selectfont\\char219}': '\u033B',
  '{\\fontencoding{LECO}\\selectfont\\char220}': '\u033C',
  '{\\fontencoding{LECO}\\selectfont\\char221}': '\u033D',
  '{\\fontencoding{LECO}\\selectfont\\char225}': '\u0361',
  '\\\'H': '\u0389',
  '{\\\'{}I}': '\u038A',
  '{\\\'{}O}': '\u038C',
  '\\mathrm{\'Y}': '\u038E',
  '\\mathrm{\'\\Omega}': '\u038F',
  '\\acute{\\ddot{\\iota}}': '\u0390',
  '\\Gamma': '\u0393',
  '\\Delta': '\u0394',
  '\\Theta': '\u0398',
  '\\Lambda': '\u039B',
  '\\Xi': '\u039E',
  '\\Pi': '\u03A0',
  '\\Sigma': '\u03A3',
  '\\Upsilon': '\u03D2',
  '\\Phi': '\u03A6',
  '\\Psi': '\u03A8',
  '\\Omega': '\u2126',
  '\\mathrm{\\ddot{I}}': '\u03AA',
  '\\mathrm{\\ddot{Y}}': '\u03AB',
  '{\\\'$\\alpha$}': '\u03AC',
  '\\acute{\\epsilon}': '\u03AD',
  '\\acute{\\eta}': '\u03AE',
  '\\acute{\\iota}': '\u03AF',
  '\\acute{\\ddot{\\upsilon}}': '\u03B0',
  '\\alpha': '\u03B1',
  '\\beta': '\u03B2',
  '\\gamma': '\u03B3',
  '\\delta': '\u03B4',
  '\\epsilon': '\u03F5',
  '\\zeta': '\u03B6',
  '\\eta': '\u03B7',
  '\\theta': '\u03B8',
  '\\texttheta': '\u03B8',
  '\\iota': '\u03B9',
  '\\kappa': '\u03BA',
  '\\lambda': '\u03BB',
  '\\mu': '\u03BC',
  '\\nu': '\u03BD',
  '\\xi': '\u03BE',
  '\\pi': '\u03C0',
  '\\rho': '\u03C1',
  '\\varsigma': '\u03C2',
  '\\sigma': '\u03C3',
  '\\tau': '\u03C4',
  '\\upsilon': '\u03C5',
  '\\varphi': '\u03C6',
  '\\chi': '\u03C7',
  '\\psi': '\u03C8',
  '\\omega': '\u03C9',
  '\\ddot{\\iota}': '\u03CA',
  '\\ddot{\\upsilon}': '\u03CB',
  '\\acute{\\upsilon}': '\u03CD',
  '\\acute{\\omega}': '\u03CE',
  '\\varbeta': '\u03D0',
  '\\Pisymbol{ppi022}{87}': '\u03D0',
  '\\vartheta': '\u03D1',
  '\\textvartheta': '\u03D1',
  '\\phi': '\u03D5',
  '\\varpi': '\u03D6',
  '\\Qoppa': '\u03D8',
  '\\qoppa': '\u03D9',
  '\\Stigma': '\u03DA',
  '\\stigma': '\u03DB',
  '\\Digamma': '\u03DC',
  '\\digamma': '\u03DD',
  '\\Koppa': '\u03DE',
  '\\koppa': '\u03DF',
  '\\Sampi': '\u03E0',
  '\\sampi': '\u03E1',
  '\\varkappa': '\u03F0',
  '\\varrho': '\u03F1',
  '\\upvarTheta': '\u03F4',
  '\\textTheta': '\u03F4',
  '\\backepsilon': '\u03F6',
  '\\cyrchar\\CYRYO': '\u0401',
  '\\cyrchar\\CYRDJE': '\u0402',
  '\\cyrchar{\\\'\\CYRG}': '\u0403',
  '\\cyrchar\\CYRIE': '\u0404',
  '\\cyrchar\\CYRDZE': '\u0405',
  '\\cyrchar\\CYRII': '\u0406',
  '\\cyrchar\\CYRYI': '\u0407',
  '\\cyrchar\\CYRJE': '\u0408',
  '\\cyrchar\\CYRLJE': '\u0409',
  '\\cyrchar\\CYRNJE': '\u040A',
  '\\cyrchar\\CYRTSHE': '\u040B',
  '\\cyrchar{\\\'\\CYRK}': '\u040C',
  '\\cyrchar\\CYRUSHRT': '\u040E',
  '\\cyrchar\\CYRDZHE': '\u040F',
  '\\cyrchar\\CYRA': '\u0410',
  '\\cyrchar\\CYRB': '\u0411',
  '\\cyrchar\\CYRV': '\u0412',
  '\\cyrchar\\CYRG': '\u0413',
  '\\cyrchar\\CYRD': '\u0414',
  '\\cyrchar\\CYRE': '\u0415',
  '\\cyrchar\\CYRZH': '\u0416',
  '\\cyrchar\\CYRZ': '\u0417',
  '\\cyrchar\\CYRI': '\u0418',
  '\\cyrchar\\CYRISHRT': '\u0419',
  '\\cyrchar\\CYRK': '\u041A',
  '\\cyrchar\\CYRL': '\u041B',
  '\\cyrchar\\CYRM': '\u041C',
  '\\cyrchar\\CYRN': '\u041D',
  '\\cyrchar\\CYRO': '\u041E',
  '\\cyrchar\\CYRP': '\u041F',
  '\\cyrchar\\CYRR': '\u0420',
  '\\cyrchar\\CYRS': '\u0421',
  '\\cyrchar\\CYRT': '\u0422',
  '\\cyrchar\\CYRU': '\u0423',
  '\\cyrchar\\CYRF': '\u0424',
  '\\cyrchar\\CYRH': '\u0425',
  '\\cyrchar\\CYRC': '\u0426',
  '\\cyrchar\\CYRCH': '\u0427',
  '\\cyrchar\\CYRSH': '\u0428',
  '\\cyrchar\\CYRSHCH': '\u0429',
  '\\cyrchar\\CYRHRDSN': '\u042A',
  '\\cyrchar\\CYRERY': '\u042B',
  '\\cyrchar\\CYRSFTSN': '\u042C',
  '\\cyrchar\\CYREREV': '\u042D',
  '\\cyrchar\\CYRYU': '\u042E',
  '\\cyrchar\\CYRYA': '\u042F',
  '\\cyrchar\\cyra': '\u0430',
  '\\cyrchar\\cyrb': '\u0431',
  '\\cyrchar\\cyrv': '\u0432',
  '\\cyrchar\\cyrg': '\u0433',
  '\\cyrchar\\cyrd': '\u0434',
  '\\cyrchar\\cyre': '\u0435',
  '\\cyrchar\\cyrzh': '\u0436',
  '\\cyrchar\\cyrz': '\u0437',
  '\\cyrchar\\cyri': '\u0438',
  '\\cyrchar\\cyrishrt': '\u0439',
  '\\cyrchar\\cyrk': '\u043A',
  '\\cyrchar\\cyrl': '\u043B',
  '\\cyrchar\\cyrm': '\u043C',
  '\\cyrchar\\cyrn': '\u043D',
  '\\cyrchar\\cyro': '\u043E',
  '\\cyrchar\\cyrp': '\u043F',
  '\\cyrchar\\cyrr': '\u0440',
  '\\cyrchar\\cyrs': '\u0441',
  '\\cyrchar\\cyrt': '\u0442',
  '\\cyrchar\\cyru': '\u0443',
  '\\cyrchar\\cyrf': '\u0444',
  '\\cyrchar\\cyrh': '\u0445',
  '\\cyrchar\\cyrc': '\u0446',
  '\\cyrchar\\cyrch': '\u0447',
  '\\cyrchar\\cyrsh': '\u0448',
  '\\cyrchar\\cyrshch': '\u0449',
  '\\cyrchar\\cyrhrdsn': '\u044A',
  '\\cyrchar\\cyrery': '\u044B',
  '\\cyrchar\\cyrsftsn': '\u044C',
  '\\cyrchar\\cyrerev': '\u044D',
  '\\cyrchar\\cyryu': '\u044E',
  '\\cyrchar\\cyrya': '\u044F',
  '\\cyrchar\\cyryo': '\u0451',
  '\\cyrchar\\cyrdje': '\u0452',
  '\\cyrchar{\\\'\\cyrg}': '\u0453',
  '\\cyrchar\\cyrie': '\u0454',
  '\\cyrchar\\cyrdze': '\u0455',
  '\\cyrchar\\cyrii': '\u0456',
  '\\cyrchar\\cyryi': '\u0457',
  '\\cyrchar\\cyrje': '\u0458',
  '\\cyrchar\\cyrlje': '\u0459',
  '\\cyrchar\\cyrnje': '\u045A',
  '\\cyrchar\\cyrtshe': '\u045B',
  '\\cyrchar{\\\'\\cyrk}': '\u045C',
  '\\cyrchar\\cyrushrt': '\u045E',
  '\\cyrchar\\cyrdzhe': '\u045F',
  '\\cyrchar\\CYROMEGA': '\u0460',
  '\\cyrchar\\cyromega': '\u0461',
  '\\cyrchar\\CYRYAT': '\u0462',
  '\\cyrchar\\CYRIOTE': '\u0464',
  '\\cyrchar\\cyriote': '\u0465',
  '\\cyrchar\\CYRLYUS': '\u0466',
  '\\cyrchar\\cyrlyus': '\u0467',
  '\\cyrchar\\CYRIOTLYUS': '\u0468',
  '\\cyrchar\\cyriotlyus': '\u0469',
  '\\cyrchar\\CYRBYUS': '\u046A',
  '\\cyrchar\\CYRIOTBYUS': '\u046C',
  '\\cyrchar\\cyriotbyus': '\u046D',
  '\\cyrchar\\CYRKSI': '\u046E',
  '\\cyrchar\\cyrksi': '\u046F',
  '\\cyrchar\\CYRPSI': '\u0470',
  '\\cyrchar\\cyrpsi': '\u0471',
  '\\cyrchar\\CYRFITA': '\u0472',
  '\\cyrchar\\CYRIZH': '\u0474',
  '\\cyrchar\\CYRUK': '\u0478',
  '\\cyrchar\\cyruk': '\u0479',
  '\\cyrchar\\CYROMEGARND': '\u047A',
  '\\cyrchar\\cyromegarnd': '\u047B',
  '\\cyrchar\\CYROMEGATITLO': '\u047C',
  '\\cyrchar\\cyromegatitlo': '\u047D',
  '\\cyrchar\\CYROT': '\u047E',
  '\\cyrchar\\cyrot': '\u047F',
  '\\cyrchar\\CYRKOPPA': '\u0480',
  '\\cyrchar\\cyrkoppa': '\u0481',
  '\\cyrchar\\cyrthousands': '\u0482',
  '\\cyrchar\\cyrhundredthousands': '\u0488',
  '\\cyrchar\\cyrmillions': '\u0489',
  '\\cyrchar\\CYRSEMISFTSN': '\u048C',
  '\\cyrchar\\cyrsemisftsn': '\u048D',
  '\\cyrchar\\CYRRTICK': '\u048E',
  '\\cyrchar\\cyrrtick': '\u048F',
  '\\cyrchar\\CYRGUP': '\u0490',
  '\\cyrchar\\cyrgup': '\u0491',
  '\\cyrchar\\CYRGHCRS': '\u0492',
  '\\cyrchar\\cyrghcrs': '\u0493',
  '\\cyrchar\\CYRGHK': '\u0494',
  '\\cyrchar\\cyrghk': '\u0495',
  '\\cyrchar\\CYRZHDSC': '\u0496',
  '\\cyrchar\\cyrzhdsc': '\u0497',
  '\\cyrchar\\CYRZDSC': '\u0498',
  '\\cyrchar\\cyrzdsc': '\u0499',
  '\\cyrchar\\CYRKDSC': '\u049A',
  '\\cyrchar\\cyrkdsc': '\u049B',
  '\\cyrchar\\CYRKVCRS': '\u049C',
  '\\cyrchar\\cyrkvcrs': '\u049D',
  '\\cyrchar\\CYRKHCRS': '\u049E',
  '\\cyrchar\\cyrkhcrs': '\u049F',
  '\\cyrchar\\CYRKBEAK': '\u04A0',
  '\\cyrchar\\cyrkbeak': '\u04A1',
  '\\cyrchar\\CYRNDSC': '\u04A2',
  '\\cyrchar\\cyrndsc': '\u04A3',
  '\\cyrchar\\CYRNG': '\u04A4',
  '\\cyrchar\\cyrng': '\u04A5',
  '\\cyrchar\\CYRPHK': '\u04A6',
  '\\cyrchar\\cyrphk': '\u04A7',
  '\\cyrchar\\CYRABHHA': '\u04A8',
  '\\cyrchar\\cyrabhha': '\u04A9',
  '\\cyrchar\\CYRSDSC': '\u04AA',
  '\\cyrchar\\cyrsdsc': '\u04AB',
  '\\cyrchar\\CYRTDSC': '\u04AC',
  '\\cyrchar\\cyrtdsc': '\u04AD',
  '\\cyrchar\\CYRY': '\u04AE',
  '\\cyrchar\\cyry': '\u04AF',
  '\\cyrchar\\CYRYHCRS': '\u04B0',
  '\\cyrchar\\cyryhcrs': '\u04B1',
  '\\cyrchar\\CYRHDSC': '\u04B2',
  '\\cyrchar\\cyrhdsc': '\u04B3',
  '\\cyrchar\\CYRTETSE': '\u04B4',
  '\\cyrchar\\cyrtetse': '\u04B5',
  '\\cyrchar\\CYRCHRDSC': '\u04B6',
  '\\cyrchar\\cyrchrdsc': '\u04B7',
  '\\cyrchar\\CYRCHVCRS': '\u04B8',
  '\\cyrchar\\cyrchvcrs': '\u04B9',
  '\\cyrchar\\CYRSHHA': '\u04BA',
  '\\cyrchar\\cyrshha': '\u04BB',
  '\\cyrchar\\CYRABHCH': '\u04BC',
  '\\cyrchar\\cyrabhch': '\u04BD',
  '\\cyrchar\\CYRABHCHDSC': '\u04BE',
  '\\cyrchar\\cyrabhchdsc': '\u04BF',
  '\\cyrchar\\CYRpalochka': '\u04C0',
  '\\cyrchar\\CYRKHK': '\u04C3',
  '\\cyrchar\\cyrkhk': '\u04C4',
  '\\cyrchar\\CYRNHK': '\u04C7',
  '\\cyrchar\\cyrnhk': '\u04C8',
  '\\cyrchar\\CYRCHLDSC': '\u04CB',
  '\\cyrchar\\cyrchldsc': '\u04CC',
  '\\cyrchar\\CYRAE': '\u04D4',
  '\\cyrchar\\cyrae': '\u04D5',
  '\\cyrchar\\CYRSCHWA': '\u04D8',
  '\\cyrchar\\cyrschwa': '\u04D9',
  '\\cyrchar\\CYRABHDZE': '\u04E0',
  '\\cyrchar\\cyrabhdze': '\u04E1',
  '\\cyrchar\\CYROTLD': '\u04E8',
  '\\cyrchar\\cyrotld': '\u04E9',
  '\\\\backslash': '\u0871',
  '\\.B': '\u1E02',
  '\\.b': '\u1E03',
  '{\\d B}': '\u1E04',
  '{\\d b}': '\u1E05',
  '{\\b B}': '\u1E06',
  '{\\b b}': '\u1E07',
  '\\.D': '\u1E0A',
  '\\.d': '\u1E0B',
  '{\\d D}': '\u1E0C',
  '{\\d d}': '\u1E0D',
  '{\\b D}': '\u1E0E',
  '{\\b d}': '\u1E0F',
  '{\\c D}': '\u1E10',
  '{\\c d}': '\u1E11',
  '\\.F': '\u1E1E',
  '\\.f': '\u1E1F',
  '\\=G': '\u1E20',
  '\\=g': '\u1E21',
  '\\.H': '\u1E22',
  '\\.h': '\u1E23',
  '{\\d H}': '\u1E24',
  '{\\d h}': '\u1E25',
  '\\"H': '\u1E26',
  '\\"h': '\u1E27',
  '{\\c H}': '\u1E28',
  '{\\c h}': '\u1E29',
  '\\\'K': '\u1E30',
  '\\\'k': '\u1E31',
  '{\\d K}': '\u1E32',
  '{\\d k}': '\u1E33',
  '{\\b K}': '\u1E34',
  '{\\b k}': '\u1E35',
  '{\\d L}': '\u1E36',
  '{\\d l}': '\u1E37',
  '{\\b L}': '\u1E3A',
  '{\\b l}': '\u1E3B',
  '\\\'M': '\u1E3E',
  '\\\'m': '\u1E3F',
  '\\.M': '\u1E40',
  '\\.m': '\u1E41',
  '{\\d M}': '\u1E42',
  '{\\d m}': '\u1E43',
  '\\.N': '\u1E44',
  '\\.n': '\u1E45',
  '{\\d N}': '\u1E46',
  '{\\d n}': '\u1E47',
  '{\\b N}': '\u1E48',
  '{\\b n}': '\u1E49',
  '\\\'P': '\u1E54',
  '\\\'p': '\u1E55',
  '\\.P': '\u1E56',
  '\\.p': '\u1E57',
  '\\.R': '\u1E58',
  '\\.r': '\u1E59',
  '{\\d R}': '\u1E5A',
  '{\\d r}': '\u1E5B',
  '{\\b R}': '\u1E5E',
  '{\\b r}': '\u1E5F',
  '\\.S': '\u1E60',
  '\\.s': '\u1E61',
  '{\\d S}': '\u1E62',
  '{\\d s}': '\u1E63',
  '\\.T': '\u1E6A',
  '\\.t': '\u1E6B',
  '{\\d T}': '\u1E6C',
  '{\\d t}': '\u1E6D',
  '{\\b T}': '\u1E6E',
  '{\\b t}': '\u1E6F',
  '\\~V': '\u1E7C',
  '\\~v': '\u1E7D',
  '{\\d V}': '\u1E7E',
  '{\\d v}': '\u1E7F',
  '\\`W': '\u1E80',
  '\\`w': '\u1E81',
  '\\\'W': '\u1E82',
  '\\\'w': '\u1E83',
  '\\"W': '\u1E84',
  '\\"w': '\u1E85',
  '\\.W': '\u1E86',
  '\\.w': '\u1E87',
  '{\\d W}': '\u1E88',
  '{\\d w}': '\u1E89',
  '\\.X': '\u1E8A',
  '\\.x': '\u1E8B',
  '\\"X': '\u1E8C',
  '\\"x': '\u1E8D',
  '\\.Y': '\u1E8E',
  '\\.y': '\u1E8F',
  '\\^Z': '\u1E90',
  '\\^z': '\u1E91',
  '{\\d Z}': '\u1E92',
  '{\\d z}': '\u1E93',
  '{\\b Z}': '\u1E94',
  '{\\b z}': '\u1E95',
  '{\\b h}': '\u1E96',
  '\\"t': '\u1E97',
  '{\\r w}': '\u1E98',
  '{\\r y}': '\u1E99',
  '{\\d A}': '\u1EA0',
  '{\\d a}': '\u1EA1',
  '{\\d E}': '\u1EB8',
  '{\\d e}': '\u1EB9',
  '\\~E': '\u1EBC',
  '\\~e': '\u1EBD',
  '{\\d I}': '\u1ECA',
  '{\\d i}': '\u1ECB',
  '{\\d O}': '\u1ECC',
  '{\\d o}': '\u1ECD',
  '{\\d U}': '\u1EE4',
  '{\\d u}': '\u1EE5',
  '\\`Y': '\u1EF2',
  '\\`y': '\u1EF3',
  '{\\d Y}': '\u1EF4',
  '{\\d y}': '\u1EF5',
  '\\~Y': '\u1EF8',
  '\\~y': '\u1EF9',
  '\\quad': '\u2003',
  '\\hspace{0.6em}': '\u2002',
  '\\hspace{1em}': '\u2003',
  '\\;': '\u2004',
  '\\hspace{0.25em}': '\u2005',
  '\\hspace{0.166em}': '\u2006',
  '\\hphantom{0}': '\u2007',
  '\\hphantom{,}': '\u2008',
  '\\,': '\u2009',
  '\\mkern1mu': '\u200A',
  '\\mbox': '\u200B',
  '{\\aftergroup\\ignorespaces}': '\u200C',
  '\\textendash': '\u2013',
  '\\textemdash': '\u2014',
  '\\horizbar': '\u2015',
  '\\rule{1em}{1pt}': '\u2015',
  '\\Vert': '\u2016',
  '\\twolowline': '\u2017',
  '\\Elzreapos': '\u201B',
  '\\quotedblbase': '\u201F',
  '\\dagger': '\u2020',
  '\\textdagger': '\u2020',
  '\\ddagger': '\u2021',
  '\\textdaggerdbl': '\u2021',
  '\\bullet': '\u2219',
  '\\textbullet': '\u2022',
  '\\enleadertwodots': '\u2025',
  '\\ldots': '\u2026',
  '\\textperthousand': '\u2030',
  '\\textpertenthousand': '\u2031',
  '{\'}': '\u2032',
  '{\'\'}': '\u2033',
  '{\'\'\'}': '\u2034',
  '\\backprime': '\u2035',
  '\\backdprime': '\u2036',
  '\\backtrprime': '\u2037',
  '\\caretinsert': '\u2038',
  '\\guilsinglleft': '\u2039',
  '\\guilsinglright': '\u203A',
  '\\Exclam': '\u203C',
  '\\hyphenbullet': '\u2043',
  '\\fracslash': '\u2044',
  '\\Question': '\u2047',
  '\\closure': '\u2050',
  '\\:': '\u205F',
  '\\nolinebreak': '\u2060',
  '^{0}': '\u2070',
  '^{4}': '\u2074',
  '^{5}': '\u2075',
  '^{6}': '\u2076',
  '^{7}': '\u2077',
  '^{8}': '\u2078',
  '^{9}': '\u2079',
  '^{+}': '\u207A',
  '^{-}': '\u207B',
  '^{=}': '\u207C',
  '^{(}': '\u207D',
  '^{)}': '\u207E',
  '^{n}': '\u207F',
  '\\textsuperscript{n}': '\u207F',
  '^{i}': '\u2071',
  '\\textsuperscript{i}': '\u2071',
  '^{a}': '\u1D43',
  '\\textsuperscript{a}': '\u1D43',
  '^{b}': '\u1D47',
  '\\textsuperscript{b}': '\u1D47',
  '^{c}': '\u1D9C',
  '\\textsuperscript{c}': '\u1D9C',
  '^{d}': '\u1D48',
  '\\textsuperscript{d}': '\u1D48',
  '^{e}': '\u1D49',
  '\\textsuperscript{e}': '\u1D49',
  '^{f}': '\u1DA0',
  '\\textsuperscript{f}': '\u1DA0',
  '^{g}': '\u1D4D',
  '\\textsuperscript{g}': '\u1D4D',
  '^{h}': '\u02B0',
  '\\textsuperscript{h}': '\u02B0',
  '^{j}': '\u02B2',
  '\\textsuperscript{j}': '\u02B2',
  '^{k}': '\u1D4F',
  '\\textsuperscript{k}': '\u1D4F',
  '^{l}': '\u02E1',
  '\\textsuperscript{l}': '\u02E1',
  '^{m}': '\u1D50',
  '\\textsuperscript{m}': '\u1D50',
  '^{o}': '\u1D52',
  '\\textsuperscript{o}': '\u1D52',
  '^{p}': '\u1D56',
  '\\textsuperscript{p}': '\u1D56',
  '^{r}': '\u02B3',
  '\\textsuperscript{r}': '\u02B3',
  '^{s}': '\u02E2',
  '\\textsuperscript{s}': '\u02E2',
  '^{t}': '\u1D57',
  '\\textsuperscript{t}': '\u1D57',
  '^{u}': '\u1D58',
  '\\textsuperscript{u}': '\u1D58',
  '^{v}': '\u1D5B',
  '\\textsuperscript{v}': '\u1D5B',
  '^{w}': '\u02B7',
  '\\textsuperscript{w}': '\u02B7',
  '^{x}': '\u02E3',
  '\\textsuperscript{x}': '\u02E3',
  '^{y}': '\u02B8',
  '\\textsuperscript{y}': '\u02B8',
  '^{z}': '\u1DBB',
  '\\textsuperscript{z}': '\u1DBB',
  '_{0}': '\u2080',
  '_{1}': '\u2081',
  '_{2}': '\u2082',
  '_{3}': '\u2083',
  '_{4}': '\u2084',
  '_{5}': '\u2085',
  '_{6}': '\u2086',
  '_{7}': '\u2087',
  '_{8}': '\u2088',
  '_{9}': '\u2089',
  '_{+}': '\u208A',
  '_{-}': '\u208B',
  '_{=}': '\u208C',
  '_{(}': '\u208D',
  '_{)}': '\u208E',
  '_{a}': '\u2090',
  '\\textsubscript{a}': '\u2090',
  '_{e}': '\u2091',
  '\\textsubscript{e}': '\u2091',
  '_{o}': '\u2092',
  '\\textsubscript{o}': '\u2092',
  '_{x}': '\u2093',
  '\\textsubscript{x}': '\u2093',
  '\\textsubscript{\\textschwa}': '\u2094',
  '_{h}': '\u2095',
  '\\textsubscript{h}': '\u2095',
  '_{k}': '\u2096',
  '\\textsubscript{k}': '\u2096',
  '_{l}': '\u2097',
  '\\textsubscript{l}': '\u2097',
  '_{m}': '\u2098',
  '\\textsubscript{m}': '\u2098',
  '_{n}': '\u2099',
  '\\textsubscript{n}': '\u2099',
  '_{p}': '\u209A',
  '\\textsubscript{p}': '\u209A',
  '_{s}': '\u209B',
  '\\textsubscript{s}': '\u209B',
  '_{t}': '\u209C',
  '\\textsubscript{t}': '\u209C',
  '\\ensuremath{\\Elzpes}': '\u20A7',
  '\\euro': '\u20AC',
  '\\texteuro': '\u20AC',
  '\\lvec': '\u20D0',
  '\\vec': '\u20D7',
  '\\vertoverlay': '\u20D2',
  '\\LVec': '\u20D6',
  '\\dddot': '\u20DB',
  '\\ddddot': '\u20DC',
  '\\enclosecircle': '\u20DD',
  '\\enclosesquare': '\u20DE',
  '\\enclosediamond': '\u20DF',
  '\\overleftrightarrow': '\u20E1',
  '\\enclosetriangle': '\u20E4',
  '\\annuity': '\u20E7',
  '\\threeunderdot': '\u20E8',
  '\\widebridgeabove': '\u20E9',
  '\\underrightharpoondown': '\u20EC',
  '\\underleftharpoondown': '\u20ED',
  '\\underleftarrow': '\u20EE',
  '\\underrightarrow': '\u20EF',
  '\\asteraccent': '\u20F0',
  '\\mathbb{C}': '\u2102',
  '\\textcelsius': '\u2103',
  '\\Euler': '\u2107',
  '\\mathscr{g}': '\u210A',
  '\\mathscr{H}': '\u210B',
  '\\mathfrak{H}': '\u210C',
  '\\mathbb{H}': '\u210D',
  '\\Planckconst': '\u210E',
  '\\hslash': '\u210F',
  '\\mathscr{I}': '\u2110',
  '\\mathfrak{I}': '\u2111',
  '\\mathscr{L}': '\u2112',
  '\\mathscr{l}': '\uD835\uDCC1',
  '\\mathbb{N}': '\u2115',
  '\\cyrchar\\textnumero': '\u2116',
  '\\textcircledP': '\u2117',
  '\\wp': '\u2118',
  '\\mathbb{P}': '\u2119',
  '\\mathbb{Q}': '\u211A',
  '\\mathscr{R}': '\u211B',
  '\\mathfrak{R}': '\u211C',
  '\\mathbb{R}': '\u211D',
  '\\Elzxrat': '\u211E',
  '\\textservicemark': '\u2120',
  '\\texttrademark': '\u2122',
  '\\mathbb{Z}': '\u2124',
  '\\mho': '\u2127',
  '\\mathfrak{Z}': '\u2128',
  '\\ElsevierGlyph{2129}': '\u2129',
  '\\Angstroem': '\u212B',
  '\\mathscr{B}': '\u212C',
  '\\mathfrak{C}': '\u212D',
  '\\textestimated': '\u212E',
  '\\mathscr{e}': '\u212F',
  '\\mathscr{E}': '\u2130',
  '\\mathscr{F}': '\u2131',
  '\\Finv': '\u2132',
  '\\mathscr{M}': '\u2133',
  '\\mathscr{o}': '\u2134',
  '\\aleph': '\u2135',
  '\\beth': '\u2136',
  '\\gimel': '\u2137',
  '\\daleth': '\u2138',
  '\\mathbb{\\pi}': '\u213C',
  '\\mathbb{\\gamma}': '\u213D',
  '\\mathbb{\\Gamma}': '\u213E',
  '\\mathbb{\\Pi}': '\u213F',
  '\\mathbb{\\Sigma}': '\u2140',
  '\\Game': '\u2141',
  '\\sansLturned': '\u2142',
  '\\sansLmirrored': '\u2143',
  '\\Yup': '\u2144',
  '\\CapitalDifferentialD': '\u2145',
  '\\DifferentialD': '\u2146',
  '\\ExponetialE': '\u2147',
  '\\ComplexI': '\u2148',
  '\\ComplexJ': '\u2149',
  '\\PropertyLine': '\u214A',
  '\\invamp': '\u214B',
  '\\textfrac{1}{3}': '\u2153',
  '\\textfrac{2}{3}': '\u2154',
  '\\textfrac{1}{5}': '\u2155',
  '\\textfrac{2}{5}': '\u2156',
  '\\textfrac{3}{5}': '\u2157',
  '\\textfrac{4}{5}': '\u2158',
  '\\textfrac{1}{6}': '\u2159',
  '\\textfrac{5}{6}': '\u215A',
  '\\textfrac{1}{8}': '\u215B',
  '\\textfrac{3}{8}': '\u215C',
  '\\textfrac{5}{8}': '\u215D',
  '\\textfrac{7}{8}': '\u215E',
  '\\leftarrow': '\u2190',
  '\\uparrow': '\u2191',
  '\\rightarrow': '\u2192',
  '\\textrightarrow': '\u2192',
  '\\downarrow': '\u2193',
  '\\leftrightarrow': '\u2194',
  '\\updownarrow': '\u2195',
  '\\nwarrow': '\u2196',
  '\\nearrow': '\u2197',
  '\\searrow': '\u2198',
  '\\swarrow': '\u2199',
  '\\nleftarrow': '\u219A',
  '\\nrightarrow': '\u219B',
  '\\arrowwaveleft': '\u219C',
  '\\arrowwaveright': '\u219D',
  '\\twoheadleftarrow': '\u219E',
  '\\twoheaduparrow': '\u219F',
  '\\twoheadrightarrow': '\u21A0',
  '\\twoheaddownarrow': '\u21A1',
  '\\leftarrowtail': '\u21A2',
  '\\rightarrowtail': '\u21A3',
  '\\mapsfrom': '\u21A4',
  '\\MapsUp': '\u21A5',
  '\\mapsto': '\u21A6',
  '\\MapsDown': '\u21A7',
  '\\updownarrowbar': '\u21A8',
  '\\hookleftarrow': '\u21A9',
  '\\hookrightarrow': '\u21AA',
  '\\looparrowleft': '\u21AB',
  '\\looparrowright': '\u21AC',
  '\\leftrightsquigarrow': '\u21AD',
  '\\nleftrightarrow': '\u21AE',
  '\\lightning': '\u21AF',
  '\\Lsh': '\u21B0',
  '\\Rsh': '\u21B1',
  '\\dlsh': '\u21B2',
  '\\ElsevierGlyph{21B3}': '\u21B3',
  '\\linefeed': '\u21B4',
  '\\carriagereturn': '\u21B5',
  '\\curvearrowleft': '\u21B6',
  '\\curvearrowright': '\u21B7',
  '\\barovernorthwestarrow': '\u21B8',
  '\\barleftarrowrightarrowba': '\u21B9',
  '\\circlearrowleft': '\u21BA',
  '\\circlearrowright': '\u21BB',
  '\\leftharpoonup': '\u21BC',
  '\\leftharpoondown': '\u21BD',
  '\\upharpoonright': '\u21BE',
  '\\upharpoonleft': '\u21BF',
  '\\rightharpoonup': '\u21C0',
  '\\rightharpoondown': '\u21C1',
  '\\downharpoonright': '\u21C2',
  '\\downharpoonleft': '\u21C3',
  '\\rightleftarrows': '\u21C4',
  '\\dblarrowupdown': '\u21C5',
  '\\leftrightarrows': '\u21C6',
  '\\leftleftarrows': '\u21C7',
  '\\upuparrows': '\u21C8',
  '\\rightrightarrows': '\u21C9',
  '\\downdownarrows': '\u21CA',
  '\\leftrightharpoons': '\u21CB',
  '\\rightleftharpoons': '\u21CC',
  '\\nLeftarrow': '\u21CD',
  '\\nLeftrightarrow': '\u21CE',
  '\\nRightarrow': '\u21CF',
  '\\Leftarrow': '\u21D0',
  '\\Uparrow': '\u21D1',
  '\\Rightarrow': '\u21D2',
  '\\Downarrow': '\u21D3',
  '\\Leftrightarrow': '\u21D4',
  '\\Updownarrow': '\u21D5',
  '\\Nwarrow': '\u21D6',
  '\\Nearrow': '\u21D7',
  '\\Searrow': '\u21D8',
  '\\Swarrow': '\u21D9',
  '\\Lleftarrow': '\u21DA',
  '\\Rrightarrow': '\u21DB',
  '\\leftsquigarrow': '\u21DC',
  '\\rightsquigarrow': '\u21DD',
  '\\nHuparrow': '\u21DE',
  '\\nHdownarrow': '\u21DF',
  '\\dashleftarrow': '\u21E0',
  '\\updasharrow': '\u21E1',
  '\\dashrightarrow': '\u21E2',
  '\\downdasharrow': '\u21E3',
  '\\LeftArrowBar': '\u21E4',
  '\\RightArrowBar': '\u21E5',
  '\\leftwhitearrow': '\u21E6',
  '\\upwhitearrow': '\u21E7',
  '\\rightwhitearrow': '\u21E8',
  '\\downwhitearrow': '\u21E9',
  '\\whitearrowupfrombar': '\u21EA',
  '\\circleonrightarrow': '\u21F4',
  '\\DownArrowUpArrow': '\u21F5',
  '\\rightthreearrows': '\u21F6',
  '\\nvleftarrow': '\u21F7',
  '\\pfun': '\u21F8',
  '\\nvleftrightarrow': '\u21F9',
  '\\nVleftarrow': '\u21FA',
  '\\ffun': '\u21FB',
  '\\nVleftrightarrow': '\u21FC',
  '\\leftarrowtriangle': '\u21FD',
  '\\rightarrowtriangle': '\u21FE',
  '\\leftrightarrowtriangle': '\u21FF',
  '\\forall': '\u2200',
  '\\complement': '\u2201',
  '\\partial': '\uD835\uDFC3',
  '\\exists': '\u2203',
  '\\nexists': '\u2204',
  '\\varnothing': '\u2205',
  '\\increment': '\u2206',
  '\\nabla': '\u2207',
  '\\in': '\uD835\uDFC4',
  '\\not\\in': '\u2209',
  '\\smallin': '\u220A',
  '\\ni': '\u220B',
  '\\not\\ni': '\u220C',
  '\\smallni': '\u220D',
  '\\QED': '\u220E',
  '\\prod': '\u220F',
  '\\coprod': '\u2210',
  '\\sum': '\u2211',
  '\\mp': '\u2213',
  '\\dotplus': '\u2214',
  '\\slash': '\u2215',
  '\\setminus': '\u29F5',
  '{_\\ast}': '\u2217',
  '\\circ': '\u2218',
  '\\surd': '\u221A',
  '\\sqrt[3]': '\u221B',
  '\\sqrt[4]': '\u221C',
  '\\propto': '\u221D',
  '\\infty': '\u221E',
  '\\rightangle': '\u221F',
  '\\angle': '\u2220',
  '\\measuredangle': '\u2221',
  '\\sphericalangle': '\u2222',
  '\\mid': '\u2223',
  '\\nmid': '\u2224',
  '\\parallel': '\u2225',
  '\\nparallel': '\u2226',
  '\\wedge': '\u2227',
  '\\vee': '\u2228',
  '\\cap': '\u2229',
  '\\cup': '\u222A',
  '\\int': '\u222B',
  '{\\int\\!\\int}': '\u222C',
  '{\\int\\!\\int\\!\\int}': '\u222D',
  '\\oint': '\u222E',
  '\\surfintegral': '\u222F',
  '\\volintegral': '\u2230',
  '\\clwintegral': '\u2231',
  '\\ElsevierGlyph{2232}': '\u2232',
  '\\ElsevierGlyph{2233}': '\u2233',
  '\\therefore': '\u2234',
  '\\because': '\u2235',
  '\\Colon': '\u2237',
  '\\ElsevierGlyph{2238}': '\u2238',
  '\\eqcolon': '\u2239',
  '\\mathbin{{:}\\!\\!{-}\\!\\!{:}}': '\u223A',
  '\\homothetic': '\u223B',
  '\\sim': '\u223C',
  '\\backsim': '\u223D',
  '\\lazysinv': '\u223E',
  '\\AC': '\u223F',
  '\\wr': '\u2240',
  '\\not\\sim': '\u2241',
  '\\ElsevierGlyph{2242}': '\u2242',
  '\\simeq': '\u2243',
  '\\not\\simeq': '\u2244',
  '\\cong': '\u2245',
  '\\approxnotequal': '\u2246',
  '\\not\\cong': '\u2247',
  '\\approx': '\u2248',
  '\\not\\approx': '\u2249',
  '\\approxeq': '\u224A',
  '\\tildetrpl': '\u224B',
  '\\allequal': '\u224C',
  '\\asymp': '\u224D',
  '\\Bumpeq': '\u224E',
  '\\bumpeq': '\u224F',
  '\\doteq': '\u2250',
  '\\doteqdot': '\u2251',
  '\\fallingdotseq': '\u2252',
  '\\risingdotseq': '\u2253',
  '\\coloneq': '\u2254',
  '\\eqcirc': '\u2256',
  '\\circeq': '\u2257',
  '\\arceq': '\u2258',
  '\\estimates': '\u2259',
  '\\ElsevierGlyph{225A}': '\u2A63',
  '\\starequal': '\u225B',
  '\\triangleq': '\u225C',
  '\\eqdef': '\u225D',
  '\\measeq': '\u225E',
  '\\ElsevierGlyph{225F}': '\u225F',
  '\\not =': '\u2260',
  '\\equiv': '\u2261',
  '\\not\\equiv': '\u2262',
  '\\Equiv': '\u2263',
  '\\leq': '\u2264',
  '\\geq': '\u2265',
  '\\leqq': '\u2266',
  '\\geqq': '\u2267',
  '\\lneqq': '\u2268',
  '\\gneqq': '\u2269',
  '\\ll': '\u226A',
  '\\gg': '\u226B',
  '\\between': '\u226C',
  '{\\not\\kern-0.3em\\times}': '\u226D',
  '\\not<': '\u226E',
  '\\not>': '\u226F',
  '\\not\\leq': '\u2270',
  '\\not\\geq': '\u2271',
  '\\lessequivlnt': '\u2272',
  '\\greaterequivlnt': '\u2273',
  '\\ElsevierGlyph{2274}': '\u2274',
  '\\ElsevierGlyph{2275}': '\u2275',
  '\\lessgtr': '\u2276',
  '\\gtrless': '\u2277',
  '\\notlessgreater': '\u2278',
  '\\notgreaterless': '\u2279',
  '\\prec': '\u227A',
  '\\succ': '\u227B',
  '\\preccurlyeq': '\u227C',
  '\\succcurlyeq': '\u227D',
  '\\precapprox': '\u2AB7',
  '\\succapprox': '\u2AB8',
  '\\not\\prec': '\u2280',
  '\\not\\succ': '\u2281',
  '\\subset': '\u2282',
  '\\supset': '\u2283',
  '\\not\\subset': '\u2284',
  '\\not\\supset': '\u2285',
  '\\subseteq': '\u2286',
  '\\supseteq': '\u2287',
  '\\not\\subseteq': '\u2288',
  '\\not\\supseteq': '\u2289',
  '\\subsetneq': '\u228A',
  '\\supsetneq': '\u228B',
  '\\cupleftarrow': '\u228C',
  '\\cupdot': '\u228D',
  '\\uplus': '\u228E',
  '\\sqsubset': '\u228F',
  '\\sqsupset': '\u2290',
  '\\sqsubseteq': '\u2291',
  '\\sqsupseteq': '\u2292',
  '\\sqcap': '\u2293',
  '\\sqcup': '\u2294',
  '\\oplus': '\u2295',
  '\\ominus': '\u2296',
  '\\otimes': '\u2297',
  '\\oslash': '\u2298',
  '\\odot': '\u2299',
  '\\circledcirc': '\u229A',
  '\\circledast': '\u229B',
  '\\circledequal': '\u229C',
  '\\circleddash': '\u229D',
  '\\boxplus': '\u229E',
  '\\boxminus': '\u229F',
  '\\boxtimes': '\u22A0',
  '\\boxdot': '\u22A1',
  '\\vdash': '\u22A2',
  '\\dashv': '\u22A3',
  '\\top': '\u22A4',
  '\\perp': '\u27C2',
  '\\assert': '\u22A6',
  '\\truestate': '\u22A7',
  '\\forcesextra': '\u22A8',
  '\\Vdash': '\u22A9',
  '\\Vvdash': '\u22AA',
  '\\VDash': '\u22AB',
  '\\nvdash': '\u22AC',
  '\\nvDash': '\u22AD',
  '\\nVdash': '\u22AE',
  '\\nVDash': '\u22AF',
  '\\prurel': '\u22B0',
  '\\scurel': '\u22B1',
  '\\vartriangleleft': '\u22B2',
  '\\vartriangleright': '\u22B3',
  '\\trianglelefteq': '\u22B4',
  '\\trianglerighteq': '\u22B5',
  '\\original': '\u22B6',
  '\\image': '\u22B7',
  '\\multimap': '\u22B8',
  '\\hermitconjmatrix': '\u22B9',
  '\\intercal': '\u22BA',
  '\\veebar': '\u22BB',
  '\\barwedge': '\u2305',
  '\\barvee': '\u22BD',
  '\\rightanglearc': '\u22BE',
  '\\varlrtriangle': '\u22BF',
  '\\ElsevierGlyph{22C0}': '\u22C0',
  '\\ElsevierGlyph{22C1}': '\u22C1',
  '\\bigcap': '\u22C2',
  '\\bigcup': '\u22C3',
  '\\diamond': '\u2662',
  '\\star': '\u22C6',
  '\\divideontimes': '\u22C7',
  '\\bowtie': '\u22C8',
  '\\ltimes': '\u22C9',
  '\\rtimes': '\u22CA',
  '\\leftthreetimes': '\u22CB',
  '\\rightthreetimes': '\u22CC',
  '\\backsimeq': '\u22CD',
  '\\curlyvee': '\u22CE',
  '\\curlywedge': '\u22CF',
  '\\Subset': '\u22D0',
  '\\Supset': '\u22D1',
  '\\Cap': '\u22D2',
  '\\Cup': '\u22D3',
  '\\pitchfork': '\u22D4',
  '\\hash': '\u22D5',
  '\\lessdot': '\u22D6',
  '\\gtrdot': '\u22D7',
  '\\verymuchless': '\u22D8',
  '\\verymuchgreater': '\u22D9',
  '\\lesseqgtr': '\u22DA',
  '\\gtreqless': '\u22DB',
  '\\eqless': '\u22DC',
  '\\eqgtr': '\u22DD',
  '\\curlyeqprec': '\u22DE',
  '\\curlyeqsucc': '\u22DF',
  '\\npreceq': '\u22E0',
  '\\nsucceq': '\u22E1',
  '\\not\\sqsubseteq': '\u22E2',
  '\\not\\sqsupseteq': '\u22E3',
  '\\sqsubsetneq': '\u22E4',
  '\\Elzsqspne': '\u22E5',
  '\\lnsim': '\u22E6',
  '\\gnsim': '\u22E7',
  '\\precedesnotsimilar': '\u22E8',
  '\\succnsim': '\u22E9',
  '\\ntriangleleft': '\u22EA',
  '\\ntriangleright': '\u22EB',
  '\\ntrianglelefteq': '\u22EC',
  '\\ntrianglerighteq': '\u22ED',
  '\\vdots': '\u22EE',
  '\\cdots': '\u22EF',
  '\\upslopeellipsis': '\u22F0',
  '\\downslopeellipsis': '\u22F1',
  '\\disin': '\u22F2',
  '\\varisins': '\u22F3',
  '\\isins': '\u22F4',
  '\\isindot': '\u22F5',
  '\\barin': '\u22F6',
  '\\isinobar': '\u22F7',
  '\\isinvb': '\u22F8',
  '\\isinE': '\u22F9',
  '\\nisd': '\u22FA',
  '\\varnis': '\u22FB',
  '\\nis': '\u22FC',
  '\\varniobar': '\u22FD',
  '\\niobar': '\u22FE',
  '\\bagmember': '\u22FF',
  '\\diameter': '\u2300',
  '\\house': '\u2302',
  '\\varbarwedge': '\u2305',
  '\\perspcorrespond': '\u2A5E',
  '\\lceil': '\u2308',
  '\\rceil': '\u2309',
  '\\lfloor': '\u230A',
  '\\rfloor': '\u230B',
  '\\invneg': '\u2310',
  '\\wasylozenge': '\u2311',
  '\\profline': '\u2312',
  '\\profsurf': '\u2313',
  '\\recorder': '\u2315',
  '{\\mathchar"2208}': '\u2316',
  '\\viewdata': '\u2317',
  '\\turnednot': '\u2319',
  '\\ulcorner': '\u231C',
  '\\urcorner': '\u231D',
  '\\llcorner': '\u231E',
  '\\lrcorner': '\u231F',
  '\\inttop': '\u2320',
  '\\intbottom': '\u2321',
  '\\frown': '\u2322',
  '\\smile': '\u2323',
  '\\langle': '\u3008',
  '\\rangle': '\u3009',
  '\\varhexagonlrbonds': '\u232C',
  '\\conictaper': '\u2332',
  '\\topbot': '\u2336',
  '\\APLinv': '\u2339',
  '\\ElsevierGlyph{E838}': '\u233D',
  '\\notslash': '\u233F',
  '\\notbackslash': '\u2340',
  '\\APLleftarrowbox': '\u2347',
  '\\APLrightarrowbox': '\u2348',
  '\\invdiameter': '\u2349',
  '\\APLuparrowbox': '\u2350',
  '\\APLboxupcaret': '\u2353',
  '\\APLdownarrowbox': '\u2357',
  '\\APLcomment': '\u235D',
  '\\APLinput': '\u235E',
  '\\APLlog': '\u235F',
  '\\APLboxquestion': '\u2370',
  '\\rangledownzigzagarrow': '\u237C',
  '\\hexagon': '\u2394',
  '\\lparenuend': '\u239B',
  '\\lparenextender': '\u239C',
  '\\lparenlend': '\u239D',
  '\\rparenuend': '\u239E',
  '\\rparenextender': '\u239F',
  '\\rparenlend': '\u23A0',
  '\\lbrackuend': '\u23A1',
  '\\lbrackextender': '\u23A2',
  '\\Elzdlcorn': '\u23A3',
  '\\rbrackuend': '\u23A4',
  '\\rbrackextender': '\u23A5',
  '\\rbracklend': '\u23A6',
  '\\lbraceuend': '\u23A7',
  '\\lbracemid': '\u23A8',
  '\\lbracelend': '\u23A9',
  '\\vbraceextender': '\u23AA',
  '\\rbraceuend': '\u23AB',
  '\\rbracemid': '\u23AC',
  '\\rbracelend': '\u23AD',
  '\\intextender': '\u23AE',
  '\\harrowextender': '\u23AF',
  '\\lmoustache': '\u23B0',
  '\\rmoustache': '\u23B1',
  '\\sumtop': '\u23B2',
  '\\sumbottom': '\u23B3',
  '\\overbracket': '\u23B4',
  '\\underbracket': '\u23B5',
  '\\bbrktbrk': '\u23B6',
  '\\sqrtbottom': '\u23B7',
  '\\lvboxline': '\u23B8',
  '\\rvboxline': '\u23B9',
  '\\varcarriagereturn': '\u23CE',
  '\\overparen': '\u23DC',
  '\\underparen': '\u23DD',
  '\\overbrace': '\u23DE',
  '\\underbrace': '\u23DF',
  '\\obrbrak': '\u23E0',
  '\\ubrbrak': '\u23E1',
  '\\trapezium': '\u23E2',
  '\\benzenr': '\u23E3',
  '\\strns': '\u23E4',
  '\\fltns': '\u23E5',
  '\\accurrent': '\u23E6',
  '\\elinters': '\u23E7',
  '\\textvisiblespace': '\u2423',
  '\\ding{172}': '\u2460',
  '\\ding{173}': '\u2461',
  '\\ding{174}': '\u2462',
  '\\ding{175}': '\u2463',
  '\\ding{176}': '\u2464',
  '\\ding{177}': '\u2465',
  '\\ding{178}': '\u2466',
  '\\ding{179}': '\u2467',
  '\\ding{180}': '\u2468',
  '\\ding{181}': '\u2469',
  '\\circledS': '\u24C8',
  '\\Elzdshfnc': '\u2506',
  '\\Elzsqfnw': '\u2519',
  '\\diagup': '\u2571',
  '\\': '\\',
  '\\blockuphalf': '\u2580',
  '\\blocklowhalf': '\u2584',
  '\\blockfull': '\u2588',
  '\\blocklefthalf': '\u258C',
  '\\blockrighthalf': '\u2590',
  '\\blockqtrshaded': '\u2591',
  '\\blockhalfshaded': '\u2592',
  '\\blockthreeqtrshaded': '\u2593',
  '\\mdlgblksquare': '\u25A0',
  '\\ding{110}': '\u25A0',
  '\\square': '\u2B1C',
  '\\squoval': '\u25A2',
  '\\blackinwhitesquare': '\u25A3',
  '\\squarehfill': '\u25A4',
  '\\squarevfill': '\u25A5',
  '\\squarehvfill': '\u25A6',
  '\\squarenwsefill': '\u25A7',
  '\\squareneswfill': '\u25A8',
  '\\squarecrossfill': '\u25A9',
  '\\blacksquare': '\u2B1B',
  '\\smwhtsquare': '\u25AB',
  '\\hrectangleblack': '\u25AC',
  '\\fbox{~~}': '\u25AD',
  '\\vrectangleblack': '\u25AE',
  '\\Elzvrecto': '\u25AF',
  '\\parallelogramblack': '\u25B0',
  '\\ElsevierGlyph{E381}': '\u25B1',
  '\\bigblacktriangleup': '\u25B2',
  '\\ding{115}': '\u25B2',
  '\\bigtriangleup': '\u25B3',
  '\\blacktriangle': '\u25B4',
  '\\vartriangle': '\u25B5',
  '\\RHD': '\u25B6',
  '\\rhd': '\u25B7',
  '\\blacktriangleright': '\u25B8',
  '\\triangleright': '\u25B9',
  '\\blackpointerright': '\u25BA',
  '\\whitepointerright': '\u25BB',
  '\\bigblacktriangledown': '\u25BC',
  '\\ding{116}': '\u25BC',
  '\\bigtriangledown': '\u25BD',
  '\\blacktriangledown': '\u25BE',
  '\\triangledown': '\u25BF',
  '\\LHD': '\u25C0',
  '\\lhd': '\u25C1',
  '\\blacktriangleleft': '\u25C2',
  '\\triangleleft': '\u25C3',
  '\\blackpointerleft': '\u25C4',
  '\\whitepointerleft': '\u25C5',
  '\\Diamondblack': '\u25C6',
  '\\ding{117}': '\u25C6',
  '\\Diamond': '\u25C7',
  '\\blackinwhitediamond': '\u25C8',
  '\\fisheye': '\u25C9',
  '\\lozenge': '\u25CA',
  '\\bigcirc': '\u25EF',
  '\\dottedcircle': '\u25CC',
  '\\circlevertfill': '\u25CD',
  '\\bullseye': '\u25CE',
  '\\CIRCLE': '\u25CF',
  '\\ding{108}': '\u25CF',
  '\\Elzcirfl': '\u25D0',
  '\\Elzcirfr': '\u25D1',
  '\\Elzcirfb': '\u25D2',
  '\\circletophalfblack': '\u25D3',
  '\\circleurquadblack': '\u25D4',
  '\\blackcircleulquadwhite': '\u25D5',
  '\\LEFTCIRCLE': '\u25D6',
  '\\RIGHTCIRCLE': '\u25D7',
  '\\ding{119}': '\u25D7',
  '\\Elzrvbull': '\u25D8',
  '\\inversewhitecircle': '\u25D9',
  '\\invwhiteupperhalfcircle': '\u25DA',
  '\\invwhitelowerhalfcircle': '\u25DB',
  '\\ularc': '\u25DC',
  '\\urarc': '\u25DD',
  '\\lrarc': '\u25DE',
  '\\llarc': '\u25DF',
  '\\topsemicircle': '\u25E0',
  '\\botsemicircle': '\u25E1',
  '\\lrblacktriangle': '\u25E2',
  '\\llblacktriangle': '\u25E3',
  '\\ulblacktriangle': '\u25E4',
  '\\urblacktriangle': '\u25E5',
  '\\smwhtcircle': '\u25E6',
  '\\Elzsqfl': '\u25E7',
  '\\Elzsqfr': '\u25E8',
  '\\squareulblack': '\u25E9',
  '\\Elzsqfse': '\u25EA',
  '\\boxbar': '\u25EB',
  '\\trianglecdot': '\u25EC',
  '\\triangleleftblack': '\u25ED',
  '\\trianglerightblack': '\u25EE',
  '\\squareulquad': '\u25F0',
  '\\squarellquad': '\u25F1',
  '\\squarelrquad': '\u25F2',
  '\\squareurquad': '\u25F3',
  '\\circleulquad': '\u25F4',
  '\\circlellquad': '\u25F5',
  '\\circlelrquad': '\u25F6',
  '\\circleurquad': '\u25F7',
  '\\ultriangle': '\u25F8',
  '\\urtriangle': '\u25F9',
  '\\lltriangle': '\u25FA',
  '\\mdsmwhtsquare': '\u25FD',
  '\\mdsmblksquare': '\u25FE',
  '\\lrtriangle': '\u25FF',
  '\\bigstar': '\u2605',
  '\\ding{72}': '\u2605',
  '\\bigwhitestar': '\u2606',
  '\\ding{73}': '\u2729',
  '\\Sun': '\u2609',
  '\\ding{37}': '\u260E',
  '\\Square': '\u2610',
  '\\CheckedBox': '\u2611',
  '\\XBox': '\u2612',
  '\\steaming': '\u2615',
  '\\ding{42}': '\u261B',
  '\\pointright': '\u261E',
  '\\ding{43}': '\u261E',
  '\\skull': '\u2620',
  '\\danger': '\u2621',
  '\\radiation': '\u2622',
  '\\biohazard': '\u2623',
  '\\yinyang': '\u262F',
  '\\frownie': '\u2639',
  '\\smiley': '\u263A',
  '\\blacksmiley': '\u263B',
  '\\sun': '\u263C',
  '\\rightmoon': '\u263E',
  '\\leftmoon': '\u263E',
  '\\mercury': '\u263F',
  '\\female': '\u2640',
  '\\venus': '\u2640',
  '\\earth': '\u2641',
  '\\male': '\u2642',
  '\\jupiter': '\u2643',
  '\\saturn': '\u2644',
  '\\uranus': '\u2645',
  '\\neptune': '\u2646',
  '\\pluto': '\u2647',
  '\\aries': '\u2648',
  '\\taurus': '\u2649',
  '\\gemini': '\u264A',
  '\\cancer': '\u264B',
  '\\leo': '\u264C',
  '\\virgo': '\u264D',
  '\\libra': '\u264E',
  '\\scorpio': '\u264F',
  '\\sagittarius': '\u2650',
  '\\capricornus': '\u2651',
  '\\aquarius': '\u2652',
  '\\pisces': '\u2653',
  '\\spadesuit': '\u2660',
  '\\ding{171}': '\u2660',
  '\\heartsuit': '\u2661',
  '\\clubsuit': '\u2663',
  '\\ding{168}': '\u2663',
  '\\varspadesuit': '\u2664',
  '\\varheartsuit': '\u2665',
  '\\ding{170}': '\u2665',
  '\\vardiamondsuit': '\u2666',
  '\\ding{169}': '\u2666',
  '\\varclubsuit': '\u2667',
  '\\quarternote': '\u2669',
  '\\eighthnote': '\u266A',
  '\\twonotes': '\u266B',
  '\\sixteenthnote': '\u266C',
  '\\flat': '\u266D',
  '\\natural': '\u266E',
  '\\sharp': '\u266F',
  '\\recycle': '\u267B',
  '\\acidfree': '\u267E',
  '\\dicei': '\u2680',
  '\\diceii': '\u2681',
  '\\diceiii': '\u2682',
  '\\diceiv': '\u2683',
  '\\dicev': '\u2684',
  '\\dicevi': '\u2685',
  '\\circledrightdot': '\u2686',
  '\\circledtwodots': '\u2687',
  '\\blackcircledrightdot': '\u2688',
  '\\blackcircledtwodots': '\u2689',
  '\\anchor': '\u2693',
  '\\swords': '\u2694',
  '\\warning': '\u26A0',
  '\\Hermaphrodite': '\u26A5',
  '\\medcirc': '\u26AA',
  '\\medbullet': '\u26AB',
  '\\mdsmwhtcircle': '\u26AC',
  '\\neuter': '\u26B2',
  '\\ding{33}': '\u2701',
  '\\ding{34}': '\u2702',
  '\\ding{35}': '\u2703',
  '\\ding{36}': '\u2704',
  '\\ding{38}': '\u2706',
  '\\ding{39}': '\u2707',
  '\\ding{40}': '\u2708',
  '\\ding{41}': '\u2709',
  '\\ding{44}': '\u270C',
  '\\ding{45}': '\u270D',
  '\\pencil': '\u270E',
  '\\ding{46}': '\u270E',
  '\\ding{47}': '\u270F',
  '\\ding{48}': '\u2710',
  '\\ding{49}': '\u2711',
  '\\ding{50}': '\u2712',
  '\\checkmark': '\u2713',
  '\\ding{51}': '\u2713',
  '\\ding{52}': '\u2714',
  '\\ding{53}': '\u2715',
  '\\ding{54}': '\u2716',
  '\\ballotx': '\u2717',
  '\\ding{55}': '\u2717',
  '\\ding{56}': '\u2718',
  '\\ding{57}': '\u2719',
  '\\ding{58}': '\u271A',
  '\\ding{59}': '\u271B',
  '\\ding{60}': '\u271C',
  '\\ding{61}': '\u271D',
  '\\ding{62}': '\u271E',
  '\\ding{63}': '\u271F',
  '\\maltese': '\u2720',
  '\\ding{64}': '\u2720',
  '\\ding{65}': '\u2721',
  '\\ding{66}': '\u2722',
  '\\ding{67}': '\u2723',
  '\\ding{68}': '\u2724',
  '\\ding{69}': '\u2725',
  '\\ding{70}': '\u2726',
  '\\ding{71}': '\u2727',
  '\\circledstar': '\u272A',
  '\\ding{74}': '\u272A',
  '\\ding{75}': '\u272B',
  '\\ding{76}': '\u272C',
  '\\ding{77}': '\u272D',
  '\\ding{78}': '\u272E',
  '\\ding{79}': '\u272F',
  '\\ding{80}': '\u2730',
  '\\ding{81}': '\u2731',
  '\\ding{82}': '\u2732',
  '\\ding{83}': '\u2733',
  '\\ding{84}': '\u2734',
  '\\ding{85}': '\u2735',
  '\\varstar': '\u2736',
  '\\ding{86}': '\u2736',
  '\\ding{87}': '\u2737',
  '\\ding{88}': '\u2738',
  '\\ding{89}': '\u2739',
  '\\ding{90}': '\u273A',
  '\\ding{91}': '\u273B',
  '\\ding{92}': '\u273C',
  '\\dingasterisk': '\u273D',
  '\\ding{93}': '\u273D',
  '\\ding{94}': '\u273E',
  '\\ding{95}': '\u273F',
  '\\ding{96}': '\u2740',
  '\\ding{97}': '\u2741',
  '\\ding{98}': '\u2742',
  '\\ding{99}': '\u2743',
  '\\ding{100}': '\u2744',
  '\\ding{101}': '\u2745',
  '\\ding{102}': '\u2746',
  '\\ding{103}': '\u2747',
  '\\ding{104}': '\u2748',
  '\\ding{105}': '\u2749',
  '\\ding{106}': '\u274A',
  '\\ding{107}': '\u274B',
  '\\ding{109}': '\u274D',
  '\\ding{111}': '\u274F',
  '\\ding{112}': '\u2750',
  '\\ding{113}': '\u2751',
  '\\ding{114}': '\u2752',
  '\\ding{118}': '\u2756',
  '\\ding{120}': '\u2758',
  '\\ding{121}': '\u2759',
  '\\ding{122}': '\u275A',
  '\\ding{123}': '\u275B',
  '\\ding{124}': '\u275C',
  '\\ding{125}': '\u275D',
  '\\ding{126}': '\u275E',
  '\\ding{161}': '\u2761',
  '\\ding{162}': '\u2762',
  '\\ding{163}': '\u2763',
  '\\ding{164}': '\u2764',
  '\\ding{165}': '\u2765',
  '\\ding{166}': '\u2766',
  '\\ding{167}': '\u2767',
  '\\lbrbrak': '\u3014',
  '\\rbrbrak': '\u3015',
  '\\ding{182}': '\u2776',
  '\\ding{183}': '\u2777',
  '\\ding{184}': '\u2778',
  '\\ding{185}': '\u2779',
  '\\ding{186}': '\u277A',
  '\\ding{187}': '\u277B',
  '\\ding{188}': '\u277C',
  '\\ding{189}': '\u277D',
  '\\ding{190}': '\u277E',
  '\\ding{191}': '\u277F',
  '\\ding{192}': '\u2780',
  '\\ding{193}': '\u2781',
  '\\ding{194}': '\u2782',
  '\\ding{195}': '\u2783',
  '\\ding{196}': '\u2784',
  '\\ding{197}': '\u2785',
  '\\ding{198}': '\u2786',
  '\\ding{199}': '\u2787',
  '\\ding{200}': '\u2788',
  '\\ding{201}': '\u2789',
  '\\ding{202}': '\u278A',
  '\\ding{203}': '\u278B',
  '\\ding{204}': '\u278C',
  '\\ding{205}': '\u278D',
  '\\ding{206}': '\u278E',
  '\\ding{207}': '\u278F',
  '\\ding{208}': '\u2790',
  '\\ding{209}': '\u2791',
  '\\ding{210}': '\u2792',
  '\\ding{211}': '\u2793',
  '\\ding{212}': '\u2794',
  '\\ding{216}': '\u2798',
  '\\ding{217}': '\u2799',
  '\\ding{218}': '\u279A',
  '\\draftingarrow': '\u279B',
  '\\ding{219}': '\u279B',
  '\\ding{220}': '\u279C',
  '\\ding{221}': '\u279D',
  '\\ding{222}': '\u279E',
  '\\ding{223}': '\u279F',
  '\\ding{224}': '\u27A0',
  '\\ding{225}': '\u27A1',
  '\\arrowbullet': '\u27A2',
  '\\ding{226}': '\u27A2',
  '\\ding{227}': '\u27A3',
  '\\ding{228}': '\u27A4',
  '\\ding{229}': '\u27A5',
  '\\ding{230}': '\u27A6',
  '\\ding{231}': '\u27A7',
  '\\ding{232}': '\u27A8',
  '\\ding{233}': '\u27A9',
  '\\ding{234}': '\u27AA',
  '\\ding{235}': '\u27AB',
  '\\ding{236}': '\u27AC',
  '\\ding{237}': '\u27AD',
  '\\ding{238}': '\u27AE',
  '\\ding{239}': '\u27AF',
  '\\ding{241}': '\u27B1',
  '\\ding{242}': '\u27B2',
  '\\ding{243}': '\u27B3',
  '\\ding{244}': '\u27B4',
  '\\ding{245}': '\u27B5',
  '\\ding{246}': '\u27B6',
  '\\ding{247}': '\u27B7',
  '\\ding{248}': '\u27B8',
  '\\ding{249}': '\u27B9',
  '\\ding{250}': '\u27BA',
  '\\ding{251}': '\u27BB',
  '\\ding{252}': '\u27BC',
  '\\ding{253}': '\u27BD',
  '\\ding{254}': '\u27BE',
  '\\threedangle': '\u27C0',
  '\\whiteinwhitetriangle': '\u27C1',
  '\\subsetcirc': '\u27C3',
  '\\supsetcirc': '\u27C4',
  '\\Lbag': '\u27C5',
  '\\Rbag': '\u27C6',
  '\\veedot': '\u27C7',
  '\\bsolhsub': '\u27C8',
  '\\suphsol': '\u27C9',
  '\\longdivision': '\u27CC',
  '\\Diamonddot': '\u27D0',
  '\\wedgedot': '\u27D1',
  '\\upin': '\u27D2',
  '\\pullback': '\u27D3',
  '\\pushout': '\u27D4',
  '\\leftouterjoin': '\u27D5',
  '\\rightouterjoin': '\u27D6',
  '\\fullouterjoin': '\u27D7',
  '\\bigbot': '\u27D8',
  '\\bigtop': '\u27D9',
  '\\DashVDash': '\u27DA',
  '\\dashVdash': '\u27DB',
  '\\multimapinv': '\u27DC',
  '\\vlongdash': '\u27DD',
  '\\longdashv': '\u27DE',
  '\\cirbot': '\u27DF',
  '\\lozengeminus': '\u27E0',
  '\\concavediamond': '\u27E1',
  '\\concavediamondtickleft': '\u27E2',
  '\\concavediamondtickright': '\u27E3',
  '\\whitesquaretickleft': '\u27E4',
  '\\whitesquaretickright': '\u27E5',
  '\\llbracket': '\u27E6',
  '\\rrbracket': '\u27E7',
  '\\lang': '\u27EA',
  '\\rang': '\u27EB',
  '\\Lbrbrak': '\u27EC',
  '\\Rbrbrak': '\u27ED',
  '\\lgroup': '\u27EE',
  '\\rgroup': '\u27EF',
  '\\UUparrow': '\u27F0',
  '\\DDownarrow': '\u27F1',
  '\\acwgapcirclearrow': '\u27F2',
  '\\cwgapcirclearrow': '\u27F3',
  '\\rightarrowonoplus': '\u27F4',
  '\\longleftarrow': '\u27F5',
  '\\longrightarrow': '\u27F6',
  '\\longleftrightarrow': '\u27F7',
  '\\Longleftarrow': '\u27F8',
  '\\Longrightarrow': '\u27F9',
  '\\Longleftrightarrow': '\u27FA',
  '\\longmapsfrom': '\u27FB',
  '\\longmapsto': '\u27FC',
  '\\Longmapsfrom': '\u27FD',
  '\\Longmapsto': '\u27FE',
  '\\sim\\joinrel\\leadsto': '\u27FF',
  '\\psur': '\u2900',
  '\\nVtwoheadrightarrow': '\u2901',
  '\\nvLeftarrow': '\u2902',
  '\\nvRightarrow': '\u2903',
  '\\nvLeftrightarrow': '\u2904',
  '\\ElsevierGlyph{E212}': '\u2905',
  '\\Mapsfrom': '\u2906',
  '\\Mapsto': '\u2907',
  '\\downarrowbarred': '\u2908',
  '\\uparrowbarred': '\u2909',
  '\\Uuparrow': '\u290A',
  '\\Ddownarrow': '\u290B',
  '\\leftbkarrow': '\u290C',
  '\\rightbkarrow': '\u290D',
  '\\leftdbkarrow': '\u290E',
  '\\dbkarow': '\u290F',
  '\\drbkarow': '\u2910',
  '\\rightdotarrow': '\u2911',
  '\\UpArrowBar': '\u2912',
  '\\DownArrowBar': '\u2913',
  '\\pinj': '\u2914',
  '\\finj': '\u2915',
  '\\bij': '\u2916',
  '\\nvtwoheadrightarrowtail': '\u2917',
  '\\nVtwoheadrightarrowtail': '\u2918',
  '\\lefttail': '\u2919',
  '\\righttail': '\u291A',
  '\\leftdbltail': '\u291B',
  '\\rightdbltail': '\u291C',
  '\\diamondleftarrow': '\u291D',
  '\\rightarrowdiamond': '\u291E',
  '\\diamondleftarrowbar': '\u291F',
  '\\barrightarrowdiamond': '\u2920',
  '\\nwsearrow': '\u2921',
  '\\neswarrow': '\u2922',
  '\\ElsevierGlyph{E20C}': '\u2923',
  '\\ElsevierGlyph{E20D}': '\u2924',
  '\\ElsevierGlyph{E20B}': '\u2925',
  '\\ElsevierGlyph{E20A}': '\u2926',
  '\\ElsevierGlyph{E211}': '\u2927',
  '\\ElsevierGlyph{E20E}': '\u2928',
  '\\ElsevierGlyph{E20F}': '\u2929',
  '\\ElsevierGlyph{E210}': '\u292A',
  '\\rdiagovfdiag': '\u292B',
  '\\fdiagovrdiag': '\u292C',
  '\\seovnearrow': '\u292D',
  '\\neovsearrow': '\u292E',
  '\\fdiagovnearrow': '\u292F',
  '\\rdiagovsearrow': '\u2930',
  '\\neovnwarrow': '\u2931',
  '\\nwovnearrow': '\u2932',
  '\\ElsevierGlyph{E21C}': '\u2933',
  '\\uprightcurvearrow': '\u2934',
  '\\downrightcurvedarrow': '\u2935',
  '\\ElsevierGlyph{E21A}': '\u2936',
  '\\ElsevierGlyph{E219}': '\u2937',
  '\\cwrightarcarrow': '\u2938',
  '\\acwleftarcarrow': '\u2939',
  '\\acwoverarcarrow': '\u293A',
  '\\acwunderarcarrow': '\u293B',
  '\\curvearrowrightminus': '\u293C',
  '\\curvearrowleftplus': '\u293D',
  '\\cwundercurvearrow': '\u293E',
  '\\ccwundercurvearrow': '\u293F',
  '\\Elolarr': '\u2940',
  '\\Elorarr': '\u2941',
  '\\ElzRlarr': '\u2942',
  '\\leftarrowshortrightarrow': '\u2943',
  '\\ElzrLarr': '\u2944',
  '\\rightarrowplus': '\u2945',
  '\\leftarrowplus': '\u2946',
  '\\Elzrarrx': '\u2947',
  '\\leftrightarrowcircle': '\u2948',
  '\\twoheaduparrowcircle': '\u2949',
  '\\leftrightharpoon': '\u294A',
  '\\rightleftharpoon': '\u294B',
  '\\updownharpoonrightleft': '\u294C',
  '\\updownharpoonleftright': '\u294D',
  '\\LeftRightVector': '\u294E',
  '\\RightUpDownVector': '\u294F',
  '\\DownLeftRightVector': '\u2950',
  '\\LeftUpDownVector': '\u2951',
  '\\LeftVectorBar': '\u2952',
  '\\RightVectorBar': '\u2953',
  '\\RightUpVectorBar': '\u2954',
  '\\RightDownVectorBar': '\u2955',
  '\\DownLeftVectorBar': '\u2956',
  '\\DownRightVectorBar': '\u2957',
  '\\LeftUpVectorBar': '\u2958',
  '\\LeftDownVectorBar': '\u2959',
  '\\LeftTeeVector': '\u295A',
  '\\RightTeeVector': '\u295B',
  '\\RightUpTeeVector': '\u295C',
  '\\RightDownTeeVector': '\u295D',
  '\\DownLeftTeeVector': '\u295E',
  '\\DownRightTeeVector': '\u295F',
  '\\LeftUpTeeVector': '\u2960',
  '\\LeftDownTeeVector': '\u2961',
  '\\leftleftharpoons': '\u2962',
  '\\upupharpoons': '\u2963',
  '\\rightrightharpoons': '\u2964',
  '\\downdownharpoons': '\u2965',
  '\\leftrightharpoonsup': '\u2966',
  '\\leftrightharpoonsdown': '\u2967',
  '\\rightleftharpoonsup': '\u2968',
  '\\rightleftharpoonsdown': '\u2969',
  '\\leftbarharpoon': '\u296A',
  '\\barleftharpoon': '\u296B',
  '\\rightbarharpoon': '\u296C',
  '\\barrightharpoon': '\u296D',
  '\\UpEquilibrium': '\u296E',
  '\\ReverseUpEquilibrium': '\u296F',
  '\\RoundImplies': '\u2970',
  '\\equalrightarrow': '\u2971',
  '\\similarrightarrow': '\u2972',
  '\\leftarrowsimilar': '\u2973',
  '\\rightarrowsimilar': '\u2974',
  '\\rightarrowapprox': '\u2975',
  '\\ltlarr': '\u2976',
  '\\leftarrowless': '\u2977',
  '\\gtrarr': '\u2978',
  '\\subrarr': '\u2979',
  '\\leftarrowsubset': '\u297A',
  '\\suplarr': '\u297B',
  '\\ElsevierGlyph{E214}': '\u297C',
  '\\ElsevierGlyph{E215}': '\u297D',
  '\\upfishtail': '\u297E',
  '\\downfishtail': '\u297F',
  '\\Elztfnc': '\u2980',
  '\\spot': '\u2981',
  '\\typecolon': '\u2982',
  '\\lBrace': '\u2983',
  '\\rBrace': '\u2984',
  '\\ElsevierGlyph{3018}': '\u3018',
  '\\Elroang': '\u2986',
  '\\limg': '\u2987',
  '\\rimg': '\u2988',
  '\\lblot': '\u2989',
  '\\rblot': '\u298A',
  '\\lbrackubar': '\u298B',
  '\\rbrackubar': '\u298C',
  '\\lbrackultick': '\u298D',
  '\\rbracklrtick': '\u298E',
  '\\lbracklltick': '\u298F',
  '\\rbrackurtick': '\u2990',
  '\\langledot': '\u2991',
  '\\rangledot': '\u2992',
  '\\ElsevierGlyph{E291}': '\u2994',
  '\\Lparengtr': '\u2995',
  '\\Rparenless': '\u2996',
  '\\lblkbrbrak': '\u2997',
  '\\rblkbrbrak': '\u2998',
  '\\Elzddfnc': '\u2999',
  '\\vzigzag': '\u299A',
  '\\measuredangleleft': '\u299B',
  '\\Angle': '\u299C',
  '\\rightanglemdot': '\u299D',
  '\\angles': '\u299E',
  '\\angdnr': '\u299F',
  '\\Elzlpargt': '\u29A0',
  '\\sphericalangleup': '\u29A1',
  '\\turnangle': '\u29A2',
  '\\revangle': '\u29A3',
  '\\angleubar': '\u29A4',
  '\\revangleubar': '\u29A5',
  '\\wideangledown': '\u29A6',
  '\\wideangleup': '\u29A7',
  '\\measanglerutone': '\u29A8',
  '\\measanglelutonw': '\u29A9',
  '\\measanglerdtose': '\u29AA',
  '\\measangleldtosw': '\u29AB',
  '\\measangleurtone': '\u29AC',
  '\\measangleultonw': '\u29AD',
  '\\measangledrtose': '\u29AE',
  '\\measangledltosw': '\u29AF',
  '\\revemptyset': '\u29B0',
  '\\emptysetobar': '\u29B1',
  '\\emptysetocirc': '\u29B2',
  '\\emptysetoarr': '\u29B3',
  '\\emptysetoarrl': '\u29B4',
  '\\ElsevierGlyph{E260}': '\u29B5',
  '\\ElsevierGlyph{E61B}': '\u29B6',
  '\\circledparallel': '\u29B7',
  '\\circledbslash': '\u29B8',
  '\\operp': '\u29B9',
  '\\obot': '\u29BA',
  '\\olcross': '\u29BB',
  '\\odotslashdot': '\u29BC',
  '\\uparrowoncircle': '\u29BD',
  '\\circledwhitebullet': '\u29BE',
  '\\circledbullet': '\u29BF',
  '\\circledless': '\u29C0',
  '\\circledgtr': '\u29C1',
  '\\cirscir': '\u29C2',
  '\\cirE': '\u29C3',
  '\\boxslash': '\u29C4',
  '\\boxbslash': '\u29C5',
  '\\boxast': '\u29C6',
  '\\boxcircle': '\u29C7',
  '\\boxbox': '\u29C8',
  '\\boxonbox': '\u29C9',
  '\\ElzLap': '\u29CA',
  '\\Elzdefas': '\u29CB',
  '\\triangles': '\u29CC',
  '\\triangleserifs': '\u29CD',
  '\\rtriltri': '\u29CE',
  '\\LeftTriangleBar': '\u29CF',
  '\\RightTriangleBar': '\u29D0',
  '\\lfbowtie': '\u29D1',
  '\\rfbowtie': '\u29D2',
  '\\fbowtie': '\u29D3',
  '\\lftimes': '\u29D4',
  '\\rftimes': '\u29D5',
  '\\hourglass': '\u29D6',
  '\\blackhourglass': '\u29D7',
  '\\lvzigzag': '\u29D8',
  '\\rvzigzag': '\u29D9',
  '\\Lvzigzag': '\u29DA',
  '\\Rvzigzag': '\u29DB',
  '\\ElsevierGlyph{E372}': '\u29DC',
  '\\tieinfty': '\u29DD',
  '\\nvinfty': '\u29DE',
  '\\multimapboth': '\u29DF',
  '\\laplac': '\u29E0',
  '\\lrtriangleeq': '\u29E1',
  '\\shuffle': '\u29E2',
  '\\eparsl': '\u29E3',
  '\\smeparsl': '\u29E4',
  '\\eqvparsl': '\u29E5',
  '\\gleichstark': '\u29E6',
  '\\thermod': '\u29E7',
  '\\downtriangleleftblack': '\u29E8',
  '\\downtrianglerightblack': '\u29E9',
  '\\blackdiamonddownarrow': '\u29EA',
  '\\blacklozenge': '\u29EB',
  '\\circledownarrow': '\u29EC',
  '\\blackcircledownarrow': '\u29ED',
  '\\errbarsquare': '\u29EE',
  '\\errbarblacksquare': '\u29EF',
  '\\errbardiamond': '\u29F0',
  '\\errbarblackdiamond': '\u29F1',
  '\\errbarcircle': '\u29F2',
  '\\errbarblackcircle': '\u29F3',
  '\\RuleDelayed': '\u29F4',
  '\\dsol': '\u29F6',
  '\\rsolbar': '\u29F7',
  '\\xsol': '\u29F8',
  '\\zhide': '\u29F9',
  '\\doubleplus': '\u29FA',
  '\\tripleplus': '\u29FB',
  '\\lcurvyangle': '\u29FC',
  '\\rcurvyangle': '\u29FD',
  '\\tplus': '\u29FE',
  '\\tminus': '\u29FF',
  '\\bigodot': '\u2A00',
  '\\bigoplus': '\u2A01',
  '\\bigotimes': '\u2A02',
  '\\bigcupdot': '\u2A03',
  '\\Elxuplus': '\u2A04',
  '\\ElzThr': '\u2A05',
  '\\Elxsqcup': '\u2A06',
  '\\ElzInf': '\u2A07',
  '\\ElzSup': '\u2A08',
  '\\varprod': '\u2A09',
  '\\modtwosum': '\u2A0A',
  '\\sumint': '\u2A0B',
  '\\iiiint': '\u2A0C',
  '\\ElzCint': '\u2A0D',
  '\\intBar': '\u2A0E',
  '\\clockoint': '\u2A0F',
  '\\ElsevierGlyph{E395}': '\u2A10',
  '\\awint': '\u2A11',
  '\\rppolint': '\u2A12',
  '\\scpolint': '\u2A13',
  '\\npolint': '\u2A14',
  '\\pointint': '\u2A15',
  '\\sqrint': '\u2A16',
  '\\intlarhk': '\u2A17',
  '\\intx': '\u2A18',
  '\\intcap': '\u2A19',
  '\\intcup': '\u2A1A',
  '\\upint': '\u2A1B',
  '\\lowint': '\u2A1C',
  '\\Join': '\u2A1D',
  '\\bigtriangleleft': '\u2A1E',
  '\\zcmp': '\u2A1F',
  '\\zpipe': '\u2A20',
  '\\zproject': '\u2A21',
  '\\ringplus': '\u2A22',
  '\\plushat': '\u2A23',
  '\\simplus': '\u2A24',
  '\\ElsevierGlyph{E25A}': '\u2A25',
  '\\plussim': '\u2A26',
  '\\plussubtwo': '\u2A27',
  '\\plustrif': '\u2A28',
  '\\commaminus': '\u2A29',
  '\\ElsevierGlyph{E25B}': '\u2A2A',
  '\\minusfdots': '\u2A2B',
  '\\minusrdots': '\u2A2C',
  '\\ElsevierGlyph{E25C}': '\u2A2D',
  '\\ElsevierGlyph{E25D}': '\u2A2E',
  '\\ElzTimes': '\u2A2F',
  '\\dottimes': '\u2A30',
  '\\timesbar': '\u2A31',
  '\\btimes': '\u2A32',
  '\\smashtimes': '\u2A33',
  '\\ElsevierGlyph{E25E}': '\u2A35',
  '\\otimeshat': '\u2A36',
  '\\Otimes': '\u2A37',
  '\\odiv': '\u2A38',
  '\\triangleplus': '\u2A39',
  '\\triangleminus': '\u2A3A',
  '\\triangletimes': '\u2A3B',
  '\\ElsevierGlyph{E259}': '\u2A3C',
  '\\intprodr': '\u2A3D',
  '\\fcmp': '\u2A3E',
  '\\amalg': '\u2A3F',
  '\\capdot': '\u2A40',
  '\\uminus': '\u2A41',
  '\\barcup': '\u2A42',
  '\\barcap': '\u2A43',
  '\\capwedge': '\u2A44',
  '\\cupvee': '\u2A45',
  '\\cupovercap': '\u2A46',
  '\\capovercup': '\u2A47',
  '\\cupbarcap': '\u2A48',
  '\\capbarcup': '\u2A49',
  '\\twocups': '\u2A4A',
  '\\twocaps': '\u2A4B',
  '\\closedvarcup': '\u2A4C',
  '\\closedvarcap': '\u2A4D',
  '\\Sqcap': '\u2A4E',
  '\\Sqcup': '\u2A4F',
  '\\closedvarcupsmashprod': '\u2A50',
  '\\wedgeodot': '\u2A51',
  '\\veeodot': '\u2A52',
  '\\ElzAnd': '\u2A53',
  '\\ElzOr': '\u2A54',
  '\\ElsevierGlyph{E36E}': '\u2A55',
  '\\ElOr': '\u2A56',
  '\\bigslopedvee': '\u2A57',
  '\\bigslopedwedge': '\u2A58',
  '\\veeonwedge': '\u2A59',
  '\\wedgemidvert': '\u2A5A',
  '\\veemidvert': '\u2A5B',
  '\\midbarwedge': '\u2A5C',
  '\\midbarvee': '\u2A5D',
  '\\Elzminhat': '\u2A5F',
  '\\wedgedoublebar': '\u2A60',
  '\\varveebar': '\u2A61',
  '\\doublebarvee': '\u2A62',
  '\\dsub': '\u2A64',
  '\\rsub': '\u2A65',
  '\\eqdot': '\u2A66',
  '\\dotequiv': '\u2A67',
  '\\equivVert': '\u2A68',
  '\\equivVvert': '\u2A69',
  '\\dotsim': '\u2A6A',
  '\\simrdots': '\u2A6B',
  '\\simminussim': '\u2A6C',
  '\\congdot': '\u2A6D',
  '\\stackrel{*}{=}': '\u2A6E',
  '\\hatapprox': '\u2A6F',
  '\\approxeqq': '\u2A70',
  '\\eqqplus': '\u2A71',
  '\\pluseqq': '\u2A72',
  '\\eqqsim': '\u2A73',
  '\\Coloneqq': '\u2A74',
  '\\Equal': '\u2A75',
  '\\Same': '\u2A76',
  '\\ddotseq': '\u2A77',
  '\\equivDD': '\u2A78',
  '\\ltcir': '\u2A79',
  '\\gtcir': '\u2A7A',
  '\\ltquest': '\u2A7B',
  '\\gtquest': '\u2A7C',
  '\\leqslant': '\u2A7D',
  '\\geqslant': '\u2A7E',
  '\\lesdot': '\u2A7F',
  '\\gesdot': '\u2A80',
  '\\lesdoto': '\u2A81',
  '\\gesdoto': '\u2A82',
  '\\lesdotor': '\u2A83',
  '\\gesdotol': '\u2A84',
  '\\lessapprox': '\u2A85',
  '\\gtrapprox': '\u2A86',
  '\\lneq': '\u2A87',
  '\\gneq': '\u2A88',
  '\\lnapprox': '\u2A89',
  '\\gnapprox': '\u2A8A',
  '\\lesseqqgtr': '\u2A8B',
  '\\gtreqqless': '\u2A8C',
  '\\lsime': '\u2A8D',
  '\\gsime': '\u2A8E',
  '\\lsimg': '\u2A8F',
  '\\gsiml': '\u2A90',
  '\\lgE': '\u2A91',
  '\\glE': '\u2A92',
  '\\lesges': '\u2A93',
  '\\gesles': '\u2A94',
  '\\eqslantless': '\u2A95',
  '\\eqslantgtr': '\u2A96',
  '\\elsdot': '\u2A97',
  '\\egsdot': '\u2A98',
  '\\eqqless': '\u2A99',
  '\\eqqgtr': '\u2A9A',
  '\\eqqslantless': '\u2A9B',
  '\\eqqslantgtr': '\u2A9C',
  '\\Pisymbol{ppi020}{117}': '\u2A9D',
  '\\Pisymbol{ppi020}{105}': '\u2A9E',
  '\\simlE': '\u2A9F',
  '\\simgE': '\u2AA0',
  '\\NestedLessLess': '\u2AA1',
  '\\NestedGreaterGreater': '\u2AA2',
  '\\partialmeetcontraction': '\u2AA3',
  '\\glj': '\u2AA4',
  '\\gla': '\u2AA5',
  '\\leftslice': '\u2AA6',
  '\\rightslice': '\u2AA7',
  '\\lescc': '\u2AA8',
  '\\gescc': '\u2AA9',
  '\\smt': '\u2AAA',
  '\\lat': '\u2AAB',
  '\\smte': '\u2AAC',
  '\\late': '\u2AAD',
  '\\bumpeqq': '\u2AAE',
  '\\preceq': '\u2AAF',
  '\\succeq': '\u2AB0',
  '\\precneq': '\u2AB1',
  '\\succneq': '\u2AB2',
  '\\preceqq': '\u2AB3',
  '\\succeqq': '\u2AB4',
  '\\precneqq': '\u2AB5',
  '\\succneqq': '\u2AB6',
  '\\precnapprox': '\u2AB9',
  '\\succnapprox': '\u2ABA',
  '\\llcurly': '\u2ABB',
  '\\ggcurly': '\u2ABC',
  '\\subsetdot': '\u2ABD',
  '\\supsetdot': '\u2ABE',
  '\\subsetplus': '\u2ABF',
  '\\supsetplus': '\u2AC0',
  '\\submult': '\u2AC1',
  '\\supmult': '\u2AC2',
  '\\subedot': '\u2AC3',
  '\\supedot': '\u2AC4',
  '\\subseteqq': '\u2AC5',
  '\\supseteqq': '\u2AC6',
  '\\subsim': '\u2AC7',
  '\\supsim': '\u2AC8',
  '\\subsetapprox': '\u2AC9',
  '\\supsetapprox': '\u2ACA',
  '\\subsetneqq': '\u2ACB',
  '\\supsetneqq': '\u2ACC',
  '\\lsqhook': '\u2ACD',
  '\\rsqhook': '\u2ACE',
  '\\csub': '\u2ACF',
  '\\csup': '\u2AD0',
  '\\csube': '\u2AD1',
  '\\csupe': '\u2AD2',
  '\\subsup': '\u2AD3',
  '\\supsub': '\u2AD4',
  '\\subsub': '\u2AD5',
  '\\supsup': '\u2AD6',
  '\\suphsub': '\u2AD7',
  '\\supdsub': '\u2AD8',
  '\\forkv': '\u2AD9',
  '\\topfork': '\u2ADA',
  '\\mlcp': '\u2ADB',
  '\\forks': '\u2ADD\u0338',
  '\\forksnot': '\u2ADD',
  '\\shortlefttack': '\u2ADE',
  '\\shortdowntack': '\u2ADF',
  '\\shortuptack': '\u2AE0',
  '\\perps': '\u2AE1',
  '\\vDdash': '\u2AE2',
  '\\dashV': '\u2AE3',
  '\\Dashv': '\u2AE4',
  '\\DashV': '\u2AE5',
  '\\varVdash': '\u2AE6',
  '\\Barv': '\u2AE7',
  '\\vBar': '\u2AE8',
  '\\vBarv': '\u2AE9',
  '\\Top': '\u2AEA',
  '\\ElsevierGlyph{E30D}': '\u2AEB',
  '\\Not': '\u2AEC',
  '\\bNot': '\u2AED',
  '\\revnmid': '\u2AEE',
  '\\cirmid': '\u2AEF',
  '\\midcir': '\u2AF0',
  '\\topcir': '\u2AF1',
  '\\nhpar': '\u2AF2',
  '\\parsim': '\u2AF3',
  '\\interleave': '\u2AF4',
  '\\nhVvert': '\u2AF5',
  '\\Elztdcol': '\u2AF6',
  '\\lllnest': '\u2AF7',
  '\\gggnest': '\u2AF8',
  '\\leqqslant': '\u2AF9',
  '\\geqqslant': '\u2AFA',
  '\\trslash': '\u2AFB',
  '\\biginterleave': '\u2AFC',
  '{{/}\\!\\!{/}}': '\u2AFD',
  '\\talloblong': '\u2AFE',
  '\\bigtalloblong': '\u2AFF',
  '\\squaretopblack': '\u2B12',
  '\\squarebotblack': '\u2B13',
  '\\squareurblack': '\u2B14',
  '\\squarellblack': '\u2B15',
  '\\diamondleftblack': '\u2B16',
  '\\diamondrightblack': '\u2B17',
  '\\diamondtopblack': '\u2B18',
  '\\diamondbotblack': '\u2B19',
  '\\dottedsquare': '\u2B1A',
  '\\vysmblksquare': '\u2B1D',
  '\\vysmwhtsquare': '\u2B1E',
  '\\pentagonblack': '\u2B1F',
  '\\pentagon': '\u2B20',
  '\\varhexagon': '\u2B21',
  '\\varhexagonblack': '\u2B22',
  '\\hexagonblack': '\u2B23',
  '\\lgblkcircle': '\u2B24',
  '\\mdblkdiamond': '\u2B25',
  '\\mdwhtdiamond': '\u2B26',
  '\\mdblklozenge': '\u2B27',
  '\\mdwhtlozenge': '\u2B28',
  '\\smblkdiamond': '\u2B29',
  '\\smblklozenge': '\u2B2A',
  '\\smwhtlozenge': '\u2B2B',
  '\\blkhorzoval': '\u2B2C',
  '\\whthorzoval': '\u2B2D',
  '\\blkvertoval': '\u2B2E',
  '\\whtvertoval': '\u2B2F',
  '\\circleonleftarrow': '\u2B30',
  '\\leftthreearrows': '\u2B31',
  '\\leftarrowonoplus': '\u2B32',
  '\\longleftsquigarrow': '\u2B33',
  '\\nvtwoheadleftarrow': '\u2B34',
  '\\nVtwoheadleftarrow': '\u2B35',
  '\\twoheadmapsfrom': '\u2B36',
  '\\twoheadleftdbkarrow': '\u2B37',
  '\\leftdotarrow': '\u2B38',
  '\\nvleftarrowtail': '\u2B39',
  '\\nVleftarrowtail': '\u2B3A',
  '\\twoheadleftarrowtail': '\u2B3B',
  '\\nvtwoheadleftarrowtail': '\u2B3C',
  '\\nVtwoheadleftarrowtail': '\u2B3D',
  '\\leftarrowx': '\u2B3E',
  '\\leftcurvedarrow': '\u2B3F',
  '\\equalleftarrow': '\u2B40',
  '\\bsimilarleftarrow': '\u2B41',
  '\\leftarrowbackapprox': '\u2B42',
  '\\rightarrowgtr': '\u2B43',
  '\\rightarrowsupset': '\u2B44',
  '\\LLeftarrow': '\u2B45',
  '\\RRightarrow': '\u2B46',
  '\\bsimilarrightarrow': '\u2B47',
  '\\rightarrowbackapprox': '\u2B48',
  '\\similarleftarrow': '\u2B49',
  '\\leftarrowapprox': '\u2B4A',
  '\\leftarrowbsimilar': '\u2B4B',
  '\\rightarrowbsimilar': '\u2B4C',
  '\\medwhitestar': '\u2B50',
  '\\medblackstar': '\u2B51',
  '\\smwhitestar': '\u2B52',
  '\\rightpentagonblack': '\u2B53',
  '\\rightpentagon': '\u2B54',
  '\\ElsevierGlyph{300A}': '\u300A',
  '\\ElsevierGlyph{300B}': '\u300B',
  '\\postalmark': '\u3012',
  '\\ElsevierGlyph{3019}': '\u3019',
  '\\openbracketleft': '\u301A',
  '\\openbracketright': '\u301B',
  '\\hzigzag': '\u3030',
  '\\dbend': '\uFFFD',
  '\\NotEqualTilde': '\u2242\u0338',
  '\\not\\apid': '\u224B\u0338',
  '\\NotHumpDownHump': '\u224E\u0338',
  '\\NotHumpEqual': '\u224F\u0338',
  '\\not\\doteq': '\u2250\u0338',
  '\\lvertneqq': '\u2268\uFE00',
  '\\gvertneqq': '\u2269\uFE00',
  '\\NotLessLess': '\u226A\u0338',
  '\\NotGreaterGreater': '\u226B\u0338',
  '\\NotPrecedesTilde': '\u227E\u0338',
  '\\NotSucceedsTilde': '\u227F\u0338',
  '\\varsubsetneqq': '\u228A\uFE00',
  '\\varsupsetneq': '\u228B\uFE00',
  '\\NotSquareSubset': '\u228F\u0338',
  '\\NotSquareSuperset': '\u2290\u0338',
  '\\ElsevierGlyph{E21D}': '\u2933\u0338',
  '\\NotLeftTriangleBar': '\u29CF\u0338',
  '\\NotRightTriangleBar': '\u29D0\u0338',
  '\\nleqslant': '\u2A7D\u0338',
  '\\ngeqslant': '\u2A7E\u0338',
  '\\NotNestedLessLess': '\u2AA1\u0338',
  '\\NotNestedGreaterGreater': '\u2AA2\u0338',
  '\\not\\preceq': '\u2AAF\u0338',
  '\\not\\succeq': '\u2AB0\u0338',
  '\\nsubseteqq': '\u2AC5\u0338',
  '\\nsupseteqq': '\u2AC6\u0338',
  '{\\rlap{\\textbackslash}{{/}\\!\\!{/}}}': '\u2AFD\u20E5',
  '\\mathbf{A}': '\uD835\uDEC2',
  '\\mathbf{B}': '\uD835\uDEC3',
  '\\mathbf{C}': '\uD835\uDC02',
  '\\mathbf{D}': '\uD835\uDC03',
  '\\mathbf{E}': '\uD835\uDEC6',
  '\\mathbf{F}': '\uD835\uDC05',
  '\\mathbf{G}': '\uD835\uDC06',
  '\\mathbf{H}': '\uD835\uDEC8',
  '\\mathbf{I}': '\uD835\uDECA',
  '\\mathbf{J}': '\uD835\uDC09',
  '\\mathbf{K}': '\uD835\uDECB',
  '\\mathbf{L}': '\uD835\uDC0B',
  '\\mathbf{M}': '\uD835\uDC0C',
  '\\mathbf{N}': '\uD835\uDC0D',
  '\\mathbf{O}': '\uD835\uDC0E',
  '\\mathbf{P}': '\uD835\uDED2',
  '\\mathbf{Q}': '\uD835\uDC10',
  '\\mathbf{R}': '\uD835\uDC11',
  '\\mathbf{S}': '\uD835\uDC12',
  '\\mathbf{T}': '\uD835\uDED5',
  '\\mathbf{U}': '\uD835\uDC14',
  '\\mathbf{V}': '\uD835\uDC15',
  '\\mathbf{W}': '\uD835\uDC16',
  '\\mathbf{X}': '\uD835\uDED8',
  '\\mathbf{Y}': '\uD835\uDC18',
  '\\mathbf{Z}': '\uD835\uDEC7',
  '\\mathbf{a}': '\uD835\uDC1A',
  '\\mathbf{b}': '\uD835\uDC1B',
  '\\mathbf{c}': '\uD835\uDC1C',
  '\\mathbf{d}': '\uD835\uDC1D',
  '\\mathbf{e}': '\uD835\uDC1E',
  '\\mathbf{f}': '\uD835\uDC1F',
  '\\mathbf{g}': '\uD835\uDC20',
  '\\mathbf{h}': '\uD835\uDC21',
  '\\mathbf{i}': '\uD835\uDC22',
  '\\mathbf{j}': '\uD835\uDC23',
  '\\mathbf{k}': '\uD835\uDC24',
  '\\mathbf{l}': '\uD835\uDC25',
  '\\mathbf{m}': '\uD835\uDC26',
  '\\mathbf{n}': '\uD835\uDC27',
  '\\mathbf{o}': '\uD835\uDC28',
  '\\mathbf{p}': '\uD835\uDC29',
  '\\mathbf{q}': '\uD835\uDC2A',
  '\\mathbf{r}': '\uD835\uDC2B',
  '\\mathbf{s}': '\uD835\uDC2C',
  '\\mathbf{t}': '\uD835\uDC2D',
  '\\mathbf{u}': '\uD835\uDC2E',
  '\\mathbf{v}': '\uD835\uDC2F',
  '\\mathbf{w}': '\uD835\uDC30',
  '\\mathbf{x}': '\uD835\uDC31',
  '\\mathbf{y}': '\uD835\uDC32',
  '\\mathbf{z}': '\uD835\uDC33',
  '\\mathsl{A}': '\uD835\uDEFC',
  '\\mathsl{B}': '\uD835\uDEFD',
  '\\mathsl{C}': '\uD835\uDC36',
  '\\mathsl{D}': '\uD835\uDC37',
  '\\mathsl{E}': '\uD835\uDF00',
  '\\mathsl{F}': '\uD835\uDC39',
  '\\mathsl{G}': '\uD835\uDC3A',
  '\\mathsl{H}': '\uD835\uDF02',
  '\\mathsl{I}': '\uD835\uDF04',
  '\\mathsl{J}': '\uD835\uDC3D',
  '\\mathsl{K}': '\uD835\uDF05',
  '\\mathsl{L}': '\uD835\uDC3F',
  '\\mathsl{M}': '\uD835\uDC40',
  '\\mathsl{N}': '\uD835\uDC41',
  '\\mathsl{O}': '\uD835\uDC42',
  '\\mathsl{P}': '\uD835\uDF0C',
  '\\mathsl{Q}': '\uD835\uDC44',
  '\\mathsl{R}': '\uD835\uDC45',
  '\\mathsl{S}': '\uD835\uDC46',
  '\\mathsl{T}': '\uD835\uDF0F',
  '\\mathsl{U}': '\uD835\uDC48',
  '\\mathsl{V}': '\uD835\uDC49',
  '\\mathsl{W}': '\uD835\uDC4A',
  '\\mathsl{X}': '\uD835\uDF12',
  '\\mathsl{Y}': '\uD835\uDC4C',
  '\\mathsl{Z}': '\uD835\uDF01',
  '\\mathsl{a}': '\uD835\uDC4E',
  '\\mathsl{b}': '\uD835\uDC4F',
  '\\mathsl{c}': '\uD835\uDC50',
  '\\mathsl{d}': '\uD835\uDC51',
  '\\mathsl{e}': '\uD835\uDC52',
  '\\mathsl{f}': '\uD835\uDC53',
  '\\mathsl{g}': '\uD835\uDC54',
  '\\mathsl{i}': '\uD835\uDC56',
  '\\mathsl{j}': '\uD835\uDC57',
  '\\mathsl{k}': '\uD835\uDC58',
  '\\mathsl{l}': '\uD835\uDC59',
  '\\mathsl{m}': '\uD835\uDC5A',
  '\\mathsl{n}': '\uD835\uDC5B',
  '\\mathsl{o}': '\uD835\uDC5C',
  '\\mathsl{p}': '\uD835\uDC5D',
  '\\mathsl{q}': '\uD835\uDC5E',
  '\\mathsl{r}': '\uD835\uDC5F',
  '\\mathsl{s}': '\uD835\uDC60',
  '\\mathsl{t}': '\uD835\uDC61',
  '\\mathsl{u}': '\uD835\uDC62',
  '\\mathsl{v}': '\uD835\uDC63',
  '\\mathsl{w}': '\uD835\uDC64',
  '\\mathsl{x}': '\uD835\uDC65',
  '\\mathsl{y}': '\uD835\uDC66',
  '\\mathsl{z}': '\uD835\uDC67',
  '\\mathbit{A}': '\uD835\uDF36',
  '\\mathbit{B}': '\uD835\uDF37',
  '\\mathbit{C}': '\uD835\uDC6A',
  '\\mathbit{D}': '\uD835\uDC6B',
  '\\mathbit{E}': '\uD835\uDF3A',
  '\\mathbit{F}': '\uD835\uDC6D',
  '\\mathbit{G}': '\uD835\uDC6E',
  '\\mathbit{H}': '\uD835\uDF3C',
  '\\mathbit{I}': '\uD835\uDF3E',
  '\\mathbit{J}': '\uD835\uDC71',
  '\\mathbit{K}': '\uD835\uDF3F',
  '\\mathbit{L}': '\uD835\uDC73',
  '\\mathbit{M}': '\uD835\uDC74',
  '\\mathbit{N}': '\uD835\uDC75',
  '\\mathbit{O}': '\uD835\uDF2D',
  '\\mathbit{P}': '\uD835\uDF46',
  '\\mathbit{Q}': '\uD835\uDC78',
  '\\mathbit{R}': '\uD835\uDC79',
  '\\mathbit{S}': '\uD835\uDC7A',
  '\\mathbit{T}': '\uD835\uDF49',
  '\\mathbit{U}': '\uD835\uDC7C',
  '\\mathbit{V}': '\uD835\uDC7D',
  '\\mathbit{W}': '\uD835\uDC7E',
  '\\mathbit{X}': '\uD835\uDF4C',
  '\\mathbit{Y}': '\uD835\uDC80',
  '\\mathbit{Z}': '\uD835\uDF3B',
  '\\mathbit{a}': '\uD835\uDC82',
  '\\mathbit{b}': '\uD835\uDC83',
  '\\mathbit{c}': '\uD835\uDC84',
  '\\mathbit{d}': '\uD835\uDC85',
  '\\mathbit{e}': '\uD835\uDC86',
  '\\mathbit{f}': '\uD835\uDC87',
  '\\mathbit{g}': '\uD835\uDC88',
  '\\mathbit{h}': '\uD835\uDC89',
  '\\mathbit{i}': '\uD835\uDC8A',
  '\\mathbit{j}': '\uD835\uDC8B',
  '\\mathbit{k}': '\uD835\uDC8C',
  '\\mathbit{l}': '\uD835\uDC8D',
  '\\mathbit{m}': '\uD835\uDC8E',
  '\\mathbit{n}': '\uD835\uDC8F',
  '\\mathbit{o}': '\uD835\uDC90',
  '\\mathbit{p}': '\uD835\uDC91',
  '\\mathbit{q}': '\uD835\uDC92',
  '\\mathbit{r}': '\uD835\uDC93',
  '\\mathbit{s}': '\uD835\uDC94',
  '\\mathbit{t}': '\uD835\uDC95',
  '\\mathbit{u}': '\uD835\uDC96',
  '\\mathbit{v}': '\uD835\uDC97',
  '\\mathbit{w}': '\uD835\uDC98',
  '\\mathbit{x}': '\uD835\uDC99',
  '\\mathbit{y}': '\uD835\uDC9A',
  '\\mathbit{z}': '\uD835\uDC9B',
  '\\mathscr{A}': '\uD835\uDC9C',
  '\\mathscr{C}': '\uD835\uDC9E',
  '\\mathscr{D}': '\uD835\uDC9F',
  '\\mathscr{G}': '\uD835\uDCA2',
  '\\mathscr{J}': '\uD835\uDCA5',
  '\\mathscr{K}': '\uD835\uDCA6',
  '\\mathscr{N}': '\uD835\uDCA9',
  '\\mathscr{O}': '\uD835\uDCAA',
  '\\mathscr{P}': '\uD835\uDCAB',
  '\\mathscr{Q}': '\uD835\uDCAC',
  '\\mathscr{S}': '\uD835\uDCAE',
  '\\mathscr{T}': '\uD835\uDCAF',
  '\\mathscr{U}': '\uD835\uDCB0',
  '\\mathscr{V}': '\uD835\uDCB1',
  '\\mathscr{W}': '\uD835\uDCB2',
  '\\mathscr{X}': '\uD835\uDCB3',
  '\\mathscr{Y}': '\uD835\uDCB4',
  '\\mathscr{Z}': '\uD835\uDCB5',
  '\\mathscr{a}': '\uD835\uDCB6',
  '\\mathscr{b}': '\uD835\uDCB7',
  '\\mathscr{c}': '\uD835\uDCB8',
  '\\mathscr{d}': '\uD835\uDCB9',
  '\\mathscr{f}': '\uD835\uDCBB',
  '\\mathscr{h}': '\uD835\uDCBD',
  '\\mathscr{i}': '\uD835\uDCBE',
  '\\mathscr{j}': '\uD835\uDCBF',
  '\\mathscr{k}': '\uD835\uDCC0',
  '\\mathscr{m}': '\uD835\uDCC2',
  '\\mathscr{n}': '\uD835\uDCC3',
  '\\mathscr{p}': '\uD835\uDCC5',
  '\\mathscr{q}': '\uD835\uDCC6',
  '\\mathscr{r}': '\uD835\uDCC7',
  '\\mathscr{s}': '\uD835\uDCC8',
  '\\mathscr{t}': '\uD835\uDCC9',
  '\\mathscr{u}': '\uD835\uDCCA',
  '\\mathscr{v}': '\uD835\uDCCB',
  '\\mathscr{w}': '\uD835\uDCCC',
  '\\mathscr{x}': '\uD835\uDCCD',
  '\\mathscr{y}': '\uD835\uDCCE',
  '\\mathscr{z}': '\uD835\uDCCF',
  '\\mathmit{A}': '\uD835\uDCD0',
  '\\mathmit{B}': '\uD835\uDCD1',
  '\\mathmit{C}': '\uD835\uDCD2',
  '\\mathmit{D}': '\uD835\uDCD3',
  '\\mathmit{E}': '\uD835\uDCD4',
  '\\mathmit{F}': '\uD835\uDCD5',
  '\\mathmit{G}': '\uD835\uDCD6',
  '\\mathmit{H}': '\uD835\uDCD7',
  '\\mathmit{I}': '\uD835\uDCD8',
  '\\mathmit{J}': '\uD835\uDCD9',
  '\\mathmit{K}': '\uD835\uDCDA',
  '\\mathmit{L}': '\uD835\uDCDB',
  '\\mathmit{M}': '\uD835\uDCDC',
  '\\mathmit{N}': '\uD835\uDCDD',
  '\\mathmit{O}': '\uD835\uDCDE',
  '\\mathmit{P}': '\uD835\uDCDF',
  '\\mathmit{Q}': '\uD835\uDCE0',
  '\\mathmit{R}': '\uD835\uDCE1',
  '\\mathmit{S}': '\uD835\uDCE2',
  '\\mathmit{T}': '\uD835\uDCE3',
  '\\mathmit{U}': '\uD835\uDCE4',
  '\\mathmit{V}': '\uD835\uDCE5',
  '\\mathmit{W}': '\uD835\uDCE6',
  '\\mathmit{X}': '\uD835\uDCE7',
  '\\mathmit{Y}': '\uD835\uDCE8',
  '\\mathmit{Z}': '\uD835\uDCE9',
  '\\mathmit{a}': '\uD835\uDCEA',
  '\\mathmit{b}': '\uD835\uDCEB',
  '\\mathmit{c}': '\uD835\uDCEC',
  '\\mathmit{d}': '\uD835\uDCED',
  '\\mathmit{e}': '\uD835\uDCEE',
  '\\mathmit{f}': '\uD835\uDCEF',
  '\\mathmit{g}': '\uD835\uDCF0',
  '\\mathmit{h}': '\uD835\uDCF1',
  '\\mathmit{i}': '\uD835\uDCF2',
  '\\mathmit{j}': '\uD835\uDCF3',
  '\\mathmit{k}': '\uD835\uDCF4',
  '\\mathmit{l}': '\uD835\uDCF5',
  '\\mathmit{m}': '\uD835\uDCF6',
  '\\mathmit{n}': '\uD835\uDCF7',
  '\\mathmit{o}': '\uD835\uDCF8',
  '\\mathmit{p}': '\uD835\uDCF9',
  '\\mathmit{q}': '\uD835\uDCFA',
  '\\mathmit{r}': '\uD835\uDCFB',
  '\\mathmit{s}': '\uD835\uDCFC',
  '\\mathmit{t}': '\uD835\uDCFD',
  '\\mathmit{u}': '\uD835\uDCFE',
  '\\mathmit{v}': '\uD835\uDCFF',
  '\\mathmit{w}': '\uD835\uDD00',
  '\\mathmit{x}': '\uD835\uDD01',
  '\\mathmit{y}': '\uD835\uDD02',
  '\\mathmit{z}': '\uD835\uDD03',
  '\\mathfrak{A}': '\uD835\uDD04',
  '\\mathfrak{B}': '\uD835\uDD05',
  '\\mathfrak{D}': '\uD835\uDD07',
  '\\mathfrak{E}': '\uD835\uDD08',
  '\\mathfrak{F}': '\uD835\uDD09',
  '\\mathfrak{G}': '\uD835\uDD0A',
  '\\mathfrak{J}': '\uD835\uDD0D',
  '\\mathfrak{K}': '\uD835\uDD0E',
  '\\mathfrak{L}': '\uD835\uDD0F',
  '\\mathfrak{M}': '\uD835\uDD10',
  '\\mathfrak{N}': '\uD835\uDD11',
  '\\mathfrak{O}': '\uD835\uDD12',
  '\\mathfrak{P}': '\uD835\uDD13',
  '\\mathfrak{Q}': '\uD835\uDD14',
  '\\mathfrak{S}': '\uD835\uDD16',
  '\\mathfrak{T}': '\uD835\uDD17',
  '\\mathfrak{U}': '\uD835\uDD18',
  '\\mathfrak{V}': '\uD835\uDD19',
  '\\mathfrak{W}': '\uD835\uDD1A',
  '\\mathfrak{X}': '\uD835\uDD1B',
  '\\mathfrak{Y}': '\uD835\uDD1C',
  '\\mathfrak{a}': '\uD835\uDD1E',
  '\\mathfrak{b}': '\uD835\uDD1F',
  '\\mathfrak{c}': '\uD835\uDD20',
  '\\mathfrak{d}': '\uD835\uDD21',
  '\\mathfrak{e}': '\uD835\uDD22',
  '\\mathfrak{f}': '\uD835\uDD23',
  '\\mathfrak{g}': '\uD835\uDD24',
  '\\mathfrak{h}': '\uD835\uDD25',
  '\\mathfrak{i}': '\uD835\uDD26',
  '\\mathfrak{j}': '\uD835\uDD27',
  '\\mathfrak{k}': '\uD835\uDD28',
  '\\mathfrak{l}': '\uD835\uDD29',
  '\\mathfrak{m}': '\uD835\uDD2A',
  '\\mathfrak{n}': '\uD835\uDD2B',
  '\\mathfrak{o}': '\uD835\uDD2C',
  '\\mathfrak{p}': '\uD835\uDD2D',
  '\\mathfrak{q}': '\uD835\uDD2E',
  '\\mathfrak{r}': '\uD835\uDD2F',
  '\\mathfrak{s}': '\uD835\uDD30',
  '\\mathfrak{t}': '\uD835\uDD31',
  '\\mathfrak{u}': '\uD835\uDD32',
  '\\mathfrak{v}': '\uD835\uDD33',
  '\\mathfrak{w}': '\uD835\uDD34',
  '\\mathfrak{x}': '\uD835\uDD35',
  '\\mathfrak{y}': '\uD835\uDD36',
  '\\mathfrak{z}': '\uD835\uDD37',
  '\\mathbb{A}': '\uD835\uDD38',
  '\\mathbb{B}': '\uD835\uDD39',
  '\\mathbb{D}': '\uD835\uDD3B',
  '\\mathbb{E}': '\uD835\uDD3C',
  '\\mathbb{F}': '\uD835\uDD3D',
  '\\mathbb{G}': '\uD835\uDD3E',
  '\\mathbb{I}': '\uD835\uDD40',
  '\\mathbb{J}': '\uD835\uDD41',
  '\\mathbb{K}': '\uD835\uDD42',
  '\\mathbb{L}': '\uD835\uDD43',
  '\\mathbb{M}': '\uD835\uDD44',
  '\\mathbb{O}': '\uD835\uDD46',
  '\\mathbb{S}': '\uD835\uDD4A',
  '\\mathbb{T}': '\uD835\uDD4B',
  '\\mathbb{U}': '\uD835\uDD4C',
  '\\mathbb{V}': '\uD835\uDD4D',
  '\\mathbb{W}': '\uD835\uDD4E',
  '\\mathbb{X}': '\uD835\uDD4F',
  '\\mathbb{Y}': '\uD835\uDD50',
  '\\mathbb{a}': '\uD835\uDD52',
  '\\mathbb{b}': '\uD835\uDD53',
  '\\mathbb{c}': '\uD835\uDD54',
  '\\mathbb{d}': '\uD835\uDD55',
  '\\mathbb{e}': '\uD835\uDD56',
  '\\mathbb{f}': '\uD835\uDD57',
  '\\mathbb{g}': '\uD835\uDD58',
  '\\mathbb{h}': '\uD835\uDD59',
  '\\mathbb{i}': '\uD835\uDD5A',
  '\\mathbb{j}': '\uD835\uDD5B',
  '\\mathbb{k}': '\uD835\uDD5C',
  '\\mathbb{l}': '\uD835\uDD5D',
  '\\mathbb{m}': '\uD835\uDD5E',
  '\\mathbb{n}': '\uD835\uDD5F',
  '\\mathbb{o}': '\uD835\uDD60',
  '\\mathbb{p}': '\uD835\uDD61',
  '\\mathbb{q}': '\uD835\uDD62',
  '\\mathbb{r}': '\uD835\uDD63',
  '\\mathbb{s}': '\uD835\uDD64',
  '\\mathbb{t}': '\uD835\uDD65',
  '\\mathbb{u}': '\uD835\uDD66',
  '\\mathbb{v}': '\uD835\uDD67',
  '\\mathbb{w}': '\uD835\uDD68',
  '\\mathbb{x}': '\uD835\uDD69',
  '\\mathbb{y}': '\uD835\uDD6A',
  '\\mathbb{z}': '\uD835\uDD6B',
  '\\mathslbb{A}': '\uD835\uDD6C',
  '\\mathslbb{B}': '\uD835\uDD6D',
  '\\mathslbb{C}': '\uD835\uDD6E',
  '\\mathslbb{D}': '\uD835\uDD6F',
  '\\mathslbb{E}': '\uD835\uDD70',
  '\\mathslbb{F}': '\uD835\uDD71',
  '\\mathslbb{G}': '\uD835\uDD72',
  '\\mathslbb{H}': '\uD835\uDD73',
  '\\mathslbb{I}': '\uD835\uDD74',
  '\\mathslbb{J}': '\uD835\uDD75',
  '\\mathslbb{K}': '\uD835\uDD76',
  '\\mathslbb{L}': '\uD835\uDD77',
  '\\mathslbb{M}': '\uD835\uDD78',
  '\\mathslbb{N}': '\uD835\uDD79',
  '\\mathslbb{O}': '\uD835\uDD7A',
  '\\mathslbb{P}': '\uD835\uDD7B',
  '\\mathslbb{Q}': '\uD835\uDD7C',
  '\\mathslbb{R}': '\uD835\uDD7D',
  '\\mathslbb{S}': '\uD835\uDD7E',
  '\\mathslbb{T}': '\uD835\uDD7F',
  '\\mathslbb{U}': '\uD835\uDD80',
  '\\mathslbb{V}': '\uD835\uDD81',
  '\\mathslbb{W}': '\uD835\uDD82',
  '\\mathslbb{X}': '\uD835\uDD83',
  '\\mathslbb{Y}': '\uD835\uDD84',
  '\\mathslbb{Z}': '\uD835\uDD85',
  '\\mathslbb{a}': '\uD835\uDD86',
  '\\mathslbb{b}': '\uD835\uDD87',
  '\\mathslbb{c}': '\uD835\uDD88',
  '\\mathslbb{d}': '\uD835\uDD89',
  '\\mathslbb{e}': '\uD835\uDD8A',
  '\\mathslbb{f}': '\uD835\uDD8B',
  '\\mathslbb{g}': '\uD835\uDD8C',
  '\\mathslbb{h}': '\uD835\uDD8D',
  '\\mathslbb{i}': '\uD835\uDD8E',
  '\\mathslbb{j}': '\uD835\uDD8F',
  '\\mathslbb{k}': '\uD835\uDD90',
  '\\mathslbb{l}': '\uD835\uDD91',
  '\\mathslbb{m}': '\uD835\uDD92',
  '\\mathslbb{n}': '\uD835\uDD93',
  '\\mathslbb{o}': '\uD835\uDD94',
  '\\mathslbb{p}': '\uD835\uDD95',
  '\\mathslbb{q}': '\uD835\uDD96',
  '\\mathslbb{r}': '\uD835\uDD97',
  '\\mathslbb{s}': '\uD835\uDD98',
  '\\mathslbb{t}': '\uD835\uDD99',
  '\\mathslbb{u}': '\uD835\uDD9A',
  '\\mathslbb{v}': '\uD835\uDD9B',
  '\\mathslbb{w}': '\uD835\uDD9C',
  '\\mathslbb{x}': '\uD835\uDD9D',
  '\\mathslbb{y}': '\uD835\uDD9E',
  '\\mathslbb{z}': '\uD835\uDD9F',
  '\\mathsf{A}': '\uD835\uDDA0',
  '\\mathsf{B}': '\uD835\uDDA1',
  '\\mathsf{C}': '\uD835\uDDA2',
  '\\mathsf{D}': '\uD835\uDDA3',
  '\\mathsf{E}': '\uD835\uDDA4',
  '\\mathsf{F}': '\uD835\uDDA5',
  '\\mathsf{G}': '\uD835\uDDA6',
  '\\mathsf{H}': '\uD835\uDDA7',
  '\\mathsf{I}': '\uD835\uDDA8',
  '\\mathsf{J}': '\uD835\uDDA9',
  '\\mathsf{K}': '\uD835\uDDAA',
  '\\mathsf{L}': '\uD835\uDDAB',
  '\\mathsf{M}': '\uD835\uDDAC',
  '\\mathsf{N}': '\uD835\uDDAD',
  '\\mathsf{O}': '\uD835\uDDAE',
  '\\mathsf{P}': '\uD835\uDDAF',
  '\\mathsf{Q}': '\uD835\uDDB0',
  '\\mathsf{R}': '\uD835\uDDB1',
  '\\mathsf{S}': '\uD835\uDDB2',
  '\\mathsf{T}': '\uD835\uDDB3',
  '\\mathsf{U}': '\uD835\uDDB4',
  '\\mathsf{V}': '\uD835\uDDB5',
  '\\mathsf{W}': '\uD835\uDDB6',
  '\\mathsf{X}': '\uD835\uDDB7',
  '\\mathsf{Y}': '\uD835\uDDB8',
  '\\mathsf{Z}': '\uD835\uDDB9',
  '\\mathsf{a}': '\uD835\uDDBA',
  '\\mathsf{b}': '\uD835\uDDBB',
  '\\mathsf{c}': '\uD835\uDDBC',
  '\\mathsf{d}': '\uD835\uDDBD',
  '\\mathsf{e}': '\uD835\uDDBE',
  '\\mathsf{f}': '\uD835\uDDBF',
  '\\mathsf{g}': '\uD835\uDDC0',
  '\\mathsf{h}': '\uD835\uDDC1',
  '\\mathsf{i}': '\uD835\uDDC2',
  '\\mathsf{j}': '\uD835\uDDC3',
  '\\mathsf{k}': '\uD835\uDDC4',
  '\\mathsf{l}': '\uD835\uDDC5',
  '\\mathsf{m}': '\uD835\uDDC6',
  '\\mathsf{n}': '\uD835\uDDC7',
  '\\mathsf{o}': '\uD835\uDDC8',
  '\\mathsf{p}': '\uD835\uDDC9',
  '\\mathsf{q}': '\uD835\uDDCA',
  '\\mathsf{r}': '\uD835\uDDCB',
  '\\mathsf{s}': '\uD835\uDDCC',
  '\\mathsf{t}': '\uD835\uDDCD',
  '\\mathsf{u}': '\uD835\uDDCE',
  '\\mathsf{v}': '\uD835\uDDCF',
  '\\mathsf{w}': '\uD835\uDDD0',
  '\\mathsf{x}': '\uD835\uDDD1',
  '\\mathsf{y}': '\uD835\uDDD2',
  '\\mathsf{z}': '\uD835\uDDD3',
  '\\mathsfbf{A}': '\uD835\uDF70',
  '\\mathsfbf{B}': '\uD835\uDF71',
  '\\mathsfbf{C}': '\uD835\uDDD6',
  '\\mathsfbf{D}': '\uD835\uDDD7',
  '\\mathsfbf{E}': '\uD835\uDF74',
  '\\mathsfbf{F}': '\uD835\uDDD9',
  '\\mathsfbf{G}': '\uD835\uDDDA',
  '\\mathsfbf{H}': '\uD835\uDF76',
  '\\mathsfbf{I}': '\uD835\uDF78',
  '\\mathsfbf{J}': '\uD835\uDDDD',
  '\\mathsfbf{K}': '\uD835\uDF79',
  '\\mathsfbf{L}': '\uD835\uDDDF',
  '\\mathsfbf{M}': '\uD835\uDDE0',
  '\\mathsfbf{N}': '\uD835\uDDE1',
  '\\mathsfbf{O}': '\uD835\uDDE2',
  '\\mathsfbf{P}': '\uD835\uDF80',
  '\\mathsfbf{Q}': '\uD835\uDDE4',
  '\\mathsfbf{R}': '\uD835\uDDE5',
  '\\mathsfbf{S}': '\uD835\uDDE6',
  '\\mathsfbf{T}': '\uD835\uDF83',
  '\\mathsfbf{U}': '\uD835\uDDE8',
  '\\mathsfbf{V}': '\uD835\uDDE9',
  '\\mathsfbf{W}': '\uD835\uDDEA',
  '\\mathsfbf{X}': '\uD835\uDF86',
  '\\mathsfbf{Y}': '\uD835\uDDEC',
  '\\mathsfbf{Z}': '\uD835\uDF75',
  '\\mathsfbf{a}': '\uD835\uDDEE',
  '\\mathsfbf{b}': '\uD835\uDDEF',
  '\\mathsfbf{c}': '\uD835\uDDF0',
  '\\mathsfbf{d}': '\uD835\uDDF1',
  '\\mathsfbf{e}': '\uD835\uDDF2',
  '\\mathsfbf{f}': '\uD835\uDDF3',
  '\\mathsfbf{g}': '\uD835\uDDF4',
  '\\mathsfbf{h}': '\uD835\uDDF5',
  '\\mathsfbf{i}': '\uD835\uDDF6',
  '\\mathsfbf{j}': '\uD835\uDDF7',
  '\\mathsfbf{k}': '\uD835\uDDF8',
  '\\mathsfbf{l}': '\uD835\uDDF9',
  '\\mathsfbf{m}': '\uD835\uDDFA',
  '\\mathsfbf{n}': '\uD835\uDDFB',
  '\\mathsfbf{o}': '\uD835\uDDFC',
  '\\mathsfbf{p}': '\uD835\uDDFD',
  '\\mathsfbf{q}': '\uD835\uDDFE',
  '\\mathsfbf{r}': '\uD835\uDDFF',
  '\\mathsfbf{s}': '\uD835\uDE00',
  '\\mathsfbf{t}': '\uD835\uDE01',
  '\\mathsfbf{u}': '\uD835\uDE02',
  '\\mathsfbf{v}': '\uD835\uDE03',
  '\\mathsfbf{w}': '\uD835\uDE04',
  '\\mathsfbf{x}': '\uD835\uDE05',
  '\\mathsfbf{y}': '\uD835\uDE06',
  '\\mathsfbf{z}': '\uD835\uDE07',
  '\\mathsfsl{A}': '\uD835\uDE08',
  '\\mathsfsl{B}': '\uD835\uDE09',
  '\\mathsfsl{C}': '\uD835\uDE0A',
  '\\mathsfsl{D}': '\uD835\uDE0B',
  '\\mathsfsl{E}': '\uD835\uDE0C',
  '\\mathsfsl{F}': '\uD835\uDE0D',
  '\\mathsfsl{G}': '\uD835\uDE0E',
  '\\mathsfsl{H}': '\uD835\uDE0F',
  '\\mathsfsl{I}': '\uD835\uDE10',
  '\\mathsfsl{J}': '\uD835\uDE11',
  '\\mathsfsl{K}': '\uD835\uDE12',
  '\\mathsfsl{L}': '\uD835\uDE13',
  '\\mathsfsl{M}': '\uD835\uDE14',
  '\\mathsfsl{N}': '\uD835\uDE15',
  '\\mathsfsl{O}': '\uD835\uDE16',
  '\\mathsfsl{P}': '\uD835\uDE17',
  '\\mathsfsl{Q}': '\uD835\uDE18',
  '\\mathsfsl{R}': '\uD835\uDE19',
  '\\mathsfsl{S}': '\uD835\uDE1A',
  '\\mathsfsl{T}': '\uD835\uDE1B',
  '\\mathsfsl{U}': '\uD835\uDE1C',
  '\\mathsfsl{V}': '\uD835\uDE1D',
  '\\mathsfsl{W}': '\uD835\uDE1E',
  '\\mathsfsl{X}': '\uD835\uDE1F',
  '\\mathsfsl{Y}': '\uD835\uDE20',
  '\\mathsfsl{Z}': '\uD835\uDE21',
  '\\mathsfsl{a}': '\uD835\uDE22',
  '\\mathsfsl{b}': '\uD835\uDE23',
  '\\mathsfsl{c}': '\uD835\uDE24',
  '\\mathsfsl{d}': '\uD835\uDE25',
  '\\mathsfsl{e}': '\uD835\uDE26',
  '\\mathsfsl{f}': '\uD835\uDE27',
  '\\mathsfsl{g}': '\uD835\uDE28',
  '\\mathsfsl{h}': '\uD835\uDE29',
  '\\mathsfsl{i}': '\uD835\uDE2A',
  '\\mathsfsl{j}': '\uD835\uDE2B',
  '\\mathsfsl{k}': '\uD835\uDE2C',
  '\\mathsfsl{l}': '\uD835\uDE2D',
  '\\mathsfsl{m}': '\uD835\uDE2E',
  '\\mathsfsl{n}': '\uD835\uDE2F',
  '\\mathsfsl{o}': '\uD835\uDE30',
  '\\mathsfsl{p}': '\uD835\uDE31',
  '\\mathsfsl{q}': '\uD835\uDE32',
  '\\mathsfsl{r}': '\uD835\uDE33',
  '\\mathsfsl{s}': '\uD835\uDE34',
  '\\mathsfsl{t}': '\uD835\uDE35',
  '\\mathsfsl{u}': '\uD835\uDE36',
  '\\mathsfsl{v}': '\uD835\uDE37',
  '\\mathsfsl{w}': '\uD835\uDE38',
  '\\mathsfsl{x}': '\uD835\uDE39',
  '\\mathsfsl{y}': '\uD835\uDE3A',
  '\\mathsfsl{z}': '\uD835\uDE3B',
  '\\mathsfbfsl{A}': '\uD835\uDFAA',
  '\\mathsfbfsl{B}': '\uD835\uDFAB',
  '\\mathsfbfsl{C}': '\uD835\uDE3E',
  '\\mathsfbfsl{D}': '\uD835\uDE3F',
  '\\mathsfbfsl{E}': '\uD835\uDFAE',
  '\\mathsfbfsl{F}': '\uD835\uDE41',
  '\\mathsfbfsl{G}': '\uD835\uDE42',
  '\\mathsfbfsl{H}': '\uD835\uDFB0',
  '\\mathsfbfsl{I}': '\uD835\uDFB2',
  '\\mathsfbfsl{J}': '\uD835\uDE45',
  '\\mathsfbfsl{K}': '\uD835\uDFB3',
  '\\mathsfbfsl{L}': '\uD835\uDE47',
  '\\mathsfbfsl{M}': '\uD835\uDE48',
  '\\mathsfbfsl{N}': '\uD835\uDE49',
  '\\mathsfbfsl{O}': '\uD835\uDE4A',
  '\\mathsfbfsl{P}': '\uD835\uDFBA',
  '\\mathsfbfsl{Q}': '\uD835\uDE4C',
  '\\mathsfbfsl{R}': '\uD835\uDE4D',
  '\\mathsfbfsl{S}': '\uD835\uDE4E',
  '\\mathsfbfsl{T}': '\uD835\uDFBD',
  '\\mathsfbfsl{U}': '\uD835\uDE50',
  '\\mathsfbfsl{V}': '\uD835\uDE51',
  '\\mathsfbfsl{W}': '\uD835\uDE52',
  '\\mathsfbfsl{X}': '\uD835\uDFC0',
  '\\mathsfbfsl{Y}': '\uD835\uDE54',
  '\\mathsfbfsl{Z}': '\uD835\uDFAF',
  '\\mathsfbfsl{a}': '\uD835\uDE56',
  '\\mathsfbfsl{b}': '\uD835\uDE57',
  '\\mathsfbfsl{c}': '\uD835\uDE58',
  '\\mathsfbfsl{d}': '\uD835\uDE59',
  '\\mathsfbfsl{e}': '\uD835\uDE5A',
  '\\mathsfbfsl{f}': '\uD835\uDE5B',
  '\\mathsfbfsl{g}': '\uD835\uDE5C',
  '\\mathsfbfsl{h}': '\uD835\uDE5D',
  '\\mathsfbfsl{i}': '\uD835\uDE5E',
  '\\mathsfbfsl{j}': '\uD835\uDE5F',
  '\\mathsfbfsl{k}': '\uD835\uDE60',
  '\\mathsfbfsl{l}': '\uD835\uDE61',
  '\\mathsfbfsl{m}': '\uD835\uDE62',
  '\\mathsfbfsl{n}': '\uD835\uDE63',
  '\\mathsfbfsl{o}': '\uD835\uDE64',
  '\\mathsfbfsl{p}': '\uD835\uDE65',
  '\\mathsfbfsl{q}': '\uD835\uDE66',
  '\\mathsfbfsl{r}': '\uD835\uDE67',
  '\\mathsfbfsl{s}': '\uD835\uDE68',
  '\\mathsfbfsl{t}': '\uD835\uDE69',
  '\\mathsfbfsl{u}': '\uD835\uDE6A',
  '\\mathsfbfsl{v}': '\uD835\uDE6B',
  '\\mathsfbfsl{w}': '\uD835\uDE6C',
  '\\mathsfbfsl{x}': '\uD835\uDE6D',
  '\\mathsfbfsl{y}': '\uD835\uDE6E',
  '\\mathsfbfsl{z}': '\uD835\uDE6F',
  '\\mathtt{A}': '\uD835\uDE70',
  '\\mathtt{B}': '\uD835\uDE71',
  '\\mathtt{C}': '\uD835\uDE72',
  '\\mathtt{D}': '\uD835\uDE73',
  '\\mathtt{E}': '\uD835\uDE74',
  '\\mathtt{F}': '\uD835\uDE75',
  '\\mathtt{G}': '\uD835\uDE76',
  '\\mathtt{H}': '\uD835\uDE77',
  '\\mathtt{I}': '\uD835\uDE78',
  '\\mathtt{J}': '\uD835\uDE79',
  '\\mathtt{K}': '\uD835\uDE7A',
  '\\mathtt{L}': '\uD835\uDE7B',
  '\\mathtt{M}': '\uD835\uDE7C',
  '\\mathtt{N}': '\uD835\uDE7D',
  '\\mathtt{O}': '\uD835\uDE7E',
  '\\mathtt{P}': '\uD835\uDE7F',
  '\\mathtt{Q}': '\uD835\uDE80',
  '\\mathtt{R}': '\uD835\uDE81',
  '\\mathtt{S}': '\uD835\uDE82',
  '\\mathtt{T}': '\uD835\uDE83',
  '\\mathtt{U}': '\uD835\uDE84',
  '\\mathtt{V}': '\uD835\uDE85',
  '\\mathtt{W}': '\uD835\uDE86',
  '\\mathtt{X}': '\uD835\uDE87',
  '\\mathtt{Y}': '\uD835\uDE88',
  '\\mathtt{Z}': '\uD835\uDE89',
  '\\mathtt{a}': '\uD835\uDE8A',
  '\\mathtt{b}': '\uD835\uDE8B',
  '\\mathtt{c}': '\uD835\uDE8C',
  '\\mathtt{d}': '\uD835\uDE8D',
  '\\mathtt{e}': '\uD835\uDE8E',
  '\\mathtt{f}': '\uD835\uDE8F',
  '\\mathtt{g}': '\uD835\uDE90',
  '\\mathtt{h}': '\uD835\uDE91',
  '\\mathtt{i}': '\uD835\uDE92',
  '\\mathtt{j}': '\uD835\uDE93',
  '\\mathtt{k}': '\uD835\uDE94',
  '\\mathtt{l}': '\uD835\uDE95',
  '\\mathtt{m}': '\uD835\uDE96',
  '\\mathtt{n}': '\uD835\uDE97',
  '\\mathtt{o}': '\uD835\uDE98',
  '\\mathtt{p}': '\uD835\uDE99',
  '\\mathtt{q}': '\uD835\uDE9A',
  '\\mathtt{r}': '\uD835\uDE9B',
  '\\mathtt{s}': '\uD835\uDE9C',
  '\\mathtt{t}': '\uD835\uDE9D',
  '\\mathtt{u}': '\uD835\uDE9E',
  '\\mathtt{v}': '\uD835\uDE9F',
  '\\mathtt{w}': '\uD835\uDEA0',
  '\\mathtt{x}': '\uD835\uDEA1',
  '\\mathtt{y}': '\uD835\uDEA2',
  '\\mathtt{z}': '\uD835\uDEA3',
  '\\mathbf{\\Gamma}': '\uD835\uDEC4',
  '\\mathbf{\\Delta}': '\uD835\uDEC5',
  '\\mathbf{\\Theta}': '\uD835\uDEAF',
  '\\mathbf{\\Lambda}': '\uD835\uDECC',
  '\\mathbf{\\Xi}': '\uD835\uDECF',
  '\\mathbf{\\Pi}': '\uD835\uDED1',
  '\\mathbf{\\vartheta}': '\uD835\uDEDD',
  '\\mathbf{\\Sigma}': '\uD835\uDED4',
  '\\mathbf{\\Upsilon}': '\uD835\uDED6',
  '\\mathbf{\\Phi}': '\uD835\uDED7',
  '\\mathbf{\\Psi}': '\uD835\uDED9',
  '\\mathbf{\\Omega}': '\uD835\uDEDA',
  '\\mathbf{\\nabla}': '\uD835\uDEC1',
  '\\mathbf{\\theta}': '\uD835\uDEC9',
  '\\mathbf{\\varsigma}': '\uD835\uDED3',
  '\\mathbf{\\varkappa}': '\uD835\uDEDE',
  '\\mathbf{\\phi}': '\uD835\uDEDF',
  '\\mathbf{\\varrho}': '\uD835\uDEE0',
  '\\mathbf{\\varpi}': '\uD835\uDEE1',
  '\\mathsl{\\Gamma}': '\uD835\uDEFE',
  '\\mathsl{\\Delta}': '\uD835\uDEFF',
  '\\mathsl{\\Theta}': '\uD835\uDF03',
  '\\mathsl{\\Lambda}': '\uD835\uDF06',
  '\\mathsl{\\Xi}': '\uD835\uDF09',
  '\\mathsl{\\Pi}': '\uD835\uDF0B',
  '\\mathsl{\\vartheta}': '\uD835\uDF17',
  '\\mathsl{\\Sigma}': '\uD835\uDF0E',
  '\\mathsl{\\Upsilon}': '\uD835\uDF10',
  '\\mathsl{\\Phi}': '\uD835\uDF11',
  '\\mathsl{\\Psi}': '\uD835\uDF13',
  '\\mathsl{\\Omega}': '\uD835\uDF14',
  '\\mathsl{\\nabla}': '\uD835\uDEFB',
  '\\mathsl{\\varsigma}': '\uD835\uDF0D',
  '\\mathsl{\\varkappa}': '\uD835\uDF18',
  '\\mathsl{\\phi}': '\uD835\uDF19',
  '\\mathsl{\\varrho}': '\uD835\uDF1A',
  '\\mathsl{\\varpi}': '\uD835\uDF1B',
  '\\mathbit{\\Gamma}': '\uD835\uDF38',
  '\\mathbit{\\Delta}': '\uD835\uDF39',
  '\\mathbit{\\Theta}': '\uD835\uDF3D',
  '\\mathbit{\\Lambda}': '\uD835\uDF40',
  '\\mathbit{\\Xi}': '\uD835\uDF43',
  '\\mathbit{\\Pi}': '\uD835\uDF45',
  '\\mathbit{\\Sigma}': '\uD835\uDF48',
  '\\mathbit{\\Upsilon}': '\uD835\uDF4A',
  '\\mathbit{\\Phi}': '\uD835\uDF4B',
  '\\mathbit{\\Psi}': '\uD835\uDF4D',
  '\\mathbit{\\Omega}': '\uD835\uDF4E',
  '\\mathbit{\\nabla}': '\uD835\uDF35',
  '\\mathbit{\\varsigma}': '\uD835\uDF47',
  '\\mathbit{\\vartheta}': '\uD835\uDF51',
  '\\mathbit{\\varkappa}': '\uD835\uDF52',
  '\\mathbit{\\phi}': '\uD835\uDF53',
  '\\mathbit{\\varrho}': '\uD835\uDF54',
  '\\mathbit{\\varpi}': '\uD835\uDF55',
  '\\mathsfbf{\\Gamma}': '\uD835\uDF72',
  '\\mathsfbf{\\Delta}': '\uD835\uDF73',
  '\\mathsfbf{\\Theta}': '\uD835\uDF77',
  '\\mathsfbf{\\Lambda}': '\uD835\uDF7A',
  '\\mathsfbf{\\Xi}': '\uD835\uDF7D',
  '\\mathsfbf{\\Pi}': '\uD835\uDF7F',
  '\\mathsfbf{\\vartheta}': '\uD835\uDF8B',
  '\\mathsfbf{\\Sigma}': '\uD835\uDF82',
  '\\mathsfbf{\\Upsilon}': '\uD835\uDF84',
  '\\mathsfbf{\\Phi}': '\uD835\uDF85',
  '\\mathsfbf{\\Psi}': '\uD835\uDF87',
  '\\mathsfbf{\\Omega}': '\uD835\uDF88',
  '\\mathsfbf{\\nabla}': '\uD835\uDF6F',
  '\\mathsfbf{\\varsigma}': '\uD835\uDF81',
  '\\mathsfbf{\\varkappa}': '\uD835\uDF8C',
  '\\mathsfbf{\\phi}': '\uD835\uDF8D',
  '\\mathsfbf{\\varrho}': '\uD835\uDF8E',
  '\\mathsfbf{\\varpi}': '\uD835\uDF8F',
  '\\mathsfbfsl{\\Gamma}': '\uD835\uDFAC',
  '\\mathsfbfsl{\\Delta}': '\uD835\uDFAD',
  '\\mathsfbfsl{\\vartheta}': '\uD835\uDFC5',
  '\\mathsfbfsl{\\Lambda}': '\uD835\uDFB4',
  '\\mathsfbfsl{\\Xi}': '\uD835\uDFB7',
  '\\mathsfbfsl{\\Pi}': '\uD835\uDFB9',
  '\\mathsfbfsl{\\Sigma}': '\uD835\uDFBC',
  '\\mathsfbfsl{\\Upsilon}': '\uD835\uDFBE',
  '\\mathsfbfsl{\\Phi}': '\uD835\uDFBF',
  '\\mathsfbfsl{\\Psi}': '\uD835\uDFC1',
  '\\mathsfbfsl{\\Omega}': '\uD835\uDFC2',
  '\\mathsfbfsl{\\nabla}': '\uD835\uDFA9',
  '\\mathsfbfsl{\\varsigma}': '\uD835\uDFBB',
  '\\mathsfbfsl{\\varkappa}': '\uD835\uDFC6',
  '\\mathsfbfsl{\\phi}': '\uD835\uDFC7',
  '\\mathsfbfsl{\\varrho}': '\uD835\uDFC8',
  '\\mathsfbfsl{\\varpi}': '\uD835\uDFC9',
  '\\mbfDigamma': '\uD835\uDFCA',
  '\\mbfdigamma': '\uD835\uDFCB',
  '\\mathbf{0}': '\uD835\uDFCE',
  '\\mathbf{1}': '\uD835\uDFCF',
  '\\mathbf{2}': '\uD835\uDFD0',
  '\\mathbf{3}': '\uD835\uDFD1',
  '\\mathbf{4}': '\uD835\uDFD2',
  '\\mathbf{5}': '\uD835\uDFD3',
  '\\mathbf{6}': '\uD835\uDFD4',
  '\\mathbf{7}': '\uD835\uDFD5',
  '\\mathbf{8}': '\uD835\uDFD6',
  '\\mathbf{9}': '\uD835\uDFD7',
  '\\mathbb{0}': '\uD835\uDFD8',
  '\\mathbb{1}': '\uD835\uDFD9',
  '\\mathbb{2}': '\uD835\uDFDA',
  '\\mathbb{3}': '\uD835\uDFDB',
  '\\mathbb{4}': '\uD835\uDFDC',
  '\\mathbb{5}': '\uD835\uDFDD',
  '\\mathbb{6}': '\uD835\uDFDE',
  '\\mathbb{7}': '\uD835\uDFDF',
  '\\mathbb{8}': '\uD835\uDFE0',
  '\\mathbb{9}': '\uD835\uDFE1',
  '\\mathsf{0}': '\uD835\uDFE2',
  '\\mathsf{1}': '\uD835\uDFE3',
  '\\mathsf{2}': '\uD835\uDFE4',
  '\\mathsf{3}': '\uD835\uDFE5',
  '\\mathsf{4}': '\uD835\uDFE6',
  '\\mathsf{5}': '\uD835\uDFE7',
  '\\mathsf{6}': '\uD835\uDFE8',
  '\\mathsf{7}': '\uD835\uDFE9',
  '\\mathsf{8}': '\uD835\uDFEA',
  '\\mathsf{9}': '\uD835\uDFEB',
  '\\mathsfbf{0}': '\uD835\uDFEC',
  '\\mathsfbf{1}': '\uD835\uDFED',
  '\\mathsfbf{2}': '\uD835\uDFEE',
  '\\mathsfbf{3}': '\uD835\uDFEF',
  '\\mathsfbf{4}': '\uD835\uDFF0',
  '\\mathsfbf{5}': '\uD835\uDFF1',
  '\\mathsfbf{6}': '\uD835\uDFF2',
  '\\mathsfbf{7}': '\uD835\uDFF3',
  '\\mathsfbf{8}': '\uD835\uDFF4',
  '\\mathsfbf{9}': '\uD835\uDFF5',
  '\\mathtt{0}': '\uD835\uDFF6',
  '\\mathtt{1}': '\uD835\uDFF7',
  '\\mathtt{2}': '\uD835\uDFF8',
  '\\mathtt{3}': '\uD835\uDFF9',
  '\\mathtt{4}': '\uD835\uDFFA',
  '\\mathtt{5}': '\uD835\uDFFB',
  '\\mathtt{6}': '\uD835\uDFFC',
  '\\mathtt{7}': '\uD835\uDFFD',
  '\\mathtt{8}': '\uD835\uDFFE',
  '\\mathtt{9}': '\uD835\uDFFF',
  '\\t{ia}': 'i\uFE20a\uFE21',
  '\\textmu{}': '\u03BC',
  '\\to{}': '\u2192',
  '\\varGamma{}': '\u0393',
  '\\ocirc{u}': '\u016F',
  '\\textless{}': '<',
  '\\textgreater{}': '>',
  '{\\~ w}': 'w\u0303',
  '\\textasciitilde{}': '~',
  '\\LaTeX{}': 'LaTeX',
  '{\\c e}': '\u1E1D',
  '\\neg{}': '\xAC',
  '\\Box{}': '\u25A1',
  '\\le{}': '\u2264',
  '\\\'\\i': '\xED',
  '\\relax': '\u200C'
}

/***/ }),

/***/ "../node_modules/astrocite-bibtex/lib/grammar.js":
/*!*******************************************************!*\
  !*** ../node_modules/astrocite-bibtex/lib/grammar.js ***!
  \*******************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */

function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
}
function peg$SyntaxError(message, expected, found, location) {
    this.message = message;
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = "SyntaxError";
    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, peg$SyntaxError);
    }
}
peg$subclass(peg$SyntaxError, Error);
peg$SyntaxError.buildMessage = function (expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
        literal: function (expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
        },
        "class": function (expectation) {
            var escapedParts = "", i;
            for (i = 0; i < expectation.parts.length; i++) {
                escapedParts += expectation.parts[i] instanceof Array
                    ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                    : classEscape(expectation.parts[i]);
            }
            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },
        any: function (expectation) {
            return "any character";
        },
        end: function (expectation) {
            return "end of input";
        },
        other: function (expectation) {
            return expectation.description;
        }
    };
    function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
    }
    function literalEscape(s) {
        return s
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\0/g, '\\0')
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/[\x00-\x0F]/g, function (ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return '\\x' + hex(ch); });
    }
    function classEscape(s) {
        return s
            .replace(/\\/g, '\\\\')
            .replace(/\]/g, '\\]')
            .replace(/\^/g, '\\^')
            .replace(/-/g, '\\-')
            .replace(/\0/g, '\\0')
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/[\x00-\x0F]/g, function (ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return '\\x' + hex(ch); });
    }
    function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected) {
        var descriptions = new Array(expected.length), i, j;
        for (i = 0; i < expected.length; i++) {
            descriptions[i] = describeExpectation(expected[i]);
        }
        descriptions.sort();
        if (descriptions.length > 0) {
            for (i = 1, j = 1; i < descriptions.length; i++) {
                if (descriptions[i - 1] !== descriptions[i]) {
                    descriptions[j] = descriptions[i];
                    j++;
                }
            }
            descriptions.length = j;
        }
        switch (descriptions.length) {
            case 1:
                return descriptions[0];
            case 2:
                return descriptions[0] + " or " + descriptions[1];
            default:
                return descriptions.slice(0, -1).join(", ")
                    + ", or "
                    + descriptions[descriptions.length - 1];
        }
    }
    function describeFound(found) {
        return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse(input, options) {
    options = options !== void 0 ? options : {};
    var peg$FAILED = {}, peg$startRuleFunctions = { File: peg$parseFile }, peg$startRuleFunction = peg$parseFile, peg$c0 = function (r) {
        return {
            kind: 'File',
            loc: location(),
            children: r,
        };
    }, peg$c1 = "@comment", peg$c2 = peg$literalExpectation("@comment", true), peg$c3 = function (v) {
        return {
            kind: 'BracedComment',
            loc: location(),
            value: v.slice(1, -1),
        };
    }, peg$c4 = /^[^\n\r]/, peg$c5 = peg$classExpectation(["\n", "\r"], true, false), peg$c6 = /^[\n\r]/, peg$c7 = peg$classExpectation(["\n", "\r"], false, false), peg$c8 = function (v) {
        return {
            kind: 'LineComment',
            loc: location(),
            value: simpleLatexConversions(normalizeWhitespace(v)),
        };
    }, peg$c9 = /^[^@]/, peg$c10 = peg$classExpectation(["@"], true, false), peg$c11 = function (v) {
        return {
            kind: 'NonEntryText',
            loc: location(),
            value: simpleLatexConversions(normalizeWhitespace(v)),
        };
    }, peg$c12 = function (n) { return n; }, peg$c13 = "{", peg$c14 = peg$literalExpectation("{", false), peg$c15 = /^[^{}]/, peg$c16 = peg$classExpectation(["{", "}"], true, false), peg$c17 = "}", peg$c18 = peg$literalExpectation("}", false), peg$c19 = function (comment) { return '{' + comment.join('') + '}'; }, peg$c20 = "@", peg$c21 = peg$literalExpectation("@", false), peg$c22 = /^[A-Za-z]/, peg$c23 = peg$classExpectation([["A", "Z"], ["a", "z"]], false, false), peg$c24 = /^[({]/, peg$c25 = peg$classExpectation(["(", "{"], false, false), peg$c26 = /^[})]/, peg$c27 = peg$classExpectation(["}", ")"], false, false), peg$c28 = function (type, id, props) {
        return {
            kind: 'Entry',
            id: id || '',
            type: type.toLowerCase(),
            loc: location(),
            properties: props,
        };
    }, peg$c29 = "@preamble", peg$c30 = peg$literalExpectation("@preamble", true), peg$c31 = function (v) {
        return {
            kind: 'PreambleExpression',
            loc: location(),
            value: v.reduce(function (a, b) { return a.concat(b); }, []),
        };
    }, peg$c32 = "@string", peg$c33 = peg$literalExpectation("@string", true), peg$c34 = function (k, v) {
        return {
            kind: 'StringExpression',
            loc: location(),
            key: k,
            value: v.reduce(function (a, b) { return a.concat(b); }, []),
        };
    }, peg$c35 = /^[^ \t\r\n,]/, peg$c36 = peg$classExpectation([" ", "\t", "\r", "\n", ","], true, false), peg$c37 = ",", peg$c38 = peg$literalExpectation(",", false), peg$c39 = function (id) { return id; }, peg$c40 = function (k) { verbatim.property = k; return true; }, peg$c41 = function (k, v) { return verbatim.leaveProperty(); }, peg$c42 = function (k, v) {
        return {
            kind: 'Property',
            loc: location(),
            key: k.toLowerCase(),
            value: v,
        };
    }, peg$c43 = /^[_:a-zA-Z0-9\-]/, peg$c44 = peg$classExpectation(["_", ":", ["a", "z"], ["A", "Z"], ["0", "9"], "-"], false, false), peg$c45 = function (k) { return k; }, peg$c46 = function (v) {
        return v.reduce(function (a, b) { return a.concat(b); }, []);
    }, peg$c47 = "\"", peg$c48 = peg$literalExpectation("\"", false), peg$c49 = function () { return verbatim.enterProperty('"'); }, peg$c50 = function (v) { return v; }, peg$c51 = function () { return verbatim.enterProperty('{}'); }, peg$c52 = function () { return verbatim.active && verbatim.closer === '"'; }, peg$c53 = /^[^"]/, peg$c54 = peg$classExpectation(["\""], true, false), peg$c55 = function (v) {
        return {
            kind: 'Text',
            loc: location(),
            value: simpleLatexConversions(normalizeWhitespace(v)),
        };
    }, peg$c56 = function () { return verbatim.active && verbatim.closer === '{}'; }, peg$c57 = /^[^\^_${}\\]/, peg$c58 = peg$classExpectation(["^", "_", "$", "{", "}", "\\"], true, false), peg$c59 = /^[^\^_${}"\\]/, peg$c60 = peg$classExpectation(["^", "_", "$", "{", "}", "\"", "\\"], true, false), peg$c61 = /^[0-9]/, peg$c62 = peg$classExpectation([["0", "9"]], false, false), peg$c63 = function (v) {
        return {
            kind: 'Number',
            loc: location(),
            value: parseInt(v, 10),
        };
    }, peg$c64 = function (v) {
        return {
            kind: 'String',
            loc: location(),
            value: v,
        };
    }, peg$c65 = "{\\", peg$c66 = peg$literalExpectation("{\\", false), peg$c67 = " ", peg$c68 = peg$literalExpectation(" ", false), peg$c69 = /^[a-zA-Z0-9]/, peg$c70 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"]], false, false), peg$c71 = "\\", peg$c72 = peg$literalExpectation("\\", false), peg$c73 = /^[ij]/, peg$c74 = peg$classExpectation(["i", "j"], false, false), peg$c75 = function (mark, char) {
        return {
            kind: 'DicraticalCommand',
            loc: location(),
            mark: mark,
            dotless: !!char[1],
            character: char[1] || char[0],
        };
    }, peg$c76 = function (v) {
        return {
            kind: 'NestedLiteral',
            loc: location(),
            value: v,
        };
    }, peg$c77 = "%", peg$c78 = peg$literalExpectation("%", false), peg$c79 = /^[^\r\n]/, peg$c80 = peg$classExpectation(["\r", "\n"], true, false), peg$c81 = function (v) {
        return {
            kind: 'LineComment',
            loc: location(),
            value: v,
        };
    }, peg$c82 = /^[_\^]/, peg$c83 = peg$classExpectation(["_", "^"], false, false), peg$c84 = function (mode, v) {
        return {
            kind: (mode === '_' ? 'Sub' : 'Super') + 'scriptCommand',
            loc: location(),
            value: v
        };
    }, peg$c85 = peg$anyExpectation(), peg$c86 = function (mark, char) {
        return {
            kind: 'DicraticalCommand',
            loc: location(),
            mark: mark,
            dotless: !!char[1],
            character: char[1] || char[0],
        };
    }, peg$c87 = "$", peg$c88 = peg$literalExpectation("$", false), peg$c89 = function () {
        return {
            kind: 'MathMode',
            loc: location(),
            value: '$',
        };
    }, peg$c90 = /^[^A-Za-z0-9\t\r\n]/, peg$c91 = peg$classExpectation([["A", "Z"], ["a", "z"], ["0", "9"], "\t", "\r", "\n"], true, false), peg$c92 = function (v) {
        return {
            kind: 'SymbolCommand',
            loc: location(),
            value: v,
        };
    }, peg$c93 = function (v) { return verbatim.enterCommand(v); }, peg$c94 = function (v, args) { return verbatim.leaveCommand(v); }, peg$c95 = function (v, args) {
        return {
            kind: 'RegularCommand',
            loc: location(),
            value: v,
            arguments: args,
        };
    }, peg$c96 = "[", peg$c97 = peg$literalExpectation("[", false), peg$c98 = /^[^\]]/, peg$c99 = peg$classExpectation(["]"], true, false), peg$c100 = "]", peg$c101 = peg$literalExpectation("]", false), peg$c102 = function (v) {
        return {
            kind: 'OptionalArgument',
            loc: location(),
            value: v,
        };
    }, peg$c103 = function (v) {
        return {
            kind: 'RequiredArgument',
            loc: location(),
            value: v,
        };
    }, peg$c104 = /^[a-zA-Z\-_]/, peg$c105 = peg$classExpectation([["a", "z"], ["A", "Z"], "-", "_"], false, false), peg$c106 = /^[a-zA-Z0-9\-&_:]/, peg$c107 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "-", "&", "_", ":"], false, false), peg$c108 = /^['`"=~\^.]/, peg$c109 = peg$classExpectation(["'", "`", "\"", "=", "~", "^", "."], false, false), peg$c110 = /^['`"=~\^.cbuvdrHk]/, peg$c111 = peg$classExpectation(["'", "`", "\"", "=", "~", "^", ".", "c", "b", "u", "v", "d", "r", "H", "k"], false, false), peg$c112 = "=", peg$c113 = peg$literalExpectation("=", false), peg$c114 = "#", peg$c115 = peg$literalExpectation("#", false), peg$c116 = /^[\r\n]/, peg$c117 = peg$classExpectation(["\r", "\n"], false, false), peg$c118 = peg$otherExpectation("Mandatory Horizontal Whitespace"), peg$c119 = /^[ \t]/, peg$c120 = peg$classExpectation([" ", "\t"], false, false), peg$c121 = peg$otherExpectation("Optional Horizontal Whitespace"), peg$c122 = peg$otherExpectation("Mandatory Vertical Whitespace"), peg$c123 = peg$otherExpectation("Optional Vertical Whitespace"), peg$c124 = peg$otherExpectation("Mandatory Whitespace"), peg$c125 = /^[ \t\n\r]/, peg$c126 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false), peg$c127 = peg$otherExpectation("Optional Whitespace"), peg$currPos = 0, peg$savedPos = 0, peg$posDetailsCache = [{ line: 1, column: 1 }], peg$maxFailPos = 0, peg$maxFailExpected = [], peg$silentFails = 0, peg$result;
    if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location) {
        location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location);
    }
    function error(message, location) {
        location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location);
    }
    function peg$literalExpectation(text, ignoreCase) {
        return { type: "literal", text: text, ignoreCase: ignoreCase };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }
    function peg$anyExpectation() {
        return { type: "any" };
    }
    function peg$endExpectation() {
        return { type: "end" };
    }
    function peg$otherExpectation(description) {
        return { type: "other", description: description };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos], p;
        if (details) {
            return details;
        }
        else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while (p < pos) {
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                }
                else {
                    details.column++;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos) {
        var startPosDetails = peg$computePosDetails(startPos), endPosDetails = peg$computePosDetails(endPos);
        return {
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column
            }
        };
    }
    function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
    }
    function peg$buildSimpleError(message, location) {
        return new peg$SyntaxError(message, null, null, location);
    }
    function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found), expected, found, location);
    }
    function peg$parseFile() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseNode();
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseNode();
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c0(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseComment() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 8).toLowerCase() === peg$c1) {
            s1 = input.substr(peg$currPos, 8);
            peg$currPos += 8;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c2);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__h();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseBracedComment();
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c3(s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 8).toLowerCase() === peg$c1) {
                s1 = input.substr(peg$currPos, 8);
                peg$currPos += 8;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c2);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse__h();
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    if (peg$c4.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c5);
                        }
                    }
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        if (peg$c4.test(input.charAt(peg$currPos))) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c5);
                            }
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = [];
                        if (peg$c6.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c7);
                            }
                        }
                        while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            if (peg$c6.test(input.charAt(peg$currPos))) {
                                s5 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c7);
                                }
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c8(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$currPos;
                if (peg$c9.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c10);
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    if (peg$c4.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c5);
                        }
                    }
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        if (peg$c4.test(input.charAt(peg$currPos))) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c5);
                            }
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s2 = [s2, s3];
                        s1 = s2;
                    }
                    else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
                if (s1 !== peg$FAILED) {
                    s2 = [];
                    if (peg$c6.test(input.charAt(peg$currPos))) {
                        s3 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c7);
                        }
                    }
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        if (peg$c6.test(input.charAt(peg$currPos))) {
                            s3 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c7);
                            }
                        }
                    }
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c11(s1);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
        }
        return s0;
    }
    function peg$parseNode() {
        var s0, s1;
        s0 = peg$currPos;
        s1 = peg$parseComment();
        if (s1 === peg$FAILED) {
            s1 = peg$parsePreambleExpression();
            if (s1 === peg$FAILED) {
                s1 = peg$parseStringExpression();
                if (s1 === peg$FAILED) {
                    s1 = peg$parseEntry();
                }
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c12(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseBracedComment() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c13;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c14);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$c15.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c16);
                }
            }
            if (s3 === peg$FAILED) {
                s3 = peg$parseBracedComment();
            }
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c15.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c16);
                    }
                }
                if (s3 === peg$FAILED) {
                    s3 = peg$parseBracedComment();
                }
            }
            if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                    s3 = peg$c17;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c18);
                    }
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c19(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseEntry() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 64) {
            s1 = peg$c20;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c21);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            if (peg$c22.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s4 !== peg$FAILED) {
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    if (peg$c22.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c23);
                        }
                    }
                }
            }
            else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s2 = input.substring(s2, peg$currPos);
            }
            else {
                s2 = s3;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    if (peg$c24.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c25);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s5 = peg$parse__();
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parseEntryId();
                            if (s6 === peg$FAILED) {
                                s6 = null;
                            }
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parse__();
                                if (s7 !== peg$FAILED) {
                                    s8 = [];
                                    s9 = peg$parseProperty();
                                    while (s9 !== peg$FAILED) {
                                        s8.push(s9);
                                        s9 = peg$parseProperty();
                                    }
                                    if (s8 !== peg$FAILED) {
                                        s9 = peg$parse__();
                                        if (s9 !== peg$FAILED) {
                                            if (peg$c26.test(input.charAt(peg$currPos))) {
                                                s10 = input.charAt(peg$currPos);
                                                peg$currPos++;
                                            }
                                            else {
                                                s10 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c27);
                                                }
                                            }
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse__();
                                                if (s11 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s1 = peg$c28(s2, s6, s8);
                                                    s0 = s1;
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsePreambleExpression() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 9).toLowerCase() === peg$c29) {
            s1 = input.substr(peg$currPos, 9);
            peg$currPos += 9;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c30);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__();
            if (s2 !== peg$FAILED) {
                if (peg$c24.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c25);
                    }
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse__();
                    if (s4 !== peg$FAILED) {
                        s5 = [];
                        s6 = peg$parseRegularValue();
                        while (s6 !== peg$FAILED) {
                            s5.push(s6);
                            s6 = peg$parseRegularValue();
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse__();
                            if (s6 !== peg$FAILED) {
                                if (peg$c26.test(input.charAt(peg$currPos))) {
                                    s7 = input.charAt(peg$currPos);
                                    peg$currPos++;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c27);
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse__();
                                    if (s8 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c31(s5);
                                        s0 = s1;
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseStringExpression() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 7).toLowerCase() === peg$c32) {
            s1 = input.substr(peg$currPos, 7);
            peg$currPos += 7;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c33);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__();
            if (s2 !== peg$FAILED) {
                if (peg$c24.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c25);
                    }
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse__();
                    if (s4 !== peg$FAILED) {
                        s5 = peg$parseVariableName();
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parsePropertySeparator();
                            if (s6 !== peg$FAILED) {
                                s7 = [];
                                s8 = peg$parseRegularValue();
                                if (s8 !== peg$FAILED) {
                                    while (s8 !== peg$FAILED) {
                                        s7.push(s8);
                                        s8 = peg$parseRegularValue();
                                    }
                                }
                                else {
                                    s7 = peg$FAILED;
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse__();
                                    if (s8 !== peg$FAILED) {
                                        if (peg$c26.test(input.charAt(peg$currPos))) {
                                            s9 = input.charAt(peg$currPos);
                                            peg$currPos++;
                                        }
                                        else {
                                            s9 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c27);
                                            }
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse__();
                                            if (s10 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c34(s5, s7);
                                                s0 = s1;
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseEntryId() {
        var s0, s1, s2, s3, s4;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            if (peg$c35.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c36);
                }
            }
            while (s4 !== peg$FAILED) {
                s3.push(s4);
                if (peg$c35.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c36);
                    }
                }
            }
            if (s3 !== peg$FAILED) {
                s2 = input.substring(s2, peg$currPos);
            }
            else {
                s2 = s3;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 44) {
                        s4 = peg$c37;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c38);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c39(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseProperty() {
        var s0, s1, s2, s3, s4, s5, s6;
        s0 = peg$currPos;
        s1 = peg$parsePropertyKey();
        if (s1 !== peg$FAILED) {
            s2 = peg$parsePropertySeparator();
            if (s2 !== peg$FAILED) {
                peg$savedPos = peg$currPos;
                s3 = peg$c40(s1);
                if (s3) {
                    s3 = void 0;
                }
                else {
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsePropertyValue();
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = peg$currPos;
                        s5 = peg$c41(s1, s4);
                        if (s5) {
                            s5 = void 0;
                        }
                        else {
                            s5 = peg$FAILED;
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parsePropertyTerminator();
                            if (s6 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c42(s1, s4);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsePropertyKey() {
        var s0, s1, s2, s3, s4;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            if (peg$c43.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c44);
                }
            }
            if (s4 !== peg$FAILED) {
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    if (peg$c43.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c44);
                        }
                    }
                }
            }
            else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s2 = input.substring(s2, peg$currPos);
            }
            else {
                s2 = s3;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c45(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsePropertyValue() {
        var s0, s1, s2;
        s0 = peg$parseNumber();
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parseRegularValue();
            if (s2 === peg$FAILED) {
                s2 = peg$parseStringValue();
            }
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$parseRegularValue();
                if (s2 === peg$FAILED) {
                    s2 = peg$parseStringValue();
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c46(s1);
            }
            s0 = s1;
        }
        return s0;
    }
    function peg$parseRegularValue() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
            s1 = peg$c47;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c48);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = peg$currPos;
            s2 = peg$c49();
            if (s2) {
                s2 = void 0;
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$parseNestedLiteral();
                if (s4 === peg$FAILED) {
                    s4 = peg$parseVerbatimText();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parseCommand();
                        if (s4 === peg$FAILED) {
                            s4 = peg$parseTextNoQuotes();
                        }
                    }
                }
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    s4 = peg$parseNestedLiteral();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parseVerbatimText();
                        if (s4 === peg$FAILED) {
                            s4 = peg$parseCommand();
                            if (s4 === peg$FAILED) {
                                s4 = peg$parseTextNoQuotes();
                            }
                        }
                    }
                }
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 34) {
                        s4 = peg$c47;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c48);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s5 = peg$parseConcat();
                        if (s5 === peg$FAILED) {
                            s5 = null;
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c50(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c13;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c14);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = peg$currPos;
                s2 = peg$c51();
                if (s2) {
                    s2 = void 0;
                }
                else {
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    s4 = peg$parseNestedLiteral();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parseVerbatimText();
                        if (s4 === peg$FAILED) {
                            s4 = peg$parseCommand();
                            if (s4 === peg$FAILED) {
                                s4 = peg$parseText();
                            }
                        }
                    }
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        s4 = peg$parseNestedLiteral();
                        if (s4 === peg$FAILED) {
                            s4 = peg$parseVerbatimText();
                            if (s4 === peg$FAILED) {
                                s4 = peg$parseCommand();
                                if (s4 === peg$FAILED) {
                                    s4 = peg$parseText();
                                }
                            }
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                            s4 = peg$c17;
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c18);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseConcat();
                            if (s5 === peg$FAILED) {
                                s5 = null;
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c50(s3);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseStringValue() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parseString();
        if (s1 !== peg$FAILED) {
            s2 = peg$parseConcat();
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c50(s1);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseVerbatimText() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        peg$savedPos = peg$currPos;
        s1 = peg$c52();
        if (s1) {
            s1 = void 0;
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$c53.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c54);
                }
            }
            if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    if (peg$c53.test(input.charAt(peg$currPos))) {
                        s3 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c54);
                        }
                    }
                }
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c55(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            peg$savedPos = peg$currPos;
            s1 = peg$c56();
            if (s1) {
                s1 = void 0;
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                if (peg$c15.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c16);
                    }
                }
                if (s3 !== peg$FAILED) {
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        if (peg$c15.test(input.charAt(peg$currPos))) {
                            s3 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c16);
                            }
                        }
                    }
                }
                else {
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c55(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseText() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        if (peg$c57.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c58);
            }
        }
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c57.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c58);
                    }
                }
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c55(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseTextNoQuotes() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        if (peg$c59.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c60);
            }
        }
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c59.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c60);
                    }
                }
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c55(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseNumber() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$c61.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c62);
            }
        }
        if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c61.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c62);
                    }
                }
            }
        }
        else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        }
        else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c63(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseString() {
        var s0, s1;
        s0 = peg$currPos;
        s1 = peg$parseVariableName();
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c64(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseNestedLiteral() {
        var s0, s1, s2, s3, s4, s5, s6;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c65) {
            s1 = peg$c65;
            peg$currPos += 2;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c66);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseExtendedDicratical();
            if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 32) {
                    s3 = peg$c67;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c68);
                    }
                }
                if (s3 !== peg$FAILED) {
                    if (peg$c69.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c70);
                        }
                    }
                    if (s4 === peg$FAILED) {
                        s4 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 92) {
                            s5 = peg$c71;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c72);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            if (peg$c73.test(input.charAt(peg$currPos))) {
                                s6 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s6 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c74);
                                }
                            }
                            if (s6 !== peg$FAILED) {
                                s5 = [s5, s6];
                                s4 = s5;
                            }
                            else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                            s5 = peg$c17;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c18);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c75(s2, s4);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c13;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c14);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parseVerbatimText();
                if (s3 === peg$FAILED) {
                    s3 = peg$parseText();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parseCommand();
                        if (s3 === peg$FAILED) {
                            s3 = peg$parseNestedLiteral();
                        }
                    }
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parseVerbatimText();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parseText();
                        if (s3 === peg$FAILED) {
                            s3 = peg$parseCommand();
                            if (s3 === peg$FAILED) {
                                s3 = peg$parseNestedLiteral();
                            }
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 125) {
                        s3 = peg$c17;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c18);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c76(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseLineComment() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
            s1 = peg$c77;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c78);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__h();
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                s4 = [];
                if (peg$c79.test(input.charAt(peg$currPos))) {
                    s5 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c80);
                    }
                }
                if (s5 !== peg$FAILED) {
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        if (peg$c79.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c80);
                            }
                        }
                    }
                }
                else {
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s3 = input.substring(s3, peg$currPos);
                }
                else {
                    s3 = s4;
                }
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseEOL();
                    if (s5 !== peg$FAILED) {
                        while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            s5 = peg$parseEOL();
                        }
                    }
                    else {
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c81(s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseCommand() {
        var s0;
        s0 = peg$parseScriptCommand();
        if (s0 === peg$FAILED) {
            s0 = peg$parseDicraticalCommand();
            if (s0 === peg$FAILED) {
                s0 = peg$parseRegularCommand();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseSymbolCommand();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseMathMode();
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseScriptCommand() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (peg$c82.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c83);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 123) {
                s3 = peg$c13;
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c14);
                }
            }
            peg$silentFails--;
            if (s3 !== peg$FAILED) {
                peg$currPos = s2;
                s2 = void 0;
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parseRegularValue();
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c84(s1, s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (peg$c82.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c83);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                if (input.charCodeAt(peg$currPos) === 92) {
                    s3 = peg$c71;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c72);
                    }
                }
                peg$silentFails--;
                if (s3 !== peg$FAILED) {
                    peg$currPos = s2;
                    s2 = void 0;
                }
                else {
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseCommand();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c84(s1, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (peg$c82.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c83);
                    }
                }
                if (s1 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c85);
                        }
                    }
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c84(s1, s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
        }
        return s0;
    }
    function peg$parseDicraticalCommand() {
        var s0, s1, s2, s3, s4, s5, s6;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
            s1 = peg$c71;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c72);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseSimpleDicratical();
            if (s2 !== peg$FAILED) {
                if (peg$c69.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c70);
                    }
                }
                if (s3 === peg$FAILED) {
                    s3 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 92) {
                        s4 = peg$c71;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c72);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        if (peg$c73.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c74);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s4 = [s4, s5];
                            s3 = s4;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c86(s2, s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 92) {
                s1 = peg$c71;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c72);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseExtendedDicratical();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 123) {
                        s3 = peg$c13;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c14);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        if (peg$c69.test(input.charAt(peg$currPos))) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c70);
                            }
                        }
                        if (s4 === peg$FAILED) {
                            s4 = peg$currPos;
                            if (input.charCodeAt(peg$currPos) === 92) {
                                s5 = peg$c71;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c72);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                if (peg$c73.test(input.charAt(peg$currPos))) {
                                    s6 = input.charAt(peg$currPos);
                                    peg$currPos++;
                                }
                                else {
                                    s6 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c74);
                                    }
                                }
                                if (s6 !== peg$FAILED) {
                                    s5 = [s5, s6];
                                    s4 = s5;
                                }
                                else {
                                    peg$currPos = s4;
                                    s4 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 125) {
                                s5 = peg$c17;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c18);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c75(s2, s4);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 92) {
                    s1 = peg$c71;
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c72);
                    }
                }
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseExtendedDicratical();
                    if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 32) {
                            s3 = peg$c67;
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c68);
                            }
                        }
                        if (s3 !== peg$FAILED) {
                            if (peg$c69.test(input.charAt(peg$currPos))) {
                                s4 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s4 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c70);
                                }
                            }
                            if (s4 === peg$FAILED) {
                                s4 = peg$currPos;
                                if (input.charCodeAt(peg$currPos) === 92) {
                                    s5 = peg$c71;
                                    peg$currPos++;
                                }
                                else {
                                    s5 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c72);
                                    }
                                }
                                if (s5 !== peg$FAILED) {
                                    if (peg$c73.test(input.charAt(peg$currPos))) {
                                        s6 = input.charAt(peg$currPos);
                                        peg$currPos++;
                                    }
                                    else {
                                        s6 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c74);
                                        }
                                    }
                                    if (s6 !== peg$FAILED) {
                                        s5 = [s5, s6];
                                        s4 = s5;
                                    }
                                    else {
                                        peg$currPos = s4;
                                        s4 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s4;
                                    s4 = peg$FAILED;
                                }
                            }
                            if (s4 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c75(s2, s4);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
        }
        return s0;
    }
    function peg$parseMathMode() {
        var s0, s1;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 36) {
            s1 = peg$c87;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c88);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c89();
        }
        s0 = s1;
        return s0;
    }
    function peg$parseSymbolCommand() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
            s1 = peg$c71;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c72);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            if (peg$c90.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c91);
                }
            }
            if (s3 !== peg$FAILED) {
                s2 = input.substring(s2, peg$currPos);
            }
            else {
                s2 = s3;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c92(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseRegularCommand() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
            s1 = peg$c71;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c72);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            if (peg$c22.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s4 !== peg$FAILED) {
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    if (peg$c22.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c23);
                        }
                    }
                }
            }
            else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s2 = input.substring(s2, peg$currPos);
            }
            else {
                s2 = s3;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = peg$currPos;
                s3 = peg$c93(s2);
                if (s3) {
                    s3 = void 0;
                }
                else {
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseArgument();
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        s5 = peg$parseArgument();
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = peg$currPos;
                        s5 = peg$c94(s2, s4);
                        if (s5) {
                            s5 = void 0;
                        }
                        else {
                            s5 = peg$FAILED;
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c95(s2, s4);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseArgument() {
        var s0;
        s0 = peg$parseRequiredArgument();
        if (s0 === peg$FAILED) {
            s0 = peg$parseOptionalArgument();
        }
        return s0;
    }
    function peg$parseOptionalArgument() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
            s1 = peg$c96;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c97);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__h();
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                s4 = [];
                if (peg$c98.test(input.charAt(peg$currPos))) {
                    s5 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c99);
                    }
                }
                if (s5 !== peg$FAILED) {
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        if (peg$c98.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c99);
                            }
                        }
                    }
                }
                else {
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s3 = input.substring(s3, peg$currPos);
                }
                else {
                    s3 = s4;
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse__h();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 93) {
                            s5 = peg$c100;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c101);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c102(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseRequiredArgument() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c13;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c14);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__h();
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$parseCommand();
                if (s4 === peg$FAILED) {
                    s4 = peg$parseText();
                }
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    s4 = peg$parseCommand();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parseText();
                    }
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse__h();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                            s5 = peg$c17;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c18);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c103(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseVariableName() {
        var s0, s1, s2, s3, s4;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (peg$c104.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c105);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$c106.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c107);
                }
            }
            while (s4 !== peg$FAILED) {
                s3.push(s4);
                if (peg$c106.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c107);
                    }
                }
            }
            if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        return s0;
    }
    function peg$parseSimpleDicratical() {
        var s0;
        if (peg$c108.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c109);
            }
        }
        return s0;
    }
    function peg$parseExtendedDicratical() {
        var s0;
        if (peg$c110.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c111);
            }
        }
        return s0;
    }
    function peg$parsePropertySeparator() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
                s2 = peg$c112;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c113);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    s1 = [s1, s2, s3];
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsePropertyTerminator() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 44) {
                s2 = peg$c37;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c38);
                }
            }
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__h();
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseLineComment();
                    if (s5 === peg$FAILED) {
                        s5 = peg$parseEOL();
                    }
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        s5 = peg$parseLineComment();
                        if (s5 === peg$FAILED) {
                            s5 = peg$parseEOL();
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s1 = [s1, s2, s3, s4];
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseConcat() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 35) {
                s2 = peg$c114;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c115);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    s1 = [s1, s2, s3];
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseEOL() {
        var s0;
        if (peg$c116.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c117);
            }
        }
        return s0;
    }
    function peg$parse_h() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c119.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c120);
            }
        }
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (peg$c119.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c120);
                    }
                }
            }
        }
        else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c118);
            }
        }
        return s0;
    }
    function peg$parse__h() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c119.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c120);
            }
        }
        while (s1 !== peg$FAILED) {
            s0.push(s1);
            if (peg$c119.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c120);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c121);
            }
        }
        return s0;
    }
    function peg$parse_v() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c116.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c117);
            }
        }
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (peg$c116.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c117);
                    }
                }
            }
        }
        else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c122);
            }
        }
        return s0;
    }
    function peg$parse__v() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c116.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c117);
            }
        }
        while (s1 !== peg$FAILED) {
            s0.push(s1);
            if (peg$c116.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c117);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c123);
            }
        }
        return s0;
    }
    function peg$parse_() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c125.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c126);
            }
        }
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (peg$c125.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c126);
                    }
                }
            }
        }
        else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c124);
            }
        }
        return s0;
    }
    function peg$parse__() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        if (peg$c125.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c126);
            }
        }
        while (s1 !== peg$FAILED) {
            s0.push(s1);
            if (peg$c125.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c126);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c127);
            }
        }
        return s0;
    }
    var verbatim = {
        active: 0,
        property: null,
        closer: null,
        verbatimProperties: options.verbatimProperties ? options.verbatimProperties.map(function (prop) { return prop.toLowerCase(); }) : [
            'url',
            'doi',
            'file',
            'eprint',
            'verba',
            'verbb',
            'verbc',
        ],
        verbatimCommands: options.verbatimCommands ? options.verbatimCommands.map(function (cmd) { return cmd.toLowerCase(); }) : [
            'url',
        ],
        verbatimProperty: function (prop) {
            return this.verbatimProperties.includes(prop.toLowerCase());
        },
        enterProperty: function (closer) {
            if (!this.property || !this.verbatimProperty(this.property))
                return true;
            this.property = null;
            this.active = 1;
            this.closer = closer;
            return true;
        },
        leaveProperty: function () {
            this.active = 0;
            this.closer = '';
            this.property = '';
            return true;
        },
        verbatimCommand: function (cmd) {
            return this.verbatimCommands.includes(cmd.toLowerCase());
        },
        enterCommand: function (cmd) {
            if (this.verbatimCommand(cmd))
                this.active++;
            return true;
        },
        leaveCommand: function (cmd) {
            if (this.verbatimCommand(cmd))
                this.active--;
            if (this.active < 0)
                this.active = 0;
            return true;
        },
    };
    function simpleLatexConversions(text) {
        if (verbatim.active) {
            return text;
        }
        else {
            return text
                .replace(/---/g, '\u2014')
                .replace(/--/g, '\u2013')
                .replace(/</g, '\u00A1')
                .replace(/>/g, '\u00BF')
                .replace(/~/g, '\u00A0');
        }
    }
    function normalizeWhitespace(textArr) {
        return textArr.reduce(function (prev, curr) {
            if (/\s/.test(curr)) {
                if (/\s/.test(prev[prev.length - 1])) {
                    return prev;
                }
                else {
                    return prev + ' ';
                }
            }
            return prev + curr;
        }, '');
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    }
    else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
            ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
            : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}
module.exports = {
    SyntaxError: peg$SyntaxError,
    parse: peg$parse
};


/***/ }),

/***/ "../node_modules/string-template/index.js":
/*!************************************************!*\
  !*** ../node_modules/string-template/index.js ***!
  \************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

var nargs = /\{([0-9a-zA-Z_]+)\}/g

module.exports = template

function template(string) {
    var args

    if (arguments.length === 2 && typeof arguments[1] === "object") {
        args = arguments[1]
    } else {
        args = new Array(arguments.length - 1)
        for (var i = 1; i < arguments.length; ++i) {
            args[i - 1] = arguments[i]
        }
    }

    if (!args || !args.hasOwnProperty) {
        args = {}
    }

    return string.replace(nargs, function replaceArg(match, i, index) {
        var result

        if (string[index - 1] === "{" &&
            string[index + match.length] === "}") {
            return i
        } else {
            result = args.hasOwnProperty(i) ? args[i] : null
            if (result === null || result === undefined) {
                return ""
            }

            return result
        }
    })
}


/***/ }),

/***/ "./Better BibTeX Citation Key Quick Copy.ts":
/*!**************************************************!*\
  !*** ./Better BibTeX Citation Key Quick Copy.ts ***!
  \**************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const format = __webpack_require__(/*! string-template */ "../node_modules/string-template/index.js");
const exporter_1 = __webpack_require__(/*! ./lib/exporter */ "./lib/exporter.ts");
function select_by_key(item) {
    const [, kind, lib, key] = item.uri.match(/^http:\/\/zotero\.org\/(users|groups)\/((?:local\/)?[^\/]+)\/items\/(.+)/);
    return (kind === 'users') ? `zotero://select/library/items/${key}` : `zotero://select/groups/${lib}/items/${key}`;
}
function select_by_citekey(item) {
    return `zotero://select/items/@${encodeURIComponent(item.citekey)}`;
}
const Mode = {
    gitbook(items) {
        const citations = items.map(item => `{{ \"${item.citekey}\" | cite }}`);
        Zotero.write(citations.join(''));
    },
    atom(items) {
        const keys = items.map(item => item.citekey);
        if (keys.length === 1) {
            Zotero.write(`[](#@${keys[0]})`);
        }
        else {
            Zotero.write(`[](?@${keys.join(',')})`);
        }
    },
    latex(items) {
        const keys = items.map(item => item.citekey);
        const cmd = `${Translator.preferences.citeCommand}`.trim();
        if (cmd === '') {
            Zotero.write(keys.join(','));
        }
        else {
            Zotero.write(`\\${cmd}{${keys.join(',')}}`);
        }
    },
    citekeys(items) {
        const keys = items.map(item => item.citekey);
        Zotero.write(keys.join(','));
    },
    pandoc(items) {
        let keys = items.map(item => `@${item.citekey}`);
        keys = keys.join('; ');
        if (Translator.preferences.quickCopyPandocBrackets)
            keys = `[${keys}]`;
        Zotero.write(keys);
    },
    orgRef(items) {
        if (!items.length)
            return '';
        Zotero.write(`cite:${items.map(item => item.citekey).join(',')}`);
    },
    orgmode(items) {
        for (const item of items) {
            Zotero.write(`[[${select_by_key(item)}][@${item.citekey}]]`);
        }
    },
    orgmode_citekey(items) {
        for (const item of items) {
            Zotero.write(`[[${select_by_citekey(item)}][@${item.citekey}]]`);
        }
    },
    selectLink(items) {
        Zotero.write(items.map(select_by_key).join('\n'));
    },
    selectLink_citekey(items) {
        Zotero.write(items.map(select_by_citekey).join('\n'));
    },
    rtfScan(items) {
        const reference = items.map(item => {
            const ref = [];
            // author
            const creators = item.creators || [];
            const creator = creators[0] || {};
            let name = creator.name || creator.lastName || 'no author';
            if (creators.length > 1)
                name += ' et al.';
            ref.push(name);
            // title
            if (item.title)
                ref.push(JSON.stringify(item.title));
            // year
            if (item.date) {
                let date = Zotero.BetterBibTeX.parseDate(item.date);
                if (date.type === 'interval')
                    date = date.from;
                if (date.type === 'verbatim' || !date.year) {
                    ref.push(item.date);
                }
                else {
                    ref.push(date.year);
                }
            }
            else {
                ref.push('no date');
            }
            return ref.join(', ');
        });
        Zotero.write(`{${reference.join('; ')}}`);
    },
    'string-template'(items) {
        try {
            const { citation, item, sep } = JSON.parse(Translator.preferences.citeCommand);
            Zotero.write(format(citation || '{citation}', { citation: items.map(i => format(item || '{item}', { item: i })).join(sep || '') }));
        }
        catch (err) {
            Zotero.write(`${err}`);
        }
    },
};
Translator.doExport = () => {
    let item;
    const items = [];
    while ((item = exporter_1.Exporter.nextItem())) {
        items.push(item);
    }
    const mode = Mode[`${Translator.options.quickCopyMode}`] || Mode[`${Translator.preferences.quickCopyMode}`];
    if (mode) {
        mode.call(null, items);
    }
    else {
        throw new Error(`Unsupported Quick Copy format '${Translator.options.quickCopyMode || Translator.preferences.quickCopyMode}', I only know about: ${Object.keys(Mode).join(', ')}`);
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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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
        if (wrap)
            s = s.match(/.{1,70}/g).join('\n');
        return s;
    }
}
exports.JabRef = JabRef;


/***/ }),

/***/ "./bibtex/postfix.ts":
/*!***************************!*\
  !*** ./bibtex/postfix.ts ***!
  \***************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Postfix {
    constructor(qualityReport) {
        this.qr = qualityReport;
        this.packages = {};
        this.noopsort = false;
        this.declarePrefChars = '';
    }
    add(item) {
        if (!item.metadata)
            return;
        if (item.metadata.DeclarePrefChars)
            this.declarePrefChars += item.metadata.DeclarePrefChars;
        if (item.metadata.noopsort)
            this.noopsort = true;
        if (item.metadata.packages) {
            for (const pkg of item.metadata.packages) {
                this.packages[pkg] = true;
            }
        }
    }
    toString() {
        let postfix = '';
        let preamble = [];
        if (this.declarePrefChars)
            preamble.push("\\ifdefined\\DeclarePrefChars\\DeclarePrefChars{'’-}\\else\\fi");
        if (this.noopsort)
            preamble.push('\\newcommand{\\noopsort}[1]{}');
        if (preamble.length > 0) {
            preamble = preamble.map(cmd => `"${cmd} "`);
            postfix += `@preamble{ ${preamble.join(' \n # ')} }\n`;
        }
        if (this.qr) {
            const packages = Object.keys(this.packages).sort();
            if (packages.length) {
                postfix += '\n% Required packages:\n';
                for (const pkg of packages) {
                    postfix += `% * ${pkg}\n`;
                }
            }
        }
        return postfix;
    }
}
exports.Postfix = Postfix;


/***/ }),

/***/ "./lib/exporter.ts":
/*!*************************!*\
  !*** ./lib/exporter.ts ***!
  \*************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const jabref_1 = __webpack_require__(/*! ../bibtex/jabref */ "./bibtex/jabref.ts"); // not so nice... BibTeX-specific code
const itemfields = __webpack_require__(/*! ../../gen/itemfields */ "../gen/itemfields.ts");
const bibtexParser = __webpack_require__(/*! @retorquere/bibtex-parser */ "../node_modules/@retorquere/bibtex-parser/index.js");
const postfix_ts_1 = __webpack_require__(/*! ../bibtex/postfix.ts */ "./bibtex/postfix.ts");
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.Exporter = new class {
    constructor() {
        this.jabref = new jabref_1.JabRef();
        this.strings = {};
    }
    prepare_strings() {
        if (!Translator.BetterTeX || !Translator.preferences.strings)
            return;
        if (Translator.preferences.exportBibTeXStrings === 'match') {
            this.strings = bibtexParser.parse(Translator.preferences.strings, { markup: (Translator.csquotes ? { enquote: Translator.csquotes } : {}) }).strings;
        }
        /*
        if (Translator.preferences.exportBibTeXStrings !== 'off') {
          Zotero.write(`${Translator.preferences.strings}\n\n`)
        }
        */
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
        this.postfix = this.postfix || (new postfix_ts_1.Postfix(Translator.preferences.qualityReport));
        let item;
        while (item = Zotero.nextItem()) {
            if (['note', 'attachment'].includes(item.itemType))
                continue;
            if (!item.citekey) {
                throw new Error(`No citation key in ${JSON.stringify(item)}`);
            }
            this.jabref.citekeys.set(item.itemID, item.citekey);
            // this is not automatically lazy-evaluated?!?!
            const cached = Translator.caching ? Zotero.BetterBibTeX.cacheFetch(item.itemID, Translator.options, Translator.preferences) : null;
            Translator.cache[cached ? 'hits' : 'misses'] += 1;
            if (cached) {
                if (Translator.preferences.sorted && (Translator.BetterBibTeX || Translator.BetterBibLaTeX)) {
                    Translator.references.push({ citekey: item.citekey, reference: cached.reference });
                }
                else {
                    Zotero.write(cached.reference);
                }
                this.postfix.add(cached);
                continue;
            }
            itemfields.simplifyForExport(item);
            Object.assign(item, Zotero.BetterBibTeX.extractFields(item));
            item.raw = Translator.preferences.rawLaTag === '*';
            item.tags = item.tags.filter(tag => {
                if (tag.tag === Translator.preferences.rawLaTag) {
                    item.raw = true;
                    return false;
                }
                return true;
            });
            return item;
        }
        return null;
    }
    // TODO: move to bibtex-exporters
    complete() {
        if (Translator.preferences.sorted && (Translator.BetterBibTeX || Translator.BetterBibLaTeX)) {
            Translator.references.sort((a, b) => Translator.stringCompare(a.citekey, b.citekey));
            Zotero.write(Translator.references.map(ref => ref.reference).join(''));
        }
        this.jabref.exportGroups();
        Zotero.write(this.postfix.toString());
    }
};


/***/ })

/******/ });
