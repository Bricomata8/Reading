/*ADOBE SYSTEMS INCORPORATED
Copyright 2012 Adobe Systems Incorporated
All Rights Reserved.

NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
terms of the Adobe license agreement accompanying it.  If you have received this file from a
source other than Adobe, then your use, modification, or distribution of it requires the prior
written permission of Adobe.*/
function cfinit(){
if(!window.ColdFusion){
ColdFusion={};
var $C=ColdFusion;
if(!$C.Ajax){
$C.Ajax={};
}
var $A=$C.Ajax;
if(!$C.AjaxProxy){
$C.AjaxProxy={};
}
var $X=$C.AjaxProxy;
if(!$C.Bind){
$C.Bind={};
}
var $B=$C.Bind;
if(!$C.Event){
$C.Event={};
}
var $E=$C.Event;
if(!$C.Log){
$C.Log={};
}
var $L=$C.Log;
if(!$C.Util){
$C.Util={};
}
var $U=$C.Util;
if(!$C.DOM){
$C.DOM={};
}
var $D=$C.DOM;
if(!$C.Spry){
$C.Spry={};
}
var $S=$C.Spry;
if(!$C.Pod){
$C.Pod={};
}
var $P=$C.Pod;
if(!$C.objectCache){
$C.objectCache={};
}
if(!$C.required){
$C.required={};
}
if(!$C.importedTags){
$C.importedTags=[];
}
if(!$C.requestCounter){
$C.requestCounter=0;
}
if(!$C.bindHandlerCache){
$C.bindHandlerCache={};
}
window._cf_loadingtexthtml="<div style=\"text-align: center;\">"+window._cf_loadingtexthtml+"&nbsp;"+CFMessage["loading"]+"</div>";
$C.globalErrorHandler=function(_206,_207){
if($L.isAvailable){
$L.error(_206,_207);
}
if($C.userGlobalErrorHandler){
$C.userGlobalErrorHandler(_206);
}
if(!$L.isAvailable&&!$C.userGlobalErrorHandler){
alert(_206+CFMessage["globalErrorHandler.alert"]);
}
};
$C.handleError=function(_208,_209,_20a,_20b,_20c,_20d,_20e,_20f){
var msg=$L.format(_209,_20b);
if(_208){
$L.error(msg,"http");
if(!_20c){
_20c=-1;
}
if(!_20d){
_20d=msg;
}
_208(_20c,_20d,_20f);
}else{
if(_20e){
$L.error(msg,"http");
throw msg;
}else{
$C.globalErrorHandler(msg,_20a);
}
}
};
$C.setGlobalErrorHandler=function(_211){
$C.userGlobalErrorHandler=_211;
};
$A.createXMLHttpRequest=function(){
try{
return new XMLHttpRequest();
}
catch(e){
}
var _212=["Microsoft.XMLHTTP","MSXML2.XMLHTTP.5.0","MSXML2.XMLHTTP.4.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP"];
for(var i=0;i<_212.length;i++){
try{
return new ActiveXObject(_212[i]);
}
catch(e){
}
}
return false;
};
$A.isRequestError=function(req){
return ((req.status!=0&&req.status!=200)||req.getResponseHeader("server-error"));
};
$A.sendMessage=function(url,_216,_217,_218,_219,_21a,_21b){
var req=$A.createXMLHttpRequest();
if(!_216){
_216="GET";
}
if(_218&&_219){
req.onreadystatechange=function(){
$A.callback(req,_219,_21a);
};
}
if(_217){
_217+="&_cf_nodebug=true&_cf_nocache=true";
}else{
_217="_cf_nodebug=true&_cf_nocache=true";
}
if(window._cf_clientid){
_217+="&_cf_clientid="+_cf_clientid;
}
if(_216=="GET"){
if(_217){
_217+="&_cf_rc="+($C.requestCounter++);
if(url.indexOf("?")==-1){
url+="?"+_217;
}else{
url+="&"+_217;
}
}
$L.info("ajax.sendmessage.get","http",[url]);
req.open(_216,url,_218);
req.send(null);
}else{
$L.info("ajax.sendmessage.post","http",[url,_217]);
req.open(_216,url,_218);
req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
if(_217){
req.send(_217);
}else{
req.send(null);
}
}
if(!_218){
while(req.readyState!=4){
}
if($A.isRequestError(req)){
$C.handleError(null,"ajax.sendmessage.error","http",[req.status,req.statusText],req.status,req.statusText,_21b);
}else{
return req;
}
}
};
$A.callback=function(req,_21e,_21f){
if(req.readyState!=4){
return;
}
req.onreadystatechange=new Function;
_21e(req,_21f);
};
$A.submitForm=function(_220,url,_222,_223,_224,_225){
var _226=$C.getFormQueryString(_220);
if(_226==-1){
$C.handleError(_223,"ajax.submitform.formnotfound","http",[_220],-1,null,true);
return;
}
if(!_224){
_224="POST";
}
_225=!(_225===false);
var _227=function(req){
$A.submitForm.callback(req,_220,_222,_223);
};
$L.info("ajax.submitform.submitting","http",[_220]);
var _229=$A.sendMessage(url,_224,_226,_225,_227);
if(!_225){
$L.info("ajax.submitform.success","http",[_220]);
return _229.responseText;
}
};
$A.submitForm.callback=function(req,_22b,_22c,_22d){
if($A.isRequestError(req)){
$C.handleError(_22d,"ajax.submitform.error","http",[req.status,_22b,req.statusText],req.status,req.statusText);
}else{
$L.info("ajax.submitform.success","http",[_22b]);
if(_22c){
_22c(req.responseText);
}
}
};
$C.empty=function(){
};
$C.setSubmitClicked=function(_22e,_22f){
var el=$D.getElement(_22f,_22e);
el.cfinputbutton=true;
$C.setClickedProperty=function(){
el.clicked=true;
};
$E.addListener(el,"click",$C.setClickedProperty);
};
$C.getFormQueryString=function(_231,_232){
var _233;
if(typeof _231=="string"){
_233=(document.getElementById(_231)||document.forms[_231]);
}else{
if(typeof _231=="object"){
_233=_231;
}
}
if(!_233||null==_233.elements){
return -1;
}
var _234,elementName,elementValue,elementDisabled;
var _235=false;
var _236=(_232)?{}:"";
for(var i=0;i<_233.elements.length;i++){
_234=_233.elements[i];
elementDisabled=_234.disabled;
elementName=_234.name;
elementValue=_234.value;
if(!elementDisabled&&elementName){
switch(_234.type){
case "select-one":
case "select-multiple":
for(var j=0;j<_234.options.length;j++){
if(_234.options[j].selected){
if(window.ActiveXObject){
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,_234.options[j].attributes["value"].specified?_234.options[j].value:_234.options[j].text);
}else{
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,_234.options[j].hasAttribute("value")?_234.options[j].value:_234.options[j].text);
}
}
}
break;
case "radio":
case "checkbox":
if(_234.checked){
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
}
break;
case "file":
case undefined:
case "reset":
break;
case "button":
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
break;
case "submit":
if(_234.cfinputbutton){
if(_235==false&&_234.clicked){
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
_235=true;
}
}else{
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
}
break;
case "textarea":
var _239;
if(window.FCKeditorAPI&&(_239=$C.objectCache[elementName])&&_239.richtextid){
var _23a=FCKeditorAPI.GetInstance(_239.richtextid);
if(_23a){
elementValue=_23a.GetXHTML();
}
}
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
break;
default:
_236=$C.getFormQueryString.processFormData(_236,_232,elementName,elementValue);
break;
}
}
}
if(!_232){
_236=_236.substr(0,_236.length-1);
}
return _236;
};
$C.getFormQueryString.processFormData=function(_23b,_23c,_23d,_23e){
if(_23c){
if(_23b[_23d]){
_23b[_23d]+=","+_23e;
}else{
_23b[_23d]=_23e;
}
}else{
_23b+=encodeURIComponent(_23d)+"="+encodeURIComponent(_23e)+"&";
}
return _23b;
};
$A.importTag=function(_23f){
$C.importedTags.push(_23f);
};
$A.checkImportedTag=function(_240){
var _241=false;
for(var i=0;i<$C.importedTags.length;i++){
if($C.importedTags[i]==_240){
_241=true;
break;
}
}
if(!_241){
$C.handleError(null,"ajax.checkimportedtag.error","widget",[_240]);
}
};
$C.getElementValue=function(_243,_244,_245){
if(!_243){
$C.handleError(null,"getelementvalue.noelementname","bind",null,null,null,true);
return;
}
if(!_245){
_245="value";
}
var _246=$B.getBindElementValue(_243,_244,_245);
if(typeof (_246)=="undefined"){
_246=null;
}
if(_246==null){
$C.handleError(null,"getelementvalue.elnotfound","bind",[_243,_245],null,null,true);
return;
}
return _246;
};
$B.getBindElementValue=function(_247,_248,_249,_24a,_24b){
var _24c="";
if(window[_247]){
var _24d=eval(_247);
if(_24d&&_24d._cf_getAttribute){
_24c=_24d._cf_getAttribute(_249);
return _24c;
}
}
var _24e=$C.objectCache[_247];
if(_24e&&_24e._cf_getAttribute){
_24c=_24e._cf_getAttribute(_249);
return _24c;
}
var el=$D.getElement(_247,_248);
var _250=(el&&((!el.length&&el.length!=0)||(el.length&&el.length>0)||el.tagName=="SELECT"));
if(!_250&&!_24b){
$C.handleError(null,"bind.getbindelementvalue.elnotfound","bind",[_247]);
return null;
}
if(el.tagName!="SELECT"){
if(el.length>1){
var _251=true;
for(var i=0;i<el.length;i++){
var _253=(el[i].getAttribute("type")=="radio"||el[i].getAttribute("type")=="checkbox");
if(!_253||(_253&&el[i].checked)){
if(!_251){
_24c+=",";
}
_24c+=$B.getBindElementValue.extract(el[i],_249);
_251=false;
}
}
}else{
_24c=$B.getBindElementValue.extract(el,_249);
}
}else{
var _251=true;
for(var i=0;i<el.options.length;i++){
if(el.options[i].selected){
if(!_251){
_24c+=",";
}
_24c+=$B.getBindElementValue.extract(el.options[i],_249);
_251=false;
}
}
}
if(typeof (_24c)=="object"){
$C.handleError(null,"bind.getbindelementvalue.simplevalrequired","bind",[_247,_249]);
return null;
}
if(_24a&&$C.required[_247]&&_24c.length==0){
return null;
}
return _24c;
};
$B.getBindElementValue.extract=function(el,_255){
var _256=el[_255];
if((_256==null||typeof (_256)=="undefined")&&el.getAttribute){
_256=el.getAttribute(_255);
}
return _256;
};
$L.init=function(){
if(window.YAHOO&&YAHOO.widget&&YAHOO.widget.Logger){
YAHOO.widget.Logger.categories=[CFMessage["debug"],CFMessage["info"],CFMessage["error"],CFMessage["window"]];
YAHOO.widget.LogReader.prototype.formatMsg=function(_257){
var _258=_257.category;
return "<p>"+"<span class='"+_258+"'>"+_258+"</span>:<i>"+_257.source+"</i>: "+_257.msg+"</p>";
};
var _259=new YAHOO.widget.LogReader(null,{width:"30em",fontSize:"100%"});
_259.setTitle(CFMessage["log.title"]||"ColdFusion AJAX Logger");
_259._btnCollapse.value=CFMessage["log.collapse"]||"Collapse";
_259._btnPause.value=CFMessage["log.pause"]||"Pause";
_259._btnClear.value=CFMessage["log.clear"]||"Clear";
$L.isAvailable=true;
}
};
$L.log=function(_25a,_25b,_25c,_25d){
if(!$L.isAvailable){
return;
}
if(!_25c){
_25c="global";
}
_25c=CFMessage[_25c]||_25c;
_25b=CFMessage[_25b]||_25b;
_25a=$L.format(_25a,_25d);
YAHOO.log(_25a,_25b,_25c);
};
$L.format=function(code,_25f){
var msg=CFMessage[code]||code;
if(_25f){
for(i=0;i<_25f.length;i++){
if(!_25f[i].length){
_25f[i]="";
}
var _261="{"+i+"}";
msg=msg.replace(_261,_25f[i]);
}
}
return msg;
};
$L.debug=function(_262,_263,_264){
$L.log(_262,"debug",_263,_264);
};
$L.info=function(_265,_266,_267){
$L.log(_265,"info",_266,_267);
};
$L.error=function(_268,_269,_26a){
$L.log(_268,"error",_269,_26a);
};
$L.dump=function(_26b,_26c){
if($L.isAvailable){
var dump=(/string|number|undefined|boolean/.test(typeof (_26b))||_26b==null)?_26b:recurse(_26b,typeof _26b,true);
$L.debug(dump,_26c);
}
};
$X.invoke=function(_26e,_26f,_270,_271,_272){
return $X.invokeInternal(_26e,_26f,_270,_271,_272,false,null,null);
};
$X.invokeInternal=function(_273,_274,_275,_276,_277,_278,_279,_27a){
var _27b="method="+_274+"&_cf_ajaxproxytoken="+_275;
if(_278){
_27b+="&_cfclient="+"true";
var _27c=$X.JSON.encodeInternal(_273._variables,_278);
_27b+="&_variables="+encodeURIComponent(_27c);
var _27d=$X.JSON.encodeInternal(_273._metadata,_278);
_27b+="&_metadata="+encodeURIComponent(_27d);
}
var _27e=_273.returnFormat||"json";
_27b+="&returnFormat="+_27e;
if(_273.queryFormat){
_27b+="&queryFormat="+_273.queryFormat;
}
if(_273.formId){
var _27f=$C.getFormQueryString(_273.formId,true);
if(_276!=null){
for(prop in _27f){
_276[prop]=_27f[prop];
}
}else{
_276=_27f;
}
_273.formId=null;
}
var _280="";
if(_276!=null){
_280=$X.JSON.encodeInternal(_276,_278);
_27b+="&argumentCollection="+encodeURIComponent(_280);
}
$L.info("ajaxproxy.invoke.invoking","http",[_273.cfcPath,_274,_280]);
if(_273.callHandler){
_273.callHandler.call(null,_273.callHandlerParams,_273.cfcPath,_27b);
return;
}
var _281;
var _282=_273.async;
if(_279!=null){
_282=true;
_281=function(req){
$X.callbackOp(req,_273,_277,_279,_27a);
};
}else{
if(_273.async){
_281=function(req){
$X.callback(req,_273,_277);
};
}
}
var req=$A.sendMessage(_273.cfcPath,_273.httpMethod,_27b,_282,_281,null,true);
if(!_282){
return $X.processResponse(req,_273);
}
};
$X.callback=function(req,_287,_288){
if($A.isRequestError(req)){
$C.handleError(_287.errorHandler,"ajaxproxy.invoke.error","http",[req.status,_287.cfcPath,req.statusText],req.status,req.statusText,false,_288);
}else{
if(_287.callbackHandler){
var _289=$X.processResponse(req,_287);
_287.callbackHandler(_289,_288);
}
}
};
$X.callbackOp=function(req,_28b,_28c,_28d,_28e){
if($A.isRequestError(req)){
var _28f=_28b.errorHandler;
if(_28e!=null){
_28f=_28e;
}
$C.handleError(_28f,"ajaxproxy.invoke.error","http",[req.status,_28b.cfcPath,req.statusText],req.status,req.statusText,false,_28c);
}else{
if(_28d){
var _290=$X.processResponse(req,_28b);
_28d(_290,_28c);
}
}
};
$X.processResponse=function(req,_292){
var _293=true;
for(var i=0;i<req.responseText.length;i++){
var c=req.responseText.charAt(i);
_293=(c==" "||c=="\n"||c=="\t"||c=="\r");
if(!_293){
break;
}
}
var _296=(req.responseXML&&req.responseXML.childNodes.length>0);
var _297=_296?"[XML Document]":req.responseText;
$L.info("ajaxproxy.invoke.response","http",[_297]);
var _298;
var _299=_292.returnFormat||"json";
if(_299=="json"){
try{
_298=_293?null:$X.JSON.decode(req.responseText);
}
catch(e){
if(typeof _292._metadata!=="undefined"&&_292._metadata.servercfc&&typeof req.responseText==="string"){
_298=req.responseText;
}else{
throw e;
}
}
}else{
_298=_296?req.responseXML:(_293?null:req.responseText);
}
return _298;
};
$X.init=function(_29a,_29b,_29c){
if(typeof _29c==="undefined"){
_29c=false;
}
var _29d=_29b;
if(!_29c){
var _29e=_29b.split(".");
var ns=self;
for(i=0;i<_29e.length-1;i++){
if(_29e[i].length){
ns[_29e[i]]=ns[_29e[i]]||{};
ns=ns[_29e[i]];
}
}
var _2a0=_29e[_29e.length-1];
if(ns[_2a0]){
return ns[_2a0];
}
ns[_2a0]=function(){
this.httpMethod="GET";
this.async=false;
this.callbackHandler=null;
this.errorHandler=null;
this.formId=null;
};
_29d=ns[_2a0].prototype;
}else{
_29d.httpMethod="GET";
_29d.async=false;
_29d.callbackHandler=null;
_29d.errorHandler=null;
_29d.formId=null;
}
_29d.cfcPath=_29a;
_29d.setHTTPMethod=function(_2a1){
if(_2a1){
_2a1=_2a1.toUpperCase();
}
if(_2a1!="GET"&&_2a1!="POST"){
$C.handleError(null,"ajaxproxy.sethttpmethod.invalidmethod","http",[_2a1],null,null,true);
}
this.httpMethod=_2a1;
};
_29d.setSyncMode=function(){
this.async=false;
};
_29d.setAsyncMode=function(){
this.async=true;
};
_29d.setCallbackHandler=function(fn){
this.callbackHandler=fn;
this.setAsyncMode();
};
_29d.setErrorHandler=function(fn){
this.errorHandler=fn;
this.setAsyncMode();
};
_29d.setForm=function(fn){
this.formId=fn;
};
_29d.setQueryFormat=function(_2a5){
if(_2a5){
_2a5=_2a5.toLowerCase();
}
if(!_2a5||(_2a5!="column"&&_2a5!="row"&&_2a5!="struct")){
$C.handleError(null,"ajaxproxy.setqueryformat.invalidformat","http",[_2a5],null,null,true);
}
this.queryFormat=_2a5;
};
_29d.setReturnFormat=function(_2a6){
if(_2a6){
_2a6=_2a6.toLowerCase();
}
if(!_2a6||(_2a6!="plain"&&_2a6!="json"&&_2a6!="wddx")){
$C.handleError(null,"ajaxproxy.setreturnformat.invalidformat","http",[_2a6],null,null,true);
}
this.returnFormat=_2a6;
};
$L.info("ajaxproxy.init.created","http",[_29a]);
if(_29c){
return _29d;
}else{
return ns[_2a0];
}
};
$U.isWhitespace=function(s){
var _2a8=true;
for(var i=0;i<s.length;i++){
var c=s.charAt(i);
_2a8=(c==" "||c=="\n"||c=="\t"||c=="\r");
if(!_2a8){
break;
}
}
return _2a8;
};
$U.getFirstNonWhitespaceIndex=function(s){
var _2ac=true;
for(var i=0;i<s.length;i++){
var c=s.charAt(i);
_2ac=(c==" "||c=="\n"||c=="\t"||c=="\r");
if(!_2ac){
break;
}
}
return i;
};
$C.trim=function(_2af){
return _2af.replace(/^\s+|\s+$/g,"");
};
$U.isInteger=function(n){
var _2b1=true;
if(typeof (n)=="number"){
_2b1=(n>=0);
}else{
for(i=0;i<n.length;i++){
if($U.isInteger.numberChars.indexOf(n.charAt(i))==-1){
_2b1=false;
break;
}
}
}
return _2b1;
};
$U.isInteger.numberChars="0123456789";
$U.isArray=function(a){
return (typeof (a.length)=="number"&&!a.toUpperCase);
};
$U.isBoolean=function(b){
if(b===true||b===false){
return true;
}else{
if(b.toLowerCase){
b=b.toLowerCase();
return (b==$U.isBoolean.trueChars||b==$U.isBoolean.falseChars);
}else{
return false;
}
}
};
$U.isBoolean.trueChars="true";
$U.isBoolean.falseChars="false";
$U.castBoolean=function(b){
if(b===true){
return true;
}else{
if(b===false){
return false;
}else{
if(b.toLowerCase){
b=b.toLowerCase();
if(b==$U.isBoolean.trueChars){
return true;
}else{
if(b==$U.isBoolean.falseChars){
return false;
}else{
return false;
}
}
}else{
return false;
}
}
}
};
$U.checkQuery=function(o){
var _2b6=null;
if(o&&o.COLUMNS&&$U.isArray(o.COLUMNS)&&o.DATA&&$U.isArray(o.DATA)&&(o.DATA.length==0||(o.DATA.length>0&&$U.isArray(o.DATA[0])))){
_2b6="row";
}else{
if(o&&o.COLUMNS&&$U.isArray(o.COLUMNS)&&o.ROWCOUNT&&$U.isInteger(o.ROWCOUNT)&&o.DATA){
_2b6="col";
for(var i=0;i<o.COLUMNS.length;i++){
var _2b8=o.DATA[o.COLUMNS[i]];
if(!_2b8||!$U.isArray(_2b8)){
_2b6=null;
break;
}
}
}
}
return _2b6;
};
$X.JSON=new function(){
var _2b9={}.hasOwnProperty?true:false;
var _2ba=/^("(\\.|[^"\\\n\r])*?"|[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t])+?$/;
var pad=function(n){
return n<10?"0"+n:n;
};
var m={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r","\"":"\\\"","\\":"\\\\"};
var _2be=function(s){
if(/["\\\x00-\x1f]/.test(s)){
return "\""+s.replace(/([\x00-\x1f\\"])/g,function(a,b){
var c=m[b];
if(c){
return c;
}
c=b.charCodeAt();
return "\\u00"+Math.floor(c/16).toString(16)+(c%16).toString(16);
})+"\"";
}
return "\""+s+"\"";
};
var _2c3=function(o){
var a=["["],b,i,l=o.length,v;
for(i=0;i<l;i+=1){
v=o[i];
switch(typeof v){
case "undefined":
case "function":
case "unknown":
break;
default:
if(b){
a.push(",");
}
a.push(v===null?"null":$X.JSON.encode(v));
b=true;
}
}
a.push("]");
return a.join("");
};
var _2c6=function(o){
return "\""+o.getFullYear()+"-"+pad(o.getMonth()+1)+"-"+pad(o.getDate())+"T"+pad(o.getHours())+":"+pad(o.getMinutes())+":"+pad(o.getSeconds())+"\"";
};
this.encode=function(o){
return this.encodeInternal(o,false);
};
this.encodeInternal=function(o,cfc){
if(typeof o=="undefined"||o===null){
return "null";
}else{
if(o instanceof Array){
return _2c3(o);
}else{
if(o instanceof Date){
if(cfc){
return this.encodeInternal({_date_:o.getTime()},cfc);
}
return _2c6(o);
}else{
if(typeof o=="string"){
return _2be(o);
}else{
if(typeof o=="number"){
return isFinite(o)?String(o):"null";
}else{
if(typeof o=="boolean"){
return String(o);
}else{
if(cfc&&typeof o=="object"&&typeof o._metadata!=="undefined"){
return "{\"_metadata\":"+this.encodeInternal(o._metadata,false)+",\"_variables\":"+this.encodeInternal(o._variables,cfc)+"}";
}else{
var a=["{"],b,i,v;
for(var i in o){
if(!_2b9||o.hasOwnProperty(i)){
v=o[i];
switch(typeof v){
case "undefined":
case "function":
case "unknown":
break;
default:
if(b){
a.push(",");
}
a.push(this.encodeInternal(i,cfc),":",v===null?"null":this.encodeInternal(v,cfc));
b=true;
}
}
}
a.push("}");
return a.join("");
}
}
}
}
}
}
}
};
this.decode=function(json){
if(typeof json=="object"){
return json;
}
if($U.isWhitespace(json)){
return null;
}
var _2ce=$U.getFirstNonWhitespaceIndex(json);
if(_2ce>0){
json=json.slice(_2ce);
}
if(window._cf_jsonprefix&&json.indexOf(_cf_jsonprefix)==0){
json=json.slice(_cf_jsonprefix.length);
}
try{
if(_2ba.test(json)){
return eval("("+json+")");
}
}
catch(e){
}
throw new SyntaxError("parseJSON");
};
}();
if(!$C.JSON){
$C.JSON={};
}
$C.JSON.encode=$X.JSON.encode;
$C.JSON.encodeInternal=$X.JSON.encodeInternal;
$C.JSON.decode=$X.JSON.decode;
$C.navigate=function(url,_2d0,_2d1,_2d2,_2d3,_2d4){
if(url==null){
$C.handleError(_2d2,"navigate.urlrequired","widget");
return;
}
if(_2d3){
_2d3=_2d3.toUpperCase();
if(_2d3!="GET"&&_2d3!="POST"){
$C.handleError(null,"navigate.invalidhttpmethod","http",[_2d3],null,null,true);
}
}else{
_2d3="GET";
}
var _2d5;
if(_2d4){
_2d5=$C.getFormQueryString(_2d4);
if(_2d5==-1){
$C.handleError(null,"navigate.formnotfound","http",[_2d4],null,null,true);
}
}
if(_2d0==null){
if(_2d5){
if(url.indexOf("?")==-1){
url+="?"+_2d5;
}else{
url+="&"+_2d5;
}
}
$L.info("navigate.towindow","widget",[url]);
window.location.replace(url);
return;
}
$L.info("navigate.tocontainer","widget",[url,_2d0]);
var obj=$C.objectCache[_2d0];
if(obj!=null){
if(typeof (obj._cf_body)!="undefined"&&obj._cf_body!=null){
_2d0=obj._cf_body;
}
}
$A.replaceHTML(_2d0,url,_2d3,_2d5,_2d1,_2d2);
};
$A.checkForm=function(_2d7,_2d8,_2d9,_2da,_2db){
var _2dc=_2d8.call(null,_2d7);
if(_2dc==false){
return false;
}
var _2dd=$C.getFormQueryString(_2d7);
$L.info("ajax.submitform.submitting","http",[_2d7.name]);
$A.replaceHTML(_2d9,_2d7.action,_2d7.method,_2dd,_2da,_2db);
return false;
};
$A.replaceHTML=function(_2de,url,_2e0,_2e1,_2e2,_2e3){
var _2e4=document.getElementById(_2de);
if(!_2e4){
$C.handleError(_2e3,"ajax.replacehtml.elnotfound","http",[_2de]);
return;
}
var _2e5="_cf_containerId="+encodeURIComponent(_2de);
_2e1=(_2e1)?_2e1+"&"+_2e5:_2e5;
$L.info("ajax.replacehtml.replacing","http",[_2de,url,_2e1]);
if(_cf_loadingtexthtml){
try{
_2e4.innerHTML=_cf_loadingtexthtml;
}
catch(e){
}
}
var _2e6=function(req,_2e8){
var _2e9=false;
if($A.isRequestError(req)){
$C.handleError(_2e3,"ajax.replacehtml.error","http",[req.status,_2e8.id,req.statusText],req.status,req.statusText);
_2e9=true;
}
var _2ea=new $E.CustomEvent("onReplaceHTML",_2e8);
var _2eb=new $E.CustomEvent("onReplaceHTMLUser",_2e8);
$E.loadEvents[_2e8.id]={system:_2ea,user:_2eb};
if(req.responseText.search(/<script/i)!=-1){
try{
_2e8.innerHTML="";
}
catch(e){
}
$A.replaceHTML.processResponseText(req.responseText,_2e8,_2e3);
}else{
try{
_2e8.innerHTML=req.responseText;
$A.updateLayouttab(_2e8);
}
catch(e){
}
}
$E.loadEvents[_2e8.id]=null;
_2ea.fire();
_2ea.unsubscribe();
_2eb.fire();
_2eb.unsubscribe();
$L.info("ajax.replacehtml.success","http",[_2e8.id]);
if(_2e2&&!_2e9){
_2e2();
}
};
try{
$A.sendMessage(url,_2e0,_2e1,true,_2e6,_2e4);
}
catch(e){
try{
_2e4.innerHTML=$L.format(CFMessage["ajax.replacehtml.connectionerrordisplay"],[url,e]);
}
catch(e){
}
$C.handleError(_2e3,"ajax.replacehtml.connectionerror","http",[_2de,url,e]);
}
};
$A.replaceHTML.processResponseText=function(text,_2ed,_2ee){
var pos=0;
var _2f0=0;
var _2f1=0;
_2ed._cf_innerHTML="";
while(pos<text.length){
var _2f2=text.indexOf("<s",pos);
if(_2f2==-1){
_2f2=text.indexOf("<S",pos);
}
if(_2f2==-1){
break;
}
pos=_2f2;
var _2f3=true;
var _2f4=$A.replaceHTML.processResponseText.scriptTagChars;
for(var i=1;i<_2f4.length;i++){
var _2f6=pos+i+1;
if(_2f6>text.length){
break;
}
var _2f7=text.charAt(_2f6);
if(_2f4[i][0]!=_2f7&&_2f4[i][1]!=_2f7){
pos+=i+1;
_2f3=false;
break;
}
}
if(!_2f3){
continue;
}
var _2f8=text.substring(_2f0,pos);
if(_2f8){
_2ed._cf_innerHTML+=_2f8;
}
var _2f9=text.indexOf(">",pos)+1;
if(_2f9==0){
pos++;
continue;
}else{
pos+=7;
}
var _2fa=_2f9;
while(_2fa<text.length&&_2fa!=-1){
_2fa=text.indexOf("</s",_2fa);
if(_2fa==-1){
_2fa=text.indexOf("</S",_2fa);
}
if(_2fa!=-1){
_2f3=true;
for(var i=1;i<_2f4.length;i++){
var _2f6=_2fa+2+i;
if(_2f6>text.length){
break;
}
var _2f7=text.charAt(_2f6);
if(_2f4[i][0]!=_2f7&&_2f4[i][1]!=_2f7){
_2fa=_2f6;
_2f3=false;
break;
}
}
if(_2f3){
break;
}
}
}
if(_2fa!=-1){
var _2fb=text.substring(_2f9,_2fa);
var _2fc=_2fb.indexOf("<!--");
if(_2fc!=-1){
_2fb=_2fb.substring(_2fc+4);
}
var _2fd=_2fb.lastIndexOf("//-->");
if(_2fd!=-1){
_2fb=_2fb.substring(0,_2fd-1);
}
if(_2fb.indexOf("document.write")!=-1||_2fb.indexOf("CF_RunContent")!=-1){
if(_2fb.indexOf("CF_RunContent")!=-1){
_2fb=_2fb.replace("CF_RunContent","document.write");
}
_2fb="var _cfDomNode = document.getElementById('"+_2ed.id+"'); var _cfBuffer='';"+"if (!document._cf_write)"+"{document._cf_write = document.write;"+"document.write = function(str){if (_cfBuffer!=null){_cfBuffer+=str;}else{document._cf_write(str);}};};"+_2fb+";_cfDomNode._cf_innerHTML += _cfBuffer; _cfBuffer=null;";
}
try{
eval(_2fb);
}
catch(ex){
$C.handleError(_2ee,"ajax.replacehtml.jserror","http",[_2ed.id,ex]);
}
}
_2f2=text.indexOf(">",_2fa)+1;
if(_2f2==0){
_2f1=_2fa+1;
break;
}
_2f1=_2f2;
pos=_2f2;
_2f0=_2f2;
}
if(_2f1<text.length-1){
var _2f8=text.substring(_2f1,text.length);
if(_2f8){
_2ed._cf_innerHTML+=_2f8;
}
}
try{
_2ed.innerHTML=_2ed._cf_innerHTML;
$A.updateLayouttab(_2ed);
}
catch(e){
}
_2ed._cf_innerHTML="";
};
$A.updateLayouttab=function(_2fe){
var _2ff=_2fe.id;
if(_2ff.length>13&&_2ff.indexOf("cf_layoutarea")==0){
var s=_2ff.substr(13,_2ff.length);
var cmp=Ext.getCmp(s);
var _302=_2fe.innerHTML;
if(cmp){
cmp.update("<div id="+_2fe.id+">"+_2fe.innerHTML+"</div>");
}
var _303=document.getElementById(_2ff);
if(_303){
_303.innerHTML=_302;
}
}
};
$A.replaceHTML.processResponseText.scriptTagChars=[["s","S"],["c","C"],["r","R"],["i","I"],["p","P"],["t","T"]];
$D.getElement=function(_304,_305){
var _306=function(_307){
return (_307.name==_304||_307.id==_304);
};
var _308=$D.getElementsBy(_306,null,_305);
if(_308.length==1){
return _308[0];
}else{
return _308;
}
};
$D.getElementsBy=function(_309,tag,root){
tag=tag||"*";
var _30c=[];
if(root){
root=$D.get(root);
if(!root){
return _30c;
}
}else{
root=document;
}
var _30d=root.getElementsByTagName(tag);
if(!_30d.length&&(tag=="*"&&root.all)){
_30d=root.all;
}
for(var i=0,len=_30d.length;i<len;++i){
if(_309(_30d[i])){
_30c[_30c.length]=_30d[i];
}
}
return _30c;
};
$D.get=function(el){
if(!el){
return null;
}
if(typeof el!="string"&&!(el instanceof Array)){
return el;
}
if(typeof el=="string"){
return document.getElementById(el);
}else{
var _310=[];
for(var i=0,len=el.length;i<len;++i){
_310[_310.length]=$D.get(el[i]);
}
return _310;
}
return null;
};
$E.loadEvents={};
$E.CustomEvent=function(_312,_313){
return {name:_312,domNode:_313,subs:[],subscribe:function(func,_315){
var dup=false;
for(var i=0;i<this.subs.length;i++){
var sub=this.subs[i];
if(sub.f==func&&sub.p==_315){
dup=true;
break;
}
}
if(!dup){
this.subs.push({f:func,p:_315});
}
},fire:function(){
for(var i=0;i<this.subs.length;i++){
var sub=this.subs[i];
sub.f.call(null,this,sub.p);
}
},unsubscribe:function(){
this.subscribers=[];
}};
};
$E.windowLoadImpEvent=new $E.CustomEvent("cfWindowLoadImp");
$E.windowLoadEvent=new $E.CustomEvent("cfWindowLoad");
$E.windowLoadUserEvent=new $E.CustomEvent("cfWindowLoadUser");
$E.listeners=[];
$E.addListener=function(el,ev,fn,_31e){
var l={el:el,ev:ev,fn:fn,params:_31e};
$E.listeners.push(l);
var _320=function(e){
if(!e){
var e=window.event;
}
fn.call(null,e,_31e);
};
if(el.addEventListener){
el.addEventListener(ev,_320,false);
return true;
}else{
if(el.attachEvent){
el.attachEvent("on"+ev,_320);
return true;
}else{
return false;
}
}
};
$E.isListener=function(el,ev,fn,_325){
var _326=false;
var ls=$E.listeners;
for(var i=0;i<ls.length;i++){
if(ls[i].el==el&&ls[i].ev==ev&&ls[i].fn==fn&&ls[i].params==_325){
_326=true;
break;
}
}
return _326;
};
$E.callBindHandlers=function(id,_32a,ev){
var el=document.getElementById(id);
if(!el){
return;
}
var ls=$E.listeners;
for(var i=0;i<ls.length;i++){
if(ls[i].el==el&&ls[i].ev==ev&&ls[i].fn._cf_bindhandler){
ls[i].fn.call(null,null,ls[i].params);
}
}
};
$E.registerOnLoad=function(func,_330,_331,user){
if($E.registerOnLoad.windowLoaded){
if(_330&&_330._cf_containerId&&$E.loadEvents[_330._cf_containerId]){
if(user){
$E.loadEvents[_330._cf_containerId].user.subscribe(func,_330);
}else{
$E.loadEvents[_330._cf_containerId].system.subscribe(func,_330);
}
}else{
func.call(null,null,_330);
}
}else{
if(user){
$E.windowLoadUserEvent.subscribe(func,_330);
}else{
if(_331){
$E.windowLoadImpEvent.subscribe(func,_330);
}else{
$E.windowLoadEvent.subscribe(func,_330);
}
}
}
};
$E.registerOnLoad.windowLoaded=false;
$E.onWindowLoad=function(fn){
if(window.addEventListener){
window.addEventListener("load",fn,false);
}else{
if(window.attachEvent){
window.attachEvent("onload",fn);
}else{
if(document.getElementById){
window.onload=fn;
}
}
}
};
$C.addSpanToDom=function(){
var _334=document.createElement("span");
document.body.insertBefore(_334,document.body.firstChild);
};
$E.windowLoadHandler=function(e){
if(window.Ext){
Ext.BLANK_IMAGE_URL=_cf_ajaxscriptsrc+"/resources/ext/images/default/s.gif";
}
$C.addSpanToDom();
$L.init();
$E.registerOnLoad.windowLoaded=true;
$E.windowLoadImpEvent.fire();
$E.windowLoadImpEvent.unsubscribe();
$E.windowLoadEvent.fire();
$E.windowLoadEvent.unsubscribe();
if(window.Ext){
Ext.onReady(function(){
$E.windowLoadUserEvent.fire();
});
}else{
$E.windowLoadUserEvent.fire();
}
$E.windowLoadUserEvent.unsubscribe();
};
$E.onWindowLoad($E.windowLoadHandler);
$B.register=function(_336,_337,_338,_339){
for(var i=0;i<_336.length;i++){
var _33b=_336[i][0];
var _33c=_336[i][1];
var _33d=_336[i][2];
if(window[_33b]){
var _33e=eval(_33b);
if(_33e&&_33e._cf_register){
_33e._cf_register(_33d,_338,_337);
continue;
}
}
var _33f=$C.objectCache[_33b];
if(_33f&&_33f._cf_register){
_33f._cf_register(_33d,_338,_337);
continue;
}
var _340=$D.getElement(_33b,_33c);
var _341=(_340&&((!_340.length&&_340.length!=0)||(_340.length&&_340.length>0)||_340.tagName=="SELECT"));
if(!_341){
$C.handleError(null,"bind.register.elnotfound","bind",[_33b]);
}
if(_340.length>1&&!_340.options){
for(var j=0;j<_340.length;j++){
$B.register.addListener(_340[j],_33d,_338,_337);
}
}else{
$B.register.addListener(_340,_33d,_338,_337);
}
}
if(!$C.bindHandlerCache[_337.bindTo]&&typeof (_337.bindTo)=="string"){
$C.bindHandlerCache[_337.bindTo]=function(){
_338.call(null,null,_337);
};
}
if(_339){
_338.call(null,null,_337);
}
};
$B.register.addListener=function(_343,_344,_345,_346){
if(!$E.isListener(_343,_344,_345,_346)){
$E.addListener(_343,_344,_345,_346);
}
};
$B.assignValue=function(_347,_348,_349,_34a){
if(!_347){
return;
}
if(_347.call){
_347.call(null,_349,_34a);
return;
}
var _34b=$C.objectCache[_347];
if(_34b&&_34b._cf_setValue){
_34b._cf_setValue(_349);
return;
}
var _34c=document.getElementById(_347);
if(!_34c){
$C.handleError(null,"bind.assignvalue.elnotfound","bind",[_347]);
}
if(_34c.tagName=="SELECT"){
var _34d=$U.checkQuery(_349);
var _34e=$C.objectCache[_347];
if(_34d){
if(!_34e||(_34e&&(!_34e.valueCol||!_34e.displayCol))){
$C.handleError(null,"bind.assignvalue.selboxmissingvaldisplay","bind",[_347]);
return;
}
}else{
if(typeof (_349.length)=="number"&&!_349.toUpperCase){
if(_349.length>0&&(typeof (_349[0].length)!="number"||_349[0].toUpperCase)){
$C.handleError(null,"bind.assignvalue.selboxerror","bind",[_347]);
return;
}
}else{
$C.handleError(null,"bind.assignvalue.selboxerror","bind",[_347]);
return;
}
}
_34c.options.length=0;
var _34f;
var _350=false;
if(_34e){
_34f=_34e.selected;
if(_34f&&_34f.length>0){
_350=true;
}
}
if(!_34d){
for(var i=0;i<_349.length;i++){
var opt=new Option(_349[i][1],_349[i][0]);
_34c.options[i]=opt;
if(_350){
for(var j=0;j<_34f.length;j++){
if(_34f[j]==opt.value){
opt.selected=true;
}
}
}
}
}else{
if(_34d=="col"){
var _354=_349.DATA[_34e.valueCol];
var _355=_349.DATA[_34e.displayCol];
if(!_354||!_355){
$C.handleError(null,"bind.assignvalue.selboxinvalidvaldisplay","bind",[_347]);
return;
}
for(var i=0;i<_354.length;i++){
var opt=new Option(_355[i],_354[i]);
_34c.options[i]=opt;
if(_350){
for(var j=0;j<_34f.length;j++){
if(_34f[j]==opt.value){
opt.selected=true;
}
}
}
}
}else{
if(_34d=="row"){
var _356=-1;
var _357=-1;
for(var i=0;i<_349.COLUMNS.length;i++){
var col=_349.COLUMNS[i];
if(col==_34e.valueCol){
_356=i;
}
if(col==_34e.displayCol){
_357=i;
}
if(_356!=-1&&_357!=-1){
break;
}
}
if(_356==-1||_357==-1){
$C.handleError(null,"bind.assignvalue.selboxinvalidvaldisplay","bind",[_347]);
return;
}
for(var i=0;i<_349.DATA.length;i++){
var opt=new Option(_349.DATA[i][_357],_349.DATA[i][_356]);
_34c.options[i]=opt;
if(_350){
for(var j=0;j<_34f.length;j++){
if(_34f[j]==opt.value){
opt.selected=true;
}
}
}
}
}
}
}
}else{
_34c[_348]=_349;
}
$E.callBindHandlers(_347,null,"change");
$L.info("bind.assignvalue.success","bind",[_349,_347,_348]);
};
$B.localBindHandler=function(e,_35a){
var _35b=document.getElementById(_35a.bindTo);
var _35c=$B.evaluateBindTemplate(_35a,true);
$B.assignValue(_35a.bindTo,_35a.bindToAttr,_35c);
};
$B.localBindHandler._cf_bindhandler=true;
$B.evaluateBindTemplate=function(_35d,_35e,_35f,_360,_361){
var _362=_35d.bindExpr;
var _363="";
if(typeof _361=="undefined"){
_361=false;
}
for(var i=0;i<_362.length;i++){
if(typeof (_362[i])=="object"){
var _365=null;
if(!_362[i].length||typeof _362[i][0]=="object"){
_365=$X.JSON.encode(_362[i]);
}else{
var _365=$B.getBindElementValue(_362[i][0],_362[i][1],_362[i][2],_35e,_360);
if(_365==null){
if(_35e){
_363="";
break;
}else{
_365="";
}
}
}
if(_35f){
_365=encodeURIComponent(_365);
}
_363+=_365;
}else{
var _366=_362[i];
if(_361==true&&i>0){
if(typeof (_366)=="string"&&_366.indexOf("&")!=0){
_366=encodeURIComponent(_366);
}
}
_363+=_366;
}
}
return _363;
};
$B.jsBindHandler=function(e,_368){
var _369=_368.bindExpr;
var _36a=new Array();
var _36b=_368.callFunction+"(";
for(var i=0;i<_369.length;i++){
var _36d;
if(typeof (_369[i])=="object"){
if(_369[i].length){
if(typeof _369[i][0]=="object"){
_36d=_369[i];
}else{
_36d=$B.getBindElementValue(_369[i][0],_369[i][1],_369[i][2],false);
}
}else{
_36d=_369[i];
}
}else{
_36d=_369[i];
}
if(i!=0){
_36b+=",";
}
_36a[i]=_36d;
_36b+="'"+_36d+"'";
}
_36b+=")";
var _36e=_368.callFunction.apply(null,_36a);
$B.assignValue(_368.bindTo,_368.bindToAttr,_36e,_368.bindToParams);
};
$B.jsBindHandler._cf_bindhandler=true;
$B.urlBindHandler=function(e,_370){
var _371=_370.bindTo;
if($C.objectCache[_371]&&$C.objectCache[_371]._cf_visible===false){
$C.objectCache[_371]._cf_dirtyview=true;
return;
}
var url=$B.evaluateBindTemplate(_370,false,true,false,true);
var _373=$U.extractReturnFormat(url);
if(_373==null||typeof _373=="undefined"){
_373="JSON";
}
if(_370.bindToAttr||typeof _370.bindTo=="undefined"||typeof _370.bindTo=="function"){
var _370={"bindTo":_370.bindTo,"bindToAttr":_370.bindToAttr,"bindToParams":_370.bindToParams,"errorHandler":_370.errorHandler,"url":url,returnFormat:_373};
try{
$A.sendMessage(url,"GET",null,true,$B.urlBindHandler.callback,_370);
}
catch(e){
$C.handleError(_370.errorHandler,"ajax.urlbindhandler.connectionerror","http",[url,e]);
}
}else{
$A.replaceHTML(_371,url,null,null,_370.callback,_370.errorHandler);
}
};
$B.urlBindHandler._cf_bindhandler=true;
$B.urlBindHandler.callback=function(req,_375){
if($A.isRequestError(req)){
$C.handleError(_375.errorHandler,"bind.urlbindhandler.httperror","http",[req.status,_375.url,req.statusText],req.status,req.statusText);
}else{
$L.info("bind.urlbindhandler.response","http",[req.responseText]);
var _376;
try{
if(_375.returnFormat==null||_375.returnFormat==="JSON"){
_376=$X.JSON.decode(req.responseText);
}else{
_376=req.responseText;
}
}
catch(e){
if(req.responseText!=null&&typeof req.responseText=="string"){
_376=req.responseText;
}else{
$C.handleError(_375.errorHandler,"bind.urlbindhandler.jsonerror","http",[req.responseText]);
}
}
$B.assignValue(_375.bindTo,_375.bindToAttr,_376,_375.bindToParams);
}
};
$A.initSelect=function(_377,_378,_379,_37a){
$C.objectCache[_377]={"valueCol":_378,"displayCol":_379,selected:_37a};
};
$S.setupSpry=function(){
if(typeof (Spry)!="undefined"&&Spry.Data){
Spry.Data.DataSet.prototype._cf_getAttribute=function(_37b){
var val;
var row=this.getCurrentRow();
if(row){
val=row[_37b];
}
return val;
};
Spry.Data.DataSet.prototype._cf_register=function(_37e,_37f,_380){
var obs={bindParams:_380};
obs.onCurrentRowChanged=function(){
_37f.call(null,null,this.bindParams);
};
obs.onDataChanged=function(){
_37f.call(null,null,this.bindParams);
};
this.addObserver(obs);
};
if(Spry.Debug.trace){
var _382=Spry.Debug.trace;
Spry.Debug.trace=function(str){
$L.info(str,"spry");
_382(str);
};
}
if(Spry.Debug.reportError){
var _384=Spry.Debug.reportError;
Spry.Debug.reportError=function(str){
$L.error(str,"spry");
_384(str);
};
}
$L.info("spry.setupcomplete","bind");
}
};
$E.registerOnLoad($S.setupSpry,null,true);
$S.bindHandler=function(_386,_387){
var url;
var _389="_cf_nodebug=true&_cf_nocache=true";
if(window._cf_clientid){
_389+="&_cf_clientid="+_cf_clientid;
}
var _38a=window[_387.bindTo];
var _38b=(typeof (_38a)=="undefined");
if(_387.cfc){
var _38c={};
var _38d=_387.bindExpr;
for(var i=0;i<_38d.length;i++){
var _38f;
if(_38d[i].length==2){
_38f=_38d[i][1];
}else{
_38f=$B.getBindElementValue(_38d[i][1],_38d[i][2],_38d[i][3],false,_38b);
}
_38c[_38d[i][0]]=_38f;
}
_38c=$X.JSON.encode(_38c);
_389+="&method="+_387.cfcFunction;
_389+="&argumentCollection="+encodeURIComponent(_38c);
$L.info("spry.bindhandler.loadingcfc","http",[_387.bindTo,_387.cfc,_387.cfcFunction,_38c]);
url=_387.cfc;
}else{
url=$B.evaluateBindTemplate(_387,false,true,_38b);
$L.info("spry.bindhandler.loadingurl","http",[_387.bindTo,url]);
}
var _390=_387.options||{};
if((_38a&&_38a._cf_type=="json")||_387.dsType=="json"){
_389+="&returnformat=json";
}
if(_38a){
if(_38a.requestInfo.method=="GET"){
_390.method="GET";
if(url.indexOf("?")==-1){
url+="?"+_389;
}else{
url+="&"+_389;
}
}else{
_390.postData=_389;
_390.method="POST";
_38a.setURL("");
}
_38a.setURL(url,_390);
_38a.loadData();
}else{
if(!_390.method||_390.method=="GET"){
if(url.indexOf("?")==-1){
url+="?"+_389;
}else{
url+="&"+_389;
}
}else{
_390.postData=_389;
_390.useCache=false;
}
var ds;
if(_387.dsType=="xml"){
ds=new Spry.Data.XMLDataSet(url,_387.xpath,_390);
}else{
ds=new Spry.Data.JSONDataSet(url,_390);
ds.preparseFunc=$S.preparseData;
}
ds._cf_type=_387.dsType;
var _392={onLoadError:function(req){
$C.handleError(_387.errorHandler,"spry.bindhandler.error","http",[_387.bindTo,req.url,req.requestInfo.postData]);
}};
ds.addObserver(_392);
window[_387.bindTo]=ds;
}
};
$S.bindHandler._cf_bindhandler=true;
$S.preparseData=function(ds,_395){
var _396=$U.getFirstNonWhitespaceIndex(_395);
if(_396>0){
_395=_395.slice(_396);
}
if(window._cf_jsonprefix&&_395.indexOf(_cf_jsonprefix)==0){
_395=_395.slice(_cf_jsonprefix.length);
}
return _395;
};
$P.init=function(_397){
$L.info("pod.init.creating","widget",[_397]);
var _398={};
_398._cf_body=_397+"_body";
$C.objectCache[_397]=_398;
};
$B.cfcBindHandler=function(e,_39a){
var _39b=(_39a.httpMethod)?_39a.httpMethod:"GET";
var _39c={};
var _39d=_39a.bindExpr;
for(var i=0;i<_39d.length;i++){
var _39f;
if(_39d[i].length==2){
_39f=_39d[i][1];
}else{
_39f=$B.getBindElementValue(_39d[i][1],_39d[i][2],_39d[i][3],false);
}
_39c[_39d[i][0]]=_39f;
}
var _3a0=function(_3a1,_3a2){
$B.assignValue(_3a2.bindTo,_3a2.bindToAttr,_3a1,_3a2.bindToParams);
};
var _3a3={"bindTo":_39a.bindTo,"bindToAttr":_39a.bindToAttr,"bindToParams":_39a.bindToParams};
var _3a4={"async":true,"cfcPath":_39a.cfc,"httpMethod":_39b,"callbackHandler":_3a0,"errorHandler":_39a.errorHandler};
if(_39a.proxyCallHandler){
_3a4.callHandler=_39a.proxyCallHandler;
_3a4.callHandlerParams=_39a;
}
$X.invoke(_3a4,_39a.cfcFunction,_39a._cf_ajaxproxytoken,_39c,_3a3);
};
$B.cfcBindHandler._cf_bindhandler=true;
$U.extractReturnFormat=function(url){
var _3a6;
var _3a7=url.toUpperCase();
var _3a8=_3a7.indexOf("RETURNFORMAT");
if(_3a8>0){
var _3a9=_3a7.indexOf("&",_3a8+13);
if(_3a9<0){
_3a9=_3a7.length;
}
_3a6=_3a7.substring(_3a8+13,_3a9);
}
return _3a6;
};
$U.replaceAll=function(_3aa,_3ab,_3ac){
var _3ad=_3aa.indexOf(_3ab);
while(_3ad>-1){
_3aa=_3aa.replace(_3ab,_3ac);
_3ad=_3aa.indexOf(_3ab);
}
return _3aa;
};
$U.cloneObject=function(obj){
var _3af={};
for(key in obj){
var _3b0=obj[key];
if(typeof _3b0=="object"){
_3b0=$U.cloneObject(_3b0);
}
_3af.key=_3b0;
}
return _3af;
};
$C.clone=function(obj,_3b2){
if(typeof (obj)!="object"){
return obj;
}
if(obj==null){
return obj;
}
var _3b3=new Object();
for(var i in obj){
if(_3b2===true){
_3b3[i]=$C.clone(obj[i]);
}else{
_3b3[i]=obj[i];
}
}
return _3b3;
};
$C.printObject=function(obj){
var str="";
for(key in obj){
str=str+"  "+key+"=";
value=obj[key];
if(typeof (value)=="object"){
value=$C.printObject(value);
}
str+=value;
}
return str;
};
}
}
cfinit();
