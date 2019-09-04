{
	"translatorID": "f4b52ab0-f878-4556-85a0-c7aeedd09dfc",
	"label": "Better CSL JSON",
	"creator": "Emiliano heyns",
	"target": "json",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"displayOptions": {
		"keepUpdated": false
	},
	"translatorType": 2,
	"browserSupport": "gcsv",
	"inRepository": false,
	"priority": 100,
	"lastUpdated": "2018-05-31 14:51:13"
}

var Translator = {
  initialize: function () {},
  version: "5.0.142",
  BetterCSLJSON: true,
  // header == ZOTERO_TRANSLATOR_INFO -- maybe pick it from there
  header: {"translatorID":"f4b52ab0-f878-4556-85a0-c7aeedd09dfc","label":"Better CSL JSON","description":"exports references in pandoc-compatible CSL-JSON format, with added citation keys and parsing of metadata","creator":"Emiliano heyns","target":"json","minVersion":"4.0.27","maxVersion":"","displayOptions":{"keepUpdated":false},"translatorType":2,"browserSupport":"gcsv","inRepository":false,"priority":100,"lastUpdated":"2018-05-31 14:51:13"},
  preferences: {"debug":false,"rawLaTag":"#LaTeX","testing":false,"DOIandURL":"both","asciiBibLaTeX":false,"asciiBibTeX":true,"autoExport":"immediate","quickCopyMode":"latex","citeCommand":"cite","quickCopyPandocBrackets":false,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citekeyFold":true,"keyConflictPolicy":"keep","preserveBibTeXVariables":false,"bibtexParticleNoOp":false,"skipFields":"","bibtexURL":"off","warnBulkModify":10,"postscript":"","strings":"","autoAbbrev":false,"autoAbbrevStyle":"","autoExportIdleWait":10,"cacheFlushInterval":5,"csquotes":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","jabrefFormat":0,"jurismPreferredLanguage":"","qualityReport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"suppressTitleCase":false,"itemObserverDelay":100,"parseParticles":true,"citeprocNoteCitekey":false,"scrubDatabase":false,"lockedInit":false,"autoPin":false},
  options: {"keepUpdated":false},

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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!********************************************************!*\
  !*** ../node_modules/json-stringify-safe/stringify.js ***!
  \********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

exports = module.exports = stringify
exports.getSerialize = serializer

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}


/***/ }),
/* 1 */
/*!*************************************!*\
  !*** ../content/debug-formatter.ts ***!
  \*************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading content/debug-formatter.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stringify = __webpack_require__(/*! json-stringify-safe */ 0);
function format(prefix, msg) {
    let str = '';
    str = msg.map((m, i) => {
        if (m instanceof Error)
            return `<Error: ${m.message || m.name}${m.stack ? `\n${m.stack}` : ''}>`;
        // mozilla exception, no idea on the actual instance type
        if (m && typeof m === 'object' && m.stack)
            return `<Error: ${m}#\n${m.stack}>`;
        if (m instanceof String || typeof m === 'string')
            return m;
        if (typeof m === 'undefined')
            return '<undefined>';
        if (i === (msg.length - 1))
            return stringify(m, null, 2); // last object
        return stringify(m);
    }).join(' ');
    return `{${prefix}} ${str}`;
}
exports.format = format;
; Zotero.debug('BBT: loaded content/debug-formatter.ts'); } catch ($wrap_loader_catcher_content_debug_formatter_ts) { Zotero.debug('Error: BBT: load of content/debug-formatter.ts failed:' + $wrap_loader_catcher_content_debug_formatter_ts + '::' + $wrap_loader_catcher_content_debug_formatter_ts.stack) };

/***/ }),
/* 2 */
/*!**********************!*\
  !*** ./lib/debug.ts ***!
  \**********************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/lib/debug.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_formatter_ts_1 = __webpack_require__(/*! ../../content/debug-formatter.ts */ 1);
function debug(...msg) {
    if (!Translator.debugEnabled && !Translator.preferences.testing)
        return;
    Zotero.debug(debug_formatter_ts_1.format(`better-bibtex:${Translator.header.label}`, msg));
}
exports.debug = debug;
; Zotero.debug('BBT: loaded translators/lib/debug.ts'); } catch ($wrap_loader_catcher_translators_lib_debug_ts) { Zotero.debug('Error: BBT: load of translators/lib/debug.ts failed:' + $wrap_loader_catcher_translators_lib_debug_ts + '::' + $wrap_loader_catcher_translators_lib_debug_ts.stack) };

/***/ }),
/* 3 */
/*!********************!*\
  !*** ./csl/csl.ts ***!
  \********************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/csl/csl.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
const validCSLTypes = [
    'article',
    'article-magazine',
    'article-newspaper',
    'article-journal',
    'review',
    'review-book',
    'bill',
    'broadcast',
    'dataset',
    'figure',
    'graphic',
    'interview',
    'legislation',
    'legal_case',
    'map',
    'motion_picture',
    'musical_score',
    'patent',
    'post',
    'post-weblog',
    'personal_communication',
    'song',
    'speech',
    'treaty',
    'webpage',
    'book',
    'chapter',
    'entry',
    'entry-dictionary',
    'entry-encyclopedia',
    'manuscript',
    'pamphlet',
    'paper-conference',
    'report',
    'thesis',
];
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.CSLExporter = new class {
    initialize() {
        const postscript = Translator.preferences.postscript;
        if (typeof postscript === 'string' && postscript.trim() !== '') {
            try {
                this.postscript = new Function('reference', 'item', postscript);
                Zotero.debug(`Installed postscript: ${JSON.stringify(postscript)}`);
            }
            catch (err) {
                Zotero.debug(`Failed to compile postscript: ${err}\n\n${JSON.stringify(postscript)}`);
            }
        }
    }
    postscript(reference, item) { } // tslint:disable-line:no-empty
    doExport() {
        const items = [];
        let item;
        while (item = Zotero.nextItem()) {
            if (item.itemType === 'note' || item.itemType === 'attachment')
                continue;
            let cached;
            if (cached = Zotero.BetterBibTeX.cacheFetch(item.itemID, Translator.options)) {
                items.push(cached.reference);
                continue;
            }
            Zotero.BetterBibTeX.simplifyFields(item);
            Object.assign(item, Zotero.BetterBibTeX.extractFields(item));
            if (item.accessDate) { // WTH is Juris-M doing with those dates?
                item.accessDate = item.accessDate.replace(/T?[0-9]{2}:[0-9]{2}:[0-9]{2}.*/, '').trim();
            }
            let csl = Zotero.Utilities.itemToCSLJSON(item);
            // 637
            delete csl['publisher-place'];
            delete csl['archive-place'];
            delete csl['event-place'];
            delete csl['original-publisher-place'];
            delete csl['publisher-place'];
            if (item.place)
                csl[item.itemType === 'presentation' ? 'event-place' : 'publisher-place'] = item.place;
            // https://github.com/retorquere/zotero-better-bibtex/issues/811#issuecomment-347165389
            if (item.ISBN)
                csl.ISBN = item.ISBN;
            delete csl.authority;
            if (item.itemType === 'videoRecording' && csl.type === 'video')
                csl.type = 'motion_picture';
            if (item.date) {
                const parsed = Zotero.BetterBibTeX.parseDate(item.date);
                csl.issued = this.date2CSL(parsed);
                if (parsed.orig)
                    csl['original-date'] = this.date2CSL(parsed.orig);
            }
            if (item.accessDate)
                csl.accessed = this.date2CSL(Zotero.BetterBibTeX.parseDate(item.accessDate));
            debug_ts_1.debug('extracted:', item.extraFields);
            for (let [name, { type, value }] of Object.entries(item.extraFields.csl)) {
                switch (name) {
                    case 'type':
                        if (validCSLTypes.includes(value))
                            csl.type = value;
                        continue;
                    case 'doi':
                    case 'isbn':
                    case 'issn':
                    case 'pmcid':
                    case 'pmid':
                    case 'url':
                        name = name.toUpperCase();
                        break;
                }
                switch (type) {
                    case 'date':
                        csl[name] = this.date2CSL(Zotero.BetterBibTeX.parseDate(value));
                        break;
                    case 'creator':
                        csl[name] = [];
                        for (let creator of value) {
                            creator = { family: creator.name || creator.lastName || '', given: creator.firstName || '', isInstitution: (creator.name ? 1 : undefined) };
                            Zotero.BetterBibTeX.parseParticles(creator);
                            csl[name].push(creator);
                        }
                        break;
                    default:
                        csl[name] = value;
                }
            }
            [csl.shortTitle, csl['title-short']] = [csl['title-short'], csl.shortTitle]; // ; here for disambiguation
            [csl.journalAbbreviation, csl['container-title-short']] = [csl['container-title-short'], csl.journalAbbreviation];
            /* ham-fisted workaround for #365 */
            if ((csl.type === 'motion_picture' || csl.type === 'broadcast') && csl.author && !csl.director)
                [csl.author, csl.director] = [csl.director, csl.author];
            csl.id = item.citekey;
            /* Juris-M workarounds to match Zotero as close as possible */
            for (const kind of ['translator', 'author', 'editor', 'director', 'reviewed-author']) {
                for (const creator of csl[kind] || []) {
                    delete creator.multi;
                }
            }
            delete csl.multi;
            delete csl.system_id;
            if (csl.type === 'broadcast' && csl.genre === 'television broadcast')
                delete csl.genre;
            this.postscript(csl, item);
            csl = this.serialize(csl);
            Zotero.BetterBibTeX.cacheStore(item.itemID, Translator.options, csl);
            items.push(csl);
        }
        Zotero.write(this.flush(items));
    }
};
; Zotero.debug('BBT: loaded translators/csl/csl.ts'); } catch ($wrap_loader_catcher_translators_csl_csl_ts) { Zotero.debug('Error: BBT: load of translators/csl/csl.ts failed:' + $wrap_loader_catcher_translators_csl_csl_ts + '::' + $wrap_loader_catcher_translators_csl_csl_ts.stack) };

/***/ }),
/* 4 */
/*!****************************!*\
  !*** ./Better CSL JSON.ts ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/Better CSL JSON.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csl_ts_1 = __webpack_require__(/*! ./csl/csl.ts */ 3);
function date2csl(date) {
    switch (date.type) {
        case 'open':
            return [0];
        case 'date':
            const csl = [date.year > 0 ? date.year : date.year - 1];
            if (date.month) {
                csl.push(date.month);
                if (date.day) {
                    csl.push(date.day);
                }
            }
            return csl;
        case 'season':
            // https://github.com/retorquere/zotero-better-bibtex/issues/860
            return [date.year > 0 ? date.year : date.year - 1, date.season + 12]; // tslint:disable-line:no-magic-numbers
        default:
            throw new Error(`Expected date or open, got ${date.type}`);
    }
}
csl_ts_1.CSLExporter.date2CSL = date => {
    switch (date.type) {
        case 'date':
            return {
                'date-parts': [date2csl(date)],
                circa: (date.approximate || date.uncertain) ? true : undefined,
            };
        case 'interval':
            return {
                'date-parts': [date2csl(date.from), date2csl(date.to)],
                circa: (date.from.approximate || date.from.uncertain || date.to.approximate || date.to.uncertain) ? true : undefined,
            };
        case 'verbatim':
            return { literal: date.verbatim };
        case 'season':
            return {
                'date-parts': [[date.year]],
                season: date.season,
                circa: (date.approximate || date.uncertain) ? true : undefined,
            };
        default:
            throw new Error(`Unexpected date type ${JSON.stringify(date)}`);
    }
};
csl_ts_1.CSLExporter.serialize = csl => JSON.stringify(csl);
csl_ts_1.CSLExporter.flush = items => `[\n${(items.map(item => `  ${item}`)).join(',\n')}\n]\n`;
Translator.initialize = () => csl_ts_1.CSLExporter.initialize();
Translator.doExport = () => csl_ts_1.CSLExporter.doExport();
; Zotero.debug('BBT: loaded translators/Better CSL JSON.ts'); } catch ($wrap_loader_catcher_translators_Better_CSL_JSON_ts) { Zotero.debug('Error: BBT: load of translators/Better CSL JSON.ts failed:' + $wrap_loader_catcher_translators_Better_CSL_JSON_ts + '::' + $wrap_loader_catcher_translators_Better_CSL_JSON_ts.stack) };

/***/ })
/******/ ]);
