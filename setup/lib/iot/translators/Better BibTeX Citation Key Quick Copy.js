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
		"hash": "b2cd75ceffae93a878f0444e0134c85a-6ed1e833bf91cf37dd93719b50005ef3"
	},
	"displayOptions": {
		"quickCopyMode": ""
	},
	"browserSupport": "gcsv",
	"lastUpdated": "2019-07-17 11:41:06"
}

var Translator = {
  initialize: function () {},
  BetterBibTeXCitationKeyQuickCopy: true,
  BetterTeX: false,
  BetterCSL: false,
  header: ZOTERO_TRANSLATOR_INFO,
  // header: < %- JSON.stringify(header) % >,
  preferences: {"DOIandURL":"both","ascii":"","asciiBibLaTeX":false,"asciiBibTeX":true,"autoAbbrev":false,"autoAbbrevStyle":"","autoExport":"immediate","autoExportDelay":1,"autoExportIdleWait":10,"autoExportPrimeExportCacheBatch":4,"autoExportPrimeExportCacheDelay":100,"autoExportPrimeExportCacheThreshold":0,"autoExportTooLong":10,"autoPin":false,"auxImport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"bibtexParticleNoOp":false,"bibtexURL":"off","cacheFlushInterval":5,"citeCommand":"cite","citekeyFold":true,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citeprocNoteCitekey":false,"csquotes":"","exportBibTeXStrings":"off","git":"config","importBibTeXStrings":true,"itemObserverDelay":100,"jabrefFormat":0,"keyConflictPolicy":"keep","keyScope":"library","kuroshiro":false,"lockedInit":false,"mapMath":"","mapText":"","mapUnicode":"conservative","parseParticles":true,"postscript":"","qualityReport":false,"quickCopyMode":"latex","quickCopyPandocBrackets":false,"rawLaTag":"#LaTeX","relativeFilePaths":false,"scrubDatabase":false,"skipFields":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","sorted":false,"strings":"","suppressBraceProtection":false,"suppressTitleCase":false,"warnBulkModify":10},
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
    this.preferences.testing = Zotero.getHiddenPref('better-bibtex.testing')
    Zotero.debug('prefs loaded: ' + JSON.stringify(this.preferences, null, 2))

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
  Zotero.debug("Better BibTeX Citation Key Quick Copy" + ' export took ' + (Date.now() - start))
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
        months: {
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
        strings: Object;
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
        this.strings = {}
        // These variables are expected to be defined by some bibtex sources.
        this.months = {
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
            if (this.strings[k.toUpperCase()]) {
                return this.strings[k.toUpperCase()]
            } else if (this.months[k.toUpperCase()]) {
                return this.months[k.toUpperCase()]
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
            if (isNaN(parseInt(month)) && this.months[month.toUpperCase()]) {
                month = this.months[month.toUpperCase()]
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
            this.strings[kv[0].toUpperCase()] = kv[1]
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
            strings: this.strings,
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


    Zotero.debug('zotero-better-bibtex: loading translators/Better BibTeX Citation Key Quick Copy.ts')
  ; try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const format = __webpack_require__(/*! string-template */ "../node_modules/string-template/index.js");
const exporter_1 = __webpack_require__(/*! ./lib/exporter */ "./lib/exporter.ts");
function select_by_id(item) {
    return `zotero://select/items/${item.libraryID}_${item.key}`;
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
            Zotero.write(`[[${select_by_id(item)}][@${item.citekey}]]`);
        }
    },
    orgmode_citekey(items) {
        for (const item of items) {
            Zotero.write(`[[${select_by_citekey(item)}][@${item.citekey}]]`);
        }
    },
    selectLink(items) {
        Zotero.write(items.map(select_by_id).join('\n'));
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
; 
    Zotero.debug('zotero-better-bibtex: loaded translators/Better BibTeX Citation Key Quick Copy.ts')
  ; } catch ($wrap_loader_catcher_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts) { 
    var $wrap_loader_message_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts = 'Error: zotero-better-bibtex: load of translators/Better BibTeX Citation Key Quick Copy.ts failed:' + $wrap_loader_catcher_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts + '::' + $wrap_loader_catcher_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts.stack;
    if (typeof Zotero.logError === 'function') {
      Zotero.logError($wrap_loader_message_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts)
    } else {
      Zotero.debug($wrap_loader_message_translators_Better_BibTeX_Citation_Key_Quick_Copy_ts)
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
const biblatex = __webpack_require__(/*! biblatex-csl-converter/src/import/biblatex */ "../node_modules/biblatex-csl-converter/src/import/biblatex.js");
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.Exporter = new class {
    constructor() {
        this.preamble = { DeclarePrefChars: '' };
        this.jabref = new jabref_1.JabRef();
        this.strings = {};
        this.packages = {};
    }
    prepare_strings() {
        if (!Translator.BetterTeX || !Translator.preferences.strings)
            return;
        if (Translator.preferences.exportBibTeXStrings === 'match') {
            this.strings = biblatex.parse(Translator.preferences.strings, {
                processUnexpected: true,
                processUnknown: { comment: 'f_verbatim' },
                processInvalidURIs: true,
            }).strings;
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
        let item;
        while (item = Zotero.nextItem()) {
            debug_1.debug(':caching:nextItem:', item.itemType);
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
                    if (cached.metadata.packages) {
                        for (const pkg of cached.metadata.packages) {
                            this.packages[pkg] = true;
                        }
                    }
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
        if (Translator.preferences.qualityReport) {
            const packages = Object.keys(this.packages);
            if (packages.length)
                Zotero.write('\n%Required packages:\n');
            for (const pkg of packages) {
                Zotero.write(`% * ${pkg}\n`);
            }
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
