/*ADOBE SYSTEMS INCORPORATED
Copyright 2012 Adobe Systems Incorporated
All Rights Reserved.

NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
terms of the Adobe license agreement accompanying it.  If you have received this file from a
source other than Adobe, then your use, modification, or distribution of it requires the prior
written permission of Adobe.*/
ColdFusion.RichText||(ColdFusion.RichText={});
ColdFusion.RichText.editorState={};
ColdFusion.RichText.buffer=null;
ColdFusion.RichText.registerAfterSet=function(_3b7){
if(ColdFusion.RichText.editorState[_3b7]){
var _3b8=function(){
ColdFusion.RichText.fireChangeEvent(_3b7);
};
var _3b9=CKEDITOR.instances[_3b7];
_3b9.on("OnAfterSetHTML",_3b8);
}else{
setTimeout("ColdFusion.RichText.registerAfterSet('"+_3b7+"')",1000);
}
};
ColdFusion.RichText.getEditorObject=function(_3ba){
if(!_3ba){
ColdFusion.handleError(null,"richtext.geteditorobject.missingtextareaname","widget",null,null,null,true);
return;
}
var _3bb=ColdFusion.objectCache[_3ba];
if(_3bb==null||CKEDITOR.editor.prototype.isPrototypeOf(_3bb)==false){
ColdFusion.handleError(null,"richtext.geteditorobject.notfound","widget",[_3ba],null,null,true);
return;
}
return CKEDITOR.instances[_3bb.richtextid];
};
ColdFusion.RichText.setValue=function(_3bc,_3bd){
if(ColdFusion.RichText.editorState[_3bc]){
var _3be=CKEDITOR.instances[_3bc];
_3be.setData(_3bd);
_3be.fire("onAfterSetHTML");
}else{
setTimeout("ColdFusion.RichText.setValue(\""+_3bc+"\",\""+_3bd+"\")",1000);
}
};
ColdFusion.RichText.getValue=function(_3bf){
if(ColdFusion.RichText.editorState[_3bf]){
return CKEDITOR.instances[_3bf].getData();
}else{
ColdFusion.Log.error("richtext.initialize.getvalue.notready","widget",[_3bf]);
return null;
}
};
ColdFusion.RichText.fireChangeEvent=function(_3c0){
var _3c1=ColdFusion.objectCache[_3c0];
ColdFusion.Log.info("richtext.firechangeevent.firechange","widget",[_3c1._cf_name]);
var _3c2=document.getElementById(_3c0);
if(_3c2){
if(_3c2.fireEvent){
_3c2.fireEvent("onchange");
}
if(document.createEvent){
var evt=document.createEvent("HTMLEvents");
if(evt.initEvent){
evt.initEvent("change",true,true);
}
if(_3c2.dispatchEvent){
_3c2.dispatchEvent(evt);
}
}
}
ColdFusion.Event.callBindHandlers(_3c0,null,"change");
};
ColdFusion.RichText.editor_onfocus=function(e){
document.getElementById(e.editor.id+"_top").style.display="block";
};
ColdFusion.RichText.editor_onblur=function(e){
document.getElementById(e.editor.id+"_top").style.display="none";
};
ColdFusion.RichText.setChangeBuffer=function(e){
ColdFusion.RichText.buffer=CKEDITOR.instances[e.editor.name].getData();
};
ColdFusion.RichText.resetChangeBuffer=function(e){
if(ColdFusion.RichText.buffer!=CKEDITOR.instances[e.editor.name].getData()){
ColdFusion.RichText.fireChangeEvent(e.editor.name);
}
ColdFusion.RichText.buffer=null;
};
var parameters={};
CKEDITOR.on("instanceCreated",function(e){
var _3c9=e.editor.name;
if(parameters[_3c9].Id){
ColdFusion.RichText.editorState[parameters[_3c9].Id]=false;
e.editor.richtextid=parameters[_3c9].Id;
ColdFusion.objectCache[parameters[_3c9].Id]=e.editor;
}
if(parameters[_3c9].Name){
e.editor._cf_name=parameters[_3c9].Name;
ColdFusion.objectCache[parameters[_3c9].Name]=e.editor;
}
if(parameters[_3c9].Val){
e.editor.Value=parameters[_3c9].Val;
}
e.editor._cf_setValue=function(_3ca){
ColdFusion.RichText.setValue(_3c9,_3ca);
};
e.editor._cf_getAttribute=function(){
return ColdFusion.RichText.getValue(_3c9);
};
e.editor._cf_register=function(_3cb,_3cc,_3cd){
var _3ce=document.getElementById(_3c9);
if(_3ce){
ColdFusion.Event.addListener(_3ce,_3cb,_3cc,_3cd);
}
};
});
ColdFusion.RichText.initialize=function(Id,Name,Val,_3d2,_3d3,_3d4,_3d5,_3d6,_3d7,Skin,_3d9,_3da,_3db,_3dc,_3dd){
parameters[Id]={};
parameters[Id].Id=Id;
parameters[Id].Name=Name;
parameters[Id].Val=Val;
var _3de=function(evt){
if(_3d9==true){
evt.editor.on("focus",ColdFusion.RichText.editor_onfocus);
evt.editor.on("blur",ColdFusion.RichText.editor_onblur);
document.getElementById(evt.editor.id+"_top").style.display="none";
}
evt.editor.on("focus",ColdFusion.RichText.setChangeBuffer);
evt.editor.on("blur",ColdFusion.RichText.resetChangeBuffer);
ColdFusion.RichText.editorState[evt.editor.name]=true;
if(ColdFusion.RichText.OnComplete){
ColdFusion.RichText.OnComplete(evt.editor);
}
};
var _3e0={on:{"instanceReady":_3de}};
_3e0["toolbar"]="Default";
if(_3d4!=null){
_3e0["height"]=_3d4;
}
if(_3d3!=null){
_3e0["width"]=_3d3;
}
if(_3d5!=null){
_3e0["font_names"]=_3d5;
}
if(_3d6!=null){
_3e0["fontSize_sizes"]=_3d6;
}
if(_3d7!=null){
_3e0["format_tags"]=_3d7;
}
if(Skin!=null){
_3e0["skin"]=Skin;
}
if(_3d9==true){
_3e0["toolbarCanCollapse"]=false;
}
if(_3da!=null){
_3e0["toolbar"]=_3da;
}
var _3e1=CKEDITOR.replace(Id,_3e0);
};
