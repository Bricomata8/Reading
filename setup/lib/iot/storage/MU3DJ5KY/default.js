function addEvent(obj, evType, fn){
 if (obj.addEventListener){
   obj.addEventListener(evType, fn, false);
   return true;
 } else if (obj.attachEvent){
   var r = obj.attachEvent("on"+evType, fn);
   return r;
 } else {
   return false;
 }
}
//addEvent(window, 'load', alert('loaded'));
//addEvent(window, 'load', bar);
//addEvent(window, 'load', setValuesToFixDisableProblem);


function setValuesToFixDisableProblem(){

}
function focusOnPrevious(id){
    var elem = document.getElementById(id);
    var inputs = $(':input');
    var index = inputs.index(elem);

    while(index > 0){
        index--;
        var candidateElem = inputs.get(index);
//        console.log(candidateElem);
        if($(candidateElem).is(":visible") == true){
            candidateElem.focus();
            index = 0;
        }
    }
}

function SelectAll(id)
{
    document.getElementById(id).focus();
    document.getElementById(id).select();
}
