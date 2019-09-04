{
	"translatorID": "e7859c61-54d4-466a-b236-aadcf1f7e83b",
	"label": "Collected notes",
	"creator": "Emiliano heyns",
	"target": "html",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"translatorType": 2,
	"browserSupport": "gcsv",
	"inRepository": false,
	"configOptions": {
		"getCollections": true
	},
	"priority": 100,
	"lastUpdated": "2018-05-31 14:51:08"
}

var Translator = {
  initialize: function () {},
  version: "5.0.142",
  Collectednotes: true,
  // header == ZOTERO_TRANSLATOR_INFO -- maybe pick it from there
  header: {"translatorID":"e7859c61-54d4-466a-b236-aadcf1f7e83b","label":"Collected notes","description":"exports your notes","creator":"Emiliano heyns","target":"html","minVersion":"4.0.27","maxVersion":"","translatorType":2,"browserSupport":"gcsv","inRepository":false,"configOptions":{"getCollections":true},"priority":100,"lastUpdated":"2018-05-31 14:51:08"},
  preferences: {"debug":false,"rawLaTag":"#LaTeX","testing":false,"DOIandURL":"both","asciiBibLaTeX":false,"asciiBibTeX":true,"autoExport":"immediate","quickCopyMode":"latex","citeCommand":"cite","quickCopyPandocBrackets":false,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citekeyFold":true,"keyConflictPolicy":"keep","preserveBibTeXVariables":false,"bibtexParticleNoOp":false,"skipFields":"","bibtexURL":"off","warnBulkModify":10,"postscript":"","strings":"","autoAbbrev":false,"autoAbbrevStyle":"","autoExportIdleWait":10,"cacheFlushInterval":5,"csquotes":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","jabrefFormat":0,"jurismPreferredLanguage":"","qualityReport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"suppressTitleCase":false,"itemObserverDelay":100,"parseParticles":true,"citeprocNoteCitekey":false,"scrubDatabase":false,"lockedInit":false,"autoPin":false},
  options: {},

  configure: function(stage) {
    var version = Zotero.BetterBibTeX.version();
    this.isZotero = version.Zotero.isZotero;
    this.isJurisM = version.Zotero.isJurisM;

    this.BetterCSL = this.BetterCSLYAML || this.BetterCSLJSON;

    this.debugEnabled = Zotero.BetterBibTeX.debugEnabled();
    this.unicode = true; // set by Better Bib(La)TeX later

    if (stage == 'detectImport') {
      this.options = {}
    } else {
      for (var key in this.options) {
        this.options[key] = Zotero.getOption(key)
      }
      // special handling
      this.options.exportPath = Zotero.getOption('exportPath')
      this.options.exportFilename = Zotero.getOption('exportFilename')
    }

    for (key in this.preferences) {
      this.preferences[key] = Zotero.getHiddenPref('better-bibtex.' + key)
    }
    // special handling
    this.preferences.skipWords = this.preferences.skipWords.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    this.preferences.skipFields = this.preferences.skipFields.toLowerCase().trim().split(/\s*,\s*/).filter(function(s) { return s })
    if (!this.preferences.rawLaTag) this.preferences.rawLaTag = '#LaTeX'
    if (this.preferences.csquotes) {
      var i, csquotes = { open: '', close: '' }
      for (i = 0; i < this.preferences.csquotes.length; i++) {
        csquotes[i % 2 == 0 ? 'open' : 'close'] += this.preferences.csquotes[i]
      }
      this.preferences.csquotes = csquotes
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
    Translator.configure('doExport')
    Translator.initialize()
    Translator.doExport()
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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!****************************!*\
  !*** ./lib/html-escape.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

Zotero.debug('BBT: loading translators/lib/html-escape.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function htmlEscape(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
exports.htmlEscape = htmlEscape;
; Zotero.debug('BBT: loaded translators/lib/html-escape.ts'); } catch ($wrap_loader_catcher_translators_lib_html_escape_ts) { Zotero.debug('Error: BBT: load of translators/lib/html-escape.ts failed:' + $wrap_loader_catcher_translators_lib_html_escape_ts + '::' + $wrap_loader_catcher_translators_lib_html_escape_ts.stack) };

/***/ }),
/* 1 */
/*!****************************!*\
  !*** ./Collected notes.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/Collected notes.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_escape_ts_1 = __webpack_require__(/*! ./lib/html-escape.ts */ 0);
const html = {
    levels: 0,
    body: '',
};
function _collection(collection, level = 1) {
    if (level > html.levels)
        html.levels = level;
    html.body += `<h${level}>${html_escape_ts_1.htmlEscape(collection.name)}</h${level}>\n`;
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
            html.body += `<blockquote><pre>${html_escape_ts_1.htmlEscape(note)}</pre></blockquote>\n`;
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
            title = `<samp>${html_escape_ts_1.htmlEscape(item.title)}</samp>`;
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
            title += `<i>${html_escape_ts_1.htmlEscape(item.title)}</i>`;
        if (author)
            title += `(${html_escape_ts_1.htmlEscape(author)})`;
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
; Zotero.debug('BBT: loaded translators/Collected notes.ts'); } catch ($wrap_loader_catcher_translators_Collected_notes_ts) { Zotero.debug('Error: BBT: load of translators/Collected notes.ts failed:' + $wrap_loader_catcher_translators_Collected_notes_ts + '::' + $wrap_loader_catcher_translators_Collected_notes_ts.stack) };

/***/ })
/******/ ]);
