/**
 * Created with IntelliJ IDEA.
 * User: olov
 * Date: 1/23/13
 * Time: 9:46 AM
 * To change this template use File | Settings | File Templates.
 */


/**
 * OverlayMenu is a simple js class to handle an overlay menu
 * @param overlays an array with that should contain the id of all overlay divs
 * @param defalutOverlay the id of the default overlay div
 * @param addHandlers boolean if onmouseover / onmouseout should be added
 * @constructor
 */
function OverlayMenu(overlays, defaultOverlay, addHandlers){
    /**
     * defaultOverlay holds information about which overlay div that is shown for the current page, this is changed
     * by a small script in the head section of pages that have a visible overlay (browse(x3) and search)
     * @type {String}
     */
    this.defaultOverlay = "";
    if(defaultOverlay !== undefined){
        this.defaultOverlay = defaultOverlay;
    }

    /**
     * overlays is an array that contains the id of all overlay divs
     * @type {Array}
     */
    this.overlays = [];
    if(overlays !== undefined){
        this.overlays = overlays;
    }

    /**
     * is a variable to hold the timer that makes it possible to move from the menu div to the overlay div, without it
     * immediately beeing removed
     */
    this.hideOverlayTimer;

    if(addHandlers){
        this.addOverlayHandlers();
    }
}
/**
 * overlayClearTimer clears the overlaytimer
 */
OverlayMenu.prototype.overlayClearTimer = function ()
{
    if (undefined !== this.hideOverlayTimer) {
        window.clearInterval(this.hideOverlayTimer);
    }
};
/**
 * addOverlayHandlers adds the needed onmouseover and onmouseout to the changing divs, not used in diva as the divs
 * gets rerenderd by ajaxcalls, and we would need a callback to attach them again after each redraw. So the callbacks
 * are added directly to the div elements
 */
OverlayMenu.prototype.addOverlayHandlers = function ()
{
    var overlays = this.overlays;
    var obj = this;
    for (var o in overlays) {
        var o2 = overlays[o];
        $('#' + o2).on('mouseover', function ()
        {
            obj.overlayIn(o2)
        });
        $('#' + o2).on('mouseout', function ()
        {
            obj.overlayOut()
        });
    }
};

/**
 * showOverlay shows the overlay div with the entered id, and hides all other overlay divs
 * @param id the id of the overlay div to be shown
 */
OverlayMenu.prototype.showOverlay = function(id)
{
    this.overlayClearTimer();
    var overlays = this.overlays;
    for (var o in overlays) {
        var o2 = overlays[o];
        if (id !== o2) {
            $('#' + o2).hide();
        }
    }
    $('#' + id).show();
};
/**
 * showDefaultOverlay shows the default overlay div and thereby hides all other overlay divs
 */
OverlayMenu.prototype.showDefaultOverlay = function()
{
    this.showOverlay(this.defaultOverlay);
};
/**
 * overlayIn is called when the mouse goes over an overlay div, and clears the timer so that the div is not hidden
 * @param id
 */
OverlayMenu.prototype.overlayIn = function(id)
{
    this.overlayClearTimer();
};
/**
 * overlayOut is called when the mouse goes out from an overlay div, and sets a timer to hide the overlay div (after
 * a timeout of 200ms)
 */
OverlayMenu.prototype.overlayOut = function ()
{
    var obj = this;
    this.overlayClearTimer();
    this.hideOverlayTimer = window.setTimeout(function ()
    {
        obj.showDefaultOverlay();
    }, 200);
};
/**
 * setDefaultOverlay sets the id of the default overlay
 * @param id the id of the default overlay div
 */
OverlayMenu.prototype.setDefaultOverlay = function (id){
    if(id!==undefined){
        this.defaultOverlay = id;
    }
};

var overlayMenu = new OverlayMenu(['overlayMenu', 'searchMenu', 'browseMenu', 'quickMenu'], 'overlayMenu', false);
//this is called on document ready and kicks off the the overlay menu
$(document).ready(function ()
{
    overlayMenu.showDefaultOverlay();
    setFocus();
});

function setFocus(){
    var searchField = document.getElementById('formSmash:searchField');
    if(searchField!=undefined) {
        searchField.focus();
    }
}