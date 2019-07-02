/*!
* jQuery Scrollspy Plugin
* Author: @sxalexander
* Licensed under the MIT license
*/;(function($,window,document,undefined){$.fn.extend({scrollspy:function(options){var defaults={min:0,max:0,mode:'vertical',namespace:'scrollspy',buffer:0,container:window,onEnter:options.onEnter?options.onEnter:[],onLeave:options.onLeave?options.onLeave:[],onTick:options.onTick?options.onTick:[]}
var options=$.extend({},defaults,options);return this.each(function(i){var element=this;var o=options;var $container=$(o.container);var mode=o.mode;var buffer=o.buffer;var enters=leaves=0;var inside=false;$container.bind('scroll.'+o.namespace,function(e){var position={top:$(this).scrollTop(),left:$(this).scrollLeft()};var xy=(mode=='vertical')?position.top+buffer:position.left+buffer;var max=o.max;var min=o.min;if($.isFunction(o.max)){max=o.max();}
if($.isFunction(o.min)){min=o.min();}
if(max==0){max=(mode=='vertical')?$container.height():$container.outerWidth()+$(element).outerWidth();}
if(xy>=min&&xy<=max){if(!inside){inside=true;enters++;$(element).trigger('scrollEnter',{position:position})
if($.isFunction(o.onEnter)){o.onEnter(element,position);}}
$(element).trigger('scrollTick',{position:position,inside:inside,enters:enters,leaves:leaves})
if($.isFunction(o.onTick)){o.onTick(element,position,inside,enters,leaves);}}else{if(inside){inside=false;leaves++;$(element).trigger('scrollLeave',{position:position,leaves:leaves})
if($.isFunction(o.onLeave)){o.onLeave(element,position);}}}});});}})})(jQuery,window,document,undefined);