var SciHub = SciHub = SciHub ||
{

    loading: false,
    toggleWidth: '210px',
    
    framecheck: function()
    {
	if (parent !== self
            || (window.opener && !window.locationbar.visible))
	{
	    SciHub.delById('refresh');
	    SciHub.delById('panel');
	}
	else
	{
            SciHub.getById('open').onclick = SciHub.submit;
	    SciHub.getById('url').onkeypress = SciHub.enter;
	    SciHub.getById('logo').onclick = SciHub.toggle;
	}
    },

    enter: function(i,e)
    {
        var keycode;
        if (window.event)
            keycode = window.event.keyCode;
        else
            if (e)
                keycode = e.which;
            else
                return true;
        if (keycode == 13)
        {
            SciHub.submit();
            return false;
        }
        else
            return true;
    },

    getById: function(id)
    {
    	return document.getElementById(SciHub.suffix+id);
    },

    delById: function(id)
    {
	var x = SciHub.getById(id);
	if (x != 'undefined')
	{
	    x.style.display = 'none';
	    x.parentNode.removeChild(x);
	}
    },

    toggle: function()
    {
	var nav = SciHub.getById('panel');
	var newWidth = nav.style.width;
	nav.style.width = SciHub.toggleWidth;
	SciHub.toggleWidth = newWidth;
    },

    wait: function()
    {
    	SciHub.loading = true;
	SciHub.getById('wait').style.display = 'inline';
	SciHub.getById('tip').style.display = 'none';
    },

    retry: function(url)
    {
	SciHub.go(SciHub.rectify(url));
    },

    submit: function()
    {
	var url = SciHub.getById('url').value;

	url = url.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
	url = decodeURI(url);

	if (url.substr(0,7) != 'http://')
	    if (url.substr(0,3)=='10.')
	        url = 'http://' + SciHub.domain + '/doi/' + url;
	    else
                url = 'http:' + '//' + SciHub.domain + '/request/'+url;
        else
            url = SciHub.rectify(url);

	SciHub.go(url);
    },
    
    go: function(url)
    {
	if (!SciHub.loading)
        {
	    SciHub.wait();
	    window.location.href = url;
	}
    },
    
    rectify: function(url)
    {
        return 'https://' + SciHub.domain + '/' + url;
        
        
        var secure = '';
        if (url.substr(0,7) == 'http://')
            url = url.substr(7);
        if (url.substr(0,8) == 'https://')
        {
            url = url.substr(8);
            secure = '.secure';
        }
        var urlp = url.split('/');
        url = 'http://' + urlp.shift() + secure + '.' + SciHub.domain;
        urlp.unshift(url);
        url = urlp.join('/');
        return url;
    }
    
};

