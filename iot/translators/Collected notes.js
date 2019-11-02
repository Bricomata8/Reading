{
	"translatorID": "e7859c61-54d4-466a-b236-aadcf1f7e83b",
	"translatorType": 2,
	"label": "Collected notes",
	"creator": "Emiliano heyns",
	"target": "html",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"priority": 100,
	"inRepository": false,
	"configOptions": {
		"getCollections": true,
		"hash": "4d933b7f1909f7cb77e2e3bfd916eddd-55c7ac6f564fc6eda2714516cdd67c08"
	},
	"browserSupport": "gcsv",
	"lastUpdated": "2019-10-29 18:10:12"
}

var Translator = {
  initialize: function () {},
  Collectednotes: true,
  BetterTeX: false,
  BetterCSL: false,
  header: ZOTERO_TRANSLATOR_INFO,
  // header: < %- JSON.stringify(header) % >,
  preferences: {"DOIandURL":"both","ascii":"","asciiBibLaTeX":false,"asciiBibTeX":true,"autoAbbrev":false,"autoAbbrevStyle":"","autoExport":"immediate","autoExportDelay":1,"autoExportIdleWait":10,"autoExportPrimeExportCacheBatch":4,"autoExportPrimeExportCacheDelay":100,"autoExportPrimeExportCacheThreshold":0,"autoExportTooLong":10,"autoPin":false,"automaticTags":true,"auxImport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"bibtexParticleNoOp":false,"bibtexURL":"off","cacheFlushInterval":5,"citeCommand":"cite","citekeyFold":true,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citeprocNoteCitekey":false,"csquotes":"","exportBibTeXStrings":"off","git":"config","importBibTeXStrings":true,"itemObserverDelay":100,"jabrefFormat":0,"keyConflictPolicy":"keep","keyScope":"library","kuroshiro":false,"lockedInit":false,"mapMath":"","mapText":"","mapUnicode":"conservative","newTranslatorsAskRestart":true,"parseParticles":true,"postscript":"","qualityReport":false,"quickCopyMode":"latex","quickCopyPandocBrackets":false,"rawLaTag":"#LaTeX","relativeFilePaths":false,"scrubDatabase":false,"skipFields":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","sorted":false,"strings":"","suppressBraceProtection":false,"suppressNoCase":false,"suppressSentenceCase":false,"suppressTitleCase":false,"verbatimFields":"url,doi,file,eprint,verba,verbb,verbc","warnBulkModify":10},
  options: {},

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
  Zotero.debug("Collected notes" + ` export took ${elapsed/1000}s, hits=${hits}, misses=${misses}, ${elapsed / (misses + hits)}ms/item`)
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./Collected notes.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../content/escape.ts":
/*!****************************!*\
  !*** ../content/escape.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

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


/***/ }),

/***/ "./Collected notes.ts":
/*!****************************!*\
  !*** ./Collected notes.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const escape = __webpack_require__(/*! ../content/escape */ "../content/escape.ts");
const html = {
    levels: 0,
    body: '',
};
function _collection(collection, level = 1) {
    if (level > html.levels)
        html.levels = level;
    html.body += `<h${level}>${escape.html(collection.name)}</h${level}>\n`;
    for (const item of collection.items) {
        _item(item);
    }
    for (const subcoll of collection.collections) {
        _collection(subcoll, level + 1);
    }
}
function _item(item) {
    switch (item.itemType) {
        case 'note':
            _note(item.note, 'note');
            break;
        case 'attachment':
            _reference(item);
            break;
        default:
            _reference(item);
            break;
    }
}
function _prune(collection) {
    let keep = collection.items.length > 0;
    collection.collections = collection.collections.filter(subcoll => {
        if (_prune(subcoll)) {
            return false;
        }
        else {
            keep = true;
            return true;
        }
    });
    return !keep;
}
function _note(note, type) {
    switch (type) {
        case 'extra':
            if (!note)
                return;
            html.body += `<blockquote><pre>${escape.html(note)}</pre></blockquote>\n`;
            break;
        case 'attachment':
            if (!note.note)
                return;
            html.body += `<blockquote><div><samp>${note.title}</samp></div>${note.note}</blockquote>\n`;
            break;
        default:
            if (!note.note)
                return;
            html.body += `<blockquote>${note.note}</blockquote>\n`;
            break;
    }
}
function _creator(cr) {
    return [cr.lastName, cr.firstName, cr.name].filter(v => v).join(', ');
}
function _reference(item) {
    let notes = [];
    let title = '';
    if (item.itemType === 'attachment') {
        if (item.note)
            notes = [{ note: item.note }];
        if (item.title)
            title = `<samp>${escape.html(item.title)}</samp>`;
    }
    else {
        notes = item.notes.filter(note => note.note);
        const creators = item.creators.map(_creator).filter(v => v).join(' and ');
        let date = null;
        if (item.date) {
            date = Zotero.BetterBibTeX.parseDate(item.date);
            if (date.from)
                date = date.from;
            date = typeof date.year === 'number' ? date.year : item.date;
        }
        const author = [creators, date].filter(v => v).join(', ');
        if (item.title)
            title += `<i>${escape.html(item.title)}</i>`;
        if (author)
            title += `(${escape.html(author)})`;
        title = title.trim();
    }
    html.body += `<div>${title}</div>\n`;
    _note(item.extra, 'extra');
    for (const note of notes) {
        _note(note, 'note');
    }
    for (const att of item.attachments || []) {
        _note(att, 'attachment');
    }
}
function _reset(starting) {
    if (starting > html.levels)
        return '';
    let reset = 'counter-reset:';
    for (let level = starting; level <= html.levels; level++) {
        reset += ` h${level}counter 0`;
    }
    return reset + ';';
    // return `counter-reset: h${ starting }counter;`
}
function _keep(item) {
    if (item.extra)
        return true;
    if (item.note)
        return true;
    if (item.notes && item.notes.find(note => note.note))
        return true;
    if (item.attachments && item.attachments.find(att => att.note))
        return true;
    return false;
}
Translator.doExport = () => {
    // collect all notes
    const items = {};
    let z_item;
    while (z_item = Zotero.nextItem()) {
        Object.assign(z_item, Zotero.BetterBibTeX.extractFields(z_item));
        if (_keep(z_item))
            items[z_item.itemID] = z_item;
    }
    const filed = {};
    // expand collections
    for (const collection of Object.values(Translator.collections)) {
        collection.collections = collection.collections.map(key => Translator.collections[key]).filter(v => v);
        collection.items = collection.items.map(id => filed[id] = items[id]).filter(v => v);
    }
    // prune empty branches
    const collections = Object.values(Translator.collections).filter(collection => !collection.parent && !_prune(collection));
    html.body += '<html><body>';
    for (const item of Object.values(items)) {
        if (filed[item.itemID])
            continue;
        _item(item);
    }
    for (const collection of collections) {
        _collection(collection);
    }
    let style = `  body { ${_reset(1)} }\n`;
    for (let level = 1; level <= html.levels; level++) {
        style += `  h${level} { ${_reset(level + 1)} }\n`;
        const label = Array.from({ length: level }, (x, i) => `counter(h${i + 1}counter)`).join(' "." ');
        style += `  h${level}:before { counter-increment: h${level}counter; content: ${label} ".\\0000a0\\0000a0"; }\n`;
    }
    style += '  blockquote { border-left: 1px solid gray; }\n';
    Zotero.write(`<html><head><style>${style}</style></head><body>${html.body}</body></html>`);
};


/***/ })

/******/ });
