{
	"translatorID": "ca65189f-8815-4afe-8c8b-8c7c15f0edca",
	"label": "Better BibTeX",
	"creator": "Simon Kornblith, Richard Karnesky and Emiliano heyns",
	"target": "bib",
	"minVersion": "4.0.27",
	"maxVersion": "",
	"configOptions": {
		"getCollections": true
	},
	"displayOptions": {
		"exportNotes": false,
		"exportFileData": false,
		"useJournalAbbreviation": false,
		"keepUpdated": false
	},
	"translatorType": 3,
	"browserSupport": "gcsv",
	"priority": 199,
	"inRepository": false,
	"lastUpdated": "2018-05-31 14:51:15"
}

var Translator = {
  initialize: function () {},
  version: "5.0.142",
  BetterBibTeX: true,
  // header == ZOTERO_TRANSLATOR_INFO -- maybe pick it from there
  header: {"translatorID":"ca65189f-8815-4afe-8c8b-8c7c15f0edca","label":"Better BibTeX","description":"exports references in BibTeX format","creator":"Simon Kornblith, Richard Karnesky and Emiliano heyns","target":"bib","minVersion":"4.0.27","maxVersion":"","configOptions":{"getCollections":true},"displayOptions":{"exportNotes":false,"exportFileData":false,"useJournalAbbreviation":false,"keepUpdated":false},"translatorType":3,"browserSupport":"gcsv","priority":199,"inRepository":false,"lastUpdated":"2018-05-31 14:51:15"},
  preferences: {"debug":false,"rawLaTag":"#LaTeX","testing":false,"DOIandURL":"both","asciiBibLaTeX":false,"asciiBibTeX":true,"autoExport":"immediate","quickCopyMode":"latex","citeCommand":"cite","quickCopyPandocBrackets":false,"citekeyFormat":"​[auth:lower][shorttitle3_3][year]","citekeyFold":true,"keyConflictPolicy":"keep","preserveBibTeXVariables":false,"bibtexParticleNoOp":false,"skipFields":"","bibtexURL":"off","warnBulkModify":10,"postscript":"","strings":"","autoAbbrev":false,"autoAbbrevStyle":"","autoExportIdleWait":10,"cacheFlushInterval":5,"csquotes":"","skipWords":"a,ab,aboard,about,above,across,after,against,al,along,amid,among,an,and,anti,around,as,at,before,behind,below,beneath,beside,besides,between,beyond,but,by,d,da,das,de,del,dell,dello,dei,degli,della,dell,delle,dem,den,der,des,despite,die,do,down,du,during,ein,eine,einem,einen,einer,eines,el,en,et,except,for,from,gli,i,il,in,inside,into,is,l,la,las,le,les,like,lo,los,near,nor,of,off,on,onto,or,over,past,per,plus,round,save,since,so,some,sur,than,the,through,to,toward,towards,un,una,unas,under,underneath,une,unlike,uno,unos,until,up,upon,versus,via,von,while,with,within,without,yet,zu,zum","jabrefFormat":0,"jurismPreferredLanguage":"","qualityReport":false,"biblatexExtendedDateFormat":true,"biblatexExtendedNameFormat":false,"suppressTitleCase":false,"itemObserverDelay":100,"parseParticles":true,"citeprocNoteCitekey":false,"scrubDatabase":false,"lockedInit":false,"autoPin":false},
  options: {"exportNotes":false,"exportFileData":false,"useJournalAbbreviation":false,"keepUpdated":false},

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



  function detectImport() {
    Translator.configure('detectImport')
    return Translator.detectImport()
  }
  function doImport() {
    Translator.configure('doImport')
    Translator.initialize()
    Translator.doImport()
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
/******/ 	return __webpack_require__(__webpack_require__.s = 27);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!***********************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/const.js ***!
  \***********************************************************/
/*! exports provided: BibFieldTypes, BibTypes */
/*! exports used: BibFieldTypes, BibTypes */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibFieldTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return BibTypes; });
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
/* 1 */
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
const TeXSpecialChars = [
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char220\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char220", '\u033C'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char225\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char225", '\u0361'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char201\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char201", '\u013F'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char218\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char218", '\u033A'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char202\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char202", '\u0140'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char207\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char207", '\u032F'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char203\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char203", '\u032B'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char185\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char185", '\u0319'],
  ["\\{\\\\fontencoding\\{LEIP\\}\\\\selectfont\\\\char202\\}|\\\\fontencoding\\{LEIP\\}\\\\selectfont\\\\char202", '\u027F'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char184\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char184", '\u0318'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char177\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char177", '\u0311'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char195\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char195", '\u01BA'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char215\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char215", '\u0337'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char216\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char216", '\u0338'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char219\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char219", '\u033B'],
  ["\\{\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char221\\}|\\\\fontencoding\\{LECO\\}\\\\selectfont\\\\char221", '\u033D'],
  ["\\{\\\\fontencoding\\{LEIP\\}\\\\selectfont\\\\char61\\}|\\\\fontencoding\\{LEIP\\}\\\\selectfont\\\\char61", '\u0258'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char63\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char63", '\u0167'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char91\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char91", '\u0138'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char40\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char40", '\u0126'],
  ["\\{\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char47\\}|\\\\fontencoding\\{LELA\\}\\\\selectfont\\\\char47", '\u0166'],
  ["\\\\mathbin\\{\\{:\\}\\\\!\\\\!\\{\\-\\}\\\\!\\\\!\\{:\\}\\}", '\u223A'],
  ["\\\\cyrchar\\\\cyrhundredthousands", '\u0488'],
  ["\\\\acute\\{\\\\ddot\\{\\\\upsilon\\}\\}", '\u03B0'],
  ["\\\\Pisymbol\\{ppi020\\}\\{105\\}", '\u2A9E'],
  ["\\\\acute\\{\\\\ddot\\{\\\\iota\\}\\}", '\u0390'],
  ["\\\\Pisymbol\\{ppi020\\}\\{117\\}", '\u2A9D'],
  ["\\\\mathsfbfsl\\{\\\\varkappa\\}", '\uD835\uDFC6'],
  ["\\\\barleftarrowrightarrowba", '\u21B9'],
  ["\\\\mathsfbfsl\\{\\\\vartheta\\}", '\uD835\uDF97'],
  ["\\\\not\\\\kern\\-0\\.3em\\\\times", '\u226D'],
  ["\\\\leftarrowshortrightarrow", '\u2943'],
  ["\\\\mathsfbfsl\\{\\\\varsigma\\}", '\uD835\uDFBB'],
  ["\\\\Pisymbol\\{ppi022\\}\\{87\\}", '\u03D0'],
  ["\\\\concavediamondtickright", '\u27E3'],
  ["\\\\invwhiteupperhalfcircle", '\u25DA'],
  ["\\\\mathsfbfsl\\{\\\\Upsilon\\}", '\uD835\uDFA4'],
  ["\\\\nvtwoheadrightarrowtail", '\u2917'],
  ["\\\\nVtwoheadrightarrowtail", '\u2918'],
  ["\\\\invwhitelowerhalfcircle", '\u25DB'],
  ["\\\\leftrightarrowtriangle", '\u21FF'],
  ["\\\\partialmeetcontraction", '\u2AA3'],
  ["\\\\updownharpoonleftright", '\u294D'],
  ["\\\\ensuremath\\{\\\\Elzpes\\}", '\u20A7'],
  ["\\\\texteuro|\\{\\\\mbox\\{\\\\texteuro\\}\\}|\\\\mbox\\{\\\\texteuro\\}", '\u20AC'],
  ["\\\\cyrchar\\\\CYROMEGATITLO", '\u047C'],
  ["\\\\mathsfbfsl\\{\\\\varrho\\}", '\uD835\uDFC8'],
  ["\\\\cyrchar\\\\cyromegatitlo", '\u047D'],
  ["\\\\nVtwoheadleftarrowtail", '\u2B3D'],
  ["\\\\concavediamondtickleft", '\u27E2'],
  ["\\\\updownharpoonrightleft", '\u294C'],
  ["\\\\blackcircleulquadwhite", '\u25D5'],
  ["\\\\mathsfbfsl\\{\\\\Lambda\\}", '\uD835\uDF9A'],
  ["\\\\mathsfbf\\{\\\\varsigma\\}", '\uD835\uDF81'],
  ["\\\\mathsfbf\\{\\\\varkappa\\}", '\uD835\uDF8C'],
  ["\\\\nvtwoheadleftarrowtail", '\u2B3C'],
  ["\\\\mathsfbf\\{\\\\vartheta\\}", '\uD835\uDF67'],
  ["\\\\downtrianglerightblack", '\u29E9'],
  ["\\\\ElsevierGlyph\\{E838\\}", '\u233D'],
  ["\\\\ElsevierGlyph\\{2129\\}", '\u2129'],
  ["\\\\ElsevierGlyph\\{E219\\}", '\u2937'],
  ["\\\\rangledownzigzagarrow", '\u237C'],
  ["\\\\mathsfbfsl\\{\\\\Omega\\}", '\uD835\uDFA8'],
  ["\\\\mathrm\\{\\\\ddot\\{Y\\}\\}", '\u03AB'],
  ["\\\\mathsfbfsl\\{\\\\nabla\\}", '\uD835\uDFA9'],
  ["\\\\mathrm\\{\\\\ddot\\{I\\}\\}", '\u03AA'],
  ["\\\\mathsfbfsl\\{\\\\Gamma\\}", '\uD835\uDF92'],
  ["\\\\ElsevierGlyph\\{2275\\}", '\u2275'],
  ["\\\\ElsevierGlyph\\{E21A\\}", '\u2936'],
  ["\\\\ElsevierGlyph\\{E214\\}", '\u297C'],
  ["\\\\ElsevierGlyph\\{E215\\}", '\u297D'],
  ["\\\\ElsevierGlyph\\{2274\\}", '\u2274'],
  ["\\\\ElsevierGlyph\\{2232\\}", '\u2232'],
  ["\\\\ElsevierGlyph\\{E212\\}", '\u2905'],
  ["\\\\ElsevierGlyph\\{2233\\}", '\u2233'],
  ["\\\\ElsevierGlyph\\{3018\\}", '\u2985'],
  ["\\\\sim\\\\joinrel\\\\leadsto", '\u27FF'],
  ["\\\\ElsevierGlyph\\{2238\\}", '\u2238'],
  ["\\\\ElsevierGlyph\\{E291\\}", '\u2994'],
  ["\\\\ElsevierGlyph\\{E21C\\}", '\u2933'],
  ["\\\\underrightharpoondown", '\u20EC'],
  ["\\\\ElsevierGlyph\\{2242\\}", '\u2242'],
  ["\\\\ElsevierGlyph\\{E260\\}", '\u29B5'],
  ["\\\\ElsevierGlyph\\{E61B\\}", '\u29B6'],
  ["\\\\cyrchar\\\\cyrsemisftsn", '\u048D'],
  ["\\\\cyrchar\\\\CYRSEMISFTSN", '\u048C'],
  ["\\\\cyrchar\\\\cyrthousands", '\u0482'],
  ["\\\\ElsevierGlyph\\{3019\\}", '\u3019'],
  ["\\\\ElsevierGlyph\\{300B\\}", '\u300B'],
  ["\\\\leftrightharpoonsdown", '\u2967'],
  ["\\\\rightleftharpoonsdown", '\u2969'],
  ["\\\\ElsevierGlyph\\{E210\\}", '\u292A'],
  ["\\\\ElsevierGlyph\\{300A\\}", '\u300A'],
  ["\\\\ElsevierGlyph\\{E372\\}", '\u29DC'],
  ["\\\\ElsevierGlyph\\{22C0\\}", '\u22C0'],
  ["\\\\downtriangleleftblack", '\u29E8'],
  ["\\\\blackdiamonddownarrow", '\u29EA'],
  ["\\\\ElsevierGlyph\\{E20F\\}", '\u2929'],
  ["\\\\ElsevierGlyph\\{E20E\\}", '\u2928'],
  ["\\\\ElsevierGlyph\\{E211\\}", '\u2927'],
  ["\\\\ElsevierGlyph\\{E20A\\}", '\u2926'],
  ["\\\\ElsevierGlyph\\{225A\\}", '\u225A'],
  ["\\\\ElsevierGlyph\\{225F\\}", '\u225F'],
  ["\\\\ElsevierGlyph\\{E20B\\}", '\u2925'],
  ["\\\\ElsevierGlyph\\{E20D\\}", '\u2924'],
  ["\\\\mathsfbf\\{\\\\Upsilon\\}", '\uD835\uDF6A'],
  ["\\\\ElsevierGlyph\\{22C1\\}", '\u22C1'],
  ["\\\\mathbit\\{\\\\varkappa\\}", '\uD835\uDF52'],
  ["\\\\mathbit\\{\\\\vartheta\\}", '\uD835\uDF51'],
  ["\\\\mathbit\\{\\\\varsigma\\}", '\uD835\uDF47'],
  ["\\\\ElsevierGlyph\\{E20C\\}", '\u2923'],
  ["\\\\ElsevierGlyph\\{E395\\}", '\u2A10'],
  ["\\\\ElsevierGlyph\\{E25A\\}", '\u2A25'],
  ["\\\\ElsevierGlyph\\{21B3\\}", '\u21B3'],
  ["\\\\ElsevierGlyph\\{E25B\\}", '\u2A2A'],
  ["\\\\ElsevierGlyph\\{E25C\\}", '\u2A2D'],
  ["\\\\ElsevierGlyph\\{E25D\\}", '\u2A2E'],
  ["\\\\ElsevierGlyph\\{E25E\\}", '\u2A34'],
  ["\\\\ElsevierGlyph\\{E259\\}", '\u2A3C'],
  ["\\\\ElsevierGlyph\\{E381\\}", '\u25B1'],
  ["\\\\closedvarcupsmashprod", '\u2A50'],
  ["\\\\ElsevierGlyph\\{E36E\\}", '\u2A55'],
  ["\\\\barovernorthwestarrow", '\u21B8'],
  ["\\\\mathsfbfsl\\{\\\\Delta\\}", '\uD835\uDF93'],
  ["\\\\ElsevierGlyph\\{E30D\\}", '\u2AEB'],
  ["\\\\mathsfbfsl\\{\\\\Sigma\\}", '\uD835\uDFA2'],
  ["\\\\mathsfbfsl\\{\\\\varpi\\}", '\uD835\uDFC9'],
  ["\\\\mathbit\\{\\\\Upsilon\\}", '\uD835\uDF30'],
  ["\\\\whiteinwhitetriangle", '\u27C1'],
  ["\\\\cyrchar\\\\cyromegarnd", '\u047B'],
  ["\\\\cyrchar\\\\CYRABHCHDSC", '\u04BE'],
  ["\\\\cyrchar\\\\CYROMEGARND", '\u047A'],
  ["\\\\twoheadleftarrowtail", '\u2B3B'],
  ["\\\\mathsl\\{\\\\varkappa\\}", '\uD835\uDF18'],
  ["\\\\mathsl\\{\\\\varsigma\\}", '\uD835\uDF0D'],
  ["\\\\cyrchar\\\\cyrabhchdsc", '\u04BF'],
  ["\\\\cyrchar\\\\CYRpalochka", '\u04C0'],
  ["\\\\mathbf\\{\\\\varkappa\\}", '\uD835\uDEDE'],
  ["\\\\CapitalDifferentialD", '\u2145'],
  ["\\\\mathbf\\{\\\\varsigma\\}", '\uD835\uDED3'],
  ["\\\\mathsfbf\\{\\\\varrho\\}", '\uD835\uDF8E'],
  ["\\\\twoheaduparrowcircle", '\u2949'],
  ["\\\\rightarrowbackapprox", '\u2B48'],
  ["\\\\curvearrowrightminus", '\u293C'],
  ["\\\\barrightarrowdiamond", '\u2920'],
  ["\\\\leftrightarrowcircle", '\u2948'],
  ["\\\\downrightcurvedarrow", '\u2935'],
  ["\\\\NestedGreaterGreater", '\u2AA2'],
  ["\\\\cyrchar\\{\\\\'\\\\CYRK\\}", '\u040C'],
  ["\\\\mathsl\\{\\\\vartheta\\}", '\uD835\uDEF3'],
  ["\\\\mathsfbf\\{\\\\Lambda\\}", '\uD835\uDF60'],
  ["\\\\underleftharpoondown", '\u20ED'],
  ["\\\\mathbf\\{\\\\vartheta\\}", '\uD835\uDEB9'],
  ["\\\\cyrchar\\{\\\\'\\\\cyrk\\}", '\u045C'],
  ["\\\\blackcircledrightdot", '\u2688'],
  ["\\\\whitesquaretickright", '\u27E5'],
  ["\\\\cyrchar\\{\\\\'\\\\cyrg\\}", '\u0453'],
  ["\\\\cyrchar\\{\\\\'\\\\CYRG\\}", '\u0403'],
  ["\\\\cyrchar\\\\cyrmillions", '\u0489'],
  ["\\\\ReverseUpEquilibrium", '\u296F'],
  ["\\\\blackcircledownarrow", '\u29ED'],
  ["\\\\int\\\\!\\\\int\\\\!\\\\int", '\u222D'],
  ["\\\\leftrightsquigarrow", '\u21AD'],
  ["\\\\leftarrowbackapprox", '\u2B42'],
  ["\\\\mathbit\\{\\\\Lambda\\}", '\uD835\uDF26'],
  ["\\\\mathsfbfsl\\{\\\\phi\\}", '\uD835\uDFC7'],
  ["\\\\blockthreeqtrshaded", '\u2593'],
  ["\\\\whitesquaretickleft", '\u27E4'],
  ["\\\\blackcircledtwodots", '\u2689'],
  ["\\\\stackrel\\{\\*\\}\\{=\\}", '\u2A6E'],
  ["\\\\whitearrowupfrombar", '\u21EA'],
  ["\\\\mathsfbfsl\\{\\\\Phi\\}", '\uD835\uDFA5'],
  ["\\\\mathsfbf\\{\\\\Theta\\}", '\uD835\uDF5D'],
  ["\\\\leftrightharpoonsup", '\u2966'],
  ["\\\\mathsfbf\\{\\\\varpi\\}", '\uD835\uDF8F'],
  ["\\\\blackinwhitediamond", '\u25C8'],
  ["\\\\cyrchar\\\\cyriotbyus", '\u046D'],
  ["\\\\mathsfbf\\{\\\\Omega\\}", '\uD835\uDF6E'],
  ["\\\\cyrchar\\\\CYRIOTBYUS", '\u046C'],
  ["\\\\mathbf\\{\\\\Upsilon\\}", '\uD835\uDEBC'],
  ["\\\\mathsfbf\\{\\\\Delta\\}", '\uD835\uDF59'],
  ["\\\\mathsfbfsl\\{\\\\Psi\\}", '\uD835\uDFA7'],
  ["\\\\DownLeftRightVector", '\u2950'],
  ["\\\\cyrchar\\\\textnumero", '\u2116'],
  ["\\\\twoheadleftdbkarrow", '\u2B37'],
  ["\\\\mathsfbf\\{\\\\Gamma\\}", '\uD835\uDF58'],
  ["\\\\rightleftharpoonsup", '\u2968'],
  ["\\\\mathsl\\{\\\\Upsilon\\}", '\uD835\uDEF6'],
  ["\\\\cyrchar\\\\cyriotlyus", '\u0469'],
  ["\\\\nVtwoheadrightarrow", '\u2901'],
  ["\\\\mathbit\\{\\\\varrho\\}", '\uD835\uDF54'],
  ["\\\\mathsfbf\\{\\\\nabla\\}", '\uD835\uDF6F'],
  ["\\\\mathsfbf\\{\\\\Sigma\\}", '\uD835\uDF68'],
  ["\\\\cyrchar\\\\CYRIOTLYUS", '\u0468'],
  ["\\\\diamondleftarrowbar", '\u291F'],
  ["\\\\cyrchar\\\\CYRCHLDSC", '\u04CB'],
  ["\\\\longleftsquigarrow", '\u2B33'],
  ["\\\\textfrac\\{2\\}\\{5\\}", '\u2156'],
  ["\\\\RightDownTeeVector", '\u295D'],
  ["\\\\textfrac\\{7\\}\\{8\\}", '\u215E'],
  ["\\\\DownRightVectorBar", '\u2957'],
  ["\\\\mathrm\\{'\\\\Omega\\}", '\u038F'],
  ["\\\\textfrac\\{5\\}\\{8\\}", '\u215D'],
  ["\\\\rightpentagonblack", '\u2B53'],
  ["\\\\rightarrowbsimilar", '\u2B4C'],
  ["\\\\textfrac\\{3\\}\\{8\\}", '\u215C'],
  ["\\\\blackinwhitesquare", '\u25A3'],
  ["\\\\bsimilarrightarrow", '\u2B47'],
  ["\\\\textfrac\\{1\\}\\{8\\}", '\u215B'],
  ["\\\\textfrac\\{5\\}\\{6\\}", '\u215A'],
  ["\\\\errbarblackdiamond", '\u29F1'],
  ["\\\\mathbf\\{\\\\varrho\\}", '\uD835\uDEE0'],
  ["\\\\textfrac\\{1\\}\\{6\\}", '\u2159'],
  ["\\\\parallelogramblack", '\u25B0'],
  ["\\\\precedesnotsimilar", '\u22E8'],
  ["\\\\ccwundercurvearrow", '\u293F'],
  ["\\\\textfrac\\{4\\}\\{5\\}", '\u2158'],
  ["\\\\inversewhitecircle", '\u25D9'],
  ["\\\\textfrac\\{3\\}\\{5\\}", '\u2157'],
  ["\\\\textfrac\\{1\\}\\{5\\}", '\u2155'],
  ["\\\\mathbit\\{\\\\varpi\\}", '\uD835\uDF55'],
  ["\\\\DownRightTeeVector", '\u295F'],
  ["\\{\\{/\\}\\\\!\\\\!\\{/\\}\\}", '\u2AFD'],
  ["\\\\textfrac\\{1\\}\\{3\\}", '\u2153'],
  ["\\\\mathbit\\{\\\\nabla\\}", '\uD835\uDF35'],
  ["\\\\mathbit\\{\\\\Omega\\}", '\uD835\uDF34'],
  ["\\\\overleftrightarrow", '\u20E1'],
  ["\\\\acute\\{\\\\epsilon\\}", '\u03AD'],
  ["\\\\mathbit\\{\\\\Sigma\\}", '\uD835\uDF2E'],
  ["\\\\mathbf\\{\\\\Lambda\\}", '\uD835\uDEB2'],
  ["\\\\acute\\{\\\\upsilon\\}", '\u03CD'],
  ["\\\\mathbit\\{\\\\Theta\\}", '\uD835\uDF23'],
  ["\\\\mathbit\\{\\\\Delta\\}", '\uD835\uDF1F'],
  ["\\\\mathbit\\{\\\\Gamma\\}", '\uD835\uDF1E'],
  ["\\\\mathsfbfsl\\{\\\\Xi\\}", '\uD835\uDF9D'],
  ["\\\\mathsl\\{\\\\varrho\\}", '\uD835\uDF1A'],
  ["\\\\RightDownVectorBar", '\u2955'],
  ["\\\\textperiodcentered", '\u02D9'],
  ["\\\\textfrac\\{2\\}\\{3\\}", '\u2154'],
  ["\\\\hspace\\{0\\.166em\\}", '\u2006'],
  ["\\\\,|\\\\hspace\\{0\\.167em\\}", '\u2009'],
  ["\\\\circletophalfblack", '\u25D3'],
  ["\\\\rule\\{1em\\}\\{1pt\\}", '\u2015'],
  ["\\\\curvearrowleftplus", '\u293D'],
  ["\\\\rightarrowtriangle", '\u21FE'],
  ["\\\\Longleftrightarrow", '\u27FA'],
  ["\\\\cyrchar\\\\cyrabhdze", '\u04E1'],
  ["\\\\longleftrightarrow", '\u27F7'],
  ["\\\\blacktriangleright", '\u25B8'],
  ["\\\\circleonrightarrow", '\u21F4'],
  ["\\\\cyrchar\\\\CYRABHDZE", '\u04E0'],
  ["\\\\nVtwoheadleftarrow", '\u2B35'],
  ["\\\\rightrightharpoons", '\u2964'],
  ["\\\\cyrchar\\\\CYRCHRDSC", '\u04B6'],
  ["\\\\trianglerightblack", '\u25EE'],
  ["\\\\cyrchar\\\\cyrchldsc", '\u04CC'],
  ["\\\\cyrchar\\\\cyrchrdsc", '\u04B7'],
  ["\\\\mathsfbfsl\\{\\\\Pi\\}", '\uD835\uDF9F'],
  ["\\\\nvtwoheadleftarrow", '\u2B34'],
  ["\\\\textpertenthousand", '\u2031'],
  ["\\\\circledwhitebullet", '\u29BE'],
  ["\\\\cyrchar\\\\CYRCHVCRS", '\u04B8'],
  ["\\\\cyrchar\\\\cyrchvcrs", '\u04B9'],
  ["\\\\mathsl\\{\\\\Lambda\\}", '\uD835\uDEEC'],
  ["\\\\blacktriangleleft", '\u25C2'],
  ["\\\\mathsl\\{\\\\Theta\\}", '\uD835\uDEE9'],
  ["\\\\blacktriangledown", '\u25BE'],
  ["\\\\mathsl\\{\\\\Delta\\}", '\uD835\uDEE5'],
  ["\\\\whitepointerright", '\u25BB'],
  ["\\\\blackpointerright", '\u25BA'],
  ["\\\\mathsl\\{\\\\Gamma\\}", '\uD835\uDEE4'],
  ["\\\\mathbf\\{\\\\Gamma\\}", '\uD835\uDEAA'],
  ["\\\\mathbf\\{\\\\varpi\\}", '\uD835\uDEE1'],
  ["\\\\mathbf\\{\\\\Delta\\}", '\uD835\uDEAB'],
  ["\\\\mathbf\\{\\\\Theta\\}", '\uD835\uDEAF'],
  ["\\\\mathbf\\{\\\\theta\\}", '\uD835\uDEC9'],
  ["\\\\mathbf\\{\\\\nabla\\}", '\uD835\uDEC1'],
  ["\\\\mathbf\\{\\\\Omega\\}", '\uD835\uDEC0'],
  ["\\\\uprightcurvearrow", '\u2934'],
  ["\\\\mathbf\\{\\\\Sigma\\}", '\uD835\uDEBA'],
  ["\\\\similarrightarrow", '\u2972'],
  ["\\\\rightarrowdiamond", '\u291E'],
  ["\\\\rightarrowsimilar", '\u2974'],
  ["\\\\cyrchar\\\\CYRKBEAK", '\u04A0'],
  ["\\\\LeftDownVectorBar", '\u2959'],
  ["\\\\cyrchar\\\\CYRABHHA", '\u04A8'],
  ["\\\\cyrchar\\\\cyrabhha", '\u04A9'],
  ["\\\\cyrchar\\\\cyrkhcrs", '\u049F'],
  ["\\\\cyrchar\\\\CYRKHCRS", '\u049E'],
  ["\\\\cyrchar\\\\cyrkvcrs", '\u049D'],
  ["\\\\downslopeellipsis", '\u22F1'],
  ["\\\\cyrchar\\\\CYRKVCRS", '\u049C'],
  ["\\\\cyrchar\\\\cyrzhdsc", '\u0497'],
  ["\\\\cyrchar\\\\CYRZHDSC", '\u0496'],
  ["\\\\cyrchar\\\\cyrghcrs", '\u0493'],
  ["\\\\cyrchar\\\\CYRGHCRS", '\u0492'],
  ["\\\\rightarrowonoplus", '\u27F4'],
  ["\\\\acwgapcirclearrow", '\u27F2'],
  ["\\\\measuredangleleft", '\u299B'],
  ["\\\\cyrchar\\\\CYRYHCRS", '\u04B0'],
  ["\\\\cyrchar\\\\cyryhcrs", '\u04B1'],
  ["\\\\cyrchar\\\\CYRTETSE", '\u04B4'],
  ["\\\\cyrchar\\\\cyrtetse", '\u04B5'],
  ["\\\\cyrchar\\\\cyrrtick", '\u048F'],
  ["\\\\cyrchar\\\\CYRRTICK", '\u048E'],
  ["\\\\cyrchar\\\\CYRABHCH", '\u04BC'],
  ["\\\\cyrchar\\\\cyrabhch", '\u04BD'],
  ["\\\\cyrchar\\\\cyrkoppa", '\u0481'],
  ["\\\\cyrchar\\\\CYRKOPPA", '\u0480'],
  ["\\\\RightUpDownVector", '\u294F'],
  ["\\\\errbarblacksquare", '\u29EF'],
  ["\\\\errbarblackcircle", '\u29F3'],
  ["\\\\cyrchar\\\\cyromega", '\u0461'],
  ["\\\\cyrchar\\\\CYROMEGA", '\u0460'],
  ["\\\\mathsfbf\\{\\\\Psi\\}", '\uD835\uDF6D'],
  ["\\\\mathsfbf\\{\\\\Phi\\}", '\uD835\uDF6B'],
  ["\\\\mathsl\\{\\\\varpi\\}", '\uD835\uDF1B'],
  ["\\\\mathsl\\{\\\\nabla\\}", '\uD835\uDEFB'],
  ["\\\\mathsl\\{\\\\Omega\\}", '\uD835\uDEFA'],
  ["\\\\mathsl\\{\\\\Sigma\\}", '\uD835\uDEF4'],
  ["\\\\cyrchar\\\\cyrkbeak", '\u04A1'],
  ["\\\\cyrchar\\\\cyrushrt", '\u045E'],
  ["\\\\cyrchar\\\\cyrsftsn", '\u044C'],
  ["\\\\cyrchar\\\\cyrhrdsn", '\u044A'],
  ["\\\\cyrchar\\\\cyrishrt", '\u0439'],
  ["\\\\cyrchar\\\\CYRSFTSN", '\u042C'],
  ["\\\\cyrchar\\\\CYRHRDSN", '\u042A'],
  ["\\\\twoheadrightarrow", '\u21A0'],
  ["\\\\cyrchar\\\\CYRISHRT", '\u0419'],
  ["\\\\cyrchar\\\\CYRUSHRT", '\u040E'],
  ["\\\\varhexagonlrbonds", '\u232C'],
  ["\\\\DownLeftTeeVector", '\u295E'],
  ["\\\\mathbb\\{\\\\Gamma\\}", '\u213E'],
  ["\\\\mathbb\\{\\\\gamma\\}", '\u213D'],
  ["\\\\ddot\\{\\\\upsilon\\}", '\u03CB'],
  ["\\\\varcarriagereturn", '\u23CE'],
  ["\\\\cyrchar\\\\CYRSCHWA", '\u04D8'],
  ["\\\\cyrchar\\\\cyrschwa", '\u04D9'],
  ["\\\\hspace\\{0\\.33em\\}", '\u2004'],
  ["\\\\hspace\\{0\\.25em\\}", '\u2005'],
  ["\\\\textquotedblright", '\u201D'],
  ["\\\\textthreequarters", '\u00BE'],
  ["\\\\textasciidieresis", '\u00A8'],
  ["\\\\diamondrightblack", '\u2B17'],
  ["\\\\circleonleftarrow", '\u2B30'],
  ["\\\\bsimilarleftarrow", '\u2B41'],
  ["\\\\LeftDownTeeVector", '\u2961'],
  ["\\\\leftarrowbsimilar", '\u2B4B'],
  ["\\\\triangleleftblack", '\u25ED'],
  ["\\\\leftrightharpoons", '\u21CB'],
  ["\\\\cwundercurvearrow", '\u293E'],
  ["\\\\DownLeftVectorBar", '\u2956'],
  ["\\\\rightleftharpoons", '\u21CC'],
  ["\\\\circleurquadblack", '\u25D4'],
  ["\\\\mathsfbf\\{\\\\phi\\}", '\uD835\uDF8D'],
  ["\\\\leftarrowtriangle", '\u21FD'],
  ["\\\\mathbb\\{\\\\Sigma\\}", '\u2140'],
  ["\\\\textordmasculine", '\u00BA'],
  ["\\\\nvleftrightarrow", '\u21F9'],
  ["\\\\twoheadleftarrow", '\u219E'],
  ["\\\\diamondleftblack", '\u2B16'],
  ["\\\\cyrchar\\\\CYRSHCH", '\u0429'],
  ["\\\\leftarrowsimilar", '\u2973'],
  ["\\\\cyrchar\\\\CYREREV", '\u042D'],
  ["\\\\downdownharpoons", '\u2965'],
  ["\\\\leftarrowonoplus", '\u2B32'],
  ["\\\\cyrchar\\\\cyrshch", '\u0449'],
  ["\\\\cyrchar\\\\cyrerev", '\u044D'],
  ["\\\\cyrchar\\\\cyrtshe", '\u045B'],
  ["\\\\leftrightharpoon", '\u294A'],
  ["\\\\rightleftharpoon", '\u294B'],
  ["\\\\mathbit\\{\\\\Phi\\}", '\uD835\uDF31'],
  ["\\\\mathbit\\{\\\\Psi\\}", '\uD835\uDF33'],
  ["\\\\mathbit\\{\\\\phi\\}", '\uD835\uDF53'],
  ["\\\\cyrchar\\\\cyrdzhe", '\u045F'],
  ["\\\\mathsfbf\\{\\\\Xi\\}", '\uD835\uDF63'],
  ["\\\\leftleftharpoons", '\u2962'],
  ["\\\\RightUpVectorBar", '\u2954'],
  ["\\\\mathsfbf\\{\\\\Pi\\}", '\uD835\uDF65'],
  ["\\\\rightrightarrows", '\u21C9'],
  ["\\\\cyrchar\\\\CYRIOTE", '\u0464'],
  ["\\\\rightarrowsupset", '\u2B44'],
  ["\\\\cyrchar\\\\cyriote", '\u0465'],
  ["\\\\cyrchar\\\\CYRLYUS", '\u0466'],
  ["\\\\cyrchar\\\\cyrlyus", '\u0467'],
  ["\\\\cyrchar\\\\CYRBYUS", '\u046A'],
  ["\\\\similarleftarrow", '\u2B49'],
  ["\\\\DownArrowUpArrow", '\u21F5'],
  ["\\\\cyrchar\\\\CYRFITA", '\u0472'],
  ["\\\\RightTriangleBar", '\u29D0'],
  ["\\\\twoheaddownarrow", '\u21A1'],
  ["\\\\cyrchar\\\\cyrshha", '\u04BB'],
  ["\\\\cyrchar\\\\CYRSHHA", '\u04BA'],
  ["\\\\openbracketright", '\u301B'],
  ["\\\\sphericalangleup", '\u29A1'],
  ["\\\\whitepointerleft", '\u25C5'],
  ["\\\\cyrchar\\\\cyrhdsc", '\u04B3'],
  ["\\\\cyrchar\\\\CYRHDSC", '\u04B2'],
  ["\\\\cwgapcirclearrow", '\u27F3'],
  ["\\\\blackpointerleft", '\u25C4'],
  ["<\\\\kern\\-0\\.58em\\(", '\u2993'],
  ["\\\\rightthreearrows", '\u21F6'],
  ["\\\\ntrianglerighteq", '\u22ED'],
  ["\\\\cyrchar\\\\CYRZDSC", '\u0498'],
  ["\\\\cyrchar\\\\cyrzdsc", '\u0499'],
  ["\\\\acwunderarcarrow", '\u293B'],
  ["\\\\nVleftrightarrow", '\u21FC'],
  ["\\\\cyrchar\\\\CYRKDSC", '\u049A'],
  ["\\\\nvLeftrightarrow", '\u2904'],
  ["\\\\cyrchar\\\\cyrkdsc", '\u049B'],
  ["\\\\cyrchar\\\\cyrtdsc", '\u04AD'],
  ["\\\\cyrchar\\\\CYRTDSC", '\u04AC'],
  ["\\\\cyrchar\\\\cyrsdsc", '\u04AB'],
  ["\\\\cyrchar\\\\CYRSDSC", '\u04AA'],
  ["\\\\LeftUpDownVector", '\u2951'],
  ["\\\\RightUpTeeVector", '\u295C'],
  ["\\\\rightarrowapprox", '\u2975'],
  ["\\\\hermitconjmatrix", '\u22B9'],
  ["\\\\downharpoonright", '\u21C2'],
  ["\\\\rightharpoondown", '\u21C1'],
  ["\\\\hspace\\{0\\.6em\\}", '\u2002'],
  ["\\\\cyrchar\\\\cyrotld", '\u04E9'],
  ["\\\\cyrchar\\\\CYROTLD", '\u04E8'],
  ["\\\\circlearrowright", '\u21BB'],
  ["\\\\textquotedblleft", '\u201C'],
  ["\\\\vartriangleright", '\u22B3'],
  ["\\\\cyrchar\\\\CYRNDSC", '\u04A2'],
  ["\\\\acute\\{\\\\omega\\}", '\u03CE'],
  ["\\\\textvisiblespace", '\u2423'],
  ["\\\\cyrchar\\\\cyrndsc", '\u04A3'],
  ["\\\\APLrightarrowbox", '\u2348'],
  ["\\\\cyrchar\\\\CYRTSHE", '\u040B'],
  ["\\\\textquestiondown", '\u00BF'],
  ["\\\\diamondleftarrow", '\u291D'],
  ["\\\\cyrchar\\\\CYRDZHE", '\u040F'],
  ["\\\\LeftRightVector", '\u294E'],
  ["\\\\acwoverarcarrow", '\u293A'],
  ["\\\\acwleftarcarrow", '\u2939'],
  ["\\\\cwrightarcarrow", '\u2938'],
  ["\\\\cyrchar\\\\CYRPHK", '\u04A6'],
  ["\\\\cyrchar\\\\cyrphk", '\u04A7'],
  ["\\\\upslopeellipsis", '\u22F0'],
  ["\\\\downarrowbarred", '\u2908'],
  ["\\\\cyrchar\\\\CYRKHK", '\u04C3'],
  ["\\\\cyrchar\\\\cyrkhk", '\u04C4'],
  ["\\\\mathbit\\{\\\\Pi\\}", '\uD835\uDF2B'],
  ["\\\\mathbit\\{\\\\Xi\\}", '\uD835\uDF29'],
  ["\\\\mathsl\\{\\\\phi\\}", '\uD835\uDF19'],
  ["\\\\mathsl\\{\\\\Psi\\}", '\uD835\uDEF9'],
  ["\\\\mathsl\\{\\\\Phi\\}", '\uD835\uDEF7'],
  ["\\\\cyrchar\\\\CYRNHK", '\u04C7'],
  ["\\\\cyrchar\\\\cyrnhk", '\u04C8'],
  ["\\\\perspcorrespond", '\u2306'],
  ["\\\\APLleftarrowbox", '\u2347'],
  ["\\\\APLdownarrowbox", '\u2357'],
  ["\\\\circledrightdot", '\u2686'],
  ["\\\\textperthousand", '\u2030'],
  ["\\\\enclosetriangle", '\u20E4'],
  ["\\\\widebridgeabove", '\u20E9'],
  ["\\\\blockhalfshaded", '\u2592'],
  ["\\\\underrightarrow", '\u20EF'],
  ["\\\\urblacktriangle", '\u25E5'],
  ["\\\\ulblacktriangle", '\u25E4'],
  ["\\\\llblacktriangle", '\u25E3'],
  ["\\\\lrblacktriangle", '\u25E2'],
  ["\\\\bigtriangledown", '\u25BD'],
  ["\\\\mathbf\\{\\\\phi\\}", '\uD835\uDEDF'],
  ["\\\\vrectangleblack", '\u25AE'],
  ["\\\\hrectangleblack", '\u25AC'],
  ["\\\\squarecrossfill", '\u25A9'],
  ["\\\\mathbf\\{\\\\Psi\\}", '\uD835\uDEBF'],
  ["\\\\mathbf\\{\\\\Phi\\}", '\uD835\uDEBD'],
  ["\\\\rightsquigarrow", '\u21DD'],
  ["\\\\vartriangleleft", '\u22B2'],
  ["\\\\trianglerighteq", '\u22B5'],
  ["\\\\nLeftrightarrow", '\u21CE'],
  ["\\\\greaterequivlnt", '\u2273'],
  ["\\\\rightwhitearrow", '\u21E8'],
  ["\\\\mathsfbfsl\\{z\\}", '\uD835\uDE6F'],
  ["\\\\mathsfbfsl\\{y\\}", '\uD835\uDE6E'],
  ["\\\\mathsfbfsl\\{x\\}", '\uD835\uDE6D'],
  ["\\\\mathsfbfsl\\{w\\}", '\uD835\uDE6C'],
  ["\\\\mathsfbfsl\\{v\\}", '\uD835\uDE6B'],
  ["\\\\mathsfbfsl\\{u\\}", '\uD835\uDE6A'],
  ["\\\\mathsfbfsl\\{t\\}", '\uD835\uDE69'],
  ["\\\\mathsfbfsl\\{s\\}", '\uD835\uDE68'],
  ["\\\\mathsfbfsl\\{r\\}", '\uD835\uDE67'],
  ["\\\\mathsfbfsl\\{q\\}", '\uD835\uDE66'],
  ["\\\\mathsfbfsl\\{p\\}", '\uD835\uDE65'],
  ["\\\\mathsfbfsl\\{o\\}", '\uD835\uDE64'],
  ["\\\\mathsfbfsl\\{n\\}", '\uD835\uDE63'],
  ["\\\\mathsfbfsl\\{m\\}", '\uD835\uDE62'],
  ["\\\\mathsfbfsl\\{l\\}", '\uD835\uDE61'],
  ["\\\\mathsfbfsl\\{k\\}", '\uD835\uDE60'],
  ["\\\\mathsfbfsl\\{j\\}", '\uD835\uDE5F'],
  ["\\\\mathsfbfsl\\{i\\}", '\uD835\uDE5E'],
  ["\\\\mathsfbfsl\\{h\\}", '\uD835\uDE5D'],
  ["\\\\mathsfbfsl\\{g\\}", '\uD835\uDE5C'],
  ["\\\\mathsfbfsl\\{f\\}", '\uD835\uDE5B'],
  ["\\\\mathsfbfsl\\{e\\}", '\uD835\uDE5A'],
  ["\\\\mathsfbfsl\\{d\\}", '\uD835\uDE59'],
  ["\\\\mathsfbfsl\\{c\\}", '\uD835\uDE58'],
  ["\\\\mathsfbfsl\\{b\\}", '\uD835\uDE57'],
  ["\\\\mathsfbfsl\\{a\\}", '\uD835\uDE56'],
  ["\\\\mathsfbfsl\\{Z\\}", '\uD835\uDE55'],
  ["\\\\mathsfbfsl\\{Y\\}", '\uD835\uDE54'],
  ["\\\\mathsfbfsl\\{X\\}", '\uD835\uDE53'],
  ["\\\\mathsfbfsl\\{W\\}", '\uD835\uDE52'],
  ["\\\\mathsfbfsl\\{V\\}", '\uD835\uDE51'],
  ["\\\\mathsfbfsl\\{U\\}", '\uD835\uDE50'],
  ["\\\\mathsfbfsl\\{T\\}", '\uD835\uDE4F'],
  ["\\\\mathsfbfsl\\{S\\}", '\uD835\uDE4E'],
  ["\\\\mathsfbfsl\\{R\\}", '\uD835\uDE4D'],
  ["\\\\mathsfbfsl\\{Q\\}", '\uD835\uDE4C'],
  ["\\\\mathsfbfsl\\{P\\}", '\uD835\uDE4B'],
  ["\\\\mathsfbfsl\\{O\\}", '\uD835\uDE4A'],
  ["\\\\mathsfbfsl\\{N\\}", '\uD835\uDE49'],
  ["\\\\mathsfbfsl\\{M\\}", '\uD835\uDE48'],
  ["\\\\mathsfbfsl\\{L\\}", '\uD835\uDE47'],
  ["\\\\mathsfbfsl\\{K\\}", '\uD835\uDE46'],
  ["\\\\mathsfbfsl\\{J\\}", '\uD835\uDE45'],
  ["\\\\mathsfbfsl\\{I\\}", '\uD835\uDE44'],
  ["\\\\mathsfbfsl\\{H\\}", '\uD835\uDE43'],
  ["\\\\mathsfbfsl\\{G\\}", '\uD835\uDE42'],
  ["\\\\mathsfbfsl\\{F\\}", '\uD835\uDE41'],
  ["\\\\mathsfbfsl\\{E\\}", '\uD835\uDE40'],
  ["\\\\mathsfbfsl\\{D\\}", '\uD835\uDE3F'],
  ["\\\\mathsfbfsl\\{C\\}", '\uD835\uDE3E'],
  ["\\\\mathsfbfsl\\{B\\}", '\uD835\uDE3D'],
  ["\\\\mathsfbfsl\\{A\\}", '\uD835\uDE3C'],
  ["\\\\textquotesingle", "'"],
  ["\\\\openbracketleft", '\u301A'],
  ["\\\\leftarrowapprox", '\u2B4A'],
  ["\\\\leftcurvedarrow", '\u2B3F'],
  ["\\\\nVleftarrowtail", '\u2B3A'],
  ["\\\\nvleftarrowtail", '\u2B39'],
  ["\\\\twoheadmapsfrom", '\u2B36'],
  ["\\\\leftthreearrows", '\u2B31'],
  ["\\\\varhexagonblack", '\u2B22'],
  ["\\\\diamondbotblack", '\u2B19'],
  ["\\\\diamondtopblack", '\u2B18'],
  ["\\\\leftrightarrows", '\u21C6'],
  ["\\\\textordfeminine", '\u00AA'],
  ["\\\\textasciimacron", '\u00AF'],
  ["\\\\rightleftarrows", '\u21C4'],
  ["\\\\downharpoonleft", '\u21C3'],
  ["\\\\rightthreetimes", '\u22CC'],
  ["\\\\leftharpoondown", '\u21BD'],
  ["\\\\acute\\{\\\\iota\\}", '\u03AF'],
  ["\\\\circlearrowleft", '\u21BA'],
  ["\\\\cyrchar\\\\CYRDJE", '\u0402'],
  ["\\\\cyrchar\\\\CYRDZE", '\u0405'],
  ["\\\\verymuchgreater", '\u22D9'],
  ["\\\\cyrchar\\\\CYRLJE", '\u0409'],
  ["\\\\cyrchar\\\\CYRNJE", '\u040A'],
  ["\\\\cyrchar\\\\CYRERY", '\u042B'],
  ["\\\\curvearrowright", '\u21B7'],
  ["\\\\not\\\\sqsubseteq", '\u22E2'],
  ["\\\\not\\\\sqsupseteq", '\u22E3'],
  ["\\\\bigtriangleleft", '\u2A1E'],
  ["\\\\cyrchar\\\\cyrery", '\u044B'],
  ["\\\\cyrchar\\\\cyrdje", '\u0452'],
  ["\\\\cyrchar\\\\cyrdze", '\u0455'],
  ["\\\\cyrchar\\\\cyrlje", '\u0459'],
  ["\\\\cyrchar\\\\cyrnje", '\u045A'],
  ["\\\\nleftrightarrow", '\u21AE'],
  ["\\\\cyrchar\\\\CYRYAT", '\u0462'],
  ["\\\\circledownarrow", '\u29EC'],
  ["\\\\cyrchar\\\\CYRKSI", '\u046E'],
  ["\\\\cyrchar\\\\cyrksi", '\u046F'],
  ["\\\\cyrchar\\\\CYRPSI", '\u0470'],
  ["\\\\cyrchar\\\\cyrpsi", '\u0471'],
  ["\\\\cyrchar\\\\CYRIZH", '\u0474'],
  ["\\\\LeftTriangleBar", '\u29CF'],
  ["\\\\uparrowoncircle", '\u29BD'],
  ["\\\\circledparallel", '\u29B7'],
  ["\\\\measangledltosw", '\u29AF'],
  ["\\\\measangledrtose", '\u29AE'],
  ["\\\\measangleultonw", '\u29AD'],
  ["\\\\measangleurtone", '\u29AC'],
  ["\\\\measangleldtosw", '\u29AB'],
  ["\\\\measanglerdtose", '\u29AA'],
  ["\\\\measanglelutonw", '\u29A9'],
  ["\\\\measanglerutone", '\u29A8'],
  ["\\\\cyrchar\\\\CYRGUP", '\u0490'],
  ["\\\\cyrchar\\\\cyrgup", '\u0491'],
  ["\\\\ntrianglelefteq", '\u22EC'],
  ["\\\\cyrchar\\\\CYRGHK", '\u0494'],
  ["\\\\cyrchar\\\\cyrghk", '\u0495'],
  ["\\\\leftarrowsubset", '\u297A'],
  ["\\\\equalrightarrow", '\u2971'],
  ["\\\\barrightharpoon", '\u296D'],
  ["\\\\rightbarharpoon", '\u296C'],
  ["\\\\LeftUpTeeVector", '\u2960'],
  ["\\\\LeftUpVectorBar", '\u2958'],
  ["\\\\notgreaterless", '\u2279'],
  ["\\\\rightouterjoin", '\u27D6'],
  ["\\\\mathbf\\{\\\\Pi\\}", '\uD835\uDEB7'],
  ["\\\\rightarrowtail", '\u21A3'],
  ["\\\\cyrchar\\\\cyrot", '\u047F'],
  ["\\\\cyrchar\\\\CYRUK", '\u0478'],
  ["\\\\cyrchar\\\\CYROT", '\u047E'],
  ["\\\\underleftarrow", '\u20EE'],
  ["\\\\triangleserifs", '\u29CD'],
  ["\\\\blackhourglass", '\u29D7'],
  ["\\\\downdownarrows", '\u21CA'],
  ["\\\\approxnotequal", '\u2246'],
  ["\\\\leftsquigarrow", '\u21DC'],
  ["\\\\mathsl\\{\\\\Pi\\}", '\uD835\uDEF1'],
  ["\\\\mathsl\\{\\\\Xi\\}", '\uD835\uDEEF'],
  ["\\\\cyrchar\\\\cyrje", '\u0458'],
  ["\\\\cyrchar\\\\cyryi", '\u0457'],
  ["\\\\cyrchar\\\\cyrii", '\u0456'],
  ["\\\\cyrchar\\\\cyrie", '\u0454'],
  ["\\\\cyrchar\\\\cyryo", '\u0451'],
  ["\\\\cyrchar\\\\cyrya", '\u044F'],
  ["\\\\cyrchar\\\\cyryu", '\u044E'],
  ["\\\\cyrchar\\\\cyrsh", '\u0448'],
  ["\\\\cyrchar\\\\cyrch", '\u0447'],
  ["\\\\carriagereturn", '\u21B5'],
  ["\\\\cyrchar\\\\cyrzh", '\u0436'],
  ["\\\\cyrchar\\\\CYRYA", '\u042F'],
  ["\\\\cyrchar\\\\CYRYU", '\u042E'],
  ["\\\\curvearrowleft", '\u21B6'],
  ["\\\\cyrchar\\\\CYRSH", '\u0428'],
  ["\\\\cyrchar\\\\CYRCH", '\u0427'],
  ["\\\\bigslopedwedge", '\u2A58'],
  ["\\\\wedgedoublebar", '\u2A60'],
  ["\\\\twoheaduparrow", '\u219F'],
  ["\\\\arrowwaveleft|\\\\arrowwaveright", '\u219C'],
  ["\\\\cyrchar\\\\CYRZH", '\u0416'],
  ["\\\\leftrightarrow", '\u2194'],
  ["\\\\cyrchar\\\\CYRJE", '\u0408'],
  ["\\\\cyrchar\\\\CYRYI", '\u0407'],
  ["\\\\cyrchar\\\\CYRII", '\u0406'],
  ["\\\\cyrchar\\\\CYRIE", '\u0404'],
  ["\\\\mathbb\\{\\\\Pi\\}", '\u213F'],
  ["\\\\cyrchar\\\\CYRYO", '\u0401'],
  ["\\\\APLboxquestion", '\u2370'],
  ["\\\\ddot\\{\\\\iota\\}", '\u03CA'],
  ["\\\\mathbb\\{\\\\pi\\}", '\u213C'],
  ["\\\\hookrightarrow", '\u21AA'],
  ["\\\\lparenextender", '\u239C'],
  ["\\\\rparenextender", '\u239F'],
  ["\\\\acute\\{\\\\eta\\}", '\u03AE'],
  ["\\\\lbrackextender", '\u23A2'],
  ["\\\\NestedLessLess", '\u2AA1'],
  ["\\\\rbrackextender", '\u23A5'],
  ["\\\\vbraceextender", '\u23AA'],
  ["\\\\harrowextender", '\u23AF'],
  ["\\\\cyrchar\\\\CYRAE", '\u04D4'],
  ["\\\\cyrchar\\\\cyrae", '\u04D5'],
  ["\\\\circledtwodots", '\u2687'],
  ["\\\\upharpoonright", '\u21BE'],
  ["\\\\ocommatopright", '\u0315'],
  ["\\\\rightharpoonup", '\u21C0'],
  ["\\\\leftthreetimes", '\u22CB'],
  ["\\\\rightarrowplus", '\u2945'],
  ["\\\\textasciibreve", '\u02D8'],
  ["\\\\textasciicaron", '\u02C7'],
  ["\\\\textdoublepipe", '\u01C2'],
  ["\\\\textonequarter", '\u00BC'],
  ["\\\\guillemotright", '\u00BB'],
  ["\\\\mathrm\\{\\\\mu\\}", '\u00B5'],
  ["\\\\textasciiacute", '\u00B4'],
  ["\\\\guilsinglright", '\u203A'],
  ["\\\\cyrchar\\\\CYRNG", '\u04A4'],
  ["\\\\looparrowright", '\u21AC'],
  ["\\\\textregistered", '\u00AE'],
  ["\\\\dblarrowupdown", '\u21C5'],
  ["\\\\textexclamdown", '\u00A1'],
  ["\\\\squaretopblack", '\u2B12'],
  ["\\\\squarebotblack", '\u2B13'],
  ["\\\\textasciigrave", '`'],
  ["\\\\leftleftarrows", '\u21C7'],
  ["\\\\enclosediamond", '\u20DF'],
  ["\\\\Longrightarrow", '\u27F9'],
  ["\\\\equalleftarrow", '\u2B40'],
  ["\\\\blockrighthalf", '\u2590'],
  ["\\\\blockqtrshaded", '\u2591'],
  ["\\\\RightVectorBar", '\u2953'],
  ["\\\\ntriangleright", '\u22EB'],
  ["\\\\longrightarrow", '\u27F6'],
  ["\\\\updownarrowbar", '\u21A8'],
  ["\\\\cyrchar\\\\cyrng", '\u04A5'],
  ["\\\\rightanglemdot", '\u299D'],
  ["\\\\concavediamond", '\u27E1'],
  ["\\\\rdiagovsearrow", '\u2930'],
  ["\\\\fdiagovnearrow", '\u292F'],
  ["\\\\leftbarharpoon", '\u296A'],
  ["\\\\trianglelefteq", '\u22B4'],
  ["\\\\circlevertfill", '\u25CD'],
  ["\\\\barleftharpoon", '\u296B'],
  ["\\\\dashrightarrow", '\u21E2'],
  ["\\\\RightTeeVector", '\u295B'],
  ["\\\\cyrchar\\\\cyruk", '\u0479'],
  ["\\\\downwhitearrow", '\u21E9'],
  ["\\\\squarenwsefill", '\u25A7'],
  ["\\\\Leftrightarrow", '\u21D4'],
  ["\\\\squareneswfill", '\u25A8'],
  ["\\\\leftwhitearrow", '\u21E6'],
  ["\\\\mathbf\\{\\\\Xi\\}", '\uD835\uDEB5'],
  ["\\\\sphericalangle", '\u2222'],
  ["\\\\notlessgreater", '\u2278'],
  ["\\\\downdasharrow", '\u21E3'],
  ["\\\\mathsfbf\\{R\\}", '\uD835\uDDE5'],
  ["\\\\mathslbb\\{D\\}", '\uD835\uDD6F'],
  ["\\\\mathfrak\\{H\\}", '\u210C'],
  ["\\\\mathslbb\\{E\\}", '\uD835\uDD70'],
  ["\\\\RightArrowBar", '\u21E5'],
  ["\\\\measuredangle", '\u2221'],
  ["\\\\mathslbb\\{F\\}", '\uD835\uDD71'],
  ["\\\\mathsfbf\\{S\\}", '\uD835\uDDE6'],
  ["\\\\mathslbb\\{O\\}", '\uD835\uDD7A'],
  ["\\\\biginterleave", '\u2AFC'],
  ["\\\\mathsfsl\\{Y\\}", '\uD835\uDE20'],
  ["\\\\mathsfsl\\{X\\}", '\uD835\uDE1F'],
  ["\\\\textbrokenbar", '\u00A6'],
  ["\\\\mathsfsl\\{W\\}", '\uD835\uDE1E'],
  ["\\\\textcopyright", '\u00A9'],
  ["\\\\guillemotleft", '\u00AB'],
  ["\\\\textparagraph", '\u00B6'],
  ["\\\\guilsinglleft", '\u2039'],
  ["\\\\mathsfsl\\{V\\}", '\uD835\uDE1D'],
  ["\\\\mathslbb\\{P\\}", '\uD835\uDD7B'],
  ["\\\\mathslbb\\{Q\\}", '\uD835\uDD7C'],
  ["\\\\mathfrak\\{Z\\}", '\u2128'],
  ["\\\\mathsfsl\\{U\\}", '\uD835\uDE1C'],
  ["\\\\shortdowntack", '\u2ADF'],
  ["\\\\shortlefttack", '\u2ADE'],
  ["\\\\textdaggerdbl", '\u2021'],
  ["\\\\mathfrak\\{C\\}", '\u212D'],
  ["\\\\mathslbb\\{R\\}", '\uD835\uDD7D'],
  ["\\\\mathslbb\\{S\\}", '\uD835\uDD7E'],
  ["\\\\mathslbb\\{T\\}", '\uD835\uDD7F'],
  ["\\\\divideontimes", '\u22C7'],
  ["\\\\mathslbb\\{U\\}", '\uD835\uDD80'],
  ["\\\\mathslbb\\{V\\}", '\uD835\uDD81'],
  ["\\\\mathslbb\\{W\\}", '\uD835\uDD82'],
  ["\\\\hookleftarrow", '\u21A9'],
  ["\\\\mathslbb\\{X\\}", '\uD835\uDD83'],
  ["\\\\mathsfsl\\{T\\}", '\uD835\uDE1B'],
  ["\\\\mathsfsl\\{S\\}", '\uD835\uDE1A'],
  ["\\\\upharpoonleft", '\u21BF'],
  ["\\\\mathslbb\\{Y\\}", '\uD835\uDD84'],
  ["\\\\mathsfsl\\{R\\}", '\uD835\uDE19'],
  ["\\\\mathsfsl\\{Q\\}", '\uD835\uDE18'],
  ["\\\\mathslbb\\{Z\\}", '\uD835\uDD85'],
  ["\\\\hphantom\\{,\\}", '\u2008'],
  ["\\\\mathsfsl\\{P\\}", '\uD835\uDE17'],
  ["\\\\mathsfsl\\{O\\}", '\uD835\uDE16'],
  ["\\\\sixteenthnote", '\u266C'],
  ["\\\\hphantom\\{0\\}", '\u2007'],
  ["\\\\hspace\\{1em\\}", '\u2003'],
  ["\\\\Hermaphrodite", '\u26A5'],
  ["\\\\mathslbb\\{a\\}", '\uD835\uDD86'],
  ["\\\\mdsmwhtcircle", '\u26AC'],
  ["\\\\leftharpoonup", '\u21BC'],
  ["\\\\mathsfsl\\{N\\}", '\uD835\uDE15'],
  ["\\\\mathsfsl\\{M\\}", '\uD835\uDE14'],
  ["\\\\cyrchar\\\\cyry", '\u04AF'],
  ["\\\\mathsfsl\\{L\\}", '\uD835\uDE13'],
  ["\\\\APLboxupcaret", '\u2353'],
  ["\\\\APLuparrowbox", '\u2350'],
  ["\\\\mathsfsl\\{K\\}", '\uD835\uDE12'],
  ["\\\\mathsfbf\\{b\\}", '\uD835\uDDEF'],
  ["\\\\sansLmirrored", '\u2143'],
  ["\\\\mathsfsl\\{J\\}", '\uD835\uDE11'],
  ["\\\\mathsfbf\\{l\\}", '\uD835\uDDF9'],
  ["\\\\cyrchar\\\\CYRY", '\u04AE'],
  ["\\\\uparrowbarred", '\u2909'],
  ["\\\\DifferentialD", '\u2146'],
  ["\\\\mathchar\"2208", '\u2316'],
  ["\\\\cyrchar\\\\CYRA", '\u0410'],
  ["\\\\cyrchar\\\\CYRB", '\u0411'],
  ["\\\\cyrchar\\\\CYRV", '\u0412'],
  ["\\\\cyrchar\\\\CYRG", '\u0413'],
  ["\\\\cyrchar\\\\CYRD", '\u0414'],
  ["\\\\cyrchar\\\\CYRE", '\u0415'],
  ["\\\\cyrchar\\\\CYRZ", '\u0417'],
  ["\\\\cyrchar\\\\CYRI", '\u0418'],
  ["\\\\cyrchar\\\\CYRK", '\u041A'],
  ["\\\\cyrchar\\\\CYRL", '\u041B'],
  ["\\\\cyrchar\\\\CYRM", '\u041C'],
  ["\\\\mathsfsl\\{I\\}", '\uD835\uDE10'],
  ["\\\\mathsfsl\\{H\\}", '\uD835\uDE0F'],
  ["\\\\cyrchar\\\\CYRN", '\u041D'],
  ["\\\\mathsfsl\\{G\\}", '\uD835\uDE0E'],
  ["\\\\cyrchar\\\\CYRO", '\u041E'],
  ["\\\\cyrchar\\\\CYRP", '\u041F'],
  ["\\\\mathslbb\\{b\\}", '\uD835\uDD87'],
  ["\\\\mathsfbf\\{9\\}", '\uD835\uDFF5'],
  ["\\\\cyrchar\\\\CYRR", '\u0420'],
  ["\\\\cyrchar\\\\CYRS", '\u0421'],
  ["\\\\cyrchar\\\\CYRT", '\u0422'],
  ["\\\\cyrchar\\\\CYRU", '\u0423'],
  ["\\\\mathsfbf\\{8\\}", '\uD835\uDFF4'],
  ["\\\\mathsfbf\\{7\\}", '\uD835\uDFF3'],
  ["\\\\mathsfbf\\{6\\}", '\uD835\uDFF2'],
  ["\\\\mathslbb\\{c\\}", '\uD835\uDD88'],
  ["\\\\mathslbb\\{d\\}", '\uD835\uDD89'],
  ["\\\\cyrchar\\\\CYRF", '\u0424'],
  ["\\\\mathslbb\\{e\\}", '\uD835\uDD8A'],
  ["\\\\cyrchar\\\\CYRH", '\u0425'],
  ["\\\\cyrchar\\\\CYRC", '\u0426'],
  ["\\\\mathsfbf\\{5\\}", '\uD835\uDFF1'],
  ["\\\\mathslbb\\{f\\}", '\uD835\uDD8B'],
  ["\\\\mathslbb\\{g\\}", '\uD835\uDD8C'],
  ["\\\\mathslbb\\{h\\}", '\uD835\uDD8D'],
  ["\\\\mathsfbf\\{4\\}", '\uD835\uDFF0'],
  ["\\\\mathsfbf\\{3\\}", '\uD835\uDFEF'],
  ["\\\\looparrowleft", '\u21AB'],
  ["\\\\mathslbb\\{i\\}", '\uD835\uDD8E'],
  ["\\\\mathslbb\\{j\\}", '\uD835\uDD8F'],
  ["\\\\cyrchar\\\\cyra", '\u0430'],
  ["\\\\cyrchar\\\\cyrb", '\u0431'],
  ["\\\\cyrchar\\\\cyrv", '\u0432'],
  ["\\\\cyrchar\\\\cyrg", '\u0433'],
  ["\\\\cyrchar\\\\cyrd", '\u0434'],
  ["\\\\mathslbb\\{k\\}", '\uD835\uDD90'],
  ["\\\\triangletimes", '\u2A3B'],
  ["\\\\triangleminus", '\u2A3A'],
  ["\\\\cyrchar\\\\cyre", '\u0435'],
  ["\\\\mathsfbf\\{2\\}", '\uD835\uDFEE'],
  ["\\\\mathslbb\\{l\\}", '\uD835\uDD91'],
  ["\\\\cyrchar\\\\cyrz", '\u0437'],
  ["\\\\cyrchar\\\\cyri", '\u0438'],
  ["\\\\mathslbb\\{m\\}", '\uD835\uDD92'],
  ["\\\\cyrchar\\\\cyrk", '\u043A'],
  ["\\\\mathslbb\\{n\\}", '\uD835\uDD93'],
  ["\\\\mathslbb\\{o\\}", '\uD835\uDD94'],
  ["\\\\mathsfbf\\{c\\}", '\uD835\uDDF0'],
  ["\\\\mathslbb\\{p\\}", '\uD835\uDD95'],
  ["\\\\mathslbb\\{q\\}", '\uD835\uDD96'],
  ["\\\\cyrchar\\\\cyrl", '\u043B'],
  ["\\\\mathslbb\\{r\\}", '\uD835\uDD97'],
  ["\\\\cyrchar\\\\cyrm", '\u043C'],
  ["\\\\mathslbb\\{s\\}", '\uD835\uDD98'],
  ["\\\\cyrchar\\\\cyrn", '\u043D'],
  ["\\\\cyrchar\\\\cyro", '\u043E'],
  ["\\\\cyrchar\\\\cyrp", '\u043F'],
  ["\\\\cyrchar\\\\cyrr", '\u0440'],
  ["\\\\cyrchar\\\\cyrs", '\u0441'],
  ["\\\\cyrchar\\\\cyrt", '\u0442'],
  ["\\\\cyrchar\\\\cyru", '\u0443'],
  ["\\\\cyrchar\\\\cyrf", '\u0444'],
  ["\\\\cyrchar\\\\cyrh", '\u0445'],
  ["\\\\cyrchar\\\\cyrc", '\u0446'],
  ["\\\\mathslbb\\{t\\}", '\uD835\uDD99'],
  ["\\\\mathslbb\\{u\\}", '\uD835\uDD9A'],
  ["\\\\leftarrowplus", '\u2946'],
  ["\\\\mathslbb\\{v\\}", '\uD835\uDD9B'],
  ["\\\\mathslbb\\{w\\}", '\uD835\uDD9C'],
  ["\\\\mathslbb\\{x\\}", '\uD835\uDD9D'],
  ["\\\\mathsfbf\\{1\\}", '\uD835\uDFED'],
  ["\\\\rightdotarrow", '\u2911'],
  ["\\\\mathslbb\\{y\\}", '\uD835\uDD9E'],
  ["\\\\mathsfbf\\{0\\}", '\uD835\uDFEC'],
  ["\\\\leftarrowless", '\u2977'],
  ["\\\\mathsfbf\\{d\\}", '\uD835\uDDF1'],
  ["\\\\mathsfsl\\{E\\}", '\uD835\uDE0C'],
  ["\\\\mathsfsl\\{D\\}", '\uD835\uDE0B'],
  ["\\\\mathslbb\\{z\\}", '\uD835\uDD9F'],
  ["\\\\mathsfsl\\{C\\}", '\uD835\uDE0A'],
  ["\\\\mathsfsl\\{B\\}", '\uD835\uDE09'],
  ["\\\\mathsfbf\\{e\\}", '\uD835\uDDF2'],
  ["\\\\fallingdotseq", '\u2252'],
  ["\\\\mathsfsl\\{A\\}", '\uD835\uDE08'],
  ["\\\\mathsfbf\\{A\\}", '\uD835\uDDD4'],
  ["\\\\errbardiamond", '\u29F0'],
  ["\\\\mathsfbf\\{B\\}", '\uD835\uDDD5'],
  ["\\\\mathsfbf\\{C\\}", '\uD835\uDDD6'],
  ["\\\\mathsfbf\\{f\\}", '\uD835\uDDF3'],
  ["\\\\mathsfbf\\{D\\}", '\uD835\uDDD7'],
  ["\\\\mathsfbf\\{E\\}", '\uD835\uDDD8'],
  ["\\\\mathsfbf\\{F\\}", '\uD835\uDDD9'],
  ["\\\\mathsfbf\\{G\\}", '\uD835\uDDDA'],
  ["\\\\mathsfbf\\{z\\}", '\uD835\uDE07'],
  ["\\\\mathsfbf\\{H\\}", '\uD835\uDDDB'],
  ["\\\\mathsfbf\\{I\\}", '\uD835\uDDDC'],
  ["\\\\mathsfbf\\{J\\}", '\uD835\uDDDD'],
  ["\\\\mathsfbf\\{K\\}", '\uD835\uDDDE'],
  ["\\\\mathsfbf\\{L\\}", '\uD835\uDDDF'],
  ["\\\\mathsfbf\\{M\\}", '\uD835\uDDE0'],
  ["\\\\mathsfbf\\{N\\}", '\uD835\uDDE1'],
  ["\\\\mathsfbf\\{O\\}", '\uD835\uDDE2'],
  ["\\\\mathsfbf\\{g\\}", '\uD835\uDDF4'],
  ["\\\\LeftVectorBar", '\u2952'],
  ["\\\\mathsfbf\\{y\\}", '\uD835\uDE06'],
  ["\\\\mathsfbf\\{P\\}", '\uD835\uDDE3'],
  ["\\\\UpEquilibrium", '\u296E'],
  ["\\\\bigtriangleup", '\u25B3'],
  ["\\\\blacktriangle", '\u25B4'],
  ["\\\\rightanglearc", '\u22BE'],
  ["\\\\dashleftarrow", '\u21E0'],
  ["\\\\triangleright", '\u25B9'],
  ["\\\\mathslbb\\{A\\}", '\uD835\uDD6C'],
  ["\\\\mathsfbf\\{Q\\}", '\uD835\uDDE4'],
  ["\\\\mathfrak\\{I\\}", '\u2111'],
  ["\\\\mathslbb\\{B\\}", '\uD835\uDD6D'],
  ["\\\\not\\\\supseteq", '\u2289'],
  ["\\\\not\\\\subseteq", '\u2288'],
  ["\\\\mathslbb\\{C\\}", '\uD835\uDD6E'],
  ["\\\\mathfrak\\{z\\}", '\uD835\uDD37'],
  ["\\\\mathfrak\\{y\\}", '\uD835\uDD36'],
  ["\\\\mathfrak\\{x\\}", '\uD835\uDD35'],
  ["\\\\mathfrak\\{w\\}", '\uD835\uDD34'],
  ["\\\\mathfrak\\{v\\}", '\uD835\uDD33'],
  ["\\\\mathfrak\\{u\\}", '\uD835\uDD32'],
  ["\\\\mathfrak\\{t\\}", '\uD835\uDD31'],
  ["\\\\mathfrak\\{s\\}", '\uD835\uDD30'],
  ["\\\\mathfrak\\{r\\}", '\uD835\uDD2F'],
  ["\\\\mathfrak\\{q\\}", '\uD835\uDD2E'],
  ["\\\\mathfrak\\{p\\}", '\uD835\uDD2D'],
  ["\\\\mathfrak\\{o\\}", '\uD835\uDD2C'],
  ["\\\\mathfrak\\{n\\}", '\uD835\uDD2B'],
  ["\\\\mathfrak\\{m\\}", '\uD835\uDD2A'],
  ["\\\\mathfrak\\{l\\}", '\uD835\uDD29'],
  ["\\\\mathfrak\\{k\\}", '\uD835\uDD28'],
  ["\\\\mathfrak\\{j\\}", '\uD835\uDD27'],
  ["\\\\mathfrak\\{i\\}", '\uD835\uDD26'],
  ["\\\\mathfrak\\{h\\}", '\uD835\uDD25'],
  ["\\\\mathfrak\\{g\\}", '\uD835\uDD24'],
  ["\\\\mathfrak\\{f\\}", '\uD835\uDD23'],
  ["\\\\mathfrak\\{e\\}", '\uD835\uDD22'],
  ["\\\\mathfrak\\{d\\}", '\uD835\uDD21'],
  ["\\\\mathfrak\\{c\\}", '\uD835\uDD20'],
  ["\\\\mathfrak\\{b\\}", '\uD835\uDD1F'],
  ["\\\\mathfrak\\{a\\}", '\uD835\uDD1E'],
  ["\\\\mathfrak\\{Y\\}", '\uD835\uDD1C'],
  ["\\\\mathfrak\\{X\\}", '\uD835\uDD1B'],
  ["\\\\mathfrak\\{W\\}", '\uD835\uDD1A'],
  ["\\\\mathfrak\\{V\\}", '\uD835\uDD19'],
  ["\\\\mathfrak\\{U\\}", '\uD835\uDD18'],
  ["\\\\mathfrak\\{T\\}", '\uD835\uDD17'],
  ["\\\\mathfrak\\{S\\}", '\uD835\uDD16'],
  ["\\\\mathfrak\\{Q\\}", '\uD835\uDD14'],
  ["\\\\mathfrak\\{P\\}", '\uD835\uDD13'],
  ["\\\\mathfrak\\{O\\}", '\uD835\uDD12'],
  ["\\\\mathfrak\\{N\\}", '\uD835\uDD11'],
  ["\\\\mathfrak\\{M\\}", '\uD835\uDD10'],
  ["\\\\mathfrak\\{L\\}", '\uD835\uDD0F'],
  ["\\\\mathfrak\\{K\\}", '\uD835\uDD0E'],
  ["\\\\mathfrak\\{J\\}", '\uD835\uDD0D'],
  ["\\\\mathfrak\\{G\\}", '\uD835\uDD0A'],
  ["\\\\mathfrak\\{F\\}", '\uD835\uDD09'],
  ["\\\\mathfrak\\{E\\}", '\uD835\uDD08'],
  ["\\\\mathfrak\\{D\\}", '\uD835\uDD07'],
  ["\\\\mathfrak\\{B\\}", '\uD835\uDD05'],
  ["\\\\mathfrak\\{A\\}", '\uD835\uDD04'],
  ["\\\\mathsfsl\\{F\\}", '\uD835\uDE0D'],
  ["\\\\mathslbb\\{G\\}", '\uD835\uDD72'],
  ["\\\\mathslbb\\{H\\}", '\uD835\uDD73'],
  ["\\\\topsemicircle", '\u25E0'],
  ["\\\\botsemicircle", '\u25E1'],
  ["\\\\mathslbb\\{I\\}", '\uD835\uDD74'],
  ["\\\\squareulblack", '\u25E9'],
  ["\\\\mathsfbf\\{x\\}", '\uD835\uDE05'],
  ["\\\\mathsfbf\\{T\\}", '\uD835\uDDE7'],
  ["\\\\leftarrowtail", '\u21A2'],
  ["\\\\mathsfbf\\{w\\}", '\uD835\uDE04'],
  ["\\\\mathsfbf\\{v\\}", '\uD835\uDE03'],
  ["\\\\leftouterjoin", '\u27D5'],
  ["\\\\fullouterjoin", '\u27D7'],
  ["\\\\mathsfbf\\{u\\}", '\uD835\uDE02'],
  ["\\\\circledbullet", '\u29BF'],
  ["\\\\mathsfbf\\{U\\}", '\uD835\uDDE8'],
  ["\\\\LeftTeeVector", '\u295A'],
  ["\\\\mathsfbf\\{V\\}", '\uD835\uDDE9'],
  ["\\\\mathsfbf\\{W\\}", '\uD835\uDDEA'],
  ["\\\\mathsfbf\\{X\\}", '\uD835\uDDEB'],
  ["\\\\circledbslash", '\u29B8'],
  ["\\\\mathsfbf\\{Y\\}", '\uD835\uDDEC'],
  ["\\\\emptysetoarrl", '\u29B4'],
  ["\\\\emptysetocirc", '\u29B2'],
  ["\\\\mathsfbf\\{t\\}", '\uD835\uDE01'],
  ["\\\\mathsfbf\\{h\\}", '\uD835\uDDF5'],
  ["\\\\mathsfbf\\{i\\}", '\uD835\uDDF6'],
  ["\\\\mathsfbf\\{j\\}", '\uD835\uDDF7'],
  ["\\\\mathsfbf\\{s\\}", '\uD835\uDE00'],
  ["\\\\wideangledown", '\u29A6'],
  ["\\\\mathsfbf\\{r\\}", '\uD835\uDDFF'],
  ["\\\\mathsfbf\\{q\\}", '\uD835\uDDFE'],
  ["\\\\mathsfbf\\{Z\\}", '\uD835\uDDED'],
  ["\\\\mathsfbf\\{p\\}", '\uD835\uDDFD'],
  ["\\\\mathsfbf\\{a\\}", '\uD835\uDDEE'],
  ["\\\\mathsfbf\\{k\\}", '\uD835\uDDF8'],
  ["\\\\longleftarrow", '\u27F5'],
  ["\\\\mathsfsl\\{z\\}", '\uD835\uDE3B'],
  ["\\\\mathsfsl\\{y\\}", '\uD835\uDE3A'],
  ["\\\\mathsfsl\\{x\\}", '\uD835\uDE39'],
  ["\\\\mathsfsl\\{w\\}", '\uD835\uDE38'],
  ["\\\\mathsfsl\\{v\\}", '\uD835\uDE37'],
  ["\\\\mathsfsl\\{u\\}", '\uD835\uDE36'],
  ["\\\\mathsfsl\\{t\\}", '\uD835\uDE35'],
  ["\\\\mathsfsl\\{s\\}", '\uD835\uDE34'],
  ["\\\\mathsfsl\\{r\\}", '\uD835\uDE33'],
  ["\\\\mathsfsl\\{q\\}", '\uD835\uDE32'],
  ["\\\\mathsfsl\\{p\\}", '\uD835\uDE31'],
  ["\\\\mathsfsl\\{o\\}", '\uD835\uDE30'],
  ["\\\\mathsfsl\\{n\\}", '\uD835\uDE2F'],
  ["\\\\mathsfsl\\{m\\}", '\uD835\uDE2E'],
  ["\\\\mathsfsl\\{l\\}", '\uD835\uDE2D'],
  ["\\\\mathsfsl\\{k\\}", '\uD835\uDE2C'],
  ["\\\\mathsfsl\\{j\\}", '\uD835\uDE2B'],
  ["\\\\mathsfsl\\{i\\}", '\uD835\uDE2A'],
  ["\\\\mathsfsl\\{h\\}", '\uD835\uDE29'],
  ["\\\\mathsfsl\\{g\\}", '\uD835\uDE28'],
  ["\\\\ntriangleleft", '\u22EA'],
  ["\\\\backslash|\\\\textbackslash", '\u0871'], // An unused character that will later be converted to backslash
  ["\\\\varlrtriangle", '\u22BF'],
  ["\\\\rightpentagon", '\u2B54'],
  ["\\\\mathsfsl\\{f\\}", '\uD835\uDE27'],
  ["\\\\mathfrak\\{R\\}", '\u211C'],
  ["\\\\mathsfsl\\{e\\}", '\uD835\uDE26'],
  ["\\\\mdsmwhtsquare", '\u25FD'],
  ["\\\\mdsmblksquare", '\u25FE'],
  ["\\\\rightarrowgtr", '\u2B43'],
  ["\\\\mathsfbf\\{o\\}", '\uD835\uDDFC'],
  ["\\\\threeunderdot", '\u20E8'],
  ["\\\\blocklefthalf", '\u258C'],
  ["\\\\texttrademark", '\u2122'],
  ["\\\\Longleftarrow", '\u27F8'],
  ["\\\\mathsfbf\\{n\\}", '\uD835\uDDFB'],
  ["\\\\enclosesquare", '\u20DE'],
  ["\\\\mathslbb\\{J\\}", '\uD835\uDD75'],
  ["\\\\mathslbb\\{K\\}", '\uD835\uDD76'],
  ["\\\\enclosecircle", '\u20DD'],
  ["\\\\mathsfbf\\{m\\}", '\uD835\uDDFA'],
  ["\\\\mathslbb\\{L\\}", '\uD835\uDD77'],
  ["\\\\mathsfsl\\{d\\}", '\uD835\uDE25'],
  ["\\\\mathsfsl\\{c\\}", '\uD835\uDE24'],
  ["\\\\mathsfsl\\{b\\}", '\uD835\uDE23'],
  ["\\\\mathsfsl\\{a\\}", '\uD835\uDE22'],
  ["\\\\mathsfsl\\{Z\\}", '\uD835\uDE21'],
  ["\\\\pentagonblack", '\u2B1F'],
  ["\\\\vysmwhtsquare", '\u2B1E'],
  ["\\\\vysmblksquare", '\u2B1D'],
  ["\\\\mathslbb\\{M\\}", '\uD835\uDD78'],
  ["\\\\mathslbb\\{N\\}", '\uD835\uDD79'],
  ["\\\\squarellblack", '\u2B15'],
  ["\\\\squareurblack", '\u2B14'],
  ["\\\\bigtalloblong", '\u2AFF'],
  ["\\\\mathscr\\{c\\}", '\uD835\uDCB8'],
  ["\\\\'\\$\\\\alpha\\$", '\u03AC'],
  ["\\\\mathbit\\{q\\}", '\uD835\uDC92'],
  ["\\\\mathbit\\{r\\}", '\uD835\uDC93'],
  ["\\\\mathbit\\{s\\}", '\uD835\uDC94'],
  ["\\\\surfintegral", '\u222F'],
  ["\\\\mathbit\\{t\\}", '\uD835\uDC95'],
  ["\\\\trianglecdot", '\u25EC'],
  ["\\\\mathbit\\{u\\}", '\uD835\uDC96'],
  ["\\\\mathbit\\{v\\}", '\uD835\uDC97'],
  ["\\\\mathbit\\{w\\}", '\uD835\uDC98'],
  ["\\\\lessequivlnt", '\u2272'],
  ["\\\\mathscr\\{g\\}", '\u210A'],
  ["\\\\mathscr\\{d\\}", '\uD835\uDCB9'],
  ["\\\\longdivision", '\u27CC'],
  ["\\\\eqqslantless", '\u2A9B'],
  ["\\\\mathscr\\{H\\}", '\u210B'],
  ["\\\\mathbit\\{x\\}", '\uD835\uDC99'],
  ["\\\\upwhitearrow", '\u21E7'],
  ["\\\\mathbit\\{y\\}", '\uD835\uDC9A'],
  ["\\\\mathbit\\{z\\}", '\uD835\uDC9B'],
  ["\\\\mathscr\\{A\\}", '\uD835\uDC9C'],
  ["\\\\dottedcircle", '\u25CC'],
  ["\\\\mathmit\\{D\\}", '\uD835\uDCD3'],
  ["\\\\odotslashdot", '\u29BC'],
  ["\\\\cupleftarrow", '\u228C'],
  ["\\\\mathscr\\{I\\}", '\u2110'],
  ["\\\\notbackslash", '\u2340'],
  ["\\\\textvartheta", '\u03D1'],
  ["\\\\LeftArrowBar", '\u21E4'],
  ["\\\\mathmit\\{I\\}", '\uD835\uDCD8'],
  ["\\\\lozengeminus", '\u27E0'],
  ["\\\\mathscr\\{C\\}", '\uD835\uDC9E'],
  ["\\\\emptysetoarr", '\u29B3'],
  ["\\\\mathscr\\{f\\}", '\uD835\uDCBB'],
  ["\\\\emptysetobar", '\u29B1'],
  ["\\\\mathscr\\{D\\}", '\uD835\uDC9F'],
  ["\\\\mathbit\\{A\\}", '\uD835\uDC68'],
  ["\\\\fdiagovrdiag", '\u292C'],
  ["\\\\mathscr\\{h\\}", '\uD835\uDCBD'],
  ["\\\\verymuchless", '\u22D8'],
  ["\\\\mathbit\\{B\\}", '\uD835\uDC69'],
  ["\\\\mathbit\\{C\\}", '\uD835\uDC6A'],
  ["\\\\mathscr\\{G\\}", '\uD835\uDCA2'],
  ["\\\\upupharpoons", '\u2963'],
  ["\\\\nvRightarrow", '\u2903'],
  ["\\\\mathscr\\{J\\}", '\uD835\uDCA5'],
  ["\\\\revangleubar", '\u29A5'],
  ["\\\\mathscr\\{K\\}", '\uD835\uDCA6'],
  ["\\\\mathbit\\{D\\}", '\uD835\uDC6B'],
  ["\\\\mathmit\\{H\\}", '\uD835\uDCD7'],
  ["\\\\mathmit\\{G\\}", '\uD835\uDCD6'],
  ["\\\\mathscr\\{N\\}", '\uD835\uDCA9'],
  ["\\\\mathscr\\{i\\}", '\uD835\uDCBE'],
  ["\\\\mathmit\\{F\\}", '\uD835\uDCD5'],
  ["\\\\mathbit\\{E\\}", '\uD835\uDC6C'],
  ["\\\\mathbit\\{F\\}", '\uD835\uDC6D'],
  ["\\\\mathbit\\{G\\}", '\uD835\uDC6E'],
  ["\\\\mathmit\\{z\\}", '\uD835\uDD03'],
  ["\\\\mathbit\\{H\\}", '\uD835\uDC6F'],
  ["\\\\PropertyLine", '\u214A'],
  ["\\\\mathscr\\{j\\}", '\uD835\uDCBF'],
  ["\\\\mathscr\\{O\\}", '\uD835\uDCAA'],
  ["\\\\mathmit\\{y\\}", '\uD835\uDD02'],
  ["\\\\DownArrowBar", '\u2913'],
  ["\\\\mathscr\\{k\\}", '\uD835\uDCC0'],
  ["\\\\mathscr\\{m\\}", '\uD835\uDCC2'],
  ["\\\\mathscr\\{n\\}", '\uD835\uDCC3'],
  ["\\\\mathmit\\{x\\}", '\uD835\uDD01'],
  ["\\\\mathscr\\{P\\}", '\uD835\uDCAB'],
  ["\\\\mathmit\\{w\\}", '\uD835\uDD00'],
  ["\\\\mathmit\\{v\\}", '\uD835\uDCFF'],
  ["\\\\mathscr\\{Q\\}", '\uD835\uDCAC'],
  ["\\\\mathmit\\{u\\}", '\uD835\uDCFE'],
  ["\\\\mathmit\\{t\\}", '\uD835\uDCFD'],
  ["\\\\mathscr\\{p\\}", '\uD835\uDCC5'],
  ["\\\\mathscr\\{q\\}", '\uD835\uDCC6'],
  ["\\\\mathscr\\{r\\}", '\uD835\uDCC7'],
  ["\\\\mathscr\\{S\\}", '\uD835\uDCAE'],
  ["\\\\mathmit\\{s\\}", '\uD835\uDCFC'],
  ["\\\\mathmit\\{r\\}", '\uD835\uDCFB'],
  ["\\\\mathmit\\{q\\}", '\uD835\uDCFA'],
  ["\\\\squareulquad", '\u25F0'],
  ["\\\\mathbit\\{I\\}", '\uD835\uDC70'],
  ["\\\\squarellquad", '\u25F1'],
  ["\\\\risingdotseq", '\u2253'],
  ["\\\\squarelrquad", '\u25F2'],
  ["\\\\squareurquad", '\u25F3'],
  ["\\\\mathmit\\{p\\}", '\uD835\uDCF9'],
  ["\\\\circleulquad", '\u25F4'],
  ["\\\\circledequal", '\u229C'],
  ["\\\\medblackstar", '\u2B51'],
  ["\\\\medwhitestar", '\u2B50'],
  ["\\\\circlellquad", '\u25F5'],
  ["\\\\circlelrquad", '\u25F6'],
  ["\\\\mathbit\\{J\\}", '\uD835\uDC71'],
  ["\\\\circleurquad", '\u25F7'],
  ["\\\\squarehvfill", '\u25A6'],
  ["\\\\rightdbltail", '\u291C'],
  ["\\\\mathscr\\{s\\}", '\uD835\uDCC8'],
  ["\\\\mathmit\\{o\\}", '\uD835\uDCF8'],
  ["\\\\mathscr\\{t\\}", '\uD835\uDCC9'],
  ["\\\\doublebarvee", '\u2A62'],
  ["\\\\mathbit\\{K\\}", '\uD835\uDC72'],
  ["\\\\mathbit\\{L\\}", '\uD835\uDC73'],
  ["\\\\mathbit\\{M\\}", '\uD835\uDC74'],
  ["\\\\errbarcircle", '\u29F2'],
  ["\\\\mathscr\\{T\\}", '\uD835\uDCAF'],
  ["\\\\mathmit\\{n\\}", '\uD835\uDCF7'],
  ["\\\\blocklowhalf", '\u2584'],
  ["\\\\mathmit\\{m\\}", '\uD835\uDCF6'],
  ["\\\\mathmit\\{E\\}", '\uD835\uDCD4'],
  ["\\\\mathbit\\{N\\}", '\uD835\uDC75'],
  ["\\\\leftdotarrow", '\u2B38'],
  ["\\\\mathbit\\{O\\}", '\uD835\uDC76'],
  ["\\\\mathmit\\{l\\}", '\uD835\uDCF5'],
  ["\\\\wedgemidvert", '\u2A5A'],
  ["\\\\errbarsquare", '\u29EE'],
  ["\\\\mathscr\\{U\\}", '\uD835\uDCB0'],
  ["\\\\bigslopedvee", '\u2A57'],
  ["\\\\mathmit\\{k\\}", '\uD835\uDCF4'],
  ["\\\\mathmit\\{j\\}", '\uD835\uDCF3'],
  ["\\\\blacklozenge", '\u29EB'],
  ["\\\\mathmit\\{i\\}", '\uD835\uDCF2'],
  ["\\\\mathscr\\{V\\}", '\uD835\uDCB1'],
  ["\\\\mathmit\\{h\\}", '\uD835\uDCF1'],
  ["\\\\smwhtlozenge", '\u2B2B'],
  ["\\\\smblklozenge", '\u2B2A'],
  ["\\\\smblkdiamond", '\u2B29'],
  ["\\\\mdwhtlozenge", '\u2B28'],
  ["\\\\mdblklozenge", '\u2B27'],
  ["\\\\mdwhtdiamond", '\u2B26'],
  ["\\\\mdblkdiamond", '\u2B25'],
  ["\\\\mathmit\\{g\\}", '\uD835\uDCF0'],
  ["\\\\hexagonblack", '\u2B23'],
  ["\\\\rbrackurtick", '\u2990'],
  ["\\\\mathbit\\{P\\}", '\uD835\uDC77'],
  ["\\\\mathbit\\{Q\\}", '\uD835\uDC78'],
  ["\\\\mathscr\\{W\\}", '\uD835\uDCB2'],
  ["\\\\mathmit\\{f\\}", '\uD835\uDCEF'],
  ["\\\\closedvarcap", '\u2A4D'],
  ["\\\\dottedsquare", '\u2B1A'],
  ["\\\\lbracklltick", '\u298F'],
  ["\\\\rbracklrtick", '\u298E'],
  ["\\\\closedvarcup", '\u2A4C'],
  ["\\\\mathmit\\{e\\}", '\uD835\uDCEE'],
  ["\\\\downfishtail", '\u297F'],
  ["\\\\mathmit\\{d\\}", '\uD835\uDCED'],
  ["\\\\mathbit\\{R\\}", '\uD835\uDC79'],
  ["\\\\mathbit\\{S\\}", '\uD835\uDC7A'],
  ["\\\\mathmit\\{c\\}", '\uD835\uDCEC'],
  ["\\\\lbrackultick", '\u298D'],
  ["\\\\mathmit\\{b\\}", '\uD835\uDCEB'],
  ["\\\\mathscr\\{X\\}", '\uD835\uDCB3'],
  ["\\\\mathbit\\{T\\}", '\uD835\uDC7B'],
  ["\\\\mathmit\\{a\\}", '\uD835\uDCEA'],
  ["\\\\lrtriangleeq", '\u29E1'],
  ["\\\\mathbit\\{U\\}", '\uD835\uDC7C'],
  ["\\\\textsterling", '\u00A3'],
  ["\\\\textcurrency", '\u00A4'],
  ["\\\\mathscr\\{Y\\}", '\uD835\uDCB4'],
  ["\\\\mathbit\\{V\\}", '\uD835\uDC7D'],
  ["\\\\mathscr\\{Z\\}", '\uD835\uDCB5'],
  ["\\\\hyphenbullet", '\u2043'],
  ["\\\\mathmit\\{Z\\}", '\uD835\uDCE9'],
  ["\\\\longmapsfrom", '\u27FB'],
  ["\\\\multimapboth", '\u29DF'],
  ["\\\\mathbit\\{W\\}", '\uD835\uDC7E'],
  ["\\\\mathbit\\{X\\}", '\uD835\uDC7F'],
  ["\\\\mathbit\\{Y\\}", '\uD835\uDC80'],
  ["\\\\mathbit\\{Z\\}", '\uD835\uDC81'],
  ["\\\\mathbit\\{a\\}", '\uD835\uDC82'],
  ["\\\\mathbit\\{b\\}", '\uD835\uDC83'],
  ["\\\\mathmit\\{Y\\}", '\uD835\uDCE8'],
  ["\\\\mathmit\\{X\\}", '\uD835\uDCE7'],
  ["\\\\mathbit\\{c\\}", '\uD835\uDC84'],
  ["\\\\mathbit\\{d\\}", '\uD835\uDC85'],
  ["\\\\mathmit\\{W\\}", '\uD835\uDCE6'],
  ["\\\\mathmit\\{V\\}", '\uD835\uDCE5'],
  ["\\\\mathmit\\{U\\}", '\uD835\uDCE4'],
  ["\\\\RoundImplies", '\u2970'],
  ["\\\\triangleplus", '\u2A39'],
  ["\\\\rdiagovfdiag", '\u292B'],
  ["\\\\mathscr\\{a\\}", '\uD835\uDCB6'],
  ["\\\\mathscr\\{u\\}", '\uD835\uDCCA'],
  ["\\\\mathscr\\{B\\}", '\u212C'],
  ["\\\\mathmit\\{T\\}", '\uD835\uDCE3'],
  ["\\\\mathscr\\{b\\}", '\uD835\uDCB7'],
  ["\\\\mathmit\\{S\\}", '\uD835\uDCE2'],
  ["\\\\mathscr\\{e\\}", '\u212F'],
  ["\\\\mathbit\\{e\\}", '\uD835\uDC86'],
  ["\\\\mathmit\\{R\\}", '\uD835\uDCE1'],
  ["\\\\mathscr\\{v\\}", '\uD835\uDCCB'],
  ["\\\\mathscr\\{w\\}", '\uD835\uDCCC'],
  ["\\\\mathbit\\{f\\}", '\uD835\uDC87'],
  ["\\\\mathbit\\{g\\}", '\uD835\uDC88'],
  ["\\\\mathscr\\{x\\}", '\uD835\uDCCD'],
  ["\\\\texttildelow", '\u02DC'],
  ["\\\\mathbit\\{h\\}", '\uD835\uDC89'],
  ["\\\\varspadesuit", '\u2664'],
  ["\\\\mathscr\\{y\\}", '\uD835\uDCCE'],
  ["\\\\mathbit\\{i\\}", '\uD835\uDC8A'],
  ["\\\\mathmit\\{Q\\}", '\uD835\uDCE0'],
  ["\\\\supsetapprox", '\u2ACA'],
  ["\\\\subsetapprox", '\u2AC9'],
  ["\\\\rightbkarrow", '\u290D'],
  ["\\\\mathbit\\{j\\}", '\uD835\uDC8B'],
  ["\\\\mathmit\\{P\\}", '\uD835\uDCDF'],
  ["\\\\mathscr\\{R\\}", '\u211B'],
  ["\\\\mathmit\\{O\\}", '\uD835\uDCDE'],
  ["\\\\mathscr\\{z\\}", '\uD835\uDCCF'],
  ["\\\\oturnedcomma", '\u0312'],
  ["\\\\mathbit\\{k\\}", '\uD835\uDC8C'],
  ["\\\\mathbit\\{l\\}", '\uD835\uDC8D'],
  ["\\\\Longmapsfrom", '\u27FD'],
  ["\\\\mathmit\\{N\\}", '\uD835\uDCDD'],
  ["\\\\mathmit\\{A\\}", '\uD835\uDCD0'],
  ["\\\\mathmit\\{M\\}", '\uD835\uDCDC'],
  ["\\\\triangledown", '\u25BF'],
  ["\\\\triangleleft", '\u25C3'],
  ["\\\\mathmit\\{L\\}", '\uD835\uDCDB'],
  ["\\\\mathmit\\{B\\}", '\uD835\uDCD1'],
  ["\\\\mathscr\\{l\\}", '\u2113'],
  ["\\\\leftdbkarrow", '\u290E'],
  ["\\\\mathbit\\{m\\}", '\uD835\uDC8E'],
  ["\\\\mathbit\\{n\\}", '\uD835\uDC8F'],
  ["\\\\mathbit\\{o\\}", '\uD835\uDC90'],
  ["\\\\mathmit\\{K\\}", '\uD835\uDCDA'],
  ["\\\\mathscr\\{L\\}", '\u2112'],
  ["\\\\mathmit\\{C\\}", '\uD835\uDCD2'],
  ["\\\\mathmit\\{J\\}", '\uD835\uDCD9'],
  ["\\\\mathscr\\{E\\}", '\u2130'],
  ["\\\\mathrm\\{'Y\\}", '\u038E'],
  ["\\\\mathscr\\{F\\}", '\u2131'],
  ["\\\\mathscr\\{M\\}", '\u2133'],
  ["\\\\underbracket", '\u23B5'],
  ["\\\\mathscr\\{o\\}", '\u2134'],
  ["\\\\mathbit\\{p\\}", '\uD835\uDC91'],
  ["\\\\nHdownarrow", '\u21DF'],
  ["\\\\forcesextra", '\u22A8'],
  ["\\\\updasharrow", '\u21E1'],
  ["\\\\circleddash", '\u229D'],
  ["\\\\circledcirc", '\u229A'],
  ["\\\\nvleftarrow", '\u21F7'],
  ["\\\\nVleftarrow", '\u21FA'],
  ["\\\\not\\\\supset", '\u2285'],
  ["\\\\not\\\\subset", '\u2284'],
  ["\\\\succcurlyeq", '\u227D'],
  ["\\\\preccurlyeq", '\u227C'],
  ["\\\\int\\\\!\\\\int", '\u222C'],
  ["\\\\volintegral", '\u2230'],
  ["\\\\clwintegral", '\u2231'],
  ["\\\\not\\\\approx", '\u2249'],
  ["\\\\mathtt\\{z\\}", '\uD835\uDEA3'],
  ["\\\\mathtt\\{y\\}", '\uD835\uDEA2'],
  ["\\\\mathtt\\{x\\}", '\uD835\uDEA1'],
  ["\\\\mathtt\\{w\\}", '\uD835\uDEA0'],
  ["\\\\mathtt\\{v\\}", '\uD835\uDE9F'],
  ["\\\\mathtt\\{u\\}", '\uD835\uDE9E'],
  ["\\\\mathtt\\{t\\}", '\uD835\uDE9D'],
  ["\\\\mathtt\\{s\\}", '\uD835\uDE9C'],
  ["\\\\mathtt\\{r\\}", '\uD835\uDE9B'],
  ["\\\\mathtt\\{q\\}", '\uD835\uDE9A'],
  ["\\\\mathtt\\{p\\}", '\uD835\uDE99'],
  ["\\\\mathtt\\{o\\}", '\uD835\uDE98'],
  ["\\\\mathtt\\{n\\}", '\uD835\uDE97'],
  ["\\\\mathtt\\{m\\}", '\uD835\uDE96'],
  ["\\\\mathtt\\{l\\}", '\uD835\uDE95'],
  ["\\\\mathtt\\{k\\}", '\uD835\uDE94'],
  ["\\\\mathtt\\{j\\}", '\uD835\uDE93'],
  ["\\\\mathtt\\{i\\}", '\uD835\uDE92'],
  ["\\\\mathtt\\{h\\}", '\uD835\uDE91'],
  ["\\\\mathtt\\{g\\}", '\uD835\uDE90'],
  ["\\\\mathtt\\{f\\}", '\uD835\uDE8F'],
  ["\\\\mathtt\\{e\\}", '\uD835\uDE8E'],
  ["\\\\mathtt\\{d\\}", '\uD835\uDE8D'],
  ["\\\\mathtt\\{c\\}", '\uD835\uDE8C'],
  ["\\\\mathtt\\{b\\}", '\uD835\uDE8B'],
  ["\\\\mathtt\\{a\\}", '\uD835\uDE8A'],
  ["\\\\mathtt\\{Z\\}", '\uD835\uDE89'],
  ["\\\\mathtt\\{Y\\}", '\uD835\uDE88'],
  ["\\\\mathtt\\{X\\}", '\uD835\uDE87'],
  ["\\\\mathtt\\{W\\}", '\uD835\uDE86'],
  ["\\\\mathtt\\{V\\}", '\uD835\uDE85'],
  ["\\\\mathtt\\{U\\}", '\uD835\uDE84'],
  ["\\\\mathtt\\{T\\}", '\uD835\uDE83'],
  ["\\\\mathtt\\{S\\}", '\uD835\uDE82'],
  ["\\\\mathtt\\{R\\}", '\uD835\uDE81'],
  ["\\\\mathtt\\{Q\\}", '\uD835\uDE80'],
  ["\\\\mathtt\\{P\\}", '\uD835\uDE7F'],
  ["\\\\mathtt\\{O\\}", '\uD835\uDE7E'],
  ["\\\\mathtt\\{N\\}", '\uD835\uDE7D'],
  ["\\\\mathtt\\{M\\}", '\uD835\uDE7C'],
  ["\\\\mathtt\\{L\\}", '\uD835\uDE7B'],
  ["\\\\mathtt\\{K\\}", '\uD835\uDE7A'],
  ["\\\\mathtt\\{J\\}", '\uD835\uDE79'],
  ["\\\\mathtt\\{I\\}", '\uD835\uDE78'],
  ["\\\\mathtt\\{H\\}", '\uD835\uDE77'],
  ["\\\\mathtt\\{G\\}", '\uD835\uDE76'],
  ["\\\\mathtt\\{F\\}", '\uD835\uDE75'],
  ["\\\\mathtt\\{E\\}", '\uD835\uDE74'],
  ["\\\\mathtt\\{D\\}", '\uD835\uDE73'],
  ["\\\\mathtt\\{C\\}", '\uD835\uDE72'],
  ["\\\\mathtt\\{B\\}", '\uD835\uDE71'],
  ["\\\\mathtt\\{A\\}", '\uD835\uDE70'],
  ["\\\\mathsf\\{z\\}", '\uD835\uDDD3'],
  ["\\\\mathsf\\{y\\}", '\uD835\uDDD2'],
  ["\\\\mathsf\\{x\\}", '\uD835\uDDD1'],
  ["\\\\mathsf\\{w\\}", '\uD835\uDDD0'],
  ["\\\\mathsf\\{v\\}", '\uD835\uDDCF'],
  ["\\\\mathsf\\{u\\}", '\uD835\uDDCE'],
  ["\\\\mathsf\\{t\\}", '\uD835\uDDCD'],
  ["\\\\mathsf\\{s\\}", '\uD835\uDDCC'],
  ["\\\\mathsf\\{r\\}", '\uD835\uDDCB'],
  ["\\\\mathsf\\{q\\}", '\uD835\uDDCA'],
  ["\\\\mathsf\\{p\\}", '\uD835\uDDC9'],
  ["\\\\mathsf\\{o\\}", '\uD835\uDDC8'],
  ["\\\\mathsf\\{n\\}", '\uD835\uDDC7'],
  ["\\\\mathsf\\{m\\}", '\uD835\uDDC6'],
  ["\\\\mathsf\\{l\\}", '\uD835\uDDC5'],
  ["\\\\mathsf\\{k\\}", '\uD835\uDDC4'],
  ["\\\\mathsf\\{j\\}", '\uD835\uDDC3'],
  ["\\\\mathsf\\{i\\}", '\uD835\uDDC2'],
  ["\\\\mathsf\\{h\\}", '\uD835\uDDC1'],
  ["\\\\mathsf\\{g\\}", '\uD835\uDDC0'],
  ["\\\\mathsf\\{f\\}", '\uD835\uDDBF'],
  ["\\\\mathsf\\{e\\}", '\uD835\uDDBE'],
  ["\\\\mathsf\\{d\\}", '\uD835\uDDBD'],
  ["\\\\mathsf\\{c\\}", '\uD835\uDDBC'],
  ["\\\\mathsf\\{b\\}", '\uD835\uDDBB'],
  ["\\\\mathsf\\{a\\}", '\uD835\uDDBA'],
  ["\\\\mathsf\\{Z\\}", '\uD835\uDDB9'],
  ["\\\\mathsf\\{Y\\}", '\uD835\uDDB8'],
  ["\\\\mathsf\\{X\\}", '\uD835\uDDB7'],
  ["\\\\mathsf\\{W\\}", '\uD835\uDDB6'],
  ["\\\\mathsf\\{V\\}", '\uD835\uDDB5'],
  ["\\\\mathsf\\{U\\}", '\uD835\uDDB4'],
  ["\\\\mathsf\\{T\\}", '\uD835\uDDB3'],
  ["\\\\mathsf\\{S\\}", '\uD835\uDDB2'],
  ["\\\\mathsf\\{R\\}", '\uD835\uDDB1'],
  ["\\\\mathsf\\{Q\\}", '\uD835\uDDB0'],
  ["\\\\mathsf\\{P\\}", '\uD835\uDDAF'],
  ["\\\\mathsf\\{O\\}", '\uD835\uDDAE'],
  ["\\\\mathsf\\{N\\}", '\uD835\uDDAD'],
  ["\\\\mathsf\\{M\\}", '\uD835\uDDAC'],
  ["\\\\mathsf\\{L\\}", '\uD835\uDDAB'],
  ["\\\\mathsf\\{K\\}", '\uD835\uDDAA'],
  ["\\\\mathsf\\{J\\}", '\uD835\uDDA9'],
  ["\\\\mathsf\\{I\\}", '\uD835\uDDA8'],
  ["\\\\mathsf\\{H\\}", '\uD835\uDDA7'],
  ["\\\\mathsf\\{G\\}", '\uD835\uDDA6'],
  ["\\\\mathsf\\{F\\}", '\uD835\uDDA5'],
  ["\\\\mathsf\\{E\\}", '\uD835\uDDA4'],
  ["\\\\mathsf\\{D\\}", '\uD835\uDDA3'],
  ["\\\\mathsf\\{C\\}", '\uD835\uDDA2'],
  ["\\\\mathsf\\{B\\}", '\uD835\uDDA1'],
  ["\\\\mathsf\\{A\\}", '\uD835\uDDA0'],
  ["\\\\mathbb\\{z\\}", '\uD835\uDD6B'],
  ["\\\\mathbb\\{y\\}", '\uD835\uDD6A'],
  ["\\\\mathbb\\{x\\}", '\uD835\uDD69'],
  ["\\\\mathbb\\{w\\}", '\uD835\uDD68'],
  ["\\\\mathbb\\{v\\}", '\uD835\uDD67'],
  ["\\\\mathbb\\{u\\}", '\uD835\uDD66'],
  ["\\\\mathbb\\{t\\}", '\uD835\uDD65'],
  ["\\\\mathbb\\{s\\}", '\uD835\uDD64'],
  ["\\\\mathbb\\{r\\}", '\uD835\uDD63'],
  ["\\\\mathbb\\{q\\}", '\uD835\uDD62'],
  ["\\\\mathbb\\{p\\}", '\uD835\uDD61'],
  ["\\\\mathbb\\{o\\}", '\uD835\uDD60'],
  ["\\\\mathbb\\{n\\}", '\uD835\uDD5F'],
  ["\\\\mathbb\\{m\\}", '\uD835\uDD5E'],
  ["\\\\mathbb\\{l\\}", '\uD835\uDD5D'],
  ["\\\\mathbb\\{k\\}", '\uD835\uDD5C'],
  ["\\\\mathbb\\{j\\}", '\uD835\uDD5B'],
  ["\\\\mathbb\\{i\\}", '\uD835\uDD5A'],
  ["\\\\mathbb\\{h\\}", '\uD835\uDD59'],
  ["\\\\mathbb\\{g\\}", '\uD835\uDD58'],
  ["\\\\mathbb\\{f\\}", '\uD835\uDD57'],
  ["\\\\mathbb\\{e\\}", '\uD835\uDD56'],
  ["\\\\mathbb\\{d\\}", '\uD835\uDD55'],
  ["\\\\mathbb\\{c\\}", '\uD835\uDD54'],
  ["\\\\mathbb\\{b\\}", '\uD835\uDD53'],
  ["\\\\mathbb\\{a\\}", '\uD835\uDD52'],
  ["\\\\mathbb\\{Y\\}", '\uD835\uDD50'],
  ["\\\\mathbb\\{X\\}", '\uD835\uDD4F'],
  ["\\\\mathbb\\{W\\}", '\uD835\uDD4E'],
  ["\\\\mathbb\\{V\\}", '\uD835\uDD4D'],
  ["\\\\mathbb\\{U\\}", '\uD835\uDD4C'],
  ["\\\\mathbb\\{T\\}", '\uD835\uDD4B'],
  ["\\\\mathbb\\{S\\}", '\uD835\uDD4A'],
  ["\\\\mathbb\\{O\\}", '\uD835\uDD46'],
  ["\\\\mathbb\\{M\\}", '\uD835\uDD44'],
  ["\\\\mathbb\\{L\\}", '\uD835\uDD43'],
  ["\\\\mathbb\\{K\\}", '\uD835\uDD42'],
  ["\\\\mathbb\\{J\\}", '\uD835\uDD41'],
  ["\\\\mathbb\\{I\\}", '\uD835\uDD40'],
  ["\\\\mathbb\\{G\\}", '\uD835\uDD3E'],
  ["\\\\mathbb\\{F\\}", '\uD835\uDD3D'],
  ["\\\\mathbb\\{E\\}", '\uD835\uDD3C'],
  ["\\\\mathbb\\{D\\}", '\uD835\uDD3B'],
  ["\\\\mathbb\\{B\\}", '\uD835\uDD39'],
  ["\\\\mathbb\\{A\\}", '\uD835\uDD38'],
  ["\\\\mathsl\\{z\\}", '\uD835\uDC67'],
  ["\\\\mathsl\\{y\\}", '\uD835\uDC66'],
  ["\\\\mathsl\\{x\\}", '\uD835\uDC65'],
  ["\\\\mathsl\\{w\\}", '\uD835\uDC64'],
  ["\\\\mathsl\\{v\\}", '\uD835\uDC63'],
  ["\\\\mathsl\\{u\\}", '\uD835\uDC62'],
  ["\\\\mathsl\\{t\\}", '\uD835\uDC61'],
  ["\\\\mathsl\\{s\\}", '\uD835\uDC60'],
  ["\\\\mathsl\\{r\\}", '\uD835\uDC5F'],
  ["\\\\mathsl\\{q\\}", '\uD835\uDC5E'],
  ["\\\\mathsl\\{p\\}", '\uD835\uDC5D'],
  ["\\\\mathsl\\{o\\}", '\uD835\uDC5C'],
  ["\\\\mathsl\\{n\\}", '\uD835\uDC5B'],
  ["\\\\mathsl\\{m\\}", '\uD835\uDC5A'],
  ["\\\\mathsl\\{l\\}", '\uD835\uDC59'],
  ["\\\\mathsl\\{k\\}", '\uD835\uDC58'],
  ["\\\\mathsl\\{j\\}", '\uD835\uDC57'],
  ["\\\\mathsl\\{i\\}", '\uD835\uDC56'],
  ["\\\\mathsl\\{g\\}", '\uD835\uDC54'],
  ["\\\\mathsl\\{f\\}", '\uD835\uDC53'],
  ["\\\\mathsl\\{e\\}", '\uD835\uDC52'],
  ["\\\\mathsl\\{d\\}", '\uD835\uDC51'],
  ["\\\\mathsl\\{c\\}", '\uD835\uDC50'],
  ["\\\\mathsl\\{b\\}", '\uD835\uDC4F'],
  ["\\\\mathsl\\{a\\}", '\uD835\uDC4E'],
  ["\\\\mathsl\\{Z\\}", '\uD835\uDC4D'],
  ["\\\\mathsl\\{Y\\}", '\uD835\uDC4C'],
  ["\\\\mathsl\\{X\\}", '\uD835\uDC4B'],
  ["\\\\mathsl\\{W\\}", '\uD835\uDC4A'],
  ["\\\\mathsl\\{V\\}", '\uD835\uDC49'],
  ["\\\\mathsl\\{U\\}", '\uD835\uDC48'],
  ["\\\\mathsl\\{T\\}", '\uD835\uDC47'],
  ["\\\\mathsl\\{S\\}", '\uD835\uDC46'],
  ["\\\\mathsl\\{R\\}", '\uD835\uDC45'],
  ["\\\\mathsl\\{Q\\}", '\uD835\uDC44'],
  ["\\\\mathsl\\{P\\}", '\uD835\uDC43'],
  ["\\\\mathsl\\{O\\}", '\uD835\uDC42'],
  ["\\\\mathsl\\{N\\}", '\uD835\uDC41'],
  ["\\\\mathsl\\{M\\}", '\uD835\uDC40'],
  ["\\\\mathsl\\{L\\}", '\uD835\uDC3F'],
  ["\\\\mathsl\\{K\\}", '\uD835\uDC3E'],
  ["\\\\mathsl\\{J\\}", '\uD835\uDC3D'],
  ["\\\\mathsl\\{I\\}", '\uD835\uDC3C'],
  ["\\\\mathsl\\{H\\}", '\uD835\uDC3B'],
  ["\\\\mathsl\\{G\\}", '\uD835\uDC3A'],
  ["\\\\mathsl\\{F\\}", '\uD835\uDC39'],
  ["\\\\mathsl\\{E\\}", '\uD835\uDC38'],
  ["\\\\mathsl\\{D\\}", '\uD835\uDC37'],
  ["\\\\mathsl\\{C\\}", '\uD835\uDC36'],
  ["\\\\mathsl\\{B\\}", '\uD835\uDC35'],
  ["\\\\mathsl\\{A\\}", '\uD835\uDC34'],
  ["\\\\mathbf\\{z\\}", '\uD835\uDC33'],
  ["\\\\mathbf\\{y\\}", '\uD835\uDC32'],
  ["\\\\mathbf\\{x\\}", '\uD835\uDC31'],
  ["\\\\mathbf\\{w\\}", '\uD835\uDC30'],
  ["\\\\mathbf\\{v\\}", '\uD835\uDC2F'],
  ["\\\\mathbf\\{u\\}", '\uD835\uDC2E'],
  ["\\\\mathbf\\{t\\}", '\uD835\uDC2D'],
  ["\\\\mathbf\\{s\\}", '\uD835\uDC2C'],
  ["\\\\mathbf\\{r\\}", '\uD835\uDC2B'],
  ["\\\\mathbf\\{q\\}", '\uD835\uDC2A'],
  ["\\\\mathbf\\{p\\}", '\uD835\uDC29'],
  ["\\\\mathbf\\{o\\}", '\uD835\uDC28'],
  ["\\\\mathbf\\{n\\}", '\uD835\uDC27'],
  ["\\\\mathbf\\{m\\}", '\uD835\uDC26'],
  ["\\\\mathbf\\{l\\}", '\uD835\uDC25'],
  ["\\\\mathbf\\{k\\}", '\uD835\uDC24'],
  ["\\\\mathbf\\{j\\}", '\uD835\uDC23'],
  ["\\\\mathbf\\{i\\}", '\uD835\uDC22'],
  ["\\\\mathbf\\{h\\}", '\uD835\uDC21'],
  ["\\\\mathbf\\{g\\}", '\uD835\uDC20'],
  ["\\\\mathbf\\{f\\}", '\uD835\uDC1F'],
  ["\\\\mathbf\\{e\\}", '\uD835\uDC1E'],
  ["\\\\mathbf\\{d\\}", '\uD835\uDC1D'],
  ["\\\\mathbf\\{c\\}", '\uD835\uDC1C'],
  ["\\\\mathbf\\{b\\}", '\uD835\uDC1B'],
  ["\\\\mathbf\\{a\\}", '\uD835\uDC1A'],
  ["\\\\mathbf\\{Z\\}", '\uD835\uDC19'],
  ["\\\\mathbf\\{Y\\}", '\uD835\uDC18'],
  ["\\\\mathbf\\{X\\}", '\uD835\uDC17'],
  ["\\\\mathbf\\{W\\}", '\uD835\uDC16'],
  ["\\\\mathbf\\{V\\}", '\uD835\uDC15'],
  ["\\\\mathbf\\{U\\}", '\uD835\uDC14'],
  ["\\\\mathbf\\{T\\}", '\uD835\uDC13'],
  ["\\\\mathbf\\{S\\}", '\uD835\uDC12'],
  ["\\\\mathbf\\{R\\}", '\uD835\uDC11'],
  ["\\\\mathbf\\{Q\\}", '\uD835\uDC10'],
  ["\\\\mathbf\\{P\\}", '\uD835\uDC0F'],
  ["\\\\mathbf\\{O\\}", '\uD835\uDC0E'],
  ["\\\\mathbf\\{N\\}", '\uD835\uDC0D'],
  ["\\\\mathbf\\{M\\}", '\uD835\uDC0C'],
  ["\\\\mathbf\\{L\\}", '\uD835\uDC0B'],
  ["\\\\mathbf\\{K\\}", '\uD835\uDC0A'],
  ["\\\\mathbf\\{J\\}", '\uD835\uDC09'],
  ["\\\\mathbf\\{I\\}", '\uD835\uDC08'],
  ["\\\\mathbf\\{H\\}", '\uD835\uDC07'],
  ["\\\\mathbf\\{G\\}", '\uD835\uDC06'],
  ["\\\\mathbf\\{F\\}", '\uD835\uDC05'],
  ["\\\\mathbf\\{E\\}", '\uD835\uDC04'],
  ["\\\\mathbf\\{D\\}", '\uD835\uDC03'],
  ["\\\\mathbf\\{C\\}", '\uD835\uDC02'],
  ["\\\\mathbf\\{B\\}", '\uD835\uDC01'],
  ["\\\\mathbf\\{A\\}", '\uD835\uDC00'],
  ["\\\\smwhitestar", '\u2B52'],
  ["\\\\RRightarrow", '\u2B46'],
  ["\\\\whtvertoval", '\u2B2F'],
  ["\\\\blkvertoval", '\u2B2E'],
  ["\\\\whthorzoval", '\u2B2D'],
  ["\\\\blkhorzoval", '\u2B2C'],
  ["\\\\lgblkcircle", '\u2B24'],
  ["\\\\mathtt\\{9\\}", '\uD835\uDFFF'],
  ["\\\\mathtt\\{8\\}", '\uD835\uDFFE'],
  ["\\\\textsection", '\u00A7'],
  ["\\\\textonehalf", '\u00BD'],
  ["\\\\shortuptack", '\u2AE0'],
  ["\\\\mathtt\\{7\\}", '\uD835\uDFFD'],
  ["\\\\mathtt\\{6\\}", '\uD835\uDFFC'],
  ["\\\\mathtt\\{5\\}", '\uD835\uDFFB'],
  ["\\\\mathtt\\{4\\}", '\uD835\uDFFA'],
  ["\\\\succnapprox", '\u2ABA'],
  ["\\\\precnapprox", '\u2AB9'],
  ["\\\\mathtt\\{3\\}", '\uD835\uDFF9'],
  ["\\\\eqqslantgtr", '\u2A9C'],
  ["\\\\eqslantless", '\u2A95'],
  ["\\\\backepsilon", '\u03F6'],
  ["\\\\mathtt\\{2\\}", '\uD835\uDFF8'],
  ["\\\\mathtt\\{1\\}", '\uD835\uDFF7'],
  ["\\\\mathtt\\{0\\}", '\uD835\uDFF6'],
  ["\\\\simminussim", '\u2A6C'],
  ["\\\\midbarwedge", '\u2A5C'],
  ["\\\\mathsf\\{9\\}", '\uD835\uDFEB'],
  ["\\\\mathsf\\{8\\}", '\uD835\uDFEA'],
  ["\\\\rcurvyangle", '\u29FD'],
  ["\\\\lcurvyangle", '\u29FC'],
  ["\\\\RuleDelayed", '\u29F4'],
  ["\\\\gleichstark", '\u29E6'],
  ["\\\\mathsf\\{7\\}", '\uD835\uDFE9'],
  ["\\\\mathsf\\{6\\}", '\uD835\uDFE8'],
  ["\\\\mathsf\\{5\\}", '\uD835\uDFE7'],
  ["\\\\mathsf\\{4\\}", '\uD835\uDFE6'],
  ["\\\\circledless", '\u29C0'],
  ["\\\\revemptyset", '\u29B0'],
  ["\\\\wideangleup", '\u29A7'],
  ["\\\\mathsf\\{3\\}", '\uD835\uDFE5'],
  ["\\\\mathsf\\{2\\}", '\uD835\uDFE4'],
  ["\\\\mathsf\\{1\\}", '\uD835\uDFE3'],
  ["\\\\mathsf\\{0\\}", '\uD835\uDFE2'],
  ["\\\\mathbb\\{9\\}", '\uD835\uDFE1'],
  ["\\\\mathbb\\{8\\}", '\uD835\uDFE0'],
  ["\\\\mathbb\\{7\\}", '\uD835\uDFDF'],
  ["\\\\nwovnearrow", '\u2932'],
  ["\\\\neovnwarrow", '\u2931'],
  ["\\\\neovsearrow", '\u292E'],
  ["\\\\seovnearrow", '\u292D'],
  ["\\\\mathbb\\{6\\}", '\uD835\uDFDE'],
  ["\\\\mathbb\\{5\\}", '\uD835\uDFDD'],
  ["\\\\leftdbltail", '\u291B'],
  ["\\\\mathbb\\{4\\}", '\uD835\uDFDC'],
  ["\\\\leftbkarrow", '\u290C'],
  ["\\\\nvLeftarrow", '\u2902'],
  ["\\\\mathbb\\{3\\}", '\uD835\uDFDB'],
  ["\\\\mathbb\\{2\\}", '\uD835\uDFDA'],
  ["\\\\mathbb\\{1\\}", '\uD835\uDFD9'],
  ["\\\\mathbb\\{0\\}", '\uD835\uDFD8'],
  ["\\\\multimapinv", '\u27DC'],
  ["\\\\mathbf\\{9\\}", '\uD835\uDFD7'],
  ["\\\\mathbf\\{8\\}", '\uD835\uDFD6'],
  ["\\\\threedangle", '\u27C0'],
  ["\\\\ding\\{254\\}", '\u27BE'],
  ["\\\\ding\\{253\\}", '\u27BD'],
  ["\\\\ding\\{252\\}", '\u27BC'],
  ["\\\\ding\\{251\\}", '\u27BB'],
  ["\\\\ding\\{250\\}", '\u27BA'],
  ["\\\\ding\\{249\\}", '\u27B9'],
  ["\\\\ding\\{248\\}", '\u27B8'],
  ["\\\\ding\\{247\\}", '\u27B7'],
  ["\\\\ding\\{246\\}", '\u27B6'],
  ["\\\\ding\\{245\\}", '\u27B5'],
  ["\\\\ding\\{244\\}", '\u27B4'],
  ["\\\\ding\\{243\\}", '\u27B3'],
  ["\\\\ding\\{242\\}", '\u27B2'],
  ["\\\\ding\\{241\\}", '\u27B1'],
  ["\\\\ding\\{239\\}", '\u27AF'],
  ["\\\\ding\\{238\\}", '\u27AE'],
  ["\\\\ding\\{237\\}", '\u27AD'],
  ["\\\\ding\\{236\\}", '\u27AC'],
  ["\\\\ding\\{235\\}", '\u27AB'],
  ["\\\\ding\\{234\\}", '\u27AA'],
  ["\\\\ding\\{233\\}", '\u27A9'],
  ["\\\\ding\\{232\\}", '\u27A8'],
  ["\\\\ding\\{231\\}", '\u27A7'],
  ["\\\\ding\\{230\\}", '\u27A6'],
  ["\\\\ding\\{229\\}", '\u27A5'],
  ["\\\\ding\\{228\\}", '\u27A4'],
  ["\\\\ding\\{227\\}", '\u27A3'],
  ["\\\\ding\\{226\\}", '\u27A2'],
  ["\\\\ding\\{225\\}", '\u27A1'],
  ["\\\\ding\\{224\\}", '\u27A0'],
  ["\\\\ding\\{223\\}", '\u279F'],
  ["\\\\ding\\{222\\}", '\u279E'],
  ["\\\\ding\\{221\\}", '\u279D'],
  ["\\\\ding\\{220\\}", '\u279C'],
  ["\\\\ding\\{219\\}", '\u279B'],
  ["\\\\ding\\{218\\}", '\u279A'],
  ["\\\\ding\\{216\\}", '\u2798'],
  ["\\\\ding\\{212\\}", '\u2794'],
  ["\\\\ding\\{211\\}", '\u2793'],
  ["\\\\ding\\{210\\}", '\u2792'],
  ["\\\\ding\\{209\\}", '\u2791'],
  ["\\\\ding\\{208\\}", '\u2790'],
  ["\\\\ding\\{207\\}", '\u278F'],
  ["\\\\ding\\{206\\}", '\u278E'],
  ["\\\\ding\\{205\\}", '\u278D'],
  ["\\\\ding\\{204\\}", '\u278C'],
  ["\\\\ding\\{203\\}", '\u278B'],
  ["\\\\ding\\{202\\}", '\u278A'],
  ["\\\\ding\\{201\\}", '\u2789'],
  ["\\\\ding\\{200\\}", '\u2788'],
  ["\\\\ding\\{199\\}", '\u2787'],
  ["\\\\ding\\{198\\}", '\u2786'],
  ["\\\\ding\\{197\\}", '\u2785'],
  ["\\\\ding\\{196\\}", '\u2784'],
  ["\\\\ding\\{195\\}", '\u2783'],
  ["\\\\ding\\{194\\}", '\u2782'],
  ["\\\\ding\\{193\\}", '\u2781'],
  ["\\\\ding\\{192\\}", '\u2780'],
  ["\\\\ding\\{191\\}", '\u277F'],
  ["\\\\ding\\{190\\}", '\u277E'],
  ["\\\\ding\\{189\\}", '\u277D'],
  ["\\\\ding\\{188\\}", '\u277C'],
  ["\\\\ding\\{187\\}", '\u277B'],
  ["\\\\ding\\{186\\}", '\u277A'],
  ["\\\\ding\\{185\\}", '\u2779'],
  ["\\\\ding\\{184\\}", '\u2778'],
  ["\\\\ding\\{183\\}", '\u2777'],
  ["\\\\ding\\{182\\}", '\u2776'],
  ["\\\\ding\\{167\\}", '\u2767'],
  ["\\\\ding\\{166\\}", '\u2766'],
  ["\\\\ding\\{165\\}", '\u2765'],
  ["\\\\ding\\{164\\}", '\u2764'],
  ["\\\\ding\\{163\\}", '\u2763'],
  ["\\\\ding\\{162\\}", '\u2762'],
  ["\\\\ding\\{161\\}", '\u2761'],
  ["\\\\ding\\{126\\}", '\u275E'],
  ["\\\\ding\\{125\\}", '\u275D'],
  ["\\\\ding\\{124\\}", '\u275C'],
  ["\\\\ding\\{123\\}", '\u275B'],
  ["\\\\ding\\{122\\}", '\u275A'],
  ["\\\\ding\\{121\\}", '\u2759'],
  ["\\\\ding\\{120\\}", '\u2758'],
  ["\\\\ding\\{118\\}", '\u2756'],
  ["\\\\ding\\{114\\}", '\u2752'],
  ["\\\\ding\\{113\\}", '\u2751'],
  ["\\\\ding\\{112\\}", '\u2750'],
  ["\\\\ding\\{111\\}", '\u274F'],
  ["\\\\ding\\{109\\}", '\u274D'],
  ["\\\\ding\\{107\\}", '\u274B'],
  ["\\\\ding\\{106\\}", '\u274A'],
  ["\\\\ding\\{105\\}", '\u2749'],
  ["\\\\ding\\{104\\}", '\u2748'],
  ["\\\\ding\\{103\\}", '\u2747'],
  ["\\\\ding\\{102\\}", '\u2746'],
  ["\\\\ding\\{101\\}", '\u2745'],
  ["\\\\ding\\{100\\}", '\u2744'],
  ["\\\\mathbf\\{7\\}", '\uD835\uDFD5'],
  ["\\\\quarternote", '\u2669'],
  ["\\\\varclubsuit", '\u2667'],
  ["\\\\ding\\{169\\}", '\u2666'],
  ["\\\\ding\\{170\\}", '\u2665'],
  ["\\\\ding\\{168\\}", '\u2663'],
  ["\\\\mathbf\\{6\\}", '\uD835\uDFD4'],
  ["\\\\ding\\{171\\}", '\u2660'],
  ["\\\\capricornus", '\u2651'],
  ["\\\\sagittarius", '\u2650'],
  ["\\\\backtrprime", '\u2037'],
  ["\\\\caretinsert", '\u2038'],
  ["\\\\nolinebreak", '\u2060'],
  ["\\\\mathbf\\{5\\}", '\uD835\uDFD3'],
  ["\\\\blacksmiley", '\u263B'],
  ["\\\\vertoverlay", '\u20D2'],
  ["\\\\mathbf\\{4\\}", '\uD835\uDFD2'],
  ["\\\\mathbf\\{3\\}", '\uD835\uDFD1'],
  ["\\\\smwhtcircle", '\u25E6'],
  ["\\\\asteraccent", '\u20F0'],
  ["\\\\mathbb\\{C\\}", '\u2102'],
  ["\\\\mathbf\\{2\\}", '\uD835\uDFD0'],
  ["\\\\ding\\{119\\}", '\u25D7'],
  ["\\\\mathbb\\{H\\}", '\u210D'],
  ["\\\\Planckconst", '\u210E'],
  ["\\\\ding\\{108\\}", '\u25CF'],
  ["\\\\mathbb\\{N\\}", '\u2115'],
  ["\\\\ding\\{117\\}", '\u25C6'],
  ["\\\\mathbb\\{P\\}", '\u2119'],
  ["\\\\ding\\{116\\}", '\u25BC'],
  ["\\\\mathbb\\{Q\\}", '\u211A'],
  ["\\\\vartriangle", '\u25B5'],
  ["\\\\ding\\{115\\}", '\u25B2'],
  ["\\\\mathbf\\{1\\}", '\uD835\uDFCF'],
  ["\\\\smwhtsquare", '\u25AB'],
  ["\\\\blacksquare", '\u25AA'],
  ["\\\\squarevfill", '\u25A5'],
  ["\\\\squarehfill", '\u25A4'],
  ["\\\\mathbb\\{R\\}", '\u211D'],
  ["\\\\ding\\{110\\}", '\u25A0'],
  ["\\\\mathbf\\{0\\}", '\uD835\uDFCE'],
  ["\\\\blockuphalf", '\u2580'],
  ["\\\\mathbb\\{Z\\}", '\u2124'],
  ["\\\\ding\\{181\\}", '\u2469'],
  ["\\\\ding\\{180\\}", '\u2468'],
  ["\\\\ding\\{179\\}", '\u2467'],
  ["\\\\ding\\{178\\}", '\u2466'],
  ["\\\\ding\\{177\\}", '\u2465'],
  ["\\\\ding\\{176\\}", '\u2464'],
  ["\\\\ding\\{175\\}", '\u2463'],
  ["\\\\ding\\{174\\}", '\u2462'],
  ["\\\\ding\\{173\\}", '\u2461'],
  ["\\\\ding\\{172\\}", '\u2460'],
  ["\\\\overbracket", '\u23B4'],
  ["\\\\intextender", '\u23AE'],
  ["\\\\sansLturned", '\u2142'],
  ["\\\\ExponetialE", '\u2147'],
  ["\\\\wasylozenge", '\u2311'],
  ["\\\\updownarrow", '\u2195'],
  ["\\\\nrightarrow", '\u219B'],
  ["\\\\sqsubsetneq", '\u22E4'],
  ["\\\\curlyeqsucc", '\u22DF'],
  ["\\\\curlyeqprec", '\u22DE'],
  ["\\\\nRightarrow", '\u21CF'],
  ["\\\\Updownarrow", '\u21D5'],
  ["\\\\Rrightarrow", '\u21DB'],
  ["\\\\ding\\{217\\}", '\u2799'],
  ["\\\\precapprox", '\u227E'],
  ["\\\\textdagger", '\u2020'],
  ["\\\\mbfDigamma", '\uD835\uDFCA'],
  ["\\\\twolowline", '\u2017'],
  ["\\\\textemdash", '\u2014'],
  ["\\\\textendash", '\u2013'],
  ["\\\\eighthnote", '\u266A'],
  ["\\\\ding\\{33\\}", '\u2701'],
  ["\\\\ding\\{34\\}", '\u2702'],
  ["\\\\underbrace", '\u23DF'],
  ["\\\\ding\\{35\\}", '\u2703'],
  ["\\\\underparen", '\u23DD'],
  ["\\\\ding\\{36\\}", '\u2704'],
  ["\\\\ding\\{38\\}", '\u2706'],
  ["\\\\ding\\{39\\}", '\u2707'],
  ["\\\\ding\\{40\\}", '\u2708'],
  ["\\\\sqrtbottom", '\u23B7'],
  ["\\\\ding\\{41\\}", '\u2709'],
  ["\\\\ding\\{44\\}", '\u270C'],
  ["\\\\succapprox", '\u227F'],
  ["\\\\ding\\{45\\}", '\u270D'],
  ["\\\\ding\\{46\\}", '\u270E'],
  ["\\\\rmoustache", '\u23B1'],
  ["\\\\lmoustache", '\u23B0'],
  ["\\\\ding\\{47\\}", '\u270F'],
  ["\\\\nLeftarrow", '\u21CD'],
  ["\\\\rbracelend", '\u23AD'],
  ["\\\\ding\\{48\\}", '\u2710'],
  ["\\\\rbraceuend", '\u23AB'],
  ["\\\\ding\\{49\\}", '\u2711'],
  ["\\\\lbracelend", '\u23A9'],
  ["\\\\ding\\{50\\}", '\u2712'],
  ["\\\\lbraceuend", '\u23A7'],
  ["\\\\rbracklend", '\u23A6'],
  ["\\\\ding\\{51\\}", '\u2713'],
  ["\\\\rbrackuend", '\u23A4'],
  ["\\\\ding\\{52\\}", '\u2714'],
  ["\\\\ding\\{53\\}", '\u2715'],
  ["\\\\lbrackuend", '\u23A1'],
  ["\\\\rparenlend", '\u23A0'],
  ["\\\\ding\\{54\\}", '\u2716'],
  ["\\\\rparenuend", '\u239E'],
  ["\\\\lparenlend", '\u239D'],
  ["\\\\ding\\{55\\}", '\u2717'],
  ["\\\\lparenuend", '\u239B'],
  ["\\\\ding\\{56\\}", '\u2718'],
  ["\\\\ding\\{57\\}", '\u2719'],
  ["\\\\ding\\{58\\}", '\u271A'],
  ["\\\\ding\\{59\\}", '\u271B'],
  ["\\\\ding\\{60\\}", '\u271C'],
  ["\\\\APLcomment", '\u235D'],
  ["\\\\ding\\{61\\}", '\u271D'],
  ["\\\\ding\\{62\\}", '\u271E'],
  ["\\\\ding\\{63\\}", '\u271F'],
  ["\\\\ding\\{64\\}", '\u2720'],
  ["\\\\ding\\{65\\}", '\u2721'],
  ["\\\\ding\\{66\\}", '\u2722'],
  ["\\\\ding\\{67\\}", '\u2723'],
  ["\\\\ding\\{68\\}", '\u2724'],
  ["\\\\ding\\{69\\}", '\u2725'],
  ["\\\\rightangle", '\u221F'],
  ["\\\\conictaper", '\u2332'],
  ["\\\\ding\\{70\\}", '\u2726'],
  ["\\\\ding\\{71\\}", '\u2727'],
  ["\\\\ding\\{74\\}", '\u272A'],
  ["\\\\ding\\{75\\}", '\u272B'],
  ["\\\\varnothing", '\u2205'],
  ["\\\\ding\\{76\\}", '\u272C'],
  ["\\\\ding\\{77\\}", '\u272D'],
  ["\\\\ding\\{78\\}", '\u272E'],
  ["\\\\ding\\{79\\}", '\u272F'],
  ["\\\\ding\\{80\\}", '\u2730'],
  ["\\\\ding\\{81\\}", '\u2731'],
  ["\\\\ding\\{82\\}", '\u2732'],
  ["\\\\ding\\{83\\}", '\u2733'],
  ["\\\\ding\\{84\\}", '\u2734'],
  ["\\\\ding\\{85\\}", '\u2735'],
  ["\\\\ding\\{86\\}", '\u2736'],
  ["\\\\ding\\{87\\}", '\u2737'],
  ["\\\\complement", '\u2201'],
  ["\\\\ding\\{88\\}", '\u2738'],
  ["\\\\ding\\{89\\}", '\u2739'],
  ["\\\\ding\\{90\\}", '\u273A'],
  ["\\\\ding\\{91\\}", '\u273B'],
  ["\\\\rightarrow", '\u2192'],
  ["\\\\ding\\{92\\}", '\u273C'],
  ["\\\\ding\\{93\\}", '\u273D'],
  ["\\\\sqsubseteq", '\u2291'],
  ["\\\\ding\\{94\\}", '\u273E'],
  ["\\\\nleftarrow", '\u219A'],
  ["\\\\ding\\{95\\}", '\u273F'],
  ["\\\\sqsupseteq", '\u2292'],
  ["\\\\ding\\{96\\}", '\u2740'],
  ["\\\\ding\\{97\\}", '\u2741'],
  ["\\\\ding\\{98\\}", '\u2742'],
  ["\\\\ding\\{99\\}", '\u2743'],
  ["\\\\subsetcirc", '\u27C3'],
  ["\\\\supsetcirc", '\u27C4'],
  ["\\\\Diamonddot", '\u27D0'],
  ["\\\\DDownarrow", '\u27F1'],
  ["\\\\longmapsto", '\u27FC'],
  ["\\\\Longmapsto", '\u27FE'],
  ["\\\\Ddownarrow", '\u290B'],
  ["\\\\UpArrowBar", '\u2912'],
  ["\\\\upfishtail", '\u297E'],
  ["\\\\lbrackubar", '\u298B'],
  ["\\\\rbrackubar", '\u298C'],
  ["\\\\Rparenless", '\u2996'],
  ["\\\\lblkbrbrak", '\u2997'],
  ["\\\\rblkbrbrak", '\u2998'],
  ["\\\\circledgtr", '\u29C1'],
  ["\\\\doubleplus", '\u29FA'],
  ["\\\\tripleplus", '\u29FB'],
  ["\\\\plussubtwo", '\u2A27'],
  ["\\\\commaminus", '\u2A29'],
  ["\\\\Lleftarrow", '\u21DA'],
  ["\\\\minusfdots", '\u2A2B'],
  ["\\\\minusrdots", '\u2A2C'],
  ["\\\\smashtimes", '\u2A33'],
  ["\\\\cupovercap", '\u2A46'],
  ["\\\\Rightarrow", '\u21D2'],
  ["\\\\circledast", '\u229B'],
  ["\\\\capovercup", '\u2A47'],
  ["\\\\veeonwedge", '\u2A59'],
  ["\\\\veemidvert", '\u2A5B'],
  ["\\\\equivVvert", '\u2A69'],
  ["\\\\lessapprox", '\u2A85'],
  ["\\\\lesseqqgtr", '\u2A8B'],
  ["\\\\gtreqqless", '\u2A8C'],
  ["\\\\eqslantgtr", '\u2A96'],
  ["\\\\rightslice", '\u2AA7'],
  ["\\{\\\\'\\{\\}O\\}|\\\\'\\{\\}O", '\u038C'],
  ["\\\\'\\{\\}\\{I\\}", '\u038A'],
  ["\\\\subsetplus", '\u2ABF'],
  ["\\\\supsetplus", '\u2AC0'],
  ["\\\\cyrchar\\\\C", '\u030F'],
  ["\\\\curlywedge", '\u22CF'],
  ["\\\\tone\\{11\\}", '\u02E9'],
  ["\\\\tone\\{22\\}", '\u02E8'],
  ["\\\\subsetneqq", '\u2ACB'],
  ["\\\\supsetneqq", '\u2ACC'],
  ["\\\\fbox\\{~~\\}", '\u25AD'],
  ["\\\\LEFTCIRCLE", '\u25D6'],
  ["\\\\ultriangle", '\u25F8'],
  ["\\\\tone\\{33\\}", '\u02E7'],
  ["\\\\tone\\{44\\}", '\u02E6'],
  ["\\\\urtriangle", '\u25F9'],
  ["\\\\lltriangle", '\u25FA'],
  ["\\\\tone\\{55\\}", '\u02E5'],
  ["\\\\varepsilon", '\u025B'],
  ["\\\\lrtriangle", '\u25FF'],
  ["\\\\ding\\{72\\}", '\u2605'],
  ["\\\\ding\\{73\\}", '\u2606'],
  ["\\\\ding\\{37\\}", '\u260E'],
  ["\\\\CheckedBox", '\u2611'],
  ["\\^\\\\circ|\\\\textdegree", '\u00B0'],
  ["\\\\ding\\{42\\}", '\u261B'],
  ["\\\\interleave", '\u2AF4'],
  ["\\\\ding\\{43\\}", '\u261E'],
  ["\\\\talloblong", '\u2AFE'],
  ["\\\\mbfdigamma", '\uD835\uDFCB'],
  ["\\\\backdprime", '\u2036'],
  ["\\\\varhexagon", '\u2B21'],
  ["\\\\leftarrowx", '\u2B3E'],
  ["\\\\LLeftarrow", '\u2B45'],
  ["\\\\postalmark", '\u3012'],
  ["\\\\textdollar", '\\$'],
  ["\\\\upuparrows", '\u21C8'],
  ["\\\\not\\\\equiv", '\u2262'],
  ["\\\\not\\\\simeq", '\u2244'],
  ["\\\\homothetic", '\u223B'],
  ["\\\\textbullet", '\u2022'],
  ["\\\\geqqslant", '\u2AFA'],
  ["\\\\leqqslant", '\u2AF9'],
  ["\\\\supseteqq", '\u2AC6'],
  ["\\\\subseteqq", '\u2AC5'],
  ["\\\\supsetdot", '\u2ABE'],
  ["\\\\subsetdot", '\u2ABD'],
  ["\\\\leftslice", '\u2AA6'],
  ["\\\\gtrapprox", '\u2A86'],
  ["\\\\approxeqq", '\u2A70'],
  ["\\\\hatapprox", '\u2A6F'],
  ["\\\\equivVert", '\u2A68'],
  ["\\\\varveebar", '\u2A61'],
  ["\\\\Elzminhat", '\u2A5F'],
  ["\\\\midbarvee", '\u2A5D'],
  ["\\\\wedgeodot", '\u2A51'],
  ["\\\\capbarcup", '\u2A49'],
  ["\\\\cupbarcap", '\u2A48'],
  ["\\\\otimeshat", '\u2A36'],
  ["\\\\clockoint", '\u2A0F'],
  ["\\\\modtwosum", '\u2A0A'],
  ["\\\\bigcupdot", '\u2A03'],
  ["\\\\bigotimes", '\u2A02'],
  ["\\\\hourglass", '\u29D6'],
  ["\\\\triangles", '\u29CC'],
  ["\\\\boxcircle", '\u29C7'],
  ["\\\\boxbslash", '\u29C5'],
  ["\\\\angleubar", '\u29A4'],
  ["\\\\turnangle", '\u29A2'],
  ["\\\\Elzlpargt", '\u29A0'],
  ["\\\\Lparengtr", '\u2995'],
  ["\\\\rangledot", '\u2992'],
  ["\\\\langledot", '\u2991'],
  ["\\\\typecolon", '\u2982'],
  ["\\\\neswarrow", '\u2922'],
  ["\\\\nwsearrow", '\u2921'],
  ["\\\\righttail", '\u291A'],
  ["\\\\rrbracket", '\u27E7'],
  ["\\\\llbracket", '\u27E6'],
  ["\\\\longdashv", '\u27DE'],
  ["\\\\vlongdash", '\u27DD'],
  ["\\\\dashVdash", '\u27DB'],
  ["\\\\DashVDash", '\u27DA'],
  ["\\\\medbullet", '\u26AB'],
  ["\\\\heartsuit", '\u2661'],
  ["\\\\rightmoon", '\u263D'],
  ["\\\\biohazard", '\u2623'],
  ["\\\\radiation", '\u2622'],
  ["\\\\Elzrvbull", '\u25D8'],
  ["\\\\Elzvrecto", '\u25AF'],
  ["\\\\blockfull", '\u2588'],
  ["\\\\Elzdshfnc", '\u2506'],
  ["\\\\accurrent", '\u23E6'],
  ["\\\\trapezium", '\u23E2'],
  ["\\\\overbrace", '\u23DE'],
  ["\\\\overparen", '\u23DC'],
  ["\\\\rvboxline", '\u23B9'],
  ["\\\\lvboxline", '\u23B8'],
  ["\\\\sumbottom", '\u23B3'],
  ["\\\\rbracemid", '\u23AC'],
  ["\\\\lbracemid", '\u23A8'],
  ["\\\\Elzdlcorn", '\u23A3'],
  ["\\\\intbottom", '\u2321'],
  ["\\\\turnednot", '\u2319'],
  ["\\\\bagmember", '\u22FF'],
  ["\\\\varniobar", '\u22FD'],
  ["\\\\Elzsqspne", '\u22E5'],
  ["\\\\gtreqless", '\u22DB'],
  ["\\\\lesseqgtr", '\u22DA'],
  ["\\\\pitchfork", '\u22D4'],
  ["\\\\backsimeq", '\u22CD'],
  ["\\\\truestate", '\u22A7'],
  ["\\\\supsetneq", '\u228B'],
  ["\\\\subsetneq", '\u228A'],
  ["\\\\not\\\\succ", '\u2281'],
  ["\\\\not\\\\prec", '\u2280'],
  ["\\\\triangleq", '\u225C'],
  ["\\\\starequal", '\u225B'],
  ["\\\\estimates", '\u2259'],
  ["\\\\tildetrpl", '\u224B'],
  ["\\\\not\\\\cong", '\u2247'],
  ["\\\\therefore", '\u2234'],
  ["\\\\nparallel", '\u2226'],
  ["\\\\sqrt\\[4\\]", '\u221C'],
  ["\\\\sqrt\\[3\\]", '\u221B'],
  ["\\\\increment", '\u2206'],
  ["\\\\nHuparrow", '\u21DE'],
  ["\\\\Downarrow", '\u21D3'],
  ["\\\\Leftarrow", '\u21D0'],
  ["\\\\lightning", '\u21AF'],
  ["\\\\downarrow", '\u2193'],
  ["\\\\leftarrow", '\u2190'],
  ["\\\\fracslash", '\u2044'],
  ["\\\\backprime", '\u2035'],
  ["\\\\Elzreapos", '\u201B'],
  ["\\\\textTheta", '\u03F4'],
  ["\\\\underline", '\u0332'],
  ["\\\\textturnk", '\u029E'],
  ["\\\\Elzinglst", '\u0296'],
  ["\\\\Elzreglst", '\u0295'],
  ["\\\\Elzpupsil", '\u028A'],
  ["\\\\Elzrttrnr", '\u027B'],
  ["\\\\Elzclomeg", '\u0277'],
  ["\\\\Elztrnmlr", '\u0270'],
  ["\\\\Elzpgamma", '\u0263'],
  ["\\\\textnrleg", '\u019E'],
  ["\\\\texthvlig", '\u0195'],
  ["\\\\texttimes", '\u00D7'],
  ["\\\\texttheta", '\u03B8'],
  ["\\\\Elzpscrv", '\u028B'],
  ["\\\\succnsim", '\u22E9'],
  ["\\\\Elzsqfnw", '\u2519'],
  ["\\\\circledS", '\u24C8'],
  ["\\\\elinters", '\u23E7'],
  ["\\\\varisins", '\u22F3'],
  ["\\\\bbrktbrk", '\u23B6'],
  ["\\\\MapsDown", '\u21A7'],
  ["\\\\APLinput", '\u235E'],
  ["\\\\notslash", '\u233F'],
  ["\\\\mapsfrom", '\u21A4'],
  ["\\\\pentagon", '\u2B20'],
  ["\\\\ComplexI", '\u2148'],
  ["\\\\isinobar", '\u22F7'],
  ["\\\\ComplexJ", '\u2149'],
  ["\\\\lrcorner", '\u231F'],
  ["\\\\llcorner", '\u231E'],
  ["\\\\urcorner", '\u231D'],
  ["\\\\ulcorner", '\u231C'],
  ["\\\\viewdata", '\u2317'],
  ["\\\\Elzdyogh", '\u02A4'],
  ["\\\\Elzverts", '\u02C8'],
  ["\\\\Elzverti", '\u02CC'],
  ["\\\\Elzhlmrk", '\u02D1'],
  ["\\\\diameter", '\u2300'],
  ["\\\\recorder", '\u2315'],
  ["\\\\Elzsbrhr", '\u02D2'],
  ["\\\\profsurf", '\u2313'],
  ["\\\\Elzsblhr", '\u02D3'],
  ["\\\\Elztdcol", '\u2AF6'],
  ["\\\\profline", '\u2312'],
  ["\\\\overline", '\u0305'],
  ["\\\\Elzsbbrg", '\u032A'],
  ["\\\\succneqq", '\u2AB6'],
  ["\\\\precneqq", '\u2AB5'],
  ["\\\\underbar", '\u0331'],
  ["\\\\varsigma", '\u03C2'],
  ["\\\\setminus", '\u2216'],
  ["\\\\varkappa", '\u03F0'],
  ["\\\\not\\\\sim", '\u2241'],
  ["\\\\gnapprox", '\u2A8A'],
  ["\\\\lnapprox", '\u2A89'],
  ["\\\\gesdotol", '\u2A84'],
  ["\\\\lesdotor", '\u2A83'],
  ["\\\\geqslant", '\u2A7E'],
  ["\\\\approxeq", '\u224A'],
  ["\\\\lazysinv", '\u223E'],
  ["\\\\leqslant", '\u2A7D'],
  ["\\\\varVdash", '\u2AE6'],
  ["\\\\=\\{\\\\i\\}", '\u012B'],
  ["\\\\Coloneqq", '\u2A74'],
  ["\\\\simrdots", '\u2A6B'],
  ["\\\\dotequiv", '\u2A67'],
  ["\\\\capwedge", '\u2A44'],
  ["\\\\not\\\\leq", '\u2270'],
  ["\\\\intprodr", '\u2A3D'],
  ["\\\\not\\\\geq", '\u2271'],
  ["\\\\subseteq", '\u2286'],
  ["\\\\timesbar", '\u2A31'],
  ["\\\\supseteq", '\u2287'],
  ["\\\\dottimes", '\u2A30'],
  ["\\\\ElzTimes", '\u2A2F'],
  ["\\\\sqsubset", '\u228F'],
  ["\\\\plustrif", '\u2A28'],
  ["\\\\sqsupset", '\u2290'],
  ["\\\\ringplus", '\u2A22'],
  ["\\\\zproject", '\u2A21'],
  ["\\\\intlarhk", '\u2A17'],
  ["\\\\pointint", '\u2A15'],
  ["\\\\scpolint", '\u2A13'],
  ["\\\\rppolint", '\u2A12'],
  ["\\\\Elxsqcup", '\u2A06'],
  ["\\\\Elxuplus", '\u2A04'],
  ["\\\\forksnot", '\u2ADD'],
  ["\\\\boxminus", '\u229F'],
  ["\\\\boxtimes", '\u22A0'],
  ["\\\\bigoplus", '\u2A01'],
  ["\\\\eqvparsl", '\u29E5'],
  ["\\\\smeparsl", '\u29E4'],
  ["\\\\tieinfty", '\u29DD'],
  ["\\\\Rvzigzag", '\u29DB'],
  ["\\\\Lvzigzag", '\u29DA'],
  ["\\\\rvzigzag", '\u29D9'],
  ["\\\\lvzigzag", '\u29D8'],
  ["\\\\rfbowtie", '\u29D2'],
  ["\\\\lfbowtie", '\u29D1'],
  ["\\\\rtriltri", '\u29CE'],
  ["\\\\Elzdefas", '\u29CB'],
  ["\\\\allequal", '\u224C'],
  ["\\\\doteqdot", '\u2251'],
  ["\\\\Elztrnsa", '\u0252'],
  ["\\\\Elzopeno", '\u0254'],
  ["\\\\boxonbox", '\u29C9'],
  ["\\\\boxslash", '\u29C4'],
  ["\\\\revangle", '\u29A3'],
  ["\\\\Elzddfnc", '\u2999'],
  ["\\\\Elzschwa", '\u0259'],
  ["\\\\Elzrarrx", '\u2947'],
  ["\\\\ElzrLarr", '\u2944'],
  ["\\\\original", '\u22B6'],
  ["\\\\ElzRlarr", '\u2942'],
  ["\\\\multimap", '\u22B8'],
  ["\\\\intercal", '\u22BA'],
  ["\\\\lefttail", '\u2919'],
  ["\\\\barwedge", '\u22BC'],
  ["\\\\drbkarow", '\u2910'],
  ["\\\\Uuparrow", '\u290A'],
  ["\\\\Mapsfrom", '\u2906'],
  ["\\\\Elzpbgam", '\u0264'],
  ["\\\\UUparrow", '\u27F0'],
  ["\\\\pullback", '\u27D3'],
  ["\\\\wedgedot", '\u27D1'],
  ["\\\\bsolhsub", '\u27C8'],
  ["\\\\curlyvee", '\u22CE'],
  ["\\\\acidfree", '\u267E'],
  ["\\\\twonotes", '\u266B'],
  ["\\\\mkern1mu", '\u200A'],
  ["\\\\aquarius", '\u2652'],
  ["\\\\textcent", '\u00A2'],
  ["\\\\Elzltlmr", '\u0271'],
  ["\\\\Question", '\u2047'],
  ["\\\\:|\\\\mkern4mu", '\u205F'],
  ["\\\\steaming", '\u2615'],
  ["\\\\Elztrnrl", '\u027A'],
  ["\\\\parallel", '\u2225'],
  ["\\\\linefeed", '\u21B4'],
  ["\\\\Elzsqfse", '\u25EA'],
  ["\\\\Elzcirfb", '\u25D2'],
  ["\\\\Elzcirfr", '\u25D1'],
  ["\\\\Elzcirfl", '\u25D0'],
  ["\\\\bullseye", '\u25CE'],
  ["\\\\vphantom\\\\{", ''],
  ["\\\\eqcolon", '\u2239'],
  ["\\\\because", '\u2235'],
  ["\\\\revnmid", '\u2AEE'],
  ["\\\\between", '\u226C'],
  ["\\\\lessgtr", '\u2276'],
  ["\\\\gtrless", '\u2277'],
  ["\\\\dotplus", '\u2214'],
  ["\\\\smallni", '\u220D'],
  ["\\\\not\\\\ni", '\u220C'],
  ["\\\\smallin", '\u220A'],
  ["\\\\not\\\\in", '\u2209'],
  ["\\\\nexists", '\u2204'],
  ["\\\\partial", '\u2202'],
  ["\\\\boxplus", '\u229E'],
  ["\\\\Swarrow", '\u21D9'],
  ["\\\\Searrow", '\u21D8'],
  ["\\\\Nearrow", '\u21D7'],
  ["\\\\Nwarrow", '\u21D6'],
  ["\\\\Uparrow", '\u21D1'],
  ["\\\\diamond", '\u22C4'],
  ["\\\\lessdot", '\u22D6'],
  ["\\\\npreceq", '\u22E0'],
  ["\\\\nsucceq", '\u22E1'],
  ["\\\\nhVvert", '\u2AF5'],
  ["\\\\isindot", '\u22F5'],
  ["\\\\swarrow", '\u2199'],
  ["\\\\searrow", '\u2198'],
  ["\\\\nearrow", '\u2197'],
  ["\\\\nwarrow", '\u2196'],
  ["\\\\textyen", '\u00A5'],
  ["\\\\uparrow", '\u2191'],
  ["\\\\hexagon", '\u2394'],
  ["\\\\obrbrak", '\u23E0'],
  ["\\\\ubrbrak", '\u23E1'],
  ["\\\\benzenr", '\u23E3'],
  ["\\\\Elzxrat", '\u211E'],
  ["\\\\squoval", '\u25A2'],
  ["\\\\Diamond", '\u25C7'],
  ["\\\\fisheye", '\u25C9'],
  ["\\\\lozenge", '\u25CA'],
  ["\\\\bigcirc", '\u25CB'],
  ["\\\\Elzsqfl", '\u25E7'],
  ["\\\\Elzsqfr", '\u25E8'],
  ["\\\\annuity", '\u20E7'],
  ["\\\\yinyang", '\u262F'],
  ["\\\\frownie", '\u2639'],
  ["\\\\mercury", '\u263F'],
  ["\\\\closure", '\u2050'],
  ["\\\\lllnest", '\u2AF7'],
  ["\\\\jupiter", '\u2643'],
  ["\\\\neptune", '\u2646'],
  ["\\\\gggnest", '\u2AF8'],
  ["\\\\scorpio", '\u264F'],
  ["\\\\natural", '\u266E'],
  ["\\\\recycle", '\u267B'],
  ["\\\\diceiii", '\u2682'],
  ["\\\\warning", '\u26A0'],
  ["\\\\medcirc", '\u26AA'],
  ["\\\\lbrbrak", '\u2772'],
  ["\\\\rbrbrak", '\u2773'],
  ["\\\\suphsol", '\u27C9'],
  ["\\\\pushout", '\u27D4'],
  ["\\\\Lbrbrak", '\u27EC'],
  ["\\\\Rbrbrak", '\u27ED'],
  ["\\\\dbkarow", '\u290F'],
  ["\\\\Elolarr", '\u2940'],
  ["\\\\Elorarr", '\u2941'],
  ["\\\\subrarr", '\u2979'],
  ["\\\\suplarr", '\u297B'],
  ["\\\\Elztfnc", '\u2980'],
  ["\\\\Elroang", '\u2986'],
  ["\\\\vzigzag", '\u299A'],
  ["\\\\olcross", '\u29BB'],
  ["\\\\cirscir", '\u29C2'],
  ["\\\\fbowtie", '\u29D3'],
  ["\\\\lftimes", '\u29D4'],
  ["\\\\rftimes", '\u29D5'],
  ["\\\\nvinfty", '\u29DE'],
  ["\\\\shuffle", '\u29E2'],
  ["\\\\thermod", '\u29E7'],
  ["\\\\rsolbar", '\u29F7'],
  ["\\\\bigodot", '\u2A00'],
  ["\\\\varprod", '\u2A09'],
  ["\\\\ElzCint", '\u2A0D'],
  ["\\\\npolint", '\u2A14'],
  ["\\\\plushat", '\u2A23'],
  ["\\\\simplus", '\u2A24'],
  ["\\\\plussim", '\u2A26'],
  ["\\\\twocups", '\u2A4A'],
  ["\\\\twocaps", '\u2A4B'],
  ["\\\\veeodot", '\u2A52'],
  ["\\\\congdot", '\u2A6D'],
  ["\\\\eqqplus", '\u2A71'],
  ["\\\\pluseqq", '\u2A72'],
  ["\\\\ddotseq", '\u2A77'],
  ["\\\\equivDD", '\u2A78'],
  ["\\\\ltquest", '\u2A7B'],
  ["\\\\gtquest", '\u2A7C'],
  ["\\\\lesdoto", '\u2A81'],
  ["\\\\gesdoto", '\u2A82'],
  ["\\\\digamma", '\u03DD'],
  ["\\\\Digamma", '\u03DC'],
  ["\\\\upsilon", '\u03C5'],
  ["\\\\epsilon", '\u03B5'],
  ["\\\\eqqless", '\u2A99'],
  ["\\\\Upsilon", '\u03A5'],
  ["\\\\bumpeqq", '\u2AAE'],
  ["\\\\backsim", '\u223D'],
  ["\\\\succneq", '\u2AB2'],
  ["\\\\preceqq", '\u2AB3'],
  ["\\\\succeqq", '\u2AB4'],
  ["\\\\trslash", '\u2AFB'],
  ["\\\\Elzpalh", '\u0321'],
  ["\\\\llcurly", '\u2ABB'],
  ["\\\\ggcurly", '\u2ABC'],
  ["\\\\submult", '\u2AC1'],
  ["\\\\supmult", '\u2AC2'],
  ["\\\\subedot", '\u2AC3'],
  ["\\\\supedot", '\u2AC4'],
  ["\\\\lsqhook", '\u2ACD'],
  ["\\\\rsqhook", '\u2ACE'],
  ["\\\\Elzrais", '\u02D4'],
  ["\\\\Elzlmrk", '\u02D0'],
  ["\\\\Elztesh", '\u02A7'],
  ["\\\\Elzglst", '\u0294'],
  ["\\\\Elzyogh", '\u0292'],
  ["\\\\Elzrtlz", '\u0290'],
  ["\\\\Elztrny", '\u028E'],
  ["\\\\Elzinvw", '\u028D'],
  ["\\\\Elzinvv", '\u028C'],
  ["\\\\Elzrtlt", '\u0288'],
  ["\\\\Elztrnt", '\u0287'],
  ["\\\\Elzrtls", '\u0282'],
  ["\\\\Elzrtlr", '\u027D'],
  ["\\\\Elztrnr", '\u0279'],
  ["\\\\textphi", '\u0278'],
  ["\\\\hzigzag", '\u3030'],
  ["\\\\Elzrtln", '\u0273'],
  ["\\\\Elzltln", '\u0272'],
  ["\\\\Elztrnm", '\u026F'],
  ["\\\\Elzrtll", '\u026D'],
  ["\\\\Elzbtdl", '\u026C'],
  ["\\\\Elztrnh", '\u0265'],
  ["\\\\Elzrtld", '\u0256'],
  ["\\\\Elztrna", '\u0250'],
  ["\\\\suphsub", '\u2AD7'],
  ["\\\\supdsub", '\u2AD8'],
  ["\\\\\\.z|\\\\\\.\\{z\\}", '\u017C'],
  ["\\\\\\.Z|\\\\\\.\\{Z\\}", '\u017B'],
  ["\\\\\\^y|\\\\\\^\\{y\\}", '\u0177'],
  ["\\\\\\^Y|\\\\\\^\\{Y\\}", '\u0176'],
  ["\\\\\\^w|\\\\\\^\\{w\\}", '\u0175'],
  ["\\\\\\^W|\\\\\\^\\{W\\}", '\u0174'],
  ["\\\\topfork", '\u2ADA'],
  ["\\\\\\^s|\\\\\\^\\{s\\}", '\u015D'],
  ["\\\\\\^S|\\\\\\^\\{S\\}", '\u015C'],
  ["\\\\\\^J|\\\\\\^\\{J\\}", '\u0134'],
  ["\\\\\\.I|\\\\\\.\\{I\\}", '\u0130'],
  ["\\\\\\^h|\\\\\\^\\{h\\}", '\u0125'],
  ["\\\\\\^H|\\\\\\^\\{H\\}", '\u0124'],
  ["\\\\\\.g|\\\\\\.\\{g\\}", '\u0121'],
  ["\\\\\\.G|\\\\\\.\\{G\\}", '\u0120'],
  ["\\\\\\^g|\\\\\\^\\{g\\}", '\u011D'],
  ["\\\\\\^G|\\\\\\^\\{G\\}", '\u011C'],
  ["\\\\\\.e|\\\\\\.\\{e\\}", '\u0117'],
  ["\\\\\\.E|\\\\\\.\\{E\\}", '\u0116'],
  ["\\\\\\.c|\\\\\\.\\{c\\}", '\u010B'],
  ["\\\\\\.C|\\\\\\.\\{C\\}", '\u010A'],
  ["\\\\\\^c|\\\\\\^\\{c\\}", '\u0109'],
  ["\\\\\\^C|\\\\\\^\\{C\\}", '\u0108'],
  ["\\\\\\^u|\\\\\\^\\{u\\}", '\u00FB'],
  ["\\\\\\^o|\\\\\\^\\{o\\}", '\u00F4'],
  ["\\\\\\^e|\\\\\\^\\{e\\}", '\u00EA'],
  ["\\\\\\^a|\\\\\\^\\{a\\}", '\u00E2'],
  ["\\\\\\^U|\\\\\\^\\{U\\}", '\u00DB'],
  ["\\\\\\^O|\\\\\\^\\{O\\}", '\u00D4'],
  ["\\\\\\^I|\\\\\\^\\{I\\}", '\u00CE'],
  ["\\\\\\^E|\\\\\\^\\{E\\}", '\u00CA'],
  ["\\\\\\^A|\\\\\\^\\{A\\}", '\u00C2'],
  ["\\\\precneq", '\u2AB1'],
  ["\\\\bigtop", '\u27D9'],
  ["\\\\textmu", '\u03BC'],
  ["\\\\lgroup", '\u27EE'],
  ["\\\\rgroup", '\u27EF'],
  ["\\\\bigcup", '\u22C3'],
  ["\\\\Mapsto", '\u2907'],
  ["\\\\bigcap", '\u22C2'],
  ["\\\\approx", '\u2248'],
  ["\\\\barvee", '\u22BD'],
  ["\\\\veebar", '\u22BB'],
  ["\\\\'c|\\\\'\\{c\\}", '\u0107'],
  ["\\\\scurel", '\u22B1'],
  ["\\\\parsim", '\u2AF3'],
  ["\\\\ltlarr", '\u2976'],
  ["\\\\gtrarr", '\u2978'],
  ["\\\\'C|\\\\'\\{C\\}", '\u0106'],
  ["\\\\k\\{a\\}", '\u0105'],
  ["\\\\k\\{A\\}", '\u0104'],
  ["\\\\lBrace", '\u2983'],
  ["\\\\rBrace", '\u2984'],
  ["\\\\prurel", '\u22B0'],
  ["\\\\angles", '\u299E'],
  ["\\\\angdnr", '\u299F'],
  ["\\\\=a|\\\\=\\{a\\}", '\u0101'],
  ["\\\\=A|\\\\=\\{A\\}", '\u0100'],
  ["\\\\nVDash", '\u22AF'],
  ["\\\\boxast", '\u29C6'],
  ["\\\\boxbox", '\u29C8'],
  ["\\\\nVdash", '\u22AE'],
  ["\\\\ElzLap", '\u29CA'],
  ["\\\\nvDash", '\u22AD'],
  ["\\\\nvdash", '\u22AC'],
  ["\\\\Vvdash", '\u22AA'],
  ["\\\\\"y|\\\\\"\\{y\\}", '\u00FF'],
  ["\\\\'y|\\\\'\\{y\\}", '\u00FD'],
  ["\\\\topcir", '\u2AF1'],
  ["\\\\assert", '\u22A6'],
  ["\\\\\"u|\\\\\"\\{u\\}", '\u00FC'],
  ["\\\\laplac", '\u29E0'],
  ["\\\\eparsl", '\u29E3'],
  ["\\\\'u|\\\\'\\{u\\}", '\u00FA'],
  ["\\\\`u|\\\\`\\{u\\}", '\u00F9'],
  ["\\\\tminus", '\u29FF'],
  ["\\\\boxdot", '\u22A1'],
  ["\\\\ElzThr", '\u2A05'],
  ["\\\\oslash", '\u2298'],
  ["\\\\ElzInf", '\u2A07'],
  ["\\\\ElzSup", '\u2A08'],
  ["\\\\sumint", '\u2A0B'],
  ["\\\\iiiint", '\u2A0C'],
  ["\\\\\"o|\\\\\"\\{o\\}", '\u00F6'],
  ["\\\\intBar", '\u2A0E'],
  ["\\\\otimes", '\u2297'],
  ["\\\\ominus", '\u2296'],
  ["\\\\~o|\\\\~\\{o\\}", '\u00F5'],
  ["\\\\sqrint", '\u2A16'],
  ["\\\\intcap", '\u2A19'],
  ["\\\\intcup", '\u2A1A'],
  ["\\\\lowint", '\u2A1C'],
  ["\\\\'o|\\\\'\\{o\\}", '\u00F3'],
  ["\\\\`o|\\\\`\\{o\\}", '\u00F2'],
  ["\\\\cupdot", '\u228D'],
  ["\\\\forall", '\u2200'],
  ["\\\\btimes", '\u2A32'],
  ["\\\\Otimes", '\u2A37'],
  ["\\\\exists", '\u2203'],
  ["\\\\capdot", '\u2A40'],
  ["\\\\uminus", '\u2A41'],
  ["\\\\barcup", '\u2A42'],
  ["\\\\barcap", '\u2A43'],
  ["\\\\supset", '\u2283'],
  ["\\\\cupvee", '\u2A45'],
  ["\\\\~n|\\\\~\\{n\\}", '\u00F1'],
  ["\\\\ElzAnd", '\u2A53'],
  ["\\\\midcir", '\u2AF0'],
  ["\\\\dotsim", '\u2A6A'],
  ["\\\\eqqsim", '\u2A73'],
  ["\\\\\"e|\\\\\"\\{e\\}", '\u00EB'],
  ["\\\\'e|\\\\'\\{e\\}", '\u00E9'],
  ["\\\\`e|\\\\`\\{e\\}", '\u00E8'],
  ["\\\\lesdot", '\u2A7F'],
  ["\\\\gesdot", '\u2A80'],
  ["\\\\coprod", '\u2210'],
  ["\\\\varrho", '\u03F1'],
  ["\\\\\"a|\\\\\"\\{a\\}", '\u00E4'],
  ["\\\\stigma", '\u03DB'],
  ["\\\\Stigma", '\u03DA'],
  ["\\\\lesges", '\u2A93'],
  ["\\\\gesles", '\u2A94'],
  ["\\\\elsdot", '\u2A97'],
  ["\\\\egsdot", '\u2A98'],
  ["\\\\varphi", '\u03C6'],
  ["\\\\~a|\\\\~\\{a\\}", '\u00E3'],
  ["\\\\lambda", '\u03BB'],
  ["\\\\'a|\\\\'\\{a\\}", '\u00E1'],
  ["\\\\eqqgtr", '\u2A9A'],
  ["\\\\`a|\\\\`\\{a\\}", '\u00E0'],
  ["\\\\Pi|\\\\P\\{i\\}", '\u03A0'],
  ["\\\\Xi|\\\\X\\{i\\}", '\u039E'],
  ["\\\\Lambda", '\u039B'],
  ["\\\\'H|\\\\'\\{H\\}", '\u0389'],
  ["\\\\preceq", '\u2AAF'],
  ["\\\\succeq", '\u2AB0'],
  ["\\\\TH|\\\\T\\{H\\}", '\u00DE'],
  ["\\\\'Y|\\\\'\\{Y\\}", '\u00DD'],
  ["\\\\\"U|\\\\\"\\{U\\}", '\u00DC'],
  ["\\\\Elzbar", '\u0336'],
  ["\\\\'U|\\\\'\\{U\\}", '\u00DA'],
  ["\\\\utilde", '\u0330'],
  ["\\\\bullet", '\u2219'],
  ["\\\\cirmid", '\u2AEF'],
  ["\\\\`U|\\\\`\\{U\\}", '\u00D9'],
  ["\\\\droang", '\u031A'],
  ["\\\\\"O|\\\\\"\\{O\\}", '\u00D6'],
  ["\\\\~O|\\\\~\\{O\\}", '\u00D5'],
  ["\\\\candra", '\u0310'],
  ["\\\\'O|\\\\'\\{O\\}", '\u00D3'],
  ["\\\\ovhook", '\u0309'],
  ["\\\\subsim", '\u2AC7'],
  ["\\\\supsim", '\u2AC8'],
  ["\\\\`O|\\\\`\\{O\\}", '\u00D2'],
  ["\\\\~N|\\\\~\\{N\\}", '\u00D1'],
  ["\\\\Elzlow", '\u02D5'],
  ["\\\\DH|\\\\D\\{H\\}", '\u00D0'],
  ["\\\\propto", '\u221D'],
  ["\\\\subset", '\u2282'],
  ["\\\\\"I|\\\\\"\\{I\\}", '\u00CF'],
  ["\\\\subsup", '\u2AD3'],
  ["\\\\rbrace", '\\}'],
  ["\\\\lbrace", '\\{'],
  ["\\\\'I|\\\\'\\{I\\}", '\u00CD'],
  ["\\\\`I|\\\\`\\{I\\}", '\u00CC'],
  ["\\\\\"E|\\\\\"\\{E\\}", '\u00CB'],
  ["\\\\AC|\\\\A\\{C\\}", '\u223F'],
  ["\\\\'E|\\\\'\\{E\\}", '\u00C9'],
  ["\\\\`E|\\\\`\\{E\\}", '\u00C8'],
  ["\\\\AE|\\\\A\\{E\\}", '\u00C6'],
  ["\\\\Elzesh", '\u0283'],
  ["\\\\AA|\\\\A\\{A\\}", '\u00C5'],
  ["\\\\supsub", '\u2AD4'],
  ["\\\\Elzfhr", '\u027E'],
  ["\\\\\"A|\\\\\"\\{A\\}", '\u00C4'],
  ["\\\\~A|\\\\~\\{A\\}", '\u00C3'],
  ["\\\\'A|\\\\'\\{A\\}", '\u00C1'],
  ["\\\\`A|\\\\`\\{A\\}", '\u00C0'],
  ["\\\\vDdash", '\u2AE2'],
  ["\\\\subsub", '\u2AD5'],
  ["\\\\supsup", '\u2AD6'],
  ["\\\\'g|\\\\'\\{g\\}", '\u01F5'],
  ["\\\\not\\ =", '\u2260'],
  ["\\\\measeq", '\u225E'],
  ["\\\\'z|\\\\'\\{z\\}", '\u017A'],
  ["\\\\'Z|\\\\'\\{Z\\}", '\u0179'],
  ["\\\\\"Y|\\\\\"\\{Y\\}", '\u0178'],
  ["\\\\k\\{u\\}", '\u0173'],
  ["\\\\k\\{U\\}", '\u0172'],
  ["\\\\r\\{u\\}", '\u016F'],
  ["\\\\r\\{U\\}", '\u016E'],
  ["\\\\=u|\\\\=\\{u\\}", '\u016B'],
  ["\\\\=U|\\\\=\\{U\\}", '\u016A'],
  ["\\\\~u|\\\\~\\{u\\}", '\u0169'],
  ["\\\\~U|\\\\~\\{U\\}", '\u0168'],
  ["\\\\circeq", '\u2257'],
  ["\\\\'s|\\\\'\\{s\\}", '\u015B'],
  ["\\\\'S|\\\\'\\{S\\}", '\u015A'],
  ["\\\\'r|\\\\'\\{r\\}", '\u0155'],
  ["\\\\'R|\\\\'\\{R\\}", '\u0154'],
  ["\\\\OE|\\\\O\\{E\\}", '\u0152'],
  ["\\\\=o|\\\\=\\{o\\}", '\u014D'],
  ["\\\\=O|\\\\=\\{O\\}", '\u014C'],
  ["\\\\NG|\\\\N\\{G\\}", '\u014A'],
  ["\\\\'n|\\\\'\\{n\\}", '\u0144'],
  ["\\\\'N|\\\\'\\{N\\}", '\u0143'],
  ["\\\\'l|\\\\'\\{l\\}", '\u013A'],
  ["\\\\'L|\\\\'\\{L\\}", '\u0139'],
  ["\\\\eqcirc", '\u2256'],
  ["\\\\k\\{i\\}", '\u012F'],
  ["\\\\k\\{I\\}", '\u012E'],
  ["\\\\u\\ \\\\i", '\u012D'],
  ["\\\\lfloor", '\u230A'],
  ["\\\\rfloor", '\u230B'],
  ["\\\\invneg", '\u2310'],
  ["\\\\niobar", '\u22FE'],
  ["\\\\varnis", '\u22FB'],
  ["\\\\invamp", '\u214B'],
  ["\\\\inttop", '\u2320'],
  ["\\\\isinvb", '\u22F8'],
  ["\\\\langle", '\u2329'],
  ["\\\\rangle", '\u232A'],
  ["\\\\topbot", '\u2336'],
  ["\\\\APLinv", '\u2339'],
  ["\\\\MapsUp", '\u21A5'],
  ["\\\\mapsto", '\u21A6'],
  ["\\\\APLlog", '\u235F'],
  ["\\\\=I|\\\\=\\{I\\}", '\u012A'],
  ["\\\\daleth", '\u2138'],
  ["\\\\sumtop", '\u23B2'],
  ["\\\\~I|\\\\~\\{I\\}", '\u0128'],
  ["\\\\diagup", '\u2571'],
  ["\\\\square", '\u25A1'],
  ["\\\\hslash", '\u210F'],
  ["\\\\bumpeq", '\u224F'],
  ["\\\\boxbar", '\u25EB'],
  ["\\\\Square", '\u2610'],
  ["\\\\danger", '\u2621'],
  ["\\\\Bumpeq", '\u224E'],
  ["\\\\ddddot", '\u20DC'],
  ["\\\\smiley", '\u263A'],
  ["\\\\eqless", '\u22DC'],
  ["\\\\gtrdot", '\u22D7'],
  ["\\\\k\\{e\\}", '\u0119'],
  ["\\\\Exclam", '\u203C'],
  ["\\\\k\\{E\\}", '\u0118'],
  ["\\\\saturn", '\u2644'],
  ["\\\\uranus", '\u2645'],
  ["\\\\taurus", '\u2649'],
  ["\\\\gemini", '\u264A'],
  ["\\\\cancer", '\u264B'],
  ["\\\\pisces", '\u2653'],
  ["\\\\Supset", '\u22D1'],
  ["\\\\=e|\\\\=\\{e\\}", '\u0113'],
  ["\\\\Subset", '\u22D0'],
  ["\\\\diceii", '\u2681'],
  ["\\\\=E|\\\\=\\{E\\}", '\u0112'],
  ["\\\\diceiv", '\u2683'],
  ["\\\\dicevi", '\u2685'],
  ["\\\\anchor", '\u2693'],
  ["\\\\swords", '\u2694'],
  ["\\\\DJ|\\\\D\\{J\\}", '\u0110'],
  ["\\\\neuter", '\u26B2'],
  ["\\\\veedot", '\u27C7'],
  ["\\\\rtimes", '\u22CA'],
  ["\\\\ltimes", '\u22C9'],
  ["\\\\bowtie", '\u22C8'],
  ["\\\\bigbot", '\u27D8'],
  ["\\\\cirbot", '\u27DF'],
  ["\\\\mathrm", ''],
  ["\\\\LaTeX", 'L$^A$T$_E$X'],
  ["\\\\delta", '\u03B4'],
  ["\\\\image", '\u22B7'],
  ["\\\\llarc", '\u25DF'],
  ["\\\\simeq", '\u2243'],
  ["\\\\eqdef", '\u225D'],
  ["\\\\vBarv", '\u2AE9'],
  ["\\\\ElzOr", '\u2A54'],
  ["\\\\equiv", '\u2261'],
  ["\\\\space", ' '],
  ["\\\\isins", '\u22F4'],
  ["\\\\lnsim", '\u22E6'],
  ["\\\\Elzxl", '\u0335'],
  ["\\\\Theta", '\u0398'],
  ["\\\\barin", '\u22F6'],
  ["\\\\kappa", '\u03BA'],
  ["\\\\lblot", '\u2989'],
  ["\\\\rblot", '\u298A'],
  ["\\\\frown", '\u2322'],
  ["\\\\earth", '\u2641'],
  ["\\\\Angle", '\u299C'],
  ["\\\\Sqcup", '\u2A4F'],
  ["\\\\Sqcap", '\u2A4E'],
  ["\\\\nhpar", '\u2AF2'],
  ["\\\\operp", '\u29B9'],
  ["\\\\sigma", '\u03C3'],
  ["\\\\csube", '\u2AD1'],
  ["\\\\csupe", '\u2AD2'],
  ["\\\\house", '\u2302'],
  ["\\\\forks", '\u2ADC'],
  ["\\\\Elzxh", '\u0127'],
  ["\\\\strns", '\u23E4'],
  ["\\\\eqgtr", '\u22DD'],
  ["\\\\forkv", '\u2AD9'],
  ["\\\\relax", ''],
  ["\\\\amalg", '\u2A3F'],
  ["\\\\infty", '\u221E'],
  ["\\\\VDash", '\u22AB'],
  ["\\\\fltns", '\u23E5'],
  ["\\\\disin", '\u22F2'],
  ["\\\\uplus", '\u228E'],
  ["\\\\angle", '\u2220'],
  ["\\\\pluto", '\u2647'],
  ["\\\\Vdash", '\u22A9'],
  ["\\\\cdots", '\u22EF'],
  ["\\\\lceil", '\u2308'],
  ["\\\\sqcap", '\u2293'],
  ["\\\\smile", '\u2323'],
  ["\\\\omega", '\u03C9'],
  ["\\\\vdots", '\u22EE'],
  ["\\\\arceq", '\u2258'],
  ["\\\\dashv", '\u22A3'],
  ["\\\\vdash", '\u22A2'],
  ["\\\\skull", '\u2620'],
  ["\\\\rceil", '\u2309'],
  ["\\\\virgo", '\u264D'],
  ["\\\\perps", '\u2AE1'],
  ["\\\\zhide", '\u29F9'],
  ["\\\\tplus", '\u29FE'],
  ["\\\\ldots", '\u2026'],
  ["\\\\zpipe", '\u2A20'],
  ["\\\\dicei", '\u2680'],
  ["\\\\venus", '\u2640'],
  ["\\\\varpi", '\u03D6'],
  ["\\\\Elzrh", '\u0322'],
  ["\\\\Qoppa", '\u03D8'],
  ["\\\\aries", '\u2648'],
  ["\\\\upint", '\u2A1B'],
  ["\\\\dddot", '\u20DB'],
  ["\\\\sqcup", '\u2294'],
  ["\\\\qoppa", '\u03D9'],
  ["\\\\Koppa", '\u03DE'],
  ["\\\\awint", '\u2A11'],
  ["\\\\koppa", '\u03DF'],
  ["\\\\Colon", '\u2237'],
  ["\\\\gescc", '\u2AA9'],
  ["\\\\oplus", '\u2295'],
  ["\\\\asymp", '\u224D'],
  ["\\\\isinE", '\u22F9'],
  ["\\\\Elzrl", '\u027C'],
  ["\\\\Sampi", '\u03E0'],
  ["\\\\sampi", '\u03E1'],
  ["\\\\doteq", '\u2250'],
  ["\\\\slash", '\u2215'],
  ["\\\\gnsim", '\u22E7'],
  ["\\\\libra", '\u264E'],
  ["\\\\gsiml", '\u2A90'],
  ["\\\\wedge", '\u2227'],
  ["\\\\dbend", '\uFFFD'],
  ["\\\\dashV", '\u2AE3'],
  ["\\\\Dashv", '\u2AE4'],
  ["\\\\DashV", '\u2AE5'],
  ["\\\\Sigma", '\u03A3'],
  ["\\\\lsimg", '\u2A8F'],
  ["\\\\gsime", '\u2A8E'],
  ["\\\\lsime", '\u2A8D'],
  ["\\\\Equiv", '\u2263'],
  ["\\\\dicev", '\u2684'],
  ["\\\\Gamma", '\u0393'],
  ["\\\\\\^\\\\j", '\u0135'],
  ["\\\\gtcir", '\u2A7A'],
  ["\\\\ltcir", '\u2A79'],
  ["\\\\jmath", '\u0237'],
  ["\\\\ularc", '\u25DC'],
  ["\\\\gneqq", '\u2269'],
  ["\\\\gimel", '\u2137'],
  ["\\\\lneqq", '\u2268'],
  ["\\\\Omega", '\u03A9'],
  ["\\\\Equal", '\u2A75'],
  ["\\\\\\^\\\\i", '\u00EE'],
  ["\\\\aleph", '\u2135'],
  ["\\\\nabla", '\u2207'],
  ["\\\\lescc", '\u2AA8'],
  ["\\\\simgE", '\u2AA0'],
  ["\\\\sharp", '\u266F'],
  ["\\\\imath", '\uD835\uDEA4'],
  ["\\\\simlE", '\u2A9F'],
  ["\\\\Delta", '\u0394'],
  ["\\\\urarc", '\u25DD'],
  ["\\\\alpha", '\u03B1'],
  ["\\\\gamma", '\u03B3'],
  ["\\\\eqdot", '\u2A66'],
  ["\\\\Euler", '\u2107'],
  ["\\\\lrarc", '\u25DE'],
  ["\\\\late", '\u2AAD'],
  ["\\\\v\\ d", '\u010F'],
  ["\\\\hash", '\u22D5'],
  ["\\\\circ", '\u2218'],
  ["\\\\Game", '\u2141'],
  ["\\\\surd", '\u221A'],
  ["\\\\v\\ D", '\u010E'],
  ["\\\\Lbag", '\u27C5'],
  ["\\\\beth", '\u2136'],
  ["\\\\lnot", '\u00AC'],
  ["\\\\Finv", '\u2132'],
  ["\\\\~\\\\i", '\u0129'],
  ["\\\\csub", '\u2ACF'],
  ["\\\\csup", '\u2AD0'],
  ["\\\\succ", '\u227B'],
  ["\\\\prec", '\u227A'],
  ["\\\\Vert", '\u2016'],
  ["\\\\nmid", '\u2224'],
  ["\\\\c\\ C", '\u00C7'],
  ["\\\\c\\ g", '\u0123'],
  ["\\\\c\\ G", '\u0122'],
  ["\\\\not<", '\u226E'],
  ["\\\\dlsh", '\u21B2'],
  ["\\\\Barv", '\u2AE7'],
  ["\\\\cdot", '\u00B7'],
  ["\\\\vBar", '\u2AE8'],
  ["\\\\lang", '\u27EA'],
  ["\\\\rang", '\u27EB'],
  ["\\\\Zbar", '\u01B5'],
  ["\\\\star", '\u22C6'],
  ["\\\\psur", '\u2900'],
  ["\\\\v\\ z", '\u017E'],
  ["\\\\v\\ Z", '\u017D'],
  ["\\\\pinj", '\u2914'],
  ["\\\\finj", '\u2915'],
  ["\\\\bNot", '\u2AED'],
  ["\\\\u\\ e", '\u0115'],
  ["\\\\u\\ g", '\u011F'],
  ["\\\\spot", '\u2981'],
  ["\\\\H\\ u", '\u0171'],
  ["\\\\u\\ a", '\u0103'],
  ["\\\\limg", '\u2987'],
  ["\\\\rimg", '\u2988'],
  ["\\\\H\\ U", '\u0170'],
  ["\\\\u\\ A", '\u0102'],
  ["\\\\obot", '\u29BA'],
  ["\\\\u\\ u", '\u016D'],
  ["\\\\u\\ U", '\u016C'],
  ["\\\\cirE", '\u29C3'],
  ["\\\\u\\ G", '\u011E'],
  ["\\\\XBox", '\u2612'],
  ["\\\\v\\ t", '\u0165'],
  ["\\\\v\\ T", '\u0164'],
  ["\\\\c\\ t", '\u0163'],
  ["\\\\c\\ T", '\u0162'],
  ["\\\\v\\ s", '\u0161'],
  ["\\\\v\\ S", '\u0160'],
  ["\\\\perp", '\u22A5'],
  ["\\\\c\\ s", '\u015F'],
  ["\\\\c\\ S", '\u015E'],
  ["\\\\leqq", '\u2266'],
  ["\\\\dsol", '\u29F6'],
  ["\\\\Rbag", '\u27C6'],
  ["\\\\xsol", '\u29F8'],
  ["\\\\v\\ C", '\u010C'],
  ["\\\\v\\ r", '\u0159'],
  ["\\\\odot", '\u2299'],
  ["\\\\v\\ R", '\u0158'],
  ["\\\\c\\ r", '\u0157'],
  ["\\\\c\\ R", '\u0156'],
  ["\\\\flat", '\u266D'],
  ["\\\\LVec", '\u20D6'],
  ["\\\\H\\ o", '\u0151'],
  ["\\\\H\\ O", '\u0150'],
  ["\\\\u\\ o", '\u014F'],
  ["\\\\u\\ O", '\u014E'],
  ["\\\\intx", '\u2A18'],
  ["\\\\lvec", '\u20D0'],
  ["\\\\Join", '\u2A1D'],
  ["\\\\zcmp", '\u2A1F'],
  ["\\\\pfun", '\u21F8'],
  ["\\\\cong", '\u2245'],
  ["\\\\smte", '\u2AAC'],
  ["\\\\v\\ N", '\u0147'],
  ["\\\\ffun", '\u21FB'],
  ["\\\\c\\ n", '\u0146'],
  ["\\\\c\\ N", '\u0145'],
  ["\\\\u\\ E", '\u0114'],
  ["\\\\odiv", '\u2A38'],
  ["\\\\fcmp", '\u2A3E'],
  ["\\\\mlcp", '\u2ADB'],
  ["\\\\v\\ l", '\u013E'],
  ["\\\\v\\ L", '\u013D'],
  ["\\\\c\\ l", '\u013C'],
  ["\\\\c\\ L", '\u013B'],
  ["\\\\\"\\\\i|\\\\\"\\{\\\\i\\}|\\\\\"i|\\\\\"\\{i\\}", '\u00EF'],
  ["\\\\v\\ e", '\u011B'],
  ["\\\\ElOr", '\u2A56'],
  ["\\\\dsub", '\u2A64'],
  ["\\\\rsub", '\u2A65'],
  ["\\\\oint", '\u222E'],
  ["\\\\'\\\\i|\\\\'i", '\u00ED'],
  ["\\\\`\\\\i|\\\\`i", '\u00EC'],
  ["\\\\c\\ k", '\u0137'],
  ["\\\\Same", '\u2A76'],
  ["\\\\c\\ K", '\u0136'],
  ["\\\\geqq", '\u2267'],
  ["\\\\c\\ c|\\\\c\\{c\\}", '\u00E7'],
  ["\\\\prod", '\u220F'],
  ["\\\\v\\ E", '\u011A'],
  ["\\\\lneq", '\u2A87'],
  ["\\\\gneq", '\u2A88'],
  ["\\\\upin", '\u27D2'],
  ["\\\\u\\ I", '\u012C'],
  ["\\\\not>", '\u226F'],
  ["_\\\\ast", '\u2217'],
  ["\\\\iota", '\u03B9'],
  ["\\\\zeta", '\u03B6'],
  ["\\\\beta", '\u03B2'],
  ["\\\\male", '\u2642'],
  ["\\\\nisd", '\u22FA'],
  ["\\\\quad", '\u2001'],
  ["\\\\text", ''],
  ["\\\\v\\ c", '\u010D'],
  ["\\\\v\\ n", '\u0148'],
  ["\\\\glj", '\u2AA4'],
  ["\\\\int", '\u222B'],
  ["\\\\cup", '\u222A'],
  ["\\\\QED", '\u220E'],
  ["\\\\cap", '\u2229'],
  ["\\\\gla", '\u2AA5'],
  ["\\\\Psi", '\u03A8'],
  ["\\\\Phi", '\u03A6'],
  ["\\\\sum", '\u2211'],
  ["\\\\Rsh", '\u21B1'],
  ["\\\\vee", '\u2228'],
  ["\\\\Lsh", '\u21B0'],
  ["\\\\sim", '\u223C'],
  ["\\\\lhd", '\u25C1'],
  ["\\\\LHD", '\u25C0'],
  ["\\\\rhd", '\u25B7'],
  ["\\\\phi", '\u03D5'],
  ["\\\\lgE", '\u2A91'],
  ["\\\\glE", '\u2A92'],
  ["\\\\RHD", '\u25B6'],
  ["\\\\cat", '\u2040'],
  ["\\\\Yup", '\u2144'],
  ["\\\\vec", '\u20D1'],
  ["\\\\div", '\u00F7'],
  ["\\\\mid", '\u2223'],
  ["\\\\mho", '\u2127'],
  ["\\\\psi", '\u03C8'],
  ["\\\\chi", '\u03C7'],
  ["\\\\top", '\u22A4'],
  ["\\\\Not", '\u2AEC'],
  ["\\\\tau", '\u03C4'],
  ["\\\\smt", '\u2AAA'],
  ["\\\\rho", '\u03C1'],
  ["\\\\sun", '\u263C'],
  ["\\\\Cap", '\u22D2'],
  ["\\\\lat", '\u2AAB'],
  ["\\\\leo", '\u264C'],
  ["\\\\Sun", '\u2609'],
  ["\\\\Cup", '\u22D3'],
  ["\\\\eta", '\u03B7'],
  ["\\\\Top", '\u2AEA'],
  ["\\\\bij", '\u2916'],
  ["\\\\eth", '\u01AA'],
  ["\\\\geq", '\u2265'],
  ["\\\\nis", '\u22FC'],
  ["\\\\leq", '\u2264'],
  ["\\\\le", '\u2264'],
  ["\\\\ll", '\u226A'],
  ["\\\\dj", '\u0111'],
  ["\\\\in", '\u2208'],
  ["\\\\\\-", '\u00AD'],
  ["\\\\th", '\u00FE'],
  ["\\\\wp", '\u2118'],
  ["\\\\aa", '\u00E5'],
  ["\\\\ss", '\u00DF'],
  ["\\\\ae", '\u00E6'],
  ["\\\\ng", '\u014B'],
  ["\\\\mu", '\u03BC'],
  ["''''", '\u2057'],
  ["\\\\pi", '\u03C0'],
  ["\\\\gg", '\u226B'],
  ["\\\\xi", '\u03BE'],
  ["\\\\ni", '\u220B'],
  ["\\\\nu", '\u03BD'],
  ["\\\\pm", '\u00B1'],
  ["\\\\mp", '\u2213'],
  ["\\\\wr", '\u2240'],
  ["\\\\\\.", '\u0307'],
  ["\\\\dh", '\u00F0'],
  ["\\\\oe", '\u0153'],
  ["\\\\url", '\\XXurl'],
  ["\\\\u", '\u0306'],
  ["\\\\XXurl", '\\url'],
  ["\\\\L", '\u0141'],
  ["\\\\c", '\u00B8'],
  ["\\\\i", '\u0131'],
  ["\\\\k", '\u02DB'],
  ["\\\\H", '\u02DD'],
  ["\\\\\"", '\u0308'],
  ["\\\\v", '\u030C'],
  ["\\\\o", '\u00F8'],
  ["\\\\`", '\u0300'],
  ["\\\\'", '\u0301'],
  ["\\\\~", '\u0303'],
  ["\\\\r", '\u02DA'],
  ["\\\\O", '\u00D8'],
  ["\\\\=", '\u0304'],
  ["\\\\l", '\u0142'],
  ["'''", '\u2034'],
  ["\\\\textasciitilde", '\\~']
]


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
const debug_formatter_ts_1 = __webpack_require__(/*! ../../content/debug-formatter.ts */ 24);
function debug(...msg) {
    if (!Translator.debugEnabled && !Translator.preferences.testing)
        return;
    Zotero.debug(debug_formatter_ts_1.format(`better-bibtex:${Translator.header.label}`, msg));
}
exports.debug = debug;
; Zotero.debug('BBT: loaded translators/lib/debug.ts'); } catch ($wrap_loader_catcher_translators_lib_debug_ts) { Zotero.debug('Error: BBT: load of translators/lib/debug.ts failed:' + $wrap_loader_catcher_translators_lib_debug_ts + '::' + $wrap_loader_catcher_translators_lib_debug_ts.stack) };

/***/ }),
/* 3 */
/*!*****************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/edtf-parser.js ***!
  \*****************************************************************/
/*! exports provided: edtfParse */
/*! exports used: edtfParse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return edtfParse; });
// Class to do a simple check for level 0 and 1 while waiting for a compatible
// edtf.js version and figuring out if the license is OK.
// It has an interface that is similar to the part of edtf.js we use so that we
// can quickly switch back.

// Notice: this allows open ended date ranges and it uses 1-12 rather than 0-11 for months.

class SimpleEDTFParser {
    constructor(string) {
        this.string = string
        this.type = 'None' // default
        this.valid = true // default
        this.values = false
        this.uncertain = false
        this.approximate = false
        this.parts = []
    }

    init() {
        this.checkCertainty()
        this.splitInterval()
        return {
            type: this.type,
            valid: this.valid,
            values: this.values,
            cleanedString: this.cleanString()
        }
    }

    cleanString() {
        let cleanedString = ''
        if (this.parts.length) {
            cleanedString = this.parts.map(datePart => datePart.cleanString()).join('/')
        } else if (this.values) {
            cleanedString = this.values.reduce((dateString, value, index) => {
                if (index === 0) {
                    if (value > 0) {
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
            this.values = []
            let valid = false
            parts.forEach(part => {
                let parser = new SimpleEDTFParser(part)
                parser.init()
                if (parser.valid || parser.type==='Open') {
                    this.values.push(parser.values)
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

        let yearChecker = new RegExp('^-?[0-9]*u{0,2}$') // 1994, 19uu, -234, 187u, 0, 1984?~, etc.
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
            this.values = [from.values, to.values]
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
        let monthChecker = new RegExp('^[0-2][0-9]|uu$') // uu or 01, 02, 03, ..., 11, 12
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
        let dayChecker = new RegExp('^[0-3][0-9]$|uu') // uu or 01, 02, 03, ..., 11, 12
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


function edtfParse(dateString) {

    let parser = new SimpleEDTFParser(dateString)
    return parser.init()
}


/***/ }),
/* 4 */
/*!***************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/literal-parser.js ***!
  \***************************************************************************/
/*! exports provided: BibLatexLiteralParser */
/*! exports used: BibLatexLiteralParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexLiteralParser; });
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

class BibLatexLiteralParser {
    constructor(string, cpMode = false) {
        this.string = string
        this.cpMode = cpMode // Whether to consider case preservation.
        this.braceLevel = 0
        this.slen = string.length
        this.si = 0 // string index
        this.json = []
        this.braceClosings = []
        this.currentMarks = []
        this.inCasePreserve = false
        this.textNode = false
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
        this.textNode = {type: 'text', text: ''}
        this.json.push(this.textNode)
    }

    stringParser() {
        this.addNewTextNode()

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
                                    this.inCasePreserve = false
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
                            continue parseString
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
                                this.inCasePreserve = false
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
                        continue parseString
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
                    let sj = this.si + 1
                    while (sj < this.slen && this.string[sj] !== '\u0870') {
                        sj++
                    }
                    let variable = this.string.substring(this.si+1, sj)
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
/* 5 */
/*!******************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/export/const.js ***!
  \******************************************************************/
/*! exports provided: TexSpecialChars */
/*! exports used: TexSpecialChars */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TexSpecialChars; });
// A much smaller list for export than for import, as biblatex does understand utf8
const TexSpecialChars = [
    [/\\/g, '\\textbackslash '],
    [/\{/g, '\\{ '],
    [/\}/g, '\\} '],
    [/&/g, '{\\&}'],
    [/%/g, '{\\%}'],
    [/\$/g, '{\\$}'],
    [/#/g, '{\\#}'],
    [/_/g, '{\\_}'],
    [/~/g, '{\\textasciitilde}'],
    [/\^/g, '{\\textasciicircum}'],
    [/ and /g, ' {and} ']
]


/***/ }),
/* 6 */
/*!******************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/tools.js ***!
  \******************************************************************/
/*! exports provided: splitTeXString */
/*! exports used: splitTeXString */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return splitTeXString; });
// split at each occurence of splitToken, but only if no braces are currently open.
function splitTeXString(texString, splitToken='and') {
    let output = []
    let tokenRe = /([^\s{}]+|\s|{|})/g
    let j = 0
    let k = 0
    let item
    while ((item = tokenRe.exec(texString)) !== null) {
        let token = item[0]
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
/* 7 */
/*!****************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/export/csl.js ***!
  \****************************************************************/
/*! exports provided: CSLExporter */
/*! exports used: CSLExporter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CSLExporter; });
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../const */ 0);
/* harmony import */ var _edtf_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../edtf-parser */ 3);



/** Converts a BibDB to a DB of the CSL type.
 * @param bibDB The bibliography database to convert.
 */

const TAGS = {
    'strong': {open:'<b>', close: '</b>'},
    'em': {open:'<i>', close: '</i>'},
    'sub': {open:'<sub>', close: '</sub>'},
    'sup': {open:'<sup>', close: '</sup>'},
    'smallcaps': {open:'<span style="font-variant:small-caps;">', close: '</span>'},
    'nocase': {open:'<span class="nocase">', close: '</span>'},
    'enquote': {open:'“', close: '”'},
    'url': {open:'', close: ''},
    'undefined': {open:'[', close: ']'}
 }

class CSLExporter {
    constructor(bibDB, pks) {
        this.bibDB = bibDB
        if (pks) {
            this.pks = pks // A list of pk values of the bibliography items to be exported.
        } else {
            this.pks = Object.keys(bibDB) // If none are selected, all keys are exporter
        }
        this.cslDB = {}
        this.errors = []
    }

    get output() {
        for (let bibId in this.bibDB) {
            if (this.pks.indexOf(bibId) !== -1) {
                this.cslDB[bibId] = this.getCSLEntry(bibId)
                this.cslDB[bibId].id = bibId
            }
        }
        return this.cslDB
    }
    /** Converts one BibDB entry to CSL format.
     * @function getCSLEntry
     * @param id The id identifying the bibliography entry.
     */
    getCSLEntry(id) {
        let bib = this.bibDB[id], fValues = {}
        if (!bib.fields || !bib.bib_type || !_const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"][bib.bib_type]) {
            return fValues
        }
        for (let fKey in bib.fields) {
            if (bib.fields[fKey] !== '' && fKey in _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"] && 'csl' in _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]) {
                let fValue = bib.fields[fKey]
                let fType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['type']
                let key = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['csl']
                switch(fType) {
                    case 'f_date':
                        let date = this._reformDate(fValue)
                        if (date) {
                            fValues[key] = date
                        }
                        break
                    case 'f_integer':
                        fValues[key] = this._reformInteger(fValue)
                        break
                    case 'f_key':
                        fValues[key] = this._reformKey(fValue, fKey)
                        break
                    case 'f_literal':
                    case 'f_long_literal':
                        fValues[key] = this._reformText(fValue)
                        break
                    case 'l_range':
                        fValues[key] = this._reformRange(fValue)
                        break
                    case 'f_title':
                        fValues[key] = this._reformText(fValue)
                        break
                    case 'f_uri':
                    case 'f_verbatim':
                        fValues[key] = fValue
                        break
                    case 'l_key':
                        fValues[key] = fValue.map(key=>{return this._reformKey(key, fKey)}).join(' and ')
                        break
                    case 'l_literal':
                        fValues[key] = fValue.map(text => this._reformText(text)).join(', ')
                        break
                    case 'l_name':
                        fValues[key] = this._reformName(fValue)
                        break
                    case 'l_tag':
                        fValues[key] = fValue.join(', ')
                        break
                    default:
                        console.warn(`Unrecognized field type: ${fType}!`)
                }
            }
        }
        fValues['type'] = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"][bib.bib_type].csl
        return fValues
    }

    _reformKey(theValue, fKey) {
        if (typeof theValue==='string') {
            let fieldType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]
            if (Array.isArray(fieldType['options'])) {
                return theValue
            } else {
                return fieldType['options'][theValue]['csl']
            }
        } else {
            return this._reformText(theValue)
        }
    }

    _reformRange(theValue) {
        return theValue.map(
            range => range.map(
                text=> this._reformText(text)
            ).join('--')
        ).join(',')
    }

    _reformInteger(theValue) {
        let theString = this._reformText(theValue)
        let theInt = parseInt(theString)
        if (theString !== String(theInt)) {
            return theString
        }
        return theInt
    }

    _reformText(theValue) {
        let html = '', lastMarks = []
        theValue.forEach((node)=>{
            if (node.type === 'variable') {
                // This is an undefined variable
                // This should usually not happen, as CSL doesn't know what to
                // do with these. We'll put them into an unsupported tag.
                html += `${TAGS.undefined.open}${node.attrs.variable}${TAGS.undefined.close}`
                this.errors.push({
                    type: 'undefined_variable',
                    variable: node.attrs.variable
                })
                return
            }
            let newMarks = node.marks ? node.marks.map(mark => mark.type) : []
            // close all tags that are not present in current text node.
            let closing = false, closeTags = []
            lastMarks.forEach((mark, index)=>{
                if (mark != newMarks[index]) {
                    closing = true
                }
                if (closing) {
                    closeTags.push(TAGS[mark].close)
                }
            })
            // Add close tags in reverse order to close innermost tags
            // first.
            closeTags.reverse()
            html += closeTags.join('')

            // open all new tags that were not present in the last text node.
            let opening = false
            newMarks.forEach((mark, index)=>{
                if (mark != lastMarks[index]) {
                    opening = true
                }
                if (opening) {
                    html += TAGS[mark].open
                }
            })
            html += node.text
            lastMarks = newMarks
        })
        // Close all still open tags
        lastMarks.slice().reverse().forEach((mark)=>{
            html += TAGS[mark].close
        })
        return html
    }

    _reformDate(dateStr) {
        let dateObj = Object(_edtf_parser__WEBPACK_IMPORTED_MODULE_1__[/* edtfParse */ "a"])(dateStr), reformedDate = {}
        if (!dateObj.valid) {
            return false
        } else if (dateObj.type === 'Interval') {
            let values = []
            dateObj.values.forEach(value => {
                if(value.length) {
                    values.push(value.slice(0,3))
                }
            })
            if (values.length===2) {
                reformedDate = {
                    'date-parts': values
                }
            } else {
                // Open interval that we cannot represent, so we make it circa instead.
                reformedDate = {
                    'date-parts': values[0],
                    'circa': true
                }
            }

        } else {
            reformedDate = {
                'date-parts': [ dateObj.values.slice(0,3) ]
            }
        }
        if (dateObj.uncertain || dateObj.approximate) {
            reformedDate['circa'] = true
        }
        return reformedDate
    }

    _reformName(theNames) {
        return theNames.map(name => {
            let reformedName = {}
            if (name.literal) {
                 let literal = this._reformText(name.literal)
                 if (literal.length) {
                     reformedName['literal'] = literal
                 } else {
                     return false
                 }
            } else {
                reformedName['given'] = this._reformText(name.given)
                reformedName['family'] = this._reformText(name.family)
                if (name.suffix) {
                    reformedName['suffix'] = this._reformText(name.suffix)
                }
                if (name.prefix) {
                    if(name.useprefix === true) {
                        reformedName['non-dropping-particle'] = this._reformText(name.prefix)
                    } else {
                        reformedName['dropping-particle'] = this._reformText(name.prefix)
                    }
                }
                reformedName['family'] = this._reformText(name['family'])
            }
            return reformedName
        }).filter(name => name)
    }

}


/***/ }),
/* 8 */
/*!*********************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/export/biblatex.js ***!
  \*********************************************************************/
/*! exports provided: BibLatexExporter */
/*! exports used: BibLatexExporter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexExporter; });
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./const */ 5);
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../const */ 0);



/** Export a list of bibliography items to bibLateX and serve the file to the user as a ZIP-file.
 * @class BibLatexExporter
 * @param pks A list of pks of the bibliography items that are to be exported.
 */

 const TAGS = {
     'strong': {open:'\\mkbibbold{', close: '}'},
     'em': {open:'\\mkbibitalic{', close: '}'},
     'smallcaps': {open:'\\textsc{', close: '}'},
     'enquote': {open:'\\enquote{', close: '}'},
     'nocase': {open:'{{', close: '}}'},
     'sub': {open:'_{', close: '}'},
     'sup': {open:'^{', close: '}'},
     'math': {open:'$', close: '$'},
     'url': {open:'\\url{', close: '}', verbatim: true}
  }

class BibLatexExporter {

    constructor(bibDB, pks = false, config = {}) {
        this.bibDB = bibDB // The bibliography database to export from.
        if (pks) {
            this.pks = pks // A list of pk values of the bibliography items to be exported.
        } else {
            this.pks = Object.keys(bibDB) // If none are selected, all keys are exporter
        }
        this.config = config
        this.warnings = []
    }

    get output() {
        this.bibtexArray = []
        this.bibtexStr = ''

        this.pks.forEach(pk => {
            let bib = this.bibDB[pk]
            let bibEntry = {
                'type': _const__WEBPACK_IMPORTED_MODULE_1__[/* BibTypes */ "b"][bib['bib_type']]['biblatex'],
                'key': bib['entry_key'].length ? bib['entry_key'] : 'Undefined'
            }
            let fValues = {}
            for (let fKey in bib.fields) {
                if (!_const__WEBPACK_IMPORTED_MODULE_1__[/* BibFieldTypes */ "a"][fKey]) {
                    continue
                }
                let fValue = bib.fields[fKey]
                let fType = _const__WEBPACK_IMPORTED_MODULE_1__[/* BibFieldTypes */ "a"][fKey]['type']
                let key = _const__WEBPACK_IMPORTED_MODULE_1__[/* BibFieldTypes */ "a"][fKey]['biblatex']
                switch (fType) {
                    case 'f_date':
                        fValues[key] = fValue // EDTF 1.0 level 0/1 compliant string.
                        break
                    case 'f_integer':
                        fValues[key] = this._reformText(fValue)
                        break
                    case 'f_key':
                        fValues[key] = this._reformKey(fValue, fKey)
                        break
                    case 'f_literal':
                    case 'f_long_literal':
                        fValues[key] = this._reformText(fValue)
                        break
                    case 'l_range':
                        fValues[key] = this._reformRange(fValue)
                        break
                    case 'f_title':
                        fValues[key] = this._reformText(fValue)
                        break
                    case 'f_uri':
                    case 'f_verbatim':
                        fValues[key] = fValue.replace(/{|}/g, '') // TODO: balanced braces should probably be ok here.
                        break
                    case 'l_key':
                        fValues[key] = this._escapeTeX(fValue.map(key=>{return this._reformKey(key, fKey)}).join(' and '))
                        break
                    case 'l_literal':
                        fValues[key] = fValue.map((text)=>{return this._reformText(text)}).join(' and ')
                        break
                    case 'l_name':
                        fValues[key] = this._reformName(fValue)
                        break
                    case 'l_tag':
                        fValues[key] = this._escapeTeX(fValue.join(', '))
                        break
                    default:
                        console.warn(`Unrecognized type: ${fType}!`)
                }

            }
            bibEntry.values = fValues
            this.bibtexArray[this.bibtexArray.length] = bibEntry
        })

        this.bibtexStr = this._getBibtexString(this.bibtexArray)
        return this.bibtexStr
    }

    _reformKey(theValue, fKey) {
        if (typeof theValue==='string') {
            let fieldType = _const__WEBPACK_IMPORTED_MODULE_1__[/* BibFieldTypes */ "a"][fKey]
            if (Array.isArray(fieldType['options'])) {
                return this._escapeTeX(theValue)
            } else {
                return this._escapeTeX(fieldType['options'][theValue]['biblatex'])
            }
        } else {
            return this._reformText(theValue)
        }
    }

    _reformRange(theValue) {
        return theValue.map(
            range => range.map(
                text => this._reformText(text)
            ).join('--')
        ).join(',')
    }

    _reformName(theValue) {
        let names = []
        theValue.forEach((name)=>{
            if (name.literal) {
                let literal = this._reformText(name.literal)
                if (literal.length) {
                    names.push(`{${literal}}`)
                }
            } else {
                let family = name.family ? this._reformText(name.family) : ''
                let given = name.given ? this._reformText(name.given): ''
                let suffix = name.suffix ? this._reformText(name.suffix) : false
                let prefix = name.prefix ? this._reformText(name.prefix) : false
                let useprefix = name.useprefix ? name.useprefix: false
                if (this.config.traditionalNames) {
                    if (suffix && prefix) {
                        names.push(`{${prefix} ${family}}, {${suffix}}, {${given}}`)
                    } else if (suffix) {
                        names.push(`{${family}}, {${suffix}}, {${given}}`)
                    } else if (prefix) {
                        names.push(`{${prefix} ${family}}, {${given}}`)
                    } else {
                        names.push(`{${family}}, {${given}}`)
                    }
                } else {
                    let nameParts = []
                    if (given.length) {
                        nameParts.push(this._protectNamePart(`given={${given}}`))
                    }
                    if (family.length) {
                        nameParts.push(this._protectNamePart(`family={${family}}`))
                    }
                    if (suffix) {
                        nameParts.push(this._protectNamePart(`suffix={${suffix}}`))
                    }
                    if (prefix) {
                        nameParts.push(this._protectNamePart(`prefix={${prefix}}`))
                        nameParts.push(`useprefix=${name.useprefix}`)
                    }
                    names.push(nameParts.join(', '))
                }
            }
        })
        return names.join(' and ')
    }

    _protectNamePart(namePart) {
        if (namePart.includes(',')) {
            return `"${namePart}"`
        } else {
            return namePart
        }
    }

    _escapeTeX(theValue) {
        if ('string' != typeof (theValue)) {
            return false
        }
        let len = _const__WEBPACK_IMPORTED_MODULE_0__[/* TexSpecialChars */ "a"].length
        for (let i = 0; i < len; i++) {
            theValue = theValue.replace(
                _const__WEBPACK_IMPORTED_MODULE_0__[/* TexSpecialChars */ "a"][i][0],
                _const__WEBPACK_IMPORTED_MODULE_0__[/* TexSpecialChars */ "a"][i][1]
            )
        }
        return theValue
    }

    _reformText(theValue) {
        let latex = '', lastMarks = []

        // Add one extra empty node to theValue to close all still open tags for last node.
        theValue.concat({type:'text', text:''}).forEach(
            node => {
                if (node.type === 'variable') {
                    // This is an undefined variable
                    // This should usually not happen, as CSL doesn't know what to
                    // do with these. We'll put them into an unsupported tag.
                    latex += `} # ${node.attrs.variable} # {`
                    this.warnings.push({
                        type: 'undefined_variable',
                        variable: node.attrs.variable
                    })
                    return
                }
                let newMarks = []
                if (node.marks) {
                    let mathMode = false
                    node.marks.forEach((mark)=>{
                        // We need to activate mathmode for the lowest level sub/sup node.
                        if ((mark.type === 'sup' || mark.type === 'sub') && !mathMode) {
                            newMarks.push('math')
                            newMarks.push(mark.type)
                            mathMode = true
                        } else if (mark.type === 'nocase') {
                            // No case has to be applied at the top level to be effective.
                            newMarks.unshift(mark.type)
                        } else {
                            newMarks.push(mark.type)
                        }
                    })
                }
                // close all tags that are not present in current text node.
                let closing = false, closeTags = []
                lastMarks.forEach((mark, index)=>{
                    if (mark != newMarks[index]) {
                        closing = true
                    }
                    if (closing) {
                        let closeTag = TAGS[mark].close
                        // If not inside of a nocase, add a protective brace around tag.
                        if (lastMarks[0] !== 'nocase' && TAGS[mark].open[0] === '\\') {
                            closeTag += '}'
                        }
                        closeTags.push(closeTag)
                    }

                })
                // Add close tags to latex in reverse order to close innermost tags
                // first.
                closeTags.reverse()
                latex += closeTags.join('')

                // open all new tags that were not present in the last text node.
                let opening = false, verbatim = false
                newMarks.forEach((mark, index)=>{
                    if (mark != lastMarks[index]) {
                        opening = true
                    }
                    if (opening) {
                        // If not inside of a nocase, add a protective brace around tag.
                        if (newMarks[0] !== 'nocase' && TAGS[mark].open[0] === '\\') {
                            latex += '{'
                        }
                        latex += TAGS[mark].open
                        if (TAGS[mark].verbatim) {
                            verbatim = true
                        }
                    }
                })
                if (verbatim) {
                    latex += node.text
                } else {
                    latex += this._escapeTeX(node.text)
                }
                lastMarks = newMarks
            }
        )
        return latex
    }

    _getBibtexString(biblist) {
        let len = biblist.length,
            str = ''
        for (let i = 0; i < len; i++) {
            if (0 < i) {
                str += '\n\n'
            }
            let data = biblist[i]
            str += `@${data.type}{${data.key}`
            for (let vKey in data.values) {
                let value = `{${data.values[vKey]}}`.replace(/\{\} \# /g,'').replace(/\# \{\}/g,'')
                str += `,\n${vKey} = ${value}`
            }
            str += "\n}"
        }
        return str
    }
}


/***/ }),
/* 9 */
/*!*********************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/biblatex.js ***!
  \*********************************************************************/
/*! exports provided: BibLatexParser */
/*! exports used: BibLatexParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexParser; });
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../const */ 0);
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./const */ 1);
/* harmony import */ var _name_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./name-parser */ 12);
/* harmony import */ var _literal_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./literal-parser */ 4);
/* harmony import */ var _group_parser__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./group-parser */ 11);
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./tools */ 6);
/* harmony import */ var _edtf_parser__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../edtf-parser */ 3);








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

class BibLatexParser {

    constructor(input, config = {}) {
        this.input = input
        this.config = config
        this.pos = 0
        this.entries = []
        this.bibDB = {}
        this.currentKey = false
        this.currentEntry = false
        this.currentType = ""
        this.errors = []
        this.warnings = []
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
    }

    isWhitespace(s) {
        return (s == ' ' || s == '\r' || s == '\t' || s == '\n')
    }

    error(data) {
        this.errors.push(Object.assign({}, data, {line: this.input.slice(0, this.pos).split('\n').length }))
    }

    warning(data) {
        this.warnings.push(Object.assign({}, data, {line: this.input.slice(0, this.pos).split('\n').length }))
    }

    match(s, options) {
        if (!options) options = { skipWhitespace: true }
        if (options.skipWhitespace === true || options.skipWhitespace === 'leading') this.skipWhitespace()
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

    tryMatch(s) {
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
        while ((this.input.length > this.pos) && (this.input[this.pos] !=
            "@")) {
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
        let start = this.pos
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
                this.warning({
                    type: 'undefined_variable',
                    entry: this.currentEntry['entry_key'],
                    key: this.currentKey,
                    variable: k
                })
                // Using \u0870 as a delimiter for variables as they cannot be
                // used in regular latex code.
                return `\u0870${k}\u0870`
            }
        }
    }

    value() {
        let values = []
        values.push(this.singleValue())
        while (this.tryMatch("#")) {
            this.match("#")
            values.push(this.singleValue())
        }
        return values.join("").replace(/[\t ]+/g, ' ').trim()
    }

    key(optional) {
        let start = this.pos
        while (true) {
            if (this.pos == this.input.length) {
                this.error({type: 'runaway_key' })
                return
            }
            if (['(',')',',','{','}',' ','=', '\t', '\n'].includes(this.input[this.pos])) {
                let key = this.input.substring(start, this.pos)
                if (optional && this.input[this.pos] != ',') {
                    this.skipWhitespace()
                    if (this.input[this.pos] != ',') {
                        this.pos = start
                        return null
                    }
                }
                return key
            } else {
                this.pos++
            }
        }
    }

    keyEqualsValue() {
        let key = this.key()
        if (!key) {
            this.error({
                type: 'cut_off_citation',
                entry: this.currentEntry['entry_key'],
            })
            // The citation is not full, we remove the existing parts.
            this.currentEntry['incomplete'] = true
            return
        }
        this.currentKey = key.toLowerCase()
        if (this.tryMatch("=")) {
            this.match("=")
            let val = this.value()
            return [this.currentKey, val]
        } else {
            this.error({
                type: 'missing_equal_sign',
                key: this.currentKey,
                entry: this.currentEntry['entry_key'],
            })
        }
    }

    keyValueList() {
        let kv = this.keyEqualsValue()
        if (typeof(kv) === 'undefined') {
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
            if (typeof (kv) === 'undefined') {
                this.error({
                    type: 'key_value_error',
                    entry: this.currentEntry['entry_key'],
                })
                break
            }
            rawFields[kv[0]] = kv[1]
        }
    }

    processFields() {
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
                errorList.push({
                    type: 'unknown_date',
                    entry: this.currentEntry['entry_key'],
                    field_name: fieldName,
                    value
                })
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
            if (langid) {
                fields['langid'] = langid
                if (!['usenglish', 'ukenglish', 'caenglish', 'auenglish', 'nzenglish'].includes(langid)) {
                    langEnglish = false
                }
            }
        }

        iterateFields: for(let bKey in rawFields) {

            if (bKey==='date' || (['year','month'].includes(bKey) && !this.config.processUnknown)) {
                // Handled above
                continue iterateFields
            }

            // Replace alias fields with their main term.
            let aliasKey = _const__WEBPACK_IMPORTED_MODULE_1__[/* BiblatexFieldAliasTypes */ "c"][bKey], fKey
            if (aliasKey) {
                if (rawFields[aliasKey]) {
                    this.warning({
                        type: 'alias_creates_duplicate_field',
                        entry: this.currentEntry['entry_key'],
                        field: bKey,
                        alias_of: aliasKey,
                        value: rawFields[bKey],
                        alias_of_value: rawFields[aliasKey]
                    })
                    continue iterateFields
                }

                fKey = Object.keys(_const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"]).find((ft)=>{
                    return _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][ft].biblatex === aliasKey
                })
            } else {
                fKey = Object.keys(_const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"]).find((ft)=>{
                    return _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][ft].biblatex === bKey
                })
            }

            let oFields, fType
            let bType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibTypes */ "b"][this.currentEntry['bib_type']]

            if('undefined' == typeof(fKey)) {
                this.warning({
                    type: 'unknown_field',
                    entry: this.currentEntry['entry_key'],
                    field_name: bKey
                })
                if (!this.config.processUnknown) {
                    continue iterateFields
                }
                if (!this.currentEntry['unknown_fields']) {
                    this.currentEntry['unknown_fields'] = {}
                }
                oFields = this.currentEntry['unknown_fields']
                fType = this.config.processUnknown[bKey] ? this.config.processUnknown[bKey] : 'f_literal'
                fKey = bKey
            } else if (
                bType['required'].includes(fKey) ||
                bType['optional'].includes(fKey) ||
                bType['eitheror'].includes(fKey)
            ) {
                oFields = fields
                fType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['type']
            } else {
                this.warning({
                    type: 'unexpected_field',
                    entry: this.currentEntry['entry_key'],
                    field_name: bKey
                })
                if (!this.config.processUnexpected) {
                    continue iterateFields
                }
                if (!this.currentEntry['unexpected_fields']) {
                    this.currentEntry['unexpected_fields'] = {}
                }
                oFields = this.currentEntry['unexpected_fields']
                fType = _const__WEBPACK_IMPORTED_MODULE_0__[/* BibFieldTypes */ "a"][fKey]['type']
            }


            let fValue = rawFields[bKey]
            switch(fType) {
                case 'f_date':
                    let dateObj = Object(_edtf_parser__WEBPACK_IMPORTED_MODULE_6__[/* edtfParse */ "a"])(fValue)
                    if (dateObj.valid) {
                        oFields[fKey] = dateObj.cleanedString
                    } else {
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
                    let reformedKey = this._reformKey(fValue, fKey)
                    if (reformedKey !== false) {
                        oFields[fKey] = reformedKey
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
                        this.error({
                            type: 'unknown_uri',
                            entry: this.currentEntry['entry_key'],
                            field_name: fKey,
                            value: fValue,
                        })
                    }
                    break
                case 'f_verbatim':
                    oFields[fKey] = fValue
                    break
                case 'l_key':
                    oFields[fKey] = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(fValue).map(keyField=> this._reformKey(keyField, fKey))
                    break
                case 'l_tag':
                    oFields[fKey] = fValue.split(/[,;]/).map(string => string.trim())
                    break
                case 'l_literal':
                    let items = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(fValue)
                    oFields[fKey] = items.map(item => this._reformLiteral(item.trim()))
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

    _reformKey(keyString, fKey) {
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
                }
            }
        }
        if (fieldType.strict) {
            this.warning({
                type: 'unknown_key',
                entry: this.currentEntry['entry_key'],
                field_name: fKey,
                value: keyString
            })
            return false
        }
        return this._reformLiteral(keyString)

    }

    _checkURI(uriString) {
        /* Copyright (c) 2010-2013 Diego Perini, MIT licensed
           https://gist.github.com/dperini/729294
         */
        return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(uriString)
    }

    _reformURI(uriString) {
        return uriString.replace(/\\/g,'')
    }

    _reformNameList(nameString) {
        let people = Object(_tools__WEBPACK_IMPORTED_MODULE_5__[/* splitTeXString */ "a"])(nameString)
        return people.map(person => {
            let nameParser = new _name_parser__WEBPACK_IMPORTED_MODULE_2__[/* BibLatexNameParser */ "a"](person)
            return nameParser.output
        }).filter(person => person)
    }

    _reformRange(rangeString) {
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

    _reformLiteral(theValue, cpMode) {
        let parser = new _literal_parser__WEBPACK_IMPORTED_MODULE_3__[/* BibLatexLiteralParser */ "a"](theValue, cpMode)
        return parser.output
    }

    bibType() {
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
        if (this.currentEntry['entry_key'] !== null) {
            this.match(",")
        }
        this.keyValueList()
        if (this.currentEntry['entry_key'] === null) {
            this.currentEntry['entry_key'] = ''
        }
        this.processFields()
    }

    directive() {
        this.match("@")
        this.currentType = this.key()
        if (!this.currentType) return null
        this.currentType = this.currentType.toLowerCase()
        return "@" + this.currentType
    }

    string() {
        let kv = this.keyEqualsValue()
        this.variables[kv[0].toUpperCase()] = kv[1]
    }

    preamble() {
        this.value()
    }


    replaceTeXChars() {
        let value = this.input
        let len = _const__WEBPACK_IMPORTED_MODULE_1__[/* TeXSpecialChars */ "d"].length
        for (let i = 0; i < len; i++) {
            let texChar = _const__WEBPACK_IMPORTED_MODULE_1__[/* TeXSpecialChars */ "d"][i]
            let texCharRe = /^[a-zA-Z\\]+$/.test(texChar[0]) ?
                new RegExp(`{(${texChar[0]})}|${texChar[0]}\\s|${texChar[0]}(?=\\W|\\_)`,'g') :
                new RegExp(`{(${texChar[0]})}|${texChar[0]}{}|${texChar[0]}`,'g')
            value = value.replace(texCharRe, texChar[1])
        }
        // Delete multiple spaces
        this.input = value.replace(/ +(?= )/g, '')
        return
    }

    stepThroughBibtex() {
        let closer
        while (this.skipToNext()) {
            let d = this.directive()
            if (!d) break

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
    }

    parseComment(braceless) {
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
        if (this.groupParser.groups) {
            this.groups = this.groupParser.groups
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
        this.replaceTeXChars()
        this.stepThroughBibtex()
        this.createBibDB()
        this.cleanDB()
        return this.bibDB
    }

}


/***/ }),
/* 10 */
/*!*************************!*\
  !*** ./lib/exporter.ts ***!
  \*************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/lib/exporter.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jabref_ts_1 = __webpack_require__(/*! ../bibtex/jabref.ts */ 25); // not so nice... BibTeX-specific code
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.Exporter = new class {
    constructor() {
        this.attachmentCounter = 0;
        this.preamble = { DeclarePrefChars: '' };
        this.caching = !Translator.options.exportFileData;
        this.jabref = new jabref_ts_1.JabRef();
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
            debug_ts_1.debug('fetched item:', item);
            if (!item.citekey) {
                debug_ts_1.debug(new Error('No citation key found in'), item);
                throw new Error(`No citation key in ${JSON.stringify(item)}`);
            }
            this.jabref.citekeys.set(item.itemID, item.citekey);
            const cached = Zotero.BetterBibTeX.cacheFetch(item.itemID, Translator.options);
            if (cached) {
                Zotero.write(cached.reference);
                if (cached.metadata && cached.metadata.DeclarePrefChars)
                    this.preamble.DeclarePrefChars += cached.metadata.DeclarePrefChars;
                continue;
            }
            debug_ts_1.debug('pre-simplify', item);
            Zotero.BetterBibTeX.simplifyFields(item);
            debug_ts_1.debug('post-simplify', item);
            Object.assign(item, Zotero.BetterBibTeX.extractFields(item));
            debug_ts_1.debug('exporting', item);
            return item;
        }
        return null;
    }
    // TODO: move to bibtex-exporters
    complete() {
        debug_ts_1.debug('Exporter.complete: write JabRef groups');
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
; Zotero.debug('BBT: loaded translators/lib/exporter.ts'); } catch ($wrap_loader_catcher_translators_lib_exporter_ts) { Zotero.debug('Error: BBT: load of translators/lib/exporter.ts failed:' + $wrap_loader_catcher_translators_lib_exporter_ts + '::' + $wrap_loader_catcher_translators_lib_exporter_ts.stack) };

/***/ }),
/* 11 */
/*!*************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/group-parser.js ***!
  \*************************************************************************/
/*! exports provided: GroupParser */
/*! exports used: GroupParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GroupParser; });
class GroupParser {
    constructor(entries) {
      this.groups = false
      this.groupType = 'jabref4'
      this.warnings = []
      this.entries = entries
      this.stringStarts = [
          ["jabref-meta: databaseType:bibtex;", () => this.groupType = 'jabref4'],
          ["jabref-meta: databaseType:biblatex;", () => this.groupType = 'jabref4'],
          ["jabref-meta: groupsversion:3;", () => this.groupType = 'jabref3'],
          ["jabref-meta: grouping:", () => this.readGroupInfo('jabref4.1')],
          ["jabref-meta: groupstree:", () => this.readGroupInfo()],
          ["jabref-meta: fileDirectory:", () => this.readFileDirectory()],
      ]
    }

    checkString(input) {
        this.input = input
        this.pos = 0
        this.stringStarts.find(stringStart => {
            let pos = this.input.indexOf(stringStart[0], this.pos)
            if (pos < 0) {
                return false
            } else {
                this.pos = pos + stringStart[0].length
                stringStart[1]()
                return true
            }
        })
    }

    readGroupInfo(groupType) {
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
      this.fileDirectory = ''
      while ((this.input.length > this.pos) && (this.input[this.pos]) !== ';') {
        this.fileDirectory += this.input[this.pos];
        this.pos++;
      }
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

    clearGroups(groups) {
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

            if (!bib.unknown_fields.groups || !bib.entry_key) {
                return
            }
            // this assumes ref.unknown_fields.groups is a single text chunk
            let groups = bib.unknown_fields.groups.reduce(
                (string, node) => {
                    if (node.type === 'text') {
                        // undo undescores to marks -- groups content is in verbatim-ish mode
                        var sub = (node.marks || []).find(mark => mark.type === 'sub') ? '_' : ''
                        string += sub + node.text
                    }
                    return string
                },
                ''
            ).trim()
            delete bib.unknown_fields.groups

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

    find (name, groups) {
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
/* 12 */
/*!************************************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/import/name-parser.js ***!
  \************************************************************************/
/*! exports provided: BibLatexNameParser */
/*! exports used: BibLatexNameParser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BibLatexNameParser; });
/* harmony import */ var _literal_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./literal-parser */ 4);


class BibLatexNameParser {

    constructor(nameString) {
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

    parseExtendedName(parts) {
        parts.forEach( part => {
            let attrParts = part.trim().replace(/^\"|\"$/g,'').split('=')
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

    splitTexString(string, sep='[\\s~]+') {
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

    processFirstMiddle(parts) {
        this.nameDict['given'] = this._reformLiteral(parts.join(' ').trim())
    }

    processVonLast(parts, lineage=[]) {
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

    findFirstLowerCaseWord(lst) {
        // return index of first lowercase word in lst. Else return length of lst.
        for(let i = 0;i<lst.length;i++) {
            let word = lst[i]
            if (word === word.toLowerCase()) {
                return i
            }
        }
        return lst.length
    }

    splitAt(lst) {
        // Split the given list into two parts.
        // The second part starts with the first lowercase word.
        let pos = this.findFirstLowerCaseWord(lst)
        return [lst.slice(0, pos), lst.slice(pos)]
    }

    rsplitAt(lst) {
        let rpos = this.findFirstLowerCaseWord(lst.slice().reverse())
        let pos = lst.length - rpos
        return [lst.slice(0, pos), lst.slice(pos)]
    }

    _reformLiteral(litString) {
        let parser = new _literal_parser__WEBPACK_IMPORTED_MODULE_0__[/* BibLatexLiteralParser */ "a"](litString)
        return parser.output
    }

}


/***/ }),
/* 13 */
/*!***********************************************************!*\
  !*** ../node_modules/biblatex-csl-converter/src/index.js ***!
  \***********************************************************/
/*! exports provided: BibLatexParser, BibLatexExporter, CSLExporter, BibFieldTypes, BibTypes, edtfParse */
/*! all exports used */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _import_biblatex__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./import/biblatex */ 9);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BibLatexParser", function() { return _import_biblatex__WEBPACK_IMPORTED_MODULE_0__["a"]; });

/* harmony import */ var _export_biblatex__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./export/biblatex */ 8);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BibLatexExporter", function() { return _export_biblatex__WEBPACK_IMPORTED_MODULE_1__["a"]; });

/* harmony import */ var _export_csl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./export/csl */ 7);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CSLExporter", function() { return _export_csl__WEBPACK_IMPORTED_MODULE_2__["a"]; });

/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./const */ 0);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BibFieldTypes", function() { return _const__WEBPACK_IMPORTED_MODULE_3__["a"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BibTypes", function() { return _const__WEBPACK_IMPORTED_MODULE_3__["b"]; });

/* harmony import */ var _edtf_parser__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./edtf-parser */ 3);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "edtfParse", function() { return _edtf_parser__WEBPACK_IMPORTED_MODULE_4__["a"]; });








/***/ }),
/* 14 */
/*!*******************************************!*\
  !*** ../node_modules/json5/dist/index.js ***!
  \*******************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

!function(u,D){ true?module.exports=D():undefined}(this,function(){"use strict";var u,D,F=(function(u,D){Object.defineProperty(D,"__esModule",{value:!0});D.Space_Separator=/[\u1680\u2000-\u200A\u202F\u205F\u3000]/,D.ID_Start=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,D.ID_Continue=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/}(u={exports:{}},u.exports),u.exports);(D=F)&&D.__esModule&&Object.prototype.hasOwnProperty.call(D,"default")&&D.default;var e=F.Space_Separator,C=F.ID_Start,A=F.ID_Continue;function r(u){return u>="a"&&u<="z"||u>="A"&&u<="Z"||"$"===u||"_"===u||C.test(u)}function t(u){return u>="a"&&u<="z"||u>="A"&&u<="Z"||u>="0"&&u<="9"||"$"===u||"_"===u||"‌"===u||"‍"===u||A.test(u)}function E(u){return/[0-9]/.test(u)}function n(u){return/[0-9A-Fa-f]/.test(u)}var i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(u){return typeof u}:function(u){return u&&"function"==typeof Symbol&&u.constructor===Symbol&&u!==Symbol.prototype?"symbol":typeof u},o=void 0,a=void 0,B=void 0,c=void 0,s=void 0,f=void 0,d=void 0,l=void 0,v=void 0;var m=void 0,p=void 0,h=void 0,y=void 0,w=void 0;function b(){for(m="default",p="",h=!1,y=1;;){w=g();var u=x[m]();if(u)return u}}function g(){if(o[c])return String.fromCodePoint(o.codePointAt(c))}function S(){var u=g();return"\n"===u?(s++,f=0):u?f+=u.length:f++,u&&(c+=u.length),u}var x={default:function(){switch(w){case"\t":case"\v":case"\f":case" ":case" ":case"\ufeff":case"\n":case"\r":case"\u2028":case"\u2029":return void S();case"/":return S(),void(m="comment");case void 0:return S(),N("eof")}if(!function(u){return e.test(u)}(w))return x[a]();S()},comment:function(){switch(w){case"*":return S(),void(m="multiLineComment");case"/":return S(),void(m="singleLineComment")}throw j(S())},multiLineComment:function(){switch(w){case"*":return S(),void(m="multiLineCommentAsterisk");case void 0:throw j(S())}S()},multiLineCommentAsterisk:function(){switch(w){case"*":return void S();case"/":return S(),void(m="default");case void 0:throw j(S())}S(),m="multiLineComment"},singleLineComment:function(){switch(w){case"\n":case"\r":case"\u2028":case"\u2029":return S(),void(m="default");case void 0:return S(),N("eof")}S()},value:function(){switch(w){case"{":case"[":return N("punctuator",S());case"n":return S(),P("ull"),N("null",null);case"t":return S(),P("rue"),N("boolean",!0);case"f":return S(),P("alse"),N("boolean",!1);case"-":case"+":return"-"===S()&&(y=-1),void(m="sign");case".":return p=S(),void(m="decimalPointLeading");case"0":return p=S(),void(m="zero");case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":return p=S(),void(m="decimalInteger");case"I":return S(),P("nfinity"),N("numeric",1/0);case"N":return S(),P("aN"),N("numeric",NaN);case'"':case"'":return h='"'===S(),p="",void(m="string")}throw j(S())},identifierNameStartEscape:function(){if("u"!==w)throw j(S());S();var u=O();switch(u){case"$":case"_":break;default:if(!r(u))throw L()}p+=u,m="identifierName"},identifierName:function(){switch(w){case"$":case"_":case"‌":case"‍":return void(p+=S());case"\\":return S(),void(m="identifierNameEscape")}if(!t(w))return N("identifier",p);p+=S()},identifierNameEscape:function(){if("u"!==w)throw j(S());S();var u=O();switch(u){case"$":case"_":case"‌":case"‍":break;default:if(!t(u))throw L()}p+=u,m="identifierName"},sign:function(){switch(w){case".":return p=S(),void(m="decimalPointLeading");case"0":return p=S(),void(m="zero");case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":return p=S(),void(m="decimalInteger");case"I":return S(),P("nfinity"),N("numeric",y*(1/0));case"N":return S(),P("aN"),N("numeric",NaN)}throw j(S())},zero:function(){switch(w){case".":return p+=S(),void(m="decimalPoint");case"e":case"E":return p+=S(),void(m="decimalExponent");case"x":case"X":return p+=S(),void(m="hexadecimal")}return N("numeric",0*y)},decimalInteger:function(){switch(w){case".":return p+=S(),void(m="decimalPoint");case"e":case"E":return p+=S(),void(m="decimalExponent")}if(!E(w))return N("numeric",y*Number(p));p+=S()},decimalPointLeading:function(){if(E(w))return p+=S(),void(m="decimalFraction");throw j(S())},decimalPoint:function(){switch(w){case"e":case"E":return p+=S(),void(m="decimalExponent")}return E(w)?(p+=S(),void(m="decimalFraction")):N("numeric",y*Number(p))},decimalFraction:function(){switch(w){case"e":case"E":return p+=S(),void(m="decimalExponent")}if(!E(w))return N("numeric",y*Number(p));p+=S()},decimalExponent:function(){switch(w){case"+":case"-":return p+=S(),void(m="decimalExponentSign")}if(E(w))return p+=S(),void(m="decimalExponentInteger");throw j(S())},decimalExponentSign:function(){if(E(w))return p+=S(),void(m="decimalExponentInteger");throw j(S())},decimalExponentInteger:function(){if(!E(w))return N("numeric",y*Number(p));p+=S()},hexadecimal:function(){if(n(w))return p+=S(),void(m="hexadecimalInteger");throw j(S())},hexadecimalInteger:function(){if(!n(w))return N("numeric",y*Number(p));p+=S()},string:function(){switch(w){case"\\":return S(),void(p+=function(){switch(g()){case"b":return S(),"\b";case"f":return S(),"\f";case"n":return S(),"\n";case"r":return S(),"\r";case"t":return S(),"\t";case"v":return S(),"\v";case"0":if(S(),E(g()))throw j(S());return"\0";case"x":return S(),function(){var u="",D=g();if(!n(D))throw j(S());if(u+=S(),!n(D=g()))throw j(S());return u+=S(),String.fromCodePoint(parseInt(u,16))}();case"u":return S(),O();case"\n":case"\u2028":case"\u2029":return S(),"";case"\r":return S(),"\n"===g()&&S(),"";case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":case void 0:throw j(S())}return S()}());case'"':return h?(S(),N("string",p)):void(p+=S());case"'":return h?void(p+=S()):(S(),N("string",p));case"\n":case"\r":throw j(S());case"\u2028":case"\u2029":!function(u){console.warn("JSON5: '"+u+"' is not valid ECMAScript; consider escaping")}(w);break;case void 0:throw j(S())}p+=S()},start:function(){switch(w){case"{":case"[":return N("punctuator",S())}m="value"},beforePropertyName:function(){switch(w){case"$":case"_":return p=S(),void(m="identifierName");case"\\":return S(),void(m="identifierNameStartEscape");case"}":return N("punctuator",S());case'"':case"'":return h='"'===S(),void(m="string")}if(r(w))return p+=S(),void(m="identifierName");throw j(S())},afterPropertyName:function(){if(":"===w)return N("punctuator",S());throw j(S())},beforePropertyValue:function(){m="value"},afterPropertyValue:function(){switch(w){case",":case"}":return N("punctuator",S())}throw j(S())},beforeArrayValue:function(){if("]"===w)return N("punctuator",S());m="value"},afterArrayValue:function(){switch(w){case",":case"]":return N("punctuator",S())}throw j(S())},end:function(){throw j(S())}};function N(u,D){return{type:u,value:D,line:s,column:f}}function P(u){var D=!0,F=!1,e=void 0;try{for(var C,A=u[Symbol.iterator]();!(D=(C=A.next()).done);D=!0){var r=C.value;if(g()!==r)throw j(S());S()}}catch(u){F=!0,e=u}finally{try{!D&&A.return&&A.return()}finally{if(F)throw e}}}function O(){for(var u="",D=4;D-- >0;){if(!n(g()))throw j(S());u+=S()}return String.fromCodePoint(parseInt(u,16))}var I={start:function(){if("eof"===d.type)throw J();_()},beforePropertyName:function(){switch(d.type){case"identifier":case"string":return l=d.value,void(a="afterPropertyName");case"punctuator":return void V();case"eof":throw J()}},afterPropertyName:function(){if("eof"===d.type)throw J();a="beforePropertyValue"},beforePropertyValue:function(){if("eof"===d.type)throw J();_()},beforeArrayValue:function(){if("eof"===d.type)throw J();"punctuator"!==d.type||"]"!==d.value?_():V()},afterPropertyValue:function(){if("eof"===d.type)throw J();switch(d.value){case",":return void(a="beforePropertyName");case"}":V()}},afterArrayValue:function(){if("eof"===d.type)throw J();switch(d.value){case",":return void(a="beforeArrayValue");case"]":V()}},end:function(){}};function _(){var u=void 0;switch(d.type){case"punctuator":switch(d.value){case"{":u={};break;case"[":u=[]}break;case"null":case"boolean":case"numeric":case"string":u=d.value}if(void 0===v)v=u;else{var D=B[B.length-1];Array.isArray(D)?D.push(u):D[l]=u}if(null!==u&&"object"===(void 0===u?"undefined":i(u)))B.push(u),a=Array.isArray(u)?"beforeArrayValue":"beforePropertyName";else{var F=B[B.length-1];a=null==F?"end":Array.isArray(F)?"afterArrayValue":"afterPropertyValue"}}function V(){B.pop();var u=B[B.length-1];a=null==u?"end":Array.isArray(u)?"afterArrayValue":"afterPropertyValue"}function j(u){return k(void 0===u?"JSON5: invalid end of input at "+s+":"+f:"JSON5: invalid character '"+function(u){var D={"'":"\\'",'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\v":"\\v","\0":"\\0","\u2028":"\\u2028","\u2029":"\\u2029"};if(D[u])return D[u];if(u<" "){var F=u.charCodeAt(0).toString(16);return"\\x"+("00"+F).substring(F.length)}return u}(u)+"' at "+s+":"+f)}function J(){return k("JSON5: invalid end of input at "+s+":"+f)}function L(){return k("JSON5: invalid identifier character at "+s+":"+(f-=5))}function k(u){var D=new SyntaxError(u);return D.lineNumber=s,D.columnNumber=f,D}return{parse:function(u,D){o=String(u),a="start",B=[],c=0,s=1,f=0,d=void 0,l=void 0,v=void 0;do{d=b(),I[a]()}while("eof"!==d.type);return"function"==typeof D?function u(D,F,e){var C=D[F];if(null!=C&&"object"===(void 0===C?"undefined":i(C)))for(var A in C){var r=u(C,A,e);void 0===r?delete C[A]:C[A]=r}return e.call(D,F,C)}({"":v},"",D):v},stringify:function(u,D,F){var e=[],C="",A=void 0,E=void 0,n="",o=void 0;if(null==D||"object"!==(void 0===D?"undefined":i(D))||Array.isArray(D)||(F=D.space,o=D.quote,D=D.replacer),"function"==typeof D)E=D;else if(Array.isArray(D)){A=[];var a=!0,B=!1,c=void 0;try{for(var s,f=D[Symbol.iterator]();!(a=(s=f.next()).done);a=!0){var d=s.value,l=void 0;"string"==typeof d?l=d:("number"==typeof d||d instanceof String||d instanceof Number)&&(l=String(d)),void 0!==l&&A.indexOf(l)<0&&A.push(l)}}catch(u){B=!0,c=u}finally{try{!a&&f.return&&f.return()}finally{if(B)throw c}}}return F instanceof Number?F=Number(F):F instanceof String&&(F=String(F)),"number"==typeof F?F>0&&(F=Math.min(10,Math.floor(F)),n="          ".substr(0,F)):"string"==typeof F&&(n=F.substr(0,10)),v("",{"":u});function v(u,D){var F=D[u];switch(null!=F&&("function"==typeof F.toJSON5?F=F.toJSON5(u):"function"==typeof F.toJSON&&(F=F.toJSON(u))),E&&(F=E.call(D,u,F)),F instanceof Number?F=Number(F):F instanceof String?F=String(F):F instanceof Boolean&&(F=F.valueOf()),F){case null:return"null";case!0:return"true";case!1:return"false"}return"string"==typeof F?m(F):"number"==typeof F?String(F):"object"===(void 0===F?"undefined":i(F))?Array.isArray(F)?function(u){if(e.indexOf(u)>=0)throw TypeError("Converting circular structure to JSON5");e.push(u);var D=C;C+=n;for(var F=[],A=0;A<u.length;A++){var r=v(String(A),u);F.push(void 0!==r?r:"null")}var t=void 0;if(0===F.length)t="[]";else if(""===n){var E=F.join(",");t="["+E+"]"}else{var i=",\n"+C,o=F.join(i);t="[\n"+C+o+",\n"+D+"]"}return e.pop(),C=D,t}(F):function(u){if(e.indexOf(u)>=0)throw TypeError("Converting circular structure to JSON5");e.push(u);var D=C;C+=n;var F=A||Object.keys(u),r=[],t=!0,E=!1,i=void 0;try{for(var o,a=F[Symbol.iterator]();!(t=(o=a.next()).done);t=!0){var B=o.value,c=v(B,u);if(void 0!==c){var s=p(B)+":";""!==n&&(s+=" "),s+=c,r.push(s)}}}catch(u){E=!0,i=u}finally{try{!t&&a.return&&a.return()}finally{if(E)throw i}}var f=void 0;if(0===r.length)f="{}";else{var d=void 0;if(""===n)d=r.join(","),f="{"+d+"}";else{var l=",\n"+C;d=r.join(l),f="{\n"+C+d+",\n"+D+"}"}}return e.pop(),C=D,f}(F):void 0}function m(u){var D={"'":.1,'"':.2},F={"'":"\\'",'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\v":"\\v","\0":"\\0","\u2028":"\\u2028","\u2029":"\\u2029"},e="",C=!0,A=!1,r=void 0;try{for(var t,E=u[Symbol.iterator]();!(C=(t=E.next()).done);C=!0){var n=t.value;switch(n){case"'":case'"':D[n]++,e+=n;continue}if(F[n])e+=F[n];else if(n<" "){var i=n.charCodeAt(0).toString(16);e+="\\x"+("00"+i).substring(i.length)}else e+=n}}catch(u){A=!0,r=u}finally{try{!C&&E.return&&E.return()}finally{if(A)throw r}}var a=o||Object.keys(D).reduce(function(u,F){return D[u]<D[F]?u:F});return a+(e=e.replace(new RegExp(a,"g"),F[a]))+a}function p(u){if(0===u.length)return m(u);var D=String.fromCodePoint(u.codePointAt(0));if(!r(D))return m(u);for(var F=D.length;F<u.length;F++)if(!t(String.fromCodePoint(u.codePointAt(F))))return m(u);return u}}}});


/***/ }),
/* 15 */
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
/* 16 */
/*!*****************************!*\
  !*** ./bibtex/datefield.ts ***!
  \*****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/bibtex/datefield.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
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
    debug_ts_1.debug('formatting date', date, field);
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
; Zotero.debug('BBT: loaded translators/bibtex/datefield.ts'); } catch ($wrap_loader_catcher_translators_bibtex_datefield_ts) { Zotero.debug('Error: BBT: load of translators/bibtex/datefield.ts failed:' + $wrap_loader_catcher_translators_bibtex_datefield_ts + '::' + $wrap_loader_catcher_translators_bibtex_datefield_ts.stack) };

/***/ }),
/* 17 */
/*!****************************************!*\
  !*** ./bibtex/unicode_translator.json ***!
  \****************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = {
  'unicode': {
    'math': {
      '<': '<',
      '>': '>',
      '\\': '\\backslash{}'
    },
    'text': {
      '#': '\\#',
      '$': '\\$',
      '%': '\\%',
      '&': '\\&',
      '^': '\\^',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '~': '\\textasciitilde{}',
      '\xA0': '~',
      '\u200B': '\\mbox{}',
      '\u200C': '{\\aftergroup\\ignorespaces}'
    }
  },
  'ascii': {
    'math': {
      '<': '<',
      '>': '>',
      '\\': '\\backslash{}',
      '\xAC': '\\lnot{}',
      '\xAD': '\\-',
      '\xB0': '^\\circ{}',
      '\xB1': '\\pm{}',
      '\xB2': '^2',
      '\xB3': '^3',
      '\xB5': '\\mathrm{\\mu}',
      '\xB7': '\\cdot{}',
      '\xB9': '^1',
      '\xF7': '\\div{}',
      '\u0127': '{\\Elzxh}',
      '\u0192': 'f',
      '\u01AA': '{\\eth}',
      '\u01B5': '{\\Zbar}',
      '\u0237': '{\\jmath}',
      '\u0250': '\\Elztrna{}',
      '\u0252': '\\Elztrnsa{}',
      '\u0254': '\\Elzopeno{}',
      '\u0256': '\\Elzrtld{}',
      '\u0259': '\\Elzschwa{}',
      '\u025B': '\\varepsilon{}',
      '\u0263': '\\Elzpgamma{}',
      '\u0264': '\\Elzpbgam{}',
      '\u0265': '\\Elztrnh{}',
      '\u026C': '\\Elzbtdl{}',
      '\u026D': '\\Elzrtll{}',
      '\u026F': '\\Elztrnm{}',
      '\u0270': '\\Elztrnmlr{}',
      '\u0271': '\\Elzltlmr{}',
      '\u0273': '\\Elzrtln{}',
      '\u0277': '\\Elzclomeg{}',
      '\u0279': '\\Elztrnr{}',
      '\u027A': '\\Elztrnrl{}',
      '\u027B': '\\Elzrttrnr{}',
      '\u027C': '\\Elzrl{}',
      '\u027D': '\\Elzrtlr{}',
      '\u027E': '\\Elzfhr{}',
      '\u0282': '\\Elzrtls{}',
      '\u0283': '\\Elzesh{}',
      '\u0287': '\\Elztrnt{}',
      '\u0288': '\\Elzrtlt{}',
      '\u028A': '\\Elzpupsil{}',
      '\u028B': '\\Elzpscrv{}',
      '\u028C': '\\Elzinvv{}',
      '\u028D': '\\Elzinvw{}',
      '\u028E': '\\Elztrny{}',
      '\u0290': '\\Elzrtlz{}',
      '\u0292': '\\Elzyogh{}',
      '\u0294': '\\Elzglst{}',
      '\u0295': '\\Elzreglst{}',
      '\u0296': '\\Elzinglst{}',
      '\u02A4': '\\Elzdyogh{}',
      '\u02A7': '\\Elztesh{}',
      '\u02C8': '\\Elzverts{}',
      '\u02CC': '\\Elzverti{}',
      '\u02D0': '\\Elzlmrk{}',
      '\u02D1': '\\Elzhlmrk{}',
      '\u02D2': '\\Elzsbrhr{}',
      '\u02D3': '\\Elzsblhr{}',
      '\u02D4': '\\Elzrais{}',
      '\u02D5': '\\Elzlow{}',
      '\u0305': '\\overline{}',
      '\u0309': '\\ovhook{}',
      '\u0310': '\\candra{}',
      '\u0312': '\\oturnedcomma{}',
      '\u0315': '\\ocommatopright{}',
      '\u031A': '\\droang{}',
      '\u0321': '\\Elzpalh{}',
      '\u032A': '\\Elzsbbrg{}',
      '\u0330': '\\utilde{}',
      '\u0331': '\\underbar{}',
      '\u0332': '\\underline{}',
      '\u038E': '\\mathrm{\'Y}',
      '\u038F': '\\mathrm{\'\\Omega}',
      '\u0390': '\\acute{\\ddot{\\iota}}',
      '\u0391': 'A',
      '\u0392': 'B',
      '\u0393': '\\Gamma{}',
      '\u0394': '\\Delta{}',
      '\u0395': 'E',
      '\u0396': 'Z',
      '\u0397': 'H',
      '\u0398': '\\Theta{}',
      '\u0399': 'I',
      '\u039A': 'K',
      '\u039B': '\\Lambda{}',
      '\u039C': 'M',
      '\u039D': 'N',
      '\u039E': '\\Xi{}',
      '\u039F': 'O',
      '\u03A0': '\\Pi{}',
      '\u03A1': 'P',
      '\u03A3': '\\Sigma{}',
      '\u03A4': 'T',
      '\u03A5': '\\Upsilon{}',
      '\u03A6': '\\Phi{}',
      '\u03A7': 'X',
      '\u03A8': '\\Psi{}',
      '\u03A9': '\\Omega{}',
      '\u03AA': '\\mathrm{\\ddot{I}}',
      '\u03AB': '\\mathrm{\\ddot{Y}}',
      '\u03AD': '\\acute{\\epsilon}',
      '\u03AE': '\\acute{\\eta}',
      '\u03AF': '\\acute{\\iota}',
      '\u03B0': '\\acute{\\ddot{\\upsilon}}',
      '\u03B1': '\\alpha{}',
      '\u03B2': '\\beta{}',
      '\u03B3': '\\gamma{}',
      '\u03B4': '\\delta{}',
      '\u03B5': '\\epsilon{}',
      '\u03B6': '\\zeta{}',
      '\u03B7': '\\eta{}',
      '\u03B9': '\\iota{}',
      '\u03BA': '\\kappa{}',
      '\u03BB': '\\lambda{}',
      '\u03BC': '\\mu{}',
      '\u03BD': '\\nu{}',
      '\u03BE': '\\xi{}',
      '\u03BF': 'o',
      '\u03C0': '\\pi{}',
      '\u03C1': '\\rho{}',
      '\u03C2': '\\varsigma{}',
      '\u03C3': '\\sigma{}',
      '\u03C4': '\\tau{}',
      '\u03C5': '\\upsilon{}',
      '\u03C6': '\\varphi{}',
      '\u03C7': '\\chi{}',
      '\u03C8': '\\psi{}',
      '\u03C9': '\\omega{}',
      '\u03CA': '\\ddot{\\iota}',
      '\u03CB': '\\ddot{\\upsilon}',
      '\u03CD': '\\acute{\\upsilon}',
      '\u03CE': '\\acute{\\omega}',
      '\u03D2': '\\Upsilon{}',
      '\u03D5': '\\phi{}',
      '\u03D6': '\\varpi{}',
      '\u03D8': '\\Qoppa{}',
      '\u03D9': '\\qoppa{}',
      '\u03DA': '\\Stigma{}',
      '\u03DB': '\\stigma{}',
      '\u03DC': '\\Digamma{}',
      '\u03DD': '\\digamma{}',
      '\u03DE': '\\Koppa{}',
      '\u03DF': '\\koppa{}',
      '\u03E0': '\\Sampi{}',
      '\u03E1': '\\sampi{}',
      '\u03F0': '\\varkappa{}',
      '\u03F1': '\\varrho{}',
      '\u03F5': '\\epsilon{}',
      '\u03F6': '\\backepsilon{}',
      '\u2003': '\\quad{}',
      '\u200A': '\\mkern1mu{}',
      '\u2016': '\\Vert{}',
      '\u2017': '\\twolowline{}',
      '\u201B': '\\Elzreapos{}',
      '\u2032': '{\'}',
      '\u2033': '{\'\'}',
      '\u2034': '{\'\'\'}',
      '\u2035': '\\backprime{}',
      '\u2036': '\\backdprime{}',
      '\u2037': '\\backtrprime{}',
      '\u2038': '\\caretinsert{}',
      '\u203C': '\\Exclam{}',
      '\u2040': '\\cat{}',
      '\u2043': '\\hyphenbullet{}',
      '\u2044': '\\fracslash{}',
      '\u2047': '\\Question{}',
      '\u2050': '\\closure{}',
      '\u2057': '\'\'\'\'',
      '\u20D0': '\\lvec{}',
      '\u20D1': '\\vec{}',
      '\u20D2': '\\vertoverlay{}',
      '\u20D6': '\\LVec{}',
      '\u20D7': '\\vec{}',
      '\u20DB': '\\dddot{}',
      '\u20DC': '\\ddddot{}',
      '\u20DD': '\\enclosecircle{}',
      '\u20DE': '\\enclosesquare{}',
      '\u20DF': '\\enclosediamond{}',
      '\u20E1': '\\overleftrightarrow{}',
      '\u20E4': '\\enclosetriangle{}',
      '\u20E7': '\\annuity{}',
      '\u20E8': '\\threeunderdot{}',
      '\u20E9': '\\widebridgeabove{}',
      '\u20EC': '\\underrightharpoondown{}',
      '\u20ED': '\\underleftharpoondown{}',
      '\u20EE': '\\underleftarrow{}',
      '\u20EF': '\\underrightarrow{}',
      '\u20F0': '\\asteraccent{}',
      '\u2102': '\\mathbb{C}',
      '\u2107': '\\Euler{}',
      '\u210B': '\\mathscr{H}',
      '\u210C': '\\mathfrak{H}',
      '\u210D': '\\mathbb{H}',
      '\u210E': '\\Planckconst{}',
      '\u210F': '\\hslash{}',
      '\u2110': '\\mathscr{I}',
      '\u2111': '\\mathfrak{I}',
      '\u2112': '\\mathscr{L}',
      '\u2113': '\\mathscr{l}',
      '\u2115': '\\mathbb{N}',
      '\u2118': '\\wp{}',
      '\u2119': '\\mathbb{P}',
      '\u211A': '\\mathbb{Q}',
      '\u211B': '\\mathscr{R}',
      '\u211C': '\\mathfrak{R}',
      '\u211D': '\\mathbb{R}',
      '\u211E': '\\Elzxrat{}',
      '\u2124': '\\mathbb{Z}',
      '\u2127': '\\mho{}',
      '\u2128': '\\mathfrak{Z}',
      '\u2129': '\\ElsevierGlyph{2129}',
      '\u212C': '\\mathscr{B}',
      '\u212D': '\\mathfrak{C}',
      '\u212F': '\\mathscr{e}',
      '\u2130': '\\mathscr{E}',
      '\u2131': '\\mathscr{F}',
      '\u2132': '\\Finv{}',
      '\u2133': '\\mathscr{M}',
      '\u2134': '\\mathscr{o}',
      '\u2135': '\\aleph{}',
      '\u2136': '\\beth{}',
      '\u2137': '\\gimel{}',
      '\u2138': '\\daleth{}',
      '\u213C': '\\mathbb{\\pi}',
      '\u213D': '\\mathbb{\\gamma}',
      '\u213E': '\\mathbb{\\Gamma}',
      '\u213F': '\\mathbb{\\Pi}',
      '\u2140': '\\mathbb{\\Sigma}',
      '\u2141': '\\Game{}',
      '\u2142': '\\sansLturned{}',
      '\u2143': '\\sansLmirrored{}',
      '\u2144': '\\Yup{}',
      '\u2145': '\\CapitalDifferentialD{}',
      '\u2146': '\\DifferentialD{}',
      '\u2147': '\\ExponetialE{}',
      '\u2148': '\\ComplexI{}',
      '\u2149': '\\ComplexJ{}',
      '\u214A': '\\PropertyLine{}',
      '\u214B': '\\invamp{}',
      '\u2153': '\\textfrac{1}{3}',
      '\u2154': '\\textfrac{2}{3}',
      '\u2155': '\\textfrac{1}{5}',
      '\u2156': '\\textfrac{2}{5}',
      '\u2157': '\\textfrac{3}{5}',
      '\u2158': '\\textfrac{4}{5}',
      '\u2159': '\\textfrac{1}{6}',
      '\u215A': '\\textfrac{5}{6}',
      '\u215B': '\\textfrac{1}{8}',
      '\u215C': '\\textfrac{3}{8}',
      '\u215D': '\\textfrac{5}{8}',
      '\u215E': '\\textfrac{7}{8}',
      '\u2190': '\\leftarrow{}',
      '\u2191': '\\uparrow{}',
      '\u2192': '\\rightarrow{}',
      '\u2193': '\\downarrow{}',
      '\u2194': '\\leftrightarrow{}',
      '\u2195': '\\updownarrow{}',
      '\u2196': '\\nwarrow{}',
      '\u2197': '\\nearrow{}',
      '\u2198': '\\searrow{}',
      '\u2199': '\\swarrow{}',
      '\u219A': '\\nleftarrow{}',
      '\u219B': '\\nrightarrow{}',
      '\u219C': '\\arrowwaveleft{}',
      '\u219D': '\\arrowwaveright{}',
      '\u219E': '\\twoheadleftarrow{}',
      '\u219F': '\\twoheaduparrow{}',
      '\u21A0': '\\twoheadrightarrow{}',
      '\u21A1': '\\twoheaddownarrow{}',
      '\u21A2': '\\leftarrowtail{}',
      '\u21A3': '\\rightarrowtail{}',
      '\u21A4': '\\mapsfrom{}',
      '\u21A5': '\\MapsUp{}',
      '\u21A6': '\\mapsto{}',
      '\u21A7': '\\MapsDown{}',
      '\u21A8': '\\updownarrowbar{}',
      '\u21A9': '\\hookleftarrow{}',
      '\u21AA': '\\hookrightarrow{}',
      '\u21AB': '\\looparrowleft{}',
      '\u21AC': '\\looparrowright{}',
      '\u21AD': '\\leftrightsquigarrow{}',
      '\u21AE': '\\nleftrightarrow{}',
      '\u21AF': '\\lightning{}',
      '\u21B0': '\\Lsh{}',
      '\u21B1': '\\Rsh{}',
      '\u21B2': '\\dlsh{}',
      '\u21B3': '\\ElsevierGlyph{21B3}',
      '\u21B4': '\\linefeed{}',
      '\u21B5': '\\carriagereturn{}',
      '\u21B6': '\\curvearrowleft{}',
      '\u21B7': '\\curvearrowright{}',
      '\u21B8': '\\barovernorthwestarrow{}',
      '\u21B9': '\\barleftarrowrightarrowba{}',
      '\u21BA': '\\circlearrowleft{}',
      '\u21BB': '\\circlearrowright{}',
      '\u21BC': '\\leftharpoonup{}',
      '\u21BD': '\\leftharpoondown{}',
      '\u21BE': '\\upharpoonright{}',
      '\u21BF': '\\upharpoonleft{}',
      '\u21C0': '\\rightharpoonup{}',
      '\u21C1': '\\rightharpoondown{}',
      '\u21C2': '\\downharpoonright{}',
      '\u21C3': '\\downharpoonleft{}',
      '\u21C4': '\\rightleftarrows{}',
      '\u21C5': '\\dblarrowupdown{}',
      '\u21C6': '\\leftrightarrows{}',
      '\u21C7': '\\leftleftarrows{}',
      '\u21C8': '\\upuparrows{}',
      '\u21C9': '\\rightrightarrows{}',
      '\u21CA': '\\downdownarrows{}',
      '\u21CB': '\\leftrightharpoons{}',
      '\u21CC': '\\rightleftharpoons{}',
      '\u21CD': '\\nLeftarrow{}',
      '\u21CE': '\\nLeftrightarrow{}',
      '\u21CF': '\\nRightarrow{}',
      '\u21D0': '\\Leftarrow{}',
      '\u21D1': '\\Uparrow{}',
      '\u21D2': '\\Rightarrow{}',
      '\u21D3': '\\Downarrow{}',
      '\u21D4': '\\Leftrightarrow{}',
      '\u21D5': '\\Updownarrow{}',
      '\u21D6': '\\Nwarrow{}',
      '\u21D7': '\\Nearrow{}',
      '\u21D8': '\\Searrow{}',
      '\u21D9': '\\Swarrow{}',
      '\u21DA': '\\Lleftarrow{}',
      '\u21DB': '\\Rrightarrow{}',
      '\u21DC': '\\leftsquigarrow{}',
      '\u21DD': '\\rightsquigarrow{}',
      '\u21DE': '\\nHuparrow{}',
      '\u21DF': '\\nHdownarrow{}',
      '\u21E0': '\\dashleftarrow{}',
      '\u21E1': '\\updasharrow{}',
      '\u21E2': '\\dashrightarrow{}',
      '\u21E3': '\\downdasharrow{}',
      '\u21E4': '\\LeftArrowBar{}',
      '\u21E5': '\\RightArrowBar{}',
      '\u21E6': '\\leftwhitearrow{}',
      '\u21E7': '\\upwhitearrow{}',
      '\u21E8': '\\rightwhitearrow{}',
      '\u21E9': '\\downwhitearrow{}',
      '\u21EA': '\\whitearrowupfrombar{}',
      '\u21F4': '\\circleonrightarrow{}',
      '\u21F5': '\\DownArrowUpArrow{}',
      '\u21F6': '\\rightthreearrows{}',
      '\u21F7': '\\nvleftarrow{}',
      '\u21F8': '\\pfun{}',
      '\u21F9': '\\nvleftrightarrow{}',
      '\u21FA': '\\nVleftarrow{}',
      '\u21FB': '\\ffun{}',
      '\u21FC': '\\nVleftrightarrow{}',
      '\u21FD': '\\leftarrowtriangle{}',
      '\u21FE': '\\rightarrowtriangle{}',
      '\u21FF': '\\leftrightarrowtriangle{}',
      '\u2200': '\\forall{}',
      '\u2201': '\\complement{}',
      '\u2202': '\\partial{}',
      '\u2203': '\\exists{}',
      '\u2204': '\\nexists{}',
      '\u2205': '\\varnothing{}',
      '\u2206': '\\increment{}',
      '\u2207': '\\nabla{}',
      '\u2208': '\\in{}',
      '\u2209': '\\not\\in{}',
      '\u220A': '\\smallin{}',
      '\u220B': '\\ni{}',
      '\u220C': '\\not\\ni{}',
      '\u220D': '\\smallni{}',
      '\u220E': '\\QED{}',
      '\u220F': '\\prod{}',
      '\u2210': '\\coprod{}',
      '\u2211': '\\sum{}',
      '\u2213': '\\mp{}',
      '\u2214': '\\dotplus{}',
      '\u2215': '\\slash{}',
      '\u2216': '\\setminus{}',
      '\u2217': '{_\\ast}',
      '\u2218': '\\circ{}',
      '\u2219': '\\bullet{}',
      '\u221A': '\\surd{}',
      '\u221B': '\\sqrt[3]',
      '\u221C': '\\sqrt[4]',
      '\u221D': '\\propto{}',
      '\u221E': '\\infty{}',
      '\u221F': '\\rightangle{}',
      '\u2220': '\\angle{}',
      '\u2221': '\\measuredangle{}',
      '\u2222': '\\sphericalangle{}',
      '\u2223': '\\mid{}',
      '\u2224': '\\nmid{}',
      '\u2225': '\\parallel{}',
      '\u2226': '\\nparallel{}',
      '\u2227': '\\wedge{}',
      '\u2228': '\\vee{}',
      '\u2229': '\\cap{}',
      '\u222A': '\\cup{}',
      '\u222B': '\\int{}',
      '\u222C': '{\\int\\!\\int}',
      '\u222D': '{\\int\\!\\int\\!\\int}',
      '\u222E': '\\oint{}',
      '\u222F': '\\surfintegral{}',
      '\u2230': '\\volintegral{}',
      '\u2231': '\\clwintegral{}',
      '\u2232': '\\ElsevierGlyph{2232}',
      '\u2233': '\\ElsevierGlyph{2233}',
      '\u2234': '\\therefore{}',
      '\u2235': '\\because{}',
      '\u2236': ':',
      '\u2237': '\\Colon{}',
      '\u2238': '\\ElsevierGlyph{2238}',
      '\u2239': '\\eqcolon{}',
      '\u223A': '\\mathbin{{:}\\!\\!{-}\\!\\!{:}}',
      '\u223B': '\\homothetic{}',
      '\u223C': '\\sim{}',
      '\u223D': '\\backsim{}',
      '\u223E': '\\lazysinv{}',
      '\u223F': '\\AC{}',
      '\u2240': '\\wr{}',
      '\u2241': '\\not\\sim{}',
      '\u2242': '\\ElsevierGlyph{2242}',
      '\u2243': '\\simeq{}',
      '\u2244': '\\not\\simeq{}',
      '\u2245': '\\cong{}',
      '\u2246': '\\approxnotequal{}',
      '\u2247': '\\not\\cong{}',
      '\u2248': '\\approx{}',
      '\u2249': '\\not\\approx{}',
      '\u224A': '\\approxeq{}',
      '\u224B': '\\tildetrpl{}',
      '\u224C': '\\allequal{}',
      '\u224D': '\\asymp{}',
      '\u224E': '\\Bumpeq{}',
      '\u224F': '\\bumpeq{}',
      '\u2250': '\\doteq{}',
      '\u2251': '\\doteqdot{}',
      '\u2252': '\\fallingdotseq{}',
      '\u2253': '\\risingdotseq{}',
      '\u2255': '=:',
      '\u2256': '\\eqcirc{}',
      '\u2257': '\\circeq{}',
      '\u2258': '\\arceq{}',
      '\u2259': '\\estimates{}',
      '\u225A': '\\ElsevierGlyph{225A}',
      '\u225B': '\\starequal{}',
      '\u225C': '\\triangleq{}',
      '\u225D': '\\eqdef{}',
      '\u225E': '\\measeq{}',
      '\u225F': '\\ElsevierGlyph{225F}',
      '\u2260': '\\not =',
      '\u2261': '\\equiv{}',
      '\u2262': '\\not\\equiv{}',
      '\u2263': '\\Equiv{}',
      '\u2264': '\\leq{}',
      '\u2265': '\\geq{}',
      '\u2266': '\\leqq{}',
      '\u2267': '\\geqq{}',
      '\u2268': '\\lneqq{}',
      '\u2269': '\\gneqq{}',
      '\u226A': '\\ll{}',
      '\u226B': '\\gg{}',
      '\u226C': '\\between{}',
      '\u226D': '{\\not\\kern-0.3em\\times}',
      '\u226E': '\\not<',
      '\u226F': '\\not>',
      '\u2270': '\\not\\leq{}',
      '\u2271': '\\not\\geq{}',
      '\u2272': '\\lessequivlnt{}',
      '\u2273': '\\greaterequivlnt{}',
      '\u2274': '\\ElsevierGlyph{2274}',
      '\u2275': '\\ElsevierGlyph{2275}',
      '\u2276': '\\lessgtr{}',
      '\u2277': '\\gtrless{}',
      '\u2278': '\\notlessgreater{}',
      '\u2279': '\\notgreaterless{}',
      '\u227A': '\\prec{}',
      '\u227B': '\\succ{}',
      '\u227C': '\\preccurlyeq{}',
      '\u227D': '\\succcurlyeq{}',
      '\u227E': '\\precapprox{}',
      '\u227F': '\\succapprox{}',
      '\u2280': '\\not\\prec{}',
      '\u2281': '\\not\\succ{}',
      '\u2282': '\\subset{}',
      '\u2283': '\\supset{}',
      '\u2284': '\\not\\subset{}',
      '\u2285': '\\not\\supset{}',
      '\u2286': '\\subseteq{}',
      '\u2287': '\\supseteq{}',
      '\u2288': '\\not\\subseteq{}',
      '\u2289': '\\not\\supseteq{}',
      '\u228A': '\\subsetneq{}',
      '\u228B': '\\supsetneq{}',
      '\u228C': '\\cupleftarrow{}',
      '\u228D': '\\cupdot{}',
      '\u228E': '\\uplus{}',
      '\u228F': '\\sqsubset{}',
      '\u2290': '\\sqsupset{}',
      '\u2291': '\\sqsubseteq{}',
      '\u2292': '\\sqsupseteq{}',
      '\u2293': '\\sqcap{}',
      '\u2294': '\\sqcup{}',
      '\u2295': '\\oplus{}',
      '\u2296': '\\ominus{}',
      '\u2297': '\\otimes{}',
      '\u2298': '\\oslash{}',
      '\u2299': '\\odot{}',
      '\u229A': '\\circledcirc{}',
      '\u229B': '\\circledast{}',
      '\u229C': '\\circledequal{}',
      '\u229D': '\\circleddash{}',
      '\u229E': '\\boxplus{}',
      '\u229F': '\\boxminus{}',
      '\u22A0': '\\boxtimes{}',
      '\u22A1': '\\boxdot{}',
      '\u22A2': '\\vdash{}',
      '\u22A3': '\\dashv{}',
      '\u22A4': '\\top{}',
      '\u22A5': '\\perp{}',
      '\u22A6': '\\assert{}',
      '\u22A7': '\\truestate{}',
      '\u22A8': '\\forcesextra{}',
      '\u22A9': '\\Vdash{}',
      '\u22AA': '\\Vvdash{}',
      '\u22AB': '\\VDash{}',
      '\u22AC': '\\nvdash{}',
      '\u22AD': '\\nvDash{}',
      '\u22AE': '\\nVdash{}',
      '\u22AF': '\\nVDash{}',
      '\u22B0': '\\prurel{}',
      '\u22B1': '\\scurel{}',
      '\u22B2': '\\vartriangleleft{}',
      '\u22B3': '\\vartriangleright{}',
      '\u22B4': '\\trianglelefteq{}',
      '\u22B5': '\\trianglerighteq{}',
      '\u22B6': '\\original{}',
      '\u22B7': '\\image{}',
      '\u22B8': '\\multimap{}',
      '\u22B9': '\\hermitconjmatrix{}',
      '\u22BA': '\\intercal{}',
      '\u22BB': '\\veebar{}',
      '\u22BC': '\\barwedge{}',
      '\u22BD': '\\barvee{}',
      '\u22BE': '\\rightanglearc{}',
      '\u22BF': '\\varlrtriangle{}',
      '\u22C0': '\\ElsevierGlyph{22C0}',
      '\u22C1': '\\ElsevierGlyph{22C1}',
      '\u22C2': '\\bigcap{}',
      '\u22C3': '\\bigcup{}',
      '\u22C4': '\\diamond{}',
      '\u22C5': '\\cdot{}',
      '\u22C6': '\\star{}',
      '\u22C7': '\\divideontimes{}',
      '\u22C8': '\\bowtie{}',
      '\u22C9': '\\ltimes{}',
      '\u22CA': '\\rtimes{}',
      '\u22CB': '\\leftthreetimes{}',
      '\u22CC': '\\rightthreetimes{}',
      '\u22CD': '\\backsimeq{}',
      '\u22CE': '\\curlyvee{}',
      '\u22CF': '\\curlywedge{}',
      '\u22D0': '\\Subset{}',
      '\u22D1': '\\Supset{}',
      '\u22D2': '\\Cap{}',
      '\u22D3': '\\Cup{}',
      '\u22D4': '\\pitchfork{}',
      '\u22D5': '\\hash{}',
      '\u22D6': '\\lessdot{}',
      '\u22D7': '\\gtrdot{}',
      '\u22D8': '\\verymuchless{}',
      '\u22D9': '\\verymuchgreater{}',
      '\u22DA': '\\lesseqgtr{}',
      '\u22DB': '\\gtreqless{}',
      '\u22DC': '\\eqless{}',
      '\u22DD': '\\eqgtr{}',
      '\u22DE': '\\curlyeqprec{}',
      '\u22DF': '\\curlyeqsucc{}',
      '\u22E0': '\\npreceq{}',
      '\u22E1': '\\nsucceq{}',
      '\u22E2': '\\not\\sqsubseteq{}',
      '\u22E3': '\\not\\sqsupseteq{}',
      '\u22E4': '\\sqsubsetneq{}',
      '\u22E5': '\\Elzsqspne{}',
      '\u22E6': '\\lnsim{}',
      '\u22E7': '\\gnsim{}',
      '\u22E8': '\\precedesnotsimilar{}',
      '\u22E9': '\\succnsim{}',
      '\u22EA': '\\ntriangleleft{}',
      '\u22EB': '\\ntriangleright{}',
      '\u22EC': '\\ntrianglelefteq{}',
      '\u22ED': '\\ntrianglerighteq{}',
      '\u22EE': '\\vdots{}',
      '\u22EF': '\\cdots{}',
      '\u22F0': '\\upslopeellipsis{}',
      '\u22F1': '\\downslopeellipsis{}',
      '\u22F2': '\\disin{}',
      '\u22F3': '\\varisins{}',
      '\u22F4': '\\isins{}',
      '\u22F5': '\\isindot{}',
      '\u22F6': '\\barin{}',
      '\u22F7': '\\isinobar{}',
      '\u22F8': '\\isinvb{}',
      '\u22F9': '\\isinE{}',
      '\u22FA': '\\nisd{}',
      '\u22FB': '\\varnis{}',
      '\u22FC': '\\nis{}',
      '\u22FD': '\\varniobar{}',
      '\u22FE': '\\niobar{}',
      '\u22FF': '\\bagmember{}',
      '\u2300': '\\diameter{}',
      '\u2302': '\\house{}',
      '\u2306': '\\perspcorrespond{}',
      '\u2308': '\\lceil{}',
      '\u2309': '\\rceil{}',
      '\u230A': '\\lfloor{}',
      '\u230B': '\\rfloor{}',
      '\u2310': '\\invneg{}',
      '\u2311': '\\wasylozenge{}',
      '\u2312': '\\profline{}',
      '\u2313': '\\profsurf{}',
      '\u2315': '\\recorder{}',
      '\u2316': '{\\mathchar"2208}',
      '\u2317': '\\viewdata{}',
      '\u2319': '\\turnednot{}',
      '\u231C': '\\ulcorner{}',
      '\u231D': '\\urcorner{}',
      '\u231E': '\\llcorner{}',
      '\u231F': '\\lrcorner{}',
      '\u2320': '\\inttop{}',
      '\u2321': '\\intbottom{}',
      '\u2322': '\\frown{}',
      '\u2323': '\\smile{}',
      '\u3008': '\\langle{}',
      '\u3009': '\\rangle{}',
      '\u232C': '\\varhexagonlrbonds{}',
      '\u2332': '\\conictaper{}',
      '\u2336': '\\topbot{}',
      '\u2339': '\\APLinv{}',
      '\u233D': '\\ElsevierGlyph{E838}',
      '\u233F': '\\notslash{}',
      '\u2340': '\\notbackslash{}',
      '\u2347': '\\APLleftarrowbox{}',
      '\u2348': '\\APLrightarrowbox{}',
      '\u2350': '\\APLuparrowbox{}',
      '\u2353': '\\APLboxupcaret{}',
      '\u2357': '\\APLdownarrowbox{}',
      '\u235D': '\\APLcomment{}',
      '\u235E': '\\APLinput{}',
      '\u235F': '\\APLlog{}',
      '\u2370': '\\APLboxquestion{}',
      '\u237C': '\\rangledownzigzagarrow{}',
      '\u2394': '\\hexagon{}',
      '\u239B': '\\lparenuend{}',
      '\u239C': '\\lparenextender{}',
      '\u239D': '\\lparenlend{}',
      '\u239E': '\\rparenuend{}',
      '\u239F': '\\rparenextender{}',
      '\u23A0': '\\rparenlend{}',
      '\u23A1': '\\lbrackuend{}',
      '\u23A2': '\\lbrackextender{}',
      '\u23A3': '\\Elzdlcorn{}',
      '\u23A4': '\\rbrackuend{}',
      '\u23A5': '\\rbrackextender{}',
      '\u23A6': '\\rbracklend{}',
      '\u23A7': '\\lbraceuend{}',
      '\u23A8': '\\lbracemid{}',
      '\u23A9': '\\lbracelend{}',
      '\u23AA': '\\vbraceextender{}',
      '\u23AB': '\\rbraceuend{}',
      '\u23AC': '\\rbracemid{}',
      '\u23AD': '\\rbracelend{}',
      '\u23AE': '\\intextender{}',
      '\u23AF': '\\harrowextender{}',
      '\u23B0': '\\lmoustache{}',
      '\u23B1': '\\rmoustache{}',
      '\u23B2': '\\sumtop{}',
      '\u23B3': '\\sumbottom{}',
      '\u23B4': '\\overbracket{}',
      '\u23B5': '\\underbracket{}',
      '\u23B6': '\\bbrktbrk{}',
      '\u23B7': '\\sqrtbottom{}',
      '\u23B8': '\\lvboxline{}',
      '\u23B9': '\\rvboxline{}',
      '\u23CE': '\\varcarriagereturn{}',
      '\u23DC': '\\overparen{}',
      '\u23DD': '\\underparen{}',
      '\u23DE': '\\overbrace{}',
      '\u23DF': '\\underbrace{}',
      '\u23E0': '\\obrbrak{}',
      '\u23E1': '\\ubrbrak{}',
      '\u23E2': '\\trapezium{}',
      '\u23E3': '\\benzenr{}',
      '\u23E4': '\\strns{}',
      '\u23E5': '\\fltns{}',
      '\u23E6': '\\accurrent{}',
      '\u23E7': '\\elinters{}',
      '\u24C8': '\\circledS{}',
      '\u2506': '\\Elzdshfnc{}',
      '\u2519': '\\Elzsqfnw{}',
      '\u2571': '\\diagup{}',
      '\u2580': '\\blockuphalf{}',
      '\u2584': '\\blocklowhalf{}',
      '\u2588': '\\blockfull{}',
      '\u258C': '\\blocklefthalf{}',
      '\u2590': '\\blockrighthalf{}',
      '\u2591': '\\blockqtrshaded{}',
      '\u2592': '\\blockhalfshaded{}',
      '\u2593': '\\blockthreeqtrshaded{}',
      '\u25A1': '\\square{}',
      '\u25A2': '\\squoval{}',
      '\u25A3': '\\blackinwhitesquare{}',
      '\u25A4': '\\squarehfill{}',
      '\u25A5': '\\squarevfill{}',
      '\u25A6': '\\squarehvfill{}',
      '\u25A7': '\\squarenwsefill{}',
      '\u25A8': '\\squareneswfill{}',
      '\u25A9': '\\squarecrossfill{}',
      '\u25AA': '\\blacksquare{}',
      '\u25AB': '\\smwhtsquare{}',
      '\u25AC': '\\hrectangleblack{}',
      '\u25AD': '\\fbox{~~}',
      '\u25AE': '\\vrectangleblack{}',
      '\u25AF': '\\Elzvrecto{}',
      '\u25B0': '\\parallelogramblack{}',
      '\u25B1': '\\ElsevierGlyph{E381}',
      '\u25B3': '\\bigtriangleup{}',
      '\u25B4': '\\blacktriangle{}',
      '\u25B5': '\\vartriangle{}',
      '\u25B6': '\\RHD{}',
      '\u25B7': '\\rhd{}',
      '\u25B8': '\\blacktriangleright{}',
      '\u25B9': '\\triangleright{}',
      '\u25BA': '\\blackpointerright{}',
      '\u25BB': '\\whitepointerright{}',
      '\u25BD': '\\bigtriangledown{}',
      '\u25BE': '\\blacktriangledown{}',
      '\u25BF': '\\triangledown{}',
      '\u25C0': '\\LHD{}',
      '\u25C1': '\\lhd{}',
      '\u25C2': '\\blacktriangleleft{}',
      '\u25C3': '\\triangleleft{}',
      '\u25C4': '\\blackpointerleft{}',
      '\u25C5': '\\whitepointerleft{}',
      '\u25C7': '\\Diamond{}',
      '\u25C8': '\\blackinwhitediamond{}',
      '\u25C9': '\\fisheye{}',
      '\u25CA': '\\lozenge{}',
      '\u25CB': '\\bigcirc{}',
      '\u25CC': '\\dottedcircle{}',
      '\u25CD': '\\circlevertfill{}',
      '\u25CE': '\\bullseye{}',
      '\u25D0': '\\Elzcirfl{}',
      '\u25D1': '\\Elzcirfr{}',
      '\u25D2': '\\Elzcirfb{}',
      '\u25D3': '\\circletophalfblack{}',
      '\u25D4': '\\circleurquadblack{}',
      '\u25D5': '\\blackcircleulquadwhite{}',
      '\u25D6': '\\LEFTCIRCLE{}',
      '\u25D8': '\\Elzrvbull{}',
      '\u25D9': '\\inversewhitecircle{}',
      '\u25DA': '\\invwhiteupperhalfcircle{}',
      '\u25DB': '\\invwhitelowerhalfcircle{}',
      '\u25DC': '\\ularc{}',
      '\u25DD': '\\urarc{}',
      '\u25DE': '\\lrarc{}',
      '\u25DF': '\\llarc{}',
      '\u25E0': '\\topsemicircle{}',
      '\u25E1': '\\botsemicircle{}',
      '\u25E2': '\\lrblacktriangle{}',
      '\u25E3': '\\llblacktriangle{}',
      '\u25E4': '\\ulblacktriangle{}',
      '\u25E5': '\\urblacktriangle{}',
      '\u25E6': '\\smwhtcircle{}',
      '\u25E7': '\\Elzsqfl{}',
      '\u25E8': '\\Elzsqfr{}',
      '\u25E9': '\\squareulblack{}',
      '\u25EA': '\\Elzsqfse{}',
      '\u25EB': '\\boxbar{}',
      '\u25EC': '\\trianglecdot{}',
      '\u25ED': '\\triangleleftblack{}',
      '\u25EE': '\\trianglerightblack{}',
      '\u25EF': '\\bigcirc{}',
      '\u25F0': '\\squareulquad{}',
      '\u25F1': '\\squarellquad{}',
      '\u25F2': '\\squarelrquad{}',
      '\u25F3': '\\squareurquad{}',
      '\u25F4': '\\circleulquad{}',
      '\u25F5': '\\circlellquad{}',
      '\u25F6': '\\circlelrquad{}',
      '\u25F7': '\\circleurquad{}',
      '\u25F8': '\\ultriangle{}',
      '\u25F9': '\\urtriangle{}',
      '\u25FA': '\\lltriangle{}',
      '\u25FB': '\\square{}',
      '\u25FC': '\\blacksquare{}',
      '\u25FD': '\\mdsmwhtsquare{}',
      '\u25FE': '\\mdsmblksquare{}',
      '\u25FF': '\\lrtriangle{}',
      '\u2609': '\\Sun{}',
      '\u2610': '\\Square{}',
      '\u2611': '\\CheckedBox{}',
      '\u2612': '\\XBox{}',
      '\u2615': '\\steaming{}',
      '\u2620': '\\skull{}',
      '\u2621': '\\danger{}',
      '\u2622': '\\radiation{}',
      '\u2623': '\\biohazard{}',
      '\u262F': '\\yinyang{}',
      '\u2639': '\\frownie{}',
      '\u263A': '\\smiley{}',
      '\u263B': '\\blacksmiley{}',
      '\u263C': '\\sun{}',
      '\u263D': '\\rightmoon{}',
      '\u2641': '\\earth{}',
      '\u2661': '\\heartsuit{}',
      '\u2662': '\\diamond{}',
      '\u2664': '\\varspadesuit{}',
      '\u2667': '\\varclubsuit{}',
      '\u266B': '\\twonotes{}',
      '\u266C': '\\sixteenthnote{}',
      '\u266D': '\\flat{}',
      '\u266E': '\\natural{}',
      '\u266F': '\\sharp{}',
      '\u267B': '\\recycle{}',
      '\u267E': '\\acidfree{}',
      '\u2680': '\\dicei{}',
      '\u2681': '\\diceii{}',
      '\u2682': '\\diceiii{}',
      '\u2683': '\\diceiv{}',
      '\u2684': '\\dicev{}',
      '\u2685': '\\dicevi{}',
      '\u2686': '\\circledrightdot{}',
      '\u2687': '\\circledtwodots{}',
      '\u2688': '\\blackcircledrightdot{}',
      '\u2689': '\\blackcircledtwodots{}',
      '\u2693': '\\anchor{}',
      '\u2694': '\\swords{}',
      '\u26A0': '\\warning{}',
      '\u26A5': '\\Hermaphrodite{}',
      '\u26AA': '\\medcirc{}',
      '\u26AB': '\\medbullet{}',
      '\u26AC': '\\mdsmwhtcircle{}',
      '\u26B2': '\\neuter{}',
      '\u2772': '\\lbrbrak{}',
      '\u2773': '\\rbrbrak{}',
      '\u27C0': '\\threedangle{}',
      '\u27C1': '\\whiteinwhitetriangle{}',
      '\u27C2': '\\perp{}',
      '\u27C3': '\\subsetcirc{}',
      '\u27C4': '\\supsetcirc{}',
      '\u27C5': '\\Lbag{}',
      '\u27C6': '\\Rbag{}',
      '\u27C7': '\\veedot{}',
      '\u27C8': '\\bsolhsub{}',
      '\u27C9': '\\suphsol{}',
      '\u27CC': '\\longdivision{}',
      '\u27D0': '\\Diamonddot{}',
      '\u27D1': '\\wedgedot{}',
      '\u27D2': '\\upin{}',
      '\u27D3': '\\pullback{}',
      '\u27D4': '\\pushout{}',
      '\u27D5': '\\leftouterjoin{}',
      '\u27D6': '\\rightouterjoin{}',
      '\u27D7': '\\fullouterjoin{}',
      '\u27D8': '\\bigbot{}',
      '\u27D9': '\\bigtop{}',
      '\u27DA': '\\DashVDash{}',
      '\u27DB': '\\dashVdash{}',
      '\u27DC': '\\multimapinv{}',
      '\u27DD': '\\vlongdash{}',
      '\u27DE': '\\longdashv{}',
      '\u27DF': '\\cirbot{}',
      '\u27E0': '\\lozengeminus{}',
      '\u27E1': '\\concavediamond{}',
      '\u27E2': '\\concavediamondtickleft{}',
      '\u27E3': '\\concavediamondtickright{}',
      '\u27E4': '\\whitesquaretickleft{}',
      '\u27E5': '\\whitesquaretickright{}',
      '\u27E6': '\\llbracket{}',
      '\u27E7': '\\rrbracket{}',
      '\u27EA': '\\lang{}',
      '\u27EB': '\\rang{}',
      '\u27EC': '\\Lbrbrak{}',
      '\u27ED': '\\Rbrbrak{}',
      '\u27EE': '\\lgroup{}',
      '\u27EF': '\\rgroup{}',
      '\u27F0': '\\UUparrow{}',
      '\u27F1': '\\DDownarrow{}',
      '\u27F2': '\\acwgapcirclearrow{}',
      '\u27F3': '\\cwgapcirclearrow{}',
      '\u27F4': '\\rightarrowonoplus{}',
      '\u27F5': '\\longleftarrow{}',
      '\u27F6': '\\longrightarrow{}',
      '\u27F7': '\\longleftrightarrow{}',
      '\u27F8': '\\Longleftarrow{}',
      '\u27F9': '\\Longrightarrow{}',
      '\u27FA': '\\Longleftrightarrow{}',
      '\u27FB': '\\longmapsfrom{}',
      '\u27FC': '\\longmapsto{}',
      '\u27FD': '\\Longmapsfrom{}',
      '\u27FE': '\\Longmapsto{}',
      '\u27FF': '\\sim\\joinrel\\leadsto{}',
      '\u2900': '\\psur{}',
      '\u2901': '\\nVtwoheadrightarrow{}',
      '\u2902': '\\nvLeftarrow{}',
      '\u2903': '\\nvRightarrow{}',
      '\u2904': '\\nvLeftrightarrow{}',
      '\u2905': '\\ElsevierGlyph{E212}',
      '\u2906': '\\Mapsfrom{}',
      '\u2907': '\\Mapsto{}',
      '\u2908': '\\downarrowbarred{}',
      '\u2909': '\\uparrowbarred{}',
      '\u290A': '\\Uuparrow{}',
      '\u290B': '\\Ddownarrow{}',
      '\u290C': '\\leftbkarrow{}',
      '\u290D': '\\rightbkarrow{}',
      '\u290E': '\\leftdbkarrow{}',
      '\u290F': '\\dbkarow{}',
      '\u2910': '\\drbkarow{}',
      '\u2911': '\\rightdotarrow{}',
      '\u2912': '\\UpArrowBar{}',
      '\u2913': '\\DownArrowBar{}',
      '\u2914': '\\pinj{}',
      '\u2915': '\\finj{}',
      '\u2916': '\\bij{}',
      '\u2917': '\\nvtwoheadrightarrowtail{}',
      '\u2918': '\\nVtwoheadrightarrowtail{}',
      '\u2919': '\\lefttail{}',
      '\u291A': '\\righttail{}',
      '\u291B': '\\leftdbltail{}',
      '\u291C': '\\rightdbltail{}',
      '\u291D': '\\diamondleftarrow{}',
      '\u291E': '\\rightarrowdiamond{}',
      '\u291F': '\\diamondleftarrowbar{}',
      '\u2920': '\\barrightarrowdiamond{}',
      '\u2921': '\\nwsearrow{}',
      '\u2922': '\\neswarrow{}',
      '\u2923': '\\ElsevierGlyph{E20C}',
      '\u2924': '\\ElsevierGlyph{E20D}',
      '\u2925': '\\ElsevierGlyph{E20B}',
      '\u2926': '\\ElsevierGlyph{E20A}',
      '\u2927': '\\ElsevierGlyph{E211}',
      '\u2928': '\\ElsevierGlyph{E20E}',
      '\u2929': '\\ElsevierGlyph{E20F}',
      '\u292A': '\\ElsevierGlyph{E210}',
      '\u292B': '\\rdiagovfdiag{}',
      '\u292C': '\\fdiagovrdiag{}',
      '\u292D': '\\seovnearrow{}',
      '\u292E': '\\neovsearrow{}',
      '\u292F': '\\fdiagovnearrow{}',
      '\u2930': '\\rdiagovsearrow{}',
      '\u2931': '\\neovnwarrow{}',
      '\u2932': '\\nwovnearrow{}',
      '\u2933': '\\ElsevierGlyph{E21C}',
      '\u2934': '\\uprightcurvearrow{}',
      '\u2935': '\\downrightcurvedarrow{}',
      '\u2936': '\\ElsevierGlyph{E21A}',
      '\u2937': '\\ElsevierGlyph{E219}',
      '\u2938': '\\cwrightarcarrow{}',
      '\u2939': '\\acwleftarcarrow{}',
      '\u293A': '\\acwoverarcarrow{}',
      '\u293B': '\\acwunderarcarrow{}',
      '\u293C': '\\curvearrowrightminus{}',
      '\u293D': '\\curvearrowleftplus{}',
      '\u293E': '\\cwundercurvearrow{}',
      '\u293F': '\\ccwundercurvearrow{}',
      '\u2940': '\\Elolarr{}',
      '\u2941': '\\Elorarr{}',
      '\u2942': '\\ElzRlarr{}',
      '\u2943': '\\leftarrowshortrightarrow{}',
      '\u2944': '\\ElzrLarr{}',
      '\u2945': '\\rightarrowplus{}',
      '\u2946': '\\leftarrowplus{}',
      '\u2947': '\\Elzrarrx{}',
      '\u2948': '\\leftrightarrowcircle{}',
      '\u2949': '\\twoheaduparrowcircle{}',
      '\u294A': '\\leftrightharpoon{}',
      '\u294B': '\\rightleftharpoon{}',
      '\u294C': '\\updownharpoonrightleft{}',
      '\u294D': '\\updownharpoonleftright{}',
      '\u294E': '\\LeftRightVector{}',
      '\u294F': '\\RightUpDownVector{}',
      '\u2950': '\\DownLeftRightVector{}',
      '\u2951': '\\LeftUpDownVector{}',
      '\u2952': '\\LeftVectorBar{}',
      '\u2953': '\\RightVectorBar{}',
      '\u2954': '\\RightUpVectorBar{}',
      '\u2955': '\\RightDownVectorBar{}',
      '\u2956': '\\DownLeftVectorBar{}',
      '\u2957': '\\DownRightVectorBar{}',
      '\u2958': '\\LeftUpVectorBar{}',
      '\u2959': '\\LeftDownVectorBar{}',
      '\u295A': '\\LeftTeeVector{}',
      '\u295B': '\\RightTeeVector{}',
      '\u295C': '\\RightUpTeeVector{}',
      '\u295D': '\\RightDownTeeVector{}',
      '\u295E': '\\DownLeftTeeVector{}',
      '\u295F': '\\DownRightTeeVector{}',
      '\u2960': '\\LeftUpTeeVector{}',
      '\u2961': '\\LeftDownTeeVector{}',
      '\u2962': '\\leftleftharpoons{}',
      '\u2963': '\\upupharpoons{}',
      '\u2964': '\\rightrightharpoons{}',
      '\u2965': '\\downdownharpoons{}',
      '\u2966': '\\leftrightharpoonsup{}',
      '\u2967': '\\leftrightharpoonsdown{}',
      '\u2968': '\\rightleftharpoonsup{}',
      '\u2969': '\\rightleftharpoonsdown{}',
      '\u296A': '\\leftbarharpoon{}',
      '\u296B': '\\barleftharpoon{}',
      '\u296C': '\\rightbarharpoon{}',
      '\u296D': '\\barrightharpoon{}',
      '\u296E': '\\UpEquilibrium{}',
      '\u296F': '\\ReverseUpEquilibrium{}',
      '\u2970': '\\RoundImplies{}',
      '\u2971': '\\equalrightarrow{}',
      '\u2972': '\\similarrightarrow{}',
      '\u2973': '\\leftarrowsimilar{}',
      '\u2974': '\\rightarrowsimilar{}',
      '\u2975': '\\rightarrowapprox{}',
      '\u2976': '\\ltlarr{}',
      '\u2977': '\\leftarrowless{}',
      '\u2978': '\\gtrarr{}',
      '\u2979': '\\subrarr{}',
      '\u297A': '\\leftarrowsubset{}',
      '\u297B': '\\suplarr{}',
      '\u297C': '\\ElsevierGlyph{E214}',
      '\u297D': '\\ElsevierGlyph{E215}',
      '\u297E': '\\upfishtail{}',
      '\u297F': '\\downfishtail{}',
      '\u2980': '\\Elztfnc{}',
      '\u2981': '\\spot{}',
      '\u2982': '\\typecolon{}',
      '\u2983': '\\lBrace{}',
      '\u2984': '\\rBrace{}',
      '\u2985': '\\ElsevierGlyph{3018}',
      '\u2986': '\\Elroang{}',
      '\u2987': '\\limg{}',
      '\u2988': '\\rimg{}',
      '\u2989': '\\lblot{}',
      '\u298A': '\\rblot{}',
      '\u298B': '\\lbrackubar{}',
      '\u298C': '\\rbrackubar{}',
      '\u298D': '\\lbrackultick{}',
      '\u298E': '\\rbracklrtick{}',
      '\u298F': '\\lbracklltick{}',
      '\u2990': '\\rbrackurtick{}',
      '\u2991': '\\langledot{}',
      '\u2992': '\\rangledot{}',
      '\u2993': '<\\kern-0.58em(',
      '\u2994': '\\ElsevierGlyph{E291}',
      '\u2995': '\\Lparengtr{}',
      '\u2996': '\\Rparenless{}',
      '\u2997': '\\lblkbrbrak{}',
      '\u2998': '\\rblkbrbrak{}',
      '\u2999': '\\Elzddfnc{}',
      '\u299A': '\\vzigzag{}',
      '\u299B': '\\measuredangleleft{}',
      '\u299C': '\\Angle{}',
      '\u299D': '\\rightanglemdot{}',
      '\u299E': '\\angles{}',
      '\u299F': '\\angdnr{}',
      '\u29A0': '\\Elzlpargt{}',
      '\u29A1': '\\sphericalangleup{}',
      '\u29A2': '\\turnangle{}',
      '\u29A3': '\\revangle{}',
      '\u29A4': '\\angleubar{}',
      '\u29A5': '\\revangleubar{}',
      '\u29A6': '\\wideangledown{}',
      '\u29A7': '\\wideangleup{}',
      '\u29A8': '\\measanglerutone{}',
      '\u29A9': '\\measanglelutonw{}',
      '\u29AA': '\\measanglerdtose{}',
      '\u29AB': '\\measangleldtosw{}',
      '\u29AC': '\\measangleurtone{}',
      '\u29AD': '\\measangleultonw{}',
      '\u29AE': '\\measangledrtose{}',
      '\u29AF': '\\measangledltosw{}',
      '\u29B0': '\\revemptyset{}',
      '\u29B1': '\\emptysetobar{}',
      '\u29B2': '\\emptysetocirc{}',
      '\u29B3': '\\emptysetoarr{}',
      '\u29B4': '\\emptysetoarrl{}',
      '\u29B5': '\\ElsevierGlyph{E260}',
      '\u29B6': '\\ElsevierGlyph{E61B}',
      '\u29B7': '\\circledparallel{}',
      '\u29B8': '\\circledbslash{}',
      '\u29B9': '\\operp{}',
      '\u29BA': '\\obot{}',
      '\u29BB': '\\olcross{}',
      '\u29BC': '\\odotslashdot{}',
      '\u29BD': '\\uparrowoncircle{}',
      '\u29BE': '\\circledwhitebullet{}',
      '\u29BF': '\\circledbullet{}',
      '\u29C0': '\\circledless{}',
      '\u29C1': '\\circledgtr{}',
      '\u29C2': '\\cirscir{}',
      '\u29C3': '\\cirE{}',
      '\u29C4': '\\boxslash{}',
      '\u29C5': '\\boxbslash{}',
      '\u29C6': '\\boxast{}',
      '\u29C7': '\\boxcircle{}',
      '\u29C8': '\\boxbox{}',
      '\u29C9': '\\boxonbox{}',
      '\u29CA': '\\ElzLap{}',
      '\u29CB': '\\Elzdefas{}',
      '\u29CC': '\\triangles{}',
      '\u29CD': '\\triangleserifs{}',
      '\u29CE': '\\rtriltri{}',
      '\u29CF': '\\LeftTriangleBar{}',
      '\u29D0': '\\RightTriangleBar{}',
      '\u29D1': '\\lfbowtie{}',
      '\u29D2': '\\rfbowtie{}',
      '\u29D3': '\\fbowtie{}',
      '\u29D4': '\\lftimes{}',
      '\u29D5': '\\rftimes{}',
      '\u29D6': '\\hourglass{}',
      '\u29D7': '\\blackhourglass{}',
      '\u29D8': '\\lvzigzag{}',
      '\u29D9': '\\rvzigzag{}',
      '\u29DA': '\\Lvzigzag{}',
      '\u29DB': '\\Rvzigzag{}',
      '\u29DC': '\\ElsevierGlyph{E372}',
      '\u29DD': '\\tieinfty{}',
      '\u29DE': '\\nvinfty{}',
      '\u29DF': '\\multimapboth{}',
      '\u29E0': '\\laplac{}',
      '\u29E1': '\\lrtriangleeq{}',
      '\u29E2': '\\shuffle{}',
      '\u29E3': '\\eparsl{}',
      '\u29E4': '\\smeparsl{}',
      '\u29E5': '\\eqvparsl{}',
      '\u29E6': '\\gleichstark{}',
      '\u29E7': '\\thermod{}',
      '\u29E8': '\\downtriangleleftblack{}',
      '\u29E9': '\\downtrianglerightblack{}',
      '\u29EA': '\\blackdiamonddownarrow{}',
      '\u29EB': '\\blacklozenge{}',
      '\u29EC': '\\circledownarrow{}',
      '\u29ED': '\\blackcircledownarrow{}',
      '\u29EE': '\\errbarsquare{}',
      '\u29EF': '\\errbarblacksquare{}',
      '\u29F0': '\\errbardiamond{}',
      '\u29F1': '\\errbarblackdiamond{}',
      '\u29F2': '\\errbarcircle{}',
      '\u29F3': '\\errbarblackcircle{}',
      '\u29F4': '\\RuleDelayed{}',
      '\u29F5': '\\setminus{}',
      '\u29F6': '\\dsol{}',
      '\u29F7': '\\rsolbar{}',
      '\u29F8': '\\xsol{}',
      '\u29F9': '\\zhide{}',
      '\u29FA': '\\doubleplus{}',
      '\u29FB': '\\tripleplus{}',
      '\u29FC': '\\lcurvyangle{}',
      '\u29FD': '\\rcurvyangle{}',
      '\u29FE': '\\tplus{}',
      '\u29FF': '\\tminus{}',
      '\u2A00': '\\bigodot{}',
      '\u2A01': '\\bigoplus{}',
      '\u2A02': '\\bigotimes{}',
      '\u2A03': '\\bigcupdot{}',
      '\u2A04': '\\Elxuplus{}',
      '\u2A05': '\\ElzThr{}',
      '\u2A06': '\\Elxsqcup{}',
      '\u2A07': '\\ElzInf{}',
      '\u2A08': '\\ElzSup{}',
      '\u2A09': '\\varprod{}',
      '\u2A0A': '\\modtwosum{}',
      '\u2A0B': '\\sumint{}',
      '\u2A0C': '\\iiiint{}',
      '\u2A0D': '\\ElzCint{}',
      '\u2A0E': '\\intBar{}',
      '\u2A0F': '\\clockoint{}',
      '\u2A10': '\\ElsevierGlyph{E395}',
      '\u2A11': '\\awint{}',
      '\u2A12': '\\rppolint{}',
      '\u2A13': '\\scpolint{}',
      '\u2A14': '\\npolint{}',
      '\u2A15': '\\pointint{}',
      '\u2A16': '\\sqrint{}',
      '\u2A17': '\\intlarhk{}',
      '\u2A18': '\\intx{}',
      '\u2A19': '\\intcap{}',
      '\u2A1A': '\\intcup{}',
      '\u2A1B': '\\upint{}',
      '\u2A1C': '\\lowint{}',
      '\u2A1D': '\\Join{}',
      '\u2A1E': '\\bigtriangleleft{}',
      '\u2A1F': '\\zcmp{}',
      '\u2A20': '\\zpipe{}',
      '\u2A21': '\\zproject{}',
      '\u2A22': '\\ringplus{}',
      '\u2A23': '\\plushat{}',
      '\u2A24': '\\simplus{}',
      '\u2A25': '\\ElsevierGlyph{E25A}',
      '\u2A26': '\\plussim{}',
      '\u2A27': '\\plussubtwo{}',
      '\u2A28': '\\plustrif{}',
      '\u2A29': '\\commaminus{}',
      '\u2A2A': '\\ElsevierGlyph{E25B}',
      '\u2A2B': '\\minusfdots{}',
      '\u2A2C': '\\minusrdots{}',
      '\u2A2D': '\\ElsevierGlyph{E25C}',
      '\u2A2E': '\\ElsevierGlyph{E25D}',
      '\u2A2F': '\\ElzTimes{}',
      '\u2A30': '\\dottimes{}',
      '\u2A31': '\\timesbar{}',
      '\u2A32': '\\btimes{}',
      '\u2A33': '\\smashtimes{}',
      '\u2A34': '\\ElsevierGlyph{E25E}',
      '\u2A35': '\\ElsevierGlyph{E25E}',
      '\u2A36': '\\otimeshat{}',
      '\u2A37': '\\Otimes{}',
      '\u2A38': '\\odiv{}',
      '\u2A39': '\\triangleplus{}',
      '\u2A3A': '\\triangleminus{}',
      '\u2A3B': '\\triangletimes{}',
      '\u2A3C': '\\ElsevierGlyph{E259}',
      '\u2A3D': '\\intprodr{}',
      '\u2A3E': '\\fcmp{}',
      '\u2A3F': '\\amalg{}',
      '\u2A40': '\\capdot{}',
      '\u2A41': '\\uminus{}',
      '\u2A42': '\\barcup{}',
      '\u2A43': '\\barcap{}',
      '\u2A44': '\\capwedge{}',
      '\u2A45': '\\cupvee{}',
      '\u2A46': '\\cupovercap{}',
      '\u2A47': '\\capovercup{}',
      '\u2A48': '\\cupbarcap{}',
      '\u2A49': '\\capbarcup{}',
      '\u2A4A': '\\twocups{}',
      '\u2A4B': '\\twocaps{}',
      '\u2A4C': '\\closedvarcup{}',
      '\u2A4D': '\\closedvarcap{}',
      '\u2A4E': '\\Sqcap{}',
      '\u2A4F': '\\Sqcup{}',
      '\u2A50': '\\closedvarcupsmashprod{}',
      '\u2A51': '\\wedgeodot{}',
      '\u2A52': '\\veeodot{}',
      '\u2A53': '\\ElzAnd{}',
      '\u2A54': '\\ElzOr{}',
      '\u2A55': '\\ElsevierGlyph{E36E}',
      '\u2A56': '\\ElOr{}',
      '\u2A57': '\\bigslopedvee{}',
      '\u2A58': '\\bigslopedwedge{}',
      '\u2A59': '\\veeonwedge{}',
      '\u2A5A': '\\wedgemidvert{}',
      '\u2A5B': '\\veemidvert{}',
      '\u2A5C': '\\midbarwedge{}',
      '\u2A5D': '\\midbarvee{}',
      '\u2A5E': '\\perspcorrespond{}',
      '\u2A5F': '\\Elzminhat{}',
      '\u2A60': '\\wedgedoublebar{}',
      '\u2A61': '\\varveebar{}',
      '\u2A62': '\\doublebarvee{}',
      '\u2A63': '\\ElsevierGlyph{225A}',
      '\u2A64': '\\dsub{}',
      '\u2A65': '\\rsub{}',
      '\u2A66': '\\eqdot{}',
      '\u2A67': '\\dotequiv{}',
      '\u2A68': '\\equivVert{}',
      '\u2A69': '\\equivVvert{}',
      '\u2A6A': '\\dotsim{}',
      '\u2A6B': '\\simrdots{}',
      '\u2A6C': '\\simminussim{}',
      '\u2A6D': '\\congdot{}',
      '\u2A6E': '\\stackrel{*}{=}',
      '\u2A6F': '\\hatapprox{}',
      '\u2A70': '\\approxeqq{}',
      '\u2A71': '\\eqqplus{}',
      '\u2A72': '\\pluseqq{}',
      '\u2A73': '\\eqqsim{}',
      '\u2A74': '\\Coloneqq{}',
      '\u2A75': '\\Equal{}',
      '\u2A76': '\\Same{}',
      '\u2A77': '\\ddotseq{}',
      '\u2A78': '\\equivDD{}',
      '\u2A79': '\\ltcir{}',
      '\u2A7A': '\\gtcir{}',
      '\u2A7B': '\\ltquest{}',
      '\u2A7C': '\\gtquest{}',
      '\u2A7D': '\\leqslant{}',
      '\u2A7E': '\\geqslant{}',
      '\u2A7F': '\\lesdot{}',
      '\u2A80': '\\gesdot{}',
      '\u2A81': '\\lesdoto{}',
      '\u2A82': '\\gesdoto{}',
      '\u2A83': '\\lesdotor{}',
      '\u2A84': '\\gesdotol{}',
      '\u2A85': '\\lessapprox{}',
      '\u2A86': '\\gtrapprox{}',
      '\u2A87': '\\lneq{}',
      '\u2A88': '\\gneq{}',
      '\u2A89': '\\lnapprox{}',
      '\u2A8A': '\\gnapprox{}',
      '\u2A8B': '\\lesseqqgtr{}',
      '\u2A8C': '\\gtreqqless{}',
      '\u2A8D': '\\lsime{}',
      '\u2A8E': '\\gsime{}',
      '\u2A8F': '\\lsimg{}',
      '\u2A90': '\\gsiml{}',
      '\u2A91': '\\lgE{}',
      '\u2A92': '\\glE{}',
      '\u2A93': '\\lesges{}',
      '\u2A94': '\\gesles{}',
      '\u2A95': '\\eqslantless{}',
      '\u2A96': '\\eqslantgtr{}',
      '\u2A97': '\\elsdot{}',
      '\u2A98': '\\egsdot{}',
      '\u2A99': '\\eqqless{}',
      '\u2A9A': '\\eqqgtr{}',
      '\u2A9B': '\\eqqslantless{}',
      '\u2A9C': '\\eqqslantgtr{}',
      '\u2A9D': '\\Pisymbol{ppi020}{117}',
      '\u2A9E': '\\Pisymbol{ppi020}{105}',
      '\u2A9F': '\\simlE{}',
      '\u2AA0': '\\simgE{}',
      '\u2AA1': '\\NestedLessLess{}',
      '\u2AA2': '\\NestedGreaterGreater{}',
      '\u2AA3': '\\partialmeetcontraction{}',
      '\u2AA4': '\\glj{}',
      '\u2AA5': '\\gla{}',
      '\u2AA6': '\\leftslice{}',
      '\u2AA7': '\\rightslice{}',
      '\u2AA8': '\\lescc{}',
      '\u2AA9': '\\gescc{}',
      '\u2AAA': '\\smt{}',
      '\u2AAB': '\\lat{}',
      '\u2AAC': '\\smte{}',
      '\u2AAD': '\\late{}',
      '\u2AAE': '\\bumpeqq{}',
      '\u2AAF': '\\preceq{}',
      '\u2AB0': '\\succeq{}',
      '\u2AB1': '\\precneq{}',
      '\u2AB2': '\\succneq{}',
      '\u2AB3': '\\preceqq{}',
      '\u2AB4': '\\succeqq{}',
      '\u2AB5': '\\precneqq{}',
      '\u2AB6': '\\succneqq{}',
      '\u2AB7': '\\precapprox{}',
      '\u2AB8': '\\succapprox{}',
      '\u2AB9': '\\precnapprox{}',
      '\u2ABA': '\\succnapprox{}',
      '\u2ABB': '\\llcurly{}',
      '\u2ABC': '\\ggcurly{}',
      '\u2ABD': '\\subsetdot{}',
      '\u2ABE': '\\supsetdot{}',
      '\u2ABF': '\\subsetplus{}',
      '\u2AC0': '\\supsetplus{}',
      '\u2AC1': '\\submult{}',
      '\u2AC2': '\\supmult{}',
      '\u2AC3': '\\subedot{}',
      '\u2AC4': '\\supedot{}',
      '\u2AC5': '\\subseteqq{}',
      '\u2AC6': '\\supseteqq{}',
      '\u2AC7': '\\subsim{}',
      '\u2AC8': '\\supsim{}',
      '\u2AC9': '\\subsetapprox{}',
      '\u2ACA': '\\supsetapprox{}',
      '\u2ACB': '\\subsetneqq{}',
      '\u2ACC': '\\supsetneqq{}',
      '\u2ACD': '\\lsqhook{}',
      '\u2ACE': '\\rsqhook{}',
      '\u2ACF': '\\csub{}',
      '\u2AD0': '\\csup{}',
      '\u2AD1': '\\csube{}',
      '\u2AD2': '\\csupe{}',
      '\u2AD3': '\\subsup{}',
      '\u2AD4': '\\supsub{}',
      '\u2AD5': '\\subsub{}',
      '\u2AD6': '\\supsup{}',
      '\u2AD7': '\\suphsub{}',
      '\u2AD8': '\\supdsub{}',
      '\u2AD9': '\\forkv{}',
      '\u2ADA': '\\topfork{}',
      '\u2ADB': '\\mlcp{}',
      '\u2ADD\u0338': '\\forks{}',
      '\u2ADD': '\\forksnot{}',
      '\u2ADE': '\\shortlefttack{}',
      '\u2ADF': '\\shortdowntack{}',
      '\u2AE0': '\\shortuptack{}',
      '\u2AE1': '\\perps{}',
      '\u2AE2': '\\vDdash{}',
      '\u2AE3': '\\dashV{}',
      '\u2AE4': '\\Dashv{}',
      '\u2AE5': '\\DashV{}',
      '\u2AE6': '\\varVdash{}',
      '\u2AE7': '\\Barv{}',
      '\u2AE8': '\\vBar{}',
      '\u2AE9': '\\vBarv{}',
      '\u2AEA': '\\Top{}',
      '\u2AEB': '\\ElsevierGlyph{E30D}',
      '\u2AEC': '\\Not{}',
      '\u2AED': '\\bNot{}',
      '\u2AEE': '\\revnmid{}',
      '\u2AEF': '\\cirmid{}',
      '\u2AF0': '\\midcir{}',
      '\u2AF1': '\\topcir{}',
      '\u2AF2': '\\nhpar{}',
      '\u2AF3': '\\parsim{}',
      '\u2AF4': '\\interleave{}',
      '\u2AF5': '\\nhVvert{}',
      '\u2AF6': '\\Elztdcol{}',
      '\u2AF7': '\\lllnest{}',
      '\u2AF8': '\\gggnest{}',
      '\u2AF9': '\\leqqslant{}',
      '\u2AFA': '\\geqqslant{}',
      '\u2AFB': '\\trslash{}',
      '\u2AFC': '\\biginterleave{}',
      '\u2AFD': '{{/}\\!\\!{/}}',
      '\u2AFE': '\\talloblong{}',
      '\u2AFF': '\\bigtalloblong{}',
      '\u2B12': '\\squaretopblack{}',
      '\u2B13': '\\squarebotblack{}',
      '\u2B14': '\\squareurblack{}',
      '\u2B15': '\\squarellblack{}',
      '\u2B16': '\\diamondleftblack{}',
      '\u2B17': '\\diamondrightblack{}',
      '\u2B18': '\\diamondtopblack{}',
      '\u2B19': '\\diamondbotblack{}',
      '\u2B1A': '\\dottedsquare{}',
      '\u2B1B': '\\blacksquare{}',
      '\u2B1C': '\\square{}',
      '\u2B1D': '\\vysmblksquare{}',
      '\u2B1E': '\\vysmwhtsquare{}',
      '\u2B1F': '\\pentagonblack{}',
      '\u2B20': '\\pentagon{}',
      '\u2B21': '\\varhexagon{}',
      '\u2B22': '\\varhexagonblack{}',
      '\u2B23': '\\hexagonblack{}',
      '\u2B24': '\\lgblkcircle{}',
      '\u2B25': '\\mdblkdiamond{}',
      '\u2B26': '\\mdwhtdiamond{}',
      '\u2B27': '\\mdblklozenge{}',
      '\u2B28': '\\mdwhtlozenge{}',
      '\u2B29': '\\smblkdiamond{}',
      '\u2B2A': '\\smblklozenge{}',
      '\u2B2B': '\\smwhtlozenge{}',
      '\u2B2C': '\\blkhorzoval{}',
      '\u2B2D': '\\whthorzoval{}',
      '\u2B2E': '\\blkvertoval{}',
      '\u2B2F': '\\whtvertoval{}',
      '\u2B30': '\\circleonleftarrow{}',
      '\u2B31': '\\leftthreearrows{}',
      '\u2B32': '\\leftarrowonoplus{}',
      '\u2B33': '\\longleftsquigarrow{}',
      '\u2B34': '\\nvtwoheadleftarrow{}',
      '\u2B35': '\\nVtwoheadleftarrow{}',
      '\u2B36': '\\twoheadmapsfrom{}',
      '\u2B37': '\\twoheadleftdbkarrow{}',
      '\u2B38': '\\leftdotarrow{}',
      '\u2B39': '\\nvleftarrowtail{}',
      '\u2B3A': '\\nVleftarrowtail{}',
      '\u2B3B': '\\twoheadleftarrowtail{}',
      '\u2B3C': '\\nvtwoheadleftarrowtail{}',
      '\u2B3D': '\\nVtwoheadleftarrowtail{}',
      '\u2B3E': '\\leftarrowx{}',
      '\u2B3F': '\\leftcurvedarrow{}',
      '\u2B40': '\\equalleftarrow{}',
      '\u2B41': '\\bsimilarleftarrow{}',
      '\u2B42': '\\leftarrowbackapprox{}',
      '\u2B43': '\\rightarrowgtr{}',
      '\u2B44': '\\rightarrowsupset{}',
      '\u2B45': '\\LLeftarrow{}',
      '\u2B46': '\\RRightarrow{}',
      '\u2B47': '\\bsimilarrightarrow{}',
      '\u2B48': '\\rightarrowbackapprox{}',
      '\u2B49': '\\similarleftarrow{}',
      '\u2B4A': '\\leftarrowapprox{}',
      '\u2B4B': '\\leftarrowbsimilar{}',
      '\u2B4C': '\\rightarrowbsimilar{}',
      '\u2B50': '\\medwhitestar{}',
      '\u2B51': '\\medblackstar{}',
      '\u2B52': '\\smwhitestar{}',
      '\u2B53': '\\rightpentagonblack{}',
      '\u2B54': '\\rightpentagon{}',
      '\u300A': '\\ElsevierGlyph{300A}',
      '\u300B': '\\ElsevierGlyph{300B}',
      '\u3012': '\\postalmark{}',
      '\u3014': '\\lbrbrak{}',
      '\u3015': '\\rbrbrak{}',
      '\u3018': '\\ElsevierGlyph{3018}',
      '\u3019': '\\ElsevierGlyph{3019}',
      '\u301A': '\\openbracketleft{}',
      '\u301B': '\\openbracketright{}',
      '\u3030': '\\hzigzag{}',
      '\uD835\uDC00': '\\mathbf{A}',
      '\uD835\uDC01': '\\mathbf{B}',
      '\uD835\uDC02': '\\mathbf{C}',
      '\uD835\uDC03': '\\mathbf{D}',
      '\uD835\uDC04': '\\mathbf{E}',
      '\uD835\uDC05': '\\mathbf{F}',
      '\uD835\uDC06': '\\mathbf{G}',
      '\uD835\uDC07': '\\mathbf{H}',
      '\uD835\uDC08': '\\mathbf{I}',
      '\uD835\uDC09': '\\mathbf{J}',
      '\uD835\uDC0A': '\\mathbf{K}',
      '\uD835\uDC0B': '\\mathbf{L}',
      '\uD835\uDC0C': '\\mathbf{M}',
      '\uD835\uDC0D': '\\mathbf{N}',
      '\uD835\uDC0E': '\\mathbf{O}',
      '\uD835\uDC0F': '\\mathbf{P}',
      '\uD835\uDC10': '\\mathbf{Q}',
      '\uD835\uDC11': '\\mathbf{R}',
      '\uD835\uDC12': '\\mathbf{S}',
      '\uD835\uDC13': '\\mathbf{T}',
      '\uD835\uDC14': '\\mathbf{U}',
      '\uD835\uDC15': '\\mathbf{V}',
      '\uD835\uDC16': '\\mathbf{W}',
      '\uD835\uDC17': '\\mathbf{X}',
      '\uD835\uDC18': '\\mathbf{Y}',
      '\uD835\uDC19': '\\mathbf{Z}',
      '\uD835\uDC1A': '\\mathbf{a}',
      '\uD835\uDC1B': '\\mathbf{b}',
      '\uD835\uDC1C': '\\mathbf{c}',
      '\uD835\uDC1D': '\\mathbf{d}',
      '\uD835\uDC1E': '\\mathbf{e}',
      '\uD835\uDC1F': '\\mathbf{f}',
      '\uD835\uDC20': '\\mathbf{g}',
      '\uD835\uDC21': '\\mathbf{h}',
      '\uD835\uDC22': '\\mathbf{i}',
      '\uD835\uDC23': '\\mathbf{j}',
      '\uD835\uDC24': '\\mathbf{k}',
      '\uD835\uDC25': '\\mathbf{l}',
      '\uD835\uDC26': '\\mathbf{m}',
      '\uD835\uDC27': '\\mathbf{n}',
      '\uD835\uDC28': '\\mathbf{o}',
      '\uD835\uDC29': '\\mathbf{p}',
      '\uD835\uDC2A': '\\mathbf{q}',
      '\uD835\uDC2B': '\\mathbf{r}',
      '\uD835\uDC2C': '\\mathbf{s}',
      '\uD835\uDC2D': '\\mathbf{t}',
      '\uD835\uDC2E': '\\mathbf{u}',
      '\uD835\uDC2F': '\\mathbf{v}',
      '\uD835\uDC30': '\\mathbf{w}',
      '\uD835\uDC31': '\\mathbf{x}',
      '\uD835\uDC32': '\\mathbf{y}',
      '\uD835\uDC33': '\\mathbf{z}',
      '\uD835\uDC34': '\\mathsl{A}',
      '\uD835\uDC35': '\\mathsl{B}',
      '\uD835\uDC36': '\\mathsl{C}',
      '\uD835\uDC37': '\\mathsl{D}',
      '\uD835\uDC38': '\\mathsl{E}',
      '\uD835\uDC39': '\\mathsl{F}',
      '\uD835\uDC3A': '\\mathsl{G}',
      '\uD835\uDC3B': '\\mathsl{H}',
      '\uD835\uDC3C': '\\mathsl{I}',
      '\uD835\uDC3D': '\\mathsl{J}',
      '\uD835\uDC3E': '\\mathsl{K}',
      '\uD835\uDC3F': '\\mathsl{L}',
      '\uD835\uDC40': '\\mathsl{M}',
      '\uD835\uDC41': '\\mathsl{N}',
      '\uD835\uDC42': '\\mathsl{O}',
      '\uD835\uDC43': '\\mathsl{P}',
      '\uD835\uDC44': '\\mathsl{Q}',
      '\uD835\uDC45': '\\mathsl{R}',
      '\uD835\uDC46': '\\mathsl{S}',
      '\uD835\uDC47': '\\mathsl{T}',
      '\uD835\uDC48': '\\mathsl{U}',
      '\uD835\uDC49': '\\mathsl{V}',
      '\uD835\uDC4A': '\\mathsl{W}',
      '\uD835\uDC4B': '\\mathsl{X}',
      '\uD835\uDC4C': '\\mathsl{Y}',
      '\uD835\uDC4D': '\\mathsl{Z}',
      '\uD835\uDC4E': '\\mathsl{a}',
      '\uD835\uDC4F': '\\mathsl{b}',
      '\uD835\uDC50': '\\mathsl{c}',
      '\uD835\uDC51': '\\mathsl{d}',
      '\uD835\uDC52': '\\mathsl{e}',
      '\uD835\uDC53': '\\mathsl{f}',
      '\uD835\uDC54': '\\mathsl{g}',
      '\uD835\uDC56': '\\mathsl{i}',
      '\uD835\uDC57': '\\mathsl{j}',
      '\uD835\uDC58': '\\mathsl{k}',
      '\uD835\uDC59': '\\mathsl{l}',
      '\uD835\uDC5A': '\\mathsl{m}',
      '\uD835\uDC5B': '\\mathsl{n}',
      '\uD835\uDC5C': '\\mathsl{o}',
      '\uD835\uDC5D': '\\mathsl{p}',
      '\uD835\uDC5E': '\\mathsl{q}',
      '\uD835\uDC5F': '\\mathsl{r}',
      '\uD835\uDC60': '\\mathsl{s}',
      '\uD835\uDC61': '\\mathsl{t}',
      '\uD835\uDC62': '\\mathsl{u}',
      '\uD835\uDC63': '\\mathsl{v}',
      '\uD835\uDC64': '\\mathsl{w}',
      '\uD835\uDC65': '\\mathsl{x}',
      '\uD835\uDC66': '\\mathsl{y}',
      '\uD835\uDC67': '\\mathsl{z}',
      '\uD835\uDC68': '\\mathbit{A}',
      '\uD835\uDC69': '\\mathbit{B}',
      '\uD835\uDC6A': '\\mathbit{C}',
      '\uD835\uDC6B': '\\mathbit{D}',
      '\uD835\uDC6C': '\\mathbit{E}',
      '\uD835\uDC6D': '\\mathbit{F}',
      '\uD835\uDC6E': '\\mathbit{G}',
      '\uD835\uDC6F': '\\mathbit{H}',
      '\uD835\uDC70': '\\mathbit{I}',
      '\uD835\uDC71': '\\mathbit{J}',
      '\uD835\uDC72': '\\mathbit{K}',
      '\uD835\uDC73': '\\mathbit{L}',
      '\uD835\uDC74': '\\mathbit{M}',
      '\uD835\uDC75': '\\mathbit{N}',
      '\uD835\uDC76': '\\mathbit{O}',
      '\uD835\uDC77': '\\mathbit{P}',
      '\uD835\uDC78': '\\mathbit{Q}',
      '\uD835\uDC79': '\\mathbit{R}',
      '\uD835\uDC7A': '\\mathbit{S}',
      '\uD835\uDC7B': '\\mathbit{T}',
      '\uD835\uDC7C': '\\mathbit{U}',
      '\uD835\uDC7D': '\\mathbit{V}',
      '\uD835\uDC7E': '\\mathbit{W}',
      '\uD835\uDC7F': '\\mathbit{X}',
      '\uD835\uDC80': '\\mathbit{Y}',
      '\uD835\uDC81': '\\mathbit{Z}',
      '\uD835\uDC82': '\\mathbit{a}',
      '\uD835\uDC83': '\\mathbit{b}',
      '\uD835\uDC84': '\\mathbit{c}',
      '\uD835\uDC85': '\\mathbit{d}',
      '\uD835\uDC86': '\\mathbit{e}',
      '\uD835\uDC87': '\\mathbit{f}',
      '\uD835\uDC88': '\\mathbit{g}',
      '\uD835\uDC89': '\\mathbit{h}',
      '\uD835\uDC8A': '\\mathbit{i}',
      '\uD835\uDC8B': '\\mathbit{j}',
      '\uD835\uDC8C': '\\mathbit{k}',
      '\uD835\uDC8D': '\\mathbit{l}',
      '\uD835\uDC8E': '\\mathbit{m}',
      '\uD835\uDC8F': '\\mathbit{n}',
      '\uD835\uDC90': '\\mathbit{o}',
      '\uD835\uDC91': '\\mathbit{p}',
      '\uD835\uDC92': '\\mathbit{q}',
      '\uD835\uDC93': '\\mathbit{r}',
      '\uD835\uDC94': '\\mathbit{s}',
      '\uD835\uDC95': '\\mathbit{t}',
      '\uD835\uDC96': '\\mathbit{u}',
      '\uD835\uDC97': '\\mathbit{v}',
      '\uD835\uDC98': '\\mathbit{w}',
      '\uD835\uDC99': '\\mathbit{x}',
      '\uD835\uDC9A': '\\mathbit{y}',
      '\uD835\uDC9B': '\\mathbit{z}',
      '\uD835\uDC9C': '\\mathscr{A}',
      '\uD835\uDC9E': '\\mathscr{C}',
      '\uD835\uDC9F': '\\mathscr{D}',
      '\uD835\uDCA2': '\\mathscr{G}',
      '\uD835\uDCA5': '\\mathscr{J}',
      '\uD835\uDCA6': '\\mathscr{K}',
      '\uD835\uDCA9': '\\mathscr{N}',
      '\uD835\uDCAA': '\\mathscr{O}',
      '\uD835\uDCAB': '\\mathscr{P}',
      '\uD835\uDCAC': '\\mathscr{Q}',
      '\uD835\uDCAE': '\\mathscr{S}',
      '\uD835\uDCAF': '\\mathscr{T}',
      '\uD835\uDCB0': '\\mathscr{U}',
      '\uD835\uDCB1': '\\mathscr{V}',
      '\uD835\uDCB2': '\\mathscr{W}',
      '\uD835\uDCB3': '\\mathscr{X}',
      '\uD835\uDCB4': '\\mathscr{Y}',
      '\uD835\uDCB5': '\\mathscr{Z}',
      '\uD835\uDCB6': '\\mathscr{a}',
      '\uD835\uDCB7': '\\mathscr{b}',
      '\uD835\uDCB8': '\\mathscr{c}',
      '\uD835\uDCB9': '\\mathscr{d}',
      '\uD835\uDCBB': '\\mathscr{f}',
      '\uD835\uDCBD': '\\mathscr{h}',
      '\uD835\uDCBE': '\\mathscr{i}',
      '\uD835\uDCBF': '\\mathscr{j}',
      '\uD835\uDCC0': '\\mathscr{k}',
      '\uD835\uDCC1': '\\mathscr{l}',
      '\uD835\uDCC2': '\\mathscr{m}',
      '\uD835\uDCC3': '\\mathscr{n}',
      '\uD835\uDCC5': '\\mathscr{p}',
      '\uD835\uDCC6': '\\mathscr{q}',
      '\uD835\uDCC7': '\\mathscr{r}',
      '\uD835\uDCC8': '\\mathscr{s}',
      '\uD835\uDCC9': '\\mathscr{t}',
      '\uD835\uDCCA': '\\mathscr{u}',
      '\uD835\uDCCB': '\\mathscr{v}',
      '\uD835\uDCCC': '\\mathscr{w}',
      '\uD835\uDCCD': '\\mathscr{x}',
      '\uD835\uDCCE': '\\mathscr{y}',
      '\uD835\uDCCF': '\\mathscr{z}',
      '\uD835\uDCD0': '\\mathmit{A}',
      '\uD835\uDCD1': '\\mathmit{B}',
      '\uD835\uDCD2': '\\mathmit{C}',
      '\uD835\uDCD3': '\\mathmit{D}',
      '\uD835\uDCD4': '\\mathmit{E}',
      '\uD835\uDCD5': '\\mathmit{F}',
      '\uD835\uDCD6': '\\mathmit{G}',
      '\uD835\uDCD7': '\\mathmit{H}',
      '\uD835\uDCD8': '\\mathmit{I}',
      '\uD835\uDCD9': '\\mathmit{J}',
      '\uD835\uDCDA': '\\mathmit{K}',
      '\uD835\uDCDB': '\\mathmit{L}',
      '\uD835\uDCDC': '\\mathmit{M}',
      '\uD835\uDCDD': '\\mathmit{N}',
      '\uD835\uDCDE': '\\mathmit{O}',
      '\uD835\uDCDF': '\\mathmit{P}',
      '\uD835\uDCE0': '\\mathmit{Q}',
      '\uD835\uDCE1': '\\mathmit{R}',
      '\uD835\uDCE2': '\\mathmit{S}',
      '\uD835\uDCE3': '\\mathmit{T}',
      '\uD835\uDCE4': '\\mathmit{U}',
      '\uD835\uDCE5': '\\mathmit{V}',
      '\uD835\uDCE6': '\\mathmit{W}',
      '\uD835\uDCE7': '\\mathmit{X}',
      '\uD835\uDCE8': '\\mathmit{Y}',
      '\uD835\uDCE9': '\\mathmit{Z}',
      '\uD835\uDCEA': '\\mathmit{a}',
      '\uD835\uDCEB': '\\mathmit{b}',
      '\uD835\uDCEC': '\\mathmit{c}',
      '\uD835\uDCED': '\\mathmit{d}',
      '\uD835\uDCEE': '\\mathmit{e}',
      '\uD835\uDCEF': '\\mathmit{f}',
      '\uD835\uDCF0': '\\mathmit{g}',
      '\uD835\uDCF1': '\\mathmit{h}',
      '\uD835\uDCF2': '\\mathmit{i}',
      '\uD835\uDCF3': '\\mathmit{j}',
      '\uD835\uDCF4': '\\mathmit{k}',
      '\uD835\uDCF5': '\\mathmit{l}',
      '\uD835\uDCF6': '\\mathmit{m}',
      '\uD835\uDCF7': '\\mathmit{n}',
      '\uD835\uDCF8': '\\mathmit{o}',
      '\uD835\uDCF9': '\\mathmit{p}',
      '\uD835\uDCFA': '\\mathmit{q}',
      '\uD835\uDCFB': '\\mathmit{r}',
      '\uD835\uDCFC': '\\mathmit{s}',
      '\uD835\uDCFD': '\\mathmit{t}',
      '\uD835\uDCFE': '\\mathmit{u}',
      '\uD835\uDCFF': '\\mathmit{v}',
      '\uD835\uDD00': '\\mathmit{w}',
      '\uD835\uDD01': '\\mathmit{x}',
      '\uD835\uDD02': '\\mathmit{y}',
      '\uD835\uDD03': '\\mathmit{z}',
      '\uD835\uDD04': '\\mathfrak{A}',
      '\uD835\uDD05': '\\mathfrak{B}',
      '\uD835\uDD07': '\\mathfrak{D}',
      '\uD835\uDD08': '\\mathfrak{E}',
      '\uD835\uDD09': '\\mathfrak{F}',
      '\uD835\uDD0A': '\\mathfrak{G}',
      '\uD835\uDD0D': '\\mathfrak{J}',
      '\uD835\uDD0E': '\\mathfrak{K}',
      '\uD835\uDD0F': '\\mathfrak{L}',
      '\uD835\uDD10': '\\mathfrak{M}',
      '\uD835\uDD11': '\\mathfrak{N}',
      '\uD835\uDD12': '\\mathfrak{O}',
      '\uD835\uDD13': '\\mathfrak{P}',
      '\uD835\uDD14': '\\mathfrak{Q}',
      '\uD835\uDD16': '\\mathfrak{S}',
      '\uD835\uDD17': '\\mathfrak{T}',
      '\uD835\uDD18': '\\mathfrak{U}',
      '\uD835\uDD19': '\\mathfrak{V}',
      '\uD835\uDD1A': '\\mathfrak{W}',
      '\uD835\uDD1B': '\\mathfrak{X}',
      '\uD835\uDD1C': '\\mathfrak{Y}',
      '\uD835\uDD1E': '\\mathfrak{a}',
      '\uD835\uDD1F': '\\mathfrak{b}',
      '\uD835\uDD20': '\\mathfrak{c}',
      '\uD835\uDD21': '\\mathfrak{d}',
      '\uD835\uDD22': '\\mathfrak{e}',
      '\uD835\uDD23': '\\mathfrak{f}',
      '\uD835\uDD24': '\\mathfrak{g}',
      '\uD835\uDD25': '\\mathfrak{h}',
      '\uD835\uDD26': '\\mathfrak{i}',
      '\uD835\uDD27': '\\mathfrak{j}',
      '\uD835\uDD28': '\\mathfrak{k}',
      '\uD835\uDD29': '\\mathfrak{l}',
      '\uD835\uDD2A': '\\mathfrak{m}',
      '\uD835\uDD2B': '\\mathfrak{n}',
      '\uD835\uDD2C': '\\mathfrak{o}',
      '\uD835\uDD2D': '\\mathfrak{p}',
      '\uD835\uDD2E': '\\mathfrak{q}',
      '\uD835\uDD2F': '\\mathfrak{r}',
      '\uD835\uDD30': '\\mathfrak{s}',
      '\uD835\uDD31': '\\mathfrak{t}',
      '\uD835\uDD32': '\\mathfrak{u}',
      '\uD835\uDD33': '\\mathfrak{v}',
      '\uD835\uDD34': '\\mathfrak{w}',
      '\uD835\uDD35': '\\mathfrak{x}',
      '\uD835\uDD36': '\\mathfrak{y}',
      '\uD835\uDD37': '\\mathfrak{z}',
      '\uD835\uDD38': '\\mathbb{A}',
      '\uD835\uDD39': '\\mathbb{B}',
      '\uD835\uDD3B': '\\mathbb{D}',
      '\uD835\uDD3C': '\\mathbb{E}',
      '\uD835\uDD3D': '\\mathbb{F}',
      '\uD835\uDD3E': '\\mathbb{G}',
      '\uD835\uDD40': '\\mathbb{I}',
      '\uD835\uDD41': '\\mathbb{J}',
      '\uD835\uDD42': '\\mathbb{K}',
      '\uD835\uDD43': '\\mathbb{L}',
      '\uD835\uDD44': '\\mathbb{M}',
      '\uD835\uDD46': '\\mathbb{O}',
      '\uD835\uDD4A': '\\mathbb{S}',
      '\uD835\uDD4B': '\\mathbb{T}',
      '\uD835\uDD4C': '\\mathbb{U}',
      '\uD835\uDD4D': '\\mathbb{V}',
      '\uD835\uDD4E': '\\mathbb{W}',
      '\uD835\uDD4F': '\\mathbb{X}',
      '\uD835\uDD50': '\\mathbb{Y}',
      '\uD835\uDD52': '\\mathbb{a}',
      '\uD835\uDD53': '\\mathbb{b}',
      '\uD835\uDD54': '\\mathbb{c}',
      '\uD835\uDD55': '\\mathbb{d}',
      '\uD835\uDD56': '\\mathbb{e}',
      '\uD835\uDD57': '\\mathbb{f}',
      '\uD835\uDD58': '\\mathbb{g}',
      '\uD835\uDD59': '\\mathbb{h}',
      '\uD835\uDD5A': '\\mathbb{i}',
      '\uD835\uDD5B': '\\mathbb{j}',
      '\uD835\uDD5C': '\\mathbb{k}',
      '\uD835\uDD5D': '\\mathbb{l}',
      '\uD835\uDD5E': '\\mathbb{m}',
      '\uD835\uDD5F': '\\mathbb{n}',
      '\uD835\uDD60': '\\mathbb{o}',
      '\uD835\uDD61': '\\mathbb{p}',
      '\uD835\uDD62': '\\mathbb{q}',
      '\uD835\uDD63': '\\mathbb{r}',
      '\uD835\uDD64': '\\mathbb{s}',
      '\uD835\uDD65': '\\mathbb{t}',
      '\uD835\uDD66': '\\mathbb{u}',
      '\uD835\uDD67': '\\mathbb{v}',
      '\uD835\uDD68': '\\mathbb{w}',
      '\uD835\uDD69': '\\mathbb{x}',
      '\uD835\uDD6A': '\\mathbb{y}',
      '\uD835\uDD6B': '\\mathbb{z}',
      '\uD835\uDD6C': '\\mathslbb{A}',
      '\uD835\uDD6D': '\\mathslbb{B}',
      '\uD835\uDD6E': '\\mathslbb{C}',
      '\uD835\uDD6F': '\\mathslbb{D}',
      '\uD835\uDD70': '\\mathslbb{E}',
      '\uD835\uDD71': '\\mathslbb{F}',
      '\uD835\uDD72': '\\mathslbb{G}',
      '\uD835\uDD73': '\\mathslbb{H}',
      '\uD835\uDD74': '\\mathslbb{I}',
      '\uD835\uDD75': '\\mathslbb{J}',
      '\uD835\uDD76': '\\mathslbb{K}',
      '\uD835\uDD77': '\\mathslbb{L}',
      '\uD835\uDD78': '\\mathslbb{M}',
      '\uD835\uDD79': '\\mathslbb{N}',
      '\uD835\uDD7A': '\\mathslbb{O}',
      '\uD835\uDD7B': '\\mathslbb{P}',
      '\uD835\uDD7C': '\\mathslbb{Q}',
      '\uD835\uDD7D': '\\mathslbb{R}',
      '\uD835\uDD7E': '\\mathslbb{S}',
      '\uD835\uDD7F': '\\mathslbb{T}',
      '\uD835\uDD80': '\\mathslbb{U}',
      '\uD835\uDD81': '\\mathslbb{V}',
      '\uD835\uDD82': '\\mathslbb{W}',
      '\uD835\uDD83': '\\mathslbb{X}',
      '\uD835\uDD84': '\\mathslbb{Y}',
      '\uD835\uDD85': '\\mathslbb{Z}',
      '\uD835\uDD86': '\\mathslbb{a}',
      '\uD835\uDD87': '\\mathslbb{b}',
      '\uD835\uDD88': '\\mathslbb{c}',
      '\uD835\uDD89': '\\mathslbb{d}',
      '\uD835\uDD8A': '\\mathslbb{e}',
      '\uD835\uDD8B': '\\mathslbb{f}',
      '\uD835\uDD8C': '\\mathslbb{g}',
      '\uD835\uDD8D': '\\mathslbb{h}',
      '\uD835\uDD8E': '\\mathslbb{i}',
      '\uD835\uDD8F': '\\mathslbb{j}',
      '\uD835\uDD90': '\\mathslbb{k}',
      '\uD835\uDD91': '\\mathslbb{l}',
      '\uD835\uDD92': '\\mathslbb{m}',
      '\uD835\uDD93': '\\mathslbb{n}',
      '\uD835\uDD94': '\\mathslbb{o}',
      '\uD835\uDD95': '\\mathslbb{p}',
      '\uD835\uDD96': '\\mathslbb{q}',
      '\uD835\uDD97': '\\mathslbb{r}',
      '\uD835\uDD98': '\\mathslbb{s}',
      '\uD835\uDD99': '\\mathslbb{t}',
      '\uD835\uDD9A': '\\mathslbb{u}',
      '\uD835\uDD9B': '\\mathslbb{v}',
      '\uD835\uDD9C': '\\mathslbb{w}',
      '\uD835\uDD9D': '\\mathslbb{x}',
      '\uD835\uDD9E': '\\mathslbb{y}',
      '\uD835\uDD9F': '\\mathslbb{z}',
      '\uD835\uDDA0': '\\mathsf{A}',
      '\uD835\uDDA1': '\\mathsf{B}',
      '\uD835\uDDA2': '\\mathsf{C}',
      '\uD835\uDDA3': '\\mathsf{D}',
      '\uD835\uDDA4': '\\mathsf{E}',
      '\uD835\uDDA5': '\\mathsf{F}',
      '\uD835\uDDA6': '\\mathsf{G}',
      '\uD835\uDDA7': '\\mathsf{H}',
      '\uD835\uDDA8': '\\mathsf{I}',
      '\uD835\uDDA9': '\\mathsf{J}',
      '\uD835\uDDAA': '\\mathsf{K}',
      '\uD835\uDDAB': '\\mathsf{L}',
      '\uD835\uDDAC': '\\mathsf{M}',
      '\uD835\uDDAD': '\\mathsf{N}',
      '\uD835\uDDAE': '\\mathsf{O}',
      '\uD835\uDDAF': '\\mathsf{P}',
      '\uD835\uDDB0': '\\mathsf{Q}',
      '\uD835\uDDB1': '\\mathsf{R}',
      '\uD835\uDDB2': '\\mathsf{S}',
      '\uD835\uDDB3': '\\mathsf{T}',
      '\uD835\uDDB4': '\\mathsf{U}',
      '\uD835\uDDB5': '\\mathsf{V}',
      '\uD835\uDDB6': '\\mathsf{W}',
      '\uD835\uDDB7': '\\mathsf{X}',
      '\uD835\uDDB8': '\\mathsf{Y}',
      '\uD835\uDDB9': '\\mathsf{Z}',
      '\uD835\uDDBA': '\\mathsf{a}',
      '\uD835\uDDBB': '\\mathsf{b}',
      '\uD835\uDDBC': '\\mathsf{c}',
      '\uD835\uDDBD': '\\mathsf{d}',
      '\uD835\uDDBE': '\\mathsf{e}',
      '\uD835\uDDBF': '\\mathsf{f}',
      '\uD835\uDDC0': '\\mathsf{g}',
      '\uD835\uDDC1': '\\mathsf{h}',
      '\uD835\uDDC2': '\\mathsf{i}',
      '\uD835\uDDC3': '\\mathsf{j}',
      '\uD835\uDDC4': '\\mathsf{k}',
      '\uD835\uDDC5': '\\mathsf{l}',
      '\uD835\uDDC6': '\\mathsf{m}',
      '\uD835\uDDC7': '\\mathsf{n}',
      '\uD835\uDDC8': '\\mathsf{o}',
      '\uD835\uDDC9': '\\mathsf{p}',
      '\uD835\uDDCA': '\\mathsf{q}',
      '\uD835\uDDCB': '\\mathsf{r}',
      '\uD835\uDDCC': '\\mathsf{s}',
      '\uD835\uDDCD': '\\mathsf{t}',
      '\uD835\uDDCE': '\\mathsf{u}',
      '\uD835\uDDCF': '\\mathsf{v}',
      '\uD835\uDDD0': '\\mathsf{w}',
      '\uD835\uDDD1': '\\mathsf{x}',
      '\uD835\uDDD2': '\\mathsf{y}',
      '\uD835\uDDD3': '\\mathsf{z}',
      '\uD835\uDDD4': '\\mathsfbf{A}',
      '\uD835\uDDD5': '\\mathsfbf{B}',
      '\uD835\uDDD6': '\\mathsfbf{C}',
      '\uD835\uDDD7': '\\mathsfbf{D}',
      '\uD835\uDDD8': '\\mathsfbf{E}',
      '\uD835\uDDD9': '\\mathsfbf{F}',
      '\uD835\uDDDA': '\\mathsfbf{G}',
      '\uD835\uDDDB': '\\mathsfbf{H}',
      '\uD835\uDDDC': '\\mathsfbf{I}',
      '\uD835\uDDDD': '\\mathsfbf{J}',
      '\uD835\uDDDE': '\\mathsfbf{K}',
      '\uD835\uDDDF': '\\mathsfbf{L}',
      '\uD835\uDDE0': '\\mathsfbf{M}',
      '\uD835\uDDE1': '\\mathsfbf{N}',
      '\uD835\uDDE2': '\\mathsfbf{O}',
      '\uD835\uDDE3': '\\mathsfbf{P}',
      '\uD835\uDDE4': '\\mathsfbf{Q}',
      '\uD835\uDDE5': '\\mathsfbf{R}',
      '\uD835\uDDE6': '\\mathsfbf{S}',
      '\uD835\uDDE7': '\\mathsfbf{T}',
      '\uD835\uDDE8': '\\mathsfbf{U}',
      '\uD835\uDDE9': '\\mathsfbf{V}',
      '\uD835\uDDEA': '\\mathsfbf{W}',
      '\uD835\uDDEB': '\\mathsfbf{X}',
      '\uD835\uDDEC': '\\mathsfbf{Y}',
      '\uD835\uDDED': '\\mathsfbf{Z}',
      '\uD835\uDDEE': '\\mathsfbf{a}',
      '\uD835\uDDEF': '\\mathsfbf{b}',
      '\uD835\uDDF0': '\\mathsfbf{c}',
      '\uD835\uDDF1': '\\mathsfbf{d}',
      '\uD835\uDDF2': '\\mathsfbf{e}',
      '\uD835\uDDF3': '\\mathsfbf{f}',
      '\uD835\uDDF4': '\\mathsfbf{g}',
      '\uD835\uDDF5': '\\mathsfbf{h}',
      '\uD835\uDDF6': '\\mathsfbf{i}',
      '\uD835\uDDF7': '\\mathsfbf{j}',
      '\uD835\uDDF8': '\\mathsfbf{k}',
      '\uD835\uDDF9': '\\mathsfbf{l}',
      '\uD835\uDDFA': '\\mathsfbf{m}',
      '\uD835\uDDFB': '\\mathsfbf{n}',
      '\uD835\uDDFC': '\\mathsfbf{o}',
      '\uD835\uDDFD': '\\mathsfbf{p}',
      '\uD835\uDDFE': '\\mathsfbf{q}',
      '\uD835\uDDFF': '\\mathsfbf{r}',
      '\uD835\uDE00': '\\mathsfbf{s}',
      '\uD835\uDE01': '\\mathsfbf{t}',
      '\uD835\uDE02': '\\mathsfbf{u}',
      '\uD835\uDE03': '\\mathsfbf{v}',
      '\uD835\uDE04': '\\mathsfbf{w}',
      '\uD835\uDE05': '\\mathsfbf{x}',
      '\uD835\uDE06': '\\mathsfbf{y}',
      '\uD835\uDE07': '\\mathsfbf{z}',
      '\uD835\uDE08': '\\mathsfsl{A}',
      '\uD835\uDE09': '\\mathsfsl{B}',
      '\uD835\uDE0A': '\\mathsfsl{C}',
      '\uD835\uDE0B': '\\mathsfsl{D}',
      '\uD835\uDE0C': '\\mathsfsl{E}',
      '\uD835\uDE0D': '\\mathsfsl{F}',
      '\uD835\uDE0E': '\\mathsfsl{G}',
      '\uD835\uDE0F': '\\mathsfsl{H}',
      '\uD835\uDE10': '\\mathsfsl{I}',
      '\uD835\uDE11': '\\mathsfsl{J}',
      '\uD835\uDE12': '\\mathsfsl{K}',
      '\uD835\uDE13': '\\mathsfsl{L}',
      '\uD835\uDE14': '\\mathsfsl{M}',
      '\uD835\uDE15': '\\mathsfsl{N}',
      '\uD835\uDE16': '\\mathsfsl{O}',
      '\uD835\uDE17': '\\mathsfsl{P}',
      '\uD835\uDE18': '\\mathsfsl{Q}',
      '\uD835\uDE19': '\\mathsfsl{R}',
      '\uD835\uDE1A': '\\mathsfsl{S}',
      '\uD835\uDE1B': '\\mathsfsl{T}',
      '\uD835\uDE1C': '\\mathsfsl{U}',
      '\uD835\uDE1D': '\\mathsfsl{V}',
      '\uD835\uDE1E': '\\mathsfsl{W}',
      '\uD835\uDE1F': '\\mathsfsl{X}',
      '\uD835\uDE20': '\\mathsfsl{Y}',
      '\uD835\uDE21': '\\mathsfsl{Z}',
      '\uD835\uDE22': '\\mathsfsl{a}',
      '\uD835\uDE23': '\\mathsfsl{b}',
      '\uD835\uDE24': '\\mathsfsl{c}',
      '\uD835\uDE25': '\\mathsfsl{d}',
      '\uD835\uDE26': '\\mathsfsl{e}',
      '\uD835\uDE27': '\\mathsfsl{f}',
      '\uD835\uDE28': '\\mathsfsl{g}',
      '\uD835\uDE29': '\\mathsfsl{h}',
      '\uD835\uDE2A': '\\mathsfsl{i}',
      '\uD835\uDE2B': '\\mathsfsl{j}',
      '\uD835\uDE2C': '\\mathsfsl{k}',
      '\uD835\uDE2D': '\\mathsfsl{l}',
      '\uD835\uDE2E': '\\mathsfsl{m}',
      '\uD835\uDE2F': '\\mathsfsl{n}',
      '\uD835\uDE30': '\\mathsfsl{o}',
      '\uD835\uDE31': '\\mathsfsl{p}',
      '\uD835\uDE32': '\\mathsfsl{q}',
      '\uD835\uDE33': '\\mathsfsl{r}',
      '\uD835\uDE34': '\\mathsfsl{s}',
      '\uD835\uDE35': '\\mathsfsl{t}',
      '\uD835\uDE36': '\\mathsfsl{u}',
      '\uD835\uDE37': '\\mathsfsl{v}',
      '\uD835\uDE38': '\\mathsfsl{w}',
      '\uD835\uDE39': '\\mathsfsl{x}',
      '\uD835\uDE3A': '\\mathsfsl{y}',
      '\uD835\uDE3B': '\\mathsfsl{z}',
      '\uD835\uDE3C': '\\mathsfbfsl{A}',
      '\uD835\uDE3D': '\\mathsfbfsl{B}',
      '\uD835\uDE3E': '\\mathsfbfsl{C}',
      '\uD835\uDE3F': '\\mathsfbfsl{D}',
      '\uD835\uDE40': '\\mathsfbfsl{E}',
      '\uD835\uDE41': '\\mathsfbfsl{F}',
      '\uD835\uDE42': '\\mathsfbfsl{G}',
      '\uD835\uDE43': '\\mathsfbfsl{H}',
      '\uD835\uDE44': '\\mathsfbfsl{I}',
      '\uD835\uDE45': '\\mathsfbfsl{J}',
      '\uD835\uDE46': '\\mathsfbfsl{K}',
      '\uD835\uDE47': '\\mathsfbfsl{L}',
      '\uD835\uDE48': '\\mathsfbfsl{M}',
      '\uD835\uDE49': '\\mathsfbfsl{N}',
      '\uD835\uDE4A': '\\mathsfbfsl{O}',
      '\uD835\uDE4B': '\\mathsfbfsl{P}',
      '\uD835\uDE4C': '\\mathsfbfsl{Q}',
      '\uD835\uDE4D': '\\mathsfbfsl{R}',
      '\uD835\uDE4E': '\\mathsfbfsl{S}',
      '\uD835\uDE4F': '\\mathsfbfsl{T}',
      '\uD835\uDE50': '\\mathsfbfsl{U}',
      '\uD835\uDE51': '\\mathsfbfsl{V}',
      '\uD835\uDE52': '\\mathsfbfsl{W}',
      '\uD835\uDE53': '\\mathsfbfsl{X}',
      '\uD835\uDE54': '\\mathsfbfsl{Y}',
      '\uD835\uDE55': '\\mathsfbfsl{Z}',
      '\uD835\uDE56': '\\mathsfbfsl{a}',
      '\uD835\uDE57': '\\mathsfbfsl{b}',
      '\uD835\uDE58': '\\mathsfbfsl{c}',
      '\uD835\uDE59': '\\mathsfbfsl{d}',
      '\uD835\uDE5A': '\\mathsfbfsl{e}',
      '\uD835\uDE5B': '\\mathsfbfsl{f}',
      '\uD835\uDE5C': '\\mathsfbfsl{g}',
      '\uD835\uDE5D': '\\mathsfbfsl{h}',
      '\uD835\uDE5E': '\\mathsfbfsl{i}',
      '\uD835\uDE5F': '\\mathsfbfsl{j}',
      '\uD835\uDE60': '\\mathsfbfsl{k}',
      '\uD835\uDE61': '\\mathsfbfsl{l}',
      '\uD835\uDE62': '\\mathsfbfsl{m}',
      '\uD835\uDE63': '\\mathsfbfsl{n}',
      '\uD835\uDE64': '\\mathsfbfsl{o}',
      '\uD835\uDE65': '\\mathsfbfsl{p}',
      '\uD835\uDE66': '\\mathsfbfsl{q}',
      '\uD835\uDE67': '\\mathsfbfsl{r}',
      '\uD835\uDE68': '\\mathsfbfsl{s}',
      '\uD835\uDE69': '\\mathsfbfsl{t}',
      '\uD835\uDE6A': '\\mathsfbfsl{u}',
      '\uD835\uDE6B': '\\mathsfbfsl{v}',
      '\uD835\uDE6C': '\\mathsfbfsl{w}',
      '\uD835\uDE6D': '\\mathsfbfsl{x}',
      '\uD835\uDE6E': '\\mathsfbfsl{y}',
      '\uD835\uDE6F': '\\mathsfbfsl{z}',
      '\uD835\uDE70': '\\mathtt{A}',
      '\uD835\uDE71': '\\mathtt{B}',
      '\uD835\uDE72': '\\mathtt{C}',
      '\uD835\uDE73': '\\mathtt{D}',
      '\uD835\uDE74': '\\mathtt{E}',
      '\uD835\uDE75': '\\mathtt{F}',
      '\uD835\uDE76': '\\mathtt{G}',
      '\uD835\uDE77': '\\mathtt{H}',
      '\uD835\uDE78': '\\mathtt{I}',
      '\uD835\uDE79': '\\mathtt{J}',
      '\uD835\uDE7A': '\\mathtt{K}',
      '\uD835\uDE7B': '\\mathtt{L}',
      '\uD835\uDE7C': '\\mathtt{M}',
      '\uD835\uDE7D': '\\mathtt{N}',
      '\uD835\uDE7E': '\\mathtt{O}',
      '\uD835\uDE7F': '\\mathtt{P}',
      '\uD835\uDE80': '\\mathtt{Q}',
      '\uD835\uDE81': '\\mathtt{R}',
      '\uD835\uDE82': '\\mathtt{S}',
      '\uD835\uDE83': '\\mathtt{T}',
      '\uD835\uDE84': '\\mathtt{U}',
      '\uD835\uDE85': '\\mathtt{V}',
      '\uD835\uDE86': '\\mathtt{W}',
      '\uD835\uDE87': '\\mathtt{X}',
      '\uD835\uDE88': '\\mathtt{Y}',
      '\uD835\uDE89': '\\mathtt{Z}',
      '\uD835\uDE8A': '\\mathtt{a}',
      '\uD835\uDE8B': '\\mathtt{b}',
      '\uD835\uDE8C': '\\mathtt{c}',
      '\uD835\uDE8D': '\\mathtt{d}',
      '\uD835\uDE8E': '\\mathtt{e}',
      '\uD835\uDE8F': '\\mathtt{f}',
      '\uD835\uDE90': '\\mathtt{g}',
      '\uD835\uDE91': '\\mathtt{h}',
      '\uD835\uDE92': '\\mathtt{i}',
      '\uD835\uDE93': '\\mathtt{j}',
      '\uD835\uDE94': '\\mathtt{k}',
      '\uD835\uDE95': '\\mathtt{l}',
      '\uD835\uDE96': '\\mathtt{m}',
      '\uD835\uDE97': '\\mathtt{n}',
      '\uD835\uDE98': '\\mathtt{o}',
      '\uD835\uDE99': '\\mathtt{p}',
      '\uD835\uDE9A': '\\mathtt{q}',
      '\uD835\uDE9B': '\\mathtt{r}',
      '\uD835\uDE9C': '\\mathtt{s}',
      '\uD835\uDE9D': '\\mathtt{t}',
      '\uD835\uDE9E': '\\mathtt{u}',
      '\uD835\uDE9F': '\\mathtt{v}',
      '\uD835\uDEA0': '\\mathtt{w}',
      '\uD835\uDEA1': '\\mathtt{x}',
      '\uD835\uDEA2': '\\mathtt{y}',
      '\uD835\uDEA3': '\\mathtt{z}',
      '\uD835\uDEA4': '\\imath{}',
      '\uD835\uDEA5': '\\jmath{}',
      '\uD835\uDEA8': '\\mathbf{A}',
      '\uD835\uDEA9': '\\mathbf{B}',
      '\uD835\uDEAA': '\\mathbf{\\Gamma}',
      '\uD835\uDEAB': '\\mathbf{\\Delta}',
      '\uD835\uDEAC': '\\mathbf{E}',
      '\uD835\uDEAD': '\\mathbf{Z}',
      '\uD835\uDEAE': '\\mathbf{H}',
      '\uD835\uDEAF': '\\mathbf{\\Theta}',
      '\uD835\uDEB0': '\\mathbf{I}',
      '\uD835\uDEB1': '\\mathbf{K}',
      '\uD835\uDEB2': '\\mathbf{\\Lambda}',
      '\uD835\uDEB3': 'M',
      '\uD835\uDEB4': 'N',
      '\uD835\uDEB5': '\\mathbf{\\Xi}',
      '\uD835\uDEB6': 'O',
      '\uD835\uDEB7': '\\mathbf{\\Pi}',
      '\uD835\uDEB8': '\\mathbf{P}',
      '\uD835\uDEBA': '\\mathbf{\\Sigma}',
      '\uD835\uDEBB': '\\mathbf{T}',
      '\uD835\uDEBC': '\\mathbf{\\Upsilon}',
      '\uD835\uDEBD': '\\mathbf{\\Phi}',
      '\uD835\uDEBE': '\\mathbf{X}',
      '\uD835\uDEBF': '\\mathbf{\\Psi}',
      '\uD835\uDEC0': '\\mathbf{\\Omega}',
      '\uD835\uDEC1': '\\mathbf{\\nabla}',
      '\uD835\uDEC2': '\\mathbf{A}',
      '\uD835\uDEC3': '\\mathbf{B}',
      '\uD835\uDEC4': '\\mathbf{\\Gamma}',
      '\uD835\uDEC5': '\\mathbf{\\Delta}',
      '\uD835\uDEC6': '\\mathbf{E}',
      '\uD835\uDEC7': '\\mathbf{Z}',
      '\uD835\uDEC8': '\\mathbf{H}',
      '\uD835\uDEC9': '\\mathbf{\\theta}',
      '\uD835\uDECA': '\\mathbf{I}',
      '\uD835\uDECB': '\\mathbf{K}',
      '\uD835\uDECC': '\\mathbf{\\Lambda}',
      '\uD835\uDECD': 'M',
      '\uD835\uDECE': 'N',
      '\uD835\uDECF': '\\mathbf{\\Xi}',
      '\uD835\uDED0': 'O',
      '\uD835\uDED1': '\\mathbf{\\Pi}',
      '\uD835\uDED2': '\\mathbf{P}',
      '\uD835\uDED3': '\\mathbf{\\varsigma}',
      '\uD835\uDED4': '\\mathbf{\\Sigma}',
      '\uD835\uDED5': '\\mathbf{T}',
      '\uD835\uDED6': '\\mathbf{\\Upsilon}',
      '\uD835\uDED7': '\\mathbf{\\Phi}',
      '\uD835\uDED8': '\\mathbf{X}',
      '\uD835\uDED9': '\\mathbf{\\Psi}',
      '\uD835\uDEDA': '\\mathbf{\\Omega}',
      '\uD835\uDEDB': '\\partial{}',
      '\uD835\uDEDC': '\\in{}',
      '\uD835\uDEE2': '\\mathsl{A}',
      '\uD835\uDEE3': '\\mathsl{B}',
      '\uD835\uDEE4': '\\mathsl{\\Gamma}',
      '\uD835\uDEE5': '\\mathsl{\\Delta}',
      '\uD835\uDEE6': '\\mathsl{E}',
      '\uD835\uDEE7': '\\mathsl{Z}',
      '\uD835\uDEE8': '\\mathsl{H}',
      '\uD835\uDEE9': '\\mathsl{\\Theta}',
      '\uD835\uDEEA': '\\mathsl{I}',
      '\uD835\uDEEB': '\\mathsl{K}',
      '\uD835\uDEEC': '\\mathsl{\\Lambda}',
      '\uD835\uDEED': 'M',
      '\uD835\uDEEE': 'N',
      '\uD835\uDEEF': '\\mathsl{\\Xi}',
      '\uD835\uDEF0': 'O',
      '\uD835\uDEF1': '\\mathsl{\\Pi}',
      '\uD835\uDEF2': '\\mathsl{P}',
      '\uD835\uDEF4': '\\mathsl{\\Sigma}',
      '\uD835\uDEF5': '\\mathsl{T}',
      '\uD835\uDEF6': '\\mathsl{\\Upsilon}',
      '\uD835\uDEF7': '\\mathsl{\\Phi}',
      '\uD835\uDEF8': '\\mathsl{X}',
      '\uD835\uDEF9': '\\mathsl{\\Psi}',
      '\uD835\uDEFA': '\\mathsl{\\Omega}',
      '\uD835\uDEFB': '\\mathsl{\\nabla}',
      '\uD835\uDEFC': '\\mathsl{A}',
      '\uD835\uDEFD': '\\mathsl{B}',
      '\uD835\uDEFE': '\\mathsl{\\Gamma}',
      '\uD835\uDEFF': '\\mathsl{\\Delta}',
      '\uD835\uDF00': '\\mathsl{E}',
      '\uD835\uDF01': '\\mathsl{Z}',
      '\uD835\uDF02': '\\mathsl{H}',
      '\uD835\uDF03': '\\mathsl{\\Theta}',
      '\uD835\uDF04': '\\mathsl{I}',
      '\uD835\uDF05': '\\mathsl{K}',
      '\uD835\uDF06': '\\mathsl{\\Lambda}',
      '\uD835\uDF07': 'M',
      '\uD835\uDF08': 'N',
      '\uD835\uDF09': '\\mathsl{\\Xi}',
      '\uD835\uDF0A': 'O',
      '\uD835\uDF0B': '\\mathsl{\\Pi}',
      '\uD835\uDF0C': '\\mathsl{P}',
      '\uD835\uDF0D': '\\mathsl{\\varsigma}',
      '\uD835\uDF0E': '\\mathsl{\\Sigma}',
      '\uD835\uDF0F': '\\mathsl{T}',
      '\uD835\uDF10': '\\mathsl{\\Upsilon}',
      '\uD835\uDF11': '\\mathsl{\\Phi}',
      '\uD835\uDF12': '\\mathsl{X}',
      '\uD835\uDF13': '\\mathsl{\\Psi}',
      '\uD835\uDF14': '\\mathsl{\\Omega}',
      '\uD835\uDF15': '\\partial{}',
      '\uD835\uDF16': '\\in{}',
      '\uD835\uDF1C': '\\mathbit{A}',
      '\uD835\uDF1D': '\\mathbit{B}',
      '\uD835\uDF1E': '\\mathbit{\\Gamma}',
      '\uD835\uDF1F': '\\mathbit{\\Delta}',
      '\uD835\uDF20': '\\mathbit{E}',
      '\uD835\uDF21': '\\mathbit{Z}',
      '\uD835\uDF22': '\\mathbit{H}',
      '\uD835\uDF23': '\\mathbit{\\Theta}',
      '\uD835\uDF24': '\\mathbit{I}',
      '\uD835\uDF25': '\\mathbit{K}',
      '\uD835\uDF26': '\\mathbit{\\Lambda}',
      '\uD835\uDF27': 'M',
      '\uD835\uDF28': 'N',
      '\uD835\uDF29': '\\mathbit{\\Xi}',
      '\uD835\uDF2A': 'O',
      '\uD835\uDF2B': '\\mathbit{\\Pi}',
      '\uD835\uDF2C': '\\mathbit{P}',
      '\uD835\uDF2E': '\\mathbit{\\Sigma}',
      '\uD835\uDF2F': '\\mathbit{T}',
      '\uD835\uDF30': '\\mathbit{\\Upsilon}',
      '\uD835\uDF31': '\\mathbit{\\Phi}',
      '\uD835\uDF32': '\\mathbit{X}',
      '\uD835\uDF33': '\\mathbit{\\Psi}',
      '\uD835\uDF34': '\\mathbit{\\Omega}',
      '\uD835\uDF35': '\\mathbit{\\nabla}',
      '\uD835\uDF36': '\\mathbit{A}',
      '\uD835\uDF37': '\\mathbit{B}',
      '\uD835\uDF38': '\\mathbit{\\Gamma}',
      '\uD835\uDF39': '\\mathbit{\\Delta}',
      '\uD835\uDF3A': '\\mathbit{E}',
      '\uD835\uDF3B': '\\mathbit{Z}',
      '\uD835\uDF3C': '\\mathbit{H}',
      '\uD835\uDF3D': '\\mathbit{\\Theta}',
      '\uD835\uDF3E': '\\mathbit{I}',
      '\uD835\uDF3F': '\\mathbit{K}',
      '\uD835\uDF40': '\\mathbit{\\Lambda}',
      '\uD835\uDF41': 'M',
      '\uD835\uDF42': 'N',
      '\uD835\uDF43': '\\mathbit{\\Xi}',
      '\uD835\uDF44': 'O',
      '\uD835\uDF45': '\\mathbit{\\Pi}',
      '\uD835\uDF46': '\\mathbit{P}',
      '\uD835\uDF47': '\\mathbit{\\varsigma}',
      '\uD835\uDF48': '\\mathbit{\\Sigma}',
      '\uD835\uDF49': '\\mathbit{T}',
      '\uD835\uDF4A': '\\mathbit{\\Upsilon}',
      '\uD835\uDF4B': '\\mathbit{\\Phi}',
      '\uD835\uDF4C': '\\mathbit{X}',
      '\uD835\uDF4D': '\\mathbit{\\Psi}',
      '\uD835\uDF4E': '\\mathbit{\\Omega}',
      '\uD835\uDF4F': '\\partial{}',
      '\uD835\uDF50': '\\in{}',
      '\uD835\uDF56': '\\mathsfbf{A}',
      '\uD835\uDF57': '\\mathsfbf{B}',
      '\uD835\uDF58': '\\mathsfbf{\\Gamma}',
      '\uD835\uDF59': '\\mathsfbf{\\Delta}',
      '\uD835\uDF5A': '\\mathsfbf{E}',
      '\uD835\uDF5B': '\\mathsfbf{Z}',
      '\uD835\uDF5C': '\\mathsfbf{H}',
      '\uD835\uDF5D': '\\mathsfbf{\\Theta}',
      '\uD835\uDF5E': '\\mathsfbf{I}',
      '\uD835\uDF5F': '\\mathsfbf{K}',
      '\uD835\uDF60': '\\mathsfbf{\\Lambda}',
      '\uD835\uDF61': 'M',
      '\uD835\uDF62': 'N',
      '\uD835\uDF63': '\\mathsfbf{\\Xi}',
      '\uD835\uDF64': 'O',
      '\uD835\uDF65': '\\mathsfbf{\\Pi}',
      '\uD835\uDF66': '\\mathsfbf{P}',
      '\uD835\uDF68': '\\mathsfbf{\\Sigma}',
      '\uD835\uDF69': '\\mathsfbf{T}',
      '\uD835\uDF6A': '\\mathsfbf{\\Upsilon}',
      '\uD835\uDF6B': '\\mathsfbf{\\Phi}',
      '\uD835\uDF6C': '\\mathsfbf{X}',
      '\uD835\uDF6D': '\\mathsfbf{\\Psi}',
      '\uD835\uDF6E': '\\mathsfbf{\\Omega}',
      '\uD835\uDF6F': '\\mathsfbf{\\nabla}',
      '\uD835\uDF70': '\\mathsfbf{A}',
      '\uD835\uDF71': '\\mathsfbf{B}',
      '\uD835\uDF72': '\\mathsfbf{\\Gamma}',
      '\uD835\uDF73': '\\mathsfbf{\\Delta}',
      '\uD835\uDF74': '\\mathsfbf{E}',
      '\uD835\uDF75': '\\mathsfbf{Z}',
      '\uD835\uDF76': '\\mathsfbf{H}',
      '\uD835\uDF77': '\\mathsfbf{\\Theta}',
      '\uD835\uDF78': '\\mathsfbf{I}',
      '\uD835\uDF79': '\\mathsfbf{K}',
      '\uD835\uDF7A': '\\mathsfbf{\\Lambda}',
      '\uD835\uDF7B': 'M',
      '\uD835\uDF7C': 'N',
      '\uD835\uDF7D': '\\mathsfbf{\\Xi}',
      '\uD835\uDF7E': 'O',
      '\uD835\uDF7F': '\\mathsfbf{\\Pi}',
      '\uD835\uDF80': '\\mathsfbf{P}',
      '\uD835\uDF81': '\\mathsfbf{\\varsigma}',
      '\uD835\uDF82': '\\mathsfbf{\\Sigma}',
      '\uD835\uDF83': '\\mathsfbf{T}',
      '\uD835\uDF84': '\\mathsfbf{\\Upsilon}',
      '\uD835\uDF85': '\\mathsfbf{\\Phi}',
      '\uD835\uDF86': '\\mathsfbf{X}',
      '\uD835\uDF87': '\\mathsfbf{\\Psi}',
      '\uD835\uDF88': '\\mathsfbf{\\Omega}',
      '\uD835\uDF89': '\\partial{}',
      '\uD835\uDF8A': '\\in{}',
      '\uD835\uDF90': '\\mathsfbfsl{A}',
      '\uD835\uDF91': '\\mathsfbfsl{B}',
      '\uD835\uDF92': '\\mathsfbfsl{\\Gamma}',
      '\uD835\uDF93': '\\mathsfbfsl{\\Delta}',
      '\uD835\uDF94': '\\mathsfbfsl{E}',
      '\uD835\uDF95': '\\mathsfbfsl{Z}',
      '\uD835\uDF96': '\\mathsfbfsl{H}',
      '\uD835\uDF97': '\\mathsfbfsl{\\vartheta}',
      '\uD835\uDF98': '\\mathsfbfsl{I}',
      '\uD835\uDF99': '\\mathsfbfsl{K}',
      '\uD835\uDF9A': '\\mathsfbfsl{\\Lambda}',
      '\uD835\uDF9B': 'M',
      '\uD835\uDF9C': 'N',
      '\uD835\uDF9D': '\\mathsfbfsl{\\Xi}',
      '\uD835\uDF9E': 'O',
      '\uD835\uDF9F': '\\mathsfbfsl{\\Pi}',
      '\uD835\uDFA0': '\\mathsfbfsl{P}',
      '\uD835\uDFA2': '\\mathsfbfsl{\\Sigma}',
      '\uD835\uDFA3': '\\mathsfbfsl{T}',
      '\uD835\uDFA4': '\\mathsfbfsl{\\Upsilon}',
      '\uD835\uDFA5': '\\mathsfbfsl{\\Phi}',
      '\uD835\uDFA6': '\\mathsfbfsl{X}',
      '\uD835\uDFA7': '\\mathsfbfsl{\\Psi}',
      '\uD835\uDFA8': '\\mathsfbfsl{\\Omega}',
      '\uD835\uDFA9': '\\mathsfbfsl{\\nabla}',
      '\uD835\uDFAA': '\\mathsfbfsl{A}',
      '\uD835\uDFAB': '\\mathsfbfsl{B}',
      '\uD835\uDFAC': '\\mathsfbfsl{\\Gamma}',
      '\uD835\uDFAD': '\\mathsfbfsl{\\Delta}',
      '\uD835\uDFAE': '\\mathsfbfsl{E}',
      '\uD835\uDFAF': '\\mathsfbfsl{Z}',
      '\uD835\uDFB0': '\\mathsfbfsl{H}',
      '\uD835\uDFB1': '\\mathsfbfsl{\\vartheta}',
      '\uD835\uDFB2': '\\mathsfbfsl{I}',
      '\uD835\uDFB3': '\\mathsfbfsl{K}',
      '\uD835\uDFB4': '\\mathsfbfsl{\\Lambda}',
      '\uD835\uDFB5': 'M',
      '\uD835\uDFB6': 'N',
      '\uD835\uDFB7': '\\mathsfbfsl{\\Xi}',
      '\uD835\uDFB8': 'O',
      '\uD835\uDFB9': '\\mathsfbfsl{\\Pi}',
      '\uD835\uDFBA': '\\mathsfbfsl{P}',
      '\uD835\uDFBB': '\\mathsfbfsl{\\varsigma}',
      '\uD835\uDFBC': '\\mathsfbfsl{\\Sigma}',
      '\uD835\uDFBD': '\\mathsfbfsl{T}',
      '\uD835\uDFBE': '\\mathsfbfsl{\\Upsilon}',
      '\uD835\uDFBF': '\\mathsfbfsl{\\Phi}',
      '\uD835\uDFC0': '\\mathsfbfsl{X}',
      '\uD835\uDFC1': '\\mathsfbfsl{\\Psi}',
      '\uD835\uDFC2': '\\mathsfbfsl{\\Omega}',
      '\uD835\uDFC3': '\\partial{}',
      '\uD835\uDFC4': '\\in{}',
      '\uD835\uDFCA': '\\mbfDigamma{}',
      '\uD835\uDFCB': '\\mbfdigamma{}',
      '\uD835\uDFCE': '\\mathbf{0}',
      '\uD835\uDFCF': '\\mathbf{1}',
      '\uD835\uDFD0': '\\mathbf{2}',
      '\uD835\uDFD1': '\\mathbf{3}',
      '\uD835\uDFD2': '\\mathbf{4}',
      '\uD835\uDFD3': '\\mathbf{5}',
      '\uD835\uDFD4': '\\mathbf{6}',
      '\uD835\uDFD5': '\\mathbf{7}',
      '\uD835\uDFD6': '\\mathbf{8}',
      '\uD835\uDFD7': '\\mathbf{9}',
      '\uD835\uDFD8': '\\mathbb{0}',
      '\uD835\uDFD9': '\\mathbb{1}',
      '\uD835\uDFDA': '\\mathbb{2}',
      '\uD835\uDFDB': '\\mathbb{3}',
      '\uD835\uDFDC': '\\mathbb{4}',
      '\uD835\uDFDD': '\\mathbb{5}',
      '\uD835\uDFDE': '\\mathbb{6}',
      '\uD835\uDFDF': '\\mathbb{7}',
      '\uD835\uDFE0': '\\mathbb{8}',
      '\uD835\uDFE1': '\\mathbb{9}',
      '\uD835\uDFE2': '\\mathsf{0}',
      '\uD835\uDFE3': '\\mathsf{1}',
      '\uD835\uDFE4': '\\mathsf{2}',
      '\uD835\uDFE5': '\\mathsf{3}',
      '\uD835\uDFE6': '\\mathsf{4}',
      '\uD835\uDFE7': '\\mathsf{5}',
      '\uD835\uDFE8': '\\mathsf{6}',
      '\uD835\uDFE9': '\\mathsf{7}',
      '\uD835\uDFEA': '\\mathsf{8}',
      '\uD835\uDFEB': '\\mathsf{9}',
      '\uD835\uDFEC': '\\mathsfbf{0}',
      '\uD835\uDFED': '\\mathsfbf{1}',
      '\uD835\uDFEE': '\\mathsfbf{2}',
      '\uD835\uDFEF': '\\mathsfbf{3}',
      '\uD835\uDFF0': '\\mathsfbf{4}',
      '\uD835\uDFF1': '\\mathsfbf{5}',
      '\uD835\uDFF2': '\\mathsfbf{6}',
      '\uD835\uDFF3': '\\mathsfbf{7}',
      '\uD835\uDFF4': '\\mathsfbf{8}',
      '\uD835\uDFF5': '\\mathsfbf{9}',
      '\uD835\uDFF6': '\\mathtt{0}',
      '\uD835\uDFF7': '\\mathtt{1}',
      '\uD835\uDFF8': '\\mathtt{2}',
      '\uD835\uDFF9': '\\mathtt{3}',
      '\uD835\uDFFA': '\\mathtt{4}',
      '\uD835\uDFFB': '\\mathtt{5}',
      '\uD835\uDFFC': '\\mathtt{6}',
      '\uD835\uDFFD': '\\mathtt{7}',
      '\uD835\uDFFE': '\\mathtt{8}',
      '\uD835\uDFFF': '\\mathtt{9}'
    },
    'text': {
      '#': '\\#',
      '$': '\\$',
      '%': '\\%',
      '&': '\\&',
      '^': '\\^',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '~': '\\textasciitilde{}',
      '\xA0': '~',
      '\xA1': '\\textexclamdown{}',
      '\xA2': '\\textcent{}',
      '\xA3': '\\textsterling{}',
      '\xA4': '\\textcurrency{}',
      '\xA5': '\\textyen{}',
      '\xA6': '\\textbrokenbar{}',
      '\xA7': '\\textsection{}',
      '\xA8': '\\textasciidieresis{}',
      '\xA9': '\\textcopyright{}',
      '\xAA': '\\textordfeminine{}',
      '\xAB': '\\guillemotleft{}',
      '\xAE': '\\textregistered{}',
      '\xAF': '\\textasciimacron{}',
      '\xB4': '\\textasciiacute{}',
      '\xB6': '\\textparagraph{}',
      '\xB8': '\\c{}',
      '\xBA': '\\textordmasculine{}',
      '\xBB': '\\guillemotright{}',
      '\xBC': '\\textonequarter{}',
      '\xBD': '\\textonehalf{}',
      '\xBE': '\\textthreequarters{}',
      '\xBF': '\\textquestiondown{}',
      '\xC0': '{\\`A}',
      '\xC1': '{\\\'A}',
      '\xC2': '{\\^A}',
      '\xC3': '{\\~A}',
      '\xC4': '{\\"A}',
      '\xC5': '\\AA{}',
      '\xC6': '{\\AE}',
      '\xC7': '{\\c C}',
      '\xC8': '{\\`E}',
      '\xC9': '{\\\'E}',
      '\xCA': '{\\^E}',
      '\xCB': '{\\"E}',
      '\xCC': '{\\`I}',
      '\xCD': '{\\\'I}',
      '\xCE': '{\\^I}',
      '\xCF': '{\\"I}',
      '\xD0': '{\\DH}',
      '\xD1': '{\\~N}',
      '\xD2': '{\\`O}',
      '\xD3': '{\\\'O}',
      '\xD4': '{\\^O}',
      '\xD5': '{\\~O}',
      '\xD6': '{\\"O}',
      '\xD7': '\\texttimes{}',
      '\xD8': '{\\O}',
      '\xD9': '{\\`U}',
      '\xDA': '{\\\'U}',
      '\xDB': '{\\^U}',
      '\xDC': '{\\"U}',
      '\xDD': '{\\\'Y}',
      '\xDE': '{\\TH}',
      '\xDF': '{\\ss}',
      '\xE0': '{\\`a}',
      '\xE1': '{\\\'a}',
      '\xE2': '{\\^a}',
      '\xE3': '{\\~a}',
      '\xE4': '{\\"a}',
      '\xE5': '{\\aa}',
      '\xE6': '{\\ae}',
      '\xE7': '{\\c c}',
      '\xE8': '{\\`e}',
      '\xE9': '{\\\'e}',
      '\xEA': '{\\^e}',
      '\xEB': '{\\"e}',
      '\xEC': '{\\`\\i}',
      '\xED': '{\\\'\\i}',
      '\xEE': '{\\^\\i}',
      '\xEF': '{\\"\\i}',
      '\xF0': '{\\dh}',
      '\xF1': '{\\~n}',
      '\xF2': '{\\`o}',
      '\xF3': '{\\\'o}',
      '\xF4': '{\\^o}',
      '\xF5': '{\\~o}',
      '\xF6': '{\\"o}',
      '\xF8': '{\\o}',
      '\xF9': '{\\`u}',
      '\xFA': '{\\\'u}',
      '\xFB': '{\\^u}',
      '\xFC': '{\\"u}',
      '\xFD': '{\\\'y}',
      '\xFE': '{\\th}',
      '\xFF': '{\\"y}',
      '\u0100': '{\\=A}',
      '\u0101': '{\\=a}',
      '\u0102': '{\\u A}',
      '\u0103': '{\\u a}',
      '\u0104': '\\k{A}',
      '\u0105': '\\k{a}',
      '\u0106': '{\\\'C}',
      '\u0107': '{\\\'c}',
      '\u0108': '{\\^C}',
      '\u0109': '{\\^c}',
      '\u010A': '{\\.C}',
      '\u010B': '{\\.c}',
      '\u010C': '{\\v C}',
      '\u010D': '{\\v c}',
      '\u010E': '{\\v D}',
      '\u010F': '{\\v d}',
      '\u0110': '{\\DJ}',
      '\u0111': '{\\dj}',
      '\u0112': '{\\=E}',
      '\u0113': '{\\=e}',
      '\u0114': '{\\u E}',
      '\u0115': '{\\u e}',
      '\u0116': '{\\.E}',
      '\u0117': '{\\.e}',
      '\u0118': '\\k{E}',
      '\u0119': '\\k{e}',
      '\u011A': '{\\v E}',
      '\u011B': '{\\v e}',
      '\u011C': '{\\^G}',
      '\u011D': '{\\^g}',
      '\u011E': '{\\u G}',
      '\u011F': '{\\u g}',
      '\u0120': '{\\.G}',
      '\u0121': '{\\.g}',
      '\u0122': '{\\c G}',
      '\u0123': '{\\c g}',
      '\u0124': '{\\^H}',
      '\u0125': '{\\^h}',
      '\u0126': '{\\fontencoding{LELA}\\selectfont\\char40}',
      '\u0128': '{\\~I}',
      '\u0129': '{\\~\\i}',
      '\u012A': '{\\=I}',
      '\u012B': '\\={\\i}',
      '\u012C': '{\\u I}',
      '\u012D': '{\\u \\i}',
      '\u012E': '\\k{I}',
      '\u012F': '\\k{i}',
      '\u0130': '{\\.I}',
      '\u0131': '{\\i}',
      '\u0132': 'IJ',
      '\u0133': 'ij',
      '\u0134': '{\\^J}',
      '\u0135': '{\\^\\j}',
      '\u0136': '{\\c K}',
      '\u0137': '{\\c k}',
      '\u0138': '{\\fontencoding{LELA}\\selectfont\\char91}',
      '\u0139': '{\\\'L}',
      '\u013A': '{\\\'l}',
      '\u013B': '{\\c L}',
      '\u013C': '{\\c l}',
      '\u013D': '{\\v L}',
      '\u013E': '{\\v l}',
      '\u013F': '{\\fontencoding{LELA}\\selectfont\\char201}',
      '\u0140': '{\\fontencoding{LELA}\\selectfont\\char202}',
      '\u0141': '{\\L}',
      '\u0142': '{\\l}',
      '\u0143': '{\\\'N}',
      '\u0144': '{\\\'n}',
      '\u0145': '{\\c N}',
      '\u0146': '{\\c n}',
      '\u0147': '{\\v N}',
      '\u0148': '{\\v n}',
      '\u0149': '\'n',
      '\u014A': '{\\NG}',
      '\u014B': '{\\ng}',
      '\u014C': '{\\=O}',
      '\u014D': '{\\=o}',
      '\u014E': '{\\u O}',
      '\u014F': '{\\u o}',
      '\u0150': '{\\H O}',
      '\u0151': '{\\H o}',
      '\u0152': '{\\OE}',
      '\u0153': '{\\oe}',
      '\u0154': '{\\\'R}',
      '\u0155': '{\\\'r}',
      '\u0156': '{\\c R}',
      '\u0157': '{\\c r}',
      '\u0158': '{\\v R}',
      '\u0159': '{\\v r}',
      '\u015A': '{\\\'S}',
      '\u015B': '{\\\'s}',
      '\u015C': '{\\^S}',
      '\u015D': '{\\^s}',
      '\u015E': '{\\c S}',
      '\u015F': '{\\c s}',
      '\u0160': '{\\v S}',
      '\u0161': '{\\v s}',
      '\u0162': '{\\c T}',
      '\u0163': '{\\c t}',
      '\u0164': '{\\v T}',
      '\u0165': '{\\v t}',
      '\u0166': '{\\fontencoding{LELA}\\selectfont\\char47}',
      '\u0167': '{\\fontencoding{LELA}\\selectfont\\char63}',
      '\u0168': '{\\~U}',
      '\u0169': '{\\~u}',
      '\u016A': '{\\=U}',
      '\u016B': '{\\=u}',
      '\u016C': '{\\u U}',
      '\u016D': '{\\u u}',
      '\u016E': '\\r{U}',
      '\u016F': '\\r{u}',
      '\u0170': '{\\H U}',
      '\u0171': '{\\H u}',
      '\u0172': '\\k{U}',
      '\u0173': '\\k{u}',
      '\u0174': '{\\^W}',
      '\u0175': '{\\^w}',
      '\u0176': '{\\^Y}',
      '\u0177': '{\\^y}',
      '\u0178': '{\\"Y}',
      '\u0179': '{\\\'Z}',
      '\u017A': '{\\\'z}',
      '\u017B': '{\\.Z}',
      '\u017C': '{\\.z}',
      '\u017D': '{\\v Z}',
      '\u017E': '{\\v z}',
      '\u0195': '{\\texthvlig}',
      '\u019E': '{\\textnrleg}',
      '\u01BA': '{\\fontencoding{LELA}\\selectfont\\char195}',
      '\u01C2': '{\\textdoublepipe}',
      '\u01F5': '{\\\'g}',
      '\u0258': '{\\fontencoding{LEIP}\\selectfont\\char61}',
      '\u0261': 'g',
      '\u0272': '\\Elzltln{}',
      '\u0278': '\\textphi{}',
      '\u027F': '{\\fontencoding{LEIP}\\selectfont\\char202}',
      '\u029E': '\\textturnk{}',
      '\u02BC': '\'',
      '\u02C7': '\\textasciicaron{}',
      '\u02D8': '\\textasciibreve{}',
      '\u02D9': '\\textperiodcentered{}',
      '\u02DA': '\\r{}',
      '\u02DB': '\\k{}',
      '\u02DC': '\\texttildelow{}',
      '\u02DD': '\\H{}',
      '\u02E5': '\\tone{55}',
      '\u02E6': '\\tone{44}',
      '\u02E7': '\\tone{33}',
      '\u02E8': '\\tone{22}',
      '\u02E9': '\\tone{11}',
      '\u0300': '\\`',
      '\u0301': '\\\'',
      '\u0302': '\\^',
      '\u0303': '\\~',
      '\u0304': '\\=',
      '\u0306': '\\u{}',
      '\u0307': '\\.',
      '\u0308': '\\"',
      '\u030A': '\\r{}',
      '\u030B': '\\H{}',
      '\u030C': '\\v{}',
      '\u030F': '\\cyrchar\\C{}',
      '\u0311': '{\\fontencoding{LECO}\\selectfont\\char177}',
      '\u0318': '{\\fontencoding{LECO}\\selectfont\\char184}',
      '\u0319': '{\\fontencoding{LECO}\\selectfont\\char185}',
      '\u0322': '\\Elzrh{}',
      '\u0327': '\\c{}',
      '\u0328': '\\k{}',
      '\u032B': '{\\fontencoding{LECO}\\selectfont\\char203}',
      '\u032F': '{\\fontencoding{LECO}\\selectfont\\char207}',
      '\u0335': '\\Elzxl{}',
      '\u0336': '\\Elzbar{}',
      '\u0337': '{\\fontencoding{LECO}\\selectfont\\char215}',
      '\u0338': '{\\fontencoding{LECO}\\selectfont\\char216}',
      '\u033A': '{\\fontencoding{LECO}\\selectfont\\char218}',
      '\u033B': '{\\fontencoding{LECO}\\selectfont\\char219}',
      '\u033C': '{\\fontencoding{LECO}\\selectfont\\char220}',
      '\u033D': '{\\fontencoding{LECO}\\selectfont\\char221}',
      '\u0361': '{\\fontencoding{LECO}\\selectfont\\char225}',
      '\u0386': '{\\\'A}',
      '\u0388': '{\\\'E}',
      '\u0389': '{\\\'H}',
      '\u038A': '\\\'{}{I}',
      '\u038C': '{\\\'{}O}',
      '\u03AC': '{\\\'$\\alpha$}',
      '\u03B8': '\\texttheta{}',
      '\u03CC': '{\\\'o}',
      '\u03D0': '\\Pisymbol{ppi022}{87}',
      '\u03D1': '\\textvartheta{}',
      '\u03F4': '\\textTheta{}',
      '\u0401': '\\cyrchar\\CYRYO{}',
      '\u0402': '\\cyrchar\\CYRDJE{}',
      '\u0403': '\\cyrchar{\\\'\\CYRG}',
      '\u0404': '\\cyrchar\\CYRIE{}',
      '\u0405': '\\cyrchar\\CYRDZE{}',
      '\u0406': '\\cyrchar\\CYRII{}',
      '\u0407': '\\cyrchar\\CYRYI{}',
      '\u0408': '\\cyrchar\\CYRJE{}',
      '\u0409': '\\cyrchar\\CYRLJE{}',
      '\u040A': '\\cyrchar\\CYRNJE{}',
      '\u040B': '\\cyrchar\\CYRTSHE{}',
      '\u040C': '\\cyrchar{\\\'\\CYRK}',
      '\u040E': '\\cyrchar\\CYRUSHRT{}',
      '\u040F': '\\cyrchar\\CYRDZHE{}',
      '\u0410': '\\cyrchar\\CYRA{}',
      '\u0411': '\\cyrchar\\CYRB{}',
      '\u0412': '\\cyrchar\\CYRV{}',
      '\u0413': '\\cyrchar\\CYRG{}',
      '\u0414': '\\cyrchar\\CYRD{}',
      '\u0415': '\\cyrchar\\CYRE{}',
      '\u0416': '\\cyrchar\\CYRZH{}',
      '\u0417': '\\cyrchar\\CYRZ{}',
      '\u0418': '\\cyrchar\\CYRI{}',
      '\u0419': '\\cyrchar\\CYRISHRT{}',
      '\u041A': '\\cyrchar\\CYRK{}',
      '\u041B': '\\cyrchar\\CYRL{}',
      '\u041C': '\\cyrchar\\CYRM{}',
      '\u041D': '\\cyrchar\\CYRN{}',
      '\u041E': '\\cyrchar\\CYRO{}',
      '\u041F': '\\cyrchar\\CYRP{}',
      '\u0420': '\\cyrchar\\CYRR{}',
      '\u0421': '\\cyrchar\\CYRS{}',
      '\u0422': '\\cyrchar\\CYRT{}',
      '\u0423': '\\cyrchar\\CYRU{}',
      '\u0424': '\\cyrchar\\CYRF{}',
      '\u0425': '\\cyrchar\\CYRH{}',
      '\u0426': '\\cyrchar\\CYRC{}',
      '\u0427': '\\cyrchar\\CYRCH{}',
      '\u0428': '\\cyrchar\\CYRSH{}',
      '\u0429': '\\cyrchar\\CYRSHCH{}',
      '\u042A': '\\cyrchar\\CYRHRDSN{}',
      '\u042B': '\\cyrchar\\CYRERY{}',
      '\u042C': '\\cyrchar\\CYRSFTSN{}',
      '\u042D': '\\cyrchar\\CYREREV{}',
      '\u042E': '\\cyrchar\\CYRYU{}',
      '\u042F': '\\cyrchar\\CYRYA{}',
      '\u0430': '\\cyrchar\\cyra{}',
      '\u0431': '\\cyrchar\\cyrb{}',
      '\u0432': '\\cyrchar\\cyrv{}',
      '\u0433': '\\cyrchar\\cyrg{}',
      '\u0434': '\\cyrchar\\cyrd{}',
      '\u0435': '\\cyrchar\\cyre{}',
      '\u0436': '\\cyrchar\\cyrzh{}',
      '\u0437': '\\cyrchar\\cyrz{}',
      '\u0438': '\\cyrchar\\cyri{}',
      '\u0439': '\\cyrchar\\cyrishrt{}',
      '\u043A': '\\cyrchar\\cyrk{}',
      '\u043B': '\\cyrchar\\cyrl{}',
      '\u043C': '\\cyrchar\\cyrm{}',
      '\u043D': '\\cyrchar\\cyrn{}',
      '\u043E': '\\cyrchar\\cyro{}',
      '\u043F': '\\cyrchar\\cyrp{}',
      '\u0440': '\\cyrchar\\cyrr{}',
      '\u0441': '\\cyrchar\\cyrs{}',
      '\u0442': '\\cyrchar\\cyrt{}',
      '\u0443': '\\cyrchar\\cyru{}',
      '\u0444': '\\cyrchar\\cyrf{}',
      '\u0445': '\\cyrchar\\cyrh{}',
      '\u0446': '\\cyrchar\\cyrc{}',
      '\u0447': '\\cyrchar\\cyrch{}',
      '\u0448': '\\cyrchar\\cyrsh{}',
      '\u0449': '\\cyrchar\\cyrshch{}',
      '\u044A': '\\cyrchar\\cyrhrdsn{}',
      '\u044B': '\\cyrchar\\cyrery{}',
      '\u044C': '\\cyrchar\\cyrsftsn{}',
      '\u044D': '\\cyrchar\\cyrerev{}',
      '\u044E': '\\cyrchar\\cyryu{}',
      '\u044F': '\\cyrchar\\cyrya{}',
      '\u0451': '\\cyrchar\\cyryo{}',
      '\u0452': '\\cyrchar\\cyrdje{}',
      '\u0453': '\\cyrchar{\\\'\\cyrg}',
      '\u0454': '\\cyrchar\\cyrie{}',
      '\u0455': '\\cyrchar\\cyrdze{}',
      '\u0456': '\\cyrchar\\cyrii{}',
      '\u0457': '\\cyrchar\\cyryi{}',
      '\u0458': '\\cyrchar\\cyrje{}',
      '\u0459': '\\cyrchar\\cyrlje{}',
      '\u045A': '\\cyrchar\\cyrnje{}',
      '\u045B': '\\cyrchar\\cyrtshe{}',
      '\u045C': '\\cyrchar{\\\'\\cyrk}',
      '\u045E': '\\cyrchar\\cyrushrt{}',
      '\u045F': '\\cyrchar\\cyrdzhe{}',
      '\u0460': '\\cyrchar\\CYROMEGA{}',
      '\u0461': '\\cyrchar\\cyromega{}',
      '\u0462': '\\cyrchar\\CYRYAT{}',
      '\u0464': '\\cyrchar\\CYRIOTE{}',
      '\u0465': '\\cyrchar\\cyriote{}',
      '\u0466': '\\cyrchar\\CYRLYUS{}',
      '\u0467': '\\cyrchar\\cyrlyus{}',
      '\u0468': '\\cyrchar\\CYRIOTLYUS{}',
      '\u0469': '\\cyrchar\\cyriotlyus{}',
      '\u046A': '\\cyrchar\\CYRBYUS{}',
      '\u046C': '\\cyrchar\\CYRIOTBYUS{}',
      '\u046D': '\\cyrchar\\cyriotbyus{}',
      '\u046E': '\\cyrchar\\CYRKSI{}',
      '\u046F': '\\cyrchar\\cyrksi{}',
      '\u0470': '\\cyrchar\\CYRPSI{}',
      '\u0471': '\\cyrchar\\cyrpsi{}',
      '\u0472': '\\cyrchar\\CYRFITA{}',
      '\u0474': '\\cyrchar\\CYRIZH{}',
      '\u0478': '\\cyrchar\\CYRUK{}',
      '\u0479': '\\cyrchar\\cyruk{}',
      '\u047A': '\\cyrchar\\CYROMEGARND{}',
      '\u047B': '\\cyrchar\\cyromegarnd{}',
      '\u047C': '\\cyrchar\\CYROMEGATITLO{}',
      '\u047D': '\\cyrchar\\cyromegatitlo{}',
      '\u047E': '\\cyrchar\\CYROT{}',
      '\u047F': '\\cyrchar\\cyrot{}',
      '\u0480': '\\cyrchar\\CYRKOPPA{}',
      '\u0481': '\\cyrchar\\cyrkoppa{}',
      '\u0482': '\\cyrchar\\cyrthousands{}',
      '\u0488': '\\cyrchar\\cyrhundredthousands{}',
      '\u0489': '\\cyrchar\\cyrmillions{}',
      '\u048C': '\\cyrchar\\CYRSEMISFTSN{}',
      '\u048D': '\\cyrchar\\cyrsemisftsn{}',
      '\u048E': '\\cyrchar\\CYRRTICK{}',
      '\u048F': '\\cyrchar\\cyrrtick{}',
      '\u0490': '\\cyrchar\\CYRGUP{}',
      '\u0491': '\\cyrchar\\cyrgup{}',
      '\u0492': '\\cyrchar\\CYRGHCRS{}',
      '\u0493': '\\cyrchar\\cyrghcrs{}',
      '\u0494': '\\cyrchar\\CYRGHK{}',
      '\u0495': '\\cyrchar\\cyrghk{}',
      '\u0496': '\\cyrchar\\CYRZHDSC{}',
      '\u0497': '\\cyrchar\\cyrzhdsc{}',
      '\u0498': '\\cyrchar\\CYRZDSC{}',
      '\u0499': '\\cyrchar\\cyrzdsc{}',
      '\u049A': '\\cyrchar\\CYRKDSC{}',
      '\u049B': '\\cyrchar\\cyrkdsc{}',
      '\u049C': '\\cyrchar\\CYRKVCRS{}',
      '\u049D': '\\cyrchar\\cyrkvcrs{}',
      '\u049E': '\\cyrchar\\CYRKHCRS{}',
      '\u049F': '\\cyrchar\\cyrkhcrs{}',
      '\u04A0': '\\cyrchar\\CYRKBEAK{}',
      '\u04A1': '\\cyrchar\\cyrkbeak{}',
      '\u04A2': '\\cyrchar\\CYRNDSC{}',
      '\u04A3': '\\cyrchar\\cyrndsc{}',
      '\u04A4': '\\cyrchar\\CYRNG{}',
      '\u04A5': '\\cyrchar\\cyrng{}',
      '\u04A6': '\\cyrchar\\CYRPHK{}',
      '\u04A7': '\\cyrchar\\cyrphk{}',
      '\u04A8': '\\cyrchar\\CYRABHHA{}',
      '\u04A9': '\\cyrchar\\cyrabhha{}',
      '\u04AA': '\\cyrchar\\CYRSDSC{}',
      '\u04AB': '\\cyrchar\\cyrsdsc{}',
      '\u04AC': '\\cyrchar\\CYRTDSC{}',
      '\u04AD': '\\cyrchar\\cyrtdsc{}',
      '\u04AE': '\\cyrchar\\CYRY{}',
      '\u04AF': '\\cyrchar\\cyry{}',
      '\u04B0': '\\cyrchar\\CYRYHCRS{}',
      '\u04B1': '\\cyrchar\\cyryhcrs{}',
      '\u04B2': '\\cyrchar\\CYRHDSC{}',
      '\u04B3': '\\cyrchar\\cyrhdsc{}',
      '\u04B4': '\\cyrchar\\CYRTETSE{}',
      '\u04B5': '\\cyrchar\\cyrtetse{}',
      '\u04B6': '\\cyrchar\\CYRCHRDSC{}',
      '\u04B7': '\\cyrchar\\cyrchrdsc{}',
      '\u04B8': '\\cyrchar\\CYRCHVCRS{}',
      '\u04B9': '\\cyrchar\\cyrchvcrs{}',
      '\u04BA': '\\cyrchar\\CYRSHHA{}',
      '\u04BB': '\\cyrchar\\cyrshha{}',
      '\u04BC': '\\cyrchar\\CYRABHCH{}',
      '\u04BD': '\\cyrchar\\cyrabhch{}',
      '\u04BE': '\\cyrchar\\CYRABHCHDSC{}',
      '\u04BF': '\\cyrchar\\cyrabhchdsc{}',
      '\u04C0': '\\cyrchar\\CYRpalochka{}',
      '\u04C3': '\\cyrchar\\CYRKHK{}',
      '\u04C4': '\\cyrchar\\cyrkhk{}',
      '\u04C7': '\\cyrchar\\CYRNHK{}',
      '\u04C8': '\\cyrchar\\cyrnhk{}',
      '\u04CB': '\\cyrchar\\CYRCHLDSC{}',
      '\u04CC': '\\cyrchar\\cyrchldsc{}',
      '\u04D4': '\\cyrchar\\CYRAE{}',
      '\u04D5': '\\cyrchar\\cyrae{}',
      '\u04D8': '\\cyrchar\\CYRSCHWA{}',
      '\u04D9': '\\cyrchar\\cyrschwa{}',
      '\u04E0': '\\cyrchar\\CYRABHDZE{}',
      '\u04E1': '\\cyrchar\\cyrabhdze{}',
      '\u04E8': '\\cyrchar\\CYROTLD{}',
      '\u04E9': '\\cyrchar\\cyrotld{}',
      '\u2002': '\\hspace{0.6em}',
      '\u2003': '\\quad{}',
      '\u2004': '\\;',
      '\u2005': '\\hspace{0.25em}',
      '\u2006': '\\hspace{0.166em}',
      '\u2007': '\\hphantom{0}',
      '\u2008': '\\hphantom{,}',
      '\u2009': '\\,',
      '\u200B': '\\mbox{}',
      '\u200C': '{\\aftergroup\\ignorespaces}',
      '\u2010': '-',
      '\u2013': '\\textendash{}',
      '\u2014': '\\textemdash{}',
      '\u2015': '\\rule{1em}{1pt}',
      '\u2018': '`',
      '\u2019': '\'',
      '\u201A': ',',
      '\u201C': '``',
      '\u201D': '\'\'',
      '\u201E': ',,',
      '\u2020': '\\textdagger{}',
      '\u2021': '\\textdaggerdbl{}',
      '\u2022': '\\textbullet{}',
      '\u2024': '.',
      '\u2025': '..',
      '\u2026': '\\ldots{}',
      '\u2030': '\\textperthousand{}',
      '\u2031': '\\textpertenthousand{}',
      '\u2039': '\\guilsinglleft{}',
      '\u203A': '\\guilsinglright{}',
      '\u205F': '\\:',
      '\u2060': '\\nolinebreak{}',
      '\u20A7': '\\ensuremath{\\Elzpes}',
      '\u20AC': '\\texteuro{}',
      '\u210A': '\\mathscr{g}',
      '\u2116': '\\cyrchar\\textnumero{}',
      '\u2122': '\\texttrademark{}',
      '\u2212': '-',
      '\u2254': ':=',
      '\u2305': '\\barwedge{}',
      '\u2423': '\\textvisiblespace{}',
      '\u2460': '\\ding{172}',
      '\u2461': '\\ding{173}',
      '\u2462': '\\ding{174}',
      '\u2463': '\\ding{175}',
      '\u2464': '\\ding{176}',
      '\u2465': '\\ding{177}',
      '\u2466': '\\ding{178}',
      '\u2467': '\\ding{179}',
      '\u2468': '\\ding{180}',
      '\u2469': '\\ding{181}',
      '\u25A0': '\\ding{110}',
      '\u25B2': '\\ding{115}',
      '\u25BC': '\\ding{116}',
      '\u25C6': '\\ding{117}',
      '\u25CF': '\\ding{108}',
      '\u25D7': '\\ding{119}',
      '\u2605': '\\ding{72}',
      '\u2606': '\\ding{73}',
      '\u260E': '\\ding{37}',
      '\u261B': '\\ding{42}',
      '\u261E': '\\ding{43}',
      '\u263E': '\\rightmoon{}',
      '\u263F': '\\mercury{}',
      '\u2640': '\\venus{}',
      '\u2642': '\\male{}',
      '\u2643': '\\jupiter{}',
      '\u2644': '\\saturn{}',
      '\u2645': '\\uranus{}',
      '\u2646': '\\neptune{}',
      '\u2647': '\\pluto{}',
      '\u2648': '\\aries{}',
      '\u2649': '\\taurus{}',
      '\u264A': '\\gemini{}',
      '\u264B': '\\cancer{}',
      '\u264C': '\\leo{}',
      '\u264D': '\\virgo{}',
      '\u264E': '\\libra{}',
      '\u264F': '\\scorpio{}',
      '\u2650': '\\sagittarius{}',
      '\u2651': '\\capricornus{}',
      '\u2652': '\\aquarius{}',
      '\u2653': '\\pisces{}',
      '\u2660': '\\ding{171}',
      '\u2663': '\\ding{168}',
      '\u2665': '\\ding{170}',
      '\u2666': '\\ding{169}',
      '\u2669': '\\quarternote{}',
      '\u266A': '\\eighthnote{}',
      '\u2701': '\\ding{33}',
      '\u2702': '\\ding{34}',
      '\u2703': '\\ding{35}',
      '\u2704': '\\ding{36}',
      '\u2706': '\\ding{38}',
      '\u2707': '\\ding{39}',
      '\u2708': '\\ding{40}',
      '\u2709': '\\ding{41}',
      '\u270C': '\\ding{44}',
      '\u270D': '\\ding{45}',
      '\u270E': '\\ding{46}',
      '\u270F': '\\ding{47}',
      '\u2710': '\\ding{48}',
      '\u2711': '\\ding{49}',
      '\u2712': '\\ding{50}',
      '\u2713': '\\ding{51}',
      '\u2714': '\\ding{52}',
      '\u2715': '\\ding{53}',
      '\u2716': '\\ding{54}',
      '\u2717': '\\ding{55}',
      '\u2718': '\\ding{56}',
      '\u2719': '\\ding{57}',
      '\u271A': '\\ding{58}',
      '\u271B': '\\ding{59}',
      '\u271C': '\\ding{60}',
      '\u271D': '\\ding{61}',
      '\u271E': '\\ding{62}',
      '\u271F': '\\ding{63}',
      '\u2720': '\\ding{64}',
      '\u2721': '\\ding{65}',
      '\u2722': '\\ding{66}',
      '\u2723': '\\ding{67}',
      '\u2724': '\\ding{68}',
      '\u2725': '\\ding{69}',
      '\u2726': '\\ding{70}',
      '\u2727': '\\ding{71}',
      '\u2729': '\\ding{73}',
      '\u272A': '\\ding{74}',
      '\u272B': '\\ding{75}',
      '\u272C': '\\ding{76}',
      '\u272D': '\\ding{77}',
      '\u272E': '\\ding{78}',
      '\u272F': '\\ding{79}',
      '\u2730': '\\ding{80}',
      '\u2731': '\\ding{81}',
      '\u2732': '\\ding{82}',
      '\u2733': '\\ding{83}',
      '\u2734': '\\ding{84}',
      '\u2735': '\\ding{85}',
      '\u2736': '\\ding{86}',
      '\u2737': '\\ding{87}',
      '\u2738': '\\ding{88}',
      '\u2739': '\\ding{89}',
      '\u273A': '\\ding{90}',
      '\u273B': '\\ding{91}',
      '\u273C': '\\ding{92}',
      '\u273D': '\\ding{93}',
      '\u273E': '\\ding{94}',
      '\u273F': '\\ding{95}',
      '\u2740': '\\ding{96}',
      '\u2741': '\\ding{97}',
      '\u2742': '\\ding{98}',
      '\u2743': '\\ding{99}',
      '\u2744': '\\ding{100}',
      '\u2745': '\\ding{101}',
      '\u2746': '\\ding{102}',
      '\u2747': '\\ding{103}',
      '\u2748': '\\ding{104}',
      '\u2749': '\\ding{105}',
      '\u274A': '\\ding{106}',
      '\u274B': '\\ding{107}',
      '\u274D': '\\ding{109}',
      '\u274F': '\\ding{111}',
      '\u2750': '\\ding{112}',
      '\u2751': '\\ding{113}',
      '\u2752': '\\ding{114}',
      '\u2756': '\\ding{118}',
      '\u2758': '\\ding{120}',
      '\u2759': '\\ding{121}',
      '\u275A': '\\ding{122}',
      '\u275B': '\\ding{123}',
      '\u275C': '\\ding{124}',
      '\u275D': '\\ding{125}',
      '\u275E': '\\ding{126}',
      '\u2761': '\\ding{161}',
      '\u2762': '\\ding{162}',
      '\u2763': '\\ding{163}',
      '\u2764': '\\ding{164}',
      '\u2765': '\\ding{165}',
      '\u2766': '\\ding{166}',
      '\u2767': '\\ding{167}',
      '\u2776': '\\ding{182}',
      '\u2777': '\\ding{183}',
      '\u2778': '\\ding{184}',
      '\u2779': '\\ding{185}',
      '\u277A': '\\ding{186}',
      '\u277B': '\\ding{187}',
      '\u277C': '\\ding{188}',
      '\u277D': '\\ding{189}',
      '\u277E': '\\ding{190}',
      '\u277F': '\\ding{191}',
      '\u2780': '\\ding{192}',
      '\u2781': '\\ding{193}',
      '\u2782': '\\ding{194}',
      '\u2783': '\\ding{195}',
      '\u2784': '\\ding{196}',
      '\u2785': '\\ding{197}',
      '\u2786': '\\ding{198}',
      '\u2787': '\\ding{199}',
      '\u2788': '\\ding{200}',
      '\u2789': '\\ding{201}',
      '\u278A': '\\ding{202}',
      '\u278B': '\\ding{203}',
      '\u278C': '\\ding{204}',
      '\u278D': '\\ding{205}',
      '\u278E': '\\ding{206}',
      '\u278F': '\\ding{207}',
      '\u2790': '\\ding{208}',
      '\u2791': '\\ding{209}',
      '\u2792': '\\ding{210}',
      '\u2793': '\\ding{211}',
      '\u2794': '\\ding{212}',
      '\u2798': '\\ding{216}',
      '\u2799': '\\ding{217}',
      '\u279A': '\\ding{218}',
      '\u279B': '\\ding{219}',
      '\u279C': '\\ding{220}',
      '\u279D': '\\ding{221}',
      '\u279E': '\\ding{222}',
      '\u279F': '\\ding{223}',
      '\u27A0': '\\ding{224}',
      '\u27A1': '\\ding{225}',
      '\u27A2': '\\ding{226}',
      '\u27A3': '\\ding{227}',
      '\u27A4': '\\ding{228}',
      '\u27A5': '\\ding{229}',
      '\u27A6': '\\ding{230}',
      '\u27A7': '\\ding{231}',
      '\u27A8': '\\ding{232}',
      '\u27A9': '\\ding{233}',
      '\u27AA': '\\ding{234}',
      '\u27AB': '\\ding{235}',
      '\u27AC': '\\ding{236}',
      '\u27AD': '\\ding{237}',
      '\u27AE': '\\ding{238}',
      '\u27AF': '\\ding{239}',
      '\u27B1': '\\ding{241}',
      '\u27B2': '\\ding{242}',
      '\u27B3': '\\ding{243}',
      '\u27B4': '\\ding{244}',
      '\u27B5': '\\ding{245}',
      '\u27B6': '\\ding{246}',
      '\u27B7': '\\ding{247}',
      '\u27B8': '\\ding{248}',
      '\u27B9': '\\ding{249}',
      '\u27BA': '\\ding{250}',
      '\u27BB': '\\ding{251}',
      '\u27BC': '\\ding{252}',
      '\u27BD': '\\ding{253}',
      '\u27BE': '\\ding{254}',
      '\u27E8': '\\langle{}',
      '\u27E9': '\\rangle{}',
      '\uFB00': 'ff',
      '\uFB01': 'fi',
      '\uFB02': 'fl',
      '\uFB03': 'ffi',
      '\uFB04': 'ffl',
      '\uFFFD': '\\dbend{}',
      '\uD835\uDEB9': '\\mathbf{\\vartheta}',
      '\uD835\uDEDD': '\\mathbf{\\vartheta}',
      '\uD835\uDEDE': '\\mathbf{\\varkappa}',
      '\uD835\uDEDF': '\\mathbf{\\phi}',
      '\uD835\uDEE0': '\\mathbf{\\varrho}',
      '\uD835\uDEE1': '\\mathbf{\\varpi}',
      '\uD835\uDEF3': '\\mathsl{\\vartheta}',
      '\uD835\uDF17': '\\mathsl{\\vartheta}',
      '\uD835\uDF18': '\\mathsl{\\varkappa}',
      '\uD835\uDF19': '\\mathsl{\\phi}',
      '\uD835\uDF1A': '\\mathsl{\\varrho}',
      '\uD835\uDF1B': '\\mathsl{\\varpi}',
      '\uD835\uDF2D': '\\mathbit{O}',
      '\uD835\uDF51': '\\mathbit{\\vartheta}',
      '\uD835\uDF52': '\\mathbit{\\varkappa}',
      '\uD835\uDF53': '\\mathbit{\\phi}',
      '\uD835\uDF54': '\\mathbit{\\varrho}',
      '\uD835\uDF55': '\\mathbit{\\varpi}',
      '\uD835\uDF67': '\\mathsfbf{\\vartheta}',
      '\uD835\uDF8B': '\\mathsfbf{\\vartheta}',
      '\uD835\uDF8C': '\\mathsfbf{\\varkappa}',
      '\uD835\uDF8D': '\\mathsfbf{\\phi}',
      '\uD835\uDF8E': '\\mathsfbf{\\varrho}',
      '\uD835\uDF8F': '\\mathsfbf{\\varpi}',
      '\uD835\uDFA1': '\\mathsfbfsl{\\vartheta}',
      '\uD835\uDFC5': '\\mathsfbfsl{\\vartheta}',
      '\uD835\uDFC6': '\\mathsfbfsl{\\varkappa}',
      '\uD835\uDFC7': '\\mathsfbfsl{\\phi}',
      '\uD835\uDFC8': '\\mathsfbfsl{\\varrho}',
      '\uD835\uDFC9': '\\mathsfbfsl{\\varpi}'
    }
  },
  'embrace': {
    '\\k{A}': true,
    '\\k{E}': true,
    '\\k{I}': true,
    '\\k{U}': true,
    '\\k{a}': true,
    '\\k{e}': true,
    '\\k{i}': true,
    '\\k{u}': true,
    '\\r{U}': true,
    '\\r{u}': true
  }
};

/***/ }),
/* 18 */
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
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 19 */
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
/* 20 */
/*!********************************!*\
  !*** ../node_modules/he/he.js ***!
  \********************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/he v1.1.1 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
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
	var regexDecode = /&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)([=a-zA-Z0-9])?/g;
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
		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7) {
			var codePoint;
			var semicolon;
			var decDigits;
			var hexDigits;
			var reference;
			var next;
			if ($1) {
				// Decode decimal escapes, e.g. `&#119558;`.
				decDigits = $1;
				semicolon = $2;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(decDigits, 10);
				return codePointToSymbol(codePoint, strict);
			}
			if ($3) {
				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
				hexDigits = $3;
				semicolon = $4;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(hexDigits, 16);
				return codePointToSymbol(codePoint, strict);
			}
			if ($5) {
				// Decode named character references with trailing `;`, e.g. `&copy;`.
				reference = $5;
				if (has(decodeMap, reference)) {
					return decodeMap[reference];
				} else {
					// Ambiguous ampersand. https://mths.be/notes/ambiguous-ampersands
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					return $0;
				}
			}
			// If we’re still here, it’s a legacy reference for sure. No need for an
			// extra `if` check.
			// Decode named character references without trailing `;`, e.g. `&amp`
			// This is only a parse error if it gets converted to `&`, or if it is
			// followed by `=` in an attribute context.
			reference = $6;
			next = $7;
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
		'version': '1.1.1',
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

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/module.js */ 19)(module), __webpack_require__(/*! ./../webpack/buildin/global.js */ 18)))

/***/ }),
/* 21 */
/*!*****************************!*\
  !*** ./lib/markupparser.ts ***!
  \*****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/lib/markupparser.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ts_1 = __webpack_require__(/*! ./debug.ts */ 2);
/* From https://raw.githubusercontent.com/Munawwar/neutron-html5parser/master/htmlparser.js */
const re = {
    // Number, Letter
    Nl: /\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF/.source,
    // Number, Decimal Digit
    Nd: /\u0030-\u0039\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19/.source,
    // Mark, Nonspacing
    Mn: /\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962-\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2-\u09E3\u0A01-\u0A02\u0A3C\u0A41-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A70-\u0A71\u0A75\u0A81-\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7-\u0AC8\u0ACD\u0AE2-\u0AE3\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62-\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C62-\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC-\u0CCD\u0CE2-\u0CE3\u0D01\u0D41-\u0D44\u0D4D\u0D62-\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039-\u103A\u103D-\u103E\u1058-\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085-\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17B4-\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u1922\u1927-\u1928\u1932\u1939-\u193B\u1A17-\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80-\u1B81\u1BA2-\u1BA5\u1BA8-\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8-\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8-\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099-\u309A\uA66F\uA674-\uA67D\uA69E-\uA69F\uA6F0-\uA6F1\uA802\uA806\uA80B\uA825-\uA826\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9E5\uAA29-\uAA2E\uAA31-\uAA32\uAA35-\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7-\uAAB8\uAABE-\uAABF\uAAC1\uAAEC-\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F/.source,
    // Mark, Spacing Combining
    Mc: /\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E-\u094F\u0982-\u0983\u09BE-\u09C0\u09C7-\u09C8\u09CB-\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB-\u0ACC\u0B02-\u0B03\u0B3E\u0B40\u0B47-\u0B48\u0B4B-\u0B4C\u0B57\u0BBE-\u0BBF\u0BC1-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82-\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7-\u0CC8\u0CCA-\u0CCB\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82-\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2-\u0DF3\u0F3E-\u0F3F\u0F7F\u102B-\u102C\u1031\u1038\u103B-\u103C\u1056-\u1057\u1062-\u1064\u1067-\u106D\u1083-\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7-\u17C8\u1923-\u1926\u1929-\u192B\u1930-\u1931\u1933-\u1938\u1A19-\u1A1A\u1A55\u1A57\u1A61\u1A63-\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B44\u1B82\u1BA1\u1BA6-\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2-\u1BF3\u1C24-\u1C2B\u1C34-\u1C35\u1CE1\u1CF2-\u1CF3\u302E-\u302F\uA823-\uA824\uA827\uA880-\uA881\uA8B4-\uA8C3\uA952-\uA953\uA983\uA9B4-\uA9B5\uA9BA-\uA9BB\uA9BD-\uA9C0\uAA2F-\uAA30\uAA33-\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE-\uAAEF\uAAF5\uABE3-\uABE4\uABE6-\uABE7\uABE9-\uABEA\uABEC/.source,
    // Letter, Uppercase
    Lu: /\u0041-\u005A\u00C0-\u00D6\u00D8-\u00DE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178-\u0179\u017B\u017D\u0181-\u0182\u0184\u0186-\u0187\u0189-\u018B\u018E-\u0191\u0193-\u0194\u0196-\u0198\u019C-\u019D\u019F-\u01A0\u01A2\u01A4\u01A6-\u01A7\u01A9\u01AC\u01AE-\u01AF\u01B1-\u01B3\u01B5\u01B7-\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A-\u023B\u023D-\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E-\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9-\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0-\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E-\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D-\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A/.source,
    // Letter, Titlecase
    Lt: /\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC/.source,
    // Letter, Lowercase
    Ll: /\u0061-\u007A\u00B5\u00DF-\u00F6\u00F8-\u00FF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137-\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148-\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C-\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA-\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9-\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC-\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF-\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F-\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0-\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB-\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE-\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6-\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FC7\u1FD0-\u1FD3\u1FD6-\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6-\u1FF7\u210A\u210E-\u210F\u2113\u212F\u2134\u2139\u213C-\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65-\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73-\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3-\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A/.source,
    // Letter, Modifier
    Lm: /\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5-\u06E6\u07F4-\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C-\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D-\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C-\uA69D\uA717-\uA71F\uA770\uA788\uA7F8-\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3-\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E-\uFF9F/.source,
    // Letter, Other
    Lo: /\u00AA\u00BA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A-\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC/.source,
    /* P without period */
    P: /\.\u002D\u2000-\u206F\u2E00-\u2E7F\\'!"#\$%&\(\)\*\+,\/:;<=>\?@\[\]^_`{\|}~/.source,
    Whitespace: / \t\n\r\u00A0/.source,
    // calculated below
    lcChar: null,
    char: null,
    protectedWord: null,
    leadingUnprotectedWord: null,
    protectedWords: null,
    unprotectedWord: null,
    url: null,
    whitespace: null,
};
re.lcChar = re.Ll + re.Lt + re.Lm + re.Lo + re.Mn + re.Mc + re.Nd + re.Nl;
re.char = re.Lu + re.lcChar;
re.protectedWord = `[${re.lcChar}]*[${re.Lu}][${re.char}]*`;
/* actual regexps */
/* TODO: add punctuation */
re.leadingUnprotectedWord = new RegExp(`^([${re.Lu}][${re.lcChar}]*)[${re.Whitespace}${re.P}]`);
re.protectedWords = new RegExp(`^(${re.protectedWord})(([${re.Whitespace}])(${re.protectedWord}))*`);
re.unprotectedWord = new RegExp(`^[${re.char}]+`);
re.url = /^(https?|mailto):\/\/[^\s]+/;
re.whitespace = new RegExp(`^[${re.Whitespace}]+`);
class AST {
    constructor(caseConversion) {
        this.caseConversion = caseConversion;
        this.root = { name: 'span', children: [], attr: {}, class: {} };
        this.elems = [this.root];
        this.sentenceStart = true;
    }
    start(name, attr, unary = false) {
        const tag = { name, attr, class: {}, children: [] };
        if (tag.attr.class) {
            for (const cls of tag.attr.class.split(/\s+/)) {
                tag.class[cls] = true;
            }
        }
        if (name === 'sc' || tag.class.smallcaps || tag.attr.smallcaps || (tag.attr.style || '').match(/small-caps/i))
            tag.smallcaps = true;
        if (tag.attr.nocase || tag.class.nocase || name === 'nc')
            tag.nocase = true;
        if (tag.attr.relax || tag.class.relax)
            tag.relax = true;
        this.elems[0].children.push(tag);
        this.elems.unshift(tag);
    }
    end(tagName) {
        if (tagName !== this.elems[0].name)
            debug_ts_1.debug('markupparser: Error:', tagName, '<->', this.elems[0]);
        this.elems.shift();
    }
    pre(text) {
        if (this.elems[0].name !== 'pre')
            throw new Error(`Expected 'pre' tag, found '${this.elems[0].name}'`);
        if (this.elems[0].text)
            throw new Error('Text already set on pre tag');
        if (this.elems[0].children && (this.elems[0].children.length > 0))
            throw new Error('Pre must not have children');
        this.elems[0].text = text;
    }
    chars(text, pos = null) {
        if (!this.caseConversion || pos === null) {
            this.elems[0].children.push({ pos, name: '#text', text });
            return;
        }
        const length = text.length;
        while (text) {
            let m;
            if (m = re.whitespace.exec(text)) {
                this.plaintext(m[0], pos + (length - text.length));
                text = text.substring(m[0].length);
                continue;
            }
            if (this.sentenceStart && (m = re.leadingUnprotectedWord.exec(text + ' '))) {
                this.sentenceStart = false;
                this.plaintext(m[1], pos + (length - text.length));
                text = text.substring(m[1].length);
                continue;
            }
            this.sentenceStart = false;
            if (m = re.protectedWords.exec(text)) {
                this.elems[0].children.push({ name: 'span', nocase: true, children: [{ pos: pos + (length - text.length), name: '#text', text: m[0] }], attr: {}, class: {} });
                text = text.substring(m[0].length);
            }
            else if (m = re.url.exec(text)) {
                this.elems[0].children.push({ name: 'span', nocase: true, children: [{ pos: pos + (length - text.length), name: '#text', text: m[0] }], attr: {}, class: {} });
                text = text.substring(m[0].length);
            }
            else if (m = re.unprotectedWord.exec(text)) {
                this.plaintext(m[0], pos + (length - text.length));
                text = text.substring(m[0].length);
            }
            else {
                this.plaintext(text[0], pos + (length - text.length));
                text = text.substring(1);
            }
        }
    }
    plaintext(text, pos) {
        const l = this.elems[0].children.length;
        if ((l === 0) || (this.elems[0].children[l - 1].name !== '#text')) {
            this.elems[0].children.push({ pos, name: '#text', text });
        }
        else {
            this.elems[0].children[l - 1].text += text;
        }
    }
}
function makeMap(elts) {
    return elts.split(/\s+/).reduce((map, elt) => { map[elt] = true; return map; }, {});
}
// export singleton: https://k94n.com/es6-modules-single-instance-pattern
exports.MarkupParser = new class {
    constructor() {
        // Regular Expressions for parsing tags and attributes
        this.re = {
            startTag: /^<([-\w:]+)((?:\s+[^\s\/>"'=]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/,
            endTag: /^<\/([-\w:]+)[^>]*>/,
            attr: /^\s+([^\s\/>"'=]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/,
            pre: /^([\s\S]*?)<\/pre[^>]*>/i,
        };
        // supported elements -- sc == smallcaps
        this.minimal = makeMap('em italic i strong b nc sc enquote pre span sub sup');
        this.closeSelf = makeMap('colgroup dd dt li options p td tfoot th thead tr');
        this.empty = makeMap('area base basefont br col frame hr img input link meta param embed command keygen source track wbr');
    }
    parse(html, options = {}) {
        html = `${html}`;
        this.handler = new AST(options.caseConversion);
        if (options.mode === 'plain') {
            if (options.caseConversion)
                throw new Error('No case conversion in plain mode');
            this.handler.chars(html);
            return this.handler.root;
        }
        this.stack = [];
        const htmlMode = (options.mode === 'html');
        let last = html;
        /* add enquote psuedo-tags. Pseudo-tags are used here because they're cleanly removable for the pre block */
        if (Translator.preferences.csquotes) {
            html = html.replace(new RegExp(`[${Translator.preferences.csquotes.open.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]\s*/g, '\\$&')}]\\s*`, 'g'), '\x0E');
            html = html.replace(new RegExp(`\\s*[${Translator.preferences.csquotes.close.replace(/\s*[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')}]`, 'g'), '\x0F');
        }
        const length = html.length;
        while (html) {
            let match;
            let chars = true;
            if (this.lastTag === 'pre') {
                html = html.replace(this.re.pre, (all, text) => {
                    if (this.handler.pre)
                        this.handler.pre(text.replace(/[\x0E\x0F]/g, ''));
                    return '';
                });
                chars = false;
                this.parseEndTag(this.lastTag);
            }
            else if ((html.substring(0, 2) === '</') || (html[0] === '\x0F')) {
                if (html[0] === '<') {
                    match = html.match(this.re.endTag);
                    // tslint:disable-next-line:no-magic-numbers
                    if (match && !htmlMode && (match[1] !== 'span') && (!this.minimal[match[1]] || (match[0][match[1].length + 2] !== '>')))
                        match = null;
                }
                else {
                    match = [html[0], 'enquote'];
                }
                if (match) {
                    html = html.substring(match[0].length);
                    this.parseEndTag(match[1]);
                }
                else {
                    // ignore the angle bracket
                    if (this.handler.chars)
                        this.handler.chars('<', length - html.length);
                    html = html.substring(1);
                }
                chars = false;
            }
            else if ((html[0] === '<') || (html[0] === '\x0E')) {
                if (html[0] === '<') {
                    match = html.match(this.re.startTag);
                    // tslint:disable-next-line:no-magic-numbers
                    if (match && !htmlMode && (match[1] !== 'span') && !(this.minimal[match[1]] || (['/>', '>'].includes(match[0].substr(match[1].length + 1, 2)))))
                        match = null;
                }
                else {
                    match = [html[0], 'enquote', '', ''];
                }
                if (match) {
                    html = html.substring(match[0].length);
                    this.parseStartTag.apply(this, match);
                }
                else {
                    // ignore the angle bracket
                    if (this.handler.chars)
                        this.handler.chars('<', length - html.length);
                    html = html.substring(1);
                }
                chars = false;
            }
            if (chars) {
                const index = html.search(/[<\x0E\x0F]/);
                const pos = length - html.length;
                const text = index < 0 ? html : html.substring(0, index);
                html = index < 0 ? '' : html.substring(index);
                if (this.handler.chars)
                    this.handler.chars(text, pos);
            }
            if (html === last) {
                throw new Error(`Parse Error: ${html}`);
            }
            last = html;
        }
        // Clean up any remaining tags
        this.parseEndTag(null);
        if (options.caseConversion) {
            if (!Translator.preferences.suppressTitleCase) {
                this.titleCased = Zotero.BetterBibTeX.titleCase(this.innerText(this.handler.root));
                this.titleCase(this.handler.root);
            }
            this.simplify(this.handler.root);
            /* BibLaTeX is beyond insane https://github.com/retorquere/zotero-better-bibtex/issues/541#issuecomment-240999396 */
            // MUST come after simplify
            this.unwrapNocase(this.handler.root);
        }
        let root = this.handler.root;
        if (root.name !== 'span')
            throw new Error(`markupparser: Unexpected root node ${root.name}`);
        // spurious wrapping span
        if (!Object.keys(root.attr).length && root.children.length === 1)
            root = root.children[0];
        debug_ts_1.debug('markupparser:', root);
        return root;
    }
    parseStartTag(tag, tagName, rest, unary) {
        tagName = tagName.toLowerCase();
        // TODO: In addition to lastTag === tagName, also check special case for th, td, tfoot, tbody, thead
        if (this.closeSelf[tagName] && (this.lastTag === tagName))
            this.parseEndTag(tagName);
        unary = this.empty[tagName] || !!unary;
        if (!unary) {
            this.stack.push(tagName);
            this.lastTag = tagName;
        }
        if (this.handler.start) {
            let match;
            const attrs = {};
            while ((match = rest.match(this.re.attr))) {
                rest = rest.substr(match[0].length);
                const name = match[1];
                const value = match[2] || match[3] || match[4] || ''; // tslint:disable-line:no-magic-numbers
                attrs[name] = value;
            }
            this.handler.start(tagName, attrs);
        }
    }
    parseEndTag(tagName) {
        // If no tag name is provided, clean shop
        let pos;
        if (!tagName) {
            pos = 0;
        }
        else {
            pos = this.stack.length - 1;
            while (pos >= 0) {
                if (this.stack[pos] === tagName) {
                    break;
                }
                pos -= 1;
            }
        }
        if (pos >= 0) {
            // Close all the open elements, up the stack
            let i = this.stack.length - 1;
            while (i >= pos) {
                if (this.handler.end)
                    this.handler.end(this.stack[i]);
                i -= 1;
            }
            // Remove the open elements from the stack
            this.stack.length = pos;
            this.lastTag = this.stack[pos - 1];
        }
    }
    innerText(node, text = '') {
        switch (node.name) {
            case '#text':
                // the Array construct makes sure that the text is placed at the exact position it has in the origin string,
                // adding spaces as necessary
                if (typeof node.pos === 'number')
                    text += Array((node.pos - text.length) + 1).join(' ') + node.text;
                break;
            case 'pre':
                // don't confuse the title caser with spurious markup, but MUST NOT change the string length. Without this,
                // the CSL title caser would consider last words in a title that actually have a following <pre> block the last
                // word and would capitalize it. The prevents that behavior by adding the contents of the <pre> block, but it
                // will be ignored by the BBT title caser, which only title-cases #text blocks
                text += node.text.replace(/</g, '[').replace(/>/g, ']');
                break;
            default:
                for (const child of node.children) {
                    text = this.innerText(child, text);
                }
        }
        return text;
    }
    unwrapNocase(node) {
        if (node.name === '#text')
            return node;
        const children = node.children.map(n => this.unwrapNocase(n));
        node.children = [].concat(...children);
        if (!node.children.find(child => child.nocase))
            return node;
        const expanded = [];
        let last = null;
        for (const child of node.children) {
            const clone = JSON.parse(JSON.stringify(node));
            if (child.nocase) {
                clone.children = child.children;
                child.children = [clone];
                expanded.push(child);
                last = null;
            }
            else if (last && !last.nocase) {
                last.children.push(child);
            }
            else {
                clone.children = [child];
                expanded.push(clone);
                last = clone;
            }
        }
        return expanded;
    }
    simplify(node, isNoCased = false) {
        if (isNoCased)
            delete node.nocase;
        switch (node.name) {
            case '#text':
                break; // pass
            case 'pre':
                switch (node.children.length) {
                    case 0:
                        break; // pass
                    case 1:
                        if (node.children[0].name !== '#text')
                            throw new Error(`Pre node had unexpected child ${JSON.stringify(node.children[0])}`);
                        node.text = node.children[0].text;
                        node.children = [];
                        break;
                    default:
                        throw new Error(`Pre node had unexpected children ${JSON.stringify(node.children)}`);
                }
                break;
            default:
                for (const child of node.children) {
                    this.simplify(child, isNoCased || node.nocase);
                }
        }
    }
    titleCase(node) {
        if (node.name === '#text') {
            // https://github.com/Juris-M/citeproc-js/issues/30
            // node.text = @titleCased.substr(node.pos, node.text.length) if typeof node.pos == 'number'
            if (typeof node.pos === 'number') {
                const spaces = '\u2003\u2004\u205F\u2009\u00A0'.split('');
                let recased = '';
                const substr = this.titleCased.substr(node.pos, node.text.length).split('');
                for (let i = 0; i < substr.length; i++) {
                    if (spaces.includes(node.text[i])) {
                        recased += node.text[i];
                    }
                    else {
                        recased += substr[i];
                    }
                }
                node.text = recased;
            }
        }
        else {
            for (const child of node.children) {
                if (!child.nocase)
                    this.titleCase(child);
            }
        }
    }
};
; Zotero.debug('BBT: loaded translators/lib/markupparser.ts'); } catch ($wrap_loader_catcher_translators_lib_markupparser_ts) { Zotero.debug('Error: BBT: load of translators/lib/markupparser.ts failed:' + $wrap_loader_catcher_translators_lib_markupparser_ts + '::' + $wrap_loader_catcher_translators_lib_markupparser_ts.stack) };

/***/ }),
/* 22 */
/*!**************************************!*\
  !*** ./bibtex/unicode_translator.ts ***!
  \**************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/bibtex/unicode_translator.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
const markupparser_ts_1 = __webpack_require__(/*! ../lib/markupparser.ts */ 21);
const HE = __webpack_require__(/*! he */ 20);
const unicodeMapping = __webpack_require__(/*! ./unicode_translator.json */ 17);
const htmlConverter = new class HTMLConverter {
    convert(html, options) {
        this.embraced = false;
        this.options = options;
        this.latex = '';
        this.mapping = (Translator.unicode ? unicodeMapping.unicode : unicodeMapping.ascii);
        this.stack = [];
        const ast = markupparser_ts_1.MarkupParser.parse(html, this.options);
        this.walk(ast);
        return { latex: this.latex, raw: ast.name === 'pre' };
    }
    walk(tag) {
        if (!tag)
            return;
        switch (tag.name) {
            case '#text':
                this.chars(tag.text);
                return;
            case 'pre':
                this.latex += tag.text;
                return;
        }
        this.stack.unshift(tag);
        let latex = '...'; // default to no-op
        switch (tag.name) {
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
                latex = `\n\n\\${(new Array(parseInt(tag.name[1]))).join('sub')}section{...}\n\n`;
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
            case 'enquote':
                if (Translator.BetterBibTeX) {
                    latex = '\\enquote{...}';
                }
                else {
                    latex = '\\mkbibquote{...}';
                }
                break;
            case 'span':
            case 'sc':
            case 'nc':
                break; // ignore, handled by the relax/nocase/smallcaps handler below
            case 'td':
            case 'th':
                latex = ' ... ';
                break;
            case 'tbody':
            case '#document':
            case 'html':
            case 'head':
            case 'body':
                break; // ignore
            default:
                debug_ts_1.debug(`unexpected tag '${tag.name}' (${Object.keys(tag)})`);
        }
        if (latex !== '...')
            latex = this.embrace(latex, latex.match(/^\\[a-z]+{\.\.\.}$/));
        if (tag.smallcaps)
            latex = this.embrace(`\\textsc{${latex}}`, true);
        if (tag.nocase)
            latex = `{{${latex}}}`;
        if (tag.relax)
            latex = `{\\relax ${latex}}`;
        const [prefix, postfix] = latex.split('...');
        this.latex += prefix;
        for (const child of tag.children) {
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
        let latex = '';
        let math = false;
        let braced = 0;
        if (this.options.mode === 'html')
            text = HE.decode(text, { isAttributeValue: true });
        for (let c of Zotero.Utilities.XRegExp.split(text, '')) {
            // in and out of math mode
            if (!!this.mapping.math[c] !== math) {
                latex += '$';
                math = !!this.mapping.math[c];
            }
            /* balance out braces with invisible braces until http://tex.stackexchange.com/questions/230750/open-brace-in-bibtex-fields/230754#comment545453_230754 is widely deployed */
            switch (c) {
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
            c = this.mapping.math[c] || this.mapping.text[c] || c;
            latex += this.embrace(c, unicodeMapping.embrace[c]);
        }
        // add any missing closing phantom braces
        switch (braced) {
            case 0:
                break; // pass
            case 1:
                latex += '\\vphantom\\}';
                break;
            default: latex += `\\vphantom{${(new Array(braced + 1)).join('\\}')}}`;
        }
        // might still be in math mode at the end
        if (math)
            latex += '$';
        /* minor cleanup */
        latex = latex.replace(/([^\\])({})+([^ 0-9a-z])/ig, '$1$3');
        this.latex += latex;
    }
};
function html2latex(html, options) {
    if (!options.mode)
        options.mode = 'html';
    const latex = htmlConverter.convert(html, options);
    latex.latex = latex.latex
        .replace(/(\\\\)+[^\S\n]*\n\n/g, '\n\n')
        .replace(/\n\n\n+/g, '\n\n')
        .replace(/{}([}])/g, '$1');
    return latex;
}
exports.html2latex = html2latex;
function text2latex(text, options = {}) {
    if (!options.mode)
        options.mode = 'text';
    return html2latex(text, options);
}
exports.text2latex = text2latex;
; Zotero.debug('BBT: loaded translators/bibtex/unicode_translator.ts'); } catch ($wrap_loader_catcher_translators_bibtex_unicode_translator_ts) { Zotero.debug('Error: BBT: load of translators/bibtex/unicode_translator.ts failed:' + $wrap_loader_catcher_translators_bibtex_unicode_translator_ts + '::' + $wrap_loader_catcher_translators_bibtex_unicode_translator_ts.stack) };

/***/ }),
/* 23 */
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
/* 24 */
/*!*************************************!*\
  !*** ../content/debug-formatter.ts ***!
  \*************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading content/debug-formatter.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stringify = __webpack_require__(/*! json-stringify-safe */ 23);
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
/* 25 */
/*!**************************!*\
  !*** ./bibtex/jabref.ts ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/bibtex/jabref.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
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
        debug_ts_1.debug('JabRef.quote:', s);
        if (wrap)
            s = s.match(/.{1,70}/g).join('\n');
        return s;
    }
}
exports.JabRef = JabRef;
; Zotero.debug('BBT: loaded translators/bibtex/jabref.ts'); } catch ($wrap_loader_catcher_translators_bibtex_jabref_ts) { Zotero.debug('Error: BBT: load of translators/bibtex/jabref.ts failed:' + $wrap_loader_catcher_translators_bibtex_jabref_ts + '::' + $wrap_loader_catcher_translators_bibtex_jabref_ts.stack) };

/***/ }),
/* 26 */
/*!*****************************!*\
  !*** ./bibtex/reference.ts ***!
  \*****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/bibtex/reference.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exporter_ts_1 = __webpack_require__(/*! ../lib/exporter.ts */ 10);
const unicode_translator_ts_1 = __webpack_require__(/*! ./unicode_translator.ts */ 22);
const debug_ts_1 = __webpack_require__(/*! ../lib/debug.ts */ 2);
const datefield_ts_1 = __webpack_require__(/*! ./datefield.ts */ 16);
const arXiv = new class {
    constructor() {
        // new-style IDs
        // arXiv:0707.3168 [hep-th]
        // arXiv:YYMM.NNNNv# [category]
        this.new = /^arxiv:([0-9]{4}\.[0-9]+)(v[0-9]+)?([^\S\n]+\[(.*)\])?$/i;
        // arXiv:arch-ive/YYMMNNNv# or arXiv:arch-ive/YYMMNNNv# [category]
        this.old = /^arxiv:([a-z]+-[a-z]+\/[0-9]{7})(v[0-9]+)?([^\S\n]+\[(.*)\])?$/i;
        // bare
        this.bare = /^arxiv:[^\S\n]*([\S]+)/i;
    }
    parse(id) {
        let m;
        if (!id)
            return undefined;
        if (m = this.new.exec(id)) {
            return { id, eprint: m[1], primaryClass: m[4] }; // tslint:disable-line:no-magic-numbers
        }
        if (m = this.old.exec(id)) {
            return { id, eprint: m[1], primaryClass: m[4] }; // tslint:disable-line:no-magic-numbers
        }
        if (m = this.bare.exec(id)) {
            return { id, eprint: m[1] };
        }
        return undefined;
    }
};
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
        for (const [k, v] of Object.entries(this.babelMap)) { // tslint:disable-line:no-unused-variable
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
            for (const [code, languages] of Object.entries(Language.babelMap)) { // tslint:disable-line:no-unused-variable
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
        // private nonLetters = new Zotero.Utilities.XRegExp('[^\\p{Letter}]', 'g')
        this.punctuationAtEnd = new Zotero.Utilities.XRegExp('[\\p{Punctuation}]$');
        this.startsWithLowercase = new Zotero.Utilities.XRegExp('^[\\p{Ll}]');
        this.hasLowercaseWord = new Zotero.Utilities.XRegExp('\\s[\\p{Ll}]');
        this.whitespace = new Zotero.Utilities.XRegExp('\\p{Zs}');
        this._enc_creators_initials_marker = '\u0097'; // end of guarded area
        this._enc_creators_relax_marker = '\u200C'; // zero-width non-joiner
        this.isBibVarRE = /^[a-z][a-z0-9_]*$/i;
        this.item = item;
        this.has = {};
        this.raw = (Translator.preferences.rawLaTag === '*') || (this.item.tags.includes(Translator.preferences.rawLaTag));
        this.data = { DeclarePrefChars: '' };
        if (!this.item.language) {
            this.english = true;
            debug_ts_1.debug('detecting language: defaulting to english');
        }
        else {
            const langlc = this.item.language.toLowerCase();
            let language = Language.babelMap[langlc.replace(/[^a-z0-9]/, '_')];
            if (!language)
                language = Language.babelMap[langlc.replace(/-[a-z]+$/i, '').replace(/[^a-z0-9]/, '_')];
            if (!language)
                language = Language.fromPrefix(langlc);
            debug_ts_1.debug('detecting language:', { langlc, language });
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
            this.english = ['american', 'british', 'canadian', 'english', 'australian', 'newzealand', 'USenglish', 'UKenglish'].includes(this.language);
            debug_ts_1.debug('detected language:', { language: this.language, english: this.english });
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
        debug_ts_1.debug('postextract: item:', this.item);
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
        if (['arxiv.org', 'arxiv'].includes((this.item.libraryCatalog || '').toLowerCase()) && (this.item.arXiv = arXiv.parse(this.item.publicationTitle))) {
            this.item.arXiv.source = 'publicationTitle';
            if (Translator.BetterBibLaTeX)
                delete this.item.publicationTitle;
        }
        else if (this.item.extraFields.kv.arxiv && (this.item.arXiv = arXiv.parse(`arxiv:${this.item.extraFields.kv.arxiv}`))) {
            this.item.arXiv.source = 'extra';
        }
        if (this.item.arXiv) {
            this.add({ name: 'archivePrefix', value: 'arXiv' });
            this.add({ name: 'eprinttype', value: 'arxiv' });
            this.add({ name: 'eprint', value: this.item.arXiv.eprint });
            if (this.item.arXiv.primaryClass)
                this.add({ name: 'primaryClass', value: this.item.arXiv.primaryClass });
            delete this.item.extraFields.kv.arxiv;
        }
    }
    static installPostscript() {
        const postscript = Translator.preferences.postscript;
        if (typeof postscript !== 'string' || postscript.trim() === '')
            return;
        try {
            Reference.prototype.postscript = new Function('reference', 'item', postscript);
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
        debug_ts_1.debug('add field', field);
        if (field.enc === 'date') {
            if (!field.value)
                return;
            if (Translator.BetterBibLaTeX && Translator.preferences.biblatexExtendedDateFormat && Zotero.BetterBibTeX.isEDTF(field.value, true)) {
                return this.add(Object.assign({}, field, { enc: 'verbatim' }));
            }
            const date = Zotero.BetterBibTeX.parseDate(field.value);
            this.add(datefield_ts_1.datefield(date, field));
            this.add(datefield_ts_1.datefield(date.orig, Object.assign({}, field, { name: (field.orig && field.orig.inherit) ? `orig${field.name}` : (field.orig && field.orig.name), verbatim: (field.orig && field.orig.inherit && field.verbatim) ? `orig${field.verbatim}` : (field.orig && field.orig.verbatim) })));
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
            if (Translator.preferences.testing && !field.replace)
                throw new Error(`duplicate field '${field.name}' for ${this.item.citekey}`);
            this.remove(field.name);
        }
        if (!field.bibtex) {
            let value;
            if ((typeof field.value === 'number') || (field.preserveBibTeXVariables && this.isBibVar(field.value))) {
                value = `${field.value}`;
            }
            else {
                const enc = field.enc || this.fieldEncoding[field.name] || 'latex';
                value = this[`enc_${enc}`](field, this.raw);
                if (!value)
                    return;
                value = value.trim();
                if (!field.bare || field.value.match(/\s/))
                    value = `{${value}}`;
            }
            // separation protection at end unnecesary
            value = value.replace(/{}$/, '');
            field.bibtex = `${value}`;
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
        debug_ts_1.debug('remove field', name);
        const removed = this.has[name];
        delete this.has[name];
        return removed;
    }
    isBibVar(value) {
        return Translator.preferences.preserveBibTeXVariables && value && (typeof value === 'string') && this.isBibVarRE.test(value);
    }
    hasCreator(type) { return (this.item.creators || []).some(creator => creator.creatorType === type); }
    complete() {
        if (Translator.preferences.DOIandURL !== 'both') {
            if (this.has.doi && this.has.url) {
                debug_ts_1.debug('removing', Translator.preferences.DOIandURL === 'doi' ? 'url' : 'doi');
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
            debug_ts_1.debug('extraFields: csl', cslName, field);
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
                debug_ts_1.debug('Unmapped CSL field', cslName, '=', field.value);
            }
        }
        for (const [name, field] of Object.entries(this.item.extraFields.bibtex)) {
            debug_ts_1.debug('extraFields: bibtex', name, field);
            // psuedo-var, sets the reference type
            if (name === 'referencetype') {
                this.referencetype = field.value;
                continue;
            }
            debug_ts_1.debug('extraFields: bibtex');
            this.override(field);
        }
        for (const [name, field] of Object.entries(this.item.extraFields.kv)) {
            debug_ts_1.debug('extraFields: kv', name, field);
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
                    debug_ts_1.debug('unexpected KV field', name, field);
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
        try {
            this.postscript(this, this.item);
        }
        catch (err) {
            debug_ts_1.debug('Reference.postscript failed:', err);
        }
        for (const name of Translator.preferences.skipFields) {
            this.remove(name);
        }
        if (!this.has.url && this.has.urldate)
            this.remove('urldate');
        if (!Object.keys(this.has).length)
            this.add({ name: 'type', value: this.referencetype });
        const fields = Object.values(this.has).map(field => `  ${field.name} = ${field.bibtex}`);
        // sort fields for stable tests
        if (Translator.preferences.testing)
            fields.sort();
        let ref = `@${this.referencetype}{${this.item.citekey},\n`;
        ref += fields.join(',\n');
        ref += '\n}\n';
        ref += this.qualityReport();
        ref += '\n';
        Zotero.write(ref);
        this.data.DeclarePrefChars = exporter_ts_1.Exporter.unique_chars(this.data.DeclarePrefChars);
        Zotero.BetterBibTeX.cacheStore(this.item.itemID, Translator.options, ref, this.data);
        if (this.data.DeclarePrefChars)
            exporter_ts_1.Exporter.preamble.DeclarePrefChars += this.data.DeclarePrefChars;
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
            return `\\url{${this.enc_verbatim(f)}}`;
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
                name = raw ? `{${creator.name || creator.lastName}}` : this.enc_latex({ value: new String(this._enc_creators_scrub_name(creator.name || creator.lastName)) }); // tslint:disable-line:no-construct
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
            return f.value.map(word => this.enc_latex(this.clone(f, word), raw)).join(f.sep || '');
        }
        if (f.raw || raw)
            return f.value;
        const caseConversion = !Translator.preferences.suppressTitleCase && (this.caseConversion[f.name] || f.caseConversion);
        const latex = unicode_translator_ts_1.text2latex(f.value, { mode: (f.html ? 'html' : 'text'), caseConversion: caseConversion && this.english });
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
        if (Translator.preferences.testing)
            tags.sort();
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
                path: attachment.defaultPath || attachment.localPath,
            };
            if (!att.path)
                continue; // amazon/googlebooks etc links show up as atachments without a path
            // att.path = att.path.replace(/^storage:/, '')
            att.path = att.path.replace(/(?:\s*[{}]+)+\s*/g, ' ');
            if (Translator.options.exportFileData && attachment.saveFile && attachment.defaultPath)
                attachment.saveFile(att.path, true);
            if (!att.title)
                att.title = att.path.replace(/.*[\\\/]/, '') || 'attachment';
            if (!att.mimetype && (att.path.slice(-4).toLowerCase() === '.pdf'))
                att.mimetype = 'application/pdf'; // tslint:disable-line:no-magic-numbers
            if (Translator.preferences.testing) {
                exporter_ts_1.Exporter.attachmentCounter += 1;
                att.path = `files/${exporter_ts_1.Exporter.attachmentCounter}/${att.path.replace(/.*[\/\\]/, '')}`;
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
            return a.path.localeCompare(b.path);
        });
        if (Translator.preferences.jabrefFormat)
            return attachments.map(att => [att.title, att.path, att.mimetype].map(part => part.replace(/([\\{}:;])/g, '\\$1')).join(':')).join(';');
        return attachments.map(att => att.path.replace(/([\\{};])/g, '\\$1')).join(';');
    }
    override(field) {
        const name = field.name.split('.');
        if (name.length > 1) {
            if (this.referencetype !== name[0])
                return;
            field.name = name[1];
        }
        if ((typeof field.value === 'string') && (field.value.trim() === '')) {
            this.remove(field.name);
            return;
        }
        this.add(Object.assign({}, field, { replace: (typeof field.replace !== 'boolean' && typeof field.fallback !== 'boolean') || field.replace }));
    }
    /*
     * Return a copy of the given `field` with a new value
     *
     * @param {field} field to be cloned
     * @param {value} value to be assigned
     * @return {Object} copy of field settings with new value
     */
    clone(f, value) {
        const clone = JSON.parse(JSON.stringify(f));
        delete clone.bibtex;
        clone.value = value;
        return clone;
    }
    _enc_creators_pad_particle(particle, relax = false) {
        // space at end is always OK
        if (particle[particle.length - 1] === ' ')
            return particle;
        if (Translator.BetterBibLaTeX) {
            if (Zotero.Utilities.XRegExp.test(particle, this.punctuationAtEnd))
                this.data.DeclarePrefChars += particle[particle.length - 1];
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
        family = this.enc_latex({ value: family });
        // https://github.com/retorquere/zotero-better-bibtex/issues/976#issuecomment-393442419
        if (family[0] !== '{' && name.family.match(/[-\u2014\u2015\u2012\u2013]/))
            family = `{${family}}`;
        if (name['dropping-particle'])
            family = this.enc_latex({ value: this._enc_creators_pad_particle(name['dropping-particle'], true) }) + family;
        if (Translator.BetterBibTeX && Translator.preferences.bibtexParticleNoOp && (name['non-dropping-particle'] || name['dropping-particle'])) {
            family = `{\\noopsort{${this.enc_latex({ value: name.family.toLowerCase() })}}}${family}`;
            exporter_ts_1.Exporter.preamble.noopsort = true;
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
        let value;
        if (Translator.BetterBibTeX) {
            value = (`${text}`).replace(/([#\\%&{}])/g, '\\$1');
        }
        else {
            value = (`${text}`).replace(/([\\{}])/g, '\\$1');
        }
        if (!Translator.unicode)
            value = value.replace(/[^\x21-\x7E]/g, (chr => `\\%${`00${chr.charCodeAt(0).toString(16).slice(-2)}`}`)); // tslint:disable-line:no-magic-numbers
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
; Zotero.debug('BBT: loaded translators/bibtex/reference.ts'); } catch ($wrap_loader_catcher_translators_bibtex_reference_ts) { Zotero.debug('Error: BBT: load of translators/bibtex/reference.ts failed:' + $wrap_loader_catcher_translators_bibtex_reference_ts + '::' + $wrap_loader_catcher_translators_bibtex_reference_ts.stack) };

/***/ }),
/* 27 */
/*!**************************!*\
  !*** ./Better BibTeX.ts ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Zotero.debug('BBT: loading translators/Better BibTeX.ts'); try { "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reference_ts_1 = __webpack_require__(/*! ./bibtex/reference.ts */ 26);
const exporter_ts_1 = __webpack_require__(/*! ./lib/exporter.ts */ 10);
const debug_ts_1 = __webpack_require__(/*! ./lib/debug.ts */ 2);
const html_escape_ts_1 = __webpack_require__(/*! ./lib/html-escape.ts */ 15);
const JSON5 = __webpack_require__(/*! json5 */ 14);
const BibTeXParser = __webpack_require__(/*! biblatex-csl-converter */ 13).BibLatexParser; // tslint:disable-line:variable-name
reference_ts_1.Reference.prototype.caseConversion = {
    title: true,
    shorttitle: true,
    booktitle: true,
    type: true,
};
reference_ts_1.Reference.prototype.fieldEncoding = {
    url: 'verbatim',
    doi: 'verbatim',
    // school: 'literal'
    institution: 'literal',
    publisher: 'literal',
};
reference_ts_1.Reference.prototype.lint = function (explanation) {
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
reference_ts_1.Reference.prototype.addCreators = function () {
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
reference_ts_1.Reference.prototype.typeMap = {
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
function importReferences(input) {
    const parser = new BibTeXParser(input, {
        rawFields: true,
        processUnexpected: true,
        processUnknown: { comment: 'f_verbatim' },
        processInvalidURIs: true,
    });
    /* this must be called before requesting warnings or errors -- this really, really weirds me out */
    const references = parser.output;
    /* relies on side effect of calling '.output' */
    return {
        references,
        groups: parser.groups,
        errors: parser.errors,
        warnings: parser.warnings,
    };
}
Translator.doExport = () => {
    // Zotero.write(`\n% ${Translator.header.label}\n`)
    Zotero.write('\n');
    let item;
    while (item = exporter_ts_1.Exporter.nextItem()) {
        const ref = new reference_ts_1.Reference(item);
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
        switch (Translator.preferences.bibtexURL) {
            case 'url':
                ref.add({ name: 'url', value: item.url });
                break;
            case 'note':
                ref.add({ name: (['misc', 'booklet'].includes(ref.referencetype) ? 'howpublished' : 'note'), value: item.url, enc: 'url' });
                break;
            default:
                if (['webpage', 'post', 'post-weblog'].includes(item.referenceType))
                    ref.add({ name: 'howpublished', value: item.url });
        }
        if (['bookSection', 'conferencePaper', 'chapter'].includes(item.referenceType)) {
            ref.add({ name: 'booktitle', value: item.publicationTitle, preserveBibTeXVariables: true });
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
            default: ref.add({ name: 'publisher', value: item.publisher });
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
    exporter_ts_1.Exporter.complete();
    Zotero.write('\n');
};
Translator.detectImport = () => {
    const input = Zotero.read(102400); // tslint:disable-line:no-magic-numbers
    const bib = importReferences(input);
    const found = Object.keys(bib.references).length > 0;
    return found;
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
    constructor(id, bibtex, groups, validFields) {
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
        this.id = id;
        this.bibtex = bibtex;
        this.groups = groups;
        this.bibtex.bib_type = this.bibtex.bib_type.toLowerCase();
        this.type = this.typeMap[this.bibtex.bib_type] || 'journalArticle';
        this.validFields = validFields[this.type];
        if (!this.validFields)
            this.error(`import error: unexpected item ${bibtex.entry_key} of type ${this.type}`);
        this.item = new Zotero.Item(this.type);
        this.item.itemID = this.id;
        this.biblatexdata = {};
        this.import();
        if (Translator.preferences.testing) {
            const err = Object.keys(this.item).filter(name => !this.validFields[name]).join(', ');
            if (err)
                this.error(`import error: unexpected fields on ${this.type} ${bibtex.entry_key}: ${err}`);
        }
        this.item.complete();
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
        for (const name of value) {
            const creator = { creatorType: field };
            if (name.literal) {
                creator.lastName = this.unparse(name.literal);
                creator.fieldMode = 1;
            }
            else {
                creator.firstName = this.unparse(name.given);
                creator.lastName = this.unparse(name.family);
                if (name.prefix)
                    creator.lastName = `${this.unparse(name.prefix)} ${creator.lastName}`;
                if (name.suffix)
                    creator.lastName = `${creator.lastName}, ${this.unparse(name.suffix)}`;
                // creator = Zotero.Utilities.cleanAuthor(creator, field, false)
                if (creator.lastName && !creator.firstName)
                    creator.fieldMode = 1;
            }
            this.item.creators.push(creator);
        }
        return true;
    }
    $editor(value, field) { return this.$author(value, field); }
    $translator(value, field) { return this.$author(value, field); }
    $publisher(value, field) {
        field = field === 'institution' && this.validFields.institution ? 'institution' : 'publisher'; // Juris-M supports institution as a base field
        if (!this.validFields[field])
            return false;
        if (!this.item[field])
            this.item[field] = '';
        if (this.item[field])
            this.item[field] += ' / ';
        this.item[field] += value.map(this.unparse).join(' and ').replace(/[ \t\r\n]+/g, ' ');
        return true;
    }
    $institution(value, field) { return this.$publisher(value, field); }
    $school(value, field) { return this.$publisher(value, field); }
    $address(value) { return this.set('place', this.unparse(value)); }
    $location(value) { return this.$address(value); }
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
            if (!this.validFields[field])
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
        let m, mimeType, path, title;
        value = this.unparse(value);
        // :Better BibTeX.001/Users/heatherwright/Documents/Scientific Papers/AVX3W9~F.PDF:PDF
        if (m = value.match(/^([^:]*):([^:]+):([^:]*)$/)) {
            title = m[1];
            path = m[2];
            mimeType = m[3]; // tslint:disable-line:no-magic-numbers
        }
        else {
            path = value;
        }
        mimeType = (mimeType || '').toLowerCase();
        if (!mimeType && path.toLowerCase().endsWith('.pdf'))
            mimeType = 'application/pdf';
        if (mimeType.toLowerCase() === 'pdf')
            mimeType = 'application/pdf';
        if (!mimeType)
            mimeType = undefined;
        this.item.attachments.push({ title, path, mimeType });
        return true;
    }
    '$date-modified'(value) { return this.item.dateAdded = this.unparse(value); }
    '$date-added'(value) { return this.item.dateAdded = this.unparse(value); }
    '$added-at'(value) { return this.item.dateAdded = this.unparse(value); }
    $timestamp(value) { return this.item.dateAdded = this.unparse(value); }
    $number(value) {
        value = this.unparse(value);
        for (const field of ['seriesNumber', 'number', 'issue']) {
            if (!this.validFields[field])
                continue;
            this.set(field, value);
            return true;
        }
        return false;
    }
    $issue(value) { return this.$number(value); }
    $issn(value) {
        if (!this.validFields.ISSN)
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
    $type(value) {
        for (const field of ['sessionType', 'websiteType', 'manuscriptType', 'genre', 'postType', 'sessionType', 'letterType', 'manuscriptType', 'mapType', 'presentationType', 'regulationType', 'reportType', 'thesisType', 'websiteType']) {
            if (this.validFields[field]) {
                this.set(field, this.unparse(value));
                return true;
            }
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
    _$eprinttype(value) {
        if (!value)
            return null;
        const eprinttype = this.unparse(value);
        switch (eprinttype.trim().toLowerCase()) {
            case 'arxiv': return 'arXiv';
            case 'jstor': return 'JSTOR';
            case 'pubmed': return 'PMID';
            case 'hdl': return 'HDL';
            case 'googlebooks': return 'GoogleBooksID';
            default: return null;
        }
    }
    $eprint(value) {
        /* Support for IDs exported by BibLaTeX */
        const eprinttype = this._$eprinttype(this.fields.eprinttype || this.fields.archiveprefix);
        if (!eprinttype)
            return false;
        const eprint = this.unparse(value);
        this.hackyFields.push(`${eprinttype}: ${eprint}`);
        return true;
    }
    $eprinttype(value) { return this.fields.eprint && this._$eprinttype(value); }
    $archiveprefix(value) { return this.$eprinttype(value); }
    $nationality(value) { return this.set('country', this.unparse(value)); }
    $chapter(value) { return this.set('section', this.unparse(value)); }
    error(err) {
        debug_ts_1.debug(err);
        throw new Error(err);
    }
    unparse(text, condense = true) {
        debug_ts_1.debug('unparsing', text);
        if (Array.isArray(text) && Array.isArray(text[0]))
            return text.map(t => this.unparse(t)).join(' and ');
        if (['string', 'number'].includes(typeof text))
            return text;
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
    import() {
        this.hackyFields = [];
        this.fields = Object.assign({}, (this.bibtex.fields || {}), (this.bibtex.unexpected_fields || {}), (this.bibtex.unknown_fields || {}));
        for (const subtitle of ['titleaddon', 'subtitle']) {
            if (!this.fields.title && this.fields[subtitle]) {
                this.fields.title = this.fields[subtitle];
                delete this.fields[subtitle];
            }
        }
        debug_ts_1.debug('importing bibtex:', this.bibtex, this.fields);
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
        if (this.bibtex.entry_key)
            this.addToExtra(`bibtex: ${this.bibtex.entry_key}`); // Endnote has no citation keys in their bibtex
        const keys = Object.keys(this.biblatexdata);
        if (keys.length > 0) {
            let biblatexdata;
            if (Translator.preferences.testing)
                keys.sort();
            if (this.biblatexdatajson && Translator.preferences.testing) {
                biblatexdata = `bibtex{${keys.map(k => JSON5.stringify({ [k]: this.biblatexdata[k] }).slice(1, -1))}}`;
            }
            else if (this.biblatexdatajson) {
                biblatexdata = `bibtex${JSON5.stringify(this.biblatexdata)}`;
            }
            else {
                biblatexdata = `bibtex[${keys.map(key => `${key}=${this.biblatexdata[key]}`).join(';')}]`;
            }
            this.addToExtra(biblatexdata);
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
        this.biblatexdata[key] = this.unparse(value);
        if (key.match(/[\[\]=;\r\n]/) || value.match(/[\[\]=;\r\n]/))
            this.biblatexdatajson = true;
    }
    set(field, value) {
        debug_ts_1.debug('import.set:', this.type, field, this.validFields[field]);
        if (!this.validFields[field])
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
    reference_ts_1.Reference.installPostscript();
    Translator.unicode = !Translator.preferences.asciiBibTeX;
};
Translator.doImport = () => {
    let read;
    let input = '';
    while ((read = Zotero.read(0x100000)) !== false) { // tslint:disable-line:no-magic-numbers
        input += read;
    }
    if (Translator.preferences.strings)
        input = `${Translator.preferences.strings}\n${input}`;
    const bib = importReferences(input);
    const ignore = new Set(['alias_creates_duplicate_field', 'unexpected_field', 'unknown_date', 'unknown_field']); // ignore these -- biblatex-csl-converter considers these errors, I don't
    const errors = bib.errors.concat(bib.warnings).filter(err => !ignore.has(err.type));
    if (errors.length) {
        const item = new Zotero.Item('note');
        item.note = 'Import errors found: <ul>';
        for (const err of errors) {
            switch (err.type) {
                case 'cut_off_citation':
                    item.note += `<li>line ${err.line}: ${html_escape_ts_1.htmlEscape(`incomplete reference @${err.entry}`)}</li>`;
                    break;
                case 'token_mismatch':
                    item.note += `<li>line ${err.line}: found ${html_escape_ts_1.htmlEscape(JSON.stringify(err.found))}, expected ${html_escape_ts_1.htmlEscape(JSON.stringify(err.expected))}</li>`;
                    break;
                case 'undefined_variable':
                    item.note += `<li>line ${err.line}: undefined variable '${html_escape_ts_1.htmlEscape(err.variable)}'</li>`;
                    break;
                default:
                    if (Translator.preferences.testing)
                        throw new Error('unhandled import error: ' + JSON.stringify(err));
                    item.note += `<li>line ${err.line}: found ${html_escape_ts_1.htmlEscape(err.type)}`;
                    break;
            }
        }
        item.tags = ['#Better BibTeX import error'];
        item.note += '</ul>';
        item.complete();
    }
    if (Translator.preferences.csquotes) {
        ZoteroItem.prototype.tags.enquote = { open: Translator.preferences.csquotes[0], close: Translator.preferences.csquotes[1] };
    }
    const validFields = Zotero.BetterBibTeX.validFields();
    const itemIDS = {};
    for (const [id, ref] of Object.entries(bib.references)) { // TODO: add typings to the npm package
        if (ref.entry_key)
            itemIDS[ref.entry_key] = id; // Endnote has no citation keys
        new ZoteroItem(id, ref, bib.groups, validFields); // tslint:disable-line:no-unused-expression
    }
    for (const group of bib.groups || []) {
        importGroup(group, itemIDS, true);
    }
};
; Zotero.debug('BBT: loaded translators/Better BibTeX.ts'); } catch ($wrap_loader_catcher_translators_Better_BibTeX_ts) { Zotero.debug('Error: BBT: load of translators/Better BibTeX.ts failed:' + $wrap_loader_catcher_translators_Better_BibTeX_ts + '::' + $wrap_loader_catcher_translators_Better_BibTeX_ts.stack) };

/***/ })
/******/ ]);
